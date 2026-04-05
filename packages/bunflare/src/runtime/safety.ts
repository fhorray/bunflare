/**
 * Bunflare Safety Lock 🛡️
 * This module prevents the project from running directly with 'bun run'
 * without the necessary Cloudflare environment and transformations.
 */

// Self-executing safety check
(() => {
  // 1. Check if we are in a Bun environment
  const isBun = typeof (globalThis as any).Bun !== "undefined";

  // 2. Check if the code was processed by the Bunflare transformer
  const isTransformed = (globalThis as any).__BUNFLARE_RUNTIME__ === true;

  // 3. Check if we are in a test environment (don't block tests)
  const isTest = typeof process !== "undefined" && (process.env.BUN_TEST || process.env.NODE_ENV === "test");

  // 4. Trigger safety lock if running raw in Bun
  if (isBun && !isTransformed && !isTest) {
    console.error("\x1b[31m%s\x1b[0m", "\n[bunflare] ❌ Error: Direct 'bun run' detected.");
    console.error("\x1b[33m%s\x1b[0m", "[bunflare] 💡 To run your project with Cloudflare bindings, please use:");
    console.error("\x1b[36m%s\x1b[0m", "           bunx wrangler dev  (or your dev script)\n");
    console.error("[bunflare] 📖 Why? Bunflare requires an AST transformation to work with Cloudflare infrastructure.");
    console.error("[bunflare]    Running directly with 'bun' bypasses this and will fail to resolve bindings.\n");

    // Exit immediately to prevent confusing stack traces from subsequent code
    if (typeof process !== "undefined") {
      process.exit(1);
    }
  }
})();
