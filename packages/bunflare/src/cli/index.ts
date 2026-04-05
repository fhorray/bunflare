#!/usr/bin/env bun
import pc from "picocolors";
declare const __VERSION__: string;
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "dev";
import { log } from "./logger";
import { runBuild } from "./build";
import { runInit } from "./init";

/**
 * CLI Entry point for bunflare.
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "init": {
      const args = process.argv.slice(2);
      const yes = args.includes("--yes") || args.includes("-y");
      await runInit({ yes });
      break;
    }

    case "build": {
      const args = process.argv.slice(2);
      const production = args.includes("--production") || args.includes("-p");
      const quiet = args.includes("--quiet") || args.includes("-q");
      await runBuild({ production, quiet });
      break;
    }

    case "dev": {
      const args = process.argv.slice(2);
      const quiet = args.includes("--quiet") || args.includes("-q");
      const { runDev } = await import("./dev");
      await runDev({ quiet });
      break;
    }

    case "deploy": {
      const { runDeploy } = await import("./deploy");
      await runDeploy();
      break;
    }

    case "doctor": {
      const { runDoctor } = await import("./doctor");
      await runDoctor();
      break;
    }

    case "help":
    case "--help":
    case "-h":
    default: {
      console.log(`
${pc.magenta(pc.bold("☁️  Bunflare"))} ${pc.dim(`v${version}`)}
${pc.dim("The speed of Bun. The reach of Cloudflare. Zero-config DX.")}

${pc.bold("Usage:")}
  $ ${pc.cyan("bunflare")} <command> [options]

${pc.bold("Commands:")}
  ${pc.bold(pc.blue("Development"))}
    ${pc.green("init")}       🚀  Initialize project (wrangler.jsonc + bunflare.config.ts)
    ${pc.green("dev")}        🛠️   Start dev server (live reload, smart build, filtering)
    ${pc.green("doctor")}     🩺  Verify project health and configuration
    
  ${pc.bold(pc.blue("Production"))}
    ${pc.green("build")}      📦  Bundle worker and assets for production
    ${pc.green("deploy")}     ☁️   Build and deploy to Cloudflare in one step
    
  ${pc.bold(pc.blue("General"))}
    ${pc.green("help")}       ❓  Display this message

${pc.bold("Options (build/dev):")}
  ${pc.cyan("--production")}, ${pc.cyan("-p")}    Enable minification and drop console (production)
  ${pc.cyan("--quiet")}, ${pc.cyan("-q")}         Silence build logs (ideal for CI/CD)
  ${pc.cyan("--help")}, ${pc.cyan("-h")}          Show this information

${pc.dim(`Documentation: ${pc.underline("https://github.com/fhorray/bunflare")}`)}
      `);
      break;
    }
  }
}

try {
  await main();
} catch (err) {
  log.error(`Uncaught error: ${err}`);
  process.exit(1);
}
