import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";

/**
 * Robust command runner for the publish workflow.
 */
async function runCommand(command: string, args: string[], cwd: string) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true, cwd });
    child.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Command '${command} ${args.join(" ")}' failed with code ${code}`));
    });
  });
}

/**
 * Main Publish Orchestrator.
 * Handles dev -> build -> publish -> dev transitions atomically.
 */
async function main() {
  console.log();
  p.intro(pc.bgCyan(pc.black(" bunflare Package Publisher ")));

  const packageDir = resolve(process.cwd(), "plugin");
  const pkgPath = resolve(packageDir, "package.json");
  const readmePath = resolve(packageDir, "README.md");
  const licensePath = resolve(packageDir, "LICENSE");

  // 1. Version Bump Selection
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

  // 2. NPM Tag Selection
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

  // Backups for restoration
  let originalPkgJson: any = null;
  let devModePkgJson: any = null;
  let originalReadmeContent: string | null = null;
  let originalLicenseContent: string | null = null;

  /**
   * Cleanup function to restore the repository documentation.
   */
  const cleanup = async () => {
    if (originalReadmeContent) {
      await Bun.write(readmePath, originalReadmeContent);
    }
    if (originalLicenseContent) {
      await Bun.write(licensePath, originalLicenseContent);
    }
  };

  // Signal Handling
  process.on("SIGINT", async () => { await cleanup(); process.exit(130); });
  process.on("SIGTERM", async () => { await cleanup(); process.exit(143); });

  try {
    // 0. Initial State Capture
    const rawPkg = await Bun.file(pkgPath).text();
    originalPkgJson = JSON.parse(rawPkg);
    if (await Bun.file(readmePath).exists()) originalReadmeContent = await Bun.file(readmePath).text();
    if (await Bun.file(licensePath).exists()) originalLicenseContent = await Bun.file(licensePath).text();

    // 1. Sync Root Documentation & License
    s.start("Syncing project documentation...");
    const rootReadmeFile = Bun.file(resolve(process.cwd(), "README.md"));
    const rootLicenseFile = Bun.file(resolve(process.cwd(), "LICENSE"));

    if (await rootReadmeFile.exists()) await Bun.write(readmePath, await rootReadmeFile.text());
    if (await rootLicenseFile.exists()) await Bun.write(licensePath, await rootLicenseFile.text());

    // 2. Version Calculation
    s.message("Calculating new version...");
    const oldVersion = originalPkgJson.version || "0.0.0";
    const parts = oldVersion.split(".").map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    let newVersion = "";
    if (versionType === "major") newVersion = `${major + 1}.0.0`;
    else if (versionType === "minor") newVersion = `${major}.${minor + 1}.0`;
    else if (versionType === "patch") newVersion = `${major}.${minor}.${patch + 1}`;

    // 3. Update version in package.json (permanent change for the repo)
    const updatedPkg = { ...originalPkgJson, version: newVersion };
    await Bun.write(pkgPath, JSON.stringify(updatedPkg, null, 2) + "\n");

    // 4. Execute Build (Ensures fresh dist/ and types with the NEW version)
    s.message(`Building bunflare v${newVersion}...`);
    await runCommand("bun", ["run", "build"], packageDir);
    s.message("Library built successfully!");

    // 5. NPM Publish
    s.stop(pc.green(`Metadata prepared for v${newVersion}!`));
    p.log.info(`Broadcasting to NPM with tag '${tag}'...`);
    await runCommand("npm", ["publish", "--tag", tag as string, "--access", "public"], packageDir);

    p.log.success("Published successfully! 🚀");
    p.outro(pc.bgGreen(pc.black(" Distribution complete. ")));

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    s.stop(pc.red(`Publishing aborted: ${message}`));
    // Rollback version on error
    if (originalPkgJson) await Bun.write(pkgPath, JSON.stringify(originalPkgJson, null, 2) + "\n");
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main().catch(console.error);