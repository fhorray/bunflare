import "./runtime/safety";
export { ai } from "./ai";
export { getCloudflareContext, setCloudflareContext, getBunflareContext, setBunflareContext, getBunCloudflareContext } from "./runtime/context";
export { tasks } from "./tasks";
export { cache } from "./cache";
import type { WorkflowEvent, WorkflowStep, WorkflowBinding, ContainerBinding, ContainerOptions, MessageBatch, ScheduledEvent, QueueBinding, CronBinding } from "./types";
export type { CloudflareEnv, CloudflareBindings, CloudflareContext, BunflareConfig, WorkflowEvent, WorkflowStep, WorkflowBinding, WorkflowInstance, ContainerBinding, ContainerInstance, ContainerOptions, DurableObjectState, MessageBatch, Message, ScheduledEvent, QueueBinding, CronBinding } from "./types";
export { defineConfig, loadConfig, loadWranglerConfig } from "./config";

/**
 * Helper to define a Cloudflare Browser Rendering instance.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 * 
 * @example
 * export const MyPDF = browser({
 *   async run(page, req, env) {
 *     await page.goto("...");
 *     return new Response(await page.pdf());
 *   }
 * });
 */
export function browser<T extends { run: (page: any, req: Request, env: any) => Promise<Response>; [key: string]: any }>(options: T): T {
  return options;
}

/**
 * Helper to define a Cloudflare Workflow with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 * 
 * @example
 * export const myWorkflow = workflow({
 *   async run(event, step, env) {
 *     const data = await step.do("fetch data", async () => {
 *       return { hello: "world" };
 *     });
 *     return data;
 *   }
 * });
 */
export function workflow<T = any, Env = any>(options: {
  /** The main execution handler for this workflow. */
  run: (event: WorkflowEvent<T>, step: WorkflowStep, env: Env) => Promise<unknown>;
  /** Any other methods or properties for the workflow. */
  [key: string]: any;
}): WorkflowBinding<T> {
  return options as any;
}

/**
 * Helper to define a Cloudflare Container with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 * 
 * @example
 * export const myContainer = container({
 *   async onStart() {
 *     console.log("Container started!");
 *   }
 * });
 */
export function container<T extends ContainerOptions>(options: T): ContainerBinding {
  return options as any;
}

/**
 * Helper to define a Cloudflare Durable Object with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 * 
 * @example
 * export const MyDO = durable({
 *   async fetch(request, state, env) {
 *     return new Response("Hello from Durable Object!");
 *   }
 * });
 */
export function durable<T extends { fetch?: (request: any, state: any, env: any) => any; [key: string]: any }>(options: T): T {
  return options;
}
/**
 * Helper to define a Cloudflare Queue Consumer with a fluid, Bun-style API.
 * 
 * @example
 * export const EmailQueue = queue({
 *   async process(messages, env) {
 *     for (const msg of messages) {
 *       await sendEmail(msg.body);
 *       msg.ack();
 *     }
 *   }
 * });
 */
export function queue<T = any, Env = any>(options: QueueBinding<T, Env>): QueueBinding<T, Env> {
  return options;
}

/**
 * Helper to define a Cloudflare Workers RPC Service with a fluid, Bun-style API.
 * 
 * @example
 * export const MyService = rpc({
 *   async hello(name: string) {
 *     return `Hello, ${name}!`;
 *   }
 * });
 */
export function rpc<T extends Record<string, any>>(options: T): T {
  return options;
}

/**
 * Helper to define a Cloudflare Scheduled Task (Cron) with a fluid, Bun-style API.
 * 
 * @example
 * export const nightlyCleanup = cron({
 *   schedule: "0 0 * * *",
 *   async run(event, env) {
 *     await cleanup(env.DB);
 *   }
 * });
 */
export function cron<Env = any>(options: CronBinding<Env>): CronBinding<Env> {
  return options;
}
