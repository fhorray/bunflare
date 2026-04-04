import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Exhaustive Imports: Mixed & Comma Handling", () => {
  test("Mixed: Remove first, keep second", () => {
    const input = `import { durable, getCloudflareContext } from "buncf";`;
    const output = transformSource(input, "index.ts");
    expect(output).toContain('import {  getCloudflareContext } from "buncf";');
    expect(output).not.toContain("durable");
  });

  test("Mixed: Keep first, remove second", () => {
    const input = `import { getCloudflareContext, durable } from "buncf";`;
    const output = transformSource(input, "index.ts");
    // Should remove ", durable" (trailing comma removal)
    expect(output).toContain('import { getCloudflareContext } from "buncf";');
    expect(output).not.toContain("durable");
  });

  test("Mixed: Three items, remove middle", () => {
    const input = `import { getCtx, durable, setCtx } from "buncf";`;
    const output = transformSource(input, "index.ts");
    expect(output).toContain('import { getCtx,  setCtx } from "buncf";');
    expect(output).not.toContain("durable");
  });
});

describe("Exhaustive Imports: Formatting & Comments", () => {
  test("Multi-line with comments", () => {
    const input = `
      import { 
        durable, // Transform me
        getCloudflareContext // Preserve me
      } from "buncf";
    `;
    const output = transformSource(input, "index.ts");
    expect(output).toContain("getCloudflareContext // Preserve me");
    expect(output).not.toContain("durable");
    expect(output).toContain('import {');
    expect(output).toContain('} from "buncf";');
  });

  test("Whitespace mess", () => {
    const input = `import {durable,    getCloudflareContext} from "buncf";`;
    const output = transformSource(input, "index.ts");
    expect(output).toContain('import {    getCloudflareContext} from "buncf";');
  });
});

describe("Exhaustive Imports: Aliases & Duplicates", () => {
  test("Aliased runtime helper", () => {
    const input = `import { getCloudflareContext as ctx, durable } from "buncf";`;
    const output = transformSource(input, "index.ts");
    expect(output).toContain('import { getCloudflareContext as ctx } from "buncf";');
  });

  test("Duplicate import blocks", () => {
    const input = `
      import { durable } from "buncf";
      import { getCloudflareContext } from "buncf";
    `;
    const output = transformSource(input, "index.ts");
    // First block should be gone (contains only durable)
    // Second block should stay
    expect(output).toContain('import { getCloudflareContext } from "buncf";');
    expect(output).not.toContain('import { durable } from "buncf";');
  });
});
