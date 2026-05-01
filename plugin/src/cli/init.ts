import { join } from "path";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import pc from "picocolors";
import * as p from "@clack/prompts";

export async function init() {
  console.log("");
  p.intro(`${pc.bgCyan(pc.black(" Bunflare "))} ${pc.cyan("Write Bun, Deploy Cloudflare")}`);

  const isCurrentDirProject = existsSync(join(process.cwd(), "package.json"));
  let targetPath = ".";
  let template = "none";
  let skipPrompts = false;

  if (isCurrentDirProject) {
    p.note(
      `Detected an existing Bun project in this directory.\n\n` +
      `${pc.cyan("We will add:")}\n` +
      `  • bunflare.config.ts (Project configuration)\n` +
      `  • wrangler.jsonc (Cloudflare deployment)\n` +
      `  • global.d.ts (Cloudflare types)\n` +
      `  • tsconfig.json (TypeScript config if missing)\n\n` +
      `${pc.cyan("We will update:")}\n` +
      `  • package.json (Add dev, build, and deploy scripts)`,
      "Bunflare Migration"
    );

    const shouldMigrate = await p.confirm({
      message: "Would you like to add Bunflare to this project?",
      initialValue: true,
    });

    if (p.isCancel(shouldMigrate)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (shouldMigrate) {
      skipPrompts = true;
    }
  }

  if (!skipPrompts) {
    const group = await p.group(
      {
        path: () =>
          p.text({
            message: "Where should we create your project?",
            placeholder: "./my-app",
            initialValue: "./my-app",
          }),
        template: ({ results }) => {
          const target = results.path || ".";
          const isProject = existsSync(join(process.cwd(), target, "package.json"));

          if (isProject) return undefined;

          return p.select({
            message: "Select a template",
            initialValue: "blank",
            options: [
              { value: "blank", label: "Blank (Basic Bun server)", hint: "Minimalist starting point" },
              { value: "hono", label: "Hono (Fullstack)", hint: "Hono framework with HTML frontend" },
              { value: "react", label: "React", hint: "Fullstack React 19 + Tailwind setup" },
            ],
          });
        },
      },
      {
        onCancel: () => {
          p.cancel("Operation cancelled.");
          process.exit(0);
        },
      }
    );

    targetPath = (group.path as string) || "./my-app";
    template = (group.template as string) || "none";
  }

  const projectDir = join(process.cwd(), targetPath);
  const isExistingProject = existsSync(join(projectDir, "package.json"));
  if (isExistingProject && template !== "none") {
    const confirmMigrate = await p.select({
      message: pc.yellow(`Existing project detected in ${pc.cyan(targetPath)}. How to proceed?`),
      initialValue: "none",
      options: [
        { value: "none", label: "Migrate/Configure", hint: "Just add Bunflare to current code (Safe)" },
        { value: template, label: `Scaffold ${template}`, hint: "Add template files anyway" },
      ]
    });
    if (p.isCancel(confirmMigrate)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    template = confirmMigrate as string;
  }

  // Detect entrypoint
  let entrypoint = "./src/index.ts";
  if (template === "none") {
    const possibleEntries = ["./src/index.ts", "./index.ts", "./src/main.ts", "./main.ts", "./src/server.ts", "./server.ts"];
    for (const entry of possibleEntries) {
      if (existsSync(join(projectDir, entry))) {
        entrypoint = entry;
        break;
      }
    }
  }

  const s = p.spinner();
  s.start(`Initializing ${template} project in ${pc.cyan(targetPath)}...`);

  // 2. Project Setup
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }

  // Determine Project Name
  let projectName = targetPath === "." || targetPath === "./"
    ? join(process.cwd()).split(/[\\\/]/).pop() || "bunflare-app"
    : targetPath.replace(/^\.\//, "").split(/[\\\/]/).pop() || "bunflare-app";

  const pkgPath = join(projectDir, "package.json");
  if (isExistingProject) {
    try {
      const existingPkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (existingPkg.name) projectName = existingPkg.name;
    } catch (e) { }
  } else {
    writeFileSync(pkgPath, JSON.stringify({
      name: projectName,
      version: "1.0.0",
      type: "module",
      scripts: {}
    }, null, 2));
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg.name = projectName;
    pkg.type = "module";
    pkg.scripts = {
      ...pkg.scripts,
      "dev": "bunflare dev",
      "dev:local": "bunflare dev --local",
      "build": "bunflare build",
      "deploy": "bunflare deploy",
      "cf-typegen": "wrangler types --env-interface CloudflareBindings"
    };
    if (template === "hono") {
      pkg.dependencies = { ...pkg.dependencies, "hono": "latest" };
    } else if (template === "react") {
      pkg.dependencies = {
        ...pkg.dependencies,
        "react": "^19",
        "react-dom": "^19",
        "bun-plugin-tailwind": "latest"
      };
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    p.log.success("Updated package.json");
  } catch (e) { }

  // 4. Create source files
  const srcDir = join(projectDir, "src");
  const publicDir = join(projectDir, "public");
  if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  // Copy official assets if they exist (searching relative to CLI)
  try {
    const { copyFileSync } = await import("fs");
    const assetPath = join(import.meta.dir, "../../assets");
    const logoSrc = join(assetPath, "logo.png");
    const faviconSrc = join(assetPath, "favicon.ico");

    if (existsSync(logoSrc)) copyFileSync(logoSrc, join(publicDir, "logo.png"));
    if (existsSync(faviconSrc)) copyFileSync(faviconSrc, join(publicDir, "favicon.ico"));
  } catch (e) {
    p.log.warn("Could not copy official branding assets. Using defaults.");
  }

  let entryContent = "";

  if (template === "hono") {
    entryContent = `import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import indexHtml from "../public/index.html";

const app = new Hono();

// Serve static files from the public directory
app.use("*", serveStatic({ root: "./public" }));

app.get("/", (c) => c.html(indexHtml));

app.get("/api/status", (c) => {
  return c.json({
    status: "online",
    framework: "Hono",
    runtime: "Bunflare",
  });
});

export default app;
`;
    // Create HTML for Hono
    writeFileSync(join(publicDir, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bunflare</title>
  <style>
    :root { --bg: #ffffff; --fg: #111827; --accent: #ff5500; --gray: #6b7280; }
    body { background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; antialiased: true; }
    .container { text-align: center; animation: fadeIn 0.8s ease-out; }
    .logo { width: 150px; margin-bottom: 2rem; transition: transform 0.4s; }
    .logo:hover { transform: scale(1.05); }
    h1 { font-size: 5rem; font-weight: 900; margin: 0; letter-spacing: -0.04em; color: var(--fg); }
    h1 span { color: var(--accent); }
    p { font-size: 1.25rem; color: var(--gray); margin-top: 1rem; font-weight: 500; }
    .code { background: #f3f4f6; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e5e7eb; font-family: ui-monospace, monospace; color: var(--accent); font-size: 0.9em; }
    .btn { display: inline-block; margin-top: 2.5rem; background: var(--fg); color: white; font-weight: 600; padding: 1rem 2.5rem; border-radius: 99px; text-decoration: none; transition: all 0.2s; }
    .btn:hover { background: var(--accent); transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255, 85, 0, 0.2); }
    footer { position: absolute; bottom: 3rem; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="container">
    <img src="./logo.png" class="logo" alt="Bunflare Logo" />
    <h1>bun<span>flare</span></h1>
    <p>Start editing <span class="code">src/index.ts</span></p>
    <a href="https://github.com/fhorray/bunflare" target="_blank" class="btn">Documentation</a>
  </div>
  <footer>Built with 🧡 by Bunflare</footer>
</body>
</html>`);

  } else if (template === "react") {
    entryContent = `import { serve } from "bun";
import indexHtml from "../public/index.html";

// Server side entry for Bunflare
export default serve({
  routes: {
    "/": indexHtml,
  },
});
`;
    // Create basic React component
    const appTsx = `import React from "react";
import { createRoot } from "react-dom/client";
import logo from "../public/logo.png";

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-[#111827] antialiased">
      <div className="mb-12 transition-transform hover:scale-105 duration-500">
        <img src={logo} width="140" height="140" alt="Bunflare Logo" />
      </div>
      
      <h1 className="text-[6rem] font-black tracking-tighter leading-none mb-4">
        bun<span className="text-[#ff5500]">flare</span>
      </h1>
      
      <p className="text-[#6b7280] text-2xl font-medium mb-12">
        Start editing <code className="bg-[#f3f4f6] px-3 py-1 rounded-xl border border-[#e5e7eb] text-[#ff5500] font-mono text-xl">src/App.tsx</code>
      </p>
      
      <div className="flex gap-4">
        <a 
          href="https://github.com/fhorray/bunflare" 
          target="_blank" 
          className="bg-[#111827] text-white font-bold px-10 py-4 rounded-full hover:bg-[#ff5500] hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-[#ff5500]/20"
        >
          Documentation
        </a>
      </div>

      <footer className="absolute bottom-12 text-[#9ca3af] text-xs tracking-[0.2em] uppercase font-bold">
        Built with 🧡 by Bunflare
      </footer>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`;
    writeFileSync(join(srcDir, "App.tsx"), appTsx);

    // Create HTML
    writeFileSync(join(publicDir, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bunflare</title>
  <link rel="icon" type="image/ico" href="./favicon.ico">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/App.tsx"></script>
</body>
</html>`);
  } else if (template === "none") {
    // Skip file creation for existing projects
    entryContent = "";
  } else {
    // Blank template
    entryContent = `import { serve } from "bun";

const server = serve({
  fetch(req) {
    return new Response("Hello from Bunflare!");
  }
});

export default server;
`;
  }

  if (template !== "none" && !existsSync(join(projectDir, entrypoint))) {
    writeFileSync(join(projectDir, entrypoint), entryContent);
    p.log.success(`Created ${entrypoint}`);
  }

  // bunfig.toml (Crucial for dev:local and HTML imports)
  const bunfigPath = join(projectDir, "bunfig.toml");
  if (!existsSync(bunfigPath)) {
    writeFileSync(bunfigPath, `[loader]
".html" = "text"
".svg" = "text"
`);
    p.log.success("Created bunfig.toml");
  }

  // 5. Create config files
  const configPath = join(projectDir, "bunflare.config.ts");
  if (!existsSync(configPath)) {
    const configContent = `import { bunflare, type BunflareConfig } from "bunflare";
${template === "react" ? 'import tailwind from "bun-plugin-tailwind";\n' : ""}
export default {
  entrypoint: "${entrypoint}",
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
  ${template === "react" ? "plugins: [tailwind]," : ""}
} satisfies BunflareConfig;
`;
    writeFileSync(configPath, configContent);
    p.log.success("Created bunflare.config.ts");
  }

  // global.d.ts
  const globalDtsPath = join(projectDir, "global.d.ts");
  if (!existsSync(globalDtsPath)) {
    writeFileSync(globalDtsPath, `declare global {
  namespace Bun {
    interface Env extends CloudflareBindings { }
  }
}
declare module "*.html" { const content: string; export default content; }
declare module "*.svg" { const content: string; export default content; }
declare module "*.png" { const content: string; export default content; }
`);
    p.log.success("Created global.d.ts");
  }

  // wrangler.jsonc
  const wranglerPath = join(projectDir, "wrangler.jsonc");
  if (!existsSync(wranglerPath)) {
    const today = new Date().toISOString().split('T')[0];
    writeFileSync(wranglerPath, JSON.stringify({
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": projectName,
      "main": "dist/index.js",
      "compatibility_date": today,
      "compatibility_flags": ["nodejs_compat"],
      "assets": { "binding": "ASSETS", "directory": "dist/public" }
    }, null, 2));
    p.log.success("Created wrangler.jsonc");
  }

  // tsconfig.json
  const tsConfigPath = join(projectDir, "tsconfig.json");
  if (!existsSync(tsConfigPath)) {
    writeFileSync(tsConfigPath, JSON.stringify({
      compilerOptions: {
        lib: ["ESNext", "DOM"],
        module: "ESNext",
        target: "ESNext",
        jsx: "react-jsx",
        moduleResolution: "bundler",
        types: ["bun"],
        strict: true,
        skipLibCheck: true
      },
      include: ["src/**/*", "global.d.ts", "worker-configuration.d.ts"]
    }, null, 2));
    p.log.success("Created tsconfig.json");
  }

  // 6. Final Steps
  const { spawnSync } = await import("child_process");
  spawnSync("bun", ["add", "-d", "wrangler", "@types/node"], { stdio: "inherit", cwd: projectDir });
  spawnSync("bun", ["install"], { stdio: "inherit", cwd: projectDir });
  spawnSync("bunx", ["wrangler", "types", "--env-interface", "CloudflareBindings"], { stdio: "inherit", cwd: projectDir });

  s.stop("Dependencies finalized!");

  p.outro(`${pc.bold(pc.green("✨ Bunflare initialization complete!"))}
  
  ${pc.cyan("Next steps:")}
  ${targetPath !== "." && targetPath !== "./" ? `1. cd ${targetPath.replace(/^\.\//, "")}` : ""}
  ${targetPath !== "." ? "2" : "1"}. Run ${pc.cyan("bun run dev")} to start your ${template} app.
  `);
}
