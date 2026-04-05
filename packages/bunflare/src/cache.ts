import { getCloudflareContext } from "./runtime/context";

export interface CacheOptions {
  ttl?: number; // in seconds
  key?: string;
}

/**
 * Smart Cache Utility for Cloudflare Edge Cache.
 * Wraps caches.default with a clean getOrSet interface.
 */
export const cache = {
  /**
   * Retrieves an item from the cache or sets it if it doesn't exist.
   * @param key Unique identifier for the cached resource.
   * @param options TTL and key customization.
   * @param fn Asynchronous function to generate the value on cache miss.
   */
  async getOrSet<T>(
    key: string,
    options: CacheOptions | number,
    fn: () => Promise<T>
  ): Promise<T> {
    const { ctx } = getCloudflareContext();
    const ttl = typeof options === "number" ? options : options.ttl || 60;
    const cacheKey = new Request(`https://bunflare.cache/${encodeURIComponent(key)}`);
    const edgeCache = (globalThis as any).caches?.default;

    if (!edgeCache) {
      console.warn("[bunflare] Cache API (caches.default) not available in this environment.");
      return await fn();
    }

    // 1. Try to match in cache
    try {
      const cachedResponse = await edgeCache.match(cacheKey);
      if (cachedResponse) {
        const contentType = cachedResponse.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          return await cachedResponse.json();
        }
        return (await cachedResponse.text()) as any;
      }
    } catch (e) {
      console.warn(`[bunflare] Cache match error for key "${key}":`, e);
    }

    // 2. Cache miss: Execute function
    const result = await fn();

    // 3. Store in cache (background)
    if (ctx && result !== undefined && result !== null) {
      const body = typeof result === "string" ? result : JSON.stringify(result);
      const response = new Response(body, {
        headers: {
          "Content-Type": typeof result === "string" ? "text/plain" : "application/json",
          "Cache-Control": `s-maxage=${ttl}`
        }
      });

      // Use waitUntil to avoid blocking the main response
      ctx.waitUntil(edgeCache.put(cacheKey, response.clone()));
    }

    return result;
  },

  /**
   * Manually invalidate a cache key.
   */
  async delete(key: string): Promise<boolean> {
    const cacheKey = new Request(`https://bunflare.cache/${encodeURIComponent(key)}`);
    const edgeCache = (globalThis as any).caches?.default;
    if (!edgeCache) return false;
    return await edgeCache.delete(cacheKey);
  }
};
