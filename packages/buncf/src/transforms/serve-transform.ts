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
 * Transforms durable({ ... }) calls into Cloudflare Durable Object classes.
 */
export function transformDurables(source: string): string {
  if (!source.includes("durable")) {
    return source;
  }

  let transformed = source;

  // 1. Remove ONLY 'durable' from the buncf import list, preserving others
  transformed = transformed.replace(/import\s+\{([^}]*)\bdurable\b([^}]*)\}\s+from\s+['"]buncf['"];?/g, (match, before, after) => {
    const combined = (before + after).trim();
    if (!combined || combined === ",") return "";
    // Clean up commas: ", ," -> ", " and remove leading/trailing commas
    const cleaned = combined
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    if (!cleaned) return "";
    return `import { ${cleaned} } from "buncf";`;
  });

  // Find all [export] const Name = durable(
  // Use a broad match and refined with balanced paren finding
  const matches = [...transformed.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*durable\s*\(/g)];

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (!match || match.index === undefined) continue;

    const matchIndex = match.index;
    const fullMatch = match[0];
    const name = match[1];
    const isExported = fullMatch.startsWith("export");

    const openParenIndex = matchIndex + fullMatch.length - 1;
    const closingParenIndex = findBalancedParen(transformed, openParenIndex);

    if (closingParenIndex === -1) continue;

    const options = transformed.slice(openParenIndex + 1, closingParenIndex);

    const replacement = `
${isExported ? "export " : ""}class ${name} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const $$handler = ${options.trim()};
    if (typeof $$handler === "function") return $$handler(request, this.state, this.env);
    if ($$handler.fetch) return $$handler.fetch(request, this.state, this.env);
    return new Response("Not Found", { status: 404 });
  }
}
`;
    // Replace the call and optional trailing semicolon
    let endIndex = closingParenIndex + 1;
    if (transformed[endIndex] === ";") endIndex++;

    transformed = transformed.slice(0, matchIndex) + replacement + transformed.slice(endIndex);
  }

  return transformed;
}

/**
 * Transforms workflow({ ... }) calls into Cloudflare Workflow classes.
 */
export function transformWorkflows(source: string): string {
  if (!source.includes("workflow")) {
    return source;
  }

  let transformed = source;

  // 1. Remove ONLY 'workflow' from the buncf import list, preserving others
  transformed = transformed.replace(/import\s+\{([^}]*)\bworkflow\b([^}]*)\}\s+from\s+['"]buncf['"];?/g, (match, before, after) => {
    const combined = (before + after).trim();
    if (!combined || combined === ",") return "";
    const cleaned = combined
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    if (!cleaned) return "";
    return `import { ${cleaned} } from "buncf";`;
  });

  // 2. Inject WorkflowEntrypoint import if workflows are used
  if (transformed.match(/\bworkflow\s*\(/) && !transformed.includes('from "cloudflare:workers"')) {
    transformed = `import { WorkflowEntrypoint } from "cloudflare:workers";\n` + transformed;
  }

  // Find all [export] const Name = workflow(
  const matches = [...transformed.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*workflow\s*\(/g)];

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (!match || match.index === undefined) continue;

    const matchIndex = match.index;
    const fullMatch = match[0];
    const name = match[1];
    const isExported = fullMatch.startsWith("export");

    const openParenIndex = matchIndex + fullMatch.length - 1;
    const closingParenIndex = findBalancedParen(transformed, openParenIndex);

    if (closingParenIndex === -1) continue;

    const options = transformed.slice(openParenIndex + 1, closingParenIndex);

    const replacement = `
${isExported ? "export " : ""}class ${name} extends WorkflowEntrypoint {
  async run(event, step) {
    const $$impl = ${options.trim()};
    if (typeof $$impl.run === "function") {
      return await $$impl.run(event, step, this.env);
    }
  }
}
`;
    let endIndex = closingParenIndex + 1;
    if (transformed[endIndex] === ";") endIndex++;

    transformed = transformed.slice(0, matchIndex) + replacement + transformed.slice(endIndex);
  }

  return transformed;
}

