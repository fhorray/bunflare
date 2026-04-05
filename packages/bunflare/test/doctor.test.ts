import { expect, test, describe } from "bun:test";
import { runDoctor } from "../src/cli/doctor";
import path from "path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

describe("Doctor Command Diagnostics", () => {
  const testRoot = path.join(process.cwd(), "tmp-doctor-test");

  test("should detect missing build command in wrangler.jsonc", async () => {
    // Setup temporary test environment
    mkdirSync(testRoot, { recursive: true });
    const wranglerPath = path.join(testRoot, "wrangler.jsonc");
    const pkgPath = path.join(testRoot, "package.json");
    
    writeFileSync(wranglerPath, JSON.stringify({
      name: "test-worker",
      main: "dist/index.js"
      // Missing build
    }));
    
    writeFileSync(pkgPath, JSON.stringify({
      name: "test-app",
      dependencies: { "bunflare": "latest" }
    }));

    // We capture console.error
    const originalError = console.error;
    let errorCalled = false;
    console.error = (msg) => { 
      if (typeof msg === "string" && msg.includes("Missing build command")) errorCalled = true;
    };

    try {
      // Mock process.exit
      const originalExit = process.exit;
      (process as any).exit = () => {};
      
      await runDoctor({ rootDir: testRoot });
      
      (process as any).exit = originalExit;
    } finally {
      console.error = originalError;
      rmSync(testRoot, { recursive: true, force: true });
    }

    expect(errorCalled).toBe(true);
  }, 10000); // 10s timeout
});
