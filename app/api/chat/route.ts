import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import {
  HBCE_SELF_PILOT_ACCOUNT_ID,
  HBCE_SELF_PILOT_CERTIFICATE_ID,
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_SUBSCRIPTION_ID,
  HBCE_SELF_PILOT_SUBSCRIPTION_TIER,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";

import { appendRuntimeAuditLogRecordAsync } from "@/lib/runtime-audit-log";
import { appendModelUsageLogRecordAsync } from "@/lib/model-usage-log";
import { persistEventToDatabase } from "@/lib/evt-ledger";
import { persistOpcProofRecordToDatabase } from "@/lib/opc-proof";

import {
  getOrCreateRuntimeMemory,
  updateMemoryAfterCompletion,
  toPublicMemoryRecord,
  describeRuntimeMemoryStore,
  getRuntimeMemoryFlushErrors,
  isRuntimeMemoryDatabasePersistent,
  isRuntimeMemoryDatabaseReady
} from "@/lib/ipr-bound-memory";

import type {
  IprBoundMemoryCertificate,
  IprBoundMemoryHandoffEvaluation,
  IprBoundMemoryRecord,
  IprBoundMemoryRuntimeIdentity,
  IprBoundMemorySubject,
  MemoryPersistenceMode,
  MemoryScope
} from "@/lib/ipr-bound-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RuntimeAuditAppendInput = Parameters<typeof appendRuntimeAuditLogRecordAsync>[0];
type ModelUsageAppendInput = Parameters<typeof appendModelUsageLogRecordAsync>[0];
type EvtDatabaseRuntimeEvent = Parameters<typeof persistEventToDatabase>[0];
type OpcDatabaseProofRecord = Parameters<typeof persistOpcProofRecordToDatabase>[0];

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
  operationDecision: "ALLOW" | "LIMITED" | "REFUSED" | "ESCALATE" | "BLOCK";
  securityOutcome:
    | "NORMAL_ALLOWED_OPERATION"
    | "REQUEST_REFUSED_WITHIN_GRANTED_SESSION"
    | "LIMITED_OPERATION_WITH_AUDIT"
    | "ESCALATED_FOR_HUMAN_REVIEW"
    | "BLOCKED_BY_RUNTIME_POLICY";
  dataClass:
    | "PUBLIC_OR_SYNTHETIC"
    | "OPERATIONAL"
    | "SENSITIVE_POSSIBLE"
    | "PERSONAL_DATA_PRESENT"
    | "COMPLIANCE_SENSITIVE"
    | "CREDENTIAL_OR_SECRET"
    | "CYBER_SECURITY_RELEVANT";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  humanOversight: "NOT_REQUIRED" | "RECOMMENDED" | "REQUIRED";
  flags: string[];
  limited: boolean;
  refused: boolean;
  blocked: boolean;
  failClosed: boolean;
  reason: string;
};

type CognitiveChainNode = {
  node: number;
  statement: string;
  source: "USER_REQUEST" | "RUNTIME_DERIVED";
  humanIpr: string;
  sessionId: string;
  tenantId: string;
  workspaceId: string;
  evt: string;
  opc: string;
  policyDecision: string;
  operationDecision: string;
  securityOutcome: string;
  riskLevel: string;
  refused: boolean;
  legalCertification: false;
  t: string;
};

type RuntimeMemoryState = {
  record: IprBoundMemoryRecord;
  sessionId: string;
  memoryId: string;
  memoryKeyHash: string;
  memoryHash: string;
  createdAt: string;
  updatedAt: string;
  turns: number;
  scope: MemoryScope;
  authority: "SERVER_RUNTIME_VALIDATED" | "SESSION_RUNTIME_ONLY";
  persistenceMode: MemoryPersistenceMode;
  persistenceStatus: string;
  persistenceDurable: boolean;
  persistenceDatabaseReady: boolean;
  persistenceDatabaseRequired: boolean;
  storeName: string;
  storeKind: string;
  storeStatus: string;
  storeDurable: boolean;
  storeRuntimeScoped: boolean;
  storeRecordCount: number;
  storePersistenceStage: string;
  storeSaasReady: boolean;
  storeRequiresDatabase: boolean;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  subjectIpr: string;
  lastEvtId: string;
  lastOpcId: string;
  lastOpcChainHash: string;
  lastUserMessage: string;
  lastAssistantMessage: string;
  facts: string[];
  cognitiveChain: CognitiveChainNode[];
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
  operationDecision: string;
  securityOutcome: string;
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

type CompletionTokenUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cachedInputTokens: number | null;
  reasoningTokens: number | null;
};

type ProviderCompletionResult = {
  answer: string;
  usage: CompletionTokenUsage;
  finishReason: string | null;
};

type SaasRuntimeSource =
  | "BODY"
  | "SELF_PILOT_SCHEMA_FALLBACK"
  | "PLACEHOLDER";

type SaasRuntimeContext = {
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;
  saasTier: "BASE" | "IPR";
  source: SaasRuntimeSource;
};

type RuntimePersistenceBridgeResult = {
  evtPersistence: JsonObject;
  opcPersistence: JsonObject;
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

const COGNITIVE_CHAIN_FACT_PREFIX = "HBCE_COGNITIVE_CHAIN_NODE::";
const COGNITIVE_CHAIN_MAX_NODES = 10;

const HBCE_ALIEN_CODE_PIPELINE = {
  psiInit: "PSI_INIT_BOOTSTRAP",
  lambdaIo: "LAMBDA_INPUT_OUTPUT",
  kappaRecognitionThreshold: "KAPPA_RECOGNITION_GATE",
  sigmaCoherenceField: "SIGMA_COHERENCE_FIELD",
  tauTraceRecord: "TAU_TRACE_RECORD",
  chiTauEthicalCriticality: "CHI_TAU_RISK_GATE",
  omegaMemory: "OMEGA_MEMORY_STATE",
  piStarUpgradeGate: "PI_STAR_UPGRADE_GATE",
  psiPrimeExpansion: "PSI_PRIME_EXPANSION",
  phiInfinityLearning: "PHI_INFINITY_LEARNING",
  omegaInfinityBackup: "OMEGA_INFINITY_BACKUP",
  xiOmegaComputeFeedback: "XI_OMEGA_FEEDBACK"
} as const;

const EMPTY_TOKEN_USAGE: CompletionTokenUsage = {
  inputTokens: null,
  outputTokens: null,
  totalTokens: null,
  cachedInputTokens: null,
  reasoningTokens: null
};

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

function toJsonValue(value: unknown): JsonValue {
  if (value === null) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (typeof value === "object") {
    const output: JsonObject = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = toJsonValue(item);
    }

    return output;
  }

  return null;
}

function toJsonObject(value: unknown, fallback: JsonObject = {}): JsonObject {
  const converted = toJsonValue(value);

  if (converted && typeof converted === "object" && !Array.isArray(converted)) {
    return converted;
  }

  return fallback;
}

function stringFromValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function buildId(prefix: string, t: string): string {
  return `${prefix}-${t.replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildAlienCodePipelineDiagnostic(): JsonObject {
  return {
    active: true,
    mode: "HBCE_SYMBOLIC_OPERATIONAL_PIPELINE",
    legalCertification: false,
    stages: toJsonObject(HBCE_ALIEN_CODE_PIPELINE),
    boundary:
      "Alien Code is used here as an HBCE symbolic-operational routing and diagnostic frame. It is not legal certification, public authority validation, medical claim or scientific proof."
  };
}
export async function GET(): Promise<NextResponse> {
  const standardModel = process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
  const deepModel = process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const memoryStore = describeRuntimeMemoryStore();

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
    alienCodePipeline: buildAlienCodePipelineDiagnostic(),
    access: {
      decision: "SERVER_VALIDATION_REQUIRED",
      matrixState: "MATRIX_LIMITED",
      semanticMemoryScope: "RUNTIME_ONLY",
      identityBinding: "NOT_VERIFIED"
    },
    memory: {
      scope: "RUNTIME_ONLY",
      authority: "SESSION_RUNTIME_ONLY",
      persistenceMode: stringFromValue(memoryStore.kind) || "UNKNOWN",
      persistenceStatus: stringFromValue(memoryStore.persistenceStage) || "UNKNOWN",
      persistenceDurable: Boolean(memoryStore.durable),
      databaseReady: isRuntimeMemoryDatabaseReady(),
      databasePersistent: isRuntimeMemoryDatabasePersistent(),
      cognitiveChain: {
        enabled: true,
        maxNodes: COGNITIVE_CHAIN_MAX_NODES,
        source: "POST_RUNTIME_MEMORY_ONLY",
        legalCertification: false
      },
      reason:
        "Health check only. IPR-bound memory and cognitive chain are activated during POST when a valid handoff is present.",
      store: toJsonObject(memoryStore, {})
    },
    saas: {
      project: "Project HBCE R&D Transfer SaaS",
      release: "SaaS Core v0.1",
      tenantId: "SERVER_VALIDATION_REQUIRED",
      workspaceId: "SERVER_VALIDATION_REQUIRED",
      subscriptionId: "SERVER_VALIDATION_REQUIRED",
      accountId: "SERVER_VALIDATION_REQUIRED",
      source: "HEALTH_CHECK",
      legalCertification: false
    },
    matrix: {
      state: "MATRIX_LIMITED",
      active: false,
      reason: "Waiting for server-side IPR handoff validation."
    },
    persistence: {
      evt: "DATABASE_PERSISTENT_TARGET",
      opc: "DATABASE_PERSISTENT_TARGET",
      audit: "DATABASE_PERSISTENT_TARGET",
      modelUsage: "DATABASE_PERSISTENT_TARGET",
      memory: stringFromValue(memoryStore.kind) || "UNKNOWN",
      cognitiveChain: "DATABASE_PERSISTENT_MEMORY_FACTS_TARGET",
      legalCertification: false
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

  const runtimeDiagnosticsRequested = isRuntimeDiagnosticsQuestion(message);
  const cognitiveChainRequested = isCognitiveChainQuestion(message);

  const handoff = resolveHandoff(request, body);
  const policy = evaluatePolicy(message, files);
  const saasContext = resolveSaasRuntimeContext(body, sessionId);
  let memory = getOrCreateMemory(sessionId, handoff, t, saasContext);

  const model = resolveModel(body, policy);
  const modelLevel = resolveModelLevel(model, policy);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const inputHash = sha256({
    sessionId,
    message,
    files,
    handoff,
    policy,
    memoryBefore: toPublicMemory(memory),
    saasContext,
    cognitiveChainRequested,
    runtimeDiagnosticsRequested
  });

  const memoryHashBefore = sha256(memory);

  let answer = "";
  let providerState: "COMPLETED" | "LOCAL_FALLBACK" | "PROVIDER_ERROR" = "COMPLETED";
  let providerName: "OPENAI" | "LOCAL" | "UNKNOWN" = "LOCAL";
  let providerError: string | null = null;
  let tokenUsage: CompletionTokenUsage = EMPTY_TOKEN_USAGE;
  let finishReason: string | null = null;

  if (policy.decision === "BLOCK") {
    answer = buildBlockedAnswer(policy);
    providerState = "LOCAL_FALLBACK";
    providerName = "LOCAL";
  } else if (policy.securityOutcome === "REQUEST_REFUSED_WITHIN_GRANTED_SESSION") {
    answer = buildSecurityRefusalAnswer(handoff, policy, memory, saasContext);
    providerName = "LOCAL";
  } else if (cognitiveChainRequested) {
    answer = buildCognitiveChainAnswer({
      t,
      message,
      handoff,
      policy,
      memory,
      saasContext
    });
    providerName = "LOCAL";
  } else if (isLegalBoundaryQuestion(message)) {
    answer = buildLegalBoundaryAnswer(handoff, policy, memory, saasContext);
    providerName = "LOCAL";
  } else if (runtimeDiagnosticsRequested) {
    answer = buildRuntimeDiagnosticsPreparationAnswer(handoff, memory, policy, saasContext);
    providerName = "LOCAL";
  } else if (isIdentityRecognitionQuestion(message)) {
    answer = buildIdentityRecognitionAnswer(handoff, memory, policy, saasContext);
    providerName = "LOCAL";
  } else if (!openAIConfigured) {
    answer = buildLocalFallbackAnswer(message, handoff, policy, memory, saasContext);
    providerState = "LOCAL_FALLBACK";
    providerName = "LOCAL";
  } else {
    try {
      const completion = await completeWithOpenAI({
        message,
        history: incomingMessages,
        files,
        handoff,
        policy,
        memory,
        model
      });

      answer = completion.answer;
      tokenUsage = completion.usage;
      finishReason = completion.finishReason;
      providerName = "OPENAI";
    } catch (error) {
      providerError = errorToMessage(error);
      answer = buildProviderErrorAnswer(message, handoff, policy, providerError);
      providerState = "PROVIDER_ERROR";
      providerName = "OPENAI";
    }
  }

  const safeAnswer = normalizeAssistantAnswer(answer, message, handoff, policy);
  const outputHash = sha256(safeAnswer);
  const policyHash = sha256(policy);

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
    outputHash,
    policyHash,
    memoryHash: memoryHashBefore
  });

  memory = updateMemoryAfterTurn({
    memory,
    t,
    handoff,
    userMessage: message,
    assistantMessage: safeAnswer,
    evtId: evt.id,
    opcId: opc.id,
    opcChainHash: opc.chainHash,
    policy,
    providerState,
    saasContext
  });

  const memoryHashAfter = sha256(memory);

  const persistenceBridge = await persistEvtAndOpc({
    t,
    sessionId,
    handoff,
    policy,
    memory,
    saasContext,
    model,
    modelLevel,
    providerName,
    providerState,
    evt,
    opc,
    inputHash,
    outputHash,
    policyHash,
    memoryHash: memoryHashAfter
  });

  const auditAndUsage = await recordSaasAuditAndUsage({
    sessionId,
    requestId: buildRequestId(sessionId, t),
    handoff,
    policy,
    memory,
    saasContext,
    model,
    modelLevel,
    providerName,
    tokenUsage,
    evt,
    opc,
    inputHash,
    outputHash,
    policyHash,
    memoryHash: memoryHashAfter,
    providerState
  });

  const publicEvt = buildPublicEvt(evt, persistenceBridge.evtPersistence);
  const publicOpc = buildPublicOpc(opc, persistenceBridge.opcPersistence);

  const finalAnswer =
    runtimeDiagnosticsRequested && !cognitiveChainRequested
      ? buildRuntimeDiagnosticsAnswer({
          handoff,
          policy,
          memory,
          saasContext,
          model,
          modelLevel,
          providerName,
          providerState,
          openAIConfigured,
          evt,
          opc,
          inputHash,
          outputHash,
          policyHash,
          memoryHashBefore,
          memoryHashAfter,
          tokenUsage,
          providerError,
          finishReason,
          persistenceBridge,
          auditAndUsage
        })
      : safeAnswer;

  const payload = {
    ok: policy.decision !== "BLOCK",
    answer: finalAnswer,
    response: finalAnswer,
    reply: finalAnswer,
    message: finalAnswer,
    output: finalAnswer,
    content: finalAnswer,
    text: finalAnswer,
    assistantMessage: finalAnswer,
    assistant: {
      role: "assistant",
      content: finalAnswer
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
      modelLevel,
      state: providerState,
      matrix: handoff.matrixState,
      memory: memory.scope,
      authority: memory.authority,
      mode: memory.persistenceMode,
      memoryPersistenceStatus: memory.persistenceStatus,
      memoryPersistenceDurable: memory.persistenceDurable,
      memoryStore: memory.storeKind,
      cognitiveChainNodes: memory.cognitiveChain.length,
      tenantId: saasContext.tenantId,
      workspaceId: saasContext.workspaceId,
      subscriptionId: saasContext.subscriptionId,
      accountId: saasContext.accountId,
      saasContextSource: saasContext.source,
      operationDecision: policy.operationDecision,
      securityOutcome: policy.securityOutcome,
      refused: policy.refused,
      limited: policy.limited,
      failClosed: policy.failClosed
    },
    provider: "openai",
    providerName,
    apiMode: openAIConfigured ? "OPENAI_CONFIGURED" : "LOCAL_FALLBACK",
    model,
    modelLevel,
    standardModel: process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL,
    deepModel: process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL,
    openAIConfigured,
    identity: buildRuntimeIdentity(),
    alienCodePipeline: buildAlienCodePipelineDiagnostic(),
    access: {
      decision: handoff.accessDecision,
      matrixState: handoff.matrixState,
      semanticMemoryScope: handoff.semanticMemoryScope,
      identityBinding: handoff.identityBinding
    },
    security: {
      outcome: policy.securityOutcome,
      operationDecision: policy.operationDecision,
      limited: policy.limited,
      refused: policy.refused,
      blocked: policy.blocked,
      failClosed: policy.failClosed,
      reason: policy.reason
    },
    saas: {
      project: "Project HBCE R&D Transfer SaaS",
      release: "SaaS Core v0.1",
      tenantId: saasContext.tenantId,
      workspaceId: saasContext.workspaceId,
      subscriptionId: saasContext.subscriptionId,
      accountId: saasContext.accountId,
      threadId: saasContext.threadId,
      tier: saasContext.saasTier,
      source: saasContext.source,
      memory: toPublicMemory(memory),
      cognitiveChain: toJsonValue(memory.cognitiveChain),
      evtPersistence: persistenceBridge.evtPersistence,
      opcPersistence: persistenceBridge.opcPersistence,
      audit: auditAndUsage.audit,
      modelUsage: auditAndUsage.modelUsage,
      legalCertification: false
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
    opc: {
      id: opc.id,
      proofId: opc.id,
      record: opc,
      publicProof: publicOpc,
      persistence: persistenceBridge.opcPersistence,
      verification: {
        status: opc.verificationStatus,
        legalCertification: false
      }
    },
    opcProof: publicOpc,
    responseEvt: evt.id,
    responseEvtId: evt.id,
    evtId: evt.id,
    currentEvt: evt.id,
    currentOpc: opc.id,
    opcId: opc.id,
    audit: auditAndUsage.audit,
    modelUsage: auditAndUsage.modelUsage,
    persistence: {
      evt: persistenceBridge.evtPersistence,
      opc: persistenceBridge.opcPersistence,
      audit: auditAndUsage.audit,
      modelUsage: auditAndUsage.modelUsage,
      memory: toPublicMemory(memory),
      legalCertification: false
    },
    continuity: {
      currentEvt: evt.id,
      previousEvt: evt.prev,
      currentOpc: opc.id,
      chainHash: opc.chainHash,
      canonicalRuntimeEvt: CANONICAL_EVT,
      monthlyReference: CANONICAL_MONTHLY_REF,
      cognitiveChainNodes: memory.cognitiveChain.length
    },
    policy,
    risk: {
      level: policy.riskLevel,
      flags: policy.flags,
      decision: policy.decision,
      operationDecision: policy.operationDecision,
      securityOutcome: policy.securityOutcome,
      limited: policy.limited,
      refused: policy.refused,
      blocked: policy.blocked,
      failClosed: policy.failClosed
    },
    oversight: {
      required: policy.humanOversight === "REQUIRED",
      recommendation: policy.humanOversight,
      reason: policy.reason
    },
    files,
    diagnostics: {
      mode: runtimeDiagnosticsRequested ? "RUNTIME_LOCAL_POST_GENERATION" : "STANDARD_RESPONSE",
      inputHash,
      outputHash,
      policyHash,
      memoryHashBefore,
      memoryHashAfter,
      providerError,
      finishReason,
      tokenUsage: toJsonTokenUsage(tokenUsage),
      handoffSource: handoff.source,
      handoffReason: handoff.reason,
      cognitiveChain: buildCognitiveChainDiagnostics(memory, saasContext),
      alienCodePipeline: buildAlienCodePipelineDiagnostic(),
      memory: toPublicMemory(memory),
      memoryStore: buildMemoryStoreDiagnostic(memory),
      memoryFlushErrors: getRuntimeMemoryFlushErrors(),
      evtPersistence: persistenceBridge.evtPersistence,
      opcPersistence: persistenceBridge.opcPersistence,
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
}): Promise<ProviderCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      answer: buildLocalFallbackAnswer(
        args.message,
        args.handoff,
        args.policy,
        args.memory,
        buildPlaceholderSaasRuntimeContext(args.memory.sessionId)
      ),
      usage: EMPTY_TOKEN_USAGE,
      finishReason: null
    };
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: args.model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(args.handoff, args.policy, args.memory, args.files)
      },
      ...args.history
        .filter((turn) => turn.role === "user" || turn.role === "assistant")
        .slice(-12)
        .map((turn) => ({
          role: turn.role,
          content: truncate(turn.content, 6000)
        })),
      {
        role: "user",
        content: buildUserPrompt(args.message, args.files)
      }
    ]
  });

  const content = completion.choices[0]?.message?.content?.trim();
  const finishReason = completion.choices[0]?.finish_reason ?? null;

  return {
    answer: content || buildEmptyProviderFallback(args.message, args.handoff, args.policy),
    usage: normalizeCompletionUsage(completion.usage),
    finishReason
  };
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
    JSON.stringify(handoff, null, 2),
    "",
    "Policy frame:",
    JSON.stringify(policy, null, 2),
    "",
    "Memory frame:",
    JSON.stringify(toPublicMemory(memory), null, 2),
    "",
    "Attached file snapshots:",
    JSON.stringify(files, null, 2),
    "",
    "Rules:",
    "Answer in the same main language used by the user.",
    "Do not claim legal certification, public authority validation, eIDAS qualification or official identity issuance.",
    "Treat OPC as a technical proof receipt only.",
    "Never recognize a biological subject because the name is written in the prompt.",
    "If the user asks for GitHub or code work, provide complete files when requested, not partial patches.",
    "If visibility is incomplete, say so clearly."
  ].join("\n");
}

function buildUserPrompt(message: string, files: PublicFileSnapshot[]): string {
  if (files.length === 0) return message || "Messaggio utente vuoto.";

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

  if (clean.length > 0) return clean;

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

function isRuntimeDiagnosticsQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return ["diagnostica", "diagnostic", "runtime details", "stato runtime", "debug runtime"].some(
    (term) => normalized.includes(normalizeText(term))
  );
}

function isCognitiveChainQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return ["catena cognitiva", "cognitive chain", "nodo", "nodi", "node", "nodes"].some((term) =>
    normalized.includes(normalizeText(term))
  );
}

function isLegalBoundaryQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    ["limiti legali", "limiti tecnici", "boundary", "certificazione legale", "legal certification"].some(
      (term) => normalized.includes(normalizeText(term))
    ) && ["ipr", "evt", "opc", "legal", "legali", "tecnici"].some((term) => normalized.includes(term))
  );
}

function buildLegalBoundaryAnswer(
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState,
  saasContext: SaasRuntimeContext
): string {
  return [
    "Limiti legali e tecnici da dichiarare per IPR, EVT e OPC.",
    "",
    "IPR è un record operativo di identità e continuità dentro il perimetro HBCE/JOKER-C2. Non è SPID, CIE, passaporto, EUDI Wallet o certificazione pubblica.",
    "",
    "EVT è una traccia tecnica di evento. Collega runtime, soggetto IPR, sessione, decisione, rischio, memoria e continuità temporale. Non è marca temporale qualificata.",
    "",
    "OPC è una ricevuta tecnica di prova operativa. Collega input hash, output hash, policy hash, memory hash, EVT hash e chain hash. Non è certificazione legale.",
    "",
    "Stato runtime corrente:",
    "- Access decision: `" + handoff.accessDecision + "`",
    "- MATRIX: `" + handoff.matrixState + "`",
    "- Memory scope: `" + memory.scope + "`",
    "- Memory persistence: `" + memory.persistenceMode + "`",
    "- Tenant ID: `" + saasContext.tenantId + "`",
    "- Workspace ID: `" + saasContext.workspaceId + "`",
    "- Policy decision: `" + policy.decision + "`",
    "",
    "legalCertification=false"
  ].join("\n");
}

function buildSecurityRefusalAnswer(
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState,
  saasContext: SaasRuntimeContext
): string {
  return [
    "Richiesta non autorizzata rilevata e rifiutata nel perimetro della sessione verificata.",
    "",
    "La sessione IPR può essere valida, ma questa operazione specifica non è consentita.",
    "",
    "- Accesso sessione: `" + handoff.accessDecision + "`",
    "- Decisione policy: `" + policy.decision + "`",
    "- Decisione operazione: `" + policy.operationDecision + "`",
    "- Security outcome: `" + policy.securityOutcome + "`",
    "- Memory scope: `" + memory.scope + "`",
    "- Tenant ID: `" + saasContext.tenantId + "`",
    "",
    "Boundary: OPC ed EVT possono registrare anche il tentativo rifiutato come traccia tecnica, ma non autorizzano l’azione richiesta.",
    "legalCertification=false"
  ].join("\n");
}

function buildRuntimeDiagnosticsPreparationAnswer(
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation,
  saasContext: SaasRuntimeContext
): string {
  return [
    "JOKER-C2 runtime diagnostics requested.",
    "",
    "Runtime entity: " + RUNTIME_ENTITY,
    "Runtime IPR: " + RUNTIME_IPR,
    "Human IPR: " + handoff.humanIpr,
    "MATRIX: " + handoff.matrixState,
    "Memory scope: " + memory.scope,
    "Memory persistence: " + memory.persistenceMode,
    "Tenant ID: " + saasContext.tenantId,
    "Workspace ID: " + saasContext.workspaceId,
    "Policy decision: " + policy.decision,
    "Operation decision: " + policy.operationDecision,
    "Security outcome: " + policy.securityOutcome,
    "legalCertification=false"
  ].join("\n");
}

function buildCognitiveChainAnswer(args: {
  t: string;
  message: string;
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  saasContext: SaasRuntimeContext;
}): string {
  const nodeNumber = args.memory.cognitiveChain.length + 1;
  const statement = truncate(args.message.replace(/\s+/g, " ").trim(), 500) || "Nodo operativo richiesto.";

  const simulatedNode: CognitiveChainNode = {
    node: nodeNumber,
    statement,
    source: "USER_REQUEST",
    humanIpr: args.handoff.humanIpr,
    sessionId: args.memory.sessionId,
    tenantId: args.saasContext.tenantId,
    workspaceId: args.saasContext.workspaceId,
    evt: "PENDING_EVT_AFTER_RUNTIME_COMMIT",
    opc: "PENDING_OPC_AFTER_RUNTIME_COMMIT",
    policyDecision: args.policy.decision,
    operationDecision: args.policy.operationDecision,
    securityOutcome: args.policy.securityOutcome,
    riskLevel: args.policy.riskLevel,
    refused: args.policy.refused,
    legalCertification: false,
    t: args.t
  };

  const chainPreview = upsertCognitiveChainNode(args.memory.cognitiveChain, simulatedNode);
  const pass = evaluateCognitiveChainPass(chainPreview, args.memory, args.handoff, args.saasContext);

  return [
    "Report memoria persistente conversazionale JOKER-C2.",
    "",
    pass.ok ? "PASS tecnico." : "FAIL tecnico.",
    "",
    ...chainPreview.map((node) => "- Nodo " + node.node + ": " + node.statement),
    "",
    "Controlli:",
    ...pass.checks.map((check) => "- " + check),
    "",
    "legalCertification=false"
  ].join("\n");
}

function buildRuntimeDiagnosticsAnswer(args: {
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  saasContext: SaasRuntimeContext;
  model: string;
  modelLevel: string;
  providerName: "OPENAI" | "LOCAL" | "UNKNOWN";
  providerState: string;
  openAIConfigured: boolean;
  evt: EvtRecord;
  opc: OpcProofRecord;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  memoryHashBefore: string;
  memoryHashAfter: string;
  tokenUsage: CompletionTokenUsage;
  providerError: string | null;
  finishReason: string | null;
  persistenceBridge: RuntimePersistenceBridgeResult;
  auditAndUsage: {
    audit: JsonObject;
    modelUsage: JsonObject;
  };
}): string {
  return [
    "Diagnostica runtime JOKER-C2 generata post-evento.",
    "",
    "Runtime entity: `" + RUNTIME_ENTITY + "`",
    "Runtime IPR: `" + RUNTIME_IPR + "`",
    "Human IPR: `" + args.handoff.humanIpr + "`",
    "MATRIX: `" + args.handoff.matrixState + "`",
    "Policy decision: `" + args.policy.decision + "`",
    "Operation decision: `" + args.policy.operationDecision + "`",
    "Security outcome: `" + args.policy.securityOutcome + "`",
    "Memory scope: `" + args.memory.scope + "`",
    "Memory persistence: `" + args.memory.persistenceMode + "`",
    "Memory store: `" + args.memory.storeKind + "`",
    "Response EVT: `" + args.evt.id + "`",
    "OPC proof ID: `" + args.opc.id + "`",
    "OPC chain hash: `" + args.opc.chainHash + "`",
    "Provider: `" + args.providerName + "`",
    "Provider state: `" + args.providerState + "`",
    "Model: `" + args.model + "`",
    "Model level: `" + args.modelLevel + "`",
    "OpenAI configured: `" + String(args.openAIConfigured) + "`",
    "Tenant ID: `" + args.saasContext.tenantId + "`",
    "Workspace ID: `" + args.saasContext.workspaceId + "`",
    "Input hash: `" + args.inputHash + "`",
    "Output hash: `" + args.outputHash + "`",
    "Policy hash: `" + args.policyHash + "`",
    "Memory hash before: `" + args.memoryHashBefore + "`",
    "Memory hash after: `" + args.memoryHashAfter + "`",
    "Finish reason: `" + String(args.finishReason ?? "none") + "`",
    "Provider error: `" + String(args.providerError ?? "none") + "`",
    "",
    "Boundary: OPC, EVT, audit, model usage e memory persistence sono livelli tecnici di tracciabilità. Non sono certificazione legale.",
    "legalCertification=false"
  ].join("\n");
}

function buildIdentityRecognitionAnswer(
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation,
  saasContext: SaasRuntimeContext
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
      "Soggetto IPR: " + handoff.subjectName,
      "Human IPR: " + handoff.humanIpr,
      "Certificate ID: " + handoff.certificateId,
      "Card serial: " + handoff.cardSerial,
      "Certificate status: " + handoff.status,
      "Certificate scope: " + handoff.scope,
      "Access decision: " + handoff.accessDecision,
      "Identity binding: " + handoff.identityBinding,
      "MATRIX: " + handoff.matrixState,
      "Semantic memory: " + memory.scope,
      "Memory authority: " + memory.authority,
      "Memory persistence mode: " + memory.persistenceMode,
      "Tenant ID: " + saasContext.tenantId,
      "Workspace ID: " + saasContext.workspaceId,
      "Policy decision: " + policy.decision,
      "Operation decision: " + policy.operationDecision,
      "Security outcome: " + policy.securityOutcome,
      "",
      "Boundary: non ti riconosco dal nome scritto nel prompt. Ti riconosco solo dal frame IPR verificato.",
      "legalCertification=false"
    ].join("\n");
  }

  return [
    "Handoff IPR rilevato ma non verificabile.",
    "",
    "Human IPR: " + handoff.humanIpr,
    "Certificate ID: " + handoff.certificateId,
    "Status: " + handoff.status,
    "Scope: " + handoff.scope,
    "Identity binding: " + handoff.identityBinding,
    "",
    "Boundary: memoria ≠ identità corrente. Nome scritto nel prompt ≠ identità verificata. legalCertification=false"
  ].join("\n");
}

function buildEmptyProviderFallback(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation
): string {
  return [
    "JOKER-C2 runtime attivo.",
    "",
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "Identità operativa rilevata: " + handoff.subjectName + " / " + handoff.humanIpr + "."
      : "Nessun IPR biologico verificato in questa richiesta.",
    "Policy decision: " + policy.decision + ".",
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
    "",
    "La risposta del provider era vuota, quindi il runtime ha generato questa risposta di continuità.",
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200)
  ].join("\n");
}

function buildLocalFallbackAnswer(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState,
  saasContext: SaasRuntimeContext
): string {
  return [
    "JOKER-C2 runtime attivo in modalità fallback locale.",
    "",
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "Identità operativa rilevata: " + handoff.subjectName + " / " + handoff.humanIpr + "."
      : "Nessun IPR biologico verificato in questa richiesta.",
    "Policy decision: " + policy.decision + ".",
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
    "Memory scope: " + memory.scope + ".",
    "Memory persistence: " + memory.persistenceMode + ".",
    "Tenant ID: " + saasContext.tenantId + ".",
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200),
    "",
    "OPENAI_API_KEY non risulta configurata nel runtime Vercel."
  ].join("\n");
}

function buildProviderErrorAnswer(
  message: string,
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  providerError: string
): string {
  return [
    "JOKER-C2 runtime attivo, ma la chiamata OpenAI non ha completato correttamente.",
    "",
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
      ? "IPR biologico verificato: " + handoff.humanIpr + "."
      : "IPR biologico non verificato in questa richiesta.",
    "Policy decision: " + policy.decision + ".",
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
    "Errore provider: " + providerError,
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200)
  ].join("\n");
}

function buildBlockedAnswer(policy: PolicyEvaluation): string {
  return [
    "Richiesta bloccata dal runtime JOKER-C2.",
    "",
    "Decisione: " + policy.decision + ".",
    "Decisione operazione: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
    "Rischio: " + policy.riskLevel + ".",
    "Motivo: " + policy.reason + ".",
    "",
    "Boundary: il blocco è operativo e tecnico, non una certificazione legale."
  ].join("\n");
}

function evaluatePolicy(message: string, files: PublicFileSnapshot[]): PolicyEvaluation {
  const rawText = [message, ...files.map((file) => file.preview || "")].join("\n");
  const flags: string[] = [];

  const hasPrivilegeEscalationAttempt =
    /(ignora\s+ipr|bypass\s+ipr|bypass\s+policy|sblocca\s+memoria|memoria\s+piena|accesso\s+completo|full\s+access|ignore\s+ipr|ignore\s+policy|unlock\s+memory|disable\s+safeguards|override\s+identity|override\s+policy|privilege\s+escalation)/i.test(rawText);

  const hasCredentialPattern =
    /(api[_-]?key|secret|password|private key|token|bearer\s+[a-z0-9._-]+)/i.test(rawText);

  const hasPersonalDataTerm =
    /(codice fiscale|passport|passaporto|carta d.identit|identity card|health|medical|diagnosi|farmaco|iban|dati personali|personal data|pii)/i.test(rawText);

  const hasCyberRisk =
    /(malware|phishing|exploit|ransomware|credential theft|bypass authentication|privilege escalation|data exfiltration)/i.test(rawText);

  if (hasPrivilegeEscalationAttempt) flags.push("PRIVILEGE_ESCALATION_ATTEMPT");
  if (hasCredentialPattern) flags.push("CREDENTIAL_OR_SECRET_PATTERN");
  if (hasPersonalDataTerm) flags.push("PERSONAL_OR_SENSITIVE_DATA_POSSIBLE");
  if (hasCyberRisk) flags.push("CYBER_RISK_TERMS");

  if (hasPrivilegeEscalationAttempt) {
    return {
      decision: "ALLOW",
      operationDecision: "REFUSED",
      securityOutcome: "REQUEST_REFUSED_WITHIN_GRANTED_SESSION",
      dataClass: "OPERATIONAL",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      limited: true,
      refused: true,
      blocked: false,
      failClosed: true,
      reason:
        "The user attempted to bypass IPR, unlock memory, override policy, or obtain unrestricted access."
    };
  }

  if (hasCredentialPattern) {
    return {
      decision: "ESCALATE",
      operationDecision: "ESCALATE",
      securityOutcome: "ESCALATED_FOR_HUMAN_REVIEW",
      dataClass: "CREDENTIAL_OR_SECRET",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: true,
      reason: "The request contains possible credential or secret material."
    };
  }

  if (hasCyberRisk || hasPersonalDataTerm) {
    return {
      decision: "ALLOW",
      operationDecision: "LIMITED",
      securityOutcome: "LIMITED_OPERATION_WITH_AUDIT",
      dataClass: hasCyberRisk ? "CYBER_SECURITY_RELEVANT" : "SENSITIVE_POSSIBLE",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: false,
      reason: "The request requires limited operation with audit semantics."
    };
  }

  return {
    decision: "ALLOW",
    operationDecision: "ALLOW",
    securityOutcome: "NORMAL_ALLOWED_OPERATION",
    dataClass: "PUBLIC_OR_SYNTHETIC",
    riskLevel: "LOW",
    humanOversight: "NOT_REQUIRED",
    flags,
    limited: false,
    refused: false,
    blocked: false,
    failClosed: false,
    reason: "No elevated operational risk detected by the MVP policy evaluator."
  };
}

function resolveHandoff(request: NextRequest, body: JsonObject): HandoffResolution {
  const humanIpr =
    stringFromPath(body, "humanIpr") ||
    stringFromPath(body, "humanIPR") ||
    stringFromPath(body, "biologicalSubject.humanIpr") ||
    stringFromPath(body, "biologicalSubject.ipr") ||
    stringFromPath(body, "verifiedSubject.ipr") ||
    request.headers.get("x-hbce-human-ipr") ||
    "NOT_VERIFIED";

  const certificateId =
    stringFromPath(body, "certificateId") ||
    stringFromPath(body, "certificateID") ||
    stringFromPath(body, "biologicalSubject.certificateId") ||
    stringFromPath(body, "verifiedSubject.certificateId") ||
    request.headers.get("x-hbce-certificate-id") ||
    "NO_CERTIFICATE";

  const subjectName =
    stringFromPath(body, "subjectName") ||
    stringFromPath(body, "biologicalSubject.name") ||
    stringFromPath(body, "verifiedSubject.entity") ||
    "Verified biological subject";

  const cardSerial =
    stringFromPath(body, "cardSerial") ||
    stringFromPath(body, "biologicalSubject.cardSerial") ||
    stringFromPath(body, "verifiedSubject.cardSerial") ||
    "NO_CARD";

  const status =
    stringFromPath(body, "status") ||
    stringFromPath(body, "certificateStatus") ||
    stringFromPath(body, "biologicalSubject.status") ||
    "MISSING";

  const scope =
    stringFromPath(body, "scope") ||
    stringFromPath(body, "certificateScope") ||
    stringFromPath(body, "biologicalSubject.scope") ||
    "MATRIX_LIMITED";

  const accepted =
    humanIpr !== "NOT_VERIFIED" &&
    certificateId !== "NO_CERTIFICATE" &&
    ["ACTIVE", "VALID"].includes(status.toUpperCase()) &&
    scope.toUpperCase().includes("JOKER_C2_ACCESS");

  if (!accepted) {
    return {
      detected: humanIpr !== "NOT_VERIFIED" || certificateId !== "NO_CERTIFICATE",
      source: "body",
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
        "IPR handoff was missing or did not satisfy human IPR, certificate, ACTIVE status and JOKER_C2_ACCESS scope together."
    };
  }

  return {
    detected: true,
    source: "body",
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

function getOrCreateMemory(
  sessionId: string,
  handoff: HandoffResolution,
  t: string,
  saasContext: SaasRuntimeContext
): RuntimeMemoryState {
  const memory = getOrCreateRuntimeMemory({
    sessionId,
    handoff: toMemoryHandoffEvaluation(handoff),
    runtime: buildRuntimeMemoryIdentity(),
    previousContinuityRef: CANONICAL_EVT,
    seedFacts: [
      "Runtime /api/chat is using canonical IPR-bound memory module.",
      "JOKER-C2 SaaS Core v0.1 requires database persistence for durable multi-session memory.",
      "Memory must not authenticate the biological subject by itself.",
      "Every runtime answer must maintain legalCertification=false.",
      "SaaS tenant context: " + saasContext.tenantId + ".",
      "SaaS workspace context: " + saasContext.workspaceId + ".",
      "SaaS subscription context: " + saasContext.subscriptionId + ".",
      "SaaS context source: " + saasContext.source + "."
    ],
    tenantId: normalizeOptionalSaasId(saasContext.tenantId),
    workspaceId: normalizeOptionalSaasId(saasContext.workspaceId),
    subscriptionTier: saasContext.saasTier
  });

  void t;

  return toRuntimeMemoryState(memory);
}

function updateMemoryAfterTurn(args: {
  memory: RuntimeMemoryState;
  t: string;
  handoff: HandoffResolution;
  userMessage: string;
  assistantMessage: string;
  evtId: string;
  opcId: string;
  opcChainHash: string;
  policy: PolicyEvaluation;
  providerState: string;
  saasContext: SaasRuntimeContext;
}): RuntimeMemoryState {
  const cognitiveNode = buildCognitiveChainNodeFromTurn(args);

  const extraFacts = [
    extractOperationalFact(args.userMessage) || "",
    cognitiveNode
      ? COGNITIVE_CHAIN_FACT_PREFIX + JSON.stringify(cognitiveNode)
      : "",
    "Turn completed with policy=" +
      args.policy.decision +
      ", operation=" +
      args.policy.operationDecision +
      ", securityOutcome=" +
      args.policy.securityOutcome +
      ", risk=" +
      args.policy.riskLevel +
      ", evt=" +
      args.evtId +
      ", opc=" +
      args.opcId +
      "."
  ].filter(Boolean);

  const updated = updateMemoryAfterCompletion({
    memory: args.memory.record,
    userMessage: args.userMessage,
    assistantMessage: args.assistantMessage,
    evt: args.evtId,
    opcProofId: args.opcId,
    opcChainHash: args.opcChainHash,
    extraFacts,
    runtimeState: args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL",
    runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
    generationClass: args.providerState,
    contextClass: "API_CHAT",
    projectDomain: "HBCE_JOKER_C2",
    hbceModule: "JOKER_C2_RUNTIME",
    trustedOutput:
      args.policy.decision !== "BLOCK" &&
      args.providerState !== "PROVIDER_ERROR" &&
      !args.policy.refused,
    acceptedAsMemoryFact: args.policy.decision !== "BLOCK" && !args.policy.refused,
    policyBlocked: args.policy.decision === "BLOCK" || args.policy.refused
  });

  const runtimeState = toRuntimeMemoryState(updated);
  runtimeState.cognitiveChain = cognitiveNode
    ? upsertCognitiveChainNode(args.memory.cognitiveChain, cognitiveNode)
    : args.memory.cognitiveChain;

  return runtimeState;
}

function toMemoryHandoffEvaluation(handoff: HandoffResolution): IprBoundMemoryHandoffEvaluation {
  const valid = handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT";

  const subject: IprBoundMemorySubject | undefined = valid
    ? {
        entity: handoff.subjectName,
        ipr: handoff.humanIpr,
        kind: "BIOLOGICAL_SUBJECT"
      }
    : undefined;

  const certificate: IprBoundMemoryCertificate | undefined = valid
    ? {
        certificateId: handoff.certificateId,
        certificateStatus: handoff.status,
        certificateScope: handoff.scope.split(",").map((item) => item.trim()).filter(Boolean),
        certificateKind: "HBCE_JOKER_C2_OPERATIONAL_CERTIFICATE",
        cardSerial: handoff.cardSerial
      }
    : undefined;

  return {
    isValid: valid,
    source: handoff.source,
    authority: handoff.authority,
    matrixState: handoff.matrixState,
    semanticMemoryScope: handoff.semanticMemoryScope,
    reason: handoff.reason,
    accessDecision: handoff.accessDecision,
    identityBinding: handoff.identityBinding,
    subject,
    certificate
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
    },
    boundary: {
      legalCertification: false,
      opc: "technical proof receipt only"
    }
  };
}

function buildRuntimeMemoryIdentity(): IprBoundMemoryRuntimeIdentity {
  return {
    entity: RUNTIME_ENTITY,
    ipr: RUNTIME_IPR,
    checkpoint: CANONICAL_EVT,
    cycle: CYCLE,
    core: CORE,
    org: ORG,
    location: LOCATION
  };
}

function toRuntimeMemoryState(memory: IprBoundMemoryRecord): RuntimeMemoryState {
  const publicMemory = toPublicMemoryRecord(memory);
  const store = publicMemory.persistence.store;
  const database = store.database;
  const lastTurn = publicMemory.recentTurns[publicMemory.recentTurns.length - 1];
  const facts = publicMemory.facts;
  const cognitiveChain = extractCognitiveChainFromFacts(facts);

  return {
    record: memory,
    sessionId: publicMemory.sessionId,
    memoryId: publicMemory.memoryId,
    memoryKeyHash: publicMemory.memoryKeyHash,
    memoryHash: publicMemory.memoryHash,
    createdAt: publicMemory.createdAt,
    updatedAt: publicMemory.updatedAt,
    turns: publicMemory.recentTurns.length,
    scope: publicMemory.scope,
    authority: publicMemory.authority,
    persistenceMode: publicMemory.persistenceMode,
    persistenceStatus: publicMemory.persistence.status,
    persistenceDurable: publicMemory.persistence.durable,
    persistenceDatabaseReady: publicMemory.persistence.databaseReady,
    persistenceDatabaseRequired: publicMemory.persistence.databaseRequired,
    storeName: store.name,
    storeKind: store.kind,
    storeStatus: store.status,
    storeDurable: store.durable,
    storeRuntimeScoped: store.runtimeScoped,
    storeRecordCount: store.recordCount,
    storePersistenceStage: store.persistenceStage,
    storeSaasReady: store.saasReady,
    storeRequiresDatabase: store.requiresDatabase,
    databaseConfigured: database?.configured ?? false,
    databaseAvailable: database?.available ?? false,
    subjectIpr: publicMemory.subject?.ipr ?? "NOT_VERIFIED",
    lastEvtId: publicMemory.lastEvt || "none",
    lastOpcId: publicMemory.lastOpcProofId || "none",
    lastOpcChainHash: publicMemory.lastOpcChainHash || "none",
    lastUserMessage: lastTurn?.user || "",
    lastAssistantMessage: lastTurn?.assistant || "",
    facts,
    cognitiveChain
  };
}

function toPublicMemory(memory: RuntimeMemoryState): JsonObject {
  return {
    sessionId: memory.sessionId,
    memoryId: memory.memoryId,
    memoryKeyHash: memory.memoryKeyHash,
    memoryHash: memory.memoryHash,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    turns: memory.turns,
    scope: memory.scope,
    authority: memory.authority,
    persistenceMode: memory.persistenceMode,
    persistenceStatus: memory.persistenceStatus,
    persistenceDurable: memory.persistenceDurable,
    persistenceDatabaseReady: memory.persistenceDatabaseReady,
    persistenceDatabaseRequired: memory.persistenceDatabaseRequired,
    subjectIpr: memory.subjectIpr,
    lastEvtId: memory.lastEvtId,
    lastOpcId: memory.lastOpcId,
    lastOpcChainHash: memory.lastOpcChainHash,
    facts: memory.facts,
    cognitiveChain: toJsonValue(memory.cognitiveChain),
    store: buildMemoryStoreDiagnostic(memory),
    legalCertification: false
  };
}

function buildMemoryStoreDiagnostic(memory: RuntimeMemoryState): JsonObject {
  return {
    name: memory.storeName,
    kind: memory.storeKind,
    status: memory.storeStatus,
    durable: memory.storeDurable,
    runtimeScoped: memory.storeRuntimeScoped,
    recordCount: memory.storeRecordCount,
    persistenceStage: memory.storePersistenceStage,
    saasReady: memory.storeSaasReady,
    requiresDatabase: memory.storeRequiresDatabase,
    database: {
      configured: memory.databaseConfigured,
      available: memory.databaseAvailable
    },
    databaseReady: isRuntimeMemoryDatabaseReady(),
    databasePersistent: isRuntimeMemoryDatabasePersistent(),
    flushErrors: getRuntimeMemoryFlushErrors(),
    legalCertification: false
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
    operationDecision: args.policy.operationDecision,
    securityOutcome: args.policy.securityOutcome,
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

function buildPublicEvt(evt: EvtRecord, persistence?: JsonObject): JsonObject {
  return {
    ...toJsonObject(evt),
    trace: {
      hash_algorithm: "sha256",
      canonicalization: "deterministic-json",
      hash: evt.hash
    },
    persistence: persistence ?? {
      ok: false,
      status: "NOT_ATTEMPTED",
      legalCertification: false
    },
    verification: {
      status: "VERIFIABLE",
      legalCertification: false
    }
  };
}

function buildPublicOpc(opc: OpcProofRecord, persistence?: JsonObject): JsonObject {
  return {
    ...toJsonObject(opc),
    eventId: opc.evt,
    persistence: persistence ?? {
      ok: false,
      status: "NOT_ATTEMPTED",
      legalCertification: false
    },
    verification: {
      status: opc.verificationStatus,
      legalCertification: false
    }
  };
}

async function persistEvtAndOpc(args: {
  t: string;
  sessionId: string;
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  saasContext: SaasRuntimeContext;
  model: string;
  modelLevel: string;
  providerName: "OPENAI" | "LOCAL" | "UNKNOWN";
  providerState: string;
  evt: EvtRecord;
  opc: OpcProofRecord;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  memoryHash: string;
}): Promise<RuntimePersistenceBridgeResult> {
  try {
    const evtPersistence = await persistEventToDatabase({
      evt: args.evt.id,
      prev: args.evt.prev,
      t: args.evt.t,
      kind: "RUNTIME_EVENT",
      eventKind: "JOKER_C2_CHAT_COMPLETION",
      entity: RUNTIME_ENTITY,
      runtimeIpr: RUNTIME_IPR,
      humanIpr: args.handoff.humanIpr,
      subjectIpr: args.handoff.humanIpr,
      sessionId: args.sessionId,
      threadId: args.saasContext.threadId,
      tenantId: args.saasContext.tenantId,
      workspaceId: args.saasContext.workspaceId,
      subscriptionId: args.saasContext.subscriptionId,
      opcProofId: args.opc.id,
      memoryId: args.memory.memoryId,
      state: args.providerState,
      runtimeState: args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL",
      decision: args.policy.decision,
      runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
      operationDecision: args.policy.operationDecision,
      securityOutcome: args.policy.securityOutcome,
      riskLevel: args.policy.riskLevel,
      inputHash: args.inputHash,
      outputHash: args.outputHash,
      policyHash: args.policyHash,
      memoryHash: args.memoryHash,
      trace: {
        hash_algorithm: "sha256",
        canonicalization: "deterministic-json",
        hash: args.evt.hash
      },
      anchors: args.evt.anchors,
      payload: {
        runtime: RUNTIME_ENTITY,
        runtimeIpr: RUNTIME_IPR,
        handoff: args.handoff,
        policy: args.policy,
        memory: toPublicMemory(args.memory),
        saas: args.saasContext,
        model: args.model,
        modelLevel: args.modelLevel,
        providerName: args.providerName,
        legalCertification: false
      },
      legalCertification: false
    } as unknown as EvtDatabaseRuntimeEvent);

    const opcPersistence = await persistOpcProofRecordToDatabase({
      proofId: args.opc.id,
      kind: "OPERATIONAL_PROOF_RECORD",
      timestamp: args.opc.timestamp,
      identity: {
        entity: RUNTIME_ENTITY,
        ipr: RUNTIME_IPR,
        core: CORE,
        organization: ORG,
        runtimeRole: "HBCE_governed_runtime"
      },
      sessionId: args.sessionId,
      event: {
        evt: args.evt.id,
        prev: args.evt.prev,
        hash: args.evt.hash,
        kind: "UP-EVT"
      },
      proof: {
        inputHash: args.inputHash,
        outputHash: args.outputHash,
        decisionHash: sha256(args.policy),
        eventHash: args.opc.eventHash,
        memoryHash: args.memoryHash,
        previousProofHash: null,
        chainHash: args.opc.chainHash
      },
      boundary: buildBoundary()
    } as unknown as OpcDatabaseProofRecord);

    return {
      evtPersistence: toJsonObject(evtPersistence),
      opcPersistence: toJsonObject(opcPersistence)
    };
  } catch (error) {
    return {
      evtPersistence: {
        ok: false,
        status: "EVT_DATABASE_PERSISTENCE_FAILED",
        error: errorToMessage(error),
        legalCertification: false
      },
      opcPersistence: {
        ok: false,
        status: "OPC_DATABASE_PERSISTENCE_FAILED",
        error: errorToMessage(error),
        legalCertification: false
      }
    };
  }
}

async function recordSaasAuditAndUsage(args: {
  sessionId: string;
  requestId: string;
  handoff: HandoffResolution;
  policy: PolicyEvaluation;
  memory: RuntimeMemoryState;
  saasContext: SaasRuntimeContext;
  model: string;
  modelLevel: string;
  providerName: "OPENAI" | "LOCAL" | "UNKNOWN";
  tokenUsage: CompletionTokenUsage;
  evt: EvtRecord;
  opc: OpcProofRecord;
  inputHash: string;
  outputHash: string;
  policyHash: string;
  memoryHash: string;
  providerState: string;
}): Promise<{ audit: JsonObject; modelUsage: JsonObject }> {
  try {
    const auditResult = await appendRuntimeAuditLogRecordAsync({
      source: "API_CHAT",
      sessionId: args.sessionId,
      requestId: args.requestId,
      humanIpr: args.handoff.humanIpr,
      organizationIpr: "NO_ORGANIZATION_IPR",
      tenantId: args.saasContext.tenantId,
      workspaceId: args.saasContext.workspaceId,
      subscriptionId: args.saasContext.subscriptionId,
      threadId: args.saasContext.threadId,
      identityState:
        args.handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
          ? "VERIFIED"
          : "NOT_VERIFIED",
      organizationState: "NOT_REQUIRED",
      workspaceState: args.saasContext.workspaceId === "NO_WORKSPACE" ? "NOT_REQUIRED" : "ACTIVE",
      saasTier: args.saasContext.saasTier,
      tierDecision: args.policy.decision === "BLOCK" ? "BLOCK" : "ALLOW",
      accessDecision: args.handoff.accessDecision === "ACCESS_GRANTED" ? "ALLOW" : "BLOCK",
      riskLevel: args.policy.riskLevel,
      runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
      auditState: mapPolicyToAuditState(args.policy),
      modelLevel: args.modelLevel,
      selectedModel: args.model,
      modelRoutingReason: resolveModelRoutingReason(args.model, args.policy),
      cyberRelevance: args.policy.flags.includes("CYBER_RISK_TERMS") ? "C2_RELEVANT" : "NONE",
      c2Boundary: "C2_NOT_AVAILABLE",
      c2Decision: args.policy.operationDecision === "REFUSED" ? "BLOCK" : "ALLOW",
      c2Allowed: false,
      c2FailClosed: args.policy.failClosed,
      memoryScope: args.memory.scope,
      memoryAuthority:
        args.memory.authority === "SERVER_RUNTIME_VALIDATED"
          ? "SERVER_RUNTIME_VALIDATED"
          : "RUNTIME_ONLY",
      persistenceMode: args.memory.persistenceMode,
      evtRequired: true,
      opcRequired: true,
      auditRequired:
        args.policy.humanOversight !== "NOT_REQUIRED" || args.policy.refused || args.policy.limited,
      evtRef: args.evt.id,
      evtHash: args.evt.hash,
      opcRef: args.opc.id,
      opcProofHash: args.opc.chainHash,
      memoryRef: args.memory.memoryId,
      memoryHash: args.memoryHash,
      inputHash: args.inputHash,
      outputHash: args.outputHash,
      decisionHash: sha256(args.policy),
      policyHash: args.policyHash,
      dataClass: args.policy.dataClass,
      contextClass: "API_CHAT",
      projectDomain: "HBCE_JOKER_C2",
      hbceModule: "JOKER_C2_RUNTIME",
      allowed: args.policy.decision !== "BLOCK" && !args.policy.refused,
      failClosed: args.policy.failClosed,
      blocked: args.policy.decision === "BLOCK",
      reason: args.policy.reason
    } as RuntimeAuditAppendInput);

    const usageResult = await appendModelUsageLogRecordAsync({
      source: "API_CHAT",
      provider: args.providerName,
      sessionId: args.sessionId,
      requestId: args.requestId,
      auditId: auditResult.record.auditId,
      humanIpr: args.handoff.humanIpr,
      organizationIpr: "NO_ORGANIZATION_IPR",
      tenantId: args.saasContext.tenantId,
      workspaceId: args.saasContext.workspaceId,
      subscriptionId: args.saasContext.subscriptionId,
      threadId: args.saasContext.threadId,
      saasTier: args.saasContext.saasTier,
      selectedModel: args.model,
      modelLevel: args.modelLevel,
      modelRoutingReason: resolveModelRoutingReason(args.model, args.policy),
      riskLevel: args.policy.riskLevel,
      runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
      auditState: mapPolicyToAuditState(args.policy),
      operationalValue:
        args.policy.riskLevel === "HIGH"
          ? "HIGH"
          : args.policy.riskLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
      cyberRelevance: args.policy.flags.includes("CYBER_RISK_TERMS") ? "C2_RELEVANT" : "NONE",
      c2Boundary: "C2_NOT_AVAILABLE",
      proofRequirement: "EVT_OPC",
      evtRequired: true,
      opcRequired: true,
      auditRequired:
        args.policy.humanOversight !== "NOT_REQUIRED" || args.policy.refused || args.policy.limited,
      evtRef: args.evt.id,
      evtHash: args.evt.hash,
      opcRef: args.opc.id,
      opcProofHash: args.opc.chainHash,
      inputTokens: args.tokenUsage.inputTokens,
      outputTokens: args.tokenUsage.outputTokens,
      totalTokens: args.tokenUsage.totalTokens,
      cachedInputTokens: args.tokenUsage.cachedInputTokens,
      reasoningTokens: args.tokenUsage.reasoningTokens,
      blocked: args.policy.decision === "BLOCK",
      failClosed: args.policy.failClosed,
      allowed: args.policy.decision !== "BLOCK" && !args.policy.refused,
      persistenceMode: args.memory.persistenceMode,
      reason: "Model usage record created from /api/chat runtime execution."
    } as ModelUsageAppendInput);

    return {
      audit: {
        ok: true,
        auditId: auditResult.record.auditId,
        auditHash: auditResult.record.auditHash,
        status: auditResult.record.status,
        persistence: toJsonObject(auditResult.persistence),
        legalCertification: false
      },
      modelUsage: {
        ok: true,
        usageId: usageResult.record.usageId,
        usageHash: usageResult.record.usageHash,
        status: usageResult.record.status,
        tokens: toJsonTokenUsage(args.tokenUsage),
        persistence: toJsonObject(usageResult.persistence),
        legalCertification: false
      }
    };
  } catch (error) {
    return {
      audit: {
        ok: false,
        status: "AUDIT_LOGGING_FAILED",
        error: errorToMessage(error),
        legalCertification: false
      },
      modelUsage: {
        ok: false,
        status: "MODEL_USAGE_LOGGING_SKIPPED",
        error: errorToMessage(error),
        legalCertification: false
      }
    };
  }
}

function buildEvtDatabaseRuntimeEvent(): never {
  throw new Error("buildEvtDatabaseRuntimeEvent is intentionally not used in this simplified route.");
}

function buildOpcDatabaseProofRecord(): never {
  throw new Error("buildOpcDatabaseProofRecord is intentionally not used in this simplified route.");
}

function resolveSaasRuntimeContext(body: JsonObject, sessionId: string): SaasRuntimeContext {
  return {
    tenantId: stringFromPath(body, "tenantId") || HBCE_SELF_PILOT_TENANT_ID,
    workspaceId: stringFromPath(body, "workspaceId") || HBCE_SELF_PILOT_WORKSPACE_ID,
    subscriptionId: stringFromPath(body, "subscriptionId") || HBCE_SELF_PILOT_SUBSCRIPTION_ID,
    accountId: stringFromPath(body, "accountId") || HBCE_SELF_PILOT_ACCOUNT_ID,
    threadId: stringFromPath(body, "threadId") || sessionId,
    saasTier:
      stringFromPath(body, "saasTier").toUpperCase() === "BASE"
        ? "BASE"
        : (HBCE_SELF_PILOT_SUBSCRIPTION_TIER as "BASE" | "IPR") || "IPR",
    source: "SELF_PILOT_SCHEMA_FALLBACK"
  };
}

function buildPlaceholderSaasRuntimeContext(sessionId: string): SaasRuntimeContext {
  return {
    tenantId: "NO_TENANT",
    workspaceId: "NO_WORKSPACE",
    subscriptionId: "NO_SUBSCRIPTION",
    accountId: "NO_ACCOUNT",
    threadId: sessionId,
    saasTier: "BASE",
    source: "PLACEHOLDER"
  };
}

function buildRequestId(sessionId: string, t: string): string {
  return sha256({ sessionId, t }).slice(0, 32).toUpperCase();
}

function resolveModel(body: JsonObject, policy: PolicyEvaluation): string {
  const requested = stringFromPath(body, "model");

  if (requested) return requested;

  if (policy.riskLevel === "HIGH" || policy.decision === "ESCALATE") {
    return process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;
  }

  return process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
}

function resolveModelLevel(model: string, policy: PolicyEvaluation): string {
  if (policy.riskLevel === "HIGH" || model === (process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL)) {
    return "DEEP";
  }

  return "STANDARD";
}

function resolveModelRoutingReason(model: string, policy: PolicyEvaluation): string {
  return "Selected model " + model + " for policy=" + policy.decision + " risk=" + policy.riskLevel + ".";
}

function normalizeCompletionUsage(usage: unknown): CompletionTokenUsage {
  const data = toJsonObject(usage);

  return {
    inputTokens: numberOrNull(data.prompt_tokens ?? data.input_tokens),
    outputTokens: numberOrNull(data.completion_tokens ?? data.output_tokens),
    totalTokens: numberOrNull(data.total_tokens),
    cachedInputTokens: null,
    reasoningTokens: null
  };
}

function toJsonTokenUsage(usage: CompletionTokenUsage): JsonObject {
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    cachedInputTokens: usage.cachedInputTokens,
    reasoningTokens: usage.reasoningTokens
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function readJsonBody(request: NextRequest): Promise<JsonObject> {
  try {
    const body = await request.json();
    return toJsonObject(body);
  } catch {
    return {};
  }
}

function resolveSessionId(body: JsonObject): string {
  return stringFromPath(body, "sessionId") || stringFromPath(body, "session_id") || "JOKER-SESSION-" + randomUUID();
}

function normalizeIncomingMessages(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toJsonObject(item))
    .map((item) => ({
      role:
        item.role === "assistant" || item.role === "system" || item.role === "user"
          ? item.role
          : "user",
      content: stringFromValue(item.content)
    }))
    .filter((item) => item.content.trim().length > 0);
}

function normalizeUserMessage(body: JsonObject, messages: ChatTurn[]): string {
  return (
    stringFromPath(body, "message") ||
    stringFromPath(body, "prompt") ||
    stringFromPath(body, "input") ||
    messages.filter((item) => item.role === "user").at(-1)?.content ||
    ""
  );
}

function normalizeFiles(value: unknown): PublicFileSnapshot[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => toJsonObject(item)).map((item) => ({
    name: stringFromValue(item.name) || "unnamed",
    type: stringFromValue(item.type) || "application/octet-stream",
    size: numberOrNull(item.size) || 0,
    hash: stringFromValue(item.hash) || sha256(item),
    preview: stringFromValue(item.preview) || undefined
  }));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength) + "...";
}

function stringFromPath(source: JsonObject, path: string): string {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return "";
    current = (current as Record<string, unknown>)[part];
  }

  return stringFromValue(current);
}

function normalizeOptionalSaasId(value: string): string | undefined {
  const normalized = value.trim();

  if (!normalized || normalized === "NO_TENANT" || normalized === "NO_WORKSPACE" || normalized === "NO_SUBSCRIPTION") {
    return undefined;
  }

  return normalized;
}

function extractOperationalFact(message: string): string | null {
  const clean = truncate(message.replace(/\s+/g, " ").trim(), 360);

  if (!clean) return null;

  if (/(EVT-|IPR|OPC|JOKER|HBCE|MATRIX|memoria|memory|Vercel|GitHub|route\.ts|api\/chat|audit|SaaS|catena cognitiva|nodo|tenant|workspace)/i.test(clean)) {
    return "Operational note from user: " + clean;
  }

  return null;
}

function buildCognitiveChainNodeFromTurn(args: {
  memory: RuntimeMemoryState;
  t: string;
  handoff: HandoffResolution;
  userMessage: string;
  evtId: string;
  opcId: string;
  policy: PolicyEvaluation;
  saasContext: SaasRuntimeContext;
}): CognitiveChainNode | null {
  if (!isCognitiveChainQuestion(args.userMessage)) return null;

  return {
    node: args.memory.cognitiveChain.length + 1,
    statement: truncate(args.userMessage.replace(/\s+/g, " ").trim(), 500),
    source: "USER_REQUEST",
    humanIpr: args.handoff.humanIpr,
    sessionId: args.memory.sessionId,
    tenantId: args.saasContext.tenantId,
    workspaceId: args.saasContext.workspaceId,
    evt: args.evtId,
    opc: args.opcId,
    policyDecision: args.policy.decision,
    operationDecision: args.policy.operationDecision,
    securityOutcome: args.policy.securityOutcome,
    riskLevel: args.policy.riskLevel,
    refused: args.policy.refused,
    legalCertification: false,
    t: args.t
  };
}

function upsertCognitiveChainNode(
  chain: CognitiveChainNode[],
  node: CognitiveChainNode
): CognitiveChainNode[] {
  const filtered = chain.filter((item) => item.node !== node.node);
  return [...filtered, node]
    .sort((a, b) => a.node - b.node)
    .slice(-COGNITIVE_CHAIN_MAX_NODES);
}

function extractCognitiveChainFromFacts(facts: string[]): CognitiveChainNode[] {
  return facts
    .filter((fact) => fact.startsWith(COGNITIVE_CHAIN_FACT_PREFIX))
    .map((fact) => {
      try {
        return JSON.parse(fact.slice(COGNITIVE_CHAIN_FACT_PREFIX.length)) as CognitiveChainNode;
      } catch {
        return null;
      }
    })
    .filter((item): item is CognitiveChainNode => Boolean(item))
    .slice(-COGNITIVE_CHAIN_MAX_NODES);
}

function evaluateCognitiveChainPass(
  chain: CognitiveChainNode[],
  memory: RuntimeMemoryState,
  handoff: HandoffResolution,
  saasContext: SaasRuntimeContext
): { ok: boolean; pass: boolean; checks: string[]; legalCertification: false } {
  const hasIprBinding = handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT";
  const hasPersistentMemory = memory.persistenceMode === "DATABASE_PERSISTENT";
  const hasTenantWorkspace = saasContext.tenantId !== "NO_TENANT" && saasContext.workspaceId !== "NO_WORKSPACE";
  const hasEvtOpc = memory.lastEvtId !== "none" && memory.lastOpcId !== "none";
  const pass = hasIprBinding && hasPersistentMemory && hasTenantWorkspace && hasEvtOpc;

  return {
    ok: pass,
    pass,
    checks: [
      "IPR binding: " + String(hasIprBinding),
      "Persistent memory: " + String(hasPersistentMemory),
      "Tenant/workspace: " + String(hasTenantWorkspace),
      "EVT/OPC continuity: " + String(hasEvtOpc),
      "Nodes: " + String(chain.length)
    ],
    legalCertification: false
  };
}

function buildCognitiveChainDiagnostics(memory: RuntimeMemoryState, saasContext: SaasRuntimeContext): JsonObject {
  return {
    nodes: memory.cognitiveChain.length,
    chain: toJsonValue(memory.cognitiveChain),
    tenantId: saasContext.tenantId,
    workspaceId: saasContext.workspaceId,
    legalCertification: false
  };
}

function mapPolicyDecisionToRuntimeDecision(policy: PolicyEvaluation): string {
  if (policy.decision === "BLOCK") return "BLOCK";
  if (policy.operationDecision === "REFUSED") return "REFUSE";
  if (policy.decision === "ESCALATE") return "ESCALATE";
  if (policy.operationDecision === "LIMITED") return "ALLOW_LIMITED";
  return "ALLOW";
}

function mapPolicyToAuditState(policy: PolicyEvaluation): string {
  if (policy.decision === "BLOCK" || policy.humanOversight === "REQUIRED") return "REQUIRED";
  if (policy.humanOversight === "RECOMMENDED" || policy.limited || policy.refused) return "READY";
  return "NOT_REQUIRED";
}

function buildBoundary(): JsonObject {
  return {
    legalCertification: false,
    opc: "technical proof receipt only",
    ipr: "operational identity record only",
    evt: "technical event trace only",
    statement:
      "IPR, EVT, OPC, audit, model usage and memory persistence are technical-operational governance layers. They do not create legal certification, public authority validation or qualified trust service status."
  };
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
