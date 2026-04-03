import { describe, expect, it } from "bun:test";
import { transformServe } from "../transforms/serve-transform";
import { transformEnv } from "../transforms/env-transform";
import { getCloudflareContext, setCloudflareContext } from "../runtime/context";

describe("Buncf Plugin Logic", () => {
  describe("Transformations", () => {
    it("should transform Bun.serve into a worker export", () => {
      const source = `
        import { serve } from "bun";
        serve({
          fetch(req) { return new Response("hello"); }
        });
      `;
      const transformed = transformServe(source);
      
      expect(transformed).toContain("export default {");
      expect(transformed).toContain("fetch(request, env, ctx)");
      expect(transformed).not.toContain('from "bun"');
    });

    it("should transform Bun.env calls", () => {
      const source = `console.log(Bun.env.MY_VAR);`;
      const transformed = transformEnv(source);
      
      expect(transformed).toContain('import { getCloudflareContext } from "buncf"');
      expect(transformed).toContain("getCloudflareContext().env.MY_VAR");
    });
  });

  describe("Runtime Context", () => {
    it("should store and retrieve Cloudflare context", () => {
      const mockCtx: any = {
        env: { DB: "mock-db" },
        cf: { country: "US" },
        ctx: { waitUntil: () => {} }
      };

      setCloudflareContext(mockCtx);
      const retrieved = getCloudflareContext();

      expect(retrieved.env.DB as any).toBe("mock-db");
      expect(retrieved.cf.country).toBe("US");
    });

    it("should fallback to process.env if context is not set", () => {
      // Clear context for this test
      setCloudflareContext(null as any);
      
      process.env.TEST_VAR = "hello-test";
      const { env } = getCloudflareContext<{ TEST_VAR: string }>();
      
      expect(env.TEST_VAR).toBe("hello-test");
    });
  });
});
