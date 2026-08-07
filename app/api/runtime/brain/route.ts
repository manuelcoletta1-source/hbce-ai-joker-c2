/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain API
 *
 * Canonical REST entry point for the governed HBCE R&D runtime.
 *
 * API:
 * POST /api/runtime/brain
 *
 * The route:
 * - validates the request boundary;
 * - requires explicit operator authorization;
 * - invokes the Runtime Brain;
 * - returns the complete governed R&D result;
 * - never executes experiments or mutates the repository.
 *
 * Read Only: true
 * Deterministic Core: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Selection: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * OPC Technical Proof Only: true
 * Legal Certification: false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  executeRuntimeBrain,
  type RuntimeBrainInput,
  type RuntimeBrainResult,
} from "../../../../src/runtime/runtime-brain";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

const RUNTIME_BRAIN_API_REVISION =
  "AIJC2-RUNTIME-BRAIN-API-v1_0" as const;

type RuntimeBrainApiRequest =
  Omit<
    RuntimeBrainInput,
    "humanAuthorizationRequired"
  > & {
    readonly humanAuthorizationRequired?: true;
    readonly legalCertification: false;
  };

interface RuntimeBrainApiSuccess {
  readonly ok: true;

  readonly status:
    "RUNTIME_BRAIN_RESULT_READY";

  readonly revision:
    typeof RUNTIME_BRAIN_API_REVISION;

  readonly generatedAt: string;

  readonly result:
    RuntimeBrainResult;

  readonly boundary: {
    readonly readOnly: true;
    readonly deterministicCore: true;
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticExecution: false;
    readonly automaticSelection: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly opcTechnicalProofOnly: true;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

interface RuntimeBrainApiFailure {
  readonly ok: false;

  readonly status:
    | "INVALID_JSON_REQUEST"
    | "INVALID_REQUEST_BODY"
    | "HUMAN_AUTHORIZATION_REQUIRED"
    | "LEGAL_BOUNDARY_VIOLATION"
    | "RUNTIME_BRAIN_FAIL_CLOSED";

  readonly revision:
    typeof RUNTIME_BRAIN_API_REVISION;

  readonly generatedAt: string;

  readonly error: string;

  readonly legalCertification: false;
}

type RuntimeBrainApiResponse =
  | RuntimeBrainApiSuccess
  | RuntimeBrainApiFailure;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isBoolean(
  value: unknown,
): value is boolean {
  return (
    value === true ||
    value === false
  );
}

function validateThresholdValue(
  value: unknown,
  name: string,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `RUNTIME_BRAIN_API_${name}_INVALID`,
    );
  }
}

function validateDecisionThresholds(
  value: unknown,
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_BRAIN_API_DECISION_THRESHOLDS_INVALID",
    );
  }

  const allowedFields =
    [
      "minimumTotalScore",
      "minimumRegressionSafety",
      "minimumReproducibility",
      "minimumEvidenceScore",
      "maximumRiskPenalty",
      "minimumScoreMargin",
    ] as const;

  for (const field of allowedFields) {
    const threshold =
      value[field];

    if (threshold !== undefined) {
      validateThresholdValue(
        threshold,
        field
          .replace(
            /([a-z])([A-Z])/g,
            "$1_$2",
          )
          .toUpperCase(),
      );
    }
  }
}

function validateRuntimeSelfState(
  value: unknown,
): void {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_BRAIN_API_RUNTIME_SELF_STATE_REQUIRED",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_RUNTIME_SELF_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.automaticPersistence !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.automaticRecall !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
    );
  }
}

function validatePreviousScientificCycle(
  value: unknown,
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_BRAIN_API_PREVIOUS_CYCLE_INVALID",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_PREVIOUS_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  const governance =
    value.governance;

  if (!isRecord(governance)) {
    throw new Error(
      "RUNTIME_BRAIN_API_PREVIOUS_CYCLE_GOVERNANCE_REQUIRED",
    );
  }

  if (
    governance.readOnly !== true ||
    governance.deterministic !== true ||
    governance.failClosed !== true ||
    governance.automaticExecution !== false ||
    governance.automaticPersistence !== false ||
    governance.automaticRecall !== false ||
    governance.automaticRepositoryMutation !== false ||
    governance.legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_PREVIOUS_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function validateRequestBody(
  value: unknown,
): asserts value is RuntimeBrainApiRequest {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_BRAIN_API_REQUEST_OBJECT_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.executionId,
    )
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_EXECUTION_ID_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.generatedAt,
    )
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_TIMESTAMP_REQUIRED",
    );
  }

  validateRuntimeSelfState(
    value.runtimeSelfState,
  );

  validatePreviousScientificCycle(
    value.previousScientificCycle,
  );

  if (
    value.operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_HUMAN_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    !isBoolean(
      value.acceptedByOperator,
    )
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_OPERATOR_ACCEPTANCE_REQUIRED",
    );
  }

  if (
    value.acceptedByOperator ===
      true &&
    value.operatorAuthorized !==
      true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_ACCEPTANCE_WITHOUT_AUTHORIZATION",
    );
  }

  if (
    value.humanAuthorizationRequired !==
      undefined &&
    value.humanAuthorizationRequired !==
      true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_API_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.hypothesesPerFinding !==
    undefined
  ) {
    if (
      !Number.isInteger(
        value.hypothesesPerFinding,
      ) ||
      (
        value.hypothesesPerFinding as number
      ) < 2 ||
      (
        value.hypothesesPerFinding as number
      ) > 5
    ) {
      throw new Error(
        "RUNTIME_BRAIN_API_HYPOTHESIS_COUNT_INVALID",
      );
    }
  }

  validateDecisionThresholds(
    value.decisionThresholds,
  );
}

