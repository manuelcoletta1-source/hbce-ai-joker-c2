import type { EVTRecord } from "../evt-registry";

export type JokerIdentityState = {
  biologicalName?: string;
  biologicalIPR?: string;
  cyberneticName: string;
  cyberneticIPR: string;
};

export type JokerWorkState = {
  activeProject?: string;
  activeDocument?: string;
  activeSection?: string;
  activeFocus?: string;
  activeIndex?: string[];
};

export type JokerSessionState = {
  sessionId: string;
  identity: JokerIdentityState;
  work: JokerWorkState;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastEVT?: string;
  continuityStatus: "EMPTY" | "ACTIVE" | "BROKEN";
  updatedAt: string;
};

export type JokerEVTPayload = {
  sessionId: string;
  state: JokerSessionState;
};

export type JokerStateTransitionInput = {
  sessionId: string;
  userMessage: string;
  assistantMessage?: string;
  previousState?: JokerSessionState | null;
};

export type JokerEVTContext = {
  previous: JokerSessionState | null;
  current: JokerSessionState;
};

declare global {
  // eslint-disable-next-line no-var
  var __JOKER_EVT_STATE_STORE__:
    | Map<string, JokerSessionState>
    | undefined;
}

const DEFAULT_CYBERNETIC_NAME = "JOKER-C2";
const DEFAULT_CYBERNETIC_IPR = "IPR-CIBERNETICO";

function nowISO(): string {
  return new Date().toISOString();
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lower(value: string): string {
  return clean(value).toLowerCase();
}

function cloneState(state: JokerSessionState): JokerSessionState {
  return JSON.parse(JSON.stringify(state)) as JokerSessionState;
}

function normalizeSection(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\b\d+(?:\.\d+)+\b/);
  return match?.[0];
}

function extractQuoted(raw: string): string | undefined {
  const match = raw.match(/["“](.*?)["”]/);
  return match?.[1] ? clean(match[1]) : undefined;
}

function startsLikeIndexLine(line: string): boolean {
  const value = clean(line).toLowerCase();

  return (
    /^\d+(\.\d+)?\s+/.test(value) ||
    value.startsWith("parte ") ||
    value.startsWith("capitolo ")
  );
}

function extractBiologicalIdentity(message: string): Partial<JokerIdentityState> {
  const value = lower(message);
  const result: Partial<JokerIdentityState> = {};

  const biologicalNames = [
    "io sono manuel",
    "sono manuel",
    "mi chiamo manuel",
    "io manuel"
  ];

  if (biologicalNames.some((pattern) => value.includes(pattern))) {
    result.biologicalName = "Manuel";
  }

  if (value.includes("ipr-biologico")) {
    result.biologicalIPR = "IPR-BIOLOGICO";
  }

  return result;
}

function extractCyberneticIdentity(
  message: string
): Partial<JokerIdentityState> {
  const value = lower(message);
  const result: Partial<JokerIdentityState> = {};

  if (value.includes("joker-c2")) {
    result.cyberneticName = DEFAULT_CYBERNETIC_NAME;
  }

  if (value.includes("ipr-cibernetico")) {
    result.cyberneticIPR = DEFAULT_CYBERNETIC_IPR;
  }

  return result;
}

function extractActiveProject(message: string): string | undefined {
  const value = lower(message);

  if (value.includes("matrix europa")) return "MATRIX EUROPA";
  if (value.includes("matrix hbce")) return "MATRIX HBCE";
  if (value.includes("matrix torino")) return "MATRIX TORINO–BRUXELLES";
  if (value.includes("matrix piemonte")) return "MATRIX PIEMONTE–ITALIA";
  if (value.includes("matrix italia")) return "MATRIX ITALIA–EUROPA";
  if (value.includes("corpus esoterologia ermetica")) {
    return "CORPUS ESOTEROLOGIA ERMETICA";
  }

  return undefined;
}

function extractActiveDocument(message: string): string | undefined {
  const quoted = extractQuoted(message);
  if (quoted) return quoted;

  const value = lower(message);

  if (value.includes("primo volume")) return "VOLUME I";
  if (value.includes("secondo volume")) return "VOLUME II";
  if (value.includes("terzo volume")) return "VOLUME III";
  if (value.includes("quarto volume")) return "VOLUME IV";
  if (value.includes("quinto volume")) return "VOLUME V";

  if (value.includes("volume i")) return "VOLUME I";
  if (value.includes("volume ii")) return "VOLUME II";
  if (value.includes("volume iii")) return "VOLUME III";
  if (value.includes("volume iv")) return "VOLUME IV";
  if (value.includes("volume v")) return "VOLUME V";

  return undefined;
}

