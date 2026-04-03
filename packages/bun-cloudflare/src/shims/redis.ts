import { getBunCloudflareContext } from "../runtime/context";
import type { CloudflareEnv } from "../types";
import type { KVNamespace } from "@cloudflare/workers-types";

/**
 * Partial shim for Bun.redis using Cloudflare KV.
 * Maps basic Redis commands to KV operations.
 */
export const redis = {
  getBinding() {
    const { env } = getBunCloudflareContext<CloudflareEnv & { REDIS: KVNamespace }>();
    const kv = env.REDIS;
    if (!kv || typeof kv.get !== "function") {
       // Fallback to default KV or throw
       throw new Error("[bun-cloudflare] KV namespace 'REDIS' not found in env.");
    }
    return kv;
  },

  async get(key: string): Promise<string | null> {
    return await this.getBinding().get(key);
  },

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const kv = this.getBinding();
    const putOptions: { expirationTtl?: number } = {};
    if (options?.ex) {
      putOptions.expirationTtl = options.ex;
    }
    await kv.put(key, value, putOptions);
  },

  async del(key: string): Promise<void> {
    await this.getBinding().delete(key);
  }
};
