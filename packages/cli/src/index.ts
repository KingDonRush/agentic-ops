#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { Command } from "commander";
import {
  createAdapter,
  createAnalysisReport,
  createDecision,
  createDocsIndex,
  createDriftReport,
  createHandoffPacket,
  createManifest,
  createPatchSuggestion,
  createPhase,
  createPlan,
  createReadinessReport,
  createResearchPacket,
  createSubplan,
  createSubtask,
  createTask,
  createTest,
  getPreset,
  inspectRepository,
  inspectWorkspace,
  type Adapter,
  type AnalysisReport,
  type Decision,
  type PatchSuggestion,
  type Phase,
  type Plan,
  type PresetId,
  PresetIdSchema,
  type Snapshot,
  type Subplan,
  type Task,
  type Test,
  validateArtifact,
  type ValidationTarget,
} from "@agentic-ops/core";
import {
  aopsPath,
  artifactPath,
  defaultArtifactPath,
  ensureAopsTree,
  hashFile,
  listFilesRecursive,
  nextSequentialId,
  readJsonFile,
  readJsonFileIfExists,
  relativeToAops,
  resolveCwd,
  writeJsonFile,
} from "./storage.js";
import { printHuman, printJson } from "./output.js";
import { renderPlan } from "./renderers.js";

const program = new Command();

program
  .name("aops")
  .description("Agentic Ops CLI")
  .version("0.3.0")
  .option("--cwd <path>", "workspace directory", process.cwd())
  .option("--json", "print JSON output");

