#!/usr/bin/env bun
import { join } from "path";
import { existsSync, rmSync, readFileSync, mkdirSync } from "fs";
import { spawn } from "child_process";
import { watch } from "fs";
import { bunflare } from "../index.ts";
import type { BunflareConfig, BunflareOptions } from "../types.ts";
import pc from "picocolors";

/**
 * Loads the bunflare.config.ts file from the current directory.
 */
async function loadConfig(): Promise<BunflareConfig | null> {
  const configPath = join(process.cwd(), "bunflare.config.ts");
  if (!existsSync(configPath)) return null;

  try {
    const config = await import(`${configPath}?t=${Date.now()}`);
    return config.default || config;
  } catch (e) {
    return null;
  }
}

/**
 * Parses wrangler.jsonc to automatically discover bindings.
 */
function discoverBindings(): Partial<BunflareOptions> {
  const wranglerPath = join(process.cwd(), "wrangler.jsonc");
  if (!existsSync(wranglerPath)) return {};

  try {
    const content = readFileSync(wranglerPath, "utf-8");
    const json = JSON.parse(content.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
    const options: Partial<BunflareOptions> = {};

    if (json.d1_databases?.[0]) {
      options.sqlite = { binding: json.d1_databases[0].binding };
    }
    if (json.kv_namespaces?.[0]) {
      options.redis = { binding: json.kv_namespaces[0].binding };
    }
    if (json.r2_buckets?.[0]) {
      options.r2 = { binding: json.r2_buckets[0].binding };
    }

    return options;
  } catch (e) {
    return {};
  }
}

/**
 * Orchestrates the build process for both Worker and Frontend.
 */
async function runBuild(isDev = false, isRebuild = false) {
  const userConfig = await loadConfig() || {};
  const discovered = discoverBindings();

  // Auto-discover entrypoint if not provided
  let entrypoint = userConfig.entrypoint;
  if (!entrypoint) {
    if (existsSync(join(process.cwd(), "index.ts"))) entrypoint = "./index.ts";
    else if (existsSync(join(process.cwd(), "src", "index.ts"))) entrypoint = "./src/index.ts";
    else if (existsSync(join(process.cwd(), "index.js"))) entrypoint = "./index.js";
  }

  const config: BunflareConfig = {
    ...discovered,
    ...userConfig,
    entrypoint,
    sqlite: userConfig.sqlite || discovered.sqlite,
    r2: userConfig.r2 || discovered.r2,
    redis: userConfig.redis || discovered.redis,
  };

  if (!entrypoint) {
    process.stderr.write(`${pc.red("Error:")} Entry point not found! Create index.ts or src/index.ts\n`);
    if (!isDev) process.exit(1);
    return false;
  }

  // Check for export default
  try {
    const entryContent = readFileSync(join(process.cwd(), entrypoint), "utf-8");
    if (!entryContent.includes("export default")) {
      console.error(`\n${pc.red("✖ Fatal Error:")} Your entry point (${pc.cyan(entrypoint)}) is missing an ${pc.bold("export default")} statement.`);
      console.error(`${pc.gray("  Cloudflare Workers requires the server to be exported as the default export.")}`);
      console.error(`${pc.gray("  Example: ")}${pc.green("export default server;")}\n`);
      if (!isDev) process.exit(1);
      return false; // Abort build
    }
  } catch (e) {
    // Ignore read errors here, Bun.build will catch them later
  }

  if (!isRebuild) {
    const distDir = join(process.cwd(), "dist");
    if (existsSync(distDir)) {
      try {
        rmSync(distDir, { recursive: true, force: true });
      } catch (e) { }
    }
  }

  try {
    if (!isRebuild) process.stdout.write(`${pc.cyan("🚀 building fullstack app...")}\n`);

    const workerResult = await Bun.build({
      entrypoints: [config.entrypoint || "./index.ts"],
      outdir: "./dist",
      target: "browser",
      format: "esm",
      minify: !isDev,
      plugins: [bunflare(config), ...(config.plugins || [])],
    });

    if (!workerResult.success) {
      console.error(`${pc.red("✖ backend build failed")}`);
      workerResult.logs.forEach(log => console.error(log));
      return false;
    }

    let frontendSuccess = true;
    if (config.frontend) {
      const frontendResult = await Bun.build({
        entrypoints: [config.frontend.entrypoint || "./public/index.html"],
        outdir: config.frontend.outdir || "./dist/public",
        target: "browser",
        minify: !isDev,
        plugins: config.frontend.plugins || config.plugins || [],
      });

      if (!frontendResult.success) {
        console.error(`${pc.red("✖ frontend build failed")}`);
        frontendResult.logs.forEach(log => console.error(log));
        frontendSuccess = false;
      }
    }

    if (workerResult.success && frontendSuccess) {
      // Ensure dist/public exists to avoid Wrangler errors even if no frontend is built
      const publicDir = join(process.cwd(), "dist", "public");
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
      }

      const time = new Date().toLocaleTimeString();
      if (isRebuild) {
        process.stdout.write(`${pc.green("✓")} ${pc.gray(`rebuild successful at ${time}`)}\n`);
      } else {
        console.log(`${pc.green("✓")} ${pc.bold("build successful")} ${pc.gray(`at ${time}`)}`);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    process.stderr.write(`${pc.red("crashed:")} ${err instanceof Error ? err.message : String(err)}\n`);
    return false;
  }
}

/**
 * Executes a wrangler command safely without a shell.
 */
function runWrangler(wranglerArgs: string[]) {
  const command = process.platform === "win32" ? "wrangler.cmd" : "wrangler";

  const child = spawn(command, wranglerArgs, {
    stdio: "inherit",
  });

  const cleanup = () => {
    child.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

import { init } from "./init.ts";

// CLI Logic
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  await init();
} else if (args.includes("dev")) {
  const isLocal = args.includes("--local");
  if (isLocal) {
    console.log(`${pc.cyan("🚀 starting bunflare in local-only mode...")}`);
    const config = await loadConfig();
    const entrypoint = config?.entrypoint || "./index.ts";
    const child = spawn("bun", ["--hot", entrypoint], { stdio: "inherit" });

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });

    const cleanup = () => {
      child.kill();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } else {
    console.log(`${pc.yellow("🚀 starting bunflare dev mode...")}`);

    // 1. Initial Build
    runBuild(true).then((success) => {
      if (!success) {
        process.exit(1);
      }

      // 2. Start Watcher
      let debounceTimer: NodeJS.Timeout;
      const watcher = watch(process.cwd(), { recursive: true }, (event, filename) => {
        if (!filename) return;
        const normalized = filename.replace(/\\/g, "/");
        if (
          normalized.startsWith("dist") ||
          normalized.startsWith(".wrangler") ||
          normalized.includes("node_modules") ||
          normalized.startsWith(".git")
        ) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          process.stdout.write(`${pc.yellow("↻")} ${pc.gray(`change in ${normalized}, rebuilding... `)}`);
          await runBuild(true, true);
        }, 150);
      });

      // 3. Start Wrangler (Pure mode, no build-command)
      const wranglerArgs = ["dev", "--live-reload", ...args.slice(1)];
      const command = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
      const child = spawn(command, wranglerArgs, {
        stdio: "inherit",
      });

      const cleanup = () => {
        watcher.close();
        child.kill();
        process.exit(0);
      };

      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);

      child.on("exit", (code) => {
        watcher.close();
        process.exit(code ?? 0);
      });
    });
  }
} else if (command === "deploy") {
  console.log(`${pc.green("🚀 preparing production build...")}`);
  runBuild(false).then((success) => {
    if (success) {
      console.log(`${pc.green("📦 build ready for cloudflare")}`);
      runWrangler(["deploy", ...args.slice(1)]);
    }
  });
} else if (command === "build") {
  const success = await runBuild(args.includes("--dev"));
  if (!success) process.exit(1);
} else if (command === "--version" || command === "-v" || command === "version") {
  const pkg = await import("../../package.json");
  console.log(`${pc.cyan("bunflare")} version ${pc.bold(pkg.version || "1.0.0")}`);
} else {
  console.log(`
  ${pc.bold(pc.cyan("🔥 Bunflare CLI"))}
  ${pc.gray("Write Bun. Deploy Cloudflare.")}

  ${pc.bold("Usage:")}
    ${pc.white("bunflare <command> [options]")}

  ${pc.bold("Commands:")}
    ${pc.cyan("init")}       🚀 Initialize a new project (config, types, bindings)
    ${pc.cyan("dev")}        👨‍💻 Start development server with HMR and logging
    ${pc.cyan("build")}      📦 Build for production (optimized ESM bundle)
    ${pc.cyan("deploy")}     ☁️  Build and deploy to Cloudflare Workers

  ${pc.bold("Options:")}
    ${pc.gray("-v, --version")}  Show version number
    ${pc.gray("-h, --help")}     Show this help menu

  ${pc.bold("Examples:")}
    ${pc.gray("$ bunflare init")}
    ${pc.gray("$ bunflare dev")}
  `);
}
