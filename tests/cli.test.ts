import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "bun";

const TEST_DIR = join(process.cwd(), "tests/tmp-project");
const CLI_PATH = join(process.cwd(), "plugin/src/cli/index.ts");

describe("Bunflare CLI", () => {
  beforeAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  test("init command scaffolds project correctly", () => {
    console.log("Running init...");
    const result = spawnSync(["bun", CLI_PATH, "init", "--quiet"], {
      cwd: TEST_DIR,
      env: { ...process.env, BUNFLARE_SKIP_INSTALL: "true" },
      stdin: "inherit" // Try to avoid hang
    });

    console.log("Init exit code:", result.exitCode);
    if (!result.success) {
      console.error("STDOUT:", result.stdout.toString());
      console.error("STDERR:", result.stderr.toString());
    }

    expect(result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, "bunflare.config.ts"))).toBe(true);
  }, 20000);

  test("build command generates dist artifacts", () => {
    console.log("Running build...");
    const result = spawnSync(["bun", CLI_PATH, "build"], {
      cwd: TEST_DIR,
      env: { ...process.env, NODE_ENV: "production" }
    });

    console.log("Build exit code:", result.exitCode);
    if (!result.success) {
      console.error("BUILD STDOUT:", result.stdout.toString());
      console.error("BUILD STDERR:", result.stderr.toString());
    }
    expect(result.success).toBe(true);
    expect(existsSync(join(TEST_DIR, "dist/index.js"))).toBe(true);
  }, 20000);
});
