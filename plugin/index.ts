import type { BunPlugin } from "bun";
import { getD1DatabaseShim } from "./shims/d1/database.ts";
import { getSqlTagShim } from "./shims/d1/sql.ts";
import { getKvShim } from "./shims/kv/index.ts";
import { getCryptoShim } from "./shims/crypto.ts";
import { getEnvShim } from "./shims/env.ts";
import { getServeShim } from "./shims/serve.ts";
import { getR2Shim } from "./shims/r2.ts";
import { getHyperdriveSqlShim } from "./shims/hyperdrive/sql.ts";
import pc from "picocolors";
import type { BunflareConfig, BunflareOptions } from "./types.ts";
import { readFileSync } from "fs";
import { join } from "path";

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
      contents: getD1DatabaseShim(options.sqlite.binding),
    });
  }

  // 1.1 SQL (Bun.sql) -> Cloudflare D1/Hyperdrive
  const sqlConfig = options.sql;
  const sqlBinding = sqlConfig?.binding || options.sqlite?.binding;

  if (sqlConfig?.custom) {
    console.log(`  ${pc.gray("↳")} ${pc.blue("sql")}    ${pc.gray("shim enabled ->")} ${pc.yellow("Custom Shim")}${pc.gray(":")} ${pc.white(sqlConfig.custom)}`);
    const customPath = join(process.cwd(), sqlConfig.custom);
    registry.modules.push({
      path: "sql",
      contents: readFileSync(customPath, "utf8"),
    });
  } else if (sqlBinding) {
    const isHyperdrive = sqlConfig?.type === "hyperdrive";
    const driver = sqlConfig?.driver || "postgres";
    const typeLabel = isHyperdrive ? `Hyperdrive (${driver})` : "D1";

    console.log(`  ${pc.gray("↳")} ${pc.blue("sql")}    ${pc.gray("shim enabled ->")} ${pc.cyan(typeLabel)}${pc.gray(":")} ${pc.white(sqlBinding)}`);

    if (isHyperdrive) {
      try {
        Bun.resolveSync(driver, process.cwd());
      } catch (e) {
        console.error(`\n${pc.red("✖ [bunflare error]")} The Hyperdrive SQL shim requires the ${pc.bold(`"${driver}"`)} library, but it is not installed.`);
        console.error(`  ${pc.gray("To fix this, run:")}`);
        console.error(`  ${pc.green(`bun add ${driver}`)}\n`);
        process.exit(1);
      }
    }

    registry.modules.push({
      path: "sql",
      contents: isHyperdrive
        ? getHyperdriveSqlShim(sqlBinding, driver)
        : getSqlTagShim(sqlBinding),
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

  // 7. Fallbacks for preamble if not explicitly enabled
  if (!registry.modules.find(m => m.path === "kv")) {
    registry.modules.push({
      path: "kv",
      contents: "export const redis = {}; export class RedisClient {}; export class KV { constructor() { throw new Error('KV not configured in bunflare.config.ts'); } };",
    });
  }
  if (!registry.modules.find(m => m.path === "sql")) {
    registry.modules.push({
      path: "sql",
      contents: "export const sql = () => { throw new Error('Bun.sql not configured'); }; export const SQL = class {};",
    });
  }
  if (!registry.modules.find(m => m.path === "r2")) {
    registry.modules.push({
      path: "r2",
      contents: "export const file = () => { throw new Error('Bun.file (R2) not configured'); }; export const write = () => { throw new Error('Bun.write (R2) not configured'); };",
    });
  }
  if (!registry.modules.find(m => m.path === "serve")) {
    registry.modules.push({
      path: "serve",
      contents: "export const serve = () => { throw new Error('Bun.serve not configured'); };",
    });
  }
  if (!registry.modules.find(m => m.path === "crypto")) {
    registry.modules.push({
      path: "crypto",
      contents: "export const BunCrypto = { password: {}, hash: {} };",
    });
  }

  // 8. Unified "bun" module hub
  registry.modules.push({
    path: "bun",
    contents: `
      export { sql, SQL } from "bunflare:sql";
      import { BunCrypto } from "bunflare:crypto";
      export const password = BunCrypto.password;
      export const hash = BunCrypto.hash;
      export { file, write } from "bunflare:r2";
    `
  });

  // 9. Global Bun Object Shim Preamble
  registry.preamble = `
    import { redis as _redis, RedisClient as _RedisClient } from "bunflare:kv";
    import { serve as _serve } from "bunflare:serve";
    import { file as _file, write as _write } from "bunflare:r2";
    import { BunCrypto as _crypto } from "bunflare:crypto";
    import { env as _env } from "bunflare:env";
    import { sql as _sql, SQL as _SQL } from "bunflare:sql";

    if (typeof globalThis.Bun === "undefined") {
      (globalThis as any).Bun = {
        redis: _redis,
        RedisClient: _RedisClient,
        serve: _serve,
        file: _file,
        write: _write,
        password: _crypto.password,
        hash: _crypto.hash,
        env: _env,
        sql: _sql,
        SQL: _SQL
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
      // 1. Resolve virtual modules and mark drivers as external
      build.onResolve({ filter: /^(bun|bun:.*|bunflare:.*|postgres|pg|mysql2)$/ }, (args) => {
        // Handle database drivers (external)
        if (/^(postgres|pg|mysql2)$/.test(args.path)) {
          return { path: args.path, external: true };
        }

        // Avoid infinite recursion
        if (args.namespace === "bunflare") return undefined;

        // Redirect 'bun' entrypoint or virtual modules to 'bunflare' namespace
        return { path: args.path, namespace: "bunflare" };
      });

      // 2. Load virtual module contents
      build.onLoad({ filter: /.*/, namespace: "bunflare" }, (args) => {
        // For 'bun' entrypoint, we use the special 'bun' shim
        const moduleName = args.path === "bun" ? "bun" : args.path.replace(/^(bun|bunflare):/, "");
        const shim = registry.modules.find((m) => m.path === moduleName);
        
        if (shim) {
          return { contents: shim.contents, loader: "ts" };
        }
        return undefined;
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
