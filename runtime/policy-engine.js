export function evaluatePolicy(payload) {

  if (!payload) {
    return {
      status: "DENY",
      reason: "missing_payload"
    };
  }

  if (!payload.subject) {
    return {
      status: "DENY",
      reason: "missing_subject"
    };
  }

  const allowedSubjects = [
    "IPR-AI-0001"
  ];

  if (!allowedSubjects.includes(payload.subject)) {
    return {
      status: "DENY",
      reason: "subject_not_authorized"
    };
  }

  if (!payload.timestamp) {
    return {
      status: "DENY",
      reason: "missing_timestamp"
    };
  }

  return {
    status: "ALLOW",
    policy: "HBCE_BASE_POLICY"
  };

}
