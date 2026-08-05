/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Governed Runtime Service
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-SERVICE-v1_0
 *
 * Purpose:
 * - expose MOD-002 through one governed runtime service;
 * - validate identity, tenant, workspace, session and authorization;
 * - execute the Repository Semantic Intelligence orchestrator;
 * - return a safe public runtime projection;
 * - preserve deterministic and fail-closed boundaries.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
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
  executeRepositorySemanticIntelligence,
  REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION,
  type RepositorySemanticOrchestratorOutput,
} from "../../modules/semantic/repository-semantic-intelligence-orchestrator";

import {
  REPOSITORY_SEMANTIC_MODULE_ID,
  REPOSITORY_SEMANTIC_MODULE_VERSION,
  type RepositorySemanticInput,
} from "../../modules/semantic/repository-semantic-intelligence.types";

export const REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-SERVICE-v1_0" as const;

export const REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_RUNTIME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

export interface RepositorySemanticIntelligenceServiceRequest {
  input: RepositorySemanticInput;

  operationId: string;

  responseEvt: string;

  opcId: string | null;

  legalCertification: false;
}

export interface RepositorySemanticIntelligenceServiceProjection {
  ok: boolean;

  status:
    | "REPOSITORY_SEMANTIC_RUNTIME_READY"
    | "REPOSITORY_SEMANTIC_RUNTIME_FAIL_CLOSED";

  moduleId:
    typeof REPOSITORY_SEMANTIC_MODULE_ID;

  moduleVersion:
    typeof REPOSITORY_SEMANTIC_MODULE_VERSION;

  serviceRevision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_REVISION;

  orchestratorRevision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION;

  runtime:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_RUNTIME;

  operation: {
    operationId: string;
    responseEvt: string;
    opcId: string | null;
  };

  identity: {
    humanIpr: string;
    runtimeIpr: string;
    tenantId: string;
    workspaceId: string;
    sessionId: string;
  };

  repository: {
    repositoryId: string;
    repositoryName: string;
    branch: string;
    commitSha: string;
  };

  result: {
    summary:
      RepositorySemanticOrchestratorOutput["summary"];

    domains:
      RepositorySemanticOrchestratorOutput["domains"];

    components:
      RepositorySemanticOrchestratorOutput["components"];

    capabilities:
      RepositorySemanticOrchestratorOutput["capabilities"];

    relations:
      RepositorySemanticOrchestratorOutput["relations"];

    findings:
      RepositorySemanticOrchestratorOutput["findings"];

    recommendation:
      RepositorySemanticOrchestratorOutput["recommendation"];

    matrixInterpretation:
      RepositorySemanticOrchestratorOutput["matrixInterpretation"];

    orchestrator:
      RepositorySemanticOrchestratorOutput["orchestrator"];
  };

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

export class RepositorySemanticIntelligenceServiceError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositorySemanticIntelligenceServiceError";

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
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_REQUIRED_STRING",
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

function validateRequest(
  request:
    RepositorySemanticIntelligenceServiceRequest,
): {
  operationId: string;
  responseEvt: string;
  opcId: string | null;
} {
  if (
    request.legalCertification !== false
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_LEGAL_BOUNDARY_VIOLATION",
      "Repository Semantic Intelligence Service requires legalCertification=false",
    );
  }

