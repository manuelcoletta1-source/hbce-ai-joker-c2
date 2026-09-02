import {
  readFileSync,
} from "node:fs";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks =
  vi.hoisted(
    () => ({
      persistSnapshot:
        vi.fn(),

      persistEvidence:
        vi.fn(),
    }),
  );

vi.mock(
  "./canonical-state-snapshot-repository",
  () => ({
    persistPlatformCoreCanonicalStateSnapshot:
      mocks.persistSnapshot,

    PlatformCoreCanonicalStateSnapshotRepositoryError:
      class PlatformCoreCanonicalStateSnapshotRepositoryError
        extends Error {
        readonly code =
          "DATABASE_FAILURE";
      },
  }),
);

vi.mock(
  "./execution-observation-evidence-repository",
  () => ({
    persistPlatformCoreExecutionObservationEvidence:
      mocks.persistEvidence,

    PlatformCoreExecutionObservationEvidenceRepositoryError:
      class PlatformCoreExecutionObservationEvidenceRepositoryError
        extends Error {
        readonly code =
          "DATABASE_FAILURE";
      },
  }),
);

import {
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  derivePlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

import {
  derivePlatformCoreExecutionObservationEvidenceReference,
  type PlatformCoreExecutionObservationEvidenceReferenceInput,
} from "./execution-observation-evidence-reference";

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
  PLATFORM_CORE_CONCRETE_EXECUTION_OBSERVER_PROTOCOL,
  PlatformCoreConcreteExecutionObserverError,
  observePlatformCorePostExecution,
  type PlatformCorePostExecutionObservationReader,
  type PlatformCorePostExecutionObservationResult,
} from "./concrete-execution-observer";

const AUTHORIZATION_SHA =
  "a".repeat(
    64,
  );

const ACTION_SHA =
  "b".repeat(
    64,
  );

const REQUEST_SHA =
  "c".repeat(
    64,
  );

const REPLAY_SHA =
  "d".repeat(
    64,
  );

const STATE_BEFORE_SHA =
  "e".repeat(
    64,
  );

const CREATED_AT =
  "2026-09-02T20:30:00.000Z";

const OBSERVED_AT =
  "2026-09-02T20:29:00.000Z";

const OBSERVED_STATE = {
  account: {
    status:
      "ACTIVE",

    balance:
      1250,
  },

  sequence: [
    1,
    2,
    3,
  ],
};

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
      "EXE-TEST:CONCRETE-OBSERVER",

    execution_version:
      1 as const,

    principal_ref:
      "PRINCIPAL:TEST",

    actor_ref:
      "ACTOR:TEST",

    authorization_ref:
      "AZN-TEST:CONCRETE-OBSERVER",

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
        "2026-09-02T20:20:00.000Z",

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
      "2026-09-02T20:20:00.000Z",

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
        "2026-09-02T20:20:00.000Z",

      hash:
        AUTHORIZATION_SHA,
    },

    boundary: {
      ...BOUNDARY,
    },

    note:
      "concrete-execution-observer-test",
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
      "CONSUMPTION:EVENT:CONCRETE-OBSERVER",

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
      "2026-09-02T20:21:00.000Z",

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
      "2026-09-02T20:21:01.000Z",

    evidence_reference:
      "EVIDENCE:EXECUTING",

    genealogy: {
      cause:
        "Authorization consumed and execution started",

      evidence_reference:
        "EVIDENCE:CONSUMPTION",

      timestamp:
        "2026-09-02T20:20:30.000Z",
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

function makeReaderResult(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  overrides:
    Partial<
      PlatformCorePostExecutionObservationResult
    > = {},
): PlatformCorePostExecutionObservationResult {
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

    observedState:
      OBSERVED_STATE,

    observedAt:
      OBSERVED_AT,

    ...overrides,
  };
}

function makeReader(
  result:
    PlatformCorePostExecutionObservationResult,
): {
  readonly reader:
    PlatformCorePostExecutionObservationReader;

  readonly read:
    ReturnType<
      typeof vi.fn
    >;
} {
  const read =
    vi.fn()
      .mockResolvedValue(
        result,
      );

  return {
    read,

    reader: {
      readPostExecutionObservation:
        read,
    },
  };
}

function evidencePersistence(
  input:
    PlatformCoreExecutionObservationEvidenceReferenceInput,
) {
  const derived =
    derivePlatformCoreExecutionObservationEvidenceReference(
      input,
    );

  return Object.freeze({
    evidenceReference:
      derived.evidenceReference,

    executionId:
      input.executionId,

    executionVersion:
      input.executionVersion,

    executionSha256:
      input.executionSha256,

    executionEngineRef:
      input.executionEngineRef,

    enforcementPointRef:
      input.enforcementPointRef,

    terminalStateObserved:
      input.terminalStateObserved,

    observationState:
      input.observationState,

    stateRef:
      input.stateRef,

    stateSha256:
      input.stateSha256,

    observedAt:
      input.observedAt,

    createdAt:
      CREATED_AT,

    idempotentReplay:
      false,
  });
}

