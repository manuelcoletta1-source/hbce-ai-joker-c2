/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scheduler API
 *
 * Canonical governed REST entry point for:
 *
 * Schedule Evaluation
 * → Invocation Plan
 * → Runner Authorization
 * → Runtime Brain Execution
 *
 * API:
 * POST /api/runtime/scheduler
 *
 * This route does not:
 * - mutate repository files;
 * - persist results automatically;
 * - perform automatic recall;
 * - approve scientific proposals automatically;
 * - issue legal certification.
 *
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Legal Certification: false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  evaluateRuntimeBrainSchedule,
  type RuntimeBrainSchedulerInput,
  type RuntimeBrainSchedulerResult,
} from "../../../../runtime/scheduler/runtime-brain-scheduler";

import {
  runScheduledRuntimeBrain,
  type RuntimeBrainSchedulerRunnerResult,
} from "../../../../runtime/scheduler/runtime-brain-scheduler-runner";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

const RUNTIME_SCHEDULER_API_REVISION =
  "AIJC2-RUNTIME-SCHEDULER-API-v1_0" as const;

type RuntimeSchedulerApiRequest =
  Omit<
    RuntimeBrainSchedulerInput,
    "humanAuthorizationRequired"
  > & {
    readonly runnerAuthorized: boolean;

    readonly humanAuthorizationRequired?: true;

    readonly legalCertification: false;
  };

interface RuntimeSchedulerApiSuccess {
  readonly ok: true;

  readonly status:
    "RUNTIME_SCHEDULER_RESULT_READY";

  readonly revision:
    typeof RUNTIME_SCHEDULER_API_REVISION;

  readonly generatedAt: string;

  readonly scheduler:
    RuntimeBrainSchedulerResult;

  readonly runner:
    RuntimeBrainSchedulerRunnerResult;

  readonly governance: {
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticRepositoryMutation: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;

    readonly automaticProposalAcceptance: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

interface RuntimeSchedulerApiFailure {
  readonly ok: false;

  readonly status:
    | "INVALID_JSON_REQUEST"
    | "INVALID_REQUEST_BODY"
    | "HUMAN_AUTHORIZATION_REQUIRED"
    | "LEGAL_BOUNDARY_VIOLATION"
    | "RUNTIME_SCHEDULER_FAIL_CLOSED";

  readonly revision:
    typeof RUNTIME_SCHEDULER_API_REVISION;

  readonly generatedAt: string;

  readonly error: string;

  readonly legalCertification: false;
}

type RuntimeSchedulerApiResponse =
  | RuntimeSchedulerApiSuccess
  | RuntimeSchedulerApiFailure;

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

function validatePolicy(
  value: unknown,
): void {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_POLICY_REQUIRED",
    );
  }

  const mode =
    value.mode;

  if (
    mode !== "MANUAL" &&
    mode !== "INTERVAL" &&
    mode !== "COMMIT" &&
    mode !== "PRE_RELEASE"
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_POLICY_MODE_INVALID",
    );
  }

  if (
    mode === "INTERVAL"
  ) {
    const intervalMinutes =
      value.intervalMinutes;

    if (
      !Number.isInteger(
        intervalMinutes,
      ) ||
      (
        intervalMinutes as number
      ) < 60
    ) {
      throw new Error(
        "RUNTIME_SCHEDULER_API_INTERVAL_INVALID",
      );
    }
  }

  if (
    value.lastExecutionAt !==
      undefined &&
    !isNonEmptyString(
      value.lastExecutionAt,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_LAST_EXECUTION_INVALID",
    );
  }

  if (
    value.lastAnalyzedCommit !==
      undefined &&
    !isNonEmptyString(
      value.lastAnalyzedCommit,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_LAST_COMMIT_INVALID",
    );
  }

  if (
    value.releaseCandidate !==
      undefined &&
    !isBoolean(
      value.releaseCandidate,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RELEASE_CANDIDATE_INVALID",
    );
  }
}

