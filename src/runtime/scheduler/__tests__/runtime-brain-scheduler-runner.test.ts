/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain Scheduler Runner Tests
 *
 * Verifies:
 * - NOT_DUE does not execute Runtime Brain;
 * - BLOCKED does not execute Runtime Brain;
 * - REVIEW_REQUIRED does not execute Runtime Brain;
 * - DUE requires a valid invocation plan;
 * - DUE requires separate runner authorization;
 * - automatic proposal acceptance is forbidden;
 * - scheduler and invocation-plan governance boundaries are enforced;
 * - valid authorized execution reaches Runtime Brain;
 * - Runtime Brain remains non-mutating and non-persistent.
 *
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Legal Certification: false
 */

import {
  runScheduledRuntimeBrain,
  RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION,
  type RuntimeBrainSchedulerRunnerInput,
} from "../runtime-brain-scheduler-runner";

import {
  evaluateRuntimeBrainSchedule,
  type RuntimeBrainSchedulerInput,
  type RuntimeBrainSchedulerResult,
} from "../runtime-brain-scheduler";

import type {
  RuntimeSelfState,
} from "../../self/runtime-self.service";

const EVALUATED_AT =
  "2026-08-07T13:45:00+02:00";

const CURRENT_COMMIT =
  "abcdef1234567890";

const PREVIOUS_COMMIT =
  "1111111111111111";

function createRuntimeSelfState(
  overrides:
    Partial<RuntimeSelfState> = {},
): RuntimeSelfState {
  return {
    revision:
      "AIJC2-RUNTIME-SELF-STATE-TEST-v1_0",

    generatedAt:
      EVALUATED_AT,

    runtimeVersion:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    repository: {
      repository:
        "hbce-ai-joker-c2",

      branch:
        "main",

      commit:
        CURRENT_COMMIT,

      fileCount:
        250,

      directoryCount:
        48,

      inspectedFileCount:
        80,

      buildPassed:
        true,

      testsPassed:
        true,
    },

    evolution: {
      enabled:
        true,

      addedFiles:
        1,

      removedFiles:
        0,

      modifiedFiles:
        3,

      unchangedFiles:
        246,
    },

    integration: {
      available:
        true,

      plannerAvailable:
        true,

      validatorAvailable:
        true,

      operatorAuthorized:
        true,
    },

    knowledge: {
      available:
        true,

      operatorAuthorized:
        true,

      automaticPersistence:
        false,

      automaticRecall:
        false,
    },

    capabilities:
      Object.freeze([]),

    capabilityRegistry: {
      revision:
        "TEST-CAPABILITY-REGISTRY",

      capabilities:
        Object.freeze([]),

      capabilityIds:
        Object.freeze([]),

      totalCapabilities:
        0,

      operatorAuthorized:
        true,

      humanAuthorizationRequired:
        true,

      automaticDiscovery:
        false,

      automaticPersistence:
        false,

      automaticRecall:
        false,

      legalCertification:
        false,
    },

    capabilityAnalysis: {
      revision:
        "TEST-CAPABILITY-ANALYSIS",

      totalCapabilities:
        3,

      averageScore:
        75,

      operationalCapabilities:
        3,

      degradedCapabilities:
        0,

      blockedCapabilities:
        0,

      gaps:
        Object.freeze([]),

      recommendations:
        Object.freeze([]),

      operationalStatus:
        "OPERATIONAL",

      legalCertification:
        false,
    },

    operationalStatus:
      "OPERATIONAL",

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,

    ...overrides,
  } as RuntimeSelfState;
}

function createSchedulerInput(
  overrides:
    Partial<RuntimeBrainSchedulerInput> = {},
): RuntimeBrainSchedulerInput {
  return {
    schedulerId:
      "HBCE-SCHEDULER-RUNNER-TEST-001",

    evaluatedAt:
      EVALUATED_AT,

    policy: {
      mode:
        "COMMIT",

      lastAnalyzedCommit:
        PREVIOUS_COMMIT,
    },

    runtimeSelfState:
      createRuntimeSelfState(),

    manualRequested:
      false,

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    ...overrides,
  };
}

function createDueSchedulerResult():
  RuntimeBrainSchedulerResult {
  return evaluateRuntimeBrainSchedule(
    createSchedulerInput(),
  );
}

function createNotDueSchedulerResult():
  RuntimeBrainSchedulerResult {
  return evaluateRuntimeBrainSchedule(
    createSchedulerInput({
      policy: {
        mode:
          "COMMIT",

        lastAnalyzedCommit:
          CURRENT_COMMIT,
      },
    }),
  );
}

function createReviewSchedulerResult():
  RuntimeBrainSchedulerResult {
  return evaluateRuntimeBrainSchedule(
    createSchedulerInput({
      operatorAuthorized:
        false,
    }),
  );
}

