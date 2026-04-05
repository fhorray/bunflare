import type { IncomingRequestCfProperties, ExecutionContext, DurableObjectState } from "@cloudflare/workers-types";

export interface WorkflowEvent<T = any> {
  payload: Readonly<T>;
  timestamp: Date;
  instanceId: string;
}

export type WorkflowSleepDuration = string | number;

export interface WorkflowStep {
  do<T>(name: string, callback: (ctx: { attempt: number }) => Promise<T>): Promise<T>;
  do<T>(name: string, config: any, callback: (ctx: { attempt: number }) => Promise<T>): Promise<T>;
  sleep(name: string, duration: WorkflowSleepDuration): Promise<void>;
  sleepUntil(name: string, timestamp: Date | number): Promise<void>;
  waitForEvent<T>(name: string, options: { type: string; timeout?: WorkflowSleepDuration }): Promise<{ payload: T; timestamp: Date; type: string }>;
}

export type WorkflowStatus = "queued" | "running" | "paused" | "errored" | "terminated" | "complete" | "waiting";

export interface WorkflowInstance {
  id: string;
  pause(): Promise<void>;
  resume(): Promise<void>;
  terminate(): Promise<void>;
  status(): Promise<{ status: WorkflowStatus; error?: string }>;
}

export interface WorkflowBinding<T = any> {
  create(options?: { id?: string; params?: T }): Promise<WorkflowInstance>;
  get(id: string): Promise<WorkflowInstance>;
}

export interface ContainerInstance {
  id: string;
  fetch(request: Request): Promise<Response>;
  containerFetch(request: Request): Promise<Response>;
  status(): Promise<{ state: string; error?: string }>;
}

export interface ContainerBinding {
  get(id: any): ContainerInstance;
  getByName(name: string): ContainerInstance;
}

export interface ContainerOptions {
  /** Port the container is listening on. @default 8080 */
  defaultPort?: number;
  /** Stop the instance if idle for this long. @default "10m" */
  sleepAfter?: string;
  /** Environment variables to pass to the container. */
  envVars?: Record<string, string>;
  /** Hook: Run when container successfully starts. */
  onStart?(): void | Promise<void>;
  /** Hook: Run when container successfully shuts down. */
  onStop?(): void | Promise<void>;
  /** Hook: Run when container errors. */
  onError?(error: unknown): void | Promise<void>;
  [key: string]: any;
}
import type { BunPlugin, Loader } from "bun";

export interface CloudflareBindings {
  [key: string]: any;
}

declare global {
  interface CloudflareBindings {
    [key: string]: any;
  }

  interface WebSocket {
    serialize?: () => any;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    publish(topic: string, data: string | ArrayBuffer | Uint8Array): void;
  }

  interface Request {
    params: { [key: string]: string } & { [key: string]: any };
    _rawRequest?: Request;
  }
}

declare module "bun" {
  /**
   * Type-safe augmentation for Bun.serve when used with bunflare.
   */
  export function serve<T extends {
    routes?: Record<string, (req: Request) => any>;
    fetch?: (req: Request, srv?: any) => any;
    [key: string]: any;
  }>(options: T): T;
}

/**
 * @deprecated Use CloudflareBindings for better type safety with wrangler's generation.
 */
export interface CloudflareEnv extends CloudflareBindings { }

export type { DurableObjectState };

export interface CloudflareContext<E = CloudflareBindings> {
  env: E;
  cf: IncomingRequestCfProperties;
  ctx: ExecutionContext;
}

export interface BunflareConfig {
  /** The name of your Cloudflare Worker. */
  workerName?: string;
  /** Cloudflare compatibility date (e.g., '2024-04-03'). */
  compatibilityDate?: string;
  /** Your worker's entry point file path. @default "./src/index.ts" */
  entrypoint?: string;
  /** The directory where the bundled worker will be placed. @default "./dist" */
  outdir?: string;
  /** The directory to watch for changes during development. @default "src" */
  watchDir?: string;
  /**
   * Enables or configures code minification.
   * Can be a boolean or an object for granular control.
   */
  minify?: boolean | {
    /** Minify whitespace. */
    whitespace?: boolean;
    /** Perform dead code elimination and syntax optimizations. */
    syntax?: boolean;
    /** Minify variable and function identifiers. */
    identifiers?: boolean;
  };

  /**
   * The intended execution environment target.
   * @default "browser"
   */
  target?: "browser" | "bun" | "node";
  /**
   * The type of sourcemap to generate.
   * @default "linked" (in dev), "none" (in prod)
   */
  sourcemap?: "none" | "linked" | "inline" | "external";
  /**
   * A list of function calls to remove from the bundle (e.g., ["console.log"]).
   * @default ["console", "debugger"] (in prod)
   */
  drop?: string[];
  /** Custom build-time constants for string replacement. */
  define?: Record<string, string>;

  /** Modules or packages to exclude from the bundle. */
  external?: string[];
  /** Enable code splitting for projects with multiple entry points. */
  splitting?: boolean;
  /**
   * How to handle environment variables during bundling.
   * Use a prefix (e.g., "PUBLIC_*") for selective inlining.
   */
  env?: "inline" | "disable" | `${string}*`;

  /** Whether to generate a metafile for bundle size analysis. @default true */
  metafile?: boolean;
  /** Optimization hints for complex library imports. */
  optimizeImports?: string[];

  /** Text to prepend to the generated worker bundle. */
  banner?: string;
  /** Text to append to the generated worker bundle. */
  footer?: string;
  /** Feature flags for the `bun:bundle` API. */
  features?: string[];
  /**
   * Strategy for serving static assets.
   * "binding" uses Cloudflare's standard ASSETS binding.
   * "html-loader" is an experimental Bun-native alternative.
   * @default "binding"
   */
  staticAssets?: "binding" | "html-loader";

  /**
   * Status of serving static assets from this directory.
   * "public/" is the default if not specified.
   */
  staticDir?: string;
  /** Native Bun plugins to run during the build process. */
  plugins?: BunPlugin[];
  /** Custom loaders for specific file extensions. */
  loader?: Record<string, Loader>;
}
