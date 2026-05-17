import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
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
