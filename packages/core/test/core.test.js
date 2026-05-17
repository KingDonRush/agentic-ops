import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createSubplan,
  createTest,
  createPlan,
  createResearchPacket,
  inspectWorkspace,
  validateArtifact,
} from "../dist/index.js";

test("creates a valid plan with TASK-001", () => {
  const plan = createPlan({
    objective: "Create an operational plan",
    preset: "research_strategy_conceptual",
  });
  const result = validateArtifact("plan", plan);

  assert.equal(result.valid, true);
  assert.equal(plan.tasks[0].id, "TASK-001");
});

test("creates valid V1 subplan and test objects", () => {
  const subplan = createSubplan({
    id: "SUBPLAN-001",
    parentTaskId: "TASK-002",
    title: "Bounded implementation slice",
    purpose: "Resolve one risky slice without expanding parent scope.",
    scopeBoundary: "Only this implementation slice.",
    entryCondition: "Parent task is accepted.",
    exitCondition: "Completion criteria pass.",
  });
  const testObject = createTest({
    id: "TEST-001",
    type: "acceptance_test",
    target: "TASK-002",
    objective: "Validate task acceptance.",
    passCriteria: ["Observable evidence exists."],
  });

  assert.equal(validateArtifact("subplan", subplan).valid, true);
  assert.equal(validateArtifact("test", testObject).valid, true);
});

test("creates a valid research packet", () => {
  const packet = createResearchPacket({
    question: "Which MCP SDK should V0 use?",
    decision: "Select MCP dependency baseline",
  });
  const result = validateArtifact("research", packet);

  assert.equal(result.valid, true);
  assert.equal(packet.decision_dependency, "Select MCP dependency baseline");
});

test("inspects existing agentic files and recommends overlay", () => {
  const root = mkdtempSync(join(tmpdir(), "aops-core-"));
  writeFileSync(join(root, "AGENTS.md"), "# Agent instructions\n");

  const inspection = inspectWorkspace(root);

  assert.equal(inspection.recommended_mode, "overlay");
  assert.deepEqual(inspection.agentic_files, ["AGENTS.md"]);
});
