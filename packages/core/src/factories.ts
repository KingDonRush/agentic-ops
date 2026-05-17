import { CURRENT_VERSION } from "./constants.js";
import { type PresetId } from "./presets.js";
import {
  type Adapter,
  type AnalysisReport,
  type Decision,
  type DriftEvent,
  type DriftReport,
  type DocsIndex,
  type HandoffPacket,
  type Manifest,
  type PatchSuggestion,
  type Phase,
  type Plan,
  type ReadinessCheck,
  type ReadinessReport,
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
    verification: [],
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
    verification: [],
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
    readiness_reports: [],
    drift_reports: [],
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

export function createDecision(input: {
  id: string;
  title: string;
  summary?: string;
  rationale?: string;
  status?: Decision["status"];
  affects?: string[];
  alternativesConsidered?: string[];
  evidence?: string[];
  risks?: string[];
}): Decision {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary ?? "",
    rationale: input.rationale ?? "",
    status: input.status ?? "proposed",
    affects: input.affects ?? [],
    alternatives_considered: input.alternativesConsidered ?? [],
    evidence: input.evidence ?? [],
    risks: input.risks ?? [],
    created_at: new Date().toISOString(),
  };
}

export function createAdapter(input: {
  id: string;
  title: string;
  type: Adapter["type"];
  status?: Adapter["status"];
  purpose?: string;
  target?: string;
  capabilities?: string[];
  commands?: string[];
  scopeBoundary?: string;
  safetyNotes?: string[];
  configuration?: Record<string, unknown>;
}): Adapter {
  return {
    id: input.id,
    title: input.title,
    type: input.type,
    status: input.status ?? "draft",
    purpose: input.purpose ?? "",
    target: input.target ?? "",
    capabilities: input.capabilities ?? [],
    commands: input.commands ?? [],
    scope_boundary: input.scopeBoundary ?? "",
    safety_notes: input.safetyNotes ?? ["Adapter is declarative until runtime integration is explicitly implemented."],
    configuration: input.configuration ?? {},
    created_at: new Date().toISOString(),
  };
}

export function createReadinessReport(input: {
  id: string;
  plan?: Plan;
  target?: string;
}): ReadinessReport {
  const checks = input.plan ? readinessChecks(input.plan) : [
    check("READINESS-plan", "Plan exists", "fail", 20, ["No plan was provided."]),
  ];
  const totalWeight = checks.reduce((total, checkItem) => total + checkItem.weight, 0) || 1;
  const score = Math.round(checks.reduce((total, checkItem) => total + (checkItem.score * checkItem.weight), 0) / totalWeight);
  const blockers = checks.filter((checkItem) => checkItem.status === "fail").map((checkItem) => checkItem.title);

  return {
    id: input.id,
    target: input.target ?? "plan",
    created_at: new Date().toISOString(),
    score,
    status: blockers.length ? "blocked" : score >= 85 ? "ready" : score >= 55 ? "partial" : "not_ready",
    checks,
    blockers,
    recommendations: checks
      .filter((checkItem) => checkItem.status !== "pass" && checkItem.status !== "not_applicable")
      .flatMap((checkItem) => checkItem.notes),
  };
}

export function createDriftReport(input: {
  id: string;
  plan?: Plan;
  target?: string;
}): DriftReport {
  const events = input.plan ? driftEvents(input.plan) : [
    driftEvent("DRIFT-plan", "missing_contract", "plan", "No plan exists.", "Create or import a plan before checking drift.", true),
  ];
  const driftScore = Math.min(100, events.reduce((total, event) => total + (event.requires_human_validation ? 20 : 12), 0));

  return {
    id: input.id,
    target: input.target ?? "plan",
    created_at: new Date().toISOString(),
    drift_score: driftScore,
    status: driftScore === 0 ? "clear" : driftScore >= 40 ? "drift_detected" : "watch",
    events,
    recommendations: events.map((event) => event.correction),
  };
}

export function createPatchSuggestion(input: {
  id: string;
  title: string;
  targetFile?: string;
  patchType?: PatchSuggestion["patch_type"];
  purpose?: string;
  suggestedDiff?: string;
  instructions?: string[];
  safetyNotes?: string[];
}): PatchSuggestion {
  return {
    id: input.id,
    title: input.title,
    target_file: input.targetFile ?? "",
    patch_type: input.patchType ?? "other",
    status: "draft",
    purpose: input.purpose ?? "",
    suggested_diff: input.suggestedDiff ?? "",
    instructions: input.instructions ?? [],
    safety_notes: input.safetyNotes ?? ["Patch suggestions are never applied automatically by Agentic Ops."],
    created_at: new Date().toISOString(),
  };
}

