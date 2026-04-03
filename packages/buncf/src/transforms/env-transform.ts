/**
 * Transforms Bun.env and process.env calls to use the Cloudflare context.
 */
export function transformEnv(source: string): string {
  if (!source.includes("Bun.env") && !source.includes("process.env")) {
    return source;
  }

  const ctxCall = 'getCloudflareContext()';
  let transformed = source;
  
  if (!transformed.includes(ctxCall)) {
    transformed = `import { getCloudflareContext } from "buncf";\n` + transformed;
  }

  // Regex to match (Bun.env|process.env).VARIABLE
  // We use a negative lookahead to exclude NODE_ENV
  transformed = transformed.replace(/(Bun\.env|process\.env)\.(?!NODE_ENV)([a-zA-Z0-9_]+)/g, `${ctxCall}.env.$2`);
  transformed = transformed.replace(/(Bun\.env|process\.env)\[['"](?!NODE_ENV)([a-zA-Z0-9_]+)['"]\]/g, `${ctxCall}.env["$2"]`);

  return transformed;
}
