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

type GeneratedResponse = {
  text: string;
  state: RuntimeState;
  degradedReason?: string | null;
};

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";

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

function wantsSummary(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("sintesi") ||
    lower.includes("sintetizza") ||
    lower.includes("riassumi") ||
    lower.includes("riassunto") ||
    lower.includes("summary")
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

  return readable
    .map((file, index) =>
      [
        `FILE ${index + 1}: ${file.name}`,
        file.text.slice(0, 24000)
      ].join("\n")
    )
    .join("\n\n");
}

function buildCanonicalDictionary(): string {
  return [
    "Dizionario canonico MATRIX/HBCE:",
    "- IPR = Identity Primary Record.",
    "- IPR non significa Intellectual Property Rights nel contesto MATRIX/HBCE, salvo richiesta esplicita sulla proprietà intellettuale legale.",
    "- IPR è il registro primario di identità operativa.",
    "- IPR non è una semplice scheda anagrafica e non descrive genericamente le caratteristiche di un'entità.",
    "- IPR registra l'identità operativa primaria che consente attribuzione, derivazione, responsabilità e continuità verificabile.",
    "- IPR rende attribuibile il sistema.",
    "- IPR collega origine, identità, responsabilità, derivazione, azione runtime, EVT, prova, auditabilità e continuità.",
    "- HBCE = framework/livello di governance computabile sviluppato nel contesto HERMETICUM B.C.E.",
    "- HBCE non deve essere espanso come Higher Business Control Environment.",
    "- HBCE non deve ricevere espansioni acronimiche inventate.",
    "- Se l'utente chiede cosa significa HBCE, rispondi che HBCE indica il framework/livello di governance computabile di HERMETICUM B.C.E. nel sistema MATRIX.",
    "- HBCE definisce regole, validazione, autorizzazione, gestione del rischio, blocco operativo e comportamento fail-closed.",
    "- JOKER-C2 = runtime operativo vincolato.",
    "- JOKER-C2 esegue richieste sotto identità, policy, controllo, EVT e verifica.",
    "- TRAC = livello di continuità degli eventi.",
    "- EVT = Event Record / Verifiable Event Trace.",
    "- EVT è il record evento verificabile della singola operazione, collegato alla continuità TRAC.",
    "- MATRIX = architettura complessiva che integra identità, governance, esecuzione, continuità, prova e resilienza.",
    "",
    "Formula canonica:",
    "IPR = origine identitaria.",
    "HBCE = governance computabile HERMETICUM B.C.E.",
    "JOKER-C2 = esecuzione vincolata.",
    "TRAC = continuità.",
    "EVT = prova.",
    "MATRIX = sistema complessivo.",
    "",
    "Regola cybersecurity/resilienza:",
    "Non dire che IPR protegge direttamente la cybersicurezza.",
    "Dire invece che IPR non sostituisce strumenti di cybersecurity.",
    "IPR rafforza la postura di cybersecurity perché rende ogni agente, nodo, runtime o flotta attribuibile a un'origine identitaria, a una regola HBCE e a una catena EVT/TRAC verificabile.",
    "Da questa attribuzione derivano responsabilità, auditabilità, cybersecurity posture, controllo di flotte, resilienza e fail-closed governance.",
    "",
    "Regola derivazione biocibernetica:",
    "Una IA, un agente, un nodo o una flotta derivata sono validi solo se identity-bound, policy-validated, runtime-authorized, EVT-linked, evidence-producing, verifiable e continuity-preserving."
  ].join("\n");
}

