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
 * - EVT event continuity;
 * - EVT/IPR-bound memory when available;
 * - runtime state;
 * - runtime decision;
 * - project domain;
 * - policy reference;
 * - risk class;
 * - input hash;
 * - output hash;
 * - decision hash;
 * - event hash;
 * - memory hash;
 * - previous proof hash;
 * - chain hash;
 * - audit status;
 * - verification status.
 *
 * Canonical formula:
 *
 * IPR binds the identity.
 * EVT traces the event.
 * Memory preserves runtime continuity.
 * OPC produces the proof receipt.
 * Ledger preserves the chain.
 * Verification reconstructs the operation.
 */

import { createHash, randomUUID } from "crypto";

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
  | "GENERAL"
  | "MULTI_DOMAIN";

export type OpcRuntimeRole =
  | "IPR_RUNTIME_DEMONSTRATOR"
  | "GOVERNED_AI_RUNTIME"
  | "AUDIT_RUNTIME"
  | "RESEARCH_PROTOTYPE";

export type OpcMemorySource =
  | "NONE"
  | "SESSION"
  | "EVT_IPR_MEMORY"
  | "LEDGER"
  | "USER_FILE"
  | "RUNTIME_CONTEXT";

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
};

export type OpcRuntimeSnapshot = {
  state: OpcRuntimeState;
  decision: OpcRuntimeDecision;
  contextClass: string;
  intentClass?: string;
  projectDomain?: OpcProjectDomain;
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

export type OpcProofRecord = {
  proofId: string;
  kind: OpcProofKind;
  timestamp: string;
  identity: OpcIdentityBinding;
  sessionId?: string;
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
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
  };
};

export type OpcProofRecordInput = {
  identity: OpcIdentityBinding;
  sessionId?: string;
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
  inputPayload: unknown;
  outputPayload: unknown;
  previousProofHash?: string | null;
  audit?: Partial<OpcAuditFrame>;
  timestamp?: string;
};

