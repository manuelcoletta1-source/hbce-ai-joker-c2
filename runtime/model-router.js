import { generateModelResponse } from "./llm-bridge.js";

function getLocalModelResponse(payload) {
  const userText =
    typeof payload.request === "string"
      ? payload.request
      : payload.request?.payload?.message || "";

  return {
    status: "ALLOW",
    model: "HBCE_LOCAL_MODEL",
    output: `AI JOKER-C2 processed the request through the local model path: ${userText}`
  };
}

function getSimulatedMistralResponse(payload) {
  const userText =
    typeof payload.request === "string"
      ? payload.request
      : payload.request?.payload?.message || "";

  return {
    status: "ALLOW",
    model: "HBCE_MISTRAL_PATH",
    output: `AI JOKER-C2 processed the request through the Mistral path: ${userText}`
  };
}

export async function routeModel(payload) {
  if (!payload || !payload.request) {
    return {
      status: "DENY",
      reason: "missing_request"
    };
  }

  const preferredModel =
    payload?.model_preferences?.preferred_model || "openai";

  if (preferredModel === "local") {
    return getLocalModelResponse(payload);
  }

  if (preferredModel === "mistral") {
    return getSimulatedMistralResponse(payload);
  }

  return generateModelResponse(payload);
}
