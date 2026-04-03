# Bun Cloudflare Plugin

The easiest way to run your Bun applications on Cloudflare Workers. 

`bun-cloudflare` is a Bun plugin that automatically transforms your Bun-specific code (File I/O, SQLite, Environment Variables) into Cloudflare Worker equivalents during the build process.

## Features

- **Seamless Transformation**: Use `Bun.serve`, `Bun.env`, `bun:sqlite`, and `Bun.file` directly — everything works on Cloudflare.
- **Runtime Context**: Access Cloudflare `env`, `ctx`, and `cf` objects anywhere in your code.
- **Persistent Local Dev**: Emulates Cloudflare bindings (R2, KV, D1) locally using the filesystem (`.wrangler/state`), allowing you to run `bun run index.ts` without needing `wrangler dev`.
- **Hybrid Export**: The original `Bun.serve` becomes a Cloudflare-compatible `export default`, maintaining native compatibility with Bun.
- **Built-in CLI**: Robust `build` command with support for production, minification, and bundle size reports.

## Installation

```bash
bun add -d bun-cloudflare
```

## Usage

### 1. Local Development (Native Bun)

You can run your project natively with Bun and have access to persistent Cloudflare mocks:

```bash
# Add to your preload or bunfig.toml
bun run --preload bun-cloudflare/preload src/index.ts
```

The plugin will automatically load your `wrangler.jsonc` and initialize file-based emulators.

### 2. Built-in CLI for Production

`bun-cloudflare` comes with a CLI to simplify the build process:

```bash
# Development build (with sourcemaps)
bunx bun-cloudflare build

# Production build (minified, console.log dropped, no sourcemaps)
bunx bun-cloudflare build --production
```

### 3. Code Example

```typescript
// src/index.ts
import { getBunCloudflareContext } from "bun-cloudflare";
import { Database } from "bun:sqlite";

const db = new Database("DB");

// This object will be exported as default for the Cloudflare Worker
// but also executed by Bun natively during development.
Bun.serve({
  async fetch(req) {
    const { env } = getBunCloudflareContext(); // Access Bindings (Mocks in dev)
    
    // SQLite (D1) usage
    await db.exec("CREATE TABLE IF NOT EXISTS counts (id INTEGER, val INTEGER)");
    
    // Environment variables (Cloudflare Env)
    const secret = Bun.env.SECRET_KEY;
    
    // File I/O (R2) usage
    await Bun.write("log.txt", "Request received!");

    return new Response("Hello from Bun on Cloudflare!");
  }
});
```

## Configuration

Create a `cloudflare.config.ts` file in the project root:

```typescript
import { defineConfig } from "bun-cloudflare/config";

export default defineConfig({
  entrypoint: "./src/index.ts",
  outdir: "./dist",
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "APP_NAME": JSON.stringify("My Worker")
  }
});
```

### Options Reference

| Option | Type | Description |
| --- | --- | --- |
| `entrypoint` | `string` | Worker entry point (default: `./src/index.ts`) |
| `outdir` | `string` | Output directory (default: `./dist`) |
| `target` | `"browser" \| "bun" \| "node"` | Execution environment target |
| `minify` | `boolean \| object` | Enable/configure minification |
| `sourcemap` | `string` | Sourcemap type (`linked`, `inline`, `none`) |
| `define` | `object` | Build-time constants for replacement |
| `drop` | `string[]` | Function calls to remove (e.g., `["console"]`) |
| `external` | `string[]` | Modules to keep external to the bundle |
| `splitting` | `boolean` | Enable code splitting for chunks |
| `features` | `string[]` | Enable `bun:bundle` feature flags |

## How it works

The plugin uses `Bun.build` to perform static code transformations. It identifies patterns like `Bun.serve` and converts them to the Worker format (`export default { fetch }`). During local development, the `preload` system injects emulators that read and write to local files, simulating Cloudflare services.

## License

MIT
