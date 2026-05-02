import type { MiddlewareHandler } from "hono";
import { existsSync } from "fs";

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
/**
 * A universal `serveStatic` that works in both environments.
 */
export function serveStatic(options: ServeStaticOptions = {}): MiddlewareHandler {
  return async (c, next) => {
    if (typeof globalThis.Bun !== "undefined" && "version" in globalThis.Bun) {
      const { serveStatic: bunServeStatic } = await import("hono/bun");
      return bunServeStatic(options)(c, next);
    }
    return next();
  };
}

/**
 * Options for the SPA middleware.
 */
interface SPAOptions extends ServeStaticOptions {
  /**
   * The name of the HTML file to serve for SPA routes.
   * @default "index.html"
   */
  index?: string;
  /**
   * A prefix or list of prefixes to ignore. 
   * Requests starting with these will fall through to the next handler.
   * @default "/api/"
   */
  apiPrefix?: string | string[];
}

/**
 * A middleware that handles both static files and SPA fallback.
 * It serves static files from the root directory and falls back to
 * index.html for navigation routes.
 */
export function spa(options: SPAOptions = {}): MiddlewareHandler {
  const { 
    root: userRoot, 
    index = "index.html", 
    apiPrefix = "/api/" 
  } = options;

  const prefixes = Array.isArray(apiPrefix) ? apiPrefix : [apiPrefix];

  return async (c, next) => {
    const path = c.req.path;
    const isFile = path.split("/").pop()?.includes(".");

    // 1. If it's an API route, skip to next handler
    if (prefixes.some(p => p && path.startsWith(p))) {
      return next();
    }

    // 2. Determine the best root directory for Bun
    let root = userRoot;
    if (!root && typeof globalThis.Bun !== "undefined") {
      // Auto-detect: if we are in a 'dist' folder, use 'dist/public', otherwise use 'public'
      const isDist = process.cwd().includes("dist") || existsSync("./dist");
      root = isDist ? "./dist/public" : "./public";
    } else if (!root) {
      root = "./dist/public";
    }

    // 3. Try serving as a static file (if it looks like one)
    if (isFile) {
      if (typeof globalThis.Bun !== "undefined" && "version" in globalThis.Bun) {
        const { serveStatic: bunServeStatic } = await import("hono/bun");
        return bunServeStatic({ root })(c, next);
      }
      return next();
    }

    // 4. SPA Fallback: Serve index.html for navigation routes
    if (typeof globalThis.Bun !== "undefined" && "version" in globalThis.Bun) {
      const indexPath = root.endsWith("/") ? `${root}${index}` : `${root}/${index}`;
      const file = globalThis.Bun.file(indexPath);
      if (await file.exists()) {
        let html = await file.text();
        
        // Inject Live Reload script if enabled
        const reloadPort = process.env.BUNFLARE_RELOAD_PORT;
        if (reloadPort) {
          const script = `
            <script>
              (function() {
                const socket = new WebSocket('ws://' + window.location.hostname + ':${reloadPort}');
                socket.onmessage = (msg) => {
                  if (msg.data === 'refresh') window.location.reload();
                };
                console.log('[bunflare] Live reload enabled on port ${reloadPort}');
              })();
            </script>
          `;
          html = html.replace("</body>", `${script}</body>`);
        }
        
        return c.html(html);
      }
    }

    // In Cloudflare, just pass through. 
    return next();
  };
}

