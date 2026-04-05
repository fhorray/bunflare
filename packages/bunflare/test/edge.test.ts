import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { rateLimit, flags } from "../src/edge";
import { setCloudflareContext } from "../src/runtime/context";

describe("Edge Utilities", () => {
  describe("Rate Limiting", () => {
    let mockLimiter: any;

    beforeEach(() => {
      mockLimiter = {
        limit: async () => ({ success: true })
      };
      setCloudflareContext({
        env: { MY_LIMITER: mockLimiter },
        ctx: { waitUntil: () => { } } as any,
        cf: {} as any
      });
    });

    it("should allow request when within limits", async () => {
      let nextCalled = false;
      const middleware = rateLimit({ binding: "MY_LIMITER", limit: 5, window: 60 });
      const ctx: any = { req: { header: () => "1.2.3.4" }, json: () => { } };

      await middleware(ctx, async () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
    });

    it("should return 429 when limit exceeded", async () => {
      mockLimiter.limit = async () => ({ success: false });
      let nextCalled = false;
      let jsonResponse: any = null;

      const middleware = rateLimit({ binding: "MY_LIMITER", limit: 5, window: 60 });
      const ctx: any = {
        req: { header: () => "1.2.3.4" },
        json: (data: any, status: number) => { jsonResponse = { data, status }; }
      };

      await middleware(ctx, async () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(jsonResponse.status).toBe(429);
      expect(jsonResponse.data.error).toBe("Too Many Requests");
    });
  });

  describe("Feature Flags", () => {
    let mockKv: any;

    beforeEach(() => {
      mockKv = {
        get: async () => ({ test_flag: true })
      };
      setCloudflareContext({
        env: { FLAGS_KV: mockKv },
        ctx: { waitUntil: () => { } } as any,
        cf: {} as any
      });
    });

    it("should evaluate boolean flags correctly", async () => {
      const enabled = await flags.evaluate("test_flag", "user123");
      expect(enabled).toBe(true);

      const disabled = await flags.evaluate("missing_flag", "user123");
      expect(disabled).toBe(false);
    });

    it("should evaluate percentage-based rollouts consistently", async () => {
      mockKv.get = async () => ({ experimental_feature: 50 }); // 50% rollout

      // user123 + experimental_feature = hash 1121545638 -> bucket something
      const res1 = await flags.evaluate("experimental_feature", "user123");
      const res2 = await flags.evaluate("experimental_feature", "user123");

      expect(res1).toBe(res2); // Consistency

      // Verify random distribution (rough)
      let hits = 0;
      for (let i = 0; i < 100; i++) {
        if (await flags.evaluate("experimental_feature", "user" + i)) hits++;
      }
      expect(hits).toBeGreaterThan(30);
      expect(hits).toBeLessThan(70);
    });
  });
});
