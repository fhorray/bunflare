import { getCloudflareContext } from "../runtime/context";

export interface RateLimitOptions {
  binding: string;
  limit: number;
  window: number | string; // in seconds or 1m, 1h
  identifier?: (c: any) => string;
}

/**
 * Rate Limiting middleware for Cloudflare Workers.
 * Uses the native 'ratelimit' binding.
 */
export function rateLimit(options: RateLimitOptions) {
  return async (c: any, next: () => Promise<void>) => {
    const { env } = getCloudflareContext();
    const limiter = env[options.binding];

    if (!limiter || typeof limiter.limit !== "function") {
      console.warn(`[bunflare] Rate limiter binding "${options.binding}" not found or unsupported.`);
      return await next();
    }

    // Default identifier is the connecting IP
    const key = options.identifier 
      ? options.identifier(c) 
      : c.req.header("cf-connecting-ip") || "anonymous";

    try {
      const { success } = await limiter.limit({ key });
      if (!success) {
        return c.json({ error: "Too Many Requests", message: "Dynamic rate limit exceeded." }, 429);
      }
    } catch (e) {
      console.error("[bunflare] Rate limiting error:", e);
    }

    await next();
  };
}
