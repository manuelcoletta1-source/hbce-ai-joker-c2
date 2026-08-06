/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Milestone 21 — Real Repository Analysis
 *
 * Governed Repository Snapshot Runtime API
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-API-v1_0
 *
 * Purpose:
 * - expose the governed Repository Snapshot Runtime Service;
 * - accept an explicit GitHub repository and branch;
 * - preserve read-only GitHub access;
 * - execute MOD-001 through the snapshot service;
 * - reject malformed or unauthorized requests fail-closed.
 *
 * Explicit exclusions:
 * - no GitHub write operations;
 * - no raw source-content retrieval;
 * - no source-code execution;
 * - no AST parsing;
 * - no automatic repository discovery;
 * - no autonomous repository mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory creation;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  executeRepositorySnapshotService,
  RepositorySnapshotServiceError,
  type RepositorySnapshotServiceRequest,
} from "../../../../src/runtime/services/repository-snapshot.service";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration =
  60;

const REPOSITORY_SNAPSHOT_API_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-API-v1_0" as const;

const REPOSITORY_SNAPSHOT_API_ENDPOINT =
  "/api/runtime/repository-snapshot" as const;

type UnknownRecord =
  Record<string, unknown>;

type RepositorySnapshotApiFailureReason =
  | "INVALID_JSON_BODY"
  | "INVALID_REQUEST"
  | "HUMAN_AUTHORIZATION_REQUIRED"
  | "LEGAL_BOUNDARY_VIOLATION"
  | "GITHUB_PROVIDER_FAILURE"
  | "STRUCTURAL_ANALYSIS_FAILURE"
  | "REPOSITORY_ANALYSIS_FAIL_CLOSED"
  | "INTERNAL_RUNTIME_ERROR";

interface RepositorySnapshotApiFailurePayload {
  ok: false;

  status:
    "REPOSITORY_SNAPSHOT_API_FAIL_CLOSED";

  revision:
    typeof REPOSITORY_SNAPSHOT_API_REVISION;

  endpoint:
    typeof REPOSITORY_SNAPSHOT_API_ENDPOINT;

  failureReason:
    RepositorySnapshotApiFailureReason;

  message:
    string;

  errorCode:
    string | null;

  causeCode:
    string | null;

  governance: {
    deterministic:
      true;

    failClosed:
      true;

    readOnlyGitHubAccess:
      true;

    rawContentRetrieved:
      false;

    autonomousExecution:
      false;

    autonomousMutation:
      false;

    humanAuthorizationRequired:
      true;

    persistentMemoryCreated:
      false;

    automaticRecallUsed:
      false;

    legalCertification:
      false;
  };

  legalCertification:
    false;
}

interface RepositorySnapshotApiContractPayload {
  ok: true;

  status:
    "REPOSITORY_SNAPSHOT_API_READY";

  revision:
    typeof REPOSITORY_SNAPSHOT_API_REVISION;

  endpoint:
    typeof REPOSITORY_SNAPSHOT_API_ENDPOINT;

  method:
    "POST";

  purpose:
    "Create a governed read-only GitHub repository snapshot and execute MOD-001 Repository Intelligence.";

  requiredInput: readonly [
    "identity",
    "github",
    "mission",
    "operationId",
    "idempotencyKey",
    "responseEvt",
    "humanAuthorization:true",
    "legalCertification:false",
  ];

  optionalInput: readonly [
    "github.token",
    "github.repositoryId",
    "github.maximumFiles",
    "github.excludedPathPrefixes",
    "opcId",
  ];

  boundary: {
    explicitRepositoryRequired:
      true;

    explicitBranchRequired:
      true;

    readOnlyGitHubAccess:
      true;

    rawContentRetrieval:
      false;

    sourceExecution:
      false;

    astParsing:
      false;

    autonomousMutation:
      false;

    persistentMemory:
      false;

    automaticRecall:
      false;

    humanAuthorizationRequired:
      true;

    legalCertification:
      false;
  };

  generatedAt:
    string;

