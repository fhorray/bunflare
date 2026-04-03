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
  if (!_context) {
    // Basic shim for local development if Bun is present
    if (typeof Bun !== 'undefined') {
       return {
         env: (Bun.env as unknown) as E,
         cf: {} as unknown as CloudflareContext<E>['cf'],
         ctx: {} as unknown as CloudflareContext<E>['ctx']
       };
    }
    throw new Error("[bun-cloudflare] Context not initialized. Are you running inside a Cloudflare Worker?");
  }
  return _context as unknown as CloudflareContext<E>;
}
