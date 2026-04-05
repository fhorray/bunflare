import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("AST Transformation: Basic Helpers", () => {
  test("transformDurables: basic", () => {
    const input = `import { durable } from "bunflare";\nexport const MyDO = durable({ fetch() { return new Response("hi"); } });`;
    const output = transformSource(input);
    expect(output).toContain("class MyDO {");
    expect(output).toContain('return new Response("hi")');
    expect(output).not.toContain('import { durable } from "bunflare"');
  });

  test("handle multiple declarations", () => {
    const input = `
      import { durable, workflow } from "bunflare";
      export const A = durable({}), B = workflow({});
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("class A {");
    expect(output).toContain("class B extends WorkflowEntrypoint {");
  });
});

describe("AST Transformation: TypeScript Scenarios", () => {
  test("TS basic type annotations", () => {
    const input = `
      import { durable } from "bunflare";
      export const MyDO: any = durable({ 
        fetch(req: Request): Response { return new Response("hi"); } 
      });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("class MyDO {");
    expect(output).toContain("req: Request");
  });

  test("Generic types", () => {
    const input = `
      import { workflow } from "bunflare";
      export const MyWF = workflow<string>({ 
        async run(event: string) {} 
      });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("class MyWF extends WorkflowEntrypoint {");
  });

  test("Interfaces and types in file", () => {
    const input = `
      import { durable } from "bunflare";
      interface Config { port: number }
      type MyType = string;
      export const MyDO = durable({ fetch() { return "hi"; } });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("interface Config");
    expect(output).toContain("class MyDO {");
  });
});

describe("AST Transformation: JSX/TSX Scenarios", () => {
  test("JSX in Durable Object", () => {
    const input = `
      import { durable } from "bunflare";
      export const UI = durable({ 
        fetch() { return <div>Hello World</div>; } 
      });
    `;
    const output = transformSource(input, "index.tsx");
    expect(output).toContain("class UI {");
    expect(output).toContain("<div>Hello World</div>");
  });

  test("Complex TSX with imports", () => {
    const input = `
      import { durable } from "bunflare";
      import React from "react";
      export const App = durable({ 
        render() { return <div className="p-4"><App /></div>; } 
      });
    `;
    const output = transformSource(input, "index.tsx");
    expect(output).toContain("class App {");
    expect(output).toContain('className="p-4"');
  });
});

describe("AST Transformation: Edge Cases", () => {
  test("Comments and whitespace", () => {
    const input = `
      import { 
        durable // test
      } from "bunflare";
      /* leading comment */
      export const /* inner */ MyDO = durable(
        // doc
        { fetch() {} }
      );
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("class MyDO {");
  });

  test("Import aliases", () => {
    const input = `
      import { durable as d } from "bunflare";
      export const MyDO = d({ fetch() {} });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("class MyDO {");
  });

  test("Redundant Bun.serve", () => {
    const input = `
      import { serve } from "bun";
      const s = Bun.serve({ fetch: () => new Response() });
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("export default {");
    expect(output).not.toContain("Bun.serve");
  });
});