  legalCertification:
    false;
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function validateIdentity(
  value: unknown,
): boolean {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  return (
    isNonEmptyString(
      value.humanIpr,
    ) &&
    isNonEmptyString(
      value.runtimeIpr,
    ) &&
    isNonEmptyString(
      value.tenantId,
    ) &&
    isNonEmptyString(
      value.workspaceId,
    ) &&
    isNonEmptyString(
      value.sessionId,
    )
  );
}

function validateGitHubInput(
  value: unknown,
): boolean {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      value.owner,
    ) ||
    !isNonEmptyString(
      value.repository,
    ) ||
    !isNonEmptyString(
      value.branch,
    )
  ) {
    return false;
  }

  if (
    value.token !==
      undefined &&
    value.token !==
      null &&
    typeof value.token !==
      "string"
  ) {
    return false;
  }

  if (
    value.repositoryId !==
      undefined &&
    value.repositoryId !==
      null &&
    typeof value.repositoryId !==
      "string"
  ) {
    return false;
  }

  if (
    value.maximumFiles !==
      undefined &&
    (
      typeof value.maximumFiles !==
        "number" ||
      !Number.isInteger(
        value.maximumFiles,
      )
    )
  ) {
    return false;
  }

  if (
    value.excludedPathPrefixes !==
      undefined &&
    (
      !Array.isArray(
        value.excludedPathPrefixes,
      ) ||
      !value.excludedPathPrefixes.every(
        (prefix) =>
          typeof prefix ===
          "string",
      )
    )
  ) {
    return false;
  }

  return true;
}

function validateRequestEnvelope(
  value: unknown,
): value is RepositorySnapshotServiceRequest {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  if (
    !validateIdentity(
      value.identity,
    ) ||
    !validateGitHubInput(
      value.github,
    )
  ) {
    return false;
  }

  if (
    !isNonEmptyString(
      value.mission,
    ) ||
    !isNonEmptyString(
      value.operationId,
    ) ||
    !isNonEmptyString(
      value.idempotencyKey,
    ) ||
    !isNonEmptyString(
      value.responseEvt,
    )
  ) {
    return false;
  }

  if (
    value.opcId !==
      undefined &&
    value.opcId !==
      null &&
    typeof value.opcId !==
      "string"
  ) {
    return false;
  }

  if (
    value.humanAuthorization !==
      true
  ) {
    return false;
  }

  if (
    value.legalCertification !==
      false
  ) {
    return false;
  }

  return true;
}

