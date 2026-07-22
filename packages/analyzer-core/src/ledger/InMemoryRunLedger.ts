import { createHash, randomUUID } from "node:crypto";

export type AnalysisRunEventType =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "run.superseded";

export interface AnalysisRunEvent {
  eventId: string;
  runId: string;
  type: AnalysisRunEventType;
  occurredAt: string;
  payload: Record<string, unknown>;
  previousEventHash: string | null;
  eventHash: string;
}

export class InMemoryRunLedger {
  private readonly events: AnalysisRunEvent[] = [];

  append(
    event: Omit<AnalysisRunEvent, "eventId" | "previousEventHash" | "eventHash">,
  ): AnalysisRunEvent {
    const previous = this.events.at(-1) ?? null;
    const eventId = `evt_${randomUUID()}`;
    const previousEventHash = previous?.eventHash ?? null;
    const canonical = JSON.stringify({ eventId, ...event, previousEventHash });
    const eventHash = createHash("sha256").update(canonical).digest("hex");
    const stored = { eventId, ...event, previousEventHash, eventHash };
    this.events.push(stored);
    return structuredClone(stored);
  }

  list(runId?: string): AnalysisRunEvent[] {
    return this.events
      .filter((event) => runId === undefined || event.runId === runId)
      .map((event) => structuredClone(event));
  }
}
