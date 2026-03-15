import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";

export async function executeJoker(payload) {

  const decision = await evaluateRequest(payload);

  const evidence = createEvidence(payload, decision);

  const response = {
    status: decision.status,
    reason: decision.reason || null,
    output: decision.output || null,
    evidence: evidence
  };

  return response;

}
