import { resolveIprBinding } from "./ipr-binding-engine.js";
import { routeModel } from "./model-router.js";
import { appendEvent } from "./event-ledger.js";
import { buildPublicVerificationProof } from "./public-verification-proof.js";

export async function executeRequest(payload) {

  const binding = resolveIprBinding();

  if (binding.status !== "ALLOW") {

    const event = appendEvent({
      stage: "IPR_BINDING",
      status: "DENY",
      reason: binding.reason || "ipr_binding_failed",
      payload
    });

    return {
      status: "DENY",
      stage: "IPR_BINDING",
      event_id: event.event_id,
      reason: binding.reason || "ipr_binding_failed"
    };
  }

  const modelResult = await routeModel(payload);

  if (!modelResult || modelResult.status !== "ALLOW") {

    const event = appendEvent({
      stage: "MODEL_EXECUTION",
      status: "DENY",
      reason: modelResult?.reason || "model_execution_failed",
      payload
    });

    return {
      status: "DENY",
      stage: "MODEL_EXECUTION",
      event_id: event.event_id,
      reason: modelResult?.reason || "model_execution_failed"
    };
  }

  const event = appendEvent({
    stage: "EXECUTION_COMPLETE",
    status: "ALLOW",
    entity: binding.binding,
    model: modelResult.model,
    request: payload,
    response: modelResult.output
  });

  const proof = buildPublicVerificationProof();

  return {
    status: "ALLOW",
    event_id: event.event_id,
    entity: binding.binding,
    model: modelResult.model,
    result: modelResult.output,
    verification_proof: proof
  };
}
