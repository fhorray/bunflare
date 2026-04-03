import type { CloudflareContext } from "../types";

let _context: CloudflareContext | null = null;

/**
 * Sets the Cloudflare context. This is typically called by the generated worker entry point.
 */
export function setBunCloudflareContext(ctx: CloudflareContext) {
  _context = ctx;
}

/**
 * Retrieves the Cloudflare context (env, cf, ctx).
 * Can be used anywhere in the application code after the request has started.
 */
export function getBunCloudflareContext<E = Record<string, unknown>>(): CloudflareContext<E> {
  const ctx = _context;
  if (!ctx) {
    // Basic shim for local development if Bun is present
    if (typeof Bun !== 'undefined') {
       return {
         env: (Bun.env as unknown) as E,
         cf: {} as unknown as CloudflareContext<E>['cf'],
         ctx: {
          waitUntil: () => {},
          passThroughOnException: () => {}
         } as unknown as CloudflareContext<E>['ctx']
       };
    }
    
    // Fail-safe for Cloudflare: return a mock context instead of throwing
    return {
      env: {} as E,
      cf: {} as unknown as CloudflareContext<E>['cf'],
      ctx: {
        waitUntil: () => {},
        passThroughOnException: () => {}
      } as unknown as CloudflareContext<E>['ctx']
    };
  }
  return ctx as unknown as CloudflareContext<E>;
}
