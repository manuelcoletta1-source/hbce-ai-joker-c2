import OpenAI from "openai";
import { JokerModelTarget } from "./model-router";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ExecuteInput = {
  routing: JokerModelTarget;
  requestBody: any;
};

type ExecuteResult = {
  ok: boolean;
  data?: any;
  error?: string;
  provider: string;
  model: string;
};

async function executeOpenAI(requestBody: any): Promise<ExecuteResult> {
  try {
    const response = await openai.responses.create(requestBody);

    return {
      ok: true,
      data: response,
      provider: "openai",
      model: requestBody.model
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "OpenAI error",
      provider: "openai",
      model: requestBody.model
    };
  }
}

export async function executeWithFallback(
  input: ExecuteInput
): Promise<ExecuteResult> {
  const { routing, requestBody } = input;

  // 1. Primary execution
  if (routing.provider === "openai") {
    const result = await executeOpenAI(requestBody);

    if (result.ok) return result;

    // fallback automatico
    return {
      ok: false,
      error: `Primary provider failed: ${result.error}`,
      provider: routing.provider,
      model: routing.model
    };
  }

  return {
    ok: false,
    error: `Provider ${routing.provider} not implemented yet`,
    provider: routing.provider,
    model: routing.model
  };
}
