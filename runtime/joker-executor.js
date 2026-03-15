import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";
import { buildStateFlow } from "./state-engine.js";

export async function executeJoker(payload) {

  const decision = await evaluateRequest(payload);

  const state = buildStateFlow(payload, decision);

  const evidence = createEvidence(payload, decision);

  const response = {
    status: decision.status,
    reason: decision.reason || null,
    output: decision.output || null,
    state: state,
    evidence: evidence
  };

  return response;

}
