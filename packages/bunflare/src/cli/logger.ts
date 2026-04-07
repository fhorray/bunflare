import pc from "picocolors";
declare const __VERSION__: string;
const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "dev";

/**
 * Modern Logger utility for the Bunflare CLI.
 * Consistent with tools like Vite, Nitro, and Hono.
 */
export const log = {
  /** A subtle step indicator (Cyan) */
  step: (msg: string) => console.log(`${pc.cyan("○")} ${msg}`),

  /** A success indicator (Green) */
  success: (msg: string) => console.log(`${pc.green("✔")} ${msg}`),

  /** An error indicator (Red) */
  error: (msg: string) => console.log(`${pc.red("✖")} ${msg}`),

  /** A warning indicator (Yellow) */
  warn: (msg: string) => console.log(`${pc.yellow("⚠")} ${pc.yellow(msg)}`), // Make warn yellow too

  /** An informational indicator (Blue) */
  info: (msg: string) => console.log(`${pc.blue("ℹ")} ${pc.dim(msg)}`),

  /** A bold header for commands */
  header: (title: string, color: keyof typeof pc = "magenta") => {
    console.log(`\n${(pc as any)[color]?.(pc.bold("☁️  Bunflare"))} ${pc.dim(`v${version}`)} ${pc.bold(title)}\n`);
  },

  /** Finished with timing */
  timing: (label: string, ms: number) => {
    console.log(`\n${pc.green("✨")} ${pc.bold(label)} ${pc.dim("ready in")} ${pc.green(`${ms}ms`)}\n`);
  },

  /** Custom line */
  line: (msg: string) => console.log(msg),

  /** Dim text */
  dim: (msg: string) => console.log(pc.dim(msg)),

  /** Horizontal rule */
  hr: () => console.log(pc.dim("─".repeat(process.stdout.columns || 40))),
};