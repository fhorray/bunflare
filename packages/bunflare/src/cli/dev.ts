import { spawn } from "node:child_process";
import { runBuild } from "./build";
import { log } from "./logger";
import pc from "picocolors";

/**
 * Orchestrates the development environment.
 * Runs bunflare build and wrangler dev in harmony.
 */
export async function runDev(options: { quiet?: boolean } = {}) {
  const quiet = options.quiet || false;

  if (!quiet) {
    log.header("Starting development environment...", "cyan");
  }

  // 1. Initial Build
  const success = await runBuild({ quiet });
  if (!success) {
    log.error("Initial build failed. Fix errors and try again.");
    process.exit(1);
  }

  // 2. Load Wrangler Config to find the port
  const { loadWranglerConfig } = await import("../config");
  const wranglerConfig = await loadWranglerConfig();
  const port = wranglerConfig?.dev?.port || 8787;
  const url = `http://localhost:${port}`;

  if (!quiet) {
    log.info("Starting wrangler dev...");
    log.line(`  ${pc.green("🚀")} ${pc.bold("Server running at")} ${pc.cyan(pc.underline(url))}`);
    log.hr();
  }

  // 3. Spawn Wrangler Dev
  const wranglerArgs = ["wrangler", "dev", "--live-reload"];
  if (quiet) {
    wranglerArgs.push("--show-interactive-dev-session=false");
  }

  const wrangler = spawn("bunx", wranglerArgs, {
    stdio: ["inherit", "pipe", "inherit"],
    env: {
      ...process.env,
      BUN_RUNTIME: "1",
      FORCE_COLOR: "1" 
    }
  });

  let isFilteringBindings = false;

  (wrangler.stdout as any)?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      if (i === lines.length - 1 && line === "") continue;

      let processedLine = line
        .replace("[custom build]", pc.magenta("bunflare"))
        .replace(/\[wrangler:.*\]/, pc.blue("wrangler"));

      const cleanLine = processedLine.replace(/\u001b\[[0-9;]*m/g, "").trim();

      // Start filtering when we see the bindings header
      if (cleanLine.includes("Your Worker has access to the following bindings")) {
        isFilteringBindings = true;
        continue;
      }

      // Stop filtering when we see the interactive session box or meaningful logs
      if (isFilteringBindings) {
        if (cleanLine.match(/\[wrangler.*\]/) || cleanLine.match(/GET|POST|PUT|DELETE|PATCH/) || cleanLine.startsWith("╭") || cleanLine.includes("Ready on")) {
          isFilteringBindings = false;
        } else {
          continue;
        }
      }

      process.stdout.write(processedLine + "\n");
    }
  });

  (wrangler.stderr as any)?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      if (i === lines.length - 1 && line === "") continue;

      let processedLine = line
        .replace("[custom build]", pc.magenta("bunflare"))
        .replace(/\[wrangler:.*\]/, pc.blue("wrangler"));

      process.stderr.write(processedLine + "\n");
    }
  });

  wrangler.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log.warn(`Wrangler exited with code ${code}`);
    }
    process.exit(code || 0);
  });

  // Handle Termination
  process.on("SIGINT", () => {
    wrangler.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    wrangler.kill("SIGTERM");
    process.exit(0);
  });
}
