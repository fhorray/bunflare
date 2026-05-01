/**
 * [Bunflare] KV and Redis-over-KV Logic
 * This file contains the actual class implementations for use in both
 * the Cloudflare Workers shim and local unit tests.
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export class RedisClient {
  private _kv: KVNamespace | null = null;
  private bindingName: string;

  constructor(name?: string) {
    this.bindingName = name || "KV";
  }

  private get kv(): KVNamespace {
    if (this._kv) return this._kv;

    const env = (globalThis as unknown as { env: Record<string, unknown> }).env;
    if (!env || !env[this.bindingName]) {
      throw new Error(`KV Binding '${this.bindingName}' (used for Redis shim) not found in environment.`);
    }

    this._kv = env[this.bindingName] as KVNamespace;
    return this._kv;
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

export const redis = new RedisClient();
