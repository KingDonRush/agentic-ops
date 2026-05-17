#!/usr/bin/env node
import { existsSync } from "node:fs";
import { Command } from "commander";
import {
  createManifest,
  createPlan,
  createResearchPacket,
  getPreset,
  inspectWorkspace,
  type PresetId,
  PresetIdSchema,
  validateArtifact,
} from "@agentic-ops/core";
import { defaultArtifactPath, ensureAopsTree, readJsonFile, resolveCwd, writeJsonFile, aopsPath } from "./storage.js";
import { printHuman, printJson } from "./output.js";

const program = new Command();

program
  .name("aops")
  .description("Agentic Ops CLI")
  .version("0.1.0")
  .option("--cwd <path>", "workspace directory", process.cwd())
  .option("--json", "print JSON output");

program
  .command("inspect")
  .description("Inspect a workspace without mutating it by default")
  .option("--write", "write inspection to .agentic-ops/workspace-inspection.json")
  .action((options) => {
    const root = resolveCwd(program.opts().cwd);
    const inspection = inspectWorkspace(root);
    if (options.write) {
      ensureAopsTree(root);
      writeJsonFile(defaultArtifactPath(root, "workspace"), inspection, { force: true });
    }
    if (program.opts().json || options.write) {
      printJson(inspection);
      return;
    }
    printHuman("Workspace inspection", [
      `root: ${inspection.root}`,
      `project type: ${inspection.project_type}`,
      `detected stack: ${inspection.detected_stack.join(", ") || "none"}`,
      `agentic files: ${inspection.agentic_files.join(", ") || "none"}`,
      `recommended mode: ${inspection.recommended_mode}`,
    ]);
  });

program
  .command("init")
  .description("Create a non-destructive .agentic-ops overlay")
  .requiredOption("--non-destructive", "acknowledge non-destructive mode")
  .option("--overlay", "force overlay mode")
  .option("--preset <preset>", "active preset")
  .option("--dry-run", "show what would be created")
  .option("--force", "allow overwriting Agentic Ops artifacts only")
  .action((options) => {
    const root = resolveCwd(program.opts().cwd);
    const inspection = inspectWorkspace(root);
    const preset = options.preset ? parsePreset(options.preset) : undefined;
    const mode = options.overlay ? "overlay" : inspection.recommended_mode;
    const manifest = createManifest({
      root,
      mode,
      detectedAgentFiles: inspection.agentic_files,
      detectedStack: inspection.detected_stack,
      activePreset: preset,
    });
    const created = ensureAopsTree(root, Boolean(options.dryRun));
    if (!options.dryRun) {
      writeJsonFile(defaultArtifactPath(root, "manifest"), manifest, { force: Boolean(options.force) });
      writeJsonFile(defaultArtifactPath(root, "workspace"), inspection, { force: true });
    }
    printJson({
      status: options.dryRun ? "dry_run" : "initialized",
      root,
      mode,
      created,
      manifest_path: defaultArtifactPath(root, "manifest"),
      safety: "No existing project files were overwritten. Writes are limited to .agentic-ops/.",
    });
  });

const validate = program.command("validate").description("Validate Agentic Ops artifacts");

validate
  .argument("<target>", "workspace | manifest | plan | task | research | handoff")
  .option("--file <path>", "artifact path")
  .action((targetName, options) => {
    const root = resolveCwd(program.opts().cwd);
    const target = parseValidationTarget(targetName);
    const data = target === "workspace"
      ? (options.file ? readJsonFile(options.file) : inspectWorkspace(root))
      : readJsonFile(resolveDefaultOrProvided(root, target, options.file));
    printJson(validateArtifact(target, data));
  });

const plan = program.command("plan").description("Plan operations");

plan
  .command("create")
  .description("Create a plan skeleton")
  .requiredOption("--preset <preset>", "methodological preset")
  .requiredOption("--objective <text>", "central objective")
  .option("--scope <items>", "comma-separated scope items")
  .option("--out-of-scope <items>", "comma-separated out-of-scope items")
  .option("--output <path>", "output path")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing plan artifact")
  .action((options) => {
    const root = resolveCwd(program.opts().cwd);
    ensureAopsTree(root, Boolean(options.dryRun));
    const preset = parsePreset(options.preset);
    const planData = createPlan({
      objective: options.objective,
      preset,
      scope: splitList(options.scope),
      outOfScope: splitList(options.outOfScope),
    });
    const validation = validateArtifact("plan", planData);
    const output = options.output ? resolveCwd(options.output) : defaultArtifactPath(root, "plan");
    if (!options.dryRun) {
      writeJsonFile(output, planData, { force: Boolean(options.force) });
    }
    printJson({
      status: options.dryRun ? "dry_run" : "created",
      preset: getPreset(preset),
      output,
      validation,
      plan: planData,
    });
  });

const research = program.command("research").description("Research packet operations");

research
  .command("brief")
  .description("Create a refined research packet for AI execution")
  .requiredOption("--question <text>", "research question")
  .requiredOption("--decision <text>", "decision that depends on this research")
  .option("--allowed-scope <items>", "comma-separated allowed scope")
  .option("--forbidden-scope <items>", "comma-separated forbidden scope")
  .option("--output <path>", "output path")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing research artifact")
  .action((options) => {
    const root = resolveCwd(program.opts().cwd);
    ensureAopsTree(root, Boolean(options.dryRun));
    const packet = createResearchPacket({
      question: options.question,
      decision: options.decision,
      allowedScope: splitList(options.allowedScope),
      forbiddenScope: splitList(options.forbiddenScope),
    });
    const validation = validateArtifact("research", packet);
    const output = options.output
      ? resolveCwd(options.output)
      : aopsPath(root, "research", `${packet.id}.json`);
    if (!options.dryRun) {
      writeJsonFile(output, packet, { force: Boolean(options.force) });
    }
    printJson({
      status: options.dryRun ? "dry_run" : "created",
      output,
      validation,
      research_packet: packet,
    });
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`aops error: ${message}\n`);
  process.exitCode = 1;
});

function parsePreset(value: string): PresetId {
  return PresetIdSchema.parse(value);
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseValidationTarget(value: string) {
  const targets = ["workspace", "manifest", "plan", "task", "research", "handoff"] as const;
  if (!targets.includes(value as typeof targets[number])) {
    throw new Error(`Unknown validation target: ${value}`);
  }
  return value as typeof targets[number];
}

function resolveDefaultOrProvided(root: string, target: ReturnType<typeof parseValidationTarget>, file?: string): string {
  if (file) {
    return resolveCwd(file);
  }

  if (target === "task" || target === "research") {
    throw new Error(`--file is required when validating ${target}`);
  }

  const path = defaultArtifactPath(root, target);
  if (!existsSync(path)) {
    throw new Error(`Artifact not found: ${path}`);
  }
  return path;
}
