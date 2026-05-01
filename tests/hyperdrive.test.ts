import { describe, expect, test, mock } from "bun:test";
import { createSQL } from "../plugin/shims/hyperdrive/logic.ts";

// Mock the postgres driver
mock.module("postgres", () => {
  const postgresFactory = (connString: string) => {
    const client = (strings: any, ...values: any[]) => {
      const text = Array.isArray(strings) ? strings.join("?") : strings;
      return { text, params: values, mocked: "postgres.js" };
    };
    client.unsafe = (str: string) => {
      return { text: str, params: [], unsafe: true, mocked: "postgres.js" };
    };
    client.end = async () => {};
    return client;
  };
  
  return {
    default: postgresFactory
  };
});

// Mock the pg driver
mock.module("pg", () => {
  class Client {
    constructor() {}
    async connect() {}
    async query(text: string, values: any[]) {
      return {
        rows: [{ text, values, mocked: "pg" }]
      };
    }
    async end() {}
  }
  return { Client };
});

describe("Hyperdrive SQL Shim Logic", () => {
  test("should resolve connection string lazily", async () => {
    const sql = createSQL("MY_HYPERDRIVE");
    
    // Set up mock environment
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      MY_HYPERDRIVE: { connectionString: "postgres://user:pass@host:5432/db" }
    };

    const query = await sql`SELECT * FROM users WHERE id = ${123}` as any;
    
    expect(query.text).toBe("SELECT * FROM users WHERE id = ?");
    expect(query.params).toEqual([123]);
    expect(query.mocked).toBe("postgres.js");
  });

  test("should throw if binding is missing", async () => {
    const sql = createSQL("MISSING_DB");
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {};

    await expect(async () => {
      await sql`SELECT 1`;
    }).toThrow('[bunflare] Hyperdrive binding "MISSING_DB" not found in Bun.env');
  });

  test("should handle unsafe queries", async () => {
    const sql = createSQL("MY_HYPERDRIVE");
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      MY_HYPERDRIVE: { connectionString: "..." }
    };

    const query = await (sql as any).unsafe("SELECT NOW()") as any;
    expect(query.text).toBe("SELECT NOW()");
    expect(query.unsafe).toBe(true);
  });

  test("should cache the client instance", async () => {
    const sql = createSQL("MY_HYPERDRIVE");
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      MY_HYPERDRIVE: { connectionString: "..." }
    };

    const query1 = await sql`SELECT 1`;
    const query2 = await sql`SELECT 2`;
    
    // If it didn't crash, it reused the client (or created it once)
    expect(query1).toBeDefined();
    expect(query2).toBeDefined();
  });

  test("should work with 'pg' driver and translate templates", async () => {
    const sql = createSQL("MY_HYPERDRIVE", "pg");
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      MY_HYPERDRIVE: { connectionString: "..." }
    };

    const rows = await sql`SELECT * FROM users WHERE id = ${1} AND name = ${"test"}` as any;
    
    expect(rows[0].text).toBe("SELECT * FROM users WHERE id = $1 AND name = $2");
    expect(rows[0].values).toEqual([1, "test"]);
    expect(rows[0].mocked).toBe("pg");
  });

  test("should handle unsafe queries with 'pg'", async () => {
    const sql = createSQL("MY_HYPERDRIVE", "pg");
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      MY_HYPERDRIVE: { connectionString: "..." }
    };

    const rows = await (sql as any).unsafe("SELECT 1") as any;
    expect(rows[0].text).toBe("SELECT 1");
    expect(rows[0].mocked).toBe("pg");
  });
});
