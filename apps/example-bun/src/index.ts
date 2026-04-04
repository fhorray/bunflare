import { serve } from "bun";
import { getCloudflareContext } from "buncf";

export default serve({
  async fetch(req: Request) {
    const { env, ctx } = getCloudflareContext();
    const url = new URL(req.url);

    // ─── Home Page ──────────────────────────────────────
    if (url.pathname === "/") {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Pure Bun + Buncf</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              .container { text-align: center; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); padding: 5rem; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 30px 60px rgba(0,0,0,0.4); max-width: 600px; }
              h1 { font-size: 4rem; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -2px; }
              p { font-size: 1.4rem; opacity: 0.8; margin-bottom: 3rem; line-height: 1.5; font-weight: 300; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 1.2rem 3rem; border-radius: 20px; text-decoration: none; font-weight: 700; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
              .btn:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4); background: #60a5fa; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚡️ Pure Bun</h1>
              <p>Direct low-level Bun performance on the Cloudflare global network.</p>
              <a href="/test" class="btn">Open Dashboard</a>
            </div>
          </body>
        </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // ─── Interactive Dashboard (Bindings Check) ──────────
    if (url.pathname === "/test") {
      const dbStatus = env.DB ? "active" : "missing";
      const kvStatus = env.KV ? "active" : "missing";
      const r2Status = env.BUCKET ? "active" : "missing";
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Bun Dashboard | Buncf</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 3rem; background: #0f172a; color: #f8fafc; line-height: 1.5; }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
              .card { background: #1e293b; padding: 2rem; border-radius: 24px; border: 1px solid #334155; transition: transform 0.2s; }
              .card:hover { transform: translateY(-4px); border-color: #475569; }
              h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; text-align: center; background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              h2 { margin-top: 0; display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; }
              .status { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 99px; font-weight: 700; }
              .active { background: #075985; color: #7dd3fc; }
              .missing { background: #7f1d1d; color: #f87171; }
              .actions { margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
              button { background: #334155; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
              button:hover { background: #475569; transform: scale(1.02); }
              #console { margin-top: 2rem; background: #020617; padding: 1.5rem; border-radius: 16px; font-family: 'Fira Code', monospace; font-size: 0.9rem; color: #38bdf8; overflow-x: auto; border: 1px solid #1e293b; min-height: 100px; max-width: 1200px; margin-left: auto; margin-right: auto; }
              .header { max-width: 1200px; margin: 0 auto 3rem; display: flex; justify-content: space-between; align-items: center; }
              .nav-link { color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
              .nav-link:hover { color: white; }
            </style>
          </head>
          <body>
            <div class="header">
              <a href="/" class="nav-link">← Back Home</a>
              <div><strong>Environment:</strong> Cloudflare Worker (Pure Bun)</div>
            </div>
            
            <h1>Live Binding Dashboard</h1>

            <div class="grid">
              <div class="card">
                <h2>🗄️ Database (D1) <span class="status ${dbStatus}">${dbStatus}</span></h2>
                <p>Test SQL connectivity and state persistence.</p>
                <div class="actions">
                  <button onclick="runTest('/api/test/d1')">Execute Query</button>
                </div>
              </div>

              <div class="card">
                <h2>🔑 Key-Value (KV) <span class="status ${kvStatus}">${kvStatus}</span></h2>
                <p>Perform low-latency data operations.</p>
                <div class="actions">
                  <button onclick="runTest('/api/test/kv')">Set Timestamp</button>
                </div>
              </div>

              <div class="card">
                <h2>📦 Storage (R2) <span class="status ${r2Status}">${r2Status}</span></h2>
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
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // ─── API: Test D1 ───────────────────────────────────
    if (url.pathname === "/api/test/d1") {
      if (!env.DB) return Response.json({ status: "error", message: "D1 Binding not found" });
      try {
        const result = await env.DB.prepare("SELECT 1 as connected").first();
        return Response.json({ status: "success", operation: "D1 SELECT", data: result, timestamp: new Date().toISOString() });
      } catch (err: any) {
        return Response.json({ status: "error", message: err.message });
      }
    }

    // ─── API: Test KV ───────────────────────────────────
    if (url.pathname === "/api/test/kv") {
      if (!env.KV) return Response.json({ status: "error", message: "KV Binding not found" });
      const ts = new Date().toISOString();
      await env.KV.put("last_test", ts);
      const val = await env.KV.get("last_test");
      return Response.json({ status: "success", operation: "KV PUT/GET", key: "last_test", value: val });
    }

    // ─── API: Test R2 ───────────────────────────────────
    if (url.pathname === "/api/test/r2") {
      if (!env.BUCKET) return Response.json({ status: "error", message: "R2 Binding not found" });
      const list = await env.BUCKET.list();
      return Response.json({ status: "success", operation: "R2 LIST", count: list.objects.length, objects: list.objects });
    }

    return new Response("Not Found", { status: 404 });
  },
  port: 3103, // Cloudflare mode port
});

console.log("🚀 Pure Bun Example running at http://localhost:3103");
