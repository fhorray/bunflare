import { serve } from "bun";
import { renderToString } from "react-dom/server";
import React from "react";
import { createRouter } from "buncf/router";
import { join } from "node:path";
import fs from "node:fs";

// Initialize the Buncf Router
const router = createRouter({
  srcDir: "src",
});

const server = serve({
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Static Files (public/*)
    const publicPath = join(process.cwd(), "public", url.pathname);
    if (fs.existsSync(publicPath) && !fs.lstatSync(publicPath).isDirectory()) {
      return new Response(Bun.file(publicPath));
    }

    // 2. Match Route
    const matched = await router.match(req);
    if (!matched) {
      return new Response("Not Found", { status: 404 });
    }

    // 3. Handle API Routes
    if (matched.type === 'api') {
      const module = await import(matched.match.filePath);
      const handler = module[req.method] || module.default;
      if (handler) {
        return handler(Object.assign(req, { params: matched.match.params }));
      }
      return new Response("Method Not Allowed", { status: 405 });
    }

      // 4. Handle Page Routes (SSR)
      if (matched.type === 'page') {
        const pageModule = await import(matched.match.filePath);
        const layoutsPaths = await router.resolveLayouts(matched.match.filePath);
        const layouts = await Promise.all(layoutsPaths.map((p: string) => import(p)));
        
        // Collect Metadata
        const allPaths = [...layoutsPaths, matched.match.filePath];
        const meta = (await router.getMetadata(allPaths)) as any[];
        const title = meta.find((m: any) => m.title)?.title || "Buncf Playground";
  
        // Render Layouts and Page
        let content: any = React.createElement(pageModule.default);
        for (const layout of layouts.reverse()) {
          content = React.createElement(layout.default, { children: content });
        }
  
        const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${meta.filter((m: any) => m.name).map((m: any) => `<meta name="${m.name}" content="${m.content}">`).join('\n')}
    <link rel="stylesheet" href="/src/index.css">
    <script type="module" src="/src/frontend.tsx"></script>
  </head>
  <body class="dark">
    <div id="root">${renderToString(content)}</div>
  </body>
  </html>`;
  
        return new Response(html, {
          headers: { "Content-Type": "text/html" }
        });
      }

    return new Response("Not Found", { status: 404 });
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Buncf Playground running at ${server.url}`);
