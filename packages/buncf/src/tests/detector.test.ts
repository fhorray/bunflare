import { describe, expect, it } from "bun:test";
import { detectUsedBindings } from "../transforms/detector";

describe("detectUsedBindings", () => {
  it("should detect D1 (SQLite) with 'new Database('", () => {
    const source = 'const db = new Database("data.db");';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("d1")).toBe(true);
  });

  it("should detect D1 (SQLite) with 'bun:sqlite'", () => {
    const source = 'import { Database } from "bun:sqlite";';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("d1")).toBe(true);
  });

  it("should detect R2 (File I/O) with 'Bun.file('", () => {
    const source = 'const f = Bun.file("test.txt");';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("r2")).toBe(true);
  });

  it("should detect R2 (File I/O) with 'Bun.write('", () => {
    const source = 'await Bun.write("test.txt", "hello");';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("r2")).toBe(true);
  });

  it("should detect KV (Redis) with 'Bun.redis'", () => {
    const source = 'const redis = Bun.redis;';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("kv")).toBe(true);
  });

  it("should detect Environment Variables with 'Bun.env.'", () => {
    const source = 'const v = Bun.env.VAR;';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("vars")).toBe(true);
  });

  it("should detect Environment Variables with 'process.env.'", () => {
    const source = 'const v = process.env.VAR;';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("vars")).toBe(true);
  });

  it("should detect Environment Variables with 'Bun.env['", () => {
    const source = 'const v = Bun.env["VAR"];';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("vars")).toBe(true);
  });

  it("should detect Environment Variables with 'process.env['", () => {
    const source = 'const v = process.env["VAR"];';
    const bindings = detectUsedBindings(source);
    expect(bindings.has("vars")).toBe(true);
  });

  it("should detect multiple bindings", () => {
    const source = `
      import { Database } from "bun:sqlite";
      const f = Bun.file("test.txt");
      const v = Bun.env.VAR;
    `;
    const bindings = detectUsedBindings(source);
    expect(bindings.has("d1")).toBe(true);
    expect(bindings.has("r2")).toBe(true);
    expect(bindings.has("vars")).toBe(true);
    expect(bindings.size).toBe(3);
  });

  it("should return an empty set if no bindings are detected", () => {
    const source = 'console.log("Hello World");';
    const bindings = detectUsedBindings(source);
    expect(bindings.size).toBe(0);
  });
});
