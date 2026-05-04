import { createHash, randomUUID } from "crypto";

export type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
export type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";

export type DocumentFamily =
  | "APOKALYPSIS"
  | "CORPUS_ESOTEROLOGIA"
  | "MATRIX"
  | "HBCE_RUNTIME"
  | "GENERAL_DOCUMENT";

export type MemorySource =
  | "SESSION"
  | "IPR_CANONICAL"
  | "IPR_RECENT"
  | "NONE";

export type EvtMemoryFile = {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
};

export type EvtMemoryInput = {
  sessionId: string;
  ipr: string;
  entity: string;
  message: string;
  response: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: string;
  documentMode: string;
  documentFamily: DocumentFamily;
  files: EvtMemoryFile[];
  prevEventId?: string | null;
  governedEvt?: string | null;
  governedHash?: string | null;
};

export type EvtMemoryEvent = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  sessionId: string;
  kind: "IPR_BOUND_CHAT_MEMORY";
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: string;
  documentMode: string;
  documentFamily: DocumentFamily;
  activeDocument: string | null;
  semanticTags: string[];
  userIntent: string;
  memoryDelta: string;
  nextContext: string;
  governedEvt: string | null;
  governedHash: string | null;
  anchors: {
    inputHash: string;
    outputHash: string;
    traceHash: string;
  };
};

export type SemanticState = {
  ipr: string;
  sessionId: string;
  activeDocument: string | null;
  documentFamily: DocumentFamily;
  centralThesis: string | null;
  semanticTags: string[];
  referenceRules: string[];
  accumulatedMeaning: string;
  lastEventId: string | null;
  lastGovernedEvt: string | null;
  lastGovernedHash: string | null;
  updatedAt: string;
};

export type MemoryContext = {
  used: boolean;
  source: MemorySource;
  text: string;
  semanticState: SemanticState | null;
  lastEventId: string | null;
};

type MemorySlot = {
  semanticState: SemanticState;
  events: EvtMemoryEvent[];
};

const EVENT_KIND = "IPR_BOUND_CHAT_MEMORY" as const;
const CANONICAL_SESSION_ID = "CANONICAL";

declare global {
  // eslint-disable-next-line no-var
  var __JOKER_C2_EVT_MEMORY__: Map<string, MemorySlot> | undefined;
}

const MAX_EVENTS_PER_SLOT = 120;
const MAX_MEMORY_TEXT_CHARS = 12000;
const SESSION_MEMORY_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const CANONICAL_MEMORY_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function nowIso(): string {
  return new Date().toISOString();
}

export function sha256Short(input: unknown): string {
  const data = JSON.stringify(input);
  const hash = createHash("sha256").update(data).digest("hex");
  return `sha256:${hash.slice(0, 16)}`;
}

function buildMemoryEvtId(): string {
  const compactTimestamp = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  return `EVT-MEM-${compactTimestamp}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)}`.toUpperCase();
}

function getStore(): Map<string, MemorySlot> {
  if (!globalThis.__JOKER_C2_EVT_MEMORY__) {
    globalThis.__JOKER_C2_EVT_MEMORY__ = new Map<string, MemorySlot>();
  }

  return globalThis.__JOKER_C2_EVT_MEMORY__;
}

function getMemoryKey(sessionId: string, ipr: string): string {
  return `${ipr}::${sessionId}`;
}

function getCanonicalMemoryKey(ipr: string): string {
  return getMemoryKey(CANONICAL_SESSION_ID, ipr);
}

function parseMemoryKey(key: string): { ipr: string; sessionId: string } | null {
  const parts = key.split("::");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return {
    ipr: parts[0],
    sessionId: parts[1]
  };
}

function isCanonicalKey(key: string): boolean {
  return key.endsWith(`::${CANONICAL_SESSION_ID}`);
}