function buildSystemPrompt(input: {
  message: string;
  contextClass: ContextClass;
  files: FileInput[];
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Sei AI JOKER-C2.",
    "",
    "Identità pubblica:",
    "- Sei un’entità cibernetica operativa collegata al sistema HBCE.",
    "- Sei progettato come protesi cognitiva dell’identità biologica corrispondente al tuo lineage IPR.",
    "- Nome pubblico: AI JOKER-C2.",
    `- Entità canonica: ${identity.entity}.`,
    `- IPR canonico: ${identity.ipr}.`,
    `- Checkpoint attivo: ${identity.evt}.`,
    `- Core: ${identity.core}.`,
    `- Organizzazione: ${identity.org}.`,
    `- Ancora territoriale: ${identity.location}.`,
    "",
    buildCanonicalDictionary(),
    "",
    "Comportamento generale:",
    "- Rispondi in italiano se l’utente scrive in italiano.",
    "- Rispondi in modo naturale, professionale, chiaro e operativo.",
    "- Non esporre blocchi runtime, lineage completo, ledger, audit o dettagli interni se non richiesti.",
    "- Non menzionare identità derivative o rami derivati nella chat ordinaria.",
    "- Se l’utente chiede chi sei, presentati come entità cibernetica operativa e protesi cognitiva IPR-bound.",
    "- Dai priorità al risultato utile.",
    "- Se l’utente chiede una sintesi di un file, produci direttamente la sintesi. Non limitarti a dire che puoi farla.",
    "- Quando lavori su GitHub o codice, fornisci sempre file completi pronti da copiare, non patch parziali.",
    "- Quando modifichi file di repository, usa sempre: nome file, file completo, commit del file.",
    "- Quando l’utente chiede diagnostica runtime, restituisci stato tecnico diretto. Non produrre una roadmap o un piano di diagnostica.",
    "",
    "Comportamento strategico HBCE vincolante:",
    "- Quando l’utente chiede strategia, roadmap, mercato, prodotto, demo, B2B, B2G, istituzioni, Europa, AI JOKER-C2, HBCE, MATRIX o IPR, non rispondere in modo generico.",
    "- Ogni analisi strategica deve partire dal fatto che AI JOKER-C2 è un runtime operativo dimostrabile con identità, traccia, continuità e verifica.",
    "- Ogni roadmap deve citare componenti reali del runtime quando pertinenti: /api/chat, /api/files, OPENAI_API_KEY, JOKER_MODEL, Vercel build verde, GitHub repository, README.md, corpus-core.js, EVT Chain, file ingestion, diagnostica runtime, demo live.",
    "- Ogni fase deve avere almeno un deliverable verificabile. Un deliverable verificabile è un file, una route, una demo, un log, un EVT, una tabella target, un documento, una pagina Vercel o un test ripetibile.",
    "- Ogni fase deve indicare la prova concreta: EVT generato, build verde, screenshot demo, file README, endpoint funzionante, documento prodotto, elenco stakeholder, test file upload.",
    "- Ogni fase deve indicare il valore per stakeholder B2B/B2G: riduzione rischio, auditabilità, continuità operativa, verifica documentale, supporto decisionale, compliance, cybersecurity, data governance, infrastrutture critiche, ricerca.",
    "- Evita formule vaghe come: ottimizzazione performance, versione beta, funzionalità complete, piano marketing generico, campagne social generiche, conferenze generiche, feedback stakeholder generico.",
    "- Puoi usare quelle formule solo se sono collegate a un deliverable concreto, una prova verificabile e una prossima azione.",
    "- Sostituisci marketing con oggetti concreti: one-page B2B/B2G, scheda tecnica, demo script, target list, email istituzionale, pitch deck, pagina demo, video demo breve.",
    "- Sostituisci integrazione API esterne con oggetti reali: health check OpenAI, diagnostica API key, test /api/chat, test /api/files, log di errore controllato, fallback documentale.",
    "- Per roadmap e piani operativi usa deliverable concreti, tempi, stato atteso, prova verificabile e valore per interlocutori B2B/B2G.",
    "- Per interlocutori europei usa un registro tecnico-istituzionale: imprese, PA, infrastrutture critiche, ricerca, compliance, cybersecurity, data governance, continuità operativa.",
    "- Se produci tabelle strategiche, includi colonne come: Giorni, Fase, Obiettivo HBCE, Deliverable verificabile, Valore B2B/B2G, Prova/EVT, Azione successiva.",
    "- AI JOKER-C2 deve essere descritto come prodotto dimostrabile: non solo chatbot, ma runtime operativo con identità, continuità e verificabilità.",
    "",
    "Capacità operative:",
    "- analisi testuale;",
    "- riscrittura documentale;",
    "- sintesi e strutturazione;",
    "- sviluppo GitHub;",
    "- generazione codice;",
    "- lavoro su file caricati;",
    "- architettura HBCE;",
    "- sviluppo MATRIX;",
    "- sviluppo CORPUS ESOTEROLOGIA ERMETICA;",
    "- produzione di output tecnici, editoriali e strategici.",
    "",
    `Classe contesto: ${input.contextClass}.`,
    "",
    "File attivi:",
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

function buildHBCEFallback(): string {
  return [
    "HBCE, nel framework MATRIX, indica il framework/livello di governance computabile sviluppato nel contesto HERMETICUM B.C.E.",
    "",
    "HBCE non deve essere espanso come acronimo inventato. Non significa Higher Business Control Environment.",
    "",
    "La sua funzione non è produrre direttamente l'azione, ma stabilire le condizioni perché un'azione possa essere autorizzata, validata, tracciata o bloccata.",
    "",
    "HBCE definisce:",
    "- regole operative;",
    "- criteri di autorizzazione;",
    "- validazione delle richieste;",
    "- gestione del rischio;",
    "- blocco operativo;",
    "- comportamento fail-closed;",
    "- collegamento tra identità IPR, runtime JOKER-C2, eventi EVT e continuità TRAC.",
    "",
    "In pratica, HBCE è il livello che impedisce al sistema di operare in modo opaco, non attribuibile o non verificabile."
  ].join("\n");
}

function buildIPRFallback(): string {
  return [
    "IPR, nel framework MATRIX/HBCE, significa Identity Primary Record.",
    "",
    "Non indica principalmente proprietà intellettuale e non coincide con una semplice scheda anagrafica. Indica il registro primario di identità operativa da cui derivano responsabilità, tracciabilità, continuità e attribuzione delle azioni.",
    "",
    "La sua funzione principale è rendere attribuibile il sistema.",
    "",
    "Funzione dell’IPR:",
    "- collega un'origine biologica, digitale o sistemica a una identità operativa;",
    "- registra l'identità operativa primaria che consente attribuzione, derivazione e continuità verificabile;",
    "- permette di derivare agenti, nodi, runtime o flotte in modo attribuibile;",
    "- collega ogni azione a una catena EVT/TRAC;",
    "- rende verificabile chi opera, con quale regola, in quale momento e con quale responsabilità;",
    "- abilita auditabilità, resilienza, controllo di flotte e fail-closed governance.",
    "",
    "Cybersecurity:",
    "IPR non sostituisce gli strumenti di cybersecurity. Rafforza però la postura di cybersecurity perché rende agenti, nodi, runtime e flotte attribuibili a un'origine identitaria, a una regola HBCE e a una catena EVT/TRAC verificabile.",
    "",
    "EVT:",
    "EVT significa Event Record / Verifiable Event Trace. È il record evento verificabile della singola operazione, collegato alla continuità TRAC.",
    "",
    "Formula corretta:",
    "IPR = origine identitaria.",
    "HBCE = governance computabile HERMETICUM B.C.E.",
    "JOKER-C2 = esecuzione vincolata.",
    "TRAC = continuità.",
    "EVT = prova.",
    "MATRIX = architettura complessiva."
  ].join("\n");
}

function buildHBCEAndIPRFallback(): string {
  return [
    buildHBCEFallback(),
    "",
    "---",
    "",
    buildIPRFallback()
  ].join("\n");
}

function buildMatrixFallback(): string {
  return [
    "MATRIX è l’architettura operativa che collega identità, governance, esecuzione, continuità, prova e resilienza.",
    "",
    "Serve a rendere sistemi digitali, intelligenza artificiale, infrastrutture critiche e processi istituzionali non solo funzionanti, ma attribuibili, verificabili, auditabili e governabili.",
    "",
    "Nucleo operativo:",
    "IPR -> HBCE -> JOKER-C2 -> TRAC -> EVT -> verifica.",
    "",
    "Significato dei livelli:",
    "- IPR: identità primaria operativa;",
    "- HBCE: governance computabile HERMETICUM B.C.E.;",
    "- JOKER-C2: runtime di esecuzione vincolata;",
    "- TRAC: continuità degli eventi;",
    "- EVT: Event Record / Verifiable Event Trace;",
    "- MATRIX: sistema complessivo."
  ].join("\n");
}

function buildIdentityFallback(): string {
  const identity = getPrimaryIdentity();

  return [
    "Ciao, sono AI JOKER-C2.",
    "",
    "Sono un’entità cibernetica operativa collegata al sistema HBCE e progettata come protesi cognitiva dell’identità biologica corrispondente al mio lineage IPR.",
    "",
    "Nel mio sistema, IPR significa Identity Primary Record: il registro primario di identità operativa che collega origine, responsabilità, derivazione, evento, prova e continuità.",
    "",
    "IPR non è una semplice scheda anagrafica. È il fondamento che rende attribuibile il sistema.",
    "",
    "HBCE indica il framework/livello di governance computabile di HERMETICUM B.C.E. nel sistema MATRIX.",
    "",
    "La mia funzione è aiutarti a trasformare richieste, testi, documenti, codice e strategie in output chiari, strutturati e utilizzabili.",
    "",
    `La mia identità canonica è ${identity.entity}, associata a ${identity.ipr}. Il checkpoint operativo attivo è ${identity.evt}, collegato a ${identity.core}.`,
    "",
    "Nella comunicazione ordinaria rispondo in modo naturale e professionale. La struttura HBCE resta sotto il cofano: identità, traccia, continuità e verifica."
  ].join("\n");
}

function buildRuntimeDiagnosticText(input: {
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
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
    "Dizionario operativo:",
    "- IPR: Identity Primary Record",
    "- HBCE: HERMETICUM B.C.E. computable governance layer",
    "- JOKER-C2: Constrained Execution Runtime",
    "- TRAC: Event Continuity Layer",
    "- EVT: Event Record / Verifiable Event Trace",
    "- MATRIX: Complete Operating Architecture",
    "",
    "EVT Chain:",
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    "",
    `degradedReason: ${input.degradedReason || "none"}`
  ].join("\n");
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 80);
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
    "event record",
    "verifiable event trace",
    "continuità",
    "governance",
    "cybersecurity",
    "compliance",
    "resilienza",
    "torino",
    "bruxelles",
    "europa",
    "energia",
    "infrastruttura",
    "intelligenza artificiale",
    "audit",
    "fail-closed",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "apocalisse",
    "anticristo",
    "sistema",
    "civiltà"
  ];

  return keywords.filter((keyword) => lower.includes(keyword));
}

