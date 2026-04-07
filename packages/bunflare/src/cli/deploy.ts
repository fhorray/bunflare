import { log } from "./logger";
import pc from "picocolors";
import { Provisioner } from "./provisioner";
import { runBuild } from "./build";
import { spawnWrangler } from "./wrangler-runner";
 
 /**
  * Orchestrates the production deployment.
  * Delegates the build to Wrangler (which calls bunflare build via wrangler.jsonc).
  */
 export async function runDeploy() {
   const rootDir = process.cwd();
   log.header("Cloudflare Deployment", "yellow");
 
   const start = Date.now();
 
   // 1. Build Step (Ensures the newest compiler logic is used)
   const buildSuccess = await runBuild({ rootDir, production: true });
   if (!buildSuccess) {
     log.error("Build failed. Aborting deployment.");
     process.exit(1);
   }
 
   // 2. Auto-Provisioning Step
   const provisioner = new Provisioner(rootDir);
   try {
     await provisioner.provisionMissingResources();
   } catch (e: any) {
     log.error(`Auto-provisioning failed: ${e.message}`);
     // We continue anyway, as the user might want to try deploy with existing resources
   }
 
   // 3. We delegate the build to Wrangler's internal build command (defined in wrangler.jsonc).
   // We just need to ensure Wrangler runs in production mode.
   log.step("Deploying to Cloudflare...");

  const wrangler = spawnWrangler({
    args: ["deploy"],
    cwd: rootDir,
    env: { NODE_ENV: "production" }
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
}