function createBlockedSchedulerResult():
  RuntimeBrainSchedulerResult {
  return evaluateRuntimeBrainSchedule(
    createSchedulerInput({
      runtimeSelfState:
        createRuntimeSelfState({
          repository: {
            repository:
              "hbce-ai-joker-c2",

            branch:
              "main",

            commit:
              "",

            fileCount:
              250,

            directoryCount:
              48,

            inspectedFileCount:
              80,

            buildPassed:
              true,

            testsPassed:
              true,
          },
        }),
    }),
  );
}

function createRunnerInput(
  overrides:
    Partial<RuntimeBrainSchedulerRunnerInput> = {},
): RuntimeBrainSchedulerRunnerInput {
  return {
    runnerId:
      "HBCE-SCHEDULER-RUNNER-EXECUTION-001",

    executedAt:
      EVALUATED_AT,

    schedulerResult:
      createDueSchedulerResult(),

    runnerAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    ...overrides,
  };
}

describe(
  "Runtime Brain Scheduler Runner",
  () => {
    it(
      "returns NOT_DUE without executing Runtime Brain",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput({
              schedulerResult:
                createNotDueSchedulerResult(),
            }),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_BRAIN_SCHEDULER_RUNNER_REVISION,
        );

        expect(
          result.status,
        ).toBe(
          "NOT_DUE",
        );

        expect(
          result.runtimeBrainResult,
        ).toBeUndefined();

        expect(
          result.summary
            .runtimeBrainExecuted,
        ).toBe(false);
      },
    );

    it(
      "returns BLOCKED when scheduler is blocked",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput({
              schedulerResult:
                createBlockedSchedulerResult(),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          result.runtimeBrainResult,
        ).toBeUndefined();

        expect(
          result.summary
            .runtimeBrainExecuted,
        ).toBe(false);
      },
    );

    it(
      "returns REVIEW_REQUIRED when scheduler requires review",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput({
              schedulerResult:
                createReviewSchedulerResult(),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.runtimeBrainResult,
        ).toBeUndefined();

        expect(
          result.summary
            .runtimeBrainExecuted,
        ).toBe(false);
      },
    );

    it(
      "requires separate runner authorization",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput({
              runnerAuthorized:
                false,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.runtimeBrainResult,
        ).toBeUndefined();

        expect(
          result.summary
            .runtimeBrainExecuted,
        ).toBe(false);

        expect(
          result.runnerAuthorized,
        ).toBe(false);
      },
    );

    it(
      "fails closed when DUE scheduler result has no invocation plan",
      () => {
        const scheduler =
          createDueSchedulerResult();

        const invalidScheduler =
          {
            ...scheduler,

            invocationPlan:
              undefined,
          } as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_INVOCATION_PLAN_REQUIRED",
        );
      },
    );

    it(
      "fails closed when DUE status and due flag disagree",
      () => {
        const scheduler =
          createDueSchedulerResult();

        const invalidScheduler =
          {
            ...scheduler,

            due:
              false,
          } as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_DUE_STATUS_MISMATCH",
        );
      },
    );

    it(
      "forbids automatic proposal acceptance in invocation plan",
      () => {
        const scheduler =
          createDueSchedulerResult();

        if (
          scheduler.invocationPlan ===
          undefined
        ) {
          throw new Error(
            "TEST_INVOCATION_PLAN_REQUIRED",
          );
        }

        const invalidPlan = {
          ...scheduler.invocationPlan,

          runtimeBrainInput: {
            ...scheduler
              .invocationPlan
              .runtimeBrainInput,

            acceptedByOperator:
              true,
          },
        };

        const invalidScheduler =
          {
            ...scheduler,

            invocationPlan:
              invalidPlan,
          } as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_AUTOMATIC_PROPOSAL_ACCEPTANCE_FORBIDDEN",
        );
      },
    );

    it(
      "fails closed when invocation plan enables automatic persistence",
      () => {
        const scheduler =
          createDueSchedulerResult();

        if (
          scheduler.invocationPlan ===
          undefined
        ) {
          throw new Error(
            "TEST_INVOCATION_PLAN_REQUIRED",
          );
        }

        const invalidPlan =
          {
            ...scheduler.invocationPlan,

            automaticPersistence:
              true,
          };

        const invalidScheduler =
          {
            ...scheduler,

            invocationPlan:
              invalidPlan,
          } as unknown as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_PLAN_GOVERNANCE_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when invocation plan enables automatic recall",
      () => {
        const scheduler =
          createDueSchedulerResult();

        if (
          scheduler.invocationPlan ===
          undefined
        ) {
          throw new Error(
            "TEST_INVOCATION_PLAN_REQUIRED",
          );
        }

        const invalidPlan =
          {
            ...scheduler.invocationPlan,

            automaticRecall:
              true,
          };

        const invalidScheduler =
          {
            ...scheduler,

            invocationPlan:
              invalidPlan,
          } as unknown as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_PLAN_GOVERNANCE_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when invocation plan enables repository mutation",
      () => {
        const scheduler =
          createDueSchedulerResult();

        if (
          scheduler.invocationPlan ===
          undefined
        ) {
          throw new Error(
            "TEST_INVOCATION_PLAN_REQUIRED",
          );
        }

        const invalidPlan =
          {
            ...scheduler.invocationPlan,

            automaticRepositoryMutation:
              true,
          };

        const invalidScheduler =
          {
            ...scheduler,

            invocationPlan:
              invalidPlan,
          } as unknown as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_PLAN_GOVERNANCE_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when scheduler governance is modified",
      () => {
        const scheduler =
          createDueSchedulerResult();

        const invalidScheduler =
          {
            ...scheduler,

            governance: {
              ...scheduler
                .governance,

              automaticExecution:
                true,
            },
          } as unknown as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_SCHEDULER_GOVERNANCE_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when scheduler legalCertification is true",
      () => {
        const scheduler =
          createDueSchedulerResult();

        const invalidScheduler =
          {
            ...scheduler,

            legalCertification:
              true,
          } as unknown as RuntimeBrainSchedulerResult;

        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                schedulerResult:
                  invalidScheduler,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_SCHEDULER_LEGAL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when human authorization invariant is disabled",
      () => {
        expect(
          () =>
            runScheduledRuntimeBrain(
              {
                ...createRunnerInput(),

                humanAuthorizationRequired:
                  false as true,
              },
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_AUTHORIZATION_INVARIANT_VIOLATION",
        );
      },
    );

    it(
      "fails closed for invalid execution timestamp",
      () => {
        expect(
          () =>
            runScheduledRuntimeBrain(
              createRunnerInput({
                executedAt:
                  "INVALID-TIME",
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNNER_TIMESTAMP_INVALID",
        );
      },
    );

    it(
      "executes Runtime Brain when scheduler and runner authorization are valid",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput(),
          );

        expect(
          result.status,
        ).toBe(
          "EXECUTED",
        );

        expect(
          result.runtimeBrainResult,
        ).toBeDefined();

        expect(
          result.summary
            .runtimeBrainExecuted,
        ).toBe(true);

        expect(
          result.summary
            .runtimeBrainExecutionId,
        ).toBeDefined();
      },
    );

    it(
      "keeps scheduled Runtime Brain proposal unaccepted",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput(),
          );

        expect(
          result.runtimeBrainResult
            ?.acceptedByOperator,
        ).toBe(false);

        expect(
          result.runtimeBrainResult
            ?.researchDevelopment
            .scientificCycle
            .acceptedByOperator,
        ).toBe(false);
      },
    );

    it(
      "preserves Runtime Brain mutation boundaries after execution",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput(),
          );

        const brain =
          result.runtimeBrainResult;

        expect(brain).toBeDefined();

        expect(
          brain?.boundary
            .automaticRepositoryMutation,
        ).toBe(false);

        expect(
          brain?.boundary
            .automaticPersistence,
        ).toBe(false);

        expect(
          brain?.boundary
            .automaticRecall,
        ).toBe(false);

        expect(
          brain?.boundary
            .legalCertification,
        ).toBe(false);

        expect(
          brain?.legalCertification,
        ).toBe(false);
      },
    );

    it(
      "records scheduler trigger in successful execution result",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput(),
          );

        expect(
          result.schedulerResult
            .reason,
        ).toBe(
          "NEW_COMMIT",
        );

        expect(
          result.reasons.some(
            (reason) =>
              reason.includes(
                "NEW_COMMIT",
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      "produces identical output for identical input",
      () => {
        const input =
          createRunnerInput();

        const first =
          runScheduledRuntimeBrain(
            input,
          );

        const second =
          runScheduledRuntimeBrain(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "preserves runner governance boundaries",
      () => {
        const result =
          runScheduledRuntimeBrain(
            createRunnerInput(),
          );

        expect(
          result.governance
            .deterministicCore,
        ).toBe(true);

        expect(
          result.governance
            .failClosed,
        ).toBe(true);

        expect(
          result.governance
            .humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance
            .automaticRepositoryMutation,
        ).toBe(false);

        expect(
          result.governance
            .automaticPersistence,
        ).toBe(false);

        expect(
          result.governance
            .automaticRecall,
        ).toBe(false);

        expect(
          result.governance
            .legalCertification,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);
