/**
 * Template for the Bun.file / Bun.write -> Cloudflare R2 shim.
 */

export function getR2Shim(bindingName: string): string {
  return `
import { env as getEnv } from "bunflare:env";

/**
 * A shim for BunFile that wraps Cloudflare R2.
 */
class BunFileShim {
  constructor(private path: string) {}

  private async getObject() {
    const env = (globalThis as any).env || {};
    let bucketName = "${bindingName}";
    let actualPath = this.path;

    if (this.path.startsWith("r2://")) {
      const url = new URL(this.path);
      bucketName = url.host;
      actualPath = url.pathname.slice(1); // Remove leading slash
    }

    const bucket = env[bucketName];
    if (!bucket) {
      throw new Error(\`[bunflare] R2 Binding "\${bucketName}" not found. Check your wrangler.jsonc\`);
    }
    const obj = await bucket.get(actualPath);
    if (!obj) {
      throw new Error(\`[bunflare] R2 Object not found in "\${bucketName}": \${actualPath}\`);
    }
    return obj;
  }

  async text(): Promise<string> {
    const obj = await this.getObject();
    return await obj.text();
  }

  async json(): Promise<any> {
    const obj = await this.getObject();
    return await obj.json();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const obj = await this.getObject();
    return await obj.arrayBuffer();
  }

  async bytes(): Promise<Uint8Array> {
    const obj = await this.getObject();
    const ab = await obj.arrayBuffer();
    return new Uint8Array(ab);
  }

  get stream() {
    return (async () => {
      const obj = await this.getObject();
      return obj.body;
    })();
  }

  async exists(): Promise<boolean> {
    const env = (globalThis as any).env || {};
    let bucketName = "${bindingName}";
    let actualPath = this.path;

    if (this.path.startsWith("r2://")) {
      const url = new URL(this.path);
      bucketName = url.host;
      actualPath = url.pathname.slice(1);
    }

    const bucket = env[bucketName];
    if (!bucket) return false;
    const obj = await bucket.head(actualPath);
    return obj !== null;
  }
}

/**
 * Shim for Bun.file(path)
 */
export function file(path: string) {
  return new BunFileShim(path);
}

/**
 * Shim for Bun.write(path, data)
 */
export async function write(path: string, data: any): Promise<number> {
  const env = (globalThis as any).env || {};
  let bucketName = "${bindingName}";
  let actualPath = path;

  if (path.startsWith("r2://")) {
    const url = new URL(path);
    bucketName = url.host;
    actualPath = url.pathname.slice(1);
  }

  const bucket = env[bucketName];
  if (!bucket) {
    throw new Error(\`[bunflare] R2 Binding "\${bucketName}" not found. Check your wrangler.jsonc\`);
  }

  await bucket.put(actualPath, data);
  
  if (typeof data === "string") return data.length;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (data instanceof Uint8Array) return data.byteLength;
  if (data instanceof Blob) return data.size;
  
  return 0;
}
`;
}
