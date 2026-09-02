import {
  describe,
  expect,
  it,
} from "vitest";

import {
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import type {
  PlatformCoreCanonicalExecutionGenesis,
} from "./canonical-execution-genesis-builder";

import type {
  PlatformCoreAuthorizationConsumptionEvidence,
} from "./authorization-consumption-repository";

import {
  buildPlatformCoreCanonicalExecutionPendingToExecuting,
  type PlatformCoreCanonicalExecutionExecutingV2,
  type PlatformCoreExecutionPendingToExecutingInput,
} from "./canonical-execution-pending-to-executing-builder";

import {
  PLATFORM_CORE_EXECUTION_OBSERVATION_SOURCE_PORT_PROTOCOL,
  PlatformCoreExecutionObservationSourcePortError,
  validatePlatformCoreExecutionObservation,
  type PlatformCoreExecutionObservationReceipt,
} from "./execution-observation-source-port";

const AUTHORIZATION_SHA =
  "a".repeat(64);

const ACTION_SHA =
  "b".repeat(64);

const REQUEST_SHA =
  "c".repeat(64);

const REPLAY_SHA =
  "d".repeat(64);

const STATE_BEFORE_SHA =
  "e".repeat(64);

const STATE_AFTER_SHA =
  "f".repeat(64);

const BOUNDARY = {
  data_minimization:
    true,

  reference_over_raw_evidence:
    true,

  execution_requires_authorization:
    true,

  authorization_not_execution:
    true,

  authorized_not_executed:
    true,

  execution_not_success:
    true,

  execution_not_outcome:
    true,

  execution_not_consequence:
    true,

  exact_authorization_version_required:
    true,

  authorization_hash_binding_required:
    true,

  action_digest_match_required:
    true,

  request_digest_match_required:
    true,

  iospace_match_required:
    true,

  enforcement_point_match_required:
    true,

  precheck_allow_required_before_start:
    true,

  pending_not_consumed:
    true,

  authorization_consumption_required_before_start:
    true,

  atomic_consumption_required:
    true,

  state_before_required_before_start:
    true,

  state_after_required_after_terminal_execution:
    true,

  failed_or_aborted_state_after_may_be_unavailable:
    true,

  stale_or_revoked_authorization_blocks_start:
    true,

  unknown_blocks_start:
    true,

  blocked_not_executed:
    true,

  cross_object_binding_runtime_validation_required:
    true,

  temporal_order_runtime_validation_required:
    true,

  atomic_consumption_runtime_enforcement_required:
    true,

  append_only_genealogy:
    true,

  no_automatic_success_claim:
    true,

  no_regulated_certification_claim:
    true,

  no_public_authority_claim:
    true,

  fail_closed:
    true,
} as const;

function withPayloadHash(
  candidate:
    Omit<
      PlatformCoreCanonicalExecutionGenesis,
      "payload_sha256"
    >,
): PlatformCoreCanonicalExecutionGenesis {
  return {
    ...candidate,

    payload_sha256:
      computePlatformCorePayloadSha256(
        candidate,
      ),
  };
}

function makePredecessor():
  PlatformCoreCanonicalExecutionGenesis {
  const candidate = {
    proto:
      "HBCE-EXECUTION-v1" as const,

    kind:
      "HBCE_CORE_EXECUTION" as const,

    version:
      "v1" as const,

    execution_id:
      "EXE-TEST:OBSERVATION",

    execution_version:
      1 as const,

    principal_ref:
      "PRINCIPAL:TEST",

    actor_ref:
      "ACTOR:TEST",

    authorization_ref:
      "AZN-TEST:OBSERVATION",

    authorization_version:
      1,

    authorization_sha256:
      AUTHORIZATION_SHA,

    iospace_ref:
      "IOSPACE:TEST",

    enforcement_point_ref:
      "ENFORCEMENT:TEST",

    execution_engine_ref:
      "ENGINE:TEST",

    binding_check: {
      action_class:
        "ACTION:TEST",

      target_ref:
        "TARGET:TEST",

      authorization_action_sha256:
        ACTION_SHA,

      execution_action_sha256:
        ACTION_SHA,

      authorization_request_sha256:
        REQUEST_SHA,

      execution_request_sha256:
        REQUEST_SHA,

      action_match_state:
        "MATCH" as const,

      request_match_state:
        "MATCH" as const,
    },

    precheck: {
      evaluated_at:
        "2026-09-01T18:01:00.000Z",

      authorization_state_observed:
        "AUTHORIZED" as const,

      validity_state:
        "VALID" as const,

      authority_usability_state:
        "PASS" as const,

      dependency_binding_state:
        "PASS" as const,

      iospace_binding_state:
        "PASS" as const,

      enforcement_point_binding_state:
        "PASS" as const,

      replay_state:
        "AVAILABLE" as const,

      decision:
        "ALLOW_EXECUTION" as const,

      evidence_reference:
        "EVIDENCE:PRECHECK",
    },

    authorization_consumption: {
      state:
        "NOT_CONSUMED" as const,

      replay_key_sha256:
        REPLAY_SHA,

      usage_counter_ref:
        "COUNTER:TEST",

      consumption_event_ref:
        null,

      consumption_index:
        null,

      consumed_at:
        null,

      atomic:
        true as const,
    },

    state_before: {
      observation_state:
        "CAPTURED" as const,

      state_ref:
        "STATE:BEFORE",

      state_sha256:
        STATE_BEFORE_SHA,
    },

    state_after: {
      observation_state:
        "UNKNOWN" as const,

      state_ref:
        null,

      state_sha256:
        null,
    },

    state:
      "PENDING" as const,

    requested_at:
      "2026-09-01T18:01:00.000Z",

    started_at:
      null,

    completed_at:
      null,

    evidence_state:
      "PRESENT" as const,

    evidence_reference:
      "EVIDENCE:PENDING",

    outcome_reference:
      null,

    consequence_reference:
      null,

    evt_reference:
      null,

    opc_reference:
      null,

    append_only:
      true as const,

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        "PENDING" as const,

      cause:
        "Canonical execution genesis",

      evidence_reference:
        "EVIDENCE:GENESIS",

      timestamp:
        "2026-09-01T18:01:00.000Z",

      hash:
        AUTHORIZATION_SHA,
    },

    boundary: {
      ...BOUNDARY,
    },

    note:
      "execution-observation-source-port-test",
  } satisfies
    Omit<
      PlatformCoreCanonicalExecutionGenesis,
      "payload_sha256"
    >;

  return withPayloadHash(
    candidate,
  );
}

