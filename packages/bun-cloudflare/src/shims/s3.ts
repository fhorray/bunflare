import { getBunCloudflareContext } from "../runtime/context";

/**
 * Types for Bun S3 API
 */
export interface S3ClientOptions {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  endpoint?: string;
  region?: string;
  sessionToken?: string;
  acl?: string;
  virtualHostedStyle?: boolean;
}

export interface S3FileOptions {
  type?: string;
  acl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
}

export interface S3ListOptions {
  prefix?: string;
  maxKeys?: number;
  delimiter?: string;
  startAfter?: string;
  continuationToken?: string;
  fetchOwner?: boolean;
}

export interface S3Stat {
  size: number;
  etag: string;
  lastModified: Date;
  type: string;
}

/**
 * S3File shim - lazy reference to an R2 object
 */
export class S3File {
  private _path: string;
  private _client: S3Client;

  constructor(path: string, client: S3Client) {
    this._path = path;
    this._client = client;
  }

  get name() { return this._path; }
  get lastModified() { return 0; } // Lazy
  get size() { return NaN; } // Deprecated in Bun, requires stat()

  async text(): Promise<string> {
    const obj = await this._get();
    return obj ? await (obj as any).text() : "";
  }

  async json<T = any>(): Promise<T> {
    const text = await this.text();
    return text ? JSON.parse(text) : {} as T;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const obj = await this._get();
    return obj ? await (obj as any).arrayBuffer() : new ArrayBuffer(0);
  }

  async bytes(): Promise<Uint8Array> {
    const ab = await this.arrayBuffer();
    return new Uint8Array(ab);
  }

  async blob(): Promise<Blob> {
    const obj = await this._get();
    return obj ? await (obj as any).blob() : new Blob([]);
  }

  stream(): ReadableStream {
    // In R2, we need to fetch first, or return a stream that fetches
    const transform = new TransformStream();
    this._get().then(obj => {
        if (obj && (obj as any).body) {
            (obj as any).body.pipeTo(transform.writable);
        } else {
            transform.writable.getWriter().close();
        }
    });
    return transform.readable;
  }

  async exists(): Promise<boolean> {
    const bucket = this._client._getBucket();
    const obj = await bucket.head(this._path);
    return !!obj;
  }

  async stat(): Promise<S3Stat> {
    const bucket = this._client._getBucket();
    const obj = await bucket.head(this._path);
    if (!obj) throw new Error(`Object not found: ${this._path}`);
    return {
      size: obj.size,
      etag: obj.etag,
      lastModified: obj.uploaded,
      type: obj.httpMetadata?.contentType || "application/octet-stream"
    };
  }

  async write(data: any, options?: S3FileOptions): Promise<number> {
    const bucket = this._client._getBucket();
    const putOptions: any = {};
    if (options?.type) {
        putOptions.httpMetadata = { contentType: options.type };
        if (options.contentDisposition) putOptions.httpMetadata.contentDisposition = options.contentDisposition;
        if (options.contentEncoding) putOptions.httpMetadata.contentEncoding = options.contentEncoding;
    }
    
    // Cloudflare R2 .put() handles strings, arraybuffers, streams, etc.
    const result = await bucket.put(this._path, data, putOptions);
    return result ? result.size : 0;
  }

  async delete(): Promise<void> {
    const bucket = this._client._getBucket();
    await bucket.delete(this._path);
  }

  async unlink(): Promise<void> {
    return this.delete();
  }

  presign(options?: any): string {
    // R2 presigning is usually done via account-level API or specific worker logic.
    // For now, we return a placeholder or implement if possible.
    // Bun's presign is synchronous, which is tricky for R2.
    return `/api/storage/file/${this._path}`; // Simple local mapping for playground
  }

  private async _get() {
    const bucket = this._client._getBucket();
    return await bucket.get(this._path);
  }
}

/**
 * S3Client shim - maps to Cloudflare R2 Bucket
 */
export class S3Client {
  private _options: S3ClientOptions;
  private _cachedBucket: any = null;

  constructor(options: S3ClientOptions = {}) {
    this._options = options;
  }

  file(path: string): S3File {
    return new S3File(path, this);
  }

  async list(options?: S3ListOptions): Promise<any> {
    const bucket = this._getBucket();
    const r2Options: any = {
      prefix: options?.prefix,
      limit: options?.maxKeys || 1000,
      delimiter: options?.delimiter,
      cursor: options?.continuationToken || options?.startAfter, // R2 uses cursor
    };

    const result = await bucket.list(r2Options);
    
    return {
      isTruncated: result.truncated,
      contents: result.objects.map((o: any) => ({
        key: o.key,
        size: o.size,
        lastModified: o.uploaded,
        etag: o.etag,
      })),
      commonPrefixes: result.delimitedPrefixes,
      nextContinuationToken: result.cursor,
    };
  }

  async write(path: string, data: any, options?: S3FileOptions): Promise<number> {
    return this.file(path).write(data, options);
  }

  async delete(path: string): Promise<void> {
    return this.file(path).delete();
  }

  async unlink(path: string): Promise<void> {
    return this.delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.file(path).exists();
  }

  async stat(path: string): Promise<S3Stat> {
    return this.file(path).stat();
  }

  /**
   * Internal helper to find the R2 bucket binding
   */
  _getBucket() {
    if (this._cachedBucket) return this._cachedBucket;

    const { env } = getBunCloudflareContext<any>();
    
    // 1. Try to find by specific bucket name from options
    if (this._options.bucket && env[this._options.bucket]) {
        const b = env[this._options.bucket];
        if (typeof b.put === "function") {
            this._cachedBucket = b;
            return b;
        }
    }

    // 2. Try common binding names
    const commonKeys = ["BUCKET", "R2", "STORAGE", "ASSETS"];
    for (const key of commonKeys) {
        if (env[key] && typeof env[key].put === "function") {
            this._cachedBucket = env[key];
            return env[key];
        }
    }

    // 3. Fallback to detection by shape
    for (const b of Object.values(env)) {
        if (b && typeof (b as any).get === "function" && typeof (b as any).put === "function") {
            this._cachedBucket = b;
            return b;
        }
    }

    throw new Error(
      `[bun-cloudflare] No R2 bucket binding found. \n` +
      `Check your wrangler configuration for a binding (e.g., named "BUCKET" or matching "${this._options.bucket || ''}").`
    );
  }

  // --- Static methods ---
  static async write(path: string, data: any, options?: S3ClientOptions & S3FileOptions): Promise<number> {
    const client = new S3Client(options);
    return client.write(path, data, options);
  }

  static async list(options?: S3ListOptions, credentials?: S3ClientOptions): Promise<any> {
    const client = new S3Client(credentials);
    return client.list(options);
  }

  static async exists(path: string, credentials?: S3ClientOptions): Promise<boolean> {
    const client = new S3Client(credentials);
    return client.exists(path);
  }

  static async stat(path: string, credentials?: S3ClientOptions): Promise<S3Stat> {
    const client = new S3Client(credentials);
    return client.stat(path);
  }

  static async delete(path: string, credentials?: S3ClientOptions): Promise<void> {
    const client = new S3Client(credentials);
    return client.delete(path);
  }

  static async unlink(path: string, credentials?: S3ClientOptions): Promise<void> {
    return S3Client.delete(path, credentials);
  }

  static presign(path: string, options?: S3ClientOptions): string {
    return `/api/storage/file/${path}`;
  }
}

/**
 * Singleton s3 instance (matches Bun.s3)
 */
export const s3 = new S3Client();
