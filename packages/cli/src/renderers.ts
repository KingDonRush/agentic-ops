import { type Plan } from "@agentic-ops/core";

export function renderPlan(plan: Plan, format: "json" | "markdown" | "text" | "yaml"): string {
  switch (format) {
    case "json":
      return `${JSON.stringify(plan, null, 2)}\n`;
    case "markdown":
      return renderMarkdown(plan);
    case "text":
      return renderText(plan);
    case "yaml":
      return renderYaml(plan);
  }
}

function renderMarkdown(plan: Plan): string {
  return [
    `# ${plan.id}`,
    "",
    `Preset: \`${plan.preset}\``,
    "",
    "## Objective",
    plan.objective,
    "",
    "## Scope",
    ...list(plan.scope),
    "",
    "## Out Of Scope",
    ...list(plan.out_of_scope),
    "",
    "## Phases",
    ...plan.phases.map((phase) => `- ${phase.id}: ${phase.title}`),
    "",
    "## Tasks",
    ...plan.tasks.map((task) => `- ${task.id}: ${task.title} [${task.status}]`),
    "",
  ].join("\n");
}

function renderText(plan: Plan): string {
  return [
    `${plan.id}`,
    `Objective: ${plan.objective}`,
    `Preset: ${plan.preset}`,
    `Phases: ${plan.phases.length}`,
    `Tasks: ${plan.tasks.length}`,
    `Research packets: ${plan.research_packets.length}`,
    "",
  ].join("\n");
}

function renderYaml(plan: Plan): string {
  return [
    `id: ${quote(plan.id)}`,
    `objective: ${quote(plan.objective)}`,
    `preset: ${quote(plan.preset)}`,
    "scope:",
    ...yamlList(plan.scope),
    "out_of_scope:",
    ...yamlList(plan.out_of_scope),
    "phases:",
    ...plan.phases.flatMap((phase) => [
      `  - id: ${quote(phase.id)}`,
      `    title: ${quote(phase.title)}`,
    ]),
    "tasks:",
    ...plan.tasks.flatMap((task) => [
      `  - id: ${quote(task.id)}`,
      `    title: ${quote(task.title)}`,
      `    status: ${quote(task.status)}`,
    ]),
    "",
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- (empty)"];
}

function yamlList(items: string[]): string[] {
  return items.length ? items.map((item) => `  - ${quote(item)}`) : ["  []"];
}

function quote(value: string): string {
  return JSON.stringify(value);
}
