<p align="center">
  <img src="https://img.shields.io/npm/v/buncf.svg?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/bun-%3E%3D1.0.0-F472B6.svg?style=flat-square" alt="bun" />
  <img src="https://img.shields.io/badge/cloudflare-workers-F38020.svg?style=flat-square" alt="cloudflare" />
</p>

<h1 align="center">🐰 buncf</h1>
<p align="center"><b>The Bun Framework for Cloudflare Workers</b></p>
<p align="center">Build full-stack React apps with file-system routing, type-safe APIs, and zero-config deployment to the edge.</p>

---

## ✨ Features

| Feature                        | Description                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| 📁 **File-System Routing**     | Next.js-style pages (`src/pages/`) and API routes (`src/api/`) |
| ⚛️ **React 19 Ready**          | Full React support with streaming SSR foundation               |
| 🔐 **Magic Bindings**          | Import `d1`, `kv`, `r2`, `env` directly—no boilerplate         |
| 🎯 **Type-Safe API Client**    | Auto-generated typed fetch client from your handlers           |
| 🔄 **SWR-Style Data Fetching** | `useFetcher` with auto-load, `mutate`, callbacks               |
| ⚡ **Server Actions**          | Zod-validated RPC with `defineAction`                          |
| 🎨 **Tailwind CSS**            | Built-in `bun-plugin-tailwind` support                         |
| 🛠️ **Dev Experience**          | Hot reload, error overlay, open-in-editor                      |
| ☁️ **Cloudflare Native**       | First-class D1, KV, R2, and Workers support                    |

---

## 🚀 Quick Start

```bash
# Create a new project
bunx buncf init my-app

cd my-app
bun dev     # Start dev server at localhost:3000
bun deploy  # Deploy to Cloudflare Workers
```

---

## 📦 Installation

```bash
bun add buncf
```

---

## 🖥️ CLI Commands

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `buncf init [name]`  | Scaffold a new project           |
| `buncf dev`          | Start dev server with hot reload |
| `buncf dev --remote` | Use live Cloudflare bindings     |
| `buncf build`        | Production build                 |
| `buncf deploy`       | Build and deploy to Workers      |
| `buncf types`        | Generate TypeScript definitions  |

---

## ⚙️ Configuration

Buncf supports an optional `buncf.config.ts` file in your project root. This file allows you to extend the build process with custom **Bun Plugins**.

```typescript
// buncf.config.ts
import { tailwind } from 'bun-plugin-tailwind';

export default {
  plugins: [tailwind],
};
```

This is particularly useful for adding support for CSS-in-JS, PostCSS, or specialized loaders.

---

## 📂 Project Structure

```
my-app/
├── src/
│   ├── index.ts          # Server entry (optional)
│   ├── index.html         # HTML template
│   ├── client.tsx         # Client entry (React)
│   ├── globals.css        # Tailwind/global styles
│   │
│   ├── api/               # API Routes
│   │   ├── hello.ts           → GET/POST /api/hello
│   │   ├── users/
│   │   │   ├── index.ts       → /api/users
│   │   │   └── [id].ts        → /api/users/:id
│   │   └── [...route].ts      → Hono catch-all
│   │
│   └── pages/             # Page Routes
│       ├── _layout.tsx        # Root layout
│       ├── _loading.tsx       # Loading state
│       ├── _error.tsx         # Error boundary
│       ├── _notfound.tsx      # 404 page
│       ├── index.tsx          → /
│       └── dashboard/
│           ├── _layout.tsx    # Nested layout
│           └── index.tsx      → /dashboard
│
├── public/                # Static assets
├── .buncf/                # Generated (gitignored)
└── wrangler.json          # Cloudflare config
```

---

## 🛣️ File-System Routing

### API Routes (`src/api/`)

Export HTTP method handlers:

```typescript
// src/api/users/[id].ts
import { defineHandler } from 'buncf';

interface User {
  id: string;
  name: string;
}

// GET /api/users/:id
export const GET = defineHandler<{ id: string }, User>((req) => {
  return Response.json({ id: req.params.id, name: 'Alice' });
});

// DELETE /api/users/:id
export const DELETE = defineHandler<{ id: string }, void>((req) => {
  // Delete user...
  return new Response(null, { status: 204 });
});
```

