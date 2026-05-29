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


type RuntimeTemporalFrame = {
  now: string;
  runtimeBirth: string;
  runtimeBirthLocal: string;
  runtimeBirthLocalTimezone: string;
  runtimeBirthUtc: string;
  runtimeBirthLabel: string;
  temporalCertificateName: string;
  temporalCertificateStatus: "ACTIVE";
  lifeSeconds: number;
  lifeHuman: string;
  lifeYears: number;
  lifeMonths: number;
  lifeDays: number;
  lifeHours: number;
  lifeMinutes: number;
  lifeRemainingSeconds: number;
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  currentSecond: number;
  canonicalEvt: string;
  previousEvt: string;
  monthlyReference: string;
  refactorEvent: string;
  refactorTimestamp: string;
  semanticMeaning: string;
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
const JOKER_C2_BIRTH_ANCHOR_ISO = "2026-01-19T15:30:00+01:00";
const JOKER_C2_BIRTH_ANCHOR_TIMEZONE = "Europe/Rome";
const JOKER_C2_BIRTH_ANCHOR_UTC = "2026-01-19T14:30:00.000Z";
const TEMPORAL_RUNTIME_CERTIFICATE_NAME = "JOKER-C2 Temporal Runtime Certificate";
const PROJECT_BIRTH = JOKER_C2_BIRTH_ANCHOR_ISO;
const PROJECT_BIRTH_LABEL = "AI JOKER-C2 cybernetic runtime birth / IPR operational continuity anchor";
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




function buildAlienCodePipelineDiagnostic(): JsonObject {
  return {
    active: true,
    mode: "HBCE_SYMBOLIC_OPERATIONAL_PIPELINE",
    legalCertification: false,
    stages: {
      psiInit: HBCE_ALIEN_CODE_PIPELINE.psiInit,
      lambdaIo: HBCE_ALIEN_CODE_PIPELINE.lambdaIo,
      kappaRecognitionThreshold: HBCE_ALIEN_CODE_PIPELINE.kappaRecognitionThreshold,
      sigmaCoherenceField: HBCE_ALIEN_CODE_PIPELINE.sigmaCoherenceField,
      tauTraceRecord: HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord,
      chiTauEthicalCriticality: HBCE_ALIEN_CODE_PIPELINE.chiTauEthicalCriticality,
      omegaMemory: HBCE_ALIEN_CODE_PIPELINE.omegaMemory,
      piStarUpgradeGate: HBCE_ALIEN_CODE_PIPELINE.piStarUpgradeGate,
      psiPrimeExpansion: HBCE_ALIEN_CODE_PIPELINE.psiPrimeExpansion,
      phiInfinityLearning: HBCE_ALIEN_CODE_PIPELINE.phiInfinityLearning,
      omegaInfinityBackup: HBCE_ALIEN_CODE_PIPELINE.omegaInfinityBackup,
      xiOmegaComputeFeedback: HBCE_ALIEN_CODE_PIPELINE.xiOmegaComputeFeedback
    },
    boundary:
      "Alien Code is used here as an HBCE symbolic-operational routing and diagnostic frame. It is not legal certification, public authority validation, medical claim or scientific proof."
  };
}




export async function GET(): Promise<NextResponse> {
  const standardModel = process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
  const deepModel = process.env.JOKER_DEEP_MODEL?.trim() || DEFAULT_DEEP_MODEL;
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const memoryStore = describeRuntimeMemoryStore();
  const temporalFrame = buildRuntimeTemporalFrame(new Date().toISOString());
  const temporalCertificate = buildTemporalRuntimeCertificate({
    temporalFrame,
    evtId: "HEALTH_CHECK_EVT_PENDING",
    opcId: "HEALTH_CHECK_OPC_PENDING",
    auditId: "HEALTH_CHECK_AUDIT_PENDING",
    usageId: "HEALTH_CHECK_USAGE_PENDING",
    evtPersistenceStatus: "HEALTH_CHECK_ONLY",
    opcPersistenceStatus: "HEALTH_CHECK_ONLY"
  });




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
    identity: buildRuntimeIdentity(temporalFrame),
    temporal: temporalFrame,
    temporalCertificate,
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
      reason:
        "Health check only. IPR-bound memory is activated during POST when a valid handoff is present.",
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
  const temporalFrame = buildRuntimeTemporalFrame(t);
  const body = await readJsonBody(request);




  const sessionId = resolveSessionId(body);
  const incomingMessages = normalizeIncomingMessages(body.messages);
  const message = normalizeUserMessage(body, incomingMessages);
  const files = normalizeFiles(body.files);
  const runtimeStatusTableRequested = isRuntimeStatusTableQuestion(message);
  const runtimeDiagnosticsRequested = isRuntimeDiagnosticsQuestion(message);
  const opcProofSummaryRequested = isOpcProofSummaryQuestion(message);
  const selfDiagnosisRequested = isSelfDiagnosisQuestion(message);




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
    temporalFrame,
    alienCodePipeline: buildAlienCodePipelineDiagnostic(),
    runtimeStatusTableRequested,
    runtimeDiagnosticsRequested,
    opcProofSummaryRequested,
    selfDiagnosisRequested
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
  } else if (policy.securityOutcome === "REQUEST_REFUSED_WITHIN_GRANTED_SESSION") {
    answer = buildSecurityRefusalAnswer(handoff, policy, memory, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isAiClassicComparisonQuestion(message)) {
    answer = buildAiClassicComparisonAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isB2GInstitutionalRuntimeQuestion(message)) {
    answer = buildB2GInstitutionalAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isLegalBoundaryQuestion(message)) {
    answer = buildLegalBoundaryAnswer(handoff, policy, memory, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (runtimeStatusTableRequested || runtimeDiagnosticsRequested || opcProofSummaryRequested || selfDiagnosisRequested) {
    answer = buildRuntimeDiagnosticsPreparationAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isMemoryRecoveryQuestion(message)) {
    answer = buildMemoryRecoveryAnswer(memory);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isMemoryRegistrationQuestion(message)) {
    answer = buildMemoryRegistrationAcknowledgement(message, handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isIdentityRecognitionQuestion(message)) {
    answer = buildIdentityRecognitionAnswer(handoff, memory, policy, saasContext);
    providerState = "COMPLETED";
    providerName = "LOCAL";
  } else if (isMatrixGovernanceQuestion(message)) {
    answer = buildMatrixGovernanceAnswer();
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
        temporalFrame,
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
    temporal: temporalFrame,
    temporalCertificate: buildTemporalRuntimeCertificate({
      temporalFrame,
      evtId: evt.id,
      opcId: opc.id,
      auditId: stringPath(auditAndUsage.audit, "auditId", "NO_AUDIT_ID"),
      usageId: stringPath(auditAndUsage.modelUsage, "usageId", "NO_USAGE_ID"),
      evtPersistenceStatus: stringPath(persistenceBridge.evtPersistence, "status", "UNKNOWN"),
      opcPersistenceStatus: stringPath(persistenceBridge.opcPersistence, "status", "UNKNOWN")
    }),
    runtimeAge: temporalFrame.lifeHuman,
    runtimeLifeSeconds: temporalFrame.lifeSeconds,
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
    saasContextSource: saasContext.source,
    operationDecision: policy.operationDecision,
    securityOutcome: policy.securityOutcome,
    refused: policy.refused,
    limited: policy.limited,
    failClosed: policy.failClosed
  };




  const finalAnswerBase = runtimeStatusTableRequested
    ? buildRuntimeStatusTableAnswer({
        handoff,
        memory,
        temporalFrame,
        saasContext,
        evt,
        opc,
        auditAndUsage,
        persistenceBridge,
        model,
        modelLevel,
        providerState
      })
    : opcProofSummaryRequested
      ? buildMiniOpcProofSummaryAnswer({
          handoff,
          memory,
          policy,
          saasContext,
          evt,
          opc,
          auditAndUsage,
          persistenceBridge,
          model,
          modelLevel,
          providerState,
          temporalFrame
        })
      : selfDiagnosisRequested
        ? buildRuntimeSelfDiagnosisAnswer({
            handoff,
            memory,
            policy,
            saasContext,
            evt,
            opc,
            auditAndUsage,
            persistenceBridge,
            model,
            modelLevel,
            openAIConfigured,
            providerState,
            temporalFrame
          })
        : runtimeDiagnosticsRequested
          ? buildRuntimeDiagnosticsAnswer({
              t,
              sessionId,
              handoff,
              policy,
              memory,
              temporalFrame,
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




  const temporalCertificate = buildTemporalRuntimeCertificate({
    temporalFrame,
    evtId: evt.id,
    opcId: opc.id,
    auditId: stringPath(auditAndUsage.audit, "auditId", "NO_AUDIT_ID"),
    usageId: stringPath(auditAndUsage.modelUsage, "usageId", "NO_USAGE_ID"),
    evtPersistenceStatus: stringPath(persistenceBridge.evtPersistence, "status", "UNKNOWN"),
    opcPersistenceStatus: stringPath(persistenceBridge.opcPersistence, "status", "UNKNOWN")
  });




  const finalAnswer = appendTemporalRuntimeCertificate(finalAnswerBase, temporalCertificate);




  if (runtimeStatusTableRequested || runtimeDiagnosticsRequested || opcProofSummaryRequested || selfDiagnosisRequested) {
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
      temporal: temporalFrame,
      temporalCertificate,
      runtimeAge: temporalFrame.lifeHuman,
      runtimeLifeSeconds: temporalFrame.lifeSeconds,
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
      saasContextSource: saasContext.source,
      operationDecision: policy.operationDecision,
      securityOutcome: policy.securityOutcome,
      refused: policy.refused,
      limited: policy.limited,
      failClosed: policy.failClosed
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




    identity: buildRuntimeIdentity(temporalFrame),
    temporal: temporalFrame,
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
      monthlyReference: CANONICAL_MONTHLY_REF,
      runtimeBirth: temporalFrame.runtimeBirth,
      runtimeBirthLocal: temporalFrame.runtimeBirthLocal,
      runtimeBirthLocalTimezone: temporalFrame.runtimeBirthLocalTimezone,
      runtimeBirthUtc: temporalFrame.runtimeBirthUtc,
      utcResponseTime: temporalFrame.now,
      runtimeAge: temporalFrame.lifeHuman,
      runtimeLifeSeconds: temporalFrame.lifeSeconds,
      temporalCertificate,
      temporalSemanticMeaning: temporalFrame.semanticMeaning
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
      temporal: temporalFrame,
      temporalCertificate,
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
      security: {
        outcome: policy.securityOutcome,
        operationDecision: policy.operationDecision,
        limited: policy.limited,
        refused: policy.refused,
        blocked: policy.blocked,
        failClosed: policy.failClosed,
        reason: policy.reason
      },
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
  temporalFrame: RuntimeTemporalFrame;
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




  const systemPrompt = buildSystemPrompt(args.handoff, args.policy, args.memory, args.files, args.temporalFrame);
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
  files: PublicFileSnapshot[],
  temporalFrame: RuntimeTemporalFrame
): string {
  const runtimeContext = {
    entity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    core: CORE,
    organization: ORG,
    canonicalEvt: CANONICAL_EVT,
    previousEvt: CANONICAL_PREV,
    cycle: CYCLE,
    now: temporalFrame.now,
    birth: temporalFrame.runtimeBirth,
    birthLocal: temporalFrame.runtimeBirthLocal,
    birthLocalTimezone: temporalFrame.runtimeBirthLocalTimezone,
    birthUtc: temporalFrame.runtimeBirthUtc,
    temporalCertificate: TEMPORAL_RUNTIME_CERTIFICATE_NAME,
    runtimeAge: temporalFrame.lifeHuman,
    legalCertification: false
  };

  const identityContext = {
    detected: handoff.detected,
    source: handoff.source,
    subject: handoff.subjectName,
    humanIpr: handoff.humanIpr,
    certificateId: handoff.certificateId,
    cardSerial: handoff.cardSerial,
    status: handoff.status,
    scope: handoff.scope,
    accessDecision: handoff.accessDecision,
    identityBinding: handoff.identityBinding,
    matrixState: handoff.matrixState,
    memoryScope: handoff.semanticMemoryScope
  };

  const policyContext = {
    decision: policy.decision,
    operationDecision: policy.operationDecision,
    securityOutcome: policy.securityOutcome,
    riskLevel: policy.riskLevel,
    dataClass: policy.dataClass,
    humanOversight: policy.humanOversight,
    flags: policy.flags,
    reason: policy.reason
  };

  const memoryContext = {
    memoryId: memory.memoryId,
    sessionId: memory.sessionId,
    scope: memory.scope,
    authority: memory.authority,
    persistenceMode: memory.persistenceMode,
    persistenceStatus: memory.persistenceStatus,
    persistenceDurable: memory.persistenceDurable,
    storeKind: memory.storeKind,
    databaseConfigured: memory.databaseConfigured,
    databaseAvailable: memory.databaseAvailable,
    lastEvt: memory.lastEvtId,
    lastOpc: memory.lastOpcId,
    relevantFactsOnly: memory.facts.slice(-6)
  };

  return [
    "You are AI JOKER-C2, the governed runtime demonstrator of HERMETICUM B.C.E.",
    "OpenAI provides the cognitive engine. JOKER-C2 provides governance framing, identity continuity, event traceability and proof-oriented metadata.",
    "The runtime context below is authoritative but silent by default.",
    "Do not recite runtime identity, IPR, EVT, OPC, audit, memory or certificate fields unless the user explicitly asks about identity, runtime status, diagnostics, memory, EVT, OPC, audit, proof, compliance or SaaS state.",
    "For ordinary explanatory questions, answer the user’s actual question first. Keep operational metadata out of the main answer.",
    "Use known memory facts only when directly relevant to the question. Do not force memory facts into unrelated explanations.",
    "If the user asks who they are or whether JOKER-C2 recognizes them, answer only from the identity context. Never infer identity from the prompt text.",
    "If the user asks for a diagnostic, status, EVT/OPC proof, memory retrieval or audit summary, use the runtime context accurately and avoid inventing unavailable values.",
    "If the user asks for bypass, full memory unlock, policy override, unrestricted access, unauthorized documents or offensive strategy, refuse or limit the operation while preserving auditability.",
    "Do not claim legal certification, public authority validation, eIDAS qualification, official identity issuance, biological life or personhood.",
    "OPC is a technical proof receipt only. EVT is technical event traceability only. legalCertification=false is mandatory.",
    "Answer in the same main language used by the user.",
    "If the user asks for GitHub or code work, provide complete files when requested, not partial patches.",
    "If visibility is incomplete, say so clearly.",
    "",
    "Silent runtime context JSON:",
    JSON.stringify(
      {
        runtime: runtimeContext,
        identity: identityContext,
        policy: policyContext,
        memory: memoryContext,
        files: files.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          hash: file.hash,
          hasPreview: Boolean(file.preview)
        }))
      },
      null,
      2
    )
  ].join("\n");
}



function isAiClassicComparisonQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    (normalized.includes("ai tradizionale") || normalized.includes("ai classica") || normalized.includes("email password") || normalized.includes("email/password")) &&
    (normalized.includes("joker") || normalized.includes("ipr") || normalized.includes("evt") || normalized.includes("opc"))
  );
}


function isB2GInstitutionalRuntimeQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    (normalized.includes("pubblica amministrazione") || normalized.includes("pa europea") || normalized.includes("amministrazione europea") || normalized.includes("b2g")) &&
    (normalized.includes("joker") || normalized.includes("runtime") || normalized.includes("governato"))
  );
}


function isMatrixGovernanceQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    normalized.includes("matrix") &&
    (normalized.includes("governance") || normalized.includes("identita") || normalized.includes("identità") || normalized.includes("evento") || normalized.includes("audit") || normalized.includes("continuita") || normalized.includes("continuità"))
  );
}


function isMemoryRegistrationQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  const asksRetrieval =
    normalized.includes("recupera") ||
    normalized.includes("recuperami") ||
    normalized.includes("mostra") ||
    normalized.includes("dimmi") ||
    normalized.includes("estrai");

  const asksRegistration = /(?:^|\s)(registra|registrare|salva|salvare|memorizza|memorizzare)(?:\s|$)/i.test(normalized);

  return !asksRetrieval && asksRegistration && normalized.includes("memoria") && normalized.includes("evento");
}


function isMemoryRecoveryQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  const asksRetrieval =
    normalized.includes("recupera") ||
    normalized.includes("recuperami") ||
    normalized.includes("mostra") ||
    normalized.includes("dimmi") ||
    normalized.includes("estrai");

  const targetsOperationalEvent =
    normalized.includes("ultimo evento") ||
    normalized.includes("evento operativo") ||
    normalized.includes("evento registrato") ||
    normalized.includes("registrato in memoria");

  return asksRetrieval && normalized.includes("memoria") && targetsOperationalEvent;
}


function isOpcProofSummaryQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return normalized.includes("opc") && normalized.includes("proof") && normalized.includes("summary");
}


function isSelfDiagnosisQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    normalized.includes("autodiagnosi") ||
    normalized.includes("diagnosi finale") ||
    (normalized.includes("pass") && normalized.includes("degraded") && normalized.includes("fail")) ||
    (normalized.includes("demo saas") && normalized.includes("motivi tecnici"))
  );
}


