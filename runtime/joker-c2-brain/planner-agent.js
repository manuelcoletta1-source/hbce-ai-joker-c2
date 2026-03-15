function buildPlannerId() {
  return `planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function runPlannerAgent(payload) {
  const message =
    typeof payload?.request === "string"
      ? payload.request
      : payload?.request?.payload?.message || "";

  if (!message || message.trim().length === 0) {
    return {
      status: "DENY",
      reason: "missing_planner_input"
    };
  }

  return {
    status: "ALLOW",
    agent: {
      agent_id: buildPlannerId(),
      type: "PLANNER_AGENT",
      created_at: new Date().toISOString(),
      objective: "Transform user request into an operational execution plan",
      input: message,
      plan: [
        "Normalize request",
        "Classify operational intent",
        "Select execution route",
        "Prepare governance-aware action"
      ]
    }
  };
}
