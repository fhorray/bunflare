import { expect, test, describe } from "bun:test";
import { bunflare } from "../plugin/src/index.ts";

describe("bunflare plugin unit tests", () => {
  test("plugin should have a name", () => {
    const plugin = bunflare();
    expect(plugin.name).toBe("bunflare");
  });

  test("plugin setup should be a function", () => {
    const plugin = bunflare();
    expect(typeof plugin.setup).toBe("function");
  });

  // We can't easily test the internal registry without exposing it
  // but we can verify the plugin factory doesn't crash with various options.
  test("should initialize with full options", () => {
    const plugin = bunflare({
      sqlite: { binding: "DB" },
      kv: { binding: "KV" },
      redis: { provider: "upstash", url: "http://localhost", token: "tok" },
      env: true
    });
    expect(plugin).toBeDefined();
  });
});
