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
  IprBoundMemorySaasTier,
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
  dataClass: "PUBLIC_OR_SYNTHETIC" | "OPERATIONAL" | "SENSITIVE_POSSIBLE";
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
      "operational_certificate.scope",
      "operational_certificate.accessScope",
      "operational_certificate.access_scope",
      "operational_certificate.certificateScope",
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
      "Memory persistence is selected through lib/ipr-bound-memory-store.ts.",
      "JOKER-C2 SaaS Core v0.1 requires database persistence for durable multi-session memory.",
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
}): RuntimeMemoryState {
  const operationalFact = extractOperationalFact(args.userMessage);

  const updated = updateMemoryAfterCompletion({
    memory: args.memory.record,
    userMessage: args.userMessage,
    assistantMessage: args.assistantMessage,
    evt: args.evtId,
    opcProofId: args.opcId,
    opcChainHash: args.opcChainHash,
    extraFacts: [
      operationalFact || "",
      "Last runtime state: " + (args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL") + ".",
      "Last runtime decision: " + mapPolicyDecisionToRuntimeDecision(args.policy) + ".",
      "Last runtime context class: API_CHAT.",
      "Last runtime project domain: HBCE_JOKER_C2.",
      "Last runtime HBCE module: JOKER_C2_RUNTIME.",
      "Turn completed with policy=" +
        args.policy.decision +
        ", risk=" +
        args.policy.riskLevel +
        ", evt=" +
        args.evtId +
        ", opc=" +
        args.opcId +
        "."
    ].filter(Boolean),
    runtimeState: args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL",
    runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
    generationClass: args.providerState,
    contextClass: "API_CHAT",
    projectDomain: "HBCE_JOKER_C2",
    hbceModule: "JOKER_C2_RUNTIME",
    trustedOutput: args.policy.decision !== "BLOCK" && args.providerState !== "PROVIDER_ERROR",
    acceptedAsMemoryFact: args.policy.decision !== "BLOCK",
    policyBlocked: args.policy.decision === "BLOCK"
  });

  void args.t;
  void args.handoff;

  return toRuntimeMemoryState(updated);
}

function updateAssistantDiagnosticMemory(args: {
  memory: RuntimeMemoryState;
  finalAnswer: string;
  evtId: string;
  opcId: string;
  opcChainHash: string;
  policy: PolicyEvaluation;
  providerState: string;
}): RuntimeMemoryState {
  const updated = {
    ...args.memory.record,
    lastAssistantMessage: truncate(args.finalAnswer, 1000)
  };

  void args.evtId;
  void args.opcId;
  void args.opcChainHash;
  void args.policy;
  void args.providerState;

  return toRuntimeMemoryState(updated as IprBoundMemoryRecord);
}

function toMemoryHandoffEvaluation(
  handoff: HandoffResolution
): IprBoundMemoryHandoffEvaluation {
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
        certificateScope: handoff.scope
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
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
    facts: publicMemory.facts
  };
}

function normalizeOptionalSaasId(value: string): string | undefined {
  const normalized = value.trim();

  if (
    !normalized ||
    normalized === "NO_TENANT" ||
    normalized === "NO_WORKSPACE" ||
    normalized === "NO_SUBSCRIPTION"
  ) {
    return undefined;
  }

  return normalized;
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
    ...evt,
    evt: evt.id,
    id: evt.id,
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
    ...opc,
    id: opc.id,
    proofId: opc.id,
    timestamp: opc.t,
    eventId: opc.evt,
    eventHash: opc.evtHash,
    chainHash: opc.chainHash,
    persistence: persistence ?? {
      ok: false,
      status: "NOT_ATTEMPTED",
      legalCertification: false
    },
    verificationStatus: opc.verificationStatus,
    legalCertification: false,
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
  const fallbackEvt = {
    ok: false,
    status: "EVT_DATABASE_PERSISTENCE_SKIPPED",
    error: "EVT persistence was not completed.",
    legalCertification: false
  };

  const fallbackOpc = {
    ok: false,
    status: "OPC_DATABASE_PERSISTENCE_SKIPPED",
    error: "OPC persistence was not completed.",
    legalCertification: false
  };

  try {
    const runtimeEvent = buildEvtDatabaseRuntimeEvent(args);
    const evtPersistence = await persistEventToDatabase(runtimeEvent);

    const opcDatabaseRecord = buildOpcDatabaseProofRecord(args);
    const opcPersistence = await persistOpcProofRecordToDatabase(opcDatabaseRecord);

    return {
      evtPersistence: toJsonObject(evtPersistence, fallbackEvt),
      opcPersistence: toJsonObject(opcPersistence, fallbackOpc)
    };
  } catch (error) {
    return {
      evtPersistence: {
        ...fallbackEvt,
        error: errorToMessage(error)
      },
      opcPersistence: {
        ...fallbackOpc,
        error: errorToMessage(error)
      }
    };
  }
}

