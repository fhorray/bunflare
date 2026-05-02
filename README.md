<p align="center">
  <img src="https://raw.githubusercontent.com/fhorray/bunflare/main/assets/cover.png" alt="Bunflare - Write for Bun. Deploy to Cloudflare." width="100%" />
</p>

<p align="center">
  <a href="https://npmjs.com/package/bunflare"><img src="https://img.shields.io/npm/v/bunflare?color=orange&label=bunflare" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-%3E%3D1.0.0-orange" /></a>
  <a href="https://developers.cloudflare.com/workers/"><img src="https://img.shields.io/badge/Cloudflare-Workers-orange" /></a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

> **Write Bun. Deploy Cloudflare.**
>
> Bunflare is a Bun bundler plugin that automatically replaces Bun-native APIs with their Cloudflare Workers equivalents **at build time**. Zero code changes, maximum compatibility.

---

## 🤔 Why Bunflare?

You love Bun. The DX is amazing — fast builds, great APIs, no boilerplate. You write `Bun.serve`, `bun:sqlite`, `Bun.password.hash()`, and life is good.

Then you try to deploy to Cloudflare Workers. And Bun is... not there.

```
ReferenceError: Bun is not defined
```

Ouch. 😬

**Bunflare fixes that.** It runs at build time and automatically transforms all your `Bun.*` calls into their Cloudflare-native equivalents — D1, KV, R2, WebCrypto, and more. Your source code stays clean and Bun-idiomatic. The bundled output is 100% Workers-compatible.

No runtime overhead. No vendor lock-in. Just write Bun, deploy Cloudflare.

---

## ✨ What Gets Shimmed

| Bun API | Cloudflare Equivalent | Status |
|---|---|---|
| `Bun.env` | Worker `env` bindings | ✅ Done |
| `bun:sqlite` / `new Database()` | Cloudflare **D1** | ✅ Done |
| `Bun.sql` (tagged template) | Cloudflare **Hyperdrive** + any Postgres driver | ✅ Done |
| `import { redis } from "bun"` | Cloudflare **KV** (Redis-over-KV bridge) | ✅ Done |
| `Bun.password.hash/verify` | **WebCrypto** (PBKDF2) | ✅ Done |
| `Bun.hash()` | **WebCrypto** (SHA-256) | ✅ Done |
| `Bun.file()` / `Bun.write()` | Cloudflare **R2** | ✅ Done |
| `Bun.serve()` + `routes` | Cloudflare **Worker fetch handler** | ✅ Done |
| Fullstack HTML/SPA Build | Cloudflare **Workers Assets** | ✅ Done |

---

## 🚀 Quick Start

### 1. Install

```bash
bun add -d bunflare
```

### 2. Configure your build (Optional)

Create a `bunflare.config.ts` at the root of your project. **Note:** Bunflare automatically discovers your bindings from `wrangler.jsonc`, so this file is often optional or very minimal!

```ts
// bunflare.config.ts
import type { BunflareConfig } from "bunflare";

export default {
  entrypoint: "./index.ts",
  
  // Optional: Only needed if you want to override auto-discovery
  // sqlite: { binding: "DB" }, 
  // kv:     { binding: "MY_CACHE" },
  // r2:     { binding: "MY_BUCKET" },
  
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
    // Optional: Custom loaders for frontend (e.g. for .wasm or .data)
    loader: { ".wasm": "file" }
  },
  
  // Optional: Custom loaders for backend
  loader: { ".txt": "text" }
} satisfies BunflareConfig;
```

### 3. TypeScript Setup (Critical)

To get full type safety for `Bun.env` and Cloudflare bindings, you need a `global.d.ts` and a proper `tsconfig.json`.

**Create `global.d.ts`:**

```ts
// global.d.ts
import "bun";

declare global {
  namespace Bun {
    // Merges Cloudflare Bindings into the global Bun.env object
    interface Env extends CloudflareBindings { }
  }
}

// This interface is automatically populated by 'wrangler types'
// into worker-configuration.d.ts
interface CloudflareBindings { }

interface BunflareEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  [key: string]: any;
}
```

