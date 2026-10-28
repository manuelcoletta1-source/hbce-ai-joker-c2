import OpenAI from "openai";

import type {
  LlmCompletionRequest,
  LlmCompletionResult,
  LlmProviderAdapter
} from "./llm-provider-contract";

export class OpenAIProviderAdapter implements LlmProviderAdapter {
  readonly providerId = "OPENAI";

  private readonly client: OpenAI;

  constructor(apiKey: string, client?: OpenAI) {
    if (!apiKey.trim()) {
      throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
    }

    this.client = client ?? new OpenAI({
      apiKey,
      timeout: 30_000,
      maxRetries: 0
    });
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<LlmCompletionResult> {
    if (!request.model.trim() || request.messages.length === 0) {
      throw new Error("INVALID_LLM_COMPLETION_REQUEST");
    }

    const completion = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages.map(({ role, content }) => ({
        role,
        content
      })),
      temperature: request.temperature ?? 0.35
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("OPENAI_EMPTY_RESPONSE");
    }

    const usage = completion.usage;

    return {
      kind: "MODEL_OUTPUT",
      answer,
      usage: {
        inputTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        cachedInputTokens:
          usage?.prompt_tokens_details?.cached_tokens ?? null,
        reasoningTokens:
          usage?.completion_tokens_details?.reasoning_tokens ?? null
      },
      finishReason: completion.choices[0]?.finish_reason ?? null,
      requestedProvider: this.providerId,
      executedProvider: this.providerId,
      model: completion.model || request.model
    };
  }
}
