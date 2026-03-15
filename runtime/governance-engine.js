export async function evaluateRequest(payload) {

  if (!payload.subject) {
    return {
      status: "DENY",
      reason: "missing_subject"
    };
  }

  if (payload.subject !== "IPR-AI-0001") {
    return {
      status: "DENY",
      reason: "invalid_identity_binding"
    };
  }

  if (!payload.request) {
    return {
      status: "DENY",
      reason: "missing_request"
    };
  }

  const text =
    typeof payload.request === "string"
      ? payload.request
      : JSON.stringify(payload.request);

  if (!text || text.trim().length === 0) {
    return {
      status: "DENY",
      reason: "empty_request"
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
      reason: "policy_denied",
      evidence: {
        decision: "DENY",
        timestamp: new Date().toISOString(),
        subject: payload.subject,
        rule: matchedDeniedPattern
      }
    };
  }

  return {
    status: "ALLOW",
    output: `JOKER-C2 accepted the request: ${text}`,
    evidence: {
      decision: "ALLOW",
      timestamp: new Date().toISOString(),
      subject: payload.subject
    }
  };

}