program
  .command("inspect")
  .description("Inspect a workspace without mutating it by default")
  .option("--write", "write inspection to .agentic-ops/workspace-inspection.json")
  .action((options) => {
    const root = rootCwd();
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

const repo = program.command("repo").description("Repository operations");

repo
  .command("inspect")
  .description("Inspect Git remotes, branch state, CI signals, and package scripts")
  .option("--write", "write inspection to .agentic-ops/repository-inspection.json")
  .action((options) => {
    const root = rootCwd();
    const inspection = inspectRepository(root);
    if (options.write) {
      ensureAopsTree(root);
      writeJsonFile(defaultArtifactPath(root, "repository"), inspection, { force: true });
    }
    printJson({
      status: options.write ? "written" : "inspected",
      output: options.write ? defaultArtifactPath(root, "repository") : undefined,
      validation: validateArtifact("repository", inspection),
      repository: inspection,
    });
  });

const ci = program.command("ci").description("CI operations");

ci
  .command("inspect")
  .description("Inspect CI signals without creating or changing CI config")
  .option("--write", "write repository inspection with CI signals")
  .action((options) => {
    const root = rootCwd();
    const inspection = inspectRepository(root);
    if (options.write) {
      ensureAopsTree(root);
      writeJsonFile(defaultArtifactPath(root, "repository"), inspection, { force: true });
    }
    printJson({
      status: options.write ? "written" : "inspected",
      ci_detected: inspection.ci_detected,
      package_scripts: inspection.package_scripts,
      recommendations: inspection.ci_detected.length
        ? ["Use existing CI signals before adding new automation."]
        : ["No CI signals detected; consider adding a verify script before remote CI integration."],
      repository: inspection,
    });
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
    const root = rootCwd();
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

program
  .command("validate")
  .description("Validate Agentic Ops artifacts")
  .argument("<target>", "workspace | manifest | plan | phase | task | subtask | subplan | research | test | analysis | handoff")
  .option("--file <path>", "artifact path")
  .action((targetName, options) => {
    const root = rootCwd();
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
    const root = rootCwd();
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

const phase = program.command("phase").description("Phase operations");

phase
  .command("create")
  .description("Create a phase and link it to plan.json when present")
  .requiredOption("--title <text>", "phase title")
  .option("--id <id>", "phase id")
  .option("--purpose <text>", "phase purpose")
  .option("--entry-condition <text>", "entry condition")
  .option("--exit-condition <text>", "exit condition")
  .option("--required-outputs <items>", "comma-separated required outputs")
  .option("--acceptance-criteria <items>", "comma-separated acceptance criteria")
  .option("--validation-required <items>", "comma-separated validation requirements")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing phase artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const phaseData = createPhase({
      id: options.id ?? nextSequentialId(root, "phases", "PHASE", planData?.phases.map((item) => item.id)),
      title: options.title,
      purpose: options.purpose,
      entryCondition: options.entryCondition,
      exitCondition: options.exitCondition,
      requiredOutputs: splitList(options.requiredOutputs),
      acceptanceCriteria: splitList(options.acceptanceCriteria),
      validationRequired: splitList(options.validationRequired),
    });
    const output = artifactPath(root, "phases", phaseData.id);
    if (!options.dryRun) {
      writeJsonFile(output, phaseData, { force: Boolean(options.force) });
      if (planData) {
        upsertById(planData.phases, phaseData);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("phase", phaseData), phase: phaseData });
  });

const task = program.command("task").description("Task operations");

task
  .command("create")
  .description("Create a task and link it to plan.json when present")
  .requiredOption("--title <text>", "task title")
  .option("--id <id>", "task id")
  .option("--objective <text>", "task objective")
  .option("--description <text>", "task description")
  .option("--phase-id <id>", "phase id")
  .option("--priority <level>", "critical | high | medium | low")
  .option("--complexity <level>", "simple | moderate | complex | very_complex")
  .option("--acceptance-criteria <items>", "comma-separated acceptance criteria")
  .option("--inputs-required <items>", "comma-separated required inputs")
  .option("--expected-outputs <items>", "comma-separated expected outputs")
  .option("--risks <items>", "comma-separated risks")
  .option("--research-required", "mark research required")
  .option("--human-validation", "mark human validation required")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing task artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const taskData = createTask({
      id: options.id ?? nextSequentialId(root, "tasks", "TASK", planData?.tasks.map((item) => item.id)),
      title: options.title,
      objective: options.objective,
      description: options.description,
      phaseId: options.phaseId,
      priority: parseChoice(options.priority, ["critical", "high", "medium", "low"]),
      complexity: parseChoice(options.complexity, ["simple", "moderate", "complex", "very_complex"]),
      acceptanceCriteria: splitList(options.acceptanceCriteria),
      inputsRequired: splitList(options.inputsRequired),
      expectedOutputs: splitList(options.expectedOutputs),
      risks: splitList(options.risks),
      researchRequired: Boolean(options.researchRequired),
      requiresHumanValidation: Boolean(options.humanValidation),
    });
    const output = artifactPath(root, "tasks", taskData.id);
    if (!options.dryRun) {
      writeJsonFile(output, taskData, { force: Boolean(options.force) });
      if (planData) {
        upsertById(planData.tasks, taskData);
        linkTaskToPhase(planData, taskData);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("task", taskData), task: taskData });
  });

task
  .command("start")
  .description("Mark a task as in_progress")
  .requiredOption("--task-id <id>", "task id")
  .option("--dry-run", "print without writing")
  .action((options) => {
    const root = rootCwd();
    const planData = requirePlan(root);
    const taskData = requireTask(root, planData, options.taskId);
    taskData.status = "in_progress";
    if (!options.dryRun) {
      saveTaskAndPlan(root, planData, taskData);
    }
    printJson({ status: options.dryRun ? "dry_run" : "updated", validation: validateArtifact("task", taskData), task: taskData });
  });

task
  .command("complete")
  .description("Mark a task as done and attach optional verification notes")
  .requiredOption("--task-id <id>", "task id")
  .option("--verification <items>", "comma-separated verification evidence")
  .option("--dry-run", "print without writing")
  .action((options) => {
    const root = rootCwd();
    const planData = requirePlan(root);
    const taskData = requireTask(root, planData, options.taskId);
    taskData.status = "done";
    taskData.verification ??= [];
    for (const note of splitList(options.verification)) {
      if (!taskData.verification.includes(note)) {
        taskData.verification.push(note);
      }
    }
    if (!options.dryRun) {
      saveTaskAndPlan(root, planData, taskData);
    }
    printJson({ status: options.dryRun ? "dry_run" : "updated", validation: validateArtifact("task", taskData), task: taskData });
  });

const subtask = program.command("subtask").description("Subtask operations");

subtask
  .command("create")
  .description("Create a subtask inside a task")
  .requiredOption("--task-id <id>", "parent task id")
  .requiredOption("--title <text>", "subtask title")
  .option("--id <id>", "subtask id")
  .option("--objective <text>", "subtask objective")
  .option("--description <text>", "subtask description")
  .option("--acceptance-criteria <items>", "comma-separated acceptance criteria")
  .option("--dry-run", "print without writing")
  .action((options) => {
    const root = rootCwd();
    const planData = requirePlan(root);
    const taskData = requireTask(root, planData, options.taskId);
    const subtaskData = createSubtask({
      id: options.id ?? `${options.taskId}-SUB-${String(taskData.subtasks.length + 1).padStart(3, "0")}`,
      title: options.title,
      objective: options.objective,
      description: options.description,
      acceptanceCriteria: splitList(options.acceptanceCriteria),
    });
    if (!options.dryRun) {
      upsertById(taskData.subtasks, subtaskData);
      saveTaskAndPlan(root, planData, taskData);
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", validation: validateArtifact("subtask", subtaskData), subtask: subtaskData });
  });

const subplan = program.command("subplan").description("Subplan operations");

subplan
  .command("create")
  .description("Create a bounded Matrioshka subplan")
  .requiredOption("--parent-task-id <id>", "parent task id")
  .requiredOption("--title <text>", "subplan title")
  .requiredOption("--purpose <text>", "subplan purpose")
  .requiredOption("--scope-boundary <text>", "scope boundary")
  .requiredOption("--entry-condition <text>", "entry condition")
  .requiredOption("--exit-condition <text>", "exit condition")
  .option("--id <id>", "subplan id")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing subplan artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = requirePlan(root);
    const taskData = requireTask(root, planData, options.parentTaskId);
    const subplanData = createSubplan({
      id: options.id ?? nextSequentialId(root, "subplans", "SUBPLAN"),
      parentTaskId: options.parentTaskId,
      title: options.title,
      purpose: options.purpose,
      scopeBoundary: options.scopeBoundary,
      entryCondition: options.entryCondition,
      exitCondition: options.exitCondition,
    });
    const output = artifactPath(root, "subplans", subplanData.id);
    if (!options.dryRun) {
      writeJsonFile(output, subplanData, { force: Boolean(options.force) });
      upsertSubplanRef(taskData, { id: subplanData.id, title: subplanData.title, path: output });
      saveTaskAndPlan(root, planData, taskData);
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("subplan", subplanData), subplan: subplanData });
  });

