import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";
import { buildStateFlow } from "./state-engine.js";
import { generateModelResponse } from "./llm-bridge.js";
import { appendToRegistry } from "./registry-bridge.js";
import {
  ensureRuntimeSession,
  appendRuntimeSessionEvent
} from "./session-runtime.js";

export async function executeJoker(payload) {

  const session = ensureRuntimeSession(payload);

  appendRuntimeSessionEvent(session.session_id, {
    type: "REQUEST_RECEIVED",
    subject: payload.subject || null,
    request: payload.request || null
  });

  const decision = await evaluateRequest(payload);

  appendRuntimeSessionEvent(session.session_id, {
    type: "GOVERNANCE_DECISION",
    status: decision.status,
    reason: decision.reason || null
  });

  const state = buildStateFlow(payload, decision);

  if (decision.status === "DENY") {

    const evidence = createEvidence(payload, decision);
    const registryEntry = appendToRegistry(evidence);

    appendRuntimeSessionEvent(session.session_id, {
      type: "EVIDENCE_RECORDED",
      evidence_id: evidence.evidence_id,
      registry_ref: registryEntry.registry_ref,
      status: evidence.status
    });

    return {
      status: decision.status,
      reason: decision.reason || null,
      output: null,
      state: state,
      evidence: evidence,
      registry: registryEntry,
      session_id: session.session_id
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

  appendRuntimeSessionEvent(session.session_id, {
    type: "MODEL_RESULT",
    status: finalDecision.status,
    reason: finalDecision.reason || null,
    output: finalDecision.output || null,
    model: modelResult.model || null
  });

  const finalState = buildStateFlow(payload, finalDecision);
  const evidence = createEvidence(payload, finalDecision);
  const registryEntry = appendToRegistry(evidence);

  appendRuntimeSessionEvent(session.session_id, {
    type: "EVIDENCE_RECORDED",
    evidence_id: evidence.evidence_id,
    registry_ref: registryEntry.registry_ref,
    status: evidence.status
  });

  return {
    status: finalDecision.status,
    reason: finalDecision.reason || null,
    output: finalDecision.output || null,
    state: finalState,
    evidence: evidence,
    registry: registryEntry,
    model: modelResult.model || null,
    session_id: session.session_id
  };

}