### Page Routes (`src/pages/`)

Export React components:

```tsx
// src/pages/users/[id].tsx
import { useParams } from 'buncf/router';

export default function UserPage() {
  const { id } = useParams();
  return <h1>User: {id}</h1>;
}
```

### Dynamic Segments

| Pattern            | Example        | Params                  |
| ------------------ | -------------- | ----------------------- |
| `[id].tsx`         | `/users/123`   | `{ id: "123" }`         |
| `[...slug].tsx`    | `/docs/a/b/c`  | `{ slug: "a/b/c" }`     |
| `[[optional]].tsx` | `/` or `/page` | `{ optional?: "page" }` |

---

## 🔗 React Router

```tsx
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  useFetcher,
  Link,
} from 'buncf/router';
```

### Hooks

| Hook                | Returns                                                     |
| ------------------- | ----------------------------------------------------------- |
| `useRouter()`       | `{ pathname, params, query, push, replace, back, forward }` |
| `useParams()`       | `{ id: "123", ... }` — dynamic route params                 |
| `useSearchParams()` | `[params, setParams]` — query string                        |
| `usePathname()`     | `"/current/path"`                                           |

### Link Component

```tsx
<Link href="/about">About</Link>
<Link href="/users/1" prefetch>User 1</Link>
```

---

## 🔄 Data Fetching with `useFetcher`

The `useFetcher` hook provides SWR-style data fetching with mutations.

### Auto-Fetch (GET)

```tsx
// Automatically fetches on mount
const { data, isLoading, mutate } = useFetcher<User[]>('/api/users');

// Refresh data
<button onClick={() => mutate()}>Refresh</button>;
```

### Mutations (POST/PUT/DELETE)

```tsx
const { submit, isSubmitting } = useFetcher();

const handleCreate = async () => {
  await submit({ name: 'Alice' }, { method: 'POST', action: '/api/users' });
};
```

### With Callbacks

```tsx
const { submit } = useFetcher<User[]>('/api/users', {
  onSuccess: (data, variables) => {
    toast.success('Created!');
    console.log('Submitted:', variables);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Declarative Form

```tsx
const { Form, isSubmitting } = useFetcher();

<Form action="/api/users" method="POST">
  <input name="email" type="email" />
  <button disabled={isSubmitting}>Submit</button>
</Form>;
```

---

## ⚡ Server Actions

Type-safe RPC with Zod validation:

```typescript
// src/api/actions/createUser.ts
import { defineAction } from 'buncf';
import { z } from 'zod';

export const createUser = defineAction(
  z.object({ name: z.string(), email: z.string().email() }),
  async (input, ctx) => {
    // ctx.request available
    const user = await db.insert(users).values(input).returning();
    return user;
  },
);
```

```tsx
// Client usage
import { createUser } from '../api/actions/createUser';

const user = await createUser({ name: 'Alice', email: 'alice@example.com' });
```

---

## 🔐 Magic Bindings

Access Cloudflare bindings without boilerplate:

```typescript
import { d1, kv, r2, env, context } from 'buncf/bindings';

export async function GET() {
  // D1 Database
  const users = await d1.MY_DB.prepare('SELECT * FROM users').all();

  // KV Storage
  const value = await kv.MY_KV.get('key');

  // R2 Object Storage
  const object = await r2.MY_BUCKET.get('file.png');

  // Environment variables
  const apiKey = env.API_KEY;

  // Request context
  const country = context.cf?.country;

  return Response.json({ users, value, apiKey, country });
}
```

### Configuration

```json
// wrangler.json
{
  "name": "my-app",
  "main": ".buncf/cloudflare/worker.js",
  "compatibility_date": "2025-01-01",
  "d1_databases": [{ "binding": "MY_DB", "database_id": "xxx" }],
  "kv_namespaces": [{ "binding": "MY_KV", "id": "xxx" }],
  "r2_buckets": [{ "binding": "MY_BUCKET", "bucket_name": "xxx" }],
  "vars": { "API_KEY": "secret" }
}
```

---

## 📐 Layouts & Metadata

### Nested Layouts

```tsx
// src/pages/_layout.tsx (Global)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// src/pages/dashboard/_layout.tsx (Nested)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Page Metadata

