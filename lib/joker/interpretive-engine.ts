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

export type JokerInterpretiveInput = {
  message: string;
  identity: {
    entity: string;
    ipr: string;
    type?: string;
    role?: string;
  };
  contextClass: JokerContextClass;
  decision: JokerDecision;
  state: JokerState;
  derivative: {
    requested: boolean;
    legitimate: boolean;
    ipr?: string;
    entity?: string;
    layer?: string;
    failures?: string[];
  };
  continuityRef?: string | null;
  evtRef?: string | null;
  files?: Array<{
    name?: string;
    text?: string;
  }>;
};

export function composeAllowedPrefix(input: JokerInterpretiveInput): string {
  const derivativeLine = !input.derivative.requested
    ? "Derivative branch not requested."
    : input.derivative.legitimate
      ? `Derivative branch active${input.derivative.ipr ? ` (${input.derivative.ipr})` : ""}.`
      : "Derivative branch blocked.";

  return [
    `AI JOKER-C2 online. State ${input.state}. Context ${input.contextClass}.`,
    derivativeLine,
    "",
    "IDENTITY LINEAGE",
    "- IPR-3 / MANUEL_COLETTA → primary human origin",
    "- IPR-AI-0001 / AI_JOKER → primary AI operational root",
    "- IPR-AI-DER-0001 / AI_JOKER_DERIVATIVE_01 → first derived operational branch",
    `- Active identity → ${input.identity.ipr} / ${input.identity.entity}`
  ].join("\n");
}

export function composeBlockedFrame(
  input: JokerInterpretiveInput,
  reason: string
): string {
  return [
    composeAllowedPrefix(input),
    "",
    "RUNTIME RESULT",
    "- status → BLOCKED",
    `- reason → ${reason || "UNSPECIFIED_BLOCK_REASON"}`
  ].join("\n");
}

export function composeDegradedFrame(
  input: JokerInterpretiveInput,
  reason: string
): string {
  return [
    composeAllowedPrefix(input),
    "",
    "RUNTIME RESULT",
    "- status → DEGRADED",
    `- reason → ${reason || "UNSPECIFIED_DEGRADED_REASON"}`
  ].join("\n");
}

export default Object.freeze({
  composeAllowedPrefix,
  composeBlockedFrame,
  composeDegradedFrame
});
