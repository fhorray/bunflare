import type { IncomingRequestCfProperties, ExecutionContext } from "@cloudflare/workers-types";
import type { BunPlugin, Loader } from "bun";

export interface CloudflareEnv {
  [key: string]: unknown;
}

export interface CloudflareContext<E = CloudflareEnv> {
  env: E;
  cf: IncomingRequestCfProperties;
  ctx: ExecutionContext;
}

export interface BunCloudflareConfig {
  /** The name of your Cloudflare Worker. */
  workerName?: string;
  /** Cloudflare compatibility date (e.g., '2024-04-03'). */
  compatibilityDate?: string;
  /** Your worker's entry point file path. @default "./src/index.ts" */
  entrypoint?: string;
  /** The directory where the bundled worker will be placed. @default "./dist" */
  outdir?: string;
  /** The directory to watch for changes during development. @default "src" */
  watchDir?: string;
  /**
   * Enables or configures code minification.
   * Can be a boolean or an object for granular control.
   */
  minify?: boolean | {
    /** Minify whitespace. */
    whitespace?: boolean;
    /** Perform dead code elimination and syntax optimizations. */
    syntax?: boolean;
    /** Minify variable and function identifiers. */
    identifiers?: boolean;
  };
  
  /**
   * The intended execution environment target.
   * @default "browser"
   */
  target?: "browser" | "bun" | "node";
  /**
   * The type of sourcemap to generate.
   * @default "linked" (in dev), "none" (in prod)
   */
  sourcemap?: "none" | "linked" | "inline" | "external";
  /**
   * A list of function calls to remove from the bundle (e.g., ["console.log"]).
   * @default ["console", "debugger"] (in prod)
   */
  drop?: string[];
  /** Custom build-time constants for string replacement. */
  define?: Record<string, string>;
  
  /** Modules or packages to exclude from the bundle. */
  external?: string[];
  /** Enable code splitting for projects with multiple entry points. */
  splitting?: boolean;
  /**
   * How to handle environment variables during bundling.
   * Use a prefix (e.g., "PUBLIC_*") for selective inlining.
   */
  env?: "inline" | "disable" | `${string}*`;
  
  /** Whether to generate a metafile for bundle size analysis. @default true */
  metafile?: boolean;
  /** Optimization hints for complex library imports. */
  optimizeImports?: string[];
  
  /** Text to prepend to the generated worker bundle. */
  banner?: string;
  /** Text to append to the generated worker bundle. */
  footer?: string;
  /** Feature flags for the `bun:bundle` API. */
  features?: string[];
  /**
   * Strategy for serving static assets.
   * "binding" uses Cloudflare's standard ASSETS binding.
   * "html-loader" is an experimental Bun-native alternative.
   * @default "binding"
   */
  staticAssets?: "binding" | "html-loader";

  /** Native Bun plugins to run during the build process. */
  plugins?: BunPlugin[];
  /** Custom loaders for specific file extensions. */
  loader?: Record<string, Loader>;
}
