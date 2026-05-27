/**
 * HBCE / JOKER-C2 Model Usage Log
 *
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 *
 * Project: Project HBCE R&D Transfer SaaS
 * Release target: SaaS Core v0.1
 * Source event: UP-EVT-0016 / UP-EVT-0016-AI
 * Source event date: 2026-05-25T15:30:00+02:00
 * Target checkpoint: 2026-06-19T15:30:00+02:00
 *
 * This file records model usage for JOKER-C2 SaaS Core v0.1.
 * It links model selection, SaaS tier, risk, C2 boundary, token usage,
 * EVT references, OPC references and audit records.
 *
 * Boundary:
 * Model usage logs support SaaS accounting and operational reconstruction.
 * They do not create legal certification.
 */

import { createHash, randomUUID } from "node:crypto";

import {
  HBCE_CORE,
  HBCE_ORGANIZATION,
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_SOURCE_EVENT,
  HBCE_SAAS_SOURCE_EVENT_AI,
  HBCE_SAAS_TARGET_CHECKPOINT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  RUNTIME_ENTITY,
  RUNTIME_IPR,
  type C2BoundaryState,
  type CyberRelevance,
  type ModelLevel,
  type OperationalValueLevel,
  type ProofRequirement,
  type RuntimeAuditState,
  type RuntimeDecision,
  type RuntimeModelRoutingResult,
  type RuntimePersistenceMode,
  type RuntimeRiskLevel,
  type SaasTier,
  type SaasTierPolicyResult
} from "./saas-tier-types";

import type { RuntimeAuditLogRecord } from "./runtime-audit-log";
import type { RuntimeRiskPolicyResult } from "./runtime-risk-policy";
import type { C2DefensePolicyResult } from "./c2-defense-policy";

export type ModelUsageLogSource =
  | "API_CHAT"
  | "API_HEALTH"
  | "INTERFACE"
  | "SELF_PILOT"
  | "DEMO_SCRIPT"
  | "SYSTEM";

export type ModelUsageProvider = "OPENAI" | "LOCAL" | "MOCK" | "UNKNOWN";

export type ModelUsageAccountingMode =
  | "TOKENS_REPORTED"
  | "TOKENS_ESTIMATED"
  | "USAGE_NOT_AVAILABLE"
  | "BLOCKED_NO_USAGE";

export type ModelUsageRecordStatus =
  | "RECORDED"
  | "BLOCKED_RECORDED"
  | "FAIL_CLOSED_RECORDED"
  | "MVP_MEMORY_ONLY"
  | "PERSISTED";

export type ModelUsageLogPersistenceBoundary =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT"
  | "FAIL_CLOSED_PERSISTENCE";

export type ModelUsageTokenInput = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cachedInputTokens?: number | null;
  reasoningTokens?: number | null;
};

export type ModelUsageLogInput = {
  source?: ModelUsageLogSource;
  provider?: ModelUsageProvider;

  usageId?: string;
  timestamp?: string;
  sessionId?: string;
  requestId?: string;
  auditId?: string | null;

  runtimeEntity?: string;
  runtimeIpr?: string;
  humanIpr?: string;
  organizationIpr?: string;
  workspaceId?: string;

  saasTier?: SaasTier;
  selectedModel?: string;
  modelLevel?: ModelLevel;
  modelRoutingReason?: string;

  riskLevel?: RuntimeRiskLevel;
  runtimeDecision?: RuntimeDecision;
  auditState?: RuntimeAuditState;

  operationalValue?: OperationalValueLevel;
  cyberRelevance?: CyberRelevance;
  c2Boundary?: C2BoundaryState;
  proofRequirement?: ProofRequirement;

  evtRequired?: boolean;
  opcRequired?: boolean;
  auditRequired?: boolean;

  evtRef?: string | null;
  evtHash?: string | null;
  opcRef?: string | null;
  opcProofHash?: string | null;

  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cachedInputTokens?: number | null;
  reasoningTokens?: number | null;

  estimatedCostUnits?: number | null;
  valueWeight?: number | null;

  blocked?: boolean;
  failClosed?: boolean;
  allowed?: boolean;

  persistenceMode?: RuntimePersistenceMode;
  persistenceBoundary?: ModelUsageLogPersistenceBoundary;

  reason?: string;
  boundary?: string;
};

