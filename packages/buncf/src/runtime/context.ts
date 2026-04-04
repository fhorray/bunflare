import type { CloudflareContext } from "../types";

let _context: CloudflareContext | null = null;

/**
 * Sets the Cloudflare context. This is typically called by the generated worker entry point.
 */
export function setCloudflareContext(ctx: CloudflareContext) {
  _context = ctx;
}

/**
 * Retrieves the Cloudflare context (env, cf, ctx).
 * In production, this is populated by the worker entry point.
 * In development (wrangler dev), it is also populated by the entry point.
 */
export function getCloudflareContext<E = CloudflareBindings>(): CloudflareContext<E> {
  if (_context) return _context as unknown as CloudflareContext<E>;

  // Fallback for cases where context hasn't been set yet (e.g. initial load or local tests)
  return {
    env: (typeof process !== "undefined" ? process.env : {}) as unknown as E,
    cf: {} as any,
    ctx: {
      waitUntil: () => {},
      passThroughOnException: () => {}
    } as any
  };
}

/**
 * @deprecated Use getCloudflareContext instead
 */
export const getBuncfContext = getCloudflareContext;
/**
 * @deprecated Use getCloudflareContext instead
 */
export const getBunCloudflareContext = getCloudflareContext;
/**
 * @deprecated Use setCloudflareContext instead
 */
export const setBuncfContext = setCloudflareContext;