function validateRuntimeSelfState(
  value: unknown,
): void {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNTIME_SELF_STATE_REQUIRED",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNTIME_SELF_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.automaticPersistence !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    value.automaticRecall !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
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
      "RUNTIME_SCHEDULER_API_PREVIOUS_CYCLE_INVALID",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_PREVIOUS_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  const governance =
    value.governance;

  if (!isRecord(governance)) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_PREVIOUS_CYCLE_GOVERNANCE_REQUIRED",
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
      "RUNTIME_SCHEDULER_API_PREVIOUS_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function validateRequestBody(
  value: unknown,
): asserts value is RuntimeSchedulerApiRequest {
  if (!isRecord(value)) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_REQUEST_OBJECT_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.schedulerId,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_SCHEDULER_ID_REQUIRED",
    );
  }

  if (
    !isNonEmptyString(
      value.evaluatedAt,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_EVALUATED_AT_REQUIRED",
    );
  }

  if (
    !Number.isFinite(
      Date.parse(
        value.evaluatedAt,
      ),
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_EVALUATED_AT_INVALID",
    );
  }

  validatePolicy(
    value.policy,
  );

  validateRuntimeSelfState(
    value.runtimeSelfState,
  );

  validatePreviousScientificCycle(
    value.previousScientificCycle,
  );

  if (
    !isBoolean(
      value.manualRequested,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_MANUAL_REQUESTED_REQUIRED",
    );
  }

  if (
    !isBoolean(
      value.operatorAuthorized,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_OPERATOR_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    !isBoolean(
      value.runnerAuthorized,
    )
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_RUNNER_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    value.humanAuthorizationRequired !==
      undefined &&
    value.humanAuthorizationRequired !==
      true
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    value.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_SCHEDULER_API_LEGAL_BOUNDARY_VIOLATION",
    );
  }
}

function classifyError(
  message: string,
): {
  readonly status:
    RuntimeSchedulerApiFailure["status"];

  readonly httpStatus: number;
} {
  if (
    message.includes(
      "AUTHORIZATION",
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
      "RUNTIME_SCHEDULER_API_",
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
      "RUNTIME_SCHEDULER_FAIL_CLOSED",

    httpStatus:
      400,
  };
}

function failureResponse(
  status:
    RuntimeSchedulerApiFailure["status"],

  error: string,

  httpStatus: number,

  generatedAt: string,
): NextResponse<RuntimeSchedulerApiFailure> {
  return NextResponse.json(
    {
      ok:
        false,

      status,

      revision:
        RUNTIME_SCHEDULER_API_REVISION,

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

function createGovernance():
  RuntimeSchedulerApiSuccess["governance"] {
  return {
    failClosed:
      true,

    humanAuthorizationRequired:
      true,

    automaticRepositoryMutation:
      false,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    automaticProposalAcceptance:
      false,

    legalCertification:
      false,
  };
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<RuntimeSchedulerApiResponse>
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

    const scheduler =
      evaluateRuntimeBrainSchedule({
        schedulerId:
          body.schedulerId,

        evaluatedAt:
          body.evaluatedAt,

        policy:
          body.policy,

        runtimeSelfState:
          body.runtimeSelfState,

        previousScientificCycle:
          body.previousScientificCycle,

        manualRequested:
          body.manualRequested,

        operatorAuthorized:
          body.operatorAuthorized,

        humanAuthorizationRequired:
          true,
      });

    const runner =
      runScheduledRuntimeBrain({
        runnerId:
          `${body.schedulerId}-RUNNER`,

        executedAt:
          body.evaluatedAt,

        schedulerResult:
          scheduler,

        runnerAuthorized:
          body.runnerAuthorized,

        humanAuthorizationRequired:
          true,
      });

    return NextResponse.json(
      {
        ok:
          true,

        status:
          "RUNTIME_SCHEDULER_RESULT_READY",

        revision:
          RUNTIME_SCHEDULER_API_REVISION,

        generatedAt,

        scheduler,

        runner,

        governance:
          createGovernance(),

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

          "X-HBCE-Scheduler-Status":
            scheduler.status,

          "X-HBCE-Scheduler-Reason":
            scheduler.reason,

          "X-HBCE-Runner-Status":
            runner.status,

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
        : "Unknown Runtime Scheduler API error.";

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