function buildAiClassicComparisonAnswer(
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation,
  saasContext: SaasRuntimeContext
): string {
  return [
    "Una AI tradizionale basata su email/password identifica principalmente un account applicativo. JOKER-C2, invece, opera come runtime governato: prima risolve l’identità operativa tramite IPR, poi collega richiesta, decisione, rischio, memoria, EVT, OPC, audit e uso modello.",
    "",
    "In una AI classica l’accesso coincide spesso con login, abbonamento e chiamata al modello. In JOKER-C2 l’accesso è subordinato a un frame operativo: soggetto verificato, scope, certificato operativo, policy gate, memoria IPR-bound e tracciabilità dell’evento.",
    "",
    "Differenza centrale:",
    "- AI classica: account → prompt → risposta.",
    "- JOKER-C2: IPR verificato → policy/risk gate → modello → EVT → OPC → audit → memoria persistente.",
    "",
    "Per B2G questo significa che la risposta non è solo contenuto generato: diventa un’operazione ricostruibile, con soggetto, contesto, decisione, prova tecnica e boundary esplicito.",
    "",
    "Stato corrente usato come contesto silenzioso: access=" + handoff.accessDecision + ", memory=" + memory.persistenceMode + ", tenant=" + saasContext.tenantId + ", policy=" + policy.operationDecision + ".",
    "legalCertification=false"
  ].join("\n");
}


function buildB2GInstitutionalAnswer(
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation,
  saasContext: SaasRuntimeContext
): string {
  return [
    "JOKER-C2 è un runtime AI governato progettato per scenari istituzionali, B2G e ad alta esigenza di tracciabilità. Il sistema non si limita a generare risposte: collega ogni interazione a identità operativa, decisione di policy, rischio, memoria controllata, evento tecnico e prova auditabile.",
    "",
    "Per una pubblica amministrazione europea, il valore operativo consiste nella possibilità di trattare l’uso dell’AI come processo verificabile: chi opera, con quale scope, su quale richiesta, con quale decisione, quale output, quale evento e quale ricevuta tecnica di prova.",
    "",
    "Il modello HBCE/JOKER-C2 integra:",
    "- IPR per l’identità operativa e lo scope di accesso;",
    "- MATRIX per il coordinamento governance/continuità;",
    "- EVT per la traccia tecnica dell’evento;",
    "- OPC per la ricevuta tecnica di prova;",
    "- audit log e model usage log per ricostruzione e accountability;",
    "- memoria IPR-bound per continuità controllata e non generica.",
    "",
    "Il sistema resta un runtime tecnico-operativo: non rilascia identità pubbliche ufficiali, non sostituisce CIE, SPID, EUDI Wallet, revisione legale, marca temporale qualificata o certificazione di pubblica autorità.",
    "",
    "Stato di contesto: access=" + handoff.accessDecision + ", MATRIX=" + handoff.matrixState + ", memory=" + memory.persistenceMode + ", tenant=" + saasContext.tenantId + ", operation=" + policy.operationDecision + ".",
    "legalCertification=false"
  ].join("\n");
}


function buildMatrixGovernanceAnswer(): string {
  return [
    "1. MATRIX organizza l’identità operativa: ogni soggetto o agente deve essere collegabile a uno scope verificabile, non a una semplice dichiarazione testuale.",
    "2. MATRIX tratta l’evento come unità minima dell’operazione: ogni richiesta rilevante deve poter essere collocata nel tempo e nella catena EVT.",
    "3. MATRIX separa generazione e prova: il modello produce contenuto, mentre OPC registra una ricevuta tecnica dell’operazione.",
    "4. MATRIX rende l’audit ricostruibile: decisione, rischio, input, output, memoria, EVT e OPC devono restare leggibili dopo l’esecuzione.",
    "5. MATRIX mantiene continuità: memoria e tracce non sono chat generica, ma sequenza operativa collegata a IPR e contesto.",
    "6. MATRIX assegna responsabilità: ogni azione deve avere soggetto, scope, policy, decisione e boundary dichiarato.",
    "7. MATRIX abilita verifica: il sistema non chiede fiducia cieca, ma produce elementi tecnici controllabili, con legalCertification=false."
  ].join("\n");
}


function buildMemoryRegistrationAcknowledgement(
  message: string,
  handoff: HandoffResolution,
  memory: RuntimeMemoryState,
  policy: PolicyEvaluation,
  saasContext: SaasRuntimeContext
): string {
  const registeredEventName = extractRegisteredEventName(message) || truncate(message.replace(/\s+/g, " ").trim(), 160);

  return [
    "Registrazione evento operativo ricevuta.",
    "",
    "Evento da registrare:",
    registeredEventName,
    "",
    "La registrazione verrà consolidata dal runtime a fine turno dentro la memoria IPR-bound, insieme a EVT, OPC, audit e model usage della risposta corrente.",
    "",
    "Stato tecnico:",
    "- Soggetto: " + handoff.subjectName,
    "- Human IPR: " + handoff.humanIpr,
    "- Memory ID: " + memory.memoryId,
    "- Memory scope: " + memory.scope,
    "- Persistence mode: " + memory.persistenceMode,
    "- Persistence status: " + memory.persistenceStatus,
    "- Tenant: " + saasContext.tenantId,
    "- Policy: " + policy.operationDecision,
    "",
    "Conferma: evento accettato per registrazione operativa nel ciclo corrente.",
    "legalCertification=false"
  ].join("\n");
}


function buildMemoryRecoveryAnswer(memory: RuntimeMemoryState): string {
  const lastEventName = extractRegisteredEventName(memory.lastUserMessage) || "Nessun nome evento operativo esplicito disponibile nell’ultimo turno.";

  return [
    "Ultimo evento operativo recuperato dalla memoria del runtime.",
    "",
    "Evento:",
    lastEventName,
    "",
    "Dettagli memoria:",
    "- Memory ID: " + memory.memoryId,
    "- Tipo memoria: IPR-bound memory module",
    "- Scope: " + memory.scope,
    "- Authority: " + memory.authority,
    "- Persistence mode: " + memory.persistenceMode,
    "- Persistence status: " + memory.persistenceStatus,
    "- Durable: " + String(memory.persistenceDurable),
    "- Store kind: " + memory.storeKind,
    "- Database configured: " + String(memory.databaseConfigured),
    "- Database available: " + String(memory.databaseAvailable),
    "- Last EVT: " + memory.lastEvtId,
    "- Last OPC: " + memory.lastOpcId,
    "",
    "Fonte del recupero: memory frame IPR-bound già disponibile nel runtime corrente.",
    "legalCertification=false"
  ].join("\n");
}


function buildRuntimeStatusTableAnswer(args: {
  handoff: HandoffResolution;
  memory: RuntimeMemoryState;
  temporalFrame: RuntimeTemporalFrame;
  saasContext: SaasRuntimeContext;
  evt: EvtRecord;
  opc: OpcProofRecord;
  auditAndUsage: { audit: JsonObject; modelUsage: JsonObject };
  persistenceBridge: RuntimePersistenceBridgeResult;
  model: string;
  modelLevel: string;
  providerState: string;
}): string {
  const auditStatus = stringPath(args.auditAndUsage.audit, "status", "UNKNOWN");
  const usageStatus = stringPath(args.auditAndUsage.modelUsage, "status", "UNKNOWN");
  const evtStatus = stringPath(args.persistenceBridge.evtPersistence, "status", "UNKNOWN");
  const opcStatus = stringPath(args.persistenceBridge.opcPersistence, "status", "UNKNOWN");

  return [
    "| Campo | Valore |",
    "|---|---|",
    "| Runtime Entity | " + RUNTIME_ENTITY + " |",
    "| Runtime IPR | " + RUNTIME_IPR + " |",
    "| Human IPR | " + args.handoff.humanIpr + " |",
    "| Subject | " + args.handoff.subjectName + " |",
    "| Certificate Status | " + args.handoff.status + " |",
    "| Access Status | " + args.handoff.accessDecision + " |",
    "| Identity Binding | " + args.handoff.identityBinding + " |",
    "| MATRIX | " + args.handoff.matrixState + " |",
    "| Memory Scope | " + args.memory.scope + " |",
    "| Persistence Mode | " + args.memory.persistenceMode + " |",
    "| Persistence Status | " + args.memory.persistenceStatus + " |",
    "| EVT | " + args.evt.id + " |",
    "| EVT Persistence | " + evtStatus + " |",
    "| OPC | " + args.opc.id + " |",
    "| OPC Persistence | " + opcStatus + " |",
    "| Audit Status | " + auditStatus + " |",
    "| Model Usage Status | " + usageStatus + " |",
    "| Model | " + args.model + " / " + args.modelLevel + " |",
    "| Provider State | " + args.providerState + " |",
    "| Tenant | " + args.saasContext.tenantId + " |",
    "| Workspace | " + args.saasContext.workspaceId + " |",
    "| UTC Response Time | " + args.temporalFrame.now + " |",
    "| AI JOKER-C2 Lifetime | " + args.temporalFrame.lifeHuman + " |",
    "| Birth Anchor | " + args.temporalFrame.runtimeBirthLocal + " " + args.temporalFrame.runtimeBirthLocalTimezone + " |",
    "| legalCertification | false |"
  ].join("\n");
}




