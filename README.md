# Agentic Ops

Agentic Ops is a reusable operational layer for AI-assisted work.

It has three packages:

- `@agentic-ops/core`: schemas, presets, validators, and shared contracts.
- `@agentic-ops/cli`: deterministic `aops` CLI.
- `@agentic-ops/mcp`: MCP server that exposes resources, prompts, and safe tools
  for AI agents.

## Current Scope

- inspect a workspace;
- initialize a non-destructive `.agentic-ops/` overlay;
- validate workspace, manifest, plan, phase, task, subtask, subplan, research
  packet, test, analysis, and handoff files;
- create a plan skeleton;
- create phases, tasks, subtasks, bounded subplans, and tests;
- create a refined research packet;
- create analysis reports;
- create handoff packets;
- create snapshots, diff snapshots, and export plans;
- inspect repository, remotes, CI signals, and package scripts;
- record decisions with rationale and evidence;
- create declarative adapter contracts before deep integrations;
- score readiness and check operational drift;
- index existing documentation without rewriting it;
- create optional patch suggestions without applying them;
- mark tasks as started or completed with evidence notes;
- expose MCP resources, prompts, and tools over stdio.

## Install

```bash
npm install
npm run build
```

## CLI

```bash
npm run aops -- inspect --cwd .
npm run aops -- init --cwd . --non-destructive
npm run aops -- plan create --cwd . --preset research_strategy_conceptual --objective "Define project direction"
npm run aops -- phase create --cwd . --title "Implementation" --entry-condition "Plan exists" --exit-condition "Tasks are validated"
npm run aops -- task create --cwd . --title "Implement V1" --phase-id PHASE-001 --acceptance-criteria "Build passes,Tests pass"
npm run aops -- task start --cwd . --task-id TASK-002
npm run aops -- task complete --cwd . --task-id TASK-002 --verification "Build passes,Tests pass"
npm run aops -- subtask create --cwd . --task-id TASK-002 --title "Add core schemas"
npm run aops -- subplan create --cwd . --parent-task-id TASK-002 --title "Risky slice" --purpose "Keep work bounded" --scope-boundary "Only this slice" --entry-condition "Task exists" --exit-condition "Validated"
npm run aops -- test create --cwd . --type acceptance_test --target TASK-002 --objective "Validate task" --pass-criteria "Evidence exists"
npm run aops -- research brief --cwd . --question "Which MCP SDK should we use?" --decision "MCP package baseline"
npm run aops -- analyze --cwd . complexity
npm run aops -- repo inspect --cwd . --write
npm run aops -- ci inspect --cwd .
npm run aops -- decision record --cwd . --title "Use non-destructive overlays" --status accepted --evidence "AGENTS.md is preserved"
npm run aops -- adapter create --cwd . --title "GitHub adapter" --type repository --scope-boundary "Read-only repo metadata"
npm run aops -- readiness score --cwd .
npm run aops -- drift check --cwd .
npm run aops -- docs index --cwd .
npm run aops -- patch suggest --cwd . --title "Optional AGENTS note" --target-file AGENTS.md --type agents_instruction
npm run aops -- handoff create --cwd .
npm run aops -- snapshot create --cwd .
npm run aops -- export --cwd . --format markdown
npm run aops -- validate --cwd . plan
```

## MCP

```bash
npm run mcp
```

The MCP server uses stdio and delegates deterministic work to the same core
contracts used by the CLI.

## Safety

By default, Agentic Ops writes only to `.agentic-ops/`.

It does not overwrite `AGENTS.md`, `README.md`, `package.json`, source files, or
existing project configuration.

V2 patch suggestions are stored as proposal artifacts. They are never applied by
the CLI or MCP unless a future explicit command is designed for that purpose.
