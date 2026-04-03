import { plugin } from "bun";
import { cloudflarePlugin } from "./plugin";
import { loadConfig } from "./config";
import { loadWranglerConfig } from "./generator/wrangler-config";
import { buildDevEnv } from "./runtime/dev-env";
import { setBunCloudflareContext } from "./runtime/context";

// Load configuration automatically from the current working directory
const config = await loadConfig();

// Register the cloudflare plugin for the Bun runtime
plugin(cloudflarePlugin(config));

// Initialize dev environment with mock bindings if not in Cloudflare
const wranglerConfig = await loadWranglerConfig();
if (wranglerConfig) {
  const devEnv = await buildDevEnv(wranglerConfig);
  setBunCloudflareContext({
    env: devEnv,
    cf: {} as any,
    ctx: {
      waitUntil: () => {},
      passThroughOnException: () => {}
    } as any
  });
  console.log("[bun-cloudflare] 🧪 Dev environment initialized with mock bindings");
}

console.log("[bun-cloudflare] ⚡ Registered plugin for Bun runtime (preload mode)");
