# ☁️ Bunflare

> **The speed of Bun. The reach of Cloudflare. Zero-config DX.**

`bunflare` is a next-generation toolchain designed to build and deploy **Cloudflare Workers** using the lightning-fast **Bun** runtime. It provides a high-performance build pipeline, native API transformations, and an industrial-grade development experience.

---

## ✨ Key Features

- **🚀 Native-First Performance**: No heavy abstractions. Use standard Cloudflare bindings and Bun's native `serve` API.
- **⚡️ Industrial Dev Mode**: Sub-100ms rebuilds with instant browser refresh.
- **🛠️ Auto-Provisioning**: Infrastructure-as-Code without the boilerplate. Sync D1, KV, and R2 automatically.
- **🩺 Health Diagnostics**: Built-in `doctor` command to verify your build chain and authentication.
- **🌪️ Fluid APIs**: Functional wrappers for Durable Objects, Workflows, Containers, and Browsers.
- **🔍 SEO & Metadata**: High-performance HTML transformation via `bunflare/utils`.
- **🕰️ Background Tasks**: Effortless `waitUntil` orchestration and Queue integration.
- **🚀 Edge Computing**: Smart Cache, native Rate Limiting, and sub-millisecond Feature Flags.

---

## 📦 Installation

```bash
bun add -d bunflare
```

---

## 🚀 Quick Start

### 1. Initialize your project
```bash
bunx bunflare init
```

### 2. Run Diagnostics & Auto-Fix
Verify your project health and automatically sync missing infrastructure (D1, KV, Queues, etc.).
```bash
bunflare doctor --fix
```

---

## 🩺 Health Diagnostics & Auto-Fix

The `doctor` command is your best friend for a zero-config setup. It scans your source code for Fluid API usage and ensures your `wrangler.jsonc` and Cloudflare account match perfectly.

- **`bunflare doctor`**: Runs checks for auth, configuration, and infrastructure drift.
- **`bunflare doctor --fix`** (or `-f`):
    - 🛠️  **Auto-Provisioning**: Creates missing KV namespaces, D1 databases, and R2 buckets (requires confirmation).
    - ⚡️  **Configuration Sync**: Automatically adds missing `workflows`, `queues`, `triggers`, and `ratelimits` to `wrangler.jsonc`.
    - 🔍  **UUID Sync**: Fixes invalid or placeholder IDs by matching names in your Cloudflare account.
- **`bunflare doctor --fix --auto`** (or `-a`):
    - 🚀  **Full Automation**: Bypasses all confirmation prompts for known infrastructure repairs.
    - 🔇  **Silent Recovery**: Ideal for CI/CD or quickly fixing `placeholder-id` issues without manual intervention.

---

## 🏢 Cloudflare Fluid APIs

Bunflare allows you to define complex Cloudflare resources using a clean, functional API that is automatically transformed into the required class structure during build.

### 📦 Containers
Run multi-language services (Dockerfiles) with a simple config.
```typescript
import { container } from 'bunflare';

export const ImageProcessor = container({
  defaultPort: 8080,
  onStart() {
    console.log("Container started!");
  }
});
```

### 🔄 Workflows
Orchestrate long-running, durable tasks.
```typescript
import { workflow } from 'bunflare';

export const SignupWorkflow = workflow({
  async run(event, step) {
    await step.do("send email", async () => {
      // Logic here
    });
  }
});
```

### 💎 Durable Objects (with Pub/Sub)
Manage shared state with Bun's native WebSocket Pub/Sub API.
```typescript
import { durable } from 'bunflare';

export const ChatRoom = durable({
  async webSocketMessage(ws, msg) {
    ws.subscribe("room1");
    ws.publish("room1", msg);
  }
});
```

### 🌐 Browser Rendering (Puppeteer)
Control headless browsers seamlessly at the edge.
```typescript
import { browser } from 'bunflare';

export const PDFGen = browser({
  async run(page, req, env) {
    await page.goto("https://google.com");
    return new Response(await page.pdf());
  }
});
```

---

## 🕰️ Background Tasks & Queues

Bunflare turns background processing into a modular, exportable unit. Use the `tasks` utility to enqueue and the `queue()` helper to consume.

