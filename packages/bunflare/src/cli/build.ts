import { loadConfig } from "../config";
import { cloudflarePlugin } from "../plugin";
import path from "path";
import { Glob } from "bun";

/**
 * Executes the build process for Cloudflare Workers.
 */
export async function runBuild(options: { rootDir?: string; production?: boolean; quiet?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const quiet = options.quiet || false;
  const config = await loadConfig(rootDir);
  const isProd = options.production || process.env.NODE_ENV === "production";
  const { existsSync } = await import("node:fs");

  // Smarter entrypoint detection
  let entrypoint = config.entrypoint;
  if (!entrypoint) {
    const defaultEntries = ["./src/index.ts", "./src/index.tsx", "./src/index.js", "./src/index.jsx"];
    for (const entry of defaultEntries) {
      const fullPath = path.resolve(rootDir, entry);
      if (existsSync(fullPath)) {
        entrypoint = entry;
        break;
      }
    }
  }
  entrypoint = entrypoint || "./src/index.ts"; // Final fallback
  const outdir = config.outdir || "./dist";
  const watchDir = config.watchDir || "src";

  const htmlGlob = new Glob("**/*.html");
  const entrypoints: { worker: string; html: string[] } = {
    worker: entrypoint,
    html: [...htmlGlob.scanSync(path.join(rootDir, watchDir))].map(f => path.join(watchDir, f))
  };

  if (!quiet) {
    console.log(`[bunflare] 📦 Building ${entrypoints.html.length + 1} entries to ${outdir} (${isProd ? "production" : "development"})...`);
  }

  // Build 1: The Worker
  const workerResult = await Bun.build({
    // ... (rest of the worker build config remains same)
    entrypoints: [entrypoints.worker],
    outdir: outdir,
    target: config.target ?? "browser",
    format: "esm",
    naming: {
      entry: "[name].[ext]",
      chunk: "[name]-[hash].[ext]",
    },
    minify: config.minify ?? (isProd ? true : false),
    sourcemap: config.sourcemap ?? (isProd ? "none" : "linked"),
    external: [...(config.external ?? []), "wrangler", "cloudflare:workers", "cloudflare:email", "@cloudflare/containers"],
    splitting: config.splitting ?? true,
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
      ".html": "text", 
      ...config.loader,
    },
    plugins: [
      ...(config.plugins || []),
      cloudflarePlugin(config, quiet)
    ]
  });

  if (!workerResult.success) {
    console.error("[bunflare] ❌ Worker build failed:");
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
      publicPath: "/assets/",
      minify: true,
      splitting: config.splitting ?? true,
      metafile: true,
      plugins: config.plugins || [], 
      loader: config.loader,
    });

    if (!frontendResult.success) {
      console.error("[bunflare] ❌ Frontend build failed:");
      for (const message of frontendResult.logs) console.error(message);
      process.exit(1);
    }

    const fs = await import("node:fs/promises");
    for (const output of frontendResult.outputs) {
      if (output.path.endsWith(".html")) {
        const fileName = path.basename(output.path);
        const targetPath = path.join(outdir, fileName);
        await Bun.write(targetPath, await output.arrayBuffer());
        try { await fs.unlink(output.path); } catch (e) {}
      }
    }
  }

  // --- NEW: Copy Static Directory (public) ---
  const staticDirName = config.staticDir || "public";
  const staticPath = path.resolve(rootDir, staticDirName);
  let staticAssetsCount = 0;
  if (existsSync(staticPath)) {
    const { cpSync } = await import("node:fs");
    try {
      cpSync(staticPath, path.resolve(rootDir, outdir), { recursive: true });
      staticAssetsCount = 1;
    } catch (e) {
      if (!quiet) console.warn(`[bunflare] ⚠️ Warning: Failed to copy static directory ${staticDirName}:`, e);
    }
  }

  if (!quiet) {
    const mergedOutputs = { ...workerResult.metafile!.outputs, ...frontendResult.metafile!.outputs };
    console.log("\n[bunflare] 📊 Bundle Report:");
    let totalBytes = 0;
    for (const [outPath, meta] of Object.entries(mergedOutputs) as [string, any][]) {
      const relPath = path.relative(rootDir, outPath);
      totalBytes += meta.bytes;
      const sizeKb = (meta.bytes / 1024).toFixed(2);
      const typeIndicator = (relPath.includes("/chunk-") || relPath.includes("-hash")) ? "  🧩" : "  📄";
      console.log(`${typeIndicator} ${relPath} ${sizeKb} KB`);
    }
    
    if (staticAssetsCount > 0) {
      console.log(`  📁 ${staticDirName}/ (Static Assets Copied)`);
    }

    const totalKb = (totalBytes / 1024).toFixed(2);
    console.log(`  ────────────────────────────────`);
    console.log(`  📦 TOTAL SIZE: ${totalKb} KB\n`);

    console.log("[bunflare] ✨ Build successful!");
    if (staticAssetsCount > 0 || entrypoints.html.length > 0) {
      console.log(`[bunflare] 💡 Hint: Ensure "assets": { "directory": "./${path.basename(outdir)}" } is set in your wrangler.jsonc for CDN delivery.`);
    }
  }
}

// If run directly
if (import.meta.main) {
  await runBuild();
}
