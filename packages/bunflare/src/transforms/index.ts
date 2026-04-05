import { transformServe } from "./serve-transform";
import { transformEnv } from "./env-transform";

/**
 * Orchestrates all transformations for the given source code.
 */
export function applyTransforms(source: string, filePath: string): string {
  // Skip node_modules and the package itself
  if (filePath.includes('node_modules')) return source;

  let transformed = source;

  // 1. Transform Bun.serve to standard Cloudflare Worker exports
  transformed = transformServe(transformed);

  // 2. Transform Bun.env/process.env to getCloudflareContext().env
  // This is kept as a convenience for environmental access.
  transformed = transformEnv(transformed);

  return transformed;
}
