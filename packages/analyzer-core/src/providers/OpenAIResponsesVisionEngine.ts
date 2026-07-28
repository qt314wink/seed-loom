import OpenAI from "openai";
import type {
  VisionEngine,
  VisionEngineRequest,
  VisionEngineResponse,
} from "../contracts.js";

export class OpenAIResponsesVisionEngine implements VisionEngine {
  readonly type = "openai" as const;
  private readonly client: OpenAI;

  constructor(
    readonly model = "gpt-5",
    apiKey = process.env.OPENAI_API_KEY,
  ) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for the OpenAI vision adapter.");
    }
    this.client = new OpenAI({ apiKey });
  }

  async analyzeImage(request: VisionEngineRequest): Promise<VisionEngineResponse> {
    const response = await this.client.responses.create({
      model: this.model,
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${request.systemPrompt}\n\nAnalyze the supplied image now.`,
            },
            {
              type: "input_image",
              image_url: `data:${request.mediaType};base64,${request.base64Image}`,
              detail: "high",
            },
          ],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned no output text.");
    }

    return {
      rawText: response.output_text,
      provider: this.type,
      model: this.model,
      requestId: response.id,
    };
  }
}
