import { z } from "zod";
import { CURRENT_VERSION } from "./constants.js";
import { PresetIdSchema } from "./presets.js";

export const BudgetSchema = z.object({
  time_budget: z.string().default(""),
  complexity_budget: z.string().default(""),
  context_budget: z.string().default(""),
  research_budget: z.string().default(""),
  iteration_budget: z.string().default(""),
  scope_budget: z.string().default(""),
  ambiguity_budget: z.string().default(""),
  validation_budget: z.string().default(""),
});

export const ManifestSchema = z.object({
  agentic_ops_version: z.string().default(CURRENT_VERSION),
  workspace_id: z.string(),
  initialized_at: z.string(),
  mode: z.enum(["new", "overlay", "adopted"]),
  detected_agent_files: z.array(z.string()).default([]),
  detected_stack: z.array(z.string()).default([]),
  active_preset: PresetIdSchema.optional(),
  artifacts: z.array(z.string()).default([]),
  compatibility_notes: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
});

export const WorkspaceInspectionSchema = z.object({
  root: z.string(),
  project_type: z.string(),
  detected_stack: z.array(z.string()),
  package_managers: z.array(z.string()),
  frameworks: z.array(z.string()),
  agentic_files: z.array(z.string()),
  docs: z.array(z.string()),
  has_agentic_ops: z.boolean(),
  overwrite_risks: z.array(z.string()),
  recommended_mode: z.enum(["new", "overlay", "adopted"]),
  notes: z.array(z.string()),
});

export const ResearchPacketSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  reason: z.string().default(""),
  decision_dependency: z.string().default(""),
  allowed_scope: z.array(z.string()).default([]),
  forbidden_scope: z.array(z.string()).default([]),
  desired_sources: z.array(z.string()).default([]),
  update_policy: z.string().default("Validate current sources before deciding."),
  reliability_signals: z.array(z.string()).default([]),
  alternatives_to_compare: z.array(z.string()).default([]),
  wheel_reinvention_risk: z.string().default("unknown"),
  plan_impact: z.string().default(""),
  task_impact: z.string().default(""),
  recommendation: z.string().default(""),
  remaining_uncertainties: z.array(z.string()).default([]),
  validation_required: z.array(z.string()).default([]),
});

export const SubtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  objective: z.string().default(""),
  status: z.enum(["pending", "in_progress", "blocked", "done", "deferred"]).default("pending"),
  depends_on: z.array(z.string()).default([]),
  inputs_required: z.array(z.string()).default([]),
  expected_output: z.string().default(""),
  acceptance_criteria: z.array(z.string()).default([]),
  verification: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  promote_to_subplan_if: z.array(z.string()).default([]),
});

export const SubtestSchema = z.object({
  id: z.string(),
  objective: z.string().min(1),
  steps: z.array(z.string()).default([]),
  expected_result: z.string().default(""),
  pass_criteria: z.array(z.string()).default([]),
  status: z.enum(["pending", "passed", "failed", "blocked", "skipped"]).default("pending"),
});

