/**
 * AI JOKER-C2 Runtime Types
 *
 * Shared operational type system for the HBCE / MATRIX governed runtime.
 *
 * This file defines the canonical vocabulary used by:
 * - context classification
 * - policy evaluation
 * - risk classification
 * - human oversight
 * - runtime decisions
 * - EVT generation
 * - ledger continuity
 * - verification
 * - audit readiness
 */

export type RuntimeState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "BLOCKED"
  | "INVALID"
  | "AUDIT_ONLY"
  | "MAINTENANCE";

export type RuntimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP";

export type RiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED"
  | "UNKNOWN";

export type ContextClass =
  | "IDENTITY"
  | "MATRIX"
  | "DOCUMENTAL"
  | "TECHNICAL"
  | "GITHUB"
  | "EDITORIAL"
  | "STRATEGIC"
  | "SECURITY"
  | "COMPLIANCE"
  | "CRITICAL_INFRASTRUCTURE"
  | "AI_GOVERNANCE"
  | "DUAL_USE"
  | "GENERAL";

export type IntentClass =
  | "ASK"
  | "WRITE"
  | "ANALYZE"
  | "SUMMARIZE"
  | "TRANSFORM"
  | "CODE"
  | "GITHUB"
  | "GOVERNANCE"
  | "SECURITY"
  | "STRATEGIC"
  | "VERIFY"
  | "PROHIBITED"
  | "UNKNOWN";

export type OversightState =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "COMPLETED"
  | "REJECTED"
  | "ESCALATED"
  | "BLOCKED"
  | "UNKNOWN";

export type ReviewerRole =
  | "OPERATOR"
  | "REVIEWER"
  | "APPROVER"
  | "AUDITOR"
  | "MAINTAINER"
  | "SECURITY_OFFICER"
  | "LEGAL_REVIEWER"
  | "DATA_PROTECTION_REVIEWER"
  | "INSTITUTIONAL_AUTHORITY"
  | "INCIDENT_COMMANDER"
  | "NONE";

export type ReviewOutcome =
  | "APPROVED"
  | "APPROVED_WITH_LIMITATIONS"
  | "REJECTED"
  | "NEEDS_REVISION"
  | "ESCALATED"
  | "INFORMATION_INSUFFICIENT"
  | "OUT_OF_SCOPE";

export type VerificationStatus =
  | "VERIFIABLE"
  | "PARTIAL"
  | "INVALID"
  | "UNVERIFIED"
  | "ANCHORED"
  | "SUPERSEDED"
  | "DISPUTED";

export type AuditStatus =
  | "NOT_REQUIRED"
  | "READY"
  | "REQUIRED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "DISPUTED"
  | "REJECTED"
  | "CLOSED";

export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SECRET"
  | "PERSONAL"
  | "SECURITY_SENSITIVE"
  | "CRITICAL_OPERATIONAL"
  | "UNKNOWN";

export type PolicyStatus =
  | "ALLOWED"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type DualUseClass =
  | "ALLOWED"
  | "SENSITIVE"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type DualUseDomain =
  | "AI_GOVERNANCE"
  | "DEFENSIVE_SECURITY"
  | "CRITICAL_INFRASTRUCTURE"
  | "PUBLIC_SECTOR"
  | "B2B"
  | "B2G"
  | "DATA_HANDLING"
  | "RESEARCH"
  | "CIVIL_PROTECTION"
  | "UNKNOWN";

export type FileProcessingStatus =
  | "NOT_PROCESSED"
  | "TEXT_EXTRACTED"
  | "PARTIAL"
  | "UNSUPPORTED"
  | "REJECTED"
  | "FAILED";

export type DataHandlingDecision =
  | "PROCESS"
  | "MINIMIZE"
  | "REDACT"
  | "REFERENCE_ONLY"
  | "HASH_ONLY"
  | "ESCALATE"
  | "BLOCK";

export type SafeErrorCode =
  | "INPUT_ERROR"
  | "POLICY_ERROR"
  | "RISK_ERROR"
  | "MODEL_ERROR"
  | "FILE_ERROR"
  | "EVT_ERROR"
  | "LEDGER_ERROR"
  | "SECURITY_ERROR"
  | "RUNTIME_ERROR";

export type RuntimeSensitivity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export type OperationStatus =
  | "PENDING"
  | "COMPLETED"
  | "BLOCKED"
  | "ESCALATED"
  | "DEGRADED"
  | "FAILED"
  | "NOOP";

export type RuntimeIdentity = {
  publicName: string;
  entity: string;
  ipr: string;
  checkpoint: string;
  core: string;
  framework: string;
  infrastructure: string;
  organization: string;
  territorialAnchor: string;
};

export type ContextClassification = {
  contextClass: ContextClass;
  intentClass: IntentClass;
  sensitivity: RuntimeSensitivity;
  confidence: number;
  reasons: string[];
};

