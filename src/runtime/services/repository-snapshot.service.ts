/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Milestone 22 — Governed Source Inspection
 *
 * Repository Snapshot Runtime Service
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-SERVICE-v1_1
 *
 * Purpose:
 * - expose one governed runtime boundary for real GitHub repository analysis;
 * - create a normalized read-only repository snapshot;
 * - optionally inspect explicitly authorized source files;
 * - merge inspected file evidence into the normalized snapshot;
 * - execute MOD-001 Repository Intelligence on the enriched snapshot;
 * - preserve fail-closed, human-authorization and legal boundaries.
 *
 * Explicit exclusions:
 * - no GitHub write operations;
 * - no raw source-content persistence;
 * - no source-code execution;
 * - no AST execution;
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
  GITHUB_SOURCE_INSPECTION_PROVIDER_REVISION,
  GitHubSourceInspectionProviderError,
  inspectGitHubSources,
  type GitHubSourceInspectionCandidate,
  type GitHubSourceInspectionProviderOutput,
} from "../../modules/providers/github-source-inspection-provider";

import type {
  RepositoryScannerFile,
  RepositoryScannerInput,
} from "../../modules/engines/repository-scanner.types";

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
  "AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-SERVICE-v1_1" as const;

export const REPOSITORY_SNAPSHOT_SERVICE_RUNTIME =
  REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME;

export interface RepositorySnapshotSourceInspectionRequest {
  enabled: boolean;

  authorizedPaths: readonly string[];

  maximumFiles?: number;

  maximumFileBytes?: number;

  maximumTotalBytes?: number;

  allowedExtensions?: readonly string[];
}

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

  sourceInspection?:
    RepositorySnapshotSourceInspectionRequest;

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

  sourceInspectionProviderRevision:
    typeof GITHUB_SOURCE_INSPECTION_PROVIDER_REVISION;

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

    rawContentRetrieved: boolean;

    rawContentPersisted: false;
  };

  sourceInspection: {
    requested: boolean;

    executed: boolean;

    authorizedPaths: number;

    inspectedFiles: number;

    skippedFiles: number;

    inspectedBytes: number;

    rawContentRetrieved: boolean;

    rawContentPersisted: false;

    sourceExecuted: false;
  };

  structural:
    RepositoryIntelligenceServiceProjection;

  governance: {
    deterministicNormalization: true;

    deterministicInspectionMerge: true;

    failClosed: true;

    evidenceBased: true;

    readOnlyGitHubAccess: true;

    explicitSourceAuthorizationRequired: true;

    rawContentRetrieved: boolean;

    rawContentPersisted: false;

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

function normalizePath(
  value: unknown,
): string {
  return normalizeRequiredString(
    value,
    "sourceInspection.authorizedPaths",
  )
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
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

function validateSourceInspectionRequest(
  sourceInspection:
    RepositorySnapshotSourceInspectionRequest | undefined,
): void {
  if (
    sourceInspection === undefined
  ) {
    return;
  }

  if (
    typeof sourceInspection !== "object" ||
    sourceInspection === null
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_INVALID_SOURCE_INSPECTION",
      "sourceInspection must be an object",
    );
  }

  if (
    typeof sourceInspection.enabled !==
    "boolean"
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_INVALID_SOURCE_INSPECTION_FLAG",
      "sourceInspection.enabled must be a boolean",
    );
  }

  if (
    !Array.isArray(
      sourceInspection.authorizedPaths,
    )
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_AUTHORIZED_PATHS_REQUIRED",
      "sourceInspection.authorizedPaths must be an array",
    );
  }

  if (
    sourceInspection.enabled &&
    sourceInspection.authorizedPaths.length === 0
  ) {
    throw new RepositorySnapshotServiceError(
      "REPOSITORY_SNAPSHOT_SERVICE_AUTHORIZED_PATHS_REQUIRED",
      "At least one authorized path is required when source inspection is enabled",
    );
  }
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

  validateSourceInspectionRequest(
    request.sourceInspection,
  );

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

function buildInspectionCandidates(
  snapshot:
    RepositoryScannerInput,
): readonly GitHubSourceInspectionCandidate[] {
  const candidates:
    GitHubSourceInspectionCandidate[] =
    [];

  for (const file of snapshot.files) {
    if (
      typeof file.hash !== "string" ||
      file.hash.trim().length === 0
    ) {
      continue;
    }

    candidates.push(
      Object.freeze({
        path:
          file.path,

        sha:
          file.hash,

        sizeBytes:
          file.sizeBytes,

        extension:
          file.extension,

        directory:
          file.directory,
      }),
    );
  }

  return Object.freeze(
    candidates,
  );
}

function buildAuthorizedPaths(
  sourceInspection:
    RepositorySnapshotSourceInspectionRequest | undefined,
): readonly string[] {
  if (
    !sourceInspection?.enabled
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    [
      ...new Set(
        sourceInspection.authorizedPaths.map(
          (path) =>
            normalizePath(
              path,
            ),
        ),
      ),
    ].sort(),
  );
}

