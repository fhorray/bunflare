/**
 * Type declarations for bunflare virtual modules.
 * These augment the official Bun types to work in Cloudflare Workers.
 */

/**
 * The 'bun' module - shims for Bun.sql, Bun.password, etc.
 */
declare module "bun" {
  export interface SQLQuery<T = any> extends Promise<T> {
    values(): Promise<any[][]>;
    run(): Promise<{ success: boolean; error?: string }>;
  }

  export function sql(strings: TemplateStringsArray | string, ...values: any[]): SQLQuery;
  
  export class SQL {
    constructor(options?: any);
  }

  export const password: {
    hash(password: string | Uint8Array, options?: any): Promise<string>;
    verify(password: string | Uint8Array, hash: string): Promise<boolean>;
  };

  export const hash: (data: string | Uint8Array) => Promise<string>;
}

declare module "bun:env" {
  export const env: BunflareEnv;
  export function setEnv(newEnv: unknown): void;
  export function withBunflare<E = BunflareEnv>(
    handler: (request: Request, env: E, ctx: ExecutionContext) => Response | Promise<Response>
  ): {
    fetch: (request: Request, env: E, ctx: ExecutionContext) => Promise<Response>;
  };
}

declare module "bun:sqlite" {
  export class Database {
    constructor(filename?: string);
    query(sql: string): {
      all(...params: unknown[]): unknown[];
    };
    prepare(sql: string): {
      all(...params: unknown[]): unknown[];
      run(...params: unknown[]): any;
    };
    run(sql: string, ...params: unknown[]): void;
  }
}

declare module "bun:kv" {
  export class KV {
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string | ArrayBuffer): Promise<void>;
    delete(key: string): Promise<void>;
  }
}

/**
 * Internal shims for preamble injection.
 * You typically don't need to import these directly.
 */
declare module "bunflare:kv" {
  export const redis: any;
  export class RedisClient {
    constructor(options?: any);
  }
}

declare module "bunflare:sql" {
  export const sql: any;
  export const SQL: any;
}

declare module "bunflare:serve" {
  export function serve(options: any): any;
}

declare module "bunflare:crypto" {
  export const BunCrypto: any;
}

declare module "bunflare:env" {
  export const env: any;
}

declare module "bunflare:r2" {
  export interface BunFile {
    text(): Promise<string>;
    json(): Promise<any>;
    arrayBuffer(): Promise<ArrayBuffer>;
    bytes(): Promise<Uint8Array>;
    exists(): Promise<boolean>;
    stream: Promise<ReadableStream | null>;
  }

  export function file(path: string): BunFile;
  export function write(path: string, data: any): Promise<number>;
}

/**
 * Global interfaces
 */
interface BunServer {
  id: string;
  hostname: string;
  port: number;
  pendingRequests: number;
  pendingWebSockets: number;
  requestIP: () => string | null;
  upgrade: <T = unknown>(request: Request, options?: { data?: T }) => boolean;
  cloudflare: {
    env: any;
    ctx: any;
  };
}

interface BunflareEnv {
  [key: string]: any;
}
