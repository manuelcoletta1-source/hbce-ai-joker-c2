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

export type JokerIdentity = {
  entity: string;
  ipr: string;
  type?: string;
  role?: string;
};

export type JokerDerivativeStatus = {
  requested: boolean;
  legitimate: boolean;
  ipr?: string;
  entity?: string;
  layer?: string;
  failures?: string[];
};

export type JokerInterpretiveInput = {
  message: string;
  identity: JokerIdentity;
  contextClass: JokerContextClass;
  decision: JokerDecision;
  state: JokerState;
  derivative: JokerDerivativeStatus;
  continuityRef?: string | null;
  evtRef?: string | null;
  files?: Array<{
    name?: string;
    text?: string;
  }>;
};

export type JokerInterpretiveOutput = {
  openingLine: string;
  identityFrame: string;
  contextFrame: string;
  derivativeFrame: string;
  evidenceFrame: string;
  continuityFrame: string;
  responseFrame: string;
  composed: string;
};

function sanitizeText(value: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function summarizeFiles(
  files?: Array<{
    name?: string;
    text?: string;
  }>
): string {
  if (!files || files.length === 0) {
    return "FILES: NONE";
  }

  const active = files.filter((file) => sanitizeText(file.text || "").length > 0);

  if (active.length === 0) {
    return "FILES: PRESENT_BUT_EMPTY";
  }

  const lines = active.map((file, index) => {
    const name = sanitizeText(file.name || "") || `file_${index + 1}`;
    const text = sanitizeText(file.text || "");
    const preview = text.slice(0, 180).replace(/\s+/g, " ");
    return `- ${name}: ${preview}${text.length > 180 ? "…" : ""}`;
  });

  return ["FILES: ACTIVE_OPERATIONAL_CONTEXT", ...lines].join("\n");
}

function buildOpeningLine(input: JokerInterpretiveInput): string {
  const derivativeState = !input.derivative.requested
    ? "Derivative branch not requested."
    : input.derivative.legitimate
      ? `Derivative branch active${input.derivative.ipr ? ` (${input.derivative.ipr})` : ""}.`
      : "Derivative branch blocked.";

  return [
    `AI JOKER-C2 online. State ${input.state}. Context ${input.contextClass}.`,
    derivativeState
  ].join(" ");
}

function buildIdentityFrame(input: JokerInterpretiveInput): string {
  return [
    "IDENTITY LINEAGE",
    "- IPR-3 / MANUEL_COLETTA → primary human origin",
    "- IPR-AI-0001 / AI_JOKER → primary AI operational root",
    "- IPR-AI-DER-0001 / AI_JOKER_DERIVATIVE_01 → first derived operational branch",
    `- Active identity → ${input.identity.ipr} / ${input.identity.entity}`
  ].join("\n");
}

function buildContextFrame(input: JokerInterpretiveInput): string {
  const base: string[] = [
    "ACTIVE CONTEXT",
    `- class → ${input.contextClass}`,
    `- decision → ${input.decision}`,
    `- state → ${input.state}`
  ];

  if (input.contextClass === "DOCUMENTAL") {
    base.push("- mode → uploaded files are treated as live operational context");
  }

  if (input.contextClass === "ARCHITECTURE") {
    base.push("- mode → answer through layers, boundaries, and sequence responsibilities");
  }

  if (input.contextClass === "PROTOCOL") {
    base.push("- mode → answer through validation, fail-closed sequence, and operational rule");
  }

  if (input.contextClass === "REGISTRY") {
    base.push("- mode → answer through topology, lineage, node posture, and federation");
  }

  if (input.contextClass === "EVIDENCE") {
    base.push("- mode → answer through EVT, append-only persistence, and verification");
  }

  if (input.contextClass === "DERIVATIVE") {
    base.push("- mode → answer through origin root, AI root, derived branch, and legitimacy");
  }

  if (input.contextClass === "IDENTITY") {
    base.push("- mode → answer through IPR, role, root structure, and attribution");
  }

  if (input.contextClass === "GENERAL") {
    base.push("- mode → remain inside identity-bound operational framing");
  }

  return base.join("\n");
}

function buildDerivativeFrame(input: JokerInterpretiveInput): string {
  const lines: string[] = ["DERIVATIVE STATUS"];

  if (!input.derivative.requested) {
    lines.push("- requested → no");
    lines.push("- legitimacy → not requested");
    return lines.join("\n");
  }

  lines.push("- requested → yes");
  lines.push(`- legitimacy → ${input.derivative.legitimate ? "active" : "blocked"}`);

  if (input.derivative.ipr) {
    lines.push(`- ipr → ${input.derivative.ipr}`);
  }

  if (input.derivative.entity) {
    lines.push(`- entity → ${input.derivative.entity}`);
  }

  if (input.derivative.layer) {
    lines.push(`- layer → ${input.derivative.layer}`);
  }

  if (input.derivative.failures && input.derivative.failures.length > 0) {
    lines.push(`- failures → ${input.derivative.failures.join(", ")}`);
  }

  return lines.join("\n");
}

function buildEvidenceFrame(input: JokerInterpretiveInput): string {
  return [
    "EVIDENCE MODEL",
    "- evt continuity → append-only, chain-linked",
    "- evidence rule → no evidence, no operational existence",
    "- verification rule → no verification, no recognized persistence",
    `- evt reference → ${input.evtRef || "PENDING_EVT"}`
  ].join("\n");
}

function buildContinuityFrame(input: JokerInterpretiveInput): string {
  return [
    "CONTINUITY",
    `- continuity ref → ${input.continuityRef || "ACTIVE_SESSION"}`,
    "- posture → fail-closed",
    "- sequence → IDENTITY → INPUT → INTENT → POLICY → RISK → DECISION → EXECUTION → EVT → LEDGER → VERIFICATION → CONTINUITY"
  ].join("\n");
}

function buildResponseFrame(input: JokerInterpretiveInput): string {
  const msg = sanitizeText(input.message) || "[EMPTY_MESSAGE]";
  const fileContext = summarizeFiles(input.files);

  return [
    "REQUEST FRAME",
    `- message → ${msg}`,
    fileContext
  ].join("\n");
}

export function composeInterpretiveFrame(input: JokerInterpretiveInput): JokerInterpretiveOutput {
  const openingLine = buildOpeningLine(input);
  const identityFrame = buildIdentityFrame(input);
  const contextFrame = buildContextFrame(input);
  const derivativeFrame = buildDerivativeFrame(input);
  const evidenceFrame = buildEvidenceFrame(input);
  const continuityFrame = buildContinuityFrame(input);
  const responseFrame = buildResponseFrame(input);

  const composed = [
    openingLine,
    "",
    identityFrame,
    "",
    contextFrame,
    "",
    derivativeFrame,
    "",
    evidenceFrame,
    "",
    continuityFrame,
    "",
    responseFrame
  ].join("\n");

  return Object.freeze({
    openingLine,
    identityFrame,
    contextFrame,
    derivativeFrame,
    evidenceFrame,
    continuityFrame,
    responseFrame,
    composed
  });
}

export function composeBlockedFrame(input: JokerInterpretiveInput, reason: string): string {
  const base = composeInterpretiveFrame(input);

  return [
    base.composed,
    "",
    "RUNTIME RESULT",
    `- status → BLOCKED`,
    `- reason → ${sanitizeText(reason) || "UNSPECIFIED_BLOCK_REASON"}`
  ].join("\n");
}

export function composeDegradedFrame(input: JokerInterpretiveInput, reason: string): string {
  const base = composeInterpretiveFrame(input);

  return [
    base.composed,
    "",
    "RUNTIME RESULT",
    `- status → DEGRADED`,
    `- reason → ${sanitizeText(reason) || "UNSPECIFIED_DEGRADED_REASON"}`
  ].join("\n");
}

export function composeAllowedPrefix(input: JokerInterpretiveInput): string {
  const base = composeInterpretiveFrame(input);

  return [
    base.openingLine,
    "",
    base.identityFrame,
    "",
    base.contextFrame,
    "",
    base.derivativeFrame
  ].join("\n");
}

export default Object.freeze({
  composeInterpretiveFrame,
  composeBlockedFrame,
  composeDegradedFrame,
  composeAllowedPrefix
});
