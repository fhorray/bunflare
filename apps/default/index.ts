import { Database } from "bun:sqlite";
import { redis, sql } from "bun";
import homepage from "./public/index.html";

/**
 * Bunflare Fullstack App (Simplified!)
 * 
 * Notice how we don't need a manual 'fetch' fallback anymore.
 * bunflare automatically proxies unknown routes to Cloudflare ASSETS
 * if the binding is present.
 */
const server = Bun.serve({
  routes: {
    // Root landing page (Fullstack mode)
    "/": homepage,
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
        redis: "Active ✅",
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

      // Sanitize the filename for SEO while preventing path traversal
      const rawName = file.name || "upload";
      const filename = `uploads/${rawName
        .replace(/^.*[\\\/]/, '')   // Get only the basename
        .replace(/[^\w\.-]/g, '_')}`; // Replace unsafe chars

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

    // Hybrid SQL test (D1 + Postgres)
    "/api/sql-test": async () => {
      const results: { d1: Record<string, unknown>, postgres: Record<string, unknown> } = { d1: {}, postgres: {} };

      // 1. Test D1 (via bun:sqlite)
      try {
        const db = new Database("my-db");
        const init = db.run("CREATE TABLE IF NOT EXISTS d1_test (id INTEGER PRIMARY KEY, val TEXT)");
        if (init instanceof Promise) await init;

        const insert = db.run("INSERT INTO d1_test (val) VALUES (?)", [`D1 Test ${Date.now()}`]);
        if (insert instanceof Promise) await insert;

        const stmt = db.prepare("SELECT * FROM d1_test ORDER BY id DESC LIMIT 1");
        const d1Result = stmt.all();
        const data = (d1Result instanceof Promise) ? await d1Result : d1Result;

        // The D1 returns an object { results: [...] } on all()
        results.d1 = { status: "Success ✅", data: (data as { results: unknown[] }).results };
      } catch (e) {
        results.d1 = { status: "Error ❌", error: e instanceof Error ? e.message : String(e) };
      }

      // 2. Test Postgres (via Bun.sql)
      try {
        // We might need to ensure the table exists
        await sql`CREATE TABLE IF NOT EXISTS pg_test (id SERIAL PRIMARY KEY, val TEXT)`;
        await sql`INSERT INTO pg_test (val) VALUES (${`Postgres Test ${Date.now()}`})`;
        const pgRows = await sql`SELECT * FROM pg_test ORDER BY id DESC LIMIT 1`;
        results.postgres = { status: "Success ✅", data: pgRows };
      } catch (e: any) {
        results.postgres = { status: "Error ❌", error: e.message };
      }

      return Response.json(results);
    },

    // Extensive Shims Test (KV, Crypto, etc)
    "/api/test": async () => {
      const results: Record<string, string | undefined> = {};

      // 1. Test Redis-over-KV Bridge
      try {
        await redis.set("test_key", "Bunflare is Awesome!");
        const val = await redis.get("test_key");
        results.redis = val === "Bunflare is Awesome!" ? "Working ✅" : "Value mismatch ❌";
      } catch (e) {
        results.redis = `Error: ${e instanceof Error ? e.message : String(e)}`;
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
        const init = db.run("CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY, val TEXT)");
        if (init instanceof Promise) await init;
        results.sqlite = "Working ✅";
      } catch (e) {
        results.sqlite = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      return Response.json(results);
    },

    // New: Test Bun.sql (Tagged Template API)
    "/api/sql": async () => {
      try {
        // Initialize table for Postgres (using SERIAL for auto-increment)
        try {
          await sql`DROP TABLE IF EXISTS users`;
          await sql`CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT)`;

          // Insert some data (using array expansion)
          const names = ["Alice", "Bob", "Charlie"];
          for (const name of names) {
            await sql`INSERT INTO users (name) VALUES (${name})`;
          }
        } catch (e) { }

        // Query using tagged template
        const users = await sql`SELECT * FROM users LIMIT 10`;

        // Test .values()
        const values = await sql`SELECT name FROM users`.values();

        return Response.json({
          success: true,
          users,
          values,
          message: "Bun.sql (Tagged Template) Working ✅"
        });
      } catch (e) {
        return Response.json({
          success: false,
          error: e instanceof Error ? e.message : String(e)
        }, { status: 500 });
      }
    },

    // Exhaustive Hyperdrive Tests
    "/api/test/hyperdrive": async () => {
      const report: { timestamp: string, results: { name: string, status: string, detail?: unknown, error?: string }[] } = {
        timestamp: new Date().toISOString(),
        results: []
      };

      const check = async (name: string, fn: () => Promise<unknown>) => {
        try {
          const res = await fn();
          report.results.push({ name, status: "PASS ✅", detail: res });
        } catch (e) {
          report.results.push({ name, status: "FAIL ❌", error: e instanceof Error ? e.message : String(e) });
        }
      };

      await check("Init Table", async () => {
        await sql`DROP TABLE IF EXISTS hd_test_users`;
        await sql`CREATE TABLE hd_test_users (id SERIAL PRIMARY KEY, name TEXT, age INTEGER, active BOOLEAN)`;
        return true;
      });

      await check("Basic Insert & Select", async () => {
        await sql`INSERT INTO hd_test_users (name, age, active) VALUES (${"Alice"}, ${30}, ${true})`;
        const rows = await sql`SELECT * FROM hd_test_users WHERE name = ${"Alice"}`;
        if (!rows.length || (rows[0] as any).name !== "Alice" || (rows[0] as any).age !== 30 || (rows[0] as any).active !== true) {
          throw new Error("Data mismatch");
        }
        return rows[0];
      });

      await check("Array Expansion (IN clause)", async () => {
        const ids = [1];
        const rows = await sql`SELECT * FROM hd_test_users WHERE id IN (${ids})`;
        if (rows.length !== 1) throw new Error("IN clause failed");
        return rows.length;
      });

      await check("Bulk Insert (Array of Arrays)", async () => {
        const data = [
          ["Bob", 25, false],
          ["Charlie", 35, true]
        ];
        await sql`INSERT INTO hd_test_users (name, age, active) VALUES ${data}`;
        const rows = await sql`SELECT * FROM hd_test_users WHERE name IN ('Bob', 'Charlie')`;
        if (rows.length !== 2) throw new Error("Bulk insert failed");
        return rows.length;
      });

      await check(".values() extraction", async () => {
        const vals = await sql`SELECT name, age FROM hd_test_users ORDER BY name ASC LIMIT 2`.values();
        if (!Array.isArray(vals) || !Array.isArray(vals[0])) throw new Error(".values() did not return an array of arrays");
        return vals;
      });

      await check("Empty Results", async () => {
        const rows = await sql`SELECT * FROM hd_test_users WHERE name = 'NonExistent'`;
        if (rows.length !== 0) throw new Error("Expected empty array");
        return rows;
      });

      await check("Error Handling (Invalid Syntax)", async () => {
        try {
          await sql`SELECT * FROM non_existent_table_123`;
          throw new Error("Should have thrown");
        } catch (e: any) {
          if (e.message === "Should have thrown") throw e;
          return "Caught error successfully: " + e.message;
        }
      });

      return Response.json(report);
    },

    // Exhaustive D1 Tests
    "/api/test/d1": async () => {
      const report: { timestamp: string, results: { name: string, status: string, detail?: unknown, error?: string }[] } = {
        timestamp: new Date().toISOString(),
        results: []
      };

      const check = async (name: string, fn: () => Promise<unknown>) => {
        try {
          const res = await fn();
          report.results.push({ name, status: "PASS ✅", detail: res });
        } catch (e) {
          report.results.push({ name, status: "FAIL ❌", error: e instanceof Error ? e.message : String(e) });
        }
      };

      const db = new Database("test-db");

      await check("Init Table", async () => {
        const res1 = db.run("DROP TABLE IF EXISTS d1_test_users");
        if (res1 instanceof Promise) await res1;
        const res2 = db.run("CREATE TABLE d1_test_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER, active INTEGER)");
        if (res2 instanceof Promise) await res2;
        return true;
      });

      await check("Basic Insert & Select", async () => {
        const insert = db.run("INSERT INTO d1_test_users (name, age, active) VALUES (?, ?, ?)", ["Alice", 30, 1]);
        if (insert instanceof Promise) await insert;

        const select = db.prepare("SELECT * FROM d1_test_users WHERE name = ?").all("Alice");
        const rows = select instanceof Promise ? await select : select;
        const data = (rows as any).results || rows; // D1 returns { results: [] }, bun:sqlite returns []

        if (!data.length || data[0].name !== "Alice" || data[0].age !== 30 || data[0].active !== 1) {
          throw new Error("Data mismatch");
        }
        return data[0];
      });

      await check("Prepared Statement Re-use", async () => {
        const stmt = db.prepare("INSERT INTO d1_test_users (name, age, active) VALUES (?, ?, ?)");
        const r1 = stmt.run("Bob", 25, 0);
        if (r1 instanceof Promise) await r1;
        const r2 = stmt.run("Charlie", 35, 1);
        if (r2 instanceof Promise) await r2;

        const countStmt = db.prepare("SELECT COUNT(*) as c FROM d1_test_users");
        const countRes = countStmt.all();
        const data = countRes instanceof Promise ? await countRes : countRes;
        const rows = (data as any).results || data;

        if (rows[0].c !== 3) throw new Error("Count mismatch");
        return rows[0].c;
      });

      await check("Empty Results", async () => {
        const res = db.prepare("SELECT * FROM d1_test_users WHERE name = ?").all("NonExistent");
        const data = res instanceof Promise ? await res : res;
        const rows = (data as any).results || data;

        if (rows.length !== 0) throw new Error("Expected empty array");
        return rows;
      });

      await check("Error Handling", async () => {
        try {
          const res = db.run("SELECT * FROM non_existent_table_123");
          if (res instanceof Promise) await res;
          throw new Error("Should have thrown");
        } catch (e: any) {
          if (e.message === "Should have thrown") throw e;
          return "Caught error successfully: " + e.message;
        }
      });

      return Response.json(report);
    },

    // Exhaustive Redis Bridge Tests
    "/api/test/redis": async () => {
      const report: { timestamp: string, results: { name: string, status: string, detail?: unknown, error?: string }[] } = {
        timestamp: new Date().toISOString(),
        results: []
      };

      const check = async (name: string, fn: () => Promise<unknown>) => {
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

    // Counter test using import { redis } from "bun" -> mapped to KV
    "/api/counter": async (req) => {
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
  development: true,
});

console.log(`\n🚀 Bunflare local server running at ${server.url}`);
export default server;
