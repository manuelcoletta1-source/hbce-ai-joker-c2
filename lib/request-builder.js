import { getSession, registerRequest } from "./session-manager.js";
import { getModelPreferences } from "./model-preferences.js";

export function buildRequest(userInput) {

  const session = getSession();
  const requestEntry = registerRequest(userInput);
  const modelPreferences = getModelPreferences();

  const structuredRequest = {
    subject: session.subject,
    session_id: session.session_id,
    request_id: requestEntry.request_id,
    timestamp: requestEntry.timestamp,
    action: "chat_message",
    model_preferences: modelPreferences,
    payload: {
      message: userInput
    }
  };

  return structuredRequest;
}
