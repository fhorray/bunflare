/**
 * Transforms Bun.env and process.env calls to use the Cloudflare context.
 */
export function transformEnv(source: string): string {
  if (!source.includes("Bun.env") && !source.includes("process.env")) {
    return source;
  }

  let transformed = source;
  
  // Replace Bun.env.VAR with getBunCloudflareContext().env.VAR
  // Replace process.env.VAR with getBunCloudflareContext().env.VAR
  
  if (!transformed.includes("getBunCloudflareContext")) {
    transformed = `import { getBunCloudflareContext } from "bun-cloudflare";\n` + transformed;
  }

  // Regex to match Bun.env.VARIABLE or process.env.VARIABLE
  // Match both property access and bracket access
  transformed = transformed.replace(/(Bun\.env|process\.env)\.([a-zA-Z0-9_]+)/g, 'getBunCloudflareContext().env.$2');
  transformed = transformed.replace(/(Bun\.env|process\.env)\[['"]([a-zA-Z0-9_]+)['"]\]/g, 'getBunCloudflareContext().env["$2"]');

  return transformed;
}
