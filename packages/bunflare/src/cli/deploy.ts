import { spawn } from "node:child_process";
import { log } from "./logger";
import pc from "picocolors";

/**
 * Orchestrates the production deployment.
 * Delegates the build to Wrangler (which calls bunflare build via wrangler.jsonc).
 */
export async function runDeploy() {
  const rootDir = process.cwd();
  log.header("Production Deployment", "yellow");

  const start = Date.now();

  // We delegate the build to Wrangler's internal build command (defined in wrangler.jsonc).
  // We just need to ensure Wrangler runs in production mode.
  log.step("Deploying to Cloudflare (Modern Orchestration)...");
  
  const wrangler = spawn("bunx", ["wrangler", "deploy"], {
    stdio: "inherit",
    shell: true,
    cwd: rootDir,
    env: { 
      ...process.env, 
      NODE_ENV: "production",
      BUN_RUNTIME: "1" 
    }
  });

  wrangler.on("exit", (code) => {
    if (code === 0) {
      log.success("Deployment successful! 🚀");
      log.timing("Production ready", Date.now() - start);
    } else {
      log.error(`Deployment failed with exit code ${code}`);
      process.exit(code || 0);
    }
  });

  // Handle Termination
  process.on("SIGINT", () => {
    wrangler.kill("SIGINT");
    process.exit(0);
  });
}
