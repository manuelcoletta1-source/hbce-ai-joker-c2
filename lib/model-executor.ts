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
  attempts: number;
};

async function executeOpenAI(requestBody: any): Promise<ExecuteResult> {
  try {
    const response = await openai.responses.create(requestBody);

    return {
      ok: true,
      data: response,
      provider: "openai",
      model: requestBody.model,
      attempts: 1
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "OpenAI error",
      provider: "openai",
      model: requestBody.model,
      attempts: 1
    };
  }
}

// fallback order (puoi espandere dopo)
const FALLBACK_CHAIN = ["openai"]; 

export async function executeWithFallback(
  input: ExecuteInput
): Promise<ExecuteResult> {
  const { routing, requestBody } = input;

  const providersToTry = [
    routing.provider,
    ...FALLBACK_CHAIN.filter((p) => p !== routing.provider)
  ];

  let lastError: string | undefined;

  for (let i = 0; i < providersToTry.length; i++) {
    const provider = providersToTry[i];

    let result: ExecuteResult;

    switch (provider) {
      case "openai":
        result = await executeOpenAI(requestBody);
        break;

      default:
        result = {
          ok: false,
          error: `Provider ${provider} not implemented`,
          provider,
          model: requestBody.model,
          attempts: i + 1
        };
    }

    if (result.ok) {
      return {
        ...result,
        attempts: i + 1
      };
    }

    lastError = result.error;
  }

  return {
    ok: false,
    error: `All providers failed: ${lastError}`,
    provider: routing.provider,
    model: routing.model,
    attempts: providersToTry.length
  };
}
