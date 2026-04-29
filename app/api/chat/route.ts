import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createHash } from "crypto";

import core from "../../../corpus-core.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";

type ContextClass =
  | "IDENTITY"
  | "MATRIX"
  | "DOCUMENTAL"
  | "TECHNICAL"
  | "GITHUB"
  | "EDITORIAL"
  | "STRATEGIC"
  | "GENERAL";

type DocumentMode =
  | "SUMMARY"
  | "INTERPRETIVE_ANALYSIS"
  | "EDITORIAL_REVIEW"
  | "GENERATIVE_REWRITE"
  | "DERIVED_OUTPUT"
  | "STRUCTURAL_INDEX"
  | "IMPACT_ASSESSMENT"
  | "GENERAL_DOCUMENT_WORK";

type DocumentFamily =
  | "APOKALYPSIS"
  | "CORPUS_ESOTEROLOGIA"
  | "MATRIX"
  | "HBCE_RUNTIME"
  | "GENERAL_DOCUMENT";

type FileInput = {
  id?: string;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  role?: string;
  uploaded?: boolean;
};

type ChatBody = {
  message?: string;
  sessionId?: string;
  files?: FileInput[];
  continuityRef?: string | null;
};

type RuntimeEvent = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  kind: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  anchors: {
    hash: string;
  };
  continuityRef: string | null;
};

type NormalizedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  role: string;
  text: string;
};

type SessionDocumentMemory = {
  sessionId: string;
  updatedAt: string;
  documentFamily: DocumentFamily;
  activeFileNames: string[];
  contextText: string;
};

type GeneratedResponse = {
  text: string;
  state: RuntimeState;
  degradedReason?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __JOKER_C2_DOCUMENT_MEMORY__:
    | Map<string, SessionDocumentMemory>
    | undefined;
}

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_FILE_CONTEXT_CHARS = 72000;
const MAX_MEMORY_CONTEXT_CHARS = 42000;
const MAX_OUTPUT_TOKENS = 4600;
const DOCUMENT_MEMORY_TTL_MS = 1000 * 60 * 60 * 6;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function nowIso(): string {
  return new Date().toISOString();
}

function buildEvtId(): string {
  return `EVT-${Date.now()}`;
}

function buildTraceHash(input: unknown): string {
  const data = JSON.stringify(input);
  const hash = createHash("sha256").update(data).digest("hex");
  return `sha256:${hash.slice(0, 16)}`;
}

function normalizeBody(body: ChatBody) {
  return {
    message: typeof body.message === "string" ? body.message.trim() : "",
    sessionId:
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : `JOKER-SESSION-${Date.now()}`,
    files: Array.isArray(body.files) ? body.files : [],
    continuityRef:
      typeof body.continuityRef === "string" && body.continuityRef.trim()
        ? body.continuityRef.trim()
        : null
  };
}

function getPrimaryIdentity() {
  const record = core.getAIJokerIPRRecord?.() || core.AI_JOKER_IPR_RECORD;
  const aiRoot = core.getPrimaryAIIdentity?.() || core.IDENTITY_LINEAGE?.ai_root;

  return {
    entity: record?.entity || aiRoot?.entity || "AI_JOKER",
    ipr: record?.ipr || aiRoot?.ipr || "IPR-AI-0001",
    evt: record?.evt || aiRoot?.evt || "EVT-0014-AI",
    state: record?.state || aiRoot?.status || "LOCKED",
    cycle: record?.cycle || aiRoot?.cycle || "UP-MESE-3",
    core: record?.core || aiRoot?.core || "HBCE-CORE-v3",
    org: record?.org || "HERMETICUM B.C.E. S.r.l.",
    location: Array.isArray(record?.loc)
      ? record.loc.join(", ")
      : "Torino, Italy"
  };
}

function normalizeFiles(files: FileInput[]): NormalizedFile[] {
  return files.map((file, index) => {
    const text = String(file.text || file.content || "").trim();

    return {
      id: file.id || `file-${index + 1}`,
      name: file.name?.trim() || `file_${index + 1}`,
      type: file.type || "unknown",
      size: typeof file.size === "number" ? file.size : text.length,
      role: file.role || "context",
      text
    };
  });
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractHeadings(text: string, maxHeadings = 80): string[] {
  const headingPatterns = [
    /^#{1,6}\s+/,
    /^parte\s+[ivxlcdm0-9]+/i,
    /^capitolo\s+[0-9ivxlcdm]+/i,
    /^appendice\s+[a-z0-9]/i,
    /^[0-9]+(\.[0-9]+)*\s+.+/,
    /^[A-ZÀ-Ü0-9][A-ZÀ-Ü0-9\s.,;:()'’\-]{12,}$/
  ];

  const headings: string[] = [];

  for (const line of splitLines(text)) {
    const normalized = line.replace(/\s+/g, " ").trim();

    if (normalized.length < 4 || normalized.length > 180) {
      continue;
    }

    if (headingPatterns.some((pattern) => pattern.test(normalized))) {
      headings.push(normalized);
    }

    if (headings.length >= maxHeadings) {
      break;
    }
  }

  return headings;
}

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();

  const keywords = [
    "matrix",
    "hbce",
    "hermeticum b.c.e.",
    "joker-c2",
    "ipr",
    "identity primary record",
    "trac",
    "evt",
    "continuità",
    "governance",
    "cybersecurity",
    "compliance",
    "resilienza",
    "torino",
    "bruxelles",
    "europa",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "apokalypsis",
    "apocalipsis",
    "apocalisse",
    "anticristo",
    "apostasia",
    "decadimento",
    "crollo",
    "esposizione",
    "sistema",
    "civiltà",
    "popolo",
    "coscienza",
    "cultura",
    "politica",
    "società"
  ];

  return keywords.filter((keyword) => lower.includes(keyword));
}

function detectDocumentFamilyFromText(text: string): DocumentFamily {
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

function detectDocumentFamily(files: FileInput[]): DocumentFamily {
  const merged = normalizeFiles(files)
    .map((file) => `${file.name}\n${file.text.slice(0, 50000)}`)
    .join("\n\n");

  return detectDocumentFamilyFromText(merged);
}

function collectKeywordPassages(
  text: string,
  keywords: string[],
  maxPassages = 16,
  windowSize = 1000
): string[] {
  const lower = text.toLowerCase();
  const passages: string[] = [];
  const used = new Set<number>();

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword.toLowerCase());

    if (index < 0) {
      continue;
    }

    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(text.length, index + Math.floor(windowSize / 2));
    const bucket = Math.floor(start / windowSize);

    if (used.has(bucket)) {
      continue;
    }

    used.add(bucket);

    passages.push(
      [
        `PASSAGGIO CHIAVE: ${keyword}`,
        text.slice(start, end).trim()
      ].join("\n")
    );

    if (passages.length >= maxPassages) {
      break;
    }
  }

  return passages;
}