**Generate Types:**

Run the following command to generate `worker-configuration.d.ts` based on your `wrangler.jsonc`:

```bash
bun run cf-typegen  # bunx wrangler types --env-interface CloudflareBindings
```

**Update `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "types": ["bun"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  },
  "include": [
    "global.d.ts", 
    "worker-configuration.d.ts", 
    "src/**/*"
  ]
}
```

### 4. Update your `package.json` scripts

```json
{
  "scripts": {
    "dev":    "bunflare dev",
    "build":  "bunflare build",
    "deploy": "bunflare deploy"
  }
}
```

### 5. Wire up `wrangler.jsonc`

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "main": "dist/index.js",
  "compatibility_date": "2025-02-24",
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "..." }
  ],
  "kv_namespaces": [
    { "binding": "MY_CACHE", "id": "..." }
  ],
  "r2_buckets": [
    { "binding": "MY_BUCKET", "bucket_name": "my-bucket" }
  ],
  "assets": {
    "directory": "dist/public"
  }
}
```

### 6. Write your Worker like you're writing Bun

> [!IMPORTANT]
> **Export Default Requirement:** Cloudflare Workers require your application to be exported as an ES module default export. Whether you use `export default Bun.serve(...)` directly or assign it to a variable (`const server = ...; export default server;`), this export is strictly required.

```ts
// src/index.ts
import { Database } from "bun:sqlite";
import { redis } from "bun";

export default Bun.serve({
  routes: {
    "/api/hello": async (req) => {
      // bun:sqlite → D1 at deploy time
      const db = new Database("DB");

      // import { redis } from "bun" → Cloudflare KV at deploy time
      await redis.set("greeting", "Hello from Cloudflare!");
      const greeting = await redis.get("greeting");

      return Response.json({ greeting });
    }
  },
  development: true // enables live-reload in dev mode
});
```

That's it. `bun run dev` and you're cooking. 🔥

---

## 🧠 How It Works

Bunflare hooks into Bun's bundler via a **plugin**. When you run `bunflare build`, two things happen:

1. **Virtual Module Resolution**: All `bun:*` imports (like `bun:sqlite`) are intercepted and replaced with Bunflare's own shim implementations that call Cloudflare APIs instead.

2. **Global AST Transformation**: Any reference to `Bun.*` in your source files (like `Bun.serve()`, `Bun.env`, `Bun.file()`) gets a global preamble injected that maps them to the correct Cloudflare primitives.

The end result is a bundled `dist/index.js` that is 100% Cloudflare Workers-compatible, with no trace of Bun-specific APIs at runtime.

```
Your Code (Bun)         →  Bunflare Build  →  Cloudflare Worker
─────────────────────────────────────────────────────────────────
bun:sqlite              →   shim + D1       →  env.DB.prepare(...)
import { redis }        →   KV bridge       →  env.MY_CACHE.get/put(...)
Bun.file() / Bun.write  →   R2 shim         →  env.MY_BUCKET.get/put(...)
Bun.password.hash()     →   WebCrypto       →  crypto.subtle.digest(...)
Bun.serve({ routes })   →   fetch handler   →  export default { fetch }
```

---

## ⚡ Smart Auto-Discovery

Bunflare is designed to be **Zero Config**. When you run `dev`, `build`, or `deploy`, it automatically parses your `wrangler.jsonc` to find your bindings.

- **SQLite**: Automatically uses your first D1 database.
- **KV / Redis**: Automatically uses your first KV namespace.
- **R2**: Automatically uses your first R2 bucket.

You only need to define these in `bunflare.config.ts` if you have multiple bindings and want to specify which one Bun should use as the default.

---

## 📖 API Reference

### `Bun.serve()` → Cloudflare Fetch Handler

Bunflare transforms `Bun.serve()` into a proper Cloudflare Worker export. All routing logic is preserved.

```ts
export default Bun.serve({
  // Route handlers work just like in Bun
  routes: {
    "/api/users": async (req) => {
      return Response.json([{ id: 1, name: "Alice" }]);
    },

    // URL params supported via URLPattern
    "/api/users/:id": async (req) => {
      const { id } = req.params;
      return Response.json({ id });
    },

    "/api/data": {
      // HTTP method handlers
      GET:  async (req) => Response.json({ action: "get" }),
      POST: async (req) => Response.json({ action: "post" }),
    }
  },

  // Fallback fetch handler
  fetch: async (req) => {
    return new Response("Not Found", { status: 404 });
  },

  // Enables live-reload script injection in dev mode
  development: true
});
```

> **💡 Tip:** Unknown routes automatically fall through to your Cloudflare Workers Assets (your frontend), so you get SPA routing for free if you configure `assets` in `wrangler.jsonc`.

---

### `bun:sqlite` → Cloudflare D1

Write SQLite-style database code and deploy to D1. The API is intentionally Bun-idiomatic.

```ts
import { Database } from "bun:sqlite";