const testCommand = program.command("test").description("Test operations");

testCommand
  .command("create")
  .description("Create a first-class test")
  .requiredOption("--type <type>", "test type")
  .requiredOption("--target <target>", "target artifact id")
  .requiredOption("--objective <text>", "test objective")
  .option("--id <id>", "test id")
  .option("--task-id <id>", "link test to a task")
  .option("--steps <items>", "comma-separated steps")
  .option("--pass-criteria <items>", "comma-separated pass criteria")
  .option("--evidence-required <items>", "comma-separated evidence requirements")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing test artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const testData = createTest({
      id: options.id ?? nextSequentialId(root, "tests", "TEST", planData?.tests.map((item) => item.id)),
      type: parseRequiredChoice(options.type, [
        "acceptance_test",
        "visual_test",
        "functional_test",
        "integration_test",
        "regression_test",
        "accessibility_test",
        "performance_test",
        "security_test",
        "handoff_test",
        "research_validation_test",
      ]),
      target: options.target,
      objective: options.objective,
      steps: splitList(options.steps),
      passCriteria: splitList(options.passCriteria),
      evidenceRequired: splitList(options.evidenceRequired),
    });
    const output = artifactPath(root, "tests", testData.id);
    if (!options.dryRun) {
      writeJsonFile(output, testData, { force: Boolean(options.force) });
      if (planData) {
        upsertById(planData.tests, testData);
        if (options.taskId) {
          const taskData = requireTask(root, planData, options.taskId);
          upsertById(taskData.tests, testData);
          saveTaskAndPlan(root, planData, taskData);
        } else {
          savePlan(root, planData);
        }
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("test", testData), test: testData });
  });

program
  .command("analyze")
  .description("Create an analysis report")
  .argument("<type>", "complexity | fit | technical | execution | scope | test | handoff_readiness")
  .option("--target <target>", "analysis target", "plan")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing analysis artifact")
  .action((type, options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const report = createAnalysisReport({
      id: `ANALYSIS-${type}-${Date.now()}`,
      type: parseRequiredChoice(type, ["complexity", "fit", "technical", "execution", "scope", "test", "handoff_readiness"]),
      target: options.target,
      ...summarizeAnalysis(type, planData),
    });
    const output = artifactPath(root, "analysis", report.id);
    if (!options.dryRun) {
      writeJsonFile(output, report, { force: Boolean(options.force) });
      if (planData) {
        planData.analysis_reports.push(report);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("analysis", report), analysis: report });
  });

