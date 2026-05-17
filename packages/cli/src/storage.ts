import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
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

export function readJsonFileIfExists(path: string): unknown | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  return readJsonFile(path);
}

export function defaultArtifactPath(root: string, target: string): string {
  switch (target) {
    case "manifest":
      return aopsPath(root, "manifest.json");
    case "workspace":
      return aopsPath(root, "workspace-inspection.json");
    case "repository":
      return aopsPath(root, "repository-inspection.json");
    case "plan":
      return aopsPath(root, "plan.json");
    case "docs":
      return aopsPath(root, "docs", "docs-index.json");
    case "handoff":
      return aopsPath(root, "handoff", "handoff.json");
    default:
      throw new Error(`No default path for target: ${target}`);
  }
}

export function artifactPath(root: string, folder: string, id: string): string {
  return aopsPath(root, folder, `${id}.json`);
}

export function nextSequentialId(root: string, folder: string, prefix: string, existingIds: string[] = []): string {
  const dir = aopsPath(root, folder);
  const ids = new Set(existingIds);
  if (existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".json")) {
        ids.add(file.slice(0, -5));
      }
    }
  }

  let max = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  for (const id of ids) {
    const match = id.match(pattern);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function listFilesRecursive(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

export function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function relativeToAops(root: string, path: string): string {
  return relative(aopsPath(root), path);
}
