import { defineConfig } from "bun-cloudflare";

export default defineConfig({
  workerName: "example-worker",
  entrypoint: "./src/index.ts",
  outdir: "./dist"
});