program
  .command("handoff")
  .description("Handoff operations")
  .command("create")
  .description("Create a handoff packet")
  .option("--current-state <text>", "current state")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing handoff artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const handoff = createHandoffPacket({
      id: `HANDOFF-${Date.now()}`,
      plan: planData,
      currentState: options.currentState,
    });
    const output = defaultArtifactPath(root, "handoff");
    if (!options.dryRun) {
      writeJsonFile(output, handoff, { force: Boolean(options.force) || true });
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("handoff", handoff), handoff });
  });

program
  .command("snapshot")
  .description("Snapshot operations")
  .command("create")
  .description("Create an operational snapshot")
  .option("--id <id>", "snapshot id")
  .option("--dry-run", "print without writing")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const snapshot = createSnapshot(root, options.id);
    const outputDir = aopsPath(root, "snapshots", snapshot.id);
    const output = join(outputDir, "snapshot.json");
    if (!options.dryRun) {
      mkdirSync(outputDir, { recursive: true });
      writeJsonFile(output, snapshot, { force: true });
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, snapshot });
  });

program
  .command("diff")
  .description("Show differences between two snapshot files or directories")
  .requiredOption("--from <path>", "snapshot file or directory")
  .requiredOption("--to <path>", "snapshot file or directory")
  .action((options) => {
    const from = readSnapshot(options.from);
    const to = readSnapshot(options.to);
    printJson(diffSnapshots(from, to));
  });

program
  .command("export")
  .description("Export plan in json, markdown, text, or yaml")
  .option("--format <format>", "json | markdown | text | yaml", "json")
  .option("--output <path>", "output path")
  .action((options) => {
    const root = rootCwd();
    const planData = requirePlan(root);
    const format = parseRequiredChoice(options.format, ["json", "markdown", "text", "yaml"]);
    const rendered = renderPlan(planData, format);
    if (options.output) {
      writeFileSync(resolveCwd(options.output), rendered, "utf8");
      printJson({ status: "exported", output: resolveCwd(options.output), format });
      return;
    }
    process.stdout.write(rendered);
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
    const root = rootCwd();
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
      const planData = loadPlan(root);
      if (planData) {
        upsertById(planData.research_packets, packet);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation, research_packet: packet });
  });

const decision = program.command("decision").description("Decision history operations");

decision
  .command("record")
  .description("Record a decision without treating it as code execution")
  .requiredOption("--title <text>", "decision title")
  .option("--summary <text>", "decision summary")
  .option("--rationale <text>", "decision rationale")
  .option("--status <status>", "proposed | accepted | superseded | rejected")
  .option("--affects <items>", "comma-separated affected artifacts")
  .option("--alternatives <items>", "comma-separated alternatives considered")
  .option("--evidence <items>", "comma-separated evidence references")
  .option("--risks <items>", "comma-separated risks")
  .option("--id <id>", "decision id")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing decision artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const decisionData = createDecision({
      id: options.id ?? nextSequentialId(root, "decisions", "DECISION", planData?.decisions.map((item) => item.id)),
      title: options.title,
      summary: options.summary,
      rationale: options.rationale,
      status: parseChoice(options.status, ["proposed", "accepted", "superseded", "rejected"]),
      affects: splitList(options.affects),
      alternativesConsidered: splitList(options.alternatives),
      evidence: splitList(options.evidence),
      risks: splitList(options.risks),
    });
    const output = artifactPath(root, "decisions", decisionData.id);
    if (!options.dryRun) {
      writeJsonFile(output, decisionData, { force: Boolean(options.force) });
      if (planData) {
        upsertById(planData.decisions, decisionData);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("decision", decisionData), decision: decisionData });
  });

const adapter = program.command("adapter").description("Adapter contract operations");

