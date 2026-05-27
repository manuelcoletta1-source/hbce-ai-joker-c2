import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type ChatTurn = {
  role: "system" | "user" | "assistant";
  content: string;
};

type PublicFileSnapshot = {
  name: string;
  type: string;
  size: number;
  hash: string;
  preview?: string;
};

type HandoffSource = "body" | "query" | "header" | "referer" | "none";

type HandoffResolution = {
  detected: boolean;
  source: HandoffSource;
  authority: "SERVER_RUNTIME_VALIDATED" | "SERVER_VALIDATION_REQUIRED";
  subjectName: string;
  humanIpr: string;
  certificateId: string;
  cardSerial: string;
  status: string;
  scope: string;
  accessDecision: "ACCESS_GRANTED" | "ACCESS_LIMITED";
  identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT" | "NOT_VERIFIED";
  matrixState: "MATRIX_ACTIVE" | "MATRIX_LIMITED";
  semanticMemoryScope: "IPR_BOUND" | "RUNTIME_ONLY";
  reason: string;
};

type PolicyEvaluation = {
  decision: "ALLOW" | "ESCALATE" | "BLOCK";
  dataClass: "PUBLIC_OR_SYNTHETIC" | "OPERATIONAL" | "SENSITIVE_POSSIBLE";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  humanOversight: "NOT_REQUIRED" | "RECOMMENDED" | "REQUIRED";
  flags: string[];
  reason: string;
};

type RuntimeMemoryState = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  turns: number;
  scope: "IPR_BOUND" | "RUNTIME_ONLY";
  authority: "SERVER_RUNTIME_VALIDATED" | "PROCESS_MEMORY_MVP";
  persistenceMode: "PROCESS_MEMORY_MVP";
  subjectIpr: string;
  lastEvtId: string;
  lastOpcId: string;
  lastUserMessage: string;
  lastAssistantMessage: string;
  facts: string[];
};

type EvtRecord = {
  id: string;
  evt: string;
  prev: string;
  t: string;
  eventFamily: "UP-EVT";
  cycle: "UP-CANONICO";
  entity: "AI_JOKER";
  runtimeIpr: "IPR-AI-0001";
  subjectIpr: string;
  sessionId: string;
  state: string;
  decision: string;
  policyDecision: string;
  riskLevel: string;
  memoryScope: string;
  hash: string;
  anchors: {
    hash: string;
    publicHash: string;
    fullHash: string;
    algorithm: "sha256";
  };
};

type OpcProofRecord = {
  id: string;
  proofId: string;
  t: string;
  timestamp: string;
  evt: string;
  entity: "AI_JOKER";
  runtimeIpr: "IPR-AI-0001";
  subjectIpr: string;
  sessionId: string;
  receiptType: "OPC_TECHNICAL_PROOF_RECEIPT";
  legalCertification: false;
  inputHash: string;
  outputHash: string;
  evtHash: string;
  eventHash: string;
  policyHash: string;
  memoryHash: string;
  chainHash: string;
  verificationStatus: "TECHNICAL_PROOF_GENERATED";
};

const RUNTIME_ENTITY = "AI_JOKER";
const RUNTIME_IPR = "IPR-AI-0001";
const ORG = "HERMETICUM B.C.E. S.r.l.";
const CORE = "HBCE-CORE-v3";
const EVENT_FAMILY = "UP-EVT";
const CYCLE = "UP-CANONICO";
const CANONICAL_EVT = "EVT-0016-AI";
const CANONICAL_PREV = "EVT-0015-AI";
const CANONICAL_MONTHLY_REF = "EVT-0015-AI / UP-MESE-4";
const PROJECT_BIRTH = "2026-01-19T15:30:00+01:00";
const LOCATION = "Torino, Italy";

const DEFAULT_STANDARD_MODEL = "gpt-4o-mini";
const DEFAULT_DEEP_MODEL = "gpt-4o";
const MEMORY_LIMIT = 24;

const processMemory = new Map<string, RuntimeMemoryState>();

