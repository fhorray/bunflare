import { spawn, type ChildProcess } from "node:child_process";
import pc from "picocolors";
import { log } from "./logger";

export interface WranglerOptions {
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  quiet?: boolean;
  filterBindings?: boolean;
}

export function spawnWrangler(options: WranglerOptions): ChildProcess {
  const { args, cwd = process.cwd(), env = {}, quiet = false, filterBindings = false } = options;

  const wranglerArgs = ["wrangler", ...args];

  const wrangler = spawn("bunx", wranglerArgs, {
    cwd,
    stdio: filterBindings ? ["inherit", "pipe", "pipe"] : "inherit",
    shell: !filterBindings,
    env: {
      ...process.env,
      BUN_RUNTIME: "1",
      FORCE_COLOR: "1",
      ...env
    }
  });

  if (filterBindings) {
    let isFilteringBindings = false;

    (wrangler.stdout as any)?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        if (i === lines.length - 1 && line === "") continue;

        let processedLine = line
          .replace("[custom build]", pc.magenta("bunflare"))
          .replace(/\[wrangler:.*\]/, pc.blue("wrangler"));

        const cleanLine = processedLine.replace(/\u001b\[[0-9;]*m/g, "").trim();

        if (cleanLine.includes("Your Worker has access to the following bindings")) {
          isFilteringBindings = true;
          continue;
        }

        if (isFilteringBindings) {
          if (cleanLine.match(/\[wrangler.*\]/) || cleanLine.match(/GET|POST|PUT|DELETE|PATCH/) || cleanLine.startsWith("╭") || cleanLine.includes("Ready on")) {
            isFilteringBindings = false;
          } else {
            continue;
          }
        }

        process.stdout.write(processedLine + "\n");
      }
    });

    (wrangler.stderr as any)?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        if (i === lines.length - 1 && line === "") continue;

        let processedLine = line
          .replace("[custom build]", pc.magenta("bunflare"))
          .replace(/\[wrangler:.*\]/, pc.blue("wrangler"));

        process.stderr.write(processedLine + "\n");
      }
    });
  }

  // Handle Termination
  process.on("SIGINT", () => {
    wrangler.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    wrangler.kill("SIGTERM");
    process.exit(0);
  });

  return wrangler;
}
