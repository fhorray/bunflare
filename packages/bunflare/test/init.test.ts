import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { runInit } from "../src/cli/init";
import path from "node:path";
import { rmSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

describe("bunflare init integration", () => {
  const testDir = path.resolve(import.meta.dir, "temp-init");

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(path.resolve(import.meta.dir, ".."));
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  test("generates basic wrangler.jsonc and bunflare.config.ts with --yes", async () => {
    writeFileSync(path.join(testDir, "package.json"), JSON.stringify({ name: "test-worker" }));
    await runInit({ yes: true });

    expect(existsSync(path.join(testDir, "wrangler.jsonc"))).toBe(true);
    expect(existsSync(path.join(testDir, "bunflare.config.ts"))).toBe(true);

    const wrangler = JSON.parse(readFileSync(path.join(testDir, "wrangler.jsonc"), "utf-8"));
    const pkg = JSON.parse(readFileSync(path.join(testDir, "package.json"), "utf-8"));

    expect(wrangler.name).toBe("test-worker");
    expect(pkg.scripts.dev).toBe("bunflare dev");
    expect(pkg.scripts.deploy).toBe("bunflare deploy");
  });

  test("does not overwrite existing wrangler.jsonc", async () => {
    const existingContent = "// existing content";
    writeFileSync(path.join(testDir, "wrangler.jsonc"), existingContent);
    await runInit({ yes: true });
    expect(readFileSync(path.join(testDir, "wrangler.jsonc"), "utf-8")).toBe(existingContent);
  });

  test("detects entry points correctly", async () => {
    mkdirSync(path.join(testDir, "src"), { recursive: true });
    writeFileSync(path.join(testDir, "src/main.ts"), "");
    await runInit({ yes: true });
    expect(readFileSync(path.join(testDir, "bunflare.config.ts"), "utf-8")).toContain('entrypoint: "./src/main.ts"');
  });

  test("detects tailwind plugin", async () => {
    writeFileSync(path.join(testDir, "package.json"), JSON.stringify({
      devDependencies: { "bun-plugin-tailwind": "latest" }
    }));
    await runInit({ yes: true });
    expect(readFileSync(path.join(testDir, "bunflare.config.ts"), "utf-8")).toContain('import tailwind from "bun-plugin-tailwind";');
  });
});
