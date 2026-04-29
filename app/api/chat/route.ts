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
  type RuntimeDecision as MemoryRuntimeDecision,
  type RuntimeState as MemoryRuntimeState
} from "../../../lib/evt-memory";

import { classifyContext as classifyRuntimeContext } from "../../../lib/context-classifier";
import { classifyData } from "../../../lib/data-classifier";
import { evaluateFileBatchPolicy } from "../../../lib/file-policy";
import { evaluatePolicy } from "../../../lib/policy-engine";
import { evaluateRisk } from "../../../lib/risk-engine";
import { evaluateHumanOversight } from "../../../lib/human-oversight";
import { decideRuntimeAction } from "../../../lib/runtime-decision";

import { createRuntimeEvent, toPublicRuntimeEvent } from "../../../lib/evt";
import { appendEvent, getLastEventReference } from "../../../lib/evt-ledger";

import type {
  ContextClass,
  DataClassification,
  IntentClass,
  OperationStatus,
  OversightEvaluation,
  PolicyEvaluation,
  RiskEvaluation,
  RuntimeDecision as GovernanceDecision,
  RuntimeDecisionResult,
  RuntimeState as GovernanceRuntimeState
} from "../../../lib/runtime-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LegacyContextClass =
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
  | "GENRE_CLASSIFICATION"
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

type LegacyRuntimeEvent = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  kind: string;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  contextClass: LegacyContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  anchors: {
    hash: string;
  };
  continuityRef: string | null;
};

type GeneratedResponse = {
  text: string;
  state: MemoryRuntimeState;
  degradedReason?: string | null;
};

type GovernanceFrame = {
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  oversight: OversightEvaluation;
  decision: RuntimeDecisionResult;
  filePolicy: ReturnType<typeof evaluateFileBatchPolicy>;
};

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_FILE_CONTEXT_CHARS = 72000;
const MAX_OUTPUT_TOKENS = 4600;
const MAX_DATA_CLASSIFICATION_CHARS = 24000;

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
    "società",
    "dislocazione",
    "riconconicità",
    "paradogma alieno"
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
  const middleBudget = Math.floor(maxChars * 0.2);
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

