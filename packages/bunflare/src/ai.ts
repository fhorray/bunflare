import { getCloudflareContext } from "./runtime/context";

export const ai = {
  async generateText(options: { model: string; messages: { role: string; content: string }[]; [key: string]: any }) {
    const { env } = getCloudflareContext();
    if (!env.AI) throw new Error("AI binding missing");
    const { model, ...rest } = options;
    return (env.AI as any).run(model, rest);
  },

  async generateEmbeddings(options: { model: string; text: string | string[]; [key: string]: any }) {
    const { env } = getCloudflareContext();
    if (!env.AI) throw new Error("AI binding missing");
    const { model, ...rest } = options;
    return (env.AI as any).run(model, rest);
  },

  async classifyText(options: { model: string; text: string; [key: string]: any }) {
    const { env } = getCloudflareContext();
    if (!env.AI) throw new Error("AI binding missing");
    const { model, ...rest } = options;
    return (env.AI as any).run(model, rest);
  },

  async classifyImage(options: { model: string; image: Uint8Array | ArrayBuffer | string; [key: string]: any }) {
    const { env } = getCloudflareContext();
    if (!env.AI) throw new Error("AI binding missing");
    const { model, ...rest } = options;
    return (env.AI as any).run(model, rest);
  }
};