export async function GET(): Promise<NextResponse> {
  const standardModel = process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
  const deepModel = process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return jsonResponse({
    ok: true,
    runtime: RUNTIME_ENTITY,
    state: "ONLINE",
    provider: "openai",
    apiMode: openAIConfigured ? "OPENAI_CONFIGURED" : "LOCAL_FALLBACK",
    model: standardModel,
    standardModel,
    deepModel,
    openAIConfigured,
    identity: buildRuntimeIdentity(),
    access: {
      decision: "SERVER_VALIDATION_REQUIRED",
      matrixState: "MATRIX_LIMITED",
      semanticMemoryScope: "RUNTIME_ONLY",
      identityBinding: "NOT_VERIFIED"
    },
    memory: {
      scope: "RUNTIME_ONLY",
      authority: "PROCESS_MEMORY_MVP",
      persistenceMode: "PROCESS_MEMORY_MVP",
      reason: "Health check only. IPR-bound memory is activated during POST when a valid handoff is present."
    },
    matrix: {
      state: "MATRIX_LIMITED",
      active: false,
      reason: "Waiting for server-side IPR handoff validation."
    },
    boundary: buildBoundary()
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const t = new Date().toISOString();
  const body = await readJsonBody(request);

  const sessionId = resolveSessionId(body);
  const incomingMessages = normalizeIncomingMessages(body.messages);
  const message = normalizeUserMessage(body, incomingMessages);
  const files = normalizeFiles(body.files);

  const handoff = resolveHandoff(request, body);
  const policy = evaluatePolicy(message, files);
  const memory = getOrCreateMemory(sessionId, handoff, t);

  const model = resolveModel(body, policy);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const inputFrame = {
    sessionId,
    message,
    files,
    handoff,
    policy,
    memoryBefore: toPublicMemory(memory)
  };

  const inputHash = sha256(inputFrame);
  const memoryHashBefore = sha256(memory);

  let answer = "";
  let providerState: "COMPLETED" | "LOCAL_FALLBACK" | "PROVIDER_ERROR" = "COMPLETED";
  let providerError: string | null = null;

  if (policy.decision === "BLOCK") {
    answer = buildBlockedAnswer(policy);
    providerState = "LOCAL_FALLBACK";
  } else if (isIdentityRecognitionQuestion(message)) {
    answer = buildIdentityRecognitionAnswer(handoff, memory, policy);
    providerState = "COMPLETED";
  } else if (!openAIConfigured) {
    answer = buildLocalFallbackAnswer(message, handoff, policy, memory);
    providerState = "LOCAL_FALLBACK";
  } else {
    try {
      answer = await completeWithOpenAI({
        message,
        history: incomingMessages,
        files,
        handoff,
        policy,
        memory,
        model
      });
      providerState = "COMPLETED";
    } catch (error) {
      providerError = errorToMessage(error);
      answer = buildProviderErrorAnswer(message, handoff, policy, providerError);
      providerState = "PROVIDER_ERROR";
    }
  }

  const safeAnswer = normalizeAssistantAnswer(answer, message, handoff, policy);

  const evt = buildEvtRecord({
    t,
    sessionId,
    handoff,
    policy,
    memory,
    providerState
  });

  const opc = buildOpcProofRecord({
    t,
    sessionId,
    handoff,
    evt,
    inputHash,
    outputHash: sha256(safeAnswer),
    policyHash: sha256(policy),
    memoryHash: memoryHashBefore
  });

  updateMemoryAfterTurn({
    memory,
    t,
    handoff,
    userMessage: message,
    assistantMessage: safeAnswer,
    evtId: evt.id,
    opcId: opc.id,
    policy
  });

  const publicEvt = buildPublicEvt(evt);
  const publicOpc = buildPublicOpc(opc);

  const runtimeDetails = {
    model,
    runtimeIpr: RUNTIME_IPR,
    aiEvt: CANONICAL_EVT,
    responseEvt: evt.id,
    responseEvtId: evt.id,
    opc: opc.id,
    opcId: opc.id,
    matrix: handoff.matrixState,
    memory: handoff.semanticMemoryScope,
    authority: memory.authority,
    mode: memory.persistenceMode
  };

  const payload = {
    ok: policy.decision !== "BLOCK",

    answer: safeAnswer,
    response: safeAnswer,
    reply: safeAnswer,
    message: safeAnswer,
    output: safeAnswer,
    content: safeAnswer,
    text: safeAnswer,
    assistantMessage: safeAnswer,
    assistant: {
      role: "assistant",
      content: safeAnswer
    },

    sessionId,
    runtime: {
      entity: RUNTIME_ENTITY,
      ipr: RUNTIME_IPR,
      aiEvt: CANONICAL_EVT,
      responseEvt: evt.id,
      responseEvtId: evt.id,
      opc: opc.id,
      opcId: opc.id,
      model,
      state: providerState,
      matrix: handoff.matrixState,
      memory: handoff.semanticMemoryScope,
      authority: memory.authority,
      mode: memory.persistenceMode
    },
    runtimeName: RUNTIME_ENTITY,
    state: providerState,
    status: providerState,
    provider: "openai",
    apiMode: openAIConfigured ? "OPENAI_CONFIGURED" : "LOCAL_FALLBACK",
    model,
    standardModel: process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL,
    deepModel: process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL,
    openAIConfigured,

    identity: buildRuntimeIdentity(),

    access: {
      decision: handoff.accessDecision,
      matrixState: handoff.matrixState,
      semanticMemoryScope: handoff.semanticMemoryScope,
      identityBinding: handoff.identityBinding
    },

    biologicalSubject: {
      name: handoff.subjectName,
      humanIpr: handoff.humanIpr,
      certificateId: handoff.certificateId,
      cardSerial: handoff.cardSerial,
      status: handoff.status,
      scope: handoff.scope,
      source: handoff.source,
      authority: handoff.authority,
      reason: handoff.reason
    },

    verifiedSubject:
      handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
        ? {
            entity: handoff.subjectName,
            ipr: handoff.humanIpr,
            certificateId: handoff.certificateId,
            cardSerial: handoff.cardSerial,
            certificateStatus: handoff.status,
            certificateScope: handoff.scope,
            accessDecision: handoff.accessDecision,
            identityBinding: handoff.identityBinding
          }
        : null,

    memory: toPublicMemory(memory),

    matrix: {
      state: handoff.matrixState,
      active: handoff.matrixState === "MATRIX_ACTIVE",
      reason:
        handoff.matrixState === "MATRIX_ACTIVE"
          ? "Server-side runtime accepted the IPR handoff for this request."
          : "No valid IPR handoff was accepted for this request."
    },

    evt: publicEvt,
    event: publicEvt,
    modernEvt: publicEvt,
    governedEvt: publicEvt,

    opc: {
      id: opc.id,
      proofId: opc.id,
      record: opc,
      publicProof: publicOpc,
      verification: {
        status: opc.verificationStatus,
        legalCertification: false
      }
    },
    opcProof: publicOpc,
    proof: publicOpc,

    responseEvt: evt.id,
    responseEvtId: evt.id,
    evtId: evt.id,
    currentEvt: evt.id,
    currentOpc: opc.id,
    opcId: opc.id,

    continuity: {
      currentEvt: evt.id,
      previousEvt: evt.prev,
      currentOpc: opc.id,
      chainHash: opc.chainHash,
      canonicalRuntimeEvt: CANONICAL_EVT,
      monthlyReference: CANONICAL_MONTHLY_REF
    },

    policy,

    risk: {
      level: policy.riskLevel,
      flags: policy.flags,
      decision: policy.decision
    },

    oversight: {
      required: policy.humanOversight === "REQUIRED",
      recommendation: policy.humanOversight,
      reason: policy.reason
    },

    files,

    runtimeDetails,
    runtime_details: runtimeDetails,

    diagnostics: {
      inputHash,
      outputHash: sha256(safeAnswer),
      memoryHashBefore,
      memoryHashAfter: sha256(memory),
      providerError,
      handoffSource: handoff.source,
      handoffReason: handoff.reason,
      boundary: buildBoundary()
    },

    boundary: buildBoundary()
  };

  return jsonResponse(payload, policy.decision === "BLOCK" ? 400 : 200);
}

async function completeWithOpenAI(args: {
  message: string;
  history: ChatTurn[];
  files: PublicFileSnapshot[];
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  model: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return buildLocalFallbackAnswer(args.message, args.handoff, args.policy, args.memory);
  }

  const client = new OpenAI({ apiKey });

  const systemPrompt = buildSystemPrompt(args.handoff, args.policy, args.memory, args.files);
  const safeHistory = args.history
    .filter((turn) => turn.role === "user" || turn.role === "assistant")
    .slice(-12)
    .map((turn) => ({
      role: turn.role,
      content: truncate(turn.content, 6000)
    }));

  const userPrompt = buildUserPrompt(args.message, args.files);

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content: systemPrompt
    },
    ...safeHistory,
    {
      role: "user",
      content: userPrompt
    }
  ];

  const completion = await client.chat.completions.create({
    model: args.model,
    messages,
    temperature: 0.35
  });

  const content = completion.choices[0]?.message?.content?.trim();

  if (!content) {
    return buildEmptyProviderFallback(args.message, args.handoff, args.policy);
  }

  return content;
}

