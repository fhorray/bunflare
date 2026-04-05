import type { BunflareConfig } from "./types";
import { join } from "node:path";
import fs from "node:fs";

/**
 * Helper to define configuration with type safety.
 */
export function defineConfig(config: BunflareConfig): BunflareConfig {
  return config;
}

/**
 * Loads wrangler configuration from the root directory.
 */
export async function loadWranglerConfig(rootDir?: string): Promise<any> {
  const cwd = rootDir || process.cwd();
  const candidates = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];
  
  for (const candidate of candidates) {
    const path = join(cwd, candidate);
    if (await Bun.file(path).exists()) {
      const content = await Bun.file(path).text();
      
      if (candidate.endsWith(".toml")) {
        // @ts-ignore
        return Bun.TOML.parse(content);
      }
      
      try {
        // @ts-ignore
        return Bun.JSONC.parse(content);
      } catch (err) {
        console.error(`[bunflare] ❌ Error parsing ${candidate}:`, err);
        return null;
      }
    }
  }

  return null;
}

/**
 * Loads configuration from the root directory.
 * Searches for bunflare.config.ts or bunflare.config.js or cloudflare.config.ts.
 */
export async function loadConfig(rootDir?: string): Promise<BunflareConfig> {
  const cwd = rootDir || process.cwd();
  const candidates = [
    "bunflare.config.ts",
    "bunflare.config.js",
    "cloudflare.config.ts",
    "cloudflare.config.js",
  ];

  for (const candidate of candidates) {
    const path = join(cwd, candidate);
    if (await Bun.file(path).exists()) {
      try {
        // Use dynamic import to load the config file
        const mod = await import(path);
        return mod.default || mod;
      } catch (err) {
        console.error(`[bunflare] Failed to load config from ${candidate}:`, err);
      }
    }
  }

  return {}; // Return empty defaults if no config found
}
