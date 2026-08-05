/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Semantic Contract Types
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-TYPES-v1_0
 *
 * Purpose:
 * - define the canonical semantic contracts for MOD-002;
 * - classify domains, components, responsibilities and capabilities;
 * - preserve epistemic separation;
 * - support deterministic semantic analysis;
 * - preserve human authorization and fail-closed boundaries.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no automatic repository discovery;
 * - no autonomous mutation;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

export const REPOSITORY_SEMANTIC_INTELLIGENCE_TYPES_REVISION =
  "AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-TYPES-v1_0" as const;

export const REPOSITORY_SEMANTIC_MODULE_ID =
  "MOD-002" as const;

export const REPOSITORY_SEMANTIC_MODULE_VERSION =
  "1.0.0" as const;

export const REPOSITORY_SEMANTIC_EPISTEMIC_STATES = [
  "FACT",
  "INFERENCE",
  "HYPOTHESIS",
  "NOT_VERIFIABLE",
] as const;

export type RepositorySemanticEpistemicState =
  (typeof REPOSITORY_SEMANTIC_EPISTEMIC_STATES)[number];

export const REPOSITORY_SEMANTIC_DOMAINS = [
  "API",
  "APPLICATION",
  "CONFIGURATION",
  "DOCUMENTATION",
  "EVIDENCE",
  "GOVERNANCE",
  "IDENTITY",
  "MEMORY",
  "OPERATIONAL_MODULES",
  "PERSISTENCE",
  "RUNTIME",
  "SECURITY",
  "SOURCE_INTELLIGENCE",
  "TESTING",
  "USER_INTERFACE",
  "UNKNOWN",
] as const;

export type RepositorySemanticDomain =
  (typeof REPOSITORY_SEMANTIC_DOMAINS)[number];

export const REPOSITORY_SEMANTIC_CAPABILITY_STATES = [
  "DECLARED",
  "IMPLEMENTED",
  "TESTED",
  "EXPOSED",
  "INTEGRATED",
  "VERIFIED",
  "NOT_VERIFIABLE",
] as const;

export type RepositorySemanticCapabilityState =
  (typeof REPOSITORY_SEMANTIC_CAPABILITY_STATES)[number];

export const REPOSITORY_SEMANTIC_RELATION_TYPES = [
  "DEPENDS_ON",
  "EXPOSES",
  "GOVERNS",
  "INTERPRETS",
  "PERSISTS",
  "PRODUCES",
  "PROTECTS",
  "REGISTERS",
  "USES",
  "VALIDATES",
] as const;

export type RepositorySemanticRelationType =
  (typeof REPOSITORY_SEMANTIC_RELATION_TYPES)[number];

export const REPOSITORY_SEMANTIC_SEVERITIES = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type RepositorySemanticSeverity =
  (typeof REPOSITORY_SEMANTIC_SEVERITIES)[number];

export const REPOSITORY_SEMANTIC_COMPONENT_STATUSES = [
  "OBSERVED",
  "CLASSIFIED",
  "AMBIGUOUS",
  "ORPHANED",
  "DUPLICATED",
  "NOT_VERIFIABLE",
] as const;

export type RepositorySemanticComponentStatus =
  (typeof REPOSITORY_SEMANTIC_COMPONENT_STATUSES)[number];

export interface RepositorySemanticEvidence {
  evidenceId: string;

  sourceType:
    | "FILE"
    | "DIRECTORY"
    | "IMPORT"
    | "EXPORT"
    | "ENDPOINT"
    | "TEST"
    | "BUILD"
    | "DOCUMENTATION"
    | "OPERATOR_DECLARATION";

  sourceRef: string;

  statement: string;

  epistemicState: RepositorySemanticEpistemicState;

  confidence: number;
}

export interface RepositorySemanticComponentInput {
  componentId: string;

  path: string;

  name: string;

  summary: string | null;

  imports: readonly string[];

  exports: readonly string[];

  endpoints: readonly string[];

  testRefs: readonly string[];

  documentationRefs: readonly string[];

  evidenceIds: readonly string[];
}

export interface RepositorySemanticComponent {
  componentId: string;

  path: string;

  name: string;

  domain: RepositorySemanticDomain;

  primaryResponsibility: string | null;

  secondaryResponsibilities: readonly string[];

  capabilityIds: readonly string[];

  relationIds: readonly string[];

  evidenceIds: readonly string[];

  epistemicState: RepositorySemanticEpistemicState;

  confidence: number;

  status: RepositorySemanticComponentStatus;
}

export interface RepositorySemanticCapability {
  capabilityId: string;

  name: string;

  description: string;

  domain: RepositorySemanticDomain;

  componentIds: readonly string[];

  evidenceIds: readonly string[];

  state: RepositorySemanticCapabilityState;

  epistemicState: RepositorySemanticEpistemicState;

  confidence: number;
}

export interface RepositorySemanticRelation {
  relationId: string;

  sourceComponentId: string;

  targetComponentId: string;

  relationType: RepositorySemanticRelationType;

  evidenceIds: readonly string[];

  epistemicState: RepositorySemanticEpistemicState;

  confidence: number;
}

export interface RepositorySemanticDomainMap {
  domainId: string;

  name: RepositorySemanticDomain;

  description: string;

  componentIds: readonly string[];

  capabilityIds: readonly string[];

  relationIds: readonly string[];

  findingIds: readonly string[];
}

export interface RepositorySemanticFinding {
  findingId: string;

  severity: RepositorySemanticSeverity;

  title: string;

  description: string;

  domain: RepositorySemanticDomain;

  componentIds: readonly string[];

  evidenceIds: readonly string[];

  epistemicState: RepositorySemanticEpistemicState;

  recommendation: string | null;

  humanAuthorizationRequired: true;
}

