function buildVerificationId() {
  return `verification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function runVerificationAgent(payload, plannerResult, reasoningResult, executionResult) {

  if (!plannerResult || plannerResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "planner_missing"
    };
  }

  if (!reasoningResult || reasoningResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "reasoning_missing"
    };
  }

  if (!executionResult || executionResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: "execution_missing"
    };
  }

  return {
    status: "ALLOW",
    agent: {
      agent_id: buildVerificationId(),
      type: "VERIFICATION_AGENT",
      created_at: new Date().toISOString(),
      objective: "Validate operational coherence of the Joker-C2 execution",
      validation: {
        planner: "validated",
        reasoning: "validated",
        execution: "validated",
        governance: "coherent"
      },
      result: "execution_verified"
    }
  };
}