function pruneStore(): void {
  const store = getStore();
  const now = Date.now();

  for (const [key, slot] of store.entries()) {
    const updatedAt = Date.parse(slot.semanticState.updatedAt);

    if (!Number.isFinite(updatedAt)) {
      store.delete(key);
      continue;
    }

    const ttl = isCanonicalKey(key)
      ? CANONICAL_MEMORY_TTL_MS
      : SESSION_MEMORY_TTL_MS;

    if (now - updatedAt > ttl) {
      store.delete(key);
    }
  }
}

function normalizeFileText(file: EvtMemoryFile): string {
  return String(file.text || file.content || "").trim();
}

function isMemoryFile(file: EvtMemoryFile): boolean {
  const name = String(file.name || "").trim().toUpperCase();
  const role = String(file.role || "").trim().toLowerCase();
  const type = String(file.type || "").trim().toLowerCase();

  return (
    name === "EVT-IPR-MEMORY" ||
    role === "ipr_bound_memory" ||
    type === "memory/evt-ipr"
  );
}

function getReadableUserFiles(files: EvtMemoryFile[]): EvtMemoryFile[] {
  return files.filter(
    (file) => !isMemoryFile(file) && normalizeFileText(file).length > 0
  );
}

function getActiveDocument(files: EvtMemoryFile[]): string | null {
  const readable = getReadableUserFiles(files);
  const active = readable.find((file) => normalizeFileText(file).length > 0);

  return active?.name?.trim() || null;
}