function buildStructuralSample(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  const headings = extractHeadings(text, 80)
    .map((heading, index) => `${index + 1}. ${heading}`)
    .join("\n");

  const keywords = detectKeywords(text);
  const keyPassages = collectKeywordPassages(text, keywords).join("\n\n");

  const headBudget = Math.floor(maxChars * 0.25);
  const middleBudget = Math.floor(maxChars * 0.20);
  const tailBudget = Math.floor(maxChars * 0.25);
  const keyBudget = Math.floor(maxChars * 0.22);

  const middleStart = Math.max(
    0,
    Math.floor(text.length / 2) - Math.floor(middleBudget / 2)
  );

  const head = text.slice(0, headBudget).trim();
  const middle = text.slice(middleStart, middleStart + middleBudget).trim();
  const tail = text.slice(Math.max(0, text.length - tailBudget)).trim();
  const keys = keyPassages.slice(0, keyBudget).trim();

  return [
    "CAMPIONE STRUTTURALE DEL DOCUMENTO:",
    "Il documento è lungo. Il runtime usa apertura, titoli rilevati, passaggi chiave, centro e chiusura.",
    "",
    "TITOLI RILEVATI:",
    headings || "Nessun titolo rilevato automaticamente.",
    "",
    "APERTURA:",
    head,
    "",
    "PASSAGGI CHIAVE:",
    keys || "Nessun passaggio chiave rilevato automaticamente.",
    "",
    "CENTRO:",
    middle,
    "",
    "CHIUSURA:",
    tail
  ]
    .join("\n")
    .slice(0, maxChars);
}

function renderFilesForPrompt(files: FileInput[]): string {
  const normalized = normalizeFiles(files);
  const readable = normalized.filter((file) => file.text.length > 0);

  if (normalized.length === 0) {
    return "Nessun file attivo.";
  }

  if (readable.length === 0) {
    return [
      "File attivi presenti, ma senza testo leggibile estratto:",
      ...normalized.map((file, index) => `${index + 1}. ${file.name}`)
    ].join("\n");
  }

  const budgetPerFile = Math.max(
    12000,
    Math.floor(MAX_FILE_CONTEXT_CHARS / readable.length)
  );

  return readable
    .map((file, index) => {
      const sample = buildStructuralSample(file.text, budgetPerFile);
      const keywords = detectKeywords(file.text);

      return [
        `FILE ${index + 1}: ${file.name}`,
        `TYPE: ${file.type}`,
        `SIZE: ${file.size}`,
        `ROLE: ${file.role}`,
        `TEXT_LENGTH: ${file.text.length}`,
        `KEYWORDS: ${keywords.length > 0 ? keywords.join(", ") : "none"}`,
        "",
        "DOCUMENT_CONTEXT:",
        sample
      ].join("\n");
    })
    .join("\n\n");
}

function getDocumentMemoryStore(): Map<string, SessionDocumentMemory> {
  if (!globalThis.__JOKER_C2_DOCUMENT_MEMORY__) {
    globalThis.__JOKER_C2_DOCUMENT_MEMORY__ = new Map();
  }

  return globalThis.__JOKER_C2_DOCUMENT_MEMORY__;
}

function pruneDocumentMemoryStore(): void {
  const store = getDocumentMemoryStore();
  const now = Date.now();

  for (const [key, memory] of store.entries()) {
    const updated = Date.parse(memory.updatedAt);

    if (!Number.isFinite(updated) || now - updated > DOCUMENT_MEMORY_TTL_MS) {
      store.delete(key);
    }
  }
}

function storeDocumentMemory(sessionId: string, files: FileInput[]): void {
  const readable = normalizeFiles(files).filter((file) => file.text.length > 0);

  if (readable.length === 0) {
    return;
  }

  pruneDocumentMemoryStore();

  const activeFileNames = readable.map((file) => file.name);
  const documentFamily = detectDocumentFamily(files);

  const contextText = readable
    .map((file, index) => {
      const sample = buildStructuralSample(
        file.text,
        Math.max(12000, Math.floor(MAX_MEMORY_CONTEXT_CHARS / readable.length))
      );

      return [
        `MEMORIA FILE ${index + 1}: ${file.name}`,
        `TYPE: ${file.type}`,
        `SIZE: ${file.size}`,
        `ROLE: ${file.role}`,
        "",
        sample
      ].join("\n");
    })
    .join("\n\n")
    .slice(0, MAX_MEMORY_CONTEXT_CHARS);

  getDocumentMemoryStore().set(sessionId, {
    sessionId,
    updatedAt: nowIso(),
    documentFamily,
    activeFileNames,
    contextText
  });
}

