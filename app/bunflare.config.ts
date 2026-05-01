import type { BunflareConfig } from "bunflare";

export default {
  sqlite: { binding: "DB_SECONDARY" },
  sql: { type: "hyperdrive", binding: "HYPERDRIVE", driver: "postgres" },
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
} satisfies BunflareConfig;