// Connect to D1 using the binding name from wrangler.jsonc
const db = new Database("DB");

// Queries work the same way
const stmt = db.query("SELECT * FROM users WHERE active = ?");
const users = stmt.all(1); // ⚠️ See note below

// Runs fire-and-forget (async under the hood on D1)
db.run("INSERT INTO users (name, email) VALUES (?, ?)", "Alice", "alice@example.com");
```

> **⚠️ Important — Async/Await is Required:** D1 is async by nature, while the native `bun:sqlite` API is synchronous. Bunflare's shim returns Promises from all query methods (`.run()`, `.all()`), so you **must** `await` them. Use `as any` to satisfy TypeScript when calling `.all()`, since the declared return type is `unknown[]` but the actual value is a `Promise`.
>
> ```ts
> const db = new Database("DB");
>
> // Always await your queries on Cloudflare:
> await (db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)") as any);
> await (db.run("INSERT INTO users (name) VALUES (?)", ["Alice"]) as any);
>
> // .all() returns a D1Result object, rows are under .results
> const d1Result = await (db.prepare("SELECT * FROM users LIMIT 10").all() as any);
> const rows = d1Result.results; // { id: 1, name: "Alice" }[]
> ```

**Config:**
```ts
bunflare({ sqlite: { binding: "DB" } })
```

---

### `Bun.sql` → Cloudflare Hyperdrive + PostgreSQL 🐘

This is one of Bunflare's most powerful new features. Write standard **`Bun.sql`** tagged-template queries and deploy them to Cloudflare Workers backed by a full PostgreSQL database via **Cloudflare Hyperdrive**.

Hyperdrive is Cloudflare's connection pooling and caching proxy for external databases. It keeps persistent warm connections at the edge, so connecting to PostgreSQL from a Worker is fast and cheap.

```ts
// index.ts — same Bun.sql tagged template syntax you already know
export default Bun.serve({
  routes: {
    "/api/users": async () => {
      // Bun.sql tagged template → Hyperdrive → PostgreSQL
      await Bun.sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT)`;

      await Bun.sql`INSERT INTO users (name) VALUES (${"Alice"})`;

      const users = await Bun.sql`SELECT * FROM users LIMIT 10`;

      // .values() returns rows as arrays instead of objects
      const nameList = await Bun.sql`SELECT name FROM users`.values();

      return Response.json({ users, nameList });
    }
  }
});
```

#### Step-by-Step Setup

**1. Create a Hyperdrive instance on Cloudflare:**

```bash
bunx wrangler hyperdrive create my-hyperdrive \
  --connection-string "postgres://user:password@your-host:5432/mydb"
```

This will output a Hyperdrive `id` — copy it.

**2. Install your chosen PostgreSQL driver:**

```bash
# Option A — postgres.js (recommended)
bun add postgres

# Option B — node-postgres (pg)
bun add pg && bun add -d @types/pg
```

**3. Configure `bunflare.config.ts`:**

```ts
import type { BunflareConfig } from "bunflare";

export default {
  sqlite: { binding: "DB" },         // D1 → bun:sqlite
  sql: {
    type: "hyperdrive",              // Use Hyperdrive backend for Bun.sql
    binding: "HYPERDRIVE",           // Must match the binding name in wrangler.jsonc
    driver: "postgres",              // "postgres" | "pg"
  },
} satisfies BunflareConfig;
```

**4. Configure `wrangler.jsonc`:**

```jsonc
{
  "name": "my-app",
  "main": "dist/index.js",
  "compatibility_date": "2025-02-24",
  // ✅ Required! Postgres drivers use Node.js built-ins.
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id>",
      // For local development only (not deployed):
      "localConnectionString": "postgres://user:password@127.0.0.1:5433/mydb"
    }
  ]
}
```

> **⚠️ `nodejs_compat` is mandatory.** PostgreSQL drivers (`postgres.js`, `pg`) depend on Node.js built-ins like `node:stream`, `node:buffer`, and `node:events`. Without this flag, Wrangler will fail to bundle your Worker with an error like `Could not resolve "node:stream"`.

#### Choosing a Driver

Bunflare is **library-agnostic** — you pick the driver, Bunflare adapts. The `driver` field in `bunflare.config.ts` tells Bunflare which internal adapter to use.

| `driver` value | Library | Install command | Notes |
|---|---|---|---|
| `"postgres"` *(default)* | [postgres.js](https://github.com/porsager/postgres) | `bun add postgres` | Ships a dedicated Cloudflare Workers build (`/cf/`) |
| `"pg"` | [node-postgres](https://node-postgres.com/) | `bun add pg` | Bunflare translates templates to `$1, $2` syntax internally |

> **💡 Recommendation:** Use `postgres.js`. It has first-class Cloudflare Workers support and is significantly more performant. Use `pg` only if you are migrating an existing codebase that already depends on it.

#### Local Development with Docker

You need a running PostgreSQL instance locally. The simplest approach is Docker:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:latest
    container_name: my_postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5433:5432"   # 5433 avoids conflicts with any local Postgres on 5432
```

```bash
docker-compose up -d
bun run dev
```

> **⚠️ Use `127.0.0.1`, never `localhost`** in your `localConnectionString`. Modern Node.js (used internally by Wrangler/Miniflare) resolves `localhost` to the IPv6 address `::1` first. Docker Desktop, however, maps ports only to IPv4 (`127.0.0.1`). This mismatch causes a silent `connection attempt failed` error even though the container is running. Always be explicit:
>
> ```jsonc
> // ❌ This may silently fail
> "localConnectionString": "postgres://user:password@localhost:5433/mydb"
>
> // ✅ This works reliably
> "localConnectionString": "postgres://user:password@127.0.0.1:5433/mydb"
> ```

#### Using a Custom Shim

If you need complete control — e.g., to use a connection pool manager, add mTLS, or inject custom middleware — you can provide your own shim file:

```ts
// bunflare.config.ts
export default {
  sql: {
    type: "hyperdrive",
    binding: "HYPERDRIVE",
    custom: "./my-sql-shim.ts",  // path relative to project root
  },
} satisfies BunflareConfig;
```

Your shim file must export a `sql` tagged-template function compatible with the `Bun.sql` API.

#### D1 vs Hyperdrive: When to Use Each

| | **D1** (`bun:sqlite`) | **Hyperdrive** (`Bun.sql`) |
|---|---|---|
| **Database engine** | Cloudflare-managed SQLite | Any external PostgreSQL |
| **API style** | `new Database()` — sync-style with forced `await` | Tagged templates — fully async |
| **Latency** | Ultra-low (edge-native) | Low (pooled + cached by Hyperdrive) |
| **Best for** | Sessions, flags, small tables | Complex queries, existing Postgres DBs |
| **wrangler.jsonc key** | `d1_databases` | `hyperdrive` |
| **Extra dependency** | None | `postgres` or `pg` |

---


---

### 🛠️ Frameworks: Hono 

Bunflare has first-class support for **Hono**. We provide a universal `serveStatic` adapter that works in both Bun (local dev) and Cloudflare Workers (production) without changing any code.

#### 1. Setup

```bash
bun add hono
```

#### 2. Entrypoint Pattern

For Hono apps, we recommend a **hybrid export** pattern. This allows Bun's native router to handle the frontend (with automatic transpilation) while Hono handles your API.

```ts
// src/index.ts
import { Hono } from "hono";
import { serveStatic } from "bunflare/hono";
import indexHtml from "../public/index.html";

const app = new Hono();

// Universal static middleware:
// - Dev: Serves from ./public via hono/bun
// - Prod: Passes through to Cloudflare ASSETS
app.use("*", serveStatic({ root: "./public" }));

app.get("/api/hello", (c) => c.json({ message: "Hello from Hono!" }));

export default {
  fetch: app.fetch,
  routes: {
    "/": indexHtml // Bun handles the root and transpiles React automatically
  }
};
```

**Why the hybrid export?** 
In `dev:local`, Hono doesn't know how to transpile `.tsx` files. By putting `indexHtml` in the `routes` property, you hand off the HTML serving to Bun's native router, which handles all the on-the-fly bundling magic for you.

### `import { redis } from "bun"` → Redis-over-KV Bridge ⚡

This is one of Bunflare's most creative features. You get a Redis-compatible API backed by Cloudflare KV. Perfect for rate-limiting, counters, caching, and session management — without any external Redis instance.

```ts
import { redis } from "bun";

// Basic CRUD
await redis.set("user:1:name", "Alice");
const name = await redis.get("user:1:name"); // "Alice"
await redis.del("user:1:name");

// Atomic counters (great for rate limiting or visitor counts!)
await redis.incr("page:views");   // 1
await redis.incr("page:views");   // 2
await redis.decr("page:views");   // 1

// Key existence check
const exists = await redis.exists("user:1:name"); // false

// TTL / Expiration (in seconds)
await redis.setex("session:abc123", 3600, "user_data_json");
await redis.expire("session:abc123", 7200); // extend TTL
```

**Config:**
```ts
bunflare({ redis: { binding: "MY_CACHE" } })
```

---

### `Bun.file()` & `Bun.write()` → Cloudflare R2

File operations map directly to R2 object storage. Same API, infinite scale.

```ts
// Write a file to R2
await Bun.write("uploads/profile.png", imageBuffer);
await Bun.write("config.json", JSON.stringify({ key: "value" }));

// Read a file from R2
const file = Bun.file("uploads/profile.png");
const text    = await file.text();
const buffer  = await file.arrayBuffer();
const json    = await file.json();
const exists  = await file.exists(); // true/false
```

**Config:**
```ts
bunflare({ r2: { binding: "MY_BUCKET" } })
```

---

### `Bun.password` → WebCrypto

Password hashing and verification using the Web Crypto API (PBKDF2 under the hood). Works identically in both Bun and Cloudflare Workers.

```ts
// Hash a password
const hash = await Bun.password.hash("my-super-secret-password");
// → "a7b3c9..." (SHA-256 hex, compatible with Workers)

// Verify it later
const isValid = await Bun.password.verify("my-super-secret-password", hash);
// → true

const isWrong = await Bun.password.verify("wrong-password", hash);
// → false
```

No config needed — the crypto shim is always included automatically.

---

### `Bun.hash()` → WebCrypto SHA-256

Generic data hashing, useful for generating ETags, content fingerprints, or cache keys.

```ts
const hash = await Bun.hash("some data or a Buffer");
// → "2cf24dba5fb..." (hex string)
```

---

### `Bun.env` → Worker Bindings

Environment variables work transparently. In Workers, they come from your `wrangler.jsonc` secrets and bindings. In Bun, they come from `.env`.

```ts
// Works in both Bun and Cloudflare Workers!
const apiKey = Bun.env.MY_API_KEY;
const isDev  = Bun.env.NODE_ENV === "development";
```

---

## 🛠️ CLI Reference

The `bunflare` CLI is the heart of your development workflow.

### `bunflare init`

Scaffolds a new Bunflare project. Supports multiple templates:
- `react` (Default): Fullstack React 19 + Bun.serve
- `hono`: Fullstack Hono + React 19
- `none`: Minimal Worker setup

```bash
bunx bunflare init my-app --template hono
```

### `bunflare dev`

Starts the development server with live-reload.

```bash
bun run dev   # → bunflare dev
```

Under the hood, this starts `wrangler dev --live-reload`. The live-reload script is automatically injected into your HTML responses when `development: true` is set in `Bun.serve()`.

> **💡 For the best DX**, add a `build` section to your `wrangler.jsonc` to let Wrangler manage automatic rebuilds on file save:
>
> ```jsonc
> {
>   "build": {
>     "command": "bunflare build",
>     "watch_dir": "./src"
>   }
> }
> ```
>
> This way, every time you save a file, `bunflare build` runs automatically and Wrangler detects the new `dist/index.js` to hot-reload.

### `bunflare build`

Runs a full production build: Worker bundle + Frontend assets.

```bash
bun run build   # → bunflare build
```

Output:
```
🚀 building fullstack app...
  ↳ sqlite shim enabled -> D1: DB
  ↳ redis  shim enabled -> binding: MY_CACHE
  ↳ r2     shim enabled -> binding: MY_BUCKET
  ↳ assets configured -> ./public/index.html
✓ build successful at 4:20:00 PM
```

### `bunflare deploy`

Builds for production and deploys to Cloudflare in one shot.

```bash
bun run deploy   # → bunflare deploy
```

Output:
```
🚀 preparing production build...
✓ build successful at 4:25:00 PM
📦 build ready for cloudflare
  [wrangler output here...]
```

---

## 🏗️ Fullstack Architecture

Bunflare is designed for fullstack apps. Here's the recommended project structure:

```
my-app/
├── index.ts              # Worker entry point (Bun.serve with routes)
├── src/
│   ├── App.tsx           # React/Vue/Svelte frontend
│   └── ...
├── public/
│   └── index.html        # HTML entry point for the SPA
├── dist/                 # Generated (don't commit this!)
│   ├── index.js          # Compiled Worker
│   └── public/           # Compiled frontend assets
├── bunflare.config.ts    # Bunflare configuration
├── wrangler.jsonc        # Cloudflare configuration
└── package.json
```

**`bunflare.config.ts`** — the control center:
```ts
import type { BunflareConfig } from "bunflare";

export default {
  entrypoint: "./index.ts",
  sqlite: { binding: "DB" },             // bun:sqlite → D1
  sql: {
    type: "hyperdrive",                  // Bun.sql → Hyperdrive + Postgres
    binding: "HYPERDRIVE",
    driver: "postgres",                  // "postgres" | "pg"
  },
  redis:  { binding: "CACHE" },
  r2:     { binding: "STORAGE" },
  frontend: {
    entrypoint: "./public/index.html",
    outdir:     "./dist/public",
  }
} satisfies BunflareConfig;
```

**`wrangler.jsonc`** — the Cloudflare config:
```jsonc
{
  "name": "my-app",
  "main": "dist/index.js",
  "compatibility_date": "2025-02-24",
  // Required when using PostgreSQL drivers
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "..." }
  ],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id>",
      "localConnectionString": "postgres://user:password@127.0.0.1:5433/mydb"
    }
  ],
  "kv_namespaces": [
    { "binding": "CACHE", "id": "..." }
  ],
  "r2_buckets": [
    { "binding": "STORAGE", "bucket_name": "my-storage" }
  ],
  "assets": {
    "directory": "dist/public"
  },
  "build": {
    "command": "bunflare build",
    "watch_dir": "./src"
  }
}
```

---

## 🔌 Using the Plugin Directly (Advanced)

If you prefer to manage the build yourself, you can use the `bunflare` plugin directly in your `Bun.build` call:

```ts
// build.ts
import { bunflare } from "bunflare";

await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  plugins: [
    bunflare({
      sqlite: { binding: "DB" },
      redis:  { binding: "CACHE" },
      r2:     { binding: "STORAGE" },
      frontend: {
        entrypoint: "./public/index.html",
        outdir: "./dist/public",
      }
    })
  ],
});
```

---

## 💡 Real-World Recipes

### Visitor Counter with Redis

```ts
// index.ts
import { redis } from "bun";

