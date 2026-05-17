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