function buildEvtDatabaseRuntimeEvent(args: {
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
}): EvtDatabaseRuntimeEvent {
  return {
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
    riskLevel: args.policy.riskLevel,
    projectDomain: "HBCE_ECOSISTEMA_AI",
    hbceModule: "MATRIX",
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
      canonicalEvt: CANONICAL_EVT,
      handoff: args.handoff,
      policy: args.policy,
      memory: toPublicMemory(args.memory),
      saas: args.saasContext,
      model: args.model,
      modelLevel: args.modelLevel,
      providerName: args.providerName,
      opcProofId: args.opc.id,
      legalCertification: false
    },
    legalCertification: false
  } as unknown as EvtDatabaseRuntimeEvent;
}

function buildOpcDatabaseProofRecord(args: {
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
}): OpcDatabaseProofRecord {
  const runtimeDecision = mapPolicyDecisionToOpcDecision(args.policy);
  const runtimeState = mapProviderStateToOpcRuntimeState(args.providerState);
  const riskClass = mapPolicyRiskToOpcRisk(args.policy.riskLevel);
  const auditStatus = mapPolicyToOpcAuditStatus(args.policy);
  const engineHash = sha256({
    provider: args.providerName,
    model: args.model,
    modelLevel: args.modelLevel
  });

  return {
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
    engine: {
      provider: args.providerName === "OPENAI" ? "OpenAI" : args.providerName,
      apiMode: "chat.completions",
      role: "cognitive_engine",
      runtimeRole: "HBCE_governed_runtime",
      modelUsed: args.model,
      standardModel: process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL,
      deepModel: process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL,
      mode: args.modelLevel === "STANDARD" ? "standard" : "deep",
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      projectBirthDate: "2026-01-19",
      projectBirthLabel: "HBCE R&D / AI JOKER-C2 project birth date"
    },
    event: {
      evt: args.evt.id,
      prev: args.evt.prev,
      hash: args.evt.hash,
      kind: "UP-EVT"
    },
    memory: {
      evt: args.memory.lastEvtId,
      source: args.memory.scope,
      hash: args.memoryHash,
      memoryId: args.memory.memoryId,
      memoryKeyHash: args.memory.memoryKeyHash,
      scope: args.memory.scope,
      authority: args.memory.authority,
      persistenceMode: args.memory.persistenceMode,
      persistenceStatus: args.memory.persistenceStatus,
      durable: args.memory.persistenceDurable,
      storeKind: args.memory.storeKind
    },
    runtime: {
      state: runtimeState,
      decision: runtimeDecision,
      contextClass: "API_CHAT",
      intentClass: "CHAT_COMPLETION",
      projectDomain: "HBCE_ECOSISTEMA_AI",
      hbceModule: "MATRIX",
      riskClass,
      policyReference: "JOKER_C2_MVP_POLICY",
      policyOutcome: args.policy.decision,
      humanOversight: args.policy.humanOversight,
      operationType: "CHAT_COMPLETION",
      operationStatus: args.providerState,
      failClosed: false
    },
    operationalContext: {
      projectBirthDate: "2026-01-19",
      projectBirthLabel: "HBCE R&D / AI JOKER-C2 project birth date",
      monthlyReference: "UP-MESE-4",
      eventFamily: "UP-EVT",
      currentHumanEvt: "EVT-0016",
      currentAiEvt: "EVT-0016-AI",
      cycle: "UP-CANONICO",
      saasTarget: "DATABASE_PERSISTENT",
      tenantId: args.saasContext.tenantId,
      workspaceId: args.saasContext.workspaceId,
      subscriptionId: args.saasContext.subscriptionId,
      accountId: args.saasContext.accountId,
      saasContextSource: args.saasContext.source
    },
    persistence: {
      mode: "DATABASE_READY",
      status: "DATABASE_CONTRACT_READY",
      durable: false,
      runtimeScoped: false,
      databaseRequired: true,
      target: "DATABASE_PERSISTENT",
      statement:
        "OPC proof is prepared for database persistence. Durable status is confirmed by the database writer result."
    },
    proof: {
      inputHash: args.inputHash,
      outputHash: args.outputHash,
      decisionHash: sha256({
        policy: args.policy,
        runtimeDecision,
        providerState: args.providerState
      }),
      eventHash: args.opc.eventHash,
      engineHash,
      memoryHash: args.memoryHash,
      previousProofHash: null,
      chainHash: args.opc.chainHash
    },
    audit: {
      status: auditStatus,
      reviewRequired: args.policy.humanOversight !== "NOT_REQUIRED",
      reviewerRole:
        args.policy.humanOversight === "REQUIRED"
          ? "HUMAN_REVIEWER"
          : args.policy.humanOversight === "RECOMMENDED"
            ? "AUDITOR"
            : undefined,
      reasons: [
        "OPC proof generated by /api/chat.",
        "Policy decision: " + args.policy.decision + ".",
        "Risk level: " + args.policy.riskLevel + ".",
        "Human oversight: " + args.policy.humanOversight + ".",
        "Memory persistence mode: " + args.memory.persistenceMode + ".",
        "SaaS tenant: " + args.saasContext.tenantId + ".",
        "SaaS workspace: " + args.saasContext.workspaceId + ".",
        "SaaS subscription: " + args.saasContext.subscriptionId + ".",
        "legalCertification=false."
      ]
    },
    verification: {
      status: "VERIFIABLE",
      hashAlgorithm: "sha256",
      canonicalization: "deterministic-json"
    },
    boundary: {
      legalCertification: false,
      statement:
        "OPC is a technical proof receipt for audit, verification and governance review. It does not create legal certification.",
      aiGovernanceBoundary:
        "The AI model does not govern HBCE. HBCE governs the use of AI models.",
      moduleBoundary:
        "HBCE modules are technical-operational stack functions and not automatic legal authority.",
      persistenceBoundary:
        "DATABASE_PERSISTENT is the SaaS target. The database writer result determines durable persistence."
    }
  } as unknown as OpcDatabaseProofRecord;
}

