/**
 * AI JOKER-C2 OPC Proof Layer
 *
 * OPC = Operational Proof & Compliance Layer.
 *
 * This module creates verifiable operational proof records for AI JOKER-C2.
 *
 * OPC does not create legal certification by itself.
 * OPC creates an audit-oriented technical proof receipt that links:
 *
 * - IPR identity binding;
 * - runtime identity;
 * - cognitive engine metadata when available;
 * - EVT event continuity;
 * - EVT/IPR-bound memory when available;
 * - runtime state;
 * - runtime decision;
 * - project domain;
 * - HBCE module;
 * - policy reference;
 * - risk class;
 * - input hash;
 * - output hash;
 * - decision hash;
 * - event hash;
 * - engine hash when available;
 * - memory hash;
 * - previous proof hash;
 * - chain hash;
 * - audit status;
 * - verification status.
 *
 * Canonical project birth date:
 * - 2026-01-19
 *
 * Canonical monthly reference:
 * - UP-MESE-4
 *
 * Current operational synchronism:
 * - event family: UP-EVT
 * - human event: EVT-0016
 * - AI event: EVT-0016-AI
 * - cycle: UP-CANONICO
 *
 * SaaS target:
 * - DATABASE_PERSISTENT
 *
 * Canonical formula:
 *
 * OpenAI provides the cognitive engine.
 * IPR binds the identity.
 * EVT traces the event.
 * Memory preserves runtime continuity.
 * OPC produces the proof receipt.
 * Ledger preserves the chain.
 * MATRIX organizes the HBCE stack.
 * Verification reconstructs the operation.
 */

import { createHash, randomUUID } from "node:crypto";

import {
  isHbceDatabaseAvailable,
  isHbceDatabaseConfigured,
  queryHbceDatabase
} from "./ipr-database";

import type {
  HbceDatabaseQueryRow,
  HbceDatabaseQueryValue
} from "./ipr-database";

export type OpcProofKind = "OPERATIONAL_PROOF_RECORD";

export type OpcVerificationStatus =
  | "VERIFIABLE"
  | "PARTIAL"
  | "INVALID"
  | "UNVERIFIED"
  | "ANCHORED"
  | "SUPERSEDED"
  | "DISPUTED";

export type OpcAuditStatus =
  | "NOT_REQUIRED"
  | "READY"
  | "REQUIRED"
  | "OPEN"
  | "IN_REVIEW"
  | "REVIEWED"
  | "DISPUTED"
  | "LOCKED"
  | "REJECTED"
  | "CLOSED"
  | "FAILED";

export type OpcRuntimeState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "BLOCKED"
  | "INVALID"
  | "AUDIT_ONLY"
  | "MAINTENANCE";

export type OpcRuntimeDecision =
  | "ALLOW"
  | "AUDIT"
  | "DEGRADE"
  | "ESCALATE"
  | "BLOCK"
  | "NOOP";

export type OpcRiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED"
  | "UNKNOWN";

export type OpcProjectDomain =
  | "MATRIX"
  | "U.S.E."
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS"
  | "HBCE_ECOSISTEMA_AI"
  | "GENERAL"
  | "MULTI_DOMAIN";

export type OpcHbceModule =
  | "UNEBDO"
  | "OPC"
  | "MetaExchange"
  | "IOspace"
  | "CyberGlobal"
  | "NeuroLoop"
  | "MATRIX"
  | "NONE";

export type OpcRuntimeRole =
  | "IPR_RUNTIME_DEMONSTRATOR"
  | "HBCE_governed_runtime"
  | "GOVERNED_AI_RUNTIME"
  | "AUDIT_RUNTIME"
  | "RESEARCH_PROTOTYPE";

export type OpcMemorySource =
  | "NONE"
  | "SESSION"
  | "EVT_IPR_MEMORY"
  | "IPR_BOUND_MEMORY"
  | "LEDGER"
  | "USER_FILE"
  | "RUNTIME_CONTEXT";

export type OpcProofPersistenceMode =
  | "RUNTIME_ONLY"
  | "PROCESS_PROOF_MVP"
  | "DATABASE_READY"
  | "DATABASE_PERSISTENT"
  | "EXTERNAL_ADAPTER";

export type OpcProofPersistenceStatus =
  | "NOT_PERSISTED"
  | "PROCESS_SCOPED"
  | "DATABASE_CONTRACT_READY"
  | "DATABASE_PERSISTENT_REQUIRED"
  | "DATABASE_PERSISTENT_ACTIVE"
  | "EXTERNAL_ADAPTER_REQUIRED";

export type OpcEngineProvider = "OpenAI" | string;
export type OpcEngineApiMode = "chat.completions" | "responses" | string;
export type OpcEngineRole = "cognitive_engine" | string;
export type OpcGovernedRuntimeRole = "HBCE_governed_runtime" | string;
export type OpcEngineMode = "standard" | "deep" | string;

export type OpcEngineSnapshot = {
  provider: OpcEngineProvider;
  apiMode: OpcEngineApiMode;
  role: OpcEngineRole;
  runtimeRole: OpcGovernedRuntimeRole;
  modelUsed: string;
  standardModel?: string;
  deepModel?: string;
  mode?: OpcEngineMode;
  configured?: boolean;
  projectBirthDate?: string;
  projectBirthLabel?: string;
};

export type OpcHashAlgorithm = "sha256";
export type OpcCanonicalization = "deterministic-json";

export type OpcIdentityBinding = {
  entity: string;
  ipr: string;
  core?: string;
  organization?: string;
  runtimeRole?: OpcRuntimeRole;
};

export type OpcEventReference = {
  evt: string;
  prev: string;
  hash: string;
  kind?: string;
};

export type OpcMemoryReference = {
  evt?: string;
  source?: OpcMemorySource | string;
  hash?: string;
  memoryId?: string;
  memoryKeyHash?: string;
  scope?: string;
  authority?: string;
  persistenceMode?: string;
};

export type OpcRuntimeSnapshot = {
  state: OpcRuntimeState;
  decision: OpcRuntimeDecision;
  contextClass: string;
  intentClass?: string;
  projectDomain?: OpcProjectDomain;
  hbceModule?: OpcHbceModule;
  riskClass: OpcRiskClass;
  policyReference: string;
  policyOutcome?: string;
  humanOversight?: string;
  operationType?: string;
  operationStatus?: string;
  failClosed?: boolean;
};

export type OpcProofHashes = {
  inputHash: string;
  outputHash: string;
  decisionHash: string;
  eventHash: string;
  engineHash?: string;
  memoryHash?: string;
  previousProofHash?: string | null;
  chainHash: string;
};

export type OpcAuditFrame = {
  status: OpcAuditStatus;
  reviewRequired: boolean;
  reviewerRole?: string;
  reasons: string[];
};

export type OpcOperationalContext = {
  projectBirthDate: string;
  projectBirthLabel: string;
  monthlyReference: "UP-MESE-4" | string;
  eventFamily: "UP-EVT" | string;
  currentHumanEvt: "EVT-0016" | string;
  currentAiEvt: "EVT-0016-AI" | string;
  cycle: "UP-CANONICO" | string;
  saasTarget: "DATABASE_PERSISTENT" | string;
};

export type OpcPersistenceFrame = {
  mode: OpcProofPersistenceMode;
  status: OpcProofPersistenceStatus;
  durable: boolean;
  runtimeScoped: boolean;
  databaseRequired: boolean;
  target: "DATABASE_PERSISTENT";
  statement: string;
};

