/**
 * Template for the Bun.serve -> Cloudflare Worker fetch handler shim.
 */

export function getServeShim(): string {
  return `
import { setEnv } from "bun:env";

/**
 * Cloudflare Worker Shim for Bun.serve
 */
export function serve(options) {
  // 3. Call the original Bun fetch handler (with routing support)
  const { routes, fetch: fallbackFetch, development } = options;

  // Pre-compile routes to avoid creating URLPattern on every request
  const compiledRoutes = [];
  if (routes) {
    for (const pattern in routes) {
      compiledRoutes.push({
        pattern: new URLPattern({ pathname: pattern }),
        handler: routes[pattern]
      });
    }
  }

  // Return an object that Cloudflare Workers entrypoint expects
  return {
    async fetch(request, env, ctx) {
      // 1. Automatically register the environment bindings
      setEnv(env);

      const url = new URL(request.url);
      // console.log(\`[bunflare] 📥 \${request.method} \${url.pathname}\`);

      // 2. Prepare a mock Bun 'Server' object
      const server = {
        id: "bunflare-shim",
        hostname: "localhost",
        port: 3000,
        pendingRequests: 0,
        pendingWebSockets: 0,
        requestIP: () => request.headers.get("cf-connecting-ip"),
        upgrade: () => {
          throw new Error("Bun.serve upgrade() is not yet implemented in bunflare");
        },
        cloudflare: { env, ctx }
      };

      let response = null;

      if (compiledRoutes.length > 0) {
        for (const { pattern, handler } of compiledRoutes) {
          const match = pattern.exec(request.url);
          
          if (match) {
            // In Bun, params are attached to the request object
            // We cast to any to allow property assignment
            (request as any).params = match.pathname.groups;
            
            // Support for method-based handlers (e.g. { GET: handler, POST: handler })
            if (typeof handler === "object" && handler !== null) {
              const methodHandler = handler[request.method];
              if (methodHandler) {
                response = await methodHandler(request, server);
              }
            } else if (typeof handler === "function") {
              response = await handler(request, server);
            }
            
            if (response) break;
          }
        }
      }

      if (!response && fallbackFetch) {
        response = await fallbackFetch(request, server);
      }

      // 4. Automatic Static Assets Proxy
      if (!response) {
        const assets = env.ASSETS;
        if (assets && typeof assets.fetch === "function") {
          const assetResponse = await assets.fetch(request);
          if (assetResponse.status !== 404) {
            response = assetResponse;
          }
        }
      }

      if (!response) {
        response = new Response("Not Found", { status: 404 });
      }

      // 5. Development Mode: Inject Live-Reload Script
      const contentType = response.headers.get("content-type") || "";
      if (development && contentType.toLowerCase().includes("text/html")) {
        try {
          let html = await response.text();
          const hmrScript = \`
            <script>
              (function() {
                if (window.BUNFLARE_LR) return;
                window.BUNFLARE_LR = true;
                function connect() {
                  const script = document.createElement('script');
                  script.src = 'http://' + window.location.hostname + ':35729/livereload.js?snipver=1';
                  script.async = true;
                  script.onerror = () => {
                    console.warn('[bunflare] Livereload connection failed. Retrying in 5s...');
                    setTimeout(connect, 5000);
                  };
                  document.head.appendChild(script);
                }
                connect();
              })();
            </script>
          \`;
          
          if (html.includes("</body>")) {
            html = html.replace("</body>", hmrScript + "</body>");
          } else {
            html += hmrScript;
          }
          
          const newResponse = new Response(html, response);
          newResponse.headers.delete("Content-Length");
          newResponse.headers.set("Content-Type", "text/html; charset=utf-8");
          return newResponse;
        } catch (e) {
          console.error("[bunflare] Failed to inject live-reload script:", e);
          return response;
        }
      }

      return response;
    }
  };
}
`;
}