### 1. Enqueueing Messages
```typescript
import { tasks } from 'bunflare';

export async function handleRequest(req) {
  // fire-and-forget background task
  tasks.background(async () => { /* ... */ });

  // Reliable queue entry
  await tasks.enqueue("MY_QUEUE", { id: 123, action: "process" });
}
```

### 2. Defining Consumers
Consumers are automatically transformed into Worker entrypoints.
```typescript
import { queue } from 'bunflare';

export const MyQueue = queue({
  batchSize: 10,
  maxRetries: 3,
  async process(messages, env) {
    for (const msg of messages) {
       console.log("Processed:", msg.body);
       msg.ack();
    }
  }
});
```

---

## 📅 Scheduled Tasks (Cron)

Automate your infrastructure with cron triggers. Bunflare syncs your schedules automatically with Cloudflare.

```typescript
import { cron } from 'bunflare';

export const MaintenanceTask = cron({
  schedule: "0 0 * * *", // Every midnight
  async run(event, env) {
    console.log("Running daily maintenance...");
    // D1 cleanup, R2 syncing, etc.
  }
});
```

---

## 🚀 Edge Utilities & Smart Cache

Supercharge your Worker with high-level performance and security utilities. 

### 1. Smart Cache
Effortlessly cache asynchronous results at the Edge using the `cache` helper. Bunflare handles JSON serialization and background `waitUntil` calls automatically.

```typescript
import { cache } from 'bunflare';

app.get("/leaderboard", async (c) => {
  // Checks Edge Cache. If miss, runs fn, caches for 60s, returns.
  return await cache.getOrSet("global_score", 60, async () => {
    return await db.query("SELECT * FROM players ORDER BY score DESC");
  });
});
```

### 2. Rate Limiting
Protect your APIs from abuse with native Cloudflare request throttling. Bunflare's `rateLimit` middleware automatically manages the 429 status and binding orchestration.

```typescript
import { rateLimit } from 'bunflare/edge';

// Limit to 5 requests per minute per IP
const authLimiter = rateLimit({
  binding: "AUTH_LIMITER",
  limit: 5,
  window: 60
});

app.post("/login", authLimiter, async (c) => {
  return c.json({ success: true });
});
```

### 3. Feature Flags
Sub-millisecond feature toggles backed by KV storage. Percentage-based rollouts use deterministic hashing for a consistent user experience.

```typescript
import { flags } from 'bunflare/edge';

app.get("/hero", async (c) => {
  const userId = c.req.header("x-user-id");
  const showNewBanner = await flags.evaluate("new_banner", userId);
  
  return c.json({ banner: showNewBanner ? "Modern" : "Classic" });
});
```

---

## 🔍 SEO & HTML Transformation

Inject dynamic metadata into your statically bundled HTML files using the high-performance `withMetadata` utility.

```typescript
import { serve } from 'bun';
import { withMetadata } from 'bunflare/utils';
import indexHtml from './index.html';

export default serve({
  async fetch(req) {
    const res = new Response(indexHtml, { headers: { 'Content-Type': 'text/html' } });
    
    return withMetadata(res, {
      title: "My Dynamic Page",
      description: "Injected via Bunflare",
      image: "https://example.com/og.png",
      injectScript: `window.__STATE__ = { id: 123 };`
    });
  }
});
```

---

## 🛠️ Infrastructure Syncing

Bunflare's **Provisioner** ensures your local `wrangler.jsonc` is always in sync with your Cloudflare account.

- **Selective Sync**: Choose which resources to create or link via interactive prompts.
- **UUID Recovery**: Automatically finds and fills missing D1 Database IDs.
- **Validation**: Checks for resource existence before every deployment.
- **Auto-Detection**: Scans your code for `browser()`, `durable()`, and `tasks.enqueue()` to suggest bindings.

Run it manually or via `bunflare deploy`.

---

## 🔧 Configuration

Configure your build in `bunflare.config.ts`:

```typescript
import { defineConfig } from 'bunflare/config';

export default defineConfig({
  outdir: './dist',
  minify: true,
  staticDir: 'public',
  // Native Bun plugins supported!
  plugins: [] 
});
```

---

## 📝 License

MIT — Go build something amazing! 🚀
