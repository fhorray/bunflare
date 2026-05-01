import { Database } from "bun:sqlite";
import { KV } from "bun:kv";

/**
 * Bunflare Fullstack App (Simplified!)
 * 
 * Notice how we don't need a manual 'fetch' fallback anymore.
 * bunflare automatically proxies unknown routes to Cloudflare ASSETS
 * if the binding is present.
 */
export default Bun.serve({
  routes: {
    // API Status endpoint
    "/api/status": (req) => {
      let sqliteStatus = "Disabled";
      try {
        const db = new Database("my-db");
        sqliteStatus = "Shimmed (D1) ✅";
      } catch (e) {
        sqliteStatus = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      return Response.json({
        status: "Online 🚀",
        sqlite: sqliteStatus,
        runtime: "Cloudflare Workers + Bunflare",
        timestamp: new Date().toISOString()
      });
    },

    // Echo endpoint with params
    "/api/echo/:message": (req) => {
      const { message } = req.params;
      return Response.json({ echo: message });
    },

    // Storage test (R2)
    "/api/storage": async (req) => {
      const path = "test.txt";
      const content = `Hello from Bunflare R2! Time: ${new Date().toISOString()}`;

      // Write to R2
      await Bun.write(path, content);

      // Read back from R2
      const file = Bun.file(path);
      const readContent = await file.text();
      const exists = await file.exists();

      return Response.json({
        written: true,
        content: readContent,
        exists: exists,
        storage: "Cloudflare R2 ✅"
      });
    },

    // File upload test (R2)
    "/api/upload": async (req) => {
      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return new Response("No file uploaded", { status: 400 });
      }

      const filename = file.name || "upload-" + Date.now();

      // Save to R2 using Bun.write()
      await Bun.write(filename, file);

      // Verify it exists
      const savedFile = Bun.file(filename);
      const exists = await savedFile.exists();

      return Response.json({
        success: true,
        filename,
        size: file.size,
        type: file.type,
        exists,
        message: "File uploaded to R2 successfully! 📁"
      });
    },

    // Extensive Shims Test (KV, Crypto, etc)
    "/api/test": async () => {
      const results: any = {};

      // 1. Test bun:kv
      try {
        const kv = new KV();
        await kv.set("test_key", "Bunflare is Awesome!");
        const val = await kv.get("test_key");
        results.kv = val === "Bunflare is Awesome!" ? "Working ✅" : "Value mismatch ❌";
      } catch (e) {
        results.kv = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 2. Test Bun.password
      try {
        const hash = await Bun.password.hash("my-secret-password");
        const match = await Bun.password.verify("my-secret-password", hash);
        results.crypto = match ? "Working ✅" : "Hash mismatch ❌";
      } catch (e) {
        results.crypto = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 3. Test SQLite (D1)
      try {
        const db = new Database();
        // Simple query test
        db.run("CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY, val TEXT)");
        results.sqlite = "Working ✅";
      } catch (e) {
        results.sqlite = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      return Response.json(results);
    },

    // Exhaustive Redis Bridge Tests
    "/api/test/redis": async () => {
      // @ts-ignore
      const redis = Bun.redis();
      const report: any = { timestamp: new Date().toISOString(), results: [] };

      const check = async (name: string, fn: () => Promise<any>) => {
        try {
          const res = await fn();
          report.results.push({ name, status: "PASS ✅", detail: res });
        } catch (e) {
          report.results.push({ name, status: "FAIL ❌", error: String(e) });
        }
      };

      // Scenario 1: Basic Strings
      await check("Basic CRUD", async () => {
        await redis.set("test:string", "Hello Bunflare");
        const val = await redis.get("test:string");
        await redis.del("test:string");
        const after = await redis.get("test:string");
        return { initial: val, deleted: after === null };
      });

      // Scenario 2: Numeric Operations (Counter Stress)
      await check("Numeric Stress", async () => {
        const key = "test:num";
        await redis.set(key, "10");
        await redis.incr(key); // 11
        await redis.incr(key); // 12
        await redis.decr(key); // 11
        const final = await redis.get(key);
        await redis.del(key);
        return { final_value: final };
      });

      // Scenario 3: Existence Checks
      await check("Existence", async () => {
        await redis.set("test:exists", "1");
        const e1 = await redis.exists("test:exists");
        const e2 = await redis.exists("test:ghost");
        await redis.del("test:exists");
        return { exists_true: e1, exists_false: e2 };
      });

      // Scenario 4: TTL / Expiration
      await check("TTL / Expiration", async () => {
        // We use setex (Set with Expiry)
        await redis.setex("test:ttl", 60, "temp");
        const val = await redis.get("test:ttl");
        // We can't easily wait for expiration in a fast test, but we can verify it's set
        return { value_set: val === "temp" };
      });

      return Response.json(report);
    },

    // Counter test using Bun.redis() -> mapped to KV
    "/api/counter": async (req) => {
      // @ts-ignore - Bunflare will handle the transformation
      const redis = Bun.redis();
      const key = "visitor_counter";

      if (req.method === "POST") {
        const next = await redis.incr(key);
        return Response.json({ count: next });
      }

      const count = await redis.get(key) || "0";
      return Response.json({ count: parseInt(count) });
    }
  },

  // Enable development mode (HMR, detailed errors)
  development: true
});
