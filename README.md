# Agentic Ops

Agentic Ops is a reusable operational layer for AI-assisted work.

It has three packages:

- `@agentic-ops/core`: schemas, presets, validators, and shared contracts.
- `@agentic-ops/cli`: deterministic `aops` CLI.
- `@agentic-ops/mcp`: MCP server that exposes resources, prompts, and safe tools
  for AI agents.

## V0 Scope

- inspect a workspace;
- initialize a non-destructive `.agentic-ops/` overlay;
- validate workspace, manifest, plan, task, research packet, and handoff files;
- create a plan skeleton;
- create a refined research packet;
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
npm run aops -- research brief --cwd . --question "Which MCP SDK should we use?" --decision "MCP package baseline"
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
