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


import {
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";


import type { RuntimeAuditLogRecord } from "./runtime-audit-log";
import type { RuntimeRiskPolicyResult } from "./runtime-risk-policy";
import type { C2DefensePolicyResult } from "./c2-defense-policy";
import type { HbceDatabaseQueryRow } from "./ipr-database";


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
  | "DATABASE_PERSISTENT_TARGET"
  | "PERSISTED";


export type ModelUsageLogPersistenceBoundary =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT"
  | "FAIL_CLOSED_PERSISTENCE";


export type ModelUsageRuntimeModelLevel = ModelLevel | string;
export type ModelUsageRuntimeProofRequirement = ProofRequirement | string;


export type ModelUsagePersistenceResult = {
  ok: boolean;
  status:
    | "PERSISTED"
    | "DATABASE_NOT_CONFIGURED"
    | "DATABASE_NOT_AVAILABLE"
    | "DATABASE_WRITE_FAILED";
  usageId: string;
  usageHash: string;
  error: string | null;
  legalCertification: false;
};


export type ModelUsageTokenInput = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cachedInputTokens?: number | null;
  reasoningTokens?: number | null;
};


export type ModelUsageLogInput = {
  source?: ModelUsageLogSource;
  provider?: ModelUsageProvider | string;


  usageId?: string;
  timestamp?: string;
  sessionId?: string;
  requestId?: string;
  auditId?: string | null;


  runtimeEntity?: string;
  runtimeIpr?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  memoryRef?: string | null;
  memoryHash?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;


  saasTier?: SaasTier | string;
  selectedModel?: string;
  modelLevel?: ModelUsageRuntimeModelLevel;
  modelRoutingReason?: string;


  riskLevel?: RuntimeRiskLevel | string;
  runtimeDecision?: RuntimeDecision | string;
  auditState?: RuntimeAuditState | string;


  operationalValue?: OperationalValueLevel | string;
  cyberRelevance?: CyberRelevance | string;
  c2Boundary?: C2BoundaryState | string;
  proofRequirement?: ModelUsageRuntimeProofRequirement;


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
  estimatedCostMinor?: number | null;
  currency?: string | null;
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
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;

  memoryRef: string | null;
  memoryHash: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtRef: string | null;
  previousOpcRef: string | null;


  saasTier: SaasTier | string;
  selectedModel: string;
  modelLevel: ModelUsageRuntimeModelLevel;
  modelRoutingReason: string;


  riskLevel: RuntimeRiskLevel | string;
  runtimeDecision: RuntimeDecision | string;
  auditState: RuntimeAuditState | string;


  operationalValue: OperationalValueLevel | string;
  cyberRelevance: CyberRelevance | string;
  c2Boundary: C2BoundaryState | string;
  proofRequirement: ModelUsageRuntimeProofRequirement;


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
  estimatedCostMinor: number;
  currency: string;
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
  saasTier?: SaasTier | string;
  selectedModel?: string;
  modelLevel?: ModelUsageRuntimeModelLevel;
  c2Only?: boolean;
  includeBlocked?: boolean;
};


export type ModelUsageLogSummary = {
  totalRecords: number;
  visibleRecords: number;
  totalEstimatedCostUnits: number;
  totalEstimatedCostMinor: number;
  currency: string;
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
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  recordsInProcessMemory: number;
  maxProcessMemoryRecords: number;
  legalCertification: false;
  boundary: string;
};


type ModelUsageDatabaseRow = HbceDatabaseQueryRow & {
  usage_id?: string;
  usage_hash?: string;
};


type ModelUsageDatabasePayload = {
  usageId: string;
  tenantId: string | null;
  workspaceId: string | null;
  subscriptionId: string | null;
  accountId: string | null;
  humanIpr: string | null;
  runtimeIpr: string;
  sessionId: string | null;
  threadId: string | null;
  evtId: string | null;
  opcProofId: string | null;
  auditId: string | null;
  memoryId: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtId: string | null;
  previousOpcProofId: string | null;
  provider: string;
  model: string;
  modelLevel: string | null;
  saasTier: string | null;
  routingReason: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostMinor: number;
  currency: string;
  usageHash: string;
  payloadJson: string;
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


function normalizeUsageFloat(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }


  if (value < 0) {
    return null;
  }


  return Number(value.toFixed(4));
}


function normalizeCurrency(value: unknown): string {
  const normalized = normalizeUsageString(value, "EUR").toUpperCase();


  return normalized.length === 3 ? normalized : "EUR";
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


function safeDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }


  if (typeof error === "string") {
    return error;
  }


  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_MODEL_USAGE_DATABASE_ERROR";
  }
}


