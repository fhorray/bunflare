import { join } from "node:path";
import { mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { Database } from "bun:sqlite";

/**
 * Local development emulators for Cloudflare R2 and KV.
 * Persistent storage using .wrangler/state/v3
 */

const STATE_ROOT = ".wrangler/state/v3";

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata: any;
  customMetadata: any;
  range?: any;
  checksums: any;
  writeHttpMetadata: (headers: Headers) => void;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
}

/**
 * Filesystem-backed R2 Emulator
 */
function createR2Emulator(bindingName: string): any {
  const root = join(process.cwd(), STATE_ROOT, "r2", bindingName);
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  
  const getObject = (key: string, stats: any): R2Object => ({
    key,
    size: stats.size,
    etag: "mock-etag",
    httpEtag: "mock-etag",
    uploaded: stats.mtime,
    httpMetadata: {},
    customMetadata: {},
    checksums: {},
    writeHttpMetadata: () => {},
  });

  return {
    async get(key: string): Promise<R2ObjectBody | null> {
      const path = join(root, key.replace(/\//g, "_"));
      if (!existsSync(path)) return null;
      
      const stats = statSync(path);
      const file = Bun.file(path);
      const meta = getObject(key, stats);
      
      return {
        ...meta,
        body: file.stream(),
        bodyUsed: false,
        async arrayBuffer() { return await file.arrayBuffer(); },
        async text() { return await file.text(); },
        async json() { return await file.json(); },
        async blob() { return file as any as Blob; },
      } as R2ObjectBody;
    },
    
    async put(key: string, value: string | ArrayBuffer | Blob): Promise<R2Object> {
      const path = join(root, key.replace(/\//g, "_"));
      await Bun.write(path, value);
      const stats = statSync(path);
      return getObject(key, stats);
    },
    
    async head(key: string): Promise<R2Object | null> {
      const path = join(root, key.replace(/\//g, "_"));
      if (!existsSync(path)) return null;
      const stats = statSync(path);
      return getObject(key, stats);
    },
    
    async delete(key: string): Promise<void> {
      const path = join(root, key.replace(/\//g, "_"));
      if (existsSync(path)) unlinkSync(path);
    },
    
    async list(): Promise<{ objects: R2Object[]; truncated: false }> {
      const files = readdirSync(root);
      const objects = files.map(f => {
        const stats = statSync(join(root, f));
        return getObject(f, stats);
      });
      return { objects, truncated: false };
    }
  };
}

/**
 * SQLite-backed KV Emulator
 */
function createKVEmulator(bindingName: string, id?: string): any {
  const dir = join(process.cwd(), STATE_ROOT, "kv");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  
  const dbPath = join(dir, `${id || bindingName}.sqlite`);
  const db = new Database(dbPath);
  db.run("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)");
  
  return {
    async get(key: string): Promise<string | null> {
      const row = db.query("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | null;
      return row ? row.value : null;
    },
    async put(key: string, value: string): Promise<void> {
      db.query("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)").run(key, value);
    },
    async delete(key: string): Promise<void> {
      db.query("DELETE FROM kv WHERE key = ?").run(key);
    },
    async list(): Promise<{ keys: { name: string }[] }> {
      const rows = db.query("SELECT key FROM kv").all() as { key: string }[];
      return { keys: rows.map(r => ({ name: r.key })) };
    }
  };
}

/**
 * Builds a development environment from wrangler configuration
 */
export async function buildDevEnv(wranglerConfig: any): Promise<Record<string, any>> {
  const env: Record<string, any> = {};
  
  // 1. vars
  if (wranglerConfig.vars) {
    Object.assign(env, wranglerConfig.vars);
  }
  
  // 2. r2_buckets
  const r2Buckets = wranglerConfig.r2_buckets || [];
  for (const bucket of r2Buckets) {
    if (bucket.binding) {
      env[bucket.binding] = createR2Emulator(bucket.binding);
    }
  }
  
  // 3. kv_namespaces
  const kvNamespaces = wranglerConfig.kv_namespaces || [];
  for (const kv of kvNamespaces) {
    if (kv.binding) {
      env[kv.binding] = createKVEmulator(kv.binding, kv.id);
    }
  }
  
  return env;
}