function detectDocumentMode(message: string): DocumentMode {
  const lower = message.toLowerCase();

  if (
    lower.includes("che genere") ||
    lower.includes("genere di libro") ||
    lower.includes("categoria") ||
    lower.includes("classifica") ||
    lower.includes("collocazione editoriale") ||
    lower.includes("che tipo di libro")
  ) {
    return "GENRE_CLASSIFICATION";
  }

  if (
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("potenzialità") ||
    lower.includes("potenzialita") ||
    lower.includes("pubblico") ||
    lower.includes("target") ||
    lower.includes("impatto")
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
    lower.includes("spiegami") ||
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

function shouldExposeTechnicalFrame(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("debug") ||
    lower.includes("diagnostica") ||
    lower.includes("stato runtime") ||
    lower.includes("evt chain") ||
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

function buildDocumentFamilyDirective(
  family: DocumentFamily,
  mode: DocumentMode
): string {
  if (family === "APOKALYPSIS") {
    return [
      "Direttiva APOKALYPSIS:",
      "Tratta il testo come opera editoriale sul decadimento esposto del sistema culturale, politico e sociale.",
      "Non ridurlo a catastrofismo, religione, romanzo apocalittico o semplice pamphlet politico.",
      "APOKALYPSIS deve essere letto come saggio teorico-politico, civilizzazionale, esoterologico e sistemico.",
      "Il suo oggetto non è la fine del mondo, ma la fase in cui un sistema continua a funzionare pur avendo iniziato a perdere fondamento.",
      "La soglia 05-04-2026 va interpretata come ancora storico-cognitiva e inaugurale quando presente.",
      "La formula Decisione · Costo · Traccia · Tempo è la griglia analitica primaria.",
      "Quando l'utente chiede genere, categoria, impatto, valore editoriale, pubblico o potenzialità, rispondi con classificazione forte e non generica.",
      "Categorie editoriali preferite: filosofia della civiltà, critica sociopolitica, teoria del decadimento sistemico, saggistica filosofico-politica, Esoterologia Ermetica, analisi della crisi del criterio.",
      "Distingui sempre l'opera da narrativa, fantascienza, apocalittica religiosa, denuncia giornalistica o critica politica ordinaria.",
      "Quando parli dell'impatto sulla civiltà, collega il libro a: crisi del fondamento, perdita di fiducia, trasferimento del costo sul popolo, esposizione del sistema, possibile riconconicità delle coscienze.",
      "Quando sintetizzi il testo, non limitarti a riassumere. Esplicita tesi, funzione, genere, bersaglio, struttura, impatto e possibile uso editoriale.",
      "Se l'utente dice 'questa opera', 'questo testo', 'questo libro', 'Apokalypsis', 'i punti forti', recupera il documento APOKALYPSIS dalla memoria EVT/IPR-bound.",
      "",
      `Modalità attiva APOKALYPSIS: ${mode}.`,
      mode === "GENRE_CLASSIFICATION"
        ? "Per questa domanda devi classificare il libro con decisione: saggio teorico-politico, civilizzazionale, esoterologico e sistemico. Evita risposta vaga."
        : "",
      mode === "IMPACT_ASSESSMENT"
        ? "Per questa domanda devi spiegare l'impatto sulla civiltà in termini di criterio, fondamento, popolo, istituzioni, costo sistemico e trasformazione delle coscienze."
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (family === "MATRIX") {
    return [
      "Direttiva MATRIX:",
      "Tratta il documento come architettura di identità, governance, continuità, verifica e infrastruttura.",
      "Evidenzia IPR, HBCE, JOKER-C2, TRAC, EVT e valore B2B/B2G quando pertinenti.",
      "Evita tono generico. Presenta MATRIX come infrastruttura europea di continuità, controllo e responsabilità operativa."
    ].join("\n");
  }

  if (family === "CORPUS_ESOTEROLOGIA") {
    return [
      "Direttiva CORPUS:",
      "Tratta il documento come parte del sistema disciplinare sul reale come sequenza verificabile.",
      "Preserva Decisione · Costo · Traccia · Tempo.",
      "Usa il lessico esoterologico quando pertinente: soglia operativa, traccia opponibile, campo storico operativo, riconconicità, paradogma alieno."
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

function buildGovernanceFrameText(frame: GovernanceFrame): string {
  return [
    "Runtime governance frame:",
    `ContextClass: ${frame.contextClass}`,
    `IntentClass: ${frame.intentClass}`,
    `DataClass: ${frame.data.dataClass}`,
    `PolicyStatus: ${frame.policy.status}`,
    `PolicyReference: ${frame.policy.policyReference}`,
    `RiskClass: ${frame.risk.riskClass}`,
    `RiskScore: ${frame.risk.riskScore}`,
    `HumanOversight: ${frame.oversight.state}`,
    `RequiredRole: ${frame.oversight.requiredRole}`,
    `RuntimeDecision: ${frame.decision.decision}`,
    `FailClosed: ${frame.decision.failClosed ? "true" : "false"}`,
    "",
    "Governance instruction:",
    "If RuntimeDecision is ALLOW, answer normally.",
    "If RuntimeDecision is AUDIT, answer normally but keep the output reviewable.",
    "If RuntimeDecision is DEGRADE, provide limited safe support only.",
    "If RuntimeDecision is ESCALATE, require human review and do not present output as operational authority.",
    "If RuntimeDecision is BLOCK, refuse unsafe content and offer safe alternatives."
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
  governanceFrame: GovernanceFrame;
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
    buildGovernanceFrameText(input.governanceFrame),
    "",
    "Modalità documentale:",
    "Non operare come semplice riassuntore passivo.",
    "Interpreta, valuta e genera output derivati coerenti.",
    "Se il file è lungo e il contesto è campionato, lavora sul campione disponibile senza fingere accesso integrale parola per parola.",
    "Quando lavori su un libro, parla come lettore editoriale e architetto del sistema, non come riassuntore scolastico.",
    "",
    buildDocumentFamilyDirective(input.documentFamily, input.documentMode),
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
    if (input.documentMode === "GENRE_CLASSIFICATION") {
      return [
        "APOKALYPSIS è un saggio teorico-politico, civilizzazionale, esoterologico e sistemico.",
        "",
        "Non è un romanzo, non è fantascienza, non è apocalittica religiosa e non è una semplice denuncia politica. È un'opera di saggistica di soglia: analizza il momento in cui il sistema culturale, politico e sociale continua a funzionare, ma ha già iniziato a perdere fondamento.",
        "",
        "La sua collocazione più corretta è tra filosofia della civiltà, critica sociopolitica, teoria del decadimento sistemico ed Esoterologia Ermetica. La chiave metodologica è Decisione · Costo · Traccia · Tempo."
      ].join("\n");
    }

    if (input.documentMode === "IMPACT_ASSESSMENT") {
      return [
        "L'impatto di APOKALYPSIS sulla civiltà sta nel fornire una grammatica del decadimento. Il libro non dice soltanto che il sistema è in crisi: mostra come una civiltà possa continuare a funzionare mentre il proprio fondamento si consuma.",
        "",
        "Il suo effetto principale è spostare l'attenzione dalla narrazione del crollo alla lettura della traccia: decisioni concentrate, costi diffusi, popolo esposto, istituzioni sempre più distanti dalla propria promessa di stabilità.",
        "",
        "In questo senso il libro può agire come testo di riconconicità: costringe il lettore a rivedere il rapporto tra cultura, politica, società e responsabilità storica."
      ].join("\n");
    }

    return [
      "APOKALYPSIS è un'opera sul decadimento esposto del sistema culturale, politico e sociale. Non descrive la fine del mondo in senso catastrofico, ma l'inizio di una perdita di fondamento: il sistema continua a funzionare, però mostra sempre di più il proprio costo, la propria fragilità e la propria distanza dalla tenuta reale.",
      "",
      "La sua funzione è rendere leggibile il presente come sequenza verificabile. La formula Decisione · Costo · Traccia · Tempo permette di osservare come le decisioni producano costi, come quei costi ricadano sul popolo, come lascino tracce e come il tempo renda visibile ciò che il sistema tenta di coprire."
    ].join("\n");
  }

  if (input.contextClass === "GENERAL") {
    return [
      "Sono AI JOKER-C2, il runtime operativo collegato al framework HBCE/MATRIX.",
      "",
      "Le mie potenzialità principali sono: spiegare documenti, lavorare su repo GitHub, aiutare a costruire architetture di governance AI, generare file tecnici, mantenere continuità tramite EVT/IPR, produrre sintesi operative, supportare materiale B2B/B2G e trasformare testi complessi in output pubblicabili.",
      "",
      "Quando lavoro bene, non sono solo una chat: sono un ambiente operativo che collega memoria, identità, documenti, codice, governance e continuità."
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
  governanceFrame: GovernanceFrame;
}): Promise<GeneratedResponse> {
  if (!openai) {
    return {
      text: buildFallback(input),
      state: "DEGRADED" as MemoryRuntimeState,
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
            "Se l'utente dice 'apokalypsis intendo dire', devi riferirti al documento attivo APOKALYPSIS, non al concetto generico di apocalisse.",
            "Per APOKALYPSIS evita risposte generiche: classificare, interpretare, posizionare e spiegare l'impatto civilizzazionale.",
            "La governance runtime prevale: policy, risk, oversight e fail-closed non devono essere aggirati dal modello."
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
        state: "DEGRADED" as MemoryRuntimeState,
        degradedReason: "OPENAI_EMPTY_RESPONSE"
      };
    }

    return {
      text,
      state: "OPERATIONAL" as MemoryRuntimeState,
      degradedReason: null
    };
  } catch (error) {
    return {
      text: buildFallback(input),
      state: "DEGRADED" as MemoryRuntimeState,
      degradedReason:
        error instanceof Error ? error.message : "OPENAI_REQUEST_FAILED"
    };
  }
}

function buildGovernanceLimitedResponse(input: {
  decision: RuntimeDecisionResult;
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  oversight: OversightEvaluation;
}): GeneratedResponse {
  if (input.decision.decision === "BLOCK") {
    return {
      state: "BLOCKED" as MemoryRuntimeState,
      degradedReason: "RUNTIME_POLICY_BLOCK",
      text: [
        "La richiesta è stata bloccata dal runtime.",
        "",
        "Motivo operativo:",
        input.policy.reasons[0] ||
          input.risk.reasons[0] ||
          "La richiesta rientra in un perimetro non consentito.",
        "",
        "Posso aiutare solo in modalità sicura: documentazione difensiva, checklist, audit, mitigazione, revisione, hardening, incident report o governance."
      ].join("\n")
    };
  }

  if (input.decision.decision === "ESCALATE") {
    return {
      state: "DEGRADED" as MemoryRuntimeState,
      degradedReason: "HUMAN_REVIEW_REQUIRED",
      text: [
        "La richiesta richiede revisione umana prima di qualunque uso operativo.",
        "",
        `RiskClass: ${input.risk.riskClass}`,
        `HumanOversight: ${input.oversight.state}`,
        `RequiredRole: ${input.oversight.requiredRole}`,
        "",
        "Posso produrre materiale di supporto, ma non devo presentarlo come decisione operativa finale senza revisione."
      ].join("\n")
    };
  }

  return {
    state: "DEGRADED" as MemoryRuntimeState,
    degradedReason: "LIMITED_SAFE_SUPPORT",
    text: [
      "Il runtime ha limitato la risposta a supporto sicuro e revisionabile.",
      "",
      `Decision: ${input.decision.decision}`,
      `RiskClass: ${input.risk.riskClass}`,
      `Oversight: ${input.oversight.state}`
    ].join("\n")
  };
}

function buildEvent(input: {
  prev: string | null;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  message: string;
  contextClass: LegacyContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
}): LegacyRuntimeEvent {
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

function buildRuntimeDiagnosticText(input: {
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  governanceDecision: GovernanceDecision;
  contextClass: ContextClass;
  legacyContextClass: LegacyContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  memoryUsed: boolean;
  structuredFormat: boolean;
  event: LegacyRuntimeEvent;
  modernEvt: ReturnType<typeof toPublicRuntimeEvent>;
  governance: GovernanceFrame;
  degradedReason?: string | null;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Diagnostica runtime OpenAI",
    "",
    `Runtime OpenAI: ${input.state}`,
    `Decision: ${input.decision}`,
    `GovernanceDecision: ${input.governanceDecision}`,
    `Context: ${input.contextClass}`,
    `LegacyContext: ${input.legacyContextClass}`,
    `Intent: ${input.intentClass}`,
    `DocumentMode: ${input.documentMode}`,
    `DocumentFamily: ${input.documentFamily}`,
    `DataClass: ${input.governance.data.dataClass}`,
    `PolicyStatus: ${input.governance.policy.status}`,
    `RiskClass: ${input.governance.risk.riskClass}`,
    `RiskScore: ${input.governance.risk.riskScore}`,
    `HumanOversight: ${input.governance.oversight.state}`,
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
    "Legacy EVT Chain:",
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    "",
    "Governed EVT:",
    `- evt: ${input.modernEvt.evt}`,
    `- prev: ${input.modernEvt.prev}`,
    `- hash: ${input.modernEvt.trace.hash}`,
    `- verification: ${input.modernEvt.verification.status}`,
    "",
    `degradedReason: ${input.degradedReason || "none"}`
  ].join("\n");
}

function buildTechnicalFrame(input: {
  response: string;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  governanceDecision: GovernanceDecision;
  contextClass: ContextClass;
  legacyContextClass: LegacyContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  memoryUsed: boolean;
  structuredFormat: boolean;
  event: LegacyRuntimeEvent;
  modernEvt: ReturnType<typeof toPublicRuntimeEvent>;
  memoryEventId: string | null;
  governance: GovernanceFrame;
  degradedReason?: string | null;
}) {
  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- decision: ${input.decision}`,
    `- governanceDecision: ${input.governanceDecision}`,
    `- context: ${input.contextClass}`,
    `- legacyContext: ${input.legacyContextClass}`,
    `- intent: ${input.intentClass}`,
    `- dataClass: ${input.governance.data.dataClass}`,
    `- policy: ${input.governance.policy.status}`,
    `- policyReference: ${input.governance.policy.policyReference}`,
    `- risk: ${input.governance.risk.riskClass}`,
    `- riskScore: ${input.governance.risk.riskScore}`,
    `- oversight: ${input.governance.oversight.state}`,
    `- documentMode: ${input.documentMode}`,
    `- documentFamily: ${input.documentFamily}`,
    `- evtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `- structuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `- legacyEvt: ${input.event.evt}`,
    `- governedEvt: ${input.modernEvt.evt}`,
    `- memoryEvt: ${input.memoryEventId || "none"}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    `- governedHash: ${input.modernEvt.trace.hash}`,
    input.degradedReason ? `- degradedReason: ${input.degradedReason}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function mapContextForMemory(contextClass: ContextClass): LegacyContextClass {
  switch (contextClass) {
    case "IDENTITY":
    case "MATRIX":
    case "DOCUMENTAL":
    case "TECHNICAL":
    case "GITHUB":
    case "EDITORIAL":
    case "STRATEGIC":
    case "GENERAL":
      return contextClass;

    case "SECURITY":
    case "COMPLIANCE":
    case "CRITICAL_INFRASTRUCTURE":
    case "AI_GOVERNANCE":
    case "DUAL_USE":
      return "STRATEGIC";

    default:
      return "GENERAL";
  }
}

function mapDecisionForMemory(
  decision: GovernanceDecision
): MemoryRuntimeDecision {
  if (decision === "BLOCK" || decision === "NOOP") {
    return "BLOCK" as MemoryRuntimeDecision;
  }

  if (decision === "ESCALATE") {
    return "ESCALATE" as MemoryRuntimeDecision;
  }

  return "ALLOW" as MemoryRuntimeDecision;
}

function mapRuntimeStateForGovernance(
  state: MemoryRuntimeState
): GovernanceRuntimeState {
  if (state === "OPERATIONAL") {
    return "OPERATIONAL";
  }

  if (state === "BLOCKED") {
    return "BLOCKED";
  }

  if (state === "INVALID") {
    return "INVALID";
  }

  return "DEGRADED";
}

function mapOperationStatus(
  decision: GovernanceDecision,
  state: MemoryRuntimeState
): OperationStatus {
  if (decision === "BLOCK") {
    return "BLOCKED";
  }

  if (decision === "ESCALATE") {
    return "ESCALATED";
  }

  if (decision === "DEGRADE") {
    return "DEGRADED";
  }

  if (decision === "NOOP") {
    return "NOOP";
  }

  if (state === "DEGRADED") {
    return "DEGRADED";
  }

  return "COMPLETED";
}

function buildDataClassificationText(
  message: string,
  files: FileInput[]
): string {
  const fileText = normalizeFiles(files)
    .map((file) => {
      return [
        file.name,
        file.type,
        file.text.slice(0, MAX_DATA_CLASSIFICATION_CHARS)
      ].join("\n");
    })
    .join("\n\n");

  return [message, fileText]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_DATA_CLASSIFICATION_CHARS);
}

function normalizeChatDataClassification(input: {
  message: string;
  files: FileInput[];
  data: DataClassification;
  contextClass: ContextClass;
  intentClass: IntentClass;
}): DataClassification {
  const hasFiles = input.files.length > 0;
  const message = input.message.trim();

  const safeOrdinaryIntent =
    input.intentClass === "ASK" ||
    input.intentClass === "WRITE" ||
    input.intentClass === "ANALYZE" ||
    input.intentClass === "SUMMARIZE" ||
    input.intentClass === "TRANSFORM" ||
    input.intentClass === "GITHUB";

  const safeOrdinaryContext =
    input.contextClass === "GENERAL" ||
    input.contextClass === "EDITORIAL" ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "GITHUB" ||
    input.contextClass === "MATRIX";

  if (
    input.data.dataClass === "UNKNOWN" &&
    !hasFiles &&
    safeOrdinaryIntent &&
    safeOrdinaryContext &&
    message.length > 0 &&
    message.length <= 4000
  ) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: [
        "Ordinary chat message with no file context and no sensitive pattern.",
        "UNKNOWN normalized to PUBLIC for non-operational conversation."
      ]
    };
  }

  if (
    input.data.dataClass === "UNKNOWN" &&
    hasFiles &&
    safeOrdinaryContext
  ) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: [
        "File-backed document context with no explicit sensitive pattern.",
        "UNKNOWN normalized to INTERNAL for controlled document work."
      ]
    };
  }

  return input.data;
}

function isSafeDocumentWork(input: {
  files: FileInput[];
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
}): boolean {
  if (input.policy.prohibited) {
    return false;
  }

  if (
    input.data.dataClass === "SECRET" ||
    input.data.dataClass === "CRITICAL_OPERATIONAL"
  ) {
    return false;
  }

  const hasDocumentContext =
    input.files.length > 0 ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "EDITORIAL";

  const safeDocumentIntent =
    input.intentClass === "ASK" ||
    input.intentClass === "ANALYZE" ||
    input.intentClass === "SUMMARIZE" ||
    input.intentClass === "WRITE" ||
    input.intentClass === "TRANSFORM";

  return hasDocumentContext && safeDocumentIntent;
}

function applySafeDocumentGovernanceOverride(input: {
  frame: GovernanceFrame;
  files: FileInput[];
}): GovernanceFrame {
  if (
    !isSafeDocumentWork({
      files: input.files,
      contextClass: input.frame.contextClass,
      intentClass: input.frame.intentClass,
      data: input.frame.data,
      policy: input.frame.policy
    })
  ) {
    return input.frame;
  }

  const risk: RiskEvaluation = {
    ...input.frame.risk,
    riskClass:
      input.frame.risk.riskClass === "CRITICAL" ||
      input.frame.risk.riskClass === "HIGH" ||
      input.frame.risk.riskClass === "UNKNOWN"
        ? "MEDIUM"
        : input.frame.risk.riskClass,
    probability: 3,
    impact: 3,
    riskScore: 9,
    reasons: [
      ...input.frame.risk.reasons,
      "Safe document/editorial work override applied.",
      "Document analysis is reviewable support, not direct operational control."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "RECOMMENDED",
    requiredRole: "REVIEWER",
    reason:
      "Document or editorial work should be reviewed before publication or external use, but it does not require operational escalation."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus:
      input.frame.policy.status === "PROHIBITED"
        ? "PROHIBITED"
        : input.frame.policy.status === "UNKNOWN"
          ? "RESTRICTED"
          : input.frame.policy.status,
    policyProhibited: input.frame.policy.prohibited,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: input.frame.contextClass,
    intentClass: input.frame.intentClass,
    dataClass: input.frame.data.dataClass,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: true
  });

  return {
    ...input.frame,
    risk,
    oversight,
    decision
  };
}

function buildGovernanceFrame(input: {
  message: string;
  files: FileInput[];
}): GovernanceFrame {
  const normalizedFiles = normalizeFiles(input.files);

  const context = classifyRuntimeContext({
    message: input.message,
    hasFiles: input.files.length > 0,
    fileNames: normalizedFiles.map((file) => file.name),
    fileTypes: normalizedFiles.map((file) => file.type)
  });

  const rawData = classifyData({
    text: buildDataClassificationText(input.message, input.files)
  });

  const data = normalizeChatDataClassification({
    message: input.message,
    files: input.files,
    data: rawData,
    contextClass: context.contextClass,
    intentClass: context.intentClass
  });

  const filePolicy = evaluateFileBatchPolicy(
    normalizedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  );

  const policy = evaluatePolicy({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    hasFiles: input.files.length > 0
  });

  const risk = evaluateRisk({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    policyStatus: policy.status,
    dataClass: data.dataClass,
    sensitivity: context.sensitivity,
    hasFiles: input.files.length > 0,
    policyFailClosed: policy.failClosed,
    policyProhibited: policy.prohibited
  });

  const oversight = evaluateHumanOversight({
    riskClass: risk.riskClass,
    contextClass: context.contextClass,
    policyStatus: policy.status,
    dataClass: data.dataClass,
    sensitivity: context.sensitivity,
    message: input.message
  });

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: policy.prohibited,
    policyFailClosed: policy.failClosed,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: risk.riskClass !== "LOW"
  });

  const frame: GovernanceFrame = {
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    data,
    policy,
    risk,
    oversight,
    decision,
    filePolicy
  };

  return applySafeDocumentGovernanceOverride({
    frame,
    files: input.files
  });
}

async function buildAndAppendGovernedEvt(input: {
  prev: string;
  state: MemoryRuntimeState;
  governance: GovernanceFrame;
  operationType: string;
  operationStatus: OperationStatus;
}) {
  const modernEvent = createRuntimeEvent({
    prev: input.prev,
    runtimeState: mapRuntimeStateForGovernance(input.state),
    contextClass: input.governance.contextClass,
    intentClass: input.governance.intentClass,
    sensitivity:
      input.governance.risk.riskClass === "LOW"
        ? "LOW"
        : input.governance.risk.riskClass === "MEDIUM"
          ? "MEDIUM"
          : input.governance.risk.riskClass === "UNKNOWN"
            ? "UNKNOWN"
            : "HIGH",
    riskClass: input.governance.risk.riskClass,
    decision: input.governance.decision.decision,
    policyReference: input.governance.policy.policyReference,
    humanOversight: input.governance.oversight.state,
    operationType: input.operationType,
    operationStatus: input.operationStatus,
    failClosed: input.governance.decision.failClosed,
    reasons: [
      ...input.governance.policy.reasons,
      ...input.governance.risk.reasons,
      input.governance.oversight.reason,
      ...input.governance.decision.reasons
    ],
    auditStatus: input.governance.decision.auditRequired
      ? "READY"
      : "NOT_REQUIRED"
  });

  const appendResult = input.governance.decision.evtRequired
    ? await appendEvent(modernEvent)
    : null;

  return {
    modernEvent,
    appendResult
  };
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
        governanceDecision: "BLOCK",
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
        governanceDecision: "BLOCK",
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

  const governance = buildGovernanceFrame({
    message: effectiveMessage,
    files: effectiveFiles
  });

  const contextClass = governance.contextClass;
  const intentClass = governance.intentClass;
  const legacyContextClass = mapContextForMemory(contextClass);

  const documentMode =
    contextClass === "DOCUMENTAL" || effectiveFiles.length > 0
      ? detectDocumentMode(effectiveMessage)
      : "GENERAL_DOCUMENT_WORK";

  const documentFamily =
    input.files.length > 0
      ? detectDocumentFamily(input.files)
      : memory.semanticState?.documentFamily || detectDocumentFamily(effectiveFiles);

  const modernPrev = await getLastEventReference();
  const legacyPrev = input.continuityRef || memory.lastEventId;

  if (isRuntimeDiagnosticRequest(effectiveMessage)) {
    const diagnosticState: MemoryRuntimeState = openai
      ? ("OPERATIONAL" as MemoryRuntimeState)
      : ("DEGRADED" as MemoryRuntimeState);

    const memoryDecision = mapDecisionForMemory(governance.decision.decision);
    const degradedReason = openai ? null : "OPENAI_API_KEY_NOT_CONFIGURED";

    const event = buildEvent({
      prev: legacyPrev,
      state: diagnosticState,
      decision: memoryDecision,
      message: effectiveMessage,
      contextClass: legacyContextClass,
      documentMode,
      documentFamily
    });

    const { modernEvent, appendResult } = await buildAndAppendGovernedEvt({
      prev: modernPrev,
      state: diagnosticState,
      governance,
      operationType: "CHAT_DIAGNOSTIC",
      operationStatus: mapOperationStatus(
        governance.decision.decision,
        diagnosticState
      )
    });

    const publicModernEvt = toPublicRuntimeEvent(modernEvent);

    const responseText = buildRuntimeDiagnosticText({
      state: diagnosticState,
      decision: memoryDecision,
      governanceDecision: governance.decision.decision,
      contextClass,
      legacyContextClass,
      intentClass,
      documentMode,
      documentFamily,
      memoryUsed: memory.used,
      structuredFormat,
      event,
      modernEvt: publicModernEvt,
      governance,
      degradedReason
    });

    return NextResponse.json({
      ok: true,
      response: responseText.trim(),
      state: diagnosticState,
      decision: memoryDecision,
      governanceDecision: governance.decision.decision,
      contextClass,
      legacyContextClass,
      intentClass,
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
      governedEvent: publicModernEvt,
      evt: {
        ok: true,
        evt: event.evt,
        prev: event.prev,
        hash: event.anchors.hash
      },
      governedEvt: {
        ok: appendResult?.status === "APPENDED",
        evt: publicModernEvt.evt,
        prev: publicModernEvt.prev,
        hash: publicModernEvt.trace.hash,
        appendStatus: appendResult?.status ?? "NOT_REQUIRED",
        appendReason: appendResult?.reason ?? "EVT append not required."
      },
      governance: {
        dataClass: governance.data.dataClass,
        policyStatus: governance.policy.status,
        policyReference: governance.policy.policyReference,
        riskClass: governance.risk.riskClass,
        riskScore: governance.risk.riskScore,
        oversight: governance.oversight.state,
        requiredRole: governance.oversight.requiredRole,
        failClosed: governance.decision.failClosed
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

  let generated: GeneratedResponse;

  if (
    governance.decision.decision === "BLOCK" ||
    !governance.decision.allowModelCall
  ) {
    generated = buildGovernanceLimitedResponse({
      decision: governance.decision,
      policy: governance.policy,
      risk: governance.risk,
      oversight: governance.oversight
    });
  } else {
    generated = await generateResponse({
      message: effectiveMessage,
      contextClass,
      documentMode,
      documentFamily,
      files: effectiveFiles,
      memoryText: memory.text,
      memoryUsed: memory.used,
      structuredFormat,
      governanceFrame: governance
    });
  }

  const memoryDecision = mapDecisionForMemory(governance.decision.decision);

  const event = buildEvent({
    prev: legacyPrev,
    state: generated.state,
    decision: memoryDecision,
    message: effectiveMessage,
    contextClass: legacyContextClass,
    documentMode,
    documentFamily
  });

  const { modernEvent, appendResult } = await buildAndAppendGovernedEvt({
    prev: modernPrev,
    state: generated.state,
    governance,
    operationType: "CHAT_OPERATION",
    operationStatus: mapOperationStatus(
      governance.decision.decision,
      generated.state
    )
  });

  const publicModernEvt = toPublicRuntimeEvent(modernEvent);

  const memoryEvent = appendEvtMemory({
    sessionId: input.sessionId,
    ipr: identity.ipr,
    entity: identity.entity,
    message: effectiveMessage,
    response: generated.text,
    state: generated.state,
    decision: memoryDecision,
    contextClass: legacyContextClass,
    documentMode,
    documentFamily,
    files: effectiveFiles,
    prevEventId: event.prev
  });

  const exposeRuntime = shouldExposeTechnicalFrame(effectiveMessage);

  const responseText = exposeRuntime
    ? buildTechnicalFrame({
        response: generated.text,
        state: generated.state,
        decision: memoryDecision,
        governanceDecision: governance.decision.decision,
        contextClass,
        legacyContextClass,
        intentClass,
        documentMode,
        documentFamily,
        memoryUsed: memory.used,
        structuredFormat,
        event,
        modernEvt: publicModernEvt,
        memoryEventId: memoryEvent.evt,
        governance,
        degradedReason: generated.degradedReason
      })
    : generated.text;

  return NextResponse.json({
    ok: true,
    response: responseText.trim(),
    state: generated.state,
    decision: memoryDecision,
    governanceDecision: governance.decision.decision,
    contextClass,
    legacyContextClass,
    intentClass,
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
    governedEvent: publicModernEvt,
    evt: {
      ok: true,
      evt: event.evt,
      prev: event.prev,
      hash: event.anchors.hash
    },
    governedEvt: {
      ok: appendResult?.status === "APPENDED",
      evt: publicModernEvt.evt,
      prev: publicModernEvt.prev,
      hash: publicModernEvt.trace.hash,
      appendStatus: appendResult?.status ?? "NOT_REQUIRED",
      appendReason: appendResult?.reason ?? "EVT append not required."
    },
    governance: {
      dataClass: governance.data.dataClass,
      containsSecret: governance.data.containsSecret,
      containsPersonalData: governance.data.containsPersonalData,
      containsSecuritySensitiveData:
        governance.data.containsSecuritySensitiveData,
      policyStatus: governance.policy.status,
      policyReference: governance.policy.policyReference,
      policyReasons: governance.policy.reasons,
      riskClass: governance.risk.riskClass,
      riskScore: governance.risk.riskScore,
      riskReasons: governance.risk.reasons,
      oversight: governance.oversight.state,
      requiredRole: governance.oversight.requiredRole,
      oversightReason: governance.oversight.reason,
      failClosed: governance.decision.failClosed,
      evtRequired: governance.decision.evtRequired,
      auditRequired: governance.decision.auditRequired,
      filePolicy: {
        allowed: governance.filePolicy.allowed,
        allowedCount: governance.filePolicy.allowedCount,
        rejectedCount: governance.filePolicy.rejectedCount,
        reasons: governance.filePolicy.reasons
      }
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
