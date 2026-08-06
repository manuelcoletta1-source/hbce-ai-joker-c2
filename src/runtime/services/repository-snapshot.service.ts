/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Milestone 21 — Real Repository Analysis
 *
 * Repository Snapshot Runtime Service
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-SERVICE-v1_0
 *
 * Purpose:
 * - expose one governed runtime boundary for real GitHub repository analysis;
 * - create a normalized read-only repository snapshot;
 * - execute MOD-001 Repository Intelligence on the normalized snapshot;
 * - return the provider evidence and structural intelligence projection;
 * - preserve fail-closed, human-authorization and legal boundaries.
 *
 * Explicit exclusions:
 * - no GitHub write operations;
 * - no raw source-content retrieval;
 * - no source-code execution;
 * - no AST parsing;
 * - no autonomous repository mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory creation;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import {
  createGitHubRepositorySnapshot,
  GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION,
  GitHubRepositorySnapshotProviderError,
  type GitHubRepositorySnapshotMetadata,
  type GitHubRepositorySnapshotProviderInput,
} from "../../modules/providers/github-repository-snapshot-provider";

import {
  executeRepositoryIntelligenceService,
  REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID,
  REPOSITORY_INTELLIGENCE_SERVICE_REVISION,
  REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME,
  RepositoryIntelligenceServiceError,
  type RepositoryIntelligenceServiceIdentity,
  type RepositoryIntelligenceServiceProjection,
} from "./repository-intelligence.service";

export const REPOSITORY_SNAPSHOT_SERVICE_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-SERVICE-v1_0" as const;

export const REPOSITORY_SNAPSHOT_SERVICE_RUNTIME =
  REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME;

export interface RepositorySnapshotServiceRequest {
  identity:
    RepositoryIntelligenceServiceIdentity;

  github: {
    owner: string;

    repository: string;

    branch: string;

    token?: string | null;

    repositoryId?: string | null;

    maximumFiles?: number;

    excludedPathPrefixes?: readonly string[];
  };

  mission: string;

  operationId: string;

  idempotencyKey: string;

  responseEvt: string;

  opcId?: string | null;

  humanAuthorization: boolean;

  legalCertification: false;
}

export interface RepositorySnapshotServiceProjection {
  ok: boolean;

  status:
    | "REPOSITORY_SNAPSHOT_ANALYSIS_READY"
    | "REPOSITORY_SNAPSHOT_ANALYSIS_FAIL_CLOSED";

  revision:
    typeof REPOSITORY_SNAPSHOT_SERVICE_REVISION;

  runtime:
    typeof REPOSITORY_SNAPSHOT_SERVICE_RUNTIME;

  moduleId:
    typeof REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID;

  providerRevision:
    typeof GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION;

  repositoryIntelligenceServiceRevision:
    typeof REPOSITORY_INTELLIGENCE_SERVICE_REVISION;

  operation: {
    operationId: string;

    idempotencyKey: string;

    responseEvt: string;

    opcId: string | null;
  };

  identity:
    RepositoryIntelligenceServiceIdentity;

  repository: {
    owner: string;

    repositoryId: string;

    repositoryName: string;

    branch: string;

    commitSha: string;
  };

  snapshot: {
    metadata:
      GitHubRepositorySnapshotMetadata;

    totalFiles: number;

    inspectedFiles: number;

    uninspectedFiles: number;

    rawContentRetrieved: false;
  };

  structural:
    RepositoryIntelligenceServiceProjection;

  governance: {
    deterministicNormalization: true;

    failClosed: true;

    evidenceBased: true;

    readOnlyGitHubAccess: true;

    rawContentRetrieved: false;

    sourceExecution: false;

    autonomousExecution: false;

    autonomousMutation: false;

    humanAuthorizationRequired: true;

    humanAuthorizationVerified: true;

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

export class RepositorySnapshotServiceError
  extends Error {
  readonly code:
    string;

  readonly causeCode:
    string | null;

  readonly httpStatus:
    number | null;

  constructor(
    code: string,
    message: string,
    options?: {
      causeCode?: string | null;

      httpStatus?: number | null;
    },
  ) {
    super(message);

    this.name =
      "RepositorySnapshotServiceError";

    this.code =
      code;

    this.causeCode =
      options?.causeCode ??
      null;

    this.httpStatus =
      options?.httpStatus ??
      null;
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
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_REQUIRED_STRING",
      `${fieldName} must be a non-empty string`,
    );
  }

  return value.trim();
}

function normalizeOptionalString(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function validateIdentity(
  identity:
    RepositoryIntelligenceServiceIdentity,
): RepositoryIntelligenceServiceIdentity {
  if (
    typeof identity !== "object" ||
    identity === null
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_IDENTITY_REQUIRED",
      "identity is required",
    );
  }

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

function validateRequest(
  request:
    RepositorySnapshotServiceRequest,
): {
  identity:
    RepositoryIntelligenceServiceIdentity;

  mission:
    string;

  operationId:
    string;

  idempotencyKey:
    string;

  responseEvt:
    string;

  opcId:
    string | null;
} {
  if (
    request.legalCertification !==
    false
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_LEGAL_BOUNDARY_VIOLATION",
      "Repository Snapshot Service requires legalCertification=false",
    );
  }

  if (
    request.humanAuthorization !==
    true
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_HUMAN_AUTHORIZATION_REQUIRED",
      "Human authorization is required before repository snapshot analysis",
    );
  }

