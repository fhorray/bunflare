# Dumpling Bunflare ☁️

> The performance of Bun. The reliability of Cloudflare Workers. Native Priority.

`bunflare` is a toolchain that lets you build and run **Cloudflare Workers** with the speed of **Bun**. It provides a high-performance build pipeline and seamless integration with Wrangler for local development and deployment.

## ✨ Why it rocks

- **Cloudflare-Native Priority**: Use standard Cloudflare `env` bindings (`env.BUCKET`, `env.DB`, `env.KV`) directly. No complex abstractions.
- **Bun Performance**: Run your build pipeline with Bun's lightning-fast runtime.
- **Smart Entry Detection**: Automatically finds your `src/index.tsx`, `src/index.ts`, or `.js/jsx` without manual configuration.
- **Automatic Transitions**: `Bun.serve` and `Bun.env` are automatically transformed into Worker exports and environment variables.
- **Full-Stack Support**: Serve React/HTML frontends directly from your Worker with zero extra config.
- **Wrangler Integration**: Works seamlessly with official `wrangler dev` for high-fidelity simulation.
- **Stabilized Runtime**: Built-in protection against Cloudflare's "Global Scope" and "EvalError" restrictions.

## 📦 Install

```bash
bun add -d bunflare
```

## 🚀 Quick Start

```typescript
// src/index.ts — write standard Cloudflare-ready code
import { serve, getCloudflareContext } from 'bunflare';

serve({
  routes: {
    '/api/users': {
      async GET() {
        const { env } = getCloudflareContext(); // Access native D1 binding
        const users = await env.DB.prepare('SELECT * FROM users').all();
        return Response.json(users);
      },
    },
    '/api/files/:name': {
      async GET(req) {
        const { env } = getCloudflareContext();
        const obj = await env.BUCKET.get(req.params.name); // Access native R2 binding
        return new Response(obj.body);
      },
      async PUT(req) {
        const { env } = getCloudflareContext();
        await env.BUCKET.put(req.params.name, await req.text());
        return Response.json({ ok: true });
      },
    },
  },
});
```

**Run locally:**

```bash
wrangler dev
```

```bash
bunx bunflare build && wrangler deploy
```

**Check project health & bindings:**

```bash
bunx bunflare doctor
```

---

## 📦 Worker Assets (Static Files)

`bunflare` automatically detects your `public/` directory and includes its contents in the build. These are served directly by Cloudflare's global CDN for maximum performance.

1. Create a `public/` folder in your project root.
2. Add your `images`, `css`, or `js` files.
3. Configure your `wrangler.jsonc` to point to the build output:

```jsonc
{
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
  },
}
```

> [!TIP]
> Requests for static files hit the CDN first and **never consume your Worker invocation quota** when properly configured.

---

## 🗺️ API Mapping Reference

The plugin handles the "glue" between Bun and Cloudflare so you can focus on your code.

| Bun API                  | Cloudflare Equivalent      | Status                                   |
| ------------------------ | -------------------------- | ---------------------------------------- |
| `Bun.serve({ ... })`     | `export default { fetch }` | **Active** (Dynamic router + WebSockets) |
| `Bun.env.MY_VAR`         | `env.MY_VAR`               | **Active** (Worker environment variable) |
| `process.env.MY_VAR`     | `env.MY_VAR`               | **Active** (Node.js compat)              |
| `getCloudflareContext()` | `(env, ctx, cf)`           | **Primary** way to access bindings       |
| `Bun.serve() (WS)`       | `WebSocketPair`            | **Active** (Lifecycle + Pub/Sub)         |
| `durable({ ... })`       | `export class DO { ... }`  | **Active** (Fluid API wrapper)           |
| `workflow({ ... })`      | `export class WF { ... }`  | **Active** (Multi-step automation)       |
| `Bun.s3 / Bun.write`     | `env.BUCKET`               | _Deprecated_ (Use native R2 bindings)    |
| `bun:sqlite`             | `env.DB`                   | _Deprecated_ (Use native D1 bindings)    |
| `Bun.redis`              | `env.KV`                   | _Deprecated_ (Use native KV bindings)    |

---

## 🏗️ Full-Stack (with Frontend)

