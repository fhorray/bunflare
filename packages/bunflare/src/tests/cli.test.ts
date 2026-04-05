import { describe, expect, it, afterAll } from "bun:test";
import { spawnSync } from "bun";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

describe("CLI Integration", () => {
    const testDir = join(tmpdir(), `test-cli-${Date.now()}`);
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });

    // Setup a minimal project
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(srcDir, "index.ts"), `
        import { serve } from "bun";
        serve({
            fetch(req) {
                return new Response("Hello CLI");
            }
        });
    `);

    writeFileSync(join(testDir, "bunflare.config.ts"), `
        export default {
            workerName: "cli-test",
            entrypoint: "./src/index.ts",
            outdir: "./dist",
            external: ["bunflare"]
        };
    `);

    // Path to the CLI
    const cliPath = join(import.meta.dir, "../cli/index.ts");

    it("should run 'build' successfully", () => {
        const result = spawnSync(["bun", cliPath, "build"], {
            cwd: testDir,
            env: { ...process.env, NODE_ENV: "production" }
        });

        const stdout = result.stdout.toString();

        expect(stdout).toContain("[bunflare] 📦 Building 1 entries to ./dist");

        if (result.exitCode === 0) {
            expect(stdout).toContain("[bunflare] ✨ Build successful!");
            expect(existsSync(join(testDir, "dist/index.js"))).toBe(true);
        } else {
            console.error(result.stderr.toString());
        }
    });

    it("should show help with 'bunflare' name", () => {
        const result = spawnSync(["bun", cliPath, "--help"], {
            cwd: testDir
        });
        const output = result.stdout.toString();
        expect(output).toContain("bunflare - CLI para Build");
        expect(output).toContain("bunx bunflare <comando>");
    });

    afterAll(() => {
        rmSync(testDir, { recursive: true, force: true });
    });
});
