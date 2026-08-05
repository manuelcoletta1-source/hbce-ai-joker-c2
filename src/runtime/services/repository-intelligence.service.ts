/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-001 Repository Intelligence Runtime Service
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-SERVICE-v1_0
 *
 * Purpose:
 * - expose MOD-001 through one governed runtime service;
 * - validate identity, tenant, workspace and authorization context;
 * - execute the deterministic Repository Intelligence orchestrator;
 * - return a safe runtime projection;
 * - preserve fail-closed and human-authorization boundaries.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no autonomous repository mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory creation;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import {
  executeRepositoryIntelligence,
  REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION,
  type RepositoryIntelligenceResult,
} from "../../modules/engines/repository-intelligence-orchestrator";

import type {
  RepositoryScannerInput,
} from "../../modules/engines/repository-scanner.types";

export const REPOSITORY_INTELLIGENCE_SERVICE_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-SERVICE-v1_0" as const;

export const REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID =
  "MOD-001" as const;

export const REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

export interface RepositoryIntelligenceServiceIdentity {
  humanIpr: string;
  runtimeIpr: string;
  tenantId: string;
  workspaceId: string;
  sessionId: string;
}

export interface RepositoryIntelligenceServiceRequest {
  identity: RepositoryIntelligenceServiceIdentity;

  repository: RepositoryScannerInput;

  mission: string;

  idempotencyKey: string;

  humanAuthorization: boolean;

  legalCertification: false;
}

export interface RepositoryIntelligenceServiceProjection {
  moduleId: typeof REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID;

  serviceRevision:
    typeof REPOSITORY_INTELLIGENCE_SERVICE_REVISION;

  orchestratorRevision:
    typeof REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION;

  runtime:
    typeof REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME;

  identity: {
    humanIpr: string;
    runtimeIpr: string;
    tenantId: string;
    workspaceId: string;
    sessionId: string;
  };

  request: {
    mission: string;
    idempotencyKey: string;
    repositoryId: string;
    repositoryName: string;
    branch: string;
    commitSha: string;
  };

  result: {
    scan: RepositoryIntelligenceResult["scan"];
    architecture: RepositoryIntelligenceResult["architecture"];
    dependencyGraph: RepositoryIntelligenceResult["dependencyGraph"];
    risks: RepositoryIntelligenceResult["risks"];
    mutationPlan: RepositoryIntelligenceResult["mutationPlan"];
  };

  governance: {
    deterministic: true;
    failClosed: true;
    autonomousExecution: false;
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

export class RepositoryIntelligenceServiceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryIntelligenceServiceError";
    this.code = code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new RepositoryIntelligenceServiceError(
      "REPOSITORY_INTELLIGENCE_SERVICE_REQUIRED_STRING",
      `${fieldName} must be a string`,
    );
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RepositoryIntelligenceServiceError(
      "REPOSITORY_INTELLIGENCE_SERVICE_REQUIRED_STRING",
      `${fieldName} must not be empty`,
    );
  }

  return normalized;
}

function validateIdentity(
  identity: RepositoryIntelligenceServiceIdentity,
): RepositoryIntelligenceServiceIdentity {
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
  request: RepositoryIntelligenceServiceRequest,
): {
  identity: RepositoryIntelligenceServiceIdentity;
  mission: string;
  idempotencyKey: string;
} {
  if (request.legalCertification !== false) {
    throw new RepositoryIntelligenceServiceError(
      "REPOSITORY_INTELLIGENCE_SERVICE_LEGAL_BOUNDARY_VIOLATION",
      "Repository Intelligence Service requires legalCertification=false",
    );
  }

  if (request.humanAuthorization !== true) {
    throw new RepositoryIntelligenceServiceError(
      "REPOSITORY_INTELLIGENCE_SERVICE_HUMAN_AUTHORIZATION_REQUIRED",
      "Human authorization is required before MOD-001 runtime execution",
    );
  }

  if (
    typeof request.repository !== "object" ||
    request.repository === null
  ) {
    throw new RepositoryIntelligenceServiceError(
      "REPOSITORY_INTELLIGENCE_SERVICE_REPOSITORY_REQUIRED",
      "repository input is required",
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

    idempotencyKey:
      normalizeRequiredString(
        request.idempotencyKey,
        "idempotencyKey",
      ),
  });
}

function buildSafeProjection(
  request: RepositoryIntelligenceServiceRequest,
  validated: {
    identity: RepositoryIntelligenceServiceIdentity;
    mission: string;
    idempotencyKey: string;
  },
  result: RepositoryIntelligenceResult,
): RepositoryIntelligenceServiceProjection {
  return Object.freeze({
    moduleId:
      REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID,

    serviceRevision:
      REPOSITORY_INTELLIGENCE_SERVICE_REVISION,

    orchestratorRevision:
      REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION,

    runtime:
      REPOSITORY_INTELLIGENCE_SERVICE_RUNTIME,

    identity:
      Object.freeze({
        humanIpr:
          validated.identity.humanIpr,

        runtimeIpr:
          validated.identity.runtimeIpr,

        tenantId:
          validated.identity.tenantId,

        workspaceId:
          validated.identity.workspaceId,

        sessionId:
          validated.identity.sessionId,
      }),

    request:
      Object.freeze({
        mission:
          validated.mission,

        idempotencyKey:
          validated.idempotencyKey,

        repositoryId:
          request.repository.repositoryId,

        repositoryName:
          request.repository.repositoryName,

        branch:
          request.repository.branch,

        commitSha:
          request.repository.commitSha,
      }),

    result:
      Object.freeze({
        scan:
          result.scan,

        architecture:
          result.architecture,

        dependencyGraph:
          result.dependencyGraph,

        risks:
          result.risks,

        mutationPlan:
          result.mutationPlan,
      }),

    governance:
      Object.freeze({
        deterministic:
          true,

        failClosed:
          true,

        autonomousExecution:
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

/**
 * Executes MOD-001 through the governed runtime service boundary.
 *
 * This service does not perform repository discovery. The caller must
 * provide an explicit RepositoryScannerInput assembled from observed
 * repository evidence.
 */
export function executeRepositoryIntelligenceService(
  request: RepositoryIntelligenceServiceRequest,
): RepositoryIntelligenceServiceProjection {
  const validated =
    validateRequest(request);

  const result =
    executeRepositoryIntelligence(
      request.repository,
    );

  return buildSafeProjection(
    request,
    validated,
    result,
  );
}

export const REPOSITORY_INTELLIGENCE_SERVICE_BOUNDARY =
  Object.freeze({
    moduleId:
      REPOSITORY_INTELLIGENCE_SERVICE_MODULE_ID,

    explicitRepositoryInputRequired:
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

    deterministicExecution:
      true,

    failClosed:
      true,

    filesystemAccess:
      false,

    githubApiAccess:
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

    evtPersistence:
      false,

    unebdoPersistence:
      false,

    opcPersistence:
      false,

    matrixPersistence:
      false,

    legalCertification:
      false,
  });
