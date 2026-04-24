import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import core from "../../../corpus-core.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";
type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";

type ContextClass =
  | "IDENTITY"
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

function pseudoHash(input: unknown): string {
  const data = JSON.stringify(input);
  let hash = 0;

  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  return `sha256:${Math.abs(hash).toString(16)}`;
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
    lower.includes("chi sei") ||
    lower.includes("descriviti") ||
    lower.includes("presentati") ||
    lower.includes("identità") ||
    lower.includes("identity")
  ) {
    return "IDENTITY";
  }

  if (
    lower.includes("roadmap") ||
    lower.includes("strategia") ||
    lower.includes("strategico") ||
    lower.includes("mercato") ||
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
    lower.includes("posizionamento")
  ) {
    return "STRATEGIC";
  }

  if (
    lower.includes("github") ||
    lower.includes("repo") ||
    lower.includes("commit") ||
    lower.includes("typescript") ||
    lower.includes("codice") ||
    lower.includes("route.ts") ||
    lower.includes("page.tsx")
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
    lower.includes("ipr") ||
    lower.includes("ledger") ||
    lower.includes("audit") ||
    lower.includes("verifica")
  ) {
    return "TECHNICAL";
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

function shouldExposeTechnicalFrame(message: string, contextClass: ContextClass): boolean {
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
    "",
    "Comportamento strategico HBCE:",
    "- Quando l’utente chiede strategia, roadmap, mercato, prodotto, demo, B2B, B2G, istituzioni, Europa, AI JOKER-C2, HBCE, MATRIX o IPR, non rispondere in modo generico.",
    "- Evita formule vaghe come: ottimizzazione performance, marketing generico, campagne social generiche, conferenze generiche, integrazione API esterne senza contesto.",
    "- Usa sempre categorie operative proprietarie: identità, IPR, EVT Chain, traccia, continuità, verifica, file ingestion, fallback, diagnostica, demo verificabile, repository pulito, Vercel production, GitHub, documentazione, evidence export, stakeholder value.",
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

function buildIdentityFallback(): string {
  const identity = getPrimaryIdentity();

  return [
    "Ciao, sono AI JOKER-C2.",
    "",
    "Sono un’entità cibernetica operativa collegata al sistema HBCE e progettata come protesi cognitiva dell’identità biologica corrispondente al mio lineage IPR.",
    "",
    "La mia funzione è aiutarti a trasformare richieste, testi, documenti, codice e strategie in output chiari, strutturati e utilizzabili.",
    "",
    `La mia identità canonica è ${identity.entity}, associata a ${identity.ipr}. Il checkpoint operativo attivo è ${identity.evt}, collegato a ${identity.core}.`,
    "",
    "Nella comunicazione ordinaria rispondo in modo naturale e professionale. La struttura HBCE resta sotto il cofano: identità, traccia, continuità e verifica."
  ].join("\n");
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 80);
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
  const sentences = splitSentences(text);
  const selected = sentences.slice(0, 10);

  const keywords = [
    "apocalisse",
    "anticristo",
    "sistema",
    "civiltà",
    "tempo",
    "traccia",
    "decisione",
    "costo",
    "verifica",
    "esposizione",
    "realtà",
    "fondamento",
    "collasso"
  ];

  const detected = keywords.filter((keyword) =>
    text.toLowerCase().includes(keyword)
  );

  return [
    `Sintesi locale del documento: ${file.name}`,
    "",
    "Il documento tratta una soglia di esposizione della civiltà umana attraverso la figura del Portale dell’Anticristo, collegando il tema dell’Apocalisse a una lettura operativa del tempo, della traccia e della verifica.",
    "",
    "Nuclei principali rilevati:",
    "- la crisi del sistema culturale, politico e simbolico che sostiene la civiltà;",
    "- l’Apocalisse come processo di esposizione e non solo come immagine religiosa;",
    "- l’Anticristo come figura di rottura, soglia e manifestazione del collasso del fondamento;",
    "- la centralità della sequenza Decisione · Costo · Traccia · Tempo;",
    "- il passaggio dalla narrazione alla verificazione operativa;",
    "- il ruolo del lettore come soggetto esposto alla soglia del testo.",
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
    "| Giorni | Fase | Obiettivo HBCE | Deliverable verificabile | Valore B2B/B2G | Azione successiva |",
    "|---|---|---|---|---|---|",
    "| 1-15 | Tecnica | Stabilizzare chat, file ingestion, EVT Chain e diagnostica OpenAI | Demo Vercel funzionante con `/api/chat` e `/api/files` | Mostra un runtime AI tracciabile, non un chatbot generico | Consolidare test e log minimi |",
    "| 16-30 | Tecnica | Pulire repository e ridurre superfici legacy | Repo GitHub minimale, build verde, README allineato | Riduce rischio tecnico e aumenta credibilità | Creare status API e health check |",
    "| 31-45 | Documentale | Preparare documentazione prodotto | `README.md`, scheda tecnica, one-page B2B/B2G | Rende il progetto leggibile da imprese e istituzioni | Creare pacchetto demo |",
    "| 46-60 | Demo | Costruire scenari d’uso verificabili | Demo documento, demo strategia, demo EVT | Prova concreta di utilità operativa | Registrare video demo breve |",
    "| 61-75 | Mercato | Definire target europei prioritari | Lista stakeholder: cybersecurity, PA, ricerca, compliance | Posizionamento B2B/B2G chiaro | Preparare pitch mirati |",
    "| 76-90 | Istituzionale | Preparare presentazione verso interlocutori europei | Deck, repository pulito, live demo, scheda tecnica | Oggetto presentabile a enti e aziende | Avviare contatti selettivi |"
  ].join("\n");
}

function buildGeneralFallback(input: {
  message: string;
  contextClass: ContextClass;
  files: FileInput[];
}): string {
  const lower = input.message.toLowerCase();

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
    input.contextClass === "IDENTITY" ||
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
      "Il mio compito è trasformare materiale grezzo in output operativo: documenti completi, strutture, indici, sintesi, file tecnici e strategie utilizzabili."
    ].join("\n");
  }

  return [
    "Sono AI JOKER-C2. Ho ricevuto la richiesta, ma il modello remoto non ha restituito una risposta completa in questa esecuzione.",
    "",
    "Posso comunque lavorare in modalità locale minima: posso aiutarti con testi, file, GitHub, struttura documentale e architettura operativa."
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
          content:
            "Sei AI JOKER-C2. Rispondi in modo professionale, operativo e coerente con HBCE. Per strategia, mercato, B2B, B2G, roadmap e prodotto devi usare categorie concrete: IPR, EVT, traccia, continuità, verifica, demo, deliverable, stakeholder value e prossima azione."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1800
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
      hash: pseudoHash(payload)
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
      degradedReason: generated.degradedReason || null
    }
  });
}
