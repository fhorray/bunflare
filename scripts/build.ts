import { build } from "bun";
import { rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Professional Bun.build() script for bunflare.
 * Generates high-performance ESM bundles for all entry points.
 * Uses script-relative paths for maximum robustness.
 */
async function runBuild() {
  // Resolve paths relative to THIS script (scripts/build.ts)
  const scriptDir = import.meta.dir;
  const packageDir = resolve(scriptDir, "../packages/bunflare");
  const distDir = join(packageDir, "dist");
  const pkgPath = join(packageDir, "package.json");

  // Read package.json to get dependencies dynamically
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  console.log(`🚀 Starting Bun build for ${pkg.name}...`);

  // 1. Explicit Cleanup: Wipe dist/ for a fresh, clean build
  console.log(`🧹 Cleaning ${distDir}...`);
  rmSync(distDir, { recursive: true, force: true });

  const entrypoints = [
    "./src/index.ts",
    "./src/plugin.ts",
    "./src/config.ts",
    "./src/runtime/context.ts",
    "./src/cli/index.ts",
  ];

  // 2. Dynamic External Dependencies: Mark everything in package.json as external
  // This keeps the package lean and prevents version conflicts.
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    "wrangler", // Safety catch
  ];

  const result = await build({
    entrypoints: entrypoints.map(e => join(packageDir, e)),
    outdir: distDir,
    target: "bun",
    format: "esm",
    sourcemap: "none",
    minify: false,
    // Preserve the directory structure for nested files
    naming: "[dir]/[name].[ext]",
    root: join(packageDir, "src"),
    external,
    define: {
      "__VERSION__": JSON.stringify(pkg.version),
    },
  });

  if (!result.success) {
    console.error("❌ Bun build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Mandatory Cleanup: Ensure internal tests do not leak into the distribution
  console.log("🧹 Cleaning up internal test artifacts...");
  rmSync(join(distDir, "tests"), { recursive: true, force: true });

  console.log(`✅ Build complete! Artifacts generated in ${distDir}`);
}

runBuild().catch((err) => {
  console.error("❌ Unexpected build error:", err);
  process.exit(1);
});