import type { BunflareConfig } from "bunflare";

export default {
  entrypoint: "./index.ts",
  sqlite: { binding: "DB" }, // This maps bun:sqlite -> D1 AND Bun.sql -> D1 by default
  port: Number(Bun.env.PORT) || 3005,
  ip: "localhost"
} satisfies BunflareConfig;
