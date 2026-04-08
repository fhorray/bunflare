import type { 
  IncomingRequestCfProperties, 
  ExecutionContext, 
  DurableObjectState, 
  MessageBatch as CFMessageBatch, 
  Message as CFMessage,
  ScheduledEvent as CFScheduledEvent 
} from "@cloudflare/workers-types";

export interface MessageBatch<T = any> extends CFMessageBatch<T> {}
export interface Message<T = any> extends CFMessage<T> {}
export type ScheduledEvent = CFScheduledEvent;

export interface QueueOptions {
  batchSize?: number;
  maxRetries?: number;
  maxBatchTimeout?: number;
}

export interface QueueBinding<T = any, Env = any> extends QueueOptions {
  process: (messages: Message<T>[], env: Env) => any | Promise<any>;
  [key: string]: any;
}

export interface CronBinding<Env = any> {
  schedule: string;
  run: (event: ScheduledEvent, env: Env) => any | Promise<any>;
  [key: string]: any;
}

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
  /** 
   * The name of your Cloudflare Worker. 
   * This is used for identification in the Cloudflare dashboard.
   * 
   * @example "my-awesome-worker"
   */
  workerName?: string;

  /** 
   * Cloudflare compatibility date. 
   * Determines which version of the Cloudflare Workers runtime to use.
   * 
   * @example "2024-04-03"
   */
  compatibilityDate?: string;

  /** 
   * Your worker's entry point file path. 
   * This is the main file that will be bundled for Cloudflare.
   * 
   * @default "./src/index.ts"
   * @example "./src/index.ts"
   */
  entrypoint?: string;

  /** 
   * The directory where the bundled worker will be placed. 
   * 
   * @default "./dist"
   * @example "./dist"
   */
  outdir?: string;

  /** 
   * The directory to watch for changes during development. 
   * Any changes in this directory will trigger a rebuild.
   * 
   * @default "src"
   * @example "src"
   */
  watchDir?: string;

  /**
   * Enables or configures code minification.
   * Can be a boolean or an object for granular control.
   * 
   * @example 
   * // Basic usage
   * minify: true
   * 
   * @example 
   * // Granular control
   * minify: {
   *   whitespace: true,
   *   syntax: true,
   *   identifiers: false
   * }
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
   * - "browser": Standard ES modules for Cloudflare.
   * - "bun": Optimized for Bun-specific features.
   * - "node": Compatibility mode for Node.js.
   * 
   * @default "browser"
   * @example "browser"
   */
  target?: "browser" | "bun" | "node";

  /**
   * The type of sourcemap to generate.
   * - "none": No sourcemaps.
   * - "linked": External .map file.
   * - "inline": Inlined into the bundle.
   * - "external": Separate file (not linked in comment).
   * 
   * @default "linked" (in dev), "none" (prod)
   * @example "linked"
   */
  sourcemap?: "none" | "linked" | "inline" | "external";

  /**
   * A list of function calls to remove from the bundle.
   * Useful for stripping development logs in production.
   * 
   * @default ["console", "debugger"] (in prod)
   * @example ["console.log", "myLogger.debug"]
   */
  drop?: string[];

  /** 
   * Global build-time constants for string replacement. 
   * These are injected directly into your code.
   * 
   * @example
   * define: {
   *   "process.env.VERSION": JSON.stringify("1.2.3"),
   *   "DEBUG": "true"
   * }
   */
  define?: Record<string, string>;

  /** 
   * Modules or packages to exclude from the bundle. 
   * These will be treated as external peer dependencies.
   * 
   * @example ["node:path", "fsevents"]
   */
  external?: string[];

  /** 
   * Enable code splitting for projects with multiple entry points. 
   * 
   * @default false
   * @example true
   */
  splitting?: boolean;

  /**
   * How to handle environment variables during bundling.
   * - "inline": Inlines ALL environment variables.
   * - "disable": Does not inline any variables.
   * - "PREFIX_*": Only inlines variables starting with PREFIX_.
   * 
   * @example "PUBLIC_*"
   */
  env?: "inline" | "disable" | `${string}*`;

  /** 
   * Whether to generate a metafile for bundle size analysis. 
   * Useful with tools like 'bundle-buddy'.
   * 
   * @default true
   * @example true
   */
  metafile?: boolean;

  /** 
   * Optimization hints for complex library imports. 
   * 
   * @example ["zod", "date-fns"]
   */
  optimizeImports?: string[];

  /** 
   * Text to prepend to the generated worker bundle. 
   * Useful for license headers or polyfills.
   * 
   * @example "// (c) 2024 MyCompany"
   */
  banner?: string;

  /** 
   * Text to append to the generated worker bundle. 
   * 
   * @example "// Built by bunflare"
   */
  footer?: string;

  /** 
   * Advanced feature flags for the `bun:bundle` API. 
   */
  features?: string[];

  /**
   * Strategy for serving static assets.
   * - "binding": Uses Cloudflare's standard ASSETS binding (Static Site Hosting).
   * - "html-loader": Experimental Bun-native alternative.
   * 
   * @default "binding"
   * @example "binding"
   */
  staticAssets?: "binding" | "html-loader";

  /**
   * The directory from which static assets are served.
   * 
   * @default "./public"
   * @example "./public"
   */
  staticDir?: string;

  /** 
   * Native Bun plugins to run during the build process. 
   * 
   * @example
   * import tailwind from "bun-plugin-tailwind";
   * plugins: [ tailwind ]
   */
  plugins?: BunPlugin[];

  /** 
   * Custom loaders for specific file extensions. 
   * 
   * @example
   * loader: {
   *   ".txt": "text",
   *   ".png": "file"
   * }
   */
  loader?: Record<string, Loader>;
}

export interface SEOOptions {
  /** Page title. Replaces existing <title> or inserts new one. */
  title?: string;
  /** Meta description. Replaces or inserts <meta name="description">. */
  description?: string;
  /** Primary image (og:image / twitter:image). */
  image?: string;
  /** Canonical URL. */
  canonical?: string;
  /** Inlines a <script> tag at the end of the <head>. */
  injectScript?: string;
  /** Additional dynamic meta tags (e.g., { "og:type": "article" }). */
  [key: string]: string | undefined;
}

export interface WebSocketBinding {
  /** 
   * Encaminha a requisição HTTP de Upgrade para o Durable Object (Sala).
   * Faz o sharding automático com base no roomId.
   */
  connect(request: Request, env: any, roomId?: string): Promise<Response>;
}

export interface WebSocketOptions {
  open?(ws: any, request: Request): void | Promise<void>;
  message?(ws: any, message: string | ArrayBuffer): void | Promise<void>;
  close?(ws: any, code: number, reason: string, wasClean: boolean): void | Promise<void>;
  error?(ws: any, error: any): void | Promise<void>;
  [key: string]: any;
}
