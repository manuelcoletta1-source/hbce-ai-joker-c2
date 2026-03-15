import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";
import { buildStateFlow } from "./state-engine.js";
import { generateModelResponse } from "./llm-bridge.js";
import { appendToRegistry } from "./registry-bridge.js";

export async function executeJoker(payload) {

  const decision = await evaluateRequest(payload);

  const state = buildStateFlow(payload, decision);

  if (decision.status === "DENY") {

    const evidence = createEvidence(payload, decision);
    const registryEntry = appendToRegistry(evidence);

    return {
      status: decision.status,
      reason: decision.reason || null,
      output: null,
      state: state,
      evidence: evidence,
      registry: registryEntry
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

  const registryEntry = appendToRegistry(evidence);

  return {
    status: finalDecision.status,
    reason: finalDecision.reason || null,
    output: finalDecision.output || null,
    state: finalState,
    evidence: evidence,
    registry: registryEntry,
    model: modelResult.model || null
  };

}
