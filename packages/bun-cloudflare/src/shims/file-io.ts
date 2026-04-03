import { getBunCloudflareContext } from "../runtime/context";
import { s3, S3Client } from "./s3";

/**
 * Shim for Bun.file() → Cloudflare R2
 *
 * Reuses the R2 logic by delegating to the env binding directly.
 * Uses the same bucket detection strategy as the s3 shim.
 */

function findR2Bucket(env: Record<string, any>) {
  if (env.BUCKET && typeof env.BUCKET.put === "function") return env.BUCKET;
  if (env.R2 && typeof env.R2.put === "function") return env.R2;
  if (env.STORAGE && typeof env.STORAGE.put === "function") return env.STORAGE;

  const bucket = Object.values(env).find(
    (b) => b && typeof b.get === "function" && typeof b.put === "function"
  );

  if (!bucket) {
    throw new Error(
      `[bun-cloudflare] No R2 bucket binding found in env.\n` +
      `Make sure you have an [[r2_buckets]] binding in your wrangler configuration.`
    );
  }

  return bucket;
}

/**
 * Shim for Bun.file(path) → R2 object with BunFile-compatible API
 */
export function file(path: string) {
  if (path.startsWith("s3://")) {
    try {
      const url = new URL(path);
      const bucketName = url.host;
      const key = url.pathname.slice(1); // Remove leading /
      return new S3Client({ bucket: bucketName }).file(key);
    } catch (e) {
      // Fallback or error
    }
  }

  return {
    async text(): Promise<string> {
      const { env } = getBunCloudflareContext<any>();
      const bucket = findR2Bucket(env);
      const obj = await bucket.get(path);
      if (!obj) return "";
      return typeof obj.text === "function" ? await obj.text() : "";
    },
    async json<T = unknown>(): Promise<T> {
      const text = await this.text();
      return text ? JSON.parse(text) : ({} as T);
    },
    async arrayBuffer(): Promise<ArrayBuffer> {
      const { env } = getBunCloudflareContext<any>();
      const bucket = findR2Bucket(env);
      const obj = await bucket.get(path);
      if (!obj) return new ArrayBuffer(0);
      return typeof obj.arrayBuffer === "function"
        ? await obj.arrayBuffer()
        : new ArrayBuffer(0);
    },
    async blob(): Promise<Blob> {
      const { env } = getBunCloudflareContext<any>();
      const bucket = findR2Bucket(env);
      const obj = await bucket.get(path);
      if (!obj) return new Blob([]);
      return typeof obj.blob === "function" ? await obj.blob() : new Blob([]);
    },
    async exists(): Promise<boolean> {
      const { env } = getBunCloudflareContext<any>();
      const bucket = findR2Bucket(env);
      const obj = await bucket.head(path);
      return obj !== null;
    },
    async size(): Promise<number> {
      const { env } = getBunCloudflareContext<any>();
      const bucket = findR2Bucket(env);
      const obj = await bucket.head(path);
      return obj ? obj.size : 0;
    },
  };
}

/**
 * Shim for Bun.write(path, data) → R2 put
 */
export async function write(
  path: string,
  data: string | ArrayBuffer | Blob
): Promise<void | number> {
  if (path.startsWith("s3://")) {
    try {
      const url = new URL(path);
      const bucketName = url.host;
      const key = url.pathname.slice(1);
      return await new S3Client({ bucket: bucketName }).write(key, data);
    } catch (e) {
      // Fallback
    }
  }

  const { env } = getBunCloudflareContext<any>();
  const bucket = findR2Bucket(env);
  const result = await bucket.put(path, data);
  return result ? result.size : 0;
}
