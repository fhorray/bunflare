import type { BunflareConfig } from "bunflare/types";

export default {
  sqlite: { binding: "DB_SECONDARY" },
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
} satisfies BunflareConfig;
