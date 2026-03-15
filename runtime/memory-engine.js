const runtimeMemory = new Map();

function ensureMemoryBucket(sessionId) {
  if (!runtimeMemory.has(sessionId)) {
    runtimeMemory.set(sessionId, []);
  }

  return runtimeMemory.get(sessionId);
}

export function appendMemory(sessionId, entry) {
  if (!sessionId) {
    return [];
  }

  const bucket = ensureMemoryBucket(sessionId);

  bucket.push({
    timestamp: new Date().toISOString(),
    ...entry
  });

  runtimeMemory.set(sessionId, bucket);

  return bucket;
}

export function getMemory(sessionId) {
  if (!sessionId) {
    return [];
  }

  return runtimeMemory.get(sessionId) || [];
}

export function clearMemory(sessionId) {
  if (!sessionId) {
    return false;
  }

  return runtimeMemory.delete(sessionId);
}
