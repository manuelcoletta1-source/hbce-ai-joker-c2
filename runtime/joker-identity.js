import { loadBaseline } from "./baseline-engine.js";

export function resolveJokerIdentity() {
  const baselineResult = loadBaseline();

  if (baselineResult.status === "DENY") {
    return {
      status: "DENY",
      reason: baselineResult.reason || "baseline_identity_unavailable"
    };
  }

  const subject = baselineResult.subject;

  return {
    status: "ALLOW",
    identity: {
      entity_name: subject.entity_name,
      ipr_id: subject.ipr_id,
      binding: subject.binding,
      baseline_event: baselineResult.baseline_event,
      anchors: baselineResult.anchors
    }
  };
}

export function getJokerSubjectId() {
  const result = resolveJokerIdentity();

  if (result.status === "DENY") {
    return null;
  }

  return result.identity.ipr_id;
}