function normalizeRuntimeDecisionText(value: RuntimeDecision | string | undefined): string {
  return String(value || "UNKNOWN").toUpperCase();
}


function normalizeDatabaseRuntimeDecision(value: RuntimeDecision | string | undefined): string {
  const normalized = String(value || "ALLOW").toUpperCase();


  if (
    normalized === "ALLOW" ||
    normalized === "BLOCK" ||
    normalized === "ESCALATE" ||
    normalized === "FAIL_CLOSED"
  ) {
    return normalized;
  }


  if (
    normalized === "ACCESS_GRANTED" ||
    normalized === "ACCESS_GRANTED_ACCOUNT_SESSION" ||
    normalized === "GRANTED" ||
    normalized === "COMPLETED" ||
    normalized === "OK"
  ) {
    return "ALLOW";
  }


  if (
    normalized === "ACCESS_LIMITED" ||
    normalized === "SERVER_VALIDATION_REQUIRED" ||
    normalized === "PENDING_SERVER_VALIDATION" ||
    normalized === "REVIEW" ||
    normalized === "REQUIRES_REVIEW"
  ) {
    return "ESCALATE";
  }


  if (
    normalized === "DENY" ||
    normalized === "DENIED" ||
    normalized === "DISALLOW" ||
    normalized === "REJECT"
  ) {
    return "BLOCK";
  }


  return "ESCALATE";
}


function normalizeDatabaseRiskLevel(value: RuntimeRiskLevel | string | undefined): string {
  const normalized = String(value || "LOW").toUpperCase();


  if (
    normalized === "LOW" ||
    normalized === "MEDIUM" ||
    normalized === "HIGH" ||
    normalized === "CRITICAL"
  ) {
    return normalized;
  }


  return "LOW";
}


function normalizeDatabaseModelLevel(value: ModelUsageRuntimeModelLevel | undefined): string | null {
  const normalized = String(value || "").toUpperCase();


  if (!normalized || normalized === "UNKNOWN" || normalized === "NOT_SELECTED") {
    return null;
  }


  if (
    normalized === "BASE" ||
    normalized === "STANDARD" ||
    normalized === "ENHANCED" ||
    normalized === "DEEP" ||
    normalized === "FRONTIER" ||
    normalized === "EMERGENCY" ||
    normalized === "C2"
  ) {
    return normalized;
  }


  if (normalized === "ADVANCED") {
    return "DEEP";
  }


  if (normalized === "C2_ESCALATED" || normalized === "C2_DEFENSE") {
    return "C2";
  }


  if (normalized === "GOVERNANCE" || normalized === "PRO") {
    return "ENHANCED";
  }


  if (normalized === "BLOCKED") {
    return null;
  }


  return "STANDARD";
}


function normalizeDatabaseSaasTier(value: SaasTier | string | undefined): string | null {
  const normalized = String(value || "").toUpperCase();


  if (!normalized || normalized === "UNKNOWN") {
    return null;
  }


  if (
    normalized === "BASE" ||
    normalized === "IPR" ||
    normalized === "PRO" ||
    normalized === "GOVERNANCE" ||
    normalized === "C2_DEFENSE" ||
    normalized === "STRATEGIC"
  ) {
    return normalized;
  }


  return "BASE";
}


function providerToDatabaseValue(provider: ModelUsageProvider | string): string {
  const normalized = String(provider || "UNKNOWN").toUpperCase();


  if (normalized === "OPENAI") {
    return "openai";
  }


  if (normalized === "LOCAL" || normalized === "LOCAL_FALLBACK") {
    return "local";
  }


  if (normalized === "MOCK") {
    return "mock";
  }


  return "unknown";
}


function normalizeProvider(value: ModelUsageProvider | string | undefined): ModelUsageProvider {
  const normalized = String(value || "OPENAI").toUpperCase();


  if (normalized === "OPENAI") {
    return "OPENAI";
  }


  if (normalized === "LOCAL" || normalized === "LOCAL_FALLBACK") {
    return "LOCAL";
  }


  if (normalized === "MOCK") {
    return "MOCK";
  }


  return "UNKNOWN";
}


function nullableDatabaseText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }


  const trimmed = value.trim();


  if (!trimmed) {
    return null;
  }


  const normalized = trimmed.toUpperCase();


  if (
    normalized === "NONE" ||
    normalized === "NO_SESSION" ||
    normalized === "NO_THREAD" ||
    normalized === "NO_TENANT" ||
    normalized === "NO_WORKSPACE" ||
    normalized === "NO_SUBSCRIPTION" ||
    normalized === "NO_ACCOUNT" ||
    normalized === "NO_ORGANIZATION_IPR" ||
    normalized === "NOT_VERIFIED" ||
    normalized === "NO_CERTIFICATE" ||
    normalized === "NO_AUDIT" ||
    normalized === "NO_EVT" ||
    normalized === "NO_OPC" ||
    normalized === "NOT_SELECTED"
  ) {
    return null;
  }


  return trimmed;
}


