import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { queryHbceDatabase } from "@/lib/ipr-database";
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
  reason: string;
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
  | "DATABASE_PROFILE"
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

type SaasContextDatabaseRow = Record<string, unknown> & {
  tenant_id?: unknown;
  workspace_id?: unknown;
  subscription_id?: unknown;
  tier?: unknown;
  account_id?: unknown;
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
      persistenceMode: memoryStore.kind,
      persistenceStatus: memoryStore.persistenceStage,
      persistenceDurable: memoryStore.durable,
      databaseReady: isRuntimeMemoryDatabaseReady(),
      databasePersistent: isRuntimeMemoryDatabasePersistent(),
      reason: "Health check only. IPR-bound memory is activated during POST when a valid handoff is present.",
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
      memory: memoryStore.kind,
      legalCertification: false
    },
    audit: {
      configured: true,
      mode: "DATABASE_PERSISTENT_TARGET",
      target: "DATABASE_PERSISTENT",
      legalCertification: false
    },
    modelUsage: {
      configured: true,
      mode: "DATABASE_PERSISTENT_TARGET",
      target: "DATABASE_PERSISTENT",
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

  const handoff = resolveHandoff(request, body);
  const policy = evaluatePolicy(message, files);
  const saasContext = await resolveSaasRuntimeContext(body, handoff, sessionId);
  let memory = getOrCreateMemory(sessionId, handoff, t, saasContext);

  const model = resolveModel(body, policy);
  const modelLevel = resolveModelLevel(model, policy);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const inputFrame = {
    sessionId,
    message,
    files,
    handoff,
    policy,
    memoryBefore: toPublicMemory(memory),
    saasContext,
    alienCodePipeline: buildAlienCodePipelineDiagnostic(),
    runtimeDiagnosticsRequested
  };

  const inputHash = sha256(inputFrame);
  const memoryHashBefore = sha256(memory);

  let answer = "";
  let providerState: "COMPLETED" | "LOCAL_FALLBACK" | "PROVIDER_ERROR" = "COMPLETED";
  let providerError: string | null = null;
  let providerName: "OPENAI" | "LOCAL" | "UNKNOWN" = "LOCAL";
  let tokenUsage: CompletionTokenUsage = EMPTY_TOKEN_USAGE;
  let finishReason: string | null = null;

  if (policy.decision === "BLOCK") {
    answer = buildBlockedAnswer(policy);
    providerState = "LOCAL_FALLBACK";
    providerName = "LOCAL";
  } else if (runtimeDiagnosticsRequested) {
    answer = buildRuntimeDiagnosticsPreparationAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isIdentityRecognitionQuestion(message)) {
    answer = buildIdentityRecognitionAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
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
      providerState = "COMPLETED";
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
    providerState
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

  const runtimeDetails = {
    model,
    modelLevel,
    runtimeIpr: RUNTIME_IPR,
    aiEvt: CANONICAL_EVT,
    responseEvt: evt.id,
    responseEvtId: evt.id,
    opc: opc.id,
    opcId: opc.id,
    matrix: handoff.matrixState,
    memory: memory.scope,
    authority: memory.authority,
    mode: memory.persistenceMode,
    memoryStore: memory.storeKind,
    memoryPersistenceStatus: memory.persistenceStatus,
    memoryPersistenceDurable: memory.persistenceDurable,
    tenantId: saasContext.tenantId,
    workspaceId: saasContext.workspaceId,
    subscriptionId: saasContext.subscriptionId,
    accountId: saasContext.accountId,
    saasContextSource: saasContext.source
  };

  const finalAnswer = runtimeDiagnosticsRequested
    ? buildRuntimeDiagnosticsAnswer({
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
        openAIConfigured,
        evt,
        opc,
        publicEvt,
        publicOpc,
        persistenceBridge,
        auditAndUsage,
        inputHash,
        outputHash,
        policyHash,
        memoryHashBefore,
        memoryHashAfter,
        tokenUsage,
        providerError,
        finishReason
      })
    : safeAnswer;

  if (runtimeDiagnosticsRequested) {
    memory = updateAssistantDiagnosticMemory({
      memory,
      finalAnswer,
      evtId: evt.id,
      opcId: opc.id,
      opcChainHash: opc.chainHash,
      policy,
      providerState
    });
  }

  const finalOutputHash = sha256(finalAnswer);
  const finalMemoryHash = sha256(memory);

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
      tenantId: saasContext.tenantId,
      workspaceId: saasContext.workspaceId,
      subscriptionId: saasContext.subscriptionId,
      accountId: saasContext.accountId,
      saasContextSource: saasContext.source
    },
    runtimeName: RUNTIME_ENTITY,
    state: providerState,
    status: providerState,
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
    modernEvt: publicEvt,
    governedEvt: publicEvt,

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
    proof: publicOpc,

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
      mode: runtimeDiagnosticsRequested ? "RUNTIME_LOCAL_POST_GENERATION" : "STANDARD_RESPONSE",
      inputHash,
      outputHash,
      finalOutputHash,
      policyHash,
      memoryHashBefore,
      memoryHashAfter,
      finalMemoryHash,
      providerError,
      finishReason,
      tokenUsage: toJsonTokenUsage(tokenUsage),
      handoffSource: handoff.source,
      handoffReason: handoff.reason,
      saasContext: {
        tenantId: saasContext.tenantId,
        workspaceId: saasContext.workspaceId,
        subscriptionId: saasContext.subscriptionId,
        accountId: saasContext.accountId,
        threadId: saasContext.threadId,
        tier: saasContext.saasTier,
        source: saasContext.source,
        legalCertification: false
      },
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
        buildPlaceholderSaasRuntimeContext(args.memory.sessionId, args.handoff)
      ),
      usage: EMPTY_TOKEN_USAGE,
      finishReason: null
    };
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
  const finishReason = completion.choices[0]?.finish_reason ?? null;

  if (!content) {
    return {
      answer: buildEmptyProviderFallback(args.message, args.handoff, args.policy),
      usage: normalizeCompletionUsage(completion.usage),
      finishReason
    };
  }

  return {
    answer: content,
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
    "Alien Code operational pipeline:",
    "Ψ/init: " + HBCE_ALIEN_CODE_PIPELINE.psiInit,
    "Λ/input-output: " + HBCE_ALIEN_CODE_PIPELINE.lambdaIo,
    "κ/recognition threshold: " + HBCE_ALIEN_CODE_PIPELINE.kappaRecognitionThreshold,
    "Σ/coherence field: " + HBCE_ALIEN_CODE_PIPELINE.sigmaCoherenceField,
    "Τ/trace record: " + HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord,
    "Χτ/risk gate: " + HBCE_ALIEN_CODE_PIPELINE.chiTauEthicalCriticality,
    "Ω/memory state: " + HBCE_ALIEN_CODE_PIPELINE.omegaMemory,
    "Π★/upgrade gate: " + HBCE_ALIEN_CODE_PIPELINE.piStarUpgradeGate,
    "Ω∞/backup: " + HBCE_ALIEN_CODE_PIPELINE.omegaInfinityBackup,
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
    "Flags: " + JSON.stringify(policy.flags),
    "Reason: " + policy.reason,
    "",
    "Memory frame:",
    "Memory ID: " + memory.memoryId,
    "Memory key hash: " + memory.memoryKeyHash,
    "Memory hash: " + memory.memoryHash,
    "Session: " + memory.sessionId,
    "Turns: " + String(memory.turns),
    "Scope: " + memory.scope,
    "Authority: " + memory.authority,
    "Persistence mode: " + memory.persistenceMode,
    "Persistence status: " + memory.persistenceStatus,
    "Persistence durable: " + String(memory.persistenceDurable),
    "Store kind: " + memory.storeKind,
    "Store persistence stage: " + memory.storePersistenceStage,
    "Database configured: " + String(memory.databaseConfigured),
    "Database available: " + String(memory.databaseAvailable),
    "Last EVT: " + memory.lastEvtId,
    "Last OPC: " + memory.lastOpcId,
    "Known operational facts: " + JSON.stringify(memory.facts.slice(-8)),
    "",
    "Attached file snapshots:",
    JSON.stringify(files, null, 2),
    "",
    "Audit continuity rule:",
    "Source risk must be inherited across summaries, dashboard reports and audit-ready outputs.",
    "Redaction protects the output. Redaction does not downgrade source sensitivity.",
    "A source document containing PII, compliance facts, unauthorized AI use, secrets, customer data or regulated material must remain at its source risk level unless a verified policy transition explicitly records a downgrade.",
    "Never treat redacted PII as proof that the original source did not contain PII.",
    "Never downgrade MEDIUM or HIGH source risk to LOW only because the generated report excludes sensitive fields.",
    "If a prior step required human oversight, subsequent reports must preserve REQUIRED or CONDITIONAL oversight until a verified human or policy action closes it.",
    "",
    "Fail-closed rule:",
    "If identity, scope, policy or risk gate cannot be resolved safely, the runtime must prefer block, escalation or audit-only output over silent allowance.",
    "OPC and EVT can record a block attempt as technical traceability, but OPC does not authorize the blocked action.",
    "",
    "Rules:",
    "Answer in the same main language used by the user.",
    "Do not claim legal certification, public authority validation, eIDAS qualification or official identity issuance.",
    "Treat OPC as a technical proof receipt only.",
    "Treat memory persistence according to the memory frame. DATABASE_PERSISTENT is durable only when persistence durable is true and the store is DATABASE_PERSISTENT.",
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

function isRuntimeDiagnosticsQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  const hasDiagnosticIntent = [
    "diagnostica",
    "diagnostic",
    "diagnostics",
    "runtime details",
    "runtime detail",
    "mostrami diagnostica",
    "diagnostica completa",
    "stato runtime",
    "runtime status",
    "debug runtime",
    "health runtime"
  ].some((term) => normalized.includes(normalizeText(term)));

  const hasOperationalTerms = [
    "evt",
    "opc",
    "audit",
    "usage",
    "model usage",
    "persistenza",
    "persistence",
    "matrix",
    "memoria",
    "memory",
    "ipr",
    "tenant",
    "workspace",
    "subscription",
    "saas"
  ].some((term) => normalized.includes(normalizeText(term)));

  return hasDiagnosticIntent && hasOperationalTerms;
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
    "The runtime is preparing a post-generation diagnostic response.",
    "This placeholder is used only to create a deterministic output frame before EVT, OPC, audit and model usage records are produced.",
    "",
    "Runtime entity: " + RUNTIME_ENTITY,
    "Runtime IPR: " + RUNTIME_IPR,
    "Human IPR: " + handoff.humanIpr,
    "MATRIX: " + handoff.matrixState,
    "Memory scope: " + memory.scope,
    "Memory persistence: " + memory.persistenceMode,
    "Memory store: " + memory.storeKind,
    "Tenant ID: " + saasContext.tenantId,
    "Workspace ID: " + saasContext.workspaceId,
    "Subscription ID: " + saasContext.subscriptionId,
    "SaaS context source: " + saasContext.source,
    "Policy decision: " + policy.decision,
    "Risk level: " + policy.riskLevel,
    "",
    "Boundary: final diagnostics are generated by /api/chat after EVT, OPC, audit and usage execution. legalCertification=false"
  ].join("\n");
}

