import { defineConfig } from "buncf";

export default defineConfig({
  workerName: "example-worker",
  entrypoint: "./src/index.ts",
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "linked"
});
