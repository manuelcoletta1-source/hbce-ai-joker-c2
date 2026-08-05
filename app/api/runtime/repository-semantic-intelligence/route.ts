/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Governed Runtime API Route
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-API-v1_0
 *
 * Purpose:
 * - expose the governed MOD-002 runtime service;
 * - accept only explicit semantic input;
 * - validate the public request envelope;
 * - execute no autonomous repository discovery or mutation;
 * - preserve fail-closed and legal boundaries.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no AST parsing;
 * - no automatic repository discovery;
 * - no autonomous mutation;
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
  executeRepositorySemanticIntelligenceService,
  RepositorySemanticIntelligenceServiceError,
  type RepositorySemanticIntelligenceServiceRequest,
} from "../../../../src/runtime/services/repository-semantic-intelligence.service";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration =
  60;

export const REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-API-v1_0" as const;

const REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT =
  "/api/runtime/repository-semantic-intelligence" as const;

type UnknownRecord =
  Record<string, unknown>;

type RepositorySemanticApiFailReason =
  | "INVALID_JSON_BODY"
  | "INVALID_REQUEST"
  | "HUMAN_AUTHORIZATION_REQUIRED"
  | "LEGAL_BOUNDARY_VIOLATION"
  | "SEMANTIC_RUNTIME_FAIL_CLOSED"
  | "INTERNAL_RUNTIME_ERROR";

interface RepositorySemanticApiFailPayload {
  ok: false;

  status:
    "REPOSITORY_SEMANTIC_API_FAIL_CLOSED";

  revision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION;

  endpoint:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT;

  failReason:
    RepositorySemanticApiFailReason;

  message:
    string;

  errorCode:
    string | null;

  governance: {
    deterministic:
      true;

    failClosed:
      true;

    autonomousExecution:
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

interface RepositorySemanticApiContractPayload {
  ok: true;

  status:
    "REPOSITORY_SEMANTIC_API_READY";

  revision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION;

  endpoint:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT;

  method:
    "POST";

  moduleId:
    "MOD-002";

  moduleName:
    "Repository Semantic Intelligence";

  purpose:
    "Execute governed Repository Semantic Intelligence from explicit repository evidence.";

  requiredInput: readonly [
    "input",
    "operationId",
    "responseEvt",
    "legalCertification:false",
  ];

  optionalInput: readonly [
    "opcId",
  ];

  boundary: {
    explicitInputRequired:
      true;

    explicitEvidenceRequired:
      true;

    filesystemAccess:
      false;

    githubApiAccess:
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
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function buildFailPayload(
  failReason:
    RepositorySemanticApiFailReason,
  message:
    string,
  errorCode:
    string | null = null,
): RepositorySemanticApiFailPayload {
  return Object.freeze({
    ok:
      false,

    status:
      "REPOSITORY_SEMANTIC_API_FAIL_CLOSED",

    revision:
      REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION,

    endpoint:
      REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT,

    failReason,

    message,

    errorCode,

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
  RepositorySemanticApiContractPayload {
  return Object.freeze({
    ok:
      true,

    status:
      "REPOSITORY_SEMANTIC_API_READY",

    revision:
      REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION,

    endpoint:
      REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT,

    method:
      "POST",

    moduleId:
      "MOD-002",

    moduleName:
      "Repository Semantic Intelligence",

    purpose:
      "Execute governed Repository Semantic Intelligence from explicit repository evidence.",

    requiredInput:
      Object.freeze([
        "input",
        "operationId",
        "responseEvt",
        "legalCertification:false",
      ] as const),

    optionalInput:
      Object.freeze([
        "opcId",
      ] as const),

    boundary:
      Object.freeze({
        explicitInputRequired:
          true,

        explicitEvidenceRequired:
          true,

        filesystemAccess:
          false,

        githubApiAccess:
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

function validateRequestEnvelope(
  value: unknown,
): value is RepositorySemanticIntelligenceServiceRequest {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isRecord(
      value.input,
    )
  ) {
    return false;
  }

  if (
    typeof value.operationId !==
      "string" ||
    value.operationId.trim().length ===
      0
  ) {
    return false;
  }

  if (
    typeof value.responseEvt !==
      "string" ||
    value.responseEvt.trim().length ===
      0
  ) {
    return false;
  }

  if (
    value.opcId !== undefined &&
    value.opcId !== null &&
    typeof value.opcId !==
      "string"
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

function classifyServiceFailure(
  error:
    RepositorySemanticIntelligenceServiceError,
): RepositorySemanticApiFailReason {
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
      "FAIL_CLOSED",
    )
  ) {
    return "SEMANTIC_RUNTIME_FAIL_CLOSED";
  }

  return "INVALID_REQUEST";
}

function resolveErrorStatus(
  failReason:
    RepositorySemanticApiFailReason,
): number {
  switch (failReason) {
    case "INVALID_JSON_BODY":
    case "INVALID_REQUEST":
      return 400;

    case "HUMAN_AUTHORIZATION_REQUIRED":
      return 403;

    case "LEGAL_BOUNDARY_VIOLATION":
      return 422;

    case "SEMANTIC_RUNTIME_FAIL_CLOSED":
      return 409;

    case "INTERNAL_RUNTIME_ERROR":
      return 500;

    default:
      return 500;
  }
}

/**
 * Returns the public contract descriptor for MOD-002.
 *
 * This route performs no semantic execution and creates no memory.
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
 * Executes the governed MOD-002 runtime service.
 *
 * The caller must provide explicit identity, repository context,
 * semantic components, evidence, operation identifiers and human
 * authorization.
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
    const failReason:
      RepositorySemanticApiFailReason =
      "INVALID_JSON_BODY";

    return NextResponse.json(
      buildFailPayload(
        failReason,
        "The request body must contain valid JSON.",
      ),
      {
        status:
          resolveErrorStatus(
            failReason,
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
    const failReason:
      RepositorySemanticApiFailReason =
      "INVALID_REQUEST";

    return NextResponse.json(
      buildFailPayload(
        failReason,
        "The request does not satisfy the MOD-002 runtime service contract.",
      ),
      {
        status:
          resolveErrorStatus(
            failReason,
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
      executeRepositorySemanticIntelligenceService(
        body,
      );

    return NextResponse.json(
      {
        ...result,

        apiRevision:
          REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION,

        endpoint:
          REPOSITORY_SEMANTIC_INTELLIGENCE_ENDPOINT,
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
      RepositorySemanticIntelligenceServiceError
    ) {
      const failReason =
        classifyServiceFailure(
          error,
        );

      return NextResponse.json(
        buildFailPayload(
          failReason,
          error.message,
          error.code,
        ),
        {
          status:
            resolveErrorStatus(
              failReason,
            ),

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const failReason:
      RepositorySemanticApiFailReason =
      "INTERNAL_RUNTIME_ERROR";

    return NextResponse.json(
      buildFailPayload(
        failReason,
        error instanceof Error
          ? error.message
          : "An unknown MOD-002 runtime error occurred.",
      ),
      {
        status:
          resolveErrorStatus(
            failReason,
          ),

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}
