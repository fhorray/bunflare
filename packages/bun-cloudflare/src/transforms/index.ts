import { transformServe } from "./serve-transform";
import { transformEnv } from "./env-transform";
import { transformSqlite } from "./sqlite-transform";
import { transformFileIO } from "./file-io-transform";
import { transformS3 } from "./s3-transform";
import { transformRedis } from "./redis-transform";
import { transformSecondary } from "./secondary-transform";

/**
 * Orchestrates all transformations for the given source code.
 */
export function applyTransforms(source: string, filePath: string): string {
  // Skip node_modules and the package itself
  if (filePath.includes('node_modules')) return source;

  let transformed = source;

  // Apply transformations in order
  transformed = transformServe(transformed);
  transformed = transformEnv(transformed);
  transformed = transformSqlite(transformed);
  transformed = transformFileIO(transformed);
  transformed = transformS3(transformed);
  transformed = transformRedis(transformed);
  transformed = transformSecondary(transformed);

  return transformed;
}