export function createDocsIndex(input: {
  id: string;
  root: string;
  documents: DocsIndex["documents"];
  gaps?: string[];
  recommendations?: string[];
}): DocsIndex {
  return {
    id: input.id,
    root: input.root,
    generated_at: new Date().toISOString(),
    documents: input.documents,
    gaps: input.gaps ?? [],
    recommendations: input.recommendations ?? [],
  };
}

function readinessChecks(plan: Plan): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [
    check("READINESS-objective", "Objective is explicit", plan.objective ? "pass" : "fail", 15, ["Add a concrete objective."]),
    check("READINESS-scope", "Scope boundaries exist", plan.scope.length && plan.out_of_scope.length ? "pass" : "fail", 15, ["Add scope and out-of-scope boundaries."]),
    check("READINESS-anchor", "TASK-001 anchors continuity", plan.tasks.some((task) => task.id === "TASK-001") ? "pass" : "fail", 15, ["Create TASK-001 before execution."]),
    check("READINESS-phases", "Phases define execution order", plan.phases.length > 0 ? "pass" : "warn", 10, ["Create phases with entry and exit conditions."]),
    check("READINESS-tasks", "Tasks have acceptance criteria", plan.tasks.every((task) => task.acceptance_criteria.length > 0) ? "pass" : "warn", 15, ["Add acceptance criteria to every task."]),
    check("READINESS-research", "Research requirements are represented", researchReady(plan) ? "pass" : "warn", 10, ["Create research packets for tasks marked research_required."]),
    check("READINESS-tests", "Tests exist for validation", plan.tests.length || plan.tasks.some((task) => task.tests.length) ? "pass" : "warn", 10, ["Create tests or task-level tests before handoff."]),
    check("READINESS-handoff", "Handoff path is present", Object.keys(plan.handoff).length ? "pass" : "warn", 10, ["Create a handoff packet before switching agents."]),
  ];
  return checks;
}

function driftEvents(plan: Plan): DriftEvent[] {
  const events: DriftEvent[] = [];
  if (!plan.scope.length || !plan.out_of_scope.length) {
    events.push(driftEvent("DRIFT-scope", "missing_contract", "plan.scope", "Scope boundaries are incomplete.", "Record scope and out-of-scope before execution.", true));
  }
  for (const task of plan.tasks) {
    if (!task.acceptance_criteria.length) {
      events.push(driftEvent(`DRIFT-${task.id}-acceptance`, "missing_contract", task.id, "Task lacks acceptance criteria.", "Add observable acceptance criteria.", false));
    }
    if (task.complexity === "very_complex" && task.subplans.length === 0) {
      events.push(driftEvent(`DRIFT-${task.id}-subplan`, "unbounded_subplan", task.id, "Very complex task has no bounded subplan.", "Promote the risky slice to a Matrioshka subplan.", true));
    }
    if (task.research_required && plan.research_packets.length === 0) {
      events.push(driftEvent(`DRIFT-${task.id}-research`, "research_gap", task.id, "Task requires research but plan has no research packets.", "Create a research packet for the decision that depends on current facts.", false));
    }
  }
  for (const decision of plan.decisions) {
    if (decision.status === "proposed" && decision.evidence.length === 0) {
      events.push(driftEvent(`DRIFT-${decision.id}-evidence`, "unvalidated_decision", decision.id, "Proposed decision has no evidence.", "Attach evidence or keep the decision out of the operational contract.", true));
    }
  }
  return events;
}

function researchReady(plan: Plan): boolean {
  return !plan.tasks.some((task) => task.research_required) || plan.research_packets.length > 0;
}

function check(id: string, title: string, status: ReadinessCheck["status"], weight: number, notes: string[]): ReadinessCheck {
  return {
    id,
    title,
    status,
    weight,
    score: status === "pass" || status === "not_applicable" ? 100 : status === "warn" ? 50 : 0,
    notes: status === "pass" ? [] : notes,
  };
}

function driftEvent(
  id: string,
  type: DriftEvent["type"],
  location: string,
  impact: string,
  correction: string,
  requiresHumanValidation: boolean,
): DriftEvent {
  return {
    id,
    type,
    location,
    impact,
    correction,
    requires_human_validation: requiresHumanValidation,
  };
}
