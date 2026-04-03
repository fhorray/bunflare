# 🥟 bun-cloudflare ☁️

> Write pure Bun. Deploy to Cloudflare Workers. Zero API changes.

`bun-cloudflare` is a build plugin and toolchain that transparently transforms your native Bun code into Cloudflare Worker equivalents at build time. **You never have to think about Cloudflare's APIs** — just write the Bun way.

## ✨ Why it rocks

- **Zero-Friction Code**: Use `Bun.serve`, `Bun.env`, `bun:sqlite`, `Bun.file`, and `Bun.write` exactly as you normally would.
- **Automatic Transformations**: At build time, your Bun APIs are silently replaced with their Cloudflare equivalents (D1, R2, KV, etc.).
- **Local Dev is Native**: Run `bun run src/index.ts` directly — our preload script mocks every binding locally using your filesystem.
- **Full-Stack Support**: Serve React/HTML frontends directly from your Worker with zero extra config.
- **Escape Hatch**: Need Cloudflare-specific primitives (Scheduled events, Durable Objects)? `getBunCloudflareContext()` has you covered.

## 📦 Install

```bash
bun add -d bun-cloudflare
```

## 🚀 Quick Start

```typescript
// src/index.ts — write plain Bun, it runs everywhere
import { serve } from "bun";
import { Database } from "bun:sqlite";

const db = new Database("MY_DB"); // → Cloudflare D1 on build

serve({
  routes: {
    "/api/users": {
      async GET() {
        await db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
        const users = await db.query("SELECT * FROM users").all();
        return Response.json(users);
      },
    },
    "/api/files/:name": {
      async GET(req) {
        const file = Bun.file(req.params.name); // → Cloudflare R2 on build
        return new Response(await file.text());
      },
      async PUT(req) {
        await Bun.write(req.params.name, await req.text()); // → Cloudflare R2 on build
        return Response.json({ ok: true });
      },
    },
  },
});
```

**Run locally:**
```bash
bun run --preload bun-cloudflare/preload src/index.ts
```

**Deploy to Cloudflare:**
```bash
bunx bun-cloudflare build && wrangler deploy
```

---

## 🗺️ API Mapping Reference

Every Bun API below is **automatically transformed** at build time. No manual changes needed.

| Bun API | Cloudflare Equivalent | Notes |
|---|---|---|
| `new Database("BINDING_NAME")` | D1 binding | Binding name = variable name passed to `Database` |
| `import { Database } from "bun:sqlite"` | D1 | Auto-detected |
| `db.query(...).all/get/run()` | D1 async queries | `await` injected automatically |
| `Bun.file("key.txt")` | R2 `.get("key.txt")` | File path = R2 object key |
| `Bun.write("key.txt", data)` | R2 `.put("key.txt", data)` | — |
| `Bun.s3.bucket("BINDING")` | R2 binding (direct) | For advanced R2 usage |
| `Bun.env.MY_VAR` | `env.MY_VAR` | Worker environment variable |
| `process.env.MY_VAR` | `env.MY_VAR` | Standard Node.js compat |
| `Bun.serve({ ... })` | `export default { fetch }` | Full router + middleware support |
| `Bun.redis.get/set/del(key)`            | KV `.get/put/delete(key)`  | KV namespace auto-detected from `kv_namespaces`   |

> [!NOTE]
> The **binding name** is always the string you pass to the Bun constructor (e.g., `new Database("MY_DB")` maps to the `MY_DB` D1 binding in your `wrangler.jsonc`). For `Bun.redis`, the first KV namespace defined in your `wrangler.jsonc` is used automatically.

---

## 🏗️ Full-Stack (with Frontend)

Serve a React (or any HTML) frontend directly from your Worker:

```typescript
// src/index.ts
import { serve } from "bun";
import { Database } from "bun:sqlite";
import index from "./index.html"; // Bun's native HTML import

const db = new Database("DB");

serve({
  routes: {
    "/*": index,          // Serve the SPA for all unmatched routes
    "/api/users": { ... },
  },
});
```

