import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { transformValue } from "./publish-utils";

async function runCommand(command: string, args: string[], cwd: string) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true, cwd });
    child.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Command '${command} ${args.join(" ")}' failed with code ${code}`));
    });
  });
}

async function main() {
  console.log();
  p.intro(pc.bgCyan(pc.black(" bunflare Package Publisher ")));

  const packageDir = resolve(process.cwd(), "packages/bunflare");

  // 1. Version Bump
  const versionType = await p.select({
    message: "What type of version bump are you performing?",
    options: [
      { value: "patch", label: "Patch (0.0.x)", hint: "Bug fixes" },
      { value: "minor", label: "Minor (0.x.0)", hint: "New features" },
      { value: "major", label: "Major (x.0.0)", hint: "Breaking changes" },
    ],
  });

  if (p.isCancel(versionType)) {
    p.cancel("Publishing cancelled.");
    process.exit(0);
  }

  // 2. NPM Tag
  const tag = await p.select({
    message: "Which NPM distribution tag should be used?",
    options: [
      { value: "latest", label: "latest", hint: "Stable production release" },
      { value: "beta", label: "beta", hint: "Prerelease for testing" },
      { value: "next", label: "next", hint: "Upcoming version" },
    ],
  });

  if (p.isCancel(tag)) {
    p.cancel("Publishing cancelled.");
    process.exit(0);
  }

  // 3. Confirmation
  const confirm = await p.confirm({
    message: `Ready to publish bunflare as ${pc.cyan(versionType as string)} with tag ${pc.magenta(tag as string)}?`,
  });

  if (!confirm || p.isCancel(confirm)) {
    p.cancel("Publishing cancelled.");
    process.exit(0);
  }

  const s = p.spinner();
  const pkgPath = resolve(packageDir, "package.json");
  const readmePath = resolve(packageDir, "README.md");
  const licensePath = resolve(packageDir, "LICENSE");

  let originalPkgContent: string | null = null;
  let originalReadmeContent: string | null = null;
  let originalLicenseContent: string | null = null;

  const cleanup = async () => {
    // ALWAYS roll back the package files to their original development state
    if (originalPkgContent) {
      console.log(pc.yellow("\nRestoring package.json..."));
      await Bun.write(pkgPath, originalPkgContent);
      originalPkgContent = null; // Mark as done
    }
    
    if (originalReadmeContent) {
      console.log(pc.yellow("Restoring original README.md..."));
      await Bun.write(readmePath, originalReadmeContent);
      originalReadmeContent = null; // Mark as done
    }

    if (originalLicenseContent) {
      console.log(pc.yellow("Restoring original LICENSE..."));
      await Bun.write(licensePath, originalLicenseContent);
      originalLicenseContent = null; // Mark as done
    }
  };

  // ─── SIGNAL HANDLING ──────────────────────────────────────────
  // This ensures rollback happens even if Ctrl+C (SIGINT) is pressed
  // or the process is otherwise terminated (SIGTERM).
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130); // 130 is the standard exit code for SIGINT
  });

  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(143); // 143 is the standard exit code for SIGTERM
  });

  try {
    // 0. Backup original package.json and other files
    originalPkgContent = await Bun.file(pkgPath).text();
    if (await Bun.file(readmePath).exists()) originalReadmeContent = await Bun.file(readmePath).text();
    if (await Bun.file(licensePath).exists()) originalLicenseContent = await Bun.file(licensePath).text();

    const pkg = JSON.parse(originalPkgContent);

    // A. Sync Root Documentation & License (Resilient)
    s.start("Syncing Root documentation and license...");
    const rootReadmeFile = Bun.file(resolve(process.cwd(), "README.md"));
    const rootLicenseFile = Bun.file(resolve(process.cwd(), "LICENSE"));

    if (await rootReadmeFile.exists()) {
      await Bun.write(readmePath, await rootReadmeFile.text());
      s.message("README synced!");
    }
    
    if (await rootLicenseFile.exists()) {
      await Bun.write(licensePath, await rootLicenseFile.text());
      s.message("LICENSE synced!");
    }

    // B. Build (Generate dist/types)
    s.message("Running build (tsc --emitDeclarationOnly)...");
    await runCommand("bun", ["run", "build"], packageDir);
    
    // Sync docs to dist as well (self-contained dist)
    const distReadmePath = resolve(packageDir, "dist/README.md");
    const distLicensePath = resolve(packageDir, "dist/LICENSE");
    if (await rootReadmeFile.exists()) await Bun.write(distReadmePath, await rootReadmeFile.text());
    if (await rootLicenseFile.exists()) await Bun.write(distLicensePath, await rootLicenseFile.text());
    
    s.message("Build and dist-sync complete!");

    // C. Bump Version
    s.message(`Bumping version (${versionType})...`);
    const oldVersion = (pkg.version as string) || "0.0.0";
    const parts = oldVersion.split(".").map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    let newVersion = "";
    if (versionType === "major") newVersion = `${major + 1}.0.0`;
    else if (versionType === "minor") newVersion = `${major}.${minor + 1}.0`;
    else if (versionType === "patch") newVersion = `${major}.${minor}.${patch + 1}`;

    pkg.version = newVersion;

    // D. Transform Exports (.ts -> .d.ts only for types)
    // This maintains a "Bun-native" hybrid architecture.
    s.message("Transforming exports/paths for NPM distribution...");
    if (pkg.exports) pkg.exports = transformValue(pkg.exports);
    if (pkg.bin) pkg.bin = transformValue(pkg.bin);
    if (pkg.main) pkg.main = transformValue(pkg.main, "main");
    if (pkg.module) pkg.module = transformValue(pkg.module, "module");
    if (pkg.types) pkg.types = transformValue(pkg.types, "types");

    // E. Include 'dist' in published files
    if (pkg.files && Array.isArray(pkg.files)) {
      if (!pkg.files.includes("dist")) pkg.files.push("dist");
    }

    await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    s.stop(pc.green(`Version bumped to ${newVersion} and paths/files prepared!`));

    // E. Publish
    p.log.info(`Ready to publish to NPM with tag '${tag}'...`);
    // Note: We use --access public for best practice
    await runCommand("npm", ["publish", "--tag", tag as string, "--access", "public"], packageDir);
    p.log.success("Successfully published to NPM! 🚀");

    p.outro(pc.bgGreen(pc.black(" All done! Congrats on the new release! ")));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    s.stop(pc.red(`Publishing failed: ${message}`));
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main().catch(console.error);
