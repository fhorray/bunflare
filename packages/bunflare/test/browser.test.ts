import { expect, test, describe } from "bun:test";
import { transformSource } from "../src/transforms/serve-transform";

describe("Browser Rendering Transformation", () => {
  test("transforms browser() helper into a class with puppeteer", () => {
    const source = `
import { browser } from "bunflare";

export const PDFGen = browser({
  async run(page, req, env) {
    await page.goto("https://google.com");
    return new Response("ok");
  }
});
    `;
    const transformed = transformSource(source, "index.ts");
    
    expect(transformed).toContain("class PDFGen");
    expect(transformed).toContain("import(\"@cloudflare/puppeteer\")");
    expect(transformed).toContain("this.env.BROWSER");
    expect(transformed).toContain("puppeteer.launch");
    expect(transformed).toContain("browser.close()");
    expect(transformed).not.toContain("browser(");
  });

  test("handles missing BROWSER binding", () => {
    const source = `
import { browser } from "bunflare";
export const MyBrowser = browser({ async run() {} });
    `;
    const transformed = transformSource(source, "index.ts");
    expect(transformed).toContain("if (!this.env.BROWSER)");
    expect(transformed).toContain("Browser Rendering binding (BROWSER) missing.");
  });

  test("ensures browser.close() is in finally block", () => {
    const source = `
import { browser } from "bunflare";
export const MyBrowser = browser({ async run() {} });
    `;
    const transformed = transformSource(source, "index.ts");
    expect(transformed).toContain("try {");
    expect(transformed).toContain("finally {");
    expect(transformed).toContain("await browser.close()");
  });
});
