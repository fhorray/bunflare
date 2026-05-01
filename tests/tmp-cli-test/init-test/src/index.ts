import { serve } from "bun";
import homepage from "./index.html";

const server = serve({
  routes: {
    "/": homepage,
    "/api/status": () => Response.json({ status: "online", runtime: "bunflare" })
  }
});

console.log(`Server running at ${server.url}`);
export default server;