function makeConsumptionEvidence(
  predecessor:
    PlatformCoreCanonicalExecutionGenesis,
): PlatformCoreAuthorizationConsumptionEvidence {
  return {
    consumptionEventRef:
      "CONSUMPTION:EVENT:OBSERVATION",

    executionId:
      predecessor.execution_id,

    consumptionIndex:
      1,

    authorizationRef:
      predecessor.authorization_ref,

    authorizationVersion:
      String(
        predecessor.authorization_version,
      ),

    authorizationSha256:
      predecessor.authorization_sha256,

    replayKeySha256:
      predecessor
        .authorization_consumption
        .replay_key_sha256,

    usageCounterRef:
      predecessor
        .authorization_consumption
        .usage_counter_ref,

    actionSha256:
      predecessor
        .binding_check
        .execution_action_sha256,

    requestSha256:
      predecessor
        .binding_check
        .execution_request_sha256,

    iospaceRef:
      predecessor.iospace_ref,

    consumedAt:
      "2026-09-01T18:02:00.000Z",

    atomic:
      true,

    idempotentReplay:
      false,
  };
}

function makeTransitionInput():
  PlatformCoreExecutionPendingToExecutingInput {
  return {
    started_at:
      "2026-09-01T18:02:01.000Z",

    evidence_reference:
      "EVIDENCE:EXECUTING",

    genealogy: {
      cause:
        "Authorization consumed and execution started",

      evidence_reference:
        "EVIDENCE:CONSUMPTION",

      timestamp:
        "2026-09-01T18:01:30.000Z",
    },
  };
}

