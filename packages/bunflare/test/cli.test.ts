import { describe, expect, it, afterAll } from "bun:test";
import { spawnSync } from "bun";
import { join, resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

describe("CLI Integration", () => {
    const rootDir = resolve(import.meta.dir, "..");
    const testDir = join(import.meta.dir, `temp-cli-${Date.now()}`);
    
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });

    // Path to the CLI entry point
    const cliPath = join(rootDir, "src/cli/index.ts");

    // Setup a minimal project
    const srcDir = join(testDir, "src");
    if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
        name: "cli-test",
        dependencies: {
            "bunflare": `file:${rootDir}`
        }
    }));

    writeFileSync(join(srcDir, "index.ts"), `
        export default {
            fetch(req: Request) {
                return new Response("Hello CLI");
            }
        };
    `);

    writeFileSync(join(testDir, "bunflare.config.ts"), `
        export default {
            entrypoint: "./src/index.ts",
            outdir: "./dist",
        };
    `);

    it("should run 'build' successfully with modern output in debug mode", () => {
        const result = spawnSync(["bun", cliPath, "build", "--debug"], {
            cwd: testDir,
            env: { ...process.env, NODE_ENV: "production" }
        });

        const stdout = result.stdout.toString();
        const stderr = result.stderr.toString();

        if (result.exitCode !== 0) {
            console.error("Build Failed Stderr:", stderr);
            console.log("Build Failed Stdout:", stdout);
        }
        
        expect(result.exitCode).toBe(0);
        expect(stdout).toContain("Bunflare");
        expect(stdout).toContain("Build successful");
        expect(existsSync(join(testDir, "dist/index.js"))).toBe(true);
    });

    it("should show modern help message", () => {
        const result = spawnSync(["bun", cliPath, "--help"], {
            cwd: testDir
        });
        const output = result.stdout.toString();
        
        expect(output).toContain("Bunflare");
        expect(output).toContain("Usage:");
        expect(output).toContain("Commands:");
        expect(output).toContain("Development");
        expect(output).toContain("Production");
    });

    afterAll(() => {
        if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    });
});
