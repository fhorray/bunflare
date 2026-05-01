import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const TEST_ROOT = join(process.cwd(), "tests/tmp-cli-test");
const BIN_PATH = join(process.cwd(), "plugin/src/cli/index.ts");

describe("Bunflare CLI", () => {
  beforeAll(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  describe("init command", () => {
    const INIT_DIR = join(TEST_ROOT, "init-test");

    beforeAll(() => {
      if (existsSync(INIT_DIR)) rmSync(INIT_DIR, { recursive: true, force: true });
      mkdirSync(INIT_DIR, { recursive: true });
    });

    test("should initialize a new project from scratch", () => {
      const result = spawnSync("bun", [BIN_PATH, "init"], {
        cwd: INIT_DIR,
        encoding: "utf8",
        env: { ...process.env, SKIP_INSTALL: "true" } // We might want to skip actual npm install in tests
      });

      expect(existsSync(join(INIT_DIR, "package.json"))).toBe(true);
      expect(existsSync(join(INIT_DIR, "bunflare.config.ts"))).toBe(true);
      expect(existsSync(join(INIT_DIR, "global.d.ts"))).toBe(true);
      expect(existsSync(join(INIT_DIR, "wrangler.jsonc"))).toBe(true);
      expect(existsSync(join(INIT_DIR, "src/index.ts"))).toBe(true);

      const pkg = JSON.parse(readFileSync(join(INIT_DIR, "package.json"), "utf-8"));
      expect(pkg.scripts.dev).toBe("bunflare dev");
    });

    test("should patch existing index.ts with export default", () => {
      const PATCH_DIR = join(TEST_ROOT, "patch-test");
      mkdirSync(PATCH_DIR, { recursive: true });
      mkdirSync(join(PATCH_DIR, "src"), { recursive: true });
      
      const originalContent = 'const server = Bun.serve({ fetch: () => new Response("OK") });';
      writeFileSync(join(PATCH_DIR, "src/index.ts"), originalContent);

      spawnSync("bun", [BIN_PATH, "init"], {
        cwd: PATCH_DIR,
        encoding: "utf8",
      });

      const patchedContent = readFileSync(join(PATCH_DIR, "src/index.ts"), "utf-8");
      expect(patchedContent).toContain("export default server;");
    });
  });

  describe("build command", () => {
    const BUILD_DIR = join(TEST_ROOT, "build-test");

    beforeAll(() => {
      if (existsSync(BUILD_DIR)) rmSync(BUILD_DIR, { recursive: true, force: true });
      mkdirSync(BUILD_DIR, { recursive: true });
      
      writeFileSync(join(BUILD_DIR, "index.ts"), 'export default Bun.serve({ fetch: () => new Response("OK") });');
      writeFileSync(join(BUILD_DIR, "bunflare.config.ts"), 'export default { entrypoint: "./index.ts" };');
    });

    test("should build successfully", () => {
      const result = spawnSync("bun", [BIN_PATH, "build"], {
        cwd: BUILD_DIR,
        encoding: "utf8",
      });

      expect(result.status).toBe(0);
      expect(existsSync(join(BUILD_DIR, "dist/index.js"))).toBe(true);
    });

    test("should fail if export default is missing", () => {
      writeFileSync(join(BUILD_DIR, "no-export.ts"), 'Bun.serve({ fetch: () => {} });');
      writeFileSync(join(BUILD_DIR, "bunflare.config.ts"), 'export default { entrypoint: "./no-export.ts" };');

      const result = spawnSync("bun", [BIN_PATH, "build"], {
        cwd: BUILD_DIR,
        encoding: "utf8",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Fatal Error");
    });
  });
});
