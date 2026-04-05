import { loadConfig } from "../config";
import path from "path";
import { existsSync, readFileSync } from "node:fs";

/**
 * Diagnostic tool to verify project configuration.
 */
export async function runDoctor(options: { rootDir?: string } = {}) {
  const rootDir = options.rootDir || process.cwd();
  console.log(`[bunflare] 🩺 Running project diagnostics in ${rootDir}...\n`);

  let errors = 0;
  let warnings = 0;

  // 1. Config Check
  const config = await loadConfig(rootDir);
  const configPath = existsSync(path.join(rootDir, "bunflare.config.ts")) 
    ? "bunflare.config.ts" 
    : existsSync(path.join(rootDir, "cloudflare.config.ts")) 
      ? "cloudflare.config.ts" 
      : null;

  if (configPath) {
    console.log(`  ✅ Found config: ${configPath}`);
  } else {
    console.warn(`  ⚠️ Warning: No bunflare.config.ts or cloudflare.config.ts found. Using defaults.`);
    warnings++;
  }

  // 2. Wrangler Check
  const wranglerPath = path.join(rootDir, "wrangler.jsonc");
  const wranglerTomlPath = path.join(rootDir, "wrangler.toml");
  
  if (existsSync(wranglerPath) || existsSync(wranglerTomlPath)) {
    const isJsonc = existsSync(wranglerPath);
    console.log(`  ✅ Found wrangler configuration: ${isJsonc ? "wrangler.jsonc" : "wrangler.toml"}`);
    
    // Parse wrangler.jsonc (resiliently)
    if (isJsonc) {
      try {
        const content = readFileSync(wranglerPath, "utf-8");
        // Robust comment and trailing comma stripping
        const cleanJson = content
          .replace(/\/\/.*/g, "")             // Strip // line comments
          .replace(/\/\*[\s\S]*?\*\//g, "")   // Strip /* */ block comments
          .replace(/,\s*([\]}])/g, "$1");     // Strip trailing commas (Crucial!)
        
        const wrangler = JSON.parse(cleanJson);

        // Check main field
        const outdir = config.outdir || "./dist";
        const expectedMain = path.join(outdir, "index.js");
        if (wrangler.main !== expectedMain && wrangler.main !== expectedMain.replace(/^\.\//, "")) {
           console.error(`  ❌ Error: "main" in wrangler.jsonc should be "${expectedMain}" (currently: "${wrangler.main}")`);
           errors++;
        } else {
           console.log(`  ✅ "main" field correctly points to ${expectedMain}`);
        }

        // Check assets
        if (wrangler.assets?.directory !== outdir && wrangler.assets?.directory !== outdir.replace(/^\.\//, "")) {
           console.error(`  ❌ Error: "assets.directory" in wrangler.jsonc should be "${outdir}" (currently: "${wrangler.assets?.directory}")`);
           errors++;
        } else {
           console.log(`  ✅ "assets.directory" correctly points to ${outdir}`);
        }

        // Check node_compat
        const flags = wrangler.compatibility_flags || [];
        if (!flags.includes("nodejs_compat")) {
           console.warn(`  ⚠️ Warning: "nodejs_compat" not found in compatibility_flags. Required for some node: imports.`);
           warnings++;
        }

        // Check compatibility_date
        const dateStr = wrangler.compatibility_date;
        if (dateStr) {
            const year = parseInt(dateStr.split("-")[0]);
            if (year < 2024) {
               console.warn(`  ⚠️ Warning: compatibility_date is older than 2024. Update for full feature support.`);
               warnings++;
            }
        } else {
            console.error(`  ❌ Error: "compatibility_date" is missing in wrangler.jsonc`);
            errors++;
        }

      } catch (e) {
        console.error(`  ❌ Error: Failed to parse wrangler.jsonc:`, e);
        errors++;
      }
    }
  } else {
    console.error(`  ❌ Error: wrangler.jsonc or wrangler.toml not found.`);
    errors++;
  }

  // 3. Output directory check
  const outdir = config.outdir || "./dist";
  if (!existsSync(path.join(rootDir, outdir))) {
      console.warn(`  ⚠️ Warning: Output directory "${outdir}" not found. Run "bunflare build" first.`);
      warnings++;
  }

  console.log(`\n[bunflare] 🏁 Diagnostic complete: ${errors} errors, ${warnings} warnings.`);
  if (errors === 0 && warnings === 0) {
      console.log(`[bunflare] ✨ Your project is in perfect health!`);
  } else if (errors === 0) {
      console.log(`[bunflare] 💡 Project is functional but could use some optimization.`);
  } else {
      console.error(`[bunflare] 🚨 Project has configuration errors that may break functionality.`);
      process.exit(1);
  }
}