function makeExecution():
  PlatformCoreCanonicalExecutionExecutingV2 {
  const predecessor =
    makePredecessor();

  return buildPlatformCoreCanonicalExecutionPendingToExecuting(
    predecessor,
    makeConsumptionEvidence(
      predecessor,
    ),
    makeTransitionInput(),
  );
}

function makeReceipt(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  overrides:
    Partial<
      PlatformCoreExecutionObservationReceipt
    > = {},
): PlatformCoreExecutionObservationReceipt {
  return {
    executionId:
      execution.execution_id,

    executionVersion:
      2,

    executionSha256:
      execution.payload_sha256,

    executionEngineRef:
      execution.execution_engine_ref,

    enforcementPointRef:
      execution.enforcement_point_ref,

    terminalStateObserved:
      "EXECUTED",

    observationState:
      "CAPTURED",

    stateRef:
      "STATE:AFTER",

    stateSha256:
      STATE_AFTER_SHA,

    evidenceReference:
      "EVIDENCE:POST-EXECUTION-OBSERVATION",

    observedAt:
      "2026-09-01T18:03:00.000Z",

    ...overrides,
  };
}

function cloneRecord(
  value:
    object,
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as Record<string, unknown>;
}

function expectPortFailure(
  execution:
    unknown,
  receipt:
    unknown,
  code:
    string,
): void {
  try {
    validatePlatformCoreExecutionObservation(
      execution as
        PlatformCoreCanonicalExecutionExecutingV2,
      receipt as
        PlatformCoreExecutionObservationReceipt,
    );

    throw new Error(
      "expected execution observation source port failure",
    );
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreExecutionObservationSourcePortError,
    );

    expect(
      (
        error as
          PlatformCoreExecutionObservationSourcePortError
      ).code,
    ).toBe(
      code,
    );
  }
}

