/**
 * [Bunflare] KV and Redis-over-KV Logic
 * This file contains the actual class implementations for use in both
 * the Cloudflare Workers shim and local unit tests.
 */

export class KV {
  private kv: KVNamespace;

  constructor(name?: string) {
    const env = (globalThis as unknown as { env: Record<string, unknown> }).env;
    const binding = name || "KV"; // In the shim, this will be replaced by a template
    
    if (!env || !env[binding]) {
      throw new Error(`KV Binding '${binding}' not found in environment.`);
    }
    this.kv = env[binding] as KVNamespace;
  }

  async get(key: string): Promise<string | null> {
    return this.kv.get(key);
  }

  async set(key: string, value: string | ArrayBuffer): Promise<void> {
    return this.kv.put(key, value);
  }

  async delete(key: string): Promise<void> {
    return this.kv.delete(key);
  }
}

export class RedisClient {
  private kv: KVNamespace;

  constructor(name?: string) {
    const env = (globalThis as unknown as { env: Record<string, unknown> }).env;
    const binding = name || "KV";
    
    if (!env || !env[binding]) {
      throw new Error(`KV Binding '${binding}' (used for Redis shim) not found in environment.`);
    }
    this.kv = env[binding] as KVNamespace;
  }

  async get(key: string): Promise<string | null> {
    return await this.kv.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    return await this.kv.put(key, value);
  }

  async del(key: string): Promise<void> {
    return await this.kv.delete(key);
  }

  async incr(key: string): Promise<number> {
    const val = await this.get(key);
    const next = (parseInt(val || "0") || 0) + 1;
    await this.set(key, next.toString());
    return next;
  }

  async decr(key: string): Promise<number> {
    const val = await this.get(key);
    const next = (parseInt(val || "0") || 0) - 1;
    await this.set(key, next.toString());
    return next;
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.kv.get(key);
    return val !== null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const val = await this.get(key);
    if (val !== null) {
      await this.kv.put(key, val, { expirationTtl: seconds });
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    return await this.kv.put(key, value, { expirationTtl: seconds });
  }
}

export function redis(options?: any): RedisClient {
  return new RedisClient();
}
