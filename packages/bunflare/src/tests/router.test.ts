import { describe, expect, it } from "bun:test";
import { transformServe } from "../transforms/serve-transform";
import "urlpattern-polyfill";

// Helper to evaluate the transformed code and get the fetch function
async function getFetchFromSource(source: string) {
  const transformed = transformServe(source);

  // Replace imports and export with eval-compatible equivalents
  // Using __testWorker instead of $$testWorker to avoid regex $ escaping issues
  const codeToEval = transformed
    .replace(/import\s+\{[^}]*\}\s+from\s+["']bunflare["'];?/g, "const setBunflareContext = () => {};")
    .replace(/await import\(["']bunflare["']\)/g, "({ setBunflareContext: () => {} })")
    .replace(/export\s+default/g, "globalThis.__testWorker =");

  try {
    // Remove TS-specific type cast before evaluation
    const cleanCode = codeToEval.replace(/\(globalThis as any\)/g, "globalThis");
    (0, eval)(cleanCode);
  } catch (e) {
    console.error("Error evaluating transformed code:", e);
    console.error("Transformed code was:", codeToEval);
    throw e;
  }

  const worker = (globalThis as any).__testWorker;
  if (!worker || !worker.fetch) {
    console.error("Worker or fetch function not found in globalThis.__testWorker");
    throw new Error("Worker not found");
  }

  return worker.fetch;
}

describe("Router System (URLPattern)", () => {
  it("should handle exact matches", async () => {
    const source = `
      serve({
        routes: {
          "/": "index",
          "/about": new Response("about")
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res1 = await fetch(new Request("http://localhost/"));
    expect(await res1.text()).toBe("index");

    const res2 = await fetch(new Request("http://localhost/about"));
    expect(await res2.text()).toBe("about");
  });

  it("should handle dynamic parameters (/:id)", async () => {
    const source = `
      serve({
        routes: {
          "/users/:id": (req) => Response.json({ id: req.params.id })
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/users/123"));
    const data = await res.json();
    expect(data.id).toBe("123");
  });

  it("should handle multiple parameters", async () => {
    const source = `
      serve({
        routes: {
          "/users/:userId/posts/:postId": (req) => Response.json(req.params)
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/users/alice/posts/456"));
    const data = await res.json();
    expect(data.userId).toBe("alice");
    expect(data.postId).toBe("456");
  });

  it("should handle wildcards (*)", async () => {
    const source = `
      serve({
        routes: {
          "/static/*": (req) => new Response(req.params.any)
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/static/css/main.css"));
    expect(await res.text()).toBe("css/main.css");
  });

  it("should respect priority (literal > dynamic > wildcard)", async () => {
    const source = `
      serve({
        routes: {
          "/*": () => new Response("wildcard"),
          "/users/:id": () => new Response("dynamic"),
          "/users/me": () => new Response("literal")
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    // Exact match "me" should match literal even if dynamic also matches
    const res1 = await fetch(new Request("http://localhost/users/me"));
    expect(await res1.text()).toBe("literal");

    // Other users should match dynamic
    const res2 = await fetch(new Request("http://localhost/users/bob"));
    expect(await res2.text()).toBe("dynamic");

    // Other paths should match wildcard
    const res3 = await fetch(new Request("http://localhost/something/else"));
    expect(await res3.text()).toBe("wildcard");
  });

  it("should respect priority by length for same category", async () => {
    const source = `
      serve({
        routes: {
          "/api/*": () => new Response("api prefix"),
          "/api/v1/*": () => new Response("api v1 prefix")
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/api/v1/status"));
    expect(await res.text()).toBe("api v1 prefix");
  });

  it("should handle method matching in object handlers with params", async () => {
    const source = `
      serve({
        routes: {
          "/api/data/:key": {
            GET: (req) => new Response("GET " + req.params.key),
            POST: (req) => new Response("POST " + req.params.key)
          }
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res1 = await fetch(new Request("http://localhost/api/data/foo", { method: "GET" }));
    expect(await res1.text()).toBe("GET foo");

    const res2 = await fetch(new Request("http://localhost/api/data/bar", { method: "POST" }));
    expect(await res2.text()).toBe("POST bar");
  });

  it("should return 404 if no route or fetch handler matches", async () => {
    const source = `
      serve({
        routes: {
          "/api": () => new Response("ok")
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/notfound"));
    expect(res.status).toBe(404);
  });

  it("should fallback to global fetch handler if routes don't match", async () => {
    const source = `
      serve({
        routes: {
          "/api": () => new Response("api")
        },
        fetch(req) {
          return new Response("fallback");
        }
      });
    `;
    const fetch = await getFetchFromSource(source);

    const res = await fetch(new Request("http://localhost/other"));
    expect(await res.text()).toBe("fallback");
  });
});
