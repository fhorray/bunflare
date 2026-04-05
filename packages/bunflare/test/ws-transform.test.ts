import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("WebSocket 2.0 Transform", () => {
  test("should transform durable() with WebSocket Pub/Sub API", () => {
    const source = `
      import { durable } from "bunflare";
      
      export const ChatHub = durable({
        async fetch(request, state, env) {
          return new Response("ok");
        },
        async webSocketMessage(ws, msg) {
          ws.subscribe("chat");
          ws.publish("chat", msg);
        }
      });
    `;

    const transformed = transformSource(source);

    // Check for core WebSocket 2.0 features in the output
    expect(transformed).toContain("$$wrapWS(ws)");
    expect(transformed).toContain("publish(topic, data, exclude)");
    expect(transformed).toContain("self.state.acceptWebSocket(target, [topic])");
    expect(transformed).toContain(".call(this, this.$$wrapWS(ws), message)");
    expect(transformed).toContain("this.$$handler = {");
  });

  test("should wrap all WebSocket lifecycle methods", () => {
    const source = `
      import { durable } from "bunflare";
      export const Hub = durable({
        webSocketMessage: (ws, m) => {},
        webSocketClose: (ws, c, r) => {},
        webSocketError: (ws, e) => {}
      });
    `;

    const transformed = transformSource(source);

    expect(transformed).toContain("async webSocketMessage(ws, message)");
    expect(transformed).toContain("async webSocketClose(ws, code, reason, wasClean)");
    expect(transformed).toContain("async webSocketError(ws, error)");

    // Verify each one uses the wrapper
    expect(transformed).toContain(".call(this, this.$$wrapWS(ws), message)");
    expect(transformed).toContain(".call(this, this.$$wrapWS(ws), code, reason, wasClean)");
    expect(transformed).toContain(".call(this, this.$$wrapWS(ws), error)");
  });
});
