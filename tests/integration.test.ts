import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { bunflare } from "../plugin/index.ts";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(import.meta.dir, "fixtures");
const OUT_DIR = join(import.meta.dir, "out");

describe("bunflare integration tests", () => {
  beforeAll(() => {
    try {
      mkdirSync(TEST_DIR, { recursive: true });
      mkdirSync(OUT_DIR, { recursive: true });
    } catch (e) {}
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    rmSync(OUT_DIR, { recursive: true, force: true });
  });

  test("should transform Bun.env to globalThis.env proxy", async () => {
    const entryPath = join(TEST_DIR, "env-test.ts");
    writeFileSync(entryPath, 'console.log(Bun.env.FOO);');

    const result = await Bun.build({
      entrypoints: [entryPath],
      outdir: OUT_DIR,
      plugins: [bunflare({ env: true })],
    });

    expect(result.success).toBe(true);
    const output = await Bun.file(join(OUT_DIR, "env-test.js")).text();
    
    // Check if Bun.env was replaced by the proxy-based shim
    expect(output).toContain("envProxy");
    expect(output).toContain("globalThis.env");
    expect(output).not.toContain("Bun.env.FOO");
  });

  test("should shim bun:sqlite to virtual module", async () => {
    const entryPath = join(TEST_DIR, "sqlite-test.ts");
    writeFileSync(entryPath, 'import { Database } from "bun:sqlite"; const db = new Database("test.db");');

    const result = await Bun.build({
      entrypoints: [entryPath],
      outdir: OUT_DIR,
      plugins: [bunflare({ sqlite: { binding: "MY_D1" } })],
    });

    expect(result.success).toBe(true);
    const output = await Bun.file(join(OUT_DIR, "sqlite-test.js")).text();
    
    // The output should contain the shimmed Database implementation
    expect(output).toContain('class Database');
    expect(output).toContain('"MY_D1"');
    expect(output).toContain('env["MY_D1"]');
  });

  test("should inject preamble for Bun.password", async () => {
    const entryPath = join(TEST_DIR, "crypto-test.ts");
    writeFileSync(entryPath, 'const h = await Bun.password.hash("test");');

    const result = await Bun.build({
      entrypoints: [entryPath],
      outdir: OUT_DIR,
      plugins: [bunflare()],
    });

    expect(result.success).toBe(true);
    const output = await Bun.file(join(OUT_DIR, "crypto-test.js")).text();
    
    // Check for the injected preamble (import)
    // Note: The bundler might inline the virtual module contents
    expect(output).toContain('password');
    expect(output).toContain('crypto.subtle.digest');
  });
});