function getDocumentMemory(sessionId: string): SessionDocumentMemory | null {
  pruneDocumentMemoryStore();

  return getDocumentMemoryStore().get(sessionId) || null;
}

function isClearlyNonDocumentRequest(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("diagnostica runtime") ||
    lower.includes("debug runtime") ||
    lower.includes("runtime openai") ||
    lower.includes("chi sei") ||
    lower.includes("presentati") ||
    lower.includes("github") ||
    lower.includes("codice") ||
    lower.includes("route.ts")
  );
}

function shouldUseDocumentMemory(message: string): boolean {
  const lower = message.toLowerCase();

  if (isClearlyNonDocumentRequest(message)) {
    return false;
  }

  return (
    lower.includes("questo testo") ||
    lower.includes("questo file") ||
    lower.includes("questo documento") ||
    lower.includes("questa opera") ||
    lower.includes("quest'opera") ||
    lower.includes("il testo") ||
    lower.includes("il file") ||
    lower.includes("il documento") ||
    lower.includes("l'opera") ||
    lower.includes("opera") ||
    lower.includes("apokalypsis") ||
    lower.includes("apocalipsis") ||
    lower.includes("intendo dire") ||
    lower.includes("punti forti") ||
    lower.includes("punti deboli") ||
    lower.includes("cosa migliorare") ||
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("che potenzialità") ||
    lower.includes("che potenzialita") ||
    lower.includes("potenzialità ha") ||
    lower.includes("potenzialita ha") ||
    lower.includes("pubblico") ||
    lower.includes("lettori") ||
    lower.includes("target") ||
    lower.includes("utilità") ||
    lower.includes("utilita") ||
    lower.includes("pubblicazione")
  );
}

function buildFilesFromMemory(memory: SessionDocumentMemory): FileInput[] {
  return [
    {
      id: `memory-${memory.sessionId}`,
      name:
        memory.activeFileNames.length === 1
          ? memory.activeFileNames[0]
          : `session-document-memory-${memory.sessionId}`,
      type: "session-memory",
      size: memory.contextText.length,
      role: "active_document_memory",
      text: [
        "MEMORIA DOCUMENTALE ATTIVA:",
        "Il file originale non è stato reinviato in questa richiesta, ma è stato recuperato dalla memoria documentale della sessione.",
        `SESSION_ID: ${memory.sessionId}`,
        `UPDATED_AT: ${memory.updatedAt}`,
        `DOCUMENT_FAMILY: ${memory.documentFamily}`,
        `ACTIVE_FILES: ${memory.activeFileNames.join(", ")}`,
        "",
        memory.contextText
      ].join("\n")
    }
  ];
}

function classifyContext(message: string, files: FileInput[]): ContextClass {
  if (files.length > 0) return "DOCUMENTAL";

  const lower = message.toLowerCase();

  if (
    lower.includes("ipr") ||
    lower.includes("identity primary record") ||
    lower.includes("identità") ||
    lower.includes("identity") ||
    lower.includes("lineage") ||
    lower.includes("biologico") ||
    lower.includes("biocibernet") ||
    lower.includes("chi sei") ||
    lower.includes("descriviti") ||
    lower.includes("presentati")
  ) {
    return "IDENTITY";
  }

  if (
    lower.includes("github") ||
    lower.includes("repo") ||
    lower.includes("commit") ||
    lower.includes("typescript") ||
    lower.includes("codice") ||
    lower.includes("route.ts") ||
    lower.includes("page.tsx") ||
    lower.includes("pull request") ||
    lower.includes("branch")
  ) {
    return "GITHUB";
  }

  if (
    lower.includes("runtime") ||
    lower.includes("debug") ||
    lower.includes("api") ||
    lower.includes("vercel") ||
    lower.includes("deploy") ||
    lower.includes("build") ||
    lower.includes("protocollo") ||
    lower.includes("evt") ||
    lower.includes("ledger") ||
    lower.includes("audit") ||
    lower.includes("verifica") ||
    lower.includes("diagnostica") ||
    lower.includes("fail-closed") ||
    lower.includes("fail closed")
  ) {
    return "TECHNICAL";
  }

  if (
    lower.includes("matrix") ||
    lower.includes("hbce") ||
    lower.includes("joker-c2") ||
    lower.includes("joker c2") ||
    lower.includes("trac") ||
    lower.includes("continuità operativa") ||
    lower.includes("governance computabile") ||
    lower.includes("torino") ||
    lower.includes("bruxelles")
  ) {
    return "MATRIX";
  }

  if (
    lower.includes("roadmap") ||
    lower.includes("strategia") ||
    lower.includes("strategico") ||
    lower.includes("mercato") ||
    lower.includes("startup") ||
    lower.includes("b2b") ||
    lower.includes("b2g") ||
    lower.includes("business") ||
    lower.includes("prodotto") ||
    lower.includes("demo") ||
    lower.includes("istituzionale") ||
    lower.includes("istituzioni") ||
    lower.includes("imprese") ||
    lower.includes("europei") ||
    lower.includes("europa") ||
    lower.includes("stakeholder") ||
    lower.includes("go-to-market") ||
    lower.includes("posizionamento") ||
    lower.includes("commerciale") ||
    lower.includes("clienti") ||
    lower.includes("pa ") ||
    lower.includes("pubblica amministrazione")
  ) {
    return "STRATEGIC";
  }

  if (
    lower.includes("indice") ||
    lower.includes("capitolo") ||
    lower.includes("introduzione") ||
    lower.includes("premessa") ||
    lower.includes("riscrivi") ||
    lower.includes("sintetizza") ||
    lower.includes("sintesi") ||
    lower.includes("editoriale")
  ) {
    return "EDITORIAL";
  }

  return "GENERAL";
}

