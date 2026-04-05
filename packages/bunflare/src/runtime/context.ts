import type { CloudflareContext } from "../types";

let _context: CloudflareContext | null = null;

/**
 * Sets the Cloudflare context. 
 * This is internally called by the generated worker entry point to inject the 
 * runtime environment into the Bunflare context provider.
 * 
 * @internal
 */
export function setCloudflareContext(ctx: CloudflareContext) {
  _context = ctx;
}

/**
 * Retrieves the Cloudflare worker context, including Environment Variables (Bindings),
 * CF Properties (Geographic/Network info), and Execution Context (waitUntil).
 * 
 * This is the primary way to access D1, KV, R2, and other Cloudflare services
 * from anywhere in your codebase using a unified Bun-native feel.
 * 
 * @template E - The type of your Cloudflare Bindings (defaults to CloudflareBindings).
 * @returns The current CloudflareContext containing env, cf, and ctx.
 * 
 * @example
 * import { getCloudflareContext } from "bunflare";
 * 
 * // Access Cloudflare services (KV, D1, etc.)
 * const { env } = getCloudflareContext();
 * const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(1).first();
 * 
 * // Use waitUntil for background tasks
 * const { ctx } = getCloudflareContext();
 * ctx.waitUntil(logAnalytics());
 */
export function getCloudflareContext<E = CloudflareBindings>(): CloudflareContext<E> {
  if (_context) return _context as unknown as CloudflareContext<E>;

  // Fallback for cases where context hasn't been set yet (e.g. initial load or local tests)
  return {
    env: (typeof process !== "undefined" ? process.env : {}) as unknown as E,
    cf: {} as any,
    ctx: {
      waitUntil: () => { },
      passThroughOnException: () => { }
    } as any
  };
}

/**
 * @deprecated Use getCloudflareContext instead
 */
export const getBunflareContext = getCloudflareContext;
/**
 * @deprecated Use getCloudflareContext instead
 */
export const getBunCloudflareContext = getCloudflareContext;
export const setBunflareContext = setCloudflareContext;
