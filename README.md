# Agentic Ops

A TypeScript CLI and MCP server for turning agent-assisted work into inspectable
plans, tasks, decisions, validation records and handoffs. It writes a non-destructive
`.agentic-ops/` overlay alongside an existing project.

**Independent developer-tooling prototype.** It structures work for agents; it does
not train models or autonomously operate external services.

## What the implementation demonstrates

- Shared [schemas and validation](packages/core/src) for operational artifacts.
- A deterministic [CLI](packages/cli/src) to inspect, plan and validate work.
- An [MCP stdio interface](packages/mcp/src) exposing those contracts to agents.
- Readiness, drift, snapshots and evidence-bearing handoffs, with patch proposals
  kept separate from applying changes to source.

## Try it

```bash
npm ci
npm run verify
npm run aops -- inspect --cwd .
npm run aops -- init --cwd . --non-destructive
npm run mcp
```

`init` creates the local overlay. Inspect the complete
[CLI/MCP reference](docs/cli-reference.md) for plan and handoff commands.

## Validation and limits

On 2026-09-17, `npm run verify` passed the build and all 10 tests on revision
`6846f1cbbfb756166eb3060953bfff9ff4e0762c` using Node 22.21.1.
Adapters are declarative contracts, not evidence of production integrations.
Operational scores describe artifact readiness; they do not measure model quality
or guarantee project correctness. Review dependencies before deployment.

## Development method and authorship

This is an independent project, not evidence of an employer or a client engagement.
The source was produced primarily or entirely by AI coding agents under Guilherme
Manoel da Silva's direction. His contribution includes product intent, requirements,
constraints, decomposition, product and architectural decisions through the agent
interface, iteration, validation and documentation. The repository demonstrates
the resulting system and process; it does not imply that he manually wrote every
component or can reproduce it unaided from memory.

## Em português

CLI e servidor MCP para estruturar planos, tarefas, decisões, validações e handoffs
em projetos dirigidos por agentes. O código permite verificar contratos e estado;
o projeto não pressupõe treinamento de modelos nem execução externa autônoma.

## License

[MIT](LICENSE).