/**
 * Transforms container({ ... }) calls into Cloudflare Container classes.
 */
export function transformContainers(source: string): string {
  if (!source.includes("container")) {
    return source;
  }

  let transformed = source;

  // 1. Remove ONLY 'container' from the buncf import list, preserving others
  transformed = transformed.replace(/import\s+\{([^}]*)\bcontainer\b([^}]*)\}\s+from\s+['"]buncf['"];?/g, (match, before, after) => {
    const combined = (before + after).trim();
    if (!combined || combined === ",") return "";
    const cleaned = combined
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    if (!cleaned) return "";
    return `import { ${cleaned} } from "buncf";`;
  });

  // 2. Inject Container import if containers are used
  if (transformed.match(/\bcontainer\s*\(/) && !transformed.includes('from "@cloudflare/containers"')) {
    transformed = `import { Container } from "@cloudflare/containers";\n` + transformed;
  }

  // Find all [export] const Name = container(
  const matches = [...transformed.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*container\s*\(/g)];

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (!match || match.index === undefined) continue;

    const matchIndex = match.index;
    const fullMatch = match[0];
    const name = match[1];
    const isExported = fullMatch.startsWith("export");

    const openParenIndex = matchIndex + fullMatch.length - 1;
    const closingParenIndex = findBalancedParen(transformed, openParenIndex);

    if (closingParenIndex === -1) continue;

    const options = transformed.slice(openParenIndex + 1, closingParenIndex);

    const replacement = `
${isExported ? "export " : ""}class ${name} extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  envVars = {};

  constructor(state, env) {
    super(state, env);
    const $$opts = ${options.trim()};
    this.$$impl = $$opts;
    if ($$opts.defaultPort) this.defaultPort = $$opts.defaultPort;
    if ($$opts.sleepAfter) this.sleepAfter = $$opts.sleepAfter;
    if ($$opts.envVars) this.envVars = $$opts.envVars;
  }

  async onStart() {
    if (typeof this.$$impl?.onStart === "function") {
      return await this.$$impl.onStart.call(this);
    }
  }

  async onStop() {
    if (typeof this.$$impl?.onStop === "function") {
      return await this.$$impl.onStop.call(this);
    }
  }

  async onError(error) {
    if (typeof this.$$impl?.onError === "function") {
      return await this.$$impl.onError.call(this, error);
    }
  }
}
`;
    let endIndex = closingParenIndex + 1;
    if (transformed[endIndex] === ";") endIndex++;

    transformed = transformed.slice(0, matchIndex) + replacement + transformed.slice(endIndex);
  }

  return transformed;
}

/**
 * Transforms Bun.serve() calls to Cloudflare Worker export default { fetch }.
 */
export function transformServe(source: string): string {
  // First, apply transformations
  let transformed = transformDurables(source);
  transformed = transformWorkflows(transformed);
  transformed = transformContainers(transformed);

  if (!transformed.includes("serve")) {
    return transformed;
  }

  // 1. Remove ONLY 'serve' from the bun import list, preserving others
  transformed = transformed.replace(/import\s+\{([^}]*)\bserve\b([^}]*)\}\s+from\s+['"]bun['"];?/g, (match, before, after) => {
    const combined = (before + after).trim();
    if (!combined || combined === ",") return "";
    // Clean up commas: ", ," -> ", " and remove leading/trailing commas
    const cleaned = combined
      .replace(/,\s*,/g, ",")
      .replace(/^,|,$/g, "")
      .trim();
    if (!cleaned) return "";
    return `import { ${cleaned} } from "bun";`;
  });

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
const $$routes = $$options.routes ? Object.entries($$options.routes).sort(([a], [b]) => {
  const getScore = (s) => {
    if (s.includes("*")) return 1;
    if (s.includes(":")) return 2;
    return 3;
  };
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreB - scoreA;
  return b.length - a.length;
}).map(([path, handler]) => {
  // Convert Bun-style wildcard (*) to URLPattern-style (:any*)
  const patternPath = path.replace(/\\*$/, ":any*");
  return {
    pattern: new URLPattern({ pathname: patternPath }),
    handler
  };
}) : [];

