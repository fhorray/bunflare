import { describe, expect, it } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Messaging & Scheduling Transformations", () => {
  describe("Queue Transformation", () => {
    it("should transform queue() to a constant and inject the queue handler into export default", () => {
      const source = `
        import { queue } from "bunflare";
        import { serve } from "bun";

        export const MyQueue = queue({
          async process(batch, env) {
            console.log(batch);
          }
        });

        serve({
          fetch(req) {
            return new Response("OK");
          }
        });
      `;
      const transformed = transformSource(source, "index.ts");

      // Verify queue() is replaced by options
      expect(transformed).toContain("export const MyQueue = {");
      expect(transformed).toContain("async process(batch, env)");
      
      // Verify handler injection
      expect(transformed).toContain("export default {");
      expect(transformed).toContain("async queue(batch, env, ctx)");
      expect(transformed).toContain('case "MYQUEUE":');
      expect(transformed).toContain("if (typeof MyQueue.process === \"function\") return await MyQueue.process(batch.messages, env);");
    });
  });

  describe("Cron Transformation", () => {
    it("should transform cron() to a constant and inject the scheduled handler into export default", () => {
      const source = `
        import { cron } from "bunflare";
        import { serve } from "bun";

        export const BackupTask = cron({
          schedule: "0 0 * * *",
          async run(event, env) {
            console.log("Backing up...");
          }
        });

        serve({
          fetch(req) {
            return new Response("OK");
          }
        });
      `;
      const transformed = transformSource(source, "index.ts");

      // Verify cron() is replaced by options
      expect(transformed).toContain("export const BackupTask = {");
      
      // Verify handler injection
      expect(transformed).toContain("export default {");
      expect(transformed).toContain("async scheduled(event, env, ctx)");
      expect(transformed).toContain('if (event.cron === "0 0 * * *") {');
      expect(transformed).toContain("if (typeof BackupTask.run === \"function\") return await BackupTask.run(event, env);");
    });
  });

  describe("Co-existence", () => {
    it("should handle multiple queues and crons together", () => {
      const source = `
        import { queue, cron } from "bunflare";
        import { serve } from "bun";

        export const Q1 = queue({ async process(b) {} });
        export const Q2 = queue({ async process(b) {} });
        export const C1 = cron({ schedule: "* * * * *", async run(e) {} });

        serve({ fetch(req) { return new Response("OK"); } });
      `;
      const transformed = transformSource(source, "index.ts");

      expect(transformed).toContain('case "Q1":');
      expect(transformed).toContain('case "Q2":');
      expect(transformed).toContain('if (event.cron === "* * * * *")');
    });
  });
});
