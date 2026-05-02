import { getUnifiedSqlShim } from "../plugin/src/shims/sql-unified.ts";

describe("Shim Generation", () => {
  test("getUnifiedSqlShim generates valid SQL shim", () => {
    const shim = getUnifiedSqlShim("MY_DB");

    expect(shim).toContain('export const sql = createSQL("MY_DB"');
    expect(shim).toContain('export const SQL = class');
    expect(shim).toContain('class SQLQuery');
  });
});
