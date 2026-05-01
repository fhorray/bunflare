import { join } from "path";
import { existsSync, rmSync, readFileSync } from "fs";
import { spawn } from "child_process";
import { watch } from "fs";
import { bunflare } from "./index.ts";
import type { BunflareConfig, BunflareOptions } from "./types.ts";
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
    const json = JSON.parse(content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""));
    const options: Partial<BunflareOptions> = {};

    if (json.d1_databases?.[0]) {
      options.sqlite = { binding: json.d1_databases[0].binding };
    }
    if (json.kv_namespaces?.[0]) {
      options.kv = { binding: json.kv_namespaces[0].binding };
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
  const userConfig = await loadConfig();
  if (!userConfig) {
    process.stderr.write(`${pc.red("Error:")} bunflare.config.ts not found!\n`);
    if (!isDev) process.exit(1);
    return false;
  }

  const discovered = discoverBindings();
  const config: BunflareConfig = {
    ...discovered,
    ...userConfig,
    sqlite: userConfig.sqlite || discovered.sqlite,
    kv: userConfig.kv || discovered.kv,
    r2: userConfig.r2 || discovered.r2,
    redis: userConfig.redis || discovered.redis,
  };

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
      plugins: [bunflare(config)],
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
      });

      if (!frontendResult.success) {
        console.error(`${pc.red("✖ frontend build failed")}`);
        frontendResult.logs.forEach(log => console.error(log));
        frontendSuccess = false;
      }
    }

    if (workerResult.success && frontendSuccess) {
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
    process.stderr.write(`${pc.red("crashed:")} ${err instanceof Error ? err.message : String(err)}\n`);
    return false;
  }
}

/**
 * Executes a wrangler command.
 */
function runWrangler(wranglerArgs: string[]) {
  const child = spawn("wrangler", wranglerArgs, {
    stdio: "inherit",
    shell: true,
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

// CLI Logic
const args = process.argv.slice(2);
const command = args[0];

if (command === "dev") {
  console.log(`${pc.yellow("🚀 starting bunflare dev mode...")}`);

  // 1. Initial Build
  runBuild(true).then(() => {
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
    const child = spawn("wrangler", wranglerArgs, {
      stdio: "inherit",
      shell: true,
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
} else if (command === "deploy") {
  console.log(`${pc.green("🚀 preparing production build...")}`);
  runBuild(false).then((success) => {
    if (success) {
      console.log(`${pc.green("📦 build ready for cloudflare")}`);
      runWrangler(["deploy", ...args.slice(1)]);
    }
  });
} else if (command === "build") {
  await runBuild(args.includes("--dev"));
} else {
  console.log(`${pc.bold("Bunflare CLI")}`);
  console.log(`Usage: bunflare <dev|build|deploy>`);
}