  if (
    typeof request.github !== "object" ||
    request.github === null
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_GITHUB_INPUT_REQUIRED",
      "github input is required",
    );
  }

  return Object.freeze({
    identity:
      validateIdentity(
        request.identity,
      ),

    mission:
      normalizeRequiredString(
        request.mission,
        "mission",
      ),

    operationId:
      normalizeRequiredString(
        request.operationId,
        "operationId",
      ),

    idempotencyKey:
      normalizeRequiredString(
        request.idempotencyKey,
        "idempotencyKey",
      ),

    responseEvt:
      normalizeRequiredString(
        request.responseEvt,
        "responseEvt",
      ),

    opcId:
      normalizeOptionalString(
        request.opcId,
      ),
  });
}

function buildProviderInput(
  request:
    RepositorySnapshotServiceRequest,
): GitHubRepositorySnapshotProviderInput {
  return Object.freeze({
    owner:
      normalizeRequiredString(
        request.github.owner,
        "github.owner",
      ),

    repository:
      normalizeRequiredString(
        request.github.repository,
        "github.repository",
      ),

    branch:
      normalizeRequiredString(
        request.github.branch,
        "github.branch",
      ),

    token:
      normalizeOptionalString(
        request.github.token,
      ),

    repositoryId:
      normalizeOptionalString(
        request.github.repositoryId,
      ),

    maximumFiles:
      request.github.maximumFiles,

    excludedPathPrefixes:
      request.github.excludedPathPrefixes,

    humanAuthorization:
      true,

    legalCertification:
      false,
  });
}

function validateStructuralProjection(
  structural:
    RepositoryIntelligenceServiceProjection,
): void {
  if (
    structural.legalCertification !==
    false
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_STRUCTURAL_LEGAL_BOUNDARY_VIOLATION",
      "MOD-001 projection must preserve legalCertification=false",
    );
  }

  if (
    structural.governance
      .autonomousExecution !==
    false
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_AUTONOMOUS_EXECUTION_VIOLATION",
      "MOD-001 projection must not permit autonomous execution",
    );
  }

  if (
    structural.governance
      .persistentMemoryCreated !==
    false
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_MEMORY_BOUNDARY_VIOLATION",
      "MOD-001 projection must not create persistent memory",
    );
  }

  if (
    structural.governance
      .automaticRecallUsed !==
    false
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_RECALL_BOUNDARY_VIOLATION",
      "MOD-001 projection must not use automatic recall",
    );
  }
}

function mapProviderError(
  error:
    GitHubRepositorySnapshotProviderError,
): RepositorySnapshotServiceError {
  return new RepositorySnapshotServiceError(
    "REPOSITORY_SNAPSHOT_SERVICE_PROVIDER_FAILURE",
    error.message,
    {
      causeCode:
        error.code,

      httpStatus:
        error.httpStatus,
    },
  );
}

function mapStructuralError(
  error:
    RepositoryIntelligenceServiceError,
): RepositorySnapshotServiceError {
  return new RepositorySnapshotServiceError(
    "REPOSITORY_SNAPSHOT_SERVICE_STRUCTURAL_FAILURE",
    error.message,
    {
      causeCode:
        error.code,

      httpStatus:
        null,
    },
  );
}

/**
 * Creates a real repository snapshot from GitHub and executes MOD-001.
 *
 * The provider intentionally marks every GitHub tree file as
 * inspected=false because raw source contents are not retrieved.
 *
 * As a result, MOD-001 may return a fail-closed structural projection
 * when the requested operation requires inspected source evidence.
 * That state is preserved and exposed honestly rather than converted
 * into a fabricated successful analysis.
 */