adapter
  .command("create")
  .description("Create a declarative adapter contract for an external surface")
  .requiredOption("--title <text>", "adapter title")
  .requiredOption("--type <type>", "repository | ci | documentation | external_tool | runtime | mcp | cli")
  .option("--id <id>", "adapter id")
  .option("--status <status>", "draft | active | degraded | disabled")
  .option("--purpose <text>", "adapter purpose")
  .option("--target <text>", "adapter target")
  .option("--capabilities <items>", "comma-separated capabilities")
  .option("--commands <items>", "comma-separated commands")
  .option("--scope-boundary <text>", "scope boundary")
  .option("--safety-notes <items>", "comma-separated safety notes")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing adapter artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const adapterData = createAdapter({
      id: options.id ?? nextSequentialId(root, "adapters", "ADAPTER"),
      title: options.title,
      type: parseRequiredChoice(options.type, ["repository", "ci", "documentation", "external_tool", "runtime", "mcp", "cli"]),
      status: parseChoice(options.status, ["draft", "active", "degraded", "disabled"]),
      purpose: options.purpose,
      target: options.target,
      capabilities: splitList(options.capabilities),
      commands: splitList(options.commands),
      scopeBoundary: options.scopeBoundary,
      safetyNotes: splitList(options.safetyNotes),
    });
    const output = artifactPath(root, "adapters", adapterData.id);
    if (!options.dryRun) {
      writeJsonFile(output, adapterData, { force: Boolean(options.force) });
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("adapter", adapterData), adapter: adapterData });
  });

const readiness = program.command("readiness").description("Readiness scoring operations");

readiness
  .command("score")
  .description("Create a readiness score from the current operational plan")
  .option("--target <target>", "report target", "plan")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing readiness artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const report = createReadinessReport({
      id: `READINESS-${Date.now()}`,
      plan: planData,
      target: options.target,
    });
    const output = artifactPath(root, "readiness", report.id);
    if (!options.dryRun) {
      writeJsonFile(output, report, { force: Boolean(options.force) });
      if (planData) {
        planData.readiness_reports.push(report);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("readiness", report), readiness: report });
  });

const drift = program.command("drift").description("Drift detection operations");

drift
  .command("check")
  .description("Create a drift report from the current operational plan")
  .option("--target <target>", "report target", "plan")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing drift artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const planData = loadPlan(root);
    const report = createDriftReport({
      id: `DRIFT-${Date.now()}`,
      plan: planData,
      target: options.target,
    });
    const output = artifactPath(root, "drift", report.id);
    if (!options.dryRun) {
      writeJsonFile(output, report, { force: Boolean(options.force) });
      if (planData) {
        planData.drift_reports.push(report);
        savePlan(root, planData);
      }
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("drift", report), drift: report });
  });

const docs = program.command("docs").description("Documentation integration operations");

docs
  .command("index")
  .description("Create a lightweight index of existing project documentation")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite docs index artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const index = createDocsIndex({
      id: `DOCS-${Date.now()}`,
      root,
      documents: collectDocumentEntries(root),
      gaps: docsGaps(root),
      recommendations: ["Use this index as input for handoff and onboarding before opening broad repository context."],
    });
    const output = defaultArtifactPath(root, "docs");
    if (!options.dryRun) {
      writeJsonFile(output, index, { force: Boolean(options.force) || true });
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("docs", index), docs_index: index });
  });

const patch = program.command("patch").description("Optional patch suggestion operations");

patch
  .command("suggest")
  .description("Create a patch suggestion artifact; never applies it")
  .requiredOption("--title <text>", "patch title")
  .option("--target-file <path>", "target file")
  .option("--type <type>", "agents_instruction | documentation | configuration | code | other")
  .option("--purpose <text>", "patch purpose")
  .option("--instructions <items>", "comma-separated implementation instructions")
  .option("--id <id>", "patch id")
  .option("--dry-run", "print without writing")
  .option("--force", "overwrite existing patch artifact")
  .action((options) => {
    const root = rootCwd();
    ensureAopsTree(root, Boolean(options.dryRun));
    const patchData = createPatchSuggestion({
      id: options.id ?? nextSequentialId(root, "patches", "PATCH"),
      title: options.title,
      targetFile: options.targetFile,
      patchType: parseChoice(options.type, ["agents_instruction", "documentation", "configuration", "code", "other"]),
      purpose: options.purpose,
      instructions: splitList(options.instructions),
    });
    const output = artifactPath(root, "patches", patchData.id);
    if (!options.dryRun) {
      writeJsonFile(output, patchData, { force: Boolean(options.force) });
    }
    printJson({ status: options.dryRun ? "dry_run" : "created", output, validation: validateArtifact("patch", patchData), patch: patchData });
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`aops error: ${message}\n`);
  process.exitCode = 1;
});

function rootCwd(): string {
  return resolveCwd(program.opts().cwd);
}

