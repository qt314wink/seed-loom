import { createHash, randomUUID } from "node:crypto";
import {
  AnalyzerResultSchema,
  ProviderAnalyzerOutputSchema,
  type AnalyzerResult,
} from "./AnalyzerValidator.js";
import type {
  AnalyzerRunConfig,
  ProviderFactoryConfig,
  SourceInput,
  VisionEngine,
} from "./contracts.js";
import { InMemoryRunLedger } from "./ledger/InMemoryRunLedger.js";
import { parseStructuredOutput } from "./normalization/parseStructuredOutput.js";
import { VISUAL_ANALYSIS_SYSTEM_PROMPT } from "./prompts/visual-analysis.prompt.js";
import { createVisionEngine } from "./providers/ProviderFactory.js";
import { assertTraceability } from "./verification/verifyTraceability.js";

export interface AnalyzerServiceOptions {
  ledger?: InMemoryRunLedger;
  providerFactory?: (config: ProviderFactoryConfig) => VisionEngine;
  now?: () => Date;
  idFactory?: () => string;
}

export class AnalyzerService {
  readonly ledger: InMemoryRunLedger;
  private readonly providerFactory: (config: ProviderFactoryConfig) => VisionEngine;
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(options: AnalyzerServiceOptions = {}) {
    this.ledger = options.ledger ?? new InMemoryRunLedger();
    this.providerFactory = options.providerFactory ?? createVisionEngine;
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
  }

  async analyze(
    source: SourceInput,
    config: ProviderFactoryConfig = {},
  ): Promise<AnalyzerResult> {
    if (!source.buffer || source.buffer.byteLength === 0) {
      throw new Error("A non-empty source buffer is required for image analysis.");
    }

    const runId = `run_${this.idFactory()}`;
    const createdAt = this.now().toISOString();
    const engine = this.providerFactory(config);
    const sha256 = createHash("sha256").update(source.buffer).digest("hex");

    this.ledger.append({
      runId,
      type: "run.started",
      occurredAt: createdAt,
      payload: { engine: engine.type, model: engine.model, sha256 },
    });

    try {
      const engineResponse = await engine.analyzeImage({
        base64Image: Buffer.from(source.buffer).toString("base64"),
        mediaType: source.mediaType ?? "image/jpeg",
        systemPrompt: VISUAL_ANALYSIS_SYSTEM_PROMPT,
      });
      const parsed = parseStructuredOutput(engineResponse.rawText);
      const providerOutput = ProviderAnalyzerOutputSchema.parse(parsed);
      const verification = assertTraceability(providerOutput);

      const result = AnalyzerResultSchema.parse({
        run: {
          id: runId,
          version: "seed-loom.analyzer-core.v0.1",
          createdAt,
          engine: engineResponse.provider,
          parentRunId: config.parentRunId ?? null,
        },
        source: {
          id: `src_${this.idFactory()}`,
          kind: source.kind,
          sha256,
          uri: source.uri ?? null,
          regions: [],
        },
        evidence: providerOutput.evidence,
        interpretations: providerOutput.interpretations,
        tokens: providerOutput.tokens,
        translations: providerOutput.translations,
        verification,
      });

      this.ledger.append({
        runId,
        type: "run.completed",
        occurredAt: this.now().toISOString(),
        payload: {
          provider: engineResponse.provider,
          model: engineResponse.model,
          requestId: engineResponse.requestId ?? null,
          traceabilityCoverage: result.verification.traceabilityCoverage,
        },
      });

      return result;
    } catch (error) {
      this.ledger.append({
        runId,
        type: "run.failed",
        occurredAt: this.now().toISOString(),
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }
}

export type { AnalyzerRunConfig };
