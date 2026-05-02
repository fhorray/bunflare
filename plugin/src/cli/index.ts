#!/usr/bin/env bun
import { join } from "path";
import { existsSync, rmSync, readFileSync, mkdirSync } from "fs";
import { spawn } from "child_process";
import { watch } from "fs";
import { bunflare } from "../index.ts";
import type { BunflareConfig, BunflareOptions } from "../types.ts";
import pc from "picocolors";
import type { BuildOutput } from "bun";
import { createServer } from "net";

/**
 * Checks if a port is available on localhost.
 */
function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port, host);
  });
}

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
async function runBuild(isDev = false, isRebuild = false, only?: "frontend" | "backend") {
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

    const builds: Promise<any>[] = [];

    // 1. Backend Build
    if (!only || only === "backend") {
      builds.push(Bun.build({
        entrypoints: [config.entrypoint || "./index.ts"],
        outdir: "./dist",
        target: "browser",
        format: "esm",
        minify: !isDev,
        external: [
          "node:*",
          "events", "stream", "buffer", "util", "path", "fs", "crypto", "net", "tls", "os", "http", "https", "zlib",
        ],
        loader: {
          ".html": "text",
          ".svg": "text",
          ".png": "file",
          ...(config.loader || {}),
        },
        plugins: [bunflare(config, isRebuild), ...(config.plugins || [])],
      }));
    } else {
      builds.push(Promise.resolve({ success: true }));
    }

    // 2. Frontend Build
    if (config.frontend && (!only || only === "frontend")) {
      builds.push(Bun.build({
        entrypoints: [config.frontend.entrypoint || "./public/index.html"],
        outdir: config.frontend.outdir || "./dist/public",
        target: "browser",
        minify: !isDev,
        plugins: config.frontend.plugins || config.plugins || [],
        loader: config.frontend.loader || {},
      }));
    } else {
      builds.push(Promise.resolve({ success: true }));
    }

    const [workerResult, frontendResult] = (await Promise.all(builds)) as BuildOutput[];

    if (!workerResult || !frontendResult) {
      console.error(`${pc.red("✖ build failed")} workerResult: ${JSON.stringify(workerResult)} frontendResult: ${JSON.stringify(frontendResult)}`);
      return false;
    }

    if (!workerResult.success) {
      console.error(`${pc.red("✖ backend build failed")}`);
      workerResult.logs.forEach((log: BuildOutput['logs'][number]) => console.error(log));
      return false;
    }

    if (frontendResult && !frontendResult.success) {
      console.error(`${pc.red("✖ frontend build failed")}`);
      frontendResult.logs.forEach((log: BuildOutput['logs'][number]) => console.error(log));
      return false;
    }

    // Ensure dist/public exists
    const publicDir = join(process.cwd(), "dist", "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const time = new Date().toLocaleTimeString();
    if (isRebuild) {
      const typeLabel = only ? `${only} ` : "";
      process.stdout.write(`\n${pc.green("✓")} ${pc.gray(`${typeLabel}rebuild successful at ${time}`)}\n`);
    } else {
      console.log(`${pc.green("✓")} ${pc.bold("build successful")} ${pc.gray(`at ${time}`)}`);
    }
    return true;
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
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["wrangler", ...wranglerArgs];

  const child = spawn(cmd, args, {
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

// Live Reload Server
let reloadServer: any = null;
function startReloadServer(port: number) {
  try {
    reloadServer = Bun.serve({
      port,
      fetch(req, server) {
        if (server.upgrade(req)) return;
        return new Response("Bunflare Reload Server");
      },
      websocket: {
        message() { },
        open(ws) {
          ws.subscribe("reload");
        }
      }
    });
  } catch (e) { }
}

function notifyReload() {
  if (reloadServer) {
    reloadServer.publish("reload", "refresh");
  }
}

import { init } from "./init.ts";

// CLI Logic
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  const isQuiet = args.includes("-y") || args.includes("--yes") || args.includes("--quiet");
  await init(isQuiet);
} else if (args.includes("dev")) {
  const isLocal = args.includes("--local");
  if (isLocal) {
    console.log(`${pc.cyan("🚀 starting bunflare in local-only mode...")}`);

    runBuild(true).then(async (success) => {
      if (!success) process.exit(1);

      const config = await loadConfig();
      const entrypoint = config?.entrypoint || "./index.ts";
      const port = config?.port || 8787;
      const ip = config?.ip || "localhost";
      const reloadPort = port + 1001;

      // Port Check: Fail early with a beautiful message
      const available = await isPortAvailable(port, ip);
      if (!available) {
        console.error(`\n${pc.red("✖ Fatal Error:")} Port ${pc.bold(port)} is already in use on ${pc.bold(ip)}.`);
        console.error(`${pc.gray("  Another process is already listening on this port.")}`);
        console.error(`${pc.gray("  Suggestions:")}`);
        console.error(`  - Change the ${pc.cyan("port")} in your ${pc.bold("bunflare.config.ts")}`);
        console.error(`  - Kill the process using this port: ${pc.yellow(`fuser -k ${port}/tcp`)} (Linux/Mac) or use Task Manager (Windows)\n`);
        process.exit(1);
      }

      startReloadServer(reloadPort);

      // 1. Start Watcher for Local Mode
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
          const success = await runBuild(true, true);
          if (success) notifyReload();
        }, 150);
      });

      // 2. Spawn Bun with Hot Reload pointing to the SOURCE file
      const child = spawn("bun", ["--hot", entrypoint], {
        stdio: "inherit",
        env: {
          ...process.env,
          PORT: port.toString(),
          HOST: ip,
          BUNFLARE_RELOAD_PORT: reloadPort.toString()
        }
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
  } else {
    console.log(`${pc.yellow("🚀 starting bunflare dev mode...")}`);

    // 1. Initial Build
    runBuild(true).then(async (success) => {
      if (!success) {
        process.exit(1);
      }

      const config = await loadConfig();
      const port = config?.port || 8787;
      const ip = config?.ip || "127.0.0.1";

      // 1.5 Port Check: Fail early with a beautiful message
      const available = await isPortAvailable(port, ip);
      if (!available) {
        console.error(`\n${pc.red("✖ Fatal Error:")} Port ${pc.bold(port)} is already in use on ${pc.bold(ip)}.`);
        console.error(`${pc.gray("  Another process is already listening on this port.")}`);
        console.error(`${pc.gray("  Suggestions:")}`);
        console.error(`  - Change the ${pc.cyan("port")} in your ${pc.bold("bunflare.config.ts")}`);
        console.error(`  - Kill the process using this port: ${pc.yellow(`fuser -k ${port}/tcp`)} (Linux/Mac) or use Task Manager (Windows)\n`);
        process.exit(1);
      }

      // 2. Start Watcher
      let debounceTimer: NodeJS.Timeout;
      let isBuilding = false;
      const mtimeCache = new Map<string, number>();

      const watcher = watch(process.cwd(), { recursive: true }, async (event, filename) => {
        if (!filename) return;
        const fullPath = join(process.cwd(), filename);
        const normalized = filename.replace(/\\/g, "/");

        if (
          normalized.startsWith("dist") ||
          normalized.startsWith(".wrangler") ||
          normalized.includes("node_modules") ||
          normalized.startsWith(".git")
        ) return;

        // Verify if file actually changed on disk
        try {
          const stats = (await import("fs")).statSync(fullPath);
          const lastMtime = mtimeCache.get(normalized) || 0;
          if (stats.mtimeMs <= lastMtime) return;
          mtimeCache.set(normalized, stats.mtimeMs);
        } catch (e) {
          // File might have been deleted, that's a change too
        }

        if (isBuilding) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (isBuilding) return;
          isBuilding = true;

          try {
            process.stdout.write(`\n${pc.yellow("↻")} ${pc.gray(`change in ${normalized}, rebuilding... `)}`);

            let only: "frontend" | "backend" | undefined = undefined;
            if (normalized.includes("/public/") || normalized.endsWith(".tsx") || normalized.endsWith(".jsx") || normalized.endsWith(".css")) {
              only = "frontend";
            } else if (normalized.endsWith(".ts") || normalized.endsWith(".js")) {
              only = "backend";
            }

            const success = await runBuild(true, true, only);
            if (success && only === "frontend") {
              notifyReload();
            }
          } finally {
            // Give a small buffer after build finishes before allowing the next one
            setTimeout(() => { isBuilding = false; }, 200);
          }
        }, 150);
      });

      // 3. Start Wrangler
      const filteredArgs = args.filter(a => a !== "dev" && a !== "--local");
      const wranglerArgs = ["wrangler", "dev", "--live-reload", "--port", port.toString(), "--ip", ip, ...filteredArgs];
      const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
      const child = spawn(cmd, wranglerArgs, {
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
        if (code !== 0 && code !== null) {
          process.stderr.write(`\n${pc.red("✖ Wrangler crashed")} (exit code ${code})\n`);
          if (process.platform === "win32") {
            process.stderr.write(`${pc.yellow("  Windows Tip:")} This often happens due to port conflicts or IPv6 issues.\n`);
            process.stderr.write(`  - Ensure you are using ${pc.bold("127.0.0.1")} instead of ${pc.bold("localhost")} in your config.\n`);
            process.stderr.write(`  - Check if any other process is using the ${pc.bold("Hyperdrive")} or ${pc.bold("SQL")} proxy ports.\n`);
            process.stderr.write(`  - Try running ${pc.cyan("bunflare dev --local")} to isolate the issue.\n\n`);
          }
        }
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
