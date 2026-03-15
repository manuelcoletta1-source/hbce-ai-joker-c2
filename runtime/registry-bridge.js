const registryLog = [];

function buildRegistryRef() {
  return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendToRegistry(evidence) {
  const entry = {
    registry_ref: buildRegistryRef(),
    evidence_id: evidence.evidence_id,
    timestamp: new Date().toISOString(),
    status: evidence.status
  };

  registryLog.push(entry);

  return entry;
}

export function getRegistryLog() {
  return registryLog;
}
