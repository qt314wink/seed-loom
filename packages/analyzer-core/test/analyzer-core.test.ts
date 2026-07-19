import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import {
  AnalyzerResultSchema,
  AnalyzerService,
  StructuredOutputError,
  TraceabilityError,
  createVisionEngine,
  parseStructuredOutput,
  verifyTraceability,
} from "../src/index.js";

const fixtureUrl = new URL("./fixtures/valid-provider-output.json", import.meta.url);
const schemaUrl = new URL("../../schemas/analyzer-result.schema.json", import.meta.url);

async function loadJson(url: URL): Promise<unknown> {
  return JSON.parse(await readFile(fileURLToPath(url), "utf8")) as unknown;
}

describe("AnalyzerService", () => {
  it("produces a deterministic, schema-valid fixture result", async () => {
    const fixture = await loadJson(fixtureUrl);
    const ids = ["fixed-run", "fixed-source"];
    const service = new AnalyzerService({
      now: () => new Date("2026-07-19T12:00:00.000Z"),
      idFactory: () => ids.shift() ?? "fallback",
    });

    const result = await service.analyze(
      { kind: "image", buffer: new Uint8Array([1, 2, 3]), mediaType: "image/png" },
      { engine: "fixture", fixtureOutput: fixture },
    );

    expect(result.run.id).toBe("run_fixed-run");
    expect(result.source.id).toBe("src_fixed-source");
    expect(result.verification.traceabilityCoverage).toBe(1);
    expect(result.verification.unsupportedClaims).toBe(0);
    expect(AnalyzerResultSchema.parse(result)).toEqual(result);

    const jsonSchema = await loadJson(schemaUrl);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(jsonSchema as object);
    expect(validate(result), JSON.stringify(validate.errors)).toBe(true);
    expect(service.ledger.list(result.run.id).map((event) => event.type)).toEqual([
      "run.started",
      "run.completed",
    ]);
  });
});

describe("provider factory", () => {
  it("defaults to Ollama", () => {
    const engine = createVisionEngine();
    expect(engine.type).toBe("ollama");
    expect(engine.model).toBe("llama3.2-vision");
  });

  it("requires explicit fixture output", () => {
    expect(() => createVisionEngine({ engine: "fixture" })).toThrow(/fixtureOutput/);
  });
});

describe("structured output parsing", () => {
  it("accepts fenced JSON with a trailing comma", () => {
    expect(parseStructuredOutput('```json\n{"evidence": [],}\n```')).toEqual({ evidence: [] });
  });

  it("retains the raw provider response on failure", () => {
    try {
      parseStructuredOutput("not-json");
      throw new Error("expected parse failure");
    } catch (error) {
      expect(error).toBeInstanceOf(StructuredOutputError);
      expect((error as StructuredOutputError).rawOutput).toBe("not-json");
    }
  });
});

describe("traceability", () => {
  it("detects unresolved evidence references locally", async () => {
    const fixture = (await loadJson(fixtureUrl)) as Record<string, unknown>;
    const broken = structuredClone(fixture) as {
      tokens: Array<{ evidenceIds: string[] }>;
      evidence: unknown[];
      interpretations: unknown[];
      translations: unknown[];
    };
    broken.tokens[0]!.evidenceIds = ["missing-evidence"];

    const verification = verifyTraceability(broken as never);
    expect(verification.unsupportedClaims).toBeGreaterThan(0);

    const service = new AnalyzerService();
    await expect(
      service.analyze(
        { kind: "image", buffer: new Uint8Array([1]) },
        { engine: "fixture", fixtureOutput: broken },
      ),
    ).rejects.toBeInstanceOf(TraceabilityError);
  });
});