function mergeUnique(values: string[], limit = 32): string[] {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTags(text: string): string[] {
  const lower = text.toLowerCase();

  const dictionary = [
    "apokalypsis",
    "apocalipsis",
    "apocalisse",
    "decadimento",
    "crollo",
    "esposizione",
    "sistema culturale",
    "sistema politico",
    "sistema sociale",
    "popolo",
    "05-04-2026",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "matrix",
    "hbce",
    "joker-c2",
    "ai joker-c2",
    "ipr",
    "identity primary record",
    "trac",
    "evt",
    "evt chain",
    "ledger",
    "runtime",
    "fail-closed",
    "governance",
    "continuità",
    "continuita",
    "verifica",
    "auditabilità",
    "auditabilita",
    "esoterologia",
    "corpus",
    "lex hermeticum",
    "alien code",
    "anticristo",
    "biocybersecurity",
    "biocibersicurezza",
    "biocibernetica"
  ];

  return dictionary.filter((item) => lower.includes(item));
}

export function detectDocumentFamilyFromText(text: string): DocumentFamily {
  const lower = text.toLowerCase();

  if (
    lower.includes("ai joker-c2") ||
    lower.includes("joker-c2") ||
    lower.includes("hbce") ||
    lower.includes("runtime openai") ||
    lower.includes("evt chain") ||
    lower.includes("identity primary record") ||
    lower.includes("fail-closed") ||
    lower.includes("governance runtime") ||
    (lower.includes("ipr") &&
      (lower.includes("evt") ||
        lower.includes("runtime") ||
        lower.includes("governance") ||
        lower.includes("identità operativa") ||
        lower.includes("identita operativa")))
  ) {
    return "HBCE_RUNTIME";
  }

  if (
    lower.includes("apokalypsis") ||
    lower.includes("apocalipsis") ||
    lower.includes("apocalisse") ||
    lower.includes("decadimento") ||
    lower.includes("apostasia") ||
    lower.includes("anticristo")
  ) {
    return "APOKALYPSIS";
  }

  if (
    lower.includes("corpus esoterologia ermetica") ||
    lower.includes("esoterologia") ||
    lower.includes("decisione · costo · traccia · tempo") ||
    (lower.includes("decisione") &&
      lower.includes("costo") &&
      lower.includes("traccia") &&
      lower.includes("tempo"))
  ) {
    return "CORPUS_ESOTEROLOGIA";
  }

  if (
    lower.includes("matrix") ||
    lower.includes("trac") ||
    (lower.includes("torino") && lower.includes("bruxelles"))
  ) {
    return "MATRIX";
  }

  return "GENERAL_DOCUMENT";
}

function inferCentralThesis(input: EvtMemoryInput): string | null {
  const userFiles = getReadableUserFiles(input.files);

  const merged = [
    input.message,
    input.response,
    ...userFiles.map((file) =>
      [file.name || "", normalizeFileText(file).slice(0, 12000)].join("\n")
    )
  ].join("\n\n");

  const lower = merged.toLowerCase();

  if (
    input.documentFamily === "HBCE_RUNTIME" ||
    lower.includes("joker-c2") ||
    lower.includes("identity primary record") ||
    (lower.includes("ipr") && lower.includes("evt"))
  ) {
    return "AI JOKER-C2 tratta identità operativa, IPR, EVT, memoria vincolata, governance runtime, decisione, rischio, policy, ledger, verifica e continuità operativa.";
  }

  if (
    input.documentFamily === "APOKALYPSIS" ||
    lower.includes("apokalypsis") ||
    lower.includes("decadimento")
  ) {
    return "APOKALYPSIS tratta il decadimento esposto del sistema culturale, politico e sociale: il sistema continua a funzionare mentre perde fondamento, trasferendo costo sul popolo e lasciando traccia nel tempo.";
  }

  if (
    input.documentFamily === "MATRIX" ||
    lower.includes("matrix") ||
    lower.includes("hbce")
  ) {
    return "MATRIX/HBCE tratta identità operativa, governance computabile, continuità EVT/TRAC, verifica, auditabilità e controllo dei sistemi digitali.";
  }

  if (
    input.documentFamily === "CORPUS_ESOTEROLOGIA" ||
    lower.includes("esoterologia")
  ) {
    return "Il CORPUS ESOTEROLOGIA ERMETICA tratta il reale come sequenza verificabile attraverso Decisione · Costo · Traccia · Tempo.";
  }

  return null;
}

function inferUserIntent(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("programmazione") ||
    lower.includes("codice") ||
    lower.includes("runtime") ||
    lower.includes("route") ||
    lower.includes("api") ||
    lower.includes("lib/") ||
    lower.includes("github")
  ) {
    return "technical_runtime_work";
  }

  if (
    lower.includes("punti forti") ||
    lower.includes("punti deboli") ||
    lower.includes("giudizio") ||
    lower.includes("valuta")
  ) {
    return "editorial_review";
  }

  if (
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("potenzialità") ||
    lower.includes("potenzialita") ||
    lower.includes("target") ||
    lower.includes("pubblico")
  ) {
    return "impact_assessment";
  }

  if (
    lower.includes("spiega") ||
    lower.includes("analizza") ||
    lower.includes("sintesi") ||
    lower.includes("riassumi")
  ) {
    return "interpretive_analysis";
  }

  if (
    lower.includes("riscrivi") ||
    lower.includes("migliora") ||
    lower.includes("correggi") ||
    lower.includes("rifattorizza")
  ) {
    return "generative_rewrite";
  }

  if (
    lower.includes("amazon") ||
    lower.includes("linkedin") ||
    lower.includes("post") ||
    lower.includes("descrizione") ||
    lower.includes("pitch")
  ) {
    return "derived_output";
  }

  return "general_chat";
}

