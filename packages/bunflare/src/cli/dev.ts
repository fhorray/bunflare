import { runBuild } from "./build";
import { log } from "./logger";
import pc from "picocolors";
import { spawnWrangler } from "./wrangler-runner";

/**
 * Orchestrates the development environment.
 * Runs bunflare build and wrangler dev in harmony.
 */
export async function runDev(options: { quiet?: boolean, remote?: boolean } = {}) {
  const quiet = options.quiet || false;
  let remote = options.remote || false;

  if (!quiet) {
    log.header("Starting development environment...", "cyan");
  }

  // 1. Initial Build
  const success = await runBuild({ quiet });
  if (!success) {
    log.error("Initial build failed. Fix errors and try again.");
    process.exit(1);
  }

  // 2. Load Wrangler Config
  const { loadWranglerConfig } = await import("../config");
  const wranglerConfig = await loadWranglerConfig();
  
  const port = wranglerConfig?.dev?.port || 8787;
  const url = `http://localhost:${port}`;

  if (!quiet) {
    log.info(`Starting wrangler dev ${remote ? pc.yellow("(full remote mode)") : pc.green("(local mode)")}...`);
    log.line(`  ${pc.green("🚀")} ${pc.bold("Server running at")} ${pc.cyan(pc.underline(url))}`);
    log.hr();
  }

  // 3. Spawn Wrangler Dev
  const args = ["dev"];
  
  // --live-reload is NOT supported when the GLOBAL --remote flag is used
  if (!remote) {
    args.push("--live-reload");
  } else {
    args.push("--remote");
  }

  if (quiet) {
    args.push("--show-interactive-dev-session=false");
  }

  const wrangler = spawnWrangler({
    args,
    quiet,
    filterBindings: true
  });

  wrangler.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log.warn(`Wrangler exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}
