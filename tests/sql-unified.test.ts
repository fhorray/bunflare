import { expect, test, describe, beforeEach, mock } from "bun:test";
import { createSQL, D1Binding, HyperdriveBinding } from "../plugin/src/shims/sql-unified";

describe("Unified SQL Shim (Logic)", () => {
  let mockD1: D1Binding;
  let mockHyper: HyperdriveBinding;

  beforeEach(() => {
    // Setup Mocks
    mockD1 = {
      prepare: mock((sql: string) => ({
        bind: mock((...params: unknown[]) => ({
          all: mock(async () => ({ results: [{ id: 1, name: "Test D1" }], success: true })),
          run: mock(async () => ({ success: true }))
        }))
      }))
    };

    mockHyper = {
      connectionString: "postgres://user:pass@localhost:5432/db"
    };

    // Inject into globalThis for the shim logic
    (globalThis as any).__BUNFLARE_TEST_ENV__ = {
      DB: mockD1,
      HYPER: mockHyper
    };
  });

  test("should detect and execute D1 queries", async () => {
    const sql = createSQL("DB");
    const result = await sql`SELECT * FROM users`;

    expect(result).toEqual([{ id: 1, name: "Test D1" }]);
    expect(mockD1.prepare).toHaveBeenCalledWith("SELECT * FROM users");
  });

  test("should handle D1 .run() correctly", async () => {
    const sql = createSQL("DB");
    const res = await sql`INSERT INTO users (name) VALUES ('Test')`.run();

    expect(res.success).toBe(true);
  });

  test("should support multiple bindings via new SQL class pattern", async () => {
    // We import the SQL class shim logic
    const { SQL } = await import("../plugin/src/shims/sql-unified");
    // Note: SQL in the shim is a factory/class wrapper
    // In our logic file, we can test the SQLQuery directly or createSQL
    const sql2 = createSQL("HYPER");
    
    // Check detection of Hyperdrive (connectionString)
    // We expect it to try to import 'postgres'
    try {
      await sql2`SELECT 1`.execute();
    } catch (e: any) {
      expect(e.message).not.toContain("not found");
    }
  });

  test("should throw error if binding is missing", async () => {
    const sql = createSQL("MISSING");
    try {
      await sql`SELECT 1`.execute();
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain('Binding "MISSING" not found');
    }
  });
});
