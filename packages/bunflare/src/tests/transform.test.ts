import { describe, expect, it } from "bun:test";
import { applyTransforms } from "../transforms";

describe("applyTransforms", () => {
  describe("Bun.serve transformation", () => {
    it("should transform basic Bun.serve to Cloudflare worker export", () => {
      const source = `
        Bun.serve({
          fetch(req) {
            return new Response("Hello World");
          }
        });
      `;
      const transformed = applyTransforms(source, "index.ts");

      expect(transformed).toContain("export default {");
      expect(transformed).toContain("async fetch(request, env, ctx)");
    });

    it("should transform serve() imported from 'bun' and remove the import", () => {
      const source = `
        import { serve } from "bun";
        serve({
          fetch(req) {
            return new Response("Hello World");
          }
        });
      `;
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("export default {");
      expect(transformed).not.toContain('import { serve } from "bun"');
    });
  });

  describe("Environment variables transformation", () => {
    it("should transform Bun.env.VARIABLE", () => {
      const source = "const v = Bun.env.API_KEY;";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("getCloudflareContext().env.API_KEY");
      expect(transformed).toContain('import { getCloudflareContext } from "bunflare"');
    });

    it("should NOT transform NODE_ENV", () => {
      const source = "const v = process.env.NODE_ENV;";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("process.env.NODE_ENV");
      expect(transformed).not.toContain("getCloudflareContext().env.NODE_ENV");
    });

    it("should transform process.env.VARIABLE", () => {
      const source = "const v = process.env.DATABASE_URL;";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("getCloudflareContext().env.DATABASE_URL");
    });
  });

  describe("Edge cases", () => {
    it("should not transform code in node_modules", () => {
      const source = "Bun.env.SECRET";
      const transformed = applyTransforms(source, "node_modules/some-pkg/index.ts");
      expect(transformed).toBe(source);
    });
  });
});
