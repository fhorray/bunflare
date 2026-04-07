import { defineConfig } from "bunflare/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  workerName: "ecommerce-worker",
  entrypoint: "./src/index.ts",
  outdir: "./dist",
  staticDir: "public",
  target: "browser",
  minify: true,
  sourcemap: "linked",
  plugins: [
    tailwind
  ]
});
