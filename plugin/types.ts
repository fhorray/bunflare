/**
 * bunflare — shared types
 *
 * All TypeScript types used across the plugin, resolvers, and shims.
 * "any" is intentionally avoided throughout.
 */

export type KnownShimPath = "sqlite" | "redis" | "kv" | "env" | "crypto" | "serve";


// ---------------------------------------------------------------------------
// Cloudflare binding descriptors
// ---------------------------------------------------------------------------

/** Describes a Cloudflare D1 database binding (mapped from bun:sqlite). */
export interface D1BindingConfig {
  /** The binding name as declared in wrangler.toml, e.g. "DB". */
  binding: string;
}

/** Describes a Cloudflare KV namespace binding. */
export interface KVBindingConfig {
  /** The binding name as declared in wrangler.toml, e.g. "MY_KV". */
  binding: string;
}

/** Describes an Upstash Redis configuration (replacement for Bun.redis). */
export interface UpstashRedisConfig {
  provider: "upstash";
  /**
   * The Upstash REST URL. Can be a literal or a `process.env.XXX` reference.
   * If omitted, the shim reads `UPSTASH_REDIS_REST_URL` from the Workers env.
   */
  url?: string;
  /**
   * The Upstash REST token. If omitted, reads `UPSTASH_REDIS_REST_TOKEN`
   * from the Workers env.
   */
  token?: string;
}

/** Describes a Cloudflare R2 bucket binding (replacement for Bun.file / Bun.s3). */
export interface R2BindingConfig {
  /** The binding name as declared in wrangler.toml, e.g. "MY_BUCKET". */
  binding: string;
}

/** Describes Cloudflare Hyperdrive config for PostgreSQL (replacement for Bun.SQL). */
export interface HyperdriveConfig {
  /** The Hyperdrive binding name as declared in wrangler.toml. */
  binding: string;
}

// ---------------------------------------------------------------------------
// Top-level plugin options
// ---------------------------------------------------------------------------

/**
 * Options accepted by the `bunflare()` plugin factory.
 *
 * Each key corresponds to a Bun API family; supply a config object to enable
 * that shim. Omitting a key leaves the import untouched.
 */
export interface BunflareOptions {
  /** Map `bun:sqlite` (Database) → Cloudflare D1. */
  sqlite?: D1BindingConfig;

  /** Map `Bun.redis` / `Bun.RedisClient` → Upstash Redis via HTTP. */
  redis?: UpstashRedisConfig;

  /** Map `Bun.file` / `Bun.write` / `Bun.s3` → Cloudflare R2. */
  r2?: R2BindingConfig;

  /** Map `Bun.SQL` / `Bun.sql` → Cloudflare Hyperdrive + postgres. */
  sql?: HyperdriveConfig;

  /** Map `bun:kv` / `Bun.kv` → Cloudflare KV. */
  kv?: KVBindingConfig;

  /**
   * Map `Bun.env` reads → the Workers `env` object.
   * Enabled by default when set to `true`.
   */
  env?: boolean | { verbose?: boolean };

  /**
   * Static assets and HTML bundling configuration.
   */
  html?: {
    /** The HTML entrypoint file, e.g. "./index.html" */
    entrypoint: string;
    /** The directory where bundled assets will be saved, e.g. "./dist/static" */
    outdir: string;
  };
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
 * Internal registry built from the user's `BunflareOptions`.
 * Populated by `plugin/index.ts` before registering hooks.
 */
export interface ShimRegistry {
  /** Virtual module shims (resolved via onResolve + onLoad in "bunflare" ns). */
  modules: ShimEntry[];
  /** Source-level global replacements (applied via onLoad content transform). */
  globals: GlobalShimEntry[];
}
