import { evaluatePolicy } from "./policy-engine.js";

export async function evaluateRequest(payload) {

  const policyResult = evaluatePolicy(payload);

  if (policyResult.status === "DENY") {
    return {
      status: "DENY",
      reason: policyResult.reason || "policy_denied",
      policy: policyResult.policy || null
    };
  }

  if (!payload.request) {
    return {
      status: "DENY",
      reason: "missing_request",
      policy: policyResult.policy || null
    };
  }

  const text =
    typeof payload.request === "string"
      ? payload.request
      : JSON.stringify(payload.request);

  if (!text || text.trim().length === 0) {
    return {
      status: "DENY",
      reason: "empty_request",
      policy: policyResult.policy || null
    };
  }

  const deniedPatterns = [
    "delete registry",
    "remove evidence",
    "bypass validation",
    "disable governance"
  ];

  const lowered = text.toLowerCase();

  const matchedDeniedPattern = deniedPatterns.find((pattern) =>
    lowered.includes(pattern)
  );

  if (matchedDeniedPattern) {
    return {
      status: "DENY",
      reason: "governance_denied",
      policy: policyResult.policy || null,
      rule: matchedDeniedPattern
    };
  }

  return {
    status: "ALLOW",
    policy: policyResult.policy || "HBCE_BASE_POLICY"
  };

}