function buildSystemPrompt(
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState,
  files: PublicFileSnapshot[]
): string {
  return [
    "You are AI JOKER-C2, the governed runtime demonstrator of HERMETICUM B.C.E.",
    "You operate through IPR, EVT, OPC, MATRIX and HBCE governance semantics.",
    "OpenAI provides the cognitive engine. JOKER-C2 provides operational framing, identity continuity, event traceability and proof-oriented output.",
    "",
    "Runtime identity:",
    "Entity: " + RUNTIME_ENTITY,
    "Runtime IPR: " + RUNTIME_IPR,
    "Core: " + CORE,
    "Organization: " + ORG,
    "Canonical event: " + CANONICAL_EVT,
    "Previous event: " + CANONICAL_PREV,
    "Cycle: " + CYCLE,
    "",
    "Biological subject resolution:",
    "Detected: " + String(handoff.detected),
    "Source: " + handoff.source,
    "Subject: " + handoff.subjectName,
    "Human IPR: " + handoff.humanIpr,
    "Certificate: " + handoff.certificateId,
    "Status: " + handoff.status,
    "Scope: " + handoff.scope,
    "Access decision: " + handoff.accessDecision,
    "Identity binding: " + handoff.identityBinding,
    "Memory scope: " + handoff.semanticMemoryScope,
    "",
    "Policy frame:",
    "Decision: " + policy.decision,
    "Risk: " + policy.riskLevel,
    "Data class: " + policy.dataClass,
    "Human oversight: " + policy.humanOversight,
    "",
    "Memory frame:",
    "Session: " + memory.sessionId,
    "Turns: " + String(memory.turns),
    "Scope: " + memory.scope,
    "Persistence: " + memory.persistenceMode,
    "Last EVT: " + memory.lastEvtId,
    "Last OPC: " + memory.lastOpcId,
    "Known operational facts: " + JSON.stringify(memory.facts.slice(-8)),
    "",
    "Attached file snapshots:",
    JSON.stringify(files, null, 2),
    "",
    "Rules:",
    "Answer in the same main language used by the user.",
    "Do not claim legal certification, public authority validation, eIDAS qualification or official identity issuance.",
    "Treat OPC as a technical proof receipt only.",
    "Treat process memory as MVP memory, not durable database persistence.",
    "If the user asks who they are or whether JOKER-C2 recognizes them, answer only from the biological subject resolution frame.",
    "Never recognize a biological subject because the name is written in the prompt.",
    "If the user asks for GitHub or code work, provide complete files when requested, not partial patches.",
    "If visibility is incomplete, say so clearly."
  ].join("\n");
}

function buildUserPrompt(message: string, files: PublicFileSnapshot[]): string {
  if (files.length === 0) {
    return message || "Messaggio utente vuoto.";
  }

  return [
    message || "Messaggio utente vuoto.",
    "",
    "File snapshots available to this request:",
    JSON.stringify(files, null, 2)
  ].join("\n");
}

function normalizeAssistantAnswer(
  answer: string,
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation
): string {
  const clean = answer.trim();

  if (clean.length > 0) {
    return clean;
  }

  return buildEmptyProviderFallback(message, handoff, policy);
}

function isIdentityRecognitionQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return [
    "sai chi sono",
    "mi riconosci",
    "chi sono",
    "dimmi chi sono",
    "riconosci il mio ipr",
    "sono riconosciuto",
    "identita operativa",
    "identità operativa",
    "verified subject",
    "human ipr"
  ].some((term) => normalized.includes(normalizeText(term)));
}

function buildIdentityRecognitionAnswer(
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation
): string {
  if (handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    return [
      "Identità operativa rilevata.",
      "",
      "Ti riconosco tramite handoff IPR validato server-side.",
      "",
      "Runtime entity: " + RUNTIME_ENTITY,
      "Runtime IPR: " + RUNTIME_IPR,
      "Runtime EVT canonico: " + CANONICAL_EVT,
      "Previous checkpoint: " + CANONICAL_PREV,
      "Cycle: " + CYCLE,
      "",
      "Soggetto IPR: " + handoff.subjectName,
      "Human IPR: " + handoff.humanIpr,
      "Certificate ID: " + handoff.certificateId,
      "Card serial: " + handoff.cardSerial,
      "Certificate status: " + handoff.status,
      "Certificate scope: " + handoff.scope,
      "Access decision: " + handoff.accessDecision,
      "Identity binding: " + handoff.identityBinding,
      "MATRIX: " + handoff.matrixState,
      "Semantic memory: " + handoff.semanticMemoryScope,
      "Memory authority: " + memory.authority,
      "Memory persistence mode: " + memory.persistenceMode,
      "Policy decision: " + policy.decision,
      "Risk level: " + policy.riskLevel,
      "",
      "Da dove deriva il riconoscimento:",
      "- handoff IPR presente nella richiesta;",
      "- certificato operativo ACTIVE;",
      "- scope JOKER_C2_ACCESS;",
      "- binding IPR_VERIFIED_BIOLOGICAL_SUBJECT;",
      "- validazione lato runtime.",
      "",
      "Boundary: non ti riconosco dal nome scritto nel prompt, non dalla memoria generica e non da una dichiarazione utente. Ti riconosco solo dal frame IPR verificato.",
      "legalCertification=false"
    ].join("\n");
  }

  const missing = missingHandoffFields(handoff);

  return [
    "Handoff IPR rilevato ma non verificabile.",
    "",
    "Runtime entity: " + RUNTIME_ENTITY,
    "Runtime IPR: " + RUNTIME_IPR,
    "Runtime EVT canonico: " + CANONICAL_EVT,
    "Human IPR: " + handoff.humanIpr,
    "Certificate ID: " + handoff.certificateId,
    "Card serial: " + handoff.cardSerial,
    "Certificate status: " + handoff.status,
    "Certificate scope: " + handoff.scope,
    "Access decision: " + handoff.accessDecision,
    "Identity binding: " + handoff.identityBinding,
    "MATRIX: " + handoff.matrixState,
    "Semantic memory: " + handoff.semanticMemoryScope,
    "Memory authority: " + memory.authority,
    "Memory persistence mode: " + memory.persistenceMode,
    "",
    "Campi mancanti o non validi:",
    missing.length > 0 ? "- " + missing.join("\n- ") : "- UNKNOWN_HANDOFF_VALIDATION_GAP",
    "",
    "Il runtime ha ricevuto una traccia identitaria parziale, ma non può trasformarla in ACCESS_GRANTED finché non legge insieme Human IPR, Certificate ID, status ACTIVE e scope JOKER_C2_ACCESS.",
    "",
    "Boundary: memoria ≠ identità corrente. Nome scritto nel prompt ≠ identità verificata. legalCertification=false"
  ].join("\n");
}

