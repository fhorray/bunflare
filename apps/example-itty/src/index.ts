import { Router, json } from "itty-router";
import { serve } from "bun";
import { getCloudflareContext } from "buncf";

const router = Router();

// ─── Home Page ──────────────────────────────────────
router.get("/", () => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Itty Router + Buncf</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .container { text-align: center; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); padding: 5rem; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 30px 60px rgba(0,0,0,0.4); max-width: 600px; }
          h1 { font-size: 4rem; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -2px; }
          p { font-size: 1.4rem; opacity: 0.8; margin-bottom: 3rem; line-height: 1.5; font-weight: 300; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 1.2rem 3rem; border-radius: 20px; text-decoration: none; font-weight: 700; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }
          .btn:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4); background: #818cf8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚡️ Itty Router</h1>
          <p>Micro-performance with maximal capability on the Cloudflare edge.</p>
          <a href="/test" class="btn">Open Dashboard</a>
        </div>
      </body>
    </html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
});

// ─── Interactive Dashboard (Bindings Check) ──────────
router.get("/test", () => {
  const { env } = getCloudflareContext();
  const dbStatus = env.DB ? "active" : "missing";
  const kvStatus = env.KV ? "active" : "missing";
  const r2Status = env.BUCKET ? "active" : "missing";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Itty Dashboard | Buncf</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 3rem; background: #1e1b4b; color: #fdf2f8; line-height: 1.5; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
          .card { background: #312e81; padding: 2rem; border-radius: 24px; border: 1px solid #3730a3; transition: transform 0.2s; }
          .card:hover { transform: translateY(-4px); border-color: #6366f1; }
          h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; text-align: center; background: linear-gradient(to right, #f472b6, #fb7185); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          h2 { margin-top: 0; display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; }
          .status { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 99px; font-weight: 700; }
          .active { background: #312e81; color: #f472b6; border: 1px solid #f472b6; }
          .missing { background: #7f1d1d; color: #f87171; }
          .actions { margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
          button { background: #3730a3; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
          button:hover { background: #4338ca; transform: scale(1.02); }
          #console { margin-top: 2rem; background: #0c0a09; padding: 1.5rem; border-radius: 16px; font-family: 'Fira Code', monospace; font-size: 0.9rem; color: #fb7185; overflow-x: auto; border: 1px solid #312e81; min-height: 100px; max-width: 1200px; margin-left: auto; margin-right: auto; }
          .header { max-width: 1200px; margin: 0 auto 3rem; display: flex; justify-content: space-between; align-items: center; }
          .nav-link { color: #f9a8d4; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
          .nav-link:hover { color: white; }
        </style>
      </head>
      <body>
        <div class="header">
          <a href="/" class="nav-link">← Back Home</a>
          <div><strong>Environment:</strong> Cloudflare Worker (Itty Router)</div>
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
});

// ─── API: Test D1 ───────────────────────────────────
router.get("/api/test/d1", async () => {
  const { env } = getCloudflareContext();
  if (!env.DB) return json({ status: "error", message: "D1 Binding not found" });
  try {
    const result = await env.DB.prepare("SELECT 1 as connected").first();
    return json({ status: "success", operation: "D1 SELECT", data: result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return json({ status: "error", message: err.message });
  }
});

// ─── API: Test KV ───────────────────────────────────
router.get("/api/test/kv", async () => {
  const { env } = getCloudflareContext();
  if (!env.KV) return json({ status: "error", message: "KV Binding not found" });
  const ts = new Date().toISOString();
  await env.KV.put("last_test", ts);
  const val = await env.KV.get("last_test");
  return json({ status: "success", operation: "KV PUT/GET", key: "last_test", value: val });
});

// ─── API: Test R2 ───────────────────────────────────
router.get("/api/test/r2", async () => {
  const { env } = getCloudflareContext();
  if (!env.BUCKET) return json({ status: "error", message: "R2 Binding not found" });
  const list = await env.BUCKET.list();
  return json({ status: "success", operation: "R2 LIST", count: list.objects.length, objects: list.objects });
});

// 404 Handler
router.all("*", () => new Response("Not Found", { status: 404 }));

export default serve({
  // @ts-ignore
  fetch: (req, env, ctx) => router.fetch(req, env, ctx),
  port: 3105, // Cloudflare mode port
});

console.log("🚀 Itty Router Example running at http://localhost:3105");
