/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain Scheduler Tests
 *
 * Verifies:
 * - MANUAL scheduling;
 * - INTERVAL scheduling;
 * - COMMIT scheduling;
 * - PRE_RELEASE scheduling;
 * - operator authorization boundary;
 * - invalid repository evidence;
 * - fail-closed governance;
 * - deterministic replay.
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

import {
  evaluateRuntimeBrainSchedule,
  RUNTIME_BRAIN_SCHEDULER_REVISION,
  type RuntimeBrainSchedulerInput,
  type RuntimeBrainSchedulePolicy,
} from "../runtime-brain-scheduler";

import type {
  RuntimeSelfState,
} from "../../self/runtime-self.service";

const CURRENT_COMMIT =
  "abcdef1234567890";

const PREVIOUS_COMMIT =
  "1111111111111111";

const EVALUATED_AT =
  "2026-08-07T12:30:00+02:00";

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

function createPolicy(
  overrides:
    Partial<RuntimeBrainSchedulePolicy> = {},
): RuntimeBrainSchedulePolicy {
  return {
    mode:
      "MANUAL",

    ...overrides,
  };
}

function createInput(
  overrides:
    Partial<RuntimeBrainSchedulerInput> = {},
): RuntimeBrainSchedulerInput {
  return {
    schedulerId:
      "HBCE-RUNTIME-BRAIN-SCHEDULER-TEST-001",

    evaluatedAt:
      EVALUATED_AT,

    policy:
      createPolicy(),

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

describe(
  "Runtime Brain Scheduler",
  () => {
    it(
      "returns DUE for an explicit manual request",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "MANUAL",
                }),

              manualRequested:
                true,
            }),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_BRAIN_SCHEDULER_REVISION,
        );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "MANUAL_REQUEST",
        );

        expect(
          result.due,
        ).toBe(true);

        expect(
          result.invocationPlan,
        ).toBeDefined();
      },
    );

    it(
      "returns NOT_DUE when MANUAL mode has no manual request",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "MANUAL",
                }),

              manualRequested:
                false,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "NOT_DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NO_TRIGGER",
        );

        expect(
          result.due,
        ).toBe(false);

        expect(
          result.invocationPlan,
        ).toBeUndefined();
      },
    );

    it(
      "returns DUE when the configured interval has elapsed",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "INTERVAL",

                  intervalMinutes:
                    60,

                  lastExecutionAt:
                    "2026-08-07T10:30:00+02:00",
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "INTERVAL_ELAPSED",
        );

        expect(
          result.due,
        ).toBe(true);
      },
    );

    it(
      "returns NOT_DUE when the configured interval has not elapsed",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "INTERVAL",

                  intervalMinutes:
                    120,

                  lastExecutionAt:
                    "2026-08-07T11:30:00+02:00",
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "NOT_DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NO_TRIGGER",
        );

        expect(
          result.due,
        ).toBe(false);
      },
    );

    it(
      "returns DUE for the first INTERVAL execution when no previous timestamp exists",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "INTERVAL",

                  intervalMinutes:
                    60,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "INTERVAL_ELAPSED",
        );
      },
    );

    it(
      "fails closed when INTERVAL is below the minimum supported interval",
      () => {
        expect(
          () =>
            evaluateRuntimeBrainSchedule(
              createInput({
                policy:
                  createPolicy({
                    mode:
                      "INTERVAL",

                    intervalMinutes:
                      30,
                  }),
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_INTERVAL_INVALID",
        );
      },
    );

    it(
      "returns DUE when a new repository commit is detected",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "COMMIT",

                  lastAnalyzedCommit:
                    PREVIOUS_COMMIT,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NEW_COMMIT",
        );

        expect(
          result.due,
        ).toBe(true);

        expect(
          result.reasons.some(
            (reason) =>
              reason.includes(
                PREVIOUS_COMMIT,
              ) &&
              reason.includes(
                CURRENT_COMMIT,
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      "returns NOT_DUE when repository commit is unchanged",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "COMMIT",

                  lastAnalyzedCommit:
                    CURRENT_COMMIT,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "NOT_DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NO_TRIGGER",
        );

        expect(
          result.due,
        ).toBe(false);
      },
    );

    it(
      "returns DUE for the first commit evaluation when no previous commit exists",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "COMMIT",
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NEW_COMMIT",
        );
      },
    );

    it(
      "returns BLOCKED when COMMIT mode has no current repository commit",
      () => {
        const state =
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
          });

        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              runtimeSelfState:
                state,

              policy:
                createPolicy({
                  mode:
                    "COMMIT",

                  lastAnalyzedCommit:
                    PREVIOUS_COMMIT,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          result.reason,
        ).toBe(
          "INVALID_STATE",
        );

        expect(
          result.due,
        ).toBe(false);

        expect(
          result.invocationPlan,
        ).toBeUndefined();
      },
    );

    it(
      "returns DUE when a release candidate requires pre-release evaluation",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "PRE_RELEASE",

                  releaseCandidate:
                    true,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "PRE_RELEASE_CHECK",
        );

        expect(
          result.due,
        ).toBe(true);
      },
    );

    it(
      "returns NOT_DUE when there is no release candidate",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "PRE_RELEASE",

                  releaseCandidate:
                    false,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "NOT_DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "NO_TRIGGER",
        );
      },
    );

    it(
      "allows an explicit manual request to override another scheduling mode",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "COMMIT",

                  lastAnalyzedCommit:
                    CURRENT_COMMIT,
                }),

              manualRequested:
                true,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "DUE",
        );

        expect(
          result.reason,
        ).toBe(
          "MANUAL_REQUEST",
        );
      },
    );

    it(
      "returns REVIEW_REQUIRED when execution is due but operator authorization is absent",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              policy:
                createPolicy({
                  mode:
                    "COMMIT",

                  lastAnalyzedCommit:
                    PREVIOUS_COMMIT,
                }),

              operatorAuthorized:
                false,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.reason,
        ).toBe(
          "NEW_COMMIT",
        );

        expect(
          result.due,
        ).toBe(true);

        expect(
          result.invocationPlan,
        ).toBeUndefined();

        expect(
          result.operatorAuthorized,
        ).toBe(false);
      },
    );

    it(
      "creates a non-executable Runtime Brain invocation plan",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              manualRequested:
                true,
            }),
          );

        const plan =
          result.invocationPlan;

        expect(plan).toBeDefined();

        expect(
          plan?.humanAuthorizationRequired,
        ).toBe(true);

        expect(
          plan?.automaticExecution,
        ).toBe(false);

        expect(
          plan?.automaticPersistence,
        ).toBe(false);

        expect(
          plan?.automaticRecall,
        ).toBe(false);

        expect(
          plan?.automaticRepositoryMutation,
        ).toBe(false);

        expect(
          plan?.legalCertification,
        ).toBe(false);

        expect(
          plan?.runtimeBrainInput
            .operatorAuthorized,
        ).toBe(true);

        expect(
          plan?.runtimeBrainInput
            .acceptedByOperator,
        ).toBe(false);

        expect(
          plan?.runtimeBrainInput
            .humanAuthorizationRequired,
        ).toBe(true);
      },
    );

    it(
      "produces identical output for identical input",
      () => {
        const input =
          createInput({
            policy:
              createPolicy({
                mode:
                  "COMMIT",

                lastAnalyzedCommit:
                  PREVIOUS_COMMIT,
              }),
          });

        const first =
          evaluateRuntimeBrainSchedule(
            input,
          );

        const second =
          evaluateRuntimeBrainSchedule(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "fails closed for an invalid evaluated timestamp",
      () => {
        expect(
          () =>
            evaluateRuntimeBrainSchedule(
              createInput({
                evaluatedAt:
                  "NOT-A-TIMESTAMP",
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_TIMESTAMP_INVALID",
        );
      },
    );

    it(
      "fails closed when human authorization invariant is disabled",
      () => {
        expect(
          () =>
            evaluateRuntimeBrainSchedule({
              ...createInput(),

              humanAuthorizationRequired:
                false as true,
            }),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_AUTHORIZATION_INVARIANT_VIOLATION",
        );
      },
    );

    it(
      "fails closed when RuntimeSelfState violates legal boundary",
      () => {
        const invalidState =
          {
            ...createRuntimeSelfState(),

            legalCertification:
              true,
          } as unknown as RuntimeSelfState;

        expect(
          () =>
            evaluateRuntimeBrainSchedule(
              createInput({
                runtimeSelfState:
                  invalidState,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when automatic persistence is enabled",
      () => {
        const invalidState =
          {
            ...createRuntimeSelfState(),

            automaticPersistence:
              true,
          } as unknown as RuntimeSelfState;

        expect(
          () =>
            evaluateRuntimeBrainSchedule(
              createInput({
                runtimeSelfState:
                  invalidState,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when automatic recall is enabled",
      () => {
        const invalidState =
          {
            ...createRuntimeSelfState(),

            automaticRecall:
              true,
          } as unknown as RuntimeSelfState;

        expect(
          () =>
            evaluateRuntimeBrainSchedule(
              createInput({
                runtimeSelfState:
                  invalidState,
              }),
            ),
        ).toThrow(
          "RUNTIME_BRAIN_SCHEDULER_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "preserves every scheduler governance boundary",
      () => {
        const result =
          evaluateRuntimeBrainSchedule(
            createInput({
              manualRequested:
                true,
            }),
          );

        expect(
          result.governance.readOnly,
        ).toBe(true);

        expect(
          result.governance.deterministic,
        ).toBe(true);

        expect(
          result.governance.failClosed,
        ).toBe(true);

        expect(
          result.governance
            .humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance
            .automaticExecution,
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
            .automaticRepositoryMutation,
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