export type OpcProofRecord = {
  proofId: string;
  kind: OpcProofKind;
  timestamp: string;
  identity: OpcIdentityBinding;
  sessionId?: string;
  engine?: OpcEngineSnapshot;
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
  operationalContext?: OpcOperationalContext;
  persistence?: OpcPersistenceFrame;
  proof: OpcProofHashes;
  audit: OpcAuditFrame;
  verification: {
    status: OpcVerificationStatus;
    hashAlgorithm: OpcHashAlgorithm;
    canonicalization: OpcCanonicalization;
  };
  boundary: {
    legalCertification: false;
    statement: string;
    aiGovernanceBoundary?: string;
    moduleBoundary?: string;
    persistenceBoundary?: string;
  };
};

export type OpcProofRecordInput = {
  identity: OpcIdentityBinding;
  sessionId?: string;
  engine?: Partial<OpcEngineSnapshot>;
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
  inputPayload: unknown;
  outputPayload: unknown;
  previousProofHash?: string | null;
  audit?: Partial<OpcAuditFrame>;
  timestamp?: string;
  operationalContext?: Partial<OpcOperationalContext>;
  persistenceMode?: OpcProofPersistenceMode;
};

export type OpcProofPublicView = {
  proofId: string;
  timestamp: string;
  entity: string;
  ipr: string;
  runtimeRole?: OpcRuntimeRole;
  sessionId?: string;
  engine?: OpcEngineSnapshot;
  engineHash?: string;
  eventId: string;
  eventHash: string;
  memoryEventId?: string;
  memoryHash?: string;
  projectDomain?: OpcProjectDomain;
  hbceModule?: OpcHbceModule;
  state: OpcRuntimeState;
  decision: OpcRuntimeDecision;
  riskClass: OpcRiskClass;
  policyReference: string;
  inputHash: string;
  outputHash: string;
  decisionHash: string;
  proofEventHash: string;
  previousProofHash?: string | null;
  chainHash: string;
  auditStatus: OpcAuditStatus;
  reviewRequired: boolean;
  verificationStatus: OpcVerificationStatus;
  operationalContext?: OpcOperationalContext;
  persistence?: OpcPersistenceFrame;
  legalCertification: false;
};

export type OpcProofVerificationReport = {
  status: OpcVerificationStatus;
  proofId: string;
  hashMatches: boolean;
  structurallyValid: boolean;
  missingFields: string[];
  expectedChainHash: string;
  actualChainHash: string;
  reasons: string[];
};

export type OpcProofSaasReadinessReport = {
  proofId: string;
  saasReady: boolean;
  persistenceMode: OpcProofPersistenceMode;
  persistenceStatus: OpcProofPersistenceStatus;
  databasePersistentRequired: boolean;
  legalCertification: false;
  reasons: string[];
  requirements: string[];
};

export type OpcProofDatabasePersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_CONFIGURED"
  | "DATABASE_NOT_AVAILABLE"
  | "DATABASE_TABLE_MISSING"
  | "DATABASE_SCHEMA_UNSUPPORTED"
  | "DATABASE_WRITE_FAILED";

export type OpcProofDatabasePersistenceMode =
  | "PROCESS_PROOF_MVP"
  | "DATABASE_PERSISTENT_TARGET"
  | "DATABASE_PERSISTENT"
  | "FAILED";

export type OpcProofDatabasePersistenceResult = {
  ok: boolean;
  status: OpcProofDatabasePersistenceStatus;
  mode: OpcProofDatabasePersistenceMode;
  proofId: string;
  proofHash: string;
  chainHash: string;
  evtId: string;
  table: string;
  writtenColumns: string[];
  error: string | null;
  legalCertification: false;
};

export type OpcProofDatabaseHealth = {
  configured: true;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
  databaseTable: typeof OPC_DATABASE_TABLE;
  databaseTarget: "DATABASE_PERSISTENT";
  legalCertification: false;
  boundary: string;
};

type OpcProofDatabaseFields = {
  proofId: string;
  proofHash: string;
  chainHash: string;
  previousProofHash: string | null;
  evtId: string;
  evtHash: string;
  runtimeIpr: string;
  humanIpr: string | null;
  sessionId: string | null;
  memoryId: string | null;
  memoryHash: string | null;
  runtimeState: string | null;
  runtimeDecision: string | null;
  riskClass: string | null;
  projectDomain: string | null;
  hbceModule: string | null;
  auditStatus: string | null;
  verificationStatus: string | null;
  payloadJson: string;
  publicPayloadJson: string;
  legalCertification: false;
};

type OpcProofColumnValue = {
  column: string;
  value: HbceDatabaseQueryValue;
  jsonb?: boolean;
};

type InformationSchemaColumnRow = HbceDatabaseQueryRow & {
  column_name?: string;
};

type OpcProofDatabaseRow = HbceDatabaseQueryRow & {
  proof_id?: string;
  opc_proof_id?: string;
  proof_hash?: string;
  chain_hash?: string;
};

const OPC_KIND: OpcProofKind = "OPERATIONAL_PROOF_RECORD";
const HASH_ALGORITHM: OpcHashAlgorithm = "sha256";
const CANONICALIZATION: OpcCanonicalization = "deterministic-json";

const DEFAULT_CORE = "HBCE-CORE-v3";
const DEFAULT_ORGANIZATION = "HERMETICUM B.C.E. S.r.l.";
const DEFAULT_RUNTIME_ROLE: OpcRuntimeRole = "HBCE_governed_runtime";

const DEFAULT_ENGINE_PROVIDER = "OpenAI";
const DEFAULT_ENGINE_API_MODE = "chat.completions";
const DEFAULT_ENGINE_ROLE = "cognitive_engine";
const DEFAULT_ENGINE_RUNTIME_ROLE = "HBCE_governed_runtime";
const DEFAULT_ENGINE_MODEL = "gpt-5.5";

const DEFAULT_PROJECT_BIRTH_DATE = "2026-01-19";
const DEFAULT_PROJECT_BIRTH_LABEL =
  "HBCE R&D / AI JOKER-C2 project birth date";

const DEFAULT_MONTHLY_REFERENCE = "UP-MESE-4";
const DEFAULT_EVENT_FAMILY = "UP-EVT";
const DEFAULT_CURRENT_HUMAN_EVT = "EVT-0016";
const DEFAULT_CURRENT_AI_EVT = "EVT-0016-AI";
const DEFAULT_CURRENT_CYCLE = "UP-CANONICO";
const DEFAULT_SAAS_TARGET = "DATABASE_PERSISTENT";

export const OPC_DATABASE_TABLE = "opc_proofs";

const NON_CERTIFICATION_STATEMENT =
  "OPC is a technical proof receipt for audit, verification and governance review. It does not create automatic legal certification, regulatory approval, institutional recognition or legally binding evidence status by default.";

const AI_GOVERNANCE_BOUNDARY =
  "The AI model does not govern HBCE. HBCE governs the use of AI models.";

const MODULE_BOUNDARY =
  "HBCE modules are technical-operational stack functions. They are not book collections and they are not automatic legal authority.";

const OPC_PERSISTENCE_BOUNDARY =
  "OPC proof records are technical proof receipts. For SaaS use, OPC records require DATABASE_PERSISTENT storage, tenant/workspace scoping, access control, audit logging, retention, deletion, backup and recovery. Process-scoped proof handling is MVP-only.";

const OPC_SAAS_REQUIREMENTS = [
  "Persist OPC proof records in DATABASE_PERSISTENT storage.",
  "Link each proof to identity, session, EVT, memory and runtime decision.",
  "Preserve previousProofHash and chainHash continuity.",
  "Expose public proof view without leaking sensitive payloads.",
  "Keep input/output payloads hashed, not publicly exposed by default.",
  "Maintain legalCertification=false.",
  "Add tenant and workspace scoping before enterprise SaaS use.",
  "Add access control, audit logging, retention, deletion, backup and recovery before production use."
];

const NO_OPC_DATABASE_COLUMNS: string[] = [];