function extractActiveFocus(message: string): string | undefined {
  const cleaned = clean(message);
  const value = lower(cleaned);
  const section = normalizeSection(cleaned);

  if (section) return `section ${section}`;
  if (value === "indice") return "indice";
  if (value.includes("strutturiamo")) return "struttura";
  if (value.includes("analizza")) return "analisi critica";
  if (value.includes("sviluppa")) return "sviluppo";
  if (value.includes("continua")) return "continuazione";
  if (value.includes("horizon")) return "progetto horizon";
  if (value.includes("energia")) return "energia";

  const quoted = extractQuoted(cleaned);
  if (quoted) return quoted;

  return undefined;
}

function inferIndexMutation(message: string, previousIndex: string[] = []): string[] {
  const lines = message
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter(Boolean);

  const detected = lines.filter(startsLikeIndexLine);

  return detected.length > 0 ? detected : previousIndex;
}

function shouldResetIndex(message: string): boolean {
  const value = lower(message);

  return (
    value.includes("nuovo indice") ||
    value.includes("rifacciamo l'indice") ||
    value.includes("rifattorizziamo l'indice") ||
    value.includes("indice rifattorizzato")
  );
}

function shouldPreservePreviousSection(message: string): boolean {
  const value = lower(message);

  return (
    value === "continua" ||
    value === "vai" ||
    value === "sviluppa" ||
    value === "approfondisci"
  );
}

function deriveWorkState(
  message: string,
  previousWork: JokerWorkState
): JokerWorkState {
  const next: JokerWorkState = { ...previousWork };

  const activeProject = extractActiveProject(message);
  const activeDocument = extractActiveDocument(message);
  const activeSection = normalizeSection(message);
  const activeFocus = extractActiveFocus(message);

  if (activeProject) {
    next.activeProject = activeProject;
  }

  if (activeDocument) {
    next.activeDocument = activeDocument;
  }

  if (activeSection) {
    next.activeSection = activeSection;
    next.activeFocus = `section ${activeSection}`;
  } else if (shouldPreservePreviousSection(message) && previousWork.activeSection) {
    next.activeSection = previousWork.activeSection;
  }

  if (activeFocus && !activeSection) {
    next.activeFocus = activeFocus;
  }

  if (shouldResetIndex(message)) {
    next.activeIndex = inferIndexMutation(message, []);
  } else {
    next.activeIndex = inferIndexMutation(message, previousWork.activeIndex || []);
  }

  return next;
}

export function getJokerStateStore(): Map<string, JokerSessionState> {
  if (!globalThis.__JOKER_EVT_STATE_STORE__) {
    globalThis.__JOKER_EVT_STATE_STORE__ = new Map();
  }

  return globalThis.__JOKER_EVT_STATE_STORE__;
}

export function getJokerSessionState(
  sessionId: string
): JokerSessionState | null {
  const store = getJokerStateStore();
  return store.get(sessionId) || null;
}

export function buildDefaultJokerState(sessionId: string): JokerSessionState {
  return {
    sessionId,
    identity: {
      cyberneticName: DEFAULT_CYBERNETIC_NAME,
      cyberneticIPR: DEFAULT_CYBERNETIC_IPR
    },
    work: {},
    continuityStatus: "EMPTY",
    updatedAt: nowISO()
  };
}

export function evolveJokerState(
  input: JokerStateTransitionInput
): JokerEVTContext {
  const previous =
    input.previousState || getJokerSessionState(input.sessionId) || null;

  const base = previous
    ? cloneState(previous)
    : buildDefaultJokerState(input.sessionId);

  const biological = extractBiologicalIdentity(input.userMessage);
  const cybernetic = extractCyberneticIdentity(input.userMessage);

  base.identity = {
    ...base.identity,
    ...biological,
    ...cybernetic,
    cyberneticName: base.identity.cyberneticName || DEFAULT_CYBERNETIC_NAME,
    cyberneticIPR: base.identity.cyberneticIPR || DEFAULT_CYBERNETIC_IPR
  };

  base.work = deriveWorkState(input.userMessage, base.work);
  base.lastUserMessage = clean(input.userMessage);

  if (input.assistantMessage) {
    base.lastAssistantMessage = clean(input.assistantMessage);
  }

  base.continuityStatus = previous ? "ACTIVE" : "EMPTY";
  base.updatedAt = nowISO();

  return {
    previous,
    current: base
  };
}

