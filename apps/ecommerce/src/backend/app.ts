import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { getCloudflareContext } from "bunflare";
import { withMetadata, spaFallback } from "bunflare/utils";

import * as schema from '../db/schema';
import { seed } from '../db/seed';
import type { CloudflareBindings } from "bunflare";
import indexHtml from "../index.html";

type Env = {
  Bindings: CloudflareBindings;
  Variables: { db: DrizzleD1Database<typeof schema> };
};

export const app = new Hono<Env>();

// Database Middleware
app.use("*", async (c, next) => {
  const { env } = getCloudflareContext();
  if (env.DB) c.set('db', drizzle(env.DB, { schema }));
  await next();
});

const getDb = (c: Context<Env>) => c.get('db');

// JWT Helper
const getJwtSecret = () => {
  const { env } = getCloudflareContext();
  return new TextEncoder().encode(env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long');
};

// Session Middleware (Helper)
const getSession = async (c: any) => {
  const token = getCookie(c, 'auth_session');
  if (!token) return null;

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch (e) {
    return null;
  }
};

// Public API
app.get("/api/products", async (c) => {
  const products = await getDb(c).query.products.findMany({
    where: eq(schema.products.status, 'active')
  });
  return c.json({ products });
});

app.get("/api/products/:id", async (c) => {
  const id = c.req.param("id");
  const product = await getDb(c).query.products.findFirst({ where: eq(schema.products.id, id) });
  return c.json({ product });
});

// Auth API
app.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = await getDb(c).query.users.findFirst({
    where: and(eq(schema.users.username, username), eq(schema.users.password, password))
  });

  if (user) {
    const secret = getJwtSecret();
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    setCookie(c, 'auth_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600 * 24 // 1 day
    });

    return c.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  }
  return c.json({ success: false, error: "Invalid credentials" }, 401);
});

app.post("/api/auth/register", async (c) => {
  const { username, password, name } = await c.req.json();
  const db = getDb(c);

  // Check existing
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.username, username)
  });
  if (existing) return c.json({ success: false, error: "Username already exists" }, 400);

  const id = `user_${Math.random().toString(36).substring(7)}`;
  await db.insert(schema.users).values({
    id,
    username,
    password, // In a real app, hash this!
    name,
    role: 'user'
  });

  return c.json({ success: true, id });
});

app.get("/api/auth/me", async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ loggedIn: false }, 401);
  return c.json({ loggedIn: true, user: session });
});

app.post("/api/auth/logout", async (c) => {
  deleteCookie(c, 'auth_session');
  return c.json({ success: true });
});

// Seed Endpoint (Public for testbed purposes)
app.all("/api/seed", async (c) => {
  try {
    await seed();
    return c.json({ success: true, message: "Database seeded correctly!" });
  } catch (e: any) {
    console.error("Seed error:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Admin Protection Middleware
const adminOnly = async (c: Context<Env>, next: any) => {
  const session = await getSession(c);
  if (!session || session.role !== 'admin') {
    return c.json({ error: "Access Denied. Admins only.", code: 'ADMIN_ONLY' }, 403);
  }
  await next();
};

// Admin API
app.get("/api/admin/orders", adminOnly, async (c) => {
  const db = getDb(c);
  const orders = await db.query.orders.findMany({
    with: {
      items: {
        with: {
          product: true
        }
      }
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)]
  });
  return c.json({ orders });
});

app.patch("/api/admin/orders/:id/status", adminOnly, async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json();
  const db = getDb(c);

  await db.update(schema.orders)
    .set({ status })
    .where(eq(schema.orders.id, id as string));

  return c.json({ success: true });
});

app.get("/api/admin/edge-logs", adminOnly, async (c) => {
  const db = getDb(c);
  const logs = await db.query.edgeLogs.findMany({
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit: 50
  });
  return c.json({ logs });
});

app.get("/api/admin/products", adminOnly, async (c) => {
  const products = await getDb(c).query.products.findMany();
  return c.json({ products });
});

app.post("/api/admin/products", adminOnly, async (c) => {
  const data = await c.req.json();
  const id = data.id || `prod_${Math.random().toString(36).substring(7)}`;
  await getDb(c).insert(schema.products).values({ ...data, id });
  return c.json({ success: true, id });
});

app.patch("/api/admin/products/:id", adminOnly, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  // Filter out id to prevent primary key mutation
  const { id: _, ...updateData } = data;

  await getDb(c).update(schema.products)
    .set(updateData)
    .where(eq(schema.products.id, id as string));

  return c.json({ success: true });
});

app.delete("/api/admin/products/:id", adminOnly, async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);

  // 1. Check if product exists in any order
  const orderWithItem = await db.query.orderItems.findFirst({
    where: eq(schema.orderItems.productId, id as string)
  });

  if (orderWithItem) {
    return c.json({
      success: false,
      error: "Cannot delete product with existing orders. Archive it instead to preserve sales history."
    }, 400);
  }

  // 2. Delete associated reviews first
  await db.delete(schema.reviews).where(eq(schema.reviews.productId, id as string));

  // 3. Delete the product
  await db.delete(schema.products).where(eq(schema.products.id, id as string));

  return c.json({ success: true });
});

// AI Endpoints
app.post("/api/ai/describe", adminOnly, async (c) => {
  const { name } = await c.req.json();
  const { env } = getCloudflareContext();

  if (!env.AI) {
    return c.json({ description: "Experience the premium quality of our hand-crafted products." });
  }

  const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages: [{ role: "user", content: `Write a very brief, premium 2-sentence product description for an item named "${name}". Do not use quotes.` }]
  });

  return c.json({ description: (response as any).response });
});

