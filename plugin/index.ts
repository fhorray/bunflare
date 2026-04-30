import type { BunPlugin } from "bun";
import type { BunflareOptions, ShimRegistry, ShimEntry, GlobalShimEntry } from "./types.ts";
import { registerBunNamespaceResolver } from "./resolvers/bun-namespace.ts";
import { getSqliteShim } from "./shims/sqlite.ts";
import { getRedisShim } from "./shims/redis.ts";
import { getKvShim } from "./shims/kv.ts";
import { getCryptoShim } from "./shims/crypto.ts";
import { getEnvShim } from "./shims/env.ts";
import { getServeShim } from "./shims/serve.ts";
import { registerGlobalResolver } from "./resolvers/globals.ts";

/**
 * The main bunflare plugin factory.
 * 
 * This plugin transforms Bun-specific APIs into Cloudflare Workers equivalents
 * at build time.
 * 
 * @param options Configuration for which shims to enable and their binding names.
 * @returns A BunPlugin instance.
 */
export function bunflare(options: BunflareOptions = {}): BunPlugin {
  return {
    name: "bunflare",
    setup(build) {
      const registry: ShimRegistry = {
        modules: [],
        globals: [],
      };

      // 1. Initialize shims based on options
      initializeRegistry(registry, options);

      // 2. Register onResolve for bun:* namespace
      registerBunNamespaceResolver(build, registry);

      // 3. Register onLoad for our virtual "bunflare" namespace
      build.onLoad({ filter: /.*/, namespace: "bunflare" }, (args) => {
        const shim = registry.modules.find((m) => m.path === args.path);
        if (!shim) return undefined;

        return {
          contents: shim.contents,
          loader: "ts",
        };
      });

      // 4. Register global transformations (Bun.env, Bun.sql, etc)
      registerGlobalResolver(build, registry);
    },
  };
}

/**
 * Populates the registry with shim contents and global patterns based on user options.
 */
function initializeRegistry(registry: ShimRegistry, options: BunflareOptions): void {
  // SQLite -> D1
  if (options.sqlite) {
    if (!options.sqlite.binding.trim()) {
      throw new Error("[bunflare] options.sqlite.binding cannot be empty");
    }
    registry.modules.push({
      path: "sqlite",
      contents: getSqliteShim(options.sqlite.binding),
    });
  }

  // Bun.env -> Workers env
  if (options.env !== false) {
    registry.modules.push({
      path: "env",
      contents: getEnvShim(),
    });

    registry.globals.push({
      pattern: /Bun\.env/g,
      replacement: "BunEnv",
      preamble: 'import { env as BunEnv } from "bunflare:env";',
    });
  }

  // KV -> Cloudflare KV
  if (options.kv) {
    if (!options.kv.binding.trim()) {
      throw new Error("[bunflare] options.kv.binding cannot be empty");
    }
    registry.modules.push({
      path: "kv",
      contents: getKvShim(options.kv.binding),
    });
  }

  // Crypto / Password
  registry.modules.push({
    path: "crypto",
    contents: getCryptoShim(),
  });

  registry.globals.push({
    pattern: /Bun\.password/g,
    replacement: "BunCrypto.password",
    preamble: 'import { BunCrypto } from "bunflare:crypto";',
  });
  registry.globals.push({
    pattern: /Bun\.hash/g,
    replacement: "BunCrypto.hash",
    preamble: 'import { BunCrypto } from "bunflare:crypto";',
  });
  // Bun.redis -> Upstash
  if (options.redis) {
    registry.modules.push({
      path: "redis",
      contents: getRedisShim(options.redis.url, options.redis.token),
    });

    // Replace globals with imports from our virtual module
    // This is a bit tricky as we'd need to inject an import statement.
    // For now, let's just replace them with a self-contained initialization
    // if url/token are provided, or assume they are in env.
    registry.globals.push({
      pattern: /Bun\.redis/g,
      replacement: "(globalThis as unknown as { redis: unknown }).redis",
    });
    registry.globals.push({
      pattern: /Bun\.RedisClient/g,
      replacement: "RedisClient",
      preamble: 'import { RedisClient } from "bunflare:redis";',
    });
  }

  // Bun.serve -> Cloudflare export default
  registry.modules.push({
    path: "serve",
    contents: getServeShim(),
  });
  registry.globals.push({
    pattern: /Bun\.serve/g,
    replacement: "serve",
    preamble: 'import { serve } from "bunflare:serve";',
  });

  // HTML / Static Assets
  if (options.html) {
    if (!options.html.entrypoint || !options.html.outdir) {
      throw new Error("[bunflare] options.html must specify both entrypoint and outdir");
    }
    // Note: Actual HTML build is typically handled by the user's build script
    // but the plugin can provide validation or auto-config in the future.
    console.log(`[bunflare] HTML assets configured: ${options.html.entrypoint} -> ${options.html.outdir}`);
    console.log(`[bunflare] Tip: Ensure your wrangler.jsonc has "assets": { "directory": "${options.html.outdir}" }`);
  }
}
