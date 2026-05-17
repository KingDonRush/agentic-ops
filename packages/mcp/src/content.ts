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
      "V2 flow: inspect workspace and repo, suggest non-destructive init, choose preset, create briefing, create plan, create phases/tasks/subtasks/subplans/tests, create research packets, record decisions, create adapter contracts, score readiness, check drift, index docs, suggest optional patches, validate, analyze, snapshot/export, hand off.",
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
      "V1 allowlist:",
      "- aops inspect",
      "- aops repo inspect",
      "- aops ci inspect",
      "- aops init --non-destructive",
      "- aops validate",
      "- aops plan create",
      "- aops research brief",
      "- aops phase create",
      "- aops task create",
      "- aops task start",
      "- aops task complete",
      "- aops subtask create",
      "- aops subplan create",
      "- aops test create",
      "- aops analyze",
      "- aops decision record",
      "- aops adapter create",
      "- aops readiness score",
      "- aops drift check",
      "- aops docs index",
      "- aops patch suggest",
      "- aops handoff create",
      "- aops snapshot create",
      "- aops diff",
      "- aops export",
      "",
      "The MCP must not pass --force unless a user explicitly approves it outside the tool.",
    ].join("\n"),
  },
  "agentic-ops://v2-operational-layer": {
    name: "V2 Operational Layer",
    text: [
      "V2 adds maturity checks around the V1 planning contract.",
      "",
      "Use decisions to preserve why something was chosen.",
      "Use adapters to describe integration surfaces before implementing them.",
      "Use readiness score before execution or handoff.",
      "Use drift check when the plan may have grown beyond its contract.",
      "Use docs index to give agents a bounded map of repository documentation.",
      "Use patch suggestions for optional changes to AGENTS.md, docs, config, or code; do not apply them automatically.",
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
  create_subplan: {
    description: "Create a bounded Matrioshka subplan.",
    text: [
      "Create a subplan only when a task is too large, too uncertain, or needs its own plan.",
      "It must include parent task, purpose, scope boundary, entry condition, exit condition, allowed expansion, forbidden expansion, completion criteria, and handoff notes.",
      "Do not create a subplan without a stop condition.",
    ].join("\n"),
  },
  create_test: {
    description: "Create a first-class test or validation object.",
    text: [
      "Create a test with type, target, objective, preconditions, steps, expected result, pass criteria, evidence required, severity, dependencies, and subtests if needed.",
      "Tests can target plan, phase, task, subtask, subplan, integration, UI, API, research, or handoff.",
    ].join("\n"),
  },
  record_decision: {
    description: "Record a decision with rationale and evidence.",
    text: [
      "Create a decision record only after the decision is clear enough to affect execution.",
      "Include title, status, summary, rationale, affected artifacts, alternatives considered, evidence, and risks.",
      "Do not treat a proposed decision as accepted unless evidence or human validation supports it.",
    ].join("\n"),
  },
  create_adapter_contract: {
    description: "Create a bounded adapter contract before deep integration work.",
    text: [
      "Create an adapter contract for repository, CI, documentation, external tool, runtime, MCP, or CLI integration.",
      "Declare purpose, target, capabilities, commands, scope boundary, and safety notes.",
      "The adapter is a contract, not runtime integration, until a task explicitly implements it.",
    ].join("\n"),
  },
  score_readiness: {
    description: "Score whether the operational plan is ready to execute or hand off.",
    text: [
      "Run readiness scoring before execution, handoff, or major continuation.",
      "Treat blockers as stop signs. Treat warnings as refinement work unless the user accepts the risk.",
      "Use the report to decide whether to create tasks, tests, research packets, decisions, or handoff updates.",
    ].join("\n"),
  },
  check_drift: {
    description: "Detect drift between intention, plan, tasks, research, and validation.",
    text: [
      "Run drift checks when scope feels unstable, tasks are becoming generic, or another agent is taking over.",
      "For each event, decide whether to correct the plan, create a decision, create a research packet, split a task, or ask for validation.",
    ].join("\n"),
  },
};