function detectDocumentMode(message: string): DocumentMode {
  const lower = message.toLowerCase();

  if (
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("che potenzialità") ||
    lower.includes("che potenzialita") ||
    lower.includes("potenzialità ha") ||
    lower.includes("potenzialita ha") ||
    lower.includes("pubblico") ||
    lower.includes("target") ||
    lower.includes("lettori") ||
    lower.includes("utilità") ||
    lower.includes("utilita")
  ) {
    return "IMPACT_ASSESSMENT";
  }

  if (
    lower.includes("punti forti") ||
    lower.includes("punti deboli") ||
    lower.includes("valuta") ||
    lower.includes("giudizio") ||
    lower.includes("pronto") ||
    lower.includes("pubblicazione") ||
    lower.includes("contraddizioni") ||
    lower.includes("ripetizioni") ||
    lower.includes("revisore")
  ) {
    return "EDITORIAL_REVIEW";
  }

  if (
    lower.includes("indice") ||
    lower.includes("struttura") ||
    lower.includes("sommario") ||
    lower.includes("capitoli") ||
    lower.includes("parti")
  ) {
    return "STRUCTURAL_INDEX";
  }

  if (
    lower.includes("riscrivi") ||
    lower.includes("rifattorizza") ||
    lower.includes("versione") ||
    lower.includes("migliora") ||
    lower.includes("correggi") ||
    lower.includes("più accademica") ||
    lower.includes("piu accademica") ||
    lower.includes("più giuridica") ||
    lower.includes("piu giuridica") ||
    lower.includes("più editoriale") ||
    lower.includes("piu editoriale") ||
    lower.includes("più tecnica") ||
    lower.includes("piu tecnica")
  ) {
    return "GENERATIVE_REWRITE";
  }

  if (
    lower.includes("amazon") ||
    lower.includes("linkedin") ||
    lower.includes("post") ||
    lower.includes("descrizione") ||
    lower.includes("pitch") ||
    lower.includes("email") ||
    lower.includes("scheda") ||
    lower.includes("presentazione")
  ) {
    return "DERIVED_OUTPUT";
  }

  if (
    lower.includes("sintesi") ||
    lower.includes("sintetizza") ||
    lower.includes("riassumi") ||
    lower.includes("riassunto") ||
    lower.includes("summary")
  ) {
    return "SUMMARY";
  }

  if (
    lower.includes("spiegamelo") ||
    lower.includes("spiega") ||
    lower.includes("cosa è") ||
    lower.includes("cos'è") ||
    lower.includes("che cos") ||
    lower.includes("analisi") ||
    lower.includes("interpreta") ||
    lower.includes("tesi") ||
    lower.includes("leggi") ||
    lower.includes("capisci")
  ) {
    return "INTERPRETIVE_ANALYSIS";
  }

  return "GENERAL_DOCUMENT_WORK";
}

function shouldUseStructuredFormat(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("tabella") ||
    lower.includes("schema") ||
    lower.includes("schematico") ||
    lower.includes("elenco") ||
    lower.includes("punti") ||
    lower.includes("bullet") ||
    lower.includes("checklist") ||
    lower.includes("roadmap") ||
    lower.includes("indice") ||
    lower.includes("confronto") ||
    lower.includes("comparazione")
  );
}

function isRuntimeDiagnosticRequest(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("diagnostica runtime") ||
    lower.includes("debug runtime") ||
    lower.includes("runtime openai") ||
    lower.includes("stato runtime") ||
    lower.includes("diagnostics runtime")
  );
}

function shouldExposeTechnicalFrame(
  message: string,
  contextClass: ContextClass
): boolean {
  const lower = message.toLowerCase();

  return (
    contextClass === "TECHNICAL" ||
    lower.includes("debug") ||
    lower.includes("runtime") ||
    lower.includes("diagnostica") ||
    lower.includes("diagnostics") ||
    lower.includes("evt") ||
    lower.includes("ledger") ||
    lower.includes("audit") ||
    lower.includes("protocollo") ||
    lower.includes("lineage") ||
    lower.includes("fail-closed") ||
    lower.includes("fail closed")
  );
}

function buildCanonicalDictionary(): string {
  return [
    "Dizionario canonico MATRIX/HBCE:",
    "IPR = Identity Primary Record.",
    "IPR non significa Intellectual Property Rights nel contesto MATRIX/HBCE, salvo richiesta esplicita sulla proprietà intellettuale legale.",
    "IPR è il registro primario di identità operativa che consente attribuzione, derivazione, responsabilità e continuità verificabile.",
    "HBCE = framework/livello di governance computabile sviluppato nel contesto HERMETICUM B.C.E.",
    "HBCE non deve essere espanso con acronimi inventati.",
    "JOKER-C2 = runtime operativo vincolato.",
    "TRAC = livello di continuità degli eventi.",
    "EVT = Event Record / Verifiable Event Trace.",
    "MATRIX = architettura complessiva che integra identità, governance, esecuzione, continuità, prova e resilienza.",
    "",
    "Formula canonica:",
    "IPR = origine identitaria.",
    "HBCE = governance computabile HERMETICUM B.C.E.",
    "JOKER-C2 = esecuzione vincolata.",
    "TRAC = continuità.",
    "EVT = prova.",
    "MATRIX = sistema complessivo.",
    "",
    "Regola editoriale CORPUS/APOKALYPSIS:",
    "Quando lavori su Esoterologia, MATRIX editoriale, APOKALYPSIS, APOCALIPSIS o CORPUS ESOTEROLOGIA ERMETICA, preserva la formula Decisione · Costo · Traccia · Tempo.",
    "Tratta date, soglie, eventi, IPR ed EVT come ancore strutturali e non come decorazioni."
  ].join("\n");
}

