import { scanRoutes } from "./scanner";

/**
 * Bun Macro: Scans the project's pages and api directories and returns
 * a static route manifest used at runtime when Bun's native 
 * FileSystemRouter is not available (e.g. in Cloudflare Workers).
 */
export function getRouteManifestMacro(
  srcDir: string = "src",
  pagesDir: string = "pages",
  apiDir: string = "api"
) {
  try {
    const manifest = scanRoutes(srcDir, pagesDir, apiDir);
    return manifest;
  } catch (err) {
    console.error("[buncf/router] Macro failed to scan routes:", err);
    return { pages: [], api: [] };
  }
}
