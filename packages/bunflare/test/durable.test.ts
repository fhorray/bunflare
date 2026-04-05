import { describe, expect, it } from "bun:test";
import { transformDurables } from "../src/transforms/serve-transform";

describe("Durable Objects Transformation", () => {
  it("should transform simple durable() to a class", () => {
    const source = `
      import { durable } from "bunflare";
      export const Counter = durable({
        async fetch(request, state) {
          return new Response("hi");
        }
      });
    `;
    const transformed = transformDurables(source);

    expect(transformed).toContain("class Counter");
    expect(transformed).toContain("constructor(state, env)");
    expect(transformed).toContain("this.state = state");
    expect(transformed).not.toContain('import { durable } from "bunflare"');
    expect(transformed).not.toContain("const Counter = durable");
  });

  it("should support function handlers in durable()", () => {
    const source = `
      export const SimpleDO = durable((req, state) => {
        return new Response("simple");
      });
    `;
    const transformed = transformDurables(source);

    expect(transformed).toContain("class SimpleDO");
    expect(transformed).toContain('if (typeof this.$$handler === "function") return this.$$handler(request, this.state, this.env)');
  });

  it("should handle multiple durable objects in one file", () => {
    const source = `
      export const DO1 = durable({ fetch: () => {} });
      export const DO2 = durable({ fetch: () => {} });
    `;
    const transformed = transformDurables(source);

    expect(transformed).toContain("class DO1");
    expect(transformed).toContain("class DO2");
  });

  it("should preserve existing code around durables", () => {
    const source = `
      const x = 1;
      export const MyDO = durable({ fetch: () => {} });
      console.log(x);
    `;
    const transformed = transformDurables(source);

    expect(transformed).toContain("const x = 1;");
    expect(transformed).toContain("class MyDO");
    expect(transformed).toContain("console.log(x);");
  });

  it("should preserve other imports from bunflare in the same line", () => {
    const source = `
      import { getCloudflareContext, durable } from "bunflare";
      export const Counter = durable({ fetch: () => {} });
      const { env } = getCloudflareContext();
    `;
    const transformed = transformDurables(source);

    expect(transformed).toContain('import { getCloudflareContext } from "bunflare"');
    expect(transformed).not.toContain("durable");
    expect(transformed).toContain("class Counter");
  });
});
