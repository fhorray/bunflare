import { durable } from "bunflare";
import type { CloudflareBindings, DurableObjectState } from "bunflare";

export const StockManager = durable({
  async fetch(request: Request, state: DurableObjectState, env: CloudflareBindings) {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    if (!productId) return Response.json({ error: "Missing productId" }, { status: 400 });

    let stock: number = (await state.storage.get(`stock:${productId}`)) ?? 100;

    if (request.method === "POST") {
      const { quantity } = await request.json() as { quantity: number };
      if (stock < quantity) return Response.json({ success: false, error: "Out of stock" }, { status: 400 });
      stock -= quantity;
      await state.storage.put(`stock:${productId}`, stock);
      return Response.json({ success: true, stock });
    }
    return Response.json({ stock });
  }
});

export const LiveChat = durable({
  async fetch(request: Request, state: DurableObjectState, env: CloudflareBindings) {
    const pair = new (globalThis as any).WebSocketPair();
    const server = pair[1];
    (server as any).serialize = () => ({});
    (server as any).subscribe("support");
    return new Response(null, { status: 101, webSocket: pair[0] } as any);
  },
  async webSocketMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      // Broadcast the message to everyone subscribed to 'support'
      ws.publish("support", JSON.stringify({
        from: data.from || "User",
        role: data.role || "user",
        text: data.text || message,
        time: new Date().toISOString()
      }));
    } catch (e) {
      // Fallback for plain text messages
      ws.publish("support", JSON.stringify({
        from: "User",
        role: "user",
        text: message,
        time: new Date().toISOString()
      }));
    }
  }
});