export function createOpcProofRecord(
  input: OpcProofRecordInput
): OpcProofRecord {
  const timestamp = input.timestamp || new Date().toISOString();
  const proofId = buildOpcProofId(timestamp);
  const identity = normalizeIdentity(input.identity);
  const runtime = normalizeRuntimeSnapshot(input.runtime);
  const engine = normalizeEngineSnapshot(input.engine);
  const operationalContext = normalizeOperationalContext(input.operationalContext);
  const persistence = normalizePersistenceFrame(input.persistenceMode);

  const inputHash = sha256Canonical({
    type: "input",
    payload: input.inputPayload
  });

  const outputHash = sha256Canonical({
    type: "output",
    payload: input.outputPayload
  });

  const decisionHash = sha256Canonical({
    type: "decision",
    runtime
  });

  const eventHash = sha256Canonical({
    type: "event",
    event: input.event
  });

  const engineHash = sha256Canonical({
    type: "engine",
    engine
  });

  const memoryHash = input.memory
    ? sha256Canonical({
        type: "memory",
        memory: input.memory
      })
    : undefined;

  const previousProofHash = normalizePreviousProofHash(
    input.previousProofHash
  );

  const chainHash = buildOpcChainHash({
    proofId,
    timestamp,
    identity,
    sessionId: input.sessionId,
    engine,
    event: input.event,
    memory: input.memory,
    runtime,
    operationalContext,
    persistence,
    inputHash,
    outputHash,
    decisionHash,
    eventHash,
    engineHash,
    memoryHash,
    previousProofHash
  });

  const audit = normalizeAuditFrame(input.audit, runtime, engine, persistence);

  return {
    proofId,
    kind: OPC_KIND,
    timestamp,
    identity,
    sessionId: input.sessionId,
    engine,
    event: input.event,
    memory: input.memory,
    runtime,
    operationalContext,
    persistence,
    proof: {
      inputHash,
      outputHash,
      decisionHash,
      eventHash,
      engineHash,
      memoryHash,
      previousProofHash,
      chainHash
    },
    audit,
    verification: {
      status: "VERIFIABLE",
      hashAlgorithm: HASH_ALGORITHM,
      canonicalization: CANONICALIZATION
    },
    boundary: {
      legalCertification: false,
      statement: NON_CERTIFICATION_STATEMENT,
      aiGovernanceBoundary: AI_GOVERNANCE_BOUNDARY,
      moduleBoundary: MODULE_BOUNDARY,
      persistenceBoundary: OPC_PERSISTENCE_BOUNDARY
    }
  };
}

export function verifyOpcProofRecord(
  record: OpcProofRecord
): OpcProofVerificationReport {
  const missingFields = getOpcProofRecordMissingFields(record);
  const structurallyValid = missingFields.length === 0;

  if (!structurallyValid) {
    return {
      status: "INVALID",
      proofId: record.proofId || "UNKNOWN_OPC_PROOF",
      hashMatches: false,
      structurallyValid: false,
      missingFields,
      expectedChainHash: "",
      actualChainHash: record.proof?.chainHash || "",
      reasons: [
        "OPC proof record is structurally invalid.",
        ...missingFields.map((field) => `Missing field: ${field}`)
      ]
    };
  }

  const previousProofHash = normalizePreviousProofHash(
    record.proof.previousProofHash
  );

  const normalizedEngine = record.engine
    ? normalizeEngineSnapshot(record.engine)
    : undefined;

  const expectedEngineHash = normalizedEngine
    ? sha256Canonical({
        type: "engine",
        engine: normalizedEngine
      })
    : undefined;

  const storedEngineHash = record.proof.engineHash;

  const engineHashMatches =
    !normalizedEngine ||
    !storedEngineHash ||
    storedEngineHash === expectedEngineHash;

  const normalizedOperationalContext = record.operationalContext
    ? normalizeOperationalContext(record.operationalContext)
    : undefined;

  const normalizedPersistence = record.persistence
    ? normalizePersistenceFrame(record.persistence.mode)
    : undefined;

  const expectedChainHash = buildOpcChainHash({
    proofId: record.proofId,
    timestamp: record.timestamp,
    identity: normalizeIdentity(record.identity),
    sessionId: record.sessionId,
    engine: normalizedEngine,
    event: record.event,
    memory: record.memory,
    runtime: normalizeRuntimeSnapshot(record.runtime),
    operationalContext: normalizedOperationalContext,
    persistence: normalizedPersistence,
    inputHash: record.proof.inputHash,
    outputHash: record.proof.outputHash,
    decisionHash: record.proof.decisionHash,
    eventHash: record.proof.eventHash,
    engineHash: storedEngineHash,
    memoryHash: record.proof.memoryHash,
    previousProofHash
  });

  const chainHashMatches = expectedChainHash === record.proof.chainHash;
  const hashMatches = chainHashMatches && engineHashMatches;

  return {
    status: hashMatches ? "VERIFIABLE" : "INVALID",
    proofId: record.proofId,
    hashMatches,
    structurallyValid,
    missingFields: [],
    expectedChainHash,
    actualChainHash: record.proof.chainHash,
    reasons: hashMatches
      ? [
          "OPC proof record chain hash is valid.",
          record.engine
            ? "Cognitive engine metadata is present in the proof record."
            : "Cognitive engine metadata is not present; record is treated as legacy-compatible.",
          record.operationalContext
            ? "Operational synchronism context is present in the proof record."
            : "Operational synchronism context is not present; record is treated as legacy-compatible.",
          record.persistence
            ? `Persistence frame is present: ${record.persistence.mode}.`
            : "Persistence frame is not present; record is treated as legacy-compatible.",
          "The record is technically verifiable as an audit-oriented proof receipt.",
          NON_CERTIFICATION_STATEMENT
        ]
      : [
          "OPC proof record chain hash or engine hash does not match.",
          "The record may have been modified after creation or generated with a different previousProofHash, engineHash, operationalContext or persistence frame."
        ]
  };
}

export function toPublicOpcProofRecord(
  record: OpcProofRecord
): OpcProofPublicView {
  return {
    proofId: record.proofId,
    timestamp: record.timestamp,
    entity: record.identity.entity,
    ipr: record.identity.ipr,
    runtimeRole: record.identity.runtimeRole,
    sessionId: record.sessionId,
    engine: record.engine,
    engineHash: record.proof.engineHash,
    eventId: record.event.evt,
    eventHash: record.event.hash,
    memoryEventId: record.memory?.evt,
    memoryHash: record.proof.memoryHash,
    projectDomain: record.runtime.projectDomain,
    hbceModule: record.runtime.hbceModule,
    state: record.runtime.state,
    decision: record.runtime.decision,
    riskClass: record.runtime.riskClass,
    policyReference: record.runtime.policyReference,
    inputHash: record.proof.inputHash,
    outputHash: record.proof.outputHash,
    decisionHash: record.proof.decisionHash,
    proofEventHash: record.proof.eventHash,
    previousProofHash: record.proof.previousProofHash || null,
    chainHash: record.proof.chainHash,
    auditStatus: record.audit.status,
    reviewRequired: record.audit.reviewRequired,
    verificationStatus: record.verification.status,
    operationalContext: record.operationalContext,
    persistence: record.persistence,
    legalCertification: false
  };
}

export function buildOpcProofRecordLine(record: OpcProofRecord): string {
  return JSON.stringify(record);
}

export function parseOpcProofRecordLine(line: string): OpcProofRecord | null {
  try {
    const parsed = JSON.parse(line) as OpcProofRecord;

    if (!isOpcProofRecordStructurallyValid(parsed)) {
      return null;
    }

    return normalizeOpcProofRecord(parsed);
  } catch {
    return null;
  }
}

