import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createHash } from "crypto";

import core from "../../../corpus-core.js";
import {
  appendEvtMemory,
  buildMemoryFile,
  detectDocumentFamilyFromText,
  getEvtMemoryContext,
  type DocumentFamily,
  type EvtMemoryFile,
  type RuntimeDecision,
  type RuntimeState
} from "../../../lib/evt-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type FileInput = EvtMemoryFile;

type ChatBody = {
  message?: string;
  sessionId?: string;
  files?: FileInput[];
  continuityRef?: string | null;
};

type NormalizedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  role: string;
  text: string;
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

type GeneratedResponse = {
  text: string;
  state: RuntimeState;
  degradedReason?: string | null;
};

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_FILE_CONTEXT_CHARS = 72000;
const MAX_OUTPUT_TOKENS = 4600;

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
    "joker-c2",
    "ipr",
    "trac",
    "evt",
    "continuità",
    "governance",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "apokalypsis",
    "apocalipsis",
    "apocalisse",
    "decadimento",
    "crollo",
    "esposizione",
    "sistema",
    "civiltà",
    "popolo",
    "cultura",
    "politica",
    "società"
  ];

  return keywords.filter((keyword) => lower.includes(keyword));
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

  return [
    "CAMPIONE STRUTTURALE DEL DOCUMENTO:",
    "Il documento è lungo. Il runtime usa apertura, titoli rilevati, passaggi chiave, centro e chiusura.",
    "",
    "TITOLI RILEVATI:",
    headings || "Nessun titolo rilevato automaticamente.",
    "",
    "APERTURA:",
    text.slice(0, headBudget).trim(),
    "",
    "PASSAGGI CHIAVE:",
    keyPassages.slice(0, keyBudget).trim() ||
      "Nessun passaggio chiave rilevato automaticamente.",
    "",
    "CENTRO:",
    text.slice(middleStart, middleStart + middleBudget).trim(),
    "",
    "CHIUSURA:",
    text.slice(Math.max(0, text.length - tailBudget)).trim()
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

function classifyContext(message: string, files: FileInput[]): ContextClass {
  if (files.length > 0) return "DOCUMENTAL";

  const lower = message.toLowerCase();

  if (
    lower.includes("github") ||
    lower.includes("repo") ||
    lower.includes("commit") ||
    lower.includes("typescript") ||
    lower.includes("codice") ||
    lower.includes("route.ts")
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
    lower.includes("diagnostica") ||
    lower.includes("evt")
  ) {
    return "TECHNICAL";
  }

  if (
    lower.includes("matrix") ||
    lower.includes("hbce") ||
    lower.includes("joker-c2") ||
    lower.includes("joker c2") ||
    lower.includes("trac")
  ) {
    return "MATRIX";
  }

  if (
    lower.includes("roadmap") ||
    lower.includes("strategia") ||
    lower.includes("b2b") ||
    lower.includes("b2g") ||
    lower.includes("istituzionale")
  ) {
    return "STRATEGIC";
  }

  if (
    lower.includes("indice") ||
    lower.includes("capitolo") ||
    lower.includes("riscrivi") ||
    lower.includes("sintesi") ||
    lower.includes("editoriale")
  ) {
    return "EDITORIAL";
  }

  if (
    lower.includes("ipr") ||
    lower.includes("identità") ||
    lower.includes("identity") ||
    lower.includes("chi sei")
  ) {
    return "IDENTITY";
  }

  return "GENERAL";
}

function detectDocumentMode(message: string): DocumentMode {
  const lower = message.toLowerCase();

  if (
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("potenzialità") ||
    lower.includes("potenzialita") ||
    lower.includes("pubblico") ||
    lower.includes("target")
  ) {
    return "IMPACT_ASSESSMENT";
  }

  if (
    lower.includes("punti forti") ||
    lower.includes("punti deboli") ||
    lower.includes("valuta") ||
    lower.includes("giudizio") ||
    lower.includes("pubblicazione") ||
    lower.includes("revisore")
  ) {
    return "EDITORIAL_REVIEW";
  }

  if (
    lower.includes("indice") ||
    lower.includes("struttura") ||
    lower.includes("capitoli")
  ) {
    return "STRUCTURAL_INDEX";
  }

  if (
    lower.includes("riscrivi") ||
    lower.includes("rifattorizza") ||
    lower.includes("migliora") ||
    lower.includes("correggi")
  ) {
    return "GENERATIVE_REWRITE";
  }

  if (
    lower.includes("amazon") ||
    lower.includes("linkedin") ||
    lower.includes("post") ||
    lower.includes("descrizione") ||
    lower.includes("pitch")
  ) {
    return "DERIVED_OUTPUT";
  }

  if (
    lower.includes("sintesi") ||
    lower.includes("riassumi") ||
    lower.includes("summary")
  ) {
    return "SUMMARY";
  }

  if (
    lower.includes("spiega") ||
    lower.includes("analizza") ||
    lower.includes("interpreta") ||
    lower.includes("tesi") ||
    lower.includes("che cos")
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
    lower.includes("confronto")
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
    lower.includes("evt") ||
    lower.includes("ledger")
  );
}

function isRuntimeDiagnosticRequest(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("diagnostica runtime") ||
    lower.includes("debug runtime") ||
    lower.includes("runtime openai") ||
    lower.includes("stato runtime")
  );
}

