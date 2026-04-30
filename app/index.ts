import { Database } from "bun:sqlite";

/**
 * Bunflare Fullstack App (Simplified!)
 * 
 * Notice how we don't need a manual 'fetch' fallback anymore.
 * bunflare automatically proxies unknown routes to Cloudflare ASSETS
 * if the binding is present.
 */
export default Bun.serve({
  routes: {
    // API Status endpoint
    "/api/status": (req) => {
      let sqliteStatus = "Disabled";
      try {
        const db = new Database("my-db");
        sqliteStatus = "Shimmed (D1) ✅";
      } catch (e) {
        sqliteStatus = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }

      return Response.json({
        status: "Online 🚀",
        sqlite: sqliteStatus,
        runtime: "Cloudflare Workers + Bunflare",
        timestamp: new Date().toISOString()
      });
    },

    // Echo endpoint with params
    "/api/echo/:message": (req) => {
      const { message } = req.params;
      return Response.json({ echo: message });
    }
  },
  
  // Enable development mode (HMR, detailed errors)
  development: true
});
