# ☁️ Bunflare

> **The speed of Bun. The reach of Cloudflare. Zero-config DX.**

`bunflare` is a next-generation toolchain designed to build and deploy **Cloudflare Workers** using the lightning-fast **Bun** runtime. It provides a high-performance build pipeline, native API transformations, and an industrial-grade development experience.

---

## ✨ Key Features

- **🚀 Native-First Performance**: No heavy abstractions. Use standard Cloudflare bindings (`env.DB`, `env.KV`, `env.BUCKET`) with native Bun feel.
- **⚡️ Industrial Dev Mode**: The new `bunflare dev` command orchestrates everything. Save a file, and see the browser refresh in milliseconds.
- **🎨 Full-Stack Synergy**: Seamlessly serve React, Vue, or vanilla HTML/CSS directly from your Worker with automatic asset bundling.
- **🛠️ Zero-Config Bundling**: Intelligent entry point detection finds your `index.ts/tsx` and handles asset imports automatically.
- **🌪️ Cloudflare Modernity**: First-class support for **Durable Objects**, **Workflows**, and **Containers** via fluid functional APIs.
- **🧬 Type-Safe by Design**: Integrated with Wrangler's `cf-typegen` for end-to-end IntelliSense without manual generics.

---

## 📦 Installation

```bash
bun add -d bunflare
```

---

## 🚀 Quick Start in 30 Seconds

### 1. Initialize your project
```bash
bunx bunflare init
```

### 2. Write your Worker
```typescript
// src/index.ts
import { serve, getCloudflareContext } from 'bunflare';

export default serve({
  routes: {
    '/api/hello': async () => {
      const { env } = getCloudflareContext();
      // Use your native D1 database binding
      const result = await env.DB.prepare('SELECT "Hello World" as msg').first();
      return Response.json(result);
    },
    
    // Serve your frontend for all other routes
    '/*': import('./index.html'),
  },
});
```

### 3. Start Developing
```bash
bun dev
```

---

## 🛠️ Combined CLI: `bunflare dev`

Developing for Workers has never been this smooth. `bunflare dev` provides a unified experience:

- **Instant Rebuilds**: Uses Bun's internal bundler for sub-100ms rebuilds.
- **Live Reload**: Automatically refreshes your browser when code changes.
- **High-Fidelity Simulation**: Powered by official `wrangler`, with local persistence for D1/KV.
- **Quiet Mode**: Use `-q` for a clean, distraction-free terminal.

---

## 🏢 Cloudflare API Mapping

`bunflare` surgically transforms Bun-native calls into optimized Cloudflare Worker exports.

| Bun / Bunflare API       | Cloudflare Native Equivalent | Capability                                |
| :----------------------- | :--------------------------- | :---------------------------------------- |
| `serve({ routes })`      | `export default { fetch }`   | **Dynamic Routing + WebSockets**          |
| `getCloudflareContext()` | `(env, ctx, cf)`             | **Universal Binding Access**              |
| `durable({ ... })`       | `export class MyDO { ... }`  | **Persistent State + Pub/Sub**            |
| `workflow({ ... })`      | `export class MyWF { ... }`  | **Durable Orchestration**                 |
| `container({ ... })`     | `export class MyCN { ... }`  | **Multi-language Containers**             |
| `Bun.env` / `process.env`| `env` Bindings               | **Automatic Var Injection**               |

---

## 💎 Advanced Features

### 📡 WebSocket 2.0 (Pub/Sub)
Bunflare brings Bun's powerful publish-subscribe API to Durable Objects. No manual socket management required.

```typescript
export const ChatHub = durable({
  async webSocketMessage(ws, message) {
    ws.subscribe('room-1');
    ws.publish('room-1', `New message: ${message}`);
  }
});
```

### 🏗️ Automatic Code Splitting
Stop worrying about the 1MB Worker limit. Bunflare automatically detects large route handlers and wraps them in **dynamic imports**, ensuring your cold starts are lightning-fast.

### 🩺 Diagnostic Tool (`doctor`)
Check your project health, missing bindings, or configuration errors with one command:
```bash
bunflare doctor
```

---

## 🔧 Configuration

Configure your build in `bunflare.config.ts`:

```typescript
import { defineConfig } from 'bunflare/config';

export default defineConfig({
  outdir: './dist',
  minify: true,
  sourcemap: 'linked',
  staticDir: 'public', // Automatic CDN asset delivery
});
```

---

## 🚀 Deployment

When you're ready for the world:

```bash
bun run deploy
# Calls: bunflare build --production && wrangler deploy
```

---

## 📝 License

MIT — Go build something amazing! 🚀
