/**
 * Project-specific environment augmentations for bunflare.
 * Augment the Bun.Env interface to include our Cloudflare bindings.
 * This is how @types/bun recommends customizing the Bun.env type.
 */
declare global {
  namespace Bun {
    interface Env extends CloudflareBindings { }
  }
}

/**
 * Asset declarations
 */
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.html" {
  const content: string;
  export default content;
}
