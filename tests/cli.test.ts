import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";

const TEST_PROJECT_DIR = join(process.cwd(), "tests/tmp-cli-test");
const BIN_PATH = join(process.cwd(), "plugin/bin.ts");

describe("Bunflare CLI", () => {
  beforeAll(() => {
    if (existsSync(TEST_PROJECT_DIR)) {
      rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  });

  afterAll(() => {
    // rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  });

  test("should fail if bunflare.config.ts is missing", () => {
    const result = spawnSync("bun", [BIN_PATH, "build"], {
      cwd: TEST_PROJECT_DIR,
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("bunflare.config.ts not found");
  });

  test("should build successfully with valid config", () => {
    // Create mock project files
    writeFileSync(join(TEST_PROJECT_DIR, "index.ts"), 'console.log("Hello Worker");');
    mkdirSync(join(TEST_PROJECT_DIR, "public"), { recursive: true });
    writeFileSync(join(TEST_PROJECT_DIR, "public/index.html"), "<html><body>Hello</body></html>");
    
    writeFileSync(join(TEST_PROJECT_DIR, "bunflare.config.ts"), `
      export default {
        entrypoint: "./index.ts",
        frontend: {
          entrypoint: "./public/index.html",
          outdir: "./dist/public"
        }
      };
    `);

    const result = spawnSync("bun", [BIN_PATH, "build"], {
      cwd: TEST_PROJECT_DIR,
      encoding: "utf8",
    });

    console.log(result.stdout);
    console.log(result.stderr);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("build successful");
    
    // Verify outputs
    expect(existsSync(join(TEST_PROJECT_DIR, "dist/index.js"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_DIR, "dist/public/index.html"))).toBe(true);
  });

  test("should handle build errors gracefully", () => {
    // Create invalid TS file
    writeFileSync(join(TEST_PROJECT_DIR, "index.ts"), 'const a: string = 123; // Error');
    
    const result = spawnSync("bun", [BIN_PATH, "build"], {
      cwd: TEST_PROJECT_DIR,
      encoding: "utf8",
    });

    // Note: Bun.build might not fail for type errors if not configured, 
    // but syntax errors will.
    writeFileSync(join(TEST_PROJECT_DIR, "index.ts"), 'invalid syntax !!!');
    
    const result2 = spawnSync("bun", [BIN_PATH, "build"], {
      cwd: TEST_PROJECT_DIR,
      encoding: "utf8",
    });

    expect(result2.status).toBe(1);
    const hasError = result2.stderr.includes("Backend build failed") || 
                     result2.stderr.includes("Bundle failed") ||
                     result2.stderr.includes("Build crashed");
    expect(hasError).toBe(true);
  });
});
