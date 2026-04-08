export const workerTemplate = `
const $$options = __OPTIONS__;
const $$routes = $$options.routes ? Object.entries($$options.routes).sort(([a], [b]) => {
  const getScore = (s) => {
    if (s.includes("*")) return 1;
    if (s.includes(":")) return 2;
    return 3;
  };
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return b.length - a.length;
}).map(([path, handler]) => {
  const patternPath = path.endsWith("*") ? path.replace(new RegExp("[*]$"), ":any*") : path;
  return {
    pattern: new URLPattern({ pathname: patternPath }),
    handler
  };
}) : [];

const $$server = {
  upgrade(req, options = {}) {
    console.warn("[Bunflare] Warning: server.upgrade() cannot scale globally. Use the 'websocket()' wrapper for persistent Pub/Sub via Durable Objects.");
    return false;
  },
  publish: (topic, data) => {
    console.warn("[Bunflare] Warning: global publish() is not supported without Durable Objects.");
  }
};

const $$worker = {
  async fetch(request, env, ctx) {
    const { setBunflareContext } = await import("bunflare");
    setBunflareContext({ 
      env: env || {}, 
      cf: request.cf || {}, 
      ctx: ctx || { waitUntil: () => {}, passThroughOnException: () => {} }
    });
    globalThis.$$upgradeResponse = null;
    const $$isDev = typeof process !== "undefined" && (process.env.NODE_ENV === "development" || $$options.development);
    if ($$isDev && env?.ASSETS) {
      const isHTMLRequest = request.headers.get("accept")?.includes("text/html");
      if (!isHTMLRequest) {
        const assetResponse = await env.ASSETS.fetch(request.clone());
        if (assetResponse.status !== 404) return assetResponse;
      }
    } else if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetResponse = await env.ASSETS.fetch(request.clone());
      if (assetResponse.status !== 404) return assetResponse;
    }
    if ($$routes.length > 0) {
      const url = new URL(request.url);
      for (const { pattern, handler } of $$routes) {
        const match = pattern.exec(url);
        if (match) {
          const params = match.pathname.groups;
          const requestWithParams = new Proxy(request, {
            get(target, prop) {
              if (prop === "params") return params;
              if (prop === "_rawRequest") return target;
              const value = Reflect.get(target, prop);
              return typeof value === "function" ? value.bind(target) : value;
            }
          });
          let result;
          // More robust Response check
          const isResponse = handler && (typeof handler === "object" && ("status" in handler || handler.constructor?.name === "Response"));
          if (isResponse || typeof handler === "string") {
            result = typeof handler === "string" ? new Response(handler, { headers: { "Content-Type": "text/html" } }) : handler;
          } else if (typeof handler === "object") {
            const method = request.method.toUpperCase();
            const methodHandler = handler[method];
            if (methodHandler) result = await methodHandler(requestWithParams, $$server, ctx);
          } else if (typeof handler === "function") {
            result = await handler(requestWithParams, $$server, ctx);
          }
          if (globalThis.$$upgradeResponse) return globalThis.$$upgradeResponse;
          if (result) return result;
        }
      }
    }
    if ($$options.fetch) {
      const result = await $$options.fetch(request, $$server, ctx);
      if (globalThis.$$upgradeResponse) return globalThis.$$upgradeResponse;
      if (result) return result;
    }
    return new Response("Not Found", { status: 404 });
  }
};

__SERVER_VAR__

export default {
  ...$$options,
  ...$$server,
  fetch: $$worker.fetch,__HANDLER_ADDITIONS__
};
`;