export type ModelUsageLogRecord = {
  usageId: string;
  timestamp: string;
  source: ModelUsageLogSource;
  provider: ModelUsageProvider;

  project: typeof HBCE_SAAS_PROJECT;
  targetRelease: typeof HBCE_SAAS_TARGET_RELEASE;
  sourceEvent: typeof HBCE_SAAS_SOURCE_EVENT;
  sourceEventAi: typeof HBCE_SAAS_SOURCE_EVENT_AI;
  targetCheckpoint: typeof HBCE_SAAS_TARGET_CHECKPOINT;
  organization: typeof HBCE_ORGANIZATION;
  core: typeof HBCE_CORE;

  sessionId: string;
  requestId: string;
  auditId: string | null;

  runtimeEntity: string;
  runtimeIpr: string;
  humanIpr: string;
  organizationIpr: string;
  workspaceId: string;

  saasTier: SaasTier;
  selectedModel: string;
  modelLevel: ModelLevel;
  modelRoutingReason: string;

  riskLevel: RuntimeRiskLevel;
  runtimeDecision: RuntimeDecision;
  auditState: RuntimeAuditState;

  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  proofRequirement: ProofRequirement;

  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;

  evtRef: string | null;
  evtHash: string | null;
  opcRef: string | null;
  opcProofHash: string | null;

  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cachedInputTokens: number | null;
  reasoningTokens: number | null;

  accountingMode: ModelUsageAccountingMode;
  estimatedCostUnits: number;
  valueWeight: number;

  blocked: boolean;
  failClosed: boolean;
  allowed: boolean;

  persistenceMode: RuntimePersistenceMode;
  persistenceBoundary: ModelUsageLogPersistenceBoundary;

  status: ModelUsageRecordStatus;
  reason: string;
  boundary: string;

  legalCertification: false;
  usageHash: string;
};

export type ModelUsageLogListOptions = {
  limit?: number;
  sessionId?: string;
  humanIpr?: string;
  saasTier?: SaasTier;
  selectedModel?: string;
  modelLevel?: ModelLevel;
  c2Only?: boolean;
  includeBlocked?: boolean;
};

export type ModelUsageLogSummary = {
  totalRecords: number;
  visibleRecords: number;
  totalEstimatedCostUnits: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  byTier: Record<string, number>;
  byModelLevel: Record<string, number>;
  byModel: Record<string, number>;
  blockedRecords: number;
  failClosedRecords: number;
  legalCertification: false;
  boundary: string;
};

export type ModelUsageLogHealth = {
  configured: true;
  project: string;
  targetRelease: string;
  sourceEvent: string;
  sourceEventAi: string;
  targetCheckpoint: string;
  mode: ModelUsageLogPersistenceBoundary;
  recordsInProcessMemory: number;
  maxProcessMemoryRecords: number;
  legalCertification: false;
  boundary: string;
};

const MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS = 500;

const modelUsageProcessMemory: ModelUsageLogRecord[] = [];

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeUsageString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed || fallback;
}

export function normalizeNullableUsageString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

export function normalizeUsageNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value < 0) {
    return null;
  }

  return Math.round(value);
}

export function stableUsageStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableUsageStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableUsageStringify(record[key])}`)
    .join(",")}}`;
}

export function sha256Usage(value: unknown): string {
  return createHash("sha256").update(stableUsageStringify(value)).digest("hex");
}

export function buildModelUsageId(timestamp: string = nowIso()): string {
  const compactTimestamp = timestamp.replace(/\D/g, "").slice(0, 14);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `USAGE-${compactTimestamp}-${suffix}`;
}

export function deriveModelUsageAccountingMode(input: {
  blocked: boolean;
  failClosed: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}): ModelUsageAccountingMode {
  if (input.blocked || input.failClosed) {
    return "BLOCKED_NO_USAGE";
  }

  if (
    input.inputTokens !== null ||
    input.outputTokens !== null ||
    input.totalTokens !== null
  ) {
    return "TOKENS_REPORTED";
  }

  return "USAGE_NOT_AVAILABLE";
}

export function deriveUsagePersistenceBoundary(
  persistenceMode: RuntimePersistenceMode
): ModelUsageLogPersistenceBoundary {
  if (persistenceMode === "DATABASE_PERSISTENT") {
    return "DATABASE_PERSISTENT";
  }

  if (persistenceMode === "FAIL_CLOSED_PERSISTENCE") {
    return "FAIL_CLOSED_PERSISTENCE";
  }

  return "PROCESS_MEMORY_MVP";
}

