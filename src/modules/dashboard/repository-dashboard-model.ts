/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Repository Intelligence Dashboard
 *
 * Canonical Dashboard Model
 *
 * Revision:
 * AIJC2-REPOSITORY-DASHBOARD-MODEL-v1_0
 *
 * Purpose:
 * - define one canonical dashboard model for MOD-001 and MOD-002;
 * - keep structural and semantic intelligence clearly separated;
 * - expose only safe, presentation-ready technical data;
 * - preserve human authorization, evidence and legal boundaries.
 *
 * Explicit exclusions:
 * - no repository execution;
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no autonomous mutation;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

export const REPOSITORY_DASHBOARD_MODEL_REVISION =
  "AIJC2-REPOSITORY-DASHBOARD-MODEL-v1_0" as const;

export const REPOSITORY_DASHBOARD_MODEL_VERSION =
  "1.0.0" as const;

export type RepositoryDashboardStatus =
  | "READY"
  | "DEGRADED"
  | "FAIL_CLOSED"
  | "NOT_EXECUTED";

export type RepositoryDashboardSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RepositoryDashboardCapabilityState =
  | "DECLARED"
  | "IMPLEMENTED"
  | "TESTED"
  | "EXPOSED"
  | "INTEGRATED"
  | "VERIFIED"
  | "NOT_VERIFIABLE";

export interface RepositoryDashboardIdentity {
  humanIpr: string;

  runtimeIpr: string;

  tenantId: string;

  workspaceId: string;

  sessionId: string;
}

export interface RepositoryDashboardRepository {
  repositoryId: string;

  repositoryName: string;

  branch: string;

  commitSha: string;
}

export interface RepositoryDashboardModuleStatus {
  moduleId: string;

  moduleName: string;

  version: string;

  status: RepositoryDashboardStatus;

  executed: boolean;

  verified: boolean;

  revision: string | null;
}

export interface RepositoryDashboardMetric {
  metricId: string;

  label: string;

  value: number;

  unit:
    | "COUNT"
    | "PERCENT"
    | "BYTES"
    | "MILLISECONDS";

  sourceModuleId: string;
}

export interface RepositoryDashboardArchitectureSummary {
  totalFiles: number;

  totalDirectories: number;

  sourceFiles: number;

  testFiles: number;

  documentationFiles: number;

  configurationFiles: number;

  apiFiles: number;

  runtimeFiles: number;

  moduleFiles: number;

  architectureNodes: number;

  architectureZones: number;

  architectureEntrypoints: number;

  architectureBoundaries: number;

  inspectedFileCoverage: number;
}

export interface RepositoryDashboardDependencySummary {
  totalNodes: number;

  totalEdges: number;

  orphanNodes: number;

  cyclicDependencies: number;

  unresolvedDependencies: number;
}

export interface RepositoryDashboardCapability {
  capabilityId: string;

  name: string;

  description: string;

  domain: string;

  state: RepositoryDashboardCapabilityState;

  confidence: number;

  componentIds: readonly string[];

  evidenceIds: readonly string[];
}

export interface RepositoryDashboardFinding {
  findingId: string;

  type: string;

  severity: RepositoryDashboardSeverity;

  title: string;

  description: string;

  domain: string;

  componentIds: readonly string[];

  evidenceIds: readonly string[];

  recommendation: string | null;

  blocking: boolean;

  humanAuthorizationRequired: true;
}

export interface RepositoryDashboardRecommendation {
  recommendationId: string;

  priority: number;

  title: string;

  description: string;

  targetComponentIds: readonly string[];

  sourceFindingIds: readonly string[];

  executableAutomatically: false;

  humanAuthorizationRequired: true;
}

export interface RepositoryDashboardSemanticSummary {
  totalComponents: number;

  totalDomains: number;

  totalCapabilities: number;

  totalRelations: number;

  totalFindings: number;

  classifiedComponents: number;