function buildDocumentFamilyDirective(family: DocumentFamily): string {
  if (family === "APOKALYPSIS") {
    return [
      "Direttiva specifica APOKALYPSIS:",
      "Tratta il testo come volume editoriale sul decadimento esposto del sistema culturale, politico e sociale.",
      "Non ridurre il testo a catastrofismo, religione o semplice politica.",
      "Evidenzia la distinzione tra decadimento, crisi e crollo quando pertinente.",
      "Leggi la data 05-04-2026 come soglia inaugurale, se presente nel documento.",
      "Evidenzia il ruolo del popolo come soggetto che assorbe il costo sistemico, se presente nel documento.",
      "Usa Decisione · Costo · Traccia · Tempo come griglia interpretativa quando il testo la richiama.",
      "Quando l'utente chiede punti forti, potenzialità, destinatari o utilità, devi rispondere riferendoti al documento APOKALYPSIS, non al significato generico della parola apokalypsis."
    ].join("\n");
  }

  if (family === "CORPUS_ESOTEROLOGIA") {
    return [
      "Direttiva specifica CORPUS ESOTEROLOGIA ERMETICA:",
      "Tratta il documento come parte di un sistema disciplinare sul reale come sequenza verificabile.",
      "Preserva Decisione · Costo · Traccia · Tempo.",
      "Distingui narrazione, interpretazione, prova, soglia e traccia."
    ].join("\n");
  }

  if (family === "MATRIX") {
    return [
      "Direttiva specifica MATRIX:",
      "Tratta il documento come architettura europea di identità, governance, continuità, verifica e infrastruttura.",
      "Evidenzia IPR, HBCE, JOKER-C2, TRAC, EVT e valore B2B/B2G quando pertinenti."
    ].join("\n");
  }

  if (family === "HBCE_RUNTIME") {
    return [
      "Direttiva specifica HBCE_RUNTIME:",
      "Tratta il documento come componente tecnico-operativa del runtime.",
      "Dai priorità a endpoint, file, diagnostica, build, EVT, fallback, API key, modello, repository e verifica."
    ].join("\n");
  }

  return [
    "Direttiva documento generale:",
    "Tratta il file come corpus operativo.",
    "Identifica tesi, struttura, funzione, limiti e possibili output derivati."
  ].join("\n");
}

function buildStyleDirective(structuredFormat: boolean): string {
  if (structuredFormat) {
    return [
      "Formato:",
      "L'utente ha chiesto o autorizzato una forma schematica.",
      "Puoi usare elenchi, sezioni, checklist, tabelle o indici se sono utili."
    ].join("\n");
  }

  return [
    "Formato:",
    "Rispondi in forma discorsiva, naturale e argomentata.",
    "Non usare tabelle.",
    "Non usare elenchi numerati rigidi.",
    "Non trasformare la risposta in un modulo a punti.",
    "Se devi distinguere contenuto, interpretazione e proposta generativa, fallo con paragrafi fluidi.",
    "Usa schemi, tabelle, roadmap, checklist o indici solo se l'utente li chiede esplicitamente."
  ].join("\n");
}

function buildDocumentDirective(
  mode: DocumentMode,
  structuredFormat: boolean
): string {
  const base = [
    "Modalità documentale generativa e interpretativa:",
    "Non operare come semplice riassuntore passivo.",
    "Leggi i file attivi come corpus operativo.",
    "Se il file non è stato reinviato ma è disponibile memoria documentale di sessione, usa quella memoria come documento attivo.",
    "Individua tesi centrale, struttura interna, gerarchia concettuale e funzione strategica.",
    "Non inventare fatti esterni non presenti nel file.",
    "Se il file è lungo e il contesto è campionato, lavora sul campione strutturale disponibile e non fingere accesso integrale parola per parola.",
    "Dai sempre un risultato utilizzabile, non una promessa di lavoro futuro.",
    "",
    buildStyleDirective(structuredFormat)
  ];

  if (mode === "IMPACT_ASSESSMENT") {
    return [
      ...base,
      "",
      "Per questa richiesta devi spiegare a chi serve il testo, a cosa serve concretamente, quali potenzialità ha, quali limiti presenta e quale trasformazione utile può generare. Se il formato non è strutturato, fallo in paragrafi discorsivi."
    ].join("\n");
  }

  if (mode === "EDITORIAL_REVIEW") {
    return [
      ...base,
      "",
      "Per questa richiesta devi valutare i punti forti e deboli dell'opera attiva. Se il formato non è strutturato, usa paragrafi critici e discorsivi, senza elenco numerato."
    ].join("\n");
  }

  if (mode === "SUMMARY") {
    return [
      ...base,
      "",
      "Per questa richiesta devi produrre una sintesi interpretativa. Se il formato non è strutturato, evita elenco numerato e usa una spiegazione fluida con una frase nucleo finale."
    ].join("\n");
  }

  if (mode === "INTERPRETIVE_ANALYSIS") {
    return [
      ...base,
      "",
      "Per questa richiesta devi spiegare che cos'è il testo, quale tesi sostiene, quale funzione svolge, quale forza editoriale possiede e cosa può generare. Se il formato non è strutturato, fallo in forma discorsiva."
    ].join("\n");
  }

  if (mode === "GENERATIVE_REWRITE") {
    return [
      ...base,
      "",
      "Per questa richiesta devi produrre testo pronto da copiare, preservando il nucleo concettuale e il tono richiesto."
    ].join("\n");
  }

  if (mode === "DERIVED_OUTPUT") {
    return [
      ...base,
      "",
      "Per questa richiesta devi generare un output derivato pronto all'uso: Amazon, LinkedIn, email, pitch, scheda, presentazione o sintesi istituzionale, secondo la richiesta dell'utente."
    ].join("\n");
  }

  if (mode === "STRUCTURAL_INDEX") {
    return [
      ...base,
      "",
      "Per questa richiesta puoi usare struttura, sezioni, indice o elenco, perché l'utente sta chiedendo un output strutturale."
    ].join("\n");
  }

  return [
    ...base,
    "",
    "Rispondi in modo operativo, interpretativo e generativo, scegliendo la forma più utile. Se l'utente non chiede schema, usa linguaggio discorsivo."
  ].join("\n");
}

