import { fetchSession } from "../lib/session-client.js";

export async function inspectSession(sessionId) {

  if (!sessionId) {
    console.warn("No session id provided");
    return;
  }

  const result = await fetchSession(sessionId);

  if (result.status !== "ALLOW") {
    console.error("Session inspection failed:", result.reason);
    return;
  }

  const session = result.session;

  console.group("JOKER-C2 SESSION");
  console.log("Session ID:", session.session_id);
  console.log("Subject:", session.subject);
  console.log("Created:", session.created_at);
  console.log("Last Update:", session.last_updated_at);
  console.table(session.history);
  console.groupEnd();
}
