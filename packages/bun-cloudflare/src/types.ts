import type { IncomingRequestCfProperties, ExecutionContext } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  [key: string]: unknown;
}

export interface CloudflareContext<E = CloudflareEnv> {
  env: E;
  cf: IncomingRequestCfProperties;
  ctx: ExecutionContext;
}

export interface BunCloudflareConfig {
  workerName?: string;
  compatibilityDate?: string;
  entrypoint?: string;    // default: "./src/index.ts"
  outdir?: string;        // default: "./dist"
  watchDir?: string;      // default: "src" (for dev mode)
  minify?: boolean;
}
