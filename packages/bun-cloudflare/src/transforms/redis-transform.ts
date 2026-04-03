/**
 * Transform for Bun.redis -> Cloudflare KV
 *
 * Maps Bun's Redis API to Cloudflare KV Namespace.
 * Bun.redis.get/set/del → env.KV_BINDING.get/put/delete
 *
 * Note: Bun.redis connects to a real Redis server in native Bun.
 * In Cloudflare Workers, it's shimmed to use KV Namespace instead.
 * Basic string operations (get, set, del) are compatible.
 */
export function transformRedis(source: string): string {
  if (!source.includes("Bun.redis")) {
    return source;
  }

  let transformed = source;

  // Inject the import if not already present
  if (!transformed.includes('import { redis as __bunRedis } from "bun-cloudflare/shims/redis"')) {
    transformed = `import { redis as __bunRedis } from "bun-cloudflare/shims/redis";\n` + transformed;
  }

  // Replace Bun.redis with the shimmed redis
  // Use __bunRedis to avoid collision with user variables named 'redis'
  transformed = transformed.replace(/Bun\.redis/g, "__bunRedis");

  return transformed;
}
