import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AOPS_DIR, PROTECTED_FILES } from "./constants.js";
import { type WorkspaceInspection } from "./schemas.js";

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