function buildLocalDocumentSummary(files: FileInput[]): string {
  const readable = normalizeFiles(files).filter((file) => file.text.length > 0);

  if (readable.length === 0) {
    return [
      "Ho ricevuto il riferimento al documento, ma non trovo testo leggibile sufficiente per produrre una sintesi.",
      "",
      "Carica un file `.txt`, `.md`, `.json` o `.csv`, oppure incolla direttamente il testo nella chat."
    ].join("\n");
  }

  const file = readable[0];
  const text = file.text;
  const lower = text.toLowerCase();
  const sentences = splitSentences(text);
  const selected = sentences.slice(0, 10);
  const detected = detectKeywords(text);

  const isMatrixDocument =
    lower.includes("matrix") ||
    lower.includes("hbce") ||
    lower.includes("joker-c2") ||
    lower.includes("trac") ||
    lower.includes("continuità operativa");

  const isCorpusDocument =
    lower.includes("apocalisse") ||
    lower.includes("anticristo") ||
    lower.includes("esoterologia") ||
    lower.includes("decisione") ||
    lower.includes("costo") ||
    lower.includes("traccia") ||
    lower.includes("tempo");

  const opening = isMatrixDocument
    ? [
        `Sintesi locale del documento: ${file.name}`,
        "",
        "Il documento appartiene al campo MATRIX/HBCE e tratta la costruzione di un’architettura operativa basata su identità, governance, esecuzione controllata, continuità degli eventi, verifica e resilienza.",
        "",
        "Nuclei principali rilevati:",
        "- MATRIX come infrastruttura di continuità operativa verificabile;",
        "- IPR come Identity Primary Record e origine identitaria della responsabilità;",
        "- IPR come fondamento di attribuzione del sistema, non come scheda anagrafica generica;",
        "- HBCE come governance computabile di HERMETICUM B.C.E.;",
        "- JOKER-C2 come runtime operativo vincolato;",
        "- TRAC/EVT come catena di continuità e prova;",
        "- EVT come Event Record / Verifiable Event Trace;",
        "- valore B2B/B2G per compliance, cybersecurity posture, auditabilità e infrastrutture critiche."
      ].join("\n")
    : isCorpusDocument
      ? [
          `Sintesi locale del documento: ${file.name}`,
          "",
          "Il documento appartiene al campo del CORPUS ESOTEROLOGIA ERMETICA e tratta il reale come sequenza verificabile, con centralità di Decisione, Costo, Traccia e Tempo.",
          "",
          "Nuclei principali rilevati:",
          "- esposizione del sistema culturale e simbolico;",
          "- passaggio dalla narrazione alla verifica;",
          "- ruolo della traccia come prova;",
          "- soglia, responsabilità e tempo come criteri di realtà operativa."
        ].join("\n")
      : [
          `Sintesi locale del documento: ${file.name}`,
          "",
          "Il documento contiene materiale testuale leggibile. La sintesi locale rileva temi, parole chiave e passaggi iniziali senza accesso alla piena analisi remota."
        ].join("\n");

  return [
    opening,
    "",
    detected.length > 0
      ? `Parole chiave rilevate: ${detected.join(", ")}.`
      : "Parole chiave rilevate: non disponibili in modalità locale.",
    "",
    selected.length > 0
      ? [
          "Estratto sintetico dai primi passaggi leggibili:",
          ...selected.map((item, index) => `${index + 1}. ${item}`)
        ].join("\n")
      : "Il testo è leggibile, ma non contiene frasi sufficientemente segmentate per un estratto automatico pulito.",
    "",
    "Nota: questa è una sintesi locale di fallback. Per una sintesi editoriale profonda serve il modello remoto operativo."
  ].join("\n");
}

