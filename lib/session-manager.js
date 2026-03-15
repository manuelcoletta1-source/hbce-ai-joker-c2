function generateId(prefix) {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${random}`;
}

export function createSession() {

  const session = {
    session_id: generateId("session"),
    subject: "IPR-AI-0001",
    created_at: new Date().toISOString(),
    requests: []
  };

  localStorage.setItem("joker_session", JSON.stringify(session));

  return session;
}

export function getSession() {

  const stored = localStorage.getItem("joker_session");

  if (!stored) {
    return createSession();
  }

  return JSON.parse(stored);
}

export function registerRequest(request) {

  const session = getSession();

  const requestEntry = {
    request_id: generateId("req"),
    timestamp: new Date().toISOString(),
    request: request
  };

  session.requests.push(requestEntry);

  localStorage.setItem("joker_session", JSON.stringify(session));

  return requestEntry;
}

export function clearSession() {
  localStorage.removeItem("joker_session");
}
