# Agentic Ops

A TypeScript CLI and MCP server for maintaining inspectable plans, tasks, decisions,
validation records and handoffs alongside an existing project. It stores its records
in a `.agentic-ops/` overlay, keeping operational state separate from application source.

## Workflow

Inspect a workspace, initialize its overlay, create a plan and record the evidence
needed to complete each task. Snapshots make changes to those records comparable;
readiness and drift checks identify missing or inconsistent planning artifacts.
Handoffs preserve the resulting decisions and outstanding work for another session.

```bash
npm ci
npm run verify
npm run aops -- inspect --cwd /path/to/project
npm run aops -- init --cwd /path/to/project --non-destructive
npm run aops -- plan create --cwd /path/to/project --preset research_strategy_conceptual --objective "Define project direction"
```

The [CLI/MCP reference](docs/cli-reference.md) covers task lifecycles, research
packets, decisions, snapshots, validation and export. `npm run mcp` starts the
stdio interface for an MCP client.

## Architecture

- [core](packages/core/src): schemas, presets and shared validation contracts.
- [cli](packages/cli/src): deterministic commands over the overlay.
- [mcp](packages/mcp/src): resources, prompts and tools over the same contracts.

Patch proposals remain separate from applying source changes. Adapter records
are declarative integration contracts; creating one does not connect an external
service. Readiness scores measure artifact completeness, not software correctness.

## Verification

`npm run verify` builds all three packages and runs the Node test suite.
The current suite contains 10 tests. Tests exercise operational records and
command behavior; they do not evaluate a language model or validate external adapters.

[MIT](LICENSE).
