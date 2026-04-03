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
  // EXCEPT for NODE_ENV which we want to keep for bundler define/DCE
  
  const ctxCall = 'getBunCloudflareContext()';
  
  if (!transformed.includes(ctxCall)) {
    transformed = `import { getBunCloudflareContext } from "bun-cloudflare";\n` + transformed;
  }

  // Regex to match (Bun.env|process.env).VARIABLE
  // We use a negative lookahead to exclude NODE_ENV
  transformed = transformed.replace(/(Bun\.env|process\.env)\.(?!NODE_ENV)([a-zA-Z0-9_]+)/g, `${ctxCall}.env.$2`);
  transformed = transformed.replace(/(Bun\.env|process\.env)\[['"](?!NODE_ENV)([a-zA-Z0-9_]+)['"]\]/g, `${ctxCall}.env["$2"]`);

  return transformed;
}
