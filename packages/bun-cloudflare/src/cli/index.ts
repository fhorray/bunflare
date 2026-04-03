#!/usr/bin/env bun
import { runBuild } from "./build";

/**
 * CLI Entry point for bun-cloudflare.
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "build":
      await runBuild();
      break;

    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
  bun-cloudflare - CLI for Building Bun apps for Cloudflare Workers

  Usage:
    bunx bun-cloudflare <command> [options]

  Commands:
    build   📦 Transpiles and bundles your worker for production.
    help    ❓ Prints this help message.

  Config:
    Configuration is automatically loaded from 'buncloudflare.config.ts' or 'cloudflare.config.ts'.
      - entrypoint: Your worker entry (default: ./src/index.ts)
      - outdir: The output directory (default: ./dist)
      `);
      break;
  }
}

try {
  await main();
} catch (err) {
  console.error("[bun-cloudflare] ❌ Uncaught error:", err);
  process.exit(1);
}
