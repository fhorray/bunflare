import { expect, test, describe } from "bun:test";
import { getSqlTagShim } from "../plugin/shims/d1/sql.ts";

describe("Shim Generation", () => {
  test("getSqlTagShim generates valid D1 SQL shim", () => {
    const shim = getSqlTagShim("MY_DB");

    expect(shim).toContain('export const sql = createSQL("MY_DB");');
    expect(shim).toContain('export const SQL = class');
    expect(shim).toContain('class SQLQuery');
    expect(shim).toContain('class SQLFragment');
  });
});