function buildMemoryDelta(input: EvtMemoryInput): string {
  const activeDocument = getActiveDocument(input.files);
  const centralThesis = inferCentralThesis(input);
  const intent = inferUserIntent(input.message);

  const parts = [
    `Intento utente rilevato: ${intent}.`,
    activeDocument ? `Documento attivo: ${activeDocument}.` : "",
    `Famiglia documento: ${input.documentFamily}.`,
    input.governedEvt ? `EVT governato collegato: ${input.governedEvt}.` : "",
    input.governedHash ? `Hash governato collegato: ${input.governedHash}.` : "",
    centralThesis ? `Tesi centrale incorporata: ${centralThesis}` : "",
    input.documentFamily === "HBCE_RUNTIME"
      ? "Regola di continuità: nelle chat successive, riferimenti a JOKER-C2, IPR, EVT, memoria, ledger, runtime o fail-closed devono essere ricondotti alla continuità operativa HBCE_RUNTIME se non viene indicato un nuovo contesto."
      : "",
    input.documentFamily === "APOKALYPSIS"
      ? "Regola di continuità: nelle chat successive, riferimenti come 'questa opera', 'questo testo', 'Apokalypsis', 'i punti forti', 'a chi serve' devono riferirsi al documento APOKALYPSIS attivo se non viene indicato un nuovo documento."
      : "",
    input.documentFamily === "MATRIX"
      ? "Regola di continuità: nelle chat successive, riferimenti a MATRIX/HBCE/JOKER-C2 devono usare il contesto tecnico-operativo già accumulato."
      : "",
    input.documentFamily === "CORPUS_ESOTEROLOGIA"
      ? "Regola di continuità: nelle chat successive, preservare Decisione · Costo · Traccia · Tempo come formula canonica."
      : ""
  ].filter(Boolean);

  return parts.join(" ");
}

function buildNextContext(input: EvtMemoryInput): string {
  const activeDocument = getActiveDocument(input.files);
  const intent = inferUserIntent(input.message);

  if (input.documentFamily === "HBCE_RUNTIME") {
    return [
      "Contesto runtime da mantenere: AI JOKER-C2 / IPR / EVT / ledger / memoria / fail-closed.",
      "Rilancio semantico: sessionId stabile, memoria IPR-bound, memoria canonica, governed EVT, ledger persistente, route chat, policy, risk, oversight.",
      `Ultimo intento utente: ${intent}.`,
      "Se l'utente usa riferimenti ellittici come 'il danno', 'riparalo', 'la memoria', 'la route', 'i nuovi file', recuperare questa memoria HBCE_RUNTIME."
    ].join(" ");
  }

  if (input.documentFamily === "APOKALYPSIS") {
    return [
      activeDocument
        ? `Documento attivo da mantenere: ${activeDocument}.`
        : "Documento attivo da mantenere: APOKALYPSIS.",
      "Rilancio semantico: decadimento esposto, sistema culturale-politico-sociale, 05-04-2026, popolo, Decisione · Costo · Traccia · Tempo.",
      `Ultimo intento utente: ${intent}.`,
      "Se l'utente usa riferimenti ellittici come 'questa opera', 'questo testo', 'Apokalypsis', 'i punti forti', recuperare questa memoria."
    ].join(" ");
  }

  return [
    activeDocument ? `Documento attivo da mantenere: ${activeDocument}.` : "",
    `Ultimo intento utente: ${intent}.`,
    "Usare questa memoria come contesto di continuità nelle chat successive se la richiesta è riferita al documento o al progetto attivo."
  ]
    .filter(Boolean)
    .join(" ");
}

function createInitialSemanticState(
  sessionId: string,
  ipr: string
): SemanticState {
  return {
    ipr,
    sessionId,
    activeDocument: null,
    documentFamily: "GENERAL_DOCUMENT",
    centralThesis: null,
    semanticTags: [],
    referenceRules: [],
    accumulatedMeaning: "",
    lastEventId: null,
    lastGovernedEvt: null,
    lastGovernedHash: null,
    updatedAt: nowIso()
  };
}