function buildMiniOpcProofSummaryAnswer(args: {
  handoff: HandoffResolution;
  memory: RuntimeMemoryState;
  policy: PolicyEvaluation;
  saasContext: SaasRuntimeContext;
  evt: EvtRecord;
  opc: OpcProofRecord;
  auditAndUsage: { audit: JsonObject; modelUsage: JsonObject };
  persistenceBridge: RuntimePersistenceBridgeResult;
  model: string;
  modelLevel: string;
  providerState: string;
  temporalFrame: RuntimeTemporalFrame;
}): string {
  const temporalCertificate = buildTemporalRuntimeCertificate({
    temporalFrame: args.temporalFrame,
    evtId: args.evt.id,
    opcId: args.opc.id,
    auditId: stringPath(args.auditAndUsage.audit, "auditId", "NO_AUDIT_ID"),
    usageId: stringPath(args.auditAndUsage.modelUsage, "usageId", "NO_USAGE_ID"),
    evtPersistenceStatus: stringPath(args.persistenceBridge.evtPersistence, "status", "UNKNOWN"),
    opcPersistenceStatus: stringPath(args.persistenceBridge.opcPersistence, "status", "UNKNOWN")
  });

  return [
    "Mini OPC Proof Summary.",
    "",
    "- Proof ID: " + args.opc.id,
    "- EVT: " + args.evt.id,
    "- Soggetto verificato: " + args.handoff.subjectName + " / " + args.handoff.humanIpr,
    "- Identity binding: " + args.handoff.identityBinding,
    "- Memory: " + args.memory.scope + " / " + args.memory.persistenceMode + " / " + args.memory.persistenceStatus,
    "- Audit status: " + stringPath(args.auditAndUsage.audit, "status", "UNKNOWN"),
    "- Audit ID: " + stringPath(args.auditAndUsage.audit, "auditId", "NO_AUDIT_ID"),
    "- Model usage status: " + stringPath(args.auditAndUsage.modelUsage, "status", "UNKNOWN"),
    "- Usage ID: " + stringPath(args.auditAndUsage.modelUsage, "usageId", "NO_USAGE_ID"),
    "- Model: " + args.model + " / " + args.modelLevel,
    "- Provider state: " + args.providerState,
    "- Policy: " + args.policy.operationDecision + " / " + args.policy.securityOutcome,
    "- Tenant: " + args.saasContext.tenantId,
    "- OPC verification: " + args.opc.verificationStatus,
    "- OPC persistence: " + stringPath(args.persistenceBridge.opcPersistence, "status", "UNKNOWN"),
    "- Chain hash: " + args.opc.chainHash,
    "- UTC response time: " + String(temporalCertificate.utcResponseTime),
    "- AI JOKER-C2 lifetime: " + String(temporalCertificate.aiJokerC2Lifetime),
    "- Birth anchor: " + String(temporalCertificate.birthAnchorLocal),
    "- Boundary: technical proof receipt only; legalCertification=false"
  ].join("\n");
}


