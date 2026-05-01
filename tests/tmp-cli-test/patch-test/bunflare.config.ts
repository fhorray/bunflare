import { bunflare, type BunflareConfig } from "bunflare";

export default {
  entrypoint: "./src/index.ts",
  frontend: {
    entrypoint: "./src/index.html",
    outdir: "./dist/public",
  },
  
} satisfies BunflareConfig;
