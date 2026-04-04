import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { serve } from "bun";
import { getCloudflareContext } from "buncf";

const app = new Elysia({ aot: false })
  .use(html())
  .get("/", () => {
    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Elysia + Buncf</title>
          <style>{`
            body { font-family: 'Inter', sans-serif; margin: 0; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .container { text-align: center; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); padding: 4rem; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 25px 50px rgba(0,0,0,0.3); max-width: 500px; }
            h1 { font-size: 4rem; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -2px; }
            p { font-size: 1.4rem; opacity: 0.85; margin-bottom: 3rem; line-height: 1.6; font-weight: 300; }
            .btn { display: inline-block; background: white; color: #059669; padding: 1.2rem 3rem; border-radius: 20px; text-decoration: none; font-weight: 700; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
            .btn:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
          `}</style>
        </head>
        <body>
          <div className="container">
            <h1>🚀 Elysia + Buncf</h1>
            <p>Your high-performance Bun app is running on the Cloudflare global network.</p>
            <a href="/test" className="btn">Open Dashboard</a>
          </div>
        </body>
      </html>
    );
  })
  
  // ─── Interactive Dashboard (Bindings Check) ──────────
  .get("/test", () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Elysia Dashboard | Buncf</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 3rem; background: #0f172a; color: #f8fafc; line-height: 1.5; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
          .card { background: #1e293b; padding: 2rem; border-radius: 24px; border: 1px solid #334155; transition: transform 0.2s; }
          .card:hover { transform: translateY(-4px); border-color: #475569; }
          h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; text-align: center; background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          h2 { margin-top: 0; display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; }
          .status { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 99px; font-weight: 700; }
          .active { background: #065f46; color: #34d399; }
          .missing { background: #7f1d1d; color: #f87171; }
          .actions { margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
          button { background: #334155; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
          button:hover { background: #475569; transform: scale(1.02); }
          button:active { transform: scale(0.98); }
          #console { margin-top: 2rem; background: #020617; padding: 1.5rem; border-radius: 16px; font-family: 'Fira Code', monospace; font-size: 0.9rem; color: #a855f7; overflow-x: auto; border: 1px solid #1e293b; min-height: 100px; max-width: 1200px; margin-left: auto; margin-right: auto; }
          .header { max-width: 1200px; margin: 0 auto 3rem; display: flex; justify-content: space-between; align-items: center; }
          .nav-link { color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
          .nav-link:hover { color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <a href="/" class="nav-link">← Back Home</a>
          <div><strong>Environment:</strong> Cloudflare Worker (Bun)</div>
        </div>
        
        <h1>Live Binding Dashboard</h1>

        <div class="grid">
          <div class="card">
            <h2>🗄️ Database (D1) <span class="status active">Active</span></h2>
            <p>Test SQL connectivity and state persistence.</p>
            <div class="actions">
              <button onclick="runTest('/api/test/d1')">Execute Query</button>
            </div>
          </div>

          <div class="card">
            <h2>🔑 Key-Value (KV) <span class="status active">Active</span></h2>
            <p>Perform low-latency data operations.</p>
            <div class="actions">
              <button onclick="runTest('/api/test/kv')">Set Timestamp</button>
            </div>
          </div>

          <div class="card">
            <h2>📦 Storage (R2) <span class="status active">Active</span></h2>
            <p>Check bucket object listing and accessibility.</p>
            <div class="actions">
              <button onclick="runTest('/api/test/r2')">List Objects</button>
            </div>
          </div>
        </div>

        <div id="console">// Click an action to see results here...</div>

        <script>
          async function runTest(url) {
            const consoleEl = document.getElementById('console');
            consoleEl.innerText = "// Loading results from " + url + "...";
            try {
              const res = await fetch(url);
              const data = await res.json();
              consoleEl.innerText = JSON.stringify(data, null, 2);
            } catch (err) {
              consoleEl.innerText = "// Error: " + err.message;
            }
          }
        </script>
      </body>
    </html>
  `;
})

  // ─── API: Test D1 ───────────────────────────────────
  .get("/api/test/d1", async () => {
    const { env } = getCloudflareContext();
    if (!env.DB) return { status: "error", message: "D1 Binding not found" };
    try {
      const result = await env.DB.prepare("SELECT 1 as connected").first();
      return { status: "success", operation: "D1 SELECT", data: result, timestamp: new Date().toISOString() };
    } catch (err: any) {
      return { status: "error", message: err.message };
    }
  })

  // ─── API: Test KV ───────────────────────────────────
  .get("/api/test/kv", async () => {
    const { env } = getCloudflareContext();
    if (!env.KV) return { status: "error", message: "KV Binding not found" };
    const ts = new Date().toISOString();
    await env.KV.put("last_test", ts);
    const val = await env.KV.get("last_test");
    return { status: "success", operation: "KV PUT/GET", key: "last_test", value: val };
  })

  // ─── API: Test R2 ───────────────────────────────────
  .get("/api/test/r2", async () => {
    const { env } = getCloudflareContext();
    if (!env.BUCKET) return { status: "error", message: "R2 Binding not found" };
    const list = await env.BUCKET.list();
    return { status: "success", operation: "R2 LIST", count: list.objects.length, objects: list.objects };
  });

export default serve({
  // @ts-ignore
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
  port: 3102, // Cloudflare mode port
});

console.log("🚀 Elysia Example running at http://localhost:3102");