export const TestSchema = z.object({
  id: z.string(),
  type: z.enum([
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
  target: z.string(),
  objective: z.string(),
  preconditions: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  expected_result: z.string().default(""),
  pass_criteria: z.array(z.string()).default([]),
  evidence_required: z.array(z.string()).default([]),
  status: z.enum(["pending", "passed", "failed", "blocked", "skipped"]).default("pending"),
  severity: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  depends_on: z.array(z.string()).default([]),
  subtests: z.array(SubtestSchema).default([]),
});

export const SubplanSchema = z.object({
  id: z.string(),
  parent_task_id: z.string().min(1),
  title: z.string().min(1),
  purpose: z.string().min(1),
  scope_boundary: z.string().min(1),
  entry_condition: z.string().min(1),
  exit_condition: z.string().min(1),
  max_depth: z.number().int().min(0).max(2).default(1),
  allowed_expansion: z.array(z.string()).default([]),
  forbidden_expansion: z.array(z.string()).default([]),
  budgets: BudgetSchema.default({}),
  tasks: z.array(z.unknown()).default([]),
  tests: z.array(TestSchema).default([]),
  completion_criteria: z.array(z.string()).default([]),
  handoff_notes: z.string().default(""),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  objective: z.string().default(""),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  complexity: z.enum(["simple", "moderate", "complex", "very_complex"]).default("moderate"),
  status: z.enum(["pending", "in_progress", "blocked", "done", "deferred"]).default("pending"),
  phase_id: z.string().default(""),
  depends_on: z.array(z.string()).default([]),
  blocks: z.array(z.string()).default([]),
  inputs_required: z.array(z.string()).default([]),
  expected_outputs: z.array(z.string()).default([]),
  acceptance_criteria: z.array(z.string()).default([]),
  verification: z.array(z.string()).default([]),
  budgets: BudgetSchema.default({}),
  risks: z.array(z.string()).default([]),
  research_required: z.boolean().default(false),
  tests: z.array(TestSchema).default([]),
  requires_human_validation: z.boolean().default(false),
  subtasks: z.array(SubtaskSchema).default([]),
  subplans: z.array(z.union([
    z.string(),
    z.object({
      id: z.string(),
      path: z.string().optional(),
      title: z.string().optional(),
    }),
  ])).default([]),
});

export const PhaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  purpose: z.string().default(""),
  entry_condition: z.string().default(""),
  exit_condition: z.string().default(""),
  required_outputs: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([]),
  acceptance_criteria: z.array(z.string()).default([]),
  validation_required: z.array(z.string()).default([]),
});

export const DecisionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  summary: z.string().default(""),
  rationale: z.string().default(""),
  status: z.enum(["proposed", "accepted", "superseded", "rejected"]).default("proposed"),
  affects: z.array(z.string()).default([]),
  alternatives_considered: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  created_at: z.string().default(() => new Date().toISOString()),
});

export const AdapterSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(["repository", "ci", "documentation", "external_tool", "runtime", "mcp", "cli"]),
  status: z.enum(["draft", "active", "degraded", "disabled"]).default("draft"),
  purpose: z.string().default(""),
  target: z.string().default(""),
  capabilities: z.array(z.string()).default([]),
  commands: z.array(z.string()).default([]),
  scope_boundary: z.string().default(""),
  safety_notes: z.array(z.string()).default([]),
  configuration: z.record(z.unknown()).default({}),
  created_at: z.string().default(() => new Date().toISOString()),
});

export const RepositoryInspectionSchema = z.object({
  root: z.string(),
  is_git_repo: z.boolean(),
  branch: z.string().default(""),
  remotes: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).default([]),
  latest_commit: z.string().default(""),
  dirty: z.boolean().default(false),
  changed_files: z.array(z.string()).default([]),
  ci_detected: z.array(z.string()).default([]),
  package_scripts: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

export const DriftEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "scope_drift",
    "missing_contract",
    "stale_artifact",
    "unbounded_subplan",
    "unvalidated_decision",
    "missing_test",
    "research_gap",
  ]),
  location: z.string().default(""),
  impact: z.string().default(""),
  correction: z.string().default(""),
  requires_human_validation: z.boolean().default(false),
});

export const DriftReportSchema = z.object({
  id: z.string(),
  target: z.string().default("plan"),
  created_at: z.string().default(() => new Date().toISOString()),
  drift_score: z.number().min(0).max(100).default(0),
  status: z.enum(["clear", "watch", "drift_detected"]).default("clear"),
  events: z.array(DriftEventSchema).default([]),
  recommendations: z.array(z.string()).default([]),
});

export const ReadinessCheckSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["pass", "warn", "fail", "not_applicable"]),
  weight: z.number().min(0).max(100).default(1),
  score: z.number().min(0).max(100).default(0),
  notes: z.array(z.string()).default([]),
});