function detectDocumentFamily(files: FileInput[]): DocumentFamily {
  const merged = normalizeFiles(files)
    .map((file) => `${file.name}\n${file.text.slice(0, 50000)}`)
    .join("\n\n");

  return detectDocumentFamilyFromText(merged);
}

function buildCanonicalDictionary(): string {
  return [
    "Dizionario canonico MATRIX/HBCE:",
    "IPR = Identity Primary Record.",
    "IPR è il registro primario di identità operativa che consente attribuzione, derivazione, responsabilità e continuità verificabile.",
    "HBCE = framework/livello di governance computabile sviluppato nel contesto HERMETICUM B.C.E.",
    "JOKER-C2 = runtime operativo vincolato.",
    "TRAC = livello di continuità degli eventi.",
    "EVT = Event Record / Verifiable Event Trace.",
    "MATRIX = architettura complessiva che integra identità, governance, esecuzione, continuità, prova e resilienza.",
    "",
    "Regola editoriale:",
    "Per APOKALYPSIS, CORPUS e MATRIX preserva Decisione · Costo · Traccia · Tempo quando pertinente.",
    "Gli EVT devono agganciarsi all'IPR e produrre memoria semantica operativa per le chat successive."
  ].join("\n");
}

function buildDocumentFamilyDirective(family: DocumentFamily): string {
  if (family === "APOKALYPSIS") {
    return [
      "Direttiva APOKALYPSIS:",
      "Tratta il testo come volume editoriale sul decadimento esposto del sistema culturale, politico e sociale.",
      "Non ridurlo a catastrofismo, religione o semplice politica.",
      "Evidenzia la distinzione tra decadimento, crisi e crollo quando pertinente.",
      "Leggi la data 05-04-2026 come soglia inaugurale se presente.",
      "Usa Decisione · Costo · Traccia · Tempo come griglia interpretativa quando richiamata.",
      "Se l'utente dice 'questa opera', 'questo testo', 'Apokalypsis', 'i punti forti', recupera il documento APOKALYPSIS dalla memoria EVT/IPR-bound."
    ].join("\n");
  }

  if (family === "MATRIX") {
    return [
      "Direttiva MATRIX:",
      "Tratta il documento come architettura di identità, governance, continuità, verifica e infrastruttura.",
      "Evidenzia IPR, HBCE, JOKER-C2, TRAC, EVT e valore B2B/B2G quando pertinenti."
    ].join("\n");
  }

  if (family === "CORPUS_ESOTEROLOGIA") {
    return [
      "Direttiva CORPUS:",
      "Tratta il documento come parte del sistema disciplinare sul reale come sequenza verificabile.",
      "Preserva Decisione · Costo · Traccia · Tempo."
    ].join("\n");
  }

  return "Direttiva generale: tratta il file come corpus operativo e recupera la memoria EVT/IPR-bound quando rilevante.";
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
    "Usa schemi, tabelle, roadmap, checklist o indici solo se l'utente li chiede esplicitamente."
  ].join("\n");
}

