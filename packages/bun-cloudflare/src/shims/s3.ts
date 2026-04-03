import { getBunCloudflareContext } from "../runtime/context";

/**
 * Shim for Bun.s3 -> Cloudflare R2
 */
export const s3 = {
  file(path: string) {
    return {
      async text(): Promise<string> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        const obj = await bucket.get(path);
        if (!obj) return "";
        if (typeof (obj as any).text === "function") {
          return await (obj as any).text();
        }
        // Fallback or handle cases where obj is metadata-only
        return "";
      },
      async json<T = unknown>(): Promise<T> {
        const text = await this.text();
        return text ? JSON.parse(text) : {} as T;
      },
      async arrayBuffer(): Promise<ArrayBuffer> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        const obj = await bucket.get(path);
        if (!obj) return new ArrayBuffer(0);
        if (typeof (obj as any).arrayBuffer === "function") {
          return await (obj as any).arrayBuffer();
        }
        return new ArrayBuffer(0);
      },
      async blob(): Promise<Blob> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        const obj = await bucket.get(path);
        if (!obj) return new Blob([]);
        if (typeof (obj as any).blob === "function") {
          return await (obj as any).blob();
        }
        return new Blob([]);
      },
      async size(): Promise<number> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        const obj = await bucket.head(path);
        return obj ? obj.size : 0;
      },
      async write(data: string | ArrayBuffer | Blob): Promise<void> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        await bucket.put(path, data);
      },
      async delete(): Promise<void> {
        const { env } = getBunCloudflareContext<any>();
        const bucket = findR2Bucket(env);
        await bucket.delete(path);
      }
    };
  },
  
  async write(path: string, data: string | ArrayBuffer | Blob): Promise<void> {
    const { env } = getBunCloudflareContext<any>();
    const bucket = findR2Bucket(env);
    await bucket.put(path, data);
  }
};

/**
 * Dynamically find the first R2 bucket in the environment.
 */
function findR2Bucket(env: Record<string, any>) {
  // 1. Try to find by typical name if multiple bindings exist
  if (env.BUCKET && typeof env.BUCKET.put === "function") return env.BUCKET;
  if (env.R2 && typeof env.R2.put === "function") return env.R2;
  if (env.STORAGE && typeof env.STORAGE.put === "function") return env.STORAGE;

  // 2. Fallback to detection by shape
  const bucket = Object.values(env).find(
    (b) => b && typeof b.get === "function" && typeof b.put === "function"
  );
  
  if (!bucket) {
    const keys = Object.keys(env).join(", ");
    throw new Error(
      `[bun-cloudflare] No R2 bucket binding found in env (Keys: ${keys}).\n` +
      "Make sure you have an [[r2_buckets]] binding in your wrangler configuration (toml/json/jsonc)."
    );
  }
  
  return bucket;
}