export function persistJokerState(
  state: JokerSessionState
): JokerSessionState {
  const store = getJokerStateStore();
  store.set(state.sessionId, state);
  return state;
}

export function attachEVTToState(
  state: JokerSessionState,
  evtId: string
): JokerSessionState {
  const next: JokerSessionState = {
    ...state,
    lastEVT: evtId,
    continuityStatus: "ACTIVE",
    updatedAt: nowISO()
  };

  persistJokerState(next);
  return next;
}

export function markJokerStateBroken(
  sessionId: string,
  previousState?: JokerSessionState | null
): JokerSessionState {
  const current = previousState
    ? cloneState(previousState)
    : buildDefaultJokerState(sessionId);

  current.continuityStatus = "BROKEN";
  current.updatedAt = nowISO();

  persistJokerState(current);
  return current;
}

export function buildJokerStatePromptBlock(
  context: JokerEVTContext
): string {
  const { current, previous } = context;

  const lines = [
    "CURRENT JOKER STATE:",
    `sessionId: ${current.sessionId}`,
    `biologicalName: ${current.identity.biologicalName || "-"}`,
    `biologicalIPR: ${current.identity.biologicalIPR || "-"}`,
    `cyberneticName: ${current.identity.cyberneticName}`,
    `cyberneticIPR: ${current.identity.cyberneticIPR}`,
    `activeProject: ${current.work.activeProject || "-"}`,
    `activeDocument: ${current.work.activeDocument || "-"}`,
    `activeSection: ${current.work.activeSection || "-"}`,
    `activeFocus: ${current.work.activeFocus || "-"}`,
    `lastEVT: ${current.lastEVT || "-"}`,
    `continuityStatus: ${current.continuityStatus}`,
    `updatedAt: ${current.updatedAt}`,
    "",
    "STATE RULES:",
    "- If biologicalName is known, never deny it.",
    "- If biologicalIPR is known, preserve it and treat it as bound identity context.",
    "- If activeProject exists, remain inside that project unless the user explicitly changes project.",
    "- If activeDocument exists, preserve the current editorial object.",
    "- If activeSection exists, continue that section unless the user explicitly changes section.",
    "- If activeIndex exists, section numbering must follow the editorial index, not internal runtime labels.",
    "- If continuityStatus is BROKEN, prefer reconstruction over generic response."
  ];

  if (current.work.activeIndex && current.work.activeIndex.length > 0) {
    lines.push("", "ACTIVE EDITORIAL INDEX:");
    current.work.activeIndex.forEach((entry, index) => {
      lines.push(`${index + 1}. ${entry}`);
    });
  }

  if (previous) {
    lines.push(
      "",
      "PREVIOUS JOKER STATE:",
      `previousActiveProject: ${previous.work.activeProject || "-"}`,
      `previousActiveDocument: ${previous.work.activeDocument || "-"}`,
      `previousActiveSection: ${previous.work.activeSection || "-"}`,
      `previousActiveFocus: ${previous.work.activeFocus || "-"}`,
      `previousLastEVT: ${previous.lastEVT || "-"}`
    );
  }

  return lines.join("\n");
}

export function serializeJokerEVTPayload(
  payload: JokerEVTPayload
): string {
  return JSON.stringify(payload);
}

export function parseJokerEVTPayload(note?: string): JokerEVTPayload | null {
  if (!note || typeof note !== "string") return null;

  try {
    const parsed = JSON.parse(note) as Partial<JokerEVTPayload>;

    if (
      typeof parsed.sessionId === "string" &&
      parsed.state &&
      typeof parsed.state === "object"
    ) {
      return {
        sessionId: parsed.sessionId,
        state: parsed.state as JokerSessionState
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function recoverStateFromEVTLedger(
  ledger: EVTRecord[],
  sessionId: string
): JokerSessionState | null {
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const record = ledger[index];
    const payload = parseJokerEVTPayload(record.continuity?.note);

    if (payload?.sessionId === sessionId) {
      return payload.state;
    }
  }

  return null;
}

export function validateRecoveredContinuity(
  recoveredState: JokerSessionState | null,
  expectedSessionId: string
): JokerSessionState | null {
  if (!recoveredState) return null;
  if (recoveredState.sessionId !== expectedSessionId) return null;

  return recoveredState;
}