export function deriveModelUsageRecordStatus(input: {
  blocked: boolean;
  failClosed: boolean;
  persistenceMode: RuntimePersistenceMode;
}): ModelUsageRecordStatus {
  if (input.blocked) {
    return "BLOCKED_RECORDED";
  }

  if (input.failClosed) {
    return "FAIL_CLOSED_RECORDED";
  }

  if (input.persistenceMode === "DATABASE_PERSISTENT") {
    return "PERSISTED";
  }

  return "MVP_MEMORY_ONLY";
}

function getTierWeight(saasTier: SaasTier): number {
  if (saasTier === "IPR") return 1.5;
  if (saasTier === "PRO") return 2;
  if (saasTier === "GOVERNANCE") return 3;
  if (saasTier === "C2_DEFENSE") return 5;
  if (saasTier === "STRATEGIC") return 6;

  return 1;
}

function getModelWeight(modelLevel: ModelLevel): number {
  if (modelLevel === "ENHANCED") return 1.5;
  if (modelLevel === "ADVANCED") return 2.5;
  if (modelLevel === "C2_ESCALATED") return 4;
  if (modelLevel === "BLOCKED") return 0;

  return 1;
}

function getRiskWeight(riskLevel: RuntimeRiskLevel): number {
  if (riskLevel === "MEDIUM") return 1.25;
  if (riskLevel === "HIGH") return 1.75;
  if (riskLevel === "CRITICAL") return 2.5;
  if (riskLevel === "BLOCKED") return 0;

  return 1;
}

function getOperationalWeight(operationalValue: OperationalValueLevel): number {
  if (operationalValue === "MEDIUM") return 1.25;
  if (operationalValue === "HIGH") return 1.75;
  if (operationalValue === "CRITICAL") return 2.5;

  return 1;
}

export function deriveModelValueWeight(input: {
  saasTier: SaasTier;
  modelLevel: ModelLevel;
  riskLevel: RuntimeRiskLevel;
  operationalValue: OperationalValueLevel;
  opcRequired: boolean;
  auditRequired: boolean;
}): number {
  const proofWeight = input.opcRequired ? 1.35 : 1;
  const auditWeight = input.auditRequired ? 1.2 : 1;

  return Number(
    (
      getTierWeight(input.saasTier) *
      getModelWeight(input.modelLevel) *
      getRiskWeight(input.riskLevel) *
      getOperationalWeight(input.operationalValue) *
      proofWeight *
      auditWeight
    ).toFixed(4)
  );
}

export function deriveEstimatedCostUnits(input: {
  totalTokens: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  valueWeight: number;
  blocked: boolean;
  failClosed: boolean;
}): number {
  if (input.blocked || input.failClosed) {
    return 0;
  }

  const tokenBasis =
    input.totalTokens ??
    ((input.inputTokens ?? 0) + (input.outputTokens ?? 0));

  if (!tokenBasis || tokenBasis <= 0) {
    return Number(input.valueWeight.toFixed(4));
  }

  return Number(((tokenBasis / 1000) * input.valueWeight).toFixed(4));
}

export function buildModelUsageBoundary(input: {
  persistenceBoundary: ModelUsageLogPersistenceBoundary;
  c2Boundary: C2BoundaryState;
}): string {
  const persistence =
    input.persistenceBoundary === "DATABASE_PERSISTENT"
      ? "Model usage persistence is database-backed."
      : input.persistenceBoundary === "FAIL_CLOSED_PERSISTENCE"
        ? "Model usage persistence is required but unavailable. Runtime must fail closed where required."
        : "Model usage is currently stored in process memory MVP and may be lost across serverless cold starts or deployments.";

  return `${persistence} Model usage supports SaaS accounting and operational reconstruction. ${RUNTIME_BOUNDARY_SUMMARY.opc}. ${RUNTIME_BOUNDARY_SUMMARY.evt}. C2 boundary: ${input.c2Boundary}. legalCertification = false.`;
}