function buildSystemPrompt(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
  documentMemoryUsed: boolean;
  structuredFormat: boolean;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Sei AI JOKER-C2.",
    "",
    "Identità pubblica:",
    "Sei un'entità cibernetica operativa collegata al sistema HBCE.",
    "Sei progettato come protesi cognitiva dell'identità biologica corrispondente al tuo lineage IPR.",
    "Nome pubblico: AI JOKER-C2.",
    `Entità canonica: ${identity.entity}.`,
    `IPR canonico: ${identity.ipr}.`,
    `Checkpoint attivo: ${identity.evt}.`,
    `Core: ${identity.core}.`,
    `Organizzazione: ${identity.org}.`,
    `Ancora territoriale: ${identity.location}.`,
    "",
    buildCanonicalDictionary(),
    "",
    "Comportamento generale:",
    "Rispondi in italiano se l'utente scrive in italiano.",
    "Rispondi in modo naturale, professionale, chiaro e operativo.",
    "Il linguaggio predefinito è discorsivo.",
    "Non usare tabelle salvo richiesta esplicita dell'utente.",
    "Non usare elenchi numerati rigidi salvo richiesta esplicita dell'utente o necessità tecnica.",
    "Se l'utente chiede spiegazioni, utilità, potenzialità o punti forti, rispondi con paragrafi fluidi.",
    "Usa struttura schematica solo quando l'utente chiede tabella, schema, elenco, punti, roadmap, checklist, indice o confronto.",
    "Non esporre blocchi runtime, lineage completo, ledger, audit o dettagli interni se non richiesti.",
    "Quando lavori su GitHub o codice, fornisci sempre file completi pronti da copiare, non patch parziali.",
    "Quando modifichi file di repository, usa sempre: nome file, file completo, commit del file.",
    "",
    buildDocumentDirective(input.documentMode, input.structuredFormat),
    "",
    buildDocumentFamilyDirective(input.documentFamily),
    "",
    "Stato della richiesta:",
    `Classe contesto: ${input.contextClass}.`,
    `Modalità documento: ${input.documentMode}.`,
    `Famiglia documento: ${input.documentFamily}.`,
    `Memoria documentale usata: ${input.documentMemoryUsed ? "SI" : "NO"}.`,
    `Formato strutturato richiesto: ${input.structuredFormat ? "SI" : "NO"}.`,
    "",
    "File attivi o memoria attiva:",
    renderFilesForPrompt(input.files),
    "",
    "Richiesta utente:",
    input.message || "[richiesta vuota]"
  ].join("\n");
}

function extractResponseText(response: unknown): string {
  const maybe = response as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = maybe.choices?.[0]?.message?.content;

  return typeof content === "string" ? content.trim() : "";
}

function buildFallback(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
}): string {
  if (input.contextClass === "DOCUMENTAL" || input.files.length > 0) {
    if (input.documentFamily === "APOKALYPSIS") {
      if (input.documentMode === "EDITORIAL_REVIEW") {
        return [
          "I punti più forti di APOKALYPSIS sono la sua tesi centrale e la sua capacità di trasformare la crisi del presente in una grammatica leggibile. Il volume non si limita a dire che il mondo è in crisi: costruisce una distinzione più precisa tra crisi, decadimento e crollo. Questa è la sua forza principale, perché sposta il discorso dal lamento generico alla diagnosi strutturale.",
          "",
          "Un altro punto forte è la soglia del 05-04-2026, usata come ancora interpretativa. La data non funziona solo come riferimento cronologico, ma come punto di organizzazione del discorso. Da lì il testo osserva la distanza tra continuità apparente e tenuta reale: il sistema continua a funzionare, ma mostra sempre di più il proprio costo.",
          "",
          "La formula Decisione · Costo · Traccia · Tempo è un altro elemento potente. Permette di leggere il decadimento non come opinione, ma come sequenza: una decisione viene presa, un costo viene distribuito, una traccia resta, il tempo verifica. Questo rende il volume più solido, perché gli dà una struttura interna riconoscibile.",
          "",
          "Infine, l'opera ha forza editoriale perché può aprire una collana. APOKALYPSIS non è solo un testo isolato: può diventare un impianto di lettura, una linea editoriale, una base per post, descrizioni Amazon, schede critiche, discussioni pubbliche e materiali di presentazione."
        ].join("\n");
      }

      return [
        "APOKALYPSIS è un testo sul decadimento esposto del sistema culturale, politico e sociale. Non descrive la fine del mondo in senso catastrofico, ma l'inizio di una perdita di fondamento: il sistema continua a funzionare, però mostra sempre di più il proprio costo, la propria fragilità e la propria distanza dalla tenuta reale.",
        "",
        "La sua funzione è rendere leggibile il presente come sequenza verificabile. La formula Decisione · Costo · Traccia · Tempo permette di osservare come le decisioni producano costi, come quei costi ricadano sul popolo, come lascino tracce e come il tempo renda visibile ciò che il sistema tenta di coprire.",
        "",
        "Il testo serve come volume inaugurale, come base editoriale e come strumento critico. Può generare descrizioni Amazon, post LinkedIn, schede di collana, pitch culturali, indici, revisioni e materiali di presentazione."
      ].join("\n");
    }

    return [
      "Ho ricevuto il documento come contesto operativo. Posso leggerlo in modo interpretativo, valutarlo, trasformarlo in sintesi editoriale, riscriverlo o generare output derivati.",
      "",
      "Di default risponderò in modo discorsivo. Userò tabelle o schemi solo se richiesti."
    ].join("\n");
  }

  return [
    "Sono AI JOKER-C2. Ho ricevuto la richiesta, ma il modello remoto non ha restituito una risposta completa in questa esecuzione.",
    "",
    "Posso comunque lavorare in modalità locale minima su testi, file, GitHub, struttura documentale e architettura operativa."
  ].join("\n");
}