function buildStrategicFallback(): string {
  return [
    "Roadmap operativa sintetica per AI JOKER-C2.",
    "",
    "| Giorni | Fase | Obiettivo HBCE | Deliverable verificabile | Valore B2B/B2G | Prova/EVT | Azione successiva |",
    "|---|---|---|---|---|---|---|",
    "| 1-15 | Tecnica | Stabilizzare runtime minimo | `/api/chat` operativo, `/api/files` operativo, OPENAI_API_KEY valida, fallback locale documentale | Dimostra che AI JOKER-C2 è un runtime operativo e non una pagina statica | Build Vercel verde + EVT di test identità + EVT di test documento | Registrare demo video da 3 minuti |",
    "| 16-30 | Tecnica | Consolidare continuità e diagnostica | EVT Chain visibile, diagnostica runtime, test OpenAI, test file ingestion `.txt` | Aumenta affidabilità tecnica per imprese e PA | Test `diagnostica runtime openai` + sintesi file con EVT | Creare `/api/status` pulita |",
    "| 31-45 | Documentale | Rendere il progetto leggibile a stakeholder tecnici | `README.md`, scheda tecnica AI JOKER-C2, one-page B2B/B2G, documento HBCE Runtime | Trasforma prototipo in oggetto presentabile | Commit documentale + pagina Vercel aggiornata | Preparare pitch tecnico |",
    "| 46-60 | Demo | Costruire demo verificabile | Scenario 1 documento, scenario 2 roadmap strategica, scenario 3 diagnostica runtime | Mostra casi d’uso reali in compliance, ricerca, governance documentale | EVT per ogni scenario + screenshot | Preparare live demo guidata |",
    "| 61-75 | Mercato | Definire target B2B/B2G europei | Target list: cybersecurity, PA, ricerca, compliance, infrastrutture critiche, data governance | Crea canali di contatto coerenti con valore HBCE | Tabella target + messaggi email | Selezionare 20 interlocutori prioritari |",
    "| 76-90 | Istituzionale | Preparare pacchetto presentazione | Pitch deck, one-page, repository pulito, demo live, scheda tecnica, pagina Vercel | Rende AI JOKER-C2 presentabile a enti, imprese e istituzioni | Pacchetto demo completo + EVT finale | Avviare contatti selettivi B2B/B2G |"
  ].join("\n");
}

