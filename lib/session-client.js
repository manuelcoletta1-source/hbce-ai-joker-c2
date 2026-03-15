export async function fetchSession(sessionId) {

  if (!sessionId) {
    return {
      status: "DENY",
      reason: "missing_session_id"
    };
  }

  try {

    const response = await fetch(`/api/joker-c2/session?session_id=${encodeURIComponent(sessionId)}`);
    const result = await response.json();

    return result;

  } catch (error) {

    return {
      status: "DENY",
      reason: "session_fetch_error",
      error: error.message
    };

  }

}
