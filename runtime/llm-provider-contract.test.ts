import { describe, expect, it } from "vitest";
import type {
  LlmCompletionResult,
  LlmProviderAdapter
} from "./llm-provider-contract";

const usage = {
  inputTokens: 10,
  outputTokens: 5,
  totalTokens: 15,
  cachedInputTokens: null,
  reasoningTokens: null
};

describe("HBCE LLM Provider Contract", () => {
  it("accepts a typed model completion", async () => {
    const adapter: LlmProviderAdapter = {
      providerId: "OPENAI",
      async complete(request) {
        return {
          kind: "MODEL_OUTPUT",
          answer: "Test response",
          usage,
          finishReason: "stop",
          requestedProvider: "OPENAI",
          executedProvider: this.providerId,
          model: request.model
        };
      }
    };

    const result = await adapter.complete({
      model: "test-model",
      messages: [{ role: "user", content: "Test" }]
    });

    expect(result.kind).toBe("MODEL_OUTPUT");
    expect(result.executedProvider).toBe("OPENAI");
  });

  it("distinguishes local fallback from model execution", () => {
    const result: LlmCompletionResult = {
      kind: "LOCAL_FALLBACK",
      answer: "Local response",
      usage,
      finishReason: null,
      requestedProvider: "OPENAI",
      executedProvider: null,
      model: null
    };

    expect(result.kind).toBe("LOCAL_FALLBACK");
    expect(result.executedProvider).toBeNull();
    expect(result.model).toBeNull();
  });
});
