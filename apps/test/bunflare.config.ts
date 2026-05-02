import { bunflare, type BunflareConfig } from "bunflare";

export default {
  entrypoint: "./src/index.ts",
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
} satisfies BunflareConfig;
