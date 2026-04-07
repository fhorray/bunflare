import { loadConfig } from "../config";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { Provisioner, type ResourceInfo } from "./provisioner";
import { ConfigManager } from "./config-manager";
import pc from "picocolors";
import { log } from "./logger";
import * as p from "@clack/prompts";
import { scanDirectoryForBindings } from "./scanner";

/**
 * Diagnostic tool to verify project configuration and health.
 */
export async function runDoctor(options: { rootDir?: string; fix?: boolean; auto?: boolean } = {}) {
  const rootDir = options.rootDir || process.cwd();
  
  p.intro(`${pc.bgYellow(pc.black(" Bunflare "))} ${pc.bold("Project Diagnostics")}`);
  p.log.step(pc.dim(`Checking health in: ${rootDir}`));

  let errorsCount = 0;
  let warningsCount = 0;

  const sSetup = p.spinner();
  sSetup.start("Analyzing local project structure...");
  const config = await loadConfig(rootDir);
  const sourceDir = existsSync(path.join(rootDir, "src")) ? path.join(rootDir, "src") : rootDir;
  const fluidResources = scanDirectoryForBindings(sourceDir);
  let provisioner: Provisioner | null = null;
  sSetup.stop("Local analysis complete");
  p.log.step(`Project scanning: ${pc.green("Done")}`);

  const printSection = (title: string) => {
    console.log(`\n${pc.cyan("◆")}  ${pc.bold(title)}`);
  };

  const printItem = (status: "ok" | "warn" | "error" | "info", msg: string, hint?: string) => {
    const icon = {
      ok: pc.green("✅"),
      warn: pc.yellow("⚠️ "),
      error: pc.red("❌"),
      info: pc.blue("ℹ️ "),
    }[status];
    
    console.log(`${pc.dim("│")}  ${icon} ${msg}`);
    if (hint) {
      console.log(`${pc.dim("│")}     ${pc.dim("└─")} ${pc.italic(pc.dim(hint))}`);
    }
  };

  // 1. Authentication Check
  printSection("Authentication");
  const sAuth = p.spinner();
  sAuth.start("Verifying Cloudflare session...");
  
  const authResult = spawnSync("bunx", ["wrangler", "whoami"], {
    stdio: "pipe",
    encoding: "utf-8",
    shell: true,
  });
  
  sAuth.stop("Session verified");
  p.log.step(`Cloudflare Connection: ${pc.green("Active")}`);

  const isLoggedIn = authResult.status === 0 && !authResult.stdout.toLowerCase().includes("not logged in");

  if (!isLoggedIn) {
    printItem("error", "Not logged in to Cloudflare", `Run ${pc.bold("wrangler login")} to continue.`);
    errorsCount++;
  } else {
    let email = "Cloudflare User";
    // Universal regex for email in various Wrangler output formats
    const emailMatch = authResult.stdout.match(/email\s+([^\s"':,]+@[^\s"':,]+\.[a-z]{2,})/i) || 
                       authResult.stdout.match(/associated with the email\s+([^\s"':,]+)/i) ||
                       authResult.stdout.match(/email: "(.+?)"/);
    
    if (emailMatch && emailMatch[1]) {
      email = emailMatch[1].replace(/[.,]$/, "").replace(/^"/, "").replace(/"$/, "");
    }
    
    printItem("ok", `Authenticated as ${pc.cyan(email)}`);
    
    // Now that we have the email, we can instantiate the provisioner with smarter account matching
    provisioner = new Provisioner(rootDir, email);
  }

  // 2. Configuration Files & Wrangler
  printSection("Configuration");
  const candidates = ["bunflare.config.ts", "bunflare.config.js", "cloudflare.config.ts", "cloudflare.config.js"];
  const configPath = candidates.find(c => existsSync(path.join(rootDir, c)));

  if (configPath) {
    printItem("ok", `Found ${pc.cyan(configPath)}`);
  } else {
    printItem("warn", "No configuration file found", "Using default settings. Consider running 'bunflare init'.");
    warningsCount++;
  }

  const wranglerPath = path.join(rootDir, "wrangler.jsonc");
  const wranglerTomlPath = path.join(rootDir, "wrangler.toml");
  let wrangler: any = null;
  
  if (existsSync(wranglerPath) || existsSync(wranglerTomlPath)) {
    const isJsonc = existsSync(wranglerPath);
    printItem("ok", `Found ${pc.cyan(isJsonc ? "wrangler.jsonc" : "wrangler.toml")}`);
    
    if (isJsonc) {
      try {
        const content = readFileSync(wranglerPath, "utf-8");
        const cleanJson = content.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/,\s*([\]}])/g, "$1");
        wrangler = JSON.parse(cleanJson);

        if (!wrangler.build || !wrangler.build.command || !wrangler.build.command.includes("bunflare build")) {
          printItem("error", "Incorrect build command in wrangler.jsonc", `Expected: "build": { "command": "bunflare build" }`);
          errorsCount++;
        } else {
          printItem("ok", "Build chain correctly configured");
        }

        const outdir = config.outdir || "./dist";
        const expectedMain = path.join(outdir, "index.js").replace(/^\.\//, "");
        if (wrangler.main && wrangler.main.replace(/^\.\//, "") !== expectedMain) {
          printItem("error", `Invalid entrypoint in wrangler.jsonc`, `Should be "${expectedMain}" (currently: "${wrangler.main}")`);
          errorsCount++;
        }

        if (!(wrangler.compatibility_flags || []).includes("nodejs_compat")) {
          printItem("warn", "Missing 'nodejs_compat' flag", "Recommended for modern NPM dependencies.");
          warningsCount++;
        }
      } catch (e) {
        printItem("error", "Failed to parse wrangler.jsonc");
        errorsCount++;
      }
    }
  } else {
    printItem("error", "wrangler configuration not found");
    errorsCount++;
  }

  // 3. Infrastructure Synchronization
  printSection("Infrastructure");
  if (wrangler && provisioner) {
    // Resolve account before starting the spinner to avoid UI overlap
    await provisioner.ensureAccountID();
    
    const sInfra = p.spinner();
    sInfra.start("Scanning Cloudflare resources...");
    const report = await provisioner.getInconsistencyReport((msg: string) => sInfra.message(msg));
    sInfra.stop("Scan complete");
    p.log.step(`Infrastructure sync: ${pc.green("Verified")}`);

    // Durable Object Migrations Check
    const doBindings = wrangler.durable_objects?.bindings || [];
    if (doBindings.length > 0 && (!wrangler.migrations || wrangler.migrations.length === 0)) {
       printItem("warn", "Missing Durable Object migrations", "Cloudflare requires migrations to initialize DO classes.");
       if (options.fix) {
          const classes = doBindings.map((b: any) => b.class_name || b.name);
          const configManager = new ConfigManager(rootDir);
          configManager.addMigration("v1", classes);
          printItem("ok", "Added 'v1' migration to wrangler.jsonc");
       } else {
          warningsCount++;
       }
    }

    if (report.length > 0) {
      printItem("warn", `${report.length} resources are out of sync`, `Run 'bunflare doctor -f' to fix.`);
      report.forEach((r: ResourceInfo) => console.log(`${pc.dim("│")}     ${pc.dim("-")} ${pc.dim(r.binding)} ${pc.dim(`(${r.type})`)}`));
      warningsCount++;

      if (options.fix) {
        console.log(`${pc.dim("│")}`);
        await provisioner.provisionMissingResources(options.auto);
        
        // Reload wrangler config after fixes
        if (existsSync(wranglerPath)) {
          const content = readFileSync(wranglerPath, "utf-8");
          const cleanJson = content.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/,\s*([\]}])/g, "$1");
          wrangler = JSON.parse(cleanJson);
        }
      }
    } else {
      printItem("ok", "All infrastructure resources verified on Cloudflare");
    }
  } else {
    printItem("info", "Skipping infrastructure check (no wrangler config)");
  }

  // 4. Dependencies
  printSection("Dependencies");
  const pkgPath = path.join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (fluidResources.some((f: any) => f.type === "browser") && !deps["@cloudflare/puppeteer"]) {
      printItem("error", "Missing '@cloudflare/puppeteer'", "Required for browser rendering.");
      
      if (options.fix) {
        const confirmed = await p.confirm({
          message: `Install ${pc.cyan("@cloudflare/puppeteer")}?`,
          initialValue: true
        });
        if (p.isCancel(confirmed)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        if (confirmed) {
          const s = p.spinner();
          s.start("Installing @cloudflare/puppeteer...");
          spawnSync("bun", ["add", "@cloudflare/puppeteer"], { cwd: rootDir });
          s.stop("Installed @cloudflare/puppeteer");
        }
      } else {
        errorsCount++;
      }
    }

    if (fluidResources.some((f: any) => f.type === "container") && !deps["@cloudflare/containers"]) {
      printItem("error", "Missing '@cloudflare/containers'", "Required for containers support.");
      
      if (options.fix) {
        const confirmed = await p.confirm({
          message: `Install ${pc.cyan("@cloudflare/containers")}?`,
          initialValue: true
        });
        if (p.isCancel(confirmed)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        if (confirmed) {
          const s = p.spinner();
          s.start("Installing @cloudflare/containers...");
          spawnSync("bun", ["add", "@cloudflare/containers"], { cwd: rootDir });
          s.stop("Installed @cloudflare/containers");
        }
      } else {
        errorsCount++;
      }
    }
    
    if (!deps["bunflare"]) {
      printItem("error", "'bunflare' not found in package.json");
      errorsCount++;
    } else {
      printItem("ok", "Core dependencies present");
    }
    p.log.step(`Dependencies: ${pc.green("Present")}`);
  }

  // 5. Final Report
  const totalIssues = errorsCount + warningsCount;
  const summaryMsg = `${errorsCount} error${errorsCount === 1 ? "" : "s"}, ${warningsCount} warning${warningsCount === 1 ? "" : "s"}`;
  
  if (errorsCount === 0 && warningsCount === 0) {
    p.outro(`${pc.green("✨ Perfect Health!")} All systems nominal.`);
  } else if (errorsCount === 0) {
    p.outro(`${pc.yellow("⚠️  Review Recommended:")} ${summaryMsg}`);
  } else {
    p.outro(`${pc.red("🚨 Critical Issues Found:")} ${summaryMsg}`);
    process.exit(1);
  }
}