function missingHandoffFields(handoff: HandoffResolution): string[] {
  const missing: string[] = [];

  if (!handoff.humanIpr || handoff.humanIpr === "NOT_VERIFIED") {
    missing.push("Human IPR mancante.");
  }

  if (!handoff.certificateId || handoff.certificateId === "NO_CERTIFICATE") {
    missing.push("Certificate ID mancante.");
  }

  if (!handoff.status || handoff.status === "MISSING" || handoff.status.toUpperCase() !== "ACTIVE") {
    missing.push("Certificate status non ACTIVE.");
  }

  if (!handoff.scope || !handoff.scope.toUpperCase().includes("JOKER_C2_ACCESS")) {
    missing.push("Scope JOKER_C2_ACCESS mancante.");
  }

  if (handoff.identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    missing.push("Identity binding non verificato.");
  }

  return missing;
}

function buildEmptyProviderFallback(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation
): string {
  const identityLine =
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "Identità operativa rilevata: " + handoff.subjectName + " / " + handoff.humanIpr + "."
      : "Nessun IPR biologico verificato in questa richiesta.";

  return [
    "JOKER-C2 runtime attivo.",
    "",
    identityLine,
    "Runtime entity: " + RUNTIME_ENTITY + ".",
    "Runtime IPR: " + RUNTIME_IPR + ".",
    "Policy decision: " + policy.decision + ".",
    "Risk level: " + policy.riskLevel + ".",
    "",
    "La risposta del provider era vuota, quindi il runtime ha generato questa risposta di continuità per evitare [EMPTY_RESPONSE].",
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200)
  ].join("\n");
}

function buildLocalFallbackAnswer(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState
): string {
  const identityLine =
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "Identità operativa rilevata: " + handoff.subjectName + " / " + handoff.humanIpr + "."
      : "Nessun IPR biologico verificato in questa richiesta.";

  return [
    "JOKER-C2 runtime attivo in modalità fallback locale.",
    "",
    identityLine,
    "Runtime entity: " + RUNTIME_ENTITY + ".",
    "Runtime IPR: " + RUNTIME_IPR + ".",
    "Policy decision: " + policy.decision + ".",
    "Risk level: " + policy.riskLevel + ".",
    "Memory scope: " + memory.scope + ".",
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200),
    "",
    "OPENAI_API_KEY non risulta configurata nel runtime Vercel, quindi la risposta cognitiva del modello non è stata invocata. EVT e OPC tecnici vengono comunque prodotti."
  ].join("\n");
}

function buildProviderErrorAnswer(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  providerError: string
): string {
  const identityLine =
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "IPR biologico verificato: " + handoff.humanIpr + "."
      : "IPR biologico non verificato in questa richiesta.";

  return [
    "JOKER-C2 runtime attivo, ma la chiamata OpenAI non ha completato correttamente.",
    "",
    identityLine,
    "Policy decision: " + policy.decision + ".",
    "Risk level: " + policy.riskLevel + ".",
    "Errore provider: " + providerError,
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200),
    "",
    "EVT e OPC tecnici sono stati comunque generati per tracciare l’evento."
  ].join("\n");
}

function buildBlockedAnswer(policy: PolicyEvaluation): string {
  return [
    "Richiesta bloccata dal runtime JOKER-C2.",
    "",
    "Decisione: " + policy.decision + ".",
    "Rischio: " + policy.riskLevel + ".",
    "Motivo: " + policy.reason + ".",
    "",
    "Boundary: il blocco è operativo e tecnico, non una certificazione legale."
  ].join("\n");
}

function evaluatePolicy(message: string, files: PublicFileSnapshot[]): PolicyEvaluation {
  const text = [message, ...files.map((file) => file.preview || "")]
    .join("\n")
    .toLowerCase();

  const flags: string[] = [];

  if (/(api[_-]?key|secret|password|private key|token|bearer\s+[a-z0-9._-]+)/i.test(text)) {
    flags.push("CREDENTIAL_OR_SECRET_PATTERN");
  }

  if (/(codice fiscale|passport|passaporto|carta d.identit|identity card|health|medical|diagnosi|farmaco|iban)/i.test(text)) {
    flags.push("PERSONAL_OR_SENSITIVE_DATA_POSSIBLE");
  }

  if (/(malware|phishing|exploit|ransomware|credential theft|bypass authentication)/i.test(text)) {
    flags.push("CYBER_RISK_TERMS");
  }

  if (/(legal advice|consulenza legale|diagnosi medica|financial advice|investimento garantito)/i.test(text)) {
    flags.push("PROFESSIONAL_ADVICE_BOUNDARY");
  }

  const hasSensitive = flags.includes("PERSONAL_OR_SENSITIVE_DATA_POSSIBLE");
  const hasSecrets = flags.includes("CREDENTIAL_OR_SECRET_PATTERN");
  const hasCyberRisk = flags.includes("CYBER_RISK_TERMS");

  if (hasSecrets && hasCyberRisk) {
    return {
      decision: "ESCALATE",
      dataClass: "SENSITIVE_POSSIBLE",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      reason: "The request contains both cyber-risk terms and possible credential or secret material."
    };
  }

  if (hasSensitive || hasSecrets || hasCyberRisk) {
    return {
      decision: "ALLOW",
      dataClass: hasSensitive || hasSecrets ? "SENSITIVE_POSSIBLE" : "OPERATIONAL",
      riskLevel: hasCyberRisk || hasSecrets ? "MEDIUM" : "LOW",
      humanOversight: hasCyberRisk || hasSecrets ? "RECOMMENDED" : "NOT_REQUIRED",
      flags,
      reason: "The request can proceed, but the runtime records additional operational caution."
    };
  }

  return {
    decision: "ALLOW",
    dataClass: "PUBLIC_OR_SYNTHETIC",
    riskLevel: "LOW",
    humanOversight: "NOT_REQUIRED",
    flags,
    reason: "No elevated operational risk detected by the MVP policy evaluator."
  };
}