export interface RepositorySemanticRecommendation {
  recommendationId: string;

  priority: number;

  title: string;

  description: string;

  targetComponentIds: readonly string[];

  sourceFindingIds: readonly string[];

  executableAutomatically: false;

  humanAuthorizationRequired: true;
}

export interface RepositorySemanticIdentityContext {
  humanIpr: string;

  runtimeIpr: string;

  tenantId: string;

  workspaceId: string;

  sessionId: string;
}

export interface RepositorySemanticRepositoryContext {
  repositoryId: string;

  repositoryName: string;

  branch: string;

  commitSha: string;
}

export interface RepositorySemanticInput {
  identity: RepositorySemanticIdentityContext;

  repository: RepositorySemanticRepositoryContext;

  mission: string;

  idempotencyKey: string;

  components: readonly RepositorySemanticComponentInput[];

  evidence: readonly RepositorySemanticEvidence[];

  humanAuthorization: boolean;

  legalCertification: false;
}

export interface RepositorySemanticSummary {
  totalComponents: number;

  totalDomains: number;

  totalCapabilities: number;

  totalRelations: number;

  totalFindings: number;

  classifiedComponents: number;

  orphanedComponents: number;

  ambiguousComponents: number;

  averageConfidence: number;
}

export interface RepositorySemanticMatrixInterpretation {
  verifiedCapabilities: readonly string[];

  implementedCapabilities: readonly string[];

  declaredCapabilities: readonly string[];

  isolatedCapabilities: readonly string[];

  ambiguousDomains: readonly RepositorySemanticDomain[];

  nextPriority: string | null;
}

export interface RepositorySemanticOutput {
  ok: boolean;

  status:
    | "REPOSITORY_SEMANTIC_INTELLIGENCE_READY"
    | "REPOSITORY_SEMANTIC_INTELLIGENCE_FAIL_CLOSED";

  revision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_TYPES_REVISION;

  moduleId:
    typeof REPOSITORY_SEMANTIC_MODULE_ID;

  version:
    typeof REPOSITORY_SEMANTIC_MODULE_VERSION;

  identity: RepositorySemanticIdentityContext;

  repository: RepositorySemanticRepositoryContext;

  mission: string;

  summary: RepositorySemanticSummary;

  domains: readonly RepositorySemanticDomainMap[];

  components: readonly RepositorySemanticComponent[];

  capabilities: readonly RepositorySemanticCapability[];

  relations: readonly RepositorySemanticRelation[];

  findings: readonly RepositorySemanticFinding[];

  recommendation: RepositorySemanticRecommendation | null;

  matrixInterpretation: RepositorySemanticMatrixInterpretation;

  governance: {
    deterministic: true;

    failClosed: true;

    evidenceBased: true;

    autonomousExecution: false;

    humanAuthorizationRequired: true;

    humanAuthorizationVerified: boolean;

    evtRequired: true;

    unebdoRegistrationRequired: true;

    opcTechnicalClosureRequired: true;

    matrixInterpretationRequired: true;

    persistentMemoryCreated: false;

    automaticRecallUsed: false;

    legalCertification: false;
  };

  legalCertification: false;
}

export interface RepositorySemanticBoundary {
  explicitInputRequired: true;

  explicitEvidenceRequired: true;

  identityBindingRequired: true;

  tenantBindingRequired: true;

  workspaceBindingRequired: true;

  sessionBindingRequired: true;

  idempotencyKeyRequired: true;

  humanAuthorizationRequired: true;

  filesystemAccess: false;

  githubApiAccess: false;

  sourceExecution: false;

  automaticMutation: false;

  commitExecution: false;

  pushExecution: false;

  mergeExecution: false;

  deployExecution: false;

  persistentMemory: false;

  automaticRecall: false;

  legalCertification: false;
}

export class RepositorySemanticContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);

    this.name =
      "RepositorySemanticContractError";

    this.code =
      code;
  }
}

export function isRepositorySemanticEpistemicState(
  value: unknown,
): value is RepositorySemanticEpistemicState {
  return (
    typeof value === "string" &&
    REPOSITORY_SEMANTIC_EPISTEMIC_STATES.includes(
      value as RepositorySemanticEpistemicState,
    )
  );
}

export function isRepositorySemanticDomain(
  value: unknown,
): value is RepositorySemanticDomain {
  return (
    typeof value === "string" &&
    REPOSITORY_SEMANTIC_DOMAINS.includes(
      value as RepositorySemanticDomain,
    )
  );
}

export function isRepositorySemanticCapabilityState(
  value: unknown,
): value is RepositorySemanticCapabilityState {
  return (
    typeof value === "string" &&
    REPOSITORY_SEMANTIC_CAPABILITY_STATES.includes(
      value as RepositorySemanticCapabilityState,
    )
  );
}

export function isRepositorySemanticRelationType(
  value: unknown,
): value is RepositorySemanticRelationType {
  return (
    typeof value === "string" &&
    REPOSITORY_SEMANTIC_RELATION_TYPES.includes(
      value as RepositorySemanticRelationType,
    )
  );
}

export function normalizeRepositorySemanticConfidence(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

export const REPOSITORY_SEMANTIC_BOUNDARY:
  RepositorySemanticBoundary =
  Object.freeze({
    explicitInputRequired:
      true,

    explicitEvidenceRequired:
      true,

    identityBindingRequired:
      true,

    tenantBindingRequired:
      true,

    workspaceBindingRequired:
      true,

    sessionBindingRequired:
      true,

    idempotencyKeyRequired:
      true,

    humanAuthorizationRequired:
      true,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    automaticMutation:
      false,

    commitExecution:
      false,

    pushExecution:
      false,

    mergeExecution:
      false,

    deployExecution:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,
  });
