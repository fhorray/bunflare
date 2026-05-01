# bunflare — Ideas & Project Design

## 🎯 Goal

Create a **Bun bundler plugin** that intercepts Bun-specific API imports and replaces them with Cloudflare Workers-compatible equivalents at **build time**, so code written for Bun can be deployed to Cloudflare Workers with minimal changes.

---

## 🧠 Core Concept

When you write code using Bun APIs like `bun:sqlite` or `Bun.redis`, those modules don't exist in the Cloudflare Workers runtime. This plugin acts as a **shim layer** during bundling:

```
import { Database } from "bun:sqlite"
        ↓  [bunflare plugin intercepts onResolve]
        returns shim contents backed by Cloudflare D1
```

The plugin uses Bun's `BunPlugin` API — specifically the `onResolve` and `onLoad` lifecycle hooks — to:
1. **Intercept** imports that target Bun-specific namespaces (`bun:*`, specific Bun globals)
2. **Redirect** them to shim modules written for the Cloudflare Workers runtime
3. **Inject** any necessary glue code to make the APIs compatible

---

## 📦 API Surface to Cover

| Bun API | Import / Global | Cloudflare Equivalent | Strategy |
|---|---|---|---|
| SQLite | `bun:sqlite` → `Database` | Cloudflare D1 (`D1Database`) | `onResolve` bun namespace + shim |
| Redis (Valkey) | `Bun.RedisClient` / `Bun.redis` | Upstash Redis HTTP | Global replacement via `onLoad` code transform |
| PostgreSQL | `Bun.SQL` / `Bun.sql` | Cloudflare Hyperdrive + `node-postgres` | Global replacement via `onLoad` code transform |
| File I/O | `Bun.file()`, `Bun.write()` | Cloudflare R2 (`R2Bucket`) | Global replacement; partial compat |
| Env vars | `Bun.env` | Workers `env` binding | Simple global shim |
| Hashing | `Bun.password`, `Bun.hash`, `Bun.CryptoHasher` | Web Crypto API (`crypto.subtle`) | Shim with Web Crypto |
| S3 | `Bun.s3` | Cloudflare R2 via S3-compatible API | Shim using `@aws-sdk/client-s3` |
| Server | `Bun.serve()` | Cloudflare `export default { fetch }` | Out-of-scope (architecture change) |
| WebSockets | `Bun.serve({ websocket })` | Cloudflare Workers WS / Durable Objects | Out-of-scope (complex) |
| Compression | `Bun.gzipSync()`, etc. | `CompressionStream` Web API | Shim using Web Streams |
| Streaming HTML | `HTMLRewriter` | Cloudflare `HTMLRewriter` (native!) | No-op — already compatible |

**MVP targets:** `bun:sqlite` → D1, `Bun.redis`/`Bun.RedisClient` → Upstash HTTP, `Bun.env` → Workers env

---

## 🗂️ Project Structure

```
plugin/
├── index.ts              # Main plugin entry — registers all sub-plugins
├── types.ts              # Shared TypeScript types & interfaces
│
├── shims/
│   ├── sqlite.ts         # bun:sqlite → Cloudflare D1 shim
│   ├── redis/            # Upstash Redis HTTP client shim
│   │   ├── index.ts      # Shim generator logic
│   │   └── logic.ts      # Redis client wrapper implementation
│   ├── env.ts            # Bun.env / process.env → Workers env binding shim
│   └── crypto.ts         # bun:crypto → Web Crypto API shim
│
├── resolvers/
│   ├── bun-namespace.ts  # Handles `bun:*` namespace resolution
│   └── globals.ts        # Handles Bun.* global replacements
│
└── utils/
    └── code-gen.ts       # Helpers to generate shim module contents
```

---

## ⚙️ How the Plugin Works (Architecture)

### Step 1 — onResolve: Intercept bun:* imports

```ts
build.onResolve({ filter: /.*/, namespace: "bun" }, (args) => {
  return {
    path: args.path,       // e.g. "sqlite", "redis"
    namespace: "bunflare", // redirect to our virtual namespace
  };
});
```

### Step 2 — onLoad: Return shim code

```ts
build.onLoad({ filter: /.*/, namespace: "bunflare" }, (args) => {
  const shim = resolveShim(args.path); // e.g. "sqlite" → D1 shim code
  return {
    contents: shim,
    loader: "ts",
  };
});
```

### Step 3 — Shims expose compatible APIs

Each shim re-exports a class/function with the same interface as the Bun API it replaces, but implemented using Cloudflare Workers primitives. The consumer code changes **zero lines**.

---

## 🔧 Plugin Configuration

The plugin should accept a config object to map Bun APIs to specific Cloudflare bindings:

```ts
import { bunflare } from "./plugin";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  plugins: [
    bunflare({
      sqlite: { binding: "DB" },           // maps to env.DB (D1Database)
      redis: { provider: "upstash" },       // uses Upstash HTTP client
      redis: { binding: "MY_KV" },         // maps to env.MY_KV (Redis-over-KV)
    }),
  ],
});
```

---

## 🚧 Implementation Phases

### Phase 1 — Foundation
- [ ] `plugin/types.ts` — Plugin config types, shim interfaces
- [ ] `plugin/index.ts` — Main BunPlugin factory with `onResolve` + `onLoad`
- [ ] `plugin/resolvers/bun-namespace.ts` — Intercept `bun:*` imports

### Phase 2 — First Shims
- [ ] `plugin/shims/sqlite.ts` — D1 adapter (same query interface as `bun:sqlite`)
- [ ] `plugin/shims/env.ts` — `Bun.env` → Workers `env` passthrough

### Phase 3 — Extended Shims
- [ ] `plugin/shims/redis.ts` — Upstash Redis via HTTP
- [ ] `plugin/shims/crypto.ts` — Web Crypto wrappers

### Phase 4 — DX & Tooling
- [ ] CLI helper to validate which Bun APIs are used and warn about unsupported ones
- [ ] Type declarations (`.d.ts`) for shim exports so IDEs don't complain
- [ ] Tests using `bun:test`

---

## 📌 Key Constraints

- **No `any` types** — all shims must be fully typed
- Shims must only use APIs available in the **Cloudflare Workers runtime** (no Node.js built-ins unless `nodejs_compat` is enabled)
- Shims expose the **same TypeScript interface** as their Bun counterpart when possible
- The plugin runs at **build time** only — zero runtime overhead from the plugin itself
- Cloudflare bindings (D1, KV, R2) are **injected via the Workers `env` object** at runtime; shims must accept them as constructor arguments or via a global registry

---

## ❓ Open Questions

1. **Globals vs. imports**: `Bun.file()`, `Bun.env`, etc. are globals, not imports — these need AST-level transformation (via `onLoad` + string replacement) rather than just `onResolve`. Is that in scope?
2. **Type fidelity**: Should shims implement the full Bun API surface or only the most-used subset?
3. **`Bun.redis` / `Bun.RedisClient`** are globals, not imports — transformation requires scanning source code in `onLoad` and injecting an Upstash HTTP client. Acceptable tradeoff?
4. **Worker env injection**: The cleanest pattern for passing D1/KV bindings into shims at runtime needs a design decision (global registry? module-level `init(env)` call?).
