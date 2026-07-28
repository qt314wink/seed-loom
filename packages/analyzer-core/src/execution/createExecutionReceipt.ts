import type { AnalyzerResult } from "../AnalyzerValidator.js";
import type {
  AnalysisRunEvent,
  AnalysisRunEventType,
} from "../ledger/InMemoryRunLedger.js";

export interface AnalyzerExecutionReceipt {
  receiptVersion: "seed-loom.analyzer-execution-receipt.v0.1";
  status: "verified" | "incomplete";
  runId: string;
  analyzerVersion: string;
  createdAt: string;
  engine: string;
  sourceSha256: string;
  counts: {
    evidence: number;
    interpretations: number;
    tokens: number;
    translations: number;
  };
  verification: {
    traceabilityCoverage: number;
    unsupportedClaims: number;
  };
  ledger: {
    eventCount: number;
    eventTypes: AnalysisRunEventType[];
    appendOnly: true;
    chainComplete: boolean;
  };
}

/**
 * Creates a deterministic, portable receipt from a validated analyzer result.
 * Random ledger event IDs and hashes are intentionally excluded; the receipt
 * records lifecycle types and whether their hash links form a complete chain.
 */
export function createExecutionReceipt(
  result: AnalyzerResult,
  events: AnalysisRunEvent[],
): AnalyzerExecutionReceipt {
  const runEvents = events.filter((event) => event.runId === result.run.id);
  const eventTypes = runEvents.map((event) => event.type);
  const chainComplete = runEvents.every((event, index) => {
    if (index === 0) {
      return event.previousEventHash === null;
    }

    return event.previousEventHash === runEvents[index - 1]?.eventHash;
  });
  const lifecycleComplete =
    eventTypes[0] === "run.started" && eventTypes.at(-1) === "run.completed";

  return {
    receiptVersion: "seed-loom.analyzer-execution-receipt.v0.1",
    status:
      lifecycleComplete &&
      chainComplete &&
      result.verification.unsupportedClaims === 0
        ? "verified"
        : "incomplete",
    runId: result.run.id,
    analyzerVersion: result.run.version,
    createdAt: result.run.createdAt,
    engine: result.run.engine,
    sourceSha256: result.source.sha256,
    counts: {
      evidence: result.evidence.length,
      interpretations: result.interpretations.length,
      tokens: result.tokens.length,
      translations: result.translations.length,
    },
    verification: {
      traceabilityCoverage: result.verification.traceabilityCoverage,
      unsupportedClaims: result.verification.unsupportedClaims,
    },
    ledger: {
      eventCount: runEvents.length,
      eventTypes,
      appendOnly: true,
      chainComplete,
    },
  };
}
