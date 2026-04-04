import { Hono } from "hono";
import { serve } from "bun";
import { getCloudflareContext, durable, workflow, container } from "buncf";
import type { WorkflowEvent, WorkflowStep, CloudflareBindings } from "buncf";
import index from "./index.html";

// 1. Define a Simple Durable Object using the new fluid API
export const Counter = durable({
  async fetch(request: Request, state: DurableObjectState, env: CloudflareBindings) {
    let count: number = (await state.storage.get("count")) || 0;
    count++;
    await state.storage.put("count", count);
    return Response.json({ count, id: state.id.toString() });
  }
});

// 2. Define a Container using the new fluid API
export const ImageProcessor = container({
  defaultPort: 8080,
  sleepAfter: "5m",
  envVars: {
    MODE: "high-performance"
  }
});

// 3. Define a Chat Hub Durable Object for multi-user WebSockets
export const ChatHub = durable({
  async fetch(request: Request, state: DurableObjectState, env: CloudflareBindings) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Using WebSocket 2.0 API: ws.subscribe()
    server.serialize = () => ({});
    server.subscribe("chat");

    return new Response(null, { status: 101, webSocket: client });
  },

  // Handlers for Hibernatable WebSockets (High Efficiency)
  async webSocketMessage(ws: WebSocket, message: string) {
    // Using WebSocket 2.0 API: ws.publish()
    // Broadcast to everyone in the "chat" topic (excluding sender)
    ws.publish("chat", message);
  },

  async webSocketClose(ws: WebSocket) {
    console.log("Chat connection closed");
  }
});

// 2. Define a Simple Workflow using the new fluid API
export const ProcessingWorkflow = workflow({
  async run(event: WorkflowEvent<{ triggeredAt: string }>, step: WorkflowStep, env: CloudflareBindings) {
    const result = await step.do("process data", async () => {
      return { status: "processed", at: new Date().toISOString() };
    });

    await step.sleep("wait a bit", "5 seconds");

    await step.do("log result", async () => {
      console.log("Workflow finished:", result);
    });

    // ─── FINAL STATUS UPDATE ───────────────────────────────────────
    // This ensures the dashboard sees "success" instead of "running"
    // after the page is reloaded.
    await step.do("update history", async () => {
      if (env.DB) {
        await env.DB.prepare("UPDATE workflow_history SET status = ?, endTime = ? WHERE id = ?")
          .bind("success", new Date().toISOString(), event.instanceId)
          .run();
      }
    });
  }
});

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

// ─── Routes: Hello World ─────────────────────────────────────────────
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", appName: c.env.APP_NAME, method: "GET" });
});

app.get("/api/do/counter", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.COUNTER) return c.json({ error: "COUNTER binding not found" }, { status: 500 });
  const id = env.COUNTER.idFromName("global");
  const obj = env.COUNTER.get(id);
  return obj.fetch(c.req.raw);
});

app.post("/api/workflow/start", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.PROCESSING_WORKFLOW) return c.json({ error: "Workflow binding missing" }, { status: 500 });

  const instance = await env.PROCESSING_WORKFLOW.create({
    params: { triggeredAt: new Date().toISOString() }
  });

  // Log to D1 history for persistence in the UI
  if (env.DB) {
    try {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS workflow_history (id TEXT PRIMARY KEY, status TEXT, startTime TEXT, endTime TEXT, payload TEXT)").run();
      await env.DB.prepare("INSERT INTO workflow_history (id, status, startTime, payload) VALUES (?, ?, ?, ?)")
        .bind(instance.id, "running", new Date().toISOString(), JSON.stringify({ triggeredAt: new Date().toISOString() }))
        .run();
    } catch (e) {
      console.error("Failed to log workflow start to D1:", e);
    }
  }

  return c.json({
    id: instance.id,
    status: "Instance created"
  });
});

app.get("/api/workflow/history", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.DB) return c.json({ history: [] });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS workflow_history (id TEXT PRIMARY KEY, status TEXT, startTime TEXT, endTime TEXT, payload TEXT)").run();
  const { results } = await env.DB.prepare("SELECT * FROM workflow_history ORDER BY startTime DESC LIMIT 10").all();

  // Map D1 results to what the UI expects
  const history = results.map((r: any) => ({
    id: r.id,
    status: r.status,
    startTime: new Date(r.startTime).toLocaleTimeString(),
    endTime: r.endTime ? new Date(r.endTime).toLocaleTimeString() : undefined,
    steps: [
      { title: 'Initialization', status: 'completed' },
      { title: 'Execution', status: r.status === 'running' ? 'pending' : 'completed' },
      { title: 'Durable Sleep', status: r.status === 'running' ? 'pending' : 'completed' },
      { title: 'Success', status: r.status === 'success' ? 'completed' : 'pending' },
    ]
  }));

  return c.json({ history });
});

app.get("/api/container/test", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.IMAGE_PROCESSOR) return c.json({ error: "Container binding missing" }, { status: 500 });
  const instance = env.IMAGE_PROCESSOR.getByName("test-instance");

  // Rewrite the request to the container's root
  const url = new URL(c.req.url);
  url.pathname = "/";
  const proxyReq = new Request(url.toString(), c.req.raw);

  return instance.fetch(proxyReq);
});

app.put("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", method: "PUT" });
});

app.get("/api/hello/:name", (c) => {
  const name = c.req.param("name");
  return c.json({ message: `Hello, ${name}!` });
});

