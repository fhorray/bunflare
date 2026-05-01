import { join } from "path";
import { existsSync, writeFileSync, readFileSync } from "fs";
import pc from "picocolors";

/**
 * Initializes a new Bunflare project in the current directory.
 */
export async function init() {
  console.log(`${pc.cyan("🚀 Initializing Bunflare project...")}\n`);

  const cwd = process.cwd();

  // 1. Check/Modify package.json
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    console.log(`${pc.yellow("⚠ No package.json found. Creating a default one...")}`);
    writeFileSync(pkgPath, JSON.stringify({
      name: "bunflare-app",
      version: "1.0.0",
      type: "module",
      scripts: {}
    }, null, 2));
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg.type = "module";
    pkg.scripts = {
      ...pkg.scripts,
      "dev": "bunflare dev",
      "build": "bunflare build",
      "deploy": "bunflare deploy",
      "cf-typegen": "wrangler types --env-interface CloudflareBindings"
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`${pc.green("✓")} Updated package.json (scripts + ESM)`);
  } catch (e) {
    console.error(`${pc.red("✖ Failed to update package.json")}`);
  }

  // 2. Discover entrypoint
  let entrypoint = "./index.ts";
  if (existsSync(join(cwd, "src", "index.ts"))) {
    entrypoint = "./src/index.ts";
  } else if (!existsSync(join(cwd, "index.ts")) && !existsSync(join(cwd, "src", "index.ts"))) {
    // Create a basic index.ts if nothing exists
    console.log(`${pc.yellow("⚠ No entrypoint found. Creating a basic src/index.ts...")}`);
    if (!existsSync(join(cwd, "src"))) {
      const { mkdirSync } = await import("fs");
      mkdirSync(join(cwd, "src"));
    }
    entrypoint = "./src/index.ts";
    writeFileSync(join(cwd, entrypoint), `import { serve } from "bun";
import homepage from "./index.html";

const server = serve({
  routes: {
    "/": homepage,
    "/api/status": () => Response.json({ status: "online", runtime: "bunflare" })
  }
});

console.log(\`Server running at \${server.url}\`);
export default server;
`);

    // Create a basic index.html to go with it
    writeFileSync(join(cwd, "src", "index.html"), `<!DOCTYPE html>
<html>
<head><title>Bunflare App</title></head>
<body><h1>Hello from Bunflare!</h1></body>
</html>`);
  }

  // 3. Create bunflare.config.ts
  const configPath = join(cwd, "bunflare.config.ts");
  if (!existsSync(configPath)) {
    const configContent = `import type { BunflareConfig } from "bunflare";

export default {
  entrypoint: "${entrypoint}",
  frontend: {
    entrypoint: "${entrypoint.endsWith(".html") ? entrypoint : entrypoint.replace(/\.ts$/, ".html")}",
    outdir: "./dist/public",
  },
} satisfies BunflareConfig;
`;
    writeFileSync(configPath, configContent);
    console.log(`${pc.green("✓")} Created bunflare.config.ts`);
  }

  // 4. Create global.d.ts
  const globalDtsPath = join(cwd, "global.d.ts");
  if (!existsSync(globalDtsPath)) {
    const dtsContent = `/**
 * Project-specific environment augmentations for bunflare.
 * Augment the Bun.Env interface to include our Cloudflare bindings.
 * This is how @types/bun recommends customizing the Bun.env type.
 */
declare global {
  namespace Bun {
    interface Env extends CloudflareBindings { }
  }
}

/**
 * Asset declarations
 */
declare module "*.svg" {
  const content: string;
  export default content;
}
declare module "*.png" {
  const content: string;
  export default content;
}
declare module "*.jpg" {
  const content: string;
  export default content;
}
declare module "*.html" {
  const content: string;
  export default content;
}
`;
    writeFileSync(globalDtsPath, dtsContent);
    console.log(`${pc.green("✓")} Created global.d.ts`);
  }

  // 5. Create wrangler.jsonc
  const wranglerPath = join(cwd, "wrangler.jsonc");
  if (!existsSync(wranglerPath)) {
    const today = new Date().toISOString().split('T')[0];
    const wranglerContent = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "bunflare-app",
  "main": "dist/index.js",
  "compatibility_date": "${today}",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "assets": {
    "binding": "ASSETS",
    "directory": "dist/public"
  }
}
`;
    writeFileSync(wranglerPath, wranglerContent);
    console.log(`${pc.green("✓")} Created wrangler.jsonc`);
  }

  // 6. Update tsconfig.json if possible
  const tsConfigPath = join(cwd, "tsconfig.json");
  if (existsSync(tsConfigPath)) {
    try {
      const tsconfig = JSON.parse(readFileSync(tsConfigPath, "utf-8").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, ""));
      tsconfig.compilerOptions = tsconfig.compilerOptions || {};
      const types = tsconfig.compilerOptions.types || [];
      if (!types.includes("bun")) {
        types.push("bun");
      }
      tsconfig.compilerOptions.types = types;

      const include = tsconfig.include || [];
      if (!include.includes("global.d.ts")) include.push("global.d.ts");
      if (!include.includes("worker-configuration.d.ts")) include.push("worker-configuration.d.ts");
      tsconfig.include = include;

      writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));
      console.log(`${pc.green("✓")} Updated tsconfig.json`);
    } catch (e) {
      console.log(`${pc.yellow("⚠ Could not automatically update tsconfig.json. Please ensure 'bun' types and global.d.ts are included.")}`);
    }
  }

  // 7. Install Wrangler and Generate Types
  console.log(`\n${pc.cyan("📦 Installing latest wrangler and generating types...")}`);
  const { spawnSync } = await import("child_process");

  const install = spawnSync("bun", ["add", "-d", "wrangler"], { stdio: "inherit" });
  if (install.status === 0) {
    console.log(`${pc.green("✓")} Installed latest wrangler`);

    // Run typegen
    const typegen = spawnSync("bunx", ["wrangler", "types", "--env-interface", "CloudflareBindings"], { stdio: "inherit" });
    if (typegen.status === 0) {
      console.log(`${pc.green("✓")} Generated worker-configuration.d.ts`);
    }
  } else {
    console.log(`${pc.yellow("⚠ Failed to install wrangler automatically. Please run 'bun add -d wrangler' manually.")}`);
  }

  console.log(`\n${pc.bold(pc.green("✨ Bunflare initialization complete!"))}`);
  console.log(`\nNext steps:`);
  console.log(`1. Run ${pc.cyan("bun run dev")} to start your fullstack development server.\n`);
}
