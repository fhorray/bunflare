import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Aggressive Splitting: Route Transformation", () => {
  test("wrap imported handler in dynamic import", () => {
    const input = `
      import { Handler } from "./handler";
      import { serve } from "bun";
      serve({
        routes: {
          "/": Handler
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    
    // Check for the dynamic import wrapper
    expect(output).toContain('await import("./handler")');
    expect(output).toContain('Handler(req, srv, ctx)');
    expect(output).not.toContain('routes: { "/": Handler }');
  });

  test("handle default imports in routes", () => {
    const input = `
      import MyHandler from "./my-handler";
      import { serve } from "bun";
      serve({
        routes: {
          "/api": MyHandler
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    
    expect(output).toContain('await import("./my-handler")');
    expect(output).toContain('.default(req, srv, ctx)');
  });

  test("do not wrap local identifiers", () => {
    const input = `
      import { serve } from "bun";
      const LocalHandler = () => new Response("ok");
      serve({
        routes: {
          "/": LocalHandler
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    
    // Check the routes definition specifically
    expect(output).toContain('"/": LocalHandler');
    expect(output).not.toContain('"/": async (req, srv, ctx) => (await import');
  });

  test("multiple routes with mixed imports", () => {
    const input = `
      import { A } from "./a";
      import B from "./b";
      import { serve } from "bun";
      serve({
        routes: {
          "/a": A,
          "/b": B,
          "/c": () => new Response()
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    
    expect(output).toContain('await import("./a")');
    expect(output).toContain('await import("./b")');
    expect(output).toContain('() => new Response()');
  });
});
