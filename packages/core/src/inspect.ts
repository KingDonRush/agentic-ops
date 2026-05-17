import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AOPS_DIR, PROTECTED_FILES } from "./constants.js";
import { type RepositoryInspection, type WorkspaceInspection } from "./schemas.js";

const agenticFileNames = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",
  ".windsurfrules",
  "GEMINI.md",
];

export function inspectWorkspace(root: string): WorkspaceInspection {
  const files = safeList(root);
  const agenticFiles = agenticFileNames.filter((name) => existsSync(join(root, name)));
  const docs = files.filter((name) => name === "docs" || name.toLowerCase().includes("readme"));
  const packageManagers = detectPackageManagers(root);
  const frameworks = detectFrameworks(root);
  const detectedStack = detectStack(root, files);
  const hasAgenticOps = existsSync(join(root, AOPS_DIR));
  const overwriteRisks = PROTECTED_FILES.filter((name) => existsSync(join(root, name)));

  return {
    root,
    project_type: inferProjectType(detectedStack, frameworks),
    detected_stack: detectedStack,
    package_managers: packageManagers,
    frameworks,
    agentic_files: agenticFiles,
    docs,
    has_agentic_ops: hasAgenticOps,
    overwrite_risks: overwriteRisks,
    recommended_mode: hasAgenticOps ? "adopted" : agenticFiles.length ? "overlay" : "new",
    notes: agenticFiles.length
      ? ["Existing agentic instructions detected. Use non-destructive overlay mode."]
      : ["No common agentic instruction file detected."],
  };
}

export function inspectRepository(root: string): RepositoryInspection {
  const isGitRepo = existsSync(join(root, ".git")) || git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
  const statusLines = isGitRepo ? git(root, ["status", "--short"]).split("\n").filter(Boolean) : [];
  const packageScripts = readPackageScripts(root);

  return {
    root,
    is_git_repo: isGitRepo,
    branch: isGitRepo ? git(root, ["rev-parse", "--abbrev-ref", "HEAD"]) : "",
    remotes: isGitRepo ? readGitRemotes(root) : [],
    latest_commit: isGitRepo ? git(root, ["rev-parse", "--short", "HEAD"]) : "",
    dirty: statusLines.length > 0,
    changed_files: statusLines.map((line) => line.slice(3).trim()).filter(Boolean),
    ci_detected: detectCi(root, packageScripts),
    package_scripts: packageScripts,
    notes: [
      isGitRepo ? "Git repository detected." : "No Git repository detected.",
      statusLines.length ? "Workspace has uncommitted changes." : "No uncommitted changes detected by git status.",
    ],
  };
}

function safeList(root: string): string[] {
  try {
    return readdirSync(root);
  } catch {
    return [];
  }
}

function detectPackageManagers(root: string): string[] {
  const managers: string[] = [];
  if (existsSync(join(root, "package-lock.json"))) managers.push("npm");
  if (existsSync(join(root, "pnpm-lock.yaml"))) managers.push("pnpm");
  if (existsSync(join(root, "yarn.lock"))) managers.push("yarn");
  if (existsSync(join(root, "composer.lock"))) managers.push("composer");
  if (existsSync(join(root, "uv.lock"))) managers.push("uv");
  if (existsSync(join(root, "poetry.lock"))) managers.push("poetry");
  return managers;
}

function detectFrameworks(root: string): string[] {
  const frameworks: string[] = [];
  const packageJson = join(root, "package.json");
  if (!existsSync(packageJson)) return frameworks;

  try {
    const pkg = JSON.parse(readFileSync(packageJson, "utf8"));
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const key of ["next", "react", "vue", "svelte", "vite", "@wordpress/scripts", "elementor"]) {
      if (deps[key]) frameworks.push(key);
    }
  } catch {
    // Ignore malformed package.json during inspection.
  }
  return frameworks;
}

function detectStack(root: string, files: string[]): string[] {
  const stack = new Set<string>();
  if (files.includes("package.json")) stack.add("node");
  if (files.includes("composer.json")) stack.add("php");
  if (files.includes("pyproject.toml")) stack.add("python");
  if (files.includes("Cargo.toml")) stack.add("rust");
  if (existsSync(join(root, "wp-content")) || existsSync(join(root, "wordpress"))) stack.add("wordpress");
  if (directoryExists(join(root, "src"))) stack.add("source-layout");
  return [...stack];
}

function inferProjectType(stack: string[], frameworks: string[]): string {
  if (stack.includes("wordpress")) return "wordpress";
  if (frameworks.includes("next") || frameworks.includes("react") || frameworks.includes("vue")) return "frontend";
  if (stack.includes("node")) return "node";
  if (stack.includes("python")) return "python";
  if (stack.includes("php")) return "php";
  return "unknown";
}

function directoryExists(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function readGitRemotes(root: string): RepositoryInspection["remotes"] {
  const lines = git(root, ["remote", "-v"]).split("\n").filter(Boolean);
  const seen = new Set<string>();
  const remotes: RepositoryInspection["remotes"] = [];

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match || match[3] !== "fetch") continue;
    const key = `${match[1]}:${match[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    remotes.push({ name: match[1], url: match[2] });
  }

  return remotes;
}

function readPackageScripts(root: string): string[] {
  const packageJson = join(root, "package.json");
  if (!existsSync(packageJson)) return [];

  try {
    const pkg = JSON.parse(readFileSync(packageJson, "utf8"));
    return Object.keys(pkg.scripts ?? {}).sort();
  } catch {
    return [];
  }
}

function detectCi(root: string, packageScripts: string[]): string[] {
  const ci = new Set<string>();
  if (directoryExists(join(root, ".github", "workflows"))) ci.add("github_actions");
  if (existsSync(join(root, ".gitlab-ci.yml"))) ci.add("gitlab_ci");
  if (existsSync(join(root, ".circleci", "config.yml"))) ci.add("circleci");
  if (existsSync(join(root, "azure-pipelines.yml"))) ci.add("azure_pipelines");
  if (packageScripts.some((script) => ["test", "verify", "lint", "build"].includes(script))) ci.add("package_scripts");
  return [...ci];
}
