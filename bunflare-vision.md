# 🚀 Bunflare: The Ultimate Vision & Masterplan

Welcome to the **Bunflare Masterplan**. This document outlines the roadmap and vision for Bunflare, an ecosystem designed to bridge the incredible speed of the Bun runtime with the limitless scalability of Cloudflare's Edge infrastructure.

The goal of Bunflare is to become the "Standard Library" for Cloudflare Workers, providing a Zero-Config, auto-provisioning, and magically fluid Developer Experience (DX). This document explores the architectural philosophy, the CLI auto-provisioning magic, and deep dives into every major Cloudflare feature mapped to a Bun-first API.

---

## Table of Contents

1. [Core Philosophy and DX](#1-core-philosophy-and-dx)
2. [The Auto-Provisioning CLI (Infrastructure as Code... without the code)](#2-the-auto-provisioning-cli)
3. [SEO & HTMLRewriter (`withMetadata`)](#3-seo--htmlrewriter)
4. [Background Tasks (`tasks`)](#4-background-tasks)
5. [Browser Rendering (`browser()`)](#5-browser-rendering)
6. [Worker-to-Worker RPC (`service()`)](#6-worker-to-worker-rpc)
7. [Message Queues (`queue()`)](#7-message-queues)
8. [Scheduled Tasks (`cron()`)](#8-scheduled-tasks)
9. [Email Handling & Sending (`email()` & `sendEmail`)](#9-email-handling--sending)
10. [Hyperdrive & Relational Databases (`pg()`)](#10-hyperdrive--relational-databases)
11. [Smart Cache & Edge Utilities (`cache()`, `rateLimit()`, `flags()`)](#11-smart-cache--edge-utilities)
12. [AI at the Edge (`ai()`)](#12-ai-at-the-edge)
13. [Image Optimization & Storage (`images()`)](#13-image-optimization--storage)
14. [Serverless Pipelines (`pipeline()`)](#14-serverless-pipelines)
15. [Safe Execution & Isolation (`sandbox()`)](#15-safe-execution--isolation)
16. [Secrets Store (`secrets()`)](#16-secrets-store)
17. [Analytics Engine (`metrics()`)](#17-analytics-engine)
18. [Appendix: Deep Architectural Specifications](#18-appendix-deep-architectural-specifications)
19. [Appendix: Advanced Deployment Strategies](#19-appendix-advanced-deployment-strategies)
20. [Appendix: Local Emulation & Testing](#20-appendix-local-emulation--testing)
21. [Extensive Developer FAQ](#21-extensive-developer-faq)
22. [Conclusion & Future Outlook](#22-conclusion--future-outlook)

---

## 1. Core Philosophy and DX

The serverless landscape is currently fragmented. Developers love the Edge, but setting up bindings, configuring `wrangler.toml` or `wrangler.jsonc`, parsing environments, and passing `env` and `ctx` objects down the dependency tree is tedious and error-prone.

Bunflare introduces **Contextual Independence**. By leveraging global contexts (`getCloudflareContext`), developers write code that looks exactly like traditional Node.js/Bun server applications, yet runs distributed across hundreds of data centers globally.

### Principles:

- **No `env` drilling:** Stop passing `env` to every function.
- **Convention over Configuration:** Code dictates the infrastructure, not the other way around.
- **Type-Safety by default:** Every binding, queue, and database is fully typed.
- **Zero-Config Deployments:** The CLI understands what you need and creates it.

The traditional approach requires developers to maintain mental models of both their application logic and their infrastructure deployment state. Bunflare unifies these models by making the code the definitive source of truth for the infrastructure.

---

## 2. The Auto-Provisioning CLI

Currently, developers spend hours in the Cloudflare Dashboard or running `wrangler` CLI commands to create D1 databases, R2 buckets, KV namespaces, and Queues.

Bunflare changes this by analyzing the Abstract Syntax Tree (AST) of the user's code during the `bunflare build` or `bunflare deploy` step. If the CLI is authenticated via `wrangler login` (reading the OAuth token), it can interact directly with the Cloudflare REST API.

### How it Works:

1. **Code Analysis:** The compiler finds `export const db = d1("my-database")`.
2. **State Check:** Bunflare queries the Cloudflare API: _"Does 'my-database' exist in this account?"_
3. **Provisioning:** If no, Bunflare calls `POST /accounts/:id/d1/database` to create it.
4. **Binding:** Bunflare automatically injects the new Database ID into the generated `wrangler.jsonc`.

### Example 1: Database Auto-Creation

```typescript
import { d1 } from 'bunflare';

// The CLI sees this. It ensures "production-db" exists in Cloudflare.
// If not, it creates it silently during deploy.
export const db = d1('production-db');
```

### Example 2: Secret Syncing

Instead of `wrangler secret put`, Bunflare reads `.env.production`:

```bash
# .env.production
STRIPE_KEY=sk_test_12345
OPENAI_API_KEY=sk-abcde
```

On `bunflare deploy`, it encrypts and pushes these secrets to the Cloudflare API automatically.

### Example 3: Custom Domains

```typescript
import { config } from 'bunflare';

export default config({
  domain: 'api.myawesomeapp.com',
  zone: 'myawesomeapp.com',
});
```

The CLI automatically configures the DNS and Worker Route via the Cloudflare API.

---

## 3. SEO & HTMLRewriter

When building Fullstack applications with Bun's native `Bun.serve()`, injecting dynamic SEO metadata into statically bundled HTML files requires intercepting the stream. Bunflare abstracts `HTMLRewriter` into a blazing-fast utility.

### Example 1: Basic Metadata Injection

```typescript
import { serve } from 'bun';
import { withMetadata } from 'bunflare/seo';
import indexHtml from './public/index.html';

export default serve({
  async fetch(req) {
    const response = new Response(indexHtml, {
      headers: { 'Content-Type': 'text/html' },
    });

    return withMetadata(response, {
      title: 'Welcome to Bunflare',
      description: 'The best framework for Cloudflare.',
      image: 'https://bunflare.com/og-image.png',
    });
  },
});
```

### Example 2: Dynamic DB-Driven SEO in Hono

```typescript
import { Hono } from 'hono';
import { withMetadata, getCloudflareContext } from 'bunflare';
import indexHtml from './index.html';

const app = new Hono();

app.get('/users/:username', async (c) => {
  const { env } = getCloudflareContext();
  const username = c.req.param('username');

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first();

  const baseResponse = new Response(indexHtml, {
    headers: { 'Content-Type': 'text/html' },
  });

  return withMetadata(baseResponse, {
    title: `${user.name} (@${username}) | Profile`,
    description: `Check out ${user.name}'s profile on our platform!`,
    'twitter:card': 'summary_large_image',
  });
});

export default app;
```

### Example 3: Modifying Custom Elements

You can extend `withMetadata` to manipulate other DOM elements dynamically.

```typescript
import { withMetadata } from 'bunflare/seo';

const res = new Response(
  `<html><head></head><body><div id="app"></div></body></html>`,
);

return withMetadata(res, {
  title: 'Dynamic App',
  // Bunflare's extended SEO utility can inject preloaded state
  injectScript: `window.__INITIAL_STATE__ = ${JSON.stringify({ userId: 123 })};`,
});
```

---

## 4. Background Tasks

Cloudflare Workers terminate immediately when a Response is returned. `waitUntil` is required to keep them alive for background tasks like logging or webhooks. Bunflare's `tasks` module makes this globally accessible.

### Example 1: Fire-and-Forget Analytics

```typescript
import { tasks } from 'bunflare';

export async function processPayment(amount: number) {
  const result = await chargeStripe(amount);

  // This runs in the background. The user gets their response immediately.
  // We do not need to pass `ctx` from the HTTP handler!
  tasks.background(
    fetch('https://analytics.internal/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'payment', amount }),
    }),
  );

  return result;
}
```

### Example 2: Sending Messages to a Queue

```typescript
import { tasks } from 'bunflare';

app.post('/signup', async (c) => {
  const user = await db.insertUser(c.req.json());

  // Send to Cloudflare Queue without boilerplate
  await tasks.enqueue('WELCOME_EMAILS', {
    userId: user.id,
    email: user.email,
  });

  return c.json({ success: true });
});
```

### Example 3: Background Batch Processing

```typescript
import { tasks } from "bunflare";

app.post("/upload-logs", async (c) => {
  const logs = await c.req.json();

  // Keep the worker alive to process a heavy batch operation
  tasks.background(async () => {
    const { env } = getCloudflareContext();
    for (const log of logs) {
      await env.D1.prepare("INSERT INTO logs (data) VALUES (?)").bind(log).run();
    }
  }());

  return new Response("Logs accepted", { status: 202 });
});
```

---

## 5. Browser Rendering

Cloudflare's Browser Rendering API allows developers to control headless browsers (Puppeteer) at the edge. Bunflare abstracts the WebSocket connection management and session limits.

### Example 1: Generating PDFs

```typescript
import { browser } from 'bunflare';

export const PDFGenerator = browser({
  async run(page, req, env) {
    const url = new URL(req.url).searchParams.get('url');

    await page.goto(url, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });

    return new Response(pdf, {
      headers: { 'Content-Type': 'application/pdf' },
    });
  },
});
```

### Example 2: Web Scraping API

```typescript
import { browser } from 'bunflare';

export const PriceScraper = browser({
  async run(page, req, env) {
    const body = await req.json();
    await page.goto(body.productUrl);

    // Evaluate runs inside the headless browser
    const price = await page.evaluate(() => {
      return document.querySelector('.price-tag')?.textContent;
    });

    return Response.json({ price });
  },
});
```

### Example 3: Automated Testing / Health Checks

```typescript
import { browser } from 'bunflare';

export const HealthCheckBot = browser({
  async run(page, req, env) {
    await page.goto('https://myapp.com/login');
    await page.type('#email', 'test@myapp.com');
    await page.type('#password', 'password123');
    await page.click('#login-btn');

    await page.waitForNavigation();
    const success = (await page.$('#dashboard-header')) !== null;

    return Response.json({ status: success ? 'healthy' : 'failing' });
  },
});
```

---

## 6. Worker-to-Worker RPC

Cloudflare Workers RPC allows Workers to call functions on other Workers with zero HTTP overhead. Bunflare makes declaring and consuming these services as easy as importing a class.

### Example 1: Defining an RPC Service

```typescript
// payments-worker.ts
import { rpc } from 'bunflare';

export const PaymentService = rpc({
  async processCharge(userId: string, amount: number) {
    // Complex payment logic here
    console.log(`Charging ${userId} $${amount}`);
    return { transactionId: 'txn_999', success: true };
  },

  async refund(transactionId: string) {
    return { success: true };
  },
});
```

### Example 2: Consuming the RPC Service

```typescript
// main-api.ts
import { getCloudflareContext } from 'bunflare';

app.post('/checkout', async (c) => {
  const { env } = getCloudflareContext();

  // Call the Worker directly over the internal RPC protocol!
  // No fetch(), no URLs, fully type-safe.
  const result = await env.PAYMENTS.processCharge('user_123', 50.0);

  return c.json(result);
});
```

### Example 3: Stateful RPC with Durable Objects

```typescript
import { durableRpc } from 'bunflare';

export const GameRoom = durableRpc({
  players: [],

  async join(playerName: string) {
    this.players.push(playerName);
    return { state: this.players };
  },

  async broadcast(message: string) {
    // send to all WebSockets
  },
});
```

---

## 7. Message Queues

Cloudflare Queues enable guaranteed delivery and background processing. Bunflare turns queue consumers into modular, exportable units.

### Example 1: Standard Queue Consumer

```typescript
import { queue } from 'bunflare';

export const EmailQueue = queue({
  batchSize: 50,
  maxRetries: 3,

  async process(messages, env) {
    for (const msg of messages) {
      try {
        await sendWelcomeEmail(msg.body.email);
        msg.ack(); // Acknowledge success
      } catch (e) {
        msg.retry(); // Will retry later
      }
    }
  },
});
```

### Example 2: Dead Letter Queue Processing

```typescript
import { queue } from 'bunflare';

export const FailedJobsQueue = queue({
  async process(messages, env) {
    for (const msg of messages) {
      // Alert engineering team via Slack about failed jobs
      await fetch('https://slack.com/api/...', {
        method: 'POST',
        body: JSON.stringify({ text: `Job Failed: ${msg.body.error}` }),
      });
      msg.ack();
    }
  },
});
```

### Example 3: Bulk Data Ingestion

```typescript
import { queue } from 'bunflare';

export const AnalyticsIngestionQueue = queue({
  maxBatchTimeout: 10, // Wait up to 10 seconds to fill batch

  async process(messages, env) {
    // Combine all messages into a single D1 transaction
    const stmts = messages.map((m) =>
      env.DB.prepare('INSERT INTO events (type, payload) VALUES (?, ?)').bind(
        m.body.type,
        m.body.payload,
      ),
    );

    await env.DB.batch(stmts);
    messages.forEach((m) => m.ack());
  },
});
```

---

## 8. Scheduled Tasks

Cloudflare Cron Triggers execute Workers on a schedule. Bunflare's `cron` utility allows developers to define the schedule right in the code, which the CLI parses to auto-update the deployment config.

### Example 1: Nightly Database Cleanup

```typescript
import { cron } from 'bunflare';

// The CLI automatically adds "0 0 * * *" to wrangler.jsonc
export const nightlyCleanup = cron({
  schedule: '0 0 * * *',
  async run(event, env) {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await env.DB.prepare('DELETE FROM sessions WHERE last_active < ?')
      .bind(thirtyDaysAgo)
      .run();
    console.log('Cleanup complete!');
  },
});
```

### Example 2: Weekly Report Generation

```typescript
import { cron } from 'bunflare';

export const weeklyReport = cron({
  schedule: '0 8 * * 1', // Every Monday at 8 AM
  async run(event, env) {
    const stats = await generateStats();
    await sendEmail(
      'admin@company.com',
      'Weekly Report',
      JSON.stringify(stats),
    );
  },
});
```

### Example 3: High-Frequency Polling

```typescript
import { cron } from 'bunflare';

export const syncExternalAPI = cron({
  schedule: '*/5 * * * *', // Every 5 minutes
  async run(event, env) {
    const data = await fetch('https://api.external.com/status').then((res) =>
      res.json(),
    );
    await env.KV.put('external_status', JSON.stringify(data));
  },
});
```

---

## 9. Email Handling & Sending

Cloudflare's Email Routing allows Workers to receive emails, and the `cloudflare:email` module allows sending them. Bunflare simplifies MIME generation and email parsing.

### Example 1: Sending an Email (The Helper)

```typescript
import { sendEmail } from 'bunflare/mail';

app.post('/forgot-password', async (c) => {
  const { email } = await c.req.json();
  const token = generateToken();

  // Send an email effortlessly. Behind the scenes, this constructs
  // the complex MIME structure required by cloudflare:email
  await sendEmail('SEB', {
    // SEB = Send Email Binding Name
    from: 'support@bunflare.app',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="https://app.com/reset?token=${token}">here</a> to reset your password.</p>`,
    text: `Reset link: https://app.com/reset?token=${token}`,
  });

  return c.json({ ok: true });
});
```

### Example 2: Receiving and Parsing Emails

```typescript
import { email } from 'bunflare';

export const SupportInbox = email({
  async receive(message, env) {
    // message is pre-parsed by Bunflare
    const sender = message.headers.get('From');
    const subject = message.headers.get('Subject');

    // Save the raw email to R2 for archiving
    await env.ARCHIVE_BUCKET.put(`support/${message.id}.eml`, message.raw);

    // Auto-reply
    await message.reply({
      from: 'support@bunflare.app',
      text: 'We received your message and will respond shortly.',
    });
  },
});
```

### Example 3: Forwarding Emails based on Content

```typescript
import { email } from 'bunflare';

export const SmartRouter = email({
  async receive(message, env) {
    const subject = message.headers.get('Subject') || '';

    if (subject.toLowerCase().includes('urgent')) {
      await message.forward('oncall@company.com');
    } else if (subject.toLowerCase().includes('billing')) {
      await message.forward('finance@company.com');
    } else {
      await message.forward('general@company.com');
    }
  },
});
```

---

## 10. Hyperdrive & Relational Databases

Cloudflare Hyperdrive maintains a regional connection pool to traditional databases (Postgres, MySQL) so Workers can query them at low latency without exhausting connections.

### Example 1: Instant Postgres Driver

```typescript
import { pg } from 'bunflare';

app.get('/employees', async (c) => {
  // `pg()` automatically uses the Hyperdrive binding internally
  const db = pg('COMPANY_DB');

  const { rows } = await db.query('SELECT * FROM employees WHERE active = $1', [
    true,
  ]);

  return c.json(rows);
});
```

### Example 2: Transactions via Hyperdrive

```typescript
import { pg } from 'bunflare';

app.post('/transfer', async (c) => {
  const db = pg('FINANCE_DB');
  const { from, to, amount } = await c.req.json();

  await db.transaction(async (tx) => {
    await tx.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [
      amount,
      from,
    ]);
    await tx.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [
      amount,
      to,
    ]);
  });

  return c.json({ success: true });
});
```

### Example 3: Type-Safe ORM Integration

Bunflare can integrate smoothly with Drizzle ORM using the Hyperdrive connection.

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pg } from 'bunflare';
import * as schema from './schema';

app.get('/users/:id', async (c) => {
  // Inject the Bunflare PG client into Drizzle
  const db = drizzle(pg('HYPER_DB').getClient(), { schema });

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, c.req.param('id')),
  });

  return c.json(user);
});
```

---

## 11. Smart Cache & Edge Utilities

Managing `caches.default` is verbose. Bunflare's `cache` module, along with edge utilities like Rate Limiting and Feature Flags, make Edge computing a breeze.

### Example 1: The Smart Cache

```typescript
import { cache } from 'bunflare';

app.get('/leaderboard', async (c) => {
  // Checks Cloudflare Edge Cache. If miss, runs the function, caches for 60s, returns.
  const topPlayers = await cache.getOrSet(
    'global_leaderboard',
    { ttl: 60 },
    async () => {
      return await db.query(
        'SELECT * FROM players ORDER BY score DESC LIMIT 10',
      );
    },
  );

  return c.json(topPlayers);
});
```

### Example 2: API Rate Limiting

```typescript
import { rateLimit } from 'bunflare/edge';

// Limit to 5 requests per minute per IP
const authLimiter = rateLimit({
  binding: 'RATE_LIMITER', // Uses CF API or DO internally
  limit: 5,
  window: '1m',
  identifier: (c) => c.req.header('cf-connecting-ip'),
});

app.post('/login', authLimiter, async (c) => {
  return c.json({ token: 'abc' });
});
```

### Example 3: Edge A/B Testing (Feature Flags)

```typescript
import { flags } from 'bunflare/edge';

app.get('/hero-banner', async (c) => {
  const userId = c.req.header('x-user-id') || 'anonymous';

  // Instant evaluation at the Edge
  const showNewBanner = await flags.evaluate('new_homepage_banner', userId);

  if (showNewBanner) {
    return c.html(`<div class="new-banner">Welcome!</div>`);
  }
  return c.html(`<div class="old-banner">Hello.</div>`);
});
```

---

## 12. AI at the Edge

Cloudflare Workers AI allows running LLMs, Image Generation, and Text Embeddings directly on Cloudflare GPUs. Bunflare provides a strictly typed, easy-to-use wrapper.

### Example 1: Text Generation

```typescript
import { ai } from 'bunflare';

app.post('/chat', async (c) => {
  const { prompt } = await c.req.json();

  // ai() automatically finds the AI binding from context
  const response = await ai.generateText({
    model: '@cf/meta/llama-3-8b-instruct',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
  });

  return c.json({ reply: response });
});
```

### Example 2: Vector Search with Vectorize

```typescript
import { ai, vectorize } from 'bunflare';

app.post('/search', async (c) => {
  const { query } = await c.req.json();

  // 1. Generate embeddings using AI
  const embedding = await ai.generateEmbeddings({
    model: '@cf/baai/bge-base-en-v1.5',
    text: query,
  });

  // 2. Query the Vectorize index
  const index = vectorize('KNOWLEDGE_BASE');
  const matches = await index.query(embedding, { topK: 5 });

  return c.json(matches);
});
```

### Example 3: Image Classification

```typescript
import { ai } from 'bunflare';

app.post('/upload-image', async (c) => {
  const formData = await c.req.formData();
  const image = formData.get('file') as File;

  const classification = await ai.classifyImage({
    model: '@cf/microsoft/resnet-50',
    image: await image.arrayBuffer(),
  });

  return c.json({ labels: classification });
});
```

---

## 13. Image Optimization & Storage

Cloudflare Images provides a scalable, fast way to store, resize, and serve images. Traditionally, integrating this requires dealing with Cloudflare's direct upload API and managing access tokens manually.

Bunflare abstracts this into an `images()` utility, seamlessly allowing developers to upload, transform, and serve optimized images with a single line of code.

### Example 1: Direct Image Upload

```typescript
import { images } from 'bunflare';

app.post('/upload-avatar', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  // Automatically uses the CF Images API token configured by the Bunflare CLI
  const result = await images.upload(file, {
    requireSignedURLs: false,
    metadata: { userId: 'user_123' },
  });

  return c.json({ url: result.variants[0] });
});
```

### Example 2: On-the-Fly Image Resizing (Transformations)

```typescript
import { images } from 'bunflare';

// A route that fetches an image from R2 or external source and resizes it on the edge
app.get('/avatar/:id', async (c) => {
  const userId = c.req.param('id');
  const imageUrl = `https://my-bucket.com/avatars/${userId}.jpg`;

  // Uses Cloudflare Image Resizing features seamlessly
  const optimizedImage = await images.transform(imageUrl, {
    width: 150,
    height: 150,
    fit: 'crop',
    format: 'webp',
  });

  return new Response(optimizedImage.body, {
    headers: { 'Content-Type': 'image/webp' },
  });
});
```

### Example 3: Generating Signed URLs for Private Images

```typescript
import { images } from 'bunflare';

app.get('/private-gallery/:imageId', async (c) => {
  const imageId = c.req.param('imageId');

  // Generate a short-lived signed URL for a private image
  const signedUrl = await images.getSignedUrl(imageId, {
    expiresIn: '1h',
    variant: 'high-res',
  });

  return c.redirect(signedUrl);
});
```

---

## 14. Serverless Pipelines

Cloudflare Pipelines (Data/Event Pipelines) allow you to ingest, transform, and route data at scale. Instead of managing complex Logpush or data ingestion setups manually, Bunflare provides a `pipeline()` construct.

### Example 1: Defining a Data Ingestion Pipeline

```typescript
import { pipeline } from 'bunflare';

export const LogsPipeline = pipeline({
  // Automatically provisioned via Bunflare CLI
  source: 'HTTP',

  async transform(events, env) {
    // Filter and sanitize sensitive data before routing
    return events
      .filter((e) => e.level === 'ERROR')
      .map((e) => {
        delete e.user.password;
        return e;
      });
  },

  destination: {
    type: 'hyperdrive',
    table: 'error_logs',
  },
});
```

### Example 2: Webhook Routing Pipeline

```typescript
import { pipeline } from 'bunflare';

export const WebhookRouter = pipeline({
  source: 'WEBHOOK',

  async transform(payload, env) {
    // Normalize payloads from different providers (Stripe, PayPal)
    return {
      amount: payload.amount || payload.value,
      currency: payload.currency || 'USD',
    };
  },

  // Send normalized data to a Cloudflare Queue
  destination: 'QUEUE_PAYMENTS',
});
```

### Example 3: Edge Streaming to Analytics

```typescript
import { pipeline } from 'bunflare';

export const AnalyticsPipeline = pipeline({
  source: 'QUEUE_EVENTS',

  async transform(batch, env) {
    return batch.map((event) => ({
      doubles: [event.value],
      labels: [event.type, event.region],
    }));
  },

  // Directly pipe transformed data into Cloudflare Analytics Engine
  destination: 'ANALYTICS_ENGINE',
});
```

---

## 15. Safe Execution & Isolation

Cloudflare Sandbox (or Snippets/Isolates) allows you to execute untrusted code safely. If you are building a platform where users can submit their own logic (like a programmable webhook or custom script), Bunflare provides an isolated execution context.

### Example 1: Running Untrusted User Code

```typescript
import { sandbox } from 'bunflare';

app.post('/execute', async (c) => {
  const { code, data } = await c.req.json();

  // Run user-submitted code in a strict, isolated V8 environment
  const result = await sandbox.run(code, {
    args: [data],
    timeout: 50, // Max 50ms execution
    memoryLimit: '10MB',
    allowNetwork: false, // Prevent outbound fetches
  });

  return c.json({ result });
});
```

### Example 2: Programmable Webhooks for Users

```typescript
import { sandbox } from 'bunflare';

app.post('/webhook/:userId', async (c) => {
  const payload = await c.req.json();
  const userScript = await db.getUserScript(c.req.param('userId'));

  // The user's script can modify the payload but has no access to environment variables
  const modifiedPayload = await sandbox.run(userScript, {
    globals: { payload },
  });

  return c.json({ processed: modifiedPayload });
});
```

### Example 3: Dynamic Rule Engines

```typescript
import { sandbox } from 'bunflare';

export const DiscountEngine = async (cart, ruleScript) => {
  return await sandbox.run(ruleScript, {
    args: [cart],
    timeout: 10,
  });
};

app.post('/checkout', async (c) => {
  const cart = await c.req.json();
  // ruleScript: `return cart.total > 100 ? cart.total * 0.9 : cart.total;`
  const newTotal = await DiscountEngine(cart, c.req.header('rule-script'));

  return c.json({ total: newTotal });
});
```

---

## 16. Secrets Store

Managing secrets securely is critical for modern applications. Traditionally, Cloudflare Workers relied on environment variables or manual `wrangler secret put` commands. Cloudflare's new Secrets Store provides a centralized, secure repository for credentials, API keys, and sensitive data.

Bunflare integrates the Secrets Store natively, providing a `secrets()` utility that abstracts the retrieval and decryption of secrets at runtime, ensuring sensitive data is never hardcoded or leaked in the repository.

### Example 1: Retrieving an API Key Securely

```typescript
import { secrets } from 'bunflare';

app.post('/process-payment', async (c) => {
  // Fetch the Stripe API key securely from the Cloudflare Secrets Store
  const stripeKey = await secrets.get('STRIPE_SECRET_KEY');

  const paymentResult = await processStripePayment(stripeKey, c.req.json());
  return c.json(paymentResult);
});
```

### Example 2: Rotating Database Credentials

```typescript
import { secrets, pg } from 'bunflare';

app.get('/data', async (c) => {
  // Retrieve the latest database password, allowing seamless rotation without redeploying the worker
  const dbPassword = await secrets.get('DB_PASSWORD');

  // Use the secret to connect to a legacy database
  const db = pg('LEGACY_DB', { password: dbPassword });
  const data = await db.query('SELECT * FROM sensitive_data');

  return c.json(data);
});
```

### Example 3: CLI Secret Syncing (Development vs Production)

Bunflare CLI provides tools to sync local `.env` files to the Secrets Store automatically during deployment.

```bash
# Automatically creates or updates the secret in the Cloudflare Secrets Store
bunflare secret push OPENAI_API_KEY --env production
```

Inside the worker:

```typescript
import { secrets } from 'bunflare';

export const aiAssistant = async (prompt) => {
  const apiKey = await secrets.get('OPENAI_API_KEY');
  // Use apiKey for OpenAI requests...
};
```

---

## 17. Analytics Engine

Cloudflare Workers Analytics Engine is a powerful time-series database designed for writing high-cardinality data at scale with extremely low latency. It is perfect for logging events, tracking usage, and monitoring performance directly from the edge.

Bunflare abstracts the underlying `env.ANALYTICS.writeDataPoint()` API into a fluent `metrics` utility that makes tracking events effortless.

### Example 1: Tracking E-commerce Sales Events

```typescript
import { metrics } from 'bunflare';

app.post('/checkout/success', async (c) => {
  const order = await c.req.json();

  // Instantly write a data point to the Analytics Engine
  // This data can later be queried via the Cloudflare GraphQL API
  metrics.write('ecommerce_sales', {
    doubles: [order.totalAmount, order.tax], // Numeric values for aggregation
    labels: [order.country, order.currency, order.paymentMethod], // Categorical data for grouping
  });

  return c.json({ success: true, orderId: order.id });
});
```

### Example 2: API Usage and Rate Limit Tracking

```typescript
import { metrics } from 'bunflare';
import { Hono } from 'hono';

const app = new Hono();

// A middleware that logs every request's latency and status code
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;

  metrics.write('api_usage', {
    doubles: [duration],
    labels: [
      c.req.method,
      new URL(c.req.url).pathname,
      c.res.status.toString(),
      c.req.header('cf-connecting-ip') || 'unknown',
    ],
  });
});
```

### Example 3: Feature Usage Telemetry

```typescript
import { metrics } from 'bunflare';

export async function processImageUpload(file: File, userTier: string) {
  const fileSizeMb = file.size / (1024 * 1024);

  // Track how users are utilizing the image upload feature based on their subscription tier
  metrics.write('feature_usage', {
    doubles: [fileSizeMb],
    labels: ['image_upload', userTier, file.type],
  });

  // Proceed with upload...
}
```

---

## 18. Appendix: Deep Architectural Specifications

To truly understand the power of Bunflare, one must understand how it transforms code during the build process and how the runtime contexts are initialized.

### 18.1 The Build Pipeline

The Bunflare compiler is a multi-stage pipeline:

1. **Lexical Analysis & Parsing:** Utilizing Bun's fast AST parsers to understand the dependency graph.
2. **Transform Extraction:** Identifying `workflow()`, `durable()`, `queue()`, and `cron()` declarations.
3. **Code Generation:** Generating the Cloudflare `export default { fetch, queue, scheduled, email }` wrapper dynamically.
4. **Wrangler Sync:** Emitting a `.bunflare/wrangler.json` tailored specifically to the extracted AST features.

#### Example Transformation

User writes:

```typescript
export const myCron = cron({ schedule: '*/10 * * * *', run: async () => {} });
```

Bunflare Compiler outputs (internal):

```typescript
export default {
  async scheduled(event, env, ctx) {
    if (event.cron === '*/10 * * * *') {
      await myCron.run(event, env);
    }
  },
};
```

### 18.2 The Context Provider (`_context`)

The `getCloudflareContext()` function works by relying on a module-scoped variable initialized at the absolute beginning of the Request Lifecycle.

```typescript
// internal/runtime.ts
let _context = null;

export function setCloudflareContext(env, cf, ctx) {
  _context = { env, cf, ctx };
}

export function getCloudflareContext() {
  if (!_context)
    throw new Error('Context accessed outside of Request lifecycle');
  return _context;
}
```

Because Cloudflare Workers isolate execution per-request (or safely within the same isolate if synchronous), this module-scoped variable provides safe, dependency-injection-free access to bindings.

### 18.3 D1 Advanced Query Building

The `d1()` helper does more than just forward SQL. It includes query batching mechanisms.

```typescript
// Advanced D1 Usage
import { d1 } from 'bunflare';

export async function bulkInsert(users) {
  const db = d1('DB');

  // Bunflare chunks the users array into batches of 100 to avoid D1 limits
  await db.batchInsert('users', ['name', 'email'], users);
}
```

### 18.4 Vectorize Inner Workings

Cloudflare Vectorize is powerful but raw. Bunflare maps objects to vectors automatically.

```typescript
// Vectorize Object Mapping
import { vectorize } from 'bunflare';

const vdb = vectorize('DOCS');

await vdb.insert({
  id: 'doc_1',
  values: [0.1, 0.2, 0.3], // The vector
  metadata: { url: '/doc/1', title: 'Intro' },
});
```

### 18.5 Analytics Engine Aggregations

Because Analytics Engine is append-only, Bunflare provides utilities to query via GraphQL.

```typescript
import { metrics } from 'bunflare';

export async function getDailySales() {
  // Automatically crafts the complex GraphQL query to Cloudflare's API
  return await metrics.query({
    dataset: 'sales_events',
    timeframe: '24h',
    metrics: ['sum(doubles_1) as total'],
    groupBy: ['labels_1'], // Country
  });
}
```

### 18.6 WebSockets and Hibernation

Cloudflare Durable Objects support WebSocket Hibernation. Bunflare abstracts the Hibernation API so you don't need to manage `state.getWebSockets()`.

```typescript
import { durableWs } from 'bunflare';

export const ChatRoom = durableWs({
  async onConnect(ws, state) {
    ws.serializeAttachment({ userId: '123' });
  },

  async onMessage(ws, message, state) {
    // Broadcasts to all connected clients without waking them up unnecessarily
    state.getWebSockets().forEach((client) => client.send(message));
  },
});
```

### 18.7 Service Bindings vs Fetch

Using `service()` (RPC) is orders of magnitude faster than `fetch()` because it avoids the HTTP stack.

```typescript
// Traditional Fetch
const res = await fetch('https://internal-service.com/data');
const data = await res.json();

// Bunflare RPC
const data = await env.INTERNAL.getData();
```

The latency difference is often >20ms vs <1ms.

### 18.8 Managing Environment Variables

Instead of using `process.env`, Bunflare unifies access via the injected Cloudflare `env` object. However, for local development, Bunflare loads `.env` files and injects them seamlessly into the local dev server.

### 18.9 Custom Domain Routing

Through the CLI, `bunflare route add` communicates with Cloudflare API to bind a Worker to a path.

```bash
bunflare route add api.myapp.com/* --worker my-api
```

---

## 19. Appendix: Advanced Deployment Strategies

Bunflare doesn't just simplify code; it fundamentally changes how deployments work by analyzing code dependencies and optimizing the deployment artifact.

### 19.1 Multi-Worker Orchestration

When building complex microservices, developers typically need to deploy multiple workers and link them manually. Bunflare supports `bunflare.workspace.ts`, which defines a fleet of workers.

```typescript
// bunflare.workspace.ts
export default workspace({
  services: {
    'auth-service': './services/auth',
    'payment-service': './services/payment',
  },
  bindings: {
    'auth-service': {
      'payment-service': 'RPC',
    },
  },
});
```

A single `bunflare deploy --workspace` command analyzes the dependency graph and deploys the services in the correct order, injecting the proper service bindings.

### 19.2 Canary Deployments and Blue/Green

Bunflare integrates with Cloudflare Workers Environments and Deployments API to natively support Canary rollouts directly from the CLI.

```bash
bunflare deploy --canary 10%
```

This command automatically routes 10% of traffic to the new version, allowing safe testing in production without complex DNS changes.

### 19.3 Secret Rotation and Injection

Secrets are managed holistically. When deploying, Bunflare can hook into external secret managers (like AWS Secrets Manager or HashiCorp Vault), pull the latest secrets, encrypt them, and push them to Cloudflare during the build pipeline.

```typescript
// bunflare.config.ts
export default config({
  secrets: {
    provider: 'aws-secrets-manager',
    path: '/production/bunflare-app/*',
  },
});
```

---

## 20. Appendix: Local Emulation & Testing

A critical component of a great DX is local testing. Cloudflare's Miniflare handles emulation, but Bunflare tightly integrates it with Bun's test runner for unparalleled speed.

### 20.1 Seamless Miniflare Integration

When running `bunflare dev`, the CLI spins up an optimized instance of Miniflare that accurately replicates D1, KV, R2, and Queues locally. All bindings defined in the AST are automatically provisioned in the local emulator. No configuration required.

### 20.2 The `bun:test` Cloudflare Environment

Bunflare provides a custom test environment for `bun:test`.

```typescript
import { expect, test } from 'bun:test';
import { setupBunflareTestEnv } from 'bunflare/testing';
import { app } from './index.ts';

setupBunflareTestEnv({
  bindings: {
    DB: { type: 'd1' },
    BUCKET: { type: 'r2' },
  },
});

test('Database inserts correctly', async () => {
  const req = new Request('http://localhost/add-user', {
    method: 'POST',
    body: JSON.stringify({ name: 'Alice' }),
  });
  const res = await app.fetch(req);
  expect(res.status).toBe(200);
});
```

### 20.3 Time Travel Testing for Crons

Testing scheduled tasks is notoriously difficult. Bunflare provides a utility to advance time in the local emulator to trigger crons predictably.

```typescript
import { advanceTime } from 'bunflare/testing';

test('Nightly cleanup cron runs at midnight', async () => {
  // Setup data...
  await advanceTime('24h');
  // Assert data is cleaned up
});
```

### 20.4 Network Interception

To test background tasks and pipelines without hitting real APIs, Bunflare leverages built-in mocking capabilities.

```typescript
import { mockNetwork } from 'bunflare/testing';

test('Task enqueues correctly on external failure', async () => {
  mockNetwork('https://api.stripe.com/*').reply(500);

  // Assert that our queue fallback handles the 500 error gracefully
});
```

---

## 21. Extensive Developer FAQ

As developers transition from traditional Node.js servers or standard Cloudflare Workers to Bunflare, they often have questions about how the magic works under the hood.

### Q1: Is Bunflare just a wrapper around Wrangler?

Not quite. Bunflare uses the same underlying APIs as Wrangler for deployment, but it fundamentally changes the build process. While Wrangler deploys what you configure in TOML/JSON, Bunflare _generates_ the configuration based on your TypeScript code. It acts as a meta-framework that compiles down to standard Cloudflare Workers.

### Q2: What happens if I stop using Bunflare? Am I locked in?

No. Because Bunflare compiles down to standard Cloudflare Worker syntax (`export default { fetch, queue, scheduled }`), the deployed artifact is 100% standard Cloudflare. If you decide to move away from Bunflare, you can simply use the generated `wrangler.jsonc` and the transpiled worker code as your new starting point. There is zero vendor lock-in.

### Q3: How does the Contextual Independence (`getCloudflareContext`) work in high-concurrency?

Cloudflare Workers use V8 Isolates. When a request comes in, it is handled within an isolate. Bunflare securely scopes the `env` and `ctx` to the current isolate execution context. If multiple requests are handled concurrently within the same isolate, Bunflare ensures the context is safely attached to the asynchronous execution tree (similar to Node's `AsyncLocalStorage`, but optimized for the edge).

### Q4: Can I use existing NPM packages?

Yes! One of the biggest advantages of Bunflare is that it uses Bun's bundler. Bun natively supports resolving Node.js built-ins (`path`, `crypto`, `buffer`) and polyfills them for the Cloudflare environment when necessary. You can install standard NPM packages and use them just as you would in a normal Node.js app.

### Q5: How does Bunflare handle database migrations for D1?

Bunflare includes a `bunflare db migrate` command. It reads your SQL migration files and automatically applies them to your local Miniflare D1 database, or remotely to your production D1 database. It also integrates seamlessly with tools like Drizzle Kit.

### Q6: What is the performance overhead of Bunflare abstractions?

Virtually zero. The Bunflare AST compiler transpiles the abstractions (`workflow()`, `queue()`) away during the build phase. At runtime, the code executed is as close to the metal (Cloudflare's APIs) as possible. The only minor overhead is the context provider initialization, which takes less than a microsecond per request.

### Q7: Can I use Bunflare for WebSocket-heavy applications like games?

Absolutely. Bunflare's `durableWs` abstraction is specifically designed for high-frequency WebSocket applications. By abstracting the Hibernation API, it allows you to build multiplayer games or real-time collaboration tools that consume minimal memory and scale infinitely.

### Q8: How does the SEO HTMLRewriter compare to Next.js SSR?

Next.js SSR renders the entire React tree on the server for every request. Bunflare's `withMetadata` approach is different. If you use statically exported HTML or a simple SPA, Bunflare injects the critical SEO tags into the HTML stream at the edge _without_ rendering the entire JS framework. This results in Time-to-First-Byte (TTFB) in the milliseconds, far faster than traditional SSR, while still achieving perfect SEO scores.

### Q9: Is Bunflare ready for enterprise production?

Bunflare is designed with enterprise stability in mind. Because it compiles to standard Cloudflare APIs, the runtime stability relies entirely on Cloudflare's world-class infrastructure. The compiler and CLI tools are rigorously tested.

### Q10: How do I manage environments (staging, prod, testing)?

Bunflare reads your `.env` file structures automatically. If you run `bunflare deploy --env staging`, it will read `.env.staging`, create isolated infrastructure (e.g., a new D1 database named `my-db-staging`), and deploy to a separate Cloudflare Worker environment.

---

## 22. Conclusion & Future Outlook

Bunflare is not just a framework; it is an **Edge Operating System**. By unifying the incredible ecosystem of Cloudflare under a single, fluid, context-aware API, we remove the friction of serverless development.

The future roadmap includes:

1. **Full AST-driven Auto-Provisioning:** Letting developers delete their `wrangler.jsonc` entirely.
2. **Local Emulation Parity:** Ensuring every feature (Queues, Email, RPC) works flawlessly in `bunflare dev` using Bun's native tools.
3. **Framework Integrations:** Native plugins for React Router, Next.js, and Nuxt to export to Bunflare targets seamlessly.
4. **Multi-Cloud Failover:** Experimental support for transpiling Bunflare specific syntax to other edge providers (like Fastly or Deno Deploy) if Cloudflare faces an outage.

With Bun's speed and Cloudflare's network, the web is about to get a lot faster. Welcome to Bunflare. 🚀
