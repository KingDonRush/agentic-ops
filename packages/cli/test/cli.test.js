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