export function isOpcProofRecordStructurallyValid(
  record: Partial<OpcProofRecord>
): record is OpcProofRecord {
  return getOpcProofRecordMissingFields(record).length === 0;
}

export function getOpcProofRecordMissingFields(
  record: Partial<OpcProofRecord>
): string[] {
  const missing: string[] = [];

  if (!record.proofId) missing.push("proofId");
  if (record.kind !== OPC_KIND) missing.push("kind");
  if (!record.timestamp) missing.push("timestamp");

  if (!record.identity?.entity) missing.push("identity.entity");
  if (!record.identity?.ipr) missing.push("identity.ipr");

  if (record.engine) {
    if (!record.engine.provider) missing.push("engine.provider");
    if (!record.engine.apiMode) missing.push("engine.apiMode");
    if (!record.engine.role) missing.push("engine.role");
    if (!record.engine.runtimeRole) missing.push("engine.runtimeRole");
    if (!record.engine.modelUsed) missing.push("engine.modelUsed");
  }

  if (!record.event?.evt) missing.push("event.evt");
  if (!record.event?.prev) missing.push("event.prev");
  if (!record.event?.hash) missing.push("event.hash");

  if (!record.runtime?.state) missing.push("runtime.state");
  if (!record.runtime?.decision) missing.push("runtime.decision");
  if (!record.runtime?.contextClass) missing.push("runtime.contextClass");
  if (!record.runtime?.riskClass) missing.push("runtime.riskClass");
  if (!record.runtime?.policyReference) {
    missing.push("runtime.policyReference");
  }

  if (!record.proof?.inputHash) missing.push("proof.inputHash");
  if (!record.proof?.outputHash) missing.push("proof.outputHash");
  if (!record.proof?.decisionHash) missing.push("proof.decisionHash");
  if (!record.proof?.eventHash) missing.push("proof.eventHash");
  if (!record.proof?.chainHash) missing.push("proof.chainHash");

  if (!record.audit?.status) missing.push("audit.status");

  if (typeof record.audit?.reviewRequired !== "boolean") {
    missing.push("audit.reviewRequired");
  }

  if (!Array.isArray(record.audit?.reasons)) {
    missing.push("audit.reasons");
  }

  if (!record.verification?.status) missing.push("verification.status");

  if (record.verification?.hashAlgorithm !== HASH_ALGORITHM) {
    missing.push("verification.hashAlgorithm");
  }

  if (record.verification?.canonicalization !== CANONICALIZATION) {
    missing.push("verification.canonicalization");
  }

  if (record.boundary?.legalCertification !== false) {
    missing.push("boundary.legalCertification");
  }

  return missing;
}

export function buildOpcSaasReadinessReport(
  record: OpcProofRecord
): OpcProofSaasReadinessReport {
  const persistence =
    record.persistence || normalizePersistenceFrame("RUNTIME_ONLY");

  const databasePersistentRequired =
    persistence.mode !== "DATABASE_PERSISTENT" ||
    persistence.status !== "DATABASE_PERSISTENT_ACTIVE";

  const verification = verifyOpcProofRecord(record);

  const saasReady =
    verification.status === "VERIFIABLE" &&
    persistence.mode === "DATABASE_PERSISTENT" &&
    persistence.status === "DATABASE_PERSISTENT_ACTIVE" &&
    persistence.durable === true &&
    persistence.runtimeScoped === false &&
    record.boundary.legalCertification === false;

  return {
    proofId: record.proofId,
    saasReady,
    persistenceMode: persistence.mode,
    persistenceStatus: persistence.status,
    databasePersistentRequired,
    legalCertification: false,
    reasons: [
      saasReady
        ? "OPC proof record is SaaS-ready under DATABASE_PERSISTENT mode."
        : "OPC proof record is not yet SaaS-ready.",
      `Verification status: ${verification.status}.`,
      `Persistence mode: ${persistence.mode}.`,
      `Persistence status: ${persistence.status}.`,
      `Durable: ${persistence.durable ? "true" : "false"}.`,
      `Runtime scoped: ${persistence.runtimeScoped ? "true" : "false"}.`,
      NON_CERTIFICATION_STATEMENT
    ],
    requirements: saasReady ? [] : OPC_SAAS_REQUIREMENTS
  };
}

export function sha256Canonical(value: unknown): string {
  const canonical = canonicalize(value);
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

  return `sha256:${hash}`;
}

export function sha256Short(value: unknown): string {
  const canonical = canonicalize(value);
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

  return `sha256:${hash.slice(0, 16)}`;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

export async function persistOpcProofRecordToDatabase(
  record: OpcProofRecord
): Promise<OpcProofDatabasePersistenceResult> {
  const normalized = normalizeOpcProofRecord(record);
  const fields = buildOpcProofDatabaseFields(normalized);

  if (!isHbceDatabaseConfigured()) {
    return {
      ok: false,
      status: "DATABASE_NOT_CONFIGURED",
      mode: "PROCESS_PROOF_MVP",
      proofId: fields.proofId,
      proofHash: fields.proofHash,
      chainHash: fields.chainHash,
      evtId: fields.evtId,
      table: OPC_DATABASE_TABLE,
      writtenColumns: [],
      error: "DATABASE_URL is not configured. OPC proof remains process/runtime scoped.",
      legalCertification: false
    };
  }

  if (!isHbceDatabaseAvailable()) {
    return {
      ok: false,
      status: "DATABASE_NOT_AVAILABLE",
      mode: "PROCESS_PROOF_MVP",
      proofId: fields.proofId,
      proofHash: fields.proofHash,
      chainHash: fields.chainHash,
      evtId: fields.evtId,
      table: OPC_DATABASE_TABLE,
      writtenColumns: [],
      error: "HBCE database adapter is not available. OPC proof remains process/runtime scoped.",
      legalCertification: false
    };
  }

  try {
    const available = await getOpcProofDatabaseColumns();

    if (available.size === 0) {
      return {
        ok: false,
        status: "DATABASE_TABLE_MISSING",
        mode: "PROCESS_PROOF_MVP",
        proofId: fields.proofId,
        proofHash: fields.proofHash,
        chainHash: fields.chainHash,
        evtId: fields.evtId,
        table: OPC_DATABASE_TABLE,
        writtenColumns: [],
        error: "opc_proofs table was not found in the active database schema.",
        legalCertification: false
      };
    }

    const columnValues = buildOpcProofDatabaseColumnValues(available, fields);
    const statement = buildOpcProofInsertStatement({ columns: columnValues });

    const result = await queryHbceDatabase<OpcProofDatabaseRow>(
      statement.sql,
      statement.params
    );

    if (!result.ok) {
      return {
        ok: false,
        status: "DATABASE_WRITE_FAILED",
        mode: "FAILED",
        proofId: fields.proofId,
        proofHash: fields.proofHash,
        chainHash: fields.chainHash,
        evtId: fields.evtId,
        table: OPC_DATABASE_TABLE,
        writtenColumns: statement.writtenColumns,
        error: result.error || "OPC_PROOF_DATABASE_WRITE_FAILED",
        legalCertification: false
      };
    }

    return {
      ok: true,
      status: "PERSISTED",
      mode: "DATABASE_PERSISTENT",
      proofId: fields.proofId,
      proofHash: fields.proofHash,
      chainHash: fields.chainHash,
      evtId: fields.evtId,
      table: OPC_DATABASE_TABLE,
      writtenColumns: statement.writtenColumns,
      error: null,
      legalCertification: false
    };
  } catch (error) {
    return {
      ok: false,
      status: "DATABASE_WRITE_FAILED",
      mode: "FAILED",
      proofId: fields.proofId,
      proofHash: fields.proofHash,
      chainHash: fields.chainHash,
      evtId: fields.evtId,
      table: OPC_DATABASE_TABLE,
      writtenColumns: [],
      error: safeDatabaseError(error),
      legalCertification: false
    };
  }
}

export async function createAndPersistOpcProofRecord(
  input: OpcProofRecordInput
): Promise<{
  record: OpcProofRecord;
  publicView: OpcProofPublicView;
  persistence: OpcProofDatabasePersistenceResult;
  legalCertification: false;
}> {
  const record = createOpcProofRecord({
    ...input,
    persistenceMode: input.persistenceMode ?? "DATABASE_READY"
  });

  const persistence = await persistOpcProofRecordToDatabase(record);

  const persistedRecord =
    persistence.ok && record.persistence
      ? {
          ...record,
          persistence: normalizePersistenceFrame("DATABASE_PERSISTENT")
        }
      : record;

  return {
    record: persistedRecord,
    publicView: toPublicOpcProofRecord(persistedRecord),
    persistence,
    legalCertification: false
  };
}

export function getOpcProofDatabaseHealth(): OpcProofDatabaseHealth {
  const databaseConfigured = isHbceDatabaseConfigured();
  const databaseAvailable = isHbceDatabaseAvailable();

  return {
    configured: true,
    databaseConfigured,
    databaseAvailable,
    databaseTable: OPC_DATABASE_TABLE,
    databaseTarget: "DATABASE_PERSISTENT",
    legalCertification: false,
    boundary:
      databaseConfigured && databaseAvailable
        ? "OPC proof database writer is configured with DATABASE_PERSISTENT target opc_proofs. runtime_ipr is written as required runtime identity; biological IPR references remain payload-first while the full tenant/session/EVT/memory/IPR subject chain is being activated. OPC is technical proof only; legalCertification=false."
        : "OPC proof database writer is not fully active. Proof records remain process/runtime scoped unless DATABASE_PERSISTENT storage is configured and available. OPC is technical proof only; legalCertification=false."
  };
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortCanonical(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const item = record[key];

        if (typeof item !== "undefined") {
          accumulator[key] = sortCanonical(item);
        }

        return accumulator;
      }, {});
  }

  return value;
}

