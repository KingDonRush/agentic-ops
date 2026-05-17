import { z, type ZodError, type ZodTypeAny } from "zod";
import {
  HandoffPacketSchema,
  ManifestSchema,
  PlanSchema,
  ResearchPacketSchema,
  TaskSchema,
  WorkspaceInspectionSchema,
} from "./schemas.js";

export type ValidationTarget =
  | "workspace"
  | "manifest"
  | "plan"
  | "task"
  | "research"
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
  task: TaskSchema,
  research: ResearchPacketSchema,
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

function collectWarnings(target: ValidationTarget, data: z.infer<typeof PlanSchema>): ValidationIssue[] {
  if (target !== "plan") {
    return [];
  }

  const warnings: ValidationIssue[] = [];
  if (data.tasks.length === 0) {
    warnings.push({ path: "tasks", message: "Plan has no tasks yet." });
  }
  if (data.research_packets.length === 0) {
    warnings.push({ path: "research_packets", message: "Plan has no research packets; confirm no volatile facts are involved." });
  }
  if (!data.tasks.some((task) => task.id === "TASK-001")) {
    warnings.push({ path: "tasks", message: "Plan should include TASK-001 - Plano-mae e ancoragem operacional." });
  }
  return warnings;
}

function collectRecommendations(target: ValidationTarget, data: z.infer<typeof PlanSchema>): string[] {
  if (target !== "plan") {
    return [];
  }

  const recommendations: string[] = [];
  if (data.scope.length === 0) {
    recommendations.push("Add explicit scope boundaries.");
  }
  if (data.out_of_scope.length === 0) {
    recommendations.push("Add out-of-scope items to prevent drift.");
  }
  return recommendations;
}

function needsHumanValidation(target: ValidationTarget, data: z.infer<typeof PlanSchema>): boolean {
  if (target !== "plan") {
    return false;
  }
  return data.tasks.some((task) => task.requires_human_validation);
}
