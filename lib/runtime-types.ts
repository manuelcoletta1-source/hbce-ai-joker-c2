/**
 * AI JOKER-C2 Runtime Types
 *
 * Shared operational type system for the HERMETICUM B.C.E. governed runtime.
 *
 * This file defines the canonical vocabulary used by:
 * - project-domain classification
 * - context classification
 * - intent classification
 * - policy evaluation
 * - risk classification
 * - human oversight
 * - runtime decisions
 * - EVT generation
 * - ledger continuity
 * - verification
 * - audit readiness
 *
 * Canonical domains:
 * - MATRIX
 * - CORPUS_ESOTEROLOGIA_ERMETICA
 * - APOKALYPSIS
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

export type ProjectDomain =
  | "MATRIX"
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS"
  | "GENERAL"
  | "MULTI_DOMAIN";

export type PrimaryProjectDomain =
  | "MATRIX"
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS";

export type DomainType =
  | "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
  | "DISCIPLINARY_GRAMMAR_DOMAIN"
  | "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN"
  | "GENERAL_CONTEXT"
  | "ECOSYSTEM_OPERATION";

export type ContextClass =
  | "IDENTITY"
  | "MATRIX"
  | "CORPUS"
  | "APOKALYPSIS"
  | "DOCUMENTAL"
  | "TECHNICAL"
  | "GITHUB"
  | "EDITORIAL"
  | "STRATEGIC"
  | "SECURITY"
  | "COMPLIANCE"
  | "GOVERNANCE"
  | "CRITICAL_INFRASTRUCTURE"
  | "AI_GOVERNANCE"
  | "DUAL_USE"
  | "GENERAL";

export type IntentClass =
  | "ASK"
  | "WRITE"
  | "REWRITE"
  | "ANALYZE"
  | "SUMMARIZE"
  | "TRANSFORM"
  | "CODE"
  | "GITHUB"
  | "GOVERNANCE"
  | "SECURITY"
  | "COMPLIANCE"
  | "STRATEGIC"
  | "EDITORIAL"
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
  | "AUTHORIZED_HUMAN_OPERATOR"
  | "TECHNICAL_REVIEWER"
  | "PUBLIC_SECTOR_REVIEWER"
  | "EDITORIAL_REVIEWER"
  | "EXECUTIVE_OWNER"
  | "NONE";

export type ReviewOutcome =
  | "APPROVED"
  | "APPROVED_WITH_LIMITATIONS"
  | "REJECTED"
  | "NEEDS_REVISION"
  | "NEEDS_MORE_INFORMATION"
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
  | "LOCKED"
  | "REJECTED"
  | "CLOSED";

export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE"
  | "SECRET"
  | "PERSONAL"
  | "SECURITY_SENSITIVE"
  | "CRITICAL_OPERATIONAL"
  | "UNSUPPORTED"
  | "UNKNOWN";

export type PayloadMode =
  | "FULL_TEXT"
  | "SUMMARY"
  | "REFERENCE_ONLY"
  | "HASH_ONLY"
  | "REDACTED"
  | "METADATA_ONLY"
  | "REJECTED";

export type PolicyStatus =
  | "ALLOWED"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type PolicyOutcome =
  | "PERMIT"
  | "RESTRICT"
  | "REQUIRE_AUDIT"
  | "REQUIRE_REVIEW"
  | "PROHIBIT"
  | "UNKNOWN";

export type DualUseClass =
  | "ALLOWED"
  | "SENSITIVE"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type DualUseRisk =
  | "DU-LOW"
  | "DU-MEDIUM"
  | "DU-HIGH"
  | "DU-CRITICAL"
  | "DU-PROHIBITED"
  | "DU-UNKNOWN";

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
  | "DOMAIN_ERROR"
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

export type ProjectDomainMetadata = {
  projectDomain: ProjectDomain;
  domainType: DomainType;
  label: string;
  shortDefinition: string;
  runtimeQuestion: string;
};

export type ProjectDomainClassification = {
  projectDomain: ProjectDomain;
  activeDomains: ProjectDomain[];
  primaryDomain: ProjectDomain;
  domainType: DomainType;
  confidence: number;
  reasons: string[];
  scores: Record<PrimaryProjectDomain, number>;
};

export type ProjectBinding = {
  ecosystem: "HERMETICUM B.C.E.";
  domain: ProjectDomain;
  active_domains?: ProjectDomain[];
  domain_type: DomainType;
  label?: string;
  canonical_formula?: string;
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
  outcome?: PolicyOutcome;
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
  reviewRequiredBeforeExecution?: boolean;
  reviewOutcome?: ReviewOutcome | null;
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
  projectDomain?: ProjectDomain;
  activeDomains?: ProjectDomain[];
  policyOutcome?: PolicyOutcome;
  humanOversight?: OversightState;
  riskClass?: RiskClass;
};

export type DataClassification = {
  dataClass: DataClass;
  containsSecret: boolean;
  containsPersonalData: boolean;
  containsSecuritySensitiveData: boolean;
  reasons: string[];
};

export type DataHandlingRecord = {
  classification: DataClass;
  payloadMode: PayloadMode;
  sourceType: string;
  sourceReference?: string;
  hashAlgorithm?: "sha256";
  contentHash?: string;
  redactionApplied: boolean;
  publicSafe: boolean;
  reason: string;
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
  /**
   * Optional during the transition from MATRIX-only EVT records to
   * MATRIX / CORPUS / APOKALYPSIS project-domain binding.
   *
   * Future EVT generator versions should always populate this field.
   */
  project?: ProjectBinding;
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
    policy_outcome?: PolicyOutcome;
  };
  operation: {
    type: string;
    status: OperationStatus;
    target?: string;
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

export type RuntimeEventProjectView = {
  evt: string;
  prev: string;
  timestamp: string;
  project: ProjectBinding | null;
  contextClass: ContextClass;
  intentClass: IntentClass;
  riskClass: RiskClass;
  decision: RuntimeDecision;
  operationStatus: OperationStatus;
  verificationStatus: VerificationStatus;
  auditStatus: AuditStatus;
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

export const PROJECT_DOMAINS: ProjectDomain[] = [
  "MATRIX",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "GENERAL",
  "MULTI_DOMAIN"
];

export const PRIMARY_PROJECT_DOMAINS: PrimaryProjectDomain[] = [
  "MATRIX",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS"
];

export const DOMAIN_TYPES: DomainType[] = [
  "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
  "DISCIPLINARY_GRAMMAR_DOMAIN",
  "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN",
  "GENERAL_CONTEXT",
  "ECOSYSTEM_OPERATION"
];

export const CONTEXT_CLASSES: ContextClass[] = [
  "IDENTITY",
  "MATRIX",
  "CORPUS",
  "APOKALYPSIS",
  "DOCUMENTAL",
  "TECHNICAL",
  "GITHUB",
  "EDITORIAL",
  "STRATEGIC",
  "SECURITY",
  "COMPLIANCE",
  "GOVERNANCE",
  "CRITICAL_INFRASTRUCTURE",
  "AI_GOVERNANCE",
  "DUAL_USE",
  "GENERAL"
];

export const INTENT_CLASSES: IntentClass[] = [
  "ASK",
  "WRITE",
  "REWRITE",
  "ANALYZE",
  "SUMMARIZE",
  "TRANSFORM",
  "CODE",
  "GITHUB",
  "GOVERNANCE",
  "SECURITY",
  "COMPLIANCE",
  "STRATEGIC",
  "EDITORIAL",
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

export const REVIEWER_ROLES: ReviewerRole[] = [
  "OPERATOR",
  "REVIEWER",
  "APPROVER",
  "AUDITOR",
  "MAINTAINER",
  "SECURITY_OFFICER",
  "LEGAL_REVIEWER",
  "DATA_PROTECTION_REVIEWER",
  "INSTITUTIONAL_AUTHORITY",
  "INCIDENT_COMMANDER",
  "AUTHORIZED_HUMAN_OPERATOR",
  "TECHNICAL_REVIEWER",
  "PUBLIC_SECTOR_REVIEWER",
  "EDITORIAL_REVIEWER",
  "EXECUTIVE_OWNER",
  "NONE"
];

export const REVIEW_OUTCOMES: ReviewOutcome[] = [
  "APPROVED",
  "APPROVED_WITH_LIMITATIONS",
  "REJECTED",
  "NEEDS_REVISION",
  "NEEDS_MORE_INFORMATION",
  "ESCALATED",
  "INFORMATION_INSUFFICIENT",
  "OUT_OF_SCOPE"
];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "VERIFIABLE",
  "PARTIAL",
  "INVALID",
  "UNVERIFIED",
  "ANCHORED",
  "SUPERSEDED",
  "DISPUTED"
];

export const AUDIT_STATUSES: AuditStatus[] = [
  "NOT_REQUIRED",
  "READY",
  "REQUIRED",
  "IN_REVIEW",
  "REVIEWED",
  "DISPUTED",
  "LOCKED",
  "REJECTED",
  "CLOSED"
];

export const DATA_CLASSES: DataClass[] = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE",
  "SECRET",
  "PERSONAL",
  "SECURITY_SENSITIVE",
  "CRITICAL_OPERATIONAL",
  "UNSUPPORTED",
  "UNKNOWN"
];

export const PAYLOAD_MODES: PayloadMode[] = [
  "FULL_TEXT",
  "SUMMARY",
  "REFERENCE_ONLY",
  "HASH_ONLY",
  "REDACTED",
  "METADATA_ONLY",
  "REJECTED"
];

export const POLICY_OUTCOMES: PolicyOutcome[] = [
  "PERMIT",
  "RESTRICT",
  "REQUIRE_AUDIT",
  "REQUIRE_REVIEW",
  "PROHIBIT",
  "UNKNOWN"
];

export const DUAL_USE_RISKS: DualUseRisk[] = [
  "DU-LOW",
  "DU-MEDIUM",
  "DU-HIGH",
  "DU-CRITICAL",
  "DU-PROHIBITED",
  "DU-UNKNOWN"
];

export function isRuntimeState(value: string): value is RuntimeState {
  return RUNTIME_STATES.includes(value as RuntimeState);
}

export function isRuntimeDecision(value: string): value is RuntimeDecision {
  return RUNTIME_DECISIONS.includes(value as RuntimeDecision);
}

export function isRiskClass(value: string): value is RiskClass {
  return RISK_CLASSES.includes(value as RiskClass);
}

export function isProjectDomain(value: string): value is ProjectDomain {
  return PROJECT_DOMAINS.includes(value as ProjectDomain);
}

export function isPrimaryProjectDomain(
  value: string
): value is PrimaryProjectDomain {
  return PRIMARY_PROJECT_DOMAINS.includes(value as PrimaryProjectDomain);
}

export function isDomainType(value: string): value is DomainType {
  return DOMAIN_TYPES.includes(value as DomainType);
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

export function isReviewerRole(value: string): value is ReviewerRole {
  return REVIEWER_ROLES.includes(value as ReviewerRole);
}

export function isReviewOutcome(value: string): value is ReviewOutcome {
  return REVIEW_OUTCOMES.includes(value as ReviewOutcome);
}

export function isVerificationStatus(
  value: string
): value is VerificationStatus {
  return VERIFICATION_STATUSES.includes(value as VerificationStatus);
}

export function isAuditStatus(value: string): value is AuditStatus {
  return AUDIT_STATUSES.includes(value as AuditStatus);
}

export function isDataClass(value: string): value is DataClass {
  return DATA_CLASSES.includes(value as DataClass);
}

export function isPayloadMode(value: string): value is PayloadMode {
  return PAYLOAD_MODES.includes(value as PayloadMode);
}

export function isPolicyOutcome(value: string): value is PolicyOutcome {
  return POLICY_OUTCOMES.includes(value as PolicyOutcome);
}

export function isDualUseRisk(value: string): value is DualUseRisk {
  return DUAL_USE_RISKS.includes(value as DualUseRisk);
}

export function getDomainTypeForProjectDomain(
  domain: ProjectDomain
): DomainType {
  switch (domain) {
    case "MATRIX":
      return "OPERATIONAL_INFRASTRUCTURE_DOMAIN";
    case "CORPUS_ESOTEROLOGIA_ERMETICA":
      return "DISCIPLINARY_GRAMMAR_DOMAIN";
    case "APOKALYPSIS":
      return "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN";
    case "MULTI_DOMAIN":
      return "ECOSYSTEM_OPERATION";
    case "GENERAL":
    default:
      return "GENERAL_CONTEXT";
  }
}

export function createProjectBinding(
  domain: ProjectDomain,
  activeDomains?: ProjectDomain[]
): ProjectBinding {
  const domainType = getDomainTypeForProjectDomain(domain);

  if (domain === "MULTI_DOMAIN") {
    return {
      ecosystem: "HERMETICUM B.C.E.",
      domain,
      active_domains:
        activeDomains && activeDomains.length > 0
          ? activeDomains
          : [
              "MATRIX",
              "CORPUS_ESOTEROLOGIA_ERMETICA",
              "APOKALYPSIS"
            ],
      domain_type: domainType,
      label: "MULTI_DOMAIN"
    };
  }

  return {
    ecosystem: "HERMETICUM B.C.E.",
    domain,
    active_domains: activeDomains,
    domain_type: domainType,
    label: domain,
    canonical_formula:
      domain === "CORPUS_ESOTEROLOGIA_ERMETICA"
        ? "Decisione · Costo · Traccia · Tempo"
        : undefined
  };
}
