function buildReasoningId() {
  return `reasoning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function runReasoningAgent(payload, plannerResult) {
  const message =
    typeof payload?.request === "string"
      ? payload.request
      : payload?.request?.payload?.message || "";

  if (!message || message.trim().length === 0) {
    return {
      status: "DENY",
      reason: "missing_reasoning_input"
    };
  }

  if (!plannerResult || plannerResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "planner_result_unavailable"
    };
  }

  return {
    status: "ALLOW",
    agent: {
      agent_id: buildReasoningId(),
      type: "REASONING_AGENT",
      created_at: new Date().toISOString(),
      objective: "Interpret the operational meaning of the request",
      input: message,
      reasoning: {
        intent: "operational_interaction",
        category: "governed_request",
        suggested_route: "joker_c2_execution",
        derived_from_plan: plannerResult.agent?.plan || []
      }
    }
  };
}
