import type { CloudflareContext } from "../types";

let _context: CloudflareContext | null = null;
let _initPromise: Promise<any> | null = null;

/**
 * Initializes Cloudflare mock bindings using Wrangler's getPlatformProxy.
 * This provides high-fidelity simulation of R2, D1, KV, etc.
 */
export async function initCloudflareMocks(): Promise<CloudflareContext | null> {
  if (_context) return _context;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      // We use a variable for the package name to hide it from static analysis
      // and ensure 'wrangler' is never bundled into the production worker.
      const pkg = "wrangler";
      const { getPlatformProxy } = await import(pkg);
      const proxy = await getPlatformProxy();
      
      _context = {
        env: proxy.env,
        cf: proxy.cf as any,
        ctx: proxy.ctx as any
      };
      
      return _context;
    } catch (e) {
      console.warn("[buncf] ⚠️ Failed to initialize official mocks via wrangler. Falling back to basic env.");
      return null;
    }
  })();

  return _initPromise;
}

/**
 * Sets the Cloudflare context. This is typically called by the generated worker entry point.
 */
export function setCloudflareContext(ctx: CloudflareContext) {
  _context = ctx;
}

/**
 * Retrieves the Cloudflare context (env, cf, ctx).
 * Automatically tries to use mocks during local development if Bun is present.
 */
export function getCloudflareContext<E = CloudflareBindings>(): CloudflareContext<E> {
  if (_context) return _context as unknown as CloudflareContext<E>;

  // --- Local Development Fallback ---
  if (typeof Bun !== "undefined") {
    // Note: Official mocks should be initialized via preload or calling initCloudflareMocks()
    // but we provide a basic fallback here just in case.
    return {
      env: process.env as unknown as E,
      cf: {} as any,
      ctx: {
        waitUntil: () => {},
        passThroughOnException: () => {}
      } as any
    };
  }

  // Fail-safe for production (should not happen if setCloudflareContext was called)
  return {
    env: {} as E,
    cf: {} as any,
    ctx: { waitUntil: () => {}, passThroughOnException: () => {} } as any
  };
}

/**
 * @deprecated Use getCloudflareContext instead
 */
export const getBuncfContext = getCloudflareContext;
/**
 * @deprecated Use setCloudflareContext instead
 */
export const setBuncfContext = setCloudflareContext;
