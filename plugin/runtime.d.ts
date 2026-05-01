/**
 * Type declarations for bunflare virtual modules.
 */

declare module "bun:env" {
  /**
   * The shimmed Bun.env object. 
   * Augment the 'BunflareEnv' interface in your project to get full type safety.
   */
  export const env: BunflareEnv;

  /**
   * Utility to set the environment object at runtime.
   */
  export function setEnv(newEnv: unknown): void;

  /**
   * Higher-order function to wrap your Cloudflare Worker fetch handler.
   * Automatically calls setEnv(env) for you.
   */
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
 * Mock of the Bun Server object provided to fetch()
 */
interface BunServer {
  id: string;
  hostname: string;
  port: number;
  pendingRequests: number;
  pendingWebSockets: number;
  requestIP: () => string | null;
  upgrade: <T = unknown>(request: Request, options?: { data?: T }) => boolean;
  /** Cloudflare-specific objects */
  cloudflare: {
    env: unknown;
    ctx: ExecutionContext;
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Interface that can be augmented by the user to provide types for Bun.env.
 */
interface BunflareEnv {
  [key: string]: unknown;
}

declare module "bunflare:redis" {
  export class RedisClient {
    constructor(options?: { url?: string; token?: string });
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<"OK">;
  }
}

declare module "bunflare:serve" {
  export function serve(options: {
    fetch?: (request: Request, server: BunServer) => Response | Promise<Response>;
    routes?: Record<string, (request: Request, server: BunServer) => Response | Promise<Response>>;
    port?: number;
    hostname?: string;
  }): unknown;
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
