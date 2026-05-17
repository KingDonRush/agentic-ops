import { CURRENT_VERSION } from "./constants.js";
import { type PresetId } from "./presets.js";
import { type Manifest, type Plan, type ResearchPacket, type Task } from "./schemas.js";

export function createWorkspaceId(root: string): string {
  return Buffer.from(root).toString("base64url").slice(0, 16);
}

export function createManifest(input: {
  root: string;
  mode: Manifest["mode"];
  detectedAgentFiles?: string[];
  detectedStack?: string[];
  activePreset?: PresetId;
}): Manifest {
  return {
    agentic_ops_version: CURRENT_VERSION,
    workspace_id: createWorkspaceId(input.root),
    initialized_at: new Date().toISOString(),
    mode: input.mode,
    detected_agent_files: input.detectedAgentFiles ?? [],
    detected_stack: input.detectedStack ?? [],
    active_preset: input.activePreset,
    artifacts: ["manifest.json", "workspace-inspection.json"],
    compatibility_notes: input.detectedAgentFiles?.length
      ? ["Existing agentic instructions detected; use overlay mode."]
      : [],
    safety_notes: ["Agentic Ops writes only to .agentic-ops by default."],
  };
}

export function createTask001(preset: PresetId, objective: string): Task {
  return {
    id: "TASK-001",
    title: "Plano-mae e ancoragem operacional",
    description: "Anchor the operational plan before task execution.",
    objective,
    priority: "critical",
    complexity: "moderate",
    status: "pending",
    phase_id: "PHASE-000",
    depends_on: [],
    blocks: [],
    inputs_required: ["briefing", "selected preset", "scope boundaries"],
    expected_outputs: ["anchored operational contract"],
    acceptance_criteria: [
      "Central objective is explicit.",
      "Preset is justified.",
      "Scope and out-of-scope are recorded.",
      "Continuity criteria are clear enough for another AI.",
    ],
    budgets: {
      time_budget: "one planning pass",
      complexity_budget: "moderate",
      context_budget: "project brief plus selected preset",
      research_budget: "light unless volatile dependencies are present",
      iteration_budget: "one refinement pass before validation",
      scope_budget: "planning contract only",
      ambiguity_budget: "medium; dangerous uncertainty requires validation",
      validation_budget: "human validation required for intent or scope changes",
    },
    risks: ["Jumping into generic tasks before the operational contract exists."],
    research_required: false,
    tests: [],
    requires_human_validation: true,
    subtasks: [],
    subplans: [],
  };
}

export function createPlan(input: {
  objective: string;
  preset: PresetId;
  scope?: string[];
  outOfScope?: string[];
}): Plan {
  return {
    id: "PLAN-001",
    objective: input.objective,
    scope: input.scope ?? [],
    out_of_scope: input.outOfScope ?? ["Do not overwrite existing project files without explicit approval."],
    preset: input.preset,
    briefing: {
      mantra: "Como isso vai continuar funcionando depois que eu parar de explicar?",
      status: "draft",
    },
    phases: [
      {
        id: "PHASE-000",
        title: "Initial orientation and preset choice",
        purpose: "Prevent generic task generation before the project is oriented.",
        entry_condition: "Raw briefing or project context exists.",
        exit_condition: "Preset, scope boundaries, and research needs are recorded.",
        required_outputs: ["briefing", "selected preset", "scope boundaries"],
        tasks: ["TASK-001"],
        acceptance_criteria: ["TASK-001 exists and anchors the plan."],
        validation_required: ["validate plan"],
      },
    ],
    tasks: [createTask001(input.preset, input.objective)],
    research_packets: [],
    decisions: [],
    budgets: {
      time_budget: "",
      complexity_budget: "",
      context_budget: "",
      research_budget: "",
      iteration_budget: "",
      scope_budget: "",
      ambiguity_budget: "",
      validation_budget: "",
    },
    tests: [],
    analysis_reports: [],
    validation_results: [],
    handoff: {},
  };
}

export function createResearchPacket(input: {
  id?: string;
  question: string;
  decision: string;
  allowedScope?: string[];
  forbiddenScope?: string[];
}): ResearchPacket {
  return {
    id: input.id ?? `RESEARCH-${Date.now()}`,
    question: input.question,
    reason: "Reduce technical risk and avoid reinventing the wheel.",
    decision_dependency: input.decision,
    allowed_scope: input.allowedScope ?? [],
    forbidden_scope: input.forbiddenScope ?? ["Do not broaden project scope beyond the decision dependency."],
    desired_sources: ["official documentation", "source code", "release notes", "maintained repositories"],
    update_policy: "Use current sources for volatile technology, API, version, compatibility, and pricing facts.",
    reliability_signals: ["primary source", "recent maintenance", "clear compatibility notes"],
    alternatives_to_compare: [],
    wheel_reinvention_risk: "unknown_until_researched",
    plan_impact: "Record whether the finding changes architecture, preset, scope, or phase order.",
    task_impact: "Record whether tasks should be created, split, removed, or promoted to subplans.",
    recommendation: "",
    remaining_uncertainties: [],
    validation_required: [],
  };
}
