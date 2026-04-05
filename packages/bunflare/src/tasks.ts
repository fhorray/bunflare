import { getCloudflareContext } from "./runtime/context";

/**
 * Tasks module providing high-level utilities for Background Tasks,
 * Queues, and other Cloudflare Worker asynchronous operations.
 */
export const tasks = {
  /**
   * Run a task in the background using Cloudflare's ExecutionContext (waitUntil).
   * Unlike standard async calls, this ensures the worker stays alive until the 
   * promise resolves, even after the Response has been sent.
   * 
   * @param task - A promise or an async function to run in the background.
   */
  background: (task: Promise<any> | (() => Promise<any>)) => {
    const { ctx } = getCloudflareContext();
    const promise = typeof task === "function" ? task() : task;
    
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(promise);
    } else {
      // Fallback for local dev environments where ctx might be mocked
      promise.catch(err => console.error("[bunflare:tasks] Background task failed:", err));
    }
  },

  /**
   * Send a message to a Cloudflare Queue binding.
   * 
   * @param queueName - The name of the Queue binding as defined in wrangler.jsonc.
   * @param body - The message body to enqueue (must be JSON serializable).
   * @param options - Optional Cloudflare Queue send options.
   */
  enqueue: async (queueName: string, body: any, options?: { delaySeconds?: number }) => {
    const { env } = getCloudflareContext<any>();
    const queue = env[queueName];

    if (!queue || typeof queue.send !== "function") {
      throw new Error(`Queue binding "${queueName}" not found or invalid in wrangler.jsonc.`);
    }

    return await queue.send(body, options);
  }
};
