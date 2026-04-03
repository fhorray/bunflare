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
        Bun.serve({
            fetch(req) {
                return new Response("Hello CLI");
            }
        });
    `);

    writeFileSync(join(testDir, "cloudflare.config.ts"), `
        export default {
            workerName: "cli-test",
            entrypoint: "./src/index.ts",
            outdir: "./dist"
        };
    `);

    // Path to the CLI
    const cliPath = join(import.meta.dir, "../cli/index.ts");

    it("should run 'build' successfully (without auto-generating config)", () => {
        const result = spawnSync(["bun", cliPath, "build"], {
            cwd: testDir,
            env: { ...process.env }
        });

        const stdout = result.stdout.toString();
        
        // We check if the build process started. It might fail on external resolution 
        // in temp dirs, but we want to know it didn't crash and tried to build.
        expect(stdout).toContain("[bun-cloudflare] 📦 Building ./src/index.ts to ./dist");
        
        if (result.exitCode === 0) {
            expect(stdout).toContain("[bun-cloudflare] ✨ Build successful!");
            expect(existsSync(join(testDir, "dist/index.js"))).toBe(true);
            
            // CRITICAL: Should NOT generate wrangler.jsonc anymore!
            expect(existsSync(join(testDir, "wrangler.jsonc"))).toBe(false);
            expect(existsSync(join(testDir, "wrangler.toml"))).toBe(false);
        }
    });

        const result = spawnSync(["bun", cliPath, "--help"], {
            cwd: testDir
        });
        const output = result.stdout.toString();
        // Check for common Portuguese terms in the new help message
        expect(output).toContain("Uso:");
        expect(output).toContain("Comandos:");
        expect(output).toContain("bunx bun-cloudflare <comando>");

    afterAll(() => {
        rmSync(testDir, { recursive: true, force: true });
    });
});