function buildOpcProofId(timestamp = new Date().toISOString()): string {
  const compactTimestamp = timestamp
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  return `OPC-${compactTimestamp}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)}`.toUpperCase();
}

function buildOpcChainHash(input: {
  proofId: string;
  timestamp: string;
  identity: OpcIdentityBinding;
  sessionId?: string;
  engine?: OpcEngineSnapshot;
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
  operationalContext?: OpcOperationalContext;
  persistence?: OpcPersistenceFrame;
  inputHash: string;
  outputHash: string;
  decisionHash: string;
  eventHash: string;
  engineHash?: string;
  memoryHash?: string;
  previousProofHash?: string | null;
}): string {
  const previousProofHash = normalizePreviousProofHash(
    input.previousProofHash
  );

  const hashes: Record<string, string | null> = {
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    decisionHash: input.decisionHash,
    eventHash: input.eventHash,
    memoryHash: input.memoryHash || null,
    previousProofHash
  };

  if (input.engineHash) {
    hashes.engineHash = input.engineHash;
  }

  const chainPayload: Record<string, unknown> = {
    proofId: input.proofId,
    timestamp: input.timestamp,
    identity: normalizeIdentity(input.identity),
    sessionId: input.sessionId || null,
    event: input.event,
    memory: input.memory || null,
    runtime: normalizeRuntimeSnapshot(input.runtime),
    hashes,
    boundary: {
      legalCertification: false
    },
    algorithm: HASH_ALGORITHM,
    canonicalization: CANONICALIZATION
  };

  if (input.engine) {
    chainPayload.engine = normalizeEngineSnapshot(input.engine);
  }

  if (input.operationalContext) {
    chainPayload.operationalContext = normalizeOperationalContext(
      input.operationalContext
    );
  }

  if (input.persistence) {
    chainPayload.persistence = normalizePersistenceFrame(input.persistence.mode);
  }

  return sha256Canonical(chainPayload);
}

function normalizeIdentity(identity: OpcIdentityBinding): OpcIdentityBinding {
  return {
    entity: identity.entity,
    ipr: identity.ipr,
    core: identity.core || DEFAULT_CORE,
    organization: identity.organization || DEFAULT_ORGANIZATION,
    runtimeRole: identity.runtimeRole || DEFAULT_RUNTIME_ROLE
  };
}

function normalizeOperationalContext(
  context?: Partial<OpcOperationalContext>
): OpcOperationalContext {
  return {
    projectBirthDate:
      stringOrDefault(context?.projectBirthDate, DEFAULT_PROJECT_BIRTH_DATE) ||
      DEFAULT_PROJECT_BIRTH_DATE,
    projectBirthLabel:
      stringOrDefault(context?.projectBirthLabel, DEFAULT_PROJECT_BIRTH_LABEL) ||
      DEFAULT_PROJECT_BIRTH_LABEL,
    monthlyReference:
      stringOrDefault(context?.monthlyReference, DEFAULT_MONTHLY_REFERENCE) ||
      DEFAULT_MONTHLY_REFERENCE,
    eventFamily:
      stringOrDefault(context?.eventFamily, DEFAULT_EVENT_FAMILY) ||
      DEFAULT_EVENT_FAMILY,
    currentHumanEvt:
      stringOrDefault(context?.currentHumanEvt, DEFAULT_CURRENT_HUMAN_EVT) ||
      DEFAULT_CURRENT_HUMAN_EVT,
    currentAiEvt:
      stringOrDefault(context?.currentAiEvt, DEFAULT_CURRENT_AI_EVT) ||
      DEFAULT_CURRENT_AI_EVT,
    cycle:
      stringOrDefault(context?.cycle, DEFAULT_CURRENT_CYCLE) ||
      DEFAULT_CURRENT_CYCLE,
    saasTarget:
      stringOrDefault(context?.saasTarget, DEFAULT_SAAS_TARGET) ||
      DEFAULT_SAAS_TARGET
  };
}

function normalizePersistenceFrame(
  mode?: OpcProofPersistenceMode
): OpcPersistenceFrame {
  const persistenceMode = mode || "PROCESS_PROOF_MVP";

  if (persistenceMode === "DATABASE_PERSISTENT") {
    return {
      mode: "DATABASE_PERSISTENT",
      status: "DATABASE_PERSISTENT_ACTIVE",
      durable: true,
      runtimeScoped: false,
      databaseRequired: true,
      target: "DATABASE_PERSISTENT",
      statement:
        "OPC proof receipt is declared under DATABASE_PERSISTENT mode. This requires real durable storage, audit logging, access control, retention, deletion, backup and recovery."
    };
  }

  if (persistenceMode === "DATABASE_READY") {
    return {
      mode: "DATABASE_READY",
      status: "DATABASE_CONTRACT_READY",
      durable: false,
      runtimeScoped: false,
      databaseRequired: true,
      target: "DATABASE_PERSISTENT",
      statement:
        "OPC proof contract is prepared for database persistence, but durable DATABASE_PERSISTENT storage is not active yet."
    };
  }

  if (persistenceMode === "EXTERNAL_ADAPTER") {
    return {
      mode: "EXTERNAL_ADAPTER",
      status: "EXTERNAL_ADAPTER_REQUIRED",
      durable: false,
      runtimeScoped: false,
      databaseRequired: false,
      target: "DATABASE_PERSISTENT",
      statement:
        "OPC proof contract expects an external adapter. The adapter must preserve HBCE proof boundaries and legalCertification=false."
    };
  }

  if (persistenceMode === "RUNTIME_ONLY") {
    return {
      mode: "RUNTIME_ONLY",
      status: "NOT_PERSISTED",
      durable: false,
      runtimeScoped: true,
      databaseRequired: true,
      target: "DATABASE_PERSISTENT",
      statement:
        "OPC proof receipt exists only in runtime response scope. It is not durable SaaS proof storage."
    };
  }

  return {
    mode: "PROCESS_PROOF_MVP",
    status: "PROCESS_SCOPED",
    durable: false,
    runtimeScoped: true,
    databaseRequired: true,
    target: "DATABASE_PERSISTENT",
    statement:
      "OPC proof receipt is process-scoped MVP proof handling. It may reset on redeploy, cold start, instance recycling or runtime migration."
  };
}