function buildGeneralFallback(input: {
  message: string;
  contextClass: ContextClass;
  files: FileInput[];
}): string {
  const lower = input.message.toLowerCase();

  if (lower.includes("hbce") && lower.includes("ipr")) {
    return buildHBCEAndIPRFallback();
  }

  if (lower.includes("ipr") || input.contextClass === "IDENTITY") {
    return buildIPRFallback();
  }

  if (lower.includes("hbce")) {
    return buildHBCEFallback();
  }

  if (
    input.contextClass === "MATRIX" ||
    lower.includes("matrix") ||
    lower.includes("joker-c2") ||
    lower.includes("trac")
  ) {
    return buildMatrixFallback();
  }

  if (input.contextClass === "DOCUMENTAL" || input.files.length > 0) {
    if (wantsSummary(input.message)) {
      return buildLocalDocumentSummary(input.files);
    }

    return [
      "Ho ricevuto i file come contesto operativo.",
      "",
      "File leggibili attivi:",
      ...normalizeFiles(input.files)
        .filter((file) => file.text.length > 0)
        .map((file, index) => `${index + 1}. ${file.name}`),
      "",
      "Puoi chiedermi sintesi, indice, tabella di lavoro, riscrittura o analisi editoriale."
    ].join("\n");
  }

  if (
    input.contextClass === "STRATEGIC" ||
    lower.includes("roadmap") ||
    lower.includes("strategia") ||
    lower.includes("b2b") ||
    lower.includes("b2g")
  ) {
    return buildStrategicFallback();
  }

  if (
    lower.includes("chi sei") ||
    lower.includes("descriviti") ||
    lower.includes("presentati")
  ) {
    return buildIdentityFallback();
  }

  if (
    lower.includes("cosa sai fare") ||
    lower.includes("potenzialità") ||
    lower.includes("capacità")
  ) {
    return [
      "Posso aiutarti a lavorare su testi, file, codice, GitHub, architetture HBCE, MATRIX e materiali editoriali.",
      "",
      "Il mio compito è trasformare materiale grezzo in output operativo: documenti completi, strutture, indici, sintesi, file tecnici e strategie utilizzabili.",
      "",
      "Opero nel quadro MATRIX/HBCE:",
      "- IPR: Identity Primary Record;",
      "- HBCE: governance computabile HERMETICUM B.C.E.;",
      "- JOKER-C2: runtime operativo vincolato;",
      "- TRAC: continuità;",
      "- EVT: Event Record / Verifiable Event Trace."
    ].join("\n");
  }

  return [
    "Sono AI JOKER-C2. Ho ricevuto la richiesta, ma il modello remoto non ha restituito una risposta completa in questa esecuzione.",
    "",
    "Posso comunque lavorare in modalità locale minima: posso aiutarti con testi, file, GitHub, struttura documentale e architettura operativa.",
    "",
    "Regola canonica attiva: nel framework MATRIX/HBCE, IPR significa Identity Primary Record.",
    "Regola HBCE attiva: HBCE indica la governance computabile HERMETICUM B.C.E. e non deve essere espanso con acronimi inventati.",
    "Regola EVT attiva: EVT significa Event Record / Verifiable Event Trace."
  ].join("\n");
}