function parsePreset(value: string): PresetId {
  return PresetIdSchema.parse(value);
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseChoice<T extends string>(value: string | undefined, choices: readonly T[]): T | undefined {
  if (!value) return undefined;
  if (!choices.includes(value as T)) {
    throw new Error(`Invalid value "${value}". Expected one of: ${choices.join(", ")}`);
  }
  return value as T;
}

function parseRequiredChoice<T extends string>(value: string | undefined, choices: readonly T[]): T {
  const parsed = parseChoice(value, choices);
  if (!parsed) {
    throw new Error(`Missing value. Expected one of: ${choices.join(", ")}`);
  }
  return parsed;
}

function parseValidationTarget(value: string): ValidationTarget {
  const targets: ValidationTarget[] = [
    "workspace",
    "manifest",
    "plan",
    "phase",
    "task",
    "subtask",
    "subplan",
    "research",
    "test",
    "analysis",
    "handoff",
    "decision",
    "adapter",
    "repository",
    "readiness",
    "drift",
    "patch",
    "docs",
  ];
  if (!targets.includes(value as ValidationTarget)) {
    throw new Error(`Unknown validation target: ${value}`);
  }
  return value as ValidationTarget;
}

function resolveDefaultOrProvided(root: string, target: ValidationTarget, file?: string): string {
  if (file) return resolveCwd(file);
  if (target === "task" || target === "phase" || target === "subtask" || target === "subplan" || target === "research" || target === "test" || target === "analysis" || target === "decision" || target === "adapter" || target === "readiness" || target === "drift" || target === "patch") {
    throw new Error(`--file is required when validating ${target}`);
  }
  const path = defaultArtifactPath(root, target);
  if (!existsSync(path)) throw new Error(`Artifact not found: ${path}`);
  return path;
}

function loadPlan(root: string): Plan | undefined {
  const planData = readJsonFileIfExists(defaultArtifactPath(root, "plan")) as Plan | undefined;
  return planData ? normalizePlan(planData) : undefined;
}

function requirePlan(root: string): Plan {
  const planData = loadPlan(root);
  if (!planData) {
    throw new Error("plan.json not found. Run aops plan create first.");
  }
  return planData;
}

function savePlan(root: string, planData: Plan): void {
  writeJsonFile(defaultArtifactPath(root, "plan"), normalizePlan(planData), { force: true });
}

function normalizePlan(planData: Plan): Plan {
  planData.decisions ??= [];
  planData.analysis_reports ??= [];
  planData.readiness_reports ??= [];
  planData.drift_reports ??= [];
  planData.validation_results ??= [];
  planData.handoff ??= {};
  for (const taskData of planData.tasks ?? []) {
    taskData.verification ??= [];
  }
  return planData;
}

function requireTask(root: string, planData: Plan, taskId: string): Task {
  const fromFile = readJsonFileIfExists(artifactPath(root, "tasks", taskId)) as Task | undefined;
  const fromPlan = planData.tasks.find((item) => item.id === taskId);
  const taskData = fromFile ?? fromPlan;
  if (!taskData) {
    throw new Error(`Task not found: ${taskId}`);
  }
  return taskData;
}

function saveTaskAndPlan(root: string, planData: Plan, taskData: Task): void {
  writeJsonFile(artifactPath(root, "tasks", taskData.id), taskData, { force: true });
  upsertById(planData.tasks, taskData);
  savePlan(root, planData);
}

function upsertById<T extends { id: string }>(items: T[], item: T): void {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
}

function upsertSubplanRef(taskData: Task, item: { id: string; title: string; path: string }): void {
  const index = taskData.subplans.findIndex((candidate) => {
    if (typeof candidate === "string") {
      return candidate === item.id;
    }
    return candidate.id === item.id;
  });
  if (index >= 0) {
    taskData.subplans[index] = item;
  } else {
    taskData.subplans.push(item);
  }
}

function linkTaskToPhase(planData: Plan, taskData: Task): void {
  if (!taskData.phase_id) return;
  const phaseData = planData.phases.find((item) => item.id === taskData.phase_id);
  if (phaseData && !phaseData.tasks.includes(taskData.id)) {
    phaseData.tasks.push(taskData.id);
  }
}

function summarizeAnalysis(type: string, planData?: Plan): Pick<AnalysisReport, "summary" | "findings" | "recommendations"> {
  if (!planData) {
    return {
      summary: "No plan found.",
      findings: ["Run aops plan create before deeper analysis."],
      recommendations: ["Create a plan and rerun analysis."],
    };
  }
  if (type === "complexity") {
    const subplanCount = planData.tasks.reduce((total, task) => total + task.subplans.length, 0);
    return {
      summary: "Complexity analysis based on current operational plan counts.",
      findings: [
        `phases: ${planData.phases.length}`,
        `tasks: ${planData.tasks.length}`,
        `subplans linked from tasks: ${subplanCount}`,
        `tests: ${planData.tests.length}`,
        `research packets: ${planData.research_packets.length}`,
      ],
      recommendations: subplanCount === 0
        ? ["Promote oversized or uncertain tasks to subplans when needed."]
        : ["Validate each subplan has an exit condition and completion criteria."],
    };
  }
  return {
    summary: `${type} analysis draft for ${planData.id}.`,
    findings: ["Analysis report created as a structured placeholder."],
    recommendations: ["Fill findings with evidence before treating this report as decision-ready."],
  };
}

function createSnapshot(root: string, id?: string): Snapshot {
  const snapshotId = id ?? `SNAPSHOT-${Date.now()}`;
  const files = listFilesRecursive(aopsPath(root))
    .filter((file) => !relativeToAops(root, file).startsWith("snapshots/"))
    .map((file) => ({ path: relativeToAops(root, file), sha256: hashFile(file) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return { id: snapshotId, created_at: new Date().toISOString(), files };
}

function readSnapshot(path: string): Snapshot {
  const resolved = resolveCwd(path);
  const file = existsSync(join(resolved, "snapshot.json")) ? join(resolved, "snapshot.json") : resolved;
  return readJsonFile(file) as Snapshot;
}

function diffSnapshots(from: Snapshot, to: Snapshot) {
  const fromMap = new Map(from.files.map((file) => [file.path, file.sha256]));
  const toMap = new Map(to.files.map((file) => [file.path, file.sha256]));
  const added = [...toMap.keys()].filter((path) => !fromMap.has(path));
  const removed = [...fromMap.keys()].filter((path) => !toMap.has(path));
  const changed = [...toMap.keys()].filter((path) => fromMap.has(path) && fromMap.get(path) !== toMap.get(path));
  return { from: from.id, to: to.id, added, removed, changed };
}

function collectDocumentEntries(root: string) {
  return collectCandidateDocuments(root)
    .map((file) => {
      const rel = relative(root, file);
      return {
        path: rel,
        kind: inferDocumentKind(rel),
        title: readTitle(file),
        notes: [],
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function collectCandidateDocuments(root: string): string[] {
  const ignored = new Set([".git", "node_modules", "dist", "coverage", ".agentic-ops"]);
  const found: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 4 || !existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      if (ignored.has(entry)) continue;
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path, depth + 1);
        continue;
      }
      if (isDocCandidate(path)) {
        found.push(path);
      }
    }
  }

  walk(root, 0);
  return found;
}

function isDocCandidate(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".mdx") || lower.endsWith(".txt");
}

function inferDocumentKind(path: string): "readme" | "agents" | "docs" | "planning" | "unknown" {
  const lower = path.toLowerCase();
  if (lower.endsWith("readme.md")) return "readme";
  if (lower.endsWith("agents.md") || lower.endsWith("claude.md") || lower.endsWith("gemini.md")) return "agents";
  if (lower.startsWith("docs/")) return "docs";
  if (lower.includes("plan") || lower.includes("roadmap") || lower.includes("strategy")) return "planning";
  return "unknown";
}

function readTitle(path: string): string {
  try {
    const firstHeading = readFileSync(path, "utf8")
      .split("\n")
      .find((line) => line.startsWith("# "));
    return firstHeading ? firstHeading.replace(/^#\s+/, "").trim() : "";
  } catch {
    return "";
  }
}

function docsGaps(root: string): string[] {
  const docs = collectCandidateDocuments(root).map((file) => relative(root, file).toLowerCase());
  const gaps: string[] = [];
  if (!docs.some((file) => file.endsWith("readme.md"))) {
    gaps.push("No README.md detected.");
  }
  if (!docs.some((file) => file.endsWith("agents.md"))) {
    gaps.push("No AGENTS.md detected.");
  }
  if (!docs.some((file) => file.startsWith("docs/"))) {
    gaps.push("No docs/ markdown files detected.");
  }
  return gaps;
}
