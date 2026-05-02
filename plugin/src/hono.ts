import type { MiddlewareHandler } from "hono";

interface ServeStaticOptions {
  root?: string;
  path?: string;
  rewriteRequestPath?: (path: string) => string;
}

/**
 * A universal `serveStatic` that works in both environments:
 *
 * - **bun dev:local** (Bun runtime): delegates to `hono/bun`'s `serveStatic`,
 *   reading files from the local filesystem.
 * - **bun dev / deploy** (Cloudflare Workers): returns `next()` and passes
 *   through to the next handler. Static files are served automatically by the
 *   Cloudflare `ASSETS` binding configured in `wrangler.jsonc`.
 *
 * @example
 * ```ts
 * import { serveStatic } from "bunflare/hono";
 *
 * app.use("*", serveStatic({ root: "./public" }));
 * ```
 */
export function serveStatic(options: ServeStaticOptions = {}): MiddlewareHandler {
  return async (c, next) => {
    // Real Bun runtime has a 'version' property.
    // Our shim in Cloudflare Workers does not.
    if (typeof globalThis.Bun !== "undefined" && "version" in globalThis.Bun) {
      const { serveStatic: bunServeStatic } = await import("hono/bun");
      return bunServeStatic(options)(c, next);
    }

    // Cloudflare Workers → ASSETS binding handles static files automatically.
    // Just pass through to the next route handler.
    return next();
  };
}
