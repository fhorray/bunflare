import type { BunPlugin } from "bun";
import { applyTransforms } from "./transforms";
import { loadWranglerConfig } from "./config";
import type { BunflareConfig } from "./types";
import { readFileSync, existsSync } from "node:fs";

export function cloudflarePlugin(config?: BunflareConfig, quiet: boolean = false): BunPlugin {
  return {
    name: "bunflare",
    async setup(build) {
      // 1. Load wrangler configuration as the source of truth
      const wranglerConfig = await loadWranglerConfig();

      if (wranglerConfig) {
        if (!quiet) {
          console.log(`[bunflare] ⚡ Loaded wrangler configuration from ${existsSync("wrangler.toml") ? "wrangler.toml" : existsSync("wrangler.json") ? "wrangler.json" : "wrangler.jsonc"}`);
        }
      } else {
        if (!quiet) {
          console.warn("[bunflare] ⚠️ No wrangler.toml/json/jsonc found. Infrastructure bindings might not be available.");
        }
      }


      // 2. Load and transform source code
      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
        const source = readFileSync(args.path, "utf8");
        const extension = args.path.split('.').pop() as string;
        const loader = (extension === 'ts' || extension === 'tsx' || extension === 'js' || extension === 'jsx')
          ? extension as 'ts' | 'tsx' | 'js' | 'jsx'
          : 'js';

        // Skip node_modules and internal plugin files - but STILL RETURN THE ORIGINAL CONTENT
        // Using a more specific check to avoid skipping files in projects that happen to have "bunflare" in their path
        if (args.path.includes("node_modules") || args.path.includes("/packages/bunflare/")) {
          return { contents: source, loader };
        }

        // Apply transformations in order
        const transformed = applyTransforms(source, args.path);

        if (transformed === source) {
          return { contents: source, loader };
        }

        return {
          contents: transformed,
          loader
        };
      });

    }
  };
}
