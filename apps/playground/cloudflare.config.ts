import { defineConfig } from "bun-cloudflare/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  workerName: "playground-worker",
  entrypoint: "./src/index.ts",
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "linked",
  plugins: [
    tailwind
  ]
});