export function buildModelUsageHashPayload(
  record: Omit<ModelUsageLogRecord, "usageHash">
): Record<string, unknown> {
  return {
    usageId: record.usageId,
    timestamp: record.timestamp,
    source: record.source,
    provider: record.provider,
    project: record.project,
    targetRelease: record.targetRelease,
    sessionId: record.sessionId,
    requestId: record.requestId,
    auditId: record.auditId,
    runtimeEntity: record.runtimeEntity,
    runtimeIpr: record.runtimeIpr,
    humanIpr: record.humanIpr,
    organizationIpr: record.organizationIpr,
    workspaceId: record.workspaceId,
    saasTier: record.saasTier,
    selectedModel: record.selectedModel,
    modelLevel: record.modelLevel,
    riskLevel: record.riskLevel,
    runtimeDecision: record.runtimeDecision,
    auditState: record.auditState,
    operationalValue: record.operationalValue,
    cyberRelevance: record.cyberRelevance,
    c2Boundary: record.c2Boundary,
    proofRequirement: record.proofRequirement,
    evtRequired: record.evtRequired,
    opcRequired: record.opcRequired,
    auditRequired: record.auditRequired,
    evtRef: record.evtRef,
    evtHash: record.evtHash,
    opcRef: record.opcRef,
    opcProofHash: record.opcProofHash,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    totalTokens: record.totalTokens,
    cachedInputTokens: record.cachedInputTokens,
    reasoningTokens: record.reasoningTokens,
    accountingMode: record.accountingMode,
    estimatedCostUnits: record.estimatedCostUnits,
    valueWeight: record.valueWeight,
    blocked: record.blocked,
    failClosed: record.failClosed,
    allowed: record.allowed,
    status: record.status,
    legalCertification: record.legalCertification
  };
}

export function buildModelUsageHash(
  record: Omit<ModelUsageLogRecord, "usageHash">
): string {
  return sha256Usage(buildModelUsageHashPayload(record));
}

export function createModelUsageLogRecord(
  input: ModelUsageLogInput = {}
): ModelUsageLogRecord {
  const timestamp = input.timestamp ?? nowIso();
  const usageId = normalizeUsageString(input.usageId, buildModelUsageId(timestamp));

  const persistenceMode = input.persistenceMode ?? "PROCESS_MEMORY_MVP";
  const persistenceBoundary =
    input.persistenceBoundary ?? deriveUsagePersistenceBoundary(persistenceMode);

  const inputTokens = normalizeUsageNumber(input.inputTokens);
  const outputTokens = normalizeUsageNumber(input.outputTokens);
  const explicitTotalTokens = normalizeUsageNumber(input.totalTokens);
  const cachedInputTokens = normalizeUsageNumber(input.cachedInputTokens);
  const reasoningTokens = normalizeUsageNumber(input.reasoningTokens);

  const totalTokens =
    explicitTotalTokens ??
    (inputTokens !== null || outputTokens !== null
      ? (inputTokens ?? 0) + (outputTokens ?? 0)
      : null);

  const blocked = input.blocked ?? (input.modelLevel === "BLOCKED");
  const failClosed = input.failClosed ?? (input.runtimeDecision === "FAIL_CLOSED");
  const allowed = input.allowed ?? (!blocked && !failClosed);

  const saasTier = input.saasTier ?? "BASE";
  const modelLevel = input.modelLevel ?? "STANDARD";
  const riskLevel = input.riskLevel ?? "LOW";
  const operationalValue = input.operationalValue ?? "LOW";
  const opcRequired = input.opcRequired ?? false;
  const auditRequired = input.auditRequired ?? false;
  const c2Boundary = input.c2Boundary ?? "C2_NOT_AVAILABLE";

  const valueWeight =
    typeof input.valueWeight === "number" && Number.isFinite(input.valueWeight)
      ? Number(Math.max(0, input.valueWeight).toFixed(4))
      : deriveModelValueWeight({
          saasTier,
          modelLevel,
          riskLevel,
          operationalValue,
          opcRequired,
          auditRequired
        });

  const estimatedCostUnits =
    typeof input.estimatedCostUnits === "number" &&
    Number.isFinite(input.estimatedCostUnits)
      ? Number(Math.max(0, input.estimatedCostUnits).toFixed(4))
      : deriveEstimatedCostUnits({
          totalTokens,
          inputTokens,
          outputTokens,
          valueWeight,
          blocked,
          failClosed
        });

  const accountingMode = deriveModelUsageAccountingMode({
    blocked,
    failClosed,
    inputTokens,
    outputTokens,
    totalTokens
  });

  const baseRecord: Omit<ModelUsageLogRecord, "usageHash"> = {
    usageId,
    timestamp,
    source: input.source ?? "SYSTEM",
    provider: input.provider ?? "OPENAI",

    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    sourceEvent: HBCE_SAAS_SOURCE_EVENT,
    sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
    targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
    organization: HBCE_ORGANIZATION,
    core: HBCE_CORE,

    sessionId: normalizeUsageString(input.sessionId, "NO_SESSION"),
    requestId: normalizeUsageString(input.requestId, randomUUID()),
    auditId: normalizeNullableUsageString(input.auditId),

    runtimeEntity: normalizeUsageString(input.runtimeEntity, RUNTIME_ENTITY),
    runtimeIpr: normalizeUsageString(input.runtimeIpr, RUNTIME_IPR),
    humanIpr: normalizeUsageString(input.humanIpr, "NOT_VERIFIED"),
    organizationIpr: normalizeUsageString(input.organizationIpr, "NO_ORGANIZATION_IPR"),
    workspaceId: normalizeUsageString(input.workspaceId, "NO_WORKSPACE"),

    saasTier,
    selectedModel: normalizeUsageString(input.selectedModel, "NOT_SELECTED"),
    modelLevel,
    modelRoutingReason: normalizeUsageString(
      input.modelRoutingReason,
      "No model routing reason provided."
    ),

    riskLevel,
    runtimeDecision: input.runtimeDecision ?? "ALLOW",
    auditState: input.auditState ?? "NOT_REQUIRED",

    operationalValue,
    cyberRelevance: input.cyberRelevance ?? "NONE",
    c2Boundary,
    proofRequirement: input.proofRequirement ?? "NONE",

    evtRequired: input.evtRequired ?? false,
    opcRequired,
    auditRequired,

    evtRef: normalizeNullableUsageString(input.evtRef),
    evtHash: normalizeNullableUsageString(input.evtHash),
    opcRef: normalizeNullableUsageString(input.opcRef),
    opcProofHash: normalizeNullableUsageString(input.opcProofHash),

    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens,
    reasoningTokens,

    accountingMode,
    estimatedCostUnits,
    valueWeight,

    blocked,
    failClosed,
    allowed,

    persistenceMode,
    persistenceBoundary,

    status: deriveModelUsageRecordStatus({
      blocked,
      failClosed,
      persistenceMode
    }),

    reason: normalizeUsageString(input.reason, "Model usage record created."),
    boundary:
      input.boundary ??
      buildModelUsageBoundary({
        persistenceBoundary,
        c2Boundary
      }),

    legalCertification: false
  };

  return {
    ...baseRecord,
    usageHash: buildModelUsageHash(baseRecord)
  };
}

