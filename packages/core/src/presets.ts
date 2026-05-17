import { z } from "zod";

export const PresetIdSchema = z.enum([
  "visual_front_end_first",
  "full_stack_product",
  "cms_wordpress_elementor_low_code",
  "automation_integration_workflow",
  "research_strategy_conceptual",
  "refactor_migration_modernization",
  "qa_testing_hardening",
]);

export type PresetId = z.infer<typeof PresetIdSchema>;

export interface PresetDefinition {
  id: PresetId;
  title: string;
  useWhen: string[];
  focus: string[];
  avoidWhen: string[];
}

export const PRESETS: PresetDefinition[] = [
  {
    id: "visual_front_end_first",
    title: "Visual Front-End First",
    useWhen: ["image", "mockup", "wireframe", "screenshot", "visual reference", "crystallized UI"],
    focus: ["visual reading", "components", "layout", "responsiveness", "states", "visual validation"],
    avoidWhen: ["backend-only work", "strategy without visual source"],
  },
  {
    id: "full_stack_product",
    title: "Full Stack Product",
    useWhen: ["complete product", "database", "API", "auth", "permissions", "deploy"],
    focus: ["architecture", "data model", "API", "security", "tests", "observability"],
    avoidWhen: ["pure UI implementation", "single plugin settings page"],
  },
  {
    id: "cms_wordpress_elementor_low_code",
    title: "CMS / WordPress / Elementor / Low-Code",
    useWhen: ["WordPress", "Elementor", "Webflow", "Framer", "plugins", "themes", "CMS", "low-code"],
    focus: ["versions", "compatibility", "reuse", "builder limits", "performance", "maintenance"],
    avoidWhen: ["no CMS or builder dependency", "external API automation only"],
  },
  {
    id: "automation_integration_workflow",
    title: "Automation / Integration / Workflow",
    useWhen: ["APIs", "webhooks", "CRMs", "spreadsheets", "agents", "queues", "SaaS tools"],
    focus: ["events", "triggers", "auth", "API limits", "retries", "fallback", "monitoring"],
    avoidWhen: ["static UI", "undefined data flow"],
  },
  {
    id: "research_strategy_conceptual",
    title: "Research / Strategy / Conceptual System",
    useWhen: ["formulation", "strategy", "methodology", "product definition", "architecture concept"],
    focus: ["intent", "hypotheses", "alternatives", "decision criteria", "scope definition"],
    avoidWhen: ["implementation target is already approved"],
  },
  {
    id: "refactor_migration_modernization",
    title: "Refactor / Migration / Modernization",
    useWhen: ["existing system", "migration", "modernization", "reorganization"],
    focus: ["inventory", "regression risk", "compatibility", "safe phases", "rollback"],
    avoidWhen: ["new greenfield build"],
  },
  {
    id: "qa_testing_hardening",
    title: "QA / Testing / Hardening",
    useWhen: ["stabilization", "validation", "hardening", "regression", "security", "performance"],
    focus: ["tests", "subtests", "acceptance", "edge cases", "manual and automated validation"],
    avoidWhen: ["early product ideation without implementation"],
  },
];

export function getPreset(id: PresetId): PresetDefinition {
  const preset = PRESETS.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`Unknown preset: ${id}`);
  }
  return preset;
}
