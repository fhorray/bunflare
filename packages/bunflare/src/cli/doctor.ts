import { loadConfig } from "../config";
import path from "path";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { Provisioner } from "./provisioner";
import pc from "picocolors";
import { log } from "./logger";
import * as p from "@clack/prompts";
import { scanDirectoryForBindings } from "./scanner";

/**
 * Diagnostic tool to verify project configuration and health.
 */
export async function runDoctor(options: { rootDir?: string; fix?: boolean; auto?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  log.header("Bunflare Project Diagnostics", "yellow");
  console.log(pc.dim(`  Checking health in: ${rootDir}\n`));

  let errors = 0;
  let warnings = 0;

  const config = await loadConfig(rootDir);
  
  // Resolve source directory for scanning
  const sourceDir = existsSync(path.join(rootDir, "src")) ? path.join(rootDir, "src") : rootDir;
  const fluidResources = scanDirectoryForBindings(sourceDir);
  const provisioner = new Provisioner(rootDir);

  // 1. Authentication Check
  const authResult = spawnSync("bunx", ["wrangler", "whoami"], {
    stdio: "pipe",
    encoding: "utf-8",
    shell: true,
  });
  if (authResult.status !== 0 || authResult.stdout.includes("not logged in")) {
    console.error(`  ❌ ${pc.red("Error")}: Not logged in to Cloudflare. Run ${pc.bold("wrangler login")}.`);
    errors++;
  } else {
    const emailMatch = authResult.stdout.match(/email: "(.+?)"/);
    console.log(`  ✅ ${pc.green("Auth")}: Connected as ${pc.cyan(emailMatch ? emailMatch[1] : "Cloudflare User")}`);
  }

  // 2. Configuration Files
  const configPath = existsSync(path.join(rootDir, "bunflare.config.ts")) 
    ? "bunflare.config.ts" 
    : existsSync(path.join(rootDir, "cloudflare.config.ts")) 
      ? "cloudflare.config.ts" 
      : null;

  if (configPath) {
    console.log(`  ✅ ${pc.green("Config")}: Found ${pc.cyan(configPath)}`);
  } else {
    console.warn(`  ⚠️  ${pc.yellow("Warning")}: No bunflare.config.ts found. Using defaults.`);
    warnings++;
  }

  // 3. Wrangler Configuration & Build Chain
  const wranglerPath = path.join(rootDir, "wrangler.jsonc");
  const wranglerTomlPath = path.join(rootDir, "wrangler.toml");
  let wrangler: any = null;
  
  if (existsSync(wranglerPath) || existsSync(wranglerTomlPath)) {
    const isJsonc = existsSync(wranglerPath);
    console.log(`  ✅ ${pc.green("Wrangler")}: Found ${pc.cyan(isJsonc ? "wrangler.jsonc" : "wrangler.toml")}`);
    
    if (isJsonc) {
      try {
        const content = readFileSync(wranglerPath, "utf-8");
        const cleanJson = content
          .replace(/\/\/.*/g, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/,\s*([\]}])/g, "$1");
        wrangler = JSON.parse(cleanJson);

        // Build Command Check
        if (!wrangler.build || !wrangler.build.command || !wrangler.build.command.includes("bunflare build")) {
          console.error(`  ❌ ${pc.red("Error")}: Missing build command in wrangler.jsonc.`);
          console.log(pc.dim("     Expected: \"build\": { \"command\": \"bunflare build\" }"));
          errors++;
        } else {
          console.log(`  ✅ ${pc.green("Build")}: Build chain correctly configured.`);
        }

        // Main Entry Check
        const outdir = config.outdir || "./dist";
        const expectedMain = path.join(outdir, "index.js").replace(/^\.\//, "");
        if (wrangler.main && wrangler.main.replace(/^\.\//, "") !== expectedMain) {
           console.error(`  ❌ ${pc.red("Error")}: "main" should be "${expectedMain}" (currently: "${wrangler.main}")`);
           errors++;
        }

        // Node Compat Check
        if (!(wrangler.compatibility_flags || []).includes("nodejs_compat")) {
           console.warn(`  ⚠️  ${pc.yellow("Warning")}: "nodejs_compat" flag missing. Recommended for modern dependencies.`);
           warnings++;
        }
      } catch (e) {
        console.error(`  ❌ ${pc.red("Error")}: Failed to parse wrangler.jsonc.`);
        errors++;
      }
    }
  } else {
    console.error(`  ❌ ${pc.red("Error")}: wrangler configuration not found.`);
    errors++;
  }

  // 4. Infrastructure Synchronization Check
  if (wrangler) {
    const report = await provisioner.getInconsistencyReport();
    if (report.length > 0) {
      console.warn(`  ⚠️  ${pc.yellow("Warning")}: ${report.length} infrastructure resources are out of sync.`);
      report.forEach(r => console.log(pc.dim(`     - ${r.binding} (${r.type}) missing or invalid ID`)));
      warnings++;

      if (options.fix) {
        console.log("");
        await provisioner.provisionMissingResources(options.auto);
      }
    } else {
      console.log(`  ✅ ${pc.green("Infra")}: All infrastructure resources verified on Cloudflare.`);
    }
  }

  // 5. Package Dependencies
  const pkgPath = path.join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (fluidResources.some((f: any) => f.type === "browser") && !deps["@cloudflare/puppeteer"]) {
      console.error(`  ❌ ${pc.red("Error")}: "browser" used but "@cloudflare/puppeteer" not in package.json.`);
      console.log(pc.dim("     Run: bun add @cloudflare/puppeteer"));
      errors++;
    }

    if (fluidResources.some((f: any) => f.type === "container") && !deps["@cloudflare/containers"]) {
      console.error(`  ❌ ${pc.red("Error")}: "containers" used but "@cloudflare/containers" not in package.json.`);
      errors++;
    }
    
    if (!deps["bunflare"]) {
      console.error(`  ❌ ${pc.red("Error")}: "bunflare" not found in package.json dependencies.`);
      errors++;
    }

    // 6. Browser Remote Bindings Check
    if (fluidResources.some((f: any) => f.type === "browser")) {
      const wranglerConfig = wrangler;
      if (wranglerConfig && (!wranglerConfig.browser || wranglerConfig.browser.remote !== true)) {
        console.warn(`\n  ⚠️  ${pc.yellow("Warning")}: Browser Rendering detected but Remote Binding is missing.`);
        console.log(pc.dim("     Recommended: Add { \"remote\": true } to the \"browser\" section in wrangler.jsonc."));
        
        if (options.fix) {
          const confirmed = await p.confirm({
            message: `Enable remote browser rendering in wrangler.jsonc?`,
            initialValue: true
          });
          if (confirmed) {
            provisioner.configManager.addBinding("browser", { remote: true });
            console.log(`  ✅ ${pc.green("Wrangler")}: Browser remote rendering enabled.`);
          }
        } else {
          console.log(pc.dim("     This allows local develop with the Cloudflare Browser Rendering API without forcing slow --remote mode."));
          warnings++;
        }
      }
    }
  }

  console.log(`\n${pc.bold("[bunflare] 🏁 Diagnostic complete:")} ${errors} errors, ${warnings} warnings.`);
  
  if (errors === 0 && warnings === 0) {
    console.log(pc.green("✨ Your project is in perfect health!"));
  } else if (errors === 0) {
    console.log(pc.yellow("💡 Project is functional but has warnings. Recommended to fix before deployment."));
  } else {
    console.log(pc.red("🚨 Project has critical configuration issues. Please fix errors above."));
    process.exit(1);
  }
}
