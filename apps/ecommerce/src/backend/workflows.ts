import { workflow } from "bunflare";

export const OrderProcessingWorkflow = workflow({
  async run(event, step) {
    const { orderId, userId, amount } = event.payload;

    await step.do("verify_payment", async () => {
      // Simulate verifying payment via external API
      console.log(`Verifying payment for order ${orderId} of $${amount}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    });

    await step.sleep("wait_for_inventory_sync", "5 seconds");

    await step.do("dispatch_shipping", async () => {
      // Simulate dispatching order
      console.log(`Dispatching order ${orderId} for shipping`);
      return { trackingNumber: `TRK-${Math.random().toString(36).substring(7)}` };
    });

    return { status: "processed", orderId };
  }
});

export const AnalyticsExportWorkflow = workflow({
  async run(event, step) {
    await step.do("export_data", async () => {
      console.log("Exporting analytics data to data warehouse...");
      return { success: true };
    });
    
    await step.do("email_report", async () => {
      console.log("Emailling weekly analytics report to admins...");
      return { sent: true };
    });
  }
});