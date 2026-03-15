import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";
import { buildStateFlow } from "./state-engine.js";
import { generateModelResponse } from "./llm-bridge.js";

export async function executeJoker(payload) {

  const decision = await evaluateRequest(payload);

  const state = buildStateFlow(payload, decision);

  if (decision.status === "DENY") {
    const evidence = createEvidence(payload, decision);

    return {
      status: decision.status,
      reason: decision.reason || null,
      output: null,
      state: state,
      evidence: evidence
    };
  }

  const modelResult = await generateModelResponse(payload);

  const finalDecision =
    modelResult.status === "DENY"
      ? {
          status: "DENY",
          reason: modelResult.reason || "model_denied"
        }
      : {
          status: "ALLOW",
          output: modelResult.output || null
        };

  const finalState = buildStateFlow(payload, finalDecision);
  const evidence = createEvidence(payload, finalDecision);

  return {
    status: finalDecision.status,
    reason: finalDecision.reason || null,
    output: finalDecision.output || null,
    state: finalState,
    evidence: evidence,
    model: modelResult.model || null
  };

}
