import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("WebSocket Exhaustive Debugging", () => {
  test("Binding resolution logic should handle various casing", () => {
    const name = "LiveChat";
    const env = {
      LIVE_CHAT: { idFromName: () => ({}), get: () => ({}) }
    };
    
    // Logic from the generated code
    const resolve = (n: string, e: any) => {
      return e[n] || e[n.toUpperCase()] || e[n.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, "")];
    };
    
    expect(resolve(name, env)).toBeDefined();
    expect(resolve("ChatRoom", { CHAT_ROOM: {} })).toBeDefined();
    expect(resolve("StockManager", { STOCK_MANAGER: {} })).toBeDefined();
  });

  test("WebSocketPair handling should be robust", () => {
    // Mocking the environment where WebSocketPair might return an object with numeric keys
    const mockPair = {
      0: { name: "client" },
      1: { name: "server" }
    };
    
    // Robust indexing
    const client = (mockPair as any)[0];
    const server = (mockPair as any)[1];
    
    expect(client.name).toBe("client");
    expect(server.name).toBe("server");
  });

  test("Proxy should correctly forward state calls", () => {
    let acceptedWs: any = null;
    let acceptedTags: string[] = [];
    
    const mockState = {
      acceptWebSocket: (ws: any, tags?: string[]) => {
        acceptedWs = ws;
        if (tags) acceptedTags = tags;
      }
    };
    
    const mockServer = { name: "server-ws" };
    
    // Logic from $$wrapWS
    const wrap = (ws: any, state: any) => {
      return new Proxy(ws, {
        get(target, prop) {
          if (prop === "subscribe") return (topic: string) => state.acceptWebSocket(target, [topic]);
          return target[prop];
        }
      });
    };
    
    const wrapped = wrap(mockServer, mockState);
    wrapped.subscribe("support");
    
    expect(acceptedWs).toBe(mockServer);
    expect(acceptedTags).toEqual(["support"]);
  });
});
