import { serve } from "bun";
import { Database } from "bun:sqlite";
import index from "./index.html";

// Database instance - automatically transformed to Cloudflare D1 on build
const db = new Database("DB");

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

    // ─── Routes: D1 (SQLite → Cloudflare D1) ────────────────────────────
    "/api/db": {
      async GET(req) {
        await db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
        const users = await db.query("SELECT * FROM users").all();
        return Response.json({ message: "Data from D1", users });
      },
      async POST(req) {
        const body = await req.json();
        const name = body.name || `User ${new Date().toISOString()}`;
        await db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
        await db.query("INSERT INTO users (name) VALUES (?)").run(name);
        return Response.json({ message: "User inserted successfully" });
      },
    },

    "/api/db/delete": {
      async POST(req) {
        const body = await req.json();
        const id = body.id;
        if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });
        await db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
        await db.query("DELETE FROM users WHERE id = ?").run(id);
        return Response.json({ message: "User deleted successfully" });
      },
    },

    // ─── Routes: R2 (Bun.file / Bun.write → Cloudflare R2) ─────────────
    // Bun.file() and Bun.write() are automatically transformed to R2 on build.
    // The filename acts as the R2 object key within the bound bucket.
    "/api/file": {
      async GET(req) {
        const file = Bun.file("playground-data.txt");
        const exists = await file.exists();
        const content = exists
          ? await file.text()
          : "No content yet. Use POST /api/write to create some.";
        return new Response(content, { headers: { "Content-Type": "text/plain" } });
      },
    },

    "/api/write": {
      async POST(req) {
        const body = await req.json();
        const content = body.content || `Hello from R2! Written at ${new Date().toISOString()}`;
        await Bun.write("playground-data.txt", content);
        return Response.json({ message: "Successfully wrote to R2!" });
      },
    },

    "/api/file/delete": {
      async DELETE(req) {
        // Bun.write with empty content signals deletion intent in the shim
        await Bun.write("playground-data.txt", "");
        return Response.json({ message: "Successfully deleted from R2!" });
      },
    },

    // ─── Routes: KV (Bun.redis → Cloudflare KV) ──────────────────────
    // Bun.redis is automatically transformed to the KV shim on build.
    // In Bun locally, it connects to a real Redis server (via preload mock).
    "/api/redis": {
      async GET(req) {
        const count = await Bun.redis.get("playground_count");
        return Response.json({ count: parseInt(count ?? "0") });
      },
      async POST(req) {
        const current = await Bun.redis.get("playground_count");
        const next = (parseInt(current ?? "0") + 1).toString();
        await Bun.redis.set("playground_count", next);
        return Response.json({ count: parseInt(next) });
      },
    },

    "/api/redis/delete": {
      async POST(req) {
        await Bun.redis.del("playground_count");
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
