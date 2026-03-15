import { evaluateRequest } from "./governance-engine.js";
import { createEvidence } from "./evidence-engine.js";
import { buildStateFlow } from "./state-engine.js";
import { appendToRegistry } from "./registry-bridge.js";
import {
  ensureRuntimeSession,
  appendRuntimeSessionEvent
} from "./session-runtime.js";
import { resolveJokerIdentity } from "./joker-identity.js";
import { appendMemory } from "./memory-engine.js";
import { routeModel } from "./model-router.js";

export async function executeJoker(payload) {

  const identityResult = resolveJokerIdentity();

  if (identityResult.status === "DENY") {
    return {
      status: "DENY",
      reason: identityResult.reason || "identity_resolution_failed",
      output: null,
      state: null,
      evidence: null,
      registry: null,
      session_id: null
    };
  }

  const jokerIdentity = identityResult.identity;

  const runtimePayload = {
    ...payload,
    subject: jokerIdentity.ipr_id,
    joker_identity: jokerIdentity
  };

  const session = ensureRuntimeSession(runtimePayload);

  appendRuntimeSessionEvent(session.session_id, {
    type: "REQUEST_RECEIVED",
    subject: runtimePayload.subject || null,
    request: runtimePayload.request || null
  });

  appendMemory(session.session_id, {
    role: "user",
    content: runtimePayload.request || null
  });

  const decision = await evaluateRequest(runtimePayload);

  appendRuntimeSessionEvent(session.session_id, {
    type: "GOVERNANCE_DECISION",
    status: decision.status,
    reason: decision.reason || null
  });

  const state = buildStateFlow(runtimePayload, decision);

  if (decision.status === "DENY") {

    const evidence = createEvidence(runtimePayload, decision);
    const registryEntry = appendToRegistry(evidence);

    appendRuntimeSessionEvent(session.session_id, {
      type: "EVIDENCE_RECORDED",
      evidence_id: evidence.evidence_id,
      registry_ref: registryEntry.registry_ref,
      status: evidence.status
    });

    appendMemory(session.session_id, {
      role: "assistant",
      content: {
        status: "DENY",
        reason: decision.reason || null
      }
    });

    return {
      status: decision.status,
      reason: decision.reason || null,
      output: null,
      state: state,
      evidence: evidence,
      registry: registryEntry,
      session_id: session.session_id,
      identity: jokerIdentity
    };
  }

  const modelResult = await routeModel(runtimePayload);

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

  const finalState = buildStateFlow(runtimePayload, finalDecision);
  const evidence = createEvidence(runtimePayload, finalDecision);
  const registryEntry = appendToRegistry(evidence);

  appendRuntimeSessionEvent(session.session_id, {
    type: "EVIDENCE_RECORDED",
    evidence_id: evidence.evidence_id,
    registry_ref: registryEntry.registry_ref,
    status: evidence.status
  });

  appendMemory(session.session_id, {
    role: "assistant",
    content: {
      status: finalDecision.status,
      output: finalDecision.output || null,
      reason: finalDecision.reason || null,
      model: modelResult.model || null
    }
  });

  return {
    status: finalDecision.status,
    reason: finalDecision.reason || null,
    output: finalDecision.output || null,
    state: finalState,
    evidence: evidence,
    registry: registryEntry,
    model: modelResult.model || null,
    session_id: session.session_id,
    identity: jokerIdentity
  };

}
