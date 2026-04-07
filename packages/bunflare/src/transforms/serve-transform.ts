import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
import { workerTemplate } from "../runtime/worker-template";

/**
 * Main entry point for bunflare code transformation.
 * Uses OXC (Rust-powered AST parser) and MagicString for surgical replacement.
 */
export function transformSource(source: string, filename: string = "index.tsx"): string {
  const s = new MagicString(source);

  const result = parseSync(filename, source, {
    sourceType: filename.endsWith(".tsx") || filename.endsWith(".jsx") ? "module" : "module",
  });

  if (result.errors.length > 0) {
    // Proceed with caution
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

  // 1. First pass: Identify imports
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

            if (["durable", "workflow", "container", "browser", "queue", "cron"].includes(importedName)) {
              const sSpan = spec.span || {};
              const sStart = spec.start ?? sSpan.start;
              const sEnd = spec.end ?? sSpan.end;
              if (sStart !== undefined && sEnd !== undefined) {
                let removeStart = sStart;
                let removeEnd = sEnd;
                const nextCharIdx = source.slice(sEnd).search(/[,\n}]/);
                if (nextCharIdx !== -1 && source[sEnd + nextCharIdx] === ",") {
                  removeEnd = sEnd + nextCharIdx + 1;
                } else if (idx > 0) {
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

  function isShadowed(name: string, ancestors: any[]): boolean {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const scopeNode = ancestors[i];
      if (scopeNode.type === "BlockStatement" || scopeNode.type === "Program" || scopeNode.type === "FunctionDeclaration" || scopeNode.type === "ArrowFunctionExpression") {
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
        if (scopeNode.params?.some((p: any) => p.name === name || p.left?.name === name)) return true;
      }
    }
    return false;
  }

  let hasWorkflow = false;
  let hasContainer = false;
  const queueConsumers: { name: string; options: string }[] = [];
  const scheduledTasks: { name: string; schedule: string; options: string }[] = [];

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
      const isBrowser = calleeName === (bunflareImports.get("browser") || "browser") && !isShadowed(calleeName, ancestors);
      const isQueue = calleeName === (bunflareImports.get("queue") || "queue") && !isShadowed(calleeName, ancestors);
      const isCron = calleeName === (bunflareImports.get("cron") || "cron") && !isShadowed(calleeName, ancestors);

      if (isDurable || isWorkflow || isContainer || isBrowser || isQueue || isCron) {
        if (isWorkflow) hasWorkflow = true;
        if (isContainer) hasContainer = true;

        const variableDeclarator = ancestors.findLast((a: any) => a.type === "VariableDeclarator");
        const variableDeclaration = ancestors.findLast((a: any) => a.type === "VariableDeclaration");
        const exportNamedDeclaration = ancestors.findLast((a: any) => a.type === "ExportNamedDeclaration");

        if (variableDeclarator) {
          const name = variableDeclarator.id.name;
          const arg = node.arguments[0];
          const aSpan = arg.span || {};
          const aStart = arg.start ?? aSpan.start;
          const aEnd = arg.end ?? aSpan.end;
          const options = source.slice(aStart, aEnd);
          const isExported = !!exportNamedDeclaration;
          let replacement = "";

          if (isQueue) {
            queueConsumers.push({ name, options });
            replacement = `const ${name} = ${options};`;
          } else if (isCron) {
            let schedule = "";
            if (arg.type === "ObjectExpression") {
              const schedProp = arg.properties.find((p: any) => p.key?.name === "schedule" || p.key?.value === "schedule");
              if (schedProp && schedProp.value.type === "Literal") {
                schedule = schedProp.value.value;
              }
            }
            scheduledTasks.push({ name, schedule, options });
            replacement = `const ${name} = ${options};`;
          } else if (isDurable) {
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
  $$wrapWS(ws) {
    const self = this;
    return new Proxy(ws, {
      get(target, prop) {
        if (prop === "subscribe") return (topic) => self.state.acceptWebSocket(target, [topic]);
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
    if (typeof this.$$impl?.onStart === "function") return await this.$$impl.onStart.call(this);
  }
  async onStop() {
    if (typeof this.$$impl?.onStop === "function") return await this.$$impl.onStop.call(this);
  }
  async onError(error) {
    if (typeof this.$$impl?.onError === "function") return await this.$$impl.onError.call(this, error);
  }
}`;
          } else if (isBrowser) {
            replacement = `class ${name} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.$$impl = ${options};
  }
  async fetch(request) {
    let puppeteer;
    try {
      // Use dynamic import to avoid bundling issues if not used
      const mod = await import("@cloudflare/puppeteer");
      puppeteer = mod.default || mod;
    } catch (e) {
      console.error("[Bunflare Browser] Failed to load @cloudflare/puppeteer:", e);
      return new Response("Missing @cloudflare/puppeteer dependency.", { status: 500 });
    }

    if (!this.env.BROWSER) {
      return new Response("Browser Rendering binding (BROWSER) not found.", { status: 500 });
    }

    try {
      const browser = await puppeteer.launch(this.env.BROWSER);
      const page = await browser.newPage();
      try {
        if (typeof this.$$impl.run === "function") {
          const result = await this.$$impl.run(page, request, this.env);
          // Auto-convert non-response returns
          if (result instanceof Response) return result;
          return new Response(result);
        }
        return new Response("Browser 'run' handler not found.", { status: 404 });
      } catch (e) {
        console.error("[Bunflare Browser] Execution error:", e);
        return new Response("Browser Execution Error: " + e.message, { status: 500 });
      } finally {
        await browser.close().catch(() => {});
      }
    } catch (e) {
      console.error("[Bunflare Browser] Launch error:", e);
      return new Response("Puppeteer Launch Error: " + e.message, { status: 500 });
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
              if (tStart !== undefined && tEnd !== undefined) {
                s.overwrite(tStart, tEnd, (isExported ? "export " : "") + replacement);
                (targetNode as any).handled = true;
              }
            }
          }
        }
      }

      // Serve transformation
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

        let handlerAdditions = "";
        if (queueConsumers.length > 0) {
          handlerAdditions += `
  async queue(batch, env, ctx) {
    switch (batch.queue) {
      ${queueConsumers.map(q => `case "${q.name.toUpperCase()}":
        if (typeof ${q.name}.process === "function") return await ${q.name}.process(batch.messages, env);
        break;`).join("\n      ")}
    }
  },`;
        }

        if (scheduledTasks.length > 0) {
          handlerAdditions += `
  async scheduled(event, env, ctx) {
    ${scheduledTasks.map(t => `if (event.cron === "${t.schedule}") {
      if (typeof ${t.name}.run === "function") return await ${t.name}.run(event, env);
    }`).join("\n    ")}
  },`;
        }

        const serverVarDecl = serverVarName ? `const ${serverVarName} = { 
  ...$$server,
  url: new URL("http://localhost"), 
  port: $$options.port || 3000, 
  hostname: $$options.hostname || "localhost",
  stop: () => {} 
};` : "";

        const replacement = workerTemplate
          .replace("__OPTIONS__", () => options)
          .replace("__SERVER_VAR__", () => serverVarDecl)
          .replace("__HANDLER_ADDITIONS__", () => handlerAdditions);

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

  let prefix = "";
  if (!source.includes("setBunflareContext")) {
    prefix += `globalThis.__BUNFLARE_RUNTIME__ = true;\nimport { setBunflareContext } from "bunflare";\n`;
  }
  if (hasWorkflow) {
    const hasImport = source.match(/import\s+{[^}]*WorkflowEntrypoint[^}]*}\s+from\s+["']cloudflare:workers["']/);
    if (!hasImport) prefix += `import { WorkflowEntrypoint } from "cloudflare:workers";\n`;
  }
  if (hasContainer) {
    const hasImport = source.match(/import\s+{[^}]*Container[^}]*}\s+from\s+["']@cloudflare\/containers["']/);
    if (!hasImport) prefix += `import { Container } from "@cloudflare/containers";\n`;
  }

  return prefix + s.toString();
}

export function transformDurables(source: string) { return transformSource(source); }
export function transformWorkflows(source: string) { return transformSource(source); }
export function transformContainers(source: string) { return transformSource(source); }
export function transformServe(source: string) { return transformSource(source); }
