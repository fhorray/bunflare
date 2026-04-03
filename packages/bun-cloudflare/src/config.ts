import type { BunCloudflareConfig } from "./types";
import { join } from "node:path";

/**
 * Helper to define configuration with type safety.
 */
export function defineConfig(config: BunCloudflareConfig): BunCloudflareConfig {
  return config;
}

/**
 * Loads configuration from the root directory.
 * Searches for buncloudflare.config.ts or buncloudflare.config.js.
 */
export async function loadConfig(rootDir?: string): Promise<BunCloudflareConfig> {
  const cwd = rootDir || process.cwd();
  const candidates = [
    "buncloudflare.config.ts",
    "buncloudflare.config.js",
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
        console.error(`[bun-cloudflare] Failed to load config from ${candidate}:`, err);
      }
    }
  }

  return {}; // Return empty defaults if no config found
}