  orphanedComponents: number;

  ambiguousComponents: number;

  verifiedCapabilities: number;

  implementedCapabilities: number;

  declaredCapabilities: number;

  isolatedCapabilities: number;

  blockingFindings: number;

  averageConfidence: number;
}

export interface RepositoryDashboardGovernance {
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
}

export interface RepositoryDashboardOperation {
  operationId: string | null;

  responseEvt: string | null;

  opcId: string | null;

  generatedAt: string;
}

export interface RepositoryDashboardModel {
  ok: boolean;

  status: RepositoryDashboardStatus;

  revision:
    typeof REPOSITORY_DASHBOARD_MODEL_REVISION;

  version:
    typeof REPOSITORY_DASHBOARD_MODEL_VERSION;

  identity: RepositoryDashboardIdentity;

  repository: RepositoryDashboardRepository;

  operation: RepositoryDashboardOperation;

  modules: readonly RepositoryDashboardModuleStatus[];

  metrics: readonly RepositoryDashboardMetric[];

  architecture: RepositoryDashboardArchitectureSummary;

  dependencies: RepositoryDashboardDependencySummary;

  semantic: RepositoryDashboardSemanticSummary;

  capabilities: readonly RepositoryDashboardCapability[];

  findings: readonly RepositoryDashboardFinding[];

  recommendation:
    RepositoryDashboardRecommendation | null;

  matrixInterpretation: {
    verifiedCapabilities: readonly string[];

    implementedCapabilities: readonly string[];

    declaredCapabilities: readonly string[];

    isolatedCapabilities: readonly string[];

    ambiguousDomains: readonly string[];

    nextPriority: string | null;
  };

  governance: RepositoryDashboardGovernance;

  legalCertification: false;
}

export class RepositoryDashboardModelError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositoryDashboardModelError";

    this.code =
      code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new RepositoryDashboardModelError(
      "REPOSITORY_DASHBOARD_REQUIRED_STRING",
      `${fieldName} must be a non-empty string`,
    );
  }

  return value.trim();
}

function normalizeOptionalString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeNonNegativeInteger(
  value: unknown,
  fieldName: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new RepositoryDashboardModelError(
      "REPOSITORY_DASHBOARD_INVALID_INTEGER",
      `${fieldName} must be a non-negative integer`,
    );
  }

  return value;
}

