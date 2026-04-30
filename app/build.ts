import { bunflare } from "../plugin/index.ts";
import { rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

console.log("🚀 Building Fullstack App with Bunflare...");

// 1. Clean dist directory
const distDir = join(import.meta.dir, "dist");
try {
  rmSync(distDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(distDir, { recursive: true });

// 2. Build Worker (Backend)
console.log("📦 Bundling Worker...");
const workerResult = await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  plugins: [
    bunflare({
      sqlite: { binding: "DB" },
      env: true,
      html: { entrypoint: "./public/index.html", outdir: "./dist/public" }
    }),
  ],
});

// 3. Build Frontend (HTML + React)
console.log("🎨 Bundling Frontend...");
const frontendResult = await Bun.build({
  entrypoints: ["./public/index.html"],
  outdir: "./dist/public",
  target: "browser",
  minify: true,
});

if (workerResult.success && frontendResult.success) {
  console.log("✅ Fullstack Build successful!");
  console.log("   - Backend: dist/index.js");
  console.log("   - Frontend: dist/public/");
} else {
  console.error("❌ Build failed!");
  [...workerResult.logs, ...frontendResult.logs].forEach(log => console.error(log));
  process.exit(1);
}