// ─── Routes: D1 Database (Native Cloudflare D1) ──────────
app.get("/api/db", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.DB) return c.json({ error: "DB binding missing" }, { status: 500 });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  const { results } = await env.DB.prepare("SELECT * FROM users").all();
  return c.json({ users: results });
});

app.post("/api/db", async (c) => {
  const { env } = getCloudflareContext();
  const body = await c.req.json() as { name?: string };
  const name = body.name || `User ${Math.floor(Math.random() * 1000)}`;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  await env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind(name).run();
  return c.json({ message: "User inserted successfully" });
});

app.post("/api/db/delete", async (c) => {
  const { env } = getCloudflareContext();
  const body = await c.req.json() as { id?: number };
  const id = body.id;
  if (!id) return c.json({ error: "Missing ID" }, { status: 400 });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ message: "User deleted successfully" });
});

// ─── Routes: R2 Asset Manager (Native Cloudflare R2) ────────────────
app.get("/api/storage/list", async (c) => {
  try {
    const { env } = getCloudflareContext();
    const prefix = c.req.query("prefix") || "";
    const delimiter = c.req.query("delimiter") || "/";

    const list = await env.BUCKET.list({ prefix, delimiter });

    return c.json({
      objects: (list.objects || []).map((o: any) => ({
        key: o.key,
        size: o.size,
        uploaded: o.uploaded,
        etag: o.etag,
        contentType: "application/octet-stream"
      })),
      prefixes: list.delimitedPrefixes || []
    });
  } catch (e: any) {
    return c.json({ error: e.message }, { status: 500 });
  }
});

app.get("/api/storage/stat", async (c) => {
  const { env } = getCloudflareContext();
  const key = c.req.query("key");
  if (!key) return c.json({ error: "Missing key" }, { status: 400 });

  try {
    const stat = await env.BUCKET.head(key);
    if (!stat) throw new Error("File not found");
    return c.json(stat);
  } catch (e: any) {
    return c.json({ error: e.message }, { status: 404 });
  }
});

app.get("/api/storage/file/*", async (c) => {
  const { env } = getCloudflareContext();
  const key = c.req.path.replace("/api/storage/file/", "");
  if (!key) return c.text("Not Found", { status: 404 });

  const obj = await env.BUCKET.get(key);
  if (!obj) return c.text("File not found", { status: 404 });

  return new Response(await obj.arrayBuffer(), {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${key}"`
    }
  });
});

app.post("/api/storage/upload", async (c) => {
  try {
    const { env } = getCloudflareContext();
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file) return c.json({ error: "No file uploaded" }, { status: 400 });

    await env.BUCKET.put(file.name, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    });

    return c.json({ message: "Upload successful", key: file.name });
  } catch (e: any) {
    return c.json({ error: e.message }, { status: 500 });
  }
});

app.post("/api/storage/delete", async (c) => {
  const { env } = getCloudflareContext();
  const { key } = await c.req.json() as { key: string };
  if (!key) return c.json({ error: "Missing key" }, { status: 400 });

  await env.BUCKET.delete(key);
  return c.json({ message: "Deleted successfully" });
});

// ─── Routes: KV (Native Cloudflare KV) ──────────────────
app.get("/api/redis", async (c) => {
  const { env } = getCloudflareContext();
  const count = await env.REDIS.get("playground_count");
  return c.json({ count: parseInt(count ?? "0") });
});

app.post("/api/redis", async (c) => {
  const { env } = getCloudflareContext();
  const current = await env.REDIS.get("playground_count");
  const next = (parseInt(current ?? "0") + 1).toString();
  await env.REDIS.put("playground_count", next);
  return c.json({ count: parseInt(next) });
});

app.post("/api/redis/delete", async (c) => {
  const { env } = getCloudflareContext();
  await env.REDIS.delete("playground_count");
  return c.json({ count: 0 });
});

// Serve frontend for all unmatched routes
app.get("*", (c) => {
  if (typeof index === "string") return c.html(index);
  return new Response(index.toString(), {
    headers: { "Content-Type": "text/html" },
  });
});

export default serve({
  routes: {
    // 1. Dynamic parameters example
    "/api/native/:id": (req) => {
      return Response.json({
        source: "Native buncf Router",
        params: req.params,
        id: req.params.id
      });
    },
    // 2. Wildcard example
    "/api/files/*": (req) => {
      return Response.json({
        source: "Native buncf Router (Wildcard)",
        path: req.params.any
      });
    },
    // 3. Method-based handler with params (now imported for splitting test)
    // @ts-ignore - Satisfaction for Bun.serve types which expect (req, srv) or (req)
    "/api/echo/:message": async (req) => {
      const { echoHandler } = await import("./handlers/echo");
      return echoHandler(req);
    },
    // 4. WebSocket Example (Redirected to Durable Object for broadcasting)
    "/ws": (req) => {
      const { env } = getCloudflareContext();
      if (!env.CHAT_HUB) return new Response("Chat Hub not found", { status: 500 });
      const id = env.CHAT_HUB.idFromName("global-chat");
      const hub = env.CHAT_HUB.get(id);
      const rawRequest = req._rawRequest || req;
      return hub.fetch(rawRequest);
    }
  },
  // @ts-ignore - transformed by buncf to Cloudflare Worker fetch(request, env, ctx)
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
  port: 3004,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log("🚀 Playground running at http://localhost:3004");