function normalizeEngineSnapshot(
  engine?: Partial<OpcEngineSnapshot>
): OpcEngineSnapshot {
  const standardModel =
    stringOrDefault(engine?.standardModel, process.env.JOKER_MODEL) ||
    DEFAULT_ENGINE_MODEL;

  const deepModel =
    stringOrDefault(engine?.deepModel, process.env.JOKER_DEEP_MODEL) ||
    DEFAULT_ENGINE_MODEL;

  const mode = stringOrDefault(engine?.mode, "deep") || "deep";

  const modelUsed =
    stringOrDefault(engine?.modelUsed, undefined) ||
    (mode === "standard" ? standardModel : deepModel);

  return {
    provider:
      stringOrDefault(engine?.provider, DEFAULT_ENGINE_PROVIDER) ||
      DEFAULT_ENGINE_PROVIDER,
    apiMode:
      stringOrDefault(engine?.apiMode, DEFAULT_ENGINE_API_MODE) ||
      DEFAULT_ENGINE_API_MODE,
    role:
      stringOrDefault(engine?.role, DEFAULT_ENGINE_ROLE) ||
      DEFAULT_ENGINE_ROLE,
    runtimeRole:
      stringOrDefault(engine?.runtimeRole, DEFAULT_ENGINE_RUNTIME_ROLE) ||
      DEFAULT_ENGINE_RUNTIME_ROLE,
    modelUsed,
    standardModel,
    deepModel,
    mode,
    configured:
      typeof engine?.configured === "boolean"
        ? engine.configured
        : Boolean(process.env.OPENAI_API_KEY),
    projectBirthDate:
      stringOrDefault(engine?.projectBirthDate, DEFAULT_PROJECT_BIRTH_DATE) ||
      DEFAULT_PROJECT_BIRTH_DATE,
    projectBirthLabel:
      stringOrDefault(engine?.projectBirthLabel, DEFAULT_PROJECT_BIRTH_LABEL) ||
      DEFAULT_PROJECT_BIRTH_LABEL
  };
}

function normalizeRuntimeSnapshot(
  runtime: OpcRuntimeSnapshot
): OpcRuntimeSnapshot {
  return {
    ...runtime,
    projectDomain: runtime.projectDomain || "GENERAL",
    hbceModule: runtime.hbceModule || inferHbceModuleForRuntime(runtime),
    failClosed:
      typeof runtime.failClosed === "boolean" ? runtime.failClosed : false
  };
}

function inferHbceModuleForRuntime(runtime: OpcRuntimeSnapshot): OpcHbceModule {
  if (runtime.projectDomain === "HBCE_ECOSISTEMA_AI") {
    return "MATRIX";
  }

  if (runtime.projectDomain === "U.S.E.") {
    return "UNEBDO";
  }

  if (
    runtime.contextClass === "SECURITY" ||
    runtime.contextClass === "CRITICAL_INFRASTRUCTURE" ||
    runtime.contextClass === "DUAL_USE"
  ) {
    return "CyberGlobal";
  }

  if (
    runtime.contextClass === "COMPLIANCE" ||
    runtime.contextClass === "GOVERNANCE" ||
    runtime.decision === "AUDIT"
  ) {
    return "OPC";
  }

  if (
    runtime.contextClass === "AI_GOVERNANCE" ||
    runtime.contextClass === "HBCE_ECOSISTEMA_AI"
  ) {
    return "MATRIX";
  }

  if (runtime.contextClass === "MATRIX") {
    return "MATRIX";
  }

  if (runtime.contextClass === "IPR" || runtime.contextClass === "IDENTITY") {
    return "UNEBDO";
  }

  return "NONE";
}

function normalizeOpcProofRecord(record: OpcProofRecord): OpcProofRecord {
  return {
    ...record,
    identity: normalizeIdentity(record.identity),
    engine: record.engine ? normalizeEngineSnapshot(record.engine) : undefined,
    runtime: normalizeRuntimeSnapshot(record.runtime),
    operationalContext: record.operationalContext
      ? normalizeOperationalContext(record.operationalContext)
      : undefined,
    persistence: record.persistence
      ? normalizePersistenceFrame(record.persistence.mode)
      : undefined,
    boundary: record.boundary || {
      legalCertification: false,
      statement: NON_CERTIFICATION_STATEMENT,
      aiGovernanceBoundary: AI_GOVERNANCE_BOUNDARY,
      moduleBoundary: MODULE_BOUNDARY,
      persistenceBoundary: OPC_PERSISTENCE_BOUNDARY
    }
  };
}

function normalizePreviousProofHash(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || trimmed.toUpperCase() === "GENESIS") {
    return null;
  }

  return trimmed;
}

function normalizeAuditFrame(
  audit: Partial<OpcAuditFrame> | undefined,
  runtime: OpcRuntimeSnapshot,
  engine?: OpcEngineSnapshot,
  persistence?: OpcPersistenceFrame
): OpcAuditFrame {
  const normalizedRuntime = normalizeRuntimeSnapshot(runtime);

  const reviewRequired =
    typeof audit?.reviewRequired === "boolean"
      ? audit.reviewRequired
      : inferReviewRequired(normalizedRuntime, persistence);

  return {
    status: audit?.status || inferAuditStatus(normalizedRuntime, reviewRequired),
    reviewRequired,
    reviewerRole:
      audit?.reviewerRole || inferReviewerRole(normalizedRuntime, reviewRequired),
    reasons: uniqueReasons([
      ...(audit?.reasons || []),
      ...buildAuditReasons(normalizedRuntime, reviewRequired, engine, persistence)
    ])
  };
}

function inferAuditStatus(
  runtime: OpcRuntimeSnapshot,
  reviewRequired: boolean
): OpcAuditStatus {
  if (runtime.decision === "BLOCK" || runtime.decision === "ESCALATE") {
    return "REQUIRED";
  }

  if (runtime.decision === "AUDIT" || reviewRequired) {
    return "READY";
  }

  if (runtime.riskClass === "MEDIUM" || runtime.riskClass === "HIGH") {
    return "READY";
  }

  if (runtime.riskClass === "CRITICAL" || runtime.riskClass === "UNKNOWN") {
    return "REQUIRED";
  }

  return "NOT_REQUIRED";
}

function inferReviewRequired(
  runtime: OpcRuntimeSnapshot,
  persistence?: OpcPersistenceFrame
): boolean {
  return (
    runtime.decision === "AUDIT" ||
    runtime.decision === "ESCALATE" ||
    runtime.decision === "BLOCK" ||
    runtime.riskClass === "MEDIUM" ||
    runtime.riskClass === "HIGH" ||
    runtime.riskClass === "CRITICAL" ||
    runtime.riskClass === "UNKNOWN" ||
    Boolean(persistence?.databaseRequired)
  );
}