function normalizePercentage(
  value: unknown,
  fieldName: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new RepositoryDashboardModelError(
      "REPOSITORY_DASHBOARD_INVALID_PERCENTAGE",
      `${fieldName} must be a finite number`,
    );
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

export interface CreateRepositoryDashboardModelInput {
  ok: boolean;

  status: RepositoryDashboardStatus;

  identity: RepositoryDashboardIdentity;

  repository: RepositoryDashboardRepository;

  operation?: Partial<RepositoryDashboardOperation>;

  modules: readonly RepositoryDashboardModuleStatus[];

  metrics?: readonly RepositoryDashboardMetric[];

  architecture: RepositoryDashboardArchitectureSummary;

  dependencies: RepositoryDashboardDependencySummary;

  semantic: RepositoryDashboardSemanticSummary;

  capabilities: readonly RepositoryDashboardCapability[];

  findings: readonly RepositoryDashboardFinding[];

  recommendation:
    RepositoryDashboardRecommendation | null;

  matrixInterpretation:
    RepositoryDashboardModel["matrixInterpretation"];

  governance: RepositoryDashboardGovernance;

  legalCertification: false;
}

function validateIdentity(
  identity: RepositoryDashboardIdentity,
): RepositoryDashboardIdentity {
  return Object.freeze({
    humanIpr:
      normalizeRequiredString(
        identity.humanIpr,
        "identity.humanIpr",
      ),

    runtimeIpr:
      normalizeRequiredString(
        identity.runtimeIpr,
        "identity.runtimeIpr",
      ),

    tenantId:
      normalizeRequiredString(
        identity.tenantId,
        "identity.tenantId",
      ),

    workspaceId:
      normalizeRequiredString(
        identity.workspaceId,
        "identity.workspaceId",
      ),

    sessionId:
      normalizeRequiredString(
        identity.sessionId,
        "identity.sessionId",
      ),
  });
}

function validateRepository(
  repository: RepositoryDashboardRepository,
): RepositoryDashboardRepository {
  return Object.freeze({
    repositoryId:
      normalizeRequiredString(
        repository.repositoryId,
        "repository.repositoryId",
      ),

    repositoryName:
      normalizeRequiredString(
        repository.repositoryName,
        "repository.repositoryName",
      ),

    branch:
      normalizeRequiredString(
        repository.branch,
        "repository.branch",
      ),

    commitSha:
      normalizeRequiredString(
        repository.commitSha,
        "repository.commitSha",
      ),
  });
}

function validateArchitecture(
  architecture:
    RepositoryDashboardArchitectureSummary,
): RepositoryDashboardArchitectureSummary {
  return Object.freeze({
    totalFiles:
      normalizeNonNegativeInteger(
        architecture.totalFiles,
        "architecture.totalFiles",
      ),

    totalDirectories:
      normalizeNonNegativeInteger(
        architecture.totalDirectories,
        "architecture.totalDirectories",
      ),

    sourceFiles:
      normalizeNonNegativeInteger(
        architecture.sourceFiles,
        "architecture.sourceFiles",
      ),

    testFiles:
      normalizeNonNegativeInteger(
        architecture.testFiles,
        "architecture.testFiles",
      ),

    documentationFiles:
      normalizeNonNegativeInteger(
        architecture.documentationFiles,
        "architecture.documentationFiles",
      ),

    configurationFiles:
      normalizeNonNegativeInteger(
        architecture.configurationFiles,
        "architecture.configurationFiles",
      ),

    apiFiles:
      normalizeNonNegativeInteger(
        architecture.apiFiles,
        "architecture.apiFiles",
      ),

    runtimeFiles:
      normalizeNonNegativeInteger(
        architecture.runtimeFiles,
        "architecture.runtimeFiles",
      ),

    moduleFiles:
      normalizeNonNegativeInteger(
        architecture.moduleFiles,
        "architecture.moduleFiles",
      ),

    architectureNodes:
      normalizeNonNegativeInteger(
        architecture.architectureNodes,
        "architecture.architectureNodes",
      ),

    architectureZones:
      normalizeNonNegativeInteger(
        architecture.architectureZones,
        "architecture.architectureZones",
      ),

    architectureEntrypoints:
      normalizeNonNegativeInteger(
        architecture.architectureEntrypoints,
        "architecture.architectureEntrypoints",
      ),

    architectureBoundaries:
      normalizeNonNegativeInteger(
        architecture.architectureBoundaries,
        "architecture.architectureBoundaries",
      ),

    inspectedFileCoverage:
      normalizePercentage(
        architecture.inspectedFileCoverage,
        "architecture.inspectedFileCoverage",
      ),
  });
}

function validateDependencies(
  dependencies:
    RepositoryDashboardDependencySummary,
): RepositoryDashboardDependencySummary {
  return Object.freeze({
    totalNodes:
      normalizeNonNegativeInteger(
        dependencies.totalNodes,
        "dependencies.totalNodes",
      ),

    totalEdges:
      normalizeNonNegativeInteger(
        dependencies.totalEdges,
        "dependencies.totalEdges",
      ),

    orphanNodes:
      normalizeNonNegativeInteger(
        dependencies.orphanNodes,
        "dependencies.orphanNodes",
      ),

    cyclicDependencies:
      normalizeNonNegativeInteger(
        dependencies.cyclicDependencies,
        "dependencies.cyclicDependencies",
      ),

    unresolvedDependencies:
      normalizeNonNegativeInteger(
        dependencies.unresolvedDependencies,
        "dependencies.unresolvedDependencies",
      ),
  });
}

function validateSemantic(
  semantic:
    RepositoryDashboardSemanticSummary,
): RepositoryDashboardSemanticSummary {
  return Object.freeze({
    totalComponents:
      normalizeNonNegativeInteger(
        semantic.totalComponents,
        "semantic.totalComponents",
      ),

    totalDomains:
      normalizeNonNegativeInteger(
        semantic.totalDomains,
        "semantic.totalDomains",
      ),

    totalCapabilities:
      normalizeNonNegativeInteger(
        semantic.totalCapabilities,
        "semantic.totalCapabilities",
      ),

    totalRelations:
      normalizeNonNegativeInteger(
        semantic.totalRelations,
        "semantic.totalRelations",
      ),

    totalFindings:
      normalizeNonNegativeInteger(
        semantic.totalFindings,
        "semantic.totalFindings",
      ),

    classifiedComponents:
      normalizeNonNegativeInteger(
        semantic.classifiedComponents,
        "semantic.classifiedComponents",
      ),

    orphanedComponents:
      normalizeNonNegativeInteger(
        semantic.orphanedComponents,
        "semantic.orphanedComponents",
      ),

    ambiguousComponents:
      normalizeNonNegativeInteger(
        semantic.ambiguousComponents,
        "semantic.ambiguousComponents",
      ),

    verifiedCapabilities:
      normalizeNonNegativeInteger(
        semantic.verifiedCapabilities,
        "semantic.verifiedCapabilities",
      ),

    implementedCapabilities:
      normalizeNonNegativeInteger(
        semantic.implementedCapabilities,
        "semantic.implementedCapabilities",
      ),

    declaredCapabilities:
      normalizeNonNegativeInteger(
        semantic.declaredCapabilities,
        "semantic.declaredCapabilities",
      ),

    isolatedCapabilities:
      normalizeNonNegativeInteger(
        semantic.isolatedCapabilities,
        "semantic.isolatedCapabilities",
      ),

    blockingFindings:
      normalizeNonNegativeInteger(
        semantic.blockingFindings,
        "semantic.blockingFindings",
      ),

    averageConfidence:
      normalizePercentage(
        semantic.averageConfidence,
        "semantic.averageConfidence",
      ),
  });
}

/**
 * Creates the canonical presentation model consumed by the Repository
 * Intelligence dashboard.
 *
 * This function performs no analysis. It only validates and freezes the
 * explicit MOD-001 and MOD-002 projection supplied by the caller.
 */
export function createRepositoryDashboardModel(
  input: CreateRepositoryDashboardModelInput,
): RepositoryDashboardModel {
  if (
    input.legalCertification !== false
  ) {
    throw new RepositoryDashboardModelError(
      "REPOSITORY_DASHBOARD_LEGAL_BOUNDARY_VIOLATION",
      "Repository Dashboard requires legalCertification=false",
    );
  }

  if (
    input.governance.legalCertification !== false
  ) {
    throw new RepositoryDashboardModelError(
      "REPOSITORY_DASHBOARD_GOVERNANCE_BOUNDARY_VIOLATION",
      "Repository Dashboard governance requires legalCertification=false",
    );
  }

  const generatedAt =
    normalizeOptionalString(
      input.operation?.generatedAt,
    ) ??
    new Date().toISOString();

  return Object.freeze({
    ok:
      input.ok,

    status:
      input.status,

    revision:
      REPOSITORY_DASHBOARD_MODEL_REVISION,

    version:
      REPOSITORY_DASHBOARD_MODEL_VERSION,

    identity:
      validateIdentity(
        input.identity,
      ),

    repository:
      validateRepository(
        input.repository,
      ),

    operation:
      Object.freeze({
        operationId:
          normalizeOptionalString(
            input.operation?.operationId,
          ),

        responseEvt:
          normalizeOptionalString(
            input.operation?.responseEvt,
          ),

        opcId:
          normalizeOptionalString(
            input.operation?.opcId,
          ),

        generatedAt,
      }),

    modules:
      Object.freeze(
        input.modules.map(
          (moduleStatus) =>
            Object.freeze({
              ...moduleStatus,

              moduleId:
                normalizeRequiredString(
                  moduleStatus.moduleId,
                  "modules.moduleId",
                ),

              moduleName:
                normalizeRequiredString(
                  moduleStatus.moduleName,
                  "modules.moduleName",
                ),

              version:
                normalizeRequiredString(
                  moduleStatus.version,
                  "modules.version",
                ),

              revision:
                normalizeOptionalString(
                  moduleStatus.revision,
                ),
            }),
        ),
      ),

    metrics:
      Object.freeze([
        ...(input.metrics ?? []),
      ]),

    architecture:
      validateArchitecture(
        input.architecture,
      ),

    dependencies:
      validateDependencies(
        input.dependencies,
      ),

    semantic:
      validateSemantic(
        input.semantic,
      ),

    capabilities:
      Object.freeze(
        input.capabilities.map(
          (capability) =>
            Object.freeze({
              ...capability,

              componentIds:
                Object.freeze([
                  ...capability.componentIds,
                ]),

              evidenceIds:
                Object.freeze([
                  ...capability.evidenceIds,
                ]),
            }),
        ),
      ),

    findings:
      Object.freeze(
        input.findings.map(
          (finding) =>
            Object.freeze({
              ...finding,

              componentIds:
                Object.freeze([
                  ...finding.componentIds,
                ]),

              evidenceIds:
                Object.freeze([
                  ...finding.evidenceIds,
                ]),
            }),
        ),
      ),

    recommendation:
      input.recommendation
        ? Object.freeze({
            ...input.recommendation,

            targetComponentIds:
              Object.freeze([
                ...input.recommendation
                  .targetComponentIds,
              ]),

            sourceFindingIds:
              Object.freeze([
                ...input.recommendation
                  .sourceFindingIds,
              ]),
          })
        : null,

    matrixInterpretation:
      Object.freeze({
        verifiedCapabilities:
          Object.freeze([
            ...input.matrixInterpretation
              .verifiedCapabilities,
          ]),

        implementedCapabilities:
          Object.freeze([
            ...input.matrixInterpretation
              .implementedCapabilities,
          ]),

        declaredCapabilities:
          Object.freeze([
            ...input.matrixInterpretation
              .declaredCapabilities,
          ]),

        isolatedCapabilities:
          Object.freeze([
            ...input.matrixInterpretation
              .isolatedCapabilities,
          ]),

        ambiguousDomains:
          Object.freeze([
            ...input.matrixInterpretation
              .ambiguousDomains,
          ]),

        nextPriority:
          normalizeOptionalString(
            input.matrixInterpretation
              .nextPriority,
          ),
      }),

    governance:
      Object.freeze({
        ...input.governance,

        deterministic:
          true,

        failClosed:
          true,

        evidenceBased:
          true,

        autonomousExecution:
          false,

        humanAuthorizationRequired:
          true,

        evtRequired:
          true,

        unebdoRegistrationRequired:
          true,

        opcTechnicalClosureRequired:
          true,

        matrixInterpretationRequired:
          true,

        persistentMemoryCreated:
          false,

        automaticRecallUsed:
          false,

        legalCertification:
          false,
      }),

    legalCertification:
      false,
  });
}

export const REPOSITORY_DASHBOARD_MODEL_BOUNDARY =
  Object.freeze({
    mod001ProjectionSupported:
      true,

    mod002ProjectionSupported:
      true,

    explicitInputRequired:
      true,

    analysisExecution:
      false,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    automaticRepositoryDiscovery:
      false,

    autonomousMutation:
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

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,
  });
