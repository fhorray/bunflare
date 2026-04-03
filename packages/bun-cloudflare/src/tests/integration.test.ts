import { expect, test, describe } from "bun:test";
import { transformServe } from "../transforms/serve-transform";
import { transformSqlite } from "../transforms/sqlite-transform";
import { transformEnv } from "../transforms/env-transform";
import { transformFileIO } from "../transforms/file-io-transform";
import { transformSecondary } from "../transforms/secondary-transform";

describe("Integration Transformations", () => {
  test("Fullstack Server Transformation (Bun v1.2.3 routes)", () => {
    const source = `
import { Database } from "bun:sqlite";
const db = new Database("DB");
const appName = Bun.env.APP_NAME;

Bun.serve({
  routes: {
    "/": "<h1>Home</h1>",
    "/api/users": {
      GET: async (req) => Response.json(await db.query("SELECT * FROM users").all()),
      POST: async (req) => {
        const data = await req.json();
        await db.query("INSERT INTO users (name) VALUES (?)").run(data.name);
        return new Response("Created", { status: 201 });
      }
    }
  },
  fetch(req) {
    return new Response("Fallback");
  }
});
    `;

    let transformed = source;
    transformed = transformServe(transformed);
    transformed = transformSqlite(transformed);
    transformed = transformEnv(transformed);

    // Verify key elements
    expect(transformed).toContain('export default {');
    expect(transformed).toContain('async fetch(request, env, ctx)');
    expect(transformed).toContain('setBunCloudflareContext({');
    expect(transformed).toContain('await db.query("SELECT * FROM users").all()');
    expect(transformed).toContain('await db.query("INSERT INTO users (name) VALUES (?)").run(data.name)');
    expect(transformed).toContain('getBunCloudflareContext().env.APP_NAME');
    
    // Check for syntax errors (basic check)
    expect(transformed).not.toContain('dawait');
    expect(transformed).not.toContain(';;');
  });

  test("Variable instance of Database and complex query chain", () => {
    const source = `
import { Database } from "bun:sqlite";
const sqlite = new Database(":memory:");
const result = sqlite.query("SELECT 1").get();
sqlite.exec("PRAGMA journal_mode = WAL");
    `;
    const transformed = transformSqlite(source);
    expect(transformed).toContain('await sqlite.query("SELECT 1").get()');
    expect(transformed).toContain('await sqlite.exec("PRAGMA journal_mode = WAL")');
  });

  test("Environment variable patterns", () => {
    const source = `
const a = Bun.env.KEY;
const b = process.env["OTHER_KEY"];
const c = Bun.env["NESTED_KEY"];
    `;
    const transformed = transformEnv(source);
    expect(transformed).toContain('const a = getBunCloudflareContext().env.KEY');
    expect(transformed).toContain('const b = getBunCloudflareContext().env["OTHER_KEY"]');
    expect(transformed).toContain('const c = getBunCloudflareContext().env["NESTED_KEY"]');
  });

  test("File I/O and Secondary transforms (Redis)", () => {
    const source = `
await Bun.write("test.txt", "data");
const f = Bun.file("test.txt");
await Bun.redis.set("key", "val");
    `;
    let transformed = source;
    transformed = transformFileIO(transformed);
    transformed = transformSecondary(transformed);
    
    expect(transformed).toContain('import { file as __bunFile, write as __bunWrite } from "bun-cloudflare/shims/file-io"');
    expect(transformed).toContain('import { redis } from "bun-cloudflare/shims/redis"');
    expect(transformed).toContain('await __bunWrite("test.txt", "data")');
    expect(transformed).toContain('const f = __bunFile("test.txt")');
    expect(transformed).toContain('await redis.set("key", "val")');
  });

  test("Balanced parenthesis in nested closures", () => {
    const source = `
Bun.serve({
  fetch(req) {
    const helper = (x) => {
      console.log(x);
      return x * 2;
    };
    return new Response(helper(10).toString());
  },
  port: 3000
});
    `;
    const transformed = transformServe(source);
    expect(transformed).toContain('export default {');
    expect(transformed).toContain('const $$options = {');
    expect(transformed).toContain('port: 3000');
    expect(transformed).toContain('return new Response(helper(10).toString())');
  });
});