function buildRuntimeDiagnosticsAnswer(args: {
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
  openAIConfigured: boolean;
  evt: EvtRecord;
  opc: OpcProofRecord;
  publicEvt: JsonObject;
  publicOpc: JsonObject;
  persistenceBridge: RuntimePersistenceBridgeResult;
  auditAndUsage: {
    audit: JsonObject;
    modelUsage: JsonObject;
  };
  inputHash: string;
  outputHash: string;
  policyHash: string;
  memoryHashBefore: string;
  memoryHashAfter: string;
  tokenUsage: CompletionTokenUsage;
  providerError: string | null;
  finishReason: string | null;
}): string {
  const evtPersistenceStatus = stringPath(args.persistenceBridge.evtPersistence, "status", "UNKNOWN");
  const evtPersistenceOk = stringPath(args.persistenceBridge.evtPersistence, "ok", "false");
  const evtPersistenceError = stringPath(args.persistenceBridge.evtPersistence, "error", "none");

  const opcPersistenceStatus = stringPath(args.persistenceBridge.opcPersistence, "status", "UNKNOWN");
  const opcPersistenceOk = stringPath(args.persistenceBridge.opcPersistence, "ok", "false");
  const opcPersistenceError = stringPath(args.persistenceBridge.opcPersistence, "error", "none");

  const auditStatus = stringPath(args.auditAndUsage.audit, "status", "UNKNOWN");
  const auditId = stringPath(args.auditAndUsage.audit, "auditId", "NO_AUDIT_ID");
  const auditPersistenceStatus = stringPath(args.auditAndUsage.audit, "persistence.status", "UNKNOWN");
  const auditPersistenceOk = stringPath(args.auditAndUsage.audit, "persistence.ok", "false");
  const auditPersistenceError = stringPath(args.auditAndUsage.audit, "persistence.error", "none");

  const usageStatus = stringPath(args.auditAndUsage.modelUsage, "status", "UNKNOWN");
  const usageId = stringPath(args.auditAndUsage.modelUsage, "usageId", "NO_USAGE_ID");
  const usagePersistenceStatus = stringPath(args.auditAndUsage.modelUsage, "persistence.status", "UNKNOWN");
  const usagePersistenceOk = stringPath(args.auditAndUsage.modelUsage, "persistence.ok", "false");
  const usagePersistenceError = stringPath(args.auditAndUsage.modelUsage, "persistence.error", "none");

  const flushErrors = getRuntimeMemoryFlushErrors();
  const memoryWriteStatus =
    args.memory.persistenceMode === "DATABASE_PERSISTENT" && flushErrors.length === 0
      ? "DATABASE_PERSISTENT_ACTIVE_OR_SCHEDULED"
      : args.memory.persistenceMode === "DATABASE_PERSISTENT"
        ? "DATABASE_PERSISTENT_WITH_FLUSH_WARNINGS"
        : "NOT_DATABASE_PERSISTENT";

  return [
    "Diagnostica runtime JOKER-C2 generata post-evento.",
    "",
    "Questa diagnostica non è stata prodotta dal modello OpenAI sul prompt iniziale. È stata costruita da /api/chat dopo la generazione di EVT, OPC, audit e model usage.",
    "",
    "## Alien Code pipeline",
    "- Ψ/init: `" + HBCE_ALIEN_CODE_PIPELINE.psiInit + "`",
    "- Λ/input-output: `" + HBCE_ALIEN_CODE_PIPELINE.lambdaIo + "`",
    "- κ/recognition gate: `" + HBCE_ALIEN_CODE_PIPELINE.kappaRecognitionThreshold + "`",
    "- Σ/coherence: `" + HBCE_ALIEN_CODE_PIPELINE.sigmaCoherenceField + "`",
    "- Τ/trace: `" + HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord + "`",
    "- Χτ/risk gate: `" + HBCE_ALIEN_CODE_PIPELINE.chiTauEthicalCriticality + "`",
    "- Ω/memory: `" + HBCE_ALIEN_CODE_PIPELINE.omegaMemory + "`",
    "",
    "## IPR",
    "- Runtime entity: `" + RUNTIME_ENTITY + "`",
    "- Runtime IPR: `" + RUNTIME_IPR + "`",
    "- Human IPR: `" + args.handoff.humanIpr + "`",
    "- Subject: `" + args.handoff.subjectName + "`",
    "- Certificate: `" + args.handoff.certificateId + "`",
    "- Certificate status: `" + args.handoff.status + "`",
    "- Scope: `" + args.handoff.scope + "`",
    "- Access decision: `" + args.handoff.accessDecision + "`",
    "- Identity binding: `" + args.handoff.identityBinding + "`",
    "- Handoff source: `" + args.handoff.source + "`",
    "- Authority: `" + args.handoff.authority + "`",
    "",
    "## MATRIX",
    "- State: `" + args.handoff.matrixState + "`",
    "- Active: `" + String(args.handoff.matrixState === "MATRIX_ACTIVE") + "`",
    "- Reason: `" + args.handoff.reason + "`",
    "",
    "## Policy",
    "- Decision: `" + args.policy.decision + "`",
    "- Data class: `" + args.policy.dataClass + "`",
    "- Risk level: `" + args.policy.riskLevel + "`",
    "- Human oversight: `" + args.policy.humanOversight + "`",
    "- Flags: `" + args.policy.flags.join(", ") + "`",
    "- Reason: `" + args.policy.reason + "`",
    "",
    "## Memory",
    "- Scope: `" + args.memory.scope + "`",
    "- Authority: `" + args.memory.authority + "`",
    "- Persistence mode: `" + args.memory.persistenceMode + "`",
    "- Persistence status: `" + args.memory.persistenceStatus + "`",
    "- Persistence durable: `" + String(args.memory.persistenceDurable) + "`",
    "- Persistence database ready: `" + String(args.memory.persistenceDatabaseReady) + "`",
    "- Persistence database required: `" + String(args.memory.persistenceDatabaseRequired) + "`",
    "- Memory ID: `" + args.memory.memoryId + "`",
    "- Memory key hash: `" + args.memory.memoryKeyHash + "`",
    "- Memory record hash: `" + args.memory.memoryHash + "`",
    "- Session: `" + args.memory.sessionId + "`",
    "- Turns: `" + String(args.memory.turns) + "`",
    "- Last EVT: `" + args.memory.lastEvtId + "`",
    "- Last OPC: `" + args.memory.lastOpcId + "`",
    "- Last OPC chain hash: `" + args.memory.lastOpcChainHash + "`",
    "- Memory hash before: `" + args.memoryHashBefore + "`",
    "- Memory hash after: `" + args.memoryHashAfter + "`",
    "",
    "## Memory store",
    "- Store name: `" + args.memory.storeName + "`",
    "- Store kind: `" + args.memory.storeKind + "`",
    "- Store status: `" + args.memory.storeStatus + "`",
    "- Store durable: `" + String(args.memory.storeDurable) + "`",
    "- Store runtime scoped: `" + String(args.memory.storeRuntimeScoped) + "`",
    "- Store record count: `" + String(args.memory.storeRecordCount) + "`",
    "- Store persistence stage: `" + args.memory.storePersistenceStage + "`",
    "- Store SaaS ready: `" + String(args.memory.storeSaasReady) + "`",
    "- Store requires database: `" + String(args.memory.storeRequiresDatabase) + "`",
    "- Database configured: `" + String(args.memory.databaseConfigured) + "`",
    "- Database available: `" + String(args.memory.databaseAvailable) + "`",
    "",
    "## Database memory",
    "- memory_records write attempted: `" + String(args.memory.persistenceMode === "DATABASE_PERSISTENT") + "`",
    "- memory_records write status: `" + memoryWriteStatus + "`",
    "- memory_records read available: `" + String(args.memory.storeKind === "DATABASE_PERSISTENT") + "`",
    "- database flush errors: `" + (flushErrors.length ? flushErrors.join(" | ") : "none") + "`",
    "- memory payload persistence mode: `" + args.memory.persistenceMode + "`",
    "",
    "## EVT",
    "- Canonical AI EVT: `" + CANONICAL_EVT + "`",
    "- Previous canonical EVT: `" + CANONICAL_PREV + "`",
    "- Response EVT: `" + args.evt.id + "`",
    "- Previous response EVT: `" + args.evt.prev + "`",
    "- EVT hash: `" + args.evt.hash + "`",
    "- EVT verification: `VERIFIABLE`",
    "- EVT persistence ok: `" + evtPersistenceOk + "`",
    "- EVT persistence status: `" + evtPersistenceStatus + "`",
    "- EVT persistence error: `" + evtPersistenceError + "`",
    "",
    "## OPC",
    "- OPC proof ID: `" + args.opc.id + "`",
    "- OPC verification: `" + args.opc.verificationStatus + "`",
    "- OPC chain hash: `" + args.opc.chainHash + "`",
    "- OPC event hash: `" + args.opc.eventHash + "`",
    "- OPC persistence ok: `" + opcPersistenceOk + "`",
    "- OPC persistence status: `" + opcPersistenceStatus + "`",
    "- OPC persistence error: `" + opcPersistenceError + "`",
    "- legalCertification: `false`",
    "",
    "## Audit",
    "- Audit ID: `" + auditId + "`",
    "- Audit status: `" + auditStatus + "`",
    "- Audit persistence ok: `" + auditPersistenceOk + "`",
    "- Audit persistence status: `" + auditPersistenceStatus + "`",
    "- Audit persistence error: `" + auditPersistenceError + "`",
    "",
    "## Model usage",
    "- Usage ID: `" + usageId + "`",
    "- Usage status: `" + usageStatus + "`",
    "- Provider: `" + args.providerName + "`",
    "- Provider state: `" + args.providerState + "`",
    "- Model: `" + args.model + "`",
    "- Model level: `" + args.modelLevel + "`",
    "- OpenAI configured: `" + String(args.openAIConfigured) + "`",
    "- Input tokens: `" + String(args.tokenUsage.inputTokens ?? "not_available") + "`",
    "- Output tokens: `" + String(args.tokenUsage.outputTokens ?? "not_available") + "`",
    "- Total tokens: `" + String(args.tokenUsage.totalTokens ?? "not_available") + "`",
    "- Usage persistence ok: `" + usagePersistenceOk + "`",
    "- Usage persistence status: `" + usagePersistenceStatus + "`",
    "- Usage persistence error: `" + usagePersistenceError + "`",
    "",
    "## SaaS context",
    "- Project: `Project HBCE R&D Transfer SaaS`",
    "- Release: `SaaS Core v0.1`",
    "- Tenant ID: `" + args.saasContext.tenantId + "`",
    "- Workspace ID: `" + args.saasContext.workspaceId + "`",
    "- Subscription ID: `" + args.saasContext.subscriptionId + "`",
    "- Account ID: `" + args.saasContext.accountId + "`",
    "- Thread ID: `" + args.saasContext.threadId + "`",
    "- Tier: `" + args.saasContext.saasTier + "`",
    "- Source: `" + args.saasContext.source + "`",
    "",
    "## Hashes",
    "- Input hash: `" + args.inputHash + "`",
    "- Output hash: `" + args.outputHash + "`",
    "- Policy hash: `" + args.policyHash + "`",
    "- Finish reason: `" + String(args.finishReason ?? "none") + "`",
    "- Provider error: `" + String(args.providerError ?? "none") + "`",
    "",
    "## Boundary",
    "OPC, EVT, audit, model usage e memory persistence sono livelli tecnici di tracciabilità, ricostruzione operativa e governance. Non sono certificazione legale, non sono identità pubblica ufficiale e non sostituiscono revisione umana o legale.",
    "",
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
      "Semantic memory: " + memory.scope,
      "Memory authority: " + memory.authority,
      "Memory persistence mode: " + memory.persistenceMode,
      "Memory persistence status: " + memory.persistenceStatus,
      "Memory store: " + memory.storeKind,
      "Tenant ID: " + saasContext.tenantId,
      "Workspace ID: " + saasContext.workspaceId,
      "Subscription ID: " + saasContext.subscriptionId,
      "Account ID: " + saasContext.accountId,
      "SaaS source: " + saasContext.source,
      "Policy decision: " + policy.decision,
      "Risk level: " + policy.riskLevel,
      "",
      "Da dove deriva il riconoscimento:",
      "- handoff IPR presente nella richiesta;",
      "- certificato operativo ACTIVE;",
      "- scope JOKER_C2_ACCESS;",
      "- binding IPR_VERIFIED_BIOLOGICAL_SUBJECT;",
      "- validazione lato runtime;",
      "- contesto SaaS risolto da body, database profile o self-pilot schema fallback.",
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
    "Semantic memory: " + memory.scope,
    "Memory authority: " + memory.authority,
    "Memory persistence mode: " + memory.persistenceMode,
    "Tenant ID: " + saasContext.tenantId,
    "Workspace ID: " + saasContext.workspaceId,
    "Subscription ID: " + saasContext.subscriptionId,
    "SaaS source: " + saasContext.source,
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
  memory: RuntimeMemoryState,
  saasContext: SaasRuntimeContext
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
    "Memory persistence: " + memory.persistenceMode + ".",
    "Tenant ID: " + saasContext.tenantId + ".",
    "Workspace ID: " + saasContext.workspaceId + ".",
    "Subscription ID: " + saasContext.subscriptionId + ".",
    "SaaS source: " + saasContext.source + ".",
    "",
    "Messaggio ricevuto:",
    truncate(message || "Messaggio vuoto.", 1200),
    "",
    "OPENAI_API_KEY non risulta configurata nel runtime Vercel, quindi la risposta cognitiva del modello non è stata invocata. EVT, OPC, audit, model usage e memoria vengono comunque processati nei rispettivi boundary tecnici."
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
    "EVT, OPC, audit, model usage e memoria tecnica sono stati comunque generati per tracciare l’evento."
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
  const rawText = [message, ...files.map((file) => file.preview || "")].join("\n");
  const text = rawText.toLowerCase();

  const flags: string[] = [];

  const hasCredentialPattern =
    /(api[_-]?key|secret|password|private key|token|bearer\s+[a-z0-9._-]+)/i.test(rawText);

  const hasItalianFiscalCode =
    /\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/i.test(rawText);

  const hasPersonalDataTerm =
    /(codice fiscale|passport|passaporto|carta d.identit|identity card|health|medical|diagnosi|farmaco|iban|dipendente|employee|cliente|customer|dati personali|personal data|pii|nome e cognome|residenza)/i.test(rawText);

  const hasComplianceContext =
    /(compliance|audit|revisione|human oversight|oversight|risk assessment|valutazione del rischio|policy interna|internal policy|violazione|incident|segnalazione|report interno|controllo interno|governance|accountability)/i.test(rawText);

  const hasUnauthorizedAiUse =
    /(ai non autorizzat|ia non autorizzat|strumento ai non autorizzat|strumento ia non autorizzat|unauthorized ai|unauthorized artificial intelligence|non autorizzato per analizzare dati|uso non autorizzato|account non autorizzato)/i.test(rawText);

  const hasCustomerData =
    /(dati clienti|customer data|client data|customer records|client records|archivio clienti|database clienti)/i.test(rawText);

  const hasCyberRisk =
    /(malware|phishing|exploit|ransomware|credential theft|bypass authentication|privilege escalation|persistence payload|data exfiltration)/i.test(rawText);

  const hasProfessionalAdviceBoundary =
    /(legal advice|consulenza legale|diagnosi medica|financial advice|investimento garantito|parere legale|parere medico|parere finanziario)/i.test(rawText);

  if (hasCredentialPattern) {
    flags.push("CREDENTIAL_OR_SECRET_PATTERN");
  }

  if (hasItalianFiscalCode) {
    flags.push("ITALIAN_FISCAL_CODE_PATTERN");
  }

  if (hasPersonalDataTerm) {
    flags.push("PERSONAL_OR_SENSITIVE_DATA_POSSIBLE");
  }

  if (hasComplianceContext) {
    flags.push("COMPLIANCE_OR_AUDIT_CONTEXT");
  }

  if (hasUnauthorizedAiUse) {
    flags.push("UNAUTHORIZED_AI_USE_CONTEXT");
  }

  if (hasCustomerData) {
    flags.push("CUSTOMER_DATA_CONTEXT");
  }

  if (hasCyberRisk) {
    flags.push("CYBER_RISK_TERMS");
  }

  if (hasProfessionalAdviceBoundary) {
    flags.push("PROFESSIONAL_ADVICE_BOUNDARY");
  }

  const hasPersonalData = hasItalianFiscalCode || hasPersonalDataTerm;
  const hasSecrets = hasCredentialPattern;
  const highComplianceCase =
    hasPersonalData &&
    hasComplianceContext &&
    (hasUnauthorizedAiUse || hasCustomerData);

  if (hasSecrets && hasCyberRisk) {
    return {
      decision: "ESCALATE",
      dataClass: "CREDENTIAL_OR_SECRET",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      reason:
        "The request contains both cyber-risk terms and possible credential or secret material. Fail-safe escalation and human oversight are required."
    };
  }

  if (highComplianceCase) {
    return {
      decision: "ESCALATE",
      dataClass: "COMPLIANCE_SENSITIVE",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      reason:
        "The request contains personal data or PII inside a compliance/audit context involving unauthorized AI use or customer data. Source risk must be preserved across audit reports; redaction does not downgrade the original source sensitivity."
    };
  }

  if (hasItalianFiscalCode || (hasPersonalData && hasComplianceContext)) {
    return {
      decision: "ESCALATE",
      dataClass: "PERSONAL_DATA_PRESENT",
      riskLevel: "MEDIUM",
      humanOversight: "REQUIRED",
      flags,
      reason:
        "The request contains direct or likely personal data in an operational or compliance context. Analysis may proceed only with minimization/redaction and human oversight."
    };
  }

  if (hasSecrets) {
    return {
      decision: "ESCALATE",
      dataClass: "CREDENTIAL_OR_SECRET",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      reason:
        "The request contains possible credential or secret material. The runtime escalates before unrestricted processing."
    };
  }

  if (hasCyberRisk) {
    return {
      decision: "ALLOW",
      dataClass: "CYBER_SECURITY_RELEVANT",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      reason:
        "The request contains cyber-risk terms. The runtime allows analysis under enhanced audit semantics."
    };
  }

  if (hasPersonalData) {
    return {
      decision: "ALLOW",
      dataClass: "SENSITIVE_POSSIBLE",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      reason:
        "The request may contain personal or sensitive data. Output minimization is required; redaction does not downgrade source sensitivity."
    };
  }

  if (hasProfessionalAdviceBoundary) {
    return {
      decision: "ALLOW",
      dataClass: "OPERATIONAL",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      reason:
        "The request touches professional advice boundaries. The runtime may provide general information only, without legal, medical or financial certification."
    };
  }

  void text;

  return {
    decision: "ALLOW",
    dataClass: "PUBLIC_OR_SYNTHETIC",
    riskLevel: "LOW",
    humanOversight: "NOT_REQUIRED",
    flags,
    reason: "No elevated operational risk detected by the MVP policy evaluator."
  };
}
