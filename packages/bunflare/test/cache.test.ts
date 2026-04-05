import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { cache } from "../src/cache";
import { setCloudflareContext } from "../src/runtime/context";

describe("Smart Cache Utility", () => {
  let mockCache: any;
  let mockCtx: any;

  beforeEach(() => {
    mockCache = {
      match: async (req: Request) => null,
      put: async (req: Request, res: Response) => {},
      delete: async (req: Request) => true,
    };
    mockCtx = {
      waitUntil: (p: Promise<any>) => {}
    };

    (globalThis as any).caches = {
      default: mockCache
    };

    setCloudflareContext({
      env: {},
      ctx: mockCtx as any,
      cf: {} as any
    });
  });

  it("should return cached value on hit", async () => {
    const data = { hello: "world" };
    mockCache.match = async () => new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

    const result = await cache.getOrSet("test-key", 60, async () => ({ unexpected: true }) as any);
    expect(result).toEqual(data as any);
  });

  it("should call function and cache result on miss", async () => {
    const data = { generated: true };
    const putSpy = spyOn(mockCache, "put");
    const waitSpy = spyOn(mockCtx, "waitUntil");

    const result = await cache.getOrSet("test-key", 60, async () => data);
    
    expect(result).toEqual(data);
    expect(putSpy).toHaveBeenCalled();
    expect(waitSpy).toHaveBeenCalled();
  });

  it("should handle plain text responses", async () => {
    mockCache.match = async () => new Response("plain text", {
      headers: { "Content-Type": "text/plain" }
    });

    const result = await cache.getOrSet("text-key", 60, async () => "fail");
    expect(result).toBe("plain text");
  });

  it("should support manual invalidation", async () => {
    const delSpy = spyOn(mockCache, "delete");
    await cache.delete("old-key");
    expect(delSpy).toHaveBeenCalled();
  });
});