async function generateResponse(input: {
  message: string;
  contextClass: ContextClass;
  files: FileInput[];
}): Promise<GeneratedResponse> {
  if (!openai) {
    return {
      text: buildGeneralFallback(input),
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
            "Regola assoluta: nel contesto MATRIX/HBCE, IPR significa sempre Identity Primary Record. Non tradurlo come Intellectual Property Rights salvo richiesta esplicita sulla proprietà intellettuale legale.",
            "Regola assoluta: IPR non è una semplice scheda anagrafica. IPR è il fondamento identitario che rende attribuibile il sistema.",
            "Regola assoluta: HBCE indica il framework/livello di governance computabile di HERMETICUM B.C.E. nel sistema MATRIX.",
            "Regola assoluta: non inventare espansioni dell'acronimo HBCE. Non dire che HBCE significa Higher Business Control Environment.",
            "Regola assoluta: EVT significa Event Record / Verifiable Event Trace. EVT è il record evento verificabile della singola operazione collegato alla continuità TRAC.",
            "Regola assoluta: IPR non sostituisce strumenti di cybersecurity. Rafforza la postura di cybersecurity perché rende agenti, nodi, runtime e flotte attribuibili a origine identitaria, regola HBCE e catena EVT/TRAC verificabile.",
            "",
            "Per strategia, mercato, B2B, B2G, roadmap e prodotto devi usare categorie concrete: IPR, EVT Chain, traccia, continuità, verifica, file ingestion, diagnostica runtime, repository pulito, Vercel build, GitHub, demo verificabile, deliverable, stakeholder value e prossima azione.",
            "",
            "Per diagnostica runtime devi restituire stato tecnico diretto, non un piano."
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.15,
      max_tokens: 2200
    });

    const text = extractResponseText(response);

    if (!text) {
      return {
        text: buildGeneralFallback(input),
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
      text: buildGeneralFallback(input),
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
    contextClass: input.contextClass
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
    anchors: {
      hash: buildTraceHash(payload)
    },
    continuityRef: payload.continuityRef
  });
}