  if (
    typeof request.input !== "object" ||
    request.input === null
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_INPUT_REQUIRED",
      "input is required",
    );
  }

  if (
    request.input.humanAuthorization !==
    true
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_HUMAN_AUTHORIZATION_REQUIRED",
      "Human authorization is required before MOD-002 runtime execution",
    );
  }

  normalizeRequiredString(
    request.input.identity.humanIpr,
    "input.identity.humanIpr",
  );

  normalizeRequiredString(
    request.input.identity.runtimeIpr,
    "input.identity.runtimeIpr",
  );

  normalizeRequiredString(
    request.input.identity.tenantId,
    "input.identity.tenantId",
  );

  normalizeRequiredString(
    request.input.identity.workspaceId,
    "input.identity.workspaceId",
  );

  normalizeRequiredString(
    request.input.identity.sessionId,
    "input.identity.sessionId",
  );

  normalizeRequiredString(
    request.input.repository.repositoryId,
    "input.repository.repositoryId",
  );

  normalizeRequiredString(
    request.input.repository.repositoryName,
    "input.repository.repositoryName",
  );

  normalizeRequiredString(
    request.input.repository.branch,
    "input.repository.branch",
  );

  normalizeRequiredString(
    request.input.repository.commitSha,
    "input.repository.commitSha",
  );

  normalizeRequiredString(
    request.input.mission,
    "input.mission",
  );

  normalizeRequiredString(
    request.input.idempotencyKey,
    "input.idempotencyKey",
  );

  return Object.freeze({
    operationId:
      normalizeRequiredString(
        request.operationId,
        "operationId",
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

function validateOrchestratorOutput(
  output:
    RepositorySemanticOrchestratorOutput,
): void {
  if (
    output.legalCertification !== false
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_OUTPUT_LEGAL_BOUNDARY_VIOLATION",
      "MOD-002 orchestrator output must preserve legalCertification=false",
    );
  }

  if (
    output.governance.autonomousExecution !==
    false
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_AUTONOMOUS_EXECUTION_VIOLATION",
      "Autonomous execution is not permitted",
    );
  }

  if (
    output.governance.persistentMemoryCreated !==
    false
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_MEMORY_BOUNDARY_VIOLATION",
      "MOD-002 must not create persistent memory automatically",
    );
  }

  if (
    output.governance.automaticRecallUsed !==
    false
  ) {
    throw new RepositorySemanticIntelligenceServiceError(
      "MOD002_SERVICE_RECALL_BOUNDARY_VIOLATION",
      "MOD-002 must not use automatic recall",
    );
  }
}

function buildProjection(
  request:
    RepositorySemanticIntelligenceServiceRequest,
  validated: {
    operationId: string;
    responseEvt: string;
    opcId: string | null;
  },
  output:
    RepositorySemanticOrchestratorOutput,
): RepositorySemanticIntelligenceServiceProjection {
  return Object.freeze({
    ok:
      output.ok,

    status:
      output.ok
        ? "REPOSITORY_SEMANTIC_RUNTIME_READY"
        : "REPOSITORY_SEMANTIC_RUNTIME_FAIL_CLOSED",

    moduleId:
      REPOSITORY_SEMANTIC_MODULE_ID,

    moduleVersion:
      REPOSITORY_SEMANTIC_MODULE_VERSION,

    serviceRevision:
      REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_REVISION,

    orchestratorRevision:
      REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION,

    runtime:
      REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_RUNTIME,

    operation:
      Object.freeze({
        operationId:
          validated.operationId,

        responseEvt:
          validated.responseEvt,

        opcId:
          validated.opcId,
      }),

    identity:
      Object.freeze({
        humanIpr:
          request.input.identity.humanIpr.trim(),

        runtimeIpr:
          request.input.identity.runtimeIpr.trim(),

        tenantId:
          request.input.identity.tenantId.trim(),

        workspaceId:
          request.input.identity.workspaceId.trim(),

        sessionId:
          request.input.identity.sessionId.trim(),
      }),

    repository:
      Object.freeze({
        repositoryId:
          request.input.repository.repositoryId.trim(),

        repositoryName:
          request.input.repository.repositoryName.trim(),

        branch:
          request.input.repository.branch.trim(),

        commitSha:
          request.input.repository.commitSha.trim(),
      }),

    result:
      Object.freeze({
        summary:
          output.summary,

        domains:
          output.domains,

        components:
          output.components,

        capabilities:
          output.capabilities,

        relations:
          output.relations,

        findings:
          output.findings,

        recommendation:
          output.recommendation,

        matrixInterpretation:
          output.matrixInterpretation,

        orchestrator:
          output.orchestrator,
      }),

    governance:
      Object.freeze({
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

        humanAuthorizationVerified:
          output.governance
            .humanAuthorizationVerified,

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
 * Executes MOD-002 through the governed runtime service boundary.
 *
 * The service requires an explicit semantic input and does not discover,
 * read or mutate repository content autonomously.
 */
export function executeRepositorySemanticIntelligenceService(
  request:
    RepositorySemanticIntelligenceServiceRequest,
): RepositorySemanticIntelligenceServiceProjection {
  const validated =
    validateRequest(
      request,
    );

  const output =
    executeRepositorySemanticIntelligence(
      request.input,
    );

  validateOrchestratorOutput(
    output,
  );

  return buildProjection(
    request,
    validated,
    output,
  );
}

export const REPOSITORY_SEMANTIC_INTELLIGENCE_SERVICE_BOUNDARY =
  Object.freeze({
    moduleId:
      REPOSITORY_SEMANTIC_MODULE_ID,

    explicitSemanticInputRequired:
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

    operationBindingRequired:
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