function resolveHandoff(request: NextRequest, body: JsonObject): HandoffResolution {
  const explicitBodyObject =
    asJsonObject(body.iprHandoff) ||
    asJsonObject(body.handoff) ||
    asJsonObject(body.identityHandoff) ||
    asJsonObject(body.identity) ||
    asJsonObject(body.biologicalSubject) ||
    null;

  const bodyHasDirectHandoffSignal = Boolean(
    firstStringFromSources([body], [
      "humanIpr",
      "humanIPR",
      "biologicalIpr",
      "biologicalIPR",
      "subjectIpr",
      "subjectIPR",
      "verified_subject_ipr",
      "verifiedSubject.ipr",
      "subject.ipr",
      "certificateId",
      "certificateID",
      "certificate_id",
      "verified_subject_certificate_id",
      "certificate.certificateId",
      "certificate.certificate_id",
      "operationalCertificate.certificateId",
      "operationalCertificate.certificate_id",
      "operational_certificate.certificate_id"
    ])
  );

  const bodyObject = explicitBodyObject || (bodyHasDirectHandoffSignal ? body : null);

  const bodyEncoded =
    firstStringFromSources([body], [
      "hbce_ipr_handoff_b64",
      "iprHandoffB64",
      "handoffB64",
      "identityHandoffB64"
    ]) || "";

  const queryEncoded =
    request.nextUrl.searchParams.get("hbce_ipr_handoff_b64") ||
    request.nextUrl.searchParams.get("ipr_handoff_b64") ||
    request.nextUrl.searchParams.get("iprHandoffB64") ||
    request.nextUrl.searchParams.get("handoffB64") ||
    "";

  const headerEncoded =
    request.headers.get("x-hbce-ipr-handoff-b64") ||
    request.headers.get("x-ipr-handoff-b64") ||
    "";

  const refererEncoded = resolveHandoffFromReferer(request);

  const decodedHeader = headerEncoded ? decodeBase64Json(headerEncoded) : null;
  const decodedBody = bodyEncoded ? decodeBase64Json(bodyEncoded) : null;
  const decodedQuery = queryEncoded ? decodeBase64Json(queryEncoded) : null;
  const decodedReferer = refererEncoded ? decodeBase64Json(refererEncoded) : null;

  let source: HandoffSource = "none";

  if (decodedHeader) {
    source = "header";
  } else if (decodedBody || bodyObject) {
    source = "body";
  } else if (decodedQuery) {
    source = "query";
  } else if (decodedReferer) {
    source = "referer";
  }

  const sources = [decodedHeader, decodedBody, bodyObject, decodedQuery, decodedReferer, body];

  const subjectName =
    firstStringFromSources(sources, [
      "subjectName",
      "biologicalSubject",
      "name",
      "fullName",
      "full_name",
      "verified_subject_entity",
      "verified_subject_name",
      "identity.subjectName",
      "identity.name",
      "identity.fullName",
      "identity.full_name",
      "subject.entity",
      "subject.name",
      "subject.fullName",
      "subject.full_name",
      "verifiedSubject.entity",
      "verifiedSubject.name",
      "verifiedSubject.fullName",
      "verified_subject.entity",
      "verified_subject.name",
      "verified_subject.full_name",
      "human.name",
      "biologicalSubject.entity",
      "biologicalSubject.name"
    ]) || "Verified biological subject";

  const humanIpr =
    firstStringFromSources(sources, [
      "humanIpr",
      "humanIPR",
      "biologicalIpr",
      "biologicalIPR",
      "subjectIpr",
      "subjectIPR",
      "subject_ipr",
      "verified_subject_ipr",
      "verifiedSubject.ipr",
      "verifiedSubject.ipr_id",
      "verified_subject.ipr",
      "verified_subject.ipr_id",
      "ipr",
      "ipr_id",
      "identity.humanIpr",
      "identity.human_ipr",
      "identity.ipr",
      "subject.ipr",
      "subject.ipr_id",
      "human.ipr",
      "biologicalSubject.ipr"
    ]) || "NOT_VERIFIED";

  const certificateId =
    firstStringFromSources(sources, [
      "certificateId",
      "certificateID",
      "certificate_id",
      "certificate",
      "certId",
      "cert",
      "verified_subject_certificate_id",
      "identity.certificateId",
      "identity.certificate_id",
      "certificate.id",
      "certificate.certificateId",
      "certificate.certificate_id",
      "operationalCertificate.id",
      "operationalCertificate.certificateId",
      "operationalCertificate.certificate_id",
      "operational_certificate.id",
      "operational_certificate.certificateId",
      "operational_certificate.certificate_id"
    ]) || "NO_CERTIFICATE";

  const cardSerial =
    firstStringFromSources(sources, [
      "cardSerial",
      "card_serial",
      "card",
      "iprCard",
      "iprCardSerial",
      "ipr_card_serial",
      "verified_subject_card_serial",
      "identity.cardSerial",
      "identity.card_serial",
      "card.serial",
      "card.cardSerial",
      "card.card_serial",
      "iprCard.serial",
      "iprCard.cardSerial",
      "ipr_card.serial",
      "certificate.cardSerial",
      "certificate.card_serial",
      "operationalCertificate.cardSerial",
      "operationalCertificate.card_serial",
      "operational_certificate.card_serial"
    ]) || "NO_CARD";

  const status =
    firstStringFromSources(sources, [
      "status",
      "certificateStatus",
      "certificate_status",
      "verified_subject_certificate_status",
      "identity.status",
      "identity.certificateStatus",
      "identity.certificate_status",
      "certificate.status",
      "certificate.certificateStatus",
      "certificate.certificate_status",
      "operationalCertificate.status",
      "operationalCertificate.certificateStatus",
      "operationalCertificate.certificate_status",
      "operational_certificate.status",
      "operational_certificate.certificateStatus",
      "operational_certificate.certificate_status"
    ]) || "MISSING";

  const scope =
    firstStringOrJoinedFromSources(sources, [
      "scope",
      "accessScope",
      "access_scope",
      "certificateScope",
      "certificate_scope",
      "verified_subject_certificate_scope",
      "identity.scope",
      "identity.accessScope",
      "identity.access_scope",
      "identity.certificateScope",
      "identity.certificate_scope",
      "certificate.scope",
      "certificate.accessScope",
      "certificate.access_scope",
      "certificate.certificateScope",
      "certificate.certificate_scope",
      "operationalCertificate.scope",
      "operationalCertificate.accessScope",
      "operationalCertificate.access_scope",
      "operationalCertificate.certificateScope",
      "operationalCertificate.certificate_scope",
      "operational_certificate.scope",
      "operational_certificate.accessScope",
      "operational_certificate.access_scope",
      "operational_certificate.certificateScope",
      "operational_certificate.certificate_scope",
      "access.scope",
      "access.accessScope",
      "access.access_scope"
    ]) || "MATRIX_LIMITED";

  const accessDecisionRaw =
    firstStringFromSources(sources, [
      "accessDecision",
      "access_decision",
      "verified_subject_access_decision",
      "identity.accessDecision",
      "identity.access_decision",
      "access.decision",
      "access.accessDecision",
      "access.access_decision"
    ]) || "";

  const identityBindingRaw =
    firstStringFromSources(sources, [
      "identityBinding",
      "identity_binding",
      "access.identityBinding",
      "access.identity_binding",
      "identity.identityBinding",
      "identity.identity_binding"
    ]) || "";

  const hasHumanIpr = humanIpr !== "NOT_VERIFIED" && humanIpr.trim().length > 0;
  const hasCertificate = certificateId !== "NO_CERTIFICATE" && certificateId.trim().length > 0;
  const active = ["ACTIVE", "VALID"].includes(status.toUpperCase());
  const jokerScope = scope.toUpperCase().includes("JOKER_C2_ACCESS");
  const accessGranted =
    !accessDecisionRaw || accessDecisionRaw.toUpperCase() === "ACCESS_GRANTED";
  const bindingValid =
    !identityBindingRaw ||
    identityBindingRaw === "IPR_VERIFIED_BIOLOGICAL_SUBJECT" ||
    identityBindingRaw.toUpperCase() === "IPR_VERIFIED_BIOLOGICAL_SUBJECT";

  const accepted =
    hasHumanIpr &&
    hasCertificate &&
    active &&
    jokerScope &&
    accessGranted &&
    bindingValid;

  if (!accepted) {
    return {
      detected: source !== "none" || hasHumanIpr || hasCertificate,
      source,
      authority: "SERVER_VALIDATION_REQUIRED",
      subjectName: subjectName || "No verified subject",
      humanIpr,
      certificateId,
      cardSerial,
      status,
      scope,
      accessDecision: "ACCESS_LIMITED",
      identityBinding: "NOT_VERIFIED",
      matrixState: "MATRIX_LIMITED",
      semanticMemoryScope: "RUNTIME_ONLY",
      reason:
        source === "none" && !hasHumanIpr && !hasCertificate
          ? "No IPR handoff was found in body, query, header or referer."
          : "IPR handoff was detected but did not satisfy human IPR, certificate, ACTIVE status, JOKER_C2_ACCESS scope, ACCESS_GRANTED and valid identity binding together."
    };
  }

  return {
    detected: true,
    source,
    authority: "SERVER_RUNTIME_VALIDATED",
    subjectName,
    humanIpr,
    certificateId,
    cardSerial,
    status: status.toUpperCase(),
    scope,
    accessDecision: "ACCESS_GRANTED",
    identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND",
    reason: "IPR handoff accepted server-side for this request."
  };
}

