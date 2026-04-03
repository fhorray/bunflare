import { spawn } from "node:child_process";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";

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
  p.intro(pc.bgCyan(pc.black(" buncf Package Publisher ")));

  const packageDir = resolve(process.cwd(), "packages/buncf");

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
    message: `Ready to publish buncf as ${pc.cyan(versionType as string)} with tag ${pc.magenta(tag as string)}?`,
  });

  if (!confirm || p.isCancel(confirm)) {
    p.cancel("Publishing cancelled.");
    process.exit(0);
  }

  const s = p.spinner();
  const pkgPath = resolve(packageDir, "package.json");
  let originalPkgContent: string | null = null;

  try {
    // 0. Backup original package.json
    originalPkgContent = await Bun.file(pkgPath).text();

    // A. Bump Version
    s.start(`Bumping version (${versionType})...`);
    const pkg = JSON.parse(originalPkgContent);
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
    await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    s.stop(pc.green(`Version bumped from ${oldVersion} to ${newVersion}!`));

    // B. Publish
    p.log.info(`Ready to publish to NPM with tag '${tag}'...`);
    // Note: We use --access public for best practice
    await runCommand("npm", ["publish", "--tag", tag as string, "--access", "public"], packageDir);
    p.log.success("Successfully published to NPM! 🚀");

    p.outro(pc.bgGreen(pc.black(" All done! Congrats on the new release! ")));
  } catch (error: unknown) {
    s.stop(pc.red("Publishing failed."));

    if (originalPkgContent) {
      p.log.warn("Rolling back package.json...");
      await Bun.write(pkgPath, originalPkgContent);
      p.log.info("package.json restored to original state.");
    }

    const message = error instanceof Error ? error.message : String(error);
    p.log.error(message);
    process.exit(1);
  }
}

main().catch(console.error);