Configure your frontend build in `cloudflare.config.ts`:

```typescript
import { defineConfig } from "bun-cloudflare/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  entrypoint: "./src/index.ts",
  plugins: [tailwind()],  // Frontend plugins (CSS, etc.)
});
```

The build automatically:
1. Bundles your Worker (`index.ts`) for Cloudflare.
2. Bundles your frontend (`*.html`) assets into `dist/assets/`.
3. Wires up the `ASSETS` Cloudflare binding to serve static files.

---

## 🔧 Configuration (`cloudflare.config.ts`)

```typescript
import { defineConfig } from "bun-cloudflare/config";

export default defineConfig({
  entrypoint: "./src/index.ts",   // Worker entry (default)
  outdir: "./dist",                // Build output (default)
  minify: true,                    // Minify output
  sourcemap: "linked",             // "none" | "linked" | "inline"
  plugins: [],                     // Bun plugins for the frontend build
  define: {
    APP_VERSION: JSON.stringify("1.0.0"),
  },
  external: [],                    // Modules to leave unbundled
  splitting: false,                // Code splitting
});
```

### Config Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entrypoint` | `string` | `./src/index.ts` | Worker entry file |
| `outdir` | `string` | `./dist` | Build output directory |
| `minify` | `boolean \| object` | `false` | Minify the output |
| `sourcemap` | `string` | `"linked"` | Sourcemap mode |
| `plugins` | `BunPlugin[]` | `[]` | Bun plugins (e.g., Tailwind) |
| `define` | `object` | `{}` | Build-time string replacements |
| `drop` | `string[]` | `[]` | Drop identifiers (e.g., `["console"]`) |
| `external` | `string[]` | `[]` | Modules to keep external |
| `splitting` | `boolean` | `false` | Enable code splitting |

---

## 🛠️ Local Development

### Option A: Direct Bun run (recommended)

Add the preload to your `bunfig.toml`:

```toml
# bunfig.toml
preload = ["bun-cloudflare/preload"]
```

Then just run:

```bash
bun run src/index.ts
```

The preload script automatically reads your `wrangler.jsonc` and sets up filesystem-based mocks for D1, R2, and KV — stored in `.wrangler/state/`.

### Option B: Wrangler Dev (with custom build)

```bash
# package.json
{
  "scripts": {
    "build": "bunx bun-cloudflare build",
    "preview": "wrangler dev"
  }
}
```

```jsonc
// wrangler.jsonc
{
  "build": {
    "command": "bunx --bun bun-cloudflare build"
  }
}
```

---

## 🚪 Escape Hatch: `getBunCloudflareContext()`

For Cloudflare-specific primitives that have **no Bun equivalent**, use the context helper:

```typescript
import { getBunCloudflareContext } from "bun-cloudflare";

// ✅ Use this for:
// - Cloudflare Scheduled events (cron)
// - Durable Objects
// - Cloudflare-specific request metadata (cf object)
// - Queue consumers

serve({
  routes: {
    "/api/info": async (req) => {
      const { cf } = getBunCloudflareContext();
      return Response.json({
        country: cf?.country,
        datacenter: cf?.colo,
      });
    },
  },
});
```

> [!IMPORTANT]
> For standard I/O (database, files, environment variables), **always prefer the native Bun APIs**. `getBunCloudflareContext()` is an escape hatch, not the primary API.

---

## 🤔 How does it work?

1. **Build Phase**: `Bun.build()` runs your source through a series of AST-like string transforms that replace Bun API calls with their Cloudflare equivalents.
2. **Serve Transform**: `Bun.serve({ ... })` is rewritten to `export default { fetch }` with a smart router that preserves your route definitions.
3. **Preload (Dev Mode)**: A preload script intercepts Bun's file system and SQLite APIs, routing them to file-based emulators that perfectly simulate Cloudflare's behavior locally.

---

## 📝 License

MIT — Go build something awesome! 🚀