Serve a React (or any HTML) frontend directly from your Worker:

```typescript
// src/index.ts
import { serve } from "bunflare";
import index from "./index.html"; // Bun's native HTML import

serve({
  routes: {
    "/*": index,          // Serve the SPA for all unmatched routes
    "/api/users": { ... },
  },
});
```

Configure your build in `bunflare.config.ts`:

```typescript
import { defineConfig } from 'bunflare/config';

export default defineConfig({
  // entrypoint: './src/index.ts', // Optional! bunflare auto-detects common index files.
  outdir: './dist',
  minify: true,
  sourcemap: 'linked',
});
```

---

## 🏗️ Smart Entry Point Detection

`bunflare` features an intelligent build pipeline that eliminates the need for hardcoded entry point paths. If no `entrypoint` is specified in your config, it will automatically search your `src/` directory for:

1. `index.tsx` (Modern React/JSX)
2. `index.ts` (TypeScript)
3. `index.jsx` (JavaScript/JSX)
4. `index.js` (Vanilla JavaScript)

This ensures your project is always build-ready, even after a migration from `.ts` to `.tsx`.

---

## 🔧 Configuration (`bunflare.config.ts`)

```typescript
import { defineConfig } from 'bunflare/config';

export default defineConfig({
  entrypoint: './src/index.ts', // Worker entry (default)
  outdir: './dist', // Build output (default)
  minify: true, // Minify output
  sourcemap: 'linked', // "none" | "linked" | "inline"
  plugins: [], // Bun plugins for the frontend build
});
```

---

## 🛠️ Local Development

Local development is powered by official **Wrangler**. When you run `wrangler dev`, it uses the `bunflare build` command defined in your `wrangler.jsonc` to bundle your app and then provides:

1. High-fidelity simulation of R2, D1, KV, etc.
2. Local persistence in `.wrangler/state/v3`.
3. Support for environment variables and secrets.

### Standardized Port Mapping

When developing multiple Workers in the same monorepo, use the standardized `bunflare` port range to avoid conflicts:

| App      | Main Port | Inspector Port |
| :------- | :-------- | :------------- |
| **Hono** | `3101`    | `9201`         |
| **Bun**  | `3103`    | `9203`         |
| **Itty** | `3105`    | `9205`         |

**Example:**

```bash
wrangler dev --port 3101 --inspector-port 9201
```

---

## 🛡️ Type Safety

`bunflare` provides full type safety for your Cloudflare bindings (D1, R2, KV, etc.) using Wrangler's official type generation.

### 1. Generate Types

Add a script to your `package.json` to generate types from your `wrangler.jsonc` / `wrangler.toml`:

```json
{
  "scripts": {
    "cf-typegen": "wrangler types --env-interface CloudflareBindings"
  }
}
```

Run the command to generate the `worker-configuration.d.ts` file:

```bash
bun run cf-typegen
```

### 2. Automatic Intelligence

Once generated, `getCloudflareContext()` will automatically identify your bindings without any extra configuration or manual generics.

> [!TIP]
> **Zero-Config Type Safety**: `bunflare` extends the global `Request` and `WebSocket` interfaces. By using `import { serve } from "bunflare"`, you get full IntelliSense for `req.params`, `ws.subscribe()`, and even `.html` imports without any extra `.d.ts` files.

---

## ⚡ Using Frameworks (Hono, etc.)

`bunflare` is compatible with any framework that supports the Fetch API and Bun's `serve`.

```typescript
import { Hono } from 'hono';
import { serve } from 'bunflare';

// Define your bindings for full type safety
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get('/api/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!',
    appName: c.env.APP_NAME,
  });
});

// CRITICAL: Use a lazy closure for Cloudflare stability
export default serve({
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
});
```

> [!CAUTION]
> Always use the **Lazy Fetch Wrapper** `fetch: (req, env, ctx) => app.fetch(req, env, ctx)`. This prevents "Disallowed operation called within global scope" errors by deferring framework initialization until the first request.

---

## ⛓️ Cloudflare Workflows (`workflow()`)

Define durable, multi-step background processes with a fluid API:

