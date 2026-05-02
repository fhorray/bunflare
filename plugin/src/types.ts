/**
 * bunflare — shared types
 *
 * All TypeScript types used across the plugin, resolvers, and shims.
 * "any" is intentionally avoided throughout.
 */

export type KnownShimPath = "sqlite" | "redis" | "env" | "crypto" | "serve" | "r2";


// ---------------------------------------------------------------------------
// Cloudflare binding descriptors
// ---------------------------------------------------------------------------

/** Describes a Cloudflare D1 database binding (mapped from bun:sqlite). */
export interface D1BindingConfig {
  /** The binding name as declared in wrangler.toml, e.g. "DB". */
  binding: string;
}


/** Describes a Redis compatibility layer over Cloudflare KV. */
export interface RedisBindingConfig {
  /** 
   * The Cloudflare KV binding name to use for Redis emulation.
   */
  binding?: string;
}

/** Describes a Cloudflare R2 bucket binding (replacement for Bun.file / Bun.s3). */
export interface R2BindingConfig {
  /** The binding name as declared in wrangler.toml, e.g. "MY_BUCKET". */
  binding: string;
}

/** Describes the SQL backend for Bun.SQL (D1 or Hyperdrive). */
export interface SQLConfig {
  /** The backend type. 'd1' for SQLite (Cloudflare D1) or 'hyperdrive' for Postgres/MySQL. */
  type?: "d1" | "hyperdrive";
  /** The binding name as declared in wrangler.toml. */
  binding?: string;
  /** The target driver library to use for the shim. */
  driver?: "postgres" | "pg" | "mysql2";
  /** Path to a custom implementation file for the Bun.sql shim. */
  custom?: string;
}

// ---------------------------------------------------------------------------
// Top-level plugin options
// ---------------------------------------------------------------------------

/**
 * Options accepted by the `bunflare()` plugin factory.
 * 
 * Each key corresponds to a Bun API family. Supply a configuration object to 
 * enable that shim, or omit it to leave the import untouched.
 * 
 * Note: When using the Bunflare CLI, many of these are automatically discovered
 * from your wrangler.jsonc/toml file if not explicitly provided here.
 */
export interface BunflareOptions {
  /** 
   * Map `bun:sqlite` (Database) → Cloudflare D1.
   * @default Automatically discovered from wrangler.jsonc (d1_databases[0])
   */
  sqlite?: D1BindingConfig;

  /** 
   * Map `import { redis } from "bun"` → Cloudflare KV (Emulated).
   */
  redis?: RedisBindingConfig;

  /** 
   * Map `Bun.file` / `Bun.write` / `Bun.s3` → Cloudflare R2.
   * @default Automatically discovered from wrangler.jsonc (r2_buckets[0])
   */
  r2?: R2BindingConfig;

  /** 
   * Map `Bun.SQL` / `Bun.sql` → Cloudflare D1 or Hyperdrive.
   */
  sql?: SQLConfig;


  /**
   * Map `Bun.env` reads → the Cloudflare Workers `env` object.
   * @default true
   */
  env?: boolean | { verbose?: boolean };

  /**
   * Configuration for bundling frontend assets (HTML, CSS, JS).
   */
  frontend?: {
    /** The HTML entrypoint file, e.g. "./public/index.html" */
    entrypoint: string;
    /** The directory where bundled assets will be saved, e.g. "./dist/public" */
    outdir: string;
    /** Additional Bun plugins for the frontend build (e.g. Tailwind) */
    plugins?: any[];
    /** Custom loaders for the frontend build */
    loader?: Record<string, any>;
  };

  /**
   * Additional Bun plugins for the backend build.
   */
  plugins?: any[];
  /**
   * Custom loaders for the backend build.
   */
  loader?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Shim registry
// ---------------------------------------------------------------------------

/**
 * A resolved shim entry: the virtual module path that `onLoad` will serve and
 * the TypeScript source to inject.
 */
export interface ShimEntry {
  /** Virtual path used in the "bunflare" namespace. e.g. "sqlite", "redis". */
  path: KnownShimPath;
  /** Full TypeScript source of the shim module. */
  contents: string;
}

/**
 * A resolved shim for the "globals" transform pass.
 * Instead of a virtual module, this provides a code-level replacement
 * for expressions like `Bun.redis` that exist in source files.
 */
export interface GlobalShimEntry {
  /** Regex that matches the global expression to replace. */
  pattern: RegExp;
  /**
   * Replacement code snippet.
   * Use `$1`, `$2` etc. for capture groups from `pattern`.
   */
  replacement: string;
  /**
   * Optional code to prepend to the file if this pattern is matched.
   * Useful for injecting imports needed by the replacement.
   */
  preamble?: string;
}

/**
 * Top-level configuration for the Bunflare CLI and Plugin.
 */
export interface BunflareConfig extends BunflareOptions {
  /**
   * The main entrypoint for the backend Worker.
   * @default "./index.ts"
   */
  entrypoint?: string;
}

/**
 * Internal registry built from the user's `BunflareOptions`.
 * Populated by `plugin/index.ts` before registering hooks.
 */
export interface ShimRegistry {
  /** Virtual module shims (resolved via onResolve + onLoad in "bunflare" ns). */
  modules: ShimEntry[];
  /** Source-level global replacements (applied via onLoad content transform). */
  globals: GlobalShimEntry[];
}