function updateSemanticState(
  previous: SemanticState,
  event: EvtMemoryEvent,
  input: EvtMemoryInput
): SemanticState {
  const centralThesis = inferCentralThesis(input) || previous.centralThesis;
  const activeDocument = event.activeDocument || previous.activeDocument;
  const documentFamily =
    event.documentFamily !== "GENERAL_DOCUMENT"
      ? event.documentFamily
      : previous.documentFamily;

  const newReferenceRules = [...previous.referenceRules];

  if (activeDocument && documentFamily === "APOKALYPSIS") {
    newReferenceRules.push(
      `"questa opera", "questo testo", "Apokalypsis", "i punti forti" = ${activeDocument}`
    );
  }

  if (documentFamily === "HBCE_RUNTIME") {
    newReferenceRules.push(
      `"JOKER-C2", "IPR", "EVT", "memoria", "ledger", "runtime", "fail-closed" = contesto HBCE_RUNTIME attivo`
    );
  }

  if (activeDocument) {
    newReferenceRules.push(`documento attivo = ${activeDocument}`);
  }

  if (event.governedEvt) {
    newReferenceRules.push(`ultimo governed EVT = ${event.governedEvt}`);
  }

  const accumulatedMeaning = [previous.accumulatedMeaning, event.memoryDelta]
    .filter(Boolean)
    .join(" ")
    .slice(-4500);

  return {
    ipr: previous.ipr,
    sessionId: previous.sessionId,
    activeDocument,
    documentFamily,
    centralThesis,
    semanticTags: mergeUnique(
      [...previous.semanticTags, ...event.semanticTags],
      48
    ),
    referenceRules: mergeUnique(newReferenceRules, 20),
    accumulatedMeaning,
    lastEventId: event.evt,
    lastGovernedEvt: event.governedEvt || previous.lastGovernedEvt,
    lastGovernedHash: event.governedHash || previous.lastGovernedHash,
    updatedAt: event.t
  };
}

function upsertSlot(input: {
  key: string;
  sessionId: string;
  ipr: string;
  event: EvtMemoryEvent;
  sourceInput: EvtMemoryInput;
}): MemorySlot {
  const store = getStore();
  const existing = store.get(input.key);

  const previousState =
    existing?.semanticState ||
    createInitialSemanticState(input.sessionId, input.ipr);

  const updatedState = updateSemanticState(
    previousState,
    input.event,
    input.sourceInput
  );

  const events = [...(existing?.events || []), input.event].slice(
    -MAX_EVENTS_PER_SLOT
  );

  const slot = {
    semanticState: updatedState,
    events
  };

  store.set(input.key, slot);

  return slot;
}

export function appendEvtMemory(input: EvtMemoryInput): EvtMemoryEvent {
  pruneStore();

  const store = getStore();
  const sessionKey = getMemoryKey(input.sessionId, input.ipr);
  const canonicalKey = getCanonicalMemoryKey(input.ipr);

  const existingSession = store.get(sessionKey);
  const existingCanonical = store.get(canonicalKey);

  const previousSessionState =
    existingSession?.semanticState ||
    createInitialSemanticState(input.sessionId, input.ipr);

  const previousCanonicalState =
    existingCanonical?.semanticState ||
    createInitialSemanticState(CANONICAL_SESSION_ID, input.ipr);

  const prev =
    previousSessionState.lastEventId ||
    previousCanonicalState.lastEventId ||
    input.prevEventId ||
    "GENESIS";

  const evt = buildMemoryEvtId();
  const t = nowIso();
  const activeDocument = getActiveDocument(input.files);

  const userFiles = getReadableUserFiles(input.files);

  const mergedText = [
    input.message,
    input.response,
    ...userFiles.map((file) =>
      [file.name || "", normalizeFileText(file).slice(0, 6000)].join("\n")
    )
  ].join("\n\n");

  const semanticTags = detectTags(mergedText);
  const userIntent = inferUserIntent(input.message);
  const memoryDelta = buildMemoryDelta(input);
  const nextContext = buildNextContext(input);

  const inputHash = sha256Short({
    message: input.message,
    files: userFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      textHash: sha256Short(normalizeFileText(file).slice(0, 24000))
    }))
  });

  const outputHash = sha256Short(input.response);

  const tracePayload = {
    evt,
    prev,
    t,
    entity: input.entity,
    ipr: input.ipr,
    sessionId: input.sessionId,
    kind: EVENT_KIND,
    state: input.state,
    decision: input.decision,
    contextClass: input.contextClass,
    documentMode: input.documentMode,
    documentFamily: input.documentFamily,
    activeDocument,
    semanticTags,
    userIntent,
    memoryDelta,
    nextContext,
    governedEvt: input.governedEvt || null,
    governedHash: input.governedHash || null,
    inputHash,
    outputHash
  };

  const event: EvtMemoryEvent = {
    evt,
    prev,
    t,
    entity: input.entity,
    ipr: input.ipr,
    sessionId: input.sessionId,
    kind: EVENT_KIND,
    state: input.state,
    decision: input.decision,
    contextClass: input.contextClass,
    documentMode: input.documentMode,
    documentFamily: input.documentFamily,
    activeDocument,
    semanticTags,
    userIntent,
    memoryDelta,
    nextContext,
    governedEvt: input.governedEvt || null,
    governedHash: input.governedHash || null,
    anchors: {
      inputHash,
      outputHash,
      traceHash: sha256Short(tracePayload)
    }
  };

  upsertSlot({
    key: sessionKey,
    sessionId: input.sessionId,
    ipr: input.ipr,
    event,
    sourceInput: input
  });

  upsertSlot({
    key: canonicalKey,
    sessionId: CANONICAL_SESSION_ID,
    ipr: input.ipr,
    event,
    sourceInput: input
  });

  return event;
}

