# Bun Cloudflare Plugin

The easiest way to run your Bun applications on Cloudflare Workers. 

`bun-cloudflare` is a Bun plugin that automatically transforms your Bun-specific code (File I/O, SQLite, Environment Variables) into Cloudflare Worker equivalents during the build process.

## Features

- **Seamless Transformation**: Use `Bun.serve`, `Bun.env`, `bun:sqlite`, and `Bun.file` directly — they just work on Cloudflare.
- **Runtime Context**: Access Cloudflare `env`, `ctx`, and `cf` objects anywhere in your code.
- **Auto-detection**: Automatically detects which Cloudflare bindings (D1, R2, KV) your code needs and can even generate a `wrangler.toml` for you.
- **Wrangler Integration**: Supports `wrangler.toml`, `wrangler.json`, and `wrangler.jsonc` out of the box.

## Installation

```bash
bun add -d bun-cloudflare
```

## Usage

### 1. Simple setup in your build script

```typescript
import { cloudflarePlugin } from "bun-cloudflare/plugin";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser", // Must be browser or bun (with transformations)
  plugins: [
    cloudflarePlugin({
      generateWranglerConfig: true,
      workerName: "my-cool-worker",
      compatibilityDate: "2024-04-03"
    })
  ]
});
```

### 2. Write your Bun code

```typescript
// src/index.ts
import { getBunCloudflareContext } from "bun-cloudflare";
import { Database } from "bun:sqlite";

const db = new Database("DB");

Bun.serve({
  async fetch(req) {
    const { env } = getBunCloudflareContext(); // Access Cloudflare Bindings
    
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

The `cloudflarePlugin` accepts the following options:

| Option | Type | Description |
| --- | --- | --- |
| `workerName` | `string` | Name of your worker |
| `compatibilityDate` | `string` | Cloudflare compatibility date |
| `generateWranglerConfig` | `boolean` | If true, generates a `wrangler.toml` on build end |
| `wranglerConfigPath` | `string` | Custom path to an existing wrangler config |
| `bindings` | `object` | Explicitly define D1, R2, KV, or Vars bindings |

## How it works

The plugin performs a series of static analysis and string replacements to map Bun's synchronous APIs to Cloudflare's asynchronous platform APIs. For example, `db.query(...).all()` is transformed to `await db.query(...).all()` and redirected to a D1 shim.

## License

MIT
