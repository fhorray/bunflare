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
    "/ws/support": (req: any) => {
      // Use the standard getCloudflareContext() and check for the binding existence
      const { env } = getCloudflareContext();

      if (!env.LIVE_CHAT) {
        console.error("Critical: LIVE_CHAT binding is missing from context.");
        return new Response("Service Unavailable: Chat Hub missing", { status: 503 });
      }

      const id = env.LIVE_CHAT.idFromName("global");
      return env.LIVE_CHAT.get(id).fetch(req);
    }
  },
  fetch: app.fetch
});
