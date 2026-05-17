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
  subtests: z.array(z.string()).default([]),
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
  budgets: BudgetSchema.default({}),
  risks: z.array(z.string()).default([]),
  research_required: z.boolean().default(false),
  tests: z.array(TestSchema).default([]),
  requires_human_validation: z.boolean().default(false),
  subtasks: z.array(z.unknown()).default([]),
  subplans: z.array(z.unknown()).default([]),
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
  decisions: z.array(z.unknown()).default([]),
  budgets: BudgetSchema.default({}),
  tests: z.array(TestSchema).default([]),
  analysis_reports: z.array(z.unknown()).default([]),
  validation_results: z.array(z.unknown()).default([]),
  handoff: z.record(z.unknown()).default({}),
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
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;
