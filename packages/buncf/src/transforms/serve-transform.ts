import { setBuncfContext } from "../runtime/context";

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
  if (!source.includes("serve")) {
    return source;
  }

  let transformed = source;

  // 1. Remove "import { ... serve ... } from 'bun'"
  // This is critical when target is "browser" (Cloudflare) because "bun" cannot be imported.
  transformed = transformed.replace(/import\s+\{[^}]*\bserve\b[^}]*\}\s+from\s+['"]bun['"];?/g, "");

  if (!transformed.includes('import { setBuncfContext } from "buncf"')) {
    transformed = `import { setBuncfContext } from "buncf";\n` + transformed;
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

    // Check if this serve call is part of an assignment or export:
    // "const server = serve(" or "export default serve("
    const beforeMatch = transformed.slice(0, matchIndex);
    const assignmentMatch = beforeMatch.match(/(?:(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=|export\s+default)\s*$/);

    let startIndex = matchIndex;
    if (assignmentMatch) {
      startIndex = matchIndex - assignmentMatch[0].length;
    }

    const openParenIndex = matchedText.length + matchIndex - 1;
    const closingParenIndex = findBalancedParen(transformed, openParenIndex);

    if (closingParenIndex === -1) continue;

    const options = transformed.slice(openParenIndex + 1, closingParenIndex);

    let serverVarName = "";
    if (assignmentMatch && assignmentMatch[1]) {
      serverVarName = assignmentMatch[1]; // Get the variable name if it was "const name = ..."
    }

    const replacement = `
const $$options = ${options.trim()};
const $$sortedRoutes = $$options.routes ? Object.entries($$options.routes).sort(([a], [b]) => {
  const aIsWild = a.includes("*");
  const bIsWild = b.includes("*");
  if (aIsWild && !bIsWild) return 1;
  if (!aIsWild && bIsWild) return -1;
  return b.length - a.length;
}) : [];

const $$worker = {
  async fetch(request, env, ctx) {
    const { setBuncfContext } = await import("buncf");
    
    setBuncfContext({ 
      env: env || {}, 
      cf: request.cf || {}, 
      ctx: ctx || { waitUntil: () => {}, passThroughOnException: () => {} }
    });

    // 1. Try to serve from ASSETS binding if it exists
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetResponse = await env.ASSETS.fetch(request.clone());
      if (assetResponse.status !== 404) return assetResponse;
    }

    if ($$sortedRoutes.length > 0) {
      const url = new URL(request.url);
      const pathWithSlash = url.pathname;
      const path = pathWithSlash === "/" ? "/" : (pathWithSlash.endsWith("/") ? pathWithSlash.slice(0, -1) : pathWithSlash);

      for (const [route, handler] of $$sortedRoutes) {
        const isMatch = route === path || (route.endsWith("*") && path.startsWith(route.slice(0, -1)));
        
        if (isMatch) {
          if (handler instanceof Response || typeof handler === "string") {
            return typeof handler === "string" ? new Response(handler, { headers: { "Content-Type": "text/html" } }) : handler;
          }
          
          if (typeof handler === "object") {
            const method = request.method.toUpperCase();
            const methodHandler = (handler as any)[method];
            if (methodHandler) {
              return methodHandler(request, env, ctx);
            }
          }
          
          if (typeof handler === "function") {
            return handler(request, env, ctx);
          }
        }
      }
    }

    if ($$options.fetch) {
      return $$options.fetch(request, env, ctx);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};

// Exporting the full options as default allows Bun to start the server automatically
// with all original settings (port, etc.) while also working as a Cloudflare Worker.
${serverVarName ? `const ${serverVarName} = { 
  url: new URL("http://localhost"), 
  port: $$options.port || 3000, 
  hostname: $$options.hostname || "localhost",
  stop: () => {} 
};` : ""}

export default {
  ...$$options,
  fetch: $$worker.fetch
};
`;

    // Replace the call and optional trailing semicolon
    let endIndex = closingParenIndex + 1;
    if (transformed[endIndex] === ";") endIndex++;

    transformed = transformed.slice(0, startIndex) + replacement + transformed.slice(endIndex);
  }

  return transformed;
}