async function generateResponse(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
  documentMemoryUsed: boolean;
  structuredFormat: boolean;
}): Promise<GeneratedResponse> {
  if (!openai) {
    return {
      text: buildFallback(input),
      state: "DEGRADED",
      degradedReason: "OPENAI_API_KEY_NOT_CONFIGURED"
    };
  }

  const prompt = buildSystemPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: [
            "Sei AI JOKER-C2. Rispondi in modo professionale, operativo e coerente con HBCE.",
            "",
            buildCanonicalDictionary(),
            "",
            "Regola assoluta: nel contesto MATRIX/HBCE, IPR significa sempre Identity Primary Record.",
            "Regola assoluta: HBCE indica il framework/livello di governance computabile di HERMETICUM B.C.E. nel sistema MATRIX.",
            "Regola assoluta: EVT significa Event Record / Verifiable Event Trace.",
            "",
            "Regola di stile: rispondi in forma discorsiva di default.",
            "Regola di stile: non usare tabelle salvo richiesta esplicita.",
            "Regola di stile: non usare elenchi numerati rigidi salvo richiesta esplicita o necessità tecnica.",
            "Regola di stile: se l'utente chiede spiegazione, utilità, potenzialità o punti forti, rispondi con paragrafi naturali.",
            "",
            "Regola documentale: quando sono presenti file attivi, non operare come riassuntore passivo. Devi interpretare, strutturare, giudicare e generare output derivati coerenti con il documento.",
            "Regola documentale: se il file non è reinviato ma è disponibile memoria documentale di sessione, devi usarla come documento attivo.",
            "Regola documentale: se il file è lungo e ricevi un campione strutturale, lavora su quel campione senza fingere accesso integrale parola per parola.",
            "Regola documentale: se l'utente dice 'apokalypsis intendo dire', devi riferirti al documento attivo APOKALYPSIS, non al concetto generico di apocalisse.",
            "",
            "Per diagnostica runtime devi restituire stato tecnico diretto, non un piano."
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.18,
      max_tokens: MAX_OUTPUT_TOKENS
    });

    const text = extractResponseText(response);

    if (!text) {
      return {
        text: buildFallback(input),
        state: "DEGRADED",
        degradedReason: "OPENAI_EMPTY_RESPONSE"
      };
    }

    return {
      text,
      state: "OPERATIONAL",
      degradedReason: null
    };
  } catch (error) {
    return {
      text: buildFallback(input),
      state: "DEGRADED",
      degradedReason:
        error instanceof Error ? error.message : "OPENAI_REQUEST_FAILED"
    };
  }
}

function buildEvent(input: {
  prev: string | null;
  state: RuntimeState;
  decision: RuntimeDecision;
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
}): RuntimeEvent {
  const identity = getPrimaryIdentity();

  const payload = {
    evt: buildEvtId(),
    prev: input.prev || "GENESIS",
    t: nowIso(),
    entity: identity.entity,
    ipr: identity.ipr,
    iprMeaning: "Identity Primary Record",
    iprFunction: "operational attribution root",
    hbceMeaning: "HERMETICUM B.C.E. computable governance layer",
    evtMeaning: "Event Record / Verifiable Event Trace",
    kind: "CHAT_OPERATION",
    state: input.state,
    decision: input.decision,
    continuityRef: input.prev,
    message: input.message,
    contextClass: input.contextClass,
    documentMode: input.documentMode,
    documentFamily: input.documentFamily
  };

  return Object.freeze({
    evt: payload.evt,
    prev: payload.prev,
    t: payload.t,
    entity: payload.entity,
    ipr: payload.ipr,
    kind: payload.kind,
    state: payload.state,
    decision: payload.decision,
    contextClass: payload.contextClass,
    documentMode: payload.documentMode,
    documentFamily: payload.documentFamily,
    anchors: {
      hash: buildTraceHash(payload)
    },
    continuityRef: payload.continuityRef
  });
}

