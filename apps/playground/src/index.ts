import { Hono } from "hono";
import { serve } from "bun";
import { getCloudflareContext } from "buncf/runtime";
import index from "./index.html";

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

// ─── Routes: Hello World ─────────────────────────────────────────────
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", appName: c.env.APP_NAME, method: "GET" });
});

app.put("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", method: "PUT" });
});

app.get("/api/hello/:name", (c) => {
  const name = c.req.param("name");
  return c.json({ message: `Hello, ${name}!` });
});

// ─── Routes: D1 Database (Native Cloudflare D1) ──────────
app.get("/api/db/users", async (c) => {
  const { env } = getCloudflareContext();
  if (!env.DB) return c.json({ error: "DB binding missing" }, { status: 500 });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
  const { results } = await env.DB.prepare("SELECT * FROM users").all();
  return c.json(results);
});

app.post("/api/db/insert", async (c) => {
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
  return new Response(index as any, {
    headers: { "Content-Type": "text/html" },
  });
});

export default serve({
  fetch: app.fetch,
  port: 3004,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log("🚀 Playground running at http://localhost:3004");
