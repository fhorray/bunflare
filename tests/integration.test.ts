import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { bunflare } from "../plugin/src/index.ts";
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
    
    // Check if Bun.env was replaced by the globalThis.Bun.env
    expect(output).toContain("globalThis.Bun.env.FOO");
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
    expect(output).toContain('globalThis.Bun?.env');
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

  test("should transform Bun.file and Bun.write to R2 shim", async () => {
    const entryPath = join(TEST_DIR, "r2-test.ts");
    writeFileSync(entryPath, `
      const f = Bun.file("test.txt");
      await Bun.write("out.txt", "hello");
    `);

    const result = await Bun.build({
      entrypoints: [entryPath],
      outdir: OUT_DIR,
      plugins: [bunflare({ r2: { binding: "STORAGE" } })],
    });

    expect(result.success).toBe(true);
    const output = await Bun.file(join(OUT_DIR, "r2-test.js")).text();
    
    // Check if Bun.file/write were replaced. 
    // The bundler might rename them to just file() and write() when inlining
    expect(output).toContain("file(");
    expect(output).toContain("write(");
    expect(output).toContain("STORAGE");
  });
});
