import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const serverDir = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(serverDir, "../../cli/dist/index.js");

const allowedPrefixes = [
  ["inspect"],
  ["repo", "inspect"],
  ["ci", "inspect"],
  ["init"],
  ["validate"],
  ["plan", "create"],
  ["research", "brief"],
  ["phase", "create"],
  ["task", "create"],
  ["task", "start"],
  ["task", "complete"],
  ["subtask", "create"],
  ["subplan", "create"],
  ["test", "create"],
  ["analyze"],
  ["decision", "record"],
  ["adapter", "create"],
  ["readiness", "score"],
  ["drift", "check"],
  ["docs", "index"],
  ["patch", "suggest"],
  ["handoff", "create"],
  ["snapshot", "create"],
  ["diff"],
  ["export"],
];

const blockedArgs = new Set(["--force"]);

export interface CliResult {
  command: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function assertAllowedCommand(args: string[]): void {
  if (args.some((arg) => blockedArgs.has(arg))) {
    throw new Error("Blocked destructive or explicit-overwrite flag.");
  }

  const allowed = allowedPrefixes.some((prefix) => prefix.every((part, index) => args[index] === part));
  if (!allowed) {
    throw new Error(`Command is not in MCP allowlist: aops ${args.join(" ")}`);
  }
}

export function runCli(args: string[], cwd?: string): Promise<CliResult> {
  assertAllowedCommand(args);

  return new Promise((resolvePromise) => {
    execFile(process.execPath, [cliPath, ...args], { cwd }, (error, stdout, stderr) => {
      const exitCode = typeof (error as NodeJS.ErrnoException | null)?.code === "number"
        ? Number((error as NodeJS.ErrnoException).code)
        : 0;
      resolvePromise({
        command: ["aops", ...args],
        exitCode,
        stdout,
        stderr,
      });
    });
  });
}
