/**
 * Project-specific environment augmentations for bunflare.
 * This file is safe from being overwritten by 'wrangler types'.
 *
 * These are ADDITIVE augmentations to the official @types/bun definitions.
 * They only work correctly because the root tsconfig.json includes @types/bun.
 */

// Augment the Bun.Env interface to include our Cloudflare bindings.
// This is how @types/bun recommends customizing the Bun.env type.
namespace Bun {
  interface Env extends CloudflareBindings { }
}

interface BunflareEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  [key: string]: any;
}

interface CloudflareBindings extends BunflareEnv { }


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
