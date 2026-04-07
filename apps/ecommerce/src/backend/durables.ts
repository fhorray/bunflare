import { durable } from "bunflare";

export const CartSession = durable({
  async webSocketMessage(ws: any, msg: string | ArrayBuffer) {
    if (typeof msg === "string") {
      const data = JSON.parse(msg);
      if (data.type === "ADD_ITEM") {
        ws.publish("cart_updates", JSON.stringify({ itemAdded: data.itemId }));
      }
    }
  },
  async fetch(req, state, env) {
    // API logic for cart
    if (req.method === "POST") {
      const { items } = await req.json();
      await state.storage.put("items", items);
      return new Response("OK");
    }
    const items = await state.storage.get("items") || [];
    return new Response(JSON.stringify(items));
  }
});

export const LiveInventory = durable({
  async webSocketMessage(ws: any, msg: string | ArrayBuffer) {
    if (msg === "subscribe") {
      ws.subscribe("inventory_updates");
    }
  },
  async fetch(req: Request, state: any, env: any) {
    if (req.method === "POST") {
      const body = await req.json();
      const currentStock = (await state.storage.get("stock")) as number || 100;
      const newStock = Math.max(0, currentStock - body.quantity);
      await state.storage.put("stock", newStock);

      // Alert active users via standard DO PubSub
      state.getWebSockets("inventory_updates").forEach((ws: any) => {
        ws.send(JSON.stringify({ stock: newStock }));
      });
      
      return new Response(JSON.stringify({ newStock }));
    }
    const currentStock = (await state.storage.get("stock")) as number || 100;
    return new Response(JSON.stringify({ stock: currentStock }));
  }
});