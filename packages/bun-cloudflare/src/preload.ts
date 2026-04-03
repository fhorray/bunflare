import { plugin } from "bun";
import { cloudflarePlugin } from "./plugin";
import { loadConfig } from "./config";

// Load configuration automatically from the current working directory
const config = await loadConfig();

// Register the cloudflare plugin for the Bun runtime
// This allows imports like 'bun:sqlite' to be correctly shimmed during local execution
plugin(cloudflarePlugin(config));

console.log("[bun-cloudflare] ⚡ Registered plugin for Bun runtime (preload mode)");
