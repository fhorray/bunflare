import type { SEOOptions } from "../types";

/**
 * High-performance SEO and HTML metadata injection utility for Bunflare.
 * Uses HTMLRewriter to dynamically transform responses in stream.
 * Compatible with both Bun and Cloudflare Workers.
 * 
 * @example
 * return withMetadata(response, {
 *   title: "Welcome to Bunflare",
 *   description: "The best framework for Cloudflare."
 * });
 */
export function withMetadata(response: Response, options: SEOOptions): Response {
  // Use HTMLRewriter to perform surgical replacements or insertions
  const rewriter = new HTMLRewriter();

  // 1. Replaces or creates the <title> tag
  if (options.title) {
    rewriter.on("title", {
      element(el) {
        el.setInnerContent(options.title!);
      },
    });
  }

  // 2. Replaces or creates the <meta name="description"> tag
  if (options.description) {
    rewriter.on('meta[name="description"]', {
      element(el) {
        el.setAttribute("content", options.description!);
      },
    });
  }

  // 3. Inject standard meta tags to the end of <head>
  rewriter.on("head", {
    element(el) {
      // Invert OG and Twitter meta tags if needed
      if (options.title) {
        el.append(`<meta property="og:title" content="${options.title}">\n`, { html: true });
        el.append(`<meta name="twitter:title" content="${options.title}">\n`, { html: true });
      }

      if (options.description) {
        el.append(`<meta property="og:description" content="${options.description}">\n`, { html: true });
        el.append(`<meta name="twitter:description" content="${options.description}">\n`, { html: true });
      }

      if (options.image) {
        el.append(`<meta property="og:image" content="${options.image}">\n`, { html: true });
        el.append(`<meta name="twitter:image" content="${options.image}">\n`, { html: true });
        el.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
      }

      if (options.canonical) {
        el.append(`<link rel="canonical" href="${options.canonical}">\n`, { html: true });
      }

      // Dynamic Meta Injection (og:*, twitter:*, etc.)
      for (const [key, value] of Object.entries(options)) {
        // Skip keys already handled
        if (["title", "description", "image", "canonical", "injectScript"].includes(key)) continue;

        if (value) {
          const attr = (key.startsWith("og:") || key.startsWith("fb:")) ? "property" : "name";
          el.append(`<meta ${attr}="${key}" content="${value}">\n`, { html: true });
        }
      }

      // 4. Inject script at the end of head for initialization
      if (options.injectScript) {
        el.append(`<script>${options.injectScript}</script>\n`, { html: true });
      }
    },
  });

  return rewriter.transform(response);
}
