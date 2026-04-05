import { expect, test, describe } from "bun:test";
import { withMetadata } from "../src/utils/seo";

describe("SEO Utility (withMetadata)", () => {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Original Title</title>
        <meta name="description" content="Original description">
      </head>
      <body>
        <h1>Hello</h1>
      </body>
    </html>
  `;

  test("should replace existing title and description", async () => {
    const response = new Response(baseHtml, { headers: { "Content-Type": "text/html" } });
    const transformed = withMetadata(response, {
      title: "New Title",
      description: "New description"
    });

    const text = await transformed.text();
    expect(text).toContain("<title>New Title</title>");
    expect(text).toContain('<meta name="description" content="New description">');
    expect(text).not.toContain("<title>Original Title</title>");
  });

  test("should inject OG and Twitter tags", async () => {
    const response = new Response(baseHtml, { headers: { "Content-Type": "text/html" } });
    const transformed = withMetadata(response, {
      title: "Social Page",
      image: "https://example.com/image.png"
    });

    const text = await transformed.text();
    expect(text).toContain('<meta property="og:image" content="https://example.com/image.png">');
    expect(text).toContain('<meta name="twitter:image" content="https://example.com/image.png">');
    expect(text).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  test("should inject script and canonical URL", async () => {
    const response = new Response(baseHtml, { headers: { "Content-Type": "text/html" } });
    const transformed = withMetadata(response, {
      canonical: "https://example.com/canonical",
      injectScript: "window.hello = 'world';"
    });

    const text = await transformed.text();
    expect(text).toContain('<link rel="canonical" href="https://example.com/canonical">');
    expect(text).toContain("<script>window.hello = 'world';</script>");
  });

  test("should support dynamic meta tags", async () => {
    const response = new Response(baseHtml, { headers: { "Content-Type": "text/html" } });
    const transformed = withMetadata(response, {
      "og:type": "article",
      "author": "Bunflare Robot"
    });

    const text = await transformed.text();
    expect(text).toContain('<meta property="og:type" content="article">');
    expect(text).toContain('<meta name="author" content="Bunflare Robot">');
  });
});
