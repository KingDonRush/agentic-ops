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
import { inspectWorkspace, validateArtifact } from "@agentic-ops/core";
import { resources, prompts } from "./content.js";
import { runCli } from "./cli.js";

const server = new Server(
  {
    name: "agentic-ops",
    version: "0.1.0",
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};
  switch (request.params.name) {
    case "inspect_workspace": {
      const cwd = stringArg(args.cwd) ?? process.cwd();
      return textResponse(inspectWorkspace(cwd));
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
    case "validate_research_packet": {
      return textResponse(validateArtifact("research", args.research_packet));
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
