function buildExecutionId() {
  return `execution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function runExecutionAgent(payload, plannerResult, reasoningResult) {
  const message =
    typeof payload?.request === "string"
      ? payload.request
      : payload?.request?.payload?.message || "";

  if (!message || message.trim().length === 0) {
    return {
      status: "DENY",
      reason: "missing_execution_input"
    };
  }

  if (!plannerResult || plannerResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "planner_result_unavailable"
    };
  }

  if (!reasoningResult || reasoningResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "reasoning_result_unavailable"
    };
  }

  return {
    status: "ALLOW",
    agent: {
      agent_id: buildExecutionId(),
      type: "EXECUTION_AGENT",
      created_at: new Date().toISOString(),
      objective: "Prepare the governed execution output",
      input: message,
      execution: {
        route: reasoningResult.agent?.reasoning?.suggested_route || "joker_c2_execution",
        mode: "governed_execution",
        action: "produce_operational_response",
        planned_steps: plannerResult.agent?.plan || []
      },
      output: `JOKER-C2 execution agent prepared the governed response for: ${message}`
    }
  };
}
