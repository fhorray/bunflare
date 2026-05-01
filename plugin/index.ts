import type { BunPlugin } from "bun";
import { getSqliteShim } from "./shims/sqlite.ts";
import { getKvShim } from "./shims/kv/index.ts";
import { getCryptoShim } from "./shims/crypto.ts";
import { getEnvShim } from "./shims/env.ts";
import { getServeShim } from "./shims/serve.ts";
import { getR2Shim } from "./shims/r2.ts";
import pc from "picocolors";
import type { BunflareConfig, BunflareOptions } from "./types.ts";
import { readFileSync } from "fs";

export type { BunflareConfig, BunflareOptions };

interface ShimModule {
  path: string;
  contents: string;
}

interface GlobalReplacement {
  pattern: RegExp;
  replacement: string;
}

interface ShimRegistry {
  modules: ShimModule[];
  globals: GlobalReplacement[];
  preamble: string;
}

/**
 * Populates the registry with shim contents and global patterns based on user options.
 */
function initializeRegistry(registry: ShimRegistry, options: BunflareOptions): void {
  // 1. SQLite (bun:sqlite) -> Cloudflare D1
  if (options.sqlite) {
    console.log(`  ${pc.gray("↳")} ${pc.cyan("sqlite")} ${pc.gray("shim enabled -> D1:")} ${pc.white(options.sqlite.binding)}`);
    registry.modules.push({
      path: "sqlite",
      contents: getSqliteShim(options.sqlite.binding),
    });
  }

  // 2. KV (bun:kv) -> Cloudflare KV
  if (options.kv || options.redis) {
    const binding = options.kv?.binding || options.redis?.binding || "KV";
    console.log(`  ${pc.gray("↳")} ${pc.green("kv")}     ${pc.gray("shim enabled -> binding:")} ${pc.white(binding)}`);
    if (options.redis) {
      console.log(`    ${pc.gray("⚡")} ${pc.yellow("redis bridge active")}`);
    }
    registry.modules.push({
      path: "kv",
      contents: getKvShim(binding),
    });
  }

  // 3. R2 (Bun.file / Bun.write) -> Cloudflare R2
  if (options.r2) {
    console.log(`  ${pc.gray("↳")} ${pc.blue("r2")}     ${pc.gray("shim enabled -> binding:")} ${pc.white(options.r2.binding)}`);
    registry.modules.push({
      path: "r2",
      contents: getR2Shim(options.r2.binding),
    });
    
    registry.globals.push({
      pattern: /Bun\.file/g,
      replacement: "globalThis.Bun.file",
    });
    registry.globals.push({
      pattern: /Bun\.write/g,
      replacement: "globalThis.Bun.write",
    });
  } else {
    // Default empty R2 shim
    registry.modules.push({
      path: "r2",
      contents: "export const file = () => { throw new Error('R2 not configured'); }; export const write = file;",
    });
  }

  // 4. Env (Bun.env) -> Workers env object
  registry.modules.push({
    path: "env",
    contents: getEnvShim(),
  });
  registry.globals.push({
    pattern: /Bun\.env/g,
    replacement: "globalThis.Bun.env",
  });

  // 5. Crypto & Password (Bun.password / Bun.hash) -> WebCrypto
  registry.modules.push({
    path: "crypto",
    contents: getCryptoShim(),
  });

  // 6. Serve (Bun.serve) -> Cloudflare Export Default Handler
  registry.modules.push({
    path: "serve",
    contents: getServeShim(),
  });

  // 7. KV fallback if not explicitly enabled
  if (!registry.modules.find(m => m.path === "kv")) {
    registry.modules.push({
      path: "kv",
      contents: "export const redis = {}; export class RedisClient {};",
    });
  }

  // 9. Global Bun Object Shim Preamble
  registry.preamble = `
    import { redis as _redis, RedisClient as _RedisClient } from "bunflare:kv";
    import { serve as _serve } from "bunflare:serve";
    import { file as _file, write as _write } from "bunflare:r2";
    import { BunCrypto as _crypto } from "bunflare:crypto";
    import { env as _env } from "bunflare:env";

    if (typeof globalThis.Bun === "undefined") {
      (globalThis as any).Bun = {
        redis: _redis,
        RedisClient: _RedisClient,
        serve: _serve,
        file: _file,
        write: _write,
        password: _crypto.password,
        hash: _crypto.hash,
        env: _env
      };
    }
  `;

  // 8. Frontend Assets (HTML/Static)
  if (options.frontend) {
    console.log(`  ${pc.gray("↳")} ${pc.magenta("assets")} ${pc.gray("configured ->")} ${pc.white(options.frontend.entrypoint)}`);
  }
}

/**
 * The core Bunflare plugin for Bun.build.
 */
export function bunflare(options: BunflareConfig = {}): BunPlugin {
  const registry: ShimRegistry = {
    modules: [],
    globals: [],
    preamble: "",
  };

  initializeRegistry(registry, options);

  return {
    name: "bunflare",
    setup(build) {
      // Resolve virtual modules (bunflare:xxx)
      build.onResolve({ filter: /^bunflare:/ }, (args) => {
        const moduleName = args.path.split(":")[1];
        const shim = registry.modules.find((m) => m.path === moduleName);
        if (shim) {
          return { path: args.path, namespace: "bunflare" };
        }
        return;
      });

      // Load virtual module contents
      build.onLoad({ filter: /.*/, namespace: "bunflare" }, (args) => {
        const moduleName = args.path.split(":")[1];
        const shim = registry.modules.find((m) => m.path === moduleName);
        if (shim) {
          return { contents: shim.contents, loader: "ts" };
        }
        return;
      });

      // Resolve bun:xxx modules
      build.onResolve({ filter: /^bun:/ }, (args) => {
        const moduleName = args.path.split(":")[1];
        const shim = registry.modules.find((m) => m.path === moduleName);
        if (shim) {
          return { path: `bunflare:${moduleName}`, namespace: "bunflare" };
        }
        return;
      });

      // Apply global replacements and preambles to all source files
      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, (args) => {
        if (args.namespace === "bunflare") return;
        
        let contents = readFileSync(args.path, "utf8");
        let modified = false;

        // 1. Inject Preamble if 'Bun' is used (and not already injected)
        if (contents.includes("Bun") && !contents.includes("bunflare:env")) {
          contents = registry.preamble + "\n" + contents;
          modified = true;
        }

        // 2. Apply global replacements (Bun.env, etc)
        for (const glob of registry.globals) {
          // Use a simple string check before doing regex replacement for performance
          const searchStr = glob.pattern.source.replace(/\\/g, "");
          if (contents.includes(searchStr)) {
            contents = contents.replace(glob.pattern, glob.replacement);
            modified = true;
          }
        }
        
        if (modified) {
          return { contents, loader: args.path.endsWith("x") ? "tsx" : "ts" };
        }
        return;
      });
    },
  };
}