function normalizeDatabaseRoutingReason(value: string): string | null {
  const trimmed = value.trim();


  if (!trimmed || trimmed === "No model routing reason provided.") {
    return null;
  }


  return trimmed;
}


function normalizeDatabaseTokenValue(value: number | null): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }


  return Math.round(value);
}


function shouldWriteRelationalColumns(record: ModelUsageLogRecord): boolean {
  return record.persistenceBoundary === "DATABASE_PERSISTENT";
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
    return "DATABASE_PERSISTENT_TARGET";
  }


  if (String(persistenceMode) === "FAIL_CLOSED_PERSISTENCE") {
    return "FAIL_CLOSED_PERSISTENCE";
  }


  return "PROCESS_MEMORY_MVP";
}


export function deriveModelUsageRecordStatus(input: {
  blocked: boolean;
  failClosed: boolean;
  persistenceMode: RuntimePersistenceMode;
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
}): ModelUsageRecordStatus {
  if (input.blocked) {
    return "BLOCKED_RECORDED";
  }


  if (input.failClosed) {
    return "FAIL_CLOSED_RECORDED";
  }


  if (input.persistenceMode === "DATABASE_PERSISTENT") {
    if (input.databaseConfigured && input.databaseAvailable) {
      return "DATABASE_PERSISTENT_TARGET";
    }


    return "MVP_MEMORY_ONLY";
  }


  return "MVP_MEMORY_ONLY";
}


function getTierWeight(saasTier: SaasTier | string): number {
  const normalized = String(saasTier).toUpperCase();


  if (normalized === "IPR") return 1.5;
  if (normalized === "PRO") return 2;
  if (normalized === "GOVERNANCE") return 3;
  if (normalized === "C2_DEFENSE") return 5;
  if (normalized === "STRATEGIC") return 6;


  return 1;
}


function getModelWeight(modelLevel: ModelUsageRuntimeModelLevel): number {
  const normalized = String(modelLevel || "STANDARD").toUpperCase();


  if (normalized === "ENHANCED") return 1.5;
  if (normalized === "ADVANCED" || normalized === "DEEP") return 2.5;
  if (normalized === "C2_ESCALATED" || normalized === "C2") return 4;
  if (normalized === "FRONTIER") return 5;
  if (normalized === "EMERGENCY") return 6;
  if (normalized === "BLOCKED") return 0;


  return 1;
}


function getRiskWeight(riskLevel: RuntimeRiskLevel | string): number {
  const normalized = String(riskLevel).toUpperCase();


  if (normalized === "MEDIUM") return 1.25;
  if (normalized === "HIGH") return 1.75;
  if (normalized === "CRITICAL") return 2.5;
  if (normalized === "BLOCKED") return 0;


  return 1;
}


function getOperationalWeight(operationalValue: OperationalValueLevel | string): number {
  const normalized = String(operationalValue).toUpperCase();


  if (normalized === "MEDIUM") return 1.25;
  if (normalized === "HIGH") return 1.75;
  if (normalized === "CRITICAL") return 2.5;


  return 1;
}


