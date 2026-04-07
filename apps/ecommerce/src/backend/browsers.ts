import { browser } from "bunflare";

export const ProductScraper = browser({
  async run(page, req, env) {
    const url = new URL(req.url);
    const target = url.searchParams.get("target");
    if (!target) return new Response("Missing target", { status: 400 });

    await page.goto(target);
    const title = await page.title();
    return Response.json({ title });
  }
});

export const SocialMediaPreview = browser({
  async run(page, req, env) {
    const { url } = await req.json();
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto(url, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({ type: "jpeg", quality: 80 });
    return new Response(screenshot, { headers: { "Content-Type": "image/jpeg" } });
  }
});