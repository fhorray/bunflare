# dumpling buncf ☁️

> The performance of Bun. The reliability of Cloudflare Workers. Native Priority.

`buncf` is a toolchain that lets you build and run **Cloudflare Workers** with the speed of **Bun**. It provides a high-performance build pipeline and seamless integration with Wrangler for local development and deployment.

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
bun add -d buncf
```

## 🚀 Quick Start

```typescript
// src/index.ts — write standard Cloudflare-ready code
import { serve } from 'buncf';
import { getCloudflareContext } from 'buncf';

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

**Deploy to Cloudflare:**

```bash
bunx buncf build && wrangler deploy
```

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
| `Bun.s3 / Bun.write`     | `env.BUCKET`               | _Deprecated_ (Use native R2 bindings)    |
| `bun:sqlite`             | `env.DB`                   | _Deprecated_ (Use native D1 bindings)    |
| `Bun.redis`              | `env.KV`                   | _Deprecated_ (Use native KV bindings)    |

---

## 🏗️ Full-Stack (with Frontend)

Serve a React (or any HTML) frontend directly from your Worker:

```typescript
// src/index.ts
import { serve } from "buncf";
import index from "./index.html"; // Bun's native HTML import

serve({
  routes: {
    "/*": index,          // Serve the SPA for all unmatched routes
    "/api/users": { ... },
  },
});
```

Configure your build in `buncf.config.ts`:

```typescript
import { defineConfig } from 'buncf/config';

export default defineConfig({
  // entrypoint: './src/index.ts', // Optional! buncf auto-detects common index files.
  outdir: './dist',
  minify: true,
  sourcemap: 'linked',
});
```

---

## 🏗️ Smart Entry Point Detection

`buncf` features an intelligent build pipeline that eliminates the need for hardcoded entry point paths. If no `entrypoint` is specified in your config, it will automatically search your `src/` directory for:

1. `index.tsx` (Modern React/JSX)
2. `index.ts` (TypeScript)
3. `index.jsx` (JavaScript/JSX)
4. `index.js` (Vanilla JavaScript)

This ensures your project is always build-ready, even after a migration from `.ts` to `.tsx`.

---

## 🔧 Configuration (`buncf.config.ts`)

```typescript
import { defineConfig } from 'buncf/config';

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

Local development is powered by official **Wrangler**. When you run `wrangler dev`, it uses the `buncf build` command defined in your `wrangler.jsonc` to bundle your app and then provides:

1. High-fidelity simulation of R2, D1, KV, etc.
2. Local persistence in `.wrangler/state/v3`.
3. Support for environment variables and secrets.

### Standardized Port Mapping

When developing multiple Workers in the same monorepo, use the standardized `buncf` port range to avoid conflicts:

| App | Main Port | Inspector Port |
| :--- | :--- | :--- |
| **Hono** | `3101` | `9201` |
| **Elysia** | `3102` | `9202` |
| **Bun** | `3103` | `9203` |
| **Itty** | `3105` | `9205` |

**Example:**
```bash
wrangler dev --port 3101 --inspector-port 9201
```

---

## 🛡️ Type Safety

`buncf` provides full type safety for your Cloudflare bindings (D1, R2, KV, etc.) using Wrangler's official type generation.

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

Once generated, `getCloudflareContext()` will automatically identify your bindings without any extra configuration or manual generics:

```ts
import { getCloudflareContext } from 'buncf/runtime';

const { env } = getCloudflareContext();

// Now you have full IntelliSense!
await env.DB.prepare('SELECT * FROM users').all();
await env.BUCKET.put('hello.txt', 'world');
```

---

## ⚡ Using Frameworks (Hono, Elysia, etc.)

`buncf` is compatible with any framework that supports the Fetch API and Bun's `serve`.

```typescript
import { Hono } from 'hono';
import { serve } from 'bun';

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
  // @ts-ignore
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
});
```

### 2. Elysia

[Elysia](https://elysiajs.com/) requires specific settings to run in the Cloudflare security sandbox:

```typescript
import { Elysia } from 'elysia';
import { serve } from 'bun';

// Set aot: false to avoid forbidden string code generation
const app = new Elysia({ aot: false })
  .get('/', () => 'Hello from Elysia');

export default serve({
  // @ts-ignore
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
});
```

> [!CAUTION]
> Always use the **Lazy Fetch Wrapper** `fetch: (req, env, ctx) => app.fetch(req, env, ctx)`. This prevents "Disallowed operation called within global scope" errors by deferring framework initialization until the first request.

---

## 🚪 Accessing the Context: `getCloudflareContext()`

Use `getCloudflareContext()` to access your bindings, request metadata (`cf`), and execution context (`ctx`):

```typescript
import { getCloudflareContext } from 'buncf';

const { env, cf, ctx } = getCloudflareContext();

// env: Bindings (R2, D1, KV, Variables)
// cf: Cloudflare-specific request properties (country, colo, etc.)
// ctx: Worker context (waitUntil, passThroughOnException)
```

---

## 🤔 How does it work?

1. **Build Phase**: `Bun.build()` transforms your `Bun.serve` and `Bun.env` calls into standard Cloudflare Worker exports.
2. **Context Injection**: `buncf` manages the injection of the Cloudflare context (`env`, `cf`, `ctx`) into your app lifecycle.
3. **No Shims**: We prioritize native bindings to ensure your code is "Worker-native" from day one.

---

## 📝 License

MIT — Go build something awesome! 🚀
