import { getModelPreferences, setModelPreferences } from "../lib/model-preferences.js";

export function initModelSelector() {

  const selector = document.getElementById("model-selector");

  if (!selector) {
    return;
  }

  const preferences = getModelPreferences();

  selector.value = preferences.preferred_model || "openai";

  selector.addEventListener("change", () => {

    const selectedModel = selector.value;

    setModelPreferences({
      preferred_model: selectedModel
    });

  });

}