export default Bun.serve({
  routes: {
    "/api/counter": async (req) => {
      const key = "global:visitors";

      if (req.method === "POST") {
        const count = await redis.incr(key);
        return Response.json({ count });
      }

      const count = await redis.get(key) || "0";
      return Response.json({ count: parseInt(count) });
    }
  }
});
```

### File Upload to R2

```ts
"/api/upload": async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  // This maps to R2.put() at runtime!
  await Bun.write(file.name, file);

  const saved = Bun.file(file.name);
  const exists = await saved.exists();

  return Response.json({
    success: true,
    filename: file.name,
    size: file.size,
    exists,
    message: "Uploaded to R2! 🎉"
  });
}
```

### User Auth with Password Hashing

```ts
"/api/register": async (req) => {
  const { email, password } = await req.json<{ email: string; password: string }>();

  // Hashed with WebCrypto — safe in Workers!
  const hashedPassword = await Bun.password.hash(password);

  const db = new Database("DB");
  db.run(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)",
    email,
    hashedPassword
  );

  return Response.json({ success: true });
},

"/api/login": async (req) => {
  const { email, password } = await req.json<{ email: string; password: string }>();
  const db = new Database("DB");

  const user = db.query("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json({ success: true, userId: user.id });
}
```

### Rate Limiting with Redis TTL

```ts
"/api/sensitive-action": async (req) => {
  const redis = Bun.redis();
  const ip = req.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitKey = `rate:${ip}`;

  const attempts = await redis.incr(rateLimitKey);

  if (attempts === 1) {
    // First attempt — set 1-minute window
    await redis.expire(rateLimitKey, 60);
  }

  if (attempts > 10) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  // Process the action...
  return Response.json({ success: true });
}
```

### Full-Stack: D1 + PostgreSQL Simultaneously 🐘🗄️

This recipe shows Bunflare's most powerful capability: running **two databases at once** in the same Worker — D1 (SQLite) for fast edge-native access and PostgreSQL (via Hyperdrive) for full relational power.

```ts
import { Database } from "bun:sqlite";

export default Bun.serve({
  routes: {
    "/api/hybrid": async () => {
      const results: Record<string, unknown> = {};

      // 1. D1 / SQLite — fast, edge-native, no connection overhead
      const db = new Database("DB");
      await (db.run("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, token TEXT)") as any);
      await (db.run("INSERT INTO sessions (token) VALUES (?)", [`tok_${Date.now()}`]) as any);
      const d1 = await (db.prepare("SELECT * FROM sessions ORDER BY id DESC LIMIT 1").all() as any);
      results.d1 = d1.results; // [ { id: 1, token: "tok_..." } ]

      // 2. PostgreSQL / Hyperdrive — complex queries, joins, full SQL power
      await Bun.sql`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, total NUMERIC, user_id INT)`;
      await Bun.sql`INSERT INTO orders (total, user_id) VALUES (${99.99}, ${1})`;
      results.postgres = await Bun.sql`
        SELECT o.id, o.total, o.user_id
        FROM orders o
        ORDER BY o.id DESC
        LIMIT 5
      `;

      return Response.json(results);
    }
  }
});
```

> **💡 Design Tip:** Keep session data, feature flags, and small lookup tables in D1 (zero latency, no cold starts). Keep your main application data, complex relations, and analytics in PostgreSQL via Hyperdrive.

---

## 🗺️ Roadmap

| Version | Goal | Status |
|---|---|---|
| `v0.1` | Foundation: env, sqlite, kv, redis, crypto | ✅ Done |
| `v0.2` | API Parity: R2, serve, fullstack HTML, live-reload | ✅ Done |
| `v0.3` | Testing: Unit + Miniflare + CI/CD | 🚧 In Progress |
| `v0.4` | DX: `bunflare init`, binding validation, better errors | 📅 Planned |
| `v0.5` | `Bun.sql` → Hyperdrive + multi-driver PostgreSQL support | ✅ Done |
| `v0.6` | `Bun.CryptoHasher` (streaming), `randomUUIDv7()` | 📅 Planned |
| `v1.0` | Stable npm release, full docs, VS Code extension | 📅 Planned |

---

## 🧪 Architecture Deep Dive

### The KV/Redis Shim

One of the most elegant parts of Bunflare is the Redis-over-KV bridge. The shim has a clean separation of concerns:

```
plugin/shims/kv/
├── index.ts   # Generator — reads logic.ts and injects binding name
└── logic.ts   # Pure implementation — used in both shim and unit tests
```

`logic.ts` contains the actual class implementations (`KV`, `RedisClient`) that can be imported directly in your unit tests:

```ts
// Your test file
import { RedisClient } from "../plugin/shims/kv/logic";

const mockKV = {
  get: async (key) => "mock-value",
  put: async (key, val) => {},
  delete: async (key) => {},
};

// Test the real logic with a mock KV
globalThis.env = { MY_KV: mockKV };
const redis = new RedisClient("MY_KV");
const value = await redis.get("test-key"); // "mock-value"
```

This architecture means the production shim code is also your test code — no mocking the shim itself.

### The Global Preamble Injection

For APIs like `Bun.serve`, `Bun.redis()`, and `Bun.file()` that aren't imported — they're accessed via the global `Bun` object — Bunflare injects a **preamble** at the top of every file that contains the word `Bun`:

```ts
// Auto-injected at build time:
import { redis, RedisClient } from "bunflare:kv";
import { serve } from "bunflare:serve";
import { file, write } from "bunflare:r2";
import { BunCrypto } from "bunflare:crypto";
import { env } from "bunflare:env";

if (typeof globalThis.Bun === "undefined") {
  globalThis.Bun = { redis, RedisClient, serve, file, write, ...BunCrypto, env };
}

// Your original code follows:
export default Bun.serve({ ... });
```

This is what we internally call the **"Nuclear Option"** — ensuring `Bun.*` is never undefined, regardless of the Workers environment restrictions.

---

## 🤝 Contributing

The project is structured as a Bun workspace:

```
bunflare/
├── plugin/     # The plugin source code
│   ├── index.ts          # Main plugin entry
│   ├── bin.ts            # CLI (bunflare dev/build/deploy)
│   ├── types.ts          # TypeScript types
│   ├── resolvers/        # Bun namespace resolver
│       ├── redis/        # import { redis } from "bun" → KV bridge shim
│       │   ├── index.ts  # Shim generator logic
│       │   ├── logic.ts  # Redis-over-KV class implementation
│       ├── d1/           # bun:sqlite → D1 shim
│       │   ├── database.ts  # Class-based Database/Statement API
│       │   ├── logic.ts     # Bun.sql → D1 tagged template engine
│       │   └── sql.ts       # Shim code generator
│       ├── hyperdrive/   # Bun.sql → Hyperdrive + PostgreSQL shim
│       │   ├── logic.ts     # Multi-driver adapter (postgres.js / pg / mysql2)
│       │   └── sql.ts       # Shim code generator
│       ├── kv/           # KV + Redis shims
│       │   ├── index.ts
│       │   └── logic.ts     # Pure logic — also used in unit tests
│       ├── r2.ts         # R2 shim
│       ├── crypto.ts     # WebCrypto shim
│       ├── env.ts        # Env shim
│       └── serve.ts      # Serve shim
├── tests/      # All tests live here
│   ├── hyperdrive.test.ts   # Hyperdrive driver & template translation tests
│   ├── sql.test.ts          # D1 SQL shim tests
│   └── ...
├── app/        # Example fullstack application
└── docs/       # Documentation extras
```

### Running Tests

```bash
# From the root
bun test

# Individual test files
bun test tests/redis-bridge.test.ts
bun test tests/integration.test.ts
bun test tests/shims.test.ts
```

All 22 tests should pass. 💚

---

## 📄 License

MIT © [fhorray](https://github.com/fhorray)

---

<p align="center">
  Made with ☕ and a healthy obsession with developer experience.
  <br />
  <strong>Write for Bun. Deploy to Cloudflare.</strong>
</p>