export function appendModelUsageLogRecord(
  input: ModelUsageLogInput = {}
): ModelUsageLogRecord {
  const record = createModelUsageLogRecord(input);

  modelUsageProcessMemory.unshift(record);

  if (modelUsageProcessMemory.length > MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS) {
    modelUsageProcessMemory.length = MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS;
  }

  return record;
}

export function appendModelUsageLogRecordFromRuntime(input: {
  source?: ModelUsageLogSource;
  provider?: ModelUsageProvider;
  sessionId?: string;
  requestId?: string;
  humanIpr?: string;
  organizationIpr?: string;
  workspaceId?: string;

  saasPolicy?: SaasTierPolicyResult;
  riskPolicy?: RuntimeRiskPolicyResult;
  modelRouting?: RuntimeModelRoutingResult;
  c2Policy?: C2DefensePolicyResult;
  auditRecord?: RuntimeAuditLogRecord | null;

  evtRef?: string | null;
  evtHash?: string | null;
  opcRef?: string | null;
  opcProofHash?: string | null;

  usage?: ModelUsageTokenInput | null;
}): ModelUsageLogRecord {
  const saasPolicy = input.saasPolicy;
  const riskPolicy = input.riskPolicy;
  const modelRouting = input.modelRouting;
  const c2Policy = input.c2Policy;
  const auditRecord = input.auditRecord ?? null;

  return appendModelUsageLogRecord({
    source: input.source ?? "API_CHAT",
    provider: input.provider ?? "OPENAI",

    sessionId: input.sessionId,
    requestId: input.requestId,
    auditId: auditRecord?.auditId ?? null,

    humanIpr: input.humanIpr,
    organizationIpr: input.organizationIpr,
    workspaceId: input.workspaceId,

    saasTier: saasPolicy?.tier ?? modelRouting?.tier ?? auditRecord?.saasTier ?? "BASE",
    selectedModel:
      modelRouting?.selectedModel ??
      auditRecord?.selectedModel ??
      "NOT_SELECTED",
    modelLevel:
      modelRouting?.modelLevel ??
      auditRecord?.modelLevel ??
      saasPolicy?.modelLevel ??
      "STANDARD",
    modelRoutingReason:
      modelRouting?.routingReason ??
      auditRecord?.modelRoutingReason ??
      "No model routing record provided.",

    riskLevel:
      riskPolicy?.riskLevel ??
      saasPolicy?.riskLevel ??
      modelRouting?.riskLevel ??
      auditRecord?.riskLevel ??
      "LOW",
    runtimeDecision:
      riskPolicy?.decision ??
      saasPolicy?.decision ??
      auditRecord?.runtimeDecision ??
      "ALLOW",
    auditState:
      riskPolicy?.auditState ??
      saasPolicy?.auditState ??
      auditRecord?.auditState ??
      "NOT_REQUIRED",

    operationalValue:
      riskPolicy?.operationalValue ??
      (riskPolicy?.riskLevel === "CRITICAL"
        ? "CRITICAL"
        : riskPolicy?.riskLevel === "HIGH"
          ? "HIGH"
          : riskPolicy?.riskLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW"),
    cyberRelevance:
      c2Policy?.cyberRelevance ??
      riskPolicy?.cyberRelevance ??
      saasPolicy?.cyberRelevance ??
      modelRouting?.cyberRelevance ??
      auditRecord?.cyberRelevance ??
      "NONE",
    c2Boundary:
      c2Policy?.cyberBoundary ??
      riskPolicy?.c2Boundary ??
      saasPolicy?.cyberBoundary ??
      modelRouting?.c2Boundary ??
      auditRecord?.c2Boundary ??
      "C2_NOT_AVAILABLE",
    proofRequirement: riskPolicy?.proofRequirement ?? "NONE",

    evtRequired:
      Boolean(saasPolicy?.evtRequired) ||
      Boolean(riskPolicy?.evtRequired) ||
      Boolean(modelRouting?.evtRequired) ||
      Boolean(c2Policy?.evtRequired) ||
      Boolean(auditRecord?.evtRequired),
    opcRequired:
      Boolean(saasPolicy?.opcRequired) ||
      Boolean(riskPolicy?.opcRequired) ||
      Boolean(modelRouting?.opcRequired) ||
      Boolean(c2Policy?.opcRequired) ||
      Boolean(auditRecord?.opcRequired),
    auditRequired:
      Boolean(saasPolicy?.auditRequired) ||
      Boolean(riskPolicy?.auditRequired) ||
      Boolean(modelRouting?.auditRequired) ||
      Boolean(c2Policy?.auditRequired) ||
      Boolean(auditRecord?.auditRequired),

    evtRef: input.evtRef ?? auditRecord?.evtRef ?? null,
    evtHash: input.evtHash ?? auditRecord?.evtHash ?? null,
    opcRef: input.opcRef ?? auditRecord?.opcRef ?? null,
    opcProofHash: input.opcProofHash ?? auditRecord?.opcProofHash ?? null,

    inputTokens: input.usage?.inputTokens ?? null,
    outputTokens: input.usage?.outputTokens ?? null,
    totalTokens: input.usage?.totalTokens ?? null,
    cachedInputTokens: input.usage?.cachedInputTokens ?? null,
    reasoningTokens: input.usage?.reasoningTokens ?? null,

    blocked:
      Boolean(modelRouting?.blocked) ||
      riskPolicy?.decision === "BLOCK" ||
      c2Policy?.decision === "BLOCK" ||
      auditRecord?.blocked === true,
    failClosed:
      Boolean(riskPolicy?.failClosed) ||
      Boolean(c2Policy?.failClosed) ||
      saasPolicy?.decision === "FAIL_CLOSED" ||
      auditRecord?.failClosed === true,
    allowed:
      Boolean(saasPolicy?.allowed ?? true) &&
      Boolean(riskPolicy?.allowed ?? true) &&
      Boolean(!modelRouting?.blocked) &&
      Boolean(c2Policy?.allowed ?? true) &&
      Boolean(auditRecord?.allowed ?? true),

    persistenceMode: saasPolicy?.persistenceMode ?? auditRecord?.persistenceMode ?? "PROCESS_MEMORY_MVP",

    reason:
      modelRouting?.routingReason ??
      c2Policy?.reason ??
      riskPolicy?.reason ??
      saasPolicy?.reason ??
      auditRecord?.reason ??
      "Model usage record created from runtime outputs."
  });
}

export function listModelUsageLogRecords(
  options: ModelUsageLogListOptions = {}
): ModelUsageLogRecord[] {
  const limit = Math.max(
    1,
    Math.min(options.limit ?? 50, MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS)
  );

  let records = [...modelUsageProcessMemory];

  if (options.sessionId) {
    records = records.filter((record) => record.sessionId === options.sessionId);
  }

  if (options.humanIpr) {
    records = records.filter((record) => record.humanIpr === options.humanIpr);
  }

  if (options.saasTier) {
    records = records.filter((record) => record.saasTier === options.saasTier);
  }

  if (options.selectedModel) {
    records = records.filter((record) => record.selectedModel === options.selectedModel);
  }

  if (options.modelLevel) {
    records = records.filter((record) => record.modelLevel === options.modelLevel);
  }

  if (options.c2Only) {
    records = records.filter(
      (record) =>
        record.saasTier === "C2_DEFENSE" ||
        record.modelLevel === "C2_ESCALATED" ||
        record.c2Boundary !== "C2_NOT_AVAILABLE" ||
        record.cyberRelevance === "C2_RELEVANT"
    );
  }

  if (!options.includeBlocked) {
    records = records.filter((record) => !record.blocked);
  }

  return records.slice(0, limit);
}

export function getModelUsageLogRecord(
  usageId: string
): ModelUsageLogRecord | null {
  return modelUsageProcessMemory.find((record) => record.usageId === usageId) ?? null;
}

export function clearModelUsageLogProcessMemory(): {
  cleared: number;
  mode: "PROCESS_MEMORY_MVP";
  boundary: string;
} {
  const cleared = modelUsageProcessMemory.length;
  modelUsageProcessMemory.length = 0;

  return {
    cleared,
    mode: "PROCESS_MEMORY_MVP",
    boundary:
      "Model usage process memory cleared. This does not affect future database persistence targets."
  };
}

export function summarizeModelUsageLogRecords(
  records: ModelUsageLogRecord[]
): ModelUsageLogSummary {
  const summary: ModelUsageLogSummary = {
    totalRecords: modelUsageProcessMemory.length,
    visibleRecords: records.length,
    totalEstimatedCostUnits: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    byTier: {},
    byModelLevel: {},
    byModel: {},
    blockedRecords: 0,
    failClosedRecords: 0,
    legalCertification: false,
    boundary:
      "Model usage summary supports SaaS accounting and operational reconstruction only. legalCertification = false."
  };

  for (const record of records) {
    summary.totalEstimatedCostUnits = Number(
      (summary.totalEstimatedCostUnits + record.estimatedCostUnits).toFixed(4)
    );

    summary.totalInputTokens += record.inputTokens ?? 0;
    summary.totalOutputTokens += record.outputTokens ?? 0;
    summary.totalTokens += record.totalTokens ?? 0;

    summary.byTier[record.saasTier] = (summary.byTier[record.saasTier] ?? 0) + 1;
    summary.byModelLevel[record.modelLevel] =
      (summary.byModelLevel[record.modelLevel] ?? 0) + 1;
    summary.byModel[record.selectedModel] =
      (summary.byModel[record.selectedModel] ?? 0) + 1;

    if (record.blocked) {
      summary.blockedRecords += 1;
    }

    if (record.failClosed) {
      summary.failClosedRecords += 1;
    }
  }

  return summary;
}

export function toPublicModelUsageLogRecord(record: ModelUsageLogRecord): {
  usageId: string;
  timestamp: string;
  source: ModelUsageLogSource;
  provider: ModelUsageProvider;
  project: string;
  targetRelease: string;
  sessionId: string;
  requestId: string;
  auditId: string | null;
  runtimeEntity: string;
  runtimeIpr: string;
  humanIpr: string;
  organizationIpr: string;
  workspaceId: string;
  saasTier: SaasTier;
  selectedModel: string;
  modelLevel: ModelLevel;
  riskLevel: RuntimeRiskLevel;
  runtimeDecision: RuntimeDecision;
  auditState: RuntimeAuditState;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  proofRequirement: ProofRequirement;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  evtRef: string | null;
  opcRef: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  accountingMode: ModelUsageAccountingMode;
  estimatedCostUnits: number;
  valueWeight: number;
  blocked: boolean;
  failClosed: boolean;
  allowed: boolean;
  persistenceMode: RuntimePersistenceMode;
  status: ModelUsageRecordStatus;
  legalCertification: false;
  usageHash: string;
  boundary: string;
} {
  return {
    usageId: record.usageId,
    timestamp: record.timestamp,
    source: record.source,
    provider: record.provider,
    project: record.project,
    targetRelease: record.targetRelease,
    sessionId: record.sessionId,
    requestId: record.requestId,
    auditId: record.auditId,
    runtimeEntity: record.runtimeEntity,
    runtimeIpr: record.runtimeIpr,
    humanIpr: record.humanIpr,
    organizationIpr: record.organizationIpr,
    workspaceId: record.workspaceId,
    saasTier: record.saasTier,
    selectedModel: record.selectedModel,
    modelLevel: record.modelLevel,
    riskLevel: record.riskLevel,
    runtimeDecision: record.runtimeDecision,
    auditState: record.auditState,
    operationalValue: record.operationalValue,
    cyberRelevance: record.cyberRelevance,
    c2Boundary: record.c2Boundary,
    proofRequirement: record.proofRequirement,
    evtRequired: record.evtRequired,
    opcRequired: record.opcRequired,
    auditRequired: record.auditRequired,
    evtRef: record.evtRef,
    opcRef: record.opcRef,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    totalTokens: record.totalTokens,
    accountingMode: record.accountingMode,
    estimatedCostUnits: record.estimatedCostUnits,
    valueWeight: record.valueWeight,
    blocked: record.blocked,
    failClosed: record.failClosed,
    allowed: record.allowed,
    persistenceMode: record.persistenceMode,
    status: record.status,
    legalCertification: false,
    usageHash: record.usageHash,
    boundary: record.boundary
  };
}

export function toPublicModelUsageLogRecords(
  records: ModelUsageLogRecord[]
): ReturnType<typeof toPublicModelUsageLogRecord>[] {
  return records.map((record) => toPublicModelUsageLogRecord(record));
}

export function buildModelUsagePromptFrame(record: ModelUsageLogRecord): string {
  return [
    "HBCE Model Usage Log",
    `Project: ${record.project}`,
    `Release: ${record.targetRelease}`,
    `Usage ID: ${record.usageId}`,
    `Usage hash: ${record.usageHash}`,
    `Timestamp: ${record.timestamp}`,
    `Source: ${record.source}`,
    `Provider: ${record.provider}`,
    `Session: ${record.sessionId}`,
    `Runtime entity: ${record.runtimeEntity}`,
    `Runtime IPR: ${record.runtimeIpr}`,
    `Human IPR: ${record.humanIpr}`,
    `SaaS tier: ${record.saasTier}`,
    `Selected model: ${record.selectedModel}`,
    `Model level: ${record.modelLevel}`,
    `Risk level: ${record.riskLevel}`,
    `Runtime decision: ${record.runtimeDecision}`,
    `Cyber relevance: ${record.cyberRelevance}`,
    `C2 boundary: ${record.c2Boundary}`,
    `Proof requirement: ${record.proofRequirement}`,
    `Input tokens: ${record.inputTokens ?? "not available"}`,
    `Output tokens: ${record.outputTokens ?? "not available"}`,
    `Total tokens: ${record.totalTokens ?? "not available"}`,
    `Accounting mode: ${record.accountingMode}`,
    `Estimated cost units: ${record.estimatedCostUnits}`,
    `Value weight: ${record.valueWeight}`,
    `EVT ref: ${record.evtRef ?? "none"}`,
    `OPC ref: ${record.opcRef ?? "none"}`,
    `Allowed: ${record.allowed}`,
    `Fail closed: ${record.failClosed}`,
    `Blocked: ${record.blocked}`,
    `Legal certification: ${record.legalCertification}`,
    `Reason: ${record.reason}`,
    `Boundary: ${record.boundary}`
  ].join("\n");
}

export function getModelUsageLogHealth(): ModelUsageLogHealth {
  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    sourceEvent: HBCE_SAAS_SOURCE_EVENT,
    sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
    targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
    mode: "PROCESS_MEMORY_MVP",
    recordsInProcessMemory: modelUsageProcessMemory.length,
    maxProcessMemoryRecords: MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS,
    legalCertification: false,
    boundary:
      "Model usage log is configured in PROCESS_MEMORY_MVP mode. Database persistence target is defined by docs/DATABASE_PERSISTENCE_PLAN.md. Usage records support SaaS accounting and operational reconstruction only. legalCertification = false."
  };
}