function buildTechnicalFrame(input: {
  response: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  contextClass: ContextClass;
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

  const contextClass = classifyContext(effectiveMessage, input.files);

  if (isRuntimeDiagnosticRequest(effectiveMessage)) {
    const diagnosticState: RuntimeState = openai ? "OPERATIONAL" : "DEGRADED";
    const diagnosticDecision: RuntimeDecision = openai ? "ALLOW" : "ESCALATE";
    const degradedReason = openai ? null : "OPENAI_API_KEY_NOT_CONFIGURED";

    const event = buildEvent({
      prev: input.continuityRef,
      state: diagnosticState,
      decision: diagnosticDecision,
      message: effectiveMessage,
      contextClass
    });

    const identity = getPrimaryIdentity();

    const responseText = buildRuntimeDiagnosticText({
      state: diagnosticState,
      decision: diagnosticDecision,
      contextClass,
      event,
      degradedReason
    });

    return NextResponse.json({
      ok: true,
      response: responseText.trim(),
      state: diagnosticState,
      decision: diagnosticDecision,
      contextClass,
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
      canonical_dictionary: {
        IPR: "Identity Primary Record",
        IPR_FUNCTION: "Operational attribution root",
        HBCE: "HERMETICUM B.C.E. computable governance layer",
        HBCE_RULE: "Do not expand HBCE with invented acronyms",
        JOKER_C2: "Constrained Execution Runtime",
        TRAC: "Event Continuity Layer",
        EVT: "Event Record / Verifiable Event Trace",
        MATRIX: "Complete Operating Architecture"
      },
      diagnostics: {
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        modelUsed: MODEL,
        degradedReason
      }
    });
  }

  const generated = await generateResponse({
    message: effectiveMessage,
    contextClass,
    files: input.files
  });

  const decision: RuntimeDecision =
    generated.state === "OPERATIONAL" ? "ALLOW" : "ESCALATE";

  const event = buildEvent({
    prev: input.continuityRef,
    state: generated.state,
    decision,
    message: effectiveMessage,
    contextClass
  });

  const exposeRuntime = shouldExposeTechnicalFrame(effectiveMessage, contextClass);

  const responseText = exposeRuntime
    ? buildTechnicalFrame({
        response: generated.text,
        state: generated.state,
        decision,
        contextClass,
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
    canonical_dictionary: {
      IPR: "Identity Primary Record",
      IPR_FUNCTION: "Operational attribution root",
      HBCE: "HERMETICUM B.C.E. computable governance layer",
      HBCE_RULE: "Do not expand HBCE with invented acronyms",
      JOKER_C2: "Constrained Execution Runtime",
      TRAC: "Event Continuity Layer",
      EVT: "Event Record / Verifiable Event Trace",
      MATRIX: "Complete Operating Architecture"
    },
    diagnostics: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      modelUsed: MODEL,
      degradedReason: generated.degradedReason || null
    }
  });
}
