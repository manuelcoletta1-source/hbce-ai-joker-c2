import { resolveIprBinding } from "./ipr-binding-engine.js";
import { routeModel } from "./model-router.js";

export async function executeRequest(payload) {

  const binding = resolveIprBinding();

  if (binding.status !== "ALLOW") {
    return {
      status: "DENY",
      stage: "IPR_BINDING",
      reason: binding.reason || "ipr_binding_failed"
    };
  }

  const modelResult = await routeModel(payload);

  if (!modelResult || modelResult.status !== "ALLOW") {
    return {
      status: "DENY",
      stage: "MODEL_EXECUTION",
      reason: modelResult?.reason || "model_execution_failed"
    };
  }

  return {
    status: "ALLOW",
    entity: binding.binding,
    result: modelResult.output || null,
    model: modelResult.model || "unknown"
  };
}
