import { Hono } from "hono";
import { spa } from "bunflare/hono";

const app = new Hono();

app.get("/api/status", (c) => {
  return c.json({
    status: "online",
    framework: "Hono",
    runtime: "Bunflare",
  });
});

// SPA Middleware (Static files + Fallback)
app.use("*", spa());

export default app;
