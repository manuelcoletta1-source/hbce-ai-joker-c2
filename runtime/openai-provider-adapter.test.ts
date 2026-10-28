import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { OpenAIProviderAdapter } from "./openai-provider-adapter";

const request = {
  model: "model-requested",
  messages: [{ role: "user" as const, content: "Test" }]
};

function adapterWithMock(create: unknown) {
  const client = {
    chat: { completions: { create } }
  } as unknown as OpenAI;

  return new OpenAIProviderAdapter("offline-test-key", client);
}

describe("HBCE OpenAI Provider Adapter", () => {
  it("rejects missing credentials", () => {
    expect(() => new OpenAIProviderAdapter(" "))
      .toThrow("OPENAI_API_KEY_NOT_CONFIGURED");
  });

  it("normalizes output and records actual model", async () => {
    const create = vi.fn().mockResolvedValue({
      model: "model-executed",
      choices: [{
        message: { content: "  Verified response  " },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: 11,
        completion_tokens: 7,
        total_tokens: 18,
        prompt_tokens_details: { cached_tokens: 2 },
        completion_tokens_details: { reasoning_tokens: 3 }
      }
    });

    const result = await adapterWithMock(create).complete(request);

    expect(result.kind).toBe("MODEL_OUTPUT");
    expect(result.answer).toBe("Verified response");
    expect(result.requestedProvider).toBe("OPENAI");
    expect(result.executedProvider).toBe("OPENAI");
    expect(result.model).toBe("model-executed");
    expect(result.usage.totalTokens).toBe(18);
    expect(result.usage.cachedInputTokens).toBe(2);
    expect(create).toHaveBeenCalledWith({
      model: "model-requested",
      messages: request.messages,
      temperature: 0.35
    });
  });

  it("rejects invalid input before provider invocation", async () => {
    const create = vi.fn();
    const adapter = adapterWithMock(create);

    await expect(adapter.complete({
      model: " ",
      messages: []
    })).rejects.toThrow("INVALID_LLM_COMPLETION_REQUEST");

    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an empty provider response", async () => {
    const create = vi.fn().mockResolvedValue({
      model: "model-executed",
      choices: [{
        message: { content: "   " },
        finish_reason: "stop"
      }]
    });

    await expect(adapterWithMock(create).complete(request))
      .rejects.toThrow("OPENAI_EMPTY_RESPONSE");
  });

  it("propagates provider failures", async () => {
    const create = vi.fn().mockRejectedValue(
      new Error("UPSTREAM_FAILURE")
    );

    await expect(adapterWithMock(create).complete(request))
      .rejects.toThrow("UPSTREAM_FAILURE");
  });
});
