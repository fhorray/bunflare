import { defineConfig } from "bunflare/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  workerName: "playground-worker",
  entrypoint: "./src/backend/index.ts",
  outdir: "./dist",
  staticDir: "public",
  target: "browser",
  minify: true,
  sourcemap: "none",
  drop: ["console", "debugger"],

  plugins: [
    tailwind
  ]
});
