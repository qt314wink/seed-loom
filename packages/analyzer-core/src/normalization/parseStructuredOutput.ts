export class StructuredOutputError extends Error {
  readonly rawOutput: string;

  constructor(message: string, rawOutput: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StructuredOutputError";
    this.rawOutput = rawOutput;
  }
}

function stripMarkdownFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? trimmed;
}

function isolateJsonObject(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end < start) {
    return value;
  }
  return value.slice(start, end + 1);
}

function removeTrailingCommas(value: string): string {
  return value.replace(/,\s*([}\]])/g, "$1");
}

export function parseStructuredOutput(rawOutput: string): unknown {
  const candidates = [
    rawOutput.trim(),
    stripMarkdownFence(rawOutput),
    isolateJsonObject(stripMarkdownFence(rawOutput)),
    removeTrailingCommas(isolateJsonObject(stripMarkdownFence(rawOutput))),
  ].filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch (error) {
      lastError = error;
    }
  }

  throw new StructuredOutputError(
    "Vision provider output could not be parsed as a JSON object.",
    rawOutput,
    { cause: lastError },
  );
}
