/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain Scheduler Runner
 *
 * Governed bridge:
 *
 * Scheduler Result
 * → Invocation Plan Validation
 * → Explicit Runner Authorization
 * → Runtime Brain Execution
 * → Governed Runner Result
 *
 * The runner executes Runtime Brain only when:
 * - the scheduler status is DUE;
 * - an invocation plan exists;
 * - scheduler authorization is present;
 * - runner authorization is present;
 * - every governance boundary remains valid.
 *
 * This module does NOT:
 * - decide scheduling conditions;
 * - mutate repository files;
 * - persist results automatically;
 * - perform automatic recall;
 * - approve scientific proposals automatically;
 * - issue legal certification.
 *
 * Deterministic Core: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Legal Certification: false
 */

import {
  executeRuntimeBrain,
  type RuntimeBrainResult,
} from "../runtime-brain";

import type {
  RuntimeBrainSchedulerResult,
  RuntimeBrainInvocationPlan,
} from "./runtime-brain-scheduler";

export const RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION =
  "AIJC2-RUNTIME-BRAIN-SCHEDULER-RUNNER-v1_0" as const;

export type RuntimeBrainSchedulerRunnerStatus =
  | "EXECUTED"
  | "NOT_DUE"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export interface RuntimeBrainSchedulerRunnerInput {
  readonly runnerId: string;
  readonly executedAt: string;

  readonly schedulerResult:
    RuntimeBrainSchedulerResult;

  /**
   * Separate authorization boundary.
   *
   * Scheduler authorization means:
   * "an invocation plan may be prepared".
   *
   * Runner authorization means:
   * "the prepared plan may now invoke Runtime Brain".
   */
  readonly runnerAuthorized: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeBrainSchedulerRunnerSummary {
  readonly schedulerId: string;

  readonly schedulerStatus:
    RuntimeBrainSchedulerResult["status"];

  readonly schedulerReason:
    RuntimeBrainSchedulerResult["reason"];

  readonly schedulerDue: boolean;

  readonly invocationPlanAvailable: boolean;

  readonly runtimeBrainExecuted: boolean;

  readonly runtimeBrainExecutionId?: string;

  readonly runtimeBrainStatus?:
    RuntimeBrainResult["status"];

  readonly runtimeBrainDecision?:
    RuntimeBrainResult["decision"];
}

export interface RuntimeBrainSchedulerRunnerResult {
  readonly revision:
    typeof RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION;

  readonly runnerId: string;
  readonly executedAt: string;

  readonly status:
    RuntimeBrainSchedulerRunnerStatus;

  readonly schedulerResult:
    RuntimeBrainSchedulerResult;

  readonly runtimeBrainResult?:
    RuntimeBrainResult;

  readonly summary:
    RuntimeBrainSchedulerRunnerSummary;

  readonly reasons:
    readonly string[];

  readonly runnerAuthorized: boolean;

  readonly governance: {
    readonly deterministicCore: true;
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticRepositoryMutation: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;

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

function validateTimestamp(
  value: string,
): void {
  const parsed =
    Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_TIMESTAMP_INVALID",
    );
  }
}

function validateSchedulerGovernance(
  scheduler:
    RuntimeBrainSchedulerResult,
): void {
  if (
    scheduler.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_SCHEDULER_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    scheduler.governance.readOnly !==
      true ||
    scheduler.governance.deterministic !==
      true ||
    scheduler.governance.failClosed !==
      true ||
    scheduler.governance
      .humanAuthorizationRequired !==
      true ||
    scheduler.governance
      .automaticExecution !==
      false ||
    scheduler.governance
      .automaticPersistence !==
      false ||
    scheduler.governance
      .automaticRecall !==
      false ||
    scheduler.governance
      .automaticRepositoryMutation !==
      false ||
    scheduler.governance
      .legalCertification !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_SCHEDULER_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function validateInvocationPlan(
  plan:
    RuntimeBrainInvocationPlan,
): void {
  if (
    plan.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_PLAN_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    plan.humanAuthorizationRequired !==
      true ||
    plan.automaticExecution !==
      false ||
    plan.automaticPersistence !==
      false ||
    plan.automaticRecall !==
      false ||
    plan.automaticRepositoryMutation !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_PLAN_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    plan.runtimeBrainInput
      .humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_BRAIN_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    plan.runtimeBrainInput
      .operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_BRAIN_OPERATOR_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    plan.runtimeBrainInput
      .acceptedByOperator !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_AUTOMATIC_PROPOSAL_ACCEPTANCE_FORBIDDEN",
    );
  }
}

function createSummary(
  scheduler:
    RuntimeBrainSchedulerResult,

  runtimeBrainResult:
    RuntimeBrainResult | undefined,
): Readonly<RuntimeBrainSchedulerRunnerSummary> {
  return Object.freeze({
    schedulerId:
      scheduler.schedulerId,

    schedulerStatus:
      scheduler.status,

    schedulerReason:
      scheduler.reason,

    schedulerDue:
      scheduler.due,

    invocationPlanAvailable:
      scheduler.invocationPlan !==
      undefined,

    runtimeBrainExecuted:
      runtimeBrainResult !==
      undefined,

    runtimeBrainExecutionId:
      runtimeBrainResult
        ?.executionId,

    runtimeBrainStatus:
      runtimeBrainResult
        ?.status,

    runtimeBrainDecision:
      runtimeBrainResult
        ?.decision,
  });
}

function createGovernance() {
  return Object.freeze({
    deterministicCore:
      true as const,

    failClosed:
      true as const,

    humanAuthorizationRequired:
      true as const,

    automaticRepositoryMutation:
      false as const,

    automaticPersistence:
      false as const,

    automaticRecall:
      false as const,

    legalCertification:
      false as const,
  });
}

function createNonExecutionResult(
  input: {
    readonly runnerId: string;
    readonly executedAt: string;

    readonly status:
      Exclude<
        RuntimeBrainSchedulerRunnerStatus,
        "EXECUTED"
      >;

    readonly schedulerResult:
      RuntimeBrainSchedulerResult;

    readonly runnerAuthorized: boolean;

    readonly reasons:
      readonly string[];
  },
): Readonly<RuntimeBrainSchedulerRunnerResult> {
  return Object.freeze({
    revision:
      RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION,

    runnerId:
      input.runnerId,

    executedAt:
      input.executedAt,

    status:
      input.status,

    schedulerResult:
      input.schedulerResult,

    summary:
      createSummary(
        input.schedulerResult,
        undefined,
      ),

    reasons:
      Object.freeze([
        ...input.reasons,
      ]),

    runnerAuthorized:
      input.runnerAuthorized,

    governance:
      createGovernance(),

    legalCertification:
      false,
  });
}

export function runScheduledRuntimeBrain(
  input:
    RuntimeBrainSchedulerRunnerInput,
): Readonly<RuntimeBrainSchedulerRunnerResult> {
  const runnerId =
    requireNonEmptyString(
      input.runnerId,
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_ID_REQUIRED",
    );

  const executedAt =
    requireNonEmptyString(
      input.executedAt,
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_TIMESTAMP_REQUIRED",
    );

  validateTimestamp(
    executedAt,
  );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  validateSchedulerGovernance(
    input.schedulerResult,
  );

  const runnerAuthorized =
    input.runnerAuthorized ===
    true;

  /*
   * Scheduler explicitly says execution is not due.
   */
  if (
    input.schedulerResult.status ===
      "NOT_DUE"
  ) {
    return createNonExecutionResult({
      runnerId,
      executedAt,

      status:
        "NOT_DUE",

      schedulerResult:
        input.schedulerResult,

      runnerAuthorized,

      reasons: [
        "Scheduler status is NOT_DUE.",
        "Runtime Brain execution was not attempted.",
      ],
    });
  }

  /*
   * Scheduler is already blocked.
   */
  if (
    input.schedulerResult.status ===
      "BLOCKED"
  ) {
    return createNonExecutionResult({
      runnerId,
      executedAt,

      status:
        "BLOCKED",

      schedulerResult:
        input.schedulerResult,

      runnerAuthorized,

      reasons: [
        "Scheduler status is BLOCKED.",
        ...input.schedulerResult
          .reasons,

        "Runtime Brain execution was not attempted.",
      ],
    });
  }

  /*
   * Scheduler detected a due condition but could not prepare
   * an authorized invocation plan.
   */
  if (
    input.schedulerResult.status ===
      "REVIEW_REQUIRED"
  ) {
    return createNonExecutionResult({
      runnerId,
      executedAt,

      status:
        "REVIEW_REQUIRED",

      schedulerResult:
        input.schedulerResult,

      runnerAuthorized,

      reasons: [
        "Scheduler requires explicit review before execution.",
        ...input.schedulerResult
          .reasons,

        "Runtime Brain execution was not attempted.",
      ],
    });
  }

  /*
   * Any status other than DUE at this point is invalid.
   */
  if (
    input.schedulerResult.status !==
    "DUE"
  ) {
    return createNonExecutionResult({
      runnerId,
      executedAt,

      status:
        "REJECTED",

      schedulerResult:
        input.schedulerResult,

      runnerAuthorized,

      reasons: [
        `Unsupported scheduler status: ${input.schedulerResult.status}.`,
        "Runner rejected execution fail closed.",
      ],
    });
  }

  if (
    input.schedulerResult.due !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_DUE_STATUS_MISMATCH",
    );
  }

  const invocationPlan =
    input.schedulerResult
      .invocationPlan;

  if (
    invocationPlan === undefined
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_INVOCATION_PLAN_REQUIRED",
    );
  }

  validateInvocationPlan(
    invocationPlan,
  );

  /*
   * Second human authorization boundary.
   *
   * Scheduler authorization was needed to prepare the plan.
   * Runner authorization is independently required before invoking
   * Runtime Brain.
   */
  if (
    !runnerAuthorized
  ) {
    return createNonExecutionResult({
      runnerId,
      executedAt,

      status:
        "REVIEW_REQUIRED",

      schedulerResult:
        input.schedulerResult,

      runnerAuthorized,

      reasons: [
        "Scheduler produced a valid DUE invocation plan.",
        "Runner authorization is absent.",
        "Runtime Brain execution was not attempted.",
      ],
    });
  }

  /*
   * Runtime Brain execution.
   *
   * The invocation plan always carries:
   * acceptedByOperator=false
   *
   * Therefore this runner can trigger analysis and planning,
   * but cannot automatically approve implementation.
   */
  const runtimeBrainResult =
    executeRuntimeBrain(
      invocationPlan
        .runtimeBrainInput,
    );

  if (
    runtimeBrainResult
      .legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_BRAIN_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    runtimeBrainResult
      .boundary
      .automaticRepositoryMutation !==
      false ||
    runtimeBrainResult
      .boundary
      .automaticPersistence !==
      false ||
    runtimeBrainResult
      .boundary
      .automaticRecall !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_SCHEDULER_RUNNER_BRAIN_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }

  const summary =
    createSummary(
      input.schedulerResult,
      runtimeBrainResult,
    );

  return Object.freeze({
    revision:
      RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION,

    runnerId,
    executedAt,

    status:
      "EXECUTED",

    schedulerResult:
      input.schedulerResult,

    runtimeBrainResult,

    summary,

    reasons:
      Object.freeze([
        `Scheduler trigger: ${input.schedulerResult.reason}.`,
        "Scheduler invocation plan passed governance validation.",
        "Explicit runner authorization was present.",
        `Runtime Brain execution completed with status ${runtimeBrainResult.status}.`,
        `Runtime Brain decision: ${runtimeBrainResult.decision}.`,
        "The scientific proposal was not automatically accepted.",
        "No automatic repository mutation, persistence or recall occurred.",
      ]),

    runnerAuthorized,

    governance:
      createGovernance(),

    legalCertification:
      false,
  });
}
