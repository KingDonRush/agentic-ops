import { CURRENT_VERSION } from "./constants.js";
import { type PresetId } from "./presets.js";
import {
  type AnalysisReport,
  type HandoffPacket,
  type Manifest,
  type Phase,
  type Plan,
  type ResearchPacket,
  type Subplan,
  type Subtask,
  type Task,
  type Test,
} from "./schemas.js";

export function createWorkspaceId(root: string): string {
  return Buffer.from(root).toString("base64url").slice(0, 16);
}

function emptyBudget() {
  return {
    time_budget: "",
    complexity_budget: "",
    context_budget: "",
    research_budget: "",
    iteration_budget: "",
    scope_budget: "",
    ambiguity_budget: "",
    validation_budget: "",
  };
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

export function createPhase(input: {
  id: string;
  title: string;
  purpose?: string;
  entryCondition?: string;
  exitCondition?: string;
  requiredOutputs?: string[];
  acceptanceCriteria?: string[];
  validationRequired?: string[];
}): Phase {
  return {
    id: input.id,
    title: input.title,
    purpose: input.purpose ?? "",
    entry_condition: input.entryCondition ?? "",
    exit_condition: input.exitCondition ?? "",
    required_outputs: input.requiredOutputs ?? [],
    tasks: [],
    acceptance_criteria: input.acceptanceCriteria ?? [],
    validation_required: input.validationRequired ?? [],
  };
}

export function createTask(input: {
  id: string;
  title: string;
  objective?: string;
  description?: string;
  phaseId?: string;
  priority?: Task["priority"];
  complexity?: Task["complexity"];
  acceptanceCriteria?: string[];
  inputsRequired?: string[];
  expectedOutputs?: string[];
  risks?: string[];
  researchRequired?: boolean;
  requiresHumanValidation?: boolean;
}): Task {
  return {
    id: input.id,
    title: input.title,
    description: input.description ?? "",
    objective: input.objective ?? "",
    priority: input.priority ?? "medium",
    complexity: input.complexity ?? "moderate",
    status: "pending",
    phase_id: input.phaseId ?? "",
    depends_on: [],
    blocks: [],
    inputs_required: input.inputsRequired ?? [],
    expected_outputs: input.expectedOutputs ?? [],
    acceptance_criteria: input.acceptanceCriteria ?? [],
    budgets: emptyBudget(),
    risks: input.risks ?? [],
    research_required: input.researchRequired ?? false,
    tests: [],
    requires_human_validation: input.requiresHumanValidation ?? false,
    subtasks: [],
    subplans: [],
  };
}

export function createSubtask(input: {
  id: string;
  title: string;
  objective?: string;
  description?: string;
  acceptanceCriteria?: string[];
}): Subtask {
  return {
    id: input.id,
    title: input.title,
    description: input.description ?? "",
    objective: input.objective ?? "",
    status: "pending",
    depends_on: [],
    inputs_required: [],
    expected_output: "",
    acceptance_criteria: input.acceptanceCriteria ?? [],
    verification: [],
    risks: [],
    promote_to_subplan_if: [
      "This subtask gains its own phases.",
      "This subtask needs dedicated research and QA loops.",
      "This subtask crosses the parent task scope budget.",
    ],
  };
}

export function createSubplan(input: {
  id: string;
  parentTaskId: string;
  title: string;
  purpose: string;
  scopeBoundary: string;
  entryCondition: string;
  exitCondition: string;
}): Subplan {
  return {
    id: input.id,
    parent_task_id: input.parentTaskId,
    title: input.title,
    purpose: input.purpose,
    scope_boundary: input.scopeBoundary,
    entry_condition: input.entryCondition,
    exit_condition: input.exitCondition,
    max_depth: 1,
    allowed_expansion: [],
    forbidden_expansion: ["Changing the parent task objective without human validation."],
    budgets: emptyBudget(),
    tasks: [],
    tests: [],
    completion_criteria: [],
    handoff_notes: "",
  };
}

export function createTest(input: {
  id: string;
  type: Test["type"];
  target: string;
  objective: string;
  steps?: string[];
  passCriteria?: string[];
  evidenceRequired?: string[];
}): Test {
  return {
    id: input.id,
    type: input.type,
    target: input.target,
    objective: input.objective,
    preconditions: [],
    steps: input.steps ?? [],
    expected_result: "",
    pass_criteria: input.passCriteria ?? [],
    evidence_required: input.evidenceRequired ?? [],
    status: "pending",
    severity: "medium",
    depends_on: [],
    subtests: [],
  };
}

export function createAnalysisReport(input: {
  id: string;
  type: AnalysisReport["type"];
  target?: string;
  summary?: string;
  findings?: string[];
  recommendations?: string[];
}): AnalysisReport {
  return {
    id: input.id,
    type: input.type,
    target: input.target ?? "plan",
    summary: input.summary ?? "",
    findings: input.findings ?? [],
    recommendations: input.recommendations ?? [],
    related_research_packets: [],
    status: "draft",
    created_at: new Date().toISOString(),
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

export function createHandoffPacket(input: {
  id: string;
  plan?: Plan;
  currentState?: string;
}): HandoffPacket {
  const plan = input.plan;
  return {
    id: input.id,
    current_state: input.currentState ?? "draft",
    objective: plan?.objective ?? "",
    preset_used: plan?.preset,
    decisions_made: [],
    pending_decisions: [],
    plan_structure: {
      phases: plan?.phases.map((phase) => phase.id) ?? [],
      tasks: plan?.tasks.map((task) => task.id) ?? [],
      research_packets: plan?.research_packets.map((packet) => packet.id) ?? [],
    },
    completed_tasks: plan?.tasks.filter((task) => task.status === "done").map((task) => task.id) ?? [],
    pending_tasks: plan?.tasks.filter((task) => task.status !== "done").map((task) => task.id) ?? [],
    risks: plan?.tasks.flatMap((task) => task.risks) ?? [],
    research_packets: plan?.research_packets.map((packet) => packet.id) ?? [],
    validations: [],
    tests: plan?.tests.map((test) => test.id) ?? [],
    next_steps: ["Run aops validate plan before execution."],
    do_not_reopen: plan?.out_of_scope ?? [],
    how_to_continue_briefing_user: "Brief using current objective, preset, scope boundaries, open risks, and next validation gate.",
    first_recommended_cli_command: "aops validate plan",
    first_recommended_mcp_prompt: "create_handoff",
  };
}