```tsx
// src/pages/about.tsx
export const meta = () => [
  { title: 'About Us' },
  { name: 'description', content: 'Learn more about us' },
  { property: 'og:image', content: '/og.png' },
];

export default function About() {
  return <h1>About</h1>;
}
```

---

## 🛡️ Middleware

```typescript
// src/middleware.ts
import type { MiddlewareConfig } from 'buncf';

export default [
  {
    name: 'auth',
    matcher: '/api/protected/*',
    handler: async (req, next) => {
      if (!req.headers.get('Authorization')) {
        return new Response('Unauthorized', { status: 401 });
      }
      return next();
    },
  },
  {
    name: 'logger',
    matcher: '/api/*',
    handler: async (req, next) => {
      console.log(`[${req.method}] ${req.url}`);
      return next();
    },
  },
] satisfies MiddlewareConfig[];
```

---

## 🎨 Styling

### Tailwind CSS

```css
/* src/globals.css */
@import 'tailwindcss';
```

> [!IMPORTANT]
> To process Tailwind directives, you MUST register the `bun-plugin-tailwind` in your `buncf.config.ts` as shown in the **Configuration** section.

````

```tsx
// src/client.tsx
import './globals.css';
````

### Static Assets

Place files in `public/`:

```
public/
├── favicon.ico
├── logo.svg
└── robots.txt
```

```tsx
<img src="/logo.svg" alt="Logo" />
```

---

## 🔧 Type-Safe API Client

Buncf auto-generates a typed fetch wrapper:

```tsx
// Auto-generated in .buncf/api-client.ts
import { api } from './.buncf/api-client';

// Full autocomplete and type inference!
const user = await api.get('/api/users/:id', { params: { id: '123' } });
// user is typed as User
```

---

## 🛠️ Development Features

### Error Overlay

Beautiful Next.js-style error display with:

- Stack traces
- Source code preview
- **Open in Editor** button (VS Code)

### Hot Reload

Automatic rebuild on file changes with instant browser refresh.

### Remote Mode

```bash
buncf dev --remote
```

Use live Cloudflare bindings during development.

---

## 📤 Deployment

```bash
bun deploy
```

This runs `buncf build` then `wrangler deploy`.

### Build Output

```
.buncf/
├── cloudflare/
│   ├── worker.js      # Bundled worker
│   └── assets/        # Static files
├── routes.ts          # Client routes
├── api-client.ts      # Typed API client
└── cloudflare-env.d.ts # Auto-generated types
```

---

## 📚 API Reference

### Exports from `buncf`

```typescript
import {
  // API Definition
  defineHandler, // Type-safe GET/DELETE handler
  defineBody, // Type-safe POST/PUT/PATCH handler

  // Server Actions
  defineAction, // Zod-validated action

  // Context
  getCloudflareContext,
  runWithCloudflareContext,

  // Factory
  createWorkerHandler,
  createApp,
  createApiRouter,
  createPagesRouter,

  // SSR
  renderApp,
} from 'buncf';
```

### Exports from `buncf/router`

```typescript
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  useFetcher,
  useSubmit,
  Link,
  BuncfRouter,
} from 'buncf/router';
```

### Exports from `buncf/bindings`

```typescript
import { d1, kv, r2, env, context } from 'buncf/bindings';
```

---

## 📋 Requirements

- **Bun** >= 1.0.0
- **Node.js** >= 18 (for Wrangler CLI)
- **Wrangler** >= 3.0.0

---

## 📄 License

MIT © [Francyelton Nobre](https://github.com/francyelton)

---

<p align="center">
  <sub>Built with ❤️ for the edge</sub>
</p>
