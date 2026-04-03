import { serve } from "bun";
import { getCloudflareContext } from "buncf/runtime";
import index from "./index.html";

const server = serve({
  routes: {
    // Serve the frontend for all unmatched routes
    "/*": index,

    // ─── Routes: Hello World ─────────────────────────────────────────────
    "/api/hello": {
      async GET(req) {
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      async PUT(req) {
        return Response.json({ message: "Hello, world!", method: "PUT" });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({ message: `Hello, ${name}!` });
    },

    // ─── Routes: D1 (Native Cloudflare D1) ────────────────────────────
    "/api/db": {
      async GET(req) {
        const { env, cf, ctx } = getCloudflareContext();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
        const users = (await env.DB.prepare("SELECT * FROM users").all()).results;
        return Response.json({ message: "Data from D1", users });
      },
      async POST(req) {
        const { env } = getCloudflareContext();
        const body = await req.json() as { name?: string };
        const name = body.name || `User ${new Date().toISOString()}`;
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
        await env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind(name).run();
        return Response.json({ message: "User inserted successfully" });
      },
    },

    "/api/db/delete": {
      async POST(req) {
        const { env } = getCloudflareContext();
        const body = await req.json() as { id?: number };
        const id = body.id;
        if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)").run();
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return Response.json({ message: "User deleted successfully" });
      },
    },

    // ─── Routes: R2 Asset Manager (Native Cloudflare R2) ────────────────
    "/api/storage/list": async (req) => {
      try {
        const { env } = getCloudflareContext();
        const url = new URL(req.url);
        const prefix = url.searchParams.get("prefix") || "";
        const delimiter = url.searchParams.get("delimiter") || "/";

        const list = await env.BUCKET.list({ prefix, delimiter });

        return Response.json({
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
        return Response.json({ error: e.message }, { status: 500 });
      }
    },

    "/api/storage/stat": async (req) => {
      const { env } = getCloudflareContext();
      const url = new URL(req.url);
      const key = url.searchParams.get("key");
      if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

      try {
        const stat = await env.BUCKET.head(key);
        if (!stat) throw new Error("File not found");
        return Response.json(stat);
      } catch (e: any) {
        return Response.json({ error: e.message }, { status: 404 });
      }
    },

    "/api/storage/file/*": async (req) => {
      const { env } = getCloudflareContext();
      const url = new URL(req.url);
      const key = url.pathname.replace("/api/storage/file/", "");
      if (!key) return new Response("Not Found", { status: 404 });

      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response("File not found", { status: 404 });

      return new Response(await obj.arrayBuffer(), {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${key}"`
        }
      });
    },

    "/api/storage/upload": async (req) => {
      try {
        const { env } = getCloudflareContext();
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

        await env.BUCKET.put(file.name, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type }
        });

        return Response.json({ message: "Upload successful", key: file.name });
      } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
      }
    },

    "/api/storage/delete": async (req) => {
      const { env } = getCloudflareContext();
      const { key } = await req.json() as { key: string };
      if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

      await env.BUCKET.delete(key);
      return Response.json({ message: "Deleted successfully" });
    },

    // ─── Routes: KV (Native Cloudflare KV) ──────────────────────
    "/api/redis": {
      async GET(req) {
        const { env } = getCloudflareContext();
        const count = await env.REDIS.get("playground_count");
        return Response.json({ count: parseInt(count ?? "0") });
      },
      async POST(req) {
        const { env } = getCloudflareContext();
        const current = await env.REDIS.get("playground_count");
        const next = (parseInt(current ?? "0") + 1).toString();
        await env.REDIS.put("playground_count", next);
        return Response.json({ count: parseInt(next) });
      },
    },

    "/api/redis/delete": {
      async POST(req) {
        const { env } = getCloudflareContext();
        await env.REDIS.delete("playground_count");
        return Response.json({ count: 0 });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
