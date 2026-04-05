import { loadConfig } from "../config";
import { cloudflarePlugin } from "../plugin";
import path from "path";
import { Glob } from "bun";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

/**
 * Executes the build process for Cloudflare Workers.
 */
export async function runBuild(options: { rootDir?: string; production?: boolean; quiet?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const quiet = options.quiet || false;
  const config = await loadConfig(rootDir);
  const isProd = options.production || process.env.NODE_ENV === "production";

  // 0. Acquire Build Lock to prevent race conditions during "Ctrl+S spam"
  const outdir = config.outdir || "./dist";
  const absOutdir = path.resolve(rootDir, outdir);
  const lockFile = path.join(absOutdir, ".bunflare.lock");

  // Ensure outdir exists before lock check
  if (!existsSync(absOutdir)) {
    mkdirSync(absOutdir, { recursive: true });
  }

  let lockAcquired = false;
  let retries = 0;
  const MAX_RETRIES = 20; // Up to 1 second of waiting
  
  while (!lockAcquired && retries < MAX_RETRIES) {
    try {
      // Use atomic sync write with 'wx' to fail if file exists
      writeFileSync(lockFile, process.pid.toString(), { flag: 'wx' });
      lockAcquired = true;
    } catch (e) {
      retries++;
      // Wait 50ms before retry
      await new Promise(r => setTimeout(r, 50));
    }
  }

  if (!lockAcquired) {
    // If we can't get the lock after 1 second, it's either stuck or very slow build. 
    // We'll proceed but log a warning in non-quiet mode.
    if (!quiet) console.warn("[bunflare] ⚠️ Build lock timed out. Proceeding with caution...");
  }

  try {
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
    const watchDir = config.watchDir || "src";

    const htmlGlob = new Glob("**/*.html");
    const entrypoints: { worker: string; html: string[] } = {
      worker: entrypoint,
      html: [...htmlGlob.scanSync(path.join(rootDir, watchDir))].map(f => path.join(watchDir, f))
    };

    async function doBuild() {
      if (!quiet) {
        console.log(`[bunflare] 📦 Building ${entrypoints.html.length + 1} entries to ${outdir} (${isProd ? "production" : "development"})...`);
      }

      // Build 1: The Worker
      const workerResult = await Bun.build({
        entrypoints: [entrypoints.worker],
        outdir: absOutdir,
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
        return false;
      }

      // Build 2: The Frontend Assets
      let frontendResult: any = { success: true, metafile: { outputs: {} } };
      if (entrypoints.html.length > 0) {
        const assetsDir = path.join(absOutdir, "assets");
        // Ensure assets directory exists
        if (!existsSync(assetsDir)) {
          mkdirSync(assetsDir, { recursive: true });
        }

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
          return false;
        }

        const fsPromises = await import("node:fs/promises");
        for (const output of frontendResult.outputs) {
          if (output.path.endsWith(".html")) {
            const fileName = path.basename(output.path);
            const targetPath = path.join(absOutdir, fileName);
            await Bun.write(targetPath, await output.arrayBuffer());
            try { await fsPromises.unlink(output.path); } catch (e) { }
          }
        }
      }

      // Copy Static Directory
      const staticDirName = config.staticDir || "public";
      const staticPath = path.resolve(rootDir, staticDirName);
      let staticAssetsCount = 0;
      if (existsSync(staticPath)) {
        const { cpSync } = await import("node:fs");
        try {
          cpSync(staticPath, absOutdir, { recursive: true });
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
      }

      return true;
    }

    return await doBuild();
  } finally {
    // Release the lock
    if (lockAcquired && existsSync(lockFile)) {
      try { unlinkSync(lockFile); } catch (e) { }
    }
  }
}

// If run directly
if (import.meta.main) {
  await runBuild();
}