function inferReviewerRole(
  runtime: OpcRuntimeSnapshot,
  reviewRequired: boolean
): string | undefined {
  if (!reviewRequired) {
    return undefined;
  }

  if (runtime.riskClass === "CRITICAL" || runtime.decision === "ESCALATE") {
    return "HUMAN_REVIEWER";
  }

  if (
    runtime.projectDomain === "U.S.E." ||
    runtime.contextClass === "USE" ||
    runtime.contextClass === "CIVIC" ||
    runtime.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
  ) {
    return "CIVIC_INFRASTRUCTURE_REVIEWER";
  }

  if (
    runtime.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    runtime.contextClass === "HBCE_ECOSISTEMA_AI" ||
    runtime.contextClass === "AI_GOVERNANCE"
  ) {
    return "AI_GOVERNANCE_REVIEWER";
  }

  if (
    runtime.hbceModule === "CyberGlobal" ||
    runtime.contextClass === "SECURITY"
  ) {
    return "SECURITY_REVIEWER";
  }

  if (
    runtime.hbceModule === "MATRIX" ||
    runtime.projectDomain === "MATRIX"
  ) {
    return "MATRIX_RUNTIME_REVIEWER";
  }

  if (runtime.decision === "AUDIT" || runtime.riskClass === "MEDIUM") {
    return "AUDITOR";
  }

  return "REVIEWER";
}

function buildAuditReasons(
  runtime: OpcRuntimeSnapshot,
  reviewRequired: boolean,
  engine?: OpcEngineSnapshot,
  persistence?: OpcPersistenceFrame
): string[] {
  const reasons = [
    `Runtime state: ${runtime.state}.`,
    `Runtime decision: ${runtime.decision}.`,
    `Risk class: ${runtime.riskClass}.`,
    `Policy reference: ${runtime.policyReference}.`
  ];

  if (engine) {
    reasons.push(`Cognitive engine provider: ${engine.provider}.`);
    reasons.push(`Cognitive engine model: ${engine.modelUsed}.`);
    reasons.push(`Cognitive engine API mode: ${engine.apiMode}.`);
    reasons.push(`Governed runtime role: ${engine.runtimeRole}.`);
    reasons.push(`Project birth date: ${engine.projectBirthDate}.`);
  }

  if (runtime.projectDomain) {
    reasons.push(`Project domain: ${runtime.projectDomain}.`);
  }

  if (runtime.hbceModule) {
    reasons.push(`HBCE module: ${runtime.hbceModule}.`);
  }

  if (persistence) {
    reasons.push(`OPC persistence mode: ${persistence.mode}.`);
    reasons.push(`OPC persistence status: ${persistence.status}.`);
    reasons.push(persistence.statement);
  }

  if (
    runtime.projectDomain === "U.S.E." ||
    runtime.contextClass === "USE" ||
    runtime.contextClass === "CIVIC" ||
    runtime.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
  ) {
    reasons.push(
      "Civic or democratic infrastructure context requires identity-choice separation and audit-oriented handling."
    );
  }

  if (
    runtime.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    runtime.contextClass === "HBCE_ECOSISTEMA_AI" ||
    runtime.contextClass === "AI_GOVERNANCE"
  ) {
    reasons.push(AI_GOVERNANCE_BOUNDARY);
  }

  if (runtime.hbceModule && runtime.hbceModule !== "NONE") {
    reasons.push(MODULE_BOUNDARY);
  }

  if (runtime.hbceModule === "MATRIX") {
    reasons.push(
      "MATRIX is active as the HBCE system coordination and organization module."
    );
  }

  if (reviewRequired) {
    reasons.push("Review is required or recommended by runtime governance.");
  } else {
    reasons.push("Review is not required for this proof record.");
  }

  reasons.push(OPC_PERSISTENCE_BOUNDARY);
  reasons.push(NON_CERTIFICATION_STATEMENT);

  return reasons;
}

function buildOpcProofDatabaseFields(record: OpcProofRecord): OpcProofDatabaseFields {
  const publicView = toPublicOpcProofRecord(record);
  const proofHash = sha256Canonical({
    type: "opc-proof-record",
    record
  });

  const runtimeIpr =
    nullableDatabaseText(record.identity.ipr) || "IPR-AI-0001";

  const humanIprForPayload = nullableDatabaseText(record.identity.ipr);

  const payload = {
    ...record,
    opcDatabasePersistence: {
      table: OPC_DATABASE_TABLE,
      proofHash,
      proofId: record.proofId,
      evtId: record.event.evt,
      evtHash: record.event.hash,
      chainHash: record.proof.chainHash,
      previousProofHash: record.proof.previousProofHash ?? null,
      runtimeIpr,
      humanIpr: humanIprForPayload,
      sessionId: record.sessionId ?? null,
      memoryId: record.memory?.memoryId ?? record.memory?.memoryKeyHash ?? null,
      memoryHash: record.proof.memoryHash ?? record.memory?.hash ?? null,
      projectDomain: record.runtime.projectDomain ?? null,
      hbceModule: record.runtime.hbceModule ?? null,
      persistenceBoundary:
        "runtime_ipr is written because the current database schema requires it. Biological IPR references remain payload-first/nullable until ipr_subjects, sessions and tenant/workspace ledgers are fully materialized.",
      legalCertification: false
    }
  };

  return {
    proofId: record.proofId,
    proofHash,
    chainHash: record.proof.chainHash,
    previousProofHash: record.proof.previousProofHash ?? null,
    evtId: record.event.evt,
    evtHash: record.event.hash,
    runtimeIpr,
    humanIpr: null,
    sessionId: nullableDatabaseText(record.sessionId),
    memoryId: nullableDatabaseText(record.memory?.memoryId ?? record.memory?.memoryKeyHash),
    memoryHash: nullableDatabaseText(record.proof.memoryHash ?? record.memory?.hash),
    runtimeState: normalizeDatabaseRuntimeState(record.runtime.state),
    runtimeDecision: normalizeDatabaseRuntimeDecision(record.runtime.decision),
    riskClass: normalizeDatabaseRiskClass(record.runtime.riskClass),
    projectDomain: nullableDatabaseText(record.runtime.projectDomain),
    hbceModule: nullableDatabaseText(record.runtime.hbceModule),
    auditStatus: normalizeDatabaseAuditStatus(record.audit.status),
    verificationStatus: normalizeDatabaseVerificationStatus(record.verification.status),
    payloadJson: JSON.stringify(payload),
    publicPayloadJson: JSON.stringify(publicView),
    legalCertification: false
  };
}

function nullableDatabaseText(value: unknown): string | null {
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
    normalized === "NULL" ||
    normalized === "UNKNOWN" ||
    normalized === "NOT_AVAILABLE" ||
    normalized === "NOT_VERIFIED" ||
    normalized === "NO_SESSION" ||
    normalized === "NO_MEMORY" ||
    normalized === "NO_OPC" ||
    normalized === "NO_EVT" ||
    normalized === "NO_TENANT" ||
    normalized === "NO_WORKSPACE" ||
    normalized === "NO_SUBSCRIPTION"
  ) {
    return null;
  }

  return trimmed;
}

function normalizeDatabaseRuntimeState(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "OPERATIONAL" ||
    normalized === "DEGRADED" ||
    normalized === "BLOCKED" ||
    normalized === "INVALID" ||
    normalized === "AUDIT_ONLY" ||
    normalized === "MAINTENANCE"
  ) {
    return normalized;
  }

  return null;
}

function normalizeDatabaseRuntimeDecision(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "ALLOW" ||
    normalized === "AUDIT" ||
    normalized === "DEGRADE" ||
    normalized === "ESCALATE" ||
    normalized === "BLOCK" ||
    normalized === "NOOP"
  ) {
    return normalized;
  }

  return null;
}

function normalizeDatabaseRiskClass(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "LOW" ||
    normalized === "MEDIUM" ||
    normalized === "HIGH" ||
    normalized === "CRITICAL" ||
    normalized === "PROHIBITED" ||
    normalized === "UNKNOWN"
  ) {
    return normalized;
  }

  return "UNKNOWN";
}

