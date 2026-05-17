#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { inspectRepository, inspectWorkspace, validateArtifact } from "@agentic-ops/core";
import { resources, prompts } from "./content.js";
import { runCli } from "./cli.js";

const server = new Server(
  {
    name: "agentic-ops",
    version: "0.3.0",
  },
  {
    capabilities: {
      resources: {},
      prompts: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: Object.entries(resources).map(([uri, resource]) => ({
    uri,
    name: resource.name,
    mimeType: "text/markdown",
  })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resource = resources[request.params.uri];
  if (!resource) {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  }
  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "text/markdown",
        text: resource.text,
      },
    ],
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: Object.entries(prompts).map(([name, prompt]) => ({
    name,
    description: prompt.description,
    arguments: [
      {
        name: "context",
        description: "Project or workspace context.",
        required: false,
      },
    ],
  })),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const prompt = prompts[request.params.name];
  if (!prompt) {
    throw new Error(`Unknown prompt: ${request.params.name}`);
  }
  const context = request.params.arguments?.context
    ? `\n\nContext:\n${request.params.arguments.context}`
    : "";

  return {
    description: prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `${prompt.text}${context}`,
        },
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect_workspace",
      description: "Inspect a workspace without mutating it.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "inspect_repository",
      description: "Inspect Git remotes, branch state, CI signals, and package scripts without mutating the workspace.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "suggest_non_destructive_init",
      description: "Inspect the workspace and suggest a safe aops init command.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
          preset: { type: "string" },
        },
      },
    },
    {
      name: "run_cli_command",
      description: "Run an allowlisted aops CLI command.",
      inputSchema: {
        type: "object",
        required: ["args"],
        properties: {
          cwd: { type: "string" },
          args: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    {
      name: "validate_plan",
      description: "Validate a plan JSON object.",
      inputSchema: {
        type: "object",
        required: ["plan"],
        properties: {
          plan: { type: "object" },
        },
      },
    },
    {
      name: "validate_phase",
      description: "Validate a phase JSON object.",
      inputSchema: {
        type: "object",
        required: ["phase"],
        properties: {
          phase: { type: "object" },
        },
      },
    },
    {
      name: "validate_task",
      description: "Validate a task JSON object.",
      inputSchema: {
        type: "object",
        required: ["task"],
        properties: {
          task: { type: "object" },
        },
      },
    },
    {
      name: "validate_subplan",
      description: "Validate a subplan JSON object.",
      inputSchema: {
        type: "object",
        required: ["subplan"],
        properties: {
          subplan: { type: "object" },
        },
      },
    },
    {
      name: "validate_test",
      description: "Validate a test JSON object.",
      inputSchema: {
        type: "object",
        required: ["test"],
        properties: {
          test: { type: "object" },
        },
      },
    },
    {
      name: "validate_research_packet",
      description: "Validate a research packet JSON object.",
      inputSchema: {
        type: "object",
        required: ["research_packet"],
        properties: {
          research_packet: { type: "object" },
        },
      },
    },
    {
      name: "validate_handoff",
      description: "Validate a handoff packet JSON object.",
      inputSchema: {
        type: "object",
        required: ["handoff"],
        properties: {
          handoff: { type: "object" },
        },
      },
    },
    {
      name: "validate_decision",
      description: "Validate a decision JSON object.",
      inputSchema: {
        type: "object",
        required: ["decision"],
        properties: {
          decision: { type: "object" },
        },
      },
    },
    {
      name: "validate_adapter",
      description: "Validate an adapter contract JSON object.",
      inputSchema: {
        type: "object",
        required: ["adapter"],
        properties: {
          adapter: { type: "object" },
        },
      },
    },
    {
      name: "validate_readiness",
      description: "Validate a readiness report JSON object.",
      inputSchema: {
        type: "object",
        required: ["readiness"],
        properties: {
          readiness: { type: "object" },
        },
      },
    },
    {
      name: "validate_drift",
      description: "Validate a drift report JSON object.",
      inputSchema: {
        type: "object",
        required: ["drift"],
        properties: {
          drift: { type: "object" },
        },
      },
    },
    {
      name: "validate_patch",
      description: "Validate a patch suggestion JSON object.",
      inputSchema: {
        type: "object",
        required: ["patch"],
        properties: {
          patch: { type: "object" },
        },
      },
    },
    {
      name: "validate_docs_index",
      description: "Validate a docs index JSON object.",
      inputSchema: {
        type: "object",
        required: ["docs_index"],
        properties: {
          docs_index: { type: "object" },
        },
      },
    },
    {
      name: "create_readiness_score",
      description: "Create a readiness score through the allowlisted CLI.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "check_drift",
      description: "Create a drift report through the allowlisted CLI.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "index_docs",
      description: "Create a documentation index through the allowlisted CLI.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "create_snapshot",
      description: "Create an operational snapshot through the allowlisted CLI.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
        },
      },
    },
    {
      name: "export_operational_plan",
      description: "Export the operational plan through the allowlisted CLI.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string" },
          format: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};
  switch (request.params.name) {
    case "inspect_workspace": {
      const cwd = stringArg(args.cwd) ?? process.cwd();
      return textResponse(inspectWorkspace(cwd));
    }
    case "inspect_repository": {
      const cwd = stringArg(args.cwd) ?? process.cwd();
      return textResponse(inspectRepository(cwd));
    }
    case "suggest_non_destructive_init": {
      const cwd = stringArg(args.cwd) ?? process.cwd();
      const preset = stringArg(args.preset);
      const inspection = inspectWorkspace(cwd);
      const command = [
        "aops",
        "init",
        "--non-destructive",
        inspection.recommended_mode === "overlay" ? "--overlay" : "",
        preset ? `--preset ${preset}` : "",
      ].filter(Boolean).join(" ");
      return textResponse({
        recommended_mode: inspection.recommended_mode,
        command,
        safety: "This command writes only to .agentic-ops/ and does not overwrite project files.",
        inspection,
      });
    }
    case "run_cli_command": {
      const cwd = stringArg(args.cwd);
      const cliArgs = arrayArg(args.args);
      const result = await runCli(cliArgs, cwd);
      return textResponse(result, result.exitCode !== 0);
    }
    case "validate_plan": {
      return textResponse(validateArtifact("plan", args.plan));
    }
    case "validate_phase": {
      return textResponse(validateArtifact("phase", args.phase));
    }
    case "validate_task": {
      return textResponse(validateArtifact("task", args.task));
    }
    case "validate_subplan": {
      return textResponse(validateArtifact("subplan", args.subplan));
    }
    case "validate_test": {
      return textResponse(validateArtifact("test", args.test));
    }
    case "validate_research_packet": {
      return textResponse(validateArtifact("research", args.research_packet));
    }
    case "validate_handoff": {
      return textResponse(validateArtifact("handoff", args.handoff));
    }
    case "validate_decision": {
      return textResponse(validateArtifact("decision", args.decision));
    }
    case "validate_adapter": {
      return textResponse(validateArtifact("adapter", args.adapter));
    }
    case "validate_readiness": {
      return textResponse(validateArtifact("readiness", args.readiness));
    }
    case "validate_drift": {
      return textResponse(validateArtifact("drift", args.drift));
    }
    case "validate_patch": {
      return textResponse(validateArtifact("patch", args.patch));
    }
    case "validate_docs_index": {
      return textResponse(validateArtifact("docs", args.docs_index));
    }
    case "create_readiness_score": {
      const cwd = stringArg(args.cwd);
      return textResponse(await runCli(["readiness", "score"], cwd));
    }
    case "check_drift": {
      const cwd = stringArg(args.cwd);
      return textResponse(await runCli(["drift", "check"], cwd));
    }
    case "index_docs": {
      const cwd = stringArg(args.cwd);
      return textResponse(await runCli(["docs", "index"], cwd));
    }
    case "create_snapshot": {
      const cwd = stringArg(args.cwd);
      return textResponse(await runCli(["snapshot", "create"], cwd));
    }
    case "export_operational_plan": {
      const cwd = stringArg(args.cwd);
      const format = stringArg(args.format) ?? "json";
      return textResponse(await runCli(["export", "--format", format], cwd));
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

function textResponse(data: unknown, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

function stringArg(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function arrayArg(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error("Expected string array.");
  }
  return value;
}

const transport = new StdioServerTransport();
await server.connect(transport);
