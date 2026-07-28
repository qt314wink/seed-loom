import type { ProviderFactoryConfig, VisionEngine } from "../contracts.js";
import { FixtureVisionEngine } from "./FixtureVisionEngine.js";
import { OllamaVisionEngine } from "./OllamaVisionEngine.js";
import { OpenAIResponsesVisionEngine } from "./OpenAIResponsesVisionEngine.js";

export function createVisionEngine(config: ProviderFactoryConfig = {}): VisionEngine {
  const engine = config.engine ?? "ollama";

  switch (engine) {
    case "fixture":
      if (config.fixtureOutput === undefined) {
        throw new Error("fixtureOutput is required when engine is 'fixture'.");
      }
      return new FixtureVisionEngine(config.fixtureOutput);
    case "openai":
      return new OpenAIResponsesVisionEngine(
        config.modelName ?? "gpt-5",
        config.openAIApiKey,
      );
    case "ollama":
      return new OllamaVisionEngine(
        config.modelName ?? "llama3.2-vision",
        config.ollamaBaseUrl,
        config.fetchImplementation,
      );
    default: {
      const unreachable: never = engine;
      throw new Error(`Unsupported vision engine: ${String(unreachable)}`);
    }
  }
}
