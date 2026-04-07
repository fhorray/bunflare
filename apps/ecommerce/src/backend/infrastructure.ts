import { workflow, queue, browser } from "bunflare";
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { CloudflareBindings, WorkflowEvent, WorkflowStep, MessageBatch } from "bunflare";

export const OrderFulfillment = workflow({
  async run(event: WorkflowEvent<{ orderId: string, total: number }>, step: WorkflowStep, env: CloudflareBindings) {
    const { orderId } = event.payload;
    const db = drizzle(env.DB, { schema });
    await step.do("Verify Payment", async () => {
      await db.update(schema.orders).set({ status: 'paid' }).where(eq(schema.orders.id, orderId));
    });
  }
});

export const RefundWorkflow = workflow({
  async run(event: WorkflowEvent<{ orderId: string }>, step: WorkflowStep, env: CloudflareBindings) {
    const { orderId } = event.payload;
    console.log(`[Workflow] Processing Refund for ${orderId}`);
  }
});

export const email_processor = queue({
  async process(messages: Message<{
    body: string;
  }>[], env: CloudflareBindings) {
    for (const msg of messages) { console.log(`[Queue] Email:`, msg.body); msg.ack(); }
  }
});

export const logs_ingestor = queue({
  async process(messages: Message<{
    body: string;
  }>[], env: CloudflareBindings) {
    const db = drizzle(env.DB, { schema });
    for (const msg of messages) {
      console.log(`[Queue] Log Ingested:`, msg.body);

      const payload = msg.body as any;
      await db.insert(schema.edgeLogs).values({
        id: `log_${Math.random().toString(36).substring(7)}`,
        event: payload.event || 'unknown_event',
        details: typeof payload.details === 'string' ? payload.details : JSON.stringify(payload.details || payload),
        createdAt: new Date()
      });

      msg.ack();
    }
  }
});

export const InvoiceRenderer = browser({
  async run(page: any, req: Request, env: CloudflareBindings) {
    const payload = (await req.json()) as any;
    const orderId = payload.orderId;
    await page.setContent(`<h1>Invoice ${orderId}</h1>`);
    return new Response(await page.pdf(), { headers: { "Content-Type": "application/pdf" } });
  }
});