function mapProviderStateToOpcRuntimeState(
  providerState: string
): "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID" | "AUDIT_ONLY" | "MAINTENANCE" {
  if (providerState === "PROVIDER_ERROR") {
    return "DEGRADED";
  }

  return "OPERATIONAL";
}

function mapPolicyDecisionToOpcDecision(
  policy: PolicyEvaluation
): "ALLOW" | "AUDIT" | "DEGRADE" | "ESCALATE" | "BLOCK" | "NOOP" {
  if (policy.decision === "BLOCK") {
    return "BLOCK";
  }

  if (policy.decision === "ESCALATE") {
    return "ESCALATE";
  }

  if (policy.humanOversight !== "NOT_REQUIRED") {
    return "AUDIT";
  }

  return "ALLOW";
}

function mapPolicyRiskToOpcRisk(
  riskLevel: PolicyEvaluation["riskLevel"]
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "PROHIBITED" | "UNKNOWN" {
  if (riskLevel === "HIGH") {
    return "HIGH";
  }

  if (riskLevel === "MEDIUM") {
    return "MEDIUM";
  }

  return "LOW";
}

function mapPolicyToOpcAuditStatus(
  policy: PolicyEvaluation
): "NOT_REQUIRED" | "READY" | "REQUIRED" | "OPEN" | "IN_REVIEW" | "REVIEWED" | "DISPUTED" | "LOCKED" | "REJECTED" | "CLOSED" | "FAILED" {
  if (policy.decision === "BLOCK" || policy.humanOversight === "REQUIRED") {
    return "REQUIRED";
  }

  if (policy.humanOversight === "RECOMMENDED") {
    return "READY";
  }

  return "NOT_REQUIRED";
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
}): Promise<{
  audit: JsonObject;
  modelUsage: JsonObject;
}> {
  try {
    const runtimeDecision = mapPolicyDecisionToRuntimeDecision(args.policy);
    const auditState = mapPolicyToAuditState(args.policy);
    const riskLevel = args.policy.riskLevel;
    const cyberRelevance = args.policy.flags.includes("CYBER_RISK_TERMS")
      ? "C2_RELEVANT"
      : "NONE";

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
      workspaceState:
        args.saasContext.workspaceId === "NO_WORKSPACE"
          ? "NOT_REQUIRED"
          : "ACTIVE",

      saasTier: args.saasContext.saasTier,
      tierDecision: args.policy.decision === "BLOCK" ? "BLOCK" : "ALLOW",
      accessDecision: args.handoff.accessDecision === "ACCESS_GRANTED" ? "ALLOW" : "BLOCK",

      riskLevel,
      runtimeDecision,
      auditState,

      modelLevel: args.modelLevel,
      selectedModel: args.model,
      modelRoutingReason: resolveModelRoutingReason(args.model, args.policy),

      cyberRelevance,
      c2Boundary: "C2_NOT_AVAILABLE",
      c2Decision: "ALLOW",
      c2Allowed: false,
      c2FailClosed: false,

      memoryScope: args.memory.scope,
      memoryAuthority:
        args.memory.authority === "SERVER_RUNTIME_VALIDATED"
          ? "SERVER_RUNTIME_VALIDATED"
          : "RUNTIME_ONLY",
      persistenceMode: args.memory.persistenceMode,

      evtRequired: true,
      opcRequired: true,
      auditRequired: args.policy.humanOversight !== "NOT_REQUIRED",

      evtRef: args.evt.id,
      evtHash: args.evt.hash,
      opcRef: args.opc.id,
      opcProofHash: args.opc.chainHash,
      memoryRef: args.memory.memoryId,
      memoryHash: args.memoryHash,

      inputHash: args.inputHash,
      outputHash: args.outputHash,
      decisionHash: sha256({
        policy: args.policy,
        handoff: args.handoff.accessDecision,
        providerState: args.providerState
      }),
      policyHash: args.policyHash,

      dataClass: args.policy.dataClass,
      contextClass: "API_CHAT",
      projectDomain: "HBCE_JOKER_C2",
      hbceModule: "JOKER_C2_RUNTIME",

      allowed: args.policy.decision !== "BLOCK",
      failClosed: false,
      blocked: args.policy.decision === "BLOCK",

      reason: args.policy.reason
    } as RuntimeAuditAppendInput);

    const modelUsageResult = await appendModelUsageLogRecordAsync({
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

      riskLevel,
      runtimeDecision,
      auditState,

      operationalValue: riskLevel === "HIGH" ? "HIGH" : riskLevel === "MEDIUM" ? "MEDIUM" : "LOW",
      cyberRelevance,
      c2Boundary: "C2_NOT_AVAILABLE",
      proofRequirement: "EVT_OPC",

      evtRequired: true,
      opcRequired: true,
      auditRequired: args.policy.humanOversight !== "NOT_REQUIRED",

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
      failClosed: false,
      allowed: args.policy.decision !== "BLOCK",

      persistenceMode: args.memory.persistenceMode,

      reason: "Model usage record created from /api/chat runtime execution."
    } as ModelUsageAppendInput);

    return {
      audit: {
        ok: true,
        auditId: auditResult.record.auditId,
        auditHash: auditResult.record.auditHash,
        status: auditResult.record.status,
        persistence: {
          ok: auditResult.persistence.ok,
          status: auditResult.persistence.status,
          error: auditResult.persistence.error,
          legalCertification: false
        },
        legalCertification: false
      },
      modelUsage: {
        ok: true,
        usageId: modelUsageResult.record.usageId,
        usageHash: modelUsageResult.record.usageHash,
        status: modelUsageResult.record.status,
        accountingMode: modelUsageResult.record.accountingMode,
        estimatedCostUnits: modelUsageResult.record.estimatedCostUnits,
        estimatedCostMinor: modelUsageResult.record.estimatedCostMinor,
        currency: modelUsageResult.record.currency,
        tokens: toJsonTokenUsage(args.tokenUsage),
        persistence: {
          ok: modelUsageResult.persistence.ok,
          status: modelUsageResult.persistence.status,
          error: modelUsageResult.persistence.error,
          legalCertification: false
        },
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

async function resolveSaasRuntimeContext(
  body: JsonObject,
  handoff: HandoffResolution,
  sessionId: string
): Promise<SaasRuntimeContext> {
  const bodyContext = resolveSaasRuntimeContextFromBody(body, handoff, sessionId);

  if (isConcreteSaasContext(bodyContext)) {
    return {
      ...bodyContext,
      source: "BODY"
    };
  }

  if (handoff.identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    return bodyContext;
  }

  const databaseContext = await resolveSaasRuntimeContextFromDatabase(
    handoff,
    sessionId,
    bodyContext
  );

  if (databaseContext) {
    return databaseContext;
  }

  if (isCanonicalSelfPilotHandoff(handoff)) {
    return {
      tenantId: HBCE_SELF_PILOT_TENANT_ID,
      workspaceId: HBCE_SELF_PILOT_WORKSPACE_ID,
      subscriptionId: HBCE_SELF_PILOT_SUBSCRIPTION_ID,
      accountId: HBCE_SELF_PILOT_ACCOUNT_ID,
      threadId: bodyContext.threadId,
      saasTier: normalizeSaasTier(HBCE_SELF_PILOT_SUBSCRIPTION_TIER, handoff),
      source: "SELF_PILOT_SCHEMA_FALLBACK"
    };
  }

  return bodyContext;
}

function resolveSaasRuntimeContextFromBody(
  body: JsonObject,
  handoff: HandoffResolution,
  sessionId: string
): SaasRuntimeContext {
  const tenantId =
    firstStringFromSources([body], [
      "tenantId",
      "tenant_id",
      "saas.tenantId",
      "saas.tenant_id",
      "workspace.tenantId",
      "workspace.tenant_id"
    ]) || "NO_TENANT";

  const workspaceId =
    firstStringFromSources([body], [
      "workspaceId",
      "workspace_id",
      "saas.workspaceId",
      "saas.workspace_id",
      "workspace.id",
      "workspace.workspaceId",
      "workspace.workspace_id"
    ]) || "NO_WORKSPACE";

  const subscriptionId =
    firstStringFromSources([body], [
      "subscriptionId",
      "subscription_id",
      "saas.subscriptionId",
      "saas.subscription_id",
      "subscription.id"
    ]) || "NO_SUBSCRIPTION";

  const accountId =
    firstStringFromSources([body], [
      "accountId",
      "account_id",
      "saas.accountId",
      "saas.account_id",
      "account.id"
    ]) || "NO_ACCOUNT";

  const requestedTier =
    firstStringFromSources([body], [
      "tier",
      "saasTier",
      "saas.tier",
      "saas.saasTier",
      "subscription.tier"
    ]) || "";

  const threadId =
    firstStringFromSources([body], [
      "threadId",
      "thread_id",
      "conversationId",
      "conversation_id",
      "saas.threadId",
      "saas.thread_id"
    ]) || sessionId;

  return {
    tenantId,
    workspaceId,
    subscriptionId,
    accountId,
    threadId,
    saasTier: normalizeSaasTier(requestedTier, handoff),
    source: isAnySaasContextPresent(tenantId, workspaceId, subscriptionId, accountId)
      ? "BODY"
      : "PLACEHOLDER"
  };
}

async function resolveSaasRuntimeContextFromDatabase(
  handoff: HandoffResolution,
  sessionId: string,
  bodyContext: SaasRuntimeContext
): Promise<SaasRuntimeContext | null> {
  try {
    const result = await queryHbceDatabase<SaasContextDatabaseRow>(
      `
SELECT
  p.tenant_id,
  p.workspace_id,
  p.account_id,
  s.subscription_id,
  s.tier
FROM ipr_account_profiles p
LEFT JOIN subscriptions s
  ON s.tenant_id = p.tenant_id
 AND s.workspace_id = p.workspace_id
 AND s.status = 'ACTIVE'
WHERE p.human_ipr = $1
  AND p.certificate_id = $2
  AND p.certificate_status = 'ACTIVE'
  AND p.access_decision = 'ACCESS_GRANTED'
ORDER BY
  CASE WHEN s.tier = 'IPR' THEN 0 ELSE 1 END,
  s.created_at DESC NULLS LAST
LIMIT 1;
`.trim(),
      [handoff.humanIpr, handoff.certificateId]
    );

    if (!result.ok || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const tenantId = stringFromValue(row.tenant_id).trim() || bodyContext.tenantId;
    const workspaceId = stringFromValue(row.workspace_id).trim() || bodyContext.workspaceId;
    const accountId = stringFromValue(row.account_id).trim() || bodyContext.accountId;
    const subscriptionId =
      stringFromValue(row.subscription_id).trim() ||
      (isCanonicalSelfPilotHandoff(handoff) ? HBCE_SELF_PILOT_SUBSCRIPTION_ID : bodyContext.subscriptionId);
    const tier = stringFromValue(row.tier).trim();

    return {
      tenantId,
      workspaceId,
      subscriptionId,
      accountId,
      threadId: bodyContext.threadId || sessionId,
      saasTier: normalizeSaasTier(tier, handoff),
      source: "DATABASE_PROFILE"
    };
  } catch {
    return null;
  }
}

function isConcreteSaasContext(context: SaasRuntimeContext): boolean {
  return (
    context.tenantId !== "NO_TENANT" &&
    context.workspaceId !== "NO_WORKSPACE" &&
    context.subscriptionId !== "NO_SUBSCRIPTION"
  );
}

function isAnySaasContextPresent(
  tenantId: string,
  workspaceId: string,
  subscriptionId: string,
  accountId: string
): boolean {
  return (
    tenantId !== "NO_TENANT" ||
    workspaceId !== "NO_WORKSPACE" ||
    subscriptionId !== "NO_SUBSCRIPTION" ||
    accountId !== "NO_ACCOUNT"
  );
}

function isCanonicalSelfPilotHandoff(handoff: HandoffResolution): boolean {
  return (
    handoff.humanIpr === HBCE_SELF_PILOT_HUMAN_IPR &&
    handoff.certificateId === HBCE_SELF_PILOT_CERTIFICATE_ID &&
    handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
  );
}

function buildPlaceholderSaasRuntimeContext(
  sessionId: string,
  handoff: HandoffResolution
): SaasRuntimeContext {
  return {
    tenantId: "NO_TENANT",
    workspaceId: "NO_WORKSPACE",
    subscriptionId: "NO_SUBSCRIPTION",
    accountId: "NO_ACCOUNT",
    threadId: sessionId,
    saasTier:
      handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT"
        ? "IPR"
        : "BASE",
    source: "PLACEHOLDER"
  };
}

function normalizeSaasTier(
  value: string,
  handoff: HandoffResolution
): "BASE" | "IPR" {
  const normalized = value.trim().toUpperCase();

  if (normalized === "IPR") {
    return "IPR";
  }

  if (handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    return "IPR";
  }

  return "BASE";
}

function mapPolicyDecisionToRuntimeDecision(policy: PolicyEvaluation): string {
  if (policy.decision === "BLOCK") {
    return "BLOCK";
  }

  if (policy.decision === "ESCALATE") {
    return "ESCALATE";
  }

  return "ALLOW";
}

function mapPolicyToAuditState(policy: PolicyEvaluation): string {
  if (policy.decision === "BLOCK") {
    return "BLOCKED";
  }

  if (policy.humanOversight === "REQUIRED") {
    return "MANDATORY";
  }

  if (policy.humanOversight === "RECOMMENDED") {
    return "ENABLED";
  }

  return "NOT_REQUIRED";
}

function resolveModelLevel(model: string, policy: PolicyEvaluation): string {
  const deepModel = process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;

  if (policy.decision === "BLOCK") {
    return "BLOCKED";
  }

  if (model === deepModel || policy.riskLevel === "HIGH") {
    return "ADVANCED";
  }

  if (policy.riskLevel === "MEDIUM") {
    return "ENHANCED";
  }

  return "STANDARD";
}

function resolveModelRoutingReason(model: string, policy: PolicyEvaluation): string {
  if (policy.decision === "BLOCK") {
    return "Runtime blocked the request before model execution.";
  }

  if (policy.riskLevel === "HIGH") {
    return "High risk request routed to deep model target.";
  }

  if (policy.riskLevel === "MEDIUM") {
    return "Medium risk request kept under enhanced audit semantics.";
  }

  return "Standard model selected by MVP runtime policy.";
}

function buildRequestId(sessionId: string, timestamp: string): string {
  return "REQ-" + sha256({ sessionId, timestamp, nonce: randomUUID() }).replace("sha256:", "").slice(0, 16).toUpperCase();
}

function normalizeCompletionUsage(usage: unknown): CompletionTokenUsage {
  const record = isJsonObject(usage) ? usage : {};

  const inputTokens =
    numberFromUnknown(record.prompt_tokens) ??
    numberFromUnknown(record.input_tokens);

  const outputTokens =
    numberFromUnknown(record.completion_tokens) ??
    numberFromUnknown(record.output_tokens);

  const totalTokens =
    numberFromUnknown(record.total_tokens) ??
    (inputTokens !== null || outputTokens !== null
      ? (inputTokens ?? 0) + (outputTokens ?? 0)
      : null);

  const promptTokensDetails = isJsonObject(record.prompt_tokens_details)
    ? record.prompt_tokens_details
    : {};
  const completionTokensDetails = isJsonObject(record.completion_tokens_details)
    ? record.completion_tokens_details
    : {};

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens: numberFromUnknown(promptTokensDetails.cached_tokens),
    reasoningTokens: numberFromUnknown(completionTokensDetails.reasoning_tokens)
  };
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
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
    memory: "IPR-bound memory preserves operational continuity only. DATABASE_PERSISTENT is the durable SaaS target when database store is active.",
    evt: "EVT supports technical traceability and database persistence target only; it is not legal certification.",
    audit: "Runtime audit log supports operational reconstruction only and does not create legal certification.",
    modelUsage: "Model usage log supports SaaS accounting and operational reconstruction only.",
    saas: "Tenant, workspace, subscription and account profile records are technical-operational SaaS records and do not create legal certification.",
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

function stringPath(source: JsonObject, path: string, fallback: string): string {
  const value = getPath(source, path);

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  return fallback;
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

function toJsonObject(value: unknown, fallback: JsonObject): JsonObject {
  const object = asJsonObject(toCanonicalValue(value));

  return object || fallback;
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

function toCanonicalValue(value: unknown): JsonValue {
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

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: JsonObject = {};
    const keys = Object.keys(record).sort();

    for (const key of keys) {
      sorted[key] = toCanonicalValue(record[key]);
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
