import { bunflare, type BunflareConfig } from "bunflare";
import tailwind from "bun-plugin-tailwind";

export default {
  entrypoint: "./src/index.ts",
  port: 3000,
  ip: "127.0.0.1",
  frontend: {
    entrypoint: "./public/index.html",
    outdir: "./dist/public",
  },
  sql: {
    type: "hyperdrive",
    binding: "HYPERDRIVE",
    driver: "postgres"
  },
  redis: {
    binding: "KV"
  },
  plugins: [tailwind],
} satisfies BunflareConfig;
