import { readFileSync } from "fs";
import { join } from "path";

/**
 * Generates the Cloudflare Workers shim for bun:kv and Bun.redis().
 * It reads the actual implementation from logic.ts and injects the binding name.
 */
export function getKvShim(bindingName: string): string {
  // Logic is now in the same folder as logic.ts
  const logicPath = join(__dirname, "logic.ts");
  
  try {
    let content = readFileSync(logicPath, "utf-8");
    
    // Replace the default fallbacks with the actual binding name discovered
    content = content.replace(/binding \|\| "KV"/g, `binding || "${bindingName}"`);
    content = content.replace(/name \|\| "KV"/g, `name || "${bindingName}"`);

    const interfaceDef = `
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
}
`;
    
    return interfaceDef + "\n" + content;
  } catch (err) {
    console.error(`[bunflare] Failed to read logic.ts at ${logicPath}. Error: ${err}`);
    throw err;
  }
}
