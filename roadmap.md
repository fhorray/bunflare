# 🗺️ Bunflare Roadmap

> **Bunflare** is a Bun bundler plugin that transpiles Bun-native APIs into Cloudflare Workers primitives at build time.
> This document tracks the current state of the project, all planned features, and the path to public release.

---

## ✅ What's Already Implemented (v0.1 — Foundation)

The foundation of bunflare is complete and working. The following features have been implemented and tested:

| Feature | Bun API | Cloudflare Equivalent | Status |
|---|---|---|---|
| Environment Variables | `Bun.env` | `env` bindings via `withBunflare` | ✅ Done |
| SQLite Database | `bun:sqlite` / `new Database()` | Cloudflare D1 | ✅ Done |
| Redis Client | `import { redis } from "bun"` | Cloudflare KV (Redis-over-KV bridge) | ✅ Done |
| Password Hashing | `Bun.password.hash/verify` | Web Crypto API (PBKDF2) | ✅ Done |
| Generic Hashing | `Bun.hash()` | Web Crypto API (SHA-256) | ✅ Done |

### ✅ Infrastructure (v0.1)
- [x] `onResolve` hook: intercepts `bun:*` imports and redirects to `bunflare` namespace
- [x] `onLoad` hook: injects shim source code for each virtual module
- [x] Global AST preamble injection: transforms `Bun.password.*`, `Bun.env.*`, etc.
- [x] `withBunflare` helper: automatically bridges `env` to global scope
- [x] `setEnv` utility: manual bridge for advanced use cases
- [x] `plugin/runtime.d.ts`: type declarations for all virtual modules
- [x] `app/env.d.ts`: project-level augmentation of `Bun.env` with `CloudflareBindings`
- [x] Hot Reload via Wrangler Custom Build (`watch_dir` pointing to `plugin/` and sources)
- [x] Binding validation: throws descriptive errors for empty binding names at build time
- [x] SQLite `filename` warning: informs the developer that file paths are ignored on D1

---

## 🚧 Phase 1 — API Parity (v0.2)

The goal of this phase is to cover the most impactful Bun APIs that have a natural Cloudflare counterpart.

### 1.1 — `Bun.file()` & `Bun.write()` ↔ Cloudflare R2

**Why it matters**: `Bun.file()` is one of the most-used Bun APIs. It provides a high-performance way to read/write files as Blobs. On Cloudflare, the equivalent is **R2 Object Storage** (S3-compatible).

**Shim Contract:**
```ts
// Bun (local)
const file = Bun.file("uploads/profile.png");
const content = await file.text();
await Bun.write("uploads/new.txt", "Hello world");

// Cloudflare (via bunflare shim)
// → Bun.file("key") → MY_R2_BUCKET.get("key") → Response body
// → Bun.write("key", data) → MY_R2_BUCKET.put("key", data)
```

**Implementation Plan:**
- [x] Create `plugin/shims/r2.ts`: Generate shim that wraps an R2 binding
- [x] Add `r2` option to `BunflareOptions` in `plugin/types.ts`
- [x] Register global replacement patterns for `Bun.file(...)` and `Bun.write(...)` in `plugin/index.ts`
- [x] Add `declare module "bunflare:r2"` to `plugin/runtime.d.ts`
- [x] Add `R2Bucket` to `app/env.d.ts` and `app/wrangler.jsonc`
- [x] Write integration test in `tests/integration.test.ts`
- [x] Verify real file upload in `app/index.ts`

**Status: ✅ Done**

**Config API:**
```ts
bunflare({
  r2: { binding: "MY_BUCKET" }
})
```

---

### 1.2 — Static Assets & Fullstack Apps

**Why it matters**: Bun has first-class support for bundling and serving HTML, CSS, React/JSX, and static assets. Its bundler understands `index.html` as a full entry point, auto-processes `<script>`, `<link>`, and `<img>` tags, and handles TypeScript/JSX out of the box. On Cloudflare, the equivalent deployment pattern uses **Workers Sites** (via `wrangler.toml` `[site]` config) or **R2** to host the static files, with a Worker routing API and asset requests.

This is the key feature that unlocks **fullstack applications** — writing a Bun-style monorepo where the frontend and backend share the same `build.ts`, and bunflare handles deploying both.

#### 1.2.1 — HTML & SPA Build Pipeline

Bun's bundler accepts `index.html` as an entrypoint and resolves all linked assets:

