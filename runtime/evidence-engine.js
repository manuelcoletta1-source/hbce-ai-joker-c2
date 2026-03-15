export function createEvidence(payload, decision) {
  return {
    evidence_id: `evid-${Date.now()}`,
    subject: payload.subject || "unknown",
    request: payload.request || null,
    status: decision.status,
    reason: decision.reason || null,
    output: decision.output || null,
    timestamp: new Date().toISOString()
  };
}
