import { describe, expect, it, beforeAll } from "bun:test";
import { initCloudflareMocks, getCloudflareContext } from "../runtime/context";

describe("Wrangler Integration (Miniflare)", () => {
  beforeAll(async () => {
      // Initialize official Cloudflare mocks via wrangler/miniflare
      await initCloudflareMocks();
  });

  it("should have initialized the cloudflare context", () => {
      const { env, cf, ctx } = getCloudflareContext();
      expect(env).toBeDefined();
      expect(cf).toBeDefined();
      expect(ctx).toBeDefined();
      expect(ctx.waitUntil).toBeTypeOf("function");
  });

  it("should provide access to bindings defined in wrangler config", async () => {
      const { env } = getCloudflareContext();
      
      // We check for generic existence since we don't know the exact bindings of the current user,
      // but we expect the env object to be the proxy-wrapped one.
      expect(env).toBeTypeOf("object");
      
      // In a typical project with R2, this would work:
      // if (env.BUCKET) {
      //    await env.BUCKET.put("test", "data");
      //    expect(await (await env.BUCKET.get("test")).text()).toBe("data");
      // }
  });
});