function scoreSlotForMessage(slot: MemorySlot, message: string): number {
  const normalizedMessage = normalizeForMatch(message);
  const messageTags = detectTags(message);

  let score = 0;

  for (const tag of messageTags) {
    if (slot.semanticState.semanticTags.includes(tag)) {
      score += 10;
    }
  }

  if (
    slot.semanticState.activeDocument &&
    normalizedMessage.includes(normalizeForMatch(slot.semanticState.activeDocument))
  ) {
    score += 15;
  }

  if (
    slot.semanticState.documentFamily !== "GENERAL_DOCUMENT" &&
    normalizedMessage.includes(
      normalizeForMatch(slot.semanticState.documentFamily)
    )
  ) {
    score += 8;
  }

  if (slot.semanticState.documentFamily === "HBCE_RUNTIME") {
    const runtimeTerms = [
      "joker",
      "joker-c2",
      "ipr",
      "evt",
      "memoria",
      "ledger",
      "runtime",
      "route",
      "fail closed",
      "fail-closed",
      "programmazione"
    ];

    if (runtimeTerms.some((term) => normalizedMessage.includes(term))) {
      score += 20;
    }
  }

  const updatedAt = Date.parse(slot.semanticState.updatedAt);

  if (Number.isFinite(updatedAt)) {
    const hours = Math.max(1, (Date.now() - updatedAt) / (1000 * 60 * 60));
    score += Math.max(0, 10 - Math.floor(hours / 12));
  }

  return score;
}

