import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

function resolveGeneratedClientEntry() {
  const pnpmStore = path.join(process.cwd(), "node_modules", ".pnpm");

  if (!existsSync(pnpmStore)) {
    return null;
  }

  const prismaClientPackage = readdirSync(pnpmStore).find((entry) => entry.startsWith("@prisma+client@"));
  if (!prismaClientPackage) {
    return null;
  }

  return path.join(pnpmStore, prismaClientPackage, "node_modules", ".prisma", "client", "default.js");
}

function needsGenerate(entryPath) {
  if (!entryPath || !existsSync(entryPath)) {
    return true;
  }

  const content = readFileSync(entryPath, "utf8");
  return content.includes("did not initialize yet");
}

function runGenerate() {
  if (process.platform === "win32") {
    const result = spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "corepack pnpm --filter @photobooth/db generate"], {
      cwd: process.cwd(),
      stdio: "inherit"
    });

    if (result.error) {
      throw result.error;
    }

    return result.status ?? 1;
  }

  const result = spawnSync("corepack", ["pnpm", "--filter", "@photobooth/db", "generate"], {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const generatedClientEntry = resolveGeneratedClientEntry();

if (!needsGenerate(generatedClientEntry)) {
  console.log("[ensure-prisma-client] Prisma client already generated.");
  process.exit(0);
}

console.log("[ensure-prisma-client] Generating Prisma client...");
process.exit(runGenerate());