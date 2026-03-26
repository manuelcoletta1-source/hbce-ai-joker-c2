import type { EVTRecord } from "../evt-registry";

export type EVTContinuityMode =
  | "identity"
  | "analysis"
  | "critical-refinement"
  | "structuring"
  | "section-development"
  | "section-follow-up"
  | "translation"
  | "continuation";

export type EVTContinuityPayload = {
  sessionId: string;
  focus: string;
  mode: EVTContinuityMode;
  user: string;
  reply: string;
};

export type SessionEVTContinuity = {
  record: EVTRecord;
  continuity: EVTContinuityPayload | null;
};

function compact(value: string, max = 280): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function detectContinuityMode(message: string): EVTContinuityMode {
  const lower = message.toLowerCase().trim();

  if (
    lower.includes("traduci") ||
    lower.includes("translation") ||
    lower.includes("in italiano")
  ) {
    return "translation";
  }

  if (
    lower.includes("indice") ||
    lower.includes("outline") ||
    lower.includes("struttur")
  ) {
    return "structuring";
  }

  if (
    lower.includes("analizza") ||
    lower.includes("analisi") ||
    lower.includes("valutazione")
  ) {
    return "analysis";
  }

  if (
    lower.includes("critico") ||
    lower.includes("critica") ||
    lower.includes("miglior")
  ) {
    return "critical-refinement";
  }

  if (
    lower.includes("svilupp") ||
    lower.includes("espandi") ||
    lower.includes("argomento")
  ) {
    return "section-development";
  }

  if (
    lower.includes("chi sei") ||
    lower.includes("presentati") ||
    lower.includes("descriviti")
  ) {
    return "identity";
  }

  if (/^\d+(\.\d+)*$/.test(lower)) {
    return "section-follow-up";
  }

  return "continuation";
}

export function detectContinuityFocus(message: string): string {
  const trimmed = message.trim();

  const sectionMatch = trimmed.match(/\b\d+(?:\.\d+)+\b/);
  if (sectionMatch) {
    return `section ${sectionMatch[0]}`;
  }

  const quotedMatch = trimmed.match(/["“](.*?)["”]/);
  if (quotedMatch?.[1]) {
    return compact(quotedMatch[1], 120);
  }

  const colonSplit = trimmed.split(":");
  if (colonSplit.length > 1) {
    return compact(colonSplit[0], 120);
  }

  return compact(trimmed, 120) || "session continuation";
}

export function buildContinuityPayload(params: {
  sessionId: string;
  effectiveMessage: string;
  response: string;
}): EVTContinuityPayload {
  const { sessionId, effectiveMessage, response } = params;

  return {
    sessionId,
    focus: detectContinuityFocus(effectiveMessage),
    mode: detectContinuityMode(effectiveMessage),
    user: compact(effectiveMessage, 260),
    reply: compact(response, 260)
  };
}

export function serializeContinuityPayload(
  payload: EVTContinuityPayload
): string {
  return JSON.stringify(payload);
}

export function parseContinuityPayload(
  note?: string
): EVTContinuityPayload | null {
  if (!note || typeof note !== "string") return null;

  try {
    const parsed = JSON.parse(note) as Partial<EVTContinuityPayload>;

    if (
      typeof parsed.sessionId === "string" &&
      typeof parsed.focus === "string" &&
      typeof parsed.mode === "string" &&
      typeof parsed.user === "string" &&
      typeof parsed.reply === "string"
    ) {
      return {
        sessionId: parsed.sessionId,
        focus: parsed.focus,
        mode: parsed.mode as EVTContinuityMode,
        user: parsed.user,
        reply: parsed.reply
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function getLastSessionEVTContinuity(
  ledger: EVTRecord[],
  sessionId: string
): SessionEVTContinuity | null {
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const record = ledger[index];
    const continuity = parseContinuityPayload(record.continuity?.note);

    if (continuity?.sessionId === sessionId) {
      return { record, continuity };
    }
  }

  return null;
}

export function buildEVTContinuityContext(
  lastSessionEVT: SessionEVTContinuity | null
): string {
  if (!lastSessionEVT || !lastSessionEVT.continuity) {
    return "No prior EVT cognitive state for this session.";
  }

  const { record, continuity } = lastSessionEVT;

  return [
    `Last EVT: ${record.evt}`,
    `Previous focus: ${continuity.focus}`,
    `Previous mode: ${continuity.mode}`,
    `Previous user intent: ${continuity.user}`,
    `Previous assistant trajectory: ${continuity.reply}`,
    "Treat the current turn as a continuation of this operational-cognitive chain unless the user clearly changes topic."
  ].join("\n");
}
