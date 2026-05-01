import { describe, expect, test, beforeEach } from "bun:test";
import { RedisClient } from "../plugin/shims/kv/logic";

// Mocking the Cloudflare Workers environment
const mockKV = {
  store: new Map<string, any>(),
  async get(key: string) {
    return this.store.get(key) || null;
  },
  async put(key: string, value: any, options?: any) {
    this.store.set(key, value);
  },
  async delete(key: string) {
    this.store.delete(key);
  }
};

// Injecting mock into globalThis to simulate Worker 'env'
(globalThis as any).env = {
  "MY_KV": mockKV
};

describe("Redis-over-KV Bridge", () => {
  let redis: RedisClient;

  beforeEach(() => {
    mockKV.store.clear();
    // In our shim, the binding name is injected via template string ${bindingName}
    // But since we are testing the class directly in Bun, we pass it to the constructor.
    redis = new RedisClient("MY_KV");
  });

  test("Basic Set and Get", async () => {
    await redis.set("name", "Bunflare");
    const val = await redis.get("name");
    expect(val).toBe("Bunflare");
  });

  test("Numeric Increments (incr)", async () => {
    await redis.set("counter", "10");
    const next = await redis.incr("counter");
    expect(next).toBe(11);
    expect(await redis.get("counter")).toBe("11");
  });

  test("Numeric Decrements (decr)", async () => {
    await redis.set("counter", "10");
    const next = await redis.decr("counter");
    expect(next).toBe(9);
    expect(await redis.get("counter")).toBe("9");
  });

  test("Key Existence (exists)", async () => {
    await redis.set("active", "true");
    expect(await redis.exists("active")).toBe(true);
    expect(await redis.exists("ghost")).toBe(false);
  });

  test("Key Deletion (del)", async () => {
    await redis.set("temp", "value");
    await redis.del("temp");
    expect(await redis.exists("temp")).toBe(false);
  });

  test("Numeric Fallback (incr from zero)", async () => {
    const next = await redis.incr("new_counter");
    expect(next).toBe(1);
    expect(await redis.get("new_counter")).toBe("1");
  });
});