function classifyError(
  message: string,
): {
  readonly status:
    RuntimeBrainApiFailure["status"];

  readonly httpStatus: number;
} {
  if (
    message ===
      "RUNTIME_BRAIN_API_HUMAN_AUTHORIZATION_REQUIRED" ||
    message.includes(
      "ACCEPTANCE_WITHOUT_AUTHORIZATION",
    ) ||
    message.includes(
      "AUTHORIZATION_INVARIANT",
    )
  ) {
    return {
      status:
        "HUMAN_AUTHORIZATION_REQUIRED",

      httpStatus:
        403,
    };
  }

  if (
    message.includes(
      "LEGAL_BOUNDARY",
    )
  ) {
    return {
      status:
        "LEGAL_BOUNDARY_VIOLATION",

      httpStatus:
        400,
    };
  }

  if (
    message.startsWith(
      "RUNTIME_BRAIN_API_",
    )
  ) {
    return {
      status:
        "INVALID_REQUEST_BODY",

      httpStatus:
        400,
    };
  }

  return {
    status:
      "RUNTIME_BRAIN_FAIL_CLOSED",

    httpStatus:
      400,
  };
}

function failureResponse(
  status:
    RuntimeBrainApiFailure["status"],

  error: string,

  httpStatus: number,

  generatedAt:
    string,
): NextResponse<RuntimeBrainApiFailure> {
  return NextResponse.json(
    {
      ok:
        false,

      status,

      revision:
        RUNTIME_BRAIN_API_REVISION,

      generatedAt,

      error,

      legalCertification:
        false,
    },
    {
      status:
        httpStatus,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Runtime":
          "AI_JOKER_C2",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

function createBoundary():
  RuntimeBrainApiSuccess["boundary"] {
  return {
    readOnly:
      true,

    deterministicCore:
      true,

    failClosed:
      true,

    humanAuthorizationRequired:
      true,

    automaticExecution:
      false,

    automaticSelection:
      false,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    automaticRepositoryMutation:
      false,

    opcTechnicalProofOnly:
      true,

    legalCertification:
      false,
  };
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<RuntimeBrainApiResponse>
> {
  const generatedAt =
    new Date().toISOString();

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return failureResponse(
      "INVALID_JSON_REQUEST",
      "Request body must contain valid JSON.",
      400,
      generatedAt,
    );
  }

  try {
    validateRequestBody(
      body,
    );

    const result =
      executeRuntimeBrain({
        executionId:
          body.executionId,

        generatedAt:
          body.generatedAt,

        runtimeSelfState:
          body.runtimeSelfState,

        previousScientificCycle:
          body.previousScientificCycle,

        hypothesesPerFinding:
          body.hypothesesPerFinding,

        decisionThresholds:
          body.decisionThresholds,

        operatorAuthorized:
          body.operatorAuthorized,

        acceptedByOperator:
          body.acceptedByOperator,

        humanAuthorizationRequired:
          true,
      });

    return NextResponse.json(
      {
        ok:
          true,

        status:
          "RUNTIME_BRAIN_RESULT_READY",

        revision:
          RUNTIME_BRAIN_API_REVISION,

        generatedAt,

        result,

        boundary:
          createBoundary(),

        legalCertification:
          false,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",

          "X-HBCE-Runtime":
            "AI_JOKER_C2",

          "X-HBCE-Brain-Status":
            result.status,

          "X-HBCE-Brain-Decision":
            result.decision,

          "X-HBCE-Legal-Certification":
            "false",
        },
      },
    );
  } catch (
    caughtError: unknown
  ) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Unknown Runtime Brain error.";

    const classification =
      classifyError(
        message,
      );

    return failureResponse(
      classification.status,
      message,
      classification.httpStatus,
      generatedAt,
    );
  }
}