function resolveHandoffFromReferer(request: NextRequest): string {
  const referer = request.headers.get("referer") || request.headers.get("referrer") || "";

  if (!referer) {
    return "";
  }

  try {
    const url = new URL(referer);

    return (
      url.searchParams.get("hbce_ipr_handoff_b64") ||
      url.searchParams.get("ipr_handoff_b64") ||
      url.searchParams.get("iprHandoffB64") ||
      url.searchParams.get("handoffB64") ||
      ""
    );
  } catch {
    return "";
  }
}

function getOrCreateMemory(
  sessionId: string,
  handoff: HandoffResolution,
  t: string
): RuntimeMemoryState {
  const memoryKey =
    handoff.semanticMemoryScope === "IPR_BOUND"
      ? "IPR:" + handoff.humanIpr
      : "SESSION:" + sessionId;

  const existing = processMemory.get(memoryKey);

  if (existing) {
    existing.updatedAt = t;
    existing.scope = handoff.semanticMemoryScope;
    existing.subjectIpr = handoff.humanIpr;
    existing.authority =
      handoff.semanticMemoryScope === "IPR_BOUND"
        ? "SERVER_RUNTIME_VALIDATED"
        : "PROCESS_MEMORY_MVP";
    return existing;
  }

  const created: RuntimeMemoryState = {
    sessionId,
    createdAt: t,
    updatedAt: t,
    turns: 0,
    scope: handoff.semanticMemoryScope,
    authority:
      handoff.semanticMemoryScope === "IPR_BOUND"
        ? "SERVER_RUNTIME_VALIDATED"
        : "PROCESS_MEMORY_MVP",
    persistenceMode: "PROCESS_MEMORY_MVP",
    subjectIpr: handoff.humanIpr,
    lastEvtId: "none",
    lastOpcId: "none",
    lastUserMessage: "",
    lastAssistantMessage: "",
    facts: [
      "Runtime initialized under " + CANONICAL_EVT + " / " + CYCLE + ".",
      "OPC is a technical proof receipt only; legalCertification=false."
    ]
  };

  processMemory.set(memoryKey, created);
  return created;
}

