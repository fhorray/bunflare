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

  // 0. Build Path and Lock Resolution
  const outdir = config.outdir || "./dist";
  const absOutdir = path.resolve(rootDir, outdir);
  const lockFile = path.join(absOutdir, ".bunflare.lock");
  const nextFile = path.join(absOutdir, ".bunflare.next");
  const myPid = process.pid.toString();

  // Ensure output directory exists before any lock manipulation
  if (!existsSync(absOutdir)) {
    mkdirSync(absOutdir, { recursive: true });
  }

  // --- Build Coalescing Logic ---
  let lockAcquired = false;
  let retries = 0;
  const MAX_WAIT_MS = 2000; 
  
  while (!lockAcquired) {
    try {
      writeFileSync(lockFile, myPid, { flag: 'wx' });
      lockAcquired = true;
      try { if (existsSync(nextFile) && readFileSync(nextFile, "utf8") === myPid) unlinkSync(nextFile); } catch (e) {}
    } catch (e) {
      writeFileSync(nextFile, myPid); 
      if (retries > 0) {
        try {
          const currentNext = readFileSync(nextFile, "utf8");
          if (currentNext !== myPid) {
            if (!quiet) log.info(`Build ${myPid} superseded by ${currentNext}.`);
            return true; 
          }
        } catch (err) {}
      }
      if (retries * 50 > MAX_WAIT_MS) {
        if (!quiet) log.warn(`Build lock timeout. Clearing and proceeding.`);
        try { unlinkSync(lockFile); } catch (err) {}
        continue;
      }
      retries++;
      await new Promise(r => setTimeout(r, 50));
    }
  }

  try {
    // --- Actual Build Execution ---
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
    const watchDir = config.watchDir || "src";

    const htmlGlob = new Glob("**/*.html");
    const htmlEntries = [...htmlGlob.scanSync(path.join(rootDir, watchDir))].map(f => path.join(watchDir, f));

    // 1. Double-check directories
    if (!existsSync(absOutdir)) mkdirSync(absOutdir, { recursive: true });

    // Build 1: The Worker
    const workerResult = await Bun.build({
      entrypoints: [entrypoint],
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
    try { if (existsSync(nextFile) && readFileSync(nextFile, "utf8") === myPid) unlinkSync(nextFile); } catch (e) {}
  }
}

if (import.meta.main) {
  await runBuild();
}
