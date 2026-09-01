import {
  describe,
  expect,
  it,
} from "vitest";

import {
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

import type {
  PlatformCoreCanonicalExecutionGenesis,
} from "./canonical-execution-genesis-builder";

import type {
  PlatformCoreAuthorizationConsumptionEvidence,
} from "./authorization-consumption-repository";

import {
  PLATFORM_CORE_CANONICAL_EXECUTION_PENDING_TO_EXECUTING_BUILDER_PROTOCOL,
  PlatformCoreCanonicalExecutionPendingToExecutingBuilderError,
  buildPlatformCoreCanonicalExecutionPendingToExecuting,
  type PlatformCoreExecutionPendingToExecutingInput,
} from "./canonical-execution-pending-to-executing-builder";

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

const BOUNDARY = {
  data_minimization: true,
  reference_over_raw_evidence: true,
  execution_requires_authorization: true,
  authorization_not_execution: true,
  authorized_not_executed: true,
  execution_not_success: true,
  execution_not_outcome: true,
  execution_not_consequence: true,
  exact_authorization_version_required: true,
  authorization_hash_binding_required: true,
  action_digest_match_required: true,
  request_digest_match_required: true,
  iospace_match_required: true,
  enforcement_point_match_required: true,
  precheck_allow_required_before_start: true,
  pending_not_consumed: true,
  authorization_consumption_required_before_start: true,
  atomic_consumption_required: true,
  state_before_required_before_start: true,
  state_after_required_after_terminal_execution: true,
  failed_or_aborted_state_after_may_be_unavailable: true,
  stale_or_revoked_authorization_blocks_start: true,
  unknown_blocks_start: true,
  blocked_not_executed: true,
  cross_object_binding_runtime_validation_required: true,
  temporal_order_runtime_validation_required: true,
  atomic_consumption_runtime_enforcement_required: true,
  append_only_genealogy: true,
  no_automatic_success_claim: true,
  no_regulated_certification_claim: true,
  no_public_authority_claim: true,
  fail_closed: true,
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

function makePredecessor(
  noteMode:
    "absent"
    | "null"
    | "value" =
      "value",
): PlatformCoreCanonicalExecutionGenesis {
  const candidate = {
    proto:
      "HBCE-EXECUTION-v1" as const,

    kind:
      "HBCE_CORE_EXECUTION" as const,

    version:
      "v1" as const,

    execution_id:
      "EXE-TEST:EXECUTING-V2",

    execution_version:
      1 as const,

    principal_ref:
      "PRINCIPAL:TEST",

    actor_ref:
      "ACTOR:TEST",

    authorization_ref:
      "AZN-TEST:EXECUTION",

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

    ...(
      noteMode === "absent"
        ? {}
        : {
            note:
              noteMode === "null"
                ? null
                : "successor-builder-test",
          }
    ),
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
      "CONSUMPTION:EVENT:0001",

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

function expectBuilderFailure(
  operation:
    () => unknown,
  code:
    string,
): void {
  try {
    operation();

    throw new Error(
      "Expected builder failure.",
    );
  } catch (
    error
  ) {
    expect(
      error,
    ).toBeInstanceOf(
      PlatformCoreCanonicalExecutionPendingToExecutingBuilderError,
    );

    expect(
      (
        error as
          PlatformCoreCanonicalExecutionPendingToExecutingBuilderError
      ).code,
    ).toBe(
      code,
    );
  }
}

function rehash(
  raw:
    Record<string, unknown>,
): PlatformCoreCanonicalExecutionGenesis {
  const {
    payload_sha256:
      _discarded,
    ...preimage
  } =
    raw;

  return {
    ...preimage,

    payload_sha256:
      computePlatformCorePayloadSha256(
        preimage,
      ),
  } as unknown as
    PlatformCoreCanonicalExecutionGenesis;
}

describe(
  "Platform Core canonical PENDING-to-EXECUTING successor builder",
  () => {
    it(
      "locks the protocol identity",
      () => {
        expect(
          PLATFORM_CORE_CANONICAL_EXECUTION_PENDING_TO_EXECUTING_BUILDER_PROTOCOL,
        ).toBe(
          "HBCE-PLATFORM-CORE-CANONICAL-EXECUTION-PENDING-TO-EXECUTING-BUILDER-v1",
        );
      },
    );

    it(
      "builds EXECUTING version 2",
      () => {
        const predecessor =
          makePredecessor();

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        expect(
          successor.execution_id,
        ).toBe(
          predecessor.execution_id,
        );

        expect(
          successor.execution_version,
        ).toBe(
          2,
        );

        expect(
          successor.state,
        ).toBe(
          "EXECUTING",
        );

        expect(
          successor.authorization_consumption.state,
        ).toBe(
          "CONSUMED",
        );
      },
    );

    it(
      "produces schema-valid canonical EXECUTION",
      () => {
        const predecessor =
          makePredecessor();

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        expect(
          validatePlatformCoreCanonicalSchema(
            "EXECUTION",
            successor,
          ).valid,
        ).toBe(
          true,
        );
      },
    );

    it(
      "computes exact payload hash",
      () => {
        const predecessor =
          makePredecessor();

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        const {
          payload_sha256,
          ...preimage
        } =
          successor;

        expect(
          computePlatformCorePayloadSha256(
            preimage,
          ),
        ).toBe(
          payload_sha256,
        );
      },
    );

    it(
      "binds atomic consumption evidence",
      () => {
        const predecessor =
          makePredecessor();

        const evidence =
          makeConsumptionEvidence(
            predecessor,
          );

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            evidence,
            makeTransitionInput(),
          );

        expect(
          successor.authorization_consumption,
        ).toEqual({
          state:
            "CONSUMED",

          replay_key_sha256:
            REPLAY_SHA,

          usage_counter_ref:
            "COUNTER:TEST",

          consumption_event_ref:
            evidence.consumptionEventRef,

          consumption_index:
            1,

          consumed_at:
            evidence.consumedAt,

          atomic:
            true,
        });
      },
    );

    it(
      "anchors genealogy to predecessor payload hash",
      () => {
        const predecessor =
          makePredecessor();

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        expect(
          successor.genealogy.derived_from,
        ).toBe(
          predecessor.execution_id,
        );

        expect(
          successor.genealogy.previous_state,
        ).toBe(
          "PENDING",
        );

        expect(
          successor.genealogy.new_state,
        ).toBe(
          "EXECUTING",
        );

        expect(
          successor.genealogy.hash,
        ).toBe(
          predecessor.payload_sha256,
        );
      },
    );

    it.each([
      "absent",
      "null",
      "value",
    ] as const)(
      "preserves optional note semantics: %s",
      (
        mode,
      ) => {
        const predecessor =
          makePredecessor(
            mode,
          );

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        expect(
          Object.prototype.hasOwnProperty.call(
            successor,
            "note",
          ),
        ).toBe(
          Object.prototype.hasOwnProperty.call(
            predecessor,
            "note",
          ),
        );

        if (
          Object.prototype.hasOwnProperty.call(
            predecessor,
            "note",
          )
        ) {
          expect(
            successor.note,
          ).toBe(
            predecessor.note,
          );
        }
      },
    );

    it(
      "returns deeply frozen successor",
      () => {
        const predecessor =
          makePredecessor();

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            makeTransitionInput(),
          );

        expect(
          Object.isFrozen(
            successor,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            successor.authorization_consumption,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            successor.genealogy,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not mutate source objects",
      () => {
        const predecessor =
          makePredecessor();

        const evidence =
          makeConsumptionEvidence(
            predecessor,
          );

        const transition =
          makeTransitionInput();

        const predecessorBefore =
          structuredClone(
            predecessor,
          );

        const evidenceBefore =
          structuredClone(
            evidence,
          );

        const transitionBefore =
          structuredClone(
            transition,
          );

        buildPlatformCoreCanonicalExecutionPendingToExecuting(
          predecessor,
          evidence,
          transition,
        );

        expect(
          predecessor,
        ).toEqual(
          predecessorBefore,
        );

        expect(
          evidence,
        ).toEqual(
          evidenceBefore,
        );

        expect(
          transition,
        ).toEqual(
          transitionBefore,
        );
      },
    );

    it(
      "treats idempotent replay evidence identically",
      () => {
        const predecessor =
          makePredecessor();

        const evidence =
          makeConsumptionEvidence(
            predecessor,
          );

        const replayEvidence = {
          ...evidence,
          idempotentReplay:
            true,
        };

        const transition =
          makeTransitionInput();

        const first =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            evidence,
            transition,
          );

        const replay =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            replayEvidence,
            transition,
          );

        expect(
          replay,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "fails closed for predecessor schema invalidity",
      () => {
        const predecessor =
          structuredClone(
            makePredecessor(),
          ) as unknown as
            Record<string, unknown>;

        predecessor.principal_ref =
          "x";

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor as unknown as
                PlatformCoreCanonicalExecutionGenesis,
              makeConsumptionEvidence(
                makePredecessor(),
              ),
              makeTransitionInput(),
            ),
          "PREDECESSOR_SCHEMA_INVALID",
        );
      },
    );

    it(
      "fails closed for predecessor hash mismatch",
      () => {
        const predecessor = {
          ...makePredecessor(),

          payload_sha256:
            "f".repeat(
              64,
            ),
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              makeTransitionInput(),
            ),
          "PREDECESSOR_HASH_INVALID",
        );
      },
    );

    it(
      "fails closed for non-genesis predecessor",
      () => {
        const raw =
          structuredClone(
            makePredecessor(),
          ) as unknown as
            Record<string, unknown>;

        raw.execution_version =
          2;

        const predecessor =
          rehash(
            raw,
          );

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              makeTransitionInput(),
            ),
          "PREDECESSOR_NOT_PENDING_GENESIS",
        );
      },
    );

    it(
      "fails closed for invalid genesis genealogy",
      () => {
        const raw =
          structuredClone(
            makePredecessor(),
          ) as unknown as
            Record<string, unknown>;

        (
          raw.genealogy as
            Record<string, unknown>
        ).hash =
          "f".repeat(
            64,
          );

        const predecessor =
          rehash(
            raw,
          );

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              makeTransitionInput(),
            ),
          "PREDECESSOR_NOT_PENDING_GENESIS",
        );
      },
    );

    it.each([
      [
        "executionId",
        "EXE-OTHER:EXECUTION",
      ],
      [
        "authorizationRef",
        "AZN-OTHER:EXECUTION",
      ],
      [
        "authorizationVersion",
        "2",
      ],
      [
        "authorizationSha256",
        "f".repeat(64),
      ],
      [
        "replayKeySha256",
        "f".repeat(64),
      ],
      [
        "usageCounterRef",
        "COUNTER:OTHER",
      ],
      [
        "actionSha256",
        "f".repeat(64),
      ],
      [
        "requestSha256",
        "f".repeat(64),
      ],
      [
        "iospaceRef",
        "IOSPACE:OTHER",
      ],
    ] as const)(
      "fails closed for consumption binding mismatch %s",
      (
        field,
        value,
      ) => {
        const predecessor =
          makePredecessor();

        const evidence = {
          ...makeConsumptionEvidence(
            predecessor,
          ),

          [field]:
            value,
        } as
          PlatformCoreAuthorizationConsumptionEvidence;

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              evidence,
              makeTransitionInput(),
            ),
          "CONSUMPTION_BINDING_MISMATCH",
        );
      },
    );

    it.each([
      [
        "consumptionIndex",
        0,
      ],
      [
        "consumedAt",
        "not-a-date",
      ],
      [
        "atomic",
        false,
      ],
      [
        "idempotentReplay",
        "invalid",
      ],
      [
        "usageCounterRef",
        null,
      ],
    ] as const)(
      "fails closed for invalid consumption evidence %s",
      (
        field,
        value,
      ) => {
        const predecessor =
          makePredecessor();

        const evidence = {
          ...makeConsumptionEvidence(
            predecessor,
          ),

          [field]:
            value,
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              evidence as unknown as
                PlatformCoreAuthorizationConsumptionEvidence,
              makeTransitionInput(),
            ),
          "CONSUMPTION_EVIDENCE_INVALID",
        );
      },
    );

    it(
      "fails closed when consumed_at is after started_at",
      () => {
        const predecessor =
          makePredecessor();

        const evidence = {
          ...makeConsumptionEvidence(
            predecessor,
          ),

          consumedAt:
            "2026-09-01T18:03:00.000Z",
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              evidence,
              makeTransitionInput(),
            ),
          "TEMPORAL_ORDER_INVALID",
        );
      },
    );

    it(
      "allows consumed_at equal to started_at",
      () => {
        const predecessor =
          makePredecessor();

        const evidence =
          makeConsumptionEvidence(
            predecessor,
          );

        const transition = {
          ...makeTransitionInput(),

          started_at:
            evidence.consumedAt,
        };

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            evidence,
            transition,
          );

        expect(
          successor.started_at,
        ).toBe(
          evidence.consumedAt,
        );
      },
    );

    it(
      "does not invent genealogy timestamp ordering",
      () => {
        const predecessor =
          makePredecessor();

        const transition = {
          ...makeTransitionInput(),

          genealogy: {
            ...makeTransitionInput()
              .genealogy,

            timestamp:
              "2026-09-01T17:00:00.000Z",
          },
        };

        const successor =
          buildPlatformCoreCanonicalExecutionPendingToExecuting(
            predecessor,
            makeConsumptionEvidence(
              predecessor,
            ),
            transition,
          );

        expect(
          successor.genealogy.timestamp,
        ).toBe(
          "2026-09-01T17:00:00.000Z",
        );
      },
    );

    it(
      "fails closed for invalid transition timestamp",
      () => {
        const predecessor =
          makePredecessor();

        const transition = {
          ...makeTransitionInput(),

          started_at:
            "invalid-date",
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              transition,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "fails closed for caller-controlled reserved transition field",
      () => {
        const predecessor =
          makePredecessor();

        const transition = {
          ...makeTransitionInput(),

          execution_id:
            "EXE-FORBIDDEN",
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              transition as unknown as
                PlatformCoreExecutionPendingToExecutingInput,
            ),
          "INVALID_INPUT",
        );
      },
    );

    it(
      "fails closed for caller-controlled genealogy hash",
      () => {
        const predecessor =
          makePredecessor();

        const transition = {
          ...makeTransitionInput(),

          genealogy: {
            ...makeTransitionInput()
              .genealogy,

            hash:
              "f".repeat(64),
          },
        };

        expectBuilderFailure(
          () =>
            buildPlatformCoreCanonicalExecutionPendingToExecuting(
              predecessor,
              makeConsumptionEvidence(
                predecessor,
              ),
              transition as unknown as
                PlatformCoreExecutionPendingToExecutingInput,
            ),
          "INVALID_INPUT",
        );
      },
    );
  },
);
