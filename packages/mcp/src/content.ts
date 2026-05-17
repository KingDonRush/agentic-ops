import { PRESETS } from "@agentic-ops/core";

export const resources: Record<string, { name: string; text: string }> = {
  "agentic-ops://overview": {
    name: "Agentic Ops Overview",
    text: [
      "Agentic Ops is a CLI-first operational layer with an MCP interface.",
      "",
      "Core defines contracts. CLI performs deterministic operations. MCP gives AI agents context, prompts, schemas, and safe tools.",
      "",
      "Primary mantra: Como isso vai continuar funcionando depois que eu parar de explicar?",
      "",
      "V0 flow: inspect workspace, suggest non-destructive init, choose preset, create briefing, create plan, create research packets, validate, hand off.",
    ].join("\n"),
  },
  "agentic-ops://non-destructive-policy": {
    name: "Non-Destructive Policy",
    text: [
      "Agentic Ops writes only to .agentic-ops/ by default.",
      "It must not overwrite AGENTS.md, README.md, package.json, configs, docs, or source code automatically.",
      "If an existing agentic structure is detected, use overlay mode.",
      "AGENTS.md changes may be suggested as optional patches, never applied automatically by V0 tools.",
    ].join("\n"),
  },
  "agentic-ops://preset-catalog": {
    name: "Preset Catalog",
    text: PRESETS.map((preset) => [
      `# ${preset.title}`,
      `id: ${preset.id}`,
      `use when: ${preset.useWhen.join("; ")}`,
      `focus: ${preset.focus.join("; ")}`,
      `avoid when: ${preset.avoidWhen.join("; ")}`,
    ].join("\n")).join("\n\n"),
  },
  "agentic-ops://research-packet-method": {
    name: "Research Packet Method",
    text: [
      "Research is a refined instruction packet, not a magic search tool.",
      "",
      "A packet must state: question, reason, decision dependency, allowed scope, forbidden scope, desired sources, update policy, reliability signals, alternatives, wheel reinvention risk, plan impact, task impact, recommendation, remaining uncertainty, and required validation.",
      "",
      "Research collects evidence. Analysis interprets and decides.",
    ].join("\n"),
  },
  "agentic-ops://cli-command-reference": {
    name: "CLI Command Reference",
    text: [
      "V0 allowlist:",
      "- aops inspect",
      "- aops init --non-destructive",
      "- aops validate",
      "- aops plan create",
      "- aops research brief",
      "",
      "The MCP must not pass --force unless a user explicitly approves it outside the tool.",
    ].join("\n"),
  },
};

export const prompts: Record<string, { description: string; text: string }> = {
  choose_preset: {
    description: "Choose and justify the methodological preset before planning.",
    text: [
      "Analyze the project context and choose one Agentic Ops preset.",
      "Do not choose arbitrarily.",
      "State: objective, crystallized inputs, foggy areas, selected preset, rejected presets, research needs, and first scope boundaries.",
    ].join("\n"),
  },
  create_briefing: {
    description: "Create a briefing de encaixe.",
    text: [
      "Create a concise operational briefing.",
      "Answer: what I understood, real objective, crystallized items, foggy items, preset fit, reuse opportunities, risk of reinventing the wheel, scope risks, decisions becoming contract, and human validation needs.",
    ].join("\n"),
  },
  create_operational_plan: {
    description: "Create a plan contract using Agentic Ops objects.",
    text: [
      "Create an operational plan only after Phase 0 orientation.",
      "Include objective, scope, out of scope, preset, briefing, phases, TASK-001, research packets, budgets, tests, validation, and handoff strategy.",
      "Do not create generic tasks.",
    ].join("\n"),
  },
  create_research_packet: {
    description: "Create refined research instructions for AI research.",
    text: [
      "Create a research_packet for a specific decision.",
      "It must include allowed and forbidden scope, desired sources, update policy, alternatives, wheel reinvention risk, plan impact, task impact, remaining uncertainty, and validation needs.",
    ].join("\n"),
  },
  create_handoff: {
    description: "Create a handoff packet for another AI.",
    text: [
      "Create a handoff that preserves method and state.",
      "Include current state, objective, preset, decisions made, decisions pending, plan structure, completed/pending tasks, risks, research packets, validations, tests, next steps, what not to reopen, first CLI command, and first MCP prompt.",
    ].join("\n"),
  },
};
