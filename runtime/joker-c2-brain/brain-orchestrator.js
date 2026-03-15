import { runPlannerAgent } from "./planner-agent.js";
import { runReasoningAgent } from "./reasoning-agent.js";
import { runExecutionAgent } from "./execution-agent.js";
import { runVerificationAgent } from "./verification-agent.js";

export async function runBrainOrchestrator(payload) {
  const plannerResult = runPlannerAgent(payload);

  if (plannerResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: plannerResult.reason || "planner_failed"
    };
  }

  const reasoningResult = runReasoningAgent(payload, plannerResult);

  if (reasoningResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: reasoningResult.reason || "reasoning_failed"
    };
  }

  const executionResult = runExecutionAgent(
    payload,
    plannerResult,
    reasoningResult
  );

  if (executionResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: executionResult.reason || "execution_failed"
    };
  }

  const verificationResult = runVerificationAgent(
    payload,
    plannerResult,
    reasoningResult,
    executionResult
  );

  if (verificationResult.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: verificationResult.reason || "verification_failed"
    };
  }

  return {
    status: "ALLOW",
    mode: "joker_c2_brain",
    agents: {
      planner: plannerResult.agent,
      reasoning: reasoningResult.agent,
      execution: executionResult.agent,
      verification: verificationResult.agent
    },
    output: executionResult.agent.output
  };
}
