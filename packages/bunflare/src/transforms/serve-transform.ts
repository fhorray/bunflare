import { parseSync } from "oxc-parser";
import MagicString from "magic-string";

/**
 * Main entry point for bunflare code transformation.
 * Uses OXC (Rust-powered AST parser) and MagicString for surgical replacement.
 */
export function transformSource(source: string, filename: string = "index.tsx"): string {
  const s = new MagicString(source);

  // 1. Parse with OXC (supports TS and JSX)
  // Correct signature: parseSync(filename, source, options)
  const result = parseSync(filename, source, {
    sourceType: filename.endsWith(".tsx") || filename.endsWith(".jsx") ? "module" : "module",
  });

  if (result.errors.length > 0) {
    // If it's a snippet for testing without full TS context, it might still parse or fail.
    // We try to proceed but could log errors.
  }

  const program = result.program;
  const bunflareImports = new Map<string, string>();
  const bunImports = new Map<string, string>();

  // Helper to walk the AST
  function walk(node: any, visitor: (node: any, ancestors: any[]) => void, ancestors: any[] = []) {
    if (!node || typeof node !== "object") return;

    visitor(node, ancestors);

    const nextAncestors = [...ancestors, node];
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => walk(c, visitor, nextAncestors));
      } else if (child && typeof child === "object" && child.type) {
        walk(child, visitor, nextAncestors);
      }
    }
  }

  // 1. First pass: Identify imports and remove bunflare/bun-helper ones
  program.body.forEach((node: any) => {
    if (node.type === "ImportDeclaration") {
      const sourcePath = node.source.value;
      const nSpan = node.span || {};
      const nStart = node.start ?? nSpan.start;
      const nEnd = node.end ?? nSpan.end;

      if (sourcePath === "bunflare") {
        let removedCount = 0;
        node.specifiers.forEach((spec: any, idx: number) => {
          if (spec.type === "ImportSpecifier") {
            const importedName = spec.imported.name || spec.imported.value;
            bunflareImports.set(importedName, spec.local.name);

            if (["durable", "workflow", "container"].includes(importedName)) {
              const sSpan = spec.span || {};
              const sStart = spec.start ?? sSpan.start;
              const sEnd = spec.end ?? sSpan.end;
              if (sStart !== undefined && sEnd !== undefined) {
                // Determine if we should also remove any following/leading commas
                let removeStart = sStart;
                let removeEnd = sEnd;

                // Peek ahead for a comma
                const nextCharIdx = source.slice(sEnd).search(/[,\n}]/);
                if (nextCharIdx !== -1 && source[sEnd + nextCharIdx] === ",") {
                  removeEnd = sEnd + nextCharIdx + 1; // remove including comma
                } else if (idx > 0) {
                  // Peek behind for a comma if we are not the first
                  const prevPart = source.slice(0, sStart);
                  const lastCommaIdx = prevPart.lastIndexOf(",");
                  if (lastCommaIdx !== -1 && !prevPart.slice(lastCommaIdx + 1).trim()) {
                    removeStart = lastCommaIdx;
                  }
                }

                s.remove(removeStart, removeEnd);
                removedCount++;
              }
            }
          }
        });

        if (removedCount === node.specifiers.length) {
          if (nStart !== undefined && nEnd !== undefined) s.remove(nStart, nEnd);
        }
      }
      if (sourcePath === "bun") {
        node.specifiers.forEach((spec: any) => {
          if (spec.type === "ImportSpecifier") {
            const importedName = spec.imported.name || spec.imported.value;
            bunImports.set(importedName, spec.local.name);
            if (importedName === "serve") {
              const sSpan = spec.span || {};
              const sStart = spec.start ?? sSpan.start;
              const sEnd = spec.end ?? sSpan.end;

              if (node.specifiers.length === 1) {
                if (nStart !== undefined && nEnd !== undefined) s.remove(nStart, nEnd);
              } else {
                if (sStart !== undefined && sEnd !== undefined) s.remove(sStart, sEnd);
              }
            }
          }
        });
      }
    }
  });

  // Track all imports to enable lazy loading of routes
  const allImports = new Map<string, { source: string; imported: string }>();
  program.body.forEach((node: any) => {
    if (node.type === "ImportDeclaration" && node.source.value !== "bunflare" && node.source.value !== "bun") {
      node.specifiers.forEach((spec: any) => {
        if (spec.type === "ImportSpecifier") {
          allImports.set(spec.local.name, { source: node.source.value, imported: spec.imported.name || spec.imported.value });
        } else if (spec.type === "ImportDefaultSpecifier") {
          allImports.set(spec.local.name, { source: node.source.value, imported: "default" });
        } else if (spec.type === "ImportNamespaceSpecifier") {
          allImports.set(spec.local.name, { source: node.source.value, imported: "*" });
        }
      });
    }
  });

  // Helper to check if an identifier is shadowed by a local declaration in the current scope chain
  function isShadowed(name: string, ancestors: any[]): boolean {
    // Walk up from most recent ancestor
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const scopeNode = ancestors[i];
      // Blocks, Programs, Functions, etc. can contain declarations
      const declarations = scopeNode.body || (Array.isArray(scopeNode.body) ? scopeNode.body : []) || [];
      if (scopeNode.type === "BlockStatement" || scopeNode.type === "Program" || scopeNode.type === "FunctionDeclaration" || scopeNode.type === "ArrowFunctionExpression") {
        // Simple scan for variable/function declarations in this block
        const body = Array.isArray(scopeNode.body) ? scopeNode.body : (scopeNode.body?.body || []);
        if (body.length > 0) {
          for (const item of body) {
            if (item.type === "VariableDeclaration") {
              if (item.declarations.some((d: any) => d.id.name === name)) return true;
            }
            if (item.type === "FunctionDeclaration") {
              if (item.id?.name === name) return true;
            }
          }
        }
        // Also check function parameters
        if (scopeNode.params?.some((p: any) => p.name === name || p.left?.name === name)) return true;
      }
    }
    return false;
  }

  // 2. Second pass: Transform calls
  let hasWorkflow = false;
  let hasContainer = false;

  walk(program, (node, ancestors) => {
    if (node.type === "CallExpression") {
      let calleeName = "";
      if (node.callee.type === "Identifier") {
        calleeName = node.callee.name;
      } else if (node.callee.type === "MemberExpression" && node.callee.object?.name === "Bun" && (node.callee.property?.name === "serve" || node.callee.property?.value === "serve")) {
        calleeName = "serve";
      }

      const isDurable = calleeName === (bunflareImports.get("durable") || "durable") && !isShadowed(calleeName, ancestors);
      const isWorkflow = calleeName === (bunflareImports.get("workflow") || "workflow") && !isShadowed(calleeName, ancestors);
      const isContainer = calleeName === (bunflareImports.get("container") || "container") && !isShadowed(calleeName, ancestors);

      if (isDurable || isWorkflow || isContainer) {
        if (isWorkflow) hasWorkflow = true;
        if (isContainer) hasContainer = true;

        const variableDeclarator = ancestors.findLast((a: any) => a.type === "VariableDeclarator");
        const variableDeclaration = ancestors.findLast((a: any) => a.type === "VariableDeclaration");
        const exportNamedDeclaration = ancestors.findLast((a: any) => a.type === "ExportNamedDeclaration");

        if (variableDeclarator) {
          const name = variableDeclarator.id.name;
          // OXC spans use .start and .end
          const arg = node.arguments[0];
          const aSpan = arg.span || {};
          const aStart = arg.start ?? aSpan.start;
          const aEnd = arg.end ?? aSpan.end;

          const options = source.slice(aStart, aEnd);
          const isExported = !!exportNamedDeclaration;

          let replacement = "";
          if (isDurable) {
            replacement = `class ${name} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.$$handler = ${options};
  }
  async fetch(request) {
    if (typeof this.$$handler === "function") return this.$$handler(request, this.state, this.env);
    if (this.$$handler.fetch) return this.$$handler.fetch(request, this.state, this.env);
    return new Response("Not Found", { status: 404 });
  }
  // WebSocket 2.0: Bun-native Pub/Sub API for Durable Objects
  $$wrapWS(ws) {
    const self = this;
    return new Proxy(ws, {
      get(target, prop) {
        if (prop === "subscribe") return (topic) => self.state.acceptWebSocket(target, [topic]);
        if (prop === "unsubscribe") return (topic) => { /* Cloudflare auto-manages tags, but we could add manual removal if needed */ };
        if (prop === "publish") return (topic, data) => self.publish(topic, data, target);
        const value = Reflect.get(target, prop);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }
  publish(topic, data, exclude) {
    const sockets = this.state.getWebSockets(topic);
    for (const s of sockets) {
      if (s !== exclude) s.send(data);
    }
  }
  async webSocketMessage(ws, message) {
    if (this.$$handler.webSocketMessage) return await this.$$handler.webSocketMessage.call(this, this.$$wrapWS(ws), message);
  }
  async webSocketClose(ws, code, reason, wasClean) {
    if (this.$$handler.webSocketClose) return await this.$$handler.webSocketClose.call(this, this.$$wrapWS(ws), code, reason, wasClean);
  }
  async webSocketError(ws, error) {
    if (this.$$handler.webSocketError) return await this.$$handler.webSocketError.call(this, this.$$wrapWS(ws), error);
  }
}`;
          } else if (isWorkflow) {
            replacement = `class ${name} extends WorkflowEntrypoint {
  async run(event, step) {
    const $$impl = ${options};
    if (typeof $$impl.run === "function") {
      return await $$impl.run(event, step, this.env);
    }
  }
}`;
          } else if (isContainer) {
            replacement = `class ${name} extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  envVars = {};

  constructor(state, env) {
    super(state, env);
    const $$opts = ${options};
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
}`;
          }

          const targetNode = exportNamedDeclaration || variableDeclaration;
          if (targetNode) {
            const tSpan = targetNode.span || {};
            const tStart = targetNode.start ?? tSpan.start;
            const tEnd = targetNode.end ?? tSpan.end;
            if (targetNode.handled) {
              s.appendRight(tEnd, "\n" + (isExported ? "export " : "") + replacement);
            } else {
              s.overwrite(tStart, tEnd, (isExported ? "export " : "") + replacement);
              targetNode.handled = true;
            }
          }
        }
      }

      // -- Serve --
      const isServe = calleeName === (bunImports.get("serve") || "serve");
      if (isServe) {
        const exportDefaultDeclaration = ancestors.findLast((a: any) => a.type === "ExportDefaultDeclaration");
        const variableDeclarator = ancestors.findLast((a: any) => a.type === "VariableDeclarator");
        const variableDeclaration = ancestors.findLast((a: any) => a.type === "VariableDeclaration");

        const arg = node.arguments[0];
        const aSpan = arg.span || {};
        const aStart = arg.start ?? aSpan.start;
        const aEnd = arg.end ?? aSpan.end;

        let options = source.slice(aStart, aEnd);

        // --- AGGRESSIVE SPLITTING: Wrap route handlers in dynamic imports ---
        if (arg.type === "ObjectExpression") {
          const routesProp = arg.properties.find((p: any) => p.key?.name === "routes" || p.key?.value === "routes");
          if (routesProp && routesProp.value.type === "ObjectExpression") {
            const routesS = new MagicString(options);
            const routesOffset = aStart;

            routesProp.value.properties.forEach((prop: any) => {
              const pSpan = prop.value.span || {};
              const pStart = (prop.value.start ?? pSpan.start) - routesOffset;
              const pEnd = (prop.value.end ?? pSpan.end) - routesOffset;

              if (prop.value.type === "Identifier") {
                const handlerName = prop.value.name;
                const imp = allImports.get(handlerName);
                if (imp && imp.imported !== "*") {
                  routesS.overwrite(pStart, pEnd, `async (req, srv, ctx) => (await import("${imp.source}")).${imp.imported}(req, srv, ctx)`);
                }
              } else if (prop.value.type === "MemberExpression") {
                // Support H.Home where H is a namespace import
                const objectName = prop.value.object?.name;
                const propertyName = prop.value.property?.name || prop.value.property?.value;
                const imp = allImports.get(objectName);
                if (imp && imp.imported === "*") {
                  routesS.overwrite(pStart, pEnd, `async (req, srv, ctx) => (await import("${imp.source}")).${propertyName}(req, srv, ctx)`);
                }
              }
            });
            options = routesS.toString();
          }
        }

        let serverVarName = variableDeclarator?.id?.name || "";

        const replacement = `
const $$options = ${options};
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
      readyState: 1,
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
    const { setBunflareContext } = await import("bunflare");
    setBunflareContext({ 
      env: env || {}, 
      cf: request.cf || {}, 
      ctx: ctx || { waitUntil: () => {}, passThroughOnException: () => {} }
    });
    globalThis.$$upgradeResponse = null;

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
              if (prop === "_rawRequest") return target;
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
            if (methodHandler) result = await methodHandler(requestWithParams, $$server, ctx);
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
};`;

        const targetNode = exportDefaultDeclaration || variableDeclaration || node;
        const tSpan = targetNode.span || {};
        const tStart = targetNode.start ?? tSpan.start;
        const tEnd = targetNode.end ?? tSpan.end;
        if (tStart !== undefined && tEnd !== undefined) {
          s.overwrite(tStart, tEnd, replacement);
        }
      }
    }
  });

  // Prefixes
  let prefix = "";
  if (!source.includes("setBunflareContext")) {
    prefix += `globalThis.__BUNFLARE_RUNTIME__ = true;\nimport { setBunflareContext } from "bunflare";\n`;
  }
  if (hasWorkflow && !source.includes("WorkflowEntrypoint")) {
    prefix += `import { WorkflowEntrypoint } from "cloudflare:workers";\n`;
  }
  if (hasContainer && !source.includes("Container")) {
    prefix += `import { Container } from "@cloudflare/containers";\n`;
  }

  return prefix + s.toString();
}

// Compatibility exports
export function transformDurables(source: string) { return transformSource(source); }
export function transformWorkflows(source: string) { return transformSource(source); }
export function transformContainers(source: string) { return transformSource(source); }
export function transformServe(source: string) { return transformSource(source); }
