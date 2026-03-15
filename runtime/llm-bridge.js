export async function generateModelResponse(payload) {

  if (!payload || !payload.request) {
    return {
      status: "DENY",
      reason: "missing_request"
    };
  }

  const userText =
    typeof payload.request === "string"
      ? payload.request
      : payload.request.payload?.message || "";

  if (!userText || userText.trim().length === 0) {
    return {
      status: "DENY",
      reason: "empty_model_input"
    };
  }

  return {
    status: "ALLOW",
    model: "HBCE_SIMULATED_MODEL",
    output: `AI JOKER-C2 processed the request: ${userText}`
  };

}