function observerErrorCode(
  error:
    unknown,
): string | null {
  return (
    error instanceof
      PlatformCoreConcreteExecutionObserverError
  )
    ? error.code
    : null;
}

function cloneExecution(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
): PlatformCoreCanonicalExecutionExecutingV2 {
  return JSON.parse(
    JSON.stringify(
      execution,
    ),
  ) as
    PlatformCoreCanonicalExecutionExecutingV2;
}

beforeEach(
  () => {
    vi.clearAllMocks();

    mocks.persistSnapshot.mockImplementation(
      async (
        observedState:
          unknown,
      ) => {
        const state =
          derivePlatformCoreCanonicalObservedStateReference(
            observedState,
          );

        return Object.freeze({
          ...state,

          createdAt:
            CREATED_AT,

          idempotentReplay:
            false,
        });
      },
    );

    mocks.persistEvidence.mockImplementation(
      async (
        input:
          PlatformCoreExecutionObservationEvidenceReferenceInput,
      ) =>
        evidencePersistence(
          input,
        ),
    );
  },
);

describe(
  "Platform Core concrete post-execution observer",
  () => {
    it(
      "locks protocol identity",
      () => {
        expect(
          PLATFORM_CORE_CONCRETE_EXECUTION_OBSERVER_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CONCRETE-EXECUTION-OBSERVER-v1",
        );
      },
    );

    it(
      "builds an exact frozen execution binding request and reads once",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
          read,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await observePlatformCorePostExecution(
          execution,
          reader,
        );

        expect(
          read,
        ).toHaveBeenCalledTimes(
          1,
        );

        const request =
          read.mock.calls[0]?.[0];

        expect(
          request,
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
        });

        expect(
          Object.isFrozen(
            request,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "persists CAPTURED snapshot before evidence and returns frozen receipt",
      async () => {
        const execution =
          makeExecution();

        const observation =
          makeReaderResult(
            execution,
          );

        const order:
          string[] =
          [];

        mocks.persistSnapshot.mockImplementation(
          async (
            state:
              unknown,
          ) => {
            order.push(
              "snapshot",
            );

            const material =
              derivePlatformCoreCanonicalObservedStateReference(
                state,
              );

            return {
              ...material,
              createdAt:
                CREATED_AT,
              idempotentReplay:
                false,
            };
          },
        );

        mocks.persistEvidence.mockImplementation(
          async (
            input:
              PlatformCoreExecutionObservationEvidenceReferenceInput,
          ) => {
            order.push(
              "evidence",
            );

            return evidencePersistence(
              input,
            );
          },
        );

        const {
          reader,
        } =
          makeReader(
            observation,
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            reader,
          );

        expect(
          order,
        ).toEqual([
          "snapshot",
          "evidence",
        ]);

        expect(
          mocks.persistSnapshot,
        ).toHaveBeenCalledWith(
          OBSERVED_STATE,
        );

        expect(
          receipt.executionId,
        ).toBe(
          execution.execution_id,
        );

        expect(
          receipt.stateRef,
        ).toBe(
          derivePlatformCoreCanonicalObservedStateReference(
            OBSERVED_STATE,
          ).stateRef,
        );

        expect(
          Object.isFrozen(
            receipt,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "preserves observedAt exact textual representation",
      async () => {
        const execution =
          makeExecution();

        const exactObservedAt =
          "2026-09-02T20:29:00Z";

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                observedAt:
                  exactObservedAt,
              },
            ),
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            reader,
          );

        expect(
          receipt.observedAt,
        ).toBe(
          exactObservedAt,
        );

        expect(
          receipt.observedAt,
        ).not.toBe(
          "2026-09-02T20:29:00.000Z",
        );
      },
    );

    it(
      "skips snapshot for FAILED UNKNOWN observation",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                terminalStateObserved:
                  "FAILED",

                observationState:
                  "UNKNOWN",

                observedState:
                  null,
              },
            ),
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            reader,
          );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          receipt.observationState,
        ).toBe(
          "UNKNOWN",
        );

        expect(
          receipt.stateRef,
        ).toBeNull();

        expect(
          receipt.stateSha256,
        ).toBeNull();

        expect(
          mocks.persistEvidence,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "accepts ABORTED NOT_AVAILABLE with null observed state",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                terminalStateObserved:
                  "ABORTED",

                observationState:
                  "NOT_AVAILABLE",

                observedState:
                  null,
              },
            ),
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            reader,
          );

        expect(
          receipt.terminalStateObserved,
        ).toBe(
          "ABORTED",
        );

        expect(
          receipt.observationState,
        ).toBe(
          "NOT_AVAILABLE",
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "accepts JSON null as a CAPTURED observed state",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                observedState:
                  null,
              },
            ),
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            reader,
          );

        expect(
          mocks.persistSnapshot,
        ).toHaveBeenCalledWith(
          null,
        );

        expect(
          receipt.stateRef,
        ).toBe(
          derivePlatformCoreCanonicalObservedStateReference(
            null,
          ).stateRef,
        );
      },
    );

    it(
      "rejects non-object execution before reader invocation",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
          read,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            null as unknown as
              PlatformCoreCanonicalExecutionExecutingV2,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_EXECUTION",
        );

        expect(
          read,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistEvidence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects tampered execution hash before reader invocation",
      async () => {
        const execution =
          cloneExecution(
            makeExecution(),
          );

        const tampered = {
          ...execution,

          payload_sha256:
            "0".repeat(
              64,
            ),
        } as
          PlatformCoreCanonicalExecutionExecutingV2;

        const {
          reader,
          read,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            tampered,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "EXECUTION_HASH_INVALID",
        );

        expect(
          read,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid reader before any persistence",
      async () => {
        await expect(
          observePlatformCorePostExecution(
            makeExecution(),
            {} as
              PlatformCorePostExecutionObservationReader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER",
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistEvidence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when external reader rejects",
      async () => {
        const read =
          vi.fn()
            .mockRejectedValue(
              new Error(
                "EXTERNAL_READ_FAILED",
              ),
            );

        await expect(
          observePlatformCorePostExecution(
            makeExecution(),
            {
              readPostExecutionObservation:
                read,
            },
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "READER_FAILURE",
        );

        expect(
          read,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistEvidence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects reader execution binding mismatch before persistence",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                executionId:
                  "EXE:OTHER",
              },
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "READER_BINDING_MISMATCH",
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();

        expect(
          mocks.persistEvidence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects reader result containing an unknown field",
      async () => {
        const execution =
          makeExecution();

        const raw = {
          ...makeReaderResult(
            execution,
          ),

          inventedField:
            true,
        };

        await expect(
          observePlatformCorePostExecution(
            execution,
            {
              readPostExecutionObservation:
                vi.fn()
                  .mockResolvedValue(
                    raw,
                  ),
            } as
              PlatformCorePostExecutionObservationReader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects reader result missing a required field",
      async () => {
        const execution =
          makeExecution();

        const {
          observedAt:
            _removed,
          ...raw
        } =
          makeReaderResult(
            execution,
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            {
              readPostExecutionObservation:
                vi.fn()
                  .mockResolvedValue(
                    raw,
                  ),
            } as
              PlatformCorePostExecutionObservationReader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );
      },
    );

    it(
      "rejects reader result accessors without executing getter",
      async () => {
        const execution =
          makeExecution();

        const raw:
          Record<string, unknown> =
          {
            ...makeReaderResult(
              execution,
            ),
          };

        let getterCalls =
          0;

        Object.defineProperty(
          raw,
          "observedAt",
          {
            enumerable:
              true,

            configurable:
              true,

            get() {
              getterCalls +=
                1;

              return OBSERVED_AT;
            },
          },
        );

        await expect(
          observePlatformCorePostExecution(
            execution,
            {
              readPostExecutionObservation:
                vi.fn()
                  .mockResolvedValue(
                    raw,
                  ),
            } as
              PlatformCorePostExecutionObservationReader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );

        expect(
          getterCalls,
        ).toBe(
          0,
        );
      },
    );

    it(
      "rejects CAPTURED result with undefined observedState",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                observedState:
                  undefined,
              },
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );

        expect(
          mocks.persistSnapshot,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects non-CAPTURED result carrying observed state",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                terminalStateObserved:
                  "FAILED",

                observationState:
                  "UNKNOWN",

                observedState: {
                  forbidden:
                    true,
                },
              },
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );
      },
    );

    it(
      "rejects EXECUTED result without CAPTURED observation",
      async () => {
        const execution =
          makeExecution();

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
              {
                terminalStateObserved:
                  "EXECUTED",

                observationState:
                  "UNKNOWN",

                observedState:
                  null,
              },
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "INVALID_READER_RESULT",
        );
      },
    );

    it(
      "fails closed when CAPTURED snapshot persistence fails",
      async () => {
        const execution =
          makeExecution();

        mocks.persistSnapshot.mockRejectedValue(
          new Error(
            "SNAPSHOT_FAILURE",
          ),
        );

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "SNAPSHOT_PERSISTENCE_FAILURE",
        );

        expect(
          mocks.persistEvidence,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when observation evidence persistence fails",
      async () => {
        const execution =
          makeExecution();

        mocks.persistEvidence.mockRejectedValue(
          new Error(
            "EVIDENCE_FAILURE",
          ),
        );

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "EVIDENCE_PERSISTENCE_FAILURE",
        );

        expect(
          mocks.persistSnapshot,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "fails closed when durable evidence changes observation material",
      async () => {
        const execution =
          makeExecution();

        mocks.persistEvidence.mockImplementation(
          async (
            input:
              PlatformCoreExecutionObservationEvidenceReferenceInput,
          ) => ({
            ...evidencePersistence(
              input,
            ),

            observedAt:
              "2026-09-02T20:29:01.000Z",
          }),
        );

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "PERSISTENCE_BINDING_MISMATCH",
        );
      },
    );

    it(
      "fails closed when durable evidence reference is non-canonical",
      async () => {
        const execution =
          makeExecution();

        mocks.persistEvidence.mockImplementation(
          async (
            input:
              PlatformCoreExecutionObservationEvidenceReferenceInput,
          ) => ({
            ...evidencePersistence(
              input,
            ),

            evidenceReference:
              "EVIDENCE:INVALID",
          }),
        );

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await expect(
          observePlatformCorePostExecution(
            execution,
            reader,
          ),
        ).rejects.toSatisfy(
          (
            error:
              unknown,
          ) =>
            observerErrorCode(
              error,
            )
              ===
            "PERSISTENCE_BINDING_MISMATCH",
        );
      },
    );

    it(
      "passes exact persisted snapshot identity into evidence material",
      async () => {
        const execution =
          makeExecution();

        const customState =
          derivePlatformCoreCanonicalObservedStateReference({
            custom:
              "post-effect-state",
          });

        mocks.persistSnapshot.mockResolvedValue({
          ...customState,

          createdAt:
            CREATED_AT,

          idempotentReplay:
            true,
        });

        const {
          reader,
        } =
          makeReader(
            makeReaderResult(
              execution,
            ),
          );

        await observePlatformCorePostExecution(
          execution,
          reader,
        );

        expect(
          mocks.persistEvidence,
        ).toHaveBeenCalledTimes(
          1,
        );

        const input =
          mocks.persistEvidence.mock.calls[0]?.[0];

        expect(
          input.stateRef,
        ).toBe(
          customState.stateRef,
        );

        expect(
          input.stateSha256,
        ).toBe(
          customState.stateSha256,
        );
      },
    );

    it(
      "captures each reader-result data property exactly once",
      async () => {
        const execution =
          makeExecution();

        const counts =
          new Map<
            PropertyKey,
            number
          >();

        const raw =
          new Proxy(
            makeReaderResult(
              execution,
            ),
            {
              getOwnPropertyDescriptor(
                target,
                property,
              ) {
                const next =
                  (
                    counts.get(
                      property,
                    )
                    ?? 0
                  ) + 1;

                counts.set(
                  property,
                  next,
                );

                if (
                  next > 1
                ) {
                  throw new Error(
                    `READER_PROPERTY_REREAD:${String(property)}`,
                  );
                }

                return Reflect.getOwnPropertyDescriptor(
                  target,
                  property,
                );
              },
            },
          );

        const receipt =
          await observePlatformCorePostExecution(
            execution,
            {
              readPostExecutionObservation:
                vi.fn()
                  .mockResolvedValue(
                    raw,
                  ),
            },
          );

        expect(
          receipt.executionId,
        ).toBe(
          execution.execution_id,
        );

        expect(
          Array.from(
            counts.values(),
          ).every(
            (
              count,
            ) =>
              count === 1,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "keeps source-port, state-after and terminal recovery outside observer",
      () => {
        const source =
          readFileSync(
            new URL(
              "./concrete-execution-observer.ts",
              import.meta.url,
            ),
            "utf8",
          );

        expect(
          source,
        ).not.toContain(
          "validatePlatformCoreExecutionObservation(",
        );

        expect(
          source,
        ).not.toContain(
          "buildPlatformCoreExecutionStateAfterFromObservation(",
        );

        expect(
          source,
        ).not.toContain(
          "buildPlatformCoreCanonicalExecutionExecutingToTerminal(",
        );

        expect(
          source,
        ).not.toContain(
          "consumePlatformCoreAuthorization",
        );
      },
    );
  },
);
