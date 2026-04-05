import { Hono } from "hono";
import { serve } from "bun";
import { getCloudflareContext, durable, workflow, container, browser, tasks, queue, cron, cache } from "bunflare";
import { rateLimit, flags } from "bunflare/edge";
import { withMetadata } from "bunflare/utils";
import type { WorkflowEvent, WorkflowStep, CloudflareBindings, MessageBatch } from "bunflare";
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

// 3. Define a Browser Rendering instance (transformed into Class)
export const PDFMaker = browser({
  async run(page: any, req: Request, env: CloudflareBindings) {
    const url = new URL(req.url).searchParams.get("url") || "https://google.com";
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bunflare-report.pdf"`
      }
    });
  }
});

// 4. Message Queue Consumer
export const TestQueue = queue({
  async process(messages: MessageBatch["messages"], env: CloudflareBindings) {
    for (const msg of messages) {
      console.log(`[Queue] Processing message ${msg.id}:`, msg.body);
      if (env.KV) {
        const logs = JSON.parse((await env.KV.get("queue_logs")) || "[]");
        logs.unshift({ id: msg.id, body: msg.body, time: new Date().toISOString(), status: "processed" });
        await env.KV.put("queue_logs", JSON.stringify(logs.slice(0, 20)));
      }
      msg.ack();
    }
  }
});

// 5. Scheduled Task (Cron)
export const CleanupTask = cron({
  schedule: "*/1 * * * *", 
  async run(event: any, env: CloudflareBindings) {
    console.log("[Cron] Cleanup task triggered");
    if (env.KV) await env.KV.put("last_cron_run", new Date().toISOString());
  }
});

// 6. Durable Object for multi-user WebSockets
export const ChatHub = durable({
  async fetch(request: Request, state: DurableObjectState, env: CloudflareBindings) {
    const pair = new WebSocketPair();
    const server = pair[1];
    (server as any).serialize = () => ({});
    (server as any).subscribe("chat");
    return new Response(null, { status: 101, webSocket: pair[0] });
  },
  async webSocketMessage(ws: WebSocket, message: string) {
    ws.publish("chat", message);
  }
});

// 7. Processing Workflow
export const ProcessingWorkflow = workflow({
  async run(event: WorkflowEvent<{ triggeredAt: string }>, step: WorkflowStep, env: CloudflareBindings) {
    const result = await step.do("process data", async () => ({ status: "processed", at: new Date().toISOString() }));
    await step.sleep("wait a bit", "5 seconds");
    await step.do("update history", async () => {
      if (env.DB) {
        await env.DB.prepare("UPDATE workflow_history SET status = ?, endTime = ? WHERE id = ?")
          .bind("success", new Date().toISOString(), event.instanceId).run();
      }
    });
  }
});

const app = new Hono<{ Bindings: CloudflareBindings }>();

// ─── Edge Utilities Examples ───

// Rate Limiter: 5 requests per minute
const authLimiter = rateLimit({
  binding: "AUTH_LIMITER",
  limit: 5,
  window: 60
});

app.post("/api/auth/login", authLimiter, async (c) => {
  return c.json({ success: true, message: "Login successful (Rate limited)" });
});

// Smart Cache: Leaderboard
app.get("/api/cache/leaderboard", async (c) => {
  const data = await cache.getOrSet("global_leaderboard", { ttl: 60 }, async () => {
    // Simulate slow database query
    await new Promise(r => setTimeout(r, 800));
    return [
      { name: "Alice (Top Player)", score: 9500 },
      { name: "Bob", score: 8200 },
      { name: "Charlie", score: 7100 },
      { name: "Dave", score: 6500 }
    ];
  });
  return c.json({ data, source: (c.req.raw as any).cf?.cacheStatus || "miss" });
});

// Feature Flags
app.get("/api/edge/banner", async (c) => {
  const userId = c.req.query("userId") || "anonymous";
  const isEnabled = await flags.evaluate("new_homepage_banner", userId);
  return c.json({
    feature: "new_homepage_banner",
    enabled: isEnabled,
    content: isEnabled 
      ? `✨ Experimental Experience active for ${userId}` 
      : `Standard welcome for ${userId}`
  });
});

app.post("/api/edge/flags/toggle", async (c) => {
  const { name, enabled } = await c.req.json();
  const { env } = getCloudflareContext();
  if (!env.FLAGS_KV) return c.json({ error: "FLAGS_KV binding missing" }, 500);
  
  const current = JSON.parse((await env.FLAGS_KV.get("active_flags")) || "{}");
  current[name] = enabled;
  await env.FLAGS_KV.put("active_flags", JSON.stringify(current));
  
  return c.json({ success: true, flags: current });
});

// ─── Queue Endpoints ───
app.post("/api/queue/send", async (c) => {
  const { body } = await c.req.json();
  const { env } = getCloudflareContext();
  if (!env.TEST_QUEUE) return c.json({ error: "TEST_QUEUE binding missing (Did you run bunflare doctor --fix?)" }, 500);
  
  await env.TEST_QUEUE.send(body);
  return c.json({ success: true, message: "Enqueued" });
});

app.get("/api/queue/logs", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.KV) return c.json({ logs: [] });
  const logs = JSON.parse((await env.KV.get("queue_logs")) || "[]");
  return c.json({ logs });
});

app.post("/api/queue/mock", async (c) => {
  const { env, ctx } = getCloudflareContext();
  const batch = [
    { id: "mock-" + Math.random().toString(36).substring(7), body: { mock: true, type: "manual_trigger", time: new Date().toISOString() }, ack: () => {}, retry: () => {} }
  ] as any;
  
  if (ctx.waitUntil) {
    ctx.waitUntil(TestQueue.process(batch, env));
  } else {
    await TestQueue.process(batch, env);
  }
  return c.json({ success: true, message: "Mock batch processed" });
});

app.post("/api/cron/mock", async (c) => {
  const { env, ctx } = getCloudflareContext();
  const event = { cron: "*/1 * * * *", scheduledTime: Date.now() };
  
  if (ctx.waitUntil) {
    ctx.waitUntil(CleanupTask.run(event as any, env));
  } else {
    await CleanupTask.run(event as any, env);
  }
  return c.json({ success: true, message: "Mock cron triggered" });
});

// ─── Standard Routes ───
app.get("/api/hello", (c) => c.json({ message: "Hello, world!", appName: c.env.APP_NAME }));

app.get("/api/browser/pdf", async (c) => {
  const { env } = getCloudflareContext();
  if (env.PDFMAKER) {
    const id = env.PDFMAKER.idFromName("global");
    return env.PDFMAKER.get(id).fetch(c.req.raw);
  }
  return c.json({ error: "PDFMAKER DO missing" }, 500);
});

app.get("/api/db", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.DB) return c.json({ error: "DB missing" }, 500);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  const { results } = await env.DB.prepare("SELECT * FROM users").all();
  return c.json({ users: results });
});

app.post("/api/db", async (c) => {
  const { env } = getCloudflareContext();
  const body = await c.req.json();
  await env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind(body.name || "Unknown").run();
  return c.json({ success: true });
});

app.get("*", (c) => {
  const html = typeof index === "string" ? index : (index as any).toString();
  return c.html(html);
});

export default serve({
  routes: {
    "/ws": (req: any) => {
      const { env } = getCloudflareContext();
      if (!env.CHAT_HUB) return new Response("Chat Hub missing", { status: 500 });
      return env.CHAT_HUB.get(env.CHAT_HUB.idFromName("global-chat")).fetch(req);
    }
  },
  fetch: (req: any, env: any, ctx: any) => app.fetch(req, env, ctx)
} as any);
