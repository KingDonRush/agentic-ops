export function printJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function printHuman(title: string, lines: string[]): void {
  process.stdout.write(`${title}\n`);
  for (const line of lines) {
    process.stdout.write(`- ${line}\n`);
  }
}
