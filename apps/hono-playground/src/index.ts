import { Hono } from "hono";
import { spa } from "bunflare/hono";
import { auth } from "./lib/auth";

const app = new Hono();

// 1. Better Auth handler (PRIORITY)
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// 2. API Status
app.get("/api/status", (c) => {
  return c.json({
    status: "online",
    framework: "Hono",
    runtime: "Bunflare",
  });
});

// 3. SPA Middleware (Static files + Fallback)
app.use("*", spa());

export default {
  fetch: app.fetch,
  development: true,
};