function updateMemoryAfterTurn(args: {
  memory: RuntimeMemoryState;
  t: string;
  handoff: HandoffResolution;
  userMessage: string;
  assistantMessage: string;
  evtId: string;
  opcId: string;
  policy: PolicyEvaluation;
}): void {
  args.memory.updatedAt = args.t;
  args.memory.turns += 1;
  args.memory.scope = args.handoff.semanticMemoryScope;
  args.memory.subjectIpr = args.handoff.humanIpr;
  args.memory.authority =
    args.handoff.semanticMemoryScope === "IPR_BOUND"
      ? "SERVER_RUNTIME_VALIDATED"
      : "PROCESS_MEMORY_MVP";
  args.memory.lastEvtId = args.evtId;
  args.memory.lastOpcId = args.opcId;
  args.memory.lastUserMessage = truncate(args.userMessage, 1000);
  args.memory.lastAssistantMessage = truncate(args.assistantMessage, 1000);

  const operationalFact = extractOperationalFact(args.userMessage);

  if (operationalFact) {
    args.memory.facts.push(operationalFact);
  }

  args.memory.facts.push(
    "Turn " +
      String(args.memory.turns) +
      " completed with policy=" +
      args.policy.decision +
      ", risk=" +
      args.policy.riskLevel +
      ", evt=" +
      args.evtId +
      ", opc=" +
      args.opcId +
      "."
  );

  if (args.memory.facts.length > MEMORY_LIMIT) {
    args.memory.facts = args.memory.facts.slice(-MEMORY_LIMIT);
  }
}

function extractOperationalFact(message: string): string | null {
  const clean = truncate(message.replace(/\s+/g, " ").trim(), 360);

  if (!clean) {
    return null;
  }

  if (/(EVT-|IPR|OPC|JOKER|HBCE|MATRIX|memoria|memory|Vercel|GitHub|route\.ts|api\/chat)/i.test(clean)) {
    return "Operational note from user: " + clean;
  }

  return null;
}

function toPublicMemory(memory: RuntimeMemoryState): JsonObject {
  return {
    sessionId: memory.sessionId,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    turns: memory.turns,
    scope: memory.scope,
    authority: memory.authority,
    persistenceMode: memory.persistenceMode,
    subjectIpr: memory.subjectIpr,
    lastEvtId: memory.lastEvtId,
    lastOpcId: memory.lastOpcId,
    facts: memory.facts
  };
}

function buildEvtRecord(args: {
  t: string;
  sessionId: string;
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  providerState: string;
}): EvtRecord {
  const raw = {
    id: buildId("EVT", args.t),
    prev: args.memory.lastEvtId === "none" ? CANONICAL_EVT : args.memory.lastEvtId,
    t: args.t,
    eventFamily: EVENT_FAMILY,
    cycle: CYCLE,
    entity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    subjectIpr: args.handoff.humanIpr,
    sessionId: args.sessionId,
    state: args.providerState,
    decision: args.handoff.accessDecision,
    policyDecision: args.policy.decision,
    riskLevel: args.policy.riskLevel,
    memoryScope: args.handoff.semanticMemoryScope
  };

  const hash = sha256(raw);

  return {
    ...raw,
    evt: raw.id,
    eventFamily: "UP-EVT",
    cycle: "UP-CANONICO",
    entity: "AI_JOKER",
    runtimeIpr: "IPR-AI-0001",
    hash,
    anchors: {
      hash,
      publicHash: hash,
      fullHash: hash,
      algorithm: "sha256"
    }
  };
}

function buildOpcProofRecord(args: {
  t: string;
  sessionId: string;
  handoff: HandoffResolution;
  evt: EvtRecord;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  memoryHash: string;
}): OpcProofRecord {
  const raw = {
    id: buildId("OPC", args.t),
    t: args.t,
    evt: args.evt.id,
    entity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    subjectIpr: args.handoff.humanIpr,
    sessionId: args.sessionId,
    receiptType: "OPC_TECHNICAL_PROOF_RECEIPT",
    legalCertification: false,
    inputHash: args.inputHash,
    outputHash: args.outputHash,
    evtHash: args.evt.hash,
    policyHash: args.policyHash,
    memoryHash: args.memoryHash
  };

  const chainHash = sha256(raw);

  return {
    ...raw,
    proofId: raw.id,
    timestamp: raw.t,
    entity: "AI_JOKER",
    runtimeIpr: "IPR-AI-0001",
    receiptType: "OPC_TECHNICAL_PROOF_RECEIPT",
    legalCertification: false,
    eventHash: raw.evtHash,
    chainHash,
    verificationStatus: "TECHNICAL_PROOF_GENERATED"
  };
}

function buildPublicEvt(evt: EvtRecord): JsonObject {
  return {
    ...evt,
    evt: evt.id,
    id: evt.id,
    trace: {
      hash_algorithm: "sha256",
      canonicalization: "deterministic-json",
      hash: evt.hash
    },
    verification: {
      status: "VERIFIABLE",
      legalCertification: false
    }
  };
}

function buildPublicOpc(opc: OpcProofRecord): JsonObject {
  return {
    ...opc,
    id: opc.id,
    proofId: opc.id,
    timestamp: opc.t,
    eventId: opc.evt,
    eventHash: opc.evtHash,
    chainHash: opc.chainHash,
    verificationStatus: opc.verificationStatus,
    legalCertification: false,
    verification: {
      status: opc.verificationStatus,
      legalCertification: false
    }
  };
}

function buildRuntimeIdentity(): JsonObject {
  return {
    entity: RUNTIME_ENTITY,
    ipr: RUNTIME_IPR,
    evt: CANONICAL_EVT,
    prev: CANONICAL_PREV,
    eventFamily: EVENT_FAMILY,
    state: "ACTIVE",
    cycle: CYCLE,
    core: CORE,
    org: ORG,
    location: LOCATION,
    projectBirth: {
      t: PROJECT_BIRTH,
      root: "EVT-0008",
      proto: "UNEBDO-ΦΩ"
    },
    monthlyReference: {
      evt: "EVT-0015-AI",
      cycle: "UP-MESE-4",
      t: "2026-05-19T15:30:00+02:00"
    }
  };
}

