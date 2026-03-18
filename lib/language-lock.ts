export type LanguageLockResult = {
  language: "it" | "en" | "unknown";
};

function detectItalian(text: string): boolean {
  return /\b(ciao|sono|come|puoi|voglio|progetto|punto)\b/.test(text.toLowerCase());
}

function detectEnglish(text: string): boolean {
  return /\b(hello|what|can|project|point|system)\b/.test(text.toLowerCase());
}

export function resolveLanguage(input: {
  history: string[];
  message: string;
}): LanguageLockResult {
  const lastMessages = input.history.slice(-5).join(" ").toLowerCase();

  if (detectItalian(lastMessages)) {
    return { language: "it" };
  }

  if (detectEnglish(lastMessages)) {
    return { language: "en" };
  }

  return { language: "unknown" };
}