app.post("/api/ai/sentiment", async (c) => {
  const { comment } = await c.req.json();
  const { env } = getCloudflareContext();

  if (!env.AI) {
    return c.json({ sentiment: "Neutral / Positive" });
  }

  const response = await env.AI.run("@cf/huggingface/distilbert-sst-2-int8", {
    text: comment
  });

  const result = (response as any)[0];
  const sentiment = result.label === "POSITIVE" ? "Positive" : "Negative";
  return c.json({ sentiment: `${sentiment} (${(result.score * 100).toFixed(1)}%)` });
});

app.post("/api/admin/products/:id/simulate-concurrency", adminOnly, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Missing ID" }, 400);

  const { env } = getCloudflareContext();
  
  if (!env.STOCK_MANAGER) {
    return c.json({ error: "Missing STOCK_MANAGER binding. Cannot test DO." }, 400);
  }

  const doId = env.STOCK_MANAGER.idFromName(id);
  const stockManager = env.STOCK_MANAGER.get(doId);

  // Fire 50 concurrent requests to decrement stock by 1
  const promises = Array.from({ length: 50 }).map(() => 
    stockManager.fetch(new Request(`http://do/?productId=${id}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 1 })
    })).then(r => r.json()).catch(e => ({ success: false, error: e.message }))
  );

  const results = await Promise.all(promises);
  const successes = results.filter((r: any) => r.success).length;
  const failures = results.filter((r: any) => !r.success).length;

  return c.json({ 
    successes, 
    failures, 
    totalAttempted: 50,
    message: `Flash sale simulation complete. ${successes} successful purchases, ${failures} rejected due to atomic locking.`
  });
});

app.get("/api/workflows/:id/status", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);
  // Simulate workflow status API using DB state as source of truth
  const order = await db.query.orders.findFirst({
     where: eq(schema.orders.id, id)
  });
  
  if (!order) return c.json({ status: 'unknown' }, 404);
  
  let currentStep = 'queued';
  if (order.status === 'paid') currentStep = 'verifying_payment';
  if (order.status === 'shipped' || order.status === 'delivered') currentStep = 'complete';
  if (order.status === 'pending') currentStep = 'queued';

  return c.json({ 
     id, 
     status: order.status, 
     workflowStep: currentStep 
  });
});

// Checkout API
app.post("/api/checkout", async (c) => {
  const { userId, items } = await c.req.json();
  const db = getDb(c);
  const { env } = getCloudflareContext();

  const orderId = `ord_${Math.random().toString(36).substring(7)}`;
  const total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

  // Create Order
  await db.insert(schema.orders).values({
    id: orderId,
    userId: userId ? String(userId) : 'guest',
    total: total,
    status: 'pending',
    createdAt: new Date()
  });

  // Create Order Items
  for (const item of items) {
    await db.insert(schema.orderItems).values({
      id: `item_${Math.random().toString(36).substring(7)}`,
      orderId: orderId,
      productId: item.id,
      quantity: item.quantity,
      price: item.price
    });
  }

  // Dispatch Background Tasks
  if (env.EMAIL_PROCESSOR) {
    await env.EMAIL_PROCESSOR.send({
      event: 'order_created',
      details: { orderId, total, items: items.length }
    });
  }

  // Simulate Workflow Initiation
  const { ctx } = getCloudflareContext();
  const runWorkflow = async () => {
    try {
      const backgroundDb = env.DB ? drizzle(env.DB, { schema }) : db;
      await backgroundDb.insert(schema.edgeLogs).values({ id: `log_${Date.now()}`, event: 'workflow_start', details: `Started Fulfillment Workflow for ${orderId}`, createdAt: new Date()}).catch(() => {});
      await new Promise(r => setTimeout(r, 4000));
      await backgroundDb.update(schema.orders).set({ status: 'paid' }).where(eq(schema.orders.id, orderId));
      await backgroundDb.insert(schema.edgeLogs).values({ id: `log_${Date.now()+1}`, event: 'workflow_step', details: `Payment verified for ${orderId}`, createdAt: new Date()}).catch(() => {});
      await new Promise(r => setTimeout(r, 4000));
      await backgroundDb.update(schema.orders).set({ status: 'shipped' }).where(eq(schema.orders.id, orderId));
      await backgroundDb.insert(schema.edgeLogs).values({ id: `log_${Date.now()+2}`, event: 'workflow_complete', details: `Fulfillment complete for ${orderId}`, createdAt: new Date()}).catch(() => {});
    } catch(err) {
      console.error("Workflow mock failed:", err);
    }
  };

  if (ctx && typeof ctx.waitUntil === 'function') {
     ctx.waitUntil(runWorkflow());
  } else {
     setTimeout(runWorkflow, 0);
  }

  return c.json({ success: true, orderId });
});

// Invoice Simulation (Returns a simple file as a "PDF")
app.post("/api/render/invoice", async (c) => {
  const { orderId } = await c.req.json();
  const invoiceContent = `
    BUNFLARE SHOP - INVOICE
    Order ID: ${orderId}
    Date: ${new Date().toLocaleDateString()}
    ---------------------------
    Thank you for your purchase!
    This is an edge-generated invoice.
  `;

  return c.text(invoiceContent, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`
  });
});

// UI Fallback - Single Page Application Router
app.get("*", spaFallback({
  indexHtml,
  title: "Bunflare Shop",
  description: "Premium Shop"
}));
