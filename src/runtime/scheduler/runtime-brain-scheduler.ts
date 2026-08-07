/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain Scheduler
 *
 * Determines whether a governed Runtime Brain execution is due.
 *
 * The scheduler does NOT execute Runtime Brain automatically.
 * It only evaluates schedule rules and produces an invocation plan
 * that still requires explicit operator authorization.
 *
 * Schedule
 * → Due Evaluation
 * → Trigger Reason
 * → Invocation Plan
 * → Human Authorization
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeBrainInput,
} from "../runtime-brain";

import type {
  RuntimeSelfState,
} from "../self/runtime-self.service";

import type {
  RuntimeScientificCycleResult,
} from "../scientific/runtime-scientific-cycle";

export const RUNTIME_BRAIN_SCHEDULER_REVISION =
  "AIJC2-RUNTIME-BRAIN-SCHEDULER-v1_0" as const;

export type RuntimeBrainScheduleMode =
  | "MANUAL"
  | "INTERVAL"
  | "COMMIT"
  | "PRE_RELEASE";

export type RuntimeBrainScheduleStatus =
  | "DUE"
  | "NOT_DUE"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export type RuntimeBrainTriggerReason =
  | "MANUAL_REQUEST"
  | "INTERVAL_ELAPSED"
  | "NEW_COMMIT"
  | "PRE_RELEASE_CHECK"
  | "NO_TRIGGER"
  | "INVALID_STATE";

export interface RuntimeBrainSchedulePolicy {
  readonly mode:
    RuntimeBrainScheduleMode;

  /**
   * Used only for INTERVAL mode.
   * Minimum allowed interval: 60 minutes.
   */
  readonly intervalMinutes?: number;

  /**
   * Optional previous execution timestamp.
   */
  readonly lastExecutionAt?: string;

  /**
   * Optional previous analyzed commit.
   */
  readonly lastAnalyzedCommit?: string;

  /**
   * Current release candidate flag.
   */
  readonly releaseCandidate?: boolean;
}

export interface RuntimeBrainSchedulerInput {
  readonly schedulerId: string;
  readonly evaluatedAt: string;

  readonly policy:
    RuntimeBrainSchedulePolicy;

  readonly runtimeSelfState:
    RuntimeSelfState;

  readonly previousScientificCycle?:
    RuntimeScientificCycleResult;

  /**
   * Explicit manual trigger supplied by the operator.
   */
  readonly manualRequested: boolean;

  /**
   * Authorizes preparation of an invocation plan.
   * It does not execute the Runtime Brain.
   */
  readonly operatorAuthorized: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeBrainInvocationPlan {
  readonly executionId: string;

  readonly reason:
    RuntimeBrainTriggerReason;

  readonly scheduledAt: string;

  readonly runtimeBrainInput:
    RuntimeBrainInput;

  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly automaticRepositoryMutation: false;

  readonly legalCertification: false;
}

export interface RuntimeBrainSchedulerResult {
  readonly revision:
    typeof RUNTIME_BRAIN_SCHEDULER_REVISION;

  readonly schedulerId: string;
  readonly evaluatedAt: string;

  readonly status:
    RuntimeBrainScheduleStatus;

  readonly reason:
    RuntimeBrainTriggerReason;

  readonly due: boolean;

  readonly invocationPlan?:
    RuntimeBrainInvocationPlan;

  readonly reasons:
    readonly string[];

  readonly operatorAuthorized: boolean;

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
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

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized =
    value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function parseTimestamp(
  value: string,
  code: string,
): number {
  const timestamp =
    Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error(code);
  }

  return timestamp;
}

function validateRuntimeSelfState(
  state: RuntimeSelfState,
): void {
  if (
    state.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticPersistence !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticRecall !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
    );
  }
}

