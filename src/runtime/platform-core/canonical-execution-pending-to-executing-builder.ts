import {
  computePlatformCorePayloadSha256,
  PlatformCoreCanonicalPayloadHashError,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
  type PlatformCoreStaticValidationIssue,
} from "./canonical-schema-validator";

import type {
  PlatformCoreCanonicalExecutionGenesis,
} from "./canonical-execution-genesis-builder";

import type {
  PlatformCoreAuthorizationConsumptionEvidence,
} from "./authorization-consumption-repository";

export const PLATFORM_CORE_CANONICAL_EXECUTION_PENDING_TO_EXECUTING_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-EXECUTION-PENDING-TO-EXECUTING-BUILDER-v1" as const;

export type PlatformCoreCanonicalExecutionPendingToExecutingBuilderErrorCode =
  | "INVALID_INPUT"
  | "PREDECESSOR_SCHEMA_INVALID"
  | "PREDECESSOR_HASH_INVALID"
  | "PREDECESSOR_NOT_PENDING_GENESIS"
  | "CONSUMPTION_EVIDENCE_INVALID"
  | "CONSUMPTION_BINDING_MISMATCH"
  | "TEMPORAL_ORDER_INVALID"
  | "HASH_COMPUTATION_FAILED"
  | "SUCCESSOR_SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalExecutionPendingToExecutingBuilderError
  extends Error {
  readonly code:
    PlatformCoreCanonicalExecutionPendingToExecutingBuilderErrorCode;

  readonly validationIssues:
    readonly PlatformCoreStaticValidationIssue[];

  constructor(
    code:
      PlatformCoreCanonicalExecutionPendingToExecutingBuilderErrorCode,
    message: string,
    validationIssues:
      readonly PlatformCoreStaticValidationIssue[] = [],
  ) {
    super(message);

    this.name =
      "PlatformCoreCanonicalExecutionPendingToExecutingBuilderError";

    this.code =
      code;

    this.validationIssues =
      Object.freeze([
        ...validationIssues,
      ]);
  }
}

export interface PlatformCoreExecutionPendingToExecutingGenealogyInput {
  readonly cause: string;

  readonly evidence_reference:
    string | null;

  readonly timestamp: string;
}

export interface PlatformCoreExecutionPendingToExecutingInput {
  readonly started_at: string;

  readonly evidence_reference: string;

  readonly genealogy:
    PlatformCoreExecutionPendingToExecutingGenealogyInput;
}

export type PlatformCoreCanonicalExecutionExecutingV2 =
  Readonly<
    Omit<
      PlatformCoreCanonicalExecutionGenesis,
      | "execution_version"
      | "authorization_consumption"
      | "state"
      | "started_at"
      | "completed_at"
      | "evidence_state"
      | "evidence_reference"
      | "genealogy"
      | "payload_sha256"
    >
    & {
      readonly execution_version: 2;

      readonly authorization_consumption:
        Readonly<{
          readonly state:
            "CONSUMED";

          readonly replay_key_sha256:
            string;

          readonly usage_counter_ref:
            string;

          readonly consumption_event_ref:
            string;

          readonly consumption_index:
            number;

          readonly consumed_at:
            string;

          readonly atomic:
            true;
        }>;

      readonly state:
        "EXECUTING";

      readonly started_at:
        string;

      readonly completed_at:
        null;

      readonly evidence_state:
        "PRESENT";

      readonly evidence_reference:
        string;

      readonly genealogy:
        Readonly<{
          readonly derived_from:
            string;

          readonly previous_state:
            "PENDING";

          readonly new_state:
            "EXECUTING";

          readonly cause:
            string;

          readonly evidence_reference:
            string | null;

          readonly timestamp:
            string;

          readonly hash:
            string;
        }>;

      readonly payload_sha256:
        string;
    }
  >;

const TRANSITION_FIELDS =
  new Set<string>([
    "started_at",
    "evidence_reference",
    "genealogy",
  ]);

const GENEALOGY_FIELDS =
  new Set<string>([
    "cause",
    "evidence_reference",
    "timestamp",
  ]);

const CONSUMPTION_EVIDENCE_FIELDS =
  new Set<string>([
    "consumptionEventRef",
    "executionId",
    "consumptionIndex",
    "authorizationRef",
    "authorizationVersion",
    "authorizationSha256",
    "replayKeySha256",
    "usageCounterRef",
    "actionSha256",
    "requestSha256",
    "iospaceRef",
    "consumedAt",
    "atomic",
    "idempotentReplay",
  ]);

function fail(
  code:
    PlatformCoreCanonicalExecutionPendingToExecutingBuilderErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreCanonicalExecutionPendingToExecutingBuilderError(
    code,
    message,
  );
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype
    || prototype === null
  );
}

