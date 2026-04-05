import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { log } from "./logger";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { Provisioner } from "./provisioner";

/**
 * Initializes a new bunflare project by generating recommendation config files.
 * Provides an interactive onboarding experience using @clack/prompts.
 */
export async function runInit(options: { yes?: boolean, rootDir?: string } = {}) {
  const rootDir = options.rootDir || process.cwd();
  
  if (!options.yes) {
    p.intro(pc.bgMagenta(pc.bold(" ☁️  Bunflare Initialization ")));
  } else {
    log.header("Initializing project (Automatic Mode)...", "magenta");
  }

  // 1. Detect Initial Project Info
  let projectName = "my-bun-worker";
  let hasTailwind = false;
  const pkgPath = path.join(rootDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) projectName = pkg.name;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["bun-plugin-tailwind"]) hasTailwind = true;
    } catch (e) { }
  }

  // 2. Interactive Prompts (Skipped if -y is used)
  let selectedBindings: string[] = [];
  let shouldAutoProvision = false;
  
  if (!options.yes) {
    const name = await p.text({
      message: "What is the name of your project?",
      placeholder: projectName,
      initialValue: projectName,
    });

    if (p.isCancel(name)) {
      p.cancel("Initialization cancelled.");
      process.exit(0);
    }
    projectName = name as string;

    const bindings = await p.multiselect({
      message: "Which Cloudflare bindings would you like to include?",
      options: [
        { value: "kv", label: "KV Namespace", hint: "Key-Value storage" },
        { value: "d1", label: "D1 Database", hint: "Relational SQL (SQLite)" },
        { value: "r2", label: "R2 Bucket", hint: "Object storage (S3 compatible)" },
        { value: "do", label: "Durable Objects", hint: "Stateful coordination" },
        { value: "workflows", label: "Workflows", hint: "Durable orchestration" },
        { value: "browser", label: "Browser Rendering", hint: "Headless Puppeteer sessions" },
        { value: "queues", label: "Queues", hint: "Asynchronous messaging" },
        { value: "containers", label: "Containers", hint: "Multi-language containers" },
        { value: "ai", label: "AI", hint: "Workers AI (Llama, etc.)" },
      ],
      required: false,
    });

    if (p.isCancel(bindings)) {
      p.cancel("Initialization cancelled.");
      process.exit(0);
    }
    selectedBindings = bindings as string[];

    if (selectedBindings.length > 0) {
      const provision = await p.confirm({
        message: "Would you like to provision these resources now? (Requires Cloudflare login)",
        initialValue: false,
      });
      if (!p.isCancel(provision) && provision) {
        shouldAutoProvision = true;
      }
    }
  }

  const s = p.spinner();
  if (!options.yes) s.start("Generating configurations...");

  // 3. Detect Entry Point
  const entryPoints = ["src/index.ts", "src/index.js", "index.ts", "index.js", "src/main.ts", "src/main.js"];
  let detectedEntry = "./src/index.ts";
  for (const ep of entryPoints) {
    if (existsSync(path.join(rootDir, ep))) {
      detectedEntry = `./${ep}`;
      break;
    }
  }

  // 4. Generate wrangler.jsonc
  const wranglerPath = path.join(rootDir, "wrangler.jsonc");
  if (!existsSync(wranglerPath) && !existsSync(path.join(rootDir, "wrangler.toml"))) {
    const wranglerConfig: any = {
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": projectName,
      "main": "./dist/index.js",
      "compatibility_date": new Date().toISOString().split("T")[0],
      "compatibility_flags": ["nodejs_compat"],
      "assets": {
        "directory": "./dist",
        "binding": "ASSETS"
      },
      "observability": {
        "enabled": true
      },
      "build": {
        "command": "bun --bun run bunflare build -q",
        "watch_dir": "src"
      }
    };

    // Inject selected bindings (placeholders initially)
    if (selectedBindings.includes("kv")) {
      wranglerConfig.kv_namespaces = [{ binding: "KV", id: "placeholder-id" }];
    }
    if (selectedBindings.includes("d1")) {
      wranglerConfig.d1_databases = [{ binding: "DB", database_name: `${projectName}-db`, database_id: "placeholder-id" }];
    }
    if (selectedBindings.includes("r2")) {
      wranglerConfig.r2_buckets = [{ binding: "BUCKET", bucket_name: `${projectName}-bucket` }];
    }
    if (selectedBindings.includes("do")) {
      wranglerConfig.durable_objects = { bindings: [{ name: "MY_DO", class_name: "MyDurableObject" }] };
    }
    if (selectedBindings.includes("workflows")) {
      wranglerConfig.workflows = [{ name: "MY_WORKFLOW", binding: "MY_WORKFLOW", class_name: "MyWorkflow" }];
    }
    if (selectedBindings.includes("browser")) {
      wranglerConfig.browser = { binding: "BROWSER" };
    }
    if (selectedBindings.includes("queues")) {
      wranglerConfig.queues = { producers: [{ queue: "my-queue", binding: "QUEUE" }] };
    }
    if (selectedBindings.includes("containers")) {
      wranglerConfig.containers = [{ name: "MY_CONTAINER" }];
    }
    if (selectedBindings.includes("ai")) {
      wranglerConfig.ai = { binding: "AI" };
    }

    await Bun.write(wranglerPath, JSON.stringify(wranglerConfig, null, 2));
    if (!options.yes) s.message("wrangler.jsonc generated");
    else log.success("wrangler.jsonc generated");
  }

  // 5. Generate bunflare.config.ts
  const configPath = path.join(rootDir, "bunflare.config.ts");
  if (!existsSync(configPath) && !existsSync(path.join(rootDir, "cloudflare.config.ts"))) {
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
    if (!options.yes) s.message("bunflare.config.ts generated");
    else log.success("bunflare.config.ts generated");
  }

  // 6. Update package.json
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      pkg.devDependencies = pkg.devDependencies || {};
      if (!pkg.devDependencies.bunflare && !pkg.dependencies?.bunflare) pkg.devDependencies.bunflare = "latest";
      if (!pkg.devDependencies.wrangler && !pkg.dependencies?.wrangler) pkg.devDependencies.wrangler = "latest";
      
      // Auto-add puppeteer if browser selected
      if (selectedBindings.includes("browser")) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies["@cloudflare/puppeteer"] = "latest";
      }

      pkg.scripts = pkg.scripts || {};
      pkg.scripts["dev"] = "bunflare dev";
      pkg.scripts["deploy"] = "bunflare deploy";
      pkg.scripts["cf-typegen"] = "wrangler types --env-interface CloudflareBindings";

      await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      if (!options.yes) s.message("package.json updated");
      else log.success("package.json updated");
    } catch (e) { }
  }

  if (shouldAutoProvision) {
    if (!options.yes) s.stop(pc.green("Base configuration complete!"));
    const provisioner = new Provisioner(rootDir);
    // Filtering supported bindings in auto-provision
    const supported = selectedBindings.filter(b => ["d1", "kv", "r2"].includes(b));
    await provisioner.provisionMissingResources();
  } else {
    if (!options.yes) {
      s.stop(pc.green("Project initialized successfully!"));
      p.outro(pc.bgGreen(pc.black(" Get started by running 'bun run dev' ")));
    } else {
      log.timing("Initialization complete", 0);
    }
  }
}