```html
<!-- Bun understands this natively -->
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="./styles.css" />
    <script src="./app.tsx" type="module"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**Bunflare status**: ✅ Implemented. The `bunflare` plugin now accepts an `html` option for validation and logs tips for configuring Workers Assets.

---

#### 1.2.2 — Fullstack Routing with `Bun.serve` `routes`

**Bunflare status**: ✅ Implemented. The `Bun.serve` shim now supports the `routes` property using the native `URLPattern` API.

---

#### 1.2.3 — CSS Bundling & Tailwind Support

**Bunflare status**: ✅ Done. Works natively via `Bun.build`.

---

#### 1.2.4 — Asset Serving via Cloudflare Workers Assets

**Bunflare status**: ✅ Done. Users can now point Wrangler to the `html.outdir`.

---

#### 1.2.5 — Fullstack Example App

**Bunflare status**: 🚧 Planned.

Create a complete example in `examples/fullstack/` demonstrating:

```
examples/fullstack/
├── src/
│   ├── index.html        ← Bun frontend entry
│   ├── app.tsx           ← React SPA
│   ├── styles.css        ← Tailwind CSS
│   └── server.ts         ← Bun.serve with routes + SPA fallback
├── build.ts              ← Single build script
└── wrangler.jsonc        ← Auto-managed by bunflare
```

**The DX vision:**
```bash
# Develop locally with HMR
bun run dev

# Deploy fullstack to Cloudflare
bun run deploy
```

Everything — the React app, the API routes, the D1 database, the KV cache — deployed with a single command.

---

### 1.3 — `Bun.sql` ↔ Cloudflare Hyperdrive / D1

**Why it matters**: Bun has a first-class PostgreSQL client using tagged template literals (`Bun.sql`). Cloudflare offers **Hyperdrive** to connect external databases with low latency, and **D1** for serverless SQLite.

**Shim Contract:**
```ts
// Bun (local)
const users = await Bun.sql`SELECT * FROM users WHERE id = ${id}`;

// Cloudflare (via bunflare shim)
// → Uses Hyperdrive connection URL or D1
```

**Implementation Plan:**
- [x] Create `plugin/shims/hyperdrive/sql.ts`: Generate shim using Hyperdrive's PostgreSQL-compatible driver
- [x] Add `sql` option to `BunflareOptions` in `plugin/types.ts`
- [x] Register global replacement pattern for `Bun.sql` tagged template literal
- [x] Write integration test in `tests/integration.test.ts`

**Config API:**
```ts
bunflare({
  sql: {
    type: "hyperdrive",   // or "d1"
    binding: "MY_DB"
  }
})
```

---

### 1.4 — `Bun.CryptoHasher` ↔ Web Crypto API

**Why it matters**: `Bun.CryptoHasher` provides a streaming interface for hashing (SHA-256, MD5, SHA-512, etc.). The Web Crypto API available in Workers can do the same.

**Shim Contract:**
```ts
// Bun (local)
const hasher = new Bun.CryptoHasher("sha256");
hasher.update("hello");
const digest = hasher.digest("hex");