export type OpcProofPublicView = {
  proofId: string;
  timestamp: string;
  entity: string;
  ipr: string;
  runtimeRole?: OpcRuntimeRole;
  sessionId?: string;
  eventId: string;
  eventHash: string;
  memoryEventId?: string;
  memoryHash?: string;
  projectDomain?: OpcProjectDomain;
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

const OPC_KIND: OpcProofKind = "OPERATIONAL_PROOF_RECORD";
const HASH_ALGORITHM: OpcHashAlgorithm = "sha256";
const CANONICALIZATION: OpcCanonicalization = "deterministic-json";

const DEFAULT_CORE = "HBCE-CORE-v3";
const DEFAULT_ORGANIZATION = "HERMETICUM B.C.E. S.r.l.";
const DEFAULT_RUNTIME_ROLE: OpcRuntimeRole = "IPR_RUNTIME_DEMONSTRATOR";

const NON_CERTIFICATION_STATEMENT =
  "OPC is a technical proof receipt for audit, verification and governance review. It does not create automatic legal certification, regulatory approval, institutional recognition or legally binding evidence status by default.";

export function createOpcProofRecord(
  input: OpcProofRecordInput
): OpcProofRecord {
  const timestamp = input.timestamp || new Date().toISOString();
  const proofId = buildOpcProofId(timestamp);
  const identity = normalizeIdentity(input.identity);

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
    runtime: input.runtime
  });

  const eventHash = sha256Canonical({
    type: "event",
    event: input.event
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
    event: input.event,
    memory: input.memory,
    runtime: input.runtime,
    inputHash,
    outputHash,
    decisionHash,
    eventHash,
    memoryHash,
    previousProofHash
  });

  const audit = normalizeAuditFrame(input.audit, input.runtime);

  return {
    proofId,
    kind: OPC_KIND,
    timestamp,
    identity,
    sessionId: input.sessionId,
    event: input.event,
    memory: input.memory,
    runtime: input.runtime,
    proof: {
      inputHash,
      outputHash,
      decisionHash,
      eventHash,
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
      statement: NON_CERTIFICATION_STATEMENT
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

  const expectedChainHash = buildOpcChainHash({
    proofId: record.proofId,
    timestamp: record.timestamp,
    identity: normalizeIdentity(record.identity),
    sessionId: record.sessionId,
    event: record.event,
    memory: record.memory,
    runtime: record.runtime,
    inputHash: record.proof.inputHash,
    outputHash: record.proof.outputHash,
    decisionHash: record.proof.decisionHash,
    eventHash: record.proof.eventHash,
    memoryHash: record.proof.memoryHash,
    previousProofHash
  });

  const hashMatches = expectedChainHash === record.proof.chainHash;

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
          "The record is technically verifiable as an audit-oriented proof receipt."
        ]
      : [
          "OPC proof record chain hash does not match.",
          "The record may have been modified after creation or generated with a different previousProofHash."
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
    eventId: record.event.evt,
    eventHash: record.event.hash,
    memoryEventId: record.memory?.evt,
    memoryHash: record.proof.memoryHash,
    projectDomain: record.runtime.projectDomain,
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

  return missing;
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
  event: OpcEventReference;
  memory?: OpcMemoryReference;
  runtime: OpcRuntimeSnapshot;
  inputHash: string;
  outputHash: string;
  decisionHash: string;
  eventHash: string;
  memoryHash?: string;
  previousProofHash?: string | null;
}): string {
  const previousProofHash = normalizePreviousProofHash(
    input.previousProofHash
  );

  return sha256Canonical({
    proofId: input.proofId,
    timestamp: input.timestamp,
    identity: normalizeIdentity(input.identity),
    sessionId: input.sessionId || null,
    event: input.event,
    memory: input.memory || null,
    runtime: input.runtime,
    hashes: {
      inputHash: input.inputHash,
      outputHash: input.outputHash,
      decisionHash: input.decisionHash,
      eventHash: input.eventHash,
      memoryHash: input.memoryHash || null,
      previousProofHash
    },
    boundary: {
      legalCertification: false
    },
    algorithm: HASH_ALGORITHM,
    canonicalization: CANONICALIZATION
  });
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

function normalizeOpcProofRecord(record: OpcProofRecord): OpcProofRecord {
  return {
    ...record,
    identity: normalizeIdentity(record.identity),
    boundary: record.boundary || {
      legalCertification: false,
      statement: NON_CERTIFICATION_STATEMENT
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
  runtime: OpcRuntimeSnapshot
): OpcAuditFrame {
  const reviewRequired =
    typeof audit?.reviewRequired === "boolean"
      ? audit.reviewRequired
      : inferReviewRequired(runtime);

  return {
    status: audit?.status || inferAuditStatus(runtime, reviewRequired),
    reviewRequired,
    reviewerRole: audit?.reviewerRole || inferReviewerRole(runtime, reviewRequired),
    reasons: uniqueReasons([
      ...(audit?.reasons || []),
      ...buildAuditReasons(runtime, reviewRequired)
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

function inferReviewRequired(runtime: OpcRuntimeSnapshot): boolean {
  return (
    runtime.decision === "AUDIT" ||
    runtime.decision === "ESCALATE" ||
    runtime.decision === "BLOCK" ||
    runtime.riskClass === "MEDIUM" ||
    runtime.riskClass === "HIGH" ||
    runtime.riskClass === "CRITICAL" ||
    runtime.riskClass === "UNKNOWN"
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

  if (runtime.decision === "AUDIT" || runtime.riskClass === "MEDIUM") {
    return "AUDITOR";
  }

  return "REVIEWER";
}

function buildAuditReasons(
  runtime: OpcRuntimeSnapshot,
  reviewRequired: boolean
): string[] {
  const reasons = [
    `Runtime state: ${runtime.state}.`,
    `Runtime decision: ${runtime.decision}.`,
    `Risk class: ${runtime.riskClass}.`,
    `Policy reference: ${runtime.policyReference}.`
  ];

  if (runtime.projectDomain) {
    reasons.push(`Project domain: ${runtime.projectDomain}.`);
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

  if (reviewRequired) {
    reasons.push("Review is required or recommended by runtime governance.");
  } else {
    reasons.push("Review is not required for this proof record.");
  }

  reasons.push(NON_CERTIFICATION_STATEMENT);

  return reasons;
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
