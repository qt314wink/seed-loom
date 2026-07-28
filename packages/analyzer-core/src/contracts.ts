export const ENGINE_TYPES = ["fixture", "ollama", "openai"] as const;
export type EngineType = (typeof ENGINE_TYPES)[number];

export const SOURCE_KINDS = [
  "image",
  "deck",
  "document",
  "url",
  "repository",
  "mixed",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export interface SourceInput {
  kind: SourceKind;
  buffer?: Uint8Array;
  uri?: string | null;
  mediaType?: string;
}

export interface AnalyzerRunConfig {
  engine?: EngineType;
  modelName?: string;
  parentRunId?: string | null;
  ollamaBaseUrl?: string;
  openAIApiKey?: string;
}

export interface VisionEngineRequest {
  base64Image: string;
  mediaType: string;
  systemPrompt: string;
}

export interface VisionEngineResponse {
  rawText: string;
  provider: EngineType;
  model: string;
  requestId?: string;
}

export interface VisionEngine {
  readonly type: EngineType;
  readonly model: string;
  analyzeImage(request: VisionEngineRequest): Promise<VisionEngineResponse>;
}

export interface ProviderFactoryConfig extends AnalyzerRunConfig {
  fixtureOutput?: unknown;
  fetchImplementation?: typeof fetch;
}