```typescript
import { workflow } from 'bunflare';

export const MyProcess = workflow({
  async run(event, step, env: CloudflareBindings) {
    const data = await step.do('fetch data', async () => {
      return await fetch('https://api.example.com/data').then((res) =>
        res.json(),
      );
    });

    await step.sleep('wait a bit', '1 minute');

    await step.do('save to bucket', async () => {
      await env.BUCKET.put('result.json', JSON.stringify(data));
    });
  },
});
```

## 💎 Durable Objects (`durable()`)

Define persistent state with a clean, functional wrapper:

```typescript
import { durable } from 'bunflare';

export const Counter = durable({
  async fetch(request, state: DurableObjectState) {
    let count = (await state.storage.get<number>('count')) || 0;
    await state.storage.put('count', ++count);
    return Response.json({ count });
  },
});
```

### 📡 WebSocket 2.0: Bun-Native Pub/Sub

`bunflare` brings Bun's powerful publish-subscribe API directly into Durable Objects. You don't need to manually manage arrays of sockets; just use the native methods you already know.

```typescript
export const ChatHub = durable({
  async fetch(request, state) {
    const pair = new WebSocketPair();
    // No need for ws.accept() if using hibernatable API
    state.acceptWebSocket(pair[1], ['chat']);
    return new Response(null, { status: 101, webSocket: pair[0] });
  },

  async webSocketMessage(ws, message) {
    // 1. Subscribe to topics
    ws.subscribe('chat-room-1');

    // 2. Publish to others (excludes sender)
    ws.publish('chat-room-1', `User says: ${message}`);

    // 3. Broadcast to all (includes sender)
    this.publish('chat-room-1', 'A new message arrived!');
  },
});
```

> [!IMPORTANT]
> **Stateful WebSockets**: If your application needs to coordinate between multiple clients (like a Chat Hub), you **must** use a Durable Object. Standard Workers are stateless and don't share WebSocket state across isolates.

---

## 📦 Cloudflare Containers (`container()`)

Run code written in any language (Go, Rust, Python) alongside your Bun app:

```typescript
import { container } from 'bunflare';

export const ImageProcessor = container({
  image: './Dockerfile', // path to your Dockerfile
  defaultPort: 8080, // container listening port
  sleepAfter: '10m', // auto-stop after idle
  envVars: {
    MODE: 'hi-res',
  },
});
```

---

## 🚪 Accessing the Context: `getCloudflareContext()`

Use `getCloudflareContext()` to access your bindings, request metadata (`cf`), and execution context (`ctx`):

```typescript
import { getCloudflareContext } from 'bunflare';

const { env, cf, ctx } = getCloudflareContext();

// env: Bindings (R2, D1, KV, Variables)
// cf: Cloudflare-specific request properties (country, colo, etc.)
// ctx: Worker context (waitUntil, passThroughOnException)
```

---

## 🚀 Advanced Cold Start Optimization (Lazy Routing)

`bunflare` uses **Aggressive Code Splitting** to ensure your Worker starts instantly, even with large dependencies.

When you import a route handler from an external file, `bunflare` automatically transforms it into a **dynamic import**, creating separate chunks that are only loaded when the route is actually accessed.

```ts
import { HeavyHandler } from './handlers/heavy';

serve({
  routes: {
    '/heavy': HeavyHandler, // Automatically wrapped in await import("./handlers/heavy")
  },
});
```

---

## 🤔 How does it work?

1. **AST Transformation**: `bunflare` uses a high-performance **OXC-powered AST engine** (Rust) to surgically transform your code. It handles TypeScript and JSX natively with character-perfect precision.
2. **Lazy Wrappers**: `Bun.serve`, `durable()`, and `workflow()` calls are transformed into standard Cloudflare classes and exports.
3. **Context Injection**: `bunflare` manages the injection of the Cloudflare context (`env`, `cf`, `ctx`) into your app lifecycle.
4. **Bundle Transparency**: The build CLI provides a **Total Bundle Size** report (including chunks and assets) to ensure you stay within Cloudflare's limits.
5. **No Shims**: We prioritize native bindings to ensure your code is "Worker-native" from day one.

---

## 📝 License

MIT — Go build something awesome! 🚀
