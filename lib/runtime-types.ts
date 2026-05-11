/**
 * AI JOKER-C2 Runtime Types
 *
 * Shared operational type system for the HERMETICUM B.C.E. governed runtime.
 *
 * This file defines the canonical vocabulary used by:
 * - IPR runtime identity
 * - project-domain classification
 * - HBCE module awareness
 * - context classification
 * - intent classification
 * - policy evaluation
 * - risk classification
 * - human oversight
 * - runtime decisions
 * - EVT generation
 * - EVT/IPR-bound memory
 * - OPC proof receipts
 * - ledger continuity
 * - verification
 * - audit readiness
 *
 * Canonical hierarchy:
 * - IPR = primary operational identity and proof instrument
 * - AI JOKER-C2 = governed runtime demonstrator
 * - MATRIX = operational infrastructure architecture
 * - U.S.E. = MATRIX-derived political-institutional application
 * - CORPUS_ESOTEROLOGIA_ERMETICA = disciplinary grammar
 * - APOKALYPSIS = historical threshold analysis
 * - UNEBDO = anchoring, validation and evidentiary continuity
 * - EVT = event trace
 * - EVT/IPR memory = runtime continuity
 * - OPC = operational proof receipt
 * - MetaExchange = structured exchange
 * - IOspace = runtime visibility and operational interaction
 * - CyberGlobal = defensive cybersecurity and resilience
 * - NeuroLoop = validation, feedback and review loop
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

export type RuntimeRole =
  | "IPR_RUNTIME_DEMONSTRATOR"
  | "GOVERNED_AI_RUNTIME"
  | "AUDIT_RUNTIME"
  | "RESEARCH_PROTOTYPE";

export type RiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED"
  | "UNKNOWN";

export type ProjectDomain =
  | "MATRIX"
  | "U.S.E."
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS"
  | "GENERAL"
  | "MULTI_DOMAIN";

export type PrimaryProjectDomain =
  | "MATRIX"
  | "U.S.E."
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS";

export type DomainType =
  | "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
  | "FEDERATED_EUROPEAN_INSTITUTIONAL_APPLICATION_DOMAIN"
  | "DISCIPLINARY_GRAMMAR_DOMAIN"
  | "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN"
  | "GENERAL_CONTEXT"
  | "ECOSYSTEM_OPERATION";

export type HbceModule =
  | "UNEBDO"
  | "OPC"
  | "MetaExchange"
  | "IOspace"
  | "CyberGlobal"
  | "NeuroLoop"
  | "NONE";

export type PrimaryHbceModule =
  | "UNEBDO"
  | "OPC"
  | "MetaExchange"
  | "IOspace"
  | "CyberGlobal"
  | "NeuroLoop";

export type HbceModuleType =
  | "ANCHORING_VALIDATION_CONTINUITY_LAYER"
  | "OPERATIONAL_PROOF_AND_COMPLIANCE_LAYER"
  | "STRUCTURED_EXCHANGE_LAYER"
  | "RUNTIME_VISIBILITY_INTERACTION_LAYER"
  | "DEFENSIVE_CYBERSECURITY_RESILIENCE_LAYER"
  | "VALIDATION_FEEDBACK_REVIEW_LOOP"
  | "NO_MODULE";

export type HbceModuleStatus =
  | "ACTIVE_PROTOTYPE_LAYER"
  | "PLANNED_FUNCTIONAL_LAYER"
  | "PLANNED_INTERFACE_LAYER"
  | "DOCUMENTATION_ONLY"
  | "NO_MODULE";

export type ContextClass =
  | "IDENTITY"
  | "IPR"
  | "MATRIX"
  | "USE"
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
  | "CIVIC"
  | "PUBLIC_ADMINISTRATION"
  | "DEMOCRATIC_INFRASTRUCTURE"
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
  | "CIVIC"
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
  | "CONSTITUTIONAL_REVIEWER"
  | "DATA_PROTECTION_REVIEWER"
  | "INSTITUTIONAL_AUTHORITY"
  | "INCIDENT_COMMANDER"
  | "AUTHORIZED_HUMAN_OPERATOR"
  | "TECHNICAL_REVIEWER"
  | "PUBLIC_SECTOR_REVIEWER"
  | "CIVIC_INFRASTRUCTURE_REVIEWER"
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
  | "CIVIC_SENSITIVE"
  | "DEMOCRATIC_CHOICE"
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
  | "DEMOCRATIC_INFRASTRUCTURE"
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
  | "MEMORY_ERROR"
  | "OPC_ERROR"
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

export type MemorySource =
  | "NONE"
  | "SESSION"
  | "EVT_IPR_MEMORY"
  | "LEDGER"
  | "USER_FILE"
  | "RUNTIME_CONTEXT";

export type MemoryStatus =
  | "NOT_REQUIRED"
  | "USED"
  | "CREATED"
  | "APPENDED"
  | "PARTIAL"
  | "FAILED";

export type OpcStatus =
  | "NOT_REQUIRED"
  | "CREATED"
  | "APPENDED"
  | "VERIFIABLE"
  | "PARTIAL"
  | "FAILED";

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
  runtimeRole?: RuntimeRole;
};

export type IprRuntimeIdentity = {
  entity: "AI_JOKER";
  system: "AI_JOKER-C2";
  ipr: "IPR-AI-0001";
  checkpoint: string;
  core: "HBCE-CORE-v3";
  organization: "HERMETICUM B.C.E. S.r.l.";
  runtimeRole: "IPR_RUNTIME_DEMONSTRATOR";
};

export type ProjectDomainMetadata = {
  projectDomain: ProjectDomain;
  domainType: DomainType;
  label: string;
  shortDefinition: string;
  runtimeQuestion: string;
  parentDomain?: ProjectDomain;
};

export type ProjectDomainClassification = {
  projectDomain: ProjectDomain;
  activeDomains: ProjectDomain[];
  primaryDomain: ProjectDomain;
  domainType: DomainType;
  confidence: number;
  reasons: string[];
  scores: Partial<Record<PrimaryProjectDomain, number>>;
};

export type ProjectBinding = {
  ecosystem: "HERMETICUM B.C.E.";
  domain: ProjectDomain;
  active_domains?: ProjectDomain[];
  domain_type: DomainType;
  label?: string;
  canonical_formula?: string;
  parent_domain?: ProjectDomain;
  democratic_boundary?: string;
};

export type HbceModuleMetadata = {
  module: HbceModule;
  moduleType: HbceModuleType;
  status: HbceModuleStatus;
  label: string;
  shortDefinition: string;
  runtimeQuestion: string;
  dependsOn: string[];
  boundary: string;
};

export type HbceModuleClassification = {
  module: HbceModule;
  activeModules: HbceModule[];
  primaryModule: HbceModule;
  moduleType: HbceModuleType;
  confidence: number;
  reasons: string[];
  scores: Partial<Record<PrimaryHbceModule, number>>;
};

export type HbceModuleBinding = {
  ecosystem: "HERMETICUM B.C.E.";
  module: HbceModule;
  active_modules?: HbceModule[];
  module_type: HbceModuleType;
  label?: string;
  status?: HbceModuleStatus;
  boundary?: string;
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
  hbceModule?: HbceModule;
  activeModules?: HbceModule[];
  policyOutcome?: PolicyOutcome;
  humanOversight?: OversightState;
  riskClass?: RiskClass;
  iprBinding?: boolean;
  memoryRequired?: boolean;
  opcRequired?: boolean;
};

export type DataClassification = {
  dataClass: DataClass;
  containsSecret: boolean;
  containsPersonalData: boolean;
  containsSecuritySensitiveData: boolean;
  containsCivicSensitiveData?: boolean;
  containsDemocraticChoiceData?: boolean;
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

export type RuntimeMemoryBinding = {
  required: boolean;
  used?: boolean;
  source: MemorySource;
  status?: MemoryStatus;
  evt?: string;
  hash?: string;
};

export type RuntimeOpcBinding = {
  required: boolean;
  proof_id?: string | null;
  status: OpcStatus;
  chain_hash?: string;
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
    role?: RuntimeRole;
  };
  project?: ProjectBinding;
  hbce_module?: HbceModuleBinding;
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
  memory?: RuntimeMemoryBinding;
  opc?: RuntimeOpcBinding;
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
  hbceModule?: HbceModuleBinding | null;
  contextClass: ContextClass;
  intentClass: IntentClass;
  riskClass: RiskClass;
  decision: RuntimeDecision;
  operationStatus: OperationStatus;
  verificationStatus: VerificationStatus;
  auditStatus: AuditStatus;
  memoryStatus?: MemoryStatus;
  opcStatus?: OpcStatus;
};

export type OpcProofIdentity = {
  entity: string;
  ipr: string;
  core: string;
  organization: string;
  runtimeRole: RuntimeRole;
};

export type OpcProofRecord = {
  proofId: string;
  kind: "OPERATIONAL_PROOF_RECORD";
  timestamp: string;
  identity: OpcProofIdentity;
  sessionId?: string;
  event: {
    evt: string;
    prev: string;
    hash: string;
  };
  memory?: {
    evt?: string;
    source: MemorySource;
    hash?: string;
  };
  runtime: {
    state: RuntimeState;
    decision: RuntimeDecision;
    contextClass: ContextClass;
    projectDomain?: ProjectDomain;
    hbceModule?: HbceModule;
    riskClass: RiskClass;
    policyReference?: string;
  };
  proof: {
    inputHash: string;
    outputHash: string;
    decisionHash: string;
    eventHash?: string;
    memoryHash?: string;
    previousProofHash?: string;
    chainHash: string;
  };
  audit: {
    status: AuditStatus;
    reviewRequired: boolean;
    reasons?: string[];
  };
  verification: {
    status: VerificationStatus;
    hashAlgorithm: "sha256";
    canonicalization: "deterministic-json";
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

export const RUNTIME_ROLES: RuntimeRole[] = [
  "IPR_RUNTIME_DEMONSTRATOR",
  "GOVERNED_AI_RUNTIME",
  "AUDIT_RUNTIME",
  "RESEARCH_PROTOTYPE"
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
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "GENERAL",
  "MULTI_DOMAIN"
];

export const PRIMARY_PROJECT_DOMAINS: PrimaryProjectDomain[] = [
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS"
];

export const DOMAIN_TYPES: DomainType[] = [
  "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
  "FEDERATED_EUROPEAN_INSTITUTIONAL_APPLICATION_DOMAIN",
  "DISCIPLINARY_GRAMMAR_DOMAIN",
  "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN",
  "GENERAL_CONTEXT",
  "ECOSYSTEM_OPERATION"
];

export const HBCE_MODULES: HbceModule[] = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "NONE"
];

export const PRIMARY_HBCE_MODULES: PrimaryHbceModule[] = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop"
];

export const HBCE_MODULE_TYPES: HbceModuleType[] = [
  "ANCHORING_VALIDATION_CONTINUITY_LAYER",
  "OPERATIONAL_PROOF_AND_COMPLIANCE_LAYER",
  "STRUCTURED_EXCHANGE_LAYER",
  "RUNTIME_VISIBILITY_INTERACTION_LAYER",
  "DEFENSIVE_CYBERSECURITY_RESILIENCE_LAYER",
  "VALIDATION_FEEDBACK_REVIEW_LOOP",
  "NO_MODULE"
];

export const HBCE_MODULE_STATUSES: HbceModuleStatus[] = [
  "ACTIVE_PROTOTYPE_LAYER",
  "PLANNED_FUNCTIONAL_LAYER",
  "PLANNED_INTERFACE_LAYER",
  "DOCUMENTATION_ONLY",
  "NO_MODULE"
];

export const CONTEXT_CLASSES: ContextClass[] = [
  "IDENTITY",
  "IPR",
  "MATRIX",
  "USE",
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
  "CIVIC",
  "PUBLIC_ADMINISTRATION",
  "DEMOCRATIC_INFRASTRUCTURE",
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
  "CIVIC",
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
  "CONSTITUTIONAL_REVIEWER",
  "DATA_PROTECTION_REVIEWER",
  "INSTITUTIONAL_AUTHORITY",
  "INCIDENT_COMMANDER",
  "AUTHORIZED_HUMAN_OPERATOR",
  "TECHNICAL_REVIEWER",
  "PUBLIC_SECTOR_REVIEWER",
  "CIVIC_INFRASTRUCTURE_REVIEWER",
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
  "CIVIC_SENSITIVE",
  "DEMOCRATIC_CHOICE",
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

export const DUAL_USE_DOMAINS: DualUseDomain[] = [
  "AI_GOVERNANCE",
  "DEFENSIVE_SECURITY",
  "CRITICAL_INFRASTRUCTURE",
  "PUBLIC_SECTOR",
  "B2B",
  "B2G",
  "DATA_HANDLING",
  "RESEARCH",
  "CIVIL_PROTECTION",
  "DEMOCRATIC_INFRASTRUCTURE",
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

export const MEMORY_SOURCES: MemorySource[] = [
  "NONE",
  "SESSION",
  "EVT_IPR_MEMORY",
  "LEDGER",
  "USER_FILE",
  "RUNTIME_CONTEXT"
];

export const MEMORY_STATUSES: MemoryStatus[] = [
  "NOT_REQUIRED",
  "USED",
  "CREATED",
  "APPENDED",
  "PARTIAL",
  "FAILED"
];

export const OPC_STATUSES: OpcStatus[] = [
  "NOT_REQUIRED",
  "CREATED",
  "APPENDED",
  "VERIFIABLE",
  "PARTIAL",
  "FAILED"
];

export const CANONICAL_IPR_RUNTIME_IDENTITY: IprRuntimeIdentity = {
  entity: "AI_JOKER",
  system: "AI_JOKER-C2",
  ipr: "IPR-AI-0001",
  checkpoint: "EVT-0014-AI",
  core: "HBCE-CORE-v3",
  organization: "HERMETICUM B.C.E. S.r.l.",
  runtimeRole: "IPR_RUNTIME_DEMONSTRATOR"
};

export const USE_DEMOCRATIC_BOUNDARY =
  "Identity verified first. Choice separated after. Vote anonymized. Process auditable.";

export const HBCE_MODULE_BOUNDARIES: Record<HbceModule, string> = {
  UNEBDO:
    "UNEBDO supports anchoring, validation and evidentiary continuity. It does not create automatic legal certification by default.",
  OPC:
    "OPC creates technical proof receipts for audit, verification and governance review. OPC proof receipts are not automatic legal certification.",
  MetaExchange:
    "MetaExchange must remain governed, access-controlled and policy-aware. It must not become permissionless data exchange.",
  IOspace:
    "IOspace must expose only public-safe metadata unless controlled internal access is available.",
  CyberGlobal:
    "CyberGlobal must remain defensive, audit-oriented, governance-oriented and non-offensive.",
  NeuroLoop:
    "NeuroLoop is not autonomous authority and must not become uncontrolled learning or unsupervised decision execution.",
  NONE: "No HBCE module is active."
};

export const HBCE_MODULE_DEPENDENCIES: Record<HbceModule, string[]> = {
  UNEBDO: ["IPR", "EVT", "OPC"],
  OPC: ["IPR", "EVT", "EVT_IPR_BOUND_MEMORY"],
  MetaExchange: ["IPR", "EVT", "EVT_IPR_BOUND_MEMORY", "OPC"],
  IOspace: ["IPR", "EVT", "EVT_IPR_BOUND_MEMORY", "OPC"],
  CyberGlobal: ["IPR", "EVT", "OPC", "POLICY", "RISK", "HUMAN_OVERSIGHT"],
  NeuroLoop: ["IPR", "EVT", "EVT_IPR_BOUND_MEMORY", "OPC", "HUMAN_OVERSIGHT", "AUDIT"],
  NONE: []
};

export function isRuntimeState(value: string): value is RuntimeState {
  return RUNTIME_STATES.includes(value as RuntimeState);
}

export function isRuntimeDecision(value: string): value is RuntimeDecision {
  return RUNTIME_DECISIONS.includes(value as RuntimeDecision);
}

export function isRuntimeRole(value: string): value is RuntimeRole {
  return RUNTIME_ROLES.includes(value as RuntimeRole);
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

export function isHbceModule(value: string): value is HbceModule {
  return HBCE_MODULES.includes(value as HbceModule);
}

export function isPrimaryHbceModule(value: string): value is PrimaryHbceModule {
  return PRIMARY_HBCE_MODULES.includes(value as PrimaryHbceModule);
}

export function isHbceModuleType(value: string): value is HbceModuleType {
  return HBCE_MODULE_TYPES.includes(value as HbceModuleType);
}

export function isHbceModuleStatus(value: string): value is HbceModuleStatus {
  return HBCE_MODULE_STATUSES.includes(value as HbceModuleStatus);
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

export function isDualUseDomain(value: string): value is DualUseDomain {
  return DUAL_USE_DOMAINS.includes(value as DualUseDomain);
}

export function isDualUseRisk(value: string): value is DualUseRisk {
  return DUAL_USE_RISKS.includes(value as DualUseRisk);
}

export function isMemorySource(value: string): value is MemorySource {
  return MEMORY_SOURCES.includes(value as MemorySource);
}

export function isMemoryStatus(value: string): value is MemoryStatus {
  return MEMORY_STATUSES.includes(value as MemoryStatus);
}

export function isOpcStatus(value: string): value is OpcStatus {
  return OPC_STATUSES.includes(value as OpcStatus);
}

export function getDomainTypeForProjectDomain(
  domain: ProjectDomain
): DomainType {
  switch (domain) {
    case "MATRIX":
      return "OPERATIONAL_INFRASTRUCTURE_DOMAIN";
    case "U.S.E.":
      return "FEDERATED_EUROPEAN_INSTITUTIONAL_APPLICATION_DOMAIN";
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

export function getProjectDomainLabel(domain: ProjectDomain): string {
  switch (domain) {
    case "MATRIX":
      return "MATRIX";
    case "U.S.E.":
      return "U.S.E. — United States of Europe";
    case "CORPUS_ESOTEROLOGIA_ERMETICA":
      return "CORPUS ESOTEROLOGIA ERMETICA";
    case "APOKALYPSIS":
      return "APOKALYPSIS";
    case "MULTI_DOMAIN":
      return "MULTI_DOMAIN";
    case "GENERAL":
    default:
      return "GENERAL";
  }
}

export function getHbceModuleType(module: HbceModule): HbceModuleType {
  switch (module) {
    case "UNEBDO":
      return "ANCHORING_VALIDATION_CONTINUITY_LAYER";
    case "OPC":
      return "OPERATIONAL_PROOF_AND_COMPLIANCE_LAYER";
    case "MetaExchange":
      return "STRUCTURED_EXCHANGE_LAYER";
    case "IOspace":
      return "RUNTIME_VISIBILITY_INTERACTION_LAYER";
    case "CyberGlobal":
      return "DEFENSIVE_CYBERSECURITY_RESILIENCE_LAYER";
    case "NeuroLoop":
      return "VALIDATION_FEEDBACK_REVIEW_LOOP";
    case "NONE":
    default:
      return "NO_MODULE";
  }
}

export function getHbceModuleStatus(module: HbceModule): HbceModuleStatus {
  switch (module) {
    case "OPC":
      return "ACTIVE_PROTOTYPE_LAYER";
    case "IOspace":
      return "PLANNED_INTERFACE_LAYER";
    case "UNEBDO":
    case "MetaExchange":
    case "CyberGlobal":
    case "NeuroLoop":
      return "PLANNED_FUNCTIONAL_LAYER";
    case "NONE":
    default:
      return "NO_MODULE";
  }
}

export function getHbceModuleLabel(module: HbceModule): string {
  switch (module) {
    case "UNEBDO":
      return "UNEBDO";
    case "OPC":
      return "OPC — Operational Proof & Compliance Layer";
    case "MetaExchange":
      return "MetaExchange";
    case "IOspace":
      return "IOspace";
    case "CyberGlobal":
      return "CyberGlobal";
    case "NeuroLoop":
      return "NeuroLoop";
    case "NONE":
    default:
      return "NONE";
  }
}

export function getHbceModuleShortDefinition(module: HbceModule): string {
  switch (module) {
    case "UNEBDO":
      return "Anchoring, validation and evidentiary continuity support.";
    case "OPC":
      return "Operational proof receipt and compliance layer.";
    case "MetaExchange":
      return "Structured exchange layer for identities, proofs, events, documents and contexts.";
    case "IOspace":
      return "Runtime visibility and operational interaction space.";
    case "CyberGlobal":
      return "Defensive cybersecurity and resilience layer.";
    case "NeuroLoop":
      return "Validation, feedback and controlled review loop.";
    case "NONE":
    default:
      return "No HBCE module is active.";
  }
}

export function getHbceModuleRuntimeQuestion(module: HbceModule): string {
  switch (module) {
    case "UNEBDO":
      return "How can the runtime strengthen anchoring, validation and evidentiary continuity?";
    case "OPC":
      return "How can the runtime generate a technical proof receipt for audit and verification?";
    case "MetaExchange":
      return "How can controlled operational objects be exchanged without losing governance?";
    case "IOspace":
      return "How can runtime state, events, memory and proof receipts be made visible safely?";
    case "CyberGlobal":
      return "How can defensive cybersecurity, resilience and risk mapping be supported without offensive capability?";
    case "NeuroLoop":
      return "How can validation, feedback and review loops improve decisions without becoming autonomous authority?";
    case "NONE":
    default:
      return "Does this request require an HBCE module binding?";
  }
}

export function getHbceModuleMetadata(module: HbceModule): HbceModuleMetadata {
  return {
    module,
    moduleType: getHbceModuleType(module),
    status: getHbceModuleStatus(module),
    label: getHbceModuleLabel(module),
    shortDefinition: getHbceModuleShortDefinition(module),
    runtimeQuestion: getHbceModuleRuntimeQuestion(module),
    dependsOn: HBCE_MODULE_DEPENDENCIES[module],
    boundary: HBCE_MODULE_BOUNDARIES[module]
  };
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
              "U.S.E.",
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
    label: getProjectDomainLabel(domain),
    canonical_formula:
      domain === "CORPUS_ESOTEROLOGIA_ERMETICA"
        ? "Decisione · Costo · Traccia · Tempo"
        : undefined,
    parent_domain: domain === "U.S.E." ? "MATRIX" : undefined,
    democratic_boundary:
      domain === "U.S.E." ? USE_DEMOCRATIC_BOUNDARY : undefined
  };
}

export function createHbceModuleBinding(
  module: HbceModule,
  activeModules?: HbceModule[]
): HbceModuleBinding {
  const moduleType = getHbceModuleType(module);

  if (module === "NONE") {
    return {
      ecosystem: "HERMETICUM B.C.E.",
      module,
      active_modules: activeModules,
      module_type: moduleType,
      label: "NONE",
      status: "NO_MODULE",
      boundary: HBCE_MODULE_BOUNDARIES.NONE
    };
  }

  return {
    ecosystem: "HERMETICUM B.C.E.",
    module,
    active_modules: activeModules,
    module_type: moduleType,
    label: getHbceModuleLabel(module),
    status: getHbceModuleStatus(module),
    boundary: HBCE_MODULE_BOUNDARIES[module]
  };
}
