/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Cycle API
 *
 * Exposes the governed scientific cycle through REST.
 *
 * Input:
 * - RuntimeSelfState already produced by the governed runtime;
 * - explicit operator authorization;
 * - optional operator acceptance;
 * - optional hypothesis count and decision thresholds.
 *
 * This route does not:
 * - access GitHub directly;
 * - inspect repository files;
 * - execute proposed experiments;
 * - modify the repository;
 * - persist scientific results;
 * - perform automatic recall;
 * - issue legal certification.
 *
 * Read Only: true
 * Deterministic Core: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createRuntimeScientificCycle,
  type RuntimeScientificCycleInput,
} from "../../../../runtime/scientific/runtime-scientific-cycle";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

const RUNTIME_SCIENTIFIC_API_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-API-v1_0" as const;

type RuntimeScientificApiRequest =
  Omit<
    RuntimeScientificCycleInput,
    "humanAuthorizationRequired"
  > & {
    readonly humanAuthorizationRequired?: true;
    readonly legalCertification: false;
  };

interface RuntimeScientificApiSuccess {
  readonly ok: true;

  readonly status:
    "RUNTIME_SCIENTIFIC_CYCLE_READY";

  readonly revision:
    typeof RUNTIME_SCIENTIFIC_API_REVISION;

  readonly result:
    ReturnType<
      typeof createRuntimeScientificCycle
    >;

  readonly governance: {
    readonly readOnly: true;
    readonly deterministicCore: true;
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticExecution: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

interface RuntimeScientificApiFailure {
  readonly ok: false;

  readonly status:
    | "INVALID_JSON_REQUEST"
    | "INVALID_REQUEST_BODY"
    | "HUMAN_AUTHORIZATION_REQUIRED"
    | "LEGAL_BOUNDARY_VIOLATION"
    | "RUNTIME_SCIENTIFIC_CYCLE_FAIL_CLOSED";

  readonly revision:
    typeof RUNTIME_SCIENTIFIC_API_REVISION;

  readonly error: string;

  readonly legalCertification: false;
}

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

function validateRequestBody(
  value: unknown,
): asserts value is RuntimeScientificApiRequest {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_REQUEST_OBJECT_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.cycleId,
    )
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_CYCLE_ID_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.generatedAt,
    )
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_TIMESTAMP_REQUIRED",
    );
  }

  if (
    !isRecord(
      value.runtimeSelfState,
    )
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_RUNTIME_SELF_STATE_REQUIRED",
    );
  }

  if (
    value.operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_HUMAN_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    value.acceptedByOperator !==
      true &&
    value.acceptedByOperator !==
      false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_OPERATOR_ACCEPTANCE_REQUIRED",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.humanAuthorizationRequired !==
      undefined &&
    value.humanAuthorizationRequired !==
      true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_AUTHORIZATION_INVARIANT_VIOLATION",
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
        "RUNTIME_SCIENTIFIC_API_HYPOTHESIS_COUNT_INVALID",
      );
    }
  }

  if (
    value.decisionThresholds !==
      undefined &&
    !isRecord(
      value.decisionThresholds,
    )
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_API_DECISION_THRESHOLDS_INVALID",
    );
  }
}

function errorStatus(
  message: string,
): {
  readonly status:
    RuntimeScientificApiFailure["status"];

  readonly httpStatus: number;
} {
  if (
    message ===
    "RUNTIME_SCIENTIFIC_API_HUMAN_AUTHORIZATION_REQUIRED"
  ) {
    return {
      status:
        "HUMAN_AUTHORIZATION_REQUIRED",

      httpStatus:
        403,
    };
  }

  if (
    message ===
      "RUNTIME_SCIENTIFIC_API_LEGAL_BOUNDARY_VIOLATION" ||
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
      "RUNTIME_SCIENTIFIC_API_",
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
      "RUNTIME_SCIENTIFIC_CYCLE_FAIL_CLOSED",

    httpStatus:
      400,
  };
}

function failureResponse(
  status:
    RuntimeScientificApiFailure["status"],

  error: string,

  httpStatus: number,
): NextResponse<
  RuntimeScientificApiFailure
> {
  return NextResponse.json(
    {
      ok:
        false,

      status,

      revision:
        RUNTIME_SCIENTIFIC_API_REVISION,

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
      },
    },
  );
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<
    | RuntimeScientificApiSuccess
    | RuntimeScientificApiFailure
  >
> {
  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return failureResponse(
      "INVALID_JSON_REQUEST",
      "Request body must contain valid JSON.",
      400,
    );
  }

  try {
    validateRequestBody(
      body,
    );

    const result =
      createRuntimeScientificCycle({
        cycleId:
          body.cycleId,

        generatedAt:
          body.generatedAt,

        runtimeSelfState:
          body.runtimeSelfState,

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
          "RUNTIME_SCIENTIFIC_CYCLE_READY",

        revision:
          RUNTIME_SCIENTIFIC_API_REVISION,

        result,

        governance: {
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

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (
    caughtError: unknown
  ) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Unknown scientific-cycle error.";

    const mappedError =
      errorStatus(
        message,
      );

    return failureResponse(
      mappedError.status,
      message,
      mappedError.httpStatus,
    );
  }
}
