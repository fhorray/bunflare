import { durable, websocket } from "bunflare";
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

export const LiveChat = websocket({
  // Memory-based history buffer
  history: [] as any[],

  async open(ws, request: Request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "anonymous";
    const username = url.searchParams.get("name") || "Guest";
    const isAdmin = url.searchParams.get("admin") === "true";

    // Store identity on the socket for message context
    (ws as any).userId = userId;
    (ws as any).username = username;
    (ws as any).isAdmin = isAdmin;

    if (isAdmin) {
      console.log(`[LiveChat] Admin ${username} connected to Support Hub`);
      ws.subscribe("support-hub");
      
      // Replay history to admin (one-by-one)
      this.history.forEach(msg => ws.send(JSON.stringify(msg)));
    } else {
      console.log(`[LiveChat] User ${username} (${userId}) connected to private thread`);
      ws.subscribe(`support:${userId}`);
      
      // Replay ONLY relevant history to this specific user
      this.history
        .filter(msg => msg.userId === userId)
        .forEach(msg => ws.send(JSON.stringify(msg)));
    }
  },

  async message(ws, message) {
    const isAdmin = (ws as any).isAdmin;
    const userId = (ws as any).userId;
    const username = (ws as any).username;

    try {
      const text = typeof message === "string" ? message : new TextDecoder().decode(message);
      const data = JSON.parse(text);
      
      let payloadObj: any;
      const now = new Date().toISOString();
      const randomId = Math.random().toString(36).substring(7);

      if (isAdmin) {
        const targetId = data.targetId;
        if (!targetId || targetId === 'admin') return;

        payloadObj = {
          id: `msg_${Date.now()}_${randomId}`,
          text: data.text,
          sender: "agent",
          senderName: username,
          timestamp: now,
          userId: targetId // Always group by the customer ID
        };

        const payload = JSON.stringify(payloadObj);
        ws.send(payload); // Echo to current admin
        ws.publish(`support:${targetId}`, payload);
        ws.publish("support-hub", payload); // Sync other admins
      } else {
        payloadObj = {
          id: `msg_${Date.now()}_${randomId}`,
          text: data.text,
          sender: "user",
          senderName: username,
          timestamp: now,
          userId: userId // Group by this user ID
        };

        const payload = JSON.stringify(payloadObj);
        ws.send(payload); // Echo to user (IMPORTANT for UI)
        ws.publish(`support:${userId}`, payload); // Sync other user tabs (same user ID)
        ws.publish("support-hub", payload); // Send to admin hub
      }

      // Save to history (keep last 100)
      this.history.push(payloadObj);
      if (this.history.length > 100) this.history.shift();
      
    } catch (e) {
      console.error("[LiveChat] Error processing message:", e);
    }
  }
});