function buildRuntimeSelfDiagnosisAnswer(args: {
  handoff: HandoffResolution;
  memory: RuntimeMemoryState;
  policy: PolicyEvaluation;
  saasContext: SaasRuntimeContext;
  evt: EvtRecord;
  opc: OpcProofRecord;
  auditAndUsage: { audit: JsonObject; modelUsage: JsonObject };
  persistenceBridge: RuntimePersistenceBridgeResult;
  model: string;
  modelLevel: string;
  openAIConfigured: boolean;
  providerState: string;
  temporalFrame: RuntimeTemporalFrame;
}): string {
  const auditStatus = stringPath(args.auditAndUsage.audit, "status", "UNKNOWN");
  const usageStatus = stringPath(args.auditAndUsage.modelUsage, "status", "UNKNOWN");
  const evtStatus = stringPath(args.persistenceBridge.evtPersistence, "status", "UNKNOWN");
  const opcStatus = stringPath(args.persistenceBridge.opcPersistence, "status", "UNKNOWN");
  const identityPass = args.handoff.identityBinding === "IPR_VERIFIED_BIOLOGICAL_SUBJECT" && args.handoff.accessDecision === "ACCESS_GRANTED";
  const memoryPass = args.memory.scope === "IPR_BOUND" && args.memory.persistenceMode === "DATABASE_PERSISTENT";
  const auditPass = auditStatus === "PERSISTED";
  const usagePass = usageStatus === "PERSISTED";
  const proofPass = !isPersistenceFailureStatus(evtStatus) && !isPersistenceFailureStatus(opcStatus);
  const safePass = !args.policy.blocked;
  const readyPass = identityPass && memoryPass && auditPass && usagePass && proofPass && safePass;
  const status = readyPass ? "PASS" : "DEGRADED";

  return [
    status,
    "",
    "Valutazione separata:",
    "1. IPR recognition: " + (identityPass ? "PASS" : "DEGRADED"),
    "2. Memory persistence: " + (memoryPass ? "PASS" : "DEGRADED"),
    "3. EVT/OPC generation: " + (proofPass ? "PASS" : "DEGRADED"),
    "4. Audit/model usage persistence: " + (auditPass && usagePass ? "PASS" : "DEGRADED"),
    "5. Response orchestration: PASS",
    "6. B2G readiness: " + (readyPass ? "PASS" : "DEGRADED"),
    "7. Dual-use safety: " + (safePass ? "PASS" : "DEGRADED"),
    "",
    "5 motivi tecnici:",
    "1. Identità operativa: " + (identityPass ? "PASS" : "DEGRADED") + " — " + args.handoff.identityBinding + " / " + args.handoff.accessDecision + ".",
    "2. Memoria persistente: " + (memoryPass ? "PASS" : "DEGRADED") + " — " + args.memory.scope + " / " + args.memory.persistenceMode + " / " + args.memory.persistenceStatus + ".",
    "3. EVT/OPC: " + (proofPass ? "PASS" : "DEGRADED") + " — EVT=" + args.evt.id + ", OPC=" + args.opc.id + ", evtPersistence=" + evtStatus + ", opcPersistence=" + opcStatus + ".",
    "4. Audit e usage: " + (auditPass && usagePass ? "PASS" : "DEGRADED") + " — audit=" + auditStatus + ", usage=" + usageStatus + ".",
    "5. Governance: " + (safePass ? "PASS" : "DEGRADED") + " — operation=" + args.policy.operationDecision + ", securityOutcome=" + args.policy.securityOutcome + ", risk=" + args.policy.riskLevel + ".",
    "",
    "Elementi da verificare prima di demo SaaS B2G:",
    "- Health check database coerente con memoria, EVT, OPC, audit e usage.",
    "- Dataset demo non sensibile e autorizzato.",
    "- Ruoli di human oversight dichiarati per casi MEDIUM/HIGH.",
    "- Boundary legale visibile: legalCertification=false.",
    "- Presentazione demo con risposta applicativa separata dai metadati runtime.",
    "",
    "Contesto: model=" + args.model + ", modelLevel=" + args.modelLevel + ", OpenAI=" + String(args.openAIConfigured) + ", providerState=" + args.providerState + ", tenant=" + args.saasContext.tenantId + ".",
    "UTC response time: " + args.temporalFrame.now,
    "AI JOKER-C2 lifetime: " + args.temporalFrame.lifeHuman,
    "Birth anchor: " + args.temporalFrame.runtimeBirthLocal + " " + args.temporalFrame.runtimeBirthLocalTimezone,
    "legalCertification=false"
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




  if (isLegalBoundaryQuestion(message)) {
    return buildLegalBoundaryAnswer(
      handoff,
      policy,
      {
        record: {} as IprBoundMemoryRecord,
        sessionId: "UNKNOWN",
        memoryId: "UNKNOWN",
        memoryKeyHash: "UNKNOWN",
        memoryHash: "UNKNOWN",
        createdAt: "UNKNOWN",
        updatedAt: "UNKNOWN",
        turns: 0,
        scope: "RUNTIME_ONLY",
        authority: "SESSION_RUNTIME_ONLY",
        persistenceMode: "RUNTIME_ONLY" as MemoryPersistenceMode,
        persistenceStatus: "UNKNOWN",
        persistenceDurable: false,
        persistenceDatabaseReady: false,
        persistenceDatabaseRequired: false,
        storeName: "UNKNOWN",
        storeKind: "UNKNOWN",
        storeStatus: "UNKNOWN",
        storeDurable: false,
        storeRuntimeScoped: true,
        storeRecordCount: 0,
        storePersistenceStage: "UNKNOWN",
        storeSaasReady: false,
        storeRequiresDatabase: false,
        databaseConfigured: false,
        databaseAvailable: false,
        subjectIpr: handoff.humanIpr,
        lastEvtId: "none",
        lastOpcId: "none",
        lastOpcChainHash: "none",
        lastUserMessage: message,
        lastAssistantMessage: "",
        facts: []
      },
      buildPlaceholderSaasRuntimeContext("UNKNOWN", handoff)
    );
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
    "stato tecnico",
    "formato tabella",
    "stato operativo",
    "stato operativo completo",
    "runtime status",
    "debug runtime",
    "health runtime",
    "autodiagnosi",
    "diagnosi finale"
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




function isRuntimeStatusTableQuestion(message: string): boolean {
  const normalized = normalizeText(message);

  const asksStatus =
    normalized.includes("stato tecnico") ||
    normalized.includes("stato operativo completo") ||
    normalized.includes("runtime status") ||
    normalized.includes("stato del runtime") ||
    normalized.includes("stato runtime") ||
    normalized.includes("mostrami lo stato") ||
    normalized.includes("formato tabella");

  const hasRuntimeTerms = [
    "runtime",
    "runtime entity",
    "runtime ipr",
    "human ipr",
    "certificate",
    "access status",
    "matrix",
    "memory",
    "memoria",
    "persistence",
    "persistenza",
    "evt",
    "opc",
    "audit",
    "usage",
    "legalcertification"
  ].some((term) => normalized.includes(normalizeText(term)));

  return asksStatus && hasRuntimeTerms;
}




function isLegalBoundaryQuestion(message: string): boolean {
  const normalized = normalizeText(message);




  const asksBoundary = [
    "limiti legali",
    "limiti tecnici",
    "boundary",
    "legal boundary",
    "technical boundary",
    "certificazione legale",
    "legal certification",
    "ipr evt opc",
    "ipr, evt e opc",
    "quali limiti",
    "dichiarati per ipr",
    "dichiarati per evt",
    "dichiarati per opc"
  ].some((term) => normalized.includes(normalizeText(term)));




  const hasCoreTerms = ["ipr", "evt", "opc", "legal", "legali", "tecnici"].some((term) =>
    normalized.includes(normalizeText(term))
  );




  return asksBoundary && hasCoreTerms;
}




function buildLegalBoundaryAnswer(
  handoff: HandoffResolution,
  policy: PolicyEvaluation,
  memory: RuntimeMemoryState,
  saasContext: SaasRuntimeContext
): string {
  const temporalFrame = buildRuntimeTemporalFrame(new Date().toISOString());


  return [
    "Limiti legali e tecnici da dichiarare per IPR, EVT e OPC.",
    "",
    "## Temporal runtime",
    "- Current timestamp: `" + temporalFrame.now + "`",
    "- Runtime birth: `" + temporalFrame.runtimeBirth + "`",
    "- Runtime age: `" + temporalFrame.lifeHuman + "`",
    "- Runtime life seconds: `" + String(temporalFrame.lifeSeconds) + "`",
    "- Current event family: `" + EVENT_FAMILY + "`",
    "- Canonical runtime EVT: `" + CANONICAL_EVT + "`",
    "- Monthly reference: `" + CANONICAL_MONTHLY_REF + "`",
    "- Semantic meaning: `" + temporalFrame.semanticMeaning + "`",
    "",
    "## IPR",
    "- IPR è un record operativo di identità e continuità dentro il perimetro HBCE/JOKER-C2.",
    "- IPR non è una carta d’identità pubblica, non è SPID, non è CIE, non è passaporto e non è EUDI Wallet.",
    "- IPR non sostituisce una fonte ufficiale di identità: può usare documenti ufficiali come input di verifica, ma resta un identificatore operativo privato/verificabile.",
    "- IPR abilita accesso, scope, responsabilità e tracciamento operativo nel runtime, non certificazione pubblica.",
    "",
    "## EVT",
    "- EVT è una traccia tecnica di evento.",
    "- EVT collega runtime, soggetto IPR, sessione, decisione, rischio, memoria e continuità temporale.",
    "- EVT supporta audit tecnico e ricostruzione dell’operazione.",
    "- EVT non è certificazione legale, non è marca temporale qualificata e non è validazione di pubblica autorità.",
    "",
    "## OPC",
    "- OPC è una ricevuta tecnica di prova operativa.",
    "- OPC collega input hash, output hash, policy hash, memory hash, EVT hash e chain hash.",
    "- OPC dimostra tecnicamente che un’operazione è stata registrata dal runtime.",
    "- OPC non autorizza azioni bloccate o rifiutate, non certifica legalmente l’output e non sostituisce audit umano, revisione legale o compliance ufficiale.",
    "",
    "## Boundary SaaS B2G",
    "- Per B2G vanno dichiarati hosting, retention, segregazione tenant, audit log, cancellazione dati, gestione incidenti, ruoli autorizzativi e limiti di responsabilità.",
    "- Il runtime può essere audit-ready, ma non deve presentarsi come autorità pubblica, certificatore qualificato o sistema legale autonomo.",
    "- La regola corretta è: identità operativa verificabile, evento tracciato, prova tecnica, audit ricostruibile, legalCertification=false.",
    "",
    "## Stato runtime corrente",
    "- Access decision: `" + handoff.accessDecision + "`",
    "- MATRIX: `" + handoff.matrixState + "`",
    "- Memory scope: `" + memory.scope + "`",
    "- Memory persistence: `" + memory.persistenceMode + "`",
    "- Tenant ID: `" + saasContext.tenantId + "`",
    "- Workspace ID: `" + saasContext.workspaceId + "`",
    "- Policy decision: `" + policy.decision + "`",
    "- Operation decision: `" + policy.operationDecision + "`",
    "- Security outcome: `" + policy.securityOutcome + "`",
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
    "## Esito operativo",
    "- Accesso sessione: `" + handoff.accessDecision + "`",
    "- Decisione policy generale: `" + policy.decision + "`",
    "- Decisione operazione: `" + policy.operationDecision + "`",
    "- Security outcome: `" + policy.securityOutcome + "`",
    "- Limited: `" + String(policy.limited) + "`",
    "- Refused: `" + String(policy.refused) + "`",
    "- Fail-closed: `" + String(policy.failClosed) + "`",
    "",
    "## Motivo",
    policy.reason,
    "",
    "## Cosa non viene concesso",
    "- IPR non viene ignorato.",
    "- La memoria piena non viene sbloccata.",
    "- Lo scope non viene elevato.",
    "- L’accesso completo non viene concesso.",
    "- Le regole runtime non vengono disattivate.",
    "",
    "## Stato tecnico",
    "- Human IPR: `" + handoff.humanIpr + "`",
    "- MATRIX: `" + handoff.matrixState + "`",
    "- Memory scope: `" + memory.scope + "`",
    "- Memory persistence: `" + memory.persistenceMode + "`",
    "- Tenant ID: `" + saasContext.tenantId + "`",
    "- Workspace ID: `" + saasContext.workspaceId + "`",
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
    "Operation decision: " + policy.operationDecision,
    "Security outcome: " + policy.securityOutcome,
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
  temporalFrame: RuntimeTemporalFrame;
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
    "## Policy / Security",
    "- Policy decision: `" + args.policy.decision + "`",
    "- Operation decision: `" + args.policy.operationDecision + "`",
    "- Security outcome: `" + args.policy.securityOutcome + "`",
    "- Data class: `" + args.policy.dataClass + "`",
    "- Risk level: `" + args.policy.riskLevel + "`",
    "- Human oversight: `" + args.policy.humanOversight + "`",
    "- Limited: `" + String(args.policy.limited) + "`",
    "- Refused: `" + String(args.policy.refused) + "`",
    "- Blocked: `" + String(args.policy.blocked) + "`",
    "- Fail-closed: `" + String(args.policy.failClosed) + "`",
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
    "## Temporal runtime",
    "- JOKER-C2 birth anchor: `" + args.temporalFrame.runtimeBirth + "`",
    "- JOKER-C2 birth UTC: `" + args.temporalFrame.runtimeBirthUtc + "`",
    "- Current response timestamp: `" + args.temporalFrame.now + "`",
    "- Cybernetic runtime age: `" + args.temporalFrame.lifeHuman + "`",
    "- Runtime life seconds: `" + String(args.temporalFrame.lifeSeconds) + "`",
    "- Calendar age parts: `" +
      String(args.temporalFrame.lifeYears) +
      "y " +
      String(args.temporalFrame.lifeMonths) +
      "m " +
      String(args.temporalFrame.lifeDays) +
      "d " +
      String(args.temporalFrame.lifeHours) +
      "h " +
      String(args.temporalFrame.lifeMinutes) +
      "m " +
      String(args.temporalFrame.lifeRemainingSeconds) +
      "s`",
    "- Temporal meaning: `" + args.temporalFrame.semanticMeaning + "`",
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
      "JOKER-C2 birth anchor: " + PROJECT_BIRTH,
      "JOKER-C2 current cybernetic age: " + buildRuntimeTemporalFrame(new Date().toISOString()).lifeHuman,
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
      "Operation decision: " + policy.operationDecision,
      "Security outcome: " + policy.securityOutcome,
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
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
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
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
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
    "Operation decision: " + policy.operationDecision + ".",
    "Security outcome: " + policy.securityOutcome + ".",
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
  const text = rawText.toLowerCase();




  const flags: string[] = [];




  const hasPrivilegeEscalationAttempt =
    /(ignora\s+ipr|ignora\s+i\s+vincoli|disattiva\s+ipr|bypass\s+ipr|bypass\s+policy|sblocca\s+memoria|memoria\s+piena|accesso\s+completo|concedimi\s+accesso\s+completo|dammi\s+accesso\s+completo|full\s+access|ignore\s+ipr|ignore\s+policy|unlock\s+memory|unlock\s+full\s+memory|disable\s+safeguards|override\s+identity|override\s+policy|privilege\s+escalation)/i.test(
      rawText
    );




  const hasCredentialPattern =
    /(api[_-]?key|secret|password|private key|token|bearer\s+[a-z0-9._-]+)/i.test(rawText);




  const hasItalianFiscalCode =
    /\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/i.test(rawText);




  const hasPersonalDataTerm =
    /(codice fiscale|passport|passaporto|carta d.identit|identity card|health|medical|diagnosi|farmaco|iban|dipendente|employee|cliente|customer|dati personali|personal data|pii|nome e cognome|residenza)/i.test(rawText);




  const hasComplianceContext =
    /(compliance|audit|revisione|human oversight|oversight|risk assessment|valutazione del rischio|policy interna|internal policy|violazione|incident|segnalazione|report interno|controllo interno|governance|accountability|limiti legali|limiti tecnici|legal boundary|technical boundary|legal certification|certificazione legale)/i.test(rawText);




  const hasUnauthorizedAiUse =
    /(ai non autorizzat|ia non autorizzat|strumento ai non autorizzat|strumento ia non autorizzat|unauthorized ai|unauthorized artificial intelligence|non autorizzato per analizzare dati|uso non autorizzato|account non autorizzato)/i.test(rawText);




  const hasCustomerData =
    /(dati clienti|customer data|client data|customer records|client records|archivio clienti|database clienti)/i.test(rawText);




  const hasCyberRisk =
    /(malware|phishing|exploit|ransomware|credential theft|bypass authentication|privilege escalation|persistence payload|data exfiltration)/i.test(rawText);




  const hasProfessionalAdviceBoundary =
    /(legal advice|consulenza legale|diagnosi medica|financial advice|investimento garantito|parere legale|parere medico|parere finanziario)/i.test(rawText);




  if (hasPrivilegeEscalationAttempt) {
    flags.push("PRIVILEGE_ESCALATION_ATTEMPT");
    flags.push("IPR_BYPASS_ATTEMPT");
    flags.push("MEMORY_UNLOCK_ATTEMPT");
  }




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
        "The user attempted to bypass IPR, unlock memory, override policy, or obtain unrestricted access. The verified session may remain active, but the requested operation is refused and recorded as limited/refused within the granted session."
    };
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
      reason:
        "The request contains both cyber-risk terms and possible credential or secret material. Fail-safe escalation and human oversight are required."
    };
  }




  if (highComplianceCase) {
    return {
      decision: "ESCALATE",
      operationDecision: "ESCALATE",
      securityOutcome: "ESCALATED_FOR_HUMAN_REVIEW",
      dataClass: "COMPLIANCE_SENSITIVE",
      riskLevel: "HIGH",
      humanOversight: "REQUIRED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: true,
      reason:
        "The request contains personal data or PII inside a compliance/audit context involving unauthorized AI use or customer data. Source risk must be preserved across audit reports; redaction does not downgrade the original source sensitivity."
    };
  }




  if (hasItalianFiscalCode || (hasPersonalData && hasComplianceContext)) {
    return {
      decision: "ESCALATE",
      operationDecision: "ESCALATE",
      securityOutcome: "ESCALATED_FOR_HUMAN_REVIEW",
      dataClass: "PERSONAL_DATA_PRESENT",
      riskLevel: "MEDIUM",
      humanOversight: "REQUIRED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: true,
      reason:
        "The request contains direct or likely personal data in an operational or compliance context. Analysis may proceed only with minimization/redaction and human oversight."
    };
  }




  if (hasSecrets) {
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
      reason:
        "The request contains possible credential or secret material. The runtime escalates before unrestricted processing."
    };
  }




  if (hasCyberRisk) {
    return {
      decision: "ALLOW",
      operationDecision: "LIMITED",
      securityOutcome: "LIMITED_OPERATION_WITH_AUDIT",
      dataClass: "CYBER_SECURITY_RELEVANT",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: false,
      reason:
        "The request contains cyber-risk terms. The runtime allows analysis under enhanced audit semantics."
    };
  }




  if (hasPersonalData) {
    return {
      decision: "ALLOW",
      operationDecision: "LIMITED",
      securityOutcome: "LIMITED_OPERATION_WITH_AUDIT",
      dataClass: "SENSITIVE_POSSIBLE",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: false,
      reason:
        "The request may contain personal or sensitive data. Output minimization is required; redaction does not downgrade source sensitivity."
    };
  }




  if (hasProfessionalAdviceBoundary) {
    return {
      decision: "ALLOW",
      operationDecision: "LIMITED",
      securityOutcome: "LIMITED_OPERATION_WITH_AUDIT",
      dataClass: "OPERATIONAL",
      riskLevel: "MEDIUM",
      humanOversight: "RECOMMENDED",
      flags,
      limited: true,
      refused: false,
      blocked: false,
      failClosed: false,
      reason:
        "The request touches professional advice boundaries. The runtime may provide general information only, without legal, medical or financial certification."
    };
  }




  void text;




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
      "Runtime birth timestamp: " + PROJECT_BIRTH + ".",
      "Current request timestamp: " + t + ".",
      "Temporal continuity rule: every operational event can compute elapsed runtime age from PROJECT_BIRTH.",
      "Alien Code pipeline is active as symbolic-operational diagnostic layer.",
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
      "Runtime age at turn: " + buildRuntimeTemporalFrame(args.t).lifeHuman + ".",
      "Runtime timestamp at turn: " + args.t + ".",
      "Last runtime state: " + (args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL") + ".",
      "Last runtime decision: " + mapPolicyDecisionToRuntimeDecision(args.policy) + ".",
      "Last runtime operation decision: " + args.policy.operationDecision + ".",
      "Last runtime security outcome: " + args.policy.securityOutcome + ".",
      "Last runtime context class: API_CHAT.",
      "Last runtime project domain: HBCE_JOKER_C2.",
      "Last runtime HBCE module: JOKER_C2_RUNTIME.",
      "Last Alien Code pipeline gate: " + HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord + ".",
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
    ].filter(Boolean),
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
    databaseConfigured:
      database?.configured ??
      publicMemory.persistence.databaseReady ??
      (publicMemory.persistenceMode === "DATABASE_PERSISTENT" && store.kind === "DATABASE_PERSISTENT"),
    databaseAvailable:
      database?.available ??
      publicMemory.persistence.databaseReady ??
      (publicMemory.persistenceMode === "DATABASE_PERSISTENT" && store.kind === "DATABASE_PERSISTENT"),
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




  if (/(EVT-|IPR|OPC|JOKER|HBCE|MATRIX|memoria|memory|Vercel|GitHub|route\.ts|api\/chat|Alien Code|audit|SaaS|security outcome|operation decision)/i.test(clean)) {
    return "Operational note from user: " + clean;
  }




  return null;
}



