import { join } from "path";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import pc from "picocolors";
import * as p from "@clack/prompts";

export async function init(isQuiet = false) {
  console.log("");
  if (!isQuiet) {
    p.intro(`${pc.bgCyan(pc.black(" Bunflare "))} ${pc.cyan("Write Bun, Deploy Cloudflare")}`);
  }

  const isCurrentDirProject = existsSync(join(process.cwd(), "package.json"));
  let targetPath = ".";
  let template = "none";
  let skipPrompts = false;

  if (isQuiet) {
    skipPrompts = true;
    targetPath = ".";
    template = "blank";
  }

  if (isCurrentDirProject && !skipPrompts) {
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
              { value: "react", label: "React", hint: "Fullstack React 19 setup" },
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
  if (!isQuiet) s.start(`Initializing ${template} project in ${pc.cyan(targetPath)}...`);

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
      pkg.dependencies = {
        ...pkg.dependencies,
        "hono": "latest",
        "react": "^19",
        "react-dom": "^19"
      };
      pkg.devDependencies = {
        ...pkg.devDependencies,
        "bunflare": "latest",
        "@types/react": "^19",
        "@types/react-dom": "^19"
      };
    } else if (template === "react") {
      pkg.dependencies = {
        ...pkg.dependencies,
        "react": "^19",
        "react-dom": "^19"
      };
      pkg.devDependencies = {
        ...pkg.devDependencies,
        "bunflare": "latest",
        "@types/react": "^19",
        "@types/react-dom": "^19"
      };
    } else {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        "bunflare": "latest"
      };
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    if (!isQuiet) p.log.success("Updated package.json");
  } catch (e) { }

  // 4. Create source files
  const srcDir = join(projectDir, "src");
  const publicDir = join(projectDir, "public");
  if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  try {
    const { copyFileSync } = await import("fs");
    let assetPath = join(import.meta.dir, "../../assets");
    if (!existsSync(assetPath)) {
      assetPath = join(import.meta.dir, "../assets");
    }

    const logoSrc = join(assetPath, "logo.png");
    const faviconSrc = join(assetPath, "favicon.ico");

    if (existsSync(logoSrc)) {
      copyFileSync(logoSrc, join(publicDir, "logo.png"));
    }
    if (existsSync(faviconSrc)) {
      copyFileSync(faviconSrc, join(publicDir, "favicon.ico"));
    }
  } catch (e) {
    if (!isQuiet) p.log.warn("Could not copy official branding assets. Using defaults.");
  }

  let entryContent = "";

  if (template === "hono") {
    entryContent = `import { Hono } from "hono";
import { spa } from "bunflare/hono";

const app = new Hono();

app.get("/api/status", (c) => {
  return c.json({
    status: "online",
    framework: "Hono",
    runtime: "Bunflare",
  });
});

// SPA Middleware (Static files + Fallback)
app.use("*", spa());

export default app;
`;
    // main.tsx
    writeFileSync(join(srcDir, "main.tsx"), `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`);

    // index.css
    writeFileSync(join(srcDir, "index.css"), `/* Tailwind CSS is loaded via CDN in index.html */
body {
  background-color: #fafafa;
  color: #0f172a;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`);

    // App.tsx
    const appTsx = `import React from "react";
import logo from "../public/logo.png";

export function App() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-8 text-slate-900 antialiased text-center">
      <div className="mb-8">
        <img src={logo} width="180" height="180" alt="Bunflare Logo" />
      </div>

      <div className="mb-12">
        <h1 className="text-7xl font-bold tracking-tighter text-slate-950">
          bun<span className="text-orange-600">flare</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-wide">Write Bun, Deploy Cloudflare.</p>
      </div>
      
      <p className="text-slate-400 text-lg font-medium mb-12">
        Start editing <code className="bg-slate-100 px-3 py-1 rounded-xl text-orange-600 font-mono text-base">src/App.tsx</code>
      </p>
      
      <div className="flex gap-4">
        <a 
          href="https://github.com/fhorray/bunflare" 
          target="_blank" 
          className="bg-orange-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-orange-700 transition-all duration-300 shadow-sm cursor-pointer"
        >
          Documentation
        </a>
      </div>

      <footer className="absolute bottom-12 text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
        Built with 🧡 by Bunflare
      </footer>
    </div>
  );
}
`;
    writeFileSync(join(srcDir, "App.tsx"), appTsx);

    // index.html
    writeFileSync(join(publicDir, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bunflare App</title>
  <link rel="icon" type="image/ico" href="./favicon.ico">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`);
  } else if (template === "react") {
    entryContent = `import { serve } from "bun";
import indexHtml from "../public/index.html";

export default serve({
  routes: {
    "/": indexHtml,
  },
});
`;
    const appTsx = `import React from "react";
import { createRoot } from "react-dom/client";
import logo from "../public/logo.png";

function App() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-8 text-slate-900 antialiased text-center">
      <div className="mb-8">
        <img src={logo} width="100" height="100" alt="Bunflare Logo" />
      </div>
      
      <h1 className="text-6xl font-bold tracking-tighter mb-4 text-slate-950">
        bun<span className="text-orange-600">flare</span>
      </h1>
      
      <p className="text-slate-500 text-xl font-medium mb-12">
        Start editing <code className="bg-slate-100 px-3 py-1 rounded-xl text-orange-600 font-mono">src/App.tsx</code>
      </p>
      
      <a 
        href="https://github.com/fhorray/bunflare" 
        target="_blank" 
        className="bg-orange-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-orange-700 transition-all duration-300 shadow-sm cursor-pointer"
      >
        Documentation
      </a>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`;
    writeFileSync(join(srcDir, "App.tsx"), appTsx);

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
    entryContent = "";
  } else {
    entryContent = `import { serve } from "bun";

const server = serve({
  fetch(req) {
    return new Response("Hello from Bunflare!");
  }
});

export default server;
`;
  }

  if (existsSync(join(projectDir, entrypoint))) {
    const content = readFileSync(join(projectDir, entrypoint), "utf-8");
    if (!content.includes("export default")) {
      if (content.includes("const server =")) {
        writeFileSync(join(projectDir, entrypoint), content + "\n\nexport default server;");
        if (!isQuiet) p.log.success(`Patched ${entrypoint} to include export default server;`);
      }
    }
  } else if (template !== "none") {
    writeFileSync(join(projectDir, entrypoint), entryContent);
    if (!isQuiet) p.log.success(`Created ${entrypoint}`);
  }

  const bunfigPath = join(projectDir, "bunfig.toml");
  if (!existsSync(bunfigPath)) {
    writeFileSync(bunfigPath, `[loader]
".svg" = "text"
".html" = "text"
`);
    if (!isQuiet) p.log.success("Created bunfig.toml");
  }

  const configPath = join(projectDir, "bunflare.config.ts");
  if (!existsSync(configPath)) {
    const configContent = `import { bunflare, type BunflareConfig } from "bunflare";

export default {
  entrypoint: "${entrypoint}",
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
} satisfies BunflareConfig;
`;
    writeFileSync(configPath, configContent);
    if (!isQuiet) p.log.success("Created bunflare.config.ts");
  }

  const globalDtsPath = join(projectDir, "global.d.ts");
  if (!existsSync(globalDtsPath)) {
    writeFileSync(globalDtsPath, `import "bun";

declare global {
  namespace Bun {
    interface Env extends CloudflareBindings { }
  }
  declare module "*.html" { const content: any; export default content; }
  declare module "*.svg" { const content: string; export default content; }
  declare module "*.png" { const content: string; export default content; }
  declare module "*.jpg" { const content: string; export default content; }
  declare module "*.jpeg" { const content: string; export default content; }
  declare module "*.webp" { const content: string; export default content; }
  declare module "*.ico" { const content: string; export default content; }
}
`);
    if (!isQuiet) p.log.success("Created global.d.ts");
  }

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
    if (!isQuiet) p.log.success("Created wrangler.jsonc");
  }

  const gitignorePath = join(projectDir, ".gitignore");
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, `node_modules
dist
.wrangler
.dev.vars
.DS_Store
*.local
`);
    if (!isQuiet) p.log.success("Created .gitignore");
  }

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
    if (!isQuiet) p.log.success("Created tsconfig.json");
  }

  const { spawnSync } = await import("child_process");
  const devDeps = ["wrangler", "@types/bun", "bunflare"];
  if (template === "hono" || template === "react") {
    devDeps.push("@types/react", "@types/react-dom");
  }

  if (!process.env.BUNFLARE_SKIP_INSTALL) {
    spawnSync("bun", ["add", "-d", ...devDeps], { stdio: "inherit", cwd: projectDir });
    spawnSync("bun", ["install"], { stdio: "inherit", cwd: projectDir });
    spawnSync("bunx", ["wrangler", "types", "--env-interface", "CloudflareBindings"], { stdio: "inherit", cwd: projectDir });
  }

  if (!isQuiet) s.stop("Dependencies finalized!");

  if (!isQuiet) {
    p.outro(`${pc.bold(pc.green("✨ Bunflare initialization complete!"))}
  
  ${pc.cyan("Next steps:")}
  ${targetPath !== "." && targetPath !== "./" ? `1. cd ${targetPath.replace(/^\.\//, "")}` : ""}
  ${targetPath !== "." ? "2" : "1"}. Run ${pc.cyan("bun run dev")} to start your ${template} app.
  `);
  }
}
