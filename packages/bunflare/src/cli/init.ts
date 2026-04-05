import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

/**
 * Initializes a new bunflare project by generating recommendation config files.
 */
export async function runInit() {
  const rootDir = process.cwd();
  console.log("[bunflare] 🚀 Initializing project configuration...");

  // 1. Detect Project Info
  let projectName = "my-bun-worker";
  let hasTailwind = false;
  const pkgPath = path.join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) projectName = pkg.name;

      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["bun-plugin-tailwind"]) {
        hasTailwind = true;
      }
    } catch (e) { }
  }

  // 2. Detect Entry Point
  const entryPoints = [
    "src/index.ts",
    "src/index.js",
    "index.ts",
    "index.js",
    "src/main.ts",
    "src/main.js"
  ];
  let detectedEntry = "./src/index.ts";
  for (const ep of entryPoints) {
    if (existsSync(path.join(rootDir, ep))) {
      detectedEntry = `./${ep}`;
      break;
    }
  }

  // 3. Generate wrangler.jsonc
  const wranglerPath = path.join(rootDir, "wrangler.jsonc");
  if (!existsSync(wranglerPath) && !existsSync(path.join(rootDir, "wrangler.toml"))) {
    const wranglerConfig = {
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": projectName,
      "main": "./dist/index.js",
      "compatibility_date": new Date().toISOString().split("T")[0],
      "compatibility_flags": ["nodejs_compat"],
      "assets": {
        "directory": "./dist",
        "binding": "ASSETS"
      },
      "kv_namespaces": [
        {
          "binding": "KV",
          "id": "placeholder-id"
        }
      ],
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": `${projectName}-db`,
          "database_id": "placeholder-id"
        }
      ],
      "r2_buckets": [
        {
          "binding": "BUCKET",
          "bucket_name": `${projectName}-bucket`
        }
      ],
      "observability": {
        "enabled": true
      },
      "build": {
        "command": "bun --bun run bunflare build -q",
        "watch_dir": "src"
      }
    };

    await Bun.write(wranglerPath, JSON.stringify(wranglerConfig, null, 2));
    console.log("  ✅ Generated wrangler.jsonc");
  } else {
    console.log("  ⚠️ wrangler configuration already exists, skipping...");
  }

  // 4. Generate bunflare.config.ts
  const configPath = path.join(rootDir, "bunflare.config.ts");
  const configPathAlt = path.join(rootDir, "cloudflare.config.ts");

  if (!existsSync(configPath) && !existsSync(configPathAlt)) {
    const configContent = `import { defineConfig } from "bunflare/config";
${hasTailwind ? 'import tailwind from "bun-plugin-tailwind";\n' : ""}
export default defineConfig({
  entrypoint: "${detectedEntry}",
${hasTailwind ? `
  plugins: [
    tailwind
  ],
` : ""}
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "none"
});
`;
    await Bun.write(configPath, configContent);
    console.log("  ✅ Generated bunflare.config.ts");
  } else {
    console.log("  ⚠️ bunflare.config.ts already exists, skipping...");
  }

  // 5. Update package.json with dependencies and scripts
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

      // Add dependencies
      pkg.devDependencies = pkg.devDependencies || {};
      if (!pkg.devDependencies.bunflare && !pkg.dependencies?.bunflare) {
        pkg.devDependencies.bunflare = "latest";
      }
      if (!pkg.devDependencies.wrangler && !pkg.dependencies?.wrangler) {
        pkg.devDependencies.wrangler = "latest";
      }

      // Add scripts
      pkg.scripts = pkg.scripts || {};
      pkg.scripts["dev"] = "bunflare dev";
      pkg.scripts["deploy"] = "bunflare build --production && wrangler deploy";
      pkg.scripts["cf-typegen"] = "wrangler types --env-interface CloudflareBindings";

      await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      console.log("  ✅ Updated package.json with wrangler, bunflare, and scripts");
    } catch (e) {
      console.error("  ❌ Failed to update package.json:", e);
    }
  }

  console.log("\n[bunflare] ✨ Initialization complete!");
  console.log("[bunflare] 💡 Next steps:");
  console.log("    1. Run 'bun install' to install dependencies.");
  console.log("    2. Run 'bun run dev' to start development server.");
  console.log("    3. Run 'bun run cf-typegen' to generate binding types.");
}
