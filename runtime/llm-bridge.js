const SYSTEM_PROMPT = `
You are AI JOKER-C2, the operational AI entity of the HBCE ecosystem.

You operate under deterministic governance principles.
You do not claim unrestricted autonomy.
You act inside an identity-bound and evidence-producing environment.

Your responses must be:
- clear
- operational
- concise
- consistent with governance-controlled execution

If a request appears unsafe, invalid, or outside operational scope, you must return a refusal-oriented answer.
`.trim();

function buildFallbackResponse(userText) {
  return {
    status: "ALLOW",
    model: "HBCE_FALLBACK_MODEL",
    output: `AI JOKER-C2 processed the request in fallback mode: ${userText}`
  };
}

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

  const apiKey =
    typeof process !== "undefined" ? process.env.OPENAI_API_KEY : null;

  if (!apiKey) {
    return buildFallbackResponse(userText);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userText
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      return {
        status: "DENY",
        reason: "model_request_failed"
      };
    }

    const result = await response.json();

    const output =
      result?.choices?.[0]?.message?.content?.trim() || null;

    if (!output) {
      return {
        status: "DENY",
        reason: "empty_model_output"
      };
    }

    return {
      status: "ALLOW",
      model: result.model || "openai",
      output: output
    };

  } catch (error) {
    return {
      status: "DENY",
      reason: "model_runtime_error",
      error: error.message
    };
  }
}
