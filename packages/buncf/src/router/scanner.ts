import { join, relative } from "node:path";
import fs from "node:fs";

export interface RouteManifest {
  pages: Array<{
    pattern: string;
    filePath: string;
  }>;
  api: Array<{
    pattern: string;
    filePath: string;
  }>;
}

/**
 * Scans the provided directories to build a route manifest.
 * This is intended for use at build-time (e.g., via Bun Macros).
 */
export function scanRoutes(
  srcDir: string,
  pagesDir: string,
  apiDir: string
): RouteManifest {
  const root = process.cwd();
  const pagesPath = join(root, srcDir, pagesDir);
  const apiPath = join(root, srcDir, apiDir);

  return {
    pages: fs.existsSync(pagesPath) ? scanDirectory(pagesPath, "") : [],
    api: fs.existsSync(apiPath) ? scanDirectory(apiPath, "") : [],
  };
}

function scanDirectory(
  basePath: string,
  currentRelPath: string
): Array<{ pattern: string; filePath: string }> {
  const fullPath = join(basePath, currentRelPath);
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  let routes: Array<{ pattern: string; filePath: string }> = [];

  for (const entry of entries) {
    const relPath = join(currentRelPath, entry.name);
    
    if (entry.isDirectory()) {
      routes = routes.concat(scanDirectory(basePath, relPath));
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      // Skip special files like _layout, _loading, etc.
      if (entry.name.startsWith("_")) continue;

      let pattern = relPath
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/index$/, "")    // Remove index
        .replace(/\/$/, "");      // Remove trailing slash

      if (!pattern.startsWith("/")) pattern = "/" + pattern;
      if (pattern === "//") pattern = "/";
      if (pattern.length > 1 && pattern.endsWith("/")) pattern = pattern.slice(0, -1);

      routes.push({
        pattern,
        filePath: join(basePath, relPath),
      });
    }
  }

  // Sort routes: static first, then dynamic (simple heuristic)
  return routes.sort((a, b) => {
    const aDynamic = a.pattern.includes("[");
    const bDynamic = b.pattern.includes("[");
    if (aDynamic && !bDynamic) return 1;
    if (!aDynamic && bDynamic) return -1;
    return b.pattern.length - a.pattern.length;
  });
}
