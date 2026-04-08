import { serve } from "bun";
import { getCloudflareContext } from "bunflare";
import { app } from "./backend/app";
import { StockManager, LiveChat } from "./backend/durables";
import {
  OrderFulfillment,
  RefundWorkflow,
  email_processor,
  logs_ingestor,
  InvoiceRenderer,
} from "./backend/infrastructure";

// --- 1. Export Infrastructure for Cloudflare Bindings ---
// The bunflare build process automatically identifies these handlers 
// based on the configuration and the use of queue/cron/workflow wrappers.

export {
  StockManager,
  LiveChat,
  OrderFulfillment,
  RefundWorkflow,
  email_processor,
  logs_ingestor,
  InvoiceRenderer
};

// --- 2. Main Server Entry ---

export default serve({
  routes: {
    "/ws/support": (req: Request) => {
      const { env } = getCloudflareContext();
      return LiveChat.connect(req, env, "global");
    },
    "/ws/health": async (req: Request) => {
      const { env } = getCloudflareContext();
      const res = await LiveChat.connect(req, env, "global");
      return new Response(`DO Health: ${res.status === 200 ? "OK" : "Error " + res.status}`, { 
        status: res.status === 200 ? 200 : 500 
      });
    }
  },
  fetch: app.fetch
});
