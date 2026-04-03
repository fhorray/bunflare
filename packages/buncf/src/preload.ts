import { plugin } from "bun";
import { cloudflarePlugin } from "./plugin";
import { loadConfig } from "./config";
import { initCloudflareMocks } from "./runtime/context";

// 1. Initialize official Cloudflare mocks via wrangler/miniflare
// This provides high-fidelity simulation for R2, D1, KV, etc.
await initCloudflareMocks();

// 2. Load buncf configuration
const config = await loadConfig();

// 3. Register the cloudflare plugin for the Bun runtime
// This handles Bun.serve and Bun.env transformations
plugin(cloudflarePlugin(config));

console.log("[buncf] ⚡ Official Cloudflare mocks & plugin initialized (preload mode)");