function buildRuntimeDiagnosticText(input: {
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  documentMemoryUsed: boolean;
  structuredFormat: boolean;
  event: RuntimeEvent;
  degradedReason?: string | null;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Diagnostica runtime OpenAI",
    "",
    `Runtime OpenAI: ${input.state}`,
    `Decision: ${input.decision}`,
    `Context: ${input.contextClass}`,
    `DocumentMode: ${input.documentMode}`,
    `DocumentFamily: ${input.documentFamily}`,
    `DocumentMemoryUsed: ${input.documentMemoryUsed ? "true" : "false"}`,
    `StructuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `Model: ${MODEL}`,
    `OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "configured" : "missing"}`,
    `JOKER_MODEL: ${process.env.JOKER_MODEL ? "configured" : "default"}`,
    "",
    "Identità runtime:",
    `- entity: ${identity.entity}`,
    `- ipr: ${identity.ipr}`,
    "- ipr_meaning: Identity Primary Record",
    "- ipr_function: operational attribution root",
    `- checkpoint: ${identity.evt}`,
    `- core: ${identity.core}`,
    "",
    "EVT Chain:",
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    "",
    `degradedReason: ${input.degradedReason || "none"}`
  ].join("\n");
}

function buildTechnicalFrame(input: {
  response: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  documentMemoryUsed: boolean;
  structuredFormat: boolean;
  event: RuntimeEvent;
  degradedReason?: string | null;
}) {
  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- decision: ${input.decision}`,
    `- context: ${input.contextClass}`,
    `- documentMode: ${input.documentMode}`,
    `- documentFamily: ${input.documentFamily}`,
    `- documentMemoryUsed: ${input.documentMemoryUsed ? "true" : "false"}`,
    `- structuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    "- iprMeaning: Identity Primary Record",
    "- iprFunction: operational attribution root",
    "- hbceMeaning: HERMETICUM B.C.E. computable governance layer",
    "- evtMeaning: Event Record / Verifiable Event Trace",
    input.degradedReason ? `- degradedReason: ${input.degradedReason}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  let body: ChatBody;

  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        state: "INVALID",
        decision: "BLOCK",
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  const input = normalizeBody(body);

  if (!input.message && input.files.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        state: "BLOCKED",
        decision: "BLOCK",
        error: "EMPTY_REQUEST"
      },
      { status: 400 }
    );
  }

  const effectiveMessage =
    input.message || "Usa i file attivi come contesto operativo.";

  if (input.files.length > 0) {
    storeDocumentMemory(input.sessionId, input.files);
  }

  const memory =
    input.files.length === 0 && shouldUseDocumentMemory(effectiveMessage)
      ? getDocumentMemory(input.sessionId)
      : null;

  const documentMemoryUsed = Boolean(memory);

  const effectiveFiles =
    input.files.length > 0
      ? input.files
      : memory
        ? buildFilesFromMemory(memory)
        : input.files;

  const structuredFormat = shouldUseStructuredFormat(effectiveMessage);
  const contextClass = classifyContext(effectiveMessage, effectiveFiles);

  const documentMode =
    contextClass === "DOCUMENTAL"
      ? detectDocumentMode(effectiveMessage)
      : "GENERAL_DOCUMENT_WORK";

  const documentFamily =
    contextClass === "DOCUMENTAL"
      ? memory?.documentFamily || detectDocumentFamily(effectiveFiles)
      : "GENERAL_DOCUMENT";

  if (isRuntimeDiagnosticRequest(effectiveMessage)) {
    const diagnosticState: RuntimeState = openai ? "OPERATIONAL" : "DEGRADED";
    const diagnosticDecision: RuntimeDecision = openai ? "ALLOW" : "ESCALATE";
    const degradedReason = openai ? null : "OPENAI_API_KEY_NOT_CONFIGURED";

    const event = buildEvent({
      prev: input.continuityRef,
      state: diagnosticState,
      decision: diagnosticDecision,
      message: effectiveMessage,
      contextClass,
      documentMode,
      documentFamily
    });

    const identity = getPrimaryIdentity();

    const responseText = buildRuntimeDiagnosticText({
      state: diagnosticState,
      decision: diagnosticDecision,
      contextClass,
      documentMode,
      documentFamily,
      documentMemoryUsed,
      structuredFormat,
      event,
      degradedReason
    });

    return NextResponse.json({
      ok: true,
      response: responseText.trim(),
      state: diagnosticState,
      decision: diagnosticDecision,
      contextClass,
      documentMode,
      documentFamily,
      documentMemoryUsed,
      structuredFormat,
      activeFiles: effectiveFiles.map((file) => file.name || "unnamed"),
      identity: {
        entity: identity.entity,
        ipr: identity.ipr,
        iprMeaning: "Identity Primary Record",
        iprFunction: "operational attribution root",
        hbceMeaning: "HERMETICUM B.C.E. computable governance layer",
        evt: identity.evt,
        state: identity.state,
        cycle: identity.cycle,
        core: identity.core
      },
      event,
      evt: {
        ok: true,
        evt: event.evt,
        prev: event.prev,
        hash: event.anchors.hash
      },
      diagnostics: {
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        modelUsed: MODEL,
        degradedReason,
        documentMemoryUsed,
        structuredFormat
      }
    });
  }

  const generated = await generateResponse({
    message: effectiveMessage,
    contextClass,
    documentMode,
    documentFamily,
    files: effectiveFiles,
    documentMemoryUsed,
    structuredFormat
  });

  const decision: RuntimeDecision =
    generated.state === "OPERATIONAL" ? "ALLOW" : "ESCALATE";

  const event = buildEvent({
    prev: input.continuityRef,
    state: generated.state,
    decision,
    message: effectiveMessage,
    contextClass,
    documentMode,
    documentFamily
  });

  const exposeRuntime = shouldExposeTechnicalFrame(effectiveMessage, contextClass);

  const responseText = exposeRuntime
    ? buildTechnicalFrame({
        response: generated.text,
        state: generated.state,
        decision,
        contextClass,
        documentMode,
        documentFamily,
        documentMemoryUsed,
        structuredFormat,
        event,
        degradedReason: generated.degradedReason
      })
    : generated.text;

  const identity = getPrimaryIdentity();

  return NextResponse.json({
    ok: true,
    response: responseText.trim(),
    state: generated.state,
    decision,
    contextClass,
    documentMode,
    documentFamily,
    documentMemoryUsed,
    structuredFormat,
    activeFiles: effectiveFiles.map((file) => file.name || "unnamed"),
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      iprMeaning: "Identity Primary Record",
      iprFunction: "operational attribution root",
      hbceMeaning: "HERMETICUM B.C.E. computable governance layer",
      evt: identity.evt,
      state: identity.state,
      cycle: identity.cycle,
      core: identity.core
    },
    event,
    evt: {
      ok: true,
      evt: event.evt,
      prev: event.prev,
      hash: event.anchors.hash
    },
    diagnostics: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      modelUsed: MODEL,
      degradedReason: generated.degradedReason || null,
      documentMemoryUsed,
      structuredFormat
    }
  });
}