function assertExactKeys(
  value:
    unknown,
  allowed:
    ReadonlySet<string>,
  path:
    string,
  code:
    PlatformCoreCanonicalExecutionPendingToExecutingBuilderErrorCode =
      "INVALID_INPUT",
): asserts value is Record<string, unknown> {
  if (
    !isPlainRecord(value)
  ) {
    fail(
      code,
      `${path} must be a plain object.`,
    );
  }

  for (
    const key
    of Object.keys(value)
  ) {
    if (
      !allowed.has(key)
    ) {
      fail(
        code,
        `${path}.${key} is not allowed.`,
      );
    }
  }
}

function isValidDateTime(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && value.includes("T")
    && Number.isFinite(
      Date.parse(value),
    )
  );
}

function assertTransitionInput(
  input:
    PlatformCoreExecutionPendingToExecutingInput,
): void {
  assertExactKeys(
    input,
    TRANSITION_FIELDS,
    "$.transitionInput",
  );

  assertExactKeys(
    input.genealogy,
    GENEALOGY_FIELDS,
    "$.transitionInput.genealogy",
  );

  if (
    !isValidDateTime(
      input.started_at,
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.started_at must be a valid date-time string.",
    );
  }

  if (
    typeof input.evidence_reference !== "string"
    || input.evidence_reference.length === 0
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.evidence_reference must be a non-empty string.",
    );
  }

  if (
    typeof input.genealogy.cause !== "string"
    || input.genealogy.cause.length === 0
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.genealogy.cause must be a non-empty string.",
    );
  }

  if (
    input.genealogy.evidence_reference !== null
    && (
      typeof input.genealogy.evidence_reference !== "string"
      || input.genealogy.evidence_reference.length === 0
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.genealogy.evidence_reference must be null or a non-empty string.",
    );
  }

  if (
    !isValidDateTime(
      input.genealogy.timestamp,
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.genealogy.timestamp must be a valid date-time string.",
    );
  }
}

function verifyPredecessor(
  predecessor:
    PlatformCoreCanonicalExecutionGenesis,
): string {
  if (
    !isPlainRecord(predecessor)
  ) {
    fail(
      "INVALID_INPUT",
      "Canonical EXECUTION predecessor must be a plain object.",
    );
  }

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      predecessor,
    );

  if (
    !validation.valid
  ) {
    throw new PlatformCoreCanonicalExecutionPendingToExecutingBuilderError(
      "PREDECESSOR_SCHEMA_INVALID",
      `Canonical EXECUTION predecessor schema validation failed: ${validation.code}.`,
      validation.issues,
    );
  }

  const {
    payload_sha256:
      predecessorPayloadSha256,
    ...predecessorPreimage
  } =
    predecessor;

  let recomputed:
    string;

  try {
    recomputed =
      computePlatformCorePayloadSha256(
        predecessorPreimage,
      );
  } catch (
    error
  ) {
    if (
      error instanceof
      PlatformCoreCanonicalPayloadHashError
    ) {
      fail(
        "PREDECESSOR_HASH_INVALID",
        `Canonical EXECUTION predecessor hash cannot be reproduced: ${error.code}.`,
      );
    }

    throw error;
  }

  if (
    recomputed
      !== predecessorPayloadSha256
  ) {
    fail(
      "PREDECESSOR_HASH_INVALID",
      "Canonical EXECUTION predecessor payload hash does not reproduce exactly.",
    );
  }

  if (
    predecessor.proto
      !== "HBCE-EXECUTION-v1"
    || predecessor.kind
      !== "HBCE_CORE_EXECUTION"
    || predecessor.version
      !== "v1"
    || predecessor.execution_version
      !== 1
    || predecessor.state
      !== "PENDING"
    || predecessor.started_at
      !== null
    || predecessor.completed_at
      !== null
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Canonical EXECUTION predecessor must be the PENDING version-1 genesis revision.",
    );
  }

  const consumption =
    predecessor
      .authorization_consumption;

  if (
    consumption.state
      !== "NOT_CONSUMED"
    || consumption.consumption_event_ref
      !== null
    || consumption.consumption_index
      !== null
    || consumption.consumed_at
      !== null
    || consumption.atomic
      !== true
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Canonical EXECUTION predecessor must represent an atomic NOT_CONSUMED PENDING state.",
    );
  }

  if (
    typeof consumption.usage_counter_ref
      !== "string"
    || consumption.usage_counter_ref.length
      === 0
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Executable canonical PENDING predecessor requires a non-null usage-counter reference.",
    );
  }

  const precheck =
    predecessor.precheck;

  if (
    precheck.authorization_state_observed
      !== "AUTHORIZED"
    || precheck.validity_state
      !== "VALID"
    || precheck.authority_usability_state
      !== "PASS"
    || precheck.dependency_binding_state
      !== "PASS"
    || precheck.iospace_binding_state
      !== "PASS"
    || precheck.enforcement_point_binding_state
      !== "PASS"
    || precheck.replay_state
      !== "AVAILABLE"
    || precheck.decision
      !== "ALLOW_EXECUTION"
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Canonical EXECUTION predecessor precheck is not executable.",
    );
  }

  if (
    typeof precheck.evidence_reference
      !== "string"
    || precheck.evidence_reference.length
      === 0
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Executable canonical PENDING predecessor requires precheck evidence.",
    );
  }

  if (
    predecessor.binding_check.action_match_state
      !== "MATCH"
    || predecessor.binding_check.request_match_state
      !== "MATCH"
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Canonical EXECUTION predecessor binding check must MATCH.",
    );
  }

  if (
    predecessor.state_before.observation_state
      !== "CAPTURED"
    || typeof predecessor.state_before.state_ref
      !== "string"
    || typeof predecessor.state_before.state_sha256
      !== "string"
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Executable canonical PENDING predecessor requires captured state_before evidence.",
    );
  }

  if (
    predecessor.genealogy.derived_from
      !== null
    || predecessor.genealogy.previous_state
      !== null
    || predecessor.genealogy.new_state
      !== "PENDING"
    || predecessor.genealogy.hash
      !== predecessor.authorization_sha256
  ) {
    fail(
      "PREDECESSOR_NOT_PENDING_GENESIS",
      "Canonical EXECUTION predecessor genealogy is not a valid PENDING genesis genealogy.",
    );
  }

  return (
    consumption
      .usage_counter_ref
  );
}

