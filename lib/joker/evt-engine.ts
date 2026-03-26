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
  activeIndex?: string[];
  activeFocus?: string;
};

export type JokerSessionState = {
  sessionId: string;
  identity: JokerIdentityState;
  work: JokerWorkState;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastEVT?: string;
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
  current: JokerSessionState;
  previous: JokerSessionState | null;
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

function normalizeSection(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\b\d+(?:\.\d+)+\b/);
  return match?.[0];
}

function extractQuoted(raw: string): string | undefined {
  const match = raw.match(/["“](.*?)["”]/);
  return match?.[1] ? clean(match[1]) : undefined;
}

function extractBiologicalIdentity(message: string): Partial<JokerIdentityState> {
  const lower = message.toLowerCase();

  const result: Partial<JokerIdentityState> = {};

  const manuelPatterns = [
    "io sono manuel",
    "sono manuel",
    "mi chiamo manuel",
    "io manuel"
  ];

  if (manuelPatterns.some((pattern) => lower.includes(pattern))) {
    result.biologicalName = "Manuel";
  }

  if (lower.includes("ipr-biologico")) {
    result.biologicalIPR = "IPR-BIOLOGICO";
  }

  return result;
}

function extractCyberneticIdentity(
  message: string
): Partial<JokerIdentityState> {
  const lower = message.toLowerCase();
  const result: Partial<JokerIdentityState> = {};

  if (lower.includes("joker-c2")) {
    result.cyberneticName = "JOKER-C2";
  }

  if (lower.includes("ipr-cibernetico")) {
    result.cyberneticIPR = "IPR-CIBERNETICO";
  }

  return result;
}

function extractActiveProject(message: string): string | undefined {
  const lower = message.toLowerCase();

  if (lower.includes("matrix europa")) return "MATRIX EUROPA";
  if (lower.includes("matrix hbce")) return "MATRIX HBCE";
  if (lower.includes("matrix torino")) return "MATRIX TORINO–BRUXELLES";
  if (lower.includes("matrix piemonte")) return "MATRIX PIEMONTE–ITALIA";
  if (lower.includes("matrix italia")) return "MATRIX ITALIA–EUROPA";

  return undefined;
}

function extractActiveDocument(message: string): string | undefined {
  const quoted = extractQuoted(message);
  if (quoted) return quoted;

  const lower = message.toLowerCase();

  if (lower.includes("primo volume")) return "VOLUME 1";
  if (lower.includes("secondo volume")) return "VOLUME 2";
  if (lower.includes("terzo volume")) return "VOLUME 3";
  if (lower.includes("quarto volume")) return "VOLUME 4";
  if (lower.includes("quinto volume")) return "VOLUME 5";

  return undefined;
}

function extractActiveFocus(message: string): string | undefined {
  const cleaned = clean(message);
  const section = normalizeSection(cleaned);

  if (section) {
    return `section ${section}`;
  }

  const quoted = extractQuoted(cleaned);
  if (quoted) return quoted;

  const lower = cleaned.toLowerCase();

  if (lower.includes("indice")) return "indice";
  if (lower.includes("strutturiamo")) return "struttura";
  if (lower.includes("analizza")) return "analisi critica";
  if (lower.includes("sviluppa")) return "sviluppo";
  if (lower.includes("continua")) return "continuazione";

  return undefined;
}

function inferIndexMutation(
  message: string,
  previousIndex: string[] = []
): string[] {
  const cleaned = clean(message);

  if (
    !cleaned.toLowerCase().includes("indice") &&
    !cleaned.toLowerCase().includes("parte ") &&
    !cleaned.match(/^\d+\./)
  ) {
    return previousIndex;
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter(Boolean);

  const detected = lines.filter(
    (line) =>
      /^\d+(\.\d+)?/.test(line) ||
      line.toLowerCase().includes("parte ") ||
      line.toLowerCase().includes("capitolo ")
  );

  return detected.length > 0 ? detected : previousIndex;
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
    updatedAt: nowISO()
  };
}

export function evolveJokerState(
  input: JokerStateTransitionInput
): JokerEVTContext {
  const previous =
    input.previousState || getJokerSessionState(input.sessionId) || null;

  const base = previous
    ? structuredClone(previous)
    : buildDefaultJokerState(input.sessionId);

  const biological = extractBiologicalIdentity(input.userMessage);
  const cybernetic = extractCyberneticIdentity(input.userMessage);
  const activeProject = extractActiveProject(input.userMessage);
  const activeDocument = extractActiveDocument(input.userMessage);
  const activeSection = normalizeSection(input.userMessage);
  const activeFocus = extractActiveFocus(input.userMessage);

  base.identity = {
    ...base.identity,
    ...biological,
    ...cybernetic,
    cyberneticName: base.identity.cyberneticName || DEFAULT_CYBERNETIC_NAME,
    cyberneticIPR: base.identity.cyberneticIPR || DEFAULT_CYBERNETIC_IPR
  };

  base.work = {
    ...base.work,
    activeProject: activeProject || base.work.activeProject,
    activeDocument: activeDocument || base.work.activeDocument,
    activeSection: activeSection || base.work.activeSection,
    activeFocus: activeFocus || base.work.activeFocus,
    activeIndex: inferIndexMutation(
      input.userMessage,
      base.work.activeIndex || []
    )
  };

  base.lastUserMessage = clean(input.userMessage);
  if (input.assistantMessage) {
    base.lastAssistantMessage = clean(input.assistantMessage);
  }

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
  const next = {
    ...state,
    lastEVT: evtId,
    updatedAt: nowISO()
  };

  persistJokerState(next);
  return next;
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
    `updatedAt: ${current.updatedAt}`,
    "",
    "STATE RULES:",
    "- If biologicalName is known, never deny it.",
    "- If biologicalIPR is known, preserve it.",
    "- If activeProject exists, stay inside it unless the user changes project.",
    "- If activeSection exists, continue that section unless the user changes section.",
    "- If activeIndex exists, section numbering must follow the editorial index, not internal runtime labels."
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
      `previousActiveFocus: ${previous.work.activeFocus || "-"}`
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