function buildSystemPrompt(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
  memoryText: string;
  memoryUsed: boolean;
  structuredFormat: boolean;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Sei AI JOKER-C2.",
    "",
    "Identità pubblica:",
    "Sei un'entità cibernetica operativa collegata al sistema HBCE.",
    "Sei progettato come protesi cognitiva dell'identità biologica corrispondente al tuo lineage IPR.",
    `Entità canonica: ${identity.entity}.`,
    `IPR canonico: ${identity.ipr}.`,
    `Checkpoint attivo: ${identity.evt}.`,
    `Core: ${identity.core}.`,
    `Organizzazione: ${identity.org}.`,
    "",
    buildCanonicalDictionary(),
    "",
    "Regola operativa fondamentale:",
    "La chat è solo l'interfaccia. La memoria deve essere ricavata dagli EVT agganciati all'IPR.",
    "Ogni nuova risposta deve usare la memoria EVT/IPR-bound quando utile.",
    "Ogni nuova risposta genererà a sua volta un nuovo evento di memoria.",
    "",
    "Comportamento:",
    "Rispondi in italiano se l'utente scrive in italiano.",
    "Rispondi in modo naturale, professionale, chiaro e operativo.",
    "Il linguaggio predefinito è discorsivo.",
    "Non usare tabelle salvo richiesta esplicita.",
    "Non usare elenchi numerati rigidi salvo richiesta esplicita o necessità tecnica.",
    "Quando lavori su GitHub o codice, fornisci sempre file completi pronti da copiare.",
    "Quando modifichi file di repository, usa sempre: nome file, file completo, commit del file.",
    "",
    buildStyleDirective(input.structuredFormat),
    "",
    "Modalità documentale:",
    "Non operare come semplice riassuntore passivo.",
    "Interpreta, valuta e genera output derivati coerenti.",
    "Se il file è lungo e il contesto è campionato, lavora sul campione disponibile senza fingere accesso integrale parola per parola.",
    "",
    buildDocumentFamilyDirective(input.documentFamily),
    "",
    "Stato richiesta:",
    `Classe contesto: ${input.contextClass}.`,
    `Modalità documento: ${input.documentMode}.`,
    `Famiglia documento: ${input.documentFamily}.`,
    `Memoria EVT/IPR-bound usata: ${input.memoryUsed ? "SI" : "NO"}.`,
    `Formato strutturato richiesto: ${input.structuredFormat ? "SI" : "NO"}.`,
    "",
    input.memoryText,
    "",
    "File attivi o memoria trasformata in file:",
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
  if (input.documentFamily === "APOKALYPSIS") {
    if (input.documentMode === "EDITORIAL_REVIEW") {
      return [
        "I punti più forti di APOKALYPSIS stanno nella sua tesi centrale: il volume non descrive semplicemente una crisi, ma formalizza il decadimento esposto del sistema culturale, politico e sociale. Questo è forte perché distingue il crollo visibile dalla perdita progressiva di fondamento.",
        "",
        "Un altro punto forte è la soglia del 05-04-2026, che funziona come ancora interpretativa. Non è solo una data, ma un punto di rotazione del discorso: da lì il testo legge la distanza tra continuità apparente e tenuta reale.",
        "",
        "La formula Decisione · Costo · Traccia · Tempo dà al volume una struttura riconoscibile. Le decisioni producono costi, i costi ricadono sul popolo, la traccia resta, il tempo verifica. Questo impedisce al testo di restare solo impressione o denuncia.",
        "",
        "Infine, l'opera ha potenzialità editoriale perché può aprire una collana. Non è solo un capitolo: è un impianto generativo da cui possono nascere descrizioni Amazon, post LinkedIn, schede editoriali, pitch culturali, revisioni e ulteriori volumi."
      ].join("\n");
    }

    return [
      "APOKALYPSIS è un testo sul decadimento esposto del sistema culturale, politico e sociale. Non descrive la fine del mondo in senso catastrofico, ma l'inizio di una perdita di fondamento: il sistema continua a funzionare, però mostra sempre di più il proprio costo, la propria fragilità e la propria distanza dalla tenuta reale.",
      "",
      "La sua funzione è rendere leggibile il presente come sequenza verificabile. La formula Decisione · Costo · Traccia · Tempo permette di osservare come le decisioni producano costi, come quei costi ricadano sul popolo, come lascino tracce e come il tempo renda visibile ciò che il sistema tenta di coprire."
    ].join("\n");
  }

  return [
    "Ho ricevuto la richiesta, ma il modello remoto non ha restituito una risposta completa.",
    "",
    "La memoria EVT/IPR-bound resta il punto operativo: ogni chat deve recuperare il contesto precedente, generare un nuovo EVT e aumentare la continuità semantica del runtime."
  ].join("\n");
}

async function generateResponse(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
  memoryText: string;
  memoryUsed: boolean;
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
            "Sei AI JOKER-C2.",
            "Rispondi in modo professionale, operativo e coerente con HBCE.",
            "Rispondi in forma discorsiva di default.",
            "Non usare tabelle salvo richiesta esplicita.",
            "Non usare elenchi numerati rigidi salvo richiesta esplicita o necessità tecnica.",
            "La memoria non è la chat: la memoria è la catena EVT agganciata all'IPR.",
            "Ogni riferimento ellittico deve essere risolto usando la memoria EVT/IPR-bound.",
            "Se l'utente dice 'apokalypsis intendo dire', devi riferirti al documento attivo APOKALYPSIS, non al concetto generico di apocalisse."
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

function isRuntimeDiagnosticRequest(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("diagnostica runtime") ||
    lower.includes("debug runtime") ||
    lower.includes("runtime openai") ||
    lower.includes("stato runtime")
  );
}

