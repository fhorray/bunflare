import { expect, test, describe } from "bun:test";
import { createSQL } from "../plugin/shims/d1/logic.ts";

// Mock implementation for the test environment
const createMockDB = () => ({
  prepare: (query: string) => ({
    bind: (...params: any[]) => ({
      all: async () => ({
        results: [{ id: 1, name: "Alice", email: "a@a.com" }],
        success: true
      }),
      run: async () => ({ success: true })
    })
  })
});

describe("Bun.sql Logic (Direct Test)", () => {
  test("should parse simple tagged templates", async () => {
    const mockDB = createMockDB();
    (globalThis as any).__BUNFLARE_TEST_ENV__ = { DB: mockDB };

    const sql = createSQL("DB");
    const name = "Alice";
    const query = sql`SELECT * FROM users WHERE name = ${name}`;

    // Internal check of the SQLQuery state
    expect((query as any).text).toBe("SELECT * FROM users WHERE name = ?");
    expect((query as any).params).toEqual(["Alice"]);

    const results = await query;
    expect(results).toEqual([{ id: 1, name: "Alice", email: "a@a.com" }]);
  });

  test("should handle multiple parameters", async () => {
    const sql = createSQL("DB");
    const query = sql`INSERT INTO users (id, name) VALUES (${1}, ${"Bob"})`;

    expect((query as any).text).toBe("INSERT INTO users (id, name) VALUES (?, ?)");
    expect((query as any).params).toEqual([1, "Bob"]);
  });

  test("should support SQL fragments (composition)", async () => {
    const sql = createSQL("DB");
    const table = sql("users"); // fragment
    const query = sql`SELECT * FROM ${table} WHERE id = ${5}`;

    expect((query as any).text).toBe("SELECT * FROM users WHERE id = ?");
    expect((query as any).params).toEqual([5]);
  });

  test("should handle array expansion for IN clauses", async () => {
    const sql = createSQL("DB");
    const ids = [1, 2, 3];
    const query = sql`SELECT * FROM users WHERE id IN (${ids})`;

    expect((query as any).text).toBe("SELECT * FROM users WHERE id IN (?, ?, ?)");
    expect((query as any).params).toEqual([1, 2, 3]);
  });

  test("should implement .values() correctly", async () => {
    const mockDB = createMockDB();
    (globalThis as any).__BUNFLARE_TEST_ENV__ = { DB: mockDB };

    const sql = createSQL("DB");
    const query = sql`SELECT id, name FROM users`;
    const rows = await query.values();

    // Mock returns [{ id: 1, name: "Alice", email: "a@a.com" }]
    expect(rows).toEqual([[1, "Alice", "a@a.com"]]);
  });

  test("should be lazy (does not throw on creation if env is missing)", async () => {
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {};

    const sql = createSQL("DB");
    const query = sql`SELECT 1`;

    // Only execution should throw
    try {
      await query;
      expect().fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).toContain("not found in Bun.env");
    }
  });

  test("sql.unsafe() should work as a fragment", () => {
    const sql = createSQL("DB");
    const fragment = (sql as any).unsafe("id, name");
    const query = sql`SELECT ${fragment} FROM users`;

    expect((query as any).text).toBe("SELECT id, name FROM users");
    expect((query as any).params).toEqual([]);
  });
});
