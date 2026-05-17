import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { AOPS_DIR, DEFAULT_DIRECTORIES } from "@agentic-ops/core";

export function resolveCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

export function aopsPath(root: string, ...parts: string[]): string {
  return join(root, AOPS_DIR, ...parts);
}

export function ensureAopsTree(root: string, dryRun = false): string[] {
  const created: string[] = [];
  const base = aopsPath(root);
  if (!existsSync(base)) {
    created.push(base);
    if (!dryRun) mkdirSync(base, { recursive: true });
  }

  for (const directory of DEFAULT_DIRECTORIES) {
    const target = aopsPath(root, directory);
    if (!existsSync(target)) {
      created.push(target);
      if (!dryRun) mkdirSync(target, { recursive: true });
    }
  }

  return created;
}

export function writeJsonFile(path: string, data: unknown, options: { force?: boolean; dryRun?: boolean } = {}): void {
  if (existsSync(path) && !options.force) {
    throw new Error(`Refusing to overwrite existing file without --force: ${path}`);
  }

  if (options.dryRun) {
    return;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function defaultArtifactPath(root: string, target: string): string {
  switch (target) {
    case "manifest":
      return aopsPath(root, "manifest.json");
    case "workspace":
      return aopsPath(root, "workspace-inspection.json");
    case "plan":
      return aopsPath(root, "plan.json");
    case "handoff":
      return aopsPath(root, "handoff", "handoff.json");
    default:
      throw new Error(`No default path for target: ${target}`);
  }
}