// Cloudflare (via bunflare shim)
// → Uses SubtleCrypto.digest()
```

**Implementation Plan:**
- [ ] Extend `plugin/shims/crypto.ts` to include a `CryptoHasher` class
- [ ] Register `Bun.CryptoHasher` in global replacement patterns
- [ ] Export the class from the `bunflare:crypto` virtual module
- [ ] Add type declarations to `plugin/runtime.d.ts`

---

### 1.5 — `Bun.randomUUIDv7()` ↔ Web Crypto `crypto.randomUUID()`

**Why it matters**: Bun offers `Bun.randomUUIDv7()` for time-sorted UUIDs (UUIDv7). Workers support `crypto.randomUUID()` (v4) natively, but v7 can be polyfilled in pure JS.

**Implementation Plan:**
- [ ] Add a global replacement in the plugin that replaces `Bun.randomUUIDv7()` with a Workers-compatible polyfill
- [ ] Document the behavioral difference (v4 vs v7 ordering)

---

## 🧪 Phase 2 — Testing & Runtime Validation (v0.3)

The goal of this phase is to go from "the build works" to "the Worker output is correct at runtime".

### 2.1 — Unit Tests for All Shims

Complete the unit test suite in `tests/plugin.test.ts` and `tests/integration.test.ts`:

- [x] Test `Bun.file()` → R2 shim code generation
- [x] Test `Bun.sql` → Hyperdrive shim code generation
- [ ] Test `Bun.CryptoHasher` → Web Crypto transformation
- [ ] Test `Bun.randomUUIDv7()` → polyfill injection
- [x] Test that `withBunflare` is correctly tree-shaken when not used
- [x] Test that empty binding names throw at build time (not at runtime)

### 2.2 — Miniflare Runtime Tests

Use **Miniflare** (Cloudflare's local Workers emulator) to run the transformed Worker output and assert the HTTP responses:

- [ ] Set up a `tests/runtime/` directory with a Miniflare-based test harness
- [ ] Test `Bun.env` → binding values are accessible
- [ ] Test `Bun.password.hash()` → returns a valid bcrypt-style hash
- [ ] Test `Bun.file()` / `Bun.write()` → reads and writes to a local R2 mock
- [ ] Test `bun:sqlite` → queries succeed against a local D1 mock

### 2.3 — CI/CD Pipeline

- [ ] Configure GitHub Actions workflow:
  - Run `bun test` on every push and pull request
  - Lint with `biome` or `eslint`
  - Type-check with `tsc --noEmit`
  - Run Miniflare integration tests

---

## 🧰 Phase 3 — Developer Experience (DX) (v0.4)

### 3.1 — Binding Validation at Build Time

Currently, a missing or misconfigured binding fails silently at runtime. We should catch it early:

- [ ] After the build completes, cross-reference the bindings declared in `BunflareOptions` with the `wrangler.jsonc` configuration
- [ ] Emit a clear warning if a binding name does not exist in the Wrangler config
- [ ] Provide a link to the relevant Cloudflare documentation in the warning message

### 3.2 — `bunflare` CLI Helper

- [ ] Create a simple `bunflare init` CLI that scaffolds a new project with:
  - `wrangler.jsonc` with common bindings
  - `env.d.ts` with `BunflareEnv` augmentation
  - `build.ts` with pre-configured plugin options
  - `index.ts` with `withBunflare` example

### 3.3 — Improved Error Messages

- [x] When `Bun.sql` or `Bun.file` is used without configuring the respective binding in the plugin options, throw an error like:
  > `[bunflare] You used Bun.file() but did not configure the 'r2' option. Add r2: { binding: "MY_BUCKET" } to your bunflare() config.`

---

## 📦 Phase 4 — npm Publication (v1.0)

This is the final phase before the plugin is publicly consumable. It requires cleaning up the project structure to follow npm packaging best practices.

### Step 1: Restructure the Package

The repository must be reorganized so users can `import bunflare from "bunflare"` without any extra configuration. The `app/` directory will remain a local test bench and will **not** be published.

```
bunflare/
├── src/               # Source code (currently in plugin/)
│   ├── index.ts       # Main entry point (exports `bunflare`)
│   ├── types.ts
│   ├── resolvers/
│   └── shims/
├── dist/              # Compiled output (generated, not committed)
├── runtime.d.ts       # Virtual module type declarations
├── package.json
├── tsconfig.json
└── README.md
```

### Step 2: Configure `package.json` for Publishing

```json
{
  "name": "bunflare",
  "version": "0.1.0",
  "description": "A Bun bundler plugin that transpiles Bun-native APIs to Cloudflare Workers",
  "license": "MIT",
  "author": "Your Name",
  "keywords": ["bun", "cloudflare", "workers", "plugin", "shim", "d1", "kv", "r2"],
  "exports": {
    ".": "./dist/index.js",
    "./runtime": "./runtime.d.ts"
  },
  "types": "./dist/index.d.ts",
  "files": [
    "dist/",
    "runtime.d.ts",
    "README.md"
  ],
  "peerDependencies": {
    "bun": ">=1.0.0"
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun",
    "prepublishOnly": "bun run build && bun test"
  }
}
```

### Step 3: Document the Public API

Update `README.md` with:
- [ ] Installation instructions (`bun add -d bunflare`)
- [ ] Getting started guide with `wrangler.jsonc` setup
- [ ] Full reference of all supported Bun → Cloudflare mappings
- [ ] How to use `withBunflare`, `setEnv`, and `env.d.ts`
- [ ] Migration guide: "Moving from Bun to Cloudflare Workers"

### Step 4: Versioning Strategy

Adopt **Semantic Versioning (SemVer)**:

| Version | Meaning |
|---|---|
| `0.x.x` | Unstable. Breaking changes possible between minor versions |
| `1.0.0` | Stable public release. Full SemVer guarantees |

**Changelog**: Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`) to auto-generate the `CHANGELOG.md` with tools like `changelogen`.

### Step 5: Publish to npm

```bash
# 1. Authenticate with npm
npm login

# 2. Build the package
bun run build

# 3. Verify what will be published
npm pack --dry-run

# 4. Publish
npm publish --access public
```

For a **scoped package** (e.g., `@your-org/bunflare`):
```bash
npm publish --access public --scope=@your-org
```

### Step 6: User Installation Flow (Post-Publish)

After publishing, the developer experience will be:

```bash
# 1. Install the plugin
bun add -d bunflare

# 2. Configure the build script
# build.ts
import { bunflare } from "bunflare";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  plugins: [
    bunflare({ sqlite: { binding: "DB" }, env: true })
  ]
});

# 3. Add types to tsconfig.json
# tsconfig.json → "types": ["bun", "bunflare/runtime"]

# 4. Run dev mode with hot reload
bun run dev  # → wrangler dev (with custom build)
```

---

## 🎯 Version Milestones

| Version | Goal | Target |
|---|---|---|
| `v0.1` | Foundation: env, sqlite, kv, redis, crypto | ✅ Done |
| `v0.2` | API Parity: R2, Hyperdrive, CryptoHasher, UUID | ✅ Done |
| `v0.3` | Testing: Unit + Miniflare + CI/CD | Phase 2 |
| `v0.4` | DX: Binding validation, CLI, better errors | Phase 3 |
| `v1.0` | npm Publication: Restructure, docs, stable API | Phase 4 |

---

*Last updated: April 2026*
