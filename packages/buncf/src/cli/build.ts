import { loadConfig } from "../config";
import { cloudflarePlugin } from "../plugin";
import path from "path";
import { Glob } from "bun";

/**
 * Executes the build process for Cloudflare Workers.
 */
export async function runBuild(options: { rootDir?: string; production?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const config = await loadConfig(rootDir);
  const isProd = options.production || process.env.NODE_ENV === "production";

  const entrypoint = config.entrypoint || "./src/index.ts";
  const outdir = config.outdir || "./dist";
  const watchDir = config.watchDir || "src";

  const htmlGlob = new Glob("**/*.html");
  const entrypoints: { worker: string; html: string[] } = {
    worker: entrypoint,
    html: [...htmlGlob.scanSync(path.join(rootDir, watchDir))].map(f => path.join(watchDir, f))
  };

  console.log(`[buncf] 📦 Building ${entrypoints.html.length + 1} entries to ${outdir} (${isProd ? "production" : "development"})...`);

  // Build 1: The Worker
  const workerResult = await Bun.build({
    entrypoints: [entrypoints.worker],
    outdir: outdir,
    target: config.target ?? "browser",
    format: "esm",
    naming: {
      entry: "[name].[ext]", // Ensures src/index.ts -> dist/index.js
    },
    minify: config.minify ?? (isProd ? true : false),
    sourcemap: config.sourcemap ?? (isProd ? "none" : "linked"),
    external: [...(config.external ?? []), "wrangler"],
    splitting: config.splitting ?? false,
    define: {
      "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
      "__BUILD_TIME__": JSON.stringify(new Date().toISOString()),
      ...config.define,
    },
    drop: config.drop ?? (isProd ? ["console", "debugger"] : []),
    banner: config.banner,
    footer: config.footer,
    metafile: true, 
    loader: {
      ".html": "text", // Worker needs to import HTML as string
      ...config.loader,
    },
    plugins: [
      ...(config.plugins || []),
      cloudflarePlugin(config)
    ]
  });

  if (!workerResult.success) {
    console.error("[buncf] ❌ Worker build failed:");
    for (const message of workerResult.logs) console.error(message);
    process.exit(1);
  }

  // Build 2: The Frontend Assets (HTML + CSS + JS referenced in HTML)
  let frontendResult: any = { success: true, metafile: { outputs: {} } };
  if (entrypoints.html.length > 0) {
    const assetsDir = path.join(outdir, "assets");
    
    frontendResult = await Bun.build({
      entrypoints: entrypoints.html,
      outdir: assetsDir,
      target: "browser",
      naming: {
        entry: "[name].[ext]",
        chunk: "[name]-[hash].[ext]",
        asset: "[name]-[hash].[ext]",
      },
      publicPath: "/assets/", // Absolute path to the assets folder
      minify: true,
      metafile: true,
      plugins: config.plugins || [], 
      loader: config.loader,
    });

    if (!frontendResult.success) {
      console.error("[buncf] ❌ Frontend build failed:");
      for (const message of frontendResult.logs) console.error(message);
      process.exit(1);
    }

    // Post-build: Move HTML files from assetsDir to outdir (root)
    // This allows index.html to be at the root while all its assets are in /assets/
    const fs = await import("node:fs/promises");
    for (const output of frontendResult.outputs) {
      if (output.path.endsWith(".html")) {
        const fileName = path.basename(output.path);
        const targetPath = path.join(outdir, fileName);
        await Bun.write(targetPath, await output.arrayBuffer());
        // Clean up the HTML from the assets folder
        try { await fs.unlink(output.path); } catch (e) {}
      }
    }
  }

  // Combine metafiles for report
  const mergedOutputs = { ...workerResult.metafile!.outputs, ...frontendResult.metafile!.outputs };

  console.log("\n[buncf] 📊 Bundle Report:");
  for (const [path, meta] of Object.entries(mergedOutputs) as [string, any][]) {
    const sizeKb = (meta.bytes / 1024).toFixed(2);
    console.log(`  ${path.replace(process.cwd() + "/", "")} ${sizeKb} KB`);
  }
  console.log("");

  console.log("[buncf] ✨ Build successful!");
}

// If run directly
if (import.meta.main) {
  await runBuild();
}
