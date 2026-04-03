/**
 * Transform for Bun.s3 -> Cloudflare R2
 */
export function transformS3(source: string): string {
  // Common check for s3 usage
  if (!source.includes("Bun.s3") && !source.includes("S3Client") && !source.includes("Bun.S3Client")) {
    return source;
  }

  let transformed = source;

  // Inject the import if not already present
  // We use bun-cloudflare/shims/s3 which should be correctly resolved by the bundler
  if (!transformed.includes('from "bun-cloudflare/shims/s3"')) {
    transformed = `import { s3, S3Client } from "bun-cloudflare/shims/s3";\n` + transformed;
  }

  // 1. Replace Bun.S3Client with S3Client
  transformed = transformed.replace(/Bun\.S3Client/g, "S3Client");
  
  // 2. Replace Bun.s3 with the shimmed singleton s3
  transformed = transformed.replace(/Bun\.s3/g, "s3");

  // 3. Handle cases where S3Client might be exported/re-exported or used in types
  // (Standard string replacements for simple cases)

  return transformed;
}
