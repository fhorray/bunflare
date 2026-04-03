import { setBunCloudflareContext } from "bun-cloudflare";

/**
 * Finds the matching closing parenthesis for a Bun.serve( or serve( call.
 * This is more robust than a regex for nested structures.
 */
function findBalancedParen(source: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === "(") depth++;
    if (source[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Transforms Bun.serve() calls to Cloudflare Worker export default { fetch }.
 */
export function transformServe(source: string): string {
  if (!source.includes("Bun.serve")) {
    return source;
  }

  let transformed = source;

  if (!transformed.includes('import { setBunCloudflareContext } from "bun-cloudflare"')) {
    transformed = `import { setBunCloudflareContext } from "bun-cloudflare";\n` + transformed;
  }

  // Find all Bun.serve or serve calls
  const matches = [...transformed.matchAll(/\b(?:Bun\.)?serve\s*\(/g)];

  // We process from bottom to top to avoid index shifts
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const matchIndex = match?.index;
    if (matchIndex === undefined || matchIndex === null) continue;

    const matchedText = match?.[0];
    if (!matchedText) continue;

    const openParenIndex = matchedText.length + matchIndex - 1;
    const closingParenIndex = findBalancedParen(transformed, openParenIndex);

    if (closingParenIndex === -1) continue;

    const options = transformed.slice(openParenIndex + 1, closingParenIndex);

    const replacement = `
export default {
  async fetch(request, env, ctx) {
    setBunCloudflareContext({ env, cf: request.cf, ctx });
    const config = ${options.trim()};
    
    // Handle Bun v1.2.3+ 'routes' API
    if (config.routes) {
      const url = new URL(request.url);
      const pathWithSlash = url.pathname;
      const path = pathWithSlash === "/" ? "/" : (pathWithSlash.endsWith("/") ? pathWithSlash.slice(0, -1) : pathWithSlash);
      
      for (const [route, handler] of Object.entries(config.routes)) {
        const isMatch = route === path || (route.endsWith("*") && path.startsWith(route.slice(0, -1)));
        
        if (isMatch) {
          if (handler instanceof Response || typeof handler === "string") {
            return typeof handler === "string" ? new Response(handler, { headers: { "Content-Type": "text/html" } }) : handler;
          }
          
          if (typeof handler === "object") {
            const method = request.method.toUpperCase();
            const methodHandler = (handler as any)[method];
            if (methodHandler) {
              return methodHandler(request);
            }
          }
          
          if (typeof handler === "function") {
            return handler(request);
          }
        }
      }
    }

    if (config.fetch) {
      return config.fetch(request);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};`;

    // Replace the call and optional trailing semicolon
    let endIndex = closingParenIndex + 1;
    if (transformed[endIndex] === ";") endIndex++;

    transformed = transformed.slice(0, matchIndex) + replacement + transformed.slice(endIndex);
  }

  return transformed;
}
