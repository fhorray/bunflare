import { Hono } from "hono";
import { cache, tasks } from "bunflare";
import { rateLimit, flags } from "bunflare/edge";
import { getDb } from "../db";
import { products, analytics } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const api = new Hono<{ Bindings: any }>().basePath("/api");

// 1. Rate Limiting for Login & Checkout
const checkoutLimiter = rateLimit({
  binding: "CHECKOUT_LIMITER",
  limit: 5,
  window: 60
});

const loginLimiter = rateLimit({
  binding: "LOGIN_LIMITER",
  limit: 10,
  window: 60
});

// Products listing with Smart Cache and Background Tasks
api.get("/products", async (c) => {
  const db = getDb(c.env);

  // Background Task: Track product listing view
  tasks.background(async () => {
    await db.insert(analytics).values({ event: "products_viewed" });
  });

  // Smart Cache: Cache products for 60 seconds
  const data = await cache.getOrSet("products_list", 60, async () => {
    return await db.select().from(products).orderBy(desc(products.id)).limit(20);
  });

  return c.json(data);
});

api.get("/products/:id", async (c) => {
  const db = getDb(c.env);
  const id = Number(c.req.param("id"));

  const data = await cache.getOrSet(`product_${id}`, 60, async () => {
    const res = await db.select().from(products).where(eq(products.id, id));
    return res[0];
  });

  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json(data);
});

// Checkout with Feature Flags, Workflows, Queues, and Rate Limiting
api.post("/checkout", checkoutLimiter, async (c) => {
  const body = await c.req.json();
  const userId = c.req.header("x-user-id") || "anonymous";

  // Feature Flag: Check if new payment UI is enabled for this user
  const useNewPaymentFlow = await flags.evaluate("new_payment_ui", userId);
  
  if (useNewPaymentFlow) {
    console.log("Using new payment flow for user", userId);
  }

  // 1. Kickoff Order Workflow
  const workflowId = `order_${Date.now()}`;
  const workflowInstance = await c.env.ORDER_PROCESSING_WORKFLOW.create({
    id: workflowId,
    params: { orderId: workflowId, userId, amount: body.amount }
  });

  // 2. Enqueue Confirmation Email
  await tasks.enqueue("EMAIL_QUEUE", {
    type: "order_confirmation",
    to: body.email,
    orderId: workflowId
  });

  return c.json({ success: true, orderId: workflowId, workflowStatus: await workflowInstance.status() });
});

api.post("/login", loginLimiter, async (c) => {
  // Dummy login
  const body = await c.req.json();
  
  // Background task: log login attempt
  tasks.background(async () => {
    const db = getDb(c.env);
    await db.insert(analytics).values({ event: "login_attempt", data: JSON.stringify({ email: body.email }) });
  });

  return c.json({ token: "fake-jwt-token" });
});

// Admin action triggering queue and background task
api.post("/admin/upload-product-image", async (c) => {
  const body = await c.req.json();
  
  // Enqueue Image Processing
  await tasks.enqueue("IMAGE_PROCESSING_QUEUE", {
    productId: body.productId,
    imageUrl: body.imageUrl
  });

  return c.json({ status: "processing_queued" });
});

// Admin Feature flag usage
api.get("/admin/features", async (c) => {
  const userId = c.req.header("x-admin-id") || "admin1";
  
  const hasAnalyticsExport = await flags.evaluate("analytics_export", userId);
  
  return c.json({ features: { analyticsExport: hasAnalyticsExport } });
});

// Admin workflow trigger
api.post("/admin/export-analytics", async (c) => {
  await c.env.ANALYTICS_EXPORT_WORKFLOW.create({
    id: `export_${Date.now()}`
  });
  return c.json({ status: "export_started" });
});