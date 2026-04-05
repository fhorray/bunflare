import { spawn } from "node:child_process";
import { runBuild } from "./build";

/**
 * Orchestrates the development environment.
 * Runs bunflare build and wrangler dev in harmony.
 */
export async function runDev(options: { quiet?: boolean } = {}) {
  const quiet = options.quiet || false;

  if (!quiet) {
    console.log("[bunflare] 🛠️  Starting development environment...");
  }

  // 1. Initial Build
  const success = await runBuild({ quiet });
  if (!success) {
    console.error("[bunflare] ❌ Initial build failed. Fix errors and try again.");
    process.exit(1);
  }

  if (!quiet) {
    console.log("[bunflare] 📡 Starting wrangler dev...");
  }

  // 2. Load Wrangler Config to find the port
  const { loadWranglerConfig } = await import("../config");
  const wranglerConfig = await loadWranglerConfig();
  const port = wranglerConfig?.dev?.port || 8787;
  const url = `http://localhost:${port}`;


  // 3. Spawn Wrangler Dev
  const wranglerArgs = ["wrangler", "dev", "--live-reload"];
  if (quiet) {
    wranglerArgs.push("--show-interactive-dev-session=false");
  }

  // To filter output while keeping colors and interactivity:
  // - stdio[0]: inherit (stdin for shortcuts)
  // - stdio[1]: pipe (stdout for filtering)
  // - stdio[2]: inherit (stderr for direct error reporting)
  const wrangler = spawn("bunx", wranglerArgs, {
    stdio: ["inherit", "pipe", "inherit"],
    env: {
      ...process.env,
      BUN_RUNTIME: "1",
      FORCE_COLOR: "1" // Ensure wrangler still outputs colors even when piped
    }
  });

  let isFilteringBindings = false;

  (wrangler.stdout as any)?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;

      // Skip the last empty string created by splitting a string that ends with \n
      if (i === lines.length - 1 && line === "") continue;

      let processedLine = line
        .replace("[custom build]", "[bunflare]")
        .replace(/\[wrangler:.*\]/, "[wrangler]");

      const cleanLine = processedLine.replace(/\u001b\[[0-9;]*m/g, "").trim();

      // Start filtering when we see the bindings header
      if (cleanLine.includes("Your Worker has access to the following bindings")) {
        isFilteringBindings = true;
        continue;
      }

      // Stop filtering when we see the interactive session box or meaningful logs
      if (isFilteringBindings) {
        // If we see a log with a method like GET/POST/PUT or a timestamp/bracket, stop filtering
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
        .replace("[custom build]", "[bunflare]")
        .replace(/\[wrangler:.*\]/, "[wrangler]");

      process.stderr.write(processedLine + "\n");
    }
  });

  wrangler.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n[bunflare] ⚠️  Wrangler exited with code ${code}`);
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