export async function executeRepositorySnapshotService(
  request:
    RepositorySnapshotServiceRequest,
): Promise<RepositorySnapshotServiceProjection> {
  const validated =
    validateRequest(
      request,
    );

  const providerInput =
    buildProviderInput(
      request,
    );

  let providerOutput:
    Awaited<
      ReturnType<
        typeof createGitHubRepositorySnapshot
      >
    >;

  try {
    providerOutput =
      await createGitHubRepositorySnapshot(
        providerInput,
      );
  } catch (error) {
    if (
      error instanceof
      GitHubRepositorySnapshotProviderError
    ) {
      throw mapProviderError(
        error,
      );
    }

    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_UNKNOWN_PROVIDER_FAILURE",
      error instanceof Error
        ? error.message
        : "Unknown GitHub repository snapshot provider failure",
    );
  }

  let structural:
    RepositoryIntelligenceServiceProjection;

  try {
    structural =
      executeRepositoryIntelligenceService({
        identity:
          validated.identity,

        repository:
          providerOutput.snapshot,

        mission:
          validated.mission,

        idempotencyKey:
          validated.idempotencyKey,

        humanAuthorization:
          true,

        legalCertification:
          false,
      });
  } catch (error) {
    if (
      error instanceof
      RepositoryIntelligenceServiceError
    ) {
      throw mapStructuralError(
        error,
      );
    }

    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_UNKNOWN_STRUCTURAL_FAILURE",
      error instanceof Error
        ? error.message
        : "Unknown MOD-001 repository intelligence failure",
    );
  }

  validateStructuralProjection(
    structural,
  );

  const totalFiles =
    providerOutput.snapshot.files.length;

  const inspectedFiles =
    providerOutput.snapshot.files.filter(
      (file) =>
        file.inspected ===
        true,
    ).length;

  const uninspectedFiles =
    totalFiles -
    inspectedFiles;

  const ok =
    structural.result
      .architecture.ok ===
    true;

  return Object.freeze({
    ok,

    status:
      ok
        ? "REPOSITORY_SNAPSHOT_ANALYSIS_READY"
        : "REPOSITORY_SNAPSHOT_ANALYSIS_FAIL_CLOSED",

    revision:
      REPOSITORY_SNAPSHOT_SERVICE_REVISION,

    runtime:
      REPOSITORY_SNAPSHOT_SERVICE_RUNTIME,

    moduleId:
      REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID,

    providerRevision:
      GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION,

    repositoryIntelligenceServiceRevision:
      REPOSITORY_INTELLIGENCE_SERVICE_REVISION,

    operation:
      Object.freeze({
        operationId:
          validated.operationId,

        idempotencyKey:
          validated.idempotencyKey,

        responseEvt:
          validated.responseEvt,

        opcId:
          validated.opcId,
      }),

    identity:
      validated.identity,

    repository:
      Object.freeze({
        owner:
          providerOutput.metadata.owner,

        repositoryId:
          providerOutput.snapshot
            .repositoryId,

        repositoryName:
          providerOutput.snapshot
            .repositoryName,

        branch:
          providerOutput.snapshot
            .branch,

        commitSha:
          providerOutput.snapshot
            .commitSha,
      }),

    snapshot:
      Object.freeze({
        metadata:
          providerOutput.metadata,

        totalFiles,

        inspectedFiles,

        uninspectedFiles,

        rawContentRetrieved:
          false,
      }),

    structural,

    governance:
      Object.freeze({
        deterministicNormalization:
          true,

        failClosed:
          true,

        evidenceBased:
          true,

        readOnlyGitHubAccess:
          true,

        rawContentRetrieved:
          false,

        sourceExecution:
          false,

        autonomousExecution:
          false,

        autonomousMutation:
          false,

        humanAuthorizationRequired:
          true,

        humanAuthorizationVerified:
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

export const REPOSITORY_SNAPSHOT_SERVICE_BOUNDARY =
  Object.freeze({
    explicitGitHubRepositoryRequired:
      true,

    explicitBranchRequired:
      true,

    explicitMissionRequired:
      true,

    identityBindingRequired:
      true,

    tenantBindingRequired:
      true,

    workspaceBindingRequired:
      true,

    sessionBindingRequired:
      true,

    operationBindingRequired:
      true,

    idempotencyKeyRequired:
      true,

    humanAuthorizationRequired:
      true,

    githubReadOnly:
      true,

    recursiveTreeRead:
      true,

    rawContentRetrieval:
      false,

    mod001Integrated:
      true,

    mod002Integrated:
      false,

    sourceExecution:
      false,

    astParsing:
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

    legalCertification:
      false,
  });
