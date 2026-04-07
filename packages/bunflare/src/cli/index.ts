#!/usr/bin/env bun
import pc from "picocolors";
declare const __VERSION__: string;
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "dev";
import { log } from "./logger";
import { runBuild } from "./build";
import { runInit } from "./init";

export interface ParsedArgs {
  command?: string;
  rootDir?: string;
  debug: boolean;
  quiet: boolean;
  args: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv;
  
  // Identify the command as the first non-flag argument
  let command: string | undefined;
  let skipNext = false;
  for (const arg of args) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (arg.startsWith("-")) {
      if (arg === "--rootDir") skipNext = true;
      continue;
    }
    command = arg;
    break;
  }

  const debug = args.includes("--debug") || args.includes("-d");
  const quiet = !debug;
  
  let rootDir: string | undefined;
  const rootDirIndex = args.indexOf("--rootDir");
  if (rootDirIndex !== -1) {
    rootDir = args[rootDirIndex + 1];
    if (!rootDir || rootDir.startsWith("-")) {
      log.error("Missing value for --rootDir");
      process.exit(1);
    }
  }

  return { command, rootDir, debug, quiet, args };
}

/**
 * CLI Entry point for bunflare.
 */
export async function main(argv: string[] = process.argv.slice(2)) {
  const { command, rootDir, debug, quiet, args } = parseArgs(argv);

  switch (command) {
    case "init": {
      const yes = args.includes("--yes") || args.includes("-y");
      await runInit({ yes, rootDir });
      break;
    }

    case "build": {
      const production = args.includes("--production") || args.includes("-p");
      await runBuild({ production, quiet });
      break;
    }

    case "dev": {
      const remote = args.includes("--remote") || args.includes("-r");
      const { runDev } = await import("./dev");
      await runDev({ quiet, remote });
      break;
    }

    case "deploy": {
      const { runDeploy } = await import("./deploy");
      await runDeploy();
      break;
    }

    case "doctor": {
      const fix = args.includes("--fix") || args.includes("-f");
      const auto = args.includes("--auto") || args.includes("-a");
      const { runDoctor } = await import("./doctor");
      await runDoctor({ rootDir, fix, auto });
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
    ${pc.green("doctor")}     🩺  Verify project health and config (${pc.cyan("--fix")} to repair)
    
  ${pc.bold(pc.blue("Production"))}
    ${pc.green("build")}      📦  Bundle worker and assets for production
    ${pc.green("deploy")}     ☁️   Build and deploy to Cloudflare in one step
    
  ${pc.bold(pc.blue("General"))}
    ${pc.green("help")}       ❓  Display this message
    --rootDir <path>  Specify project root directory

${pc.bold("Options (build/dev/doctor):")}
  ${pc.cyan("--production")}, ${pc.cyan("-p")}    Enable minification and drop console (production)
  ${pc.cyan("--debug")}, ${pc.cyan("-d")}         Show verbose bundle information and logs
  ${pc.cyan("--fix")}, ${pc.cyan("-f")}           Automatically fix configuration issues (doctor only)
  ${pc.cyan("--auto")}, ${pc.cyan("-a")}          Bypass prompts for known repairs (doctor only)
  ${pc.cyan("--help")}, ${pc.cyan("-h")}          Show this information

${pc.dim(`Documentation: ${pc.underline("https://github.com/fhorray/bunflare")}`)}
      `);
      break;
    }
  }
}

// Only run main if this is the entry point
if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    log.error("Uncaught error in Bunflare CLI:");
    const { formatError } = await import("./utils");
    for (const line of formatError(err)) log.line(`  ${pc.red(line)}`);
    process.exit(1);
  }
}