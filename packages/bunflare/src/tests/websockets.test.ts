import { describe, expect, it, beforeEach } from "bun:test";
import { transformServe } from "../transforms/serve-transform";

// Mock WebSocketPair for Bun environment
class MockWebSocket extends EventTarget {
  _sent: any[] = [];
  _accepted = false;
  readyState = 1;

  accept() {
    this._accepted = true;
  }
  send(data: any) {
    this._sent.push(data);
  }
  close(code?: number, reason?: string) {
    this.readyState = 3; // Closed
    this.dispatchEvent(new CloseEvent("close", { code, reason }));
  }

  // Helper to simulate receiving a message from the other side
  _receive(data: any) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

let lastPair: { client: MockWebSocket; server: MockWebSocket } | null = null;

(globalThis as any).WebSocketPair = class {
  constructor() {
    const client = new MockWebSocket();
    const server = new MockWebSocket();
    lastPair = { client, server };
    (this as any)[0] = client;
    (this as any)[1] = server;
  }

  *[Symbol.iterator]() {
    yield (this as any)[0];
    yield (this as any)[1];
  }
};

async function getFetchFromSource(source: string) {
  const transformed = transformServe(source);

  // Mock Response to capture webSocket property
  (globalThis as any).Response = class extends Response {
    override  webSocket: any;
    constructor(body: any, options: any = {}) {
      super(body, options);
      this.webSocket = options.webSocket;
    }
  };

  const codeToEval = transformed
    .replace(/import\s+\{[^}]*\}\s+from\s+["']bunflare["'];?/g, "const setBunflareContext = () => {};")
    .replace(/await import\(["']bunflare["']\)/g, "({ setBunflareContext: () => {} })")
    .replace(/export\s+default/g, "globalThis.__testWorker =");

  try {
    const cleanCode = codeToEval.replace(/\(globalThis as any\)/g, "globalThis");
    (0, eval)(cleanCode);
  } catch (e) {
    console.error("Error evaluating transformed code:", e);
    throw e;
  }

  return (globalThis as any).__testWorker.fetch;
}

describe("WebSocket Support", () => {
  beforeEach(() => {
    lastPair = null;
    (globalThis as any).__testWorker = null;
  });

  it("should handle server.upgrade() and return 101 Response", async () => {
    const source = `
      serve({
        fetch(req, server) {
          if (server.upgrade(req)) return;
          return new Response("fallback");
        },
        websocket: {
          message(ws, msg) {
            ws.send("echo: " + msg);
          }
        }
      });
    `;
    const fetch = await getFetchFromSource(source);
    const req = new Request("http://localhost/ws", {
      headers: { Upgrade: "websocket" }
    });

    const res = await fetch(req);
    expect(res.status).toBe(101);
    expect((res as any).webSocket).toBeDefined();
    expect(lastPair).not.toBeNull();
  });

  it("should trigger handlers and pass data context", async () => {
    let logs: string[] = [];
    (globalThis as any).LOG = logs;

    const source = `
      serve({
        fetch(req, server) {
          server.upgrade(req, { data: { name: "Alice" } });
        },
        websocket: {
          open(ws) {
            globalThis.LOG.push("open:" + ws.data.name);
          },
          message(ws, msg) {
            globalThis.LOG.push("msg:" + msg);
            ws.send("hello " + ws.data.name);
          },
          close(ws, code) {
            globalThis.LOG.push("close:" + code);
          }
        }
      });
    `;
    const fetch = await getFetchFromSource(source);
    await fetch(new Request("http://localhost/ws"));

    expect(lastPair).not.toBeNull();
    const serverSide = lastPair!.server;

    // 1. Verify open was called
    expect(logs).toContain("open:Alice");

    // 2. Simulate incoming message
    serverSide._receive("ping");
    expect(logs).toContain("msg:ping");
    expect(serverSide._sent).toContain("hello Alice");

    // 3. Simulate close
    serverSide.close(1000);
    expect(logs).toContain("close:1000");
  });

  it("should handle local Pub/Sub (subscribe/publish)", async () => {
    const source = `
      serve({
        fetch(req, server) {
          server.upgrade(req);
        },
        websocket: {
          open(ws) {
            ws.subscribe("chat");
          },
          message(ws, msg) {
            if (msg === "broadcast") {
              ws.publish("chat", "announcement");
            }
          }
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    // Create two connections
    await fetch(new Request("http://localhost/ws"));
    const pair1 = lastPair!;

    await fetch(new Request("http://localhost/ws"));
    const pair2 = lastPair!;

    // Subscriber 1 sends "broadcast"
    pair1.server._receive("broadcast");

    // Subscriber 2 should receive "announcement"
    expect(pair2.server._sent).toContain("announcement");
    // Subscriber 1 should NOT receive its own broadcast (per Bun spec)
    expect(pair1.server._sent).not.toContain("announcement");
  });

  it("should handle global server.publish()", async () => {
    const source = `
      const server = serve({
        fetch(req, s) {
          s.upgrade(req);
        },
        websocket: {
          open(ws) {
            ws.subscribe("news");
          }
        }
      });
      // Mock global publish access for testing
      globalThis.publishNow = (topic, data) => server.publish(topic, data);
    `;
    const fetch = await getFetchFromSource(source);
    await fetch(new Request("http://localhost/ws"));
    const pair = lastPair!;

    // Global publish
    (globalThis as any).publishNow("news", "breaking news");
    expect(pair.server._sent).toContain("breaking news");
  });
});
