import type {
  VisionEngine,
  VisionEngineRequest,
  VisionEngineResponse,
} from "../contracts.js";

interface OllamaChatResponse {
  message?: { content?: string };
}

export class OllamaVisionEngine implements VisionEngine {
  readonly type = "ollama" as const;

  constructor(
    readonly model = "llama3.2-vision",
    private readonly baseUrl = "http://localhost:11434",
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async analyzeImage(request: VisionEngineRequest): Promise<VisionEngineResponse> {
    const response = await this.fetchImplementation(
      `${this.baseUrl.replace(/\/$/, "")}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          format: "json",
          stream: false,
          messages: [
            { role: "system", content: request.systemPrompt },
            {
              role: "user",
              content: "Analyze the image and return only the requested JSON object.",
              images: [request.base64Image],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as OllamaChatResponse;
    const rawText = payload.message?.content;
    if (!rawText) {
      throw new Error("Ollama returned no message content.");
    }

    return { rawText, provider: this.type, model: this.model };
  }
}