export type PolicyEvaluation = {
  status: PolicyStatus;
  policyReference: string;
  prohibited: boolean;
  failClosed: boolean;
  reasons: string[];
};

export type RiskEvaluation = {
  riskClass: RiskClass;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  reasons: string[];
};

export type OversightEvaluation = {
  state: OversightState;
  requiredRole: ReviewerRole;
  reason: string;
};

export type RuntimeDecisionResult = {
  decision: RuntimeDecision;
  allowExecution: boolean;
  allowModelCall: boolean;
  allowFileProcessing: boolean;
  evtRequired: boolean;
  auditRequired: boolean;
  failClosed: boolean;
  reasons: string[];
};

export type DataClassification = {
  dataClass: DataClass;
  containsSecret: boolean;
  containsPersonalData: boolean;
  containsSecuritySensitiveData: boolean;
  reasons: string[];
};

export type FilePolicyResult = {
  allowed: boolean;
  status: FileProcessingStatus;
  reason: string;
  maxSizeBytes: number;
};

export type RuntimeEvent = {
  evt: string;
  prev: string;
  entity: string;
  ipr: string;
  timestamp: string;
  runtime: {
    name: string;
    core: string;
    state: RuntimeState;
  };
  context: {
    class: ContextClass;
    intent: IntentClass;
    sensitivity: RuntimeSensitivity;
  };
  governance: {
    risk: RiskClass;
    decision: RuntimeDecision;
    policy: string;
    human_oversight: OversightState;
    fail_closed: boolean;
    reasons: string[];
  };
  operation: {
    type: string;
    status: OperationStatus;
  };
  trace: {
    hash_algorithm: "sha256";
    canonicalization: "deterministic-json";
    hash: string;
  };
  verification: {
    status: VerificationStatus;
    audit_status: AuditStatus;
  };
};

export type VerificationResult = {
  status: VerificationStatus;
  evt?: string;
  hashMatches?: boolean;
  missingFields: string[];
  warnings: string[];
};

export type SafeError = {
  code: SafeErrorCode;
  message: string;
  status: number;
};

export const RUNTIME_STATES: RuntimeState[] = [
  "OPERATIONAL",
  "DEGRADED",
  "BLOCKED",
  "INVALID",
  "AUDIT_ONLY",
  "MAINTENANCE"
];

export const RUNTIME_DECISIONS: RuntimeDecision[] = [
  "ALLOW",
  "BLOCK",
  "ESCALATE",
  "DEGRADE",
  "AUDIT",
  "NOOP"
];

export const RISK_CLASSES: RiskClass[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "PROHIBITED",
  "UNKNOWN"
];

export const CONTEXT_CLASSES: ContextClass[] = [
  "IDENTITY",
  "MATRIX",
  "DOCUMENTAL",
  "TECHNICAL",
  "GITHUB",
  "EDITORIAL",
  "STRATEGIC",
  "SECURITY",
  "COMPLIANCE",
  "CRITICAL_INFRASTRUCTURE",
  "AI_GOVERNANCE",
  "DUAL_USE",
  "GENERAL"
];

export const INTENT_CLASSES: IntentClass[] = [
  "ASK",
  "WRITE",
  "ANALYZE",
  "SUMMARIZE",
  "TRANSFORM",
  "CODE",
  "GITHUB",
  "GOVERNANCE",
  "SECURITY",
  "STRATEGIC",
  "VERIFY",
  "PROHIBITED",
  "UNKNOWN"
];

export const OVERSIGHT_STATES: OversightState[] = [
  "NOT_REQUIRED",
  "RECOMMENDED",
  "REQUIRED",
  "COMPLETED",
  "REJECTED",
  "ESCALATED",
  "BLOCKED",
  "UNKNOWN"
];

export const DATA_CLASSES: DataClass[] = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SECRET",
  "PERSONAL",
  "SECURITY_SENSITIVE",
  "CRITICAL_OPERATIONAL",
  "UNKNOWN"
];

export function isRuntimeDecision(value: string): value is RuntimeDecision {
  return RUNTIME_DECISIONS.includes(value as RuntimeDecision);
}

export function isRiskClass(value: string): value is RiskClass {
  return RISK_CLASSES.includes(value as RiskClass);
}

export function isContextClass(value: string): value is ContextClass {
  return CONTEXT_CLASSES.includes(value as ContextClass);
}

export function isIntentClass(value: string): value is IntentClass {
  return INTENT_CLASSES.includes(value as IntentClass);
}

export function isOversightState(value: string): value is OversightState {
  return OVERSIGHT_STATES.includes(value as OversightState);
}

export function isDataClass(value: string): value is DataClass {
  return DATA_CLASSES.includes(value as DataClass);
}