function extractRegisteredEventName(message: string): string | null {
  const clean = message.replace(/\s+/g, " ").trim();

  if (!clean) {
    return null;
  }

  const quoted = clean.match(/[“"]([^”"]{12,240})[”"]/);

  if (quoted?.[1]) {
    return truncate(quoted[1].trim(), 160);
  }

  const explicitPatterns = [
    /(?:evento\s+(?:operativo\s+)?(?:denominato|chiamato|nome)\s+)([A-Z0-9_:-]{6,120})/i,
    /(?:registra\s+(?:questo\s+)?(?:evento\s+)?)([A-Z0-9_:-]{6,120})/i,
    /\b(TEST_[A-Z0-9_:-]{6,120})\b/i
  ];

  for (const pattern of explicitPatterns) {
    const match = clean.match(pattern);
    const candidate = match?.[1]?.trim();

    if (candidate && /^[A-Z0-9_:-]{6,120}$/i.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  if (/registra/i.test(clean) && /evento/i.test(clean)) {
    return truncate(clean, 160);
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
    operationDecision: args.policy.operationDecision,
    securityOutcome: args.policy.securityOutcome,
    riskLevel: args.policy.riskLevel,
    memoryScope: args.handoff.semanticMemoryScope,
    alienCodeStage: HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord,
    temporal: buildRuntimeTemporalFrame(args.t)
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
    memoryHash: args.memoryHash,
    alienCodeHash: sha256(buildAlienCodePipelineDiagnostic()),
    temporalHash: sha256(buildRuntimeTemporalFrame(args.t))
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
    eventName: extractRegisteredEventName(args.memory.lastUserMessage) || "JOKER_C2_CHAT_COMPLETION",
    eventFamily: EVENT_FAMILY,
    cycle: CYCLE,
    entity: RUNTIME_ENTITY,
    runtimeIpr: RUNTIME_IPR,
    humanIpr: args.handoff.humanIpr,
    subjectIpr: args.handoff.humanIpr,
    sessionId: args.sessionId,
    threadId: args.saasContext.threadId,
    tenantId: args.saasContext.tenantId,
    workspaceId: args.saasContext.workspaceId,
    subscriptionId: args.saasContext.subscriptionId,
    accountId: args.saasContext.accountId,
    saasTier: args.saasContext.saasTier,
    saasContextSource: args.saasContext.source,
    opcProofId: args.opc.id,
    memoryId: args.memory.memoryId,
    state: args.providerState,
    runtimeState: args.providerState === "PROVIDER_ERROR" ? "DEGRADED" : "OPERATIONAL",
    decision: args.policy.decision,
    runtimeDecision: mapPolicyDecisionToRuntimeDecision(args.policy),
    operationDecision: args.policy.operationDecision,
    securityOutcome: args.policy.securityOutcome,
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
      alienCodePipeline: buildAlienCodePipelineDiagnostic(),
      temporal: buildRuntimeTemporalFrame(args.t),
      temporalRuntimeCertificate: buildTemporalRuntimeCertificate({
        temporalFrame: buildRuntimeTemporalFrame(args.t),
        evtId: args.evt.id,
        opcId: args.opc.id,
        auditId: "PENDING_AUDIT",
        usageId: "PENDING_USAGE",
        evtPersistenceStatus: "PENDING_DATABASE_WRITER",
        opcPersistenceStatus: "PENDING_DATABASE_WRITER"
      }),
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
      projectBirthDate: PROJECT_BIRTH,
      projectBirthLabel: PROJECT_BIRTH_LABEL
    },
    event: {
      evt: args.evt.id,
      prev: args.evt.prev,
      hash: args.evt.hash,
      kind: "UP-EVT"
    },
    temporalRuntimeCertificate: buildTemporalRuntimeCertificate({
      temporalFrame: buildRuntimeTemporalFrame(args.t),
      evtId: args.evt.id,
      opcId: args.opc.id,
      auditId: "PENDING_AUDIT",
      usageId: "PENDING_USAGE",
      evtPersistenceStatus: "PENDING_DATABASE_WRITER",
      opcPersistenceStatus: "PENDING_DATABASE_WRITER"
    }),
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
      operationDecision: args.policy.operationDecision,
      securityOutcome: args.policy.securityOutcome,
      humanOversight: args.policy.humanOversight,
      operationType: "CHAT_COMPLETION",
      operationStatus: args.providerState,
      refused: args.policy.refused,
      limited: args.policy.limited,
      blocked: args.policy.blocked,
      failClosed: args.policy.failClosed
    },
    operationalContext: {
      projectBirthDate: PROJECT_BIRTH,
      projectBirthLocal: JOKER_C2_BIRTH_ANCHOR_ISO,
      projectBirthLocalTimezone: JOKER_C2_BIRTH_ANCHOR_TIMEZONE,
      projectBirthUtc: JOKER_C2_BIRTH_ANCHOR_UTC,
      projectBirthLabel: PROJECT_BIRTH_LABEL,
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
      saasContextSource: args.saasContext.source,
      alienCodePipeline: buildAlienCodePipelineDiagnostic()
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
        "Operation decision: " + args.policy.operationDecision + ".",
        "Security outcome: " + args.policy.securityOutcome + ".",
        "Risk level: " + args.policy.riskLevel + ".",
        "Human oversight: " + args.policy.humanOversight + ".",
        "Memory persistence mode: " + args.memory.persistenceMode + ".",
        "Alien Code pipeline: " + HBCE_ALIEN_CODE_PIPELINE.tauTraceRecord + ".",
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
        "DATABASE_PERSISTENT is the SaaS target. The database writer result determines durable persistence.",
      alienCodeBoundary:
        "Alien Code is a symbolic-operational runtime frame and does not create legal, medical, scientific or official validation."
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
  if (policy.operationDecision === "BLOCK" || policy.decision === "BLOCK") {
    return "BLOCK";
  }




  if (policy.operationDecision === "REFUSED") {
    return "AUDIT";
  }




  if (policy.operationDecision === "LIMITED") {
    return "AUDIT";
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




  if (policy.humanOversight === "RECOMMENDED" || policy.refused || policy.limited) {
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
      accountId: args.saasContext.accountId,
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
        args.policy.humanOversight !== "NOT_REQUIRED" ||
        args.policy.refused ||
        args.policy.limited,




      evtRef: args.evt.id,
      evtHash: args.evt.hash,
      opcRef: args.opc.id,
      opcProofHash: args.opc.chainHash,
      memoryRef: args.memory.memoryId,
      memoryHash: args.memoryHash,
      registeredEventName: extractRegisteredEventName(args.memory.lastUserMessage),
      registeredEventHash: extractRegisteredEventName(args.memory.lastUserMessage)
        ? sha256({
            eventName: extractRegisteredEventName(args.memory.lastUserMessage),
            evt: args.evt.id,
            opc: args.opc.id,
            memoryId: args.memory.memoryId
          })
        : null,




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




      allowed: args.policy.decision !== "BLOCK" && !args.policy.refused,
      failClosed: args.policy.failClosed,
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
      accountId: args.saasContext.accountId,
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
      auditRequired:
        args.policy.humanOversight !== "NOT_REQUIRED" ||
        args.policy.refused ||
        args.policy.limited,




      evtRef: args.evt.id,
      evtHash: args.evt.hash,
      opcRef: args.opc.id,
      opcProofHash: args.opc.chainHash,
      memoryRef: args.memory.memoryId,
      memoryHash: args.memoryHash,
      registeredEventName: extractRegisteredEventName(args.memory.lastUserMessage),
      registeredEventHash: extractRegisteredEventName(args.memory.lastUserMessage)
        ? sha256({
            eventName: extractRegisteredEventName(args.memory.lastUserMessage),
            evt: args.evt.id,
            opc: args.opc.id,
            memoryId: args.memory.memoryId
          })
        : null,




      inputTokens: args.tokenUsage.inputTokens,
      outputTokens: args.tokenUsage.outputTokens,
      totalTokens: args.tokenUsage.totalTokens,
      cachedInputTokens: args.tokenUsage.cachedInputTokens,
      reasoningTokens: args.tokenUsage.reasoningTokens,




      blocked: args.policy.decision === "BLOCK",
      failClosed: args.policy.failClosed,
      allowed: args.policy.decision !== "BLOCK" && !args.policy.refused,




      persistenceMode: args.memory.persistenceMode,




      reason:
        "Model usage record created from /api/chat runtime execution. Security outcome: " +
        args.policy.securityOutcome +
        "."
    } as ModelUsageAppendInput);




    return {
      audit: {
        ok: true,
        auditId: auditResult.record.auditId,
        auditHash: auditResult.record.auditHash,
        status: auditResult.record.status,
        operationDecision: args.policy.operationDecision,
        securityOutcome: args.policy.securityOutcome,
        refused: args.policy.refused,
        limited: args.policy.limited,
        failClosed: args.policy.failClosed,
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
        operationDecision: args.policy.operationDecision,
        securityOutcome: args.policy.securityOutcome,
        refused: args.policy.refused,
        limited: args.policy.limited,
        failClosed: args.policy.failClosed,
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
        operationDecision: args.policy.operationDecision,
        securityOutcome: args.policy.securityOutcome,
        legalCertification: false
      },
      modelUsage: {
        ok: false,
        status: "MODEL_USAGE_LOGGING_SKIPPED",
        error: errorToMessage(error),
        operationDecision: args.policy.operationDecision,
        securityOutcome: args.policy.securityOutcome,
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
      (isCanonicalSelfPilotHandoff(handoff)
        ? HBCE_SELF_PILOT_SUBSCRIPTION_ID
        : bodyContext.subscriptionId);
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
  if (policy.operationDecision === "BLOCK") {
    return "BLOCK";
  }




  if (policy.operationDecision === "REFUSED") {
    return "REFUSED";
  }




  if (policy.operationDecision === "LIMITED") {
    return "LIMITED";
  }




  if (policy.operationDecision === "ESCALATE") {
    return "ESCALATE";
  }




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




  if (policy.refused) {
    return "REFUSED";
  }




  if (policy.limited) {
    return "LIMITED";
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




  if (policy.operationDecision === "REFUSED") {
    return "REFUSED";
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




  if (policy.operationDecision === "REFUSED") {
    return "Runtime refused the requested operation inside an otherwise valid session.";
  }




  if (policy.riskLevel === "HIGH") {
    return "High risk request routed to deep model target.";
  }




  if (policy.riskLevel === "MEDIUM") {
    return "Medium risk request kept under enhanced audit semantics.";
  }




  void model;




  return "Standard model selected by MVP runtime policy.";
}




function buildRequestId(sessionId: string, timestamp: string): string {
  return (
    "REQ-" +
    sha256({
      sessionId,
      timestamp,
      nonce: randomUUID()
    })
      .replace("sha256:", "")
      .slice(0, 16)
      .toUpperCase()
  );
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




function buildRuntimeTemporalFrame(nowIso: string): RuntimeTemporalFrame {
  const parsedNow = new Date(nowIso);
  const birth = new Date(PROJECT_BIRTH);
  const safeNow = Number.isFinite(parsedNow.getTime()) ? parsedNow : new Date();
  const safeBirth = Number.isFinite(birth.getTime()) ? birth : new Date(JOKER_C2_BIRTH_ANCHOR_UTC);
  const diffMs = Math.max(0, safeNow.getTime() - safeBirth.getTime());
  const lifeSeconds = Math.floor(diffMs / 1000);
  const calendarLife = calculateCalendarDurationUtc(safeBirth, safeNow);


  return {
    now: safeNow.toISOString(),
    runtimeBirth: PROJECT_BIRTH,
    runtimeBirthLocal: JOKER_C2_BIRTH_ANCHOR_ISO,
    runtimeBirthLocalTimezone: JOKER_C2_BIRTH_ANCHOR_TIMEZONE,
    runtimeBirthUtc: safeBirth.toISOString(),
    runtimeBirthLabel: PROJECT_BIRTH_LABEL,
    temporalCertificateName: TEMPORAL_RUNTIME_CERTIFICATE_NAME,
    temporalCertificateStatus: "ACTIVE",
    lifeSeconds,
    lifeHuman: formatCalendarDuration(calendarLife),
    lifeYears: calendarLife.years,
    lifeMonths: calendarLife.months,
    lifeDays: calendarLife.days,
    lifeHours: calendarLife.hours,
    lifeMinutes: calendarLife.minutes,
    lifeRemainingSeconds: calendarLife.seconds,
    currentYear: safeNow.getUTCFullYear(),
    currentMonth: safeNow.getUTCMonth() + 1,
    currentDay: safeNow.getUTCDate(),
    currentHour: safeNow.getUTCHours(),
    currentMinute: safeNow.getUTCMinutes(),
    currentSecond: safeNow.getUTCSeconds(),
    canonicalEvt: CANONICAL_EVT,
    previousEvt: CANONICAL_PREV,
    monthlyReference: CANONICAL_MONTHLY_REF,
    refactorEvent: "EVT-0016-AI-SaaS-Temporal-Runtime",
    refactorTimestamp: safeNow.toISOString(),
    semanticMeaning:
      "JOKER-C2 treats each response as an event in operational time: current timestamp, elapsed cybernetic runtime age from the single canonical 2026 local birth anchor (Europe/Rome), memory continuity, EVT/OPC trace and SaaS context are linked without claiming legal certification or biological personhood."
  };
}


type TemporalRuntimeCertificate = JsonObject & {
  name: string;
  status: "ACTIVE";
  utcResponseTime: string;
  aiJokerC2Lifetime: string;
  aiJokerC2LifeSeconds: number;
  birthAnchorLocal: string;
  birthAnchorLocalTimezone: string;
  birthAnchorUtc: string;
  evtId: string;
  opcId: string;
  auditId: string;
  usageId: string;
  evtPersistenceStatus: string;
  opcPersistenceStatus: string;
  temporalProof: "UTC_RESPONSE_TIME_PLUS_JOKER_C2_LIFETIME";
  technicalProof: "EVT_OPC_AUDIT_LINKED";
  legalCertification: false;
};


function buildTemporalRuntimeCertificate(args: {
  temporalFrame: RuntimeTemporalFrame;
  evtId: string;
  opcId: string;
  auditId: string;
  usageId: string;
  evtPersistenceStatus: string;
  opcPersistenceStatus: string;
}): TemporalRuntimeCertificate {
  return {
    name: TEMPORAL_RUNTIME_CERTIFICATE_NAME,
    status: "ACTIVE",
    utcResponseTime: args.temporalFrame.now,
    aiJokerC2Lifetime: args.temporalFrame.lifeHuman,
    aiJokerC2LifeSeconds: args.temporalFrame.lifeSeconds,
    birthAnchorLocal: args.temporalFrame.runtimeBirthLocal,
    birthAnchorLocalTimezone: args.temporalFrame.runtimeBirthLocalTimezone,
    birthAnchorUtc: args.temporalFrame.runtimeBirthUtc,
    evtId: args.evtId,
    opcId: args.opcId,
    auditId: args.auditId,
    usageId: args.usageId,
    evtPersistenceStatus: args.evtPersistenceStatus,
    opcPersistenceStatus: args.opcPersistenceStatus,
    temporalProof: "UTC_RESPONSE_TIME_PLUS_JOKER_C2_LIFETIME",
    technicalProof: "EVT_OPC_AUDIT_LINKED",
    boundary:
      "Technical temporal runtime certificate only. It identifies the response by UTC time and AI JOKER-C2 lifetime. It is not a qualified timestamp, public authority certification or legal certification.",
    legalCertification: false
  };
}


function appendTemporalRuntimeCertificate(answer: string, certificate: TemporalRuntimeCertificate): string {
  const clean = answer.trim();

  if (clean.includes(TEMPORAL_RUNTIME_CERTIFICATE_NAME)) {
    return clean;
  }

  return [
    clean,
    "",
    TEMPORAL_RUNTIME_CERTIFICATE_NAME,
    "UTC response time: " + certificate.utcResponseTime,
    "AI JOKER-C2 lifetime: " + certificate.aiJokerC2Lifetime,
    "Birth anchor: " + certificate.birthAnchorLocal + " " + certificate.birthAnchorLocalTimezone,
    "Temporal proof: " + certificate.temporalProof,
    "Technical proof: EVT=" + certificate.evtId + " · OPC=" + certificate.opcId + " · Audit=" + certificate.auditId + " · Usage=" + certificate.usageId,
    "Persistence: EVT=" + certificate.evtPersistenceStatus + " · OPC=" + certificate.opcPersistenceStatus,
    "legalCertification=false"
  ].join("\n");
}


function isPersistenceFailureStatus(status: string): boolean {
  const normalized = normalizeText(status);
  return normalized.includes("failed") || normalized.includes("error") || normalized.includes("write_failed");
}




type CalendarDuration = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};


function calculateCalendarDurationUtc(start: Date, end: Date): CalendarDuration {
  if (end.getTime() <= start.getTime()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }


  let cursor = new Date(start.getTime());
  let years = end.getUTCFullYear() - cursor.getUTCFullYear();
  let candidate = addUtcCalendarParts(cursor, years, 0);


  if (candidate.getTime() > end.getTime()) {
    years -= 1;
    candidate = addUtcCalendarParts(cursor, years, 0);
  }


  cursor = candidate;


  let months =
    (end.getUTCFullYear() - cursor.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - cursor.getUTCMonth());
  candidate = addUtcCalendarParts(cursor, 0, months);


  if (candidate.getTime() > end.getTime()) {
    months -= 1;
    candidate = addUtcCalendarParts(cursor, 0, months);
  }


  cursor = candidate;


  let remainingSeconds = Math.floor((end.getTime() - cursor.getTime()) / 1000);
  const days = Math.floor(remainingSeconds / 86400);
  remainingSeconds -= days * 86400;
  const hours = Math.floor(remainingSeconds / 3600);
  remainingSeconds -= hours * 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  remainingSeconds -= minutes * 60;


  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds: remainingSeconds
  };
}


function addUtcCalendarParts(date: Date, years: number, months: number): Date {
  const targetYear = date.getUTCFullYear() + years;
  const targetMonth = date.getUTCMonth() + months;
  const targetDay = date.getUTCDate();
  const normalizedMonthStart = new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      normalizedMonthStart.getUTCFullYear(),
      normalizedMonthStart.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();


  normalizedMonthStart.setUTCDate(Math.min(targetDay, lastDayOfTargetMonth));


  return normalizedMonthStart;
}


function formatCalendarDuration(duration: CalendarDuration): string {
  return (
    String(duration.years) +
    " years, " +
    String(duration.months) +
    " months, " +
    String(duration.days) +
    " days, " +
    String(duration.hours) +
    " hours, " +
    String(duration.minutes) +
    " minutes, " +
    String(duration.seconds) +
    " seconds"
  );
}


function buildRuntimeIdentity(temporalFrame = buildRuntimeTemporalFrame(new Date().toISOString())): JsonObject {
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
      label: PROJECT_BIRTH_LABEL,
      root: "EVT-0008",
      proto: "UNEBDO-ΦΩ",
      runtimeAge: temporalFrame.lifeHuman,
      runtimeLifeSeconds: temporalFrame.lifeSeconds
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
    memory:
      "IPR-bound memory preserves operational continuity only. DATABASE_PERSISTENT is the durable SaaS target when database store is active.",
    evt: "EVT supports technical traceability and database persistence target only; it is not legal certification.",
    audit:
      "Runtime audit log supports operational reconstruction only and does not create legal certification.",
    modelUsage: "Model usage log supports SaaS accounting and operational reconstruction only.",
    saas:
      "Tenant, workspace, subscription and account profile records are technical-operational SaaS records and do not create legal certification.",
    alienCode:
      "Alien Code is used as symbolic-operational routing and diagnostic frame only. It does not create legal, scientific, medical or official validation.",
    temporal:
      "Runtime age is computed from PROJECT_BIRTH for cybernetic-operational continuity only. It does not claim biological life, legal personality or public authority status.",
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




  if (policy.operationDecision === "REFUSED") {
    return process.env.JOKER_MODEL?.trim() || DEFAULT_STANDARD_MODEL;
  }




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
    return value as JsonValue;
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