function assertConsumptionEvidence(
  predecessor:
    PlatformCoreCanonicalExecutionGenesis,
  evidence:
    PlatformCoreAuthorizationConsumptionEvidence,
  predecessorUsageCounterRef:
    string,
): number {
  assertExactKeys(
    evidence,
    CONSUMPTION_EVIDENCE_FIELDS,
    "$.consumptionEvidence",
    "CONSUMPTION_EVIDENCE_INVALID",
  );

  if (
    typeof evidence.consumptionEventRef !== "string"
    || evidence.consumptionEventRef.length === 0
    || !Number.isSafeInteger(
      evidence.consumptionIndex,
    )
    || evidence.consumptionIndex < 1
    || !isValidDateTime(
      evidence.consumedAt,
    )
    || evidence.atomic !== true
    || typeof evidence.idempotentReplay !== "boolean"
  ) {
    fail(
      "CONSUMPTION_EVIDENCE_INVALID",
      "Authorization consumption evidence is structurally invalid.",
    );
  }

  if (
    evidence.usageCounterRef === null
    || typeof evidence.usageCounterRef !== "string"
  ) {
    fail(
      "CONSUMPTION_EVIDENCE_INVALID",
      "Executable authorization consumption evidence requires a non-null usage-counter reference.",
    );
  }

  const expectedAuthorizationVersion =
    String(
      predecessor.authorization_version,
    );

  if (
    evidence.executionId
      !== predecessor.execution_id
    || evidence.authorizationRef
      !== predecessor.authorization_ref
    || evidence.authorizationVersion
      !== expectedAuthorizationVersion
    || evidence.authorizationSha256
      !== predecessor.authorization_sha256
    || evidence.replayKeySha256
      !== predecessor
        .authorization_consumption
        .replay_key_sha256
    || evidence.usageCounterRef
      !== predecessorUsageCounterRef
    || evidence.actionSha256
      !== predecessor
        .binding_check
        .execution_action_sha256
    || evidence.requestSha256
      !== predecessor
        .binding_check
        .execution_request_sha256
    || evidence.iospaceRef
      !== predecessor.iospace_ref
  ) {
    fail(
      "CONSUMPTION_BINDING_MISMATCH",
      "Authorization consumption evidence does not bind exactly to the canonical EXECUTION predecessor.",
    );
  }

  return (
    Date.parse(
      evidence.consumedAt,
    )
  );
}

function deepFreeze<T>(
  value:
    T,
): T {
  if (
    value !== null
    && typeof value === "object"
  ) {
    for (
      const nested
      of Object.values(
        value as Record<string, unknown>,
      )
    ) {
      deepFreeze(
        nested,
      );
    }

    Object.freeze(
      value,
    );
  }

  return value;
}