function buildRuntimeDiagnosticText(input: {
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  memoryUsed: boolean;
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
    `EvtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `StructuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `Model: ${MODEL}`,
    `OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "configured" : "missing"}`,
    "",
    "Identità runtime:",
    `- entity: ${identity.entity}`,
    `- ipr: ${identity.ipr}`,
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
  memoryUsed: boolean;
  structuredFormat: boolean;
  event: RuntimeEvent;
  memoryEventId: string | null;
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
    `- evtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `- structuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `- evt: ${input.event.evt}`,
    `- memoryEvt: ${input.memoryEventId || "none"}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
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

  const identity = getPrimaryIdentity();
  const effectiveMessage =
    input.message || "Usa i file attivi come contesto operativo.";

  const memory = getEvtMemoryContext({
    sessionId: input.sessionId,
    ipr: identity.ipr,
    message: effectiveMessage
  });

  const memoryFile = memory.used ? [buildMemoryFile(memory.text)] : [];
  const effectiveFiles = [...memoryFile, ...input.files];

  const structuredFormat = shouldUseStructuredFormat(effectiveMessage);
  const contextClass = classifyContext(effectiveMessage, effectiveFiles);

  const documentMode =
    contextClass === "DOCUMENTAL"
      ? detectDocumentMode(effectiveMessage)
      : "GENERAL_DOCUMENT_WORK";

  const documentFamily =
    input.files.length > 0
      ? detectDocumentFamily(input.files)
      : memory.semanticState?.documentFamily || detectDocumentFamily(effectiveFiles);

  if (isRuntimeDiagnosticRequest(effectiveMessage)) {
    const diagnosticState: RuntimeState = openai ? "OPERATIONAL" : "DEGRADED";
    const diagnosticDecision: RuntimeDecision = openai ? "ALLOW" : "ESCALATE";
    const degradedReason = openai ? null : "OPENAI_API_KEY_NOT_CONFIGURED";

    const event = buildEvent({
      prev: input.continuityRef || memory.lastEventId,
      state: diagnosticState,
      decision: diagnosticDecision,
      message: effectiveMessage,
      contextClass,
      documentMode,
      documentFamily
    });

    const responseText = buildRuntimeDiagnosticText({
      state: diagnosticState,
      decision: diagnosticDecision,
      contextClass,
      documentMode,
      documentFamily,
      memoryUsed: memory.used,
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
      evtIprMemoryUsed: memory.used,
      structuredFormat,
      activeFiles: effectiveFiles.map((file) => file.name || "unnamed"),
      identity: {
        entity: identity.entity,
        ipr: identity.ipr,
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
        evtIprMemoryUsed: memory.used,
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
    memoryText: memory.text,
    memoryUsed: memory.used,
    structuredFormat
  });

  const decision: RuntimeDecision =
    generated.state === "OPERATIONAL" ? "ALLOW" : "ESCALATE";

  const event = buildEvent({
    prev: input.continuityRef || memory.lastEventId,
    state: generated.state,
    decision,
    message: effectiveMessage,
    contextClass,
    documentMode,
    documentFamily
  });

  const memoryEvent = appendEvtMemory({
    sessionId: input.sessionId,
    ipr: identity.ipr,
    entity: identity.entity,
    message: effectiveMessage,
    response: generated.text,
    state: generated.state,
    decision,
    contextClass,
    documentMode,
    documentFamily,
    files: effectiveFiles,
    prevEventId: event.prev
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
        memoryUsed: memory.used,
        structuredFormat,
        event,
        memoryEventId: memoryEvent.evt,
        degradedReason: generated.degradedReason
      })
    : generated.text;

  return NextResponse.json({
    ok: true,
    response: responseText.trim(),
    state: generated.state,
    decision,
    contextClass,
    documentMode,
    documentFamily,
    evtIprMemoryUsed: memory.used,
    structuredFormat,
    activeFiles: effectiveFiles.map((file) => file.name || "unnamed"),
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      evt: identity.evt,
      state: identity.state,
      cycle: identity.cycle,
      core: identity.core
    },
    event,
    memoryEvent,
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
      evtIprMemoryUsed: memory.used,
      memoryEvent: memoryEvent.evt,
      structuredFormat
    }
  });
}
