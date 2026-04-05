import "./runtime/safety";
export { getCloudflareContext, setCloudflareContext, getBunflareContext, setBunflareContext, getBunCloudflareContext } from "./runtime/context";
import type { WorkflowEvent, WorkflowStep, WorkflowBinding, ContainerBinding, ContainerOptions } from "./types";
export type { CloudflareEnv, CloudflareBindings, CloudflareContext, BunflareConfig, WorkflowEvent, WorkflowStep, WorkflowBinding, WorkflowInstance, ContainerBinding, ContainerInstance, ContainerOptions, DurableObjectState } from "./types";
export { defineConfig, loadConfig, loadWranglerConfig } from "./config";

/**
 * Helper to define a Cloudflare Workflow with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
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
 */
export function container<T extends ContainerOptions>(options: T): ContainerBinding {
  return options as any;
}

/**
 * Helper to define a Cloudflare Durable Object with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 */
/**
 * Helper to define a Cloudflare Durable Object with a fluid, Bun-style API.
 * This is transformed into a standard Cloudflare class by the bunflare build process.
 */
export function durable<T extends { fetch?: (request: any, state: any, env: any) => any;[key: string]: any }>(options: T): T {
  return options;
}
