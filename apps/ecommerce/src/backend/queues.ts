import { queue } from "bunflare";

export const EmailQueue = queue({
  batchSize: 5,
  maxRetries: 3,
  async process(messages, env) {
    for (const msg of messages) {
      console.log(`📧 Sending email: [${msg.body.type}] to ${msg.body.to}`);
      // Simulating a slow email API
      await new Promise(r => setTimeout(r, 100));
      msg.ack();
    }
  }
});

export const ImageProcessingQueue = queue({
  batchSize: 10,
  async process(messages, env) {
    for (const msg of messages) {
      console.log(`🖼️ Processing image for product ${msg.body.productId}: resizing ${msg.body.imageUrl}`);
      // Simulating image processing
      await new Promise(r => setTimeout(r, 200));
      msg.ack();
    }
  }
});