export function buildPlatformCoreCanonicalExecutionPendingToExecuting(
  predecessor:
    PlatformCoreCanonicalExecutionGenesis,
  consumptionEvidence:
    PlatformCoreAuthorizationConsumptionEvidence,
  transitionInput:
    PlatformCoreExecutionPendingToExecutingInput,
): PlatformCoreCanonicalExecutionExecutingV2 {
  assertTransitionInput(
    transitionInput,
  );

  const predecessorUsageCounterRef =
    verifyPredecessor(
      predecessor,
    );

  const consumedAtMillis =
    assertConsumptionEvidence(
      predecessor,
      consumptionEvidence,
      predecessorUsageCounterRef,
    );

  const startedAtMillis =
    Date.parse(
      transitionInput.started_at,
    );

  if (
    consumedAtMillis
      > startedAtMillis
  ) {
    fail(
      "TEMPORAL_ORDER_INVALID",
      "Authorization consumption must not occur after execution start.",
    );
  }

  const candidate = {
    proto:
      "HBCE-EXECUTION-v1" as const,

    kind:
      "HBCE_CORE_EXECUTION" as const,

    version:
      "v1" as const,

    execution_id:
      predecessor.execution_id,

    execution_version:
      2 as const,

    principal_ref:
      predecessor.principal_ref,

    actor_ref:
      predecessor.actor_ref,

    authorization_ref:
      predecessor.authorization_ref,

    authorization_version:
      predecessor.authorization_version,

    authorization_sha256:
      predecessor.authorization_sha256,

    iospace_ref:
      predecessor.iospace_ref,

    enforcement_point_ref:
      predecessor.enforcement_point_ref,

    execution_engine_ref:
      predecessor.execution_engine_ref,

    binding_check: {
      ...predecessor.binding_check,
    },

    precheck: {
      ...predecessor.precheck,
    },

    authorization_consumption: {
      state:
        "CONSUMED" as const,

      replay_key_sha256:
        predecessor
          .authorization_consumption
          .replay_key_sha256,

      usage_counter_ref:
        predecessorUsageCounterRef,

      consumption_event_ref:
        consumptionEvidence
          .consumptionEventRef,

      consumption_index:
        consumptionEvidence
          .consumptionIndex,

      consumed_at:
        consumptionEvidence
          .consumedAt,

      atomic:
        true as const,
    },

    state_before: {
      ...predecessor.state_before,
    },

    state_after: {
      ...predecessor.state_after,
    },

    state:
      "EXECUTING" as const,

    requested_at:
      predecessor.requested_at,

    started_at:
      transitionInput.started_at,

    completed_at:
      null,

    evidence_state:
      "PRESENT" as const,

    evidence_reference:
      transitionInput
        .evidence_reference,

    outcome_reference:
      predecessor.outcome_reference,

    consequence_reference:
      predecessor.consequence_reference,

    evt_reference:
      predecessor.evt_reference,

    opc_reference:
      predecessor.opc_reference,

    append_only:
      true as const,

    genealogy: {
      derived_from:
        predecessor.execution_id,

      previous_state:
        "PENDING" as const,

      new_state:
        "EXECUTING" as const,

      cause:
        transitionInput
          .genealogy
          .cause,

      evidence_reference:
        transitionInput
          .genealogy
          .evidence_reference,

      timestamp:
        transitionInput
          .genealogy
          .timestamp,

      hash:
        predecessor.payload_sha256,
    },

    boundary: {
      ...predecessor.boundary,
    },

    ...(
      Object.prototype.hasOwnProperty.call(
        predecessor,
        "note",
      )
        ? {
            note:
              predecessor.note,
          }
        : {}
    ),
  };

  let payloadSha256:
    string;

  try {
    payloadSha256 =
      computePlatformCorePayloadSha256(
        candidate,
      );
  } catch (
    error
  ) {
    if (
      error instanceof
      PlatformCoreCanonicalPayloadHashError
    ) {
      throw new PlatformCoreCanonicalExecutionPendingToExecutingBuilderError(
        "HASH_COMPUTATION_FAILED",
        `Canonical EXECUTING successor hash computation failed: ${error.code}.`,
      );
    }

    throw error;
  }

  const built = {
    ...candidate,

    payload_sha256:
      payloadSha256,
  } satisfies
    PlatformCoreCanonicalExecutionExecutingV2;

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      built,
    );

  if (
    !validation.valid
  ) {
    throw new PlatformCoreCanonicalExecutionPendingToExecutingBuilderError(
      "SUCCESSOR_SCHEMA_VALIDATION_FAILED",
      `Canonical EXECUTING successor schema validation failed: ${validation.code}.`,
      validation.issues,
    );
  }

  return deepFreeze(
    built,
  );
}
