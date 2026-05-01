/**
 * bunflare — bun:* namespace resolver
 *
 * Registers an `onResolve` hook that intercepts all imports targeting the
 * built-in "bun" namespace (e.g. `import { Database } from "bun:sqlite"`)
 * and redirects them to the "bunflare" virtual namespace so that our `onLoad`
 * hook can inject the appropriate Cloudflare-compatible shim.
 */

import type { BunPlugin, PluginBuilder } from "bun";
import type { ShimRegistry } from "../types.ts";

/**
 * Registers the `bun:*` namespace resolver on the given build instance.
 *
 * Only paths that have a corresponding shim in `registry.modules` are
 * intercepted; everything else is left untouched so Bun's default resolution
 * still works for non-shimmed built-ins (e.g. `bun:test`).
 */
export function registerBunNamespaceResolver(
  build: PluginBuilder,
  registry: ShimRegistry,
): void {
  // Build a fast lookup set once before registering hooks.
  const shimmedPaths = new Set(registry.modules.map((s) => s.path));

  build.onResolve({ filter: /^(bun|bunflare):/ }, (args) => {
    const [scheme, ...pathParts] = args.path.split(":");
    const path = pathParts.join(":");
    
    if (scheme === "bun" && !shimmedPaths.has(path as any)) {
      // Not shimmed — let Bun handle it normally.
      return undefined;
    }

    // For bunflare: or shimmed bun: modules, redirect to bunflare namespace
    return {
      path,
      namespace: "bunflare",
    };
  });

  // Also handle cases where the namespace is already set (e.g. from previous resolution)
  build.onResolve({ filter: /.*/, namespace: "bunflare" }, (args) => {
    return {
      path: args.path,
      namespace: "bunflare",
    };
  });
}
