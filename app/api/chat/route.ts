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

type HandoffResolution = {
  detected: boolean;
  source: "body" | "query" | "header" | "none";
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
};

type OpcProofRecord = {
  id: string;
  t: string;
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
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const standardModel = process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
  const deepModel = process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;

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
    identity: {
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
    },
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
      reason:
        "Health check only. IPR-bound memory is activated during POST when a valid handoff is present."
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

  const userInputFrame = {
    message,
    files,
    sessionId,
    handoff,
    policy,
    memoryBefore: toPublicMemory(memory)
  };

  const inputHash = sha256(userInputFrame);
  const memoryHashBefore = sha256(memory);

  let answer = "";
  let providerState: "COMPLETED" | "LOCAL_FALLBACK" | "PROVIDER_ERROR" = "COMPLETED";
  let providerError: string | null = null;

  if (policy.decision === "BLOCK") {
    answer = buildBlockedAnswer(policy);
    providerState = "LOCAL_FALLBACK";
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
    outputHash: sha256(answer),
    policyHash: sha256(policy),
    memoryHash: memoryHashBefore
  });

  updateMemoryAfterTurn({
    memory,
    t,
    handoff,
    userMessage: message,
    assistantMessage: answer,
    evtId: evt.id,
    opcId: opc.id,
    policy
  });

  const payload = {
    ok: policy.decision !== "BLOCK",
    answer,
    reply: answer,
    message: answer,
    output: answer,
    sessionId,
    runtime: RUNTIME_ENTITY,
    state: providerState,
    provider: "openai",
    apiMode: openAIConfigured ? "OPENAI_CONFIGURED" : "LOCAL_FALLBACK",
    model,
    standardModel: process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL,
    deepModel: process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL,
    openAIConfigured,
    identity: {
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
    },
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
    memory: toPublicMemory(memory),
    matrix: {
      state: handoff.matrixState,
      active: handoff.matrixState === "MATRIX_ACTIVE",
      reason:
        handoff.matrixState === "MATRIX_ACTIVE"
          ? "Server-side runtime accepted the IPR handoff for this request."
          : "No valid IPR handoff was accepted for this request."
    },
    evt,
    opc,
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
    diagnostics: {
      inputHash,
      outputHash: sha256(answer),
      memoryHashBefore,
      memoryHashAfter: sha256(memory),
      providerError,
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

  const messages = [
    {
      role: "system" as const,
      content: systemPrompt
    },
    ...safeHistory,
    {
      role: "user" as const,
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
    return "JOKER-C2 runtime attivo, ma il provider non ha restituito contenuto utile. EVT e OPC sono comunque stati generati per tracciare l’evento.";
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
    "Subject: " + handoff.subjectName,
    "Human IPR: " + handoff.humanIpr,
    "Certificate: " + handoff.certificateId,
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
    "If the user asks for GitHub or code work, provide complete files when requested, not partial patches.",
    "If visibility is incomplete, say so clearly."
  ].join("\n");
}

function buildUserPrompt(message: string, files: PublicFileSnapshot[]): string {
  if (files.length === 0) {
    return message;
  }

  return [
    message,
    "",
    "File snapshots available to this request:",
    JSON.stringify(files, null, 2)
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
      ? "Identità operativa rilevata: " +
        handoff.subjectName +
        " / " +
        handoff.humanIpr +
        "."
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
    truncate(message, 1200),
    "",
    "OPENAI_API_KEY non risulta configurata nel runtime Vercel, quindi la risposta cognitiva del modello non è stata invocata. EVT e OPC tecnici vengono comunque prodotti per mantenere continuità operativa."
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
    truncate(message, 1200),
    "",
    "EVT e OPC tecnici sono stati comunque generati per tracciare il fallimento del provider, perché almeno qualcuno qui deve comportarsi con continuità."
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
  const text = [message, ...files.map((file) => file.preview || "")].join("\n").toLowerCase();
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
      reason:
        "The request contains both cyber-risk terms and possible credential or secret material."
    };
  }

  if (hasSensitive || hasSecrets || hasCyberRisk) {
    return {
      decision: "ALLOW",
      dataClass: hasSensitive || hasSecrets ? "SENSITIVE_POSSIBLE" : "OPERATIONAL",
      riskLevel: hasCyberRisk || hasSecrets ? "MEDIUM" : "LOW",
      humanOversight: hasCyberRisk || hasSecrets ? "RECOMMENDED" : "NOT_REQUIRED",
      flags,
      reason:
        "The request can proceed, but the runtime records additional operational caution."
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
  const bodyObject =
    asJsonObject(body.iprHandoff) ||
    asJsonObject(body.handoff) ||
    asJsonObject(body.identityHandoff) ||
    asJsonObject(body.identity) ||
    null;

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
    "";

  const headerEncoded =
    request.headers.get("x-hbce-ipr-handoff-b64") ||
    request.headers.get("x-ipr-handoff-b64") ||
    "";

  const decodedBody = bodyEncoded ? decodeBase64Json(bodyEncoded) : null;
  const decodedQuery = queryEncoded ? decodeBase64Json(queryEncoded) : null;
  const decodedHeader = headerEncoded ? decodeBase64Json(headerEncoded) : null;

  const source: HandoffResolution["source"] = decodedHeader
    ? "header"
    : decodedBody || bodyObject
      ? "body"
      : decodedQuery
        ? "query"
        : "none";

  const sources = [decodedHeader, decodedBody, bodyObject, decodedQuery, body];

  const subjectName =
    firstStringFromSources(sources, [
      "subjectName",
      "biologicalSubject",
      "name",
      "fullName",
      "identity.subjectName",
      "identity.name",
      "subject.name",
      "human.name"
    ]) || "No verified subject";

  const humanIpr =
    firstStringFromSources(sources, [
      "humanIpr",
      "humanIPR",
      "biologicalIpr",
      "biologicalIPR",
      "subjectIpr",
      "subjectIPR",
      "ipr",
      "identity.humanIpr",
      "identity.ipr",
      "subject.ipr",
      "human.ipr"
    ]) || "NOT_VERIFIED";

  const certificateId =
    firstStringFromSources(sources, [
      "certificateId",
      "certificateID",
      "certificate",
      "certId",
      "cert",
      "identity.certificateId",
      "certificate.id"
    ]) || "NO_CERTIFICATE";

  const cardSerial =
    firstStringFromSources(sources, [
      "cardSerial",
      "card",
      "iprCard",
      "iprCardSerial",
      "identity.cardSerial",
      "card.serial"
    ]) || "NO_CARD";

  const status =
    firstStringFromSources(sources, [
      "status",
      "certificateStatus",
      "identity.status",
      "certificate.status"
    ]) || "MISSING";

  const scope =
    firstStringFromSources(sources, ["scope", "accessScope", "identity.scope", "certificate.scope"]) ||
    "MATRIX_LIMITED";

  const hasHumanIpr = humanIpr !== "NOT_VERIFIED" && humanIpr.trim().length > 0;
  const hasCertificate =
    certificateId !== "NO_CERTIFICATE" && certificateId.trim().length > 0;
  const active = status.toUpperCase() === "ACTIVE";
  const jokerScope = scope.toUpperCase().includes("JOKER_C2_ACCESS");
  const accepted = hasHumanIpr && hasCertificate && active && jokerScope;

  if (!accepted) {
    return {
      detected: source !== "none",
      source,
      authority: "SERVER_VALIDATION_REQUIRED",
      subjectName,
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
        source === "none"
          ? "No IPR handoff was found in body, query or headers."
          : "IPR handoff was detected but did not satisfy human IPR, certificate, ACTIVE status and JOKER_C2_ACCESS scope together."
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
    status,
    scope,
    accessDecision: "ACCESS_GRANTED",
    identityBinding: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    matrixState: "MATRIX_ACTIVE",
    semanticMemoryScope: "IPR_BOUND",
    reason:
      "IPR handoff accepted server-side for this request using human IPR, certificate, ACTIVE status and JOKER_C2_ACCESS scope."
  };
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

  return {
    ...raw,
    eventFamily: "UP-EVT",
    cycle: "UP-CANONICO",
    entity: "AI_JOKER",
    runtimeIpr: "IPR-AI-0001",
    hash: sha256(raw)
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

  return {
    ...raw,
    entity: "AI_JOKER",
    runtimeIpr: "IPR-AI-0001",
    receiptType: "OPC_TECHNICAL_PROOF_RECEIPT",
    legalCertification: false,
    chainHash: sha256(raw),
    verificationStatus: "TECHNICAL_PROOF_GENERATED"
  };
}

function buildBoundary(): JsonObject {
  return {
    legalCertification: false,
    opc: "technical proof receipt only",
    ipr: "operational identity record, not public authority identity issuance",
    memory:
      "PROCESS_MEMORY_MVP is volatile in serverless runtime and does not replace database persistence.",
    aiGovernanceBoundary:
      "Runtime policy, risk and oversight records support auditability but do not replace human or legal review.",
    privacy:
      "Do not send unauthorized personal, medical, legal, financial or secret material to the runtime."
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

  return "joker-c2-session-" + randomUUID();
}

function normalizeUserMessage(body: JsonObject, turns: ChatTurn[]): string {
  const direct = firstStringFromSources([body], ["message", "prompt", "input", "text", "content"]);

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
    const role =
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
  const requested = firstStringFromSources([body], ["model", "jokerModel", "runtimeModel"]);

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
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
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
      "Cache-Control": "no-store"
    }
  });
}