describe(
  "Platform Core execution observation source port",
  () => {
    it(
      "locks the source-port protocol identity",
      () => {
        expect(
          PLATFORM_CORE_EXECUTION_OBSERVATION_SOURCE_PORT_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-EXECUTION-OBSERVATION-SOURCE-PORT-v1",
        );
      },
    );

    it(
      "validates an exact canonical EXECUTING v2 observation receipt",
      () => {
        const execution =
          makeExecution();

        const receipt =
          makeReceipt(
            execution,
          );

        const result =
          validatePlatformCoreExecutionObservation(
            execution,
            receipt,
          );

        expect(
          result,
        ).toEqual({
          executionId:
            execution.execution_id,

          executionVersion:
            2,

          executionSha256:
            execution.payload_sha256,

          executionEngineRef:
            execution.execution_engine_ref,

          enforcementPointRef:
            execution.enforcement_point_ref,

          evidenceReference:
            "EVIDENCE:POST-EXECUTION-OBSERVATION",

          observedAt:
            "2026-09-01T18:03:00.000Z",

          stateAfterSource: {
            terminalStateObserved:
              "EXECUTED",

            observationState:
              "CAPTURED",

            stateRef:
              "STATE:AFTER",

            stateSha256:
              STATE_AFTER_SHA,
          },
        });
      },
    );

    it(
      "allows FAILED with UNKNOWN post-execution state",
      () => {
        const execution =
          makeExecution();

        const result =
          validatePlatformCoreExecutionObservation(
            execution,
            makeReceipt(
              execution,
              {
                terminalStateObserved:
                  "FAILED",

                observationState:
                  "UNKNOWN",

                stateRef:
                  null,

                stateSha256:
                  null,
              },
            ),
          );

        expect(
          result.stateAfterSource,
        ).toEqual({
          terminalStateObserved:
            "FAILED",

          observationState:
            "UNKNOWN",

          stateRef:
            null,

          stateSha256:
            null,
        });
      },
    );

    it(
      "returns frozen observation binding and state-after source",
      () => {
        const execution =
          makeExecution();

        const result =
          validatePlatformCoreExecutionObservation(
            execution,
            makeReceipt(
              execution,
            ),
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            result.stateAfterSource,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not mutate execution or receipt",
      () => {
        const execution =
          makeExecution();

        const receipt =
          makeReceipt(
            execution,
          );

        const executionBefore =
          JSON.stringify(
            execution,
          );

        const receiptBefore =
          JSON.stringify(
            receipt,
          );

        validatePlatformCoreExecutionObservation(
          execution,
          receipt,
        );

        expect(
          JSON.stringify(
            execution,
          ),
        ).toBe(
          executionBefore,
        );

        expect(
          JSON.stringify(
            receipt,
          ),
        ).toBe(
          receiptBefore,
        );
      },
    );

    it(
      "rejects schema-invalid EXECUTION",
      () => {
        const execution =
          makeExecution();

        const raw =
          cloneRecord(
            execution,
          );

        raw.state =
          "PENDING";

        expectPortFailure(
          raw,
          makeReceipt(
            execution,
          ),
          "EXECUTION_SCHEMA_INVALID",
        );
      },
    );

    it(
      "rejects tampered EXECUTION carrying stale canonical payload hash",
      () => {
        const execution =
          makeExecution();

        const raw =
          cloneRecord(
            execution,
          );

        raw.execution_engine_ref =
          "ENGINE:TAMPERED";

        expectPortFailure(
          raw,
          makeReceipt(
            execution,
          ),
          "EXECUTION_HASH_INVALID",
        );
      },
    );

    it(
      "rejects tampered EXECUTION carrying arbitrary valid SHA-256",
      () => {
        const execution =
          makeExecution();

        const raw =
          cloneRecord(
            execution,
          );

        raw.execution_engine_ref =
          "ENGINE:TAMPERED";

        raw.payload_sha256 =
          "9".repeat(64);

        expectPortFailure(
          raw,
          makeReceipt(
            execution,
          ),
          "EXECUTION_HASH_INVALID",
        );
      },
    );

    it(
      "rejects receipt execution SHA mismatch",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              executionSha256:
                "9".repeat(64),
            },
          ),
          "EXECUTION_BINDING_MISMATCH",
        );
      },
    );

    it(
      "rejects receipt execution id mismatch",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              executionId:
                "EXE-TEST:OTHER",
            },
          ),
          "EXECUTION_BINDING_MISMATCH",
        );
      },
    );

    it(
      "rejects execution-engine binding mismatch",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              executionEngineRef:
                "ENGINE:OTHER",
            },
          ),
          "EXECUTION_BINDING_MISMATCH",
        );
      },
    );

    it(
      "rejects enforcement-point binding mismatch",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              enforcementPointRef:
                "ENFORCEMENT:OTHER",
            },
          ),
          "EXECUTION_BINDING_MISMATCH",
        );
      },
    );

    it(
      "rejects invalid observation timestamp",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              observedAt:
                "not-a-date",
            },
          ),
          "INVALID_RECEIPT",
        );
      },
    );

    it(
      "rejects CAPTURED observation without canonical state material",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              stateRef:
                null,

              stateSha256:
                null,
            },
          ),
          "INVALID_OBSERVATION",
        );
      },
    );

    it(
      "rejects UNKNOWN observation carrying state material",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              terminalStateObserved:
                "FAILED",

              observationState:
                "UNKNOWN",

              stateRef:
                "STATE:SHOULD-NOT-EXIST",

              stateSha256:
                null,
            },
          ),
          "INVALID_OBSERVATION",
        );
      },
    );

    it(
      "rejects EXECUTED without CAPTURED post-execution state",
      () => {
        const execution =
          makeExecution();

        expectPortFailure(
          execution,
          makeReceipt(
            execution,
            {
              observationState:
                "UNKNOWN",

              stateRef:
                null,

              stateSha256:
                null,
            },
          ),
          "INVALID_OBSERVATION",
        );
      },
    );
  },
);
