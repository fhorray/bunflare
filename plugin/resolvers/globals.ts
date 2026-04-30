/**
 * bunflare — globals resolver
 * 
 * Registers an `onLoad` hook that scans source files for Bun globals 
 * (like Bun.env, Bun.sql, etc.) and replaces them with Cloudflare-compatible 
 * code snippets.
 */

import type { PluginBuilder } from "bun";
import type { ShimRegistry } from "../types.ts";

/**
 * Registers the global resolver on the given build instance.
 * 
 * This hook runs on all 'js', 'ts', 'jsx', and 'tsx' files in the 'file' namespace.
 */
export function registerGlobalResolver(
  build: PluginBuilder,
  registry: ShimRegistry,
): void {
  if (registry.globals.length === 0) return;

  build.onLoad({ filter: /\.(js|ts|jsx|tsx)$/, namespace: "file" }, async (args) => {
    // Read the file content
    // Note: We use Bun.file(args.path).text() for performance in Bun
    const originalContents = await Bun.file(args.path).text();
    
    let modifiedContents = originalContents;
    let hasChanges = false;
    const preambles = new Set<string>();

    for (const globalShim of registry.globals) {
      // Use a fresh RegExp to avoid lastIndex state issues if the pattern has /g
      const pattern = new RegExp(globalShim.pattern.source, globalShim.pattern.flags);
      
      if (pattern.test(modifiedContents)) {
        modifiedContents = modifiedContents.replace(
          new RegExp(globalShim.pattern.source, globalShim.pattern.flags),
          globalShim.replacement
        );
        if (globalShim.preamble) {
          preambles.add(globalShim.preamble);
        }
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return undefined; // Let Bun load it normally
    }

    // Prepend all collected preambles
    if (preambles.size > 0) {
      modifiedContents = Array.from(preambles).join("\n") + "\n" + modifiedContents;
    }

    const extension = args.path.split(".").pop();
    const loader = getLoader(extension);

    return {
      contents: modifiedContents,
      loader,
    };
  });
}

/**
 * Maps file extensions to valid Bun loaders.
 */
function getLoader(extension: string | undefined): "js" | "ts" | "jsx" | "tsx" {
  switch (extension) {
    case "jsx": return "jsx";
    case "tsx": return "tsx";
    case "js": return "js";
    default: return "ts";
  }
}
