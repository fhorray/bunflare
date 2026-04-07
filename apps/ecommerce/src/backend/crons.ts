import { cron } from "bunflare";

export const DailyInventorySync = cron({
  schedule: "0 0 * * *", // Midnight everyday
  async run(event, env) {
    console.log("⏰ Running daily inventory sync...");
    // Log sync run to D1 (Simulated)
    return;
  }
});

export const MonthlySalesReport = cron({
  schedule: "0 0 1 * *", // First of every month
  async run(event, env) {
    console.log("📈 Generating monthly sales report...");
    return;
  }
});