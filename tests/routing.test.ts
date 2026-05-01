import { expect, test, describe } from "bun:test";
import { getServeShim } from "../plugin/src/shims/serve.ts";

describe("Routing Shim", () => {
  test("getServeShim generates routing logic", () => {
    const shim = getServeShim();

    // Check for core routing elements
    expect(shim).toContain("const { routes, fetch: fallbackFetch, development } = options;");
    expect(shim).toContain("const normalizedReqPath = url.pathname === \"/\" ? \"/\" : url.pathname.replace(/\\/$/, \"\");");
    expect(shim).toContain("if (pathParts[i].startsWith(\":\")) {");
    expect(shim).toContain("response = await handler(request, server)");
  });

  test("serve shim handles 404 when no route or fetch is provided", () => {
    // This is more of a smoke test to ensure the shim template is valid JS
    // We don't execute it here because it requires a global 'setEnv' and Worker env
    const shim = getServeShim();
    expect(shim).toContain("new Response(\"Not Found\", { status: 404 })");
  });
});