const $$topics = new Map();

const $$server = {
  upgrade(req, options = {}) {
    if (typeof WebSocketPair === "undefined") return false;
    const [client, server] = new WebSocketPair();
    const ws = {
      data: options.data || {},
      readyState: 1, // Open
      send: (msg) => server.send(msg),
      close: (code, reason) => server.close(code, reason),
      subscribe: (topic) => {
        if (!$$topics.has(topic)) $$topics.set(topic, new Set());
        $$topics.get(topic).add(server);
      },
      unsubscribe: (topic) => {
        for (const subs of $$topics.values()) subs.delete(server);
      },
      publish: (topic, data) => {
        const subs = $$topics.get(topic);
        if (subs) {
          for (const s of subs) {
            if (s !== server) s.send(data);
          }
        }
      }
    };

    server.accept();
    if ($$options.websocket?.open) $$options.websocket.open(ws);
    
    server.addEventListener("message", (e) => {
      if ($$options.websocket?.message) $$options.websocket.message(ws, e.data);
    });
    
    server.addEventListener("close", (e) => {
      for (const subs of $$topics.values()) subs.delete(server);
      if ($$options.websocket?.close) $$options.websocket.close(ws, e.code, e.reason);
    });

    server.addEventListener("error", (e) => {
      if ($$options.websocket?.error) $$options.websocket.error(ws, e.error || e);
    });

    globalThis.$$upgradeResponse = new Response(null, {
      status: 101,
      webSocket: client,
      headers: options.headers
    });
    return true;
  },
  publish: (topic, data) => {
    const subs = $$topics.get(topic);
    if (subs) {
      for (const s of subs) s.send(data);
    }
  }
};

const $$worker = {
  async fetch(request, env, ctx) {
    const { setBuncfContext } = await import("buncf");
    
    setBuncfContext({ 
      env: env || {}, 
      cf: request.cf || {}, 
      ctx: ctx || { waitUntil: () => {}, passThroughOnException: () => {} }
    });

    globalThis.$$upgradeResponse = null;

    // 1. Try to serve from ASSETS binding if it exists
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetResponse = await env.ASSETS.fetch(request.clone());
      if (assetResponse.status !== 404) return assetResponse;
    }

    if ($$routes.length > 0) {
      const url = new URL(request.url);

      for (const { pattern, handler } of $$routes) {
        const match = pattern.exec(url);
        
        if (match) {
          const params = match.pathname.groups;
          const requestWithParams = new Proxy(request, {
            get(target, prop) {
              if (prop === "params") return params;
              const value = Reflect.get(target, prop);
              return typeof value === "function" ? value.bind(target) : value;
            }
          });

          let result;
          if (handler instanceof Response || typeof handler === "string") {
            result = typeof handler === "string" ? new Response(handler, { headers: { "Content-Type": "text/html" } }) : handler;
          } else if (typeof handler === "object") {
            const method = request.method.toUpperCase();
            const methodHandler = handler[method];
            if (methodHandler) {
              result = await methodHandler(requestWithParams, $$server, ctx);
            }
          } else if (typeof handler === "function") {
            result = await handler(requestWithParams, $$server, ctx);
          }

          if (globalThis.$$upgradeResponse) return globalThis.$$upgradeResponse;
          if (result) return result;
        }
      }
    }

    if ($$options.fetch) {
      const result = await $$options.fetch(request, $$server, ctx);
      if (globalThis.$$upgradeResponse) return globalThis.$$upgradeResponse;
      if (result) return result;
    }
    
    return new Response("Not Found", { status: 404 });
  }
};

// Exporting the full options as default allows Bun to start the server automatically
// with all original settings (port, etc.) while also working as a Cloudflare Worker.
${serverVarName ? `const ${serverVarName} = { 
  ...$$server,
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
