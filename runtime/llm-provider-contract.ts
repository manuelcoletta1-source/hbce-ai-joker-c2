/**
 * HBCE JOKER-C2 - Cognitive Provider Contract
 *
 * The LLM produces cognitive output only.
 * Identity, policy, authorization and execution authority
 * remain outside this interface, under HBCE governance.
 */

export type LlmMessage = Readonly<{
  role: "system" | "user" | "assistant";
  content: string;
}>;

export type LlmTokenUsage = Readonly<{
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cachedInputTokens: number | null;
  reasoningTokens: number | null;
}>;

export type LlmCompletionRequest = Readonly<{
  model: string;
  messages: readonly LlmMessage[];
  temperature?: number;
}>;

export type LlmCompletionResult =
  | Readonly<{
      kind: "MODEL_OUTPUT";
      answer: string;
      usage: LlmTokenUsage;
      finishReason: string | null;
      requestedProvider: string;
      executedProvider: string;
      model: string;
    }>
  | Readonly<{
      kind: "LOCAL_FALLBACK";
      answer: string;
      usage: LlmTokenUsage;
      finishReason: null;
      requestedProvider: string;
      executedProvider: null;
      model: null;
    }>;

export interface LlmProviderAdapter {
  readonly providerId: string;
  complete(
    request: LlmCompletionRequest
  ): Promise<LlmCompletionResult>;
}
