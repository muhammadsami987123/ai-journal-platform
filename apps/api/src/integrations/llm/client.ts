import type { PromptMessage } from "./prompts.js";

export interface LlmCompletion {
  raw: string;
  model: string;
  provider: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface LlmClient {
  complete(messages: PromptMessage[]): Promise<LlmCompletion>;
  readonly configured: boolean;
  readonly provider: string;
  readonly model: string;
}

export class LlmUnavailableError extends Error {}

export interface LlmConfig {
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
}

/**
 * Provider-agnostic adapter for any OpenAI-compatible chat-completions
 * endpoint. Swapping provider or model is an environment change only; no
 * domain module or UI code knows the vendor (T8.1).
 */
export class OpenAiCompatibleClient implements LlmClient {
  readonly provider: string;
  readonly model: string;
  readonly configured: boolean;

  constructor(private readonly config: LlmConfig) {
    this.provider = config.provider;
    this.model = config.model ?? "";
    this.configured = Boolean(config.baseUrl && config.apiKey && config.model);
  }

  async complete(messages: PromptMessage[]): Promise<LlmCompletion> {
    if (!this.configured) {
      throw new LlmUnavailableError("No language model is configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl?.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.35,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new LlmUnavailableError(`Provider responded ${response.status}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        model?: string;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        throw new LlmUnavailableError("Provider returned an empty completion.");
      }

      return {
        raw: content,
        model: payload.model ?? this.model,
        provider: this.provider,
        tokensIn: payload.usage?.prompt_tokens ?? null,
        tokensOut: payload.usage?.completion_tokens ?? null
      };
    } catch (error) {
      if (error instanceof LlmUnavailableError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new LlmUnavailableError("The language model timed out.");
      }
      throw new LlmUnavailableError(
        error instanceof Error ? error.message : "Unknown language model failure."
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createLlmClient(config: LlmConfig): LlmClient {
  return new OpenAiCompatibleClient(config);
}
