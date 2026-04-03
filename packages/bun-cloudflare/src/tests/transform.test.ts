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
      expect(transformed).toContain('const config = {');
    });

    it("should NOT transform serve() imported from 'bun' (use Bun.serve instead)", () => {
      const source = `
        import { serve } from "bun";
        serve({
          fetch(req) {
            return new Response("Hello World");
          }
        });
      `;
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toBe(source);
    });

    it("should transform Bun.serve with variable options", () => {
      const source = `
        const myConfig = { fetch: () => new Response() };
        Bun.serve(myConfig);
      `;
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("const config = myConfig;");
    });
  });

  describe("Environment variables transformation", () => {
    it("should transform Bun.env.VARIABLE", () => {
      const source = "const v = Bun.env.API_KEY;";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("getBunCloudflareContext().env.API_KEY");
      expect(transformed).toContain('import { getBunCloudflareContext } from "bun-cloudflare"');
    });

    it("should transform process.env.VARIABLE", () => {
      const source = "const v = process.env.DATABASE_URL;";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("getBunCloudflareContext().env.DATABASE_URL");
    });

    it("should handle bracket access", () => {
      const source = 'const v = Bun.env["MY_VAR"] + process.env[\'OTHER\'];';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('getBunCloudflareContext().env["MY_VAR"]');
      expect(transformed).toContain('getBunCloudflareContext().env["OTHER"]');
    });

    it("should handle multiple environment variable accesses", () => {
      const source = "console.log(Bun.env.A, Bun.env.B);";
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain("getBunCloudflareContext().env.A");
      expect(transformed).toContain("getBunCloudflareContext().env.B");
    });
  });

  describe("Sqlite transformation", () => {
    it("should transform db.query(...).all() to await", () => {
      const source = 'const rows = db.query("SELECT * FROM users").all();';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('await db.query("SELECT * FROM users").all()');
    });

    it("should transform db.exec(...) to await", () => {
      const source = 'db.exec("CREATE TABLE users (id INT)");';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('await db.exec("CREATE TABLE users (id INT)")');
    });

    it("should not double await if already present", () => {
      const source = 'const rows = await db.query("SELECT * FROM users").all();';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed.match(/await await/g)).toBeNull();
    });
  });

  describe("File-IO transformation", () => {
    it("should transform Bun.file() to file()", () => {
      const source = 'const f = Bun.file("config.json");';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('const f = file("config.json")');
      expect(transformed).toContain('import { file, write } from "bun-cloudflare/shims/file-io"');
    });

    it("should transform Bun.write() to await write()", () => {
      const source = 'Bun.write("test.txt", "hello");';
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('await write("test.txt", "hello")');
    });
  });

  describe("Edge cases", () => {
    it("should not transform code in node_modules", () => {
      const source = "Bun.env.SECRET";
      const transformed = applyTransforms(source, "node_modules/some-pkg/index.ts");
      expect(transformed).toBe(source);
    });

    it("should handle source code that already has imports", () => {
      const source = `import { foo } from "bar";\nBun.env.A;`;
      const transformed = applyTransforms(source, "index.ts");
      expect(transformed).toContain('import { getBunCloudflareContext } from "bun-cloudflare"');
      expect(transformed).toContain('import { foo } from "bar"');
    });
  });
});
