import { getBunCloudflareContext } from "buncf";
import { Database } from "bun:sqlite";

// Instancia o banco de dados (será transformado para Cloudflare D1 no build)
const db = new Database("DB");

Bun.serve({
  development: {
    hmr: true,
    console: true,
  },
  async fetch(request) {
    const { env } = getBunCloudflareContext();
    const url = new URL(request.url);

    // 1. Acesso a variáveis de ambiente
    const appName = Bun.env.APP_NAME || "Bun Cloudflare Plugin";

    // 2. Demo de SQLite (D1)
    if (url.pathname === "/db") {
      await db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
      await db.query("INSERT INTO users (name) VALUES (?)").run("User at " + new Date().toISOString());
      const users = await db.query("SELECT * FROM users").all();
      return Response.json({ message: "Data from D1", users });
    }

    // 3. Demo de File I/O (R2)
    if (url.pathname === "/file") {
      const f = Bun.s3.file("hello.txt");
      const content = await f.text();
      return new Response(content || "Nenhum conteúdo ainda. Use /write para criar.");
    }

    if (url.pathname === "/write") {
      await Bun.s3.write("hello.txt", "Olá do R2! " + new Date().toISOString());
      return new Response("Escrito no R2 com sucesso!");
    }

    // 4. Demo de Redis (KV)
    if (url.pathname === "/redis") {
      const count = await Bun.redis.get("count") || "0";
      const nextCount = (parseInt(count) + 1).toString();
      await Bun.redis.set("count", nextCount);
      return new Response(`Contador KV: ${nextCount}`);
    }

    // Página Inicial com demonstração de Live Reload
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bun + Cloudflare</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; max-width: 800px; margin: 40px auto; padding: 20px; background: #111; color: #eee; }
            h1 { color: #f62; }
            code { background: #222; padding: 2px 4px; border-radius: 4px; color: #4af; }
            a { color: #4af; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .status { background: #232; padding: 10px; border-left: 4px solid #4a4; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Bun + Cloudflare Plugin!!</h1>
          <div class="status">
            <strong>Live Reload ATIVO!</strong> 🚀<br>
            Tente alterar este texto no <code>src/index.ts</code> e veja a mágica acontecer sem precisar de F5.
          </div>
          <p>App Name: <code>${appName}</code></p>
          <hr>
          <ul>
            <li><a href="/db">SQLite (D1) Demo</a></li>
            <li><a href="/file">File I/O (R2) Read</a></li>
            <li><a href="/write">File I/O (R2) Write</a></li>
            <li><a href="/redis">Redis (KV) Demo</a></li>
          </ul>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
