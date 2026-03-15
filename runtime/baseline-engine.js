import { getJokerBaseline } from "./joker-baseline.js";

export function loadBaseline() {

  const baseline = getJokerBaseline();

  if (!baseline) {
    return {
      status: "DENY",
      reason: "baseline_missing"
    };
  }

  if (!baseline.subject || baseline.subject.ipr_id !== "IPR-AI-0001") {
    return {
      status: "DENY",
      reason: "invalid_subject_binding"
    };
  }

  if (!baseline.baseline || baseline.baseline.is_canonical !== true) {
    return {
      status: "DENY",
      reason: "baseline_not_canonical"
    };
  }

  return {
    status: "ALLOW",
    baseline_event: baseline.event_id,
    subject: baseline.subject,
    anchors: baseline.anchors
  };

}
