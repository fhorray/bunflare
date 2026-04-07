import { expect, test, describe, afterEach } from "bun:test";
import { runInit } from "../src/cli/init";
import path from "node:path";
import { rmSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

describe("bunflare init integration", () => {
    // Unique test directory for each test ensures no parallel interference.
    const getTestDir = (name: string) => path.join(import.meta.dir, `tmp-init-${name}-${Math.random().toString(36).slice(2, 7)}`);

  test("generates basic wrangler.jsonc and bunflare.config.ts with --yes", async () => {
    const testDir = getTestDir("basic");
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });

    try {
      writeFileSync(path.join(testDir, "package.json"), JSON.stringify({ name: "test-worker" }));
      await runInit({ yes: true, rootDir: testDir });

      expect(existsSync(path.join(testDir, "wrangler.jsonc"))).toBe(true);
      expect(existsSync(path.join(testDir, "bunflare.config.ts"))).toBe(true);

      const wrangler = JSON.parse(readFileSync(path.join(testDir, "wrangler.jsonc"), "utf-8"));
      const pkg = JSON.parse(readFileSync(path.join(testDir, "package.json"), "utf-8"));

      expect(wrangler.name).toBe("test-worker");
      expect(pkg.scripts.dev).toBe("bunflare dev");
      expect(pkg.scripts.deploy).toBe("bunflare deploy");
    } finally {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("does not overwrite existing wrangler.jsonc", async () => {
    const testDir = getTestDir("overwrite");
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });

    try {
      const existingContent = "// existing content";
      writeFileSync(path.join(testDir, "wrangler.jsonc"), existingContent);
      await runInit({ yes: true, rootDir: testDir });
      expect(readFileSync(path.join(testDir, "wrangler.jsonc"), "utf-8")).toBe(existingContent);
    } finally {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("detects entry points correctly", async () => {
    const testDir = getTestDir("entry");
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });

    try {
      mkdirSync(path.join(testDir, "src"), { recursive: true });
      writeFileSync(path.join(testDir, "src/main.ts"), "");
      await runInit({ yes: true, rootDir: testDir });
      expect(readFileSync(path.join(testDir, "bunflare.config.ts"), "utf-8")).toContain('entrypoint: "./src/main.ts"');
    } finally {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("detects tailwind plugin", async () => {
    const testDir = getTestDir("tailwind");
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });

    try {
      writeFileSync(path.join(testDir, "package.json"), JSON.stringify({
        devDependencies: { "bun-plugin-tailwind": "latest" }
      }));
      await runInit({ yes: true, rootDir: testDir });
      expect(readFileSync(path.join(testDir, "bunflare.config.ts"), "utf-8")).toContain('import tailwind from "bun-plugin-tailwind";');
    } finally {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    }
  });
});