function validatePreviousScientificCycle(
  cycle:
    RuntimeScientificCycleResult | undefined,
): void {
  if (cycle === undefined) {
    return;
  }

  if (
    cycle.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_PREVIOUS_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    cycle.governance.readOnly !==
      true ||
    cycle.governance.deterministic !==
      true ||
    cycle.governance.failClosed !==
      true ||
    cycle.governance
      .automaticExecution !==
      false ||
    cycle.governance
      .automaticPersistence !==
      false ||
    cycle.governance
      .automaticRecall !==
      false ||
    cycle.governance
      .automaticRepositoryMutation !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_PREVIOUS_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function validatePolicy(
  policy:
    RuntimeBrainSchedulePolicy,
): void {
  if (
    policy.mode === "INTERVAL"
  ) {
    if (
      policy.intervalMinutes ===
      undefined ||
      !Number.isInteger(
        policy.intervalMinutes,
      ) ||
      policy.intervalMinutes < 60
    ) {
      throw new Error(
        "RUNTIME_BRAIN_SCHEDULER_INTERVAL_INVALID",
      );
    }
  }

  if (
    policy.lastExecutionAt !==
    undefined
  ) {
    parseTimestamp(
      policy.lastExecutionAt,
      "RUNTIME_BRAIN_SCHEDULER_LAST_EXECUTION_TIMESTAMP_INVALID",
    );
  }
}

function evaluateManual(
  input:
    RuntimeBrainSchedulerInput,
): {
  readonly due: boolean;
  readonly reason:
    RuntimeBrainTriggerReason;
  readonly explanation: string;
} {
  if (
    input.manualRequested
  ) {
    return {
      due:
        true,

      reason:
        "MANUAL_REQUEST",

      explanation:
        "The operator explicitly requested a Runtime Brain evaluation.",
    };
  }

  return {
    due:
      false,

    reason:
      "NO_TRIGGER",

    explanation:
      "No manual Runtime Brain execution was requested.",
  };
}

function evaluateInterval(
  input:
    RuntimeBrainSchedulerInput,
): {
  readonly due: boolean;
  readonly reason:
    RuntimeBrainTriggerReason;
  readonly explanation: string;
} {
  const intervalMinutes =
    input.policy.intervalMinutes;

  if (
    intervalMinutes === undefined
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_INTERVAL_REQUIRED",
    );
  }

  if (
    input.policy.lastExecutionAt ===
    undefined
  ) {
    return {
      due:
        true,

      reason:
        "INTERVAL_ELAPSED",

      explanation:
        "No earlier execution timestamp exists; the first interval evaluation is due.",
    };
  }

  const now =
    parseTimestamp(
      input.evaluatedAt,
      "RUNTIME_BRAIN_SCHEDULER_EVALUATED_TIMESTAMP_INVALID",
    );

  const lastExecution =
    parseTimestamp(
      input.policy.lastExecutionAt,
      "RUNTIME_BRAIN_SCHEDULER_LAST_EXECUTION_TIMESTAMP_INVALID",
    );

  const elapsedMinutes =
    Math.floor(
      (
        now -
        lastExecution
      ) /
        60_000,
    );

  if (
    elapsedMinutes >=
    intervalMinutes
  ) {
    return {
      due:
        true,

      reason:
        "INTERVAL_ELAPSED",

      explanation:
        `Interval elapsed: ${elapsedMinutes} minutes; required ${intervalMinutes}.`,
    };
  }

  return {
    due:
      false,

    reason:
      "NO_TRIGGER",

    explanation:
      `Interval not elapsed: ${elapsedMinutes} minutes; required ${intervalMinutes}.`,
  };
}

function evaluateCommit(
  input:
    RuntimeBrainSchedulerInput,
): {
  readonly due: boolean;
  readonly reason:
    RuntimeBrainTriggerReason;
  readonly explanation: string;
} {
  const currentCommit =
    input.runtimeSelfState
      .repository.commit;

  const previousCommit =
    input.policy
      .lastAnalyzedCommit;

  if (
    typeof currentCommit !==
      "string" ||
    currentCommit.trim().length ===
      0
  ) {
    return {
      due:
        false,

      reason:
        "INVALID_STATE",

      explanation:
        "Current repository commit is unavailable.",
    };
  }

  if (
    previousCommit === undefined
  ) {
    return {
      due:
        true,

      reason:
        "NEW_COMMIT",

      explanation:
        "No previously analyzed commit was supplied.",
    };
  }

  if (
    currentCommit !==
    previousCommit
  ) {
    return {
      due:
        true,

      reason:
        "NEW_COMMIT",

      explanation:
        `Repository commit changed from ${previousCommit} to ${currentCommit}.`,
    };
  }

  return {
    due:
      false,

    reason:
      "NO_TRIGGER",

    explanation:
      "Repository commit is unchanged.",
  };
}

function evaluatePreRelease(
  input:
    RuntimeBrainSchedulerInput,
): {
  readonly due: boolean;
  readonly reason:
    RuntimeBrainTriggerReason;
  readonly explanation: string;
} {
  if (
    input.policy.releaseCandidate ===
    true
  ) {
    return {
      due:
        true,

      reason:
        "PRE_RELEASE_CHECK",

      explanation:
        "A release candidate was explicitly marked for governed Runtime Brain review.",
    };
  }

  return {
    due:
      false,

    reason:
      "NO_TRIGGER",

    explanation:
      "No release candidate requires pre-release review.",
  };
}

function evaluateSchedule(
  input:
    RuntimeBrainSchedulerInput,
): {
  readonly due: boolean;
  readonly reason:
    RuntimeBrainTriggerReason;
  readonly explanation: string;
} {
  if (
    input.manualRequested
  ) {
    return evaluateManual(
      input,
    );
  }

  switch (
    input.policy.mode
  ) {
    case "MANUAL":
      return evaluateManual(
        input,
      );

    case "INTERVAL":
      return evaluateInterval(
        input,
      );

    case "COMMIT":
      return evaluateCommit(
        input,
      );

    case "PRE_RELEASE":
      return evaluatePreRelease(
        input,
      );
  }
}

function createInvocationPlan(
  input:
    RuntimeBrainSchedulerInput,

  reason:
    RuntimeBrainTriggerReason,

  schedulerId: string,

  evaluatedAt: string,
): Readonly<RuntimeBrainInvocationPlan> {
  return Object.freeze({
    executionId:
      `${schedulerId}-BRAIN`,

    reason,

    scheduledAt:
      evaluatedAt,

    runtimeBrainInput:
      Object.freeze({
        executionId:
          `${schedulerId}-BRAIN`,

        generatedAt:
          evaluatedAt,

        runtimeSelfState:
          input.runtimeSelfState,

        previousScientificCycle:
          input.previousScientificCycle,

        hypothesesPerFinding:
          3,

        operatorAuthorized:
          true,

        acceptedByOperator:
          false,

        humanAuthorizationRequired:
          true,
      }),

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
  });
}

function createGovernance() {
  return Object.freeze({
    readOnly:
      true as const,

    deterministic:
      true as const,

    failClosed:
      true as const,

    humanAuthorizationRequired:
      true as const,

    automaticExecution:
      false as const,

    automaticPersistence:
      false as const,

    automaticRecall:
      false as const,

    automaticRepositoryMutation:
      false as const,

    legalCertification:
      false as const,
  });
}

export function evaluateRuntimeBrainSchedule(
  input:
    RuntimeBrainSchedulerInput,
): Readonly<RuntimeBrainSchedulerResult> {
  const schedulerId =
    requireNonEmptyString(
      input.schedulerId,
      "RUNTIME_BRAIN_SCHEDULER_ID_REQUIRED",
    );

  const evaluatedAt =
    requireNonEmptyString(
      input.evaluatedAt,
      "RUNTIME_BRAIN_SCHEDULER_TIMESTAMP_REQUIRED",
    );

  parseTimestamp(
    evaluatedAt,
    "RUNTIME_BRAIN_SCHEDULER_TIMESTAMP_INVALID",
  );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  validateRuntimeSelfState(
    input.runtimeSelfState,
  );

  validatePreviousScientificCycle(
    input.previousScientificCycle,
  );

  validatePolicy(
    input.policy,
  );

  const operatorAuthorized =
    input.operatorAuthorized ===
    true;

  const evaluation =
    evaluateSchedule(
      input,
    );

  const reasons: string[] = [
    `Scheduler mode: ${input.policy.mode}.`,
    evaluation.explanation,
  ];

  if (
    evaluation.reason ===
    "INVALID_STATE"
  ) {
    return Object.freeze({
      revision:
        RUNTIME_BRAIN_SCHEDULER_REVISION,

      schedulerId,
      evaluatedAt,

      status:
        "BLOCKED",

      reason:
        evaluation.reason,

      due:
        false,

      reasons:
        Object.freeze([
          ...reasons,
          "Scheduler evaluation failed closed because mandatory runtime evidence was unavailable.",
        ]),

      operatorAuthorized,

      governance:
        createGovernance(),

      legalCertification:
        false,
    });
  }

  if (
    !evaluation.due
  ) {
    return Object.freeze({
      revision:
        RUNTIME_BRAIN_SCHEDULER_REVISION,

      schedulerId,
      evaluatedAt,

      status:
        "NOT_DUE",

      reason:
        evaluation.reason,

      due:
        false,

      reasons:
        Object.freeze([
          ...reasons,
          "No Runtime Brain invocation plan was produced.",
        ]),

      operatorAuthorized,

      governance:
        createGovernance(),

      legalCertification:
        false,
    });
  }

  if (
    !operatorAuthorized
  ) {
    return Object.freeze({
      revision:
        RUNTIME_BRAIN_SCHEDULER_REVISION,

      schedulerId,
      evaluatedAt,

      status:
        "REVIEW_REQUIRED",

      reason:
        evaluation.reason,

      due:
        true,

      reasons:
        Object.freeze([
          ...reasons,
          "A Runtime Brain evaluation is due, but explicit operator authorization is missing.",
          "No invocation plan was activated.",
        ]),

      operatorAuthorized,

      governance:
        createGovernance(),

      legalCertification:
        false,
    });
  }

  const invocationPlan =
    createInvocationPlan(
      input,
      evaluation.reason,
      schedulerId,
      evaluatedAt,
    );

  return Object.freeze({
    revision:
      RUNTIME_BRAIN_SCHEDULER_REVISION,

    schedulerId,
    evaluatedAt,

    status:
      "DUE",

    reason:
      evaluation.reason,

    due:
      true,

    invocationPlan,

    reasons:
      Object.freeze([
        ...reasons,
        "A governed Runtime Brain invocation plan has been prepared.",
        "The scheduler has not executed the Runtime Brain.",
      ]),

    operatorAuthorized,

    governance:
      createGovernance(),

    legalCertification:
      false,
  });
}
