import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Exhaustive: AST Parser Stress", () => {
  test("Handle serve with spread and variables", () => {
    const input = `
      import { serve } from "bun";
      const apiRoutes = { "/api": () => {} };
      serve({
        ...apiRoutes,
        routes: { "/": () => "root" }
      });
    `;
    // We expect the parser to ignore the spread (currently) but NOT break.
    // Ideally it should only transform the Literal object in 'routes'.
    const output = transformSource(input, "index.ts");
    expect(output).toContain('"/": () => "root"');
    expect(output).toContain("export default {");
  });

  test("Shadowing of durable identifier", () => {
    const input = `
      import { durable } from "buncf";
      {
        const durable = (x) => x; 
        const myLocal = durable({ h: 123 }); // This should NOT be transformed
      }
      export const RealDO = durable({ fetch() {} }); // This SHOULD be
    `;
    const output = transformSource(input, "index.ts");
    
    // The current walker doesn't strictly check scope, so this is a real stress test.
    // If it fails, I'll need to improve the walker.
    expect(output).toContain("class RealDO {");
    // If RealDO replaced but myLocal didn't, we are good.
    // Wait, buncf identifier map is global for the file currently.
    expect(output).toContain("const myLocal = durable({ h: 123 });");
  });

  test("Nested object literals in routes (already handles, but verify boundaries)", () => {
     const input = `
      import { serve } from "bun";
      serve({
        routes: {
          "/api": {
            GET: () => "ok",
            POST: () => "created"
          }
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("GET: () => \"ok\"");
    expect(output).toContain("POST: () => \"created\"");
  });

  test("MemberExpression as callee (Bun.serve)", () => {
    const input = `
      import { serve } from "bun";
      Bun.serve({ routes: { "/": () => "node" } });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("export default {");
    expect(output).not.toContain("Bun.serve");
  });
});

describe("Exhaustive: Splitting Stress", () => {
  test("Multiple routes to same imported handler", () => {
    const input = `
      import { Handler } from "./h";
      import { serve } from "bun";
      serve({
        routes: {
          "/a": Handler,
          "/b": Handler
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    const matches = output.match(/await import\("\.\/h"\)/g);
    expect(matches?.length).toBe(2); 
  });

  test("Namespace imports in routes", () => {
    const input = `
      import * as H from "./handlers";
      import { serve } from "bun";
      serve({
        routes: {
          "/home": H.Home
        }
      });
    `;
    const output = transformSource(input, "index.ts");
    
    // Now we DO expect transformation
    expect(output).toContain('await import("./handlers")');
    expect(output).toContain(".Home(req, srv, ctx)");
  });
});
