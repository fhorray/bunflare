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

  // Pre-compile patterns to avoid re-compiling in every onLoad call
  const compiledShims = registry.globals.map((shim) => {
    const source = shim.pattern.source;
    const flags = shim.pattern.flags;
    
    return {
      ...shim,
      // For testing, we use a non-global version to avoid lastIndex state issues
      testPattern: new RegExp(source, flags.replace("g", "")),
      // Fast search string for includes() check (works for simple patterns like Bun.env)
      searchStr: source.replace(/\\/g, ""),
    };
  });

  build.onLoad({ filter: /\.(js|ts|jsx|tsx)$/, namespace: "file" }, async (args) => {
    // Read the file content
    // Note: We use Bun.file(args.path).text() for performance in Bun
    const originalContents = await Bun.file(args.path).text();
    
    let modifiedContents = originalContents;
    let hasChanges = false;
    const preambles = new Set<string>();

    for (const shim of compiledShims) {
      // 1. Fast path: check if the literal string exists
      if (modifiedContents.includes(shim.searchStr)) {
        // 2. Accurate path: verify with regex (using pre-compiled non-global pattern)
        if (shim.testPattern.test(modifiedContents)) {
          // 3. Apply replacement (using pre-compiled global pattern)
          modifiedContents = modifiedContents.replace(
            shim.pattern,
            shim.replacement
          );
          
          if (shim.preamble) {
            preambles.add(shim.preamble);
          }
          hasChanges = true;
        }
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