function mergeInspectedFiles(
  snapshot:
    RepositoryScannerInput,
  inspection:
    GitHubSourceInspectionProviderOutput | null,
): RepositoryScannerInput {
  if (
    !inspection
  ) {
    return snapshot;
  }

  const inspectedByPath =
    new Map<string, RepositoryScannerFile>(
      inspection.scannerFiles.map(
        (file) => [
          file.path,
          file,
        ],
      ),
    );

  const mergedFiles =
    Object.freeze(
      snapshot.files.map(
        (file) => {
          const inspected =
            inspectedByPath.get(
              file.path,
            );

          if (
            !inspected
          ) {
            return file;
          }

          if (
            inspected.hash !==
            file.hash
          ) {
            throw new RepositorySnapshotServiceError(
              "REPOSITORY_SNAPSHOT_SERVICE_INSPECTION_HASH_MISMATCH",
              `Inspected file hash mismatch for ${file.path}`,
            );
          }

          return Object.freeze({
            ...file,

            sizeBytes:
              inspected.sizeBytes,

            inspected:
              true,
          });
        },
      ),
    );

  return Object.freeze({
    ...snapshot,

    files:
      mergedFiles,
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

function mapInspectionError(
  error:
    GitHubSourceInspectionProviderError,
): RepositorySnapshotServiceError {
  return new RepositorySnapshotServiceError(
    "REPOSITORY_SNAPSHOT_SERVICE_SOURCE_INSPECTION_FAILURE",
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
 * Creates a real GitHub repository snapshot, optionally inspects only
 * explicitly authorized source paths, merges verified inspection state,
 * and executes MOD-001 on the enriched snapshot.
 *
 * Raw source text exists only inside the inspection provider request and
 * is neither returned nor persisted by this service.
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

  const sourceInspectionRequested =
    request.sourceInspection?.enabled ===
    true;

  const authorizedPaths =
    buildAuthorizedPaths(
      request.sourceInspection,
    );

  let inspectionOutput:
    GitHubSourceInspectionProviderOutput | null =
    null;

  if (
    sourceInspectionRequested
  ) {
    try {
      inspectionOutput =
        await inspectGitHubSources({
          owner:
            providerOutput.metadata.owner,

          repository:
            providerOutput.metadata.repository,

          commitSha:
            providerOutput.snapshot.commitSha,

          candidates:
            buildInspectionCandidates(
              providerOutput.snapshot,
            ),

          authorizedPaths,

          token:
            normalizeOptionalString(
              request.github.token,
            ),

          maximumFiles:
            request.sourceInspection?.maximumFiles,

          maximumFileBytes:
            request.sourceInspection?.maximumFileBytes,

          maximumTotalBytes:
            request.sourceInspection?.maximumTotalBytes,

          allowedExtensions:
            request.sourceInspection?.allowedExtensions,

          humanAuthorization:
            true,

          legalCertification:
            false,
        });
    } catch (error) {
      if (
        error instanceof
        GitHubSourceInspectionProviderError
      ) {
        throw mapInspectionError(
          error,
        );
      }

      throw new RepositorySnapshotServiceError(
        "REPOSITORY_SNAPSHOT_SERVICE_UNKNOWN_SOURCE_INSPECTION_FAILURE",
        error instanceof Error
          ? error.message
          : "Unknown GitHub source inspection failure",
      );
    }
  }

  const enrichedSnapshot =
    mergeInspectedFiles(
      providerOutput.snapshot,
      inspectionOutput,
    );

  let structural:
    RepositoryIntelligenceServiceProjection;

  try {
    structural =
      executeRepositoryIntelligenceService({
        identity:
          validated.identity,

        repository:
          enrichedSnapshot,

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
    enrichedSnapshot.files.length;

  const inspectedFiles =
    enrichedSnapshot.files.filter(
      (file) =>
        file.inspected ===
        true,
    ).length;

  const uninspectedFiles =
    totalFiles -
    inspectedFiles;

  const rawContentRetrieved =
    inspectionOutput?.governance
      .rawContentRetrieved ===
    true;

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

    sourceInspectionProviderRevision:
      GITHUB_SOURCE_INSPECTION_PROVIDER_REVISION,

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
          enrichedSnapshot.repositoryId,

        repositoryName:
          enrichedSnapshot.repositoryName,

        branch:
          enrichedSnapshot.branch,

        commitSha:
          enrichedSnapshot.commitSha,
      }),

    snapshot:
      Object.freeze({
        metadata:
          providerOutput.metadata,

        totalFiles,

        inspectedFiles,

        uninspectedFiles,

        rawContentRetrieved,

        rawContentPersisted:
          false,
      }),

    sourceInspection:
      Object.freeze({
        requested:
          sourceInspectionRequested,

        executed:
          inspectionOutput !==
          null,

        authorizedPaths:
          authorizedPaths.length,

        inspectedFiles:
          inspectionOutput?.summary
            .inspectedFiles ??
          0,

        skippedFiles:
          inspectionOutput?.summary
            .skippedFiles ??
          0,

        inspectedBytes:
          inspectionOutput?.summary
            .inspectedBytes ??
          0,

        rawContentRetrieved,

        rawContentPersisted:
          false,

        sourceExecuted:
          false,
      }),

    structural,

    governance:
      Object.freeze({
        deterministicNormalization:
          true,

        deterministicInspectionMerge:
          true,

        failClosed:
          true,

        evidenceBased:
          true,

        readOnlyGitHubAccess:
          true,

        explicitSourceAuthorizationRequired:
          true,

        rawContentRetrieved,

        rawContentPersisted:
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

    explicitSourceAuthorizationRequired:
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
      true,

    rawContentReturn:
      false,

    rawContentPersistence:
      false,

    sourceInspectionOptional:
      true,

    inspectedFileMerge:
      true,

    mod001Integrated:
      true,

    mod002Integrated:
      false,

    sourceExecution:
      false,

    astExecution:
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
