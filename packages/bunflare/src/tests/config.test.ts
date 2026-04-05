import { describe, expect, it } from "bun:test";
import { defineConfig, loadConfig, loadWranglerConfig } from "../config";
import { writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadWranglerConfig", () => {
    it("should load and parse a wrangler.toml file", async () => {
        const testDir = join(tmpdir(), `test-config-toml-${Date.now()}`);
        if (!existsSync(testDir)) mkdirSync(testDir);
        
        const tomlContent = `
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-04-03"
[[kv_namespaces]]
binding = "MY_KV"
id = "kv-id-123"
        `;
        const configPath = join(testDir, "wrangler.toml");
        writeFileSync(configPath, tomlContent);
        
        try {
            const config = await loadWranglerConfig(testDir) as any;
            expect(config).not.toBeNull();
            expect(config?.name).toEqual("my-worker");
            expect(config?.kv_namespaces?.[0]?.binding).toEqual("MY_KV");
        } finally {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    it("should load and parse a wrangler.jsonc file with comments", async () => {
        const testDir = join(tmpdir(), `test-config-jsonc-${Date.now()}`);
        if (!existsSync(testDir)) mkdirSync(testDir);
        
        const jsoncContent = `
{
    // This is a comment
    "name": "jsonc-worker",
    /* Multi-line
       comment */
    "main": "src/index.ts",
    "compatibility_date": "2024-04-03"
}
        `;
        const configPath = join(testDir, "wrangler.jsonc");
        writeFileSync(configPath, jsoncContent);
        
        try {
            const config = await loadWranglerConfig(testDir);
            expect(config).not.toBeNull();
            expect(config?.name).toEqual("jsonc-worker");
        } finally {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    it("should return null if config file does not exist", async () => {
        const config = await loadWranglerConfig("non-existent.toml");
        expect(config).toBeNull();
    });
});

describe("defineConfig", () => {
    it("should return the configuration object as-is (without bindings)", () => {
        const config = { workerName: "test" };
        expect(defineConfig(config)).toBe(config);
    });
});

describe("loadConfig", () => {
    it("should load configuration from cloudflare.config.ts", async () => {
        const testDir = join(tmpdir(), `test-load-config-cf-${Date.now()}`);
        if (!existsSync(testDir)) mkdirSync(testDir);
        
        const configContent = `
            export default {
                workerName: "test-worker-from-cf-config"
            };
        `;
        const configPath = join(testDir, "cloudflare.config.ts");
        writeFileSync(configPath, configContent);
        
        try {
            const config = await loadConfig(testDir);
            expect(config.workerName).toEqual("test-worker-from-cf-config");
        } finally {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    it("should return empty object if no config file exists", async () => {
        const testDir = join(tmpdir(), `test-load-config-empty-${Date.now()}`);
        if (!existsSync(testDir)) mkdirSync(testDir);
        
        try {
            const config = await loadConfig(testDir);
            expect(config).toEqual({});
        } finally {
            rmSync(testDir, { recursive: true, force: true });
        }
    });
});
