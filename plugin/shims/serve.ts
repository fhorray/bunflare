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
  // Return an object that Cloudflare Workers entrypoint expects
  return {
    async fetch(request, env, ctx) {
      // 1. Automatically register the environment bindings
      setEnv(env);

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

      // 3. Call the original Bun fetch handler (with routing support)
      const { routes, fetch: fallbackFetch, development } = options;
      const url = new URL(request.url);

      // Internal HMR Heartbeat
      if (development && url.pathname === "/_bunflare/hmr") {
        const buildId = (globalThis as any)._BUNFLARE_BUILD_ID || (Math.random().toString(36).substring(2));
        (globalThis as any)._BUNFLARE_BUILD_ID = buildId;
        return new Response(buildId, { headers: { "Access-Control-Allow-Origin": "*" } });
      }

      let response = null;

      if (routes) {
        for (const pattern in routes) {
          const handler = routes[pattern];
          const urlPattern = new URLPattern({ pathname: pattern });
          if (urlPattern.test(request.url)) {
            response = await handler(request, server);
            break;
          }
        }
      }

      if (!response && fallbackFetch) {
        response = await fallbackFetch(request, server);
      }

      // 4. Automatic Static Assets Proxy (Option A)
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
          const buildId = (globalThis as any)._BUNFLARE_BUILD_ID || (Math.random().toString(36).substring(2));
          (globalThis as any)._BUNFLARE_BUILD_ID = buildId;
          
          let html = await response.text();
          const hmrScript = \`
<script>
  (function() {
    const buildId = "\${buildId}";
    let isChecking = false;
    async function checkServer() {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch("/_bunflare/hmr");
        const serverId = await res.text();
        if (serverId && serverId !== buildId) {
          console.log("[bunflare] New build detected, reloading...");
          location.reload();
          return;
        }
      } catch (e) {
        // Server is likely rebooting
      } finally {
        isChecking = false;
        setTimeout(checkServer, 500);
      }
    }
    setTimeout(checkServer, 500);
  })();
</script>\`;
          
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
          return response;
        }
      }

      return response;
    }
  };
}
`;
}
