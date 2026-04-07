import { expect, test, describe, mock } from "bun:test";
import path from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

// Mock @clack/prompts to avoid interactivity during tests
mock.module("@clack/prompts", () => ({
  intro: () => {},
  outro: () => {},
  log: {
    step: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    success: () => {},
  },
  spinner: () => ({
    start: () => {},
    stop: () => {},
    message: () => {},
  }),
  confirm: () => Promise.resolve(false),
  select: () => Promise.resolve(""),
  multiselect: () => Promise.resolve([]),
  text: () => Promise.resolve(""),
  isCancel: () => false,
}));

// Mock Provisioner to avoid network calls
mock.module("../src/cli/provisioner", () => ({
  Provisioner: class {
    constructor() {}
    async ensureAccountID() { return "test-account-id"; }
    async getInconsistencyReport() { return []; }
  }
}));

// Mock spawnSync to simulate successful login
mock.module("node:child_process", () => ({
  spawnSync: (cmd: string, args: string[]) => {
    if (args.includes("whoami")) return { status: 0, stdout: "Logged in as test@example.com" };
    return { status: 0, stdout: "" };
  },
  spawn: () => ({ on: () => {} }),
}));

import { runDoctor } from "../src/cli/doctor";

describe("Doctor Command Diagnostics", () => {
    
  const getTestRoot = () => path.join(import.meta.dir, `tmp-doctor-test-${Math.random().toString(36).slice(2, 7)}`);

  test("should detect missing build command in wrangler.jsonc", async () => {
    const testRoot = getTestRoot();
    if (existsSync(testRoot)) rmSync(testRoot, { recursive: true, force: true });
    mkdirSync(testRoot, { recursive: true });

    try {
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

      // Robust output capture via console.log interception
      let detectedIncorrectBuild = false;
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        const msg = args.join(" ").replace(/\u001b\[[0-9;]*[a-zA-Z]/g, ""); // Strip ANSI colors
        if (msg.includes("Incorrect build command") || (msg.includes("Expected") && msg.includes("bunflare build"))) {
            detectedIncorrectBuild = true;
        }
      };

      try {
        // Mock process.exit
        const originalExit = process.exit;
        (process as any).exit = () => {};
        
        await runDoctor({ rootDir: testRoot });
        
        (process as any).exit = originalExit;
      } finally {
        console.log = originalLog;
      }

      expect(detectedIncorrectBuild).toBe(true);
    } finally {
      if (existsSync(testRoot)) rmSync(testRoot, { recursive: true, force: true });
    }
  }, 10000); // 10s timeout
});
