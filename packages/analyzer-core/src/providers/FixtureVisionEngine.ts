import type {
  VisionEngine,
  VisionEngineRequest,
  VisionEngineResponse,
} from "../contracts.js";

export class FixtureVisionEngine implements VisionEngine {
  readonly type = "fixture" as const;
  readonly model = "deterministic-fixture-v1";

  constructor(private readonly output: unknown) {}

  async analyzeImage(_request: VisionEngineRequest): Promise<VisionEngineResponse> {
    return {
      rawText: JSON.stringify(this.output),
      provider: this.type,
      model: this.model,
    };
  }
}
