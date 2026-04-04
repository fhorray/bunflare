import { defineConfig } from "buncf/config";
import tailwind from "bun-plugin-tailwind";

export default defineConfig({
  workerName: "playground-worker",
  entrypoint: "./src/index.ts",
  outdir: "./dist",
  staticDir: "web",
  target: "browser",
  minify: true,
  sourcemap: "linked",
  plugins: [
    tailwind
  ]
});
