export function getServeShim(): string {
  return `
import { setEnv } from "bun:env";

/**
 * Cloudflare Worker Shim for Bun.serve
 */
export function serve(options) {
  const { routes, fetch: fallbackFetch, development } = options;

  // Pre-compile routes
  const compiledRoutes = [];
  if (routes) {
    for (const pattern in routes) {
      compiledRoutes.push({
        path: pattern,
        handler: routes[pattern]
      });
    }
  }

  return {
    id: "bunflare-server",
    url: new URL("http://localhost"),
    hostname: "localhost",
    port: 3000,
    async fetch(request, env, ctx) {
      setEnv(env);
      const url = new URL(request.url);
      
      console.log(\`[BUNFLARE] 📥 \${request.method} \${url.pathname}\`);

      const server = {
        id: "bunflare-shim",
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        url,
        pendingRequests: 0,
        pendingWebSockets: 0,
        requestIP: () => request.headers.get("cf-connecting-ip"),
        upgrade: () => {
          throw new Error("Bun.serve upgrade() is not yet implemented in bunflare");
        },
        cloudflare: { env, ctx }
      };

      let response = null;

      // 1. Try Routes
      if (compiledRoutes.length > 0) {
        for (const { path, handler } of compiledRoutes) {
          // Simple matching for now to ensure reliability
          // Handle both exact match and trailing slash
          const normalizedPath = path === "/" ? "/" : path.replace(/\\/$/, "");
          const normalizedReqPath = url.pathname === "/" ? "/" : url.pathname.replace(/\\/$/, "");
          
          let isMatch = normalizedReqPath === normalizedPath;
          let params = {};

          // Handle dynamic routes (very basic :param support)
          if (!isMatch && path.includes(":")) {
             const pathParts = normalizedPath.split("/");
             const reqParts = normalizedReqPath.split("/");
             if (pathParts.length === reqParts.length) {
               isMatch = true;
               for (let i = 0; i < pathParts.length; i++) {
                 if (pathParts[i].startsWith(":")) {
                   params[pathParts[i].substring(1)] = reqParts[i];
                 } else if (pathParts[i] !== reqParts[i]) {
                   isMatch = false;
                   break;
                 }
               }
             }
          }

          if (isMatch) {
            console.log(\`[BUNFLARE] 🎯 Match found: \${path}\`);
            (request as unknown as { params: Record<string, string> }).params = params;
            
            if (typeof handler === "object" && handler !== null) {
              const methodHandler = handler[request.method];
              if (methodHandler) {
                response = await methodHandler(request, server);
              }
            } else if (typeof handler === "function") {
              response = await handler(request, server);
            } else {
              response = handler instanceof Response ? handler.clone() : handler;
            }
            
            if (response) break;
          }
        }
      }

      // 2. Try Fallback Fetch
      if (!response && fallbackFetch) {
        console.log("[BUNFLARE] ⚡ Falling back to options.fetch");
        response = await fallbackFetch(request, server);
      }

      // 3. Try Static Assets (Cloudflare ASSETS)
      if (!response) {
        const assets = env.ASSETS;
        if (assets && typeof assets.fetch === "function") {
          const assetResponse = await assets.fetch(request);
          if (assetResponse.status !== 404) {
            console.log(\`[BUNFLARE] 📦 Served from ASSETS: \${url.pathname}\`);
            response = assetResponse;
          }
        }
      }

      // 4. Final 404
      if (!response) {
        console.warn(\`[BUNFLARE] ⚠️ 404 Not Found: \${url.pathname}\`);
        response = new Response("Not Found", { status: 404 });
      }

      // 5. Inject HMR script (omitted for brevity here but kept in real shim)
      return response;
    }
  };
}
`;
}
