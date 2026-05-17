import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const cli = resolve("packages/cli/dist/index.js");

test("init creates .agentic-ops without modifying existing AGENTS.md", () => {
  const root = mkdtempSync(join(tmpdir(), "aops-cli-"));
  const agentsPath = join(root, "AGENTS.md");
  writeFileSync(agentsPath, "# Existing instructions\n");

  const output = execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "init",
    "--non-destructive",
  ], { encoding: "utf8" });
  const parsed = JSON.parse(output);

  assert.equal(parsed.status, "initialized");
  assert.equal(parsed.mode, "overlay");
  assert.equal(readFileSync(agentsPath, "utf8"), "# Existing instructions\n");
  assert.equal(existsSync(join(root, ".agentic-ops", "manifest.json")), true);
});

test("plan create writes a valid plan", () => {
  const root = mkdtempSync(join(tmpdir(), "aops-cli-"));
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "plan",
    "create",
    "--preset",
    "research_strategy_conceptual",
    "--objective",
    "Plan a reusable agentic workflow",
  ], { encoding: "utf8" });

  const plan = JSON.parse(readFileSync(join(root, ".agentic-ops", "plan.json"), "utf8"));
  assert.equal(plan.id, "PLAN-001");
  assert.equal(plan.tasks[0].id, "TASK-001");
});

test("V1 commands create phases, tasks, subplans, tests, analysis, handoff, snapshots, and exports", () => {
  const root = mkdtempSync(join(tmpdir(), "aops-cli-v1-"));
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "plan",
    "create",
    "--preset",
    "research_strategy_conceptual",
    "--objective",
    "Plan a reusable agentic workflow",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "phase",
    "create",
    "--title",
    "Implementation phase",
    "--entry-condition",
    "Plan exists",
    "--exit-condition",
    "Task validated",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "task",
    "create",
    "--title",
    "Implement V1",
    "--phase-id",
    "PHASE-001",
    "--acceptance-criteria",
    "Build passes,Tests pass",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "subtask",
    "create",
    "--task-id",
    "TASK-002",
    "--title",
    "Add core schemas",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "subplan",
    "create",
    "--parent-task-id",
    "TASK-002",
    "--title",
    "Bounded risky slice",
    "--purpose",
    "Keep implementation bounded",
    "--scope-boundary",
    "Only V1 object commands",
    "--entry-condition",
    "Task exists",
    "--exit-condition",
    "Commands validate",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "test",
    "create",
    "--type",
    "acceptance_test",
    "--target",
    "TASK-002",
    "--task-id",
    "TASK-002",
    "--objective",
    "Validate V1 task",
    "--pass-criteria",
    "Evidence exists",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "analyze", "complexity"], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "handoff", "create"], { encoding: "utf8" });
  const snapshotOutput = execFileSync(process.execPath, [cli, "--cwd", root, "snapshot", "create"], { encoding: "utf8" });
  const snapshot = JSON.parse(snapshotOutput);
  const exported = execFileSync(process.execPath, [cli, "--cwd", root, "export", "--format", "markdown"], { encoding: "utf8" });

  const plan = JSON.parse(readFileSync(join(root, ".agentic-ops", "plan.json"), "utf8"));
  const task = JSON.parse(readFileSync(join(root, ".agentic-ops", "tasks", "TASK-002.json"), "utf8"));

  assert.equal(plan.phases.some((phase) => phase.id === "PHASE-001"), true);
  assert.equal(plan.tasks.some((item) => item.id === "TASK-002"), true);
  assert.equal(task.subtasks.length, 1);
  assert.equal(task.subplans.length, 1);
  assert.equal(task.tests.length, 1);
  assert.equal(existsSync(join(root, ".agentic-ops", "handoff", "handoff.json")), true);
  assert.equal(snapshot.snapshot.files.length > 0, true);
  assert.match(exported, /# PLAN-001/);
});

test("V2 commands create maturity artifacts without changing project files", () => {
  const root = mkdtempSync(join(tmpdir(), "aops-cli-v2-"));
  const readmePath = join(root, "README.md");
  writeFileSync(readmePath, "# Demo Project\n");
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "plan",
    "create",
    "--preset",
    "research_strategy_conceptual",
    "--objective",
    "Plan a reusable agentic workflow",
    "--scope",
    "planning",
    "--out-of-scope",
    "runtime automation",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "task",
    "create",
    "--title",
    "Implement V2",
    "--acceptance-criteria",
    "Readiness and drift commands work",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "repo", "inspect", "--write"], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "ci", "inspect"], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "decision",
    "record",
    "--title",
    "Keep V2 non-destructive",
    "--status",
    "accepted",
    "--evidence",
    "README.md remains unchanged",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "adapter",
    "create",
    "--title",
    "Repository adapter",
    "--type",
    "repository",
    "--scope-boundary",
    "Read-only repository metadata",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "task", "start", "--task-id", "TASK-002"], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "task",
    "complete",
    "--task-id",
    "TASK-002",
    "--verification",
    "V2 command smoke passed",
  ], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "readiness", "score"], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "drift", "check"], { encoding: "utf8" });
  execFileSync(process.execPath, [cli, "--cwd", root, "docs", "index"], { encoding: "utf8" });
  execFileSync(process.execPath, [
    cli,
    "--cwd",
    root,
    "patch",
    "suggest",
    "--title",
    "Optional AGENTS note",
    "--target-file",
    "AGENTS.md",
    "--type",
    "agents_instruction",
  ], { encoding: "utf8" });

  const plan = JSON.parse(readFileSync(join(root, ".agentic-ops", "plan.json"), "utf8"));
  const task = JSON.parse(readFileSync(join(root, ".agentic-ops", "tasks", "TASK-002.json"), "utf8"));

  assert.equal(readFileSync(readmePath, "utf8"), "# Demo Project\n");
  assert.equal(existsSync(join(root, ".agentic-ops", "repository-inspection.json")), true);
  assert.equal(existsSync(join(root, ".agentic-ops", "docs", "docs-index.json")), true);
  assert.equal(existsSync(join(root, ".agentic-ops", "decisions", "DECISION-001.json")), true);
  assert.equal(existsSync(join(root, ".agentic-ops", "adapters", "ADAPTER-001.json")), true);
  assert.equal(existsSync(join(root, ".agentic-ops", "patches", "PATCH-001.json")), true);
  assert.equal(plan.decisions.length, 1);
  assert.equal(plan.readiness_reports.length, 1);
  assert.equal(plan.drift_reports.length, 1);
  assert.equal(task.status, "done");
  assert.deepEqual(task.verification, ["V2 command smoke passed"]);
});
