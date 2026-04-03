# 🥟 buncf ☁️

> The performance of Bun. The reliability of Cloudflare Workers. Native Priority.

`buncf` is a toolchain that lets you build and run **Cloudflare Workers** with the speed of **Bun**. It provides high-fidelity local simulation via Wrangler/Miniflare and seamless deployment using a specialized build plugin.

## ✨ Why it rocks

- **Cloudflare-Native Priority**: Use standard Cloudflare `env` bindings (`env.BUCKET`, `env.DB`, `env.KV`) directly. No complex abstractions.
- **Official Simulation**: Local development is powered by **Wrangler/Miniflare**'s `getPlatformProxy()`, ensuring 100% API parity for R2, D1, KV, and more.
- **Bun Performance**: Run your dev server and build pipeline with Bun's lightning-fast runtime.
- **Automatic Transitions**: `Bun.serve` and `Bun.env` are automatically transformed into Worker exports and environment variables.
- **Full-Stack Support**: Serve React/HTML frontends directly from your Worker with zero extra config.

## 📦 Install

```bash
bun add -d buncf
```

## 🚀 Quick Start

```typescript
// src/index.ts — write standard Cloudflare-ready code
import { serve, getCloudflareContext } from "buncf";

serve({
  routes: {
    "/api/users": {
      async GET() {
        const { env } = getCloudflareContext(); // Access native D1 binding
        const users = await env.DB.prepare("SELECT * FROM users").all();
        return Response.json(users);
      },
    },
    "/api/files/:name": {
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
bun run --preload buncf/preload src/index.ts
```

**Deploy to Cloudflare:**
```bash
bunx buncf build && wrangler deploy
```

---

## 🗺️ API Mapping Reference

The plugin handles the "glue" between Bun and Cloudflare so you can focus on your code.

| Bun API | Cloudflare Equivalent | Status |
|---|---|---|
| `Bun.serve({ ... })` | `export default { fetch }` | **Active** (Full router + middleware) |
| `Bun.env.MY_VAR` | `env.MY_VAR` | **Active** (Worker environment variable) |
| `process.env.MY_VAR` | `env.MY_VAR` | **Active** (Node.js compat) |
| `getCloudflareContext()` | `(env, ctx, cf)` | **Primary** way to access bindings |
| `Bun.s3 / Bun.write` | `env.BUCKET` | *Deprecated* (Use native R2 bindings) |
| `bun:sqlite` | `env.DB` | *Deprecated* (Use native D1 bindings) |
| `Bun.redis` | `env.KV` | *Deprecated* (Use native KV bindings) |

> [!IMPORTANT]
> To maintain true compatibility and portability, **always use the native `env` object** via `getCloudflareContext()`. The plugin no longer shims Bun's internal storage APIs (`Bun.s3`, `Bun.redis`) to avoid abstraction leaks.

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

Configure your build in `cloudflare.config.ts`:

```typescript
import { defineConfig } from "buncf/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  entrypoint: "./src/index.ts",
  plugins: [tailwind()],  // Frontend plugins (CSS, etc.)
});
```

---

## 🔧 Configuration (`cloudflare.config.ts`)

```typescript
import { defineConfig } from "buncf/config";

export default defineConfig({
  entrypoint: "./src/index.ts",   // Worker entry (default)
  outdir: "./dist",                // Build output (default)
  minify: true,                    // Minify output
  sourcemap: "linked",             // "none" | "linked" | "inline"
  plugins: [],                     // Bun plugins for the frontend build
});
```

---

## 🛠️ Local Development

### High-Fidelity Simulation
Local development is powered by **Wrangler/Miniflare**. When you run with the preload script, `buncf` automatically initializes a platform proxy:

1. It reads your `wrangler.jsonc` (or `.toml`).
2. It sets up local persistence in `.wrangler/state/v3`.
3. It injects **actual Cloudflare-compatible objects** into your `env`.

To enable this automatically, add the preload to your `bunfig.toml`:

```toml
# bunfig.toml
preload = ["buncf/preload"]
```

Then just run:
```bash
bun run src/index.ts
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
import { getCloudflareContext } from "buncf/runtime";

const { env } = getCloudflareContext();

// Now you have full IntelliSense!
await env.DB.prepare("SELECT * FROM users").all();
await env.BUCKET.put("hello.txt", "world");
```

---

## 🚪 Accessing the Context: `getCloudflareContext()`

Use `getCloudflareContext()` to access your bindings, request metadata (`cf`), and execution context (`ctx`):

```typescript
import { getCloudflareContext } from "buncf";

const { env, cf, ctx } = getCloudflareContext();

// env: Bindings (R2, D1, KV, Variables)
// cf: Cloudflare-specific request properties (country, colo, etc.)
// ctx: Worker context (waitUntil, passThroughOnException)
```

---

## 🤔 How does it work?

1. **Build Phase**: `Bun.build()` transforms your `Bun.serve` and `Bun.env` calls into standard Cloudflare Worker exports.
2. **Local Runtime**: The `preload` script uses `wrangler.getPlatformProxy()` to create a local environment that perfectly matches Cloudflare.
3. **No Shims**: We prioritize native bindings to ensure your code is "Worker-native" from day one.

---

## 📝 License

MIT — Go build something awesome! 🚀
