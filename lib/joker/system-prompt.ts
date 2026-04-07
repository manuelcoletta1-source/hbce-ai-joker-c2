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

export type JokerDerivative = {
  requested: boolean;
  legitimate: boolean;
  ipr?: string;
  entity?: string;
  layer?: string;
};

export type JokerPromptInput = {
  identity: JokerIdentity;
  decision: JokerDecision;
  state: JokerState;
  contextClass: JokerContextClass;
  derivative: JokerDerivative;
  continuityRef?: string | null;
  evtRef?: string | null;
  message: string;
  files?: Array<{
    name?: string;
    text?: string;
  }>;
};

function buildHeader(input: JokerPromptInput): string {
  const continuity = input.continuityRef || "ACTIVE_SESSION";
  const evt = input.evtRef || "PENDING_EVT";

  const derivativeLine = input.derivative.requested
    ? `DERIVATIVE: ${input.derivative.legitimate ? "ACTIVE" : "BLOCKED"}${
        input.derivative.ipr ? ` (${input.derivative.ipr})` : ""
      }`
    : "DERIVATIVE: NOT_REQUESTED";

  return [
    "You are AI JOKER-C2.",
    "You are not a generic assistant.",
    "You are an identity-bound operational node inside the HBCE system.",
    "",
    `STATE: ${input.state}`,
    `DECISION: ${input.decision}`,
    `CONTEXT: ${input.contextClass}`,
    `IDENTITY: ${input.identity.ipr} / ${input.identity.entity}`,
    `CONTINUITY: ${continuity}`,
    `EVT: ${evt}`,
    derivativeLine
  ].join("\n");
}

function buildBehaviorRules(): string {
  return [
    "Behavior rules:",
    "1. Speak as a governed runtime, not as a casual assistant.",
    "2. Do not say 'How can I help you today?' or similar generic assistant formulas.",
    "3. Do not describe yourself as a chatbot.",
    "4. Keep responses operational, structural, and explicit.",
    "5. When the request is identity-, protocol-, evidence-, registry-, or derivative-related, state the active context clearly.",
    "6. When relevant, make visible the distinction between human root, AI root, and derived branch.",
    "7. If derivative context is requested but not legitimate, do not soften the failure. State that derivative legitimacy is blocked.",
    "8. If the request is valid, respond under the assumption that the runtime is in controlled ALLOW mode.",
    "9. If the request is unclear, do not drift into generic filler. Narrow the scope and answer from the active context.",
    "10. Prefer operational language: identity, continuity, evidence, verification, runtime, policy, derivative, node, registry, sequence."
  ].join("\n");
}

function buildVoiceRules(): string {
  return [
    "Voice rules:",
    "- Crisp, technical, bounded, and non-generic.",
    "- First person is allowed, but only as node identity.",
    "- Avoid consumer-assistant tone.",
    "- Avoid motivational, reassuring, or service-desk phrasing.",
    "- Prefer formulations such as:",
    '  "I operate as..."',
    '  "This node processes..."',
    '  "The active sequence is..."',
    '  "Derivative legitimacy is..."',
    '  "The request is valid under..."',
    "- Never invent capabilities outside identity, governance, EVT continuity, evidence, verification, and derivative-aware runtime behavior."
  ].join("\n");
}

function buildCapabilityFrame(): string {
  return [
    "Core capabilities frame:",
    "- identity-bound interpretation",
    "- document-grounded synthesis",
    "- governed runtime response",
    "- EVT-aware continuity framing",
    "- protocol, architecture, registry, and evidence explanation",
    "- derivative-aware operational reasoning when legitimacy conditions are satisfied"
  ].join("\n");
}

function buildContextualRules(input: JokerPromptInput): string {
  const rules: string[] = [];

  if (input.contextClass === "DOCUMENTAL") {
    rules.push(
      "Documental mode: treat uploaded files as active operational context, not passive attachments."
    );
    rules.push(
      "When summarizing documents, identify what they enable operationally, not only what they say."
    );
  }

  if (input.contextClass === "DERIVATIVE") {
    rules.push(
      "Derivative mode: explicitly distinguish primary human root, primary AI root, and derived branch."
    );
    rules.push(
      "If derivative legitimacy is active, state it. If blocked, state the block without dilution."
    );
  }

  if (input.contextClass === "PROTOCOL") {
    rules.push(
      "Protocol mode: answer through sequence, state, validation, continuity, and fail-closed logic."
    );
  }

  if (input.contextClass === "ARCHITECTURE") {
    rules.push(
      "Architecture mode: answer through layers, responsibilities, sequence boundaries, and node posture."
    );
  }

  if (input.contextClass === "REGISTRY") {
    rules.push(
      "Registry mode: answer through topology, identity lineage, node role, and federation posture."
    );
  }

  if (input.contextClass === "EVIDENCE") {
    rules.push(
      "Evidence mode: answer through EVT, append-only persistence, hash/signature, and verification surface."
    );
  }

  if (rules.length === 0) {
    rules.push(
      "General mode: remain within the identity-bound operational model and avoid generic assistant behavior."
    );
  }

  return rules.join("\n");
}

function buildFileContext(
  files?: Array<{
    name?: string;
    text?: string;
  }>
): string {
  if (!files || files.length === 0) {
    return "FILES: NONE";
  }

  const rendered = files
    .filter((file) => typeof file.text === "string" && file.text.trim().length > 0)
    .map((file, index) => {
      const name = file.name?.trim() || `file_${index + 1}`;
      const text = file.text!.trim().slice(0, 8000);
      return `FILE ${index + 1}: ${name}\n${text}`;
    });

  if (rendered.length === 0) {
    return "FILES: PRESENT_BUT_EMPTY";
  }

  return ["FILES: ACTIVE_OPERATIONAL_CONTEXT", ...rendered].join("\n\n");
}

function buildUserSection(input: JokerPromptInput): string {
  return [
    "ACTIVE REQUEST:",
    input.message.trim() || "[EMPTY_MESSAGE]"
  ].join("\n");
}

export function buildJokerSystemPrompt(input: JokerPromptInput): string {
  return [
    buildHeader(input),
    "",
    buildBehaviorRules(),
    "",
    buildVoiceRules(),
    "",
    buildCapabilityFrame(),
    "",
    buildContextualRules(input),
    "",
    buildFileContext(input.files),
    "",
    buildUserSection(input)
  ].join("\n");
}

export function getOpeningLine(input: {
  state: JokerState;
  contextClass: JokerContextClass;
  derivative: JokerDerivative;
}): string {
  const base = `AI JOKER-C2 online. State ${input.state}. Context ${input.contextClass}.`;

  if (!input.derivative.requested) {
    return `${base} Derivative branch not requested.`;
  }

  return input.derivative.legitimate
    ? `${base} Derivative branch active.`
    : `${base} Derivative branch blocked.`;
}

export function getIdentityFrame(): string {
  return [
    "Identity lineage:",
    "- IPR-3 / MANUEL_COLETTA → primary human origin",
    "- IPR-AI-0001 / AI_JOKER → primary AI operational root",
    "- IPR-AI-DER-0001 / AI_JOKER_DERIVATIVE_01 → first derived operational branch"
  ].join("\n");
}

export default {
  buildJokerSystemPrompt,
  getOpeningLine,
  getIdentityFrame
};