export const ReadinessReportSchema = z.object({
  id: z.string(),
  target: z.string().default("plan"),
  created_at: z.string().default(() => new Date().toISOString()),
  score: z.number().min(0).max(100).default(0),
  status: z.enum(["not_ready", "partial", "ready", "blocked"]).default("not_ready"),
  checks: z.array(ReadinessCheckSchema).default([]),
  blockers: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export const PatchSuggestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  target_file: z.string().default(""),
  patch_type: z.enum(["agents_instruction", "documentation", "configuration", "code", "other"]).default("other"),
  status: z.enum(["draft", "proposed", "accepted", "rejected"]).default("draft"),
  purpose: z.string().default(""),
  suggested_diff: z.string().default(""),
  instructions: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
  created_at: z.string().default(() => new Date().toISOString()),
});

export const DocsIndexSchema = z.object({
  id: z.string(),
  root: z.string(),
  generated_at: z.string().default(() => new Date().toISOString()),
  documents: z.array(z.object({
    path: z.string(),
    kind: z.enum(["readme", "agents", "docs", "planning", "unknown"]).default("unknown"),
    title: z.string().default(""),
    notes: z.array(z.string()).default([]),
  })).default([]),
  gaps: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export const PlanSchema = z.object({
  id: z.string(),
  objective: z.string().min(1),
  scope: z.array(z.string()).default([]),
  out_of_scope: z.array(z.string()).default([]),
  preset: PresetIdSchema,
  briefing: z.record(z.unknown()).default({}),
  phases: z.array(PhaseSchema).default([]),
  tasks: z.array(TaskSchema).default([]),
  research_packets: z.array(ResearchPacketSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
  budgets: BudgetSchema.default({}),
  tests: z.array(TestSchema).default([]),
  analysis_reports: z.array(z.unknown()).default([]),
  readiness_reports: z.array(ReadinessReportSchema).default([]),
  drift_reports: z.array(DriftReportSchema).default([]),
  validation_results: z.array(z.unknown()).default([]),
  handoff: z.record(z.unknown()).default({}),
});

export const AnalysisReportSchema = z.object({
  id: z.string(),
  type: z.enum([
    "complexity",
    "fit",
    "technical",
    "execution",
    "scope",
    "test",
    "handoff_readiness",
  ]),
  target: z.string().default("plan"),
  summary: z.string().default(""),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  related_research_packets: z.array(z.string()).default([]),
  status: z.enum(["draft", "ready", "requires_validation"]).default("draft"),
  created_at: z.string().default(() => new Date().toISOString()),
});

export const SnapshotSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  files: z.array(z.object({
    path: z.string(),
    sha256: z.string(),
  })),
});

export const HandoffPacketSchema = z.object({
  id: z.string(),
  current_state: z.string().default(""),
  objective: z.string().default(""),
  preset_used: PresetIdSchema.optional(),
  decisions_made: z.array(z.string()).default([]),
  pending_decisions: z.array(z.string()).default([]),
  plan_structure: z.record(z.unknown()).default({}),
  completed_tasks: z.array(z.string()).default([]),
  pending_tasks: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  research_packets: z.array(z.string()).default([]),
  validations: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  do_not_reopen: z.array(z.string()).default([]),
  how_to_continue_briefing_user: z.string().default(""),
  first_recommended_cli_command: z.string().default(""),
  first_recommended_mcp_prompt: z.string().default(""),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type WorkspaceInspection = z.infer<typeof WorkspaceInspectionSchema>;
export type ResearchPacket = z.infer<typeof ResearchPacketSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Subplan = z.infer<typeof SubplanSchema>;
export type Test = z.infer<typeof TestSchema>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Adapter = z.infer<typeof AdapterSchema>;
export type RepositoryInspection = z.infer<typeof RepositoryInspectionSchema>;
export type DriftEvent = z.infer<typeof DriftEventSchema>;
export type DriftReport = z.infer<typeof DriftReportSchema>;
export type ReadinessCheck = z.infer<typeof ReadinessCheckSchema>;
export type ReadinessReport = z.infer<typeof ReadinessReportSchema>;
export type PatchSuggestion = z.infer<typeof PatchSuggestionSchema>;
export type DocsIndex = z.infer<typeof DocsIndexSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;
