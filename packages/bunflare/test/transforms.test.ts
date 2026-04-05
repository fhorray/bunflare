import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Fluid API Transformations", () => {
  test("should transform container() into a class", () => {
    const source = `
      import { container } from "bunflare";
      export const ImageProcessor = container({
        defaultPort: 9000,
        onStart() { console.log("Started"); }
      });
    `;
    const transformed = transformSource(source, "index.ts");
    
    expect(transformed).toContain("class ImageProcessor extends Container");
    expect(transformed).toContain("if ($$opts.defaultPort) this.defaultPort = $$opts.defaultPort;");
    expect(transformed).toContain('import { Container } from "@cloudflare/containers"');
    expect(transformed).not.toContain("container({");
  });

  test("should transform workflow() into a class", () => {
    const source = `
      import { workflow } from "bunflare";
      export const MyWorkflow = workflow({
        async run(event, step) { console.log("Running"); }
      });
    `;
    const transformed = transformSource(source, "index.ts");
    
    expect(transformed).toContain("class MyWorkflow extends WorkflowEntrypoint");
    expect(transformed).toContain('import { WorkflowEntrypoint } from "cloudflare:workers"');
    expect(transformed).not.toContain("workflow({");
  });

  test("should transform durable() into a class with WebSocketPubSub support", () => {
    const source = `
      import { durable } from "bunflare";
      export const Counter = durable({
        async fetch(req) { return new Response("OK"); }
      });
    `;
    const transformed = transformSource(source, "index.ts");
    
    expect(transformed).toContain("class Counter {");
    expect(transformed).toContain("constructor(state, env)");
    expect(transformed).toContain("this.$$wrapWS(ws)");
    expect(transformed).toContain("this.state.getWebSockets(topic)");
  });

  test("should correctly handle imports and avoid shadowing", () => {
     const source = `
      import { container as c } from "bunflare";
      export const MyC = c({ port: 80 });
     `;
     const transformed = transformSource(source, "index.ts");
     expect(transformed).toContain("class MyC extends Container");
  });
});
