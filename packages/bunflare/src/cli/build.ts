import { loadConfig } from "../config";
import { cloudflarePlugin } from "../plugin";
import path from "path";
import { Glob } from "bun";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { log } from "./logger";
import pc from "picocolors";

/**
 * Executes the build process for Cloudflare Workers with a robust "Coalescing" Mutex.
 */
export async function runBuild(options: { rootDir?: string; production?: boolean; quiet?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  const quiet = options.quiet || false;
  const config = await loadConfig(rootDir);
  const isProd = options.production || process.env.NODE_ENV === "production";

  const startTime = Date.now();

  if (!quiet) {
    log.header(`Building for ${isProd ? "production" : "development"}...`, "blue");
  }

  const outdir = config.outdir || "./dist";
  const absOutdir = path.resolve(rootDir, outdir);

  if (!existsSync(absOutdir)) {
    mkdirSync(absOutdir, { recursive: true });
  }

  // Define locking using a simpler and less error-prone Promise/Map approach for intra-process builds,
  // or a basic lockfile with standard fail-safe for cross-process.
  // Since Bunflare build is mostly run single-shot or sequentially by the dev server:
  const lockFile = path.join(absOutdir, ".bunflare.lock");
  let lockAcquired = false;
  const myPid = process.pid.toString();

  try {
    writeFileSync(lockFile, myPid, { flag: 'wx' });
    lockAcquired = true;
  } catch (e) {
    // Basic file-lock fallback, wait up to 1 second then force
    const MAX_WAIT_MS = 1000;
    let waited = 0;
    while (!lockAcquired && waited < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
      try {
        writeFileSync(lockFile, myPid, { flag: 'wx' });
        lockAcquired = true;
      } catch (err) {}
    }
    if (!lockAcquired) {
      if (!quiet) log.warn(`Build lock timeout. Forcing clear.`);
      try { unlinkSync(lockFile); } catch (err) {}
      try { writeFileSync(lockFile, myPid, { flag: 'wx' }); lockAcquired = true; } catch (err) {}
    }
  }

  try {
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
    entrypoint = entrypoint || "./src/index.ts"; 
    
    let finalEntrypoint = path.resolve(rootDir, entrypoint);
    
    // Preemptive Entrypoint Check: Prevent cryptic AggregateErrors from Bun
    if (!existsSync(finalEntrypoint)) {
      log.error(`Entrypoint not found: ${pc.white(entrypoint)}`);
      log.line(`Please ensure this file exists or update the ${pc.cyan("entrypoint")} field in your ${pc.cyan("bunflare.config.ts")}.`);
      return false;
    }

    const watchDir = config.watchDir || "src";

    // 0. Discover Resources for Named Exports (Automatic Identification)
    const { scanDirectoryForBindings } = await import("./scanner");
    const sourceDir = path.join(rootDir, watchDir);
    const discovered = scanDirectoryForBindings(sourceDir);
    const exportable = discovered.filter(b => ["do", "workflow", "container"].includes(b.type));
    
    let tempEntryPath = path.join(absOutdir, ".bunflare_entry.ts");

    if (exportable.length > 0) {
      if (!quiet) log.info(`Auto-identified ${exportable.length} resources to export.`);
      
      // Fix: Ensure the worker import uses a relative path from the dist folder
      let relWorkerPath = path.relative(path.dirname(tempEntryPath), finalEntrypoint);
      if (!relWorkerPath.startsWith(".")) relWorkerPath = "./" + relWorkerPath;
      // Also strip extension just in case, similar to other imports
      relWorkerPath = relWorkerPath.replace(/\.(ts|tsx|js|jsx)$/, "");

      let entryContent = `import $$worker from "${relWorkerPath}";\n`;
      const seen = new Set<string>();
      
      exportable.forEach(ex => {
        if (seen.has(ex.name)) return;
        seen.add(ex.name);
        // Ensure relative path is correct from the temp entry point's perspective
        let relPath = path.relative(path.dirname(tempEntryPath), ex.filePath);
        if (!relPath.startsWith(".")) relPath = "./" + relPath;
        // Strip extension for cleaner imports
        relPath = relPath.replace(/\.(ts|tsx|js|jsx)$/, "");
        
        entryContent += `export { ${ex.name} } from "${relPath}";\n`;
      });
      entryContent += `export default $$worker;\n`;
      
      writeFileSync(tempEntryPath, entryContent);
      finalEntrypoint = tempEntryPath;
    }

    const staticHtmlDirName = config.staticDir || "public";
    const htmlGlob = new Glob("**/*.html");
    const htmlEntries = [...htmlGlob.scanSync(path.join(rootDir, watchDir))].map(f => path.join(watchDir, f));
    
    // Also scan the static directory for HTML templates
    const staticHtmlPath = path.resolve(rootDir, staticHtmlDirName);
    if (existsSync(staticHtmlPath)) {
      const staticHtmlEntries = [...htmlGlob.scanSync(staticHtmlPath)].map(f => path.join(staticHtmlDirName, f));
      htmlEntries.push(...staticHtmlEntries);
    }

    // Build 1: The Worker
    const workerResult = await Bun.build({
      entrypoints: [finalEntrypoint],
      outdir: absOutdir,
      naming: {
        entry: "index.js", // Force index.js so wrangler finds it
        chunk: "[name]-[hash].[ext]",
      },
      target: config.target ?? "browser",
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
      log.error("Worker build failed:");
      for (const message of workerResult.logs) console.error(message);
      return false;
    }

    // Build 2: The Frontend Assets
    let frontendResult: any = { success: true, metafile: { outputs: {} } };
    if (htmlEntries.length > 0) {
      const assetsDir = path.join(absOutdir, "assets");
      if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

      frontendResult = await Bun.build({
        entrypoints: htmlEntries,
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
        log.error("Frontend build failed:");
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
        if (!quiet) log.warn(`Failed to copy static directory ${staticDirName}`);
      }
    }

    // Final Reporting
    if (!quiet) {
      const mergedOutputs = { ...workerResult.metafile!.outputs, ...frontendResult.metafile!.outputs };
      
      const buildTime = Date.now() - startTime;
      log.timing("Build successful", buildTime);

      // Pretty Bundle Report
      const maxPathLen = Math.max(...Object.keys(mergedOutputs).map(p => path.relative(rootDir, p).length), 10);
      
      log.line(`  ${pc.bold(pc.blue("Asset")).padEnd(maxPathLen + 4)} ${pc.bold(pc.blue("Size"))}`);
      log.line(`  ${pc.dim("─".repeat(maxPathLen + 12))}`);

      let totalBytes = 0;
      for (const [outPath, meta] of Object.entries(mergedOutputs) as [string, any][]) {
        const relPath = path.relative(rootDir, outPath);
        totalBytes += meta.bytes;
        const sizeKb = (meta.bytes / 1024).toFixed(2);
        const isSecondary = (relPath.includes("/chunk-") || relPath.includes("-hash"));
        
        log.line(`  ${isSecondary ? pc.dim(relPath) : pc.white(relPath)}${pc.dim(".".repeat(maxPathLen - relPath.length + 4))} ${pc.green(sizeKb + " KB")}`);
      }

      if (staticAssetsCount > 0) {
        log.line(`  ${pc.dim(`${staticDirName}/ (Static Assets)`)}`);
      }

      const totalKb = (totalBytes / 1024).toFixed(2);
      log.line(`  ${pc.dim("─".repeat(maxPathLen + 12))}`);
      log.line(`  ${pc.bold("Total Size:")}${" ".repeat(maxPathLen - 6)} ${pc.bold(pc.green(totalKb + " KB"))}\n`);
    }

    return true;
  } finally {
    if (lockAcquired) {
      try { if (existsSync(lockFile)) unlinkSync(lockFile); } catch (e) { }
    }
  }
}

if (import.meta.main) {
  await runBuild();
}