function buildFailurePayload(
  failureReason:
    RepositorySnapshotApiFailureReason,
  message:
    string,
  errorCode:
    string | null = null,
  causeCode:
    string | null = null,
): RepositorySnapshotApiFailurePayload {
  return Object.freeze({
    ok:
      false,

    status:
      "REPOSITORY_SNAPSHOT_API_FAIL_CLOSED",

    revision:
      REPOSITORY_SNAPSHOT_API_REVISION,

    endpoint:
      REPOSITORY_SNAPSHOT_API_ENDPOINT,

    failureReason,

    message,

    errorCode,

    causeCode,

    governance:
      Object.freeze({
        deterministic:
          true,

        failClosed:
          true,

        readOnlyGitHubAccess:
          true,

        rawContentRetrieved:
          false,

        autonomousExecution:
          false,

        autonomousMutation:
          false,

        humanAuthorizationRequired:
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

function buildContractPayload():
  RepositorySnapshotApiContractPayload {
  return Object.freeze({
    ok:
      true,

    status:
      "REPOSITORY_SNAPSHOT_API_READY",

    revision:
      REPOSITORY_SNAPSHOT_API_REVISION,

    endpoint:
      REPOSITORY_SNAPSHOT_API_ENDPOINT,

    method:
      "POST",

    purpose:
      "Create a governed read-only GitHub repository snapshot and execute MOD-001 Repository Intelligence.",

    requiredInput:
      Object.freeze([
        "identity",
        "github",
        "mission",
        "operationId",
        "idempotencyKey",
        "responseEvt",
        "humanAuthorization:true",
        "legalCertification:false",
      ] as const),

    optionalInput:
      Object.freeze([
        "github.token",
        "github.repositoryId",
        "github.maximumFiles",
        "github.excludedPathPrefixes",
        "opcId",
      ] as const),

    boundary:
      Object.freeze({
        explicitRepositoryRequired:
          true,

        explicitBranchRequired:
          true,

        readOnlyGitHubAccess:
          true,

        rawContentRetrieval:
          false,

        sourceExecution:
          false,

        astParsing:
          false,

        autonomousMutation:
          false,

        persistentMemory:
          false,

        automaticRecall:
          false,

        humanAuthorizationRequired:
          true,

        legalCertification:
          false,
      }),

    generatedAt:
      new Date().toISOString(),

    legalCertification:
      false,
  });
}

function classifyServiceFailure(
  error:
    RepositorySnapshotServiceError,
): RepositorySnapshotApiFailureReason {
  if (
    error.code.includes(
      "HUMAN_AUTHORIZATION",
    )
  ) {
    return "HUMAN_AUTHORIZATION_REQUIRED";
  }

  if (
    error.code.includes(
      "LEGAL_BOUNDARY",
    )
  ) {
    return "LEGAL_BOUNDARY_VIOLATION";
  }

  if (
    error.code.includes(
      "PROVIDER_FAILURE",
    )
  ) {
    return "GITHUB_PROVIDER_FAILURE";
  }

  if (
    error.code.includes(
      "STRUCTURAL_FAILURE",
    )
  ) {
    return "STRUCTURAL_ANALYSIS_FAILURE";
  }

  return "INVALID_REQUEST";
}

function resolveHttpStatus(
  failureReason:
    RepositorySnapshotApiFailureReason,
  providerStatus:
    number | null = null,
): number {
  switch (
    failureReason
  ) {
    case "INVALID_JSON_BODY":
    case "INVALID_REQUEST":
      return 400;

    case "HUMAN_AUTHORIZATION_REQUIRED":
      return 403;

    case "LEGAL_BOUNDARY_VIOLATION":
      return 422;

    case "GITHUB_PROVIDER_FAILURE":
      if (
        providerStatus ===
        401 ||
        providerStatus ===
        403 ||
        providerStatus ===
        404 ||
        providerStatus ===
        422 ||
        providerStatus ===
        429
      ) {
        return providerStatus;
      }

      return 502;

    case "STRUCTURAL_ANALYSIS_FAILURE":
    case "REPOSITORY_ANALYSIS_FAIL_CLOSED":
      return 409;

    case "INTERNAL_RUNTIME_ERROR":
      return 500;

    default:
      return 500;
  }
}

/**
 * Returns the public read-only API contract.
 *
 * No GitHub access or repository analysis is performed by GET.
 */
export async function GET():
  Promise<NextResponse> {
  return NextResponse.json(
    buildContractPayload(),
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

/**
 * Creates a real read-only GitHub repository snapshot and executes
 * MOD-001 Repository Intelligence through its governed runtime service.
 */
export async function POST(
  request:
    NextRequest,
): Promise<NextResponse> {
  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    const failureReason:
      RepositorySnapshotApiFailureReason =
      "INVALID_JSON_BODY";

    return NextResponse.json(
      buildFailurePayload(
        failureReason,
        "The request body must contain valid JSON.",
      ),
      {
        status:
          resolveHttpStatus(
            failureReason,
          ),

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  if (
    !validateRequestEnvelope(
      body,
    )
  ) {
    const failureReason:
      RepositorySnapshotApiFailureReason =
      "INVALID_REQUEST";

    return NextResponse.json(
      buildFailurePayload(
        failureReason,
        "The request does not satisfy the governed Repository Snapshot API contract.",
      ),
      {
        status:
          resolveHttpStatus(
            failureReason,
          ),

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  try {
    const result =
      await executeRepositorySnapshotService(
        body,
      );

    return NextResponse.json(
      {
        ...result,

        apiRevision:
          REPOSITORY_SNAPSHOT_API_REVISION,

        endpoint:
          REPOSITORY_SNAPSHOT_API_ENDPOINT,
      },
      {
        status:
          result.ok
            ? 200
            : 409,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    if (
      error instanceof
      RepositorySnapshotServiceError
    ) {
      const failureReason =
        classifyServiceFailure(
          error,
        );

      return NextResponse.json(
        buildFailurePayload(
          failureReason,
          error.message,
          error.code,
          error.causeCode,
        ),
        {
          status:
            resolveHttpStatus(
              failureReason,
              error.httpStatus,
            ),

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const failureReason:
      RepositorySnapshotApiFailureReason =
      "INTERNAL_RUNTIME_ERROR";

    return NextResponse.json(
      buildFailurePayload(
        failureReason,
        error instanceof Error
          ? error.message
          : "An unknown Repository Snapshot runtime error occurred.",
      ),
      {
        status:
          resolveHttpStatus(
            failureReason,
          ),

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}
