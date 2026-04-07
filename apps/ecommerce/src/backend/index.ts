import { serve } from "bun";
import { api } from "./api";

export default serve({
  routes: {
    "/api/*": api.fetch
  },

  async fetch(req: Request, server: any, ...args: any[]) {
    const ctx = args[0];
    // SPA Fallback: Serve index.html for all non-API navigation routes
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/") && ctx?.env?.ASSETS) {
      return ctx.env.ASSETS.fetch(new Request(new URL("/index.html", req.url).toString(), req));
    }
  },
  development: {
    hmr: true,
    console: true
  }
});