function normalizeDatabaseAuditStatus(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "NOT_REQUIRED" ||
    normalized === "READY" ||
    normalized === "REQUIRED" ||
    normalized === "OPEN" ||
    normalized === "IN_REVIEW" ||
    normalized === "REVIEWED" ||
    normalized === "DISPUTED" ||
    normalized === "LOCKED" ||
    normalized === "REJECTED" ||
    normalized === "CLOSED" ||
    normalized === "FAILED"
  ) {
    return normalized;
  }

  return null;
}

function normalizeDatabaseVerificationStatus(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  if (
    normalized === "VERIFIABLE" ||
    normalized === "PARTIAL" ||
    normalized === "INVALID" ||
    normalized === "UNVERIFIED" ||
    normalized === "ANCHORED" ||
    normalized === "SUPERSEDED" ||
    normalized === "DISPUTED"
  ) {
    return normalized;
  }

  return null;
}

function toDatabaseValue(
  value: string | number | boolean | null
): HbceDatabaseQueryValue {
  return value;
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function chooseColumn(
  available: Set<string>,
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    if (available.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function hasColumnValue(target: OpcProofColumnValue[], column: string): boolean {
  return target.some((item) => item.column === column);
}

function addColumnValue(
  target: OpcProofColumnValue[],
  available: Set<string>,
  candidates: string[],
  value: HbceDatabaseQueryValue,
  options: { jsonb?: boolean; required?: boolean } = {}
): void {
  const column = chooseColumn(available, candidates);

  if (!column) {
    if (options.required) {
      throw new Error(`OPC schema missing required column: ${candidates.join(" | ")}`);
    }

    return;
  }

  if (hasColumnValue(target, column)) {
    return;
  }

  target.push({
    column,
    value,
    jsonb: options.jsonb
  });
}

function addEveryColumnValue(
  target: OpcProofColumnValue[],
  available: Set<string>,
  candidates: string[],
  value: HbceDatabaseQueryValue,
  options: { jsonb?: boolean; required?: boolean } = {}
): void {
  let written = false;

  for (const column of candidates) {
    if (!available.has(column) || hasColumnValue(target, column)) {
      continue;
    }

    target.push({
      column,
      value,
      jsonb: options.jsonb
    });

    written = true;
  }

  if (!written && options.required) {
    throw new Error(`OPC schema missing required column: ${candidates.join(" | ")}`);
  }
}

async function getOpcProofDatabaseColumns(): Promise<Set<string>> {
  const result = await queryHbceDatabase<InformationSchemaColumnRow>(
    `
SELECT column_name
FROM information_schema.columns
WHERE table_name = $1
  AND table_schema IN ('public', current_schema())
ORDER BY ordinal_position;
`.trim(),
    [OPC_DATABASE_TABLE]
  );

  if (!result.ok) {
    return new Set(NO_OPC_DATABASE_COLUMNS);
  }

  const columns = result.rows
    .map((row) => row.column_name)
    .filter((column): column is string => typeof column === "string" && column.length > 0);

  return new Set(columns);
}

function buildOpcProofDatabaseColumnValues(
  available: Set<string>,
  fields: OpcProofDatabaseFields
): OpcProofColumnValue[] {
  const values: OpcProofColumnValue[] = [];

  addColumnValue(
    values,
    available,
    ["proof_id", "opc_proof_id", "id"],
    toDatabaseValue(fields.proofId),
    {
      required: true
    }
  );

  addEveryColumnValue(
    values,
    available,
    ["proof_hash", "opc_hash", "hash"],
    toDatabaseValue(fields.proofHash)
  );

  addColumnValue(values, available, ["chain_hash"], toDatabaseValue(fields.chainHash), {
    required: true
  });

  addEveryColumnValue(
    values,
    available,
    ["previous_proof_hash", "prev_proof_hash"],
    toDatabaseValue(fields.previousProofHash)
  );

  addEveryColumnValue(
    values,
    available,
    ["evt_id", "event_id"],
    toDatabaseValue(fields.evtId)
  );

  addEveryColumnValue(
    values,
    available,
    ["evt_hash", "event_hash"],
    toDatabaseValue(fields.evtHash)
  );

  addColumnValue(values, available, ["runtime_ipr"], toDatabaseValue(fields.runtimeIpr), {
    required: true
  });

  addEveryColumnValue(
    values,
    available,
    ["human_ipr", "subject_ipr"],
    toDatabaseValue(null)
  );

  addColumnValue(values, available, ["session_id"], toDatabaseValue(null));
  addColumnValue(values, available, ["memory_id"], toDatabaseValue(null));
  addColumnValue(values, available, ["memory_hash"], toDatabaseValue(fields.memoryHash));
  addColumnValue(values, available, ["runtime_state"], toDatabaseValue(fields.runtimeState));
  addColumnValue(values, available, ["runtime_decision"], toDatabaseValue(fields.runtimeDecision));
  addColumnValue(values, available, ["risk_class", "risk_level"], toDatabaseValue(fields.riskClass));
  addColumnValue(values, available, ["project_domain"], toDatabaseValue(fields.projectDomain));
  addColumnValue(values, available, ["hbce_module"], toDatabaseValue(fields.hbceModule));
  addColumnValue(values, available, ["audit_status"], toDatabaseValue(fields.auditStatus));
  addColumnValue(values, available, ["verification_status"], toDatabaseValue(fields.verificationStatus));

  addColumnValue(values, available, ["public_payload", "public_view"], toDatabaseValue(fields.publicPayloadJson), {
    jsonb: true
  });

  addColumnValue(values, available, ["payload", "proof_payload"], toDatabaseValue(fields.payloadJson), {
    jsonb: true,
    required: true
  });

  addColumnValue(values, available, ["legal_certification"], toDatabaseValue(false));

  return values;
}

function buildOpcProofInsertStatement(input: {
  columns: OpcProofColumnValue[];
}): {
  sql: string;
  params: HbceDatabaseQueryValue[];
  writtenColumns: string[];
} {
  const writtenColumns = input.columns.map((item) => item.column);
  const params: HbceDatabaseQueryValue[] = input.columns.map((item) => item.value);

  const insertColumns = input.columns
    .map((item) => quoteIdentifier(item.column))
    .join(",\n  ");

  const values = input.columns
    .map((item, index) => {
      const placeholder = `$${index + 1}`;
      return item.jsonb ? `${placeholder}::jsonb` : placeholder;
    })
    .join(",\n  ");

  const conflictColumn = input.columns.some((item) => item.column === "proof_id")
    ? "proof_id"
    : input.columns.some((item) => item.column === "opc_proof_id")
      ? "opc_proof_id"
      : input.columns.some((item) => item.column === "id")
        ? "id"
        : null;

  if (!conflictColumn) {
    throw new Error("OPC insert requires proof_id, opc_proof_id or id column.");
  }

  const updateColumns = input.columns
    .filter((item) => item.column !== conflictColumn)
    .map((item) => {
      const quoted = quoteIdentifier(item.column);
      return `${quoted} = EXCLUDED.${quoted}`;
    });

  const updateSql =
    updateColumns.length > 0
      ? `DO UPDATE SET\n  ${updateColumns.join(",\n  ")}`
      : "DO NOTHING";

  const sql = `
INSERT INTO ${quoteIdentifier(OPC_DATABASE_TABLE)} (
  ${insertColumns}
)
VALUES (
  ${values}
)
ON CONFLICT (${quoteIdentifier(conflictColumn)}) ${updateSql}
RETURNING ${quoteIdentifier(conflictColumn)};
`.trim();

  return {
    sql,
    params,
    writtenColumns
  };
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
    return "UNKNOWN_OPC_PROOF_DATABASE_ERROR";
  }
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}

function stringOrDefault(
  value: string | undefined,
  fallback: string | undefined
): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }

  return undefined;
}
