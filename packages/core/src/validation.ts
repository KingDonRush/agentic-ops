import { type ZodError, type ZodTypeAny } from "zod";
import {
  AdapterSchema,
  AnalysisReportSchema,
  DecisionSchema,
  DocsIndexSchema,
  DriftReportSchema,
  HandoffPacketSchema,
  ManifestSchema,
  PatchSuggestionSchema,
  PhaseSchema,
  PlanSchema,
  ReadinessReportSchema,
  ResearchPacketSchema,
  RepositoryInspectionSchema,
  SubplanSchema,
  SubtaskSchema,
  TaskSchema,
  TestSchema,
  WorkspaceInspectionSchema,
} from "./schemas.js";

export type ValidationTarget =
  | "workspace"
  | "manifest"
  | "plan"
  | "phase"
  | "task"
  | "subtask"
  | "subplan"
  | "research"
  | "test"
  | "analysis"
  | "handoff"
  | "decision"
  | "adapter"
  | "repository"
  | "readiness"
  | "drift"
  | "patch"
  | "docs";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  target: ValidationTarget;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: string[];
  requires_human_validation: boolean;
}

const schemaByTarget: Record<ValidationTarget, ZodTypeAny> = {
  workspace: WorkspaceInspectionSchema,
  manifest: ManifestSchema,
  plan: PlanSchema,
  phase: PhaseSchema,
  task: TaskSchema,
  subtask: SubtaskSchema,
  subplan: SubplanSchema,
  research: ResearchPacketSchema,
  test: TestSchema,
  analysis: AnalysisReportSchema,
  handoff: HandoffPacketSchema,
  decision: DecisionSchema,
  adapter: AdapterSchema,
  repository: RepositoryInspectionSchema,
  readiness: ReadinessReportSchema,
  drift: DriftReportSchema,
  patch: PatchSuggestionSchema,
  docs: DocsIndexSchema,
};

export function validateArtifact(target: ValidationTarget, data: unknown): ValidationResult {
  const schema = schemaByTarget[target];
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      target,
      valid: false,
      errors: toIssues(parsed.error),
      warnings: [],
      recommendations: ["Fix required fields before using this artifact as operational contract."],
      requires_human_validation: false,
    };
  }

  return {
    target,
    valid: true,
    errors: [],
    warnings: collectWarnings(target, parsed.data),
    recommendations: collectRecommendations(target, parsed.data),
    requires_human_validation: needsHumanValidation(target, parsed.data),
  };
}

function toIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

function collectWarnings(target: ValidationTarget, data: any): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];

  if (target === "plan") {
    if (data.tasks.length === 0) {
      warnings.push({ path: "tasks", message: "Plan has no tasks yet." });
    }
    if (data.research_packets.length === 0) {
      warnings.push({ path: "research_packets", message: "Plan has no research packets; confirm no volatile facts are involved." });
    }
    if (!data.tasks.some((task: { id: string }) => task.id === "TASK-001")) {
      warnings.push({ path: "tasks", message: "Plan should include TASK-001 - Plano-mae e ancoragem operacional." });
    }
  }

  if (target === "task" && data.acceptance_criteria.length === 0) {
    warnings.push({ path: "acceptance_criteria", message: "Task has no observable acceptance criteria." });
  }

  if (target === "task" && data.status === "done" && data.verification.length === 0 && data.tests.length === 0) {
    warnings.push({ path: "verification", message: "Done task should include verification notes or linked tests." });
  }

  if (target === "phase" && (!data.entry_condition || !data.exit_condition)) {
    warnings.push({ path: "entry_condition/exit_condition", message: "Phase should have both entry and exit conditions." });
  }

  if (target === "subplan" && data.completion_criteria.length === 0) {
    warnings.push({ path: "completion_criteria", message: "Subplan should include completion criteria so it knows when to stop." });
  }

  if (target === "test" && data.pass_criteria.length === 0) {
    warnings.push({ path: "pass_criteria", message: "Test should define pass criteria." });
  }

  if (target === "research" && !data.decision_dependency) {
    warnings.push({ path: "decision_dependency", message: "Research should name the decision it supports." });
  }

  if (target === "handoff" && data.next_steps.length === 0) {
    warnings.push({ path: "next_steps", message: "Handoff should include next steps." });
  }

  if (target === "decision" && data.status === "accepted" && data.evidence.length === 0) {
    warnings.push({ path: "evidence", message: "Accepted decision should include evidence." });
  }

  if (target === "adapter" && !data.scope_boundary) {
    warnings.push({ path: "scope_boundary", message: "Adapter should declare its scope boundary." });
  }

  if (target === "readiness" && data.score < 85) {
    warnings.push({ path: "score", message: "Readiness score is below ready threshold." });
  }

  if (target === "drift" && data.drift_score > 0) {
    warnings.push({ path: "drift_score", message: "Drift report contains events that need review." });
  }

  if (target === "patch" && data.suggested_diff && !data.safety_notes.length) {
    warnings.push({ path: "safety_notes", message: "Patch suggestion should explain safety boundaries." });
  }

  return warnings;
}

function collectRecommendations(target: ValidationTarget, data: any): string[] {
  const recommendations: string[] = [];

  if (target === "plan") {
    if (data.scope.length === 0) {
      recommendations.push("Add explicit scope boundaries.");
    }
    if (data.out_of_scope.length === 0) {
      recommendations.push("Add out-of-scope items to prevent drift.");
    }
  }

  if (target === "task" && data.complexity === "very_complex") {
    recommendations.push("Consider promoting this task to a bounded subplan.");
  }

  if (target === "subplan" && data.max_depth > 1) {
    recommendations.push("Confirm nested subplans are necessary and bounded by human validation.");
  }

  if (target === "readiness" && data.blockers.length > 0) {
    recommendations.push("Resolve blockers before treating the plan as executable.");
  }

  if (target === "drift" && data.events.length > 0) {
    recommendations.push("Review drift events and record corrections as decisions or task changes.");
  }

  return recommendations;
}

function needsHumanValidation(target: ValidationTarget, data: any): boolean {
  if (target === "plan") {
    return data.tasks.some((task: { requires_human_validation: boolean }) => task.requires_human_validation);
  }
  if (target === "subplan") {
    return data.max_depth > 1;
  }
  if (target === "decision") {
    return data.status === "proposed" && data.risks.length > 0;
  }
  if (target === "drift") {
    return data.events.some((event: { requires_human_validation: boolean }) => event.requires_human_validation);
  }
  return false;
}
