const runtimeSessions = new Map();

function buildSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureRuntimeSession(payload) {
  const existingSessionId = payload.session_id;

  if (existingSessionId && runtimeSessions.has(existingSessionId)) {
    return runtimeSessions.get(existingSessionId);
  }

  const session = {
    session_id: existingSessionId || buildSessionId(),
    subject: payload.subject || "unknown",
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    history: []
  };

  runtimeSessions.set(session.session_id, session);

  return session;
}

export function appendRuntimeSessionEvent(sessionId, event) {
  const session = runtimeSessions.get(sessionId);

  if (!session) {
    return null;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  session.history.push(entry);
  session.last_updated_at = new Date().toISOString();

  runtimeSessions.set(sessionId, session);

  return session;
}

export function getRuntimeSession(sessionId) {
  return runtimeSessions.get(sessionId) || null;
}