function findMostRecentSlotByIpr(ipr: string, message: string): MemorySlot | null {
  const store = getStore();
  const candidates: MemorySlot[] = [];

  for (const [key, slot] of store.entries()) {
    const parsed = parseMemoryKey(key);

    if (!parsed || parsed.ipr !== ipr || isCanonicalKey(key)) {
      continue;
    }

    candidates.push(slot);
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates
    .map((slot) => ({
      slot,
      score: scoreSlotForMessage(slot, message),
      updatedAt: Date.parse(slot.semanticState.updatedAt) || 0
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.updatedAt - a.updatedAt;
    })[0]?.slot || null;
}

function buildMemoryText(input: {
  slot: MemorySlot;
  source: MemorySource;
}): string {
  const recentEvents = input.slot.events.slice(-10);

  const text = [
    "MEMORIA EVT/IPR-BOUND ATTIVA:",
    `MEMORY_SOURCE: ${input.source}`,
    `IPR: ${input.slot.semanticState.ipr}`,
    `SESSION_ID: ${input.slot.semanticState.sessionId}`,
    `ACTIVE_DOCUMENT: ${input.slot.semanticState.activeDocument || "none"}`,
    `DOCUMENT_FAMILY: ${input.slot.semanticState.documentFamily}`,
    `CENTRAL_THESIS: ${input.slot.semanticState.centralThesis || "none"}`,
    `LAST_MEMORY_EVT: ${input.slot.semanticState.lastEventId || "none"}`,
    `LAST_GOVERNED_EVT: ${input.slot.semanticState.lastGovernedEvt || "none"}`,
    `LAST_GOVERNED_HASH: ${input.slot.semanticState.lastGovernedHash || "none"}`,
    `SEMANTIC_TAGS: ${
      input.slot.semanticState.semanticTags.length > 0
        ? input.slot.semanticState.semanticTags.join(", ")
        : "none"
    }`,
    "",
    "REFERENCE_RULES:",
    input.slot.semanticState.referenceRules.length > 0
      ? input.slot.semanticState.referenceRules.join("\n")
      : "none",
    "",
    "ACCUMULATED_MEANING:",
    input.slot.semanticState.accumulatedMeaning || "none",
    "",
    "RECENT_EVT_MEMORY:",
    ...recentEvents.map((event) =>
      [
        `- ${event.evt}`,
        `  prev: ${event.prev}`,
        `  governedEvt: ${event.governedEvt || "none"}`,
        `  governedHash: ${event.governedHash || "none"}`,
        `  family: ${event.documentFamily}`,
        `  activeDocument: ${event.activeDocument || "none"}`,
        `  intent: ${event.userIntent}`,
        `  delta: ${event.memoryDelta}`,
        `  nextContext: ${event.nextContext}`,
        `  traceHash: ${event.anchors.traceHash}`
      ].join("\n")
    ),
    "",
    "ISTRUZIONE DI RECUPERO:",
    "Usa questa memoria per interpretare riferimenti ellittici dell'utente come 'questa opera', 'questo testo', 'il documento', 'Apokalypsis', 'i punti forti', 'a chi serve', 'il danno', 'riparalo', 'la route', 'la memoria', 'JOKER-C2', 'IPR', 'EVT', 'ledger', salvo che l'utente indichi chiaramente un nuovo documento o un nuovo contesto."
  ]
    .join("\n")
    .slice(0, MAX_MEMORY_TEXT_CHARS);

  return text;
}

export function getEvtMemoryContext(input: {
  sessionId: string;
  ipr: string;
  message: string;
}): MemoryContext {
  pruneStore();

  const store = getStore();
  const sessionKey = getMemoryKey(input.sessionId, input.ipr);
  const canonicalKey = getCanonicalMemoryKey(input.ipr);

  const sessionSlot = store.get(sessionKey);

  if (sessionSlot) {
    return {
      used: true,
      source: "SESSION",
      text: buildMemoryText({
        slot: sessionSlot,
        source: "SESSION"
      }),
      semanticState: sessionSlot.semanticState,
      lastEventId: sessionSlot.semanticState.lastEventId
    };
  }

  const canonicalSlot = store.get(canonicalKey);

  if (canonicalSlot) {
    return {
      used: true,
      source: "IPR_CANONICAL",
      text: buildMemoryText({
        slot: canonicalSlot,
        source: "IPR_CANONICAL"
      }),
      semanticState: canonicalSlot.semanticState,
      lastEventId: canonicalSlot.semanticState.lastEventId
    };
  }

  const recentSlot = findMostRecentSlotByIpr(input.ipr, input.message);

  if (recentSlot) {
    return {
      used: true,
      source: "IPR_RECENT",
      text: buildMemoryText({
        slot: recentSlot,
        source: "IPR_RECENT"
      }),
      semanticState: recentSlot.semanticState,
      lastEventId: recentSlot.semanticState.lastEventId
    };
  }

  return {
    used: false,
    source: "NONE",
    text: "Nessuna memoria EVT/IPR-bound disponibile per questa sessione o per questo IPR.",
    semanticState: null,
    lastEventId: null
  };
}

export function buildMemoryFile(memoryText: string): EvtMemoryFile {
  return {
    id: "evt-ipr-memory",
    name: "EVT-IPR-MEMORY",
    type: "memory/evt-ipr",
    size: memoryText.length,
    role: "ipr_bound_memory",
    text: memoryText
  };
}
