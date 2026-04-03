/**
 * Bun.file() and Bun.write() are not supported in Cloudflare Workers
 * because there is no local file system.
 * 
 * Users should use:
 * 1. Bun.s3.file() for R2 storage (object storage)
 * 2. Cloudflare Assets (via imports) for static files
 */

export function file(path: string) {
  throw new Error(
    `[bun-cloudflare] Bun.file("${path}") is not supported in Cloudflare Workers.\n` +
    `Use Bun.s3.file("${path}") to access files from R2, or use Cloudflare Assets for static files.`
  );
}

export async function write(path: string, _data: string | ArrayBuffer | Blob): Promise<void> {
  throw new Error(
    `[bun-cloudflare] Bun.write("${path}", ...) is not supported in Cloudflare Workers.\n` +
    `Use Bun.s3.write("${path}", ...) to write files to R2.`
  );
}
