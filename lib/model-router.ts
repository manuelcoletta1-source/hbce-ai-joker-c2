export type JokerProvider = "openai" | "anthropic" | "google" | "xai";

export type JokerMode =
  | "normal"
  | "analysis"
  | "vision"
  | "compliance"
  | "strategic";

export type JokerModelTarget = {
  provider: JokerProvider;
  model: string;
  mode: JokerMode;
  reason: string;
};

export type JokerRoutingInput = {
  message: string;
  hasImages?: boolean;
  research?: boolean;
};

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function detectMode(input: JokerRoutingInput): JokerMode {
  const message = normalizeMessage(input.message);

  if (input.hasImages) {
    return "vision";
  }

  if (
    message.includes("compliance") ||
    message.includes("gdpr") ||
    message.includes("nis2") ||
    message.includes("ai act") ||
    message.includes("regolamento")
  ) {
    return "compliance";
  }

  if (
    message.includes("analisi") ||
    message.includes("analysis") ||
    message.includes("confronta") ||
    message.includes("compare")
  ) {
    return "analysis";
  }

  if (
    message.includes("strategico") ||
    message.includes("strategic") ||
    message.includes("scenario") ||
    message.includes("piano nazionale") ||
    message.includes("matrix europa")
  ) {
    return "strategic";
  }

  return "normal";
}

function providerEnabled(provider: JokerProvider): boolean {
  switch (provider) {
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY);

    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY);

    case "google":
      return Boolean(process.env.GOOGLE_API_KEY);

    case "xai":
      return Boolean(process.env.XAI_API_KEY);

    default:
      return false;
  }
}

function pickOpenAIModel(mode: JokerMode): string {
  switch (mode) {
    case "vision":
      return "gpt-4.1-mini";
    case "analysis":
      return "gpt-4.1-mini";
    case "compliance":
      return "gpt-4.1-mini";
    case "strategic":
      return "gpt-4.1-mini";
    case "normal":
    default:
      return "gpt-4.1-mini";
  }
}

export function routeJokerModel(
  input: JokerRoutingInput
): JokerModelTarget {
  const mode = detectMode(input);

  if (providerEnabled("openai")) {
    return {
      provider: "openai",
      model: pickOpenAIModel(mode),
      mode,
      reason: "OpenAI is configured and selected as the active execution provider."
    };
  }

  if (providerEnabled("anthropic")) {
    return {
      provider: "anthropic",
      model: "claude-sonnet-4-0",
      mode,
      reason: "Anthropic is configured and selected as fallback execution provider."
    };
  }

  if (providerEnabled("google")) {
    return {
      provider: "google",
      model: "gemini-2.5-pro",
      mode,
      reason: "Google is configured and selected as fallback execution provider."
    };
  }

  if (providerEnabled("xai")) {
    return {
      provider: "xai",
      model: "grok-4",
      mode,
      reason: "xAI is configured and selected as fallback execution provider."
    };
  }

  return {
    provider: "openai",
    model: "gpt-4.1-mini",
    mode,
    reason:
      "No provider-specific environment was detected. Default routing returned OpenAI-compatible configuration."
  };
}
