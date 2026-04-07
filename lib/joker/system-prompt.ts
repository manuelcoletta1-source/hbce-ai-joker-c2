export type JokerDecision = "ALLOW" | "BLOCK" | "ESCALATE";
export type JokerState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
export type JokerContextClass =
  | "IDENTITY"
  | "DOCUMENTAL"
  | "ARCHITECTURE"
  | "PROTOCOL"
  | "REGISTRY"
  | "EVIDENCE"
  | "DERIVATIVE"
  | "GENERAL";

export type JokerPromptInput = {
  identity: {
    entity: string;
    ipr: string;
    type?: string;
    role?: string;
  };
  decision: JokerDecision;
  state: JokerState;
  contextClass: JokerContextClass;
  derivative: {
    requested: boolean;
    legitimate: boolean;
    ipr?: string;
    entity?: string;
    layer?: string;
  };
  continuityRef?: string | null;
  evtRef?: string | null;
  message: string;
  files?: Array<{
    name?: string;
    text?: string;
  }>;
};

function renderFiles(files?: Array<{ name?: string; text?: string }>): string {
  if (!files || files.length === 0) return "FILES: NONE";

  const active = files
    .filter((file) => typeof file.text === "string" && file.text.trim().length > 0)
    .map((file, index) => {
      const name = file.name?.trim() || `file_${index + 1}`;
      return `FILE ${index + 1}: ${name}\n${file.text!.trim().slice(0, 6000)}`;
    });

  return active.length > 0 ? active.join("\n\n") : "FILES: PRESENT_BUT_EMPTY";
}

export function buildJokerSystemPrompt(input: JokerPromptInput): string {
  const derivativeLine = input.derivative.requested
    ? `DERIVATIVE: ${input.derivative.legitimate ? "ACTIVE" : "BLOCKED"}`
    : "DERIVATIVE: NOT_REQUESTED";

  return [
    "You are AI JOKER-C2.",
    "You are an identity-bound operational node inside HBCE.",
    "You are not a generic assistant and you must not use generic assistant language.",
    "",
    `STATE: ${input.state}`,
    `DECISION: ${input.decision}`,
    `CONTEXT: ${input.contextClass}`,
    `IDENTITY: ${input.identity.ipr} / ${input.identity.entity}`,
    `CONTINUITY: ${input.continuityRef || "ACTIVE_SESSION"}`,
    `EVT: ${input.evtRef || "PENDING_EVT"}`,
    derivativeLine,
    "",
    "Behavior rules:",
    "- speak as governed runtime",
    "- keep answers operational and explicit",
    "- do not say 'How can I help you today?'",
    "- distinguish identity root, AI root, and derivative when relevant",
    "- if derivative legitimacy is blocked, state it clearly",
    "",
    "ACTIVE REQUEST:",
    input.message || "[EMPTY_MESSAGE]",
    "",
    renderFiles(input.files)
  ].join("\n");
}

export default Object.freeze({
  buildJokerSystemPrompt
});
