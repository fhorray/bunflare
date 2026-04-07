import { getCloudflareContext } from "../runtime/context";
import { withMetadata } from "./seo";

export interface SPAOptions {
  /** The raw index.html content (usually imported as text via bunflare bundler) */
  indexHtml: any;
  /** Optional title for SEO metadata injection */
  title?: string;
  /** Optional description for SEO metadata injection */
  description?: string;
}

/**
 * Creates a generic request handler for SPA fallbacks.
 * It automatically attempts to serve the compiled HTML via Cloudflare ASSETS,
 * or falls back to the inlined text module if missing.
 * 
 * Works natively with Hono (c => ...) or standard fetch (request => ...) handlers.
 */
export function spaFallback(options: SPAOptions) {
  return async (contextOrRequest: any) => {
    // Determine if it's a Hono Context or a raw web Request
    const request: Request = contextOrRequest.req?.raw || contextOrRequest;
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Ignore static asset requests to allow 404s for missing scripts/css
    if (path.includes('.') && !path.endsWith('.html')) {
        return new Response("Not Found", { status: 404 });
    }

    const { env } = getCloudflareContext();
    
    // Attempt to serve from compiled Cloudflare ASSETS
    if (env && env.ASSETS) {
      try {
        const assetUrl = new URL("/", request.url);
        const req = new Request(assetUrl.toString(), request);
        const res = await env.ASSETS.fetch(req);
        if (res.ok || res.status === 304) {
          return res;
        }
      } catch (e) {
        console.warn("[Bunflare SPA] Failed to fetch root from ASSETS:", e);
      }
    }

    // Fallback to the provided raw HTML string
    const html = typeof options.indexHtml === "string" 
      ? options.indexHtml 
      : options.indexHtml.toString();
      
    const rawResponse = new Response(html, { 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
    
    return withMetadata(rawResponse, { 
      title: options.title, 
      description: options.description 
    });
  };
}
