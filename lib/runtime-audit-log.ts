/**
 * HBCE / JOKER-C2 Runtime Audit Log
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
 * This file provides the runtime audit log layer for JOKER-C2 SaaS Core v0.1.
 * It records tier evaluation, risk policy, model routing, C2 Defense boundary,
 * memory state, EVT reference and OPC reference in a structured audit record.
 *
 * Boundary:
 * Runtime audit logs support operational reconstruction.
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
  type IdentityState,
  type ModelLevel,
  type OrganizationState,
  type RuntimeAuditState,
  type RuntimeDecision,
  type RuntimeMemoryAuthority,
  type RuntimeMemoryScope,
  type RuntimeModelRoutingResult,
  type RuntimePersistenceMode,
  type RuntimeRiskLevel,
  type SaasTier,
  type SaasTierPolicyResult,
  type WorkspaceState
} from "./saas-tier-types";


import {
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";


import type { C2DefensePolicyResult } from "./c2-defense-policy";
import type { RuntimeRiskPolicyResult } from "./runtime-risk-policy";
import type { HbceDatabaseQueryRow } from "./ipr-database";


export type RuntimeAuditLogPersistenceBoundary =
  | "PROCESS_MEMORY_MVP"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT"
  | "FAIL_CLOSED_PERSISTENCE";


export type RuntimeAuditLogSource =
  | "API_CHAT"
  | "API_HEALTH"
  | "INTERFACE"
  | "SELF_PILOT"
  | "DEMO_SCRIPT"
  | "SYSTEM";


export type RuntimeAuditLogRecordStatus =
  | "RECORDED"
  | "BLOCKED_RECORDED"
  | "FAIL_CLOSED_RECORDED"
  | "MVP_MEMORY_ONLY"
  | "DATABASE_PERSISTENT_TARGET"
  | "PERSISTED";


export type RuntimeAuditDatabaseHumanOversight =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "MANDATORY_REVIEW";


export type RuntimeAuditLogInput = {
  source?: RuntimeAuditLogSource;
  sessionId?: string;
  requestId?: string;
  auditId?: string;
  timestamp?: string;


  runtimeEntity?: string;
  runtimeIpr?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  usageId?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;


  identityState?: IdentityState;
  organizationState?: OrganizationState;
  workspaceState?: WorkspaceState;


  saasTier?: SaasTier;
  tierDecision?: RuntimeDecision;
  accessDecision?: RuntimeDecision;


  riskLevel?: RuntimeRiskLevel;
  runtimeDecision?: RuntimeDecision;
  auditState?: RuntimeAuditState;


  modelLevel?: ModelLevel;
  selectedModel?: string;
  modelRoutingReason?: string;


  cyberRelevance?: CyberRelevance;
  c2Boundary?: C2BoundaryState;
  c2Decision?: RuntimeDecision;
  c2Allowed?: boolean;
  c2FailClosed?: boolean;


  memoryScope?: RuntimeMemoryScope;
  memoryAuthority?: RuntimeMemoryAuthority;
  persistenceMode?: RuntimePersistenceMode;
  persistenceBoundary?: RuntimeAuditLogPersistenceBoundary;


  evtRequired?: boolean;
  opcRequired?: boolean;
  auditRequired?: boolean;


  evtRef?: string | null;
  evtHash?: string | null;
  opcRef?: string | null;
  opcProofHash?: string | null;
  memoryRef?: string | null;
  memoryHash?: string | null;


  inputHash?: string | null;
  outputHash?: string | null;
  decisionHash?: string | null;
  policyHash?: string | null;


  dataClass?: string | null;
  contextClass?: string | null;
  projectDomain?: string | null;
  hbceModule?: string | null;


  allowed?: boolean;
  failClosed?: boolean;
  blocked?: boolean;


  reason?: string;
  boundary?: string;
};


export type RuntimeAuditLogRecord = {
  auditId: string;
  timestamp: string;
  source: RuntimeAuditLogSource;


  project: typeof HBCE_SAAS_PROJECT;
  targetRelease: typeof HBCE_SAAS_TARGET_RELEASE;
  sourceEvent: typeof HBCE_SAAS_SOURCE_EVENT;
  sourceEventAi: typeof HBCE_SAAS_SOURCE_EVENT_AI;
  targetCheckpoint: typeof HBCE_SAAS_TARGET_CHECKPOINT;
  organization: typeof HBCE_ORGANIZATION;
  core: typeof HBCE_CORE;


  sessionId: string;
  requestId: string;


  runtimeEntity: string;
  runtimeIpr: string;
  humanIpr: string;
  organizationIpr: string;
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;

  usageId: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtRef: string | null;
  previousOpcRef: string | null;


  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;


  saasTier: SaasTier;
  tierDecision: RuntimeDecision;
  accessDecision: RuntimeDecision;


  riskLevel: RuntimeRiskLevel;
  runtimeDecision: RuntimeDecision;
  auditState: RuntimeAuditState;


  modelLevel: ModelLevel;
  selectedModel: string;
  modelRoutingReason: string;


  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  c2Decision: RuntimeDecision;
  c2Allowed: boolean;
  c2FailClosed: boolean;


  memoryScope: RuntimeMemoryScope;
  memoryAuthority: RuntimeMemoryAuthority;
  persistenceMode: RuntimePersistenceMode;
  persistenceBoundary: RuntimeAuditLogPersistenceBoundary;


  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;


  evtRef: string | null;
  evtHash: string | null;
  opcRef: string | null;
  opcProofHash: string | null;
  memoryRef: string | null;
  memoryHash: string | null;


  inputHash: string | null;
  outputHash: string | null;
  decisionHash: string | null;
  policyHash: string | null;


  dataClass: string | null;
  contextClass: string | null;
  projectDomain: string | null;
  hbceModule: string | null;


  allowed: boolean;
  failClosed: boolean;
  blocked: boolean;


  status: RuntimeAuditLogRecordStatus;
  reason: string;
  boundary: string;


  legalCertification: false;
  auditHash: string;
};


export type RuntimeAuditLogHealth = {
  configured: true;
  project: string;
  targetRelease: string;
  sourceEvent: string;
  sourceEventAi: string;
  targetCheckpoint: string;
  mode: RuntimeAuditLogPersistenceBoundary;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  recordsInProcessMemory: number;
  maxProcessMemoryRecords: number;
  legalCertification: false;
  boundary: string;
};


export type RuntimeAuditLogListOptions = {
  limit?: number;
  sessionId?: string;
  humanIpr?: string;
  saasTier?: SaasTier;
  c2Only?: boolean;
  includeBlocked?: boolean;
};


export type RuntimeAuditLogPersistenceResult = {
  ok: boolean;
  status:
    | "PERSISTED"
    | "DATABASE_NOT_CONFIGURED"
    | "DATABASE_NOT_AVAILABLE"
    | "DATABASE_WRITE_FAILED";
  auditId: string;
  auditHash: string;
  error: string | null;
  legalCertification: false;
};


type RuntimeAuditLogDatabaseRow = HbceDatabaseQueryRow & {
  audit_id?: string;
  audit_hash?: string;
};


type RuntimeAuditDatabasePayload = {
  auditId: string;
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
  memoryId: string | null;
  usageId: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtId: string | null;
  previousOpcId: string | null;
  auditKind: string;
  runtimeState: string;
  runtimeDecision: string;
  riskLevel: string;
  dataClass: string | null;
  contextClass: string | null;
  projectDomain: string | null;
  hbceModule: string | null;
  modelLevel: string | null;
  saasTier: string | null;
  c2Boundary: string | null;
  blocked: boolean;
  failClosed: boolean;
  humanOversight: RuntimeAuditDatabaseHumanOversight;
  auditHash: string;
  payloadJson: string;
};


const MAX_PROCESS_MEMORY_AUDIT_RECORDS = 250;


const runtimeAuditProcessMemory: RuntimeAuditLogRecord[] = [];


export function nowIso(): string {
  return new Date().toISOString();
}


export function normalizeAuditString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }


  const trimmed = value.trim();


  return trimmed || fallback;
}


export function normalizeNullableAuditString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }


  const trimmed = value.trim();


  return trimmed || null;
}


export function stableAuditStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }


  if (typeof value !== "object") {
    return JSON.stringify(value);
  }


  if (Array.isArray(value)) {
    return `[${value.map((item) => stableAuditStringify(item)).join(",")}]`;
  }


  const record = value as Record<string, unknown>;


  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableAuditStringify(record[key])}`)
    .join(",")}}`;
}


export function sha256Audit(value: unknown): string {
  return createHash("sha256").update(stableAuditStringify(value)).digest("hex");
}


export function buildRuntimeAuditId(timestamp: string = nowIso()): string {
  const compactTimestamp = timestamp.replace(/\D/g, "").slice(0, 14);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();


  return `AUDIT-${compactTimestamp}-${suffix}`;
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
    return "UNKNOWN_RUNTIME_AUDIT_DATABASE_ERROR";
  }
}


function normalizeAuditRuntimeDecision(value: RuntimeDecision | string | undefined): string {
  return String(value || "UNKNOWN").toUpperCase();
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
    normalized === "NO_USAGE" ||
    normalized === "NO_REGISTERED_EVENT" ||
    normalized === "NO_PREVIOUS_EVT" ||
    normalized === "NO_PREVIOUS_OPC" ||
    normalized === "NO_ORGANIZATION_IPR" ||
    normalized === "NOT_VERIFIED" ||
    normalized === "NO_CERTIFICATE" ||
    normalized === "NO_MEMORY" ||
    normalized === "NO_EVT" ||
    normalized === "NO_OPC"
  ) {
    return null;
  }


  return trimmed;
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


  if (normalized === "LOW" || normalized === "MEDIUM" || normalized === "HIGH" || normalized === "CRITICAL") {
    return normalized;
  }


  return "LOW";
}


function normalizeDatabaseRuntimeState(record: RuntimeAuditLogRecord): string {
  if (record.blocked) {
    return "BLOCKED";
  }


  if (record.failClosed) {
    return "INVALID";
  }


  return "OPERATIONAL";
}


function normalizeDatabaseModelLevel(value: ModelLevel | string | undefined): string | null {
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


  if (normalized === "C2_ESCALATED" || normalized === "C2_DEFENSE") {
    return "C2";
  }


  if (normalized === "GOVERNANCE" || normalized === "PRO") {
    return "ENHANCED";
  }


  if (normalized === "ADVANCED") {
    return "DEEP";
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


function normalizeDatabaseC2Boundary(value: C2BoundaryState | string | undefined): string | null {
  const normalized = String(value || "").toUpperCase();


  if (!normalized || normalized === "UNKNOWN") {
    return null;
  }


  return normalized;
}


function shouldWriteRelationalColumns(record: RuntimeAuditLogRecord): boolean {
  return record.persistenceBoundary === "DATABASE_PERSISTENT";
}


export function deriveDatabaseHumanOversight(
  auditState: RuntimeAuditState
): RuntimeAuditDatabaseHumanOversight {
  switch (auditState) {
    case "MANDATORY":
      return "MANDATORY_REVIEW";
    case "ENABLED":
      return "RECOMMENDED";
    case "BLOCKED":
    case "FAIL_CLOSED":
      return "REQUIRED";
    case "NOT_REQUIRED":
    default:
      return "NOT_REQUIRED";
  }
}


export function deriveAuditRecordStatus(input: {
  blocked: boolean;
  failClosed: boolean;
  persistenceMode: RuntimePersistenceMode;
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
}): RuntimeAuditLogRecordStatus {
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


export function deriveAuditPersistenceBoundary(
  persistenceMode: RuntimePersistenceMode
): RuntimeAuditLogPersistenceBoundary {
  if (persistenceMode === "DATABASE_PERSISTENT") {
    return "DATABASE_PERSISTENT_TARGET";
  }


  const persistenceText: string = String(persistenceMode);


  if (persistenceText === "FAIL_CLOSED_PERSISTENCE") {
    return "FAIL_CLOSED_PERSISTENCE";
  }


  return "PROCESS_MEMORY_MVP";
}


export function buildRuntimeAuditBoundary(input: {
  persistenceBoundary: RuntimeAuditLogPersistenceBoundary;
  c2Boundary: C2BoundaryState;
}): string {
  const persistence =
    input.persistenceBoundary === "DATABASE_PERSISTENT"
      ? "Runtime audit log persistence is database-backed."
      : input.persistenceBoundary === "DATABASE_PERSISTENT_TARGET"
        ? "Runtime audit log has a DATABASE_PERSISTENT target, but persistence is authoritative only after the async database writer succeeds."
        : input.persistenceBoundary === "FAIL_CLOSED_PERSISTENCE"
          ? "Runtime audit log persistence is required but unavailable. Runtime must fail closed where required."
          : "Runtime audit log is currently stored in process memory MVP and may be lost across serverless cold starts or deployments.";


  return `${persistence} ${RUNTIME_BOUNDARY_SUMMARY.evt}. ${RUNTIME_BOUNDARY_SUMMARY.opc}. C2 boundary: ${input.c2Boundary}. legalCertification = false.`;
}


export function buildRuntimeAuditHashPayload(
  record: Omit<RuntimeAuditLogRecord, "auditHash">
): Record<string, unknown> {
  return {
    auditId: record.auditId,
    timestamp: record.timestamp,
    source: record.source,
    project: record.project,
    targetRelease: record.targetRelease,
    sessionId: record.sessionId,
    requestId: record.requestId,
    runtimeEntity: record.runtimeEntity,
    runtimeIpr: record.runtimeIpr,
    humanIpr: record.humanIpr,
    organizationIpr: record.organizationIpr,
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    subscriptionId: record.subscriptionId,
    accountId: record.accountId,
    threadId: record.threadId,
    usageId: record.usageId,
    registeredEventId: record.registeredEventId,
    registeredEventName: record.registeredEventName,
    registeredEventHash: record.registeredEventHash,
    previousEvtRef: record.previousEvtRef,
    previousOpcRef: record.previousOpcRef,
    identityState: record.identityState,
    organizationState: record.organizationState,
    workspaceState: record.workspaceState,
    saasTier: record.saasTier,
    tierDecision: record.tierDecision,
    accessDecision: record.accessDecision,
    riskLevel: record.riskLevel,
    runtimeDecision: record.runtimeDecision,
    auditState: record.auditState,
    modelLevel: record.modelLevel,
    selectedModel: record.selectedModel,
    cyberRelevance: record.cyberRelevance,
    c2Boundary: record.c2Boundary,
    c2Decision: record.c2Decision,
    c2Allowed: record.c2Allowed,
    c2FailClosed: record.c2FailClosed,
    memoryScope: record.memoryScope,
    memoryAuthority: record.memoryAuthority,
    persistenceMode: record.persistenceMode,
    persistenceBoundary: record.persistenceBoundary,
    evtRequired: record.evtRequired,
    opcRequired: record.opcRequired,
    auditRequired: record.auditRequired,
    evtRef: record.evtRef,
    evtHash: record.evtHash,
    opcRef: record.opcRef,
    opcProofHash: record.opcProofHash,
    memoryRef: record.memoryRef,
    memoryHash: record.memoryHash,
    inputHash: record.inputHash,
    outputHash: record.outputHash,
    decisionHash: record.decisionHash,
    policyHash: record.policyHash,
    dataClass: record.dataClass,
    contextClass: record.contextClass,
    projectDomain: record.projectDomain,
    hbceModule: record.hbceModule,
    allowed: record.allowed,
    failClosed: record.failClosed,
    blocked: record.blocked,
    status: record.status,
    legalCertification: record.legalCertification
  };
}


export function buildRuntimeAuditHash(
  record: Omit<RuntimeAuditLogRecord, "auditHash">
): string {
  return sha256Audit(buildRuntimeAuditHashPayload(record));
}


export function createRuntimeAuditLogRecord(
  input: RuntimeAuditLogInput = {}
): RuntimeAuditLogRecord {
  const timestamp = input.timestamp ?? nowIso();
  const auditId = normalizeAuditString(input.auditId, buildRuntimeAuditId(timestamp));


  const persistenceMode = input.persistenceMode ?? "PROCESS_MEMORY_MVP";
  const persistenceBoundary =
    input.persistenceBoundary ?? deriveAuditPersistenceBoundary(persistenceMode);


  const runtimeDecisionText = normalizeAuditRuntimeDecision(input.runtimeDecision);
  const blocked = input.blocked ?? runtimeDecisionText === "BLOCK";


  const failClosed =
    input.failClosed ??
    (
      runtimeDecisionText === "FAIL_CLOSED" ||
      input.c2FailClosed === true
    );


  const c2Boundary = input.c2Boundary ?? "C2_NOT_AVAILABLE";
  const allowed = input.allowed ?? (!blocked && !failClosed);


  const baseRecord: Omit<RuntimeAuditLogRecord, "auditHash"> = {
    auditId,
    timestamp,
    source: input.source ?? "SYSTEM",


    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    sourceEvent: HBCE_SAAS_SOURCE_EVENT,
    sourceEventAi: HBCE_SAAS_SOURCE_EVENT_AI,
    targetCheckpoint: HBCE_SAAS_TARGET_CHECKPOINT,
    organization: HBCE_ORGANIZATION,
    core: HBCE_CORE,


    sessionId: normalizeAuditString(input.sessionId, "NO_SESSION"),
    requestId: normalizeAuditString(input.requestId, randomUUID()),


    runtimeEntity: normalizeAuditString(input.runtimeEntity, RUNTIME_ENTITY),
    runtimeIpr: normalizeAuditString(input.runtimeIpr, RUNTIME_IPR),
    humanIpr: normalizeAuditString(input.humanIpr, "NOT_VERIFIED"),
    organizationIpr: normalizeAuditString(input.organizationIpr, "NO_ORGANIZATION_IPR"),
    tenantId: normalizeAuditString(input.tenantId, "NO_TENANT"),
    workspaceId: normalizeAuditString(input.workspaceId, "NO_WORKSPACE"),
    subscriptionId: normalizeAuditString(input.subscriptionId, "NO_SUBSCRIPTION"),
    accountId: normalizeAuditString(input.accountId, "NO_ACCOUNT"),
    threadId: normalizeAuditString(input.threadId, "NO_THREAD"),

    usageId: normalizeNullableAuditString(input.usageId),
    registeredEventId: normalizeNullableAuditString(input.registeredEventId),
    registeredEventName: normalizeNullableAuditString(input.registeredEventName),
    registeredEventHash: normalizeNullableAuditString(input.registeredEventHash),
    previousEvtRef: normalizeNullableAuditString(input.previousEvtRef),
    previousOpcRef: normalizeNullableAuditString(input.previousOpcRef),


    identityState: input.identityState ?? "NOT_VERIFIED",
    organizationState: input.organizationState ?? "NOT_REQUIRED",
    workspaceState: input.workspaceState ?? "NOT_REQUIRED",


    saasTier: input.saasTier ?? "BASE",
    tierDecision: input.tierDecision ?? "ALLOW",
    accessDecision: input.accessDecision ?? input.tierDecision ?? "ALLOW",


    riskLevel: input.riskLevel ?? "LOW",
    runtimeDecision: input.runtimeDecision ?? "ALLOW",
    auditState: input.auditState ?? "NOT_REQUIRED",


    modelLevel: input.modelLevel ?? "STANDARD",
    selectedModel: normalizeAuditString(input.selectedModel, "NOT_SELECTED"),
    modelRoutingReason: normalizeAuditString(
      input.modelRoutingReason,
      "No model routing reason provided."
    ),


    cyberRelevance: input.cyberRelevance ?? "NONE",
    c2Boundary,
    c2Decision: input.c2Decision ?? "ALLOW",
    c2Allowed: input.c2Allowed ?? false,
    c2FailClosed: input.c2FailClosed ?? false,


    memoryScope: input.memoryScope ?? "RUNTIME_ONLY",
    memoryAuthority: input.memoryAuthority ?? "RUNTIME_ONLY",
    persistenceMode,
    persistenceBoundary,


    evtRequired: input.evtRequired ?? false,
    opcRequired: input.opcRequired ?? false,
    auditRequired: input.auditRequired ?? false,


    evtRef: normalizeNullableAuditString(input.evtRef),
    evtHash: normalizeNullableAuditString(input.evtHash),
    opcRef: normalizeNullableAuditString(input.opcRef),
    opcProofHash: normalizeNullableAuditString(input.opcProofHash),
    memoryRef: normalizeNullableAuditString(input.memoryRef),
    memoryHash: normalizeNullableAuditString(input.memoryHash),


    inputHash: normalizeNullableAuditString(input.inputHash),
    outputHash: normalizeNullableAuditString(input.outputHash),
    decisionHash: normalizeNullableAuditString(input.decisionHash),
    policyHash: normalizeNullableAuditString(input.policyHash),


    dataClass: normalizeNullableAuditString(input.dataClass),
    contextClass: normalizeNullableAuditString(input.contextClass),
    projectDomain: normalizeNullableAuditString(input.projectDomain),
    hbceModule: normalizeNullableAuditString(input.hbceModule),


    allowed,
    failClosed,
    blocked,


    status: deriveAuditRecordStatus({
      blocked,
      failClosed,
      persistenceMode,
      databaseConfigured: isHbceDatabaseConfigured(),
      databaseAvailable: isHbceDatabaseAvailable()
    }),


    reason: normalizeAuditString(input.reason, "Runtime audit record created."),
    boundary:
      input.boundary ??
      buildRuntimeAuditBoundary({
        persistenceBoundary,
        c2Boundary
      }),


    legalCertification: false
  };


  return {
    ...baseRecord,
    auditHash: buildRuntimeAuditHash(baseRecord)
  };
}


function pushRuntimeAuditProcessMemory(record: RuntimeAuditLogRecord): RuntimeAuditLogRecord {
  runtimeAuditProcessMemory.unshift(record);


  if (runtimeAuditProcessMemory.length > MAX_PROCESS_MEMORY_AUDIT_RECORDS) {
    runtimeAuditProcessMemory.length = MAX_PROCESS_MEMORY_AUDIT_RECORDS;
  }


  return record;
}


export function appendRuntimeAuditLogRecord(
  input: RuntimeAuditLogInput = {}
): RuntimeAuditLogRecord {
  const record = createRuntimeAuditLogRecord(input);


  return pushRuntimeAuditProcessMemory(record);
}


function runtimeAuditRecordToDatabasePayload(
  record: RuntimeAuditLogRecord
): RuntimeAuditDatabasePayload {
  const writeRelationalColumns = shouldWriteRelationalColumns(record);


  const payload = {
    ...record,
    databaseColumnPolicy: {
      relationalColumnsWritten: writeRelationalColumns,
      reason: writeRelationalColumns
        ? "Record already confirmed DATABASE_PERSISTENT."
        : "Runtime audit references are preserved in payload JSONB while nullable relational columns remain null to avoid premature foreign key failures before tenant/session/EVT/OPC ledger persistence is fully enabled."
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
      memoryId: record.memoryRef,
      usageId: record.usageId,
      registeredEventId: record.registeredEventId,
      registeredEventName: record.registeredEventName,
      registeredEventHash: record.registeredEventHash,
      previousEvtId: record.previousEvtRef,
      previousOpcId: record.previousOpcRef
    },
    databaseHumanOversight: deriveDatabaseHumanOversight(record.auditState),
    legalCertification: false
  };


  return {
    auditId: record.auditId,
    tenantId: writeRelationalColumns ? nullableDatabaseText(record.tenantId) : null,
    workspaceId: writeRelationalColumns ? nullableDatabaseText(record.workspaceId) : null,
    subscriptionId: writeRelationalColumns ? nullableDatabaseText(record.subscriptionId) : null,
    accountId: writeRelationalColumns ? nullableDatabaseText(record.accountId) : null,
    humanIpr: writeRelationalColumns ? nullableDatabaseText(record.humanIpr) : null,
    runtimeIpr: normalizeAuditString(record.runtimeIpr, RUNTIME_IPR),
    sessionId: writeRelationalColumns ? nullableDatabaseText(record.sessionId) : null,
    threadId: writeRelationalColumns ? nullableDatabaseText(record.threadId) : null,
    evtId: writeRelationalColumns ? nullableDatabaseText(record.evtRef) : null,
    opcProofId: writeRelationalColumns ? nullableDatabaseText(record.opcRef) : null,
    memoryId: writeRelationalColumns ? nullableDatabaseText(record.memoryRef) : null,
    usageId: writeRelationalColumns ? nullableDatabaseText(record.usageId) : null,
    registeredEventId: writeRelationalColumns ? nullableDatabaseText(record.registeredEventId) : null,
    registeredEventName: writeRelationalColumns ? nullableDatabaseText(record.registeredEventName) : null,
    registeredEventHash: writeRelationalColumns ? nullableDatabaseText(record.registeredEventHash) : null,
    previousEvtId: writeRelationalColumns ? nullableDatabaseText(record.previousEvtRef) : null,
    previousOpcId: writeRelationalColumns ? nullableDatabaseText(record.previousOpcRef) : null,
    auditKind: "RUNTIME_DECISION",
    runtimeState: normalizeDatabaseRuntimeState(record),
    runtimeDecision: normalizeDatabaseRuntimeDecision(record.runtimeDecision),
    riskLevel: normalizeDatabaseRiskLevel(record.riskLevel),
    dataClass: nullableDatabaseText(record.dataClass),
    contextClass: nullableDatabaseText(record.contextClass),
    projectDomain: nullableDatabaseText(record.projectDomain),
    hbceModule: nullableDatabaseText(record.hbceModule),
    modelLevel: normalizeDatabaseModelLevel(record.modelLevel),
    saasTier: normalizeDatabaseSaasTier(record.saasTier),
    c2Boundary: normalizeDatabaseC2Boundary(record.c2Boundary),
    blocked: record.blocked,
    failClosed: record.failClosed,
    humanOversight: deriveDatabaseHumanOversight(record.auditState),
    auditHash: record.auditHash,
    payloadJson: JSON.stringify(payload)
  };
}


export async function persistRuntimeAuditLogRecord(
  record: RuntimeAuditLogRecord
): Promise<RuntimeAuditLogPersistenceResult> {
  if (!isHbceDatabaseConfigured()) {
    return {
      ok: false,
      status: "DATABASE_NOT_CONFIGURED",
      auditId: record.auditId,
      auditHash: record.auditHash,
      error: "DATABASE_URL is not configured. Runtime audit log remains PROCESS_MEMORY_MVP.",
      legalCertification: false
    };
  }


  if (!isHbceDatabaseAvailable()) {
    return {
      ok: false,
      status: "DATABASE_NOT_AVAILABLE",
      auditId: record.auditId,
      auditHash: record.auditHash,
      error: "HBCE database adapter is not available. Runtime audit log remains PROCESS_MEMORY_MVP.",
      legalCertification: false
    };
  }


  const fields = runtimeAuditRecordToDatabasePayload(record);


  try {
    const result = await queryHbceDatabase<RuntimeAuditLogDatabaseRow>(
      `
INSERT INTO runtime_audit_logs (
  audit_id,
  tenant_id,
  workspace_id,
  subscription_id,
  human_ipr,
  runtime_ipr,
  session_id,
  thread_id,
  evt_id,
  opc_proof_id,
  memory_id,
  audit_kind,
  runtime_state,
  runtime_decision,
  risk_level,
  data_class,
  context_class,
  project_domain,
  hbce_module,
  model_level,
  saas_tier,
  c2_boundary,
  blocked,
  fail_closed,
  human_oversight,
  audit_hash,
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
  $23,
  $24,
  $25,
  $26,
  $27::jsonb,
  false
)
ON CONFLICT (audit_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  workspace_id = EXCLUDED.workspace_id,
  subscription_id = EXCLUDED.subscription_id,
  human_ipr = EXCLUDED.human_ipr,
  runtime_ipr = EXCLUDED.runtime_ipr,
  session_id = EXCLUDED.session_id,
  thread_id = EXCLUDED.thread_id,
  evt_id = EXCLUDED.evt_id,
  opc_proof_id = EXCLUDED.opc_proof_id,
  memory_id = EXCLUDED.memory_id,
  audit_kind = EXCLUDED.audit_kind,
  runtime_state = EXCLUDED.runtime_state,
  runtime_decision = EXCLUDED.runtime_decision,
  risk_level = EXCLUDED.risk_level,
  data_class = EXCLUDED.data_class,
  context_class = EXCLUDED.context_class,
  project_domain = EXCLUDED.project_domain,
  hbce_module = EXCLUDED.hbce_module,
  model_level = EXCLUDED.model_level,
  saas_tier = EXCLUDED.saas_tier,
  c2_boundary = EXCLUDED.c2_boundary,
  blocked = EXCLUDED.blocked,
  fail_closed = EXCLUDED.fail_closed,
  human_oversight = EXCLUDED.human_oversight,
  audit_hash = EXCLUDED.audit_hash,
  payload = EXCLUDED.payload,
  legal_certification = false
RETURNING audit_id, audit_hash;
`.trim(),
      [
        fields.auditId,
        fields.tenantId,
        fields.workspaceId,
        fields.subscriptionId,
        fields.humanIpr,
        fields.runtimeIpr,
        fields.sessionId,
        fields.threadId,
        fields.evtId,
        fields.opcProofId,
        fields.memoryId,
        fields.auditKind,
        fields.runtimeState,
        fields.runtimeDecision,
        fields.riskLevel,
        fields.dataClass,
        fields.contextClass,
        fields.projectDomain,
        fields.hbceModule,
        fields.modelLevel,
        fields.saasTier,
        fields.c2Boundary,
        fields.blocked,
        fields.failClosed,
        fields.humanOversight,
        fields.auditHash,
        fields.payloadJson
      ]
    );


    if (!result.ok) {
      return {
        ok: false,
        status: "DATABASE_WRITE_FAILED",
        auditId: record.auditId,
        auditHash: record.auditHash,
        error: result.error || "RUNTIME_AUDIT_LOG_DATABASE_WRITE_FAILED",
        legalCertification: false
      };
    }


    record.status = "PERSISTED";
    record.persistenceBoundary = "DATABASE_PERSISTENT";


    return {
      ok: true,
      status: "PERSISTED",
      auditId: record.auditId,
      auditHash: record.auditHash,
      error: null,
      legalCertification: false
    };
  } catch (error) {
    return {
      ok: false,
      status: "DATABASE_WRITE_FAILED",
      auditId: record.auditId,
      auditHash: record.auditHash,
      error: safeDatabaseError(error),
      legalCertification: false
    };
  }
}


export async function appendRuntimeAuditLogRecordAsync(
  input: RuntimeAuditLogInput = {}
): Promise<{
  record: RuntimeAuditLogRecord;
  persistence: RuntimeAuditLogPersistenceResult;
}> {
  const record = appendRuntimeAuditLogRecord(input);
  const persistence = await persistRuntimeAuditLogRecord(record);


  return {
    record,
    persistence
  };
}


export function appendRuntimeAuditLogRecordFromPolicies(input: {
  source?: RuntimeAuditLogSource;
  sessionId?: string;
  requestId?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  usageId?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;
  saasPolicy?: SaasTierPolicyResult;
  riskPolicy?: RuntimeRiskPolicyResult;
  modelRouting?: RuntimeModelRoutingResult;
  c2Policy?: C2DefensePolicyResult;
  evtRef?: string | null;
  evtHash?: string | null;
  opcRef?: string | null;
  opcProofHash?: string | null;
  memoryRef?: string | null;
  memoryHash?: string | null;
  inputHash?: string | null;
  outputHash?: string | null;
  dataClass?: string | null;
  contextClass?: string | null;
  projectDomain?: string | null;
  hbceModule?: string | null;
}): RuntimeAuditLogRecord {
  const saasPolicy = input.saasPolicy;
  const riskPolicy = input.riskPolicy;
  const modelRouting = input.modelRouting;
  const c2Policy = input.c2Policy;


  return appendRuntimeAuditLogRecord({
    source: input.source ?? "API_CHAT",
    sessionId: input.sessionId,
    requestId: input.requestId,
    humanIpr: input.humanIpr,
    organizationIpr: input.organizationIpr,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    subscriptionId: input.subscriptionId,
    accountId: input.accountId,
    threadId: input.threadId,
    usageId: input.usageId,
    registeredEventId: input.registeredEventId,
    registeredEventName: input.registeredEventName,
    registeredEventHash: input.registeredEventHash,
    previousEvtRef: input.previousEvtRef,
    previousOpcRef: input.previousOpcRef,


    identityState: saasPolicy?.identityState ?? "NOT_VERIFIED",
    organizationState: saasPolicy?.organizationState ?? "NOT_REQUIRED",
    workspaceState: saasPolicy?.workspaceState ?? "NOT_REQUIRED",


    saasTier: saasPolicy?.tier ?? modelRouting?.tier ?? "BASE",
    tierDecision: saasPolicy?.decision ?? "ALLOW",
    accessDecision: saasPolicy?.decision ?? "ALLOW",


    riskLevel: riskPolicy?.riskLevel ?? saasPolicy?.riskLevel ?? modelRouting?.riskLevel ?? "LOW",
    runtimeDecision: riskPolicy?.decision ?? saasPolicy?.decision ?? "ALLOW",
    auditState: riskPolicy?.auditState ?? saasPolicy?.auditState ?? "NOT_REQUIRED",


    modelLevel: modelRouting?.modelLevel ?? saasPolicy?.modelLevel ?? "STANDARD",
    selectedModel: modelRouting?.selectedModel ?? "NOT_SELECTED",
    modelRoutingReason:
      modelRouting?.routingReason ?? "No model routing record provided.",


    cyberRelevance:
      c2Policy?.cyberRelevance ??
      riskPolicy?.cyberRelevance ??
      saasPolicy?.cyberRelevance ??
      modelRouting?.cyberRelevance ??
      "NONE",
    c2Boundary:
      c2Policy?.cyberBoundary ??
      riskPolicy?.c2Boundary ??
      saasPolicy?.cyberBoundary ??
      modelRouting?.c2Boundary ??
      "C2_NOT_AVAILABLE",
    c2Decision: c2Policy?.decision ?? "ALLOW",
    c2Allowed: c2Policy?.allowed ?? false,
    c2FailClosed: c2Policy?.failClosed ?? false,


    memoryScope: saasPolicy?.memoryScope ?? "RUNTIME_ONLY",
    memoryAuthority: saasPolicy?.memoryAuthority ?? "RUNTIME_ONLY",
    persistenceMode: saasPolicy?.persistenceMode ?? "PROCESS_MEMORY_MVP",


    evtRequired:
      Boolean(saasPolicy?.evtRequired) ||
      Boolean(riskPolicy?.evtRequired) ||
      Boolean(modelRouting?.evtRequired) ||
      Boolean(c2Policy?.evtRequired),
    opcRequired:
      Boolean(saasPolicy?.opcRequired) ||
      Boolean(riskPolicy?.opcRequired) ||
      Boolean(modelRouting?.opcRequired) ||
      Boolean(c2Policy?.opcRequired),
    auditRequired:
      Boolean(saasPolicy?.auditRequired) ||
      Boolean(riskPolicy?.auditRequired) ||
      Boolean(modelRouting?.auditRequired) ||
      Boolean(c2Policy?.auditRequired),


    evtRef: input.evtRef,
    evtHash: input.evtHash,
    opcRef: input.opcRef,
    opcProofHash: input.opcProofHash,
    memoryRef: input.memoryRef,
    memoryHash: input.memoryHash,
    inputHash: input.inputHash,
    outputHash: input.outputHash,


    dataClass: input.dataClass,
    contextClass: input.contextClass,
    projectDomain: input.projectDomain,
    hbceModule: input.hbceModule,


    decisionHash: sha256Audit({
      saasDecision: saasPolicy?.decision,
      riskDecision: riskPolicy?.decision,
      c2Decision: c2Policy?.decision,
      modelLevel: modelRouting?.modelLevel
    }),
    policyHash: sha256Audit({
      saasPolicy,
      riskPolicy,
      modelRouting,
      c2Policy
    }),


    allowed:
      Boolean(saasPolicy?.allowed ?? true) &&
      Boolean(riskPolicy?.allowed ?? true) &&
      Boolean(!modelRouting?.blocked) &&
      Boolean(c2Policy?.allowed ?? true),
    failClosed:
      Boolean(riskPolicy?.failClosed) ||
      Boolean(c2Policy?.failClosed) ||
      String(saasPolicy?.decision) === "FAIL_CLOSED",
    blocked:
      riskPolicy?.decision === "BLOCK" ||
      modelRouting?.blocked === true ||
      c2Policy?.decision === "BLOCK",


    reason:
      c2Policy?.reason ??
      riskPolicy?.reason ??
      saasPolicy?.reason ??
      modelRouting?.routingReason ??
      "Runtime audit record created from policy outputs."
  });
}


export async function appendRuntimeAuditLogRecordFromPoliciesAsync(input: {
  source?: RuntimeAuditLogSource;
  sessionId?: string;
  requestId?: string;
  humanIpr?: string;
  organizationIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  subscriptionId?: string;
  accountId?: string;
  threadId?: string;

  usageId?: string | null;
  registeredEventId?: string | null;
  registeredEventName?: string | null;
  registeredEventHash?: string | null;
  previousEvtRef?: string | null;
  previousOpcRef?: string | null;
  saasPolicy?: SaasTierPolicyResult;
  riskPolicy?: RuntimeRiskPolicyResult;
  modelRouting?: RuntimeModelRoutingResult;
  c2Policy?: C2DefensePolicyResult;
  evtRef?: string | null;
  evtHash?: string | null;
  opcRef?: string | null;
  opcProofHash?: string | null;
  memoryRef?: string | null;
  memoryHash?: string | null;
  inputHash?: string | null;
  outputHash?: string | null;
  dataClass?: string | null;
  contextClass?: string | null;
  projectDomain?: string | null;
  hbceModule?: string | null;
}): Promise<{
  record: RuntimeAuditLogRecord;
  persistence: RuntimeAuditLogPersistenceResult;
}> {
  const record = appendRuntimeAuditLogRecordFromPolicies(input);
  const persistence = await persistRuntimeAuditLogRecord(record);


  return {
    record,
    persistence
  };
}


export function listRuntimeAuditLogRecords(
  options: RuntimeAuditLogListOptions = {}
): RuntimeAuditLogRecord[] {
  const limit = Math.max(1, Math.min(options.limit ?? 50, MAX_PROCESS_MEMORY_AUDIT_RECORDS));


  let records = [...runtimeAuditProcessMemory];


  if (options.sessionId) {
    records = records.filter((record) => record.sessionId === options.sessionId);
  }


  if (options.humanIpr) {
    records = records.filter((record) => record.humanIpr === options.humanIpr);
  }


  if (options.saasTier) {
    records = records.filter((record) => record.saasTier === options.saasTier);
  }


  if (options.c2Only) {
    records = records.filter(
      (record) =>
        record.saasTier === "C2_DEFENSE" ||
        record.c2Boundary !== "C2_NOT_AVAILABLE" ||
        record.cyberRelevance === "C2_RELEVANT"
    );
  }


  if (!options.includeBlocked) {
    records = records.filter((record) => !record.blocked);
  }


  return records.slice(0, limit);
}


export function getRuntimeAuditLogRecord(auditId: string): RuntimeAuditLogRecord | null {
  return runtimeAuditProcessMemory.find((record) => record.auditId === auditId) ?? null;
}


export function clearRuntimeAuditLogProcessMemory(): {
  cleared: number;
  mode: "PROCESS_MEMORY_MVP";
  boundary: string;
} {
  const cleared = runtimeAuditProcessMemory.length;
  runtimeAuditProcessMemory.length = 0;


  return {
    cleared,
    mode: "PROCESS_MEMORY_MVP",
    boundary:
      "Runtime audit process memory cleared. This does not affect future database persistence targets."
  };
}


export function toPublicRuntimeAuditLogRecord(record: RuntimeAuditLogRecord): {
  auditId: string;
  timestamp: string;
  source: RuntimeAuditLogSource;
  project: string;
  targetRelease: string;
  sessionId: string;
  requestId: string;
  runtimeEntity: string;
  runtimeIpr: string;
  humanIpr: string;
  organizationIpr: string;
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  accountId: string;
  threadId: string;

  usageId: string | null;
  registeredEventId: string | null;
  registeredEventName: string | null;
  registeredEventHash: string | null;
  previousEvtRef: string | null;
  previousOpcRef: string | null;
  identityState: IdentityState;
  saasTier: SaasTier;
  riskLevel: RuntimeRiskLevel;
  runtimeDecision: RuntimeDecision;
  auditState: RuntimeAuditState;
  modelLevel: ModelLevel;
  selectedModel: string;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  memoryScope: RuntimeMemoryScope;
  persistenceMode: RuntimePersistenceMode;
  persistenceBoundary: RuntimeAuditLogPersistenceBoundary;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  evtRef: string | null;
  evtHash: string | null;
  opcRef: string | null;
  opcProofHash: string | null;
  memoryRef: string | null;
  memoryHash: string | null;
  allowed: boolean;
  failClosed: boolean;
  blocked: boolean;
  status: RuntimeAuditLogRecordStatus;
  reason: string;
  legalCertification: false;
  auditHash: string;
  boundary: string;
} {
  return {
    auditId: record.auditId,
    timestamp: record.timestamp,
    source: record.source,
    project: record.project,
    targetRelease: record.targetRelease,
    sessionId: record.sessionId,
    requestId: record.requestId,
    runtimeEntity: record.runtimeEntity,
    runtimeIpr: record.runtimeIpr,
    humanIpr: record.humanIpr,
    organizationIpr: record.organizationIpr,
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    subscriptionId: record.subscriptionId,
    accountId: record.accountId,
    threadId: record.threadId,
    usageId: record.usageId,
    registeredEventId: record.registeredEventId,
    registeredEventName: record.registeredEventName,
    registeredEventHash: record.registeredEventHash,
    previousEvtRef: record.previousEvtRef,
    previousOpcRef: record.previousOpcRef,
    identityState: record.identityState,
    saasTier: record.saasTier,
    riskLevel: record.riskLevel,
    runtimeDecision: record.runtimeDecision,
    auditState: record.auditState,
    modelLevel: record.modelLevel,
    selectedModel: record.selectedModel,
    cyberRelevance: record.cyberRelevance,
    c2Boundary: record.c2Boundary,
    memoryScope: record.memoryScope,
    persistenceMode: record.persistenceMode,
    persistenceBoundary: record.persistenceBoundary,
    evtRequired: record.evtRequired,
    opcRequired: record.opcRequired,
    auditRequired: record.auditRequired,
    evtRef: record.evtRef,
    evtHash: record.evtHash,
    opcRef: record.opcRef,
    opcProofHash: record.opcProofHash,
    memoryRef: record.memoryRef,
    memoryHash: record.memoryHash,
    allowed: record.allowed,
    failClosed: record.failClosed,
    blocked: record.blocked,
    status: record.status,
    reason: record.reason,
    legalCertification: false,
    auditHash: record.auditHash,
    boundary: record.boundary
  };
}


export function toPublicRuntimeAuditLogRecords(
  records: RuntimeAuditLogRecord[]
): ReturnType<typeof toPublicRuntimeAuditLogRecord>[] {
  return records.map((record) => toPublicRuntimeAuditLogRecord(record));
}


export function buildRuntimeAuditPromptFrame(record: RuntimeAuditLogRecord): string {
  return [
    "HBCE Runtime Audit Log",
    `Project: ${record.project}`,
    `Release: ${record.targetRelease}`,
    `Audit ID: ${record.auditId}`,
    `Audit hash: ${record.auditHash}`,
    `Timestamp: ${record.timestamp}`,
    `Source: ${record.source}`,
    `Session: ${record.sessionId}`,
    `Runtime entity: ${record.runtimeEntity}`,
    `Runtime IPR: ${record.runtimeIpr}`,
    `Human IPR: ${record.humanIpr}`,
    `Tenant: ${record.tenantId}`,
    `Workspace: ${record.workspaceId}`,
    `Subscription: ${record.subscriptionId}`,
    `Account: ${record.accountId}`,
    `Thread: ${record.threadId}`,
    `Usage ID: ${record.usageId ?? "none"}`,
    `Registered event ID: ${record.registeredEventId ?? "none"}`,
    `Registered event name: ${record.registeredEventName ?? "none"}`,
    `Registered event hash: ${record.registeredEventHash ?? "none"}`,
    `Previous EVT ref: ${record.previousEvtRef ?? "none"}`,
    `Previous OPC ref: ${record.previousOpcRef ?? "none"}`,
    `SaaS tier: ${record.saasTier}`,
    `Risk level: ${record.riskLevel}`,
    `Runtime decision: ${record.runtimeDecision}`,
    `Audit state: ${record.auditState}`,
    `Database human oversight: ${deriveDatabaseHumanOversight(record.auditState)}`,
    `Model level: ${record.modelLevel}`,
    `Selected model: ${record.selectedModel}`,
    `Cyber relevance: ${record.cyberRelevance}`,
    `C2 boundary: ${record.c2Boundary}`,
    `Memory scope: ${record.memoryScope}`,
    `Persistence mode: ${record.persistenceMode}`,
    `Persistence boundary: ${record.persistenceBoundary}`,
    `EVT required: ${record.evtRequired}`,
    `OPC required: ${record.opcRequired}`,
    `Audit required: ${record.auditRequired}`,
    `EVT ref: ${record.evtRef ?? "none"}`,
    `OPC ref: ${record.opcRef ?? "none"}`,
    `Memory ref: ${record.memoryRef ?? "none"}`,
    `Allowed: ${record.allowed}`,
    `Fail closed: ${record.failClosed}`,
    `Blocked: ${record.blocked}`,
    `Legal certification: ${record.legalCertification}`,
    `Reason: ${record.reason}`,
    `Boundary: ${record.boundary}`
  ].join("\n");
}


export function getRuntimeAuditLogHealth(): RuntimeAuditLogHealth {
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
    recordsInProcessMemory: runtimeAuditProcessMemory.length,
    maxProcessMemoryRecords: MAX_PROCESS_MEMORY_AUDIT_RECORDS,
    legalCertification: false,
    boundary:
      "Runtime audit log is configured for PROCESS_MEMORY_MVP with DATABASE_PERSISTENT target when the HBCE database is configured and the async writer is used. Relational references remain inside payload JSONB until tenant/session/EVT/OPC ledger persistence is fully active, to avoid premature foreign key failures. Audit records support operational reconstruction only. legalCertification = false."
  };
}