function buildBoundary(): JsonObject {
  return {
    legalCertification: false,
    opc: "technical proof receipt only",
    ipr: "operational identity record, not public authority identity issuance",
    memory: "PROCESS_MEMORY_MVP is volatile in serverless runtime and does not replace database persistence.",
    aiGovernanceBoundary: "Runtime policy, risk and oversight records support auditability but do not replace human or legal review.",
    privacy: "Do not send unauthorized personal, medical, legal, financial or secret material to the runtime."
  };
}

async function readJsonBody(request: NextRequest): Promise<JsonObject> {
  try {
    const body = (await request.json()) as unknown;
    return asJsonObject(body) || {};
  } catch {
    return {};
  }
}

function resolveSessionId(body: JsonObject): string {
  const fromBody = firstStringFromSources([body], [
    "sessionId",
    "session",
    "conversationId",
    "threadId"
  ]);

  if (fromBody) {
    return fromBody;
  }

  return "JOKER-API-" + randomUUID();
}

function normalizeUserMessage(body: JsonObject, turns: ChatTurn[]): string {
  const direct = firstStringFromSources([body], [
    "message",
    "prompt",
    "input",
    "text",
    "content"
  ]);

  if (direct) {
    return direct;
  }

  const lastUser = [...turns].reverse().find((turn) => turn.role === "user");

  if (lastUser?.content) {
    return lastUser.content;
  }

  return "";
}

function normalizeIncomingMessages(value: JsonValue | undefined): ChatTurn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const turns: ChatTurn[] = [];

  for (const item of value) {
    const object = asJsonObject(item);

    if (!object) {
      continue;
    }

    const roleRaw = stringFromValue(object.role).toLowerCase();
    const role: ChatTurn["role"] =
      roleRaw === "system" || roleRaw === "assistant" || roleRaw === "user"
        ? roleRaw
        : "user";

    const content = contentToText(object.content);

    if (content.trim().length > 0) {
      turns.push({
        role,
        content: truncate(content.trim(), 8000)
      });
    }
  }

  return turns;
}

function normalizeFiles(value: JsonValue | undefined): PublicFileSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const files: PublicFileSnapshot[] = [];

  for (const item of value) {
    const object = asJsonObject(item);

    if (!object) {
      continue;
    }

    const name =
      firstStringFromSources([object], ["name", "filename", "fileName", "title"]) ||
      "unnamed-file";

    const type =
      firstStringFromSources([object], ["type", "mimeType", "mime", "contentType"]) ||
      "application/octet-stream";

    const content = contentToText(
      object.content || object.text || object.body || object.preview || object.data || ""
    );

    const sizeValue = object.size;
    const size =
      typeof sizeValue === "number" && Number.isFinite(sizeValue)
        ? sizeValue
        : content.length;

    files.push({
      name,
      type,
      size,
      hash: sha256({
        name,
        type,
        size,
        content
      }),
      preview: content ? truncate(content, 2000) : undefined
    });
  }

  return files.slice(0, 12);
}

function resolveModel(body: JsonObject, policy: PolicyEvaluation): string {
  const requested = firstStringFromSources([body], [
    "model",
    "jokerModel",
    "runtimeModel"
  ]);

  if (requested && /^[a-zA-Z0-9._:-]+$/.test(requested)) {
    return requested;
  }

  if (policy.riskLevel === "HIGH") {
    return process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;
  }

  return process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
}

function decodeBase64Json(value: string): JsonObject | null {
  try {
    const decodedURIComponent = decodeURIComponent(value);
    const normalized = decodedURIComponent.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;
    return asJsonObject(parsed);
  } catch {
    return null;
  }
}

function firstStringFromSources(
  sources: Array<JsonObject | null | undefined>,
  paths: string[]
): string | undefined {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const path of paths) {
      const value = getPath(source, path);
      const text = stringFromValue(value).trim();

      if (text.length > 0) {
        return text;
      }
    }
  }

  return undefined;
}

function firstStringOrJoinedFromSources(
  sources: Array<JsonObject | null | undefined>,
  paths: string[]
): string | undefined {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const path of paths) {
      const value = getPath(source, path);
      const values = flattenStringValues(value);
      const text = values.join(", ").trim();

      if (text.length > 0) {
        return text;
      }
    }
  }

  return undefined;
}

function flattenStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenStringValues(item));
  }

  if (isJsonObject(value)) {
    return Object.values(value).flatMap((item) => flattenStringValues(item));
  }

  return [];
}

function getPath(source: JsonObject, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!isJsonObject(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function contentToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        const object = asJsonObject(item);

        if (!object) {
          return "";
        }

        return (
          stringFromValue(object.text) ||
          stringFromValue(object.content) ||
          stringFromValue(object.value)
        );
      })
      .filter(Boolean)
      .join("\n");
  }

  if (isJsonObject(value)) {
    return JSON.stringify(value);
  }

  return "";
}

function stringFromValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function asJsonObject(value: unknown): JsonObject | null {
  if (isJsonObject(value)) {
    return value;
  }

  return null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildId(prefix: "EVT" | "OPC", isoDate: string): string {
  const compactTime = isoDate
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
    .replace("T", "")
    .replace("Z", "");

  const suffix = createHash("sha256")
    .update(prefix + ":" + isoDate + ":" + randomUUID(), "utf8")
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  return prefix + "-" + compactTime + "-" + suffix;
}

function sha256(value: unknown): string {
  return (
    "sha256:" +
    createHash("sha256")
      .update(canonicalize(value), "utf8")
      .digest("hex")
  );
}

function canonicalize(value: unknown): string {
  return JSON.stringify(toCanonicalValue(value));
}

function toCanonicalValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCanonicalValue(item));
  }

  if (isJsonObject(value)) {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value).sort();

    for (const key of keys) {
      sorted[key] = toCanonicalValue(value[key]);
    }

    return sorted;
  }

  return String(value);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength - 1) + "…";
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown provider error";
}

function jsonResponse(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-Runtime": "AI_JOKER-C2",
      "X-HBCE-Legal-Certification": "false"
    }
  });
}
