import { describe, expect, it } from "bun:test";
import { transformEnv } from "../transforms/env-transform";

describe("transformEnv", () => {
  it("should transform Bun.env.VAR to getBunCloudflareContext().env.VAR", () => {
    const source = "const x = Bun.env.API_KEY;";
    const transformed = transformEnv(source);
    expect(transformed).toContain('import { getBunCloudflareContext } from "bun-cloudflare";');
    expect(transformed).toContain('const x = getBunCloudflareContext().env.API_KEY;');
  });

  it("should transform process.env.VAR to getBunCloudflareContext().env.VAR", () => {
    const source = "const x = process.env.DB_URL;";
    const transformed = transformEnv(source);
    expect(transformed).toContain('const x = getBunCloudflareContext().env.DB_URL;');
  });

  it("should NOT transform process.env.NODE_ENV", () => {
    const source = "if (process.env.NODE_ENV === 'production') {}";
    const transformed = transformEnv(source);
    expect(transformed).not.toContain('getBunCloudflareContext().env.NODE_ENV');
    expect(transformed).toContain("process.env.NODE_ENV");
  });

  it("should NOT transform Bun.env.NODE_ENV", () => {
    const source = "const isDev = Bun.env.NODE_ENV === 'development';";
    const transformed = transformEnv(source);
    expect(transformed).not.toContain('getBunCloudflareContext().env.NODE_ENV');
    expect(transformed).toContain("Bun.env.NODE_ENV");
  });

  it("should transform bracket access process.env['VAR']", () => {
    const source = "const x = process.env['MY_VAR'];";
    const transformed = transformEnv(source);
    expect(transformed).toContain('const x = getBunCloudflareContext().env["MY_VAR"];');
  });

  it("should NOT transform bracket access process.env['NODE_ENV']", () => {
    const source = "const x = process.env['NODE_ENV'];";
    const transformed = transformEnv(source);
    expect(transformed).not.toContain('getBunCloudflareContext().env["NODE_ENV"]');
    expect(transformed).toContain("process.env['NODE_ENV']");
  });

  it("should handle multiple variables in one file", () => {
    const source = "const a = Bun.env.A; const b = process.env.B; const c = process.env.NODE_ENV;";
    const transformed = transformEnv(source);
    expect(transformed).toContain('getBunCloudflareContext().env.A');
    expect(transformed).toContain('getBunCloudflareContext().env.B');
    expect(transformed).toContain('process.env.NODE_ENV');
  });
});
