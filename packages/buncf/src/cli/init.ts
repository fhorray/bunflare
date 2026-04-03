import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

/**
 * Initializes a new buncf project by generating recommendation config files.
 */
export async function runInit() {
  const rootDir = process.cwd();
  console.log("[buncf] 🚀 Initializing project configuration...");

  // 1. Detect Project Name
  let projectName = "my-bun-worker";
  const pkgPath = path.join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) projectName = pkg.name;
    } catch (e) {}
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
      "build": {
        "command": "bunx --bun buncf build"
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
      }
    };

    await Bun.write(wranglerPath, JSON.stringify(wranglerConfig, null, 2));
    console.log("  ✅ Generated wrangler.jsonc");
  } else {
    console.log("  ⚠️ wrangler configuration already exists, skipping...");
  }

  // 4. Generate cloudflare.config.ts
  const configPath = path.join(rootDir, "buncf.config.ts");
  const configPathAlt = path.join(rootDir, "cloudflare.config.ts");
  
  if (!existsSync(configPath) && !existsSync(configPathAlt)) {
    const configContent = `import { defineConfig } from "buncf/config";

export default defineConfig({
  /** The entry point of your worker */
  entrypoint: "${detectedEntry}",
  
  /** Output directory for the bundle */
  outdir: "./dist",

  /** Execution target */
  target: "browser",

  /** Global build constants */
  define: {
    "VERSION": JSON.stringify("1.0.0"),
  },

  /** External modules to exclude from bundling */
  external: [],

  /** Minification settings */
  minify: true,

  /** Sourcemap generation */
  sourmap: "none"
});
`;
    await Bun.write(configPath, configContent);
    console.log("  ✅ Generated buncf.config.ts");
  } else {
    console.log("  ⚠️ buncf.config.ts already exists, skipping...");
  }

  console.log("\n[buncf] ✨ Initialization complete!");
  console.log("[buncf] 💡 You can now run your project with: wrangler dev");
  console.log("[buncf] 💡 Run 'bun run cf-typegen' to generate binding types.");
}
