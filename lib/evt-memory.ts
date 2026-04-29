import { createHash } from "crypto";

export type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
export type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";

export type DocumentFamily =
  | "APOKALYPSIS"
  | "CORPUS_ESOTEROLOGIA"
  | "MATRIX"
  | "HBCE_RUNTIME"
  | "GENERAL_DOCUMENT";

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
  updatedAt: string;
};

export type MemoryContext = {
  used: boolean;
  text: string;
  semanticState: SemanticState | null;
  lastEventId: string | null;
};

type MemorySlot = {
  semanticState: SemanticState;
  events: EvtMemoryEvent[];
};

const EVENT_KIND = "IPR_BOUND_CHAT_MEMORY" as const;

declare global {
  // eslint-disable-next-line no-var
  var __JOKER_C2_EVT_MEMORY__: Map<string, MemorySlot> | undefined;
}

const MAX_EVENTS_PER_SLOT = 80;
const MAX_MEMORY_TEXT_CHARS = 9000;
const MEMORY_TTL_MS = 1000 * 60 * 60 * 12;

function nowIso(): string {
  return new Date().toISOString();
}

export function sha256Short(input: unknown): string {
  const data = JSON.stringify(input);
  const hash = createHash("sha256").update(data).digest("hex");
  return `sha256:${hash.slice(0, 16)}`;
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

function pruneStore(): void {
  const store = getStore();
  const now = Date.now();

  for (const [key, slot] of store.entries()) {
    const updatedAt = Date.parse(slot.semanticState.updatedAt);

    if (!Number.isFinite(updatedAt) || now - updatedAt > MEMORY_TTL_MS) {
      store.delete(key);
    }
  }
}

function normalizeFileText(file: EvtMemoryFile): string {
  return String(file.text || file.content || "").trim();
}

function getActiveDocument(files: EvtMemoryFile[]): string | null {
  const readable = files.find((file) => normalizeFileText(file).length > 0);

  return readable?.name?.trim() || null;
}

function mergeUnique(values: string[], limit = 32): string[] {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
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
    "ipr",
    "trac",
    "evt",
    "governance",
    "continuità",
    "verifica",
    "auditabilità",
    "esoterologia",
    "corpus",
    "lex hermeticum",
    "alien code",
    "anticristo"
  ];

  return dictionary.filter((item) => lower.includes(item));
}

export function detectDocumentFamilyFromText(text: string): DocumentFamily {
  const lower = text.toLowerCase();

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

  if (
    lower.includes("joker-c2") ||
    lower.includes("hbce") ||
    lower.includes("runtime") ||
    lower.includes("evt chain") ||
    lower.includes("identity primary record")
  ) {
    return "HBCE_RUNTIME";
  }

  return "GENERAL_DOCUMENT";
}

function inferCentralThesis(input: EvtMemoryInput): string | null {
  const merged = [
    input.message,
    input.response,
    ...input.files.map((file) =>
      [file.name || "", normalizeFileText(file).slice(0, 12000)].join("\n")
    )
  ].join("\n\n");

  const lower = merged.toLowerCase();

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
    centralThesis ? `Tesi centrale incorporata: ${centralThesis}` : "",
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

  if (activeDocument) {
    newReferenceRules.push(`documento attivo = ${activeDocument}`);
  }

  const accumulatedMeaning = [previous.accumulatedMeaning, event.memoryDelta]
    .filter(Boolean)
    .join(" ")
    .slice(-3500);

  return {
    ipr: previous.ipr,
    sessionId: previous.sessionId,
    activeDocument,
    documentFamily,
    centralThesis,
    semanticTags: mergeUnique(
      [...previous.semanticTags, ...event.semanticTags],
      40
    ),
    referenceRules: mergeUnique(newReferenceRules, 16),
    accumulatedMeaning,
    lastEventId: event.evt,
    updatedAt: event.t
  };
}

export function appendEvtMemory(input: EvtMemoryInput): EvtMemoryEvent {
  pruneStore();

  const store = getStore();
  const key = getMemoryKey(input.sessionId, input.ipr);
  const existing = store.get(key);

  const previousState =
    existing?.semanticState ||
    createInitialSemanticState(input.sessionId, input.ipr);

  const prev = input.prevEventId || previousState.lastEventId || "GENESIS";
  const evt = `EVT-MEM-${Date.now()}`;
  const t = nowIso();
  const activeDocument = getActiveDocument(input.files);

  const mergedText = [
    input.message,
    input.response,
    ...input.files.map((file) =>
      [file.name || "", normalizeFileText(file).slice(0, 6000)].join("\n")
    )
  ].join("\n\n");

  const semanticTags = detectTags(mergedText);
  const userIntent = inferUserIntent(input.message);
  const memoryDelta = buildMemoryDelta(input);
  const nextContext = buildNextContext(input);

  const inputHash = sha256Short({
    message: input.message,
    files: input.files.map((file) => ({
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
    anchors: {
      inputHash,
      outputHash,
      traceHash: sha256Short(tracePayload)
    }
  };

  const updatedState = updateSemanticState(previousState, event, input);
  const events = [...(existing?.events || []), event].slice(-MAX_EVENTS_PER_SLOT);

  store.set(key, {
    semanticState: updatedState,
    events
  });

  return event;
}

export function getEvtMemoryContext(input: {
  sessionId: string;
  ipr: string;
  message: string;
}): MemoryContext {
  pruneStore();

  const store = getStore();
  const key = getMemoryKey(input.sessionId, input.ipr);
  const slot = store.get(key);

  if (!slot) {
    return {
      used: false,
      text: "Nessuna memoria EVT/IPR-bound disponibile per questa sessione.",
      semanticState: null,
      lastEventId: null
    };
  }

  const recentEvents = slot.events.slice(-8);

  const text = [
    "MEMORIA EVT/IPR-BOUND ATTIVA:",
    `IPR: ${slot.semanticState.ipr}`,
    `SESSION_ID: ${slot.semanticState.sessionId}`,
    `ACTIVE_DOCUMENT: ${slot.semanticState.activeDocument || "none"}`,
    `DOCUMENT_FAMILY: ${slot.semanticState.documentFamily}`,
    `CENTRAL_THESIS: ${slot.semanticState.centralThesis || "none"}`,
    `SEMANTIC_TAGS: ${
      slot.semanticState.semanticTags.length > 0
        ? slot.semanticState.semanticTags.join(", ")
        : "none"
    }`,
    "",
    "REFERENCE_RULES:",
    slot.semanticState.referenceRules.length > 0
      ? slot.semanticState.referenceRules.join("\n")
      : "none",
    "",
    "ACCUMULATED_MEANING:",
    slot.semanticState.accumulatedMeaning || "none",
    "",
    "RECENT_EVT_MEMORY:",
    ...recentEvents.map((event) =>
      [
        `- ${event.evt}`,
        `  prev: ${event.prev}`,
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
    "Usa questa memoria per interpretare riferimenti ellittici dell'utente come 'questa opera', 'questo testo', 'il documento', 'Apokalypsis', 'i punti forti', 'a chi serve', salvo che l'utente indichi chiaramente un nuovo documento o un nuovo contesto."
  ]
    .join("\n")
    .slice(0, MAX_MEMORY_TEXT_CHARS);

  return {
    used: true,
    text,
    semanticState: slot.semanticState,
    lastEventId: slot.semanticState.lastEventId
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