export function deriveModelValueWeight(input: {
  saasTier: SaasTier | string;
  modelLevel: ModelUsageRuntimeModelLevel;
  riskLevel: RuntimeRiskLevel | string;
  operationalValue: OperationalValueLevel | string;
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


function deriveEstimatedCostMinor(input: {
  explicitMinor: number | null;
  estimatedCostUnits: number;
}): number {
  if (input.explicitMinor !== null) {
    return input.explicitMinor;
  }


  return Math.max(0, Math.round(input.estimatedCostUnits * 100));
}


export function buildModelUsageBoundary(input: {
  persistenceBoundary: ModelUsageLogPersistenceBoundary;
  c2Boundary: C2BoundaryState | string;
}): string {
  const persistence =
    input.persistenceBoundary === "DATABASE_PERSISTENT"
      ? "Model usage persistence is database-backed."
      : input.persistenceBoundary === "DATABASE_PERSISTENT_TARGET"
        ? "Model usage has a DATABASE_PERSISTENT target, but persistence is authoritative only after the async database writer succeeds."
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
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    subscriptionId: record.subscriptionId,
    accountId: record.accountId,
    threadId: record.threadId,
    memoryRef: record.memoryRef,
    memoryHash: record.memoryHash,
    registeredEventId: record.registeredEventId,
    registeredEventName: record.registeredEventName,
    registeredEventHash: record.registeredEventHash,
    previousEvtRef: record.previousEvtRef,
    previousOpcRef: record.previousOpcRef,
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
    estimatedCostMinor: record.estimatedCostMinor,
    currency: record.currency,
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


  const runtimeDecisionText = normalizeRuntimeDecisionText(input.runtimeDecision);
  const normalizedInputModelLevel = String(input.modelLevel ?? "STANDARD").toUpperCase();


  const blocked = input.blocked ?? normalizedInputModelLevel === "BLOCKED";
  const failClosed = input.failClosed ?? runtimeDecisionText === "FAIL_CLOSED";
  const allowed = input.allowed ?? (!blocked && !failClosed);


  const saasTier = input.saasTier ?? "BASE";
  const modelLevel = input.modelLevel ?? "STANDARD";
  const riskLevel = input.riskLevel ?? "LOW";
  const operationalValue = input.operationalValue ?? "LOW";
  const opcRequired = input.opcRequired ?? false;
  const auditRequired = input.auditRequired ?? false;
  const c2Boundary = input.c2Boundary ?? "C2_NOT_AVAILABLE";


  const valueWeight =
    normalizeUsageFloat(input.valueWeight) ??
    deriveModelValueWeight({
      saasTier,
      modelLevel,
      riskLevel,
      operationalValue,
      opcRequired,
      auditRequired
    });


  const estimatedCostUnits =
    normalizeUsageFloat(input.estimatedCostUnits) ??
    deriveEstimatedCostUnits({
      totalTokens,
      inputTokens,
      outputTokens,
      valueWeight,
      blocked,
      failClosed
    });


  const estimatedCostMinor = deriveEstimatedCostMinor({
    explicitMinor: normalizeUsageNumber(input.estimatedCostMinor),
    estimatedCostUnits
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
    provider: normalizeProvider(input.provider),


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
    tenantId: normalizeUsageString(input.tenantId, "NO_TENANT"),
    workspaceId: normalizeUsageString(input.workspaceId, "NO_WORKSPACE"),
    subscriptionId: normalizeUsageString(input.subscriptionId, "NO_SUBSCRIPTION"),
    accountId: normalizeUsageString(input.accountId, "NO_ACCOUNT"),
    threadId: normalizeUsageString(input.threadId, "NO_THREAD"),

    memoryRef: normalizeNullableUsageString(input.memoryRef),
    memoryHash: normalizeNullableUsageString(input.memoryHash),
    registeredEventId: normalizeNullableUsageString(input.registeredEventId),
    registeredEventName: normalizeNullableUsageString(input.registeredEventName),
    registeredEventHash: normalizeNullableUsageString(input.registeredEventHash),
    previousEvtRef: normalizeNullableUsageString(input.previousEvtRef),
    previousOpcRef: normalizeNullableUsageString(input.previousOpcRef),


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
    estimatedCostMinor,
    currency: normalizeCurrency(input.currency),
    valueWeight,


    blocked,
    failClosed,
    allowed,


    persistenceMode,
    persistenceBoundary,


    status: deriveModelUsageRecordStatus({
      blocked,
      failClosed,
      persistenceMode,
      databaseConfigured: isHbceDatabaseConfigured(),
      databaseAvailable: isHbceDatabaseAvailable()
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


function pushModelUsageProcessMemory(record: ModelUsageLogRecord): ModelUsageLogRecord {
  modelUsageProcessMemory.unshift(record);


  if (modelUsageProcessMemory.length > MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS) {
    modelUsageProcessMemory.length = MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS;
  }


  return record;
}


export function appendModelUsageLogRecord(
  input: ModelUsageLogInput = {}
): ModelUsageLogRecord {
  const record = createModelUsageLogRecord(input);


  return pushModelUsageProcessMemory(record);
}


function modelUsageRecordToDatabasePayload(record: ModelUsageLogRecord): ModelUsageDatabasePayload {
  const writeRelationalColumns = shouldWriteRelationalColumns(record);


  const payload = {
    ...record,
    databaseColumnPolicy: {
      relationalColumnsWritten: writeRelationalColumns,
      reason: writeRelationalColumns
        ? "Record already confirmed DATABASE_PERSISTENT."
        : "Model usage references are preserved in payload JSONB while nullable relational columns remain null to avoid premature foreign key failures before tenant/session/EVT/OPC/audit ledger persistence is fully enabled."
    },
    databaseRefs: {
      tenantId: record.tenantId,
      workspaceId: record.workspaceId,
      subscriptionId: record.subscriptionId,
      accountId: record.accountId,
      humanIpr: record.humanIpr,
      sessionId: record.sessionId,
      threadId: record.threadId,
      evtId: record.evtRef,
      opcProofId: record.opcRef,
      auditId: record.auditId,
      memoryId: record.memoryRef,
      registeredEventId: record.registeredEventId,
      registeredEventName: record.registeredEventName,
      registeredEventHash: record.registeredEventHash,
      previousEvtId: record.previousEvtRef,
      previousOpcProofId: record.previousOpcRef
    },
    databaseRuntimeDecision: normalizeDatabaseRuntimeDecision(record.runtimeDecision),
    databaseRiskLevel: normalizeDatabaseRiskLevel(record.riskLevel),
    databaseModelLevel: normalizeDatabaseModelLevel(record.modelLevel),
    databaseSaasTier: normalizeDatabaseSaasTier(record.saasTier),
    databaseProvider: providerToDatabaseValue(record.provider),
    legalCertification: false
  };


  return {
    usageId: record.usageId,
    tenantId: writeRelationalColumns ? nullableDatabaseText(record.tenantId) : null,
    workspaceId: writeRelationalColumns ? nullableDatabaseText(record.workspaceId) : null,
    subscriptionId: writeRelationalColumns ? nullableDatabaseText(record.subscriptionId) : null,
    accountId: writeRelationalColumns ? nullableDatabaseText(record.accountId) : null,
    humanIpr: writeRelationalColumns ? nullableDatabaseText(record.humanIpr) : null,
    runtimeIpr: normalizeUsageString(record.runtimeIpr, RUNTIME_IPR),
    sessionId: writeRelationalColumns ? nullableDatabaseText(record.sessionId) : null,
    threadId: writeRelationalColumns ? nullableDatabaseText(record.threadId) : null,
    evtId: writeRelationalColumns ? nullableDatabaseText(record.evtRef) : null,
    opcProofId: writeRelationalColumns ? nullableDatabaseText(record.opcRef) : null,
    auditId: writeRelationalColumns ? nullableDatabaseText(record.auditId) : null,
    memoryId: writeRelationalColumns ? nullableDatabaseText(record.memoryRef) : null,
    registeredEventId: writeRelationalColumns ? nullableDatabaseText(record.registeredEventId) : null,
    registeredEventName: writeRelationalColumns ? nullableDatabaseText(record.registeredEventName) : null,
    registeredEventHash: writeRelationalColumns ? nullableDatabaseText(record.registeredEventHash) : null,
    previousEvtId: writeRelationalColumns ? nullableDatabaseText(record.previousEvtRef) : null,
    previousOpcProofId: writeRelationalColumns ? nullableDatabaseText(record.previousOpcRef) : null,
    provider: providerToDatabaseValue(record.provider),
    model: normalizeUsageString(record.selectedModel, "NOT_SELECTED"),
    modelLevel: normalizeDatabaseModelLevel(record.modelLevel),
    saasTier: normalizeDatabaseSaasTier(record.saasTier),
    routingReason: normalizeDatabaseRoutingReason(record.modelRoutingReason),
    inputTokens: normalizeDatabaseTokenValue(record.inputTokens),
    outputTokens: normalizeDatabaseTokenValue(record.outputTokens),
    totalTokens: normalizeDatabaseTokenValue(record.totalTokens),
    estimatedCostMinor: normalizeDatabaseTokenValue(record.estimatedCostMinor),
    currency: normalizeCurrency(record.currency),
    usageHash: record.usageHash,
    payloadJson: JSON.stringify(payload)
  };
}


async function persistModelUsageLogRecordFallback(
  record: ModelUsageLogRecord,
  fields: ModelUsageDatabasePayload,
  previousError: string | null
): Promise<ModelUsagePersistenceResult> {
  try {
    const result = await queryHbceDatabase<ModelUsageDatabaseRow>(
      `
INSERT INTO model_usage (
  usage_id,
  runtime_ipr,
  provider,
  model,
  model_level,
  saas_tier,
  routing_reason,
  input_tokens,
  output_tokens,
  total_tokens,
  estimated_cost_minor,
  currency,
  usage_hash,
  payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14::jsonb,
  false
)
ON CONFLICT (usage_id) DO UPDATE SET
  runtime_ipr = EXCLUDED.runtime_ipr,
  provider = EXCLUDED.provider,
  model = EXCLUDED.model,
  model_level = EXCLUDED.model_level,
  saas_tier = EXCLUDED.saas_tier,
  routing_reason = EXCLUDED.routing_reason,
  input_tokens = EXCLUDED.input_tokens,
  output_tokens = EXCLUDED.output_tokens,
  total_tokens = EXCLUDED.total_tokens,
  estimated_cost_minor = EXCLUDED.estimated_cost_minor,
  currency = EXCLUDED.currency,
  usage_hash = EXCLUDED.usage_hash,
  payload = EXCLUDED.payload,
  legal_certification = false
RETURNING usage_id, usage_hash;
`.trim(),
      [
        fields.usageId,
        fields.runtimeIpr,
        fields.provider,
        fields.model,
        fields.modelLevel,
        fields.saasTier,
        fields.routingReason,
        fields.inputTokens,
        fields.outputTokens,
        fields.totalTokens,
        fields.estimatedCostMinor,
        fields.currency,
        fields.usageHash,
        fields.payloadJson
      ]
    );


    if (!result.ok) {
      return {
        ok: false,
        status: "DATABASE_WRITE_FAILED",
        usageId: record.usageId,
        usageHash: record.usageHash,
        error:
          `${previousError || "MODEL_USAGE_DATABASE_WRITE_FAILED"} | fallback: ${
            result.error || "MODEL_USAGE_DATABASE_FALLBACK_WRITE_FAILED"
          }`,
        legalCertification: false
      };
    }


    record.status = "PERSISTED";
    record.persistenceBoundary = "DATABASE_PERSISTENT";


    return {
      ok: true,
      status: "PERSISTED",
      usageId: record.usageId,
      usageHash: record.usageHash,
      error: null,
      legalCertification: false
    };
  } catch (error) {
    return {
      ok: false,
      status: "DATABASE_WRITE_FAILED",
      usageId: record.usageId,
      usageHash: record.usageHash,
      error:
        `${previousError || "MODEL_USAGE_DATABASE_WRITE_FAILED"} | fallback: ${safeDatabaseError(
          error
        )}`,
      legalCertification: false
    };
  }
}


export async function persistModelUsageLogRecord(
  record: ModelUsageLogRecord
): Promise<ModelUsagePersistenceResult> {
  if (!isHbceDatabaseConfigured()) {
    return {
      ok: false,
      status: "DATABASE_NOT_CONFIGURED",
      usageId: record.usageId,
      usageHash: record.usageHash,
      error: "DATABASE_URL is not configured. Model usage log remains PROCESS_MEMORY_MVP.",
      legalCertification: false
    };
  }


  if (!isHbceDatabaseAvailable()) {
    return {
      ok: false,
      status: "DATABASE_NOT_AVAILABLE",
      usageId: record.usageId,
      usageHash: record.usageHash,
      error: "HBCE database adapter is not available. Model usage log remains PROCESS_MEMORY_MVP.",
      legalCertification: false
    };
  }


  const fields = modelUsageRecordToDatabasePayload(record);


  try {
    const result = await queryHbceDatabase<ModelUsageDatabaseRow>(
      `
INSERT INTO model_usage (
  usage_id,
  tenant_id,
  workspace_id,
  subscription_id,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  evt_id,
  opc_proof_id,
  audit_id,
  provider,
  model,
  model_level,
  saas_tier,
  routing_reason,
  input_tokens,
  output_tokens,
  total_tokens,
  estimated_cost_minor,
  currency,
  usage_hash,
  payload,
  legal_certification
)
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14,
  $15,
  $16,
  $17,
  $18,
  $19,
  $20,
  $21,
  $22,
  $23::jsonb,
  false
)
ON CONFLICT (usage_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  subscription_id = EXCLUDED.subscription_id,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  session_id = EXCLUDED.session_id,
  thread_id = EXCLUDED.thread_id,
  evt_id = EXCLUDED.evt_id,
  opc_proof_id = EXCLUDED.opc_proof_id,
  audit_id = EXCLUDED.audit_id,
  provider = EXCLUDED.provider,
  model = EXCLUDED.model,
  model_level = EXCLUDED.model_level,
  saas_tier = EXCLUDED.saas_tier,
  routing_reason = EXCLUDED.routing_reason,
  input_tokens = EXCLUDED.input_tokens,
  output_tokens = EXCLUDED.output_tokens,
  total_tokens = EXCLUDED.total_tokens,
  estimated_cost_minor = EXCLUDED.estimated_cost_minor,
  currency = EXCLUDED.currency,
  usage_hash = EXCLUDED.usage_hash,
  payload = EXCLUDED.payload,
  legal_certification = false
RETURNING usage_id, usage_hash;
`.trim(),
      [
        fields.usageId,
        fields.tenantId,
        fields.workspaceId,
        fields.subscriptionId,
        fields.humanIpr,
        fields.runtimeIpr,
        fields.sessionId,
        fields.threadId,
        fields.evtId,
        fields.opcProofId,
        fields.auditId,
        fields.provider,
        fields.model,
        fields.modelLevel,
        fields.saasTier,
        fields.routingReason,
        fields.inputTokens,
        fields.outputTokens,
        fields.totalTokens,
        fields.estimatedCostMinor,
        fields.currency,
        fields.usageHash,
        fields.payloadJson
      ]
    );


    if (!result.ok) {
      return persistModelUsageLogRecordFallback(
        record,
        fields,
        result.error || "MODEL_USAGE_DATABASE_WRITE_FAILED"
      );
    }


    record.status = "PERSISTED";
    record.persistenceBoundary = "DATABASE_PERSISTENT";


    return {
      ok: true,
      status: "PERSISTED",
      usageId: record.usageId,
      usageHash: record.usageHash,
      error: null,
      legalCertification: false
    };
  } catch (error) {
    return persistModelUsageLogRecordFallback(record, fields, safeDatabaseError(error));
  }
}


export async function appendModelUsageLogRecordAsync(
  input: ModelUsageLogInput = {}
): Promise<{
  record: ModelUsageLogRecord;
  persistence: ModelUsagePersistenceResult;
}> {
  const record = appendModelUsageLogRecord(input);
  const persistence = await persistModelUsageLogRecord(record);


  return {
    record,
    persistence
  };
}


export function appendModelUsageLogRecordFromRuntime(input: {
  source?: ModelUsageLogSource;
  provider?: ModelUsageProvider | string;
  sessionId?: string;
  requestId?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  memoryRef?: string | null;
  memoryHash?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;


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
    tenantId: input.tenantId ?? auditRecord?.tenantId,
    workspaceId: input.workspaceId ?? auditRecord?.workspaceId,
    subscriptionId: input.subscriptionId ?? auditRecord?.subscriptionId,
    accountId: input.accountId ?? auditRecord?.accountId,
    threadId: input.threadId ?? auditRecord?.threadId,

    memoryRef: input.memoryRef ?? auditRecord?.memoryRef ?? null,
    memoryHash: input.memoryHash ?? auditRecord?.memoryHash ?? null,
    registeredEventId: input.registeredEventId ?? auditRecord?.registeredEventId ?? null,
    registeredEventName: input.registeredEventName ?? auditRecord?.registeredEventName ?? null,
    registeredEventHash: input.registeredEventHash ?? auditRecord?.registeredEventHash ?? null,
    previousEvtRef: input.previousEvtRef ?? auditRecord?.previousEvtRef ?? null,
    previousOpcRef: input.previousOpcRef ?? auditRecord?.previousOpcRef ?? null,


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
      String(saasPolicy?.decision) === "FAIL_CLOSED" ||
      auditRecord?.failClosed === true,
    allowed:
      Boolean(saasPolicy?.allowed ?? true) &&
      Boolean(riskPolicy?.allowed ?? true) &&
      Boolean(!modelRouting?.blocked) &&
      Boolean(c2Policy?.allowed ?? true) &&
      Boolean(auditRecord?.allowed ?? true),


    persistenceMode:
      saasPolicy?.persistenceMode ??
      auditRecord?.persistenceMode ??
      "PROCESS_MEMORY_MVP",


    reason:
      modelRouting?.routingReason ??
      c2Policy?.reason ??
      riskPolicy?.reason ??
      saasPolicy?.reason ??
      auditRecord?.reason ??
      "Model usage record created from runtime outputs."
  });
}


export async function appendModelUsageLogRecordFromRuntimeAsync(input: {
  source?: ModelUsageLogSource;
  provider?: ModelUsageProvider | string;
  sessionId?: string;
  requestId?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  memoryRef?: string | null;
  memoryHash?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;


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
}): Promise<{
  record: ModelUsageLogRecord;
  persistence: ModelUsagePersistenceResult;
}> {
  const record = appendModelUsageLogRecordFromRuntime(input);
  const persistence = await persistModelUsageLogRecord(record);


  return {
    record,
    persistence
  };
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
        String(record.modelLevel).toUpperCase() === "C2_ESCALATED" ||
        String(record.modelLevel).toUpperCase() === "C2" ||
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
    totalEstimatedCostMinor: 0,
    currency: "EUR",
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


    summary.totalEstimatedCostMinor += record.estimatedCostMinor;
    summary.totalInputTokens += record.inputTokens ?? 0;
    summary.totalOutputTokens += record.outputTokens ?? 0;
    summary.totalTokens += record.totalTokens ?? 0;


    const tierKey = String(record.saasTier);
    const modelLevelKey = String(record.modelLevel);


    summary.byTier[tierKey] = (summary.byTier[tierKey] ?? 0) + 1;
    summary.byModelLevel[modelLevelKey] =
      (summary.byModelLevel[modelLevelKey] ?? 0) + 1;
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
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;
  memoryRef: string | null;
  memoryHash: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtRef: string | null;
  previousOpcRef: string | null;
  saasTier: SaasTier | string;
  selectedModel: string;
  modelLevel: ModelUsageRuntimeModelLevel;
  riskLevel: RuntimeRiskLevel | string;
  runtimeDecision: RuntimeDecision | string;
  auditState: RuntimeAuditState | string;
  operationalValue: OperationalValueLevel | string;
  cyberRelevance: CyberRelevance | string;
  c2Boundary: C2BoundaryState | string;
  proofRequirement: ModelUsageRuntimeProofRequirement;
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
  estimatedCostMinor: number;
  currency: string;
  valueWeight: number;
  blocked: boolean;
  failClosed: boolean;
  allowed: boolean;
  persistenceMode: RuntimePersistenceMode;
  persistenceBoundary: ModelUsageLogPersistenceBoundary;
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
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    subscriptionId: record.subscriptionId,
    accountId: record.accountId,
    threadId: record.threadId,
    memoryRef: record.memoryRef,
    memoryHash: record.memoryHash,
    registeredEventId: record.registeredEventId,
    registeredEventName: record.registeredEventName,
    registeredEventHash: record.registeredEventHash,
    previousEvtRef: record.previousEvtRef,
    previousOpcRef: record.previousOpcRef,
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
    estimatedCostMinor: record.estimatedCostMinor,
    currency: record.currency,
    valueWeight: record.valueWeight,
    blocked: record.blocked,
    failClosed: record.failClosed,
    allowed: record.allowed,
    persistenceMode: record.persistenceMode,
    persistenceBoundary: record.persistenceBoundary,
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
    `Tenant: ${record.tenantId}`,
    `Workspace: ${record.workspaceId}`,
    `Subscription: ${record.subscriptionId}`,
    `Account: ${record.accountId}`,
    `Thread: ${record.threadId}`,
    `Memory ref: ${record.memoryRef ?? "none"}`,
    `Registered event ID: ${record.registeredEventId ?? "none"}`,
    `Registered event name: ${record.registeredEventName ?? "none"}`,
    `Registered event hash: ${record.registeredEventHash ?? "none"}`,
    `Previous EVT ref: ${record.previousEvtRef ?? "none"}`,
    `Previous OPC ref: ${record.previousOpcRef ?? "none"}`,
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
    `Estimated cost minor: ${record.estimatedCostMinor}`,
    `Currency: ${record.currency}`,
    `Value weight: ${record.valueWeight}`,
    `EVT ref: ${record.evtRef ?? "none"}`,
    `OPC ref: ${record.opcRef ?? "none"}`,
    `Audit ref: ${record.auditId ?? "none"}`,
    `Persistence mode: ${record.persistenceMode}`,
    `Persistence boundary: ${record.persistenceBoundary}`,
    `Allowed: ${record.allowed}`,
    `Fail closed: ${record.failClosed}`,
    `Blocked: ${record.blocked}`,
    `Legal certification: ${record.legalCertification}`,
    `Reason: ${record.reason}`,
    `Boundary: ${record.boundary}`
  ].join("\n");
}


export function getModelUsageLogHealth(): ModelUsageLogHealth {
  const databaseConfigured = isHbceDatabaseConfigured();
  const databaseAvailable = isHbceDatabaseAvailable();


  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    sourceEvent: HBCE_SAAS_SOURCE_EVENT,
    sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
    targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
    mode: databaseConfigured && databaseAvailable
      ? "DATABASE_PERSISTENT_TARGET"
      : "PROCESS_MEMORY_MVP",
    databaseConfigured,
    databaseAvailable,
    recordsInProcessMemory: modelUsageProcessMemory.length,
    maxProcessMemoryRecords: MAX_PROCESS_MEMORY_MODEL_USAGE_RECORDS,
    legalCertification: false,
    boundary:
      "Model usage log is configured for PROCESS_MEMORY_MVP with DATABASE_PERSISTENT target when the HBCE database is configured and the async writer is used. Relational references remain inside payload JSONB until tenant/session/EVT/OPC/audit ledger persistence is fully active, to avoid premature foreign key failures. Usage records support SaaS accounting and operational reconstruction only. legalCertification = false."
  };
}
