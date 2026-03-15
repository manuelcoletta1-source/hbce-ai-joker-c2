export function getModelPreferences() {
  const stored = localStorage.getItem("joker_model_preferences");

  if (!stored) {
    return {
      preferred_model: "openai"
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      preferred_model: "openai"
    };
  }
}

export function setModelPreferences(preferences) {
  const value = {
    preferred_model: preferences?.preferred_model || "openai"
  };

  localStorage.setItem("joker_model_preferences", JSON.stringify(value));

  return value;
}
