import { type ZodError, type ZodTypeAny } from "zod";
import {
  AnalysisReportSchema,
  HandoffPacketSchema,
  ManifestSchema,
  PhaseSchema,
  PlanSchema,
  ResearchPacketSchema,
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
  | "handoff";

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

  return recommendations;
}

function needsHumanValidation(target: ValidationTarget, data: any): boolean {
  if (target === "plan") {
    return data.tasks.some((task: { requires_human_validation: boolean }) => task.requires_human_validation);
  }
  if (target === "subplan") {
    return data.max_depth > 1;
  }
  return false;
}
