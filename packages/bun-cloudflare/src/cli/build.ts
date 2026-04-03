import { loadConfig } from "../config";
import { cloudflarePlugin } from "../plugin";

/**
 * Executes the build process for Cloudflare Workers.
 */
export async function runBuild(options: { rootDir?: string } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const config = await loadConfig(rootDir);

  const entrypoint = config.entrypoint || "./src/index.ts";
  const outdir = config.outdir || "./dist";

  console.log(`[bun-cloudflare] 📦 Building ${entrypoint} to ${outdir}...`);

  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir: outdir,
    target: "browser",
    minify: config.minify ?? false,
    plugins: [
      cloudflarePlugin(config)
    ]
  });

  if (!result.success) {
    console.error("[bun-cloudflare] ❌ Build failed:");
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }

  console.log("[bun-cloudflare] ✨ Build successful!");
}

// If run directly
if (import.meta.main) {
  await runBuild();
}
