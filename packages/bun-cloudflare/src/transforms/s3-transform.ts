/**
 * Transform for Bun.s3 -> Cloudflare R2
 */
export function transformS3(source: string): string {
  if (!source.includes("Bun.s3")) {
    return source;
  }

  let transformed = source;

  // Inject the import if not already present
  // We use bun-cloudflare/shims/s3 which should be correctly resolved by the bundler
  if (!transformed.includes('import { s3 } from "bun-cloudflare/shims/s3"')) {
    transformed = `import { s3 } from "bun-cloudflare/shims/s3";\n` + transformed;
  }

  // Replace Bun.s3 with the shimmed s3
  transformed = transformed.replace(/Bun\.s3/g, "s3");

  return transformed;
}
