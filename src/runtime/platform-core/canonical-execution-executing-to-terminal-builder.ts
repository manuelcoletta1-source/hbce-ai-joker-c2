import {
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

import type {
  PlatformCoreCanonicalExecutionExecutingV2,
} from "./canonical-execution-pending-to-executing-builder";

export const PLATFORM_CORE_CANONICAL_EXECUTION_EXECUTING_TO_TERMINAL_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-EXECUTION-EXECUTING-TO-TERMINAL-BUILDER-v1" as const;

export type PlatformCoreExecutionTerminalState =
  | "EXECUTED"
  | "FAILED"
  | "ABORTED";

export type PlatformCoreExecutionStateObservationState =
  | "CAPTURED"
  | "NOT_AVAILABLE"
  | "UNKNOWN";

export interface PlatformCoreExecutionTerminalStateAfterInput {
  readonly observation_state:
    PlatformCoreExecutionStateObservationState;

  readonly state_ref:
    string | null;

  readonly state_sha256:
    string | null;
}

export interface PlatformCoreExecutionTerminalGenealogyInput {
  readonly cause:
    string;

  readonly evidence_reference:
    string | null;

  readonly timestamp:
    string;
}

export interface PlatformCoreExecutionExecutingToTerminalInput {
  readonly target_state:
    PlatformCoreExecutionTerminalState;

  readonly completed_at:
    string;

  readonly evidence_reference:
    string;

  readonly state_after:
    PlatformCoreExecutionTerminalStateAfterInput;

  readonly genealogy:
    PlatformCoreExecutionTerminalGenealogyInput;
}

export type PlatformCoreCanonicalExecutionTerminalV3 =
  Readonly<
    Omit<
      PlatformCoreCanonicalExecutionExecutingV2,
      | "execution_version"
      | "state_after"
      | "state"
      | "completed_at"
      | "evidence_state"
      | "evidence_reference"
      | "genealogy"
      | "payload_sha256"
    >
    & {
      readonly execution_version:
        3;

      readonly state_after:
        Readonly<{
          readonly observation_state:
            PlatformCoreExecutionStateObservationState;

          readonly state_ref:
            string | null;

          readonly state_sha256:
            string | null;
        }>;

      readonly state:
        PlatformCoreExecutionTerminalState;

      readonly completed_at:
        string;

      readonly evidence_state:
        "PRESENT";

      readonly evidence_reference:
        string;

      readonly genealogy:
        Readonly<{
          readonly derived_from:
            string;

          readonly previous_state:
            "EXECUTING";

          readonly new_state:
            PlatformCoreExecutionTerminalState;

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

export type PlatformCoreCanonicalExecutionExecutingToTerminalBuilderErrorCode =
  | "INVALID_INPUT"
  | "PREDECESSOR_SCHEMA_INVALID"
  | "PREDECESSOR_HASH_INVALID"
  | "PREDECESSOR_NOT_EXECUTING_V2"
  | "INVALID_TERMINAL_STATE"
  | "HASH_COMPUTATION_FAILED"
  | "SUCCESSOR_SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError
  extends Error {
  readonly code:
    PlatformCoreCanonicalExecutionExecutingToTerminalBuilderErrorCode;

  readonly issues:
    readonly unknown[];

  constructor(
    code:
      PlatformCoreCanonicalExecutionExecutingToTerminalBuilderErrorCode,
    message:
      string,
    issues:
      readonly unknown[] = [],
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError";

    this.code =
      code;

    this.issues =
      issues;
  }
}

const TRANSITION_FIELDS =
  new Set<string>([
    "target_state",
    "completed_at",
    "evidence_reference",
    "state_after",
    "genealogy",
  ]);

const STATE_AFTER_FIELDS =
  new Set<string>([
    "observation_state",
    "state_ref",
    "state_sha256",
  ]);

const GENEALOGY_FIELDS =
  new Set<string>([
    "cause",
    "evidence_reference",
    "timestamp",
  ]);

const TERMINAL_STATES =
  new Set<PlatformCoreExecutionTerminalState>([
    "EXECUTED",
    "FAILED",
    "ABORTED",
  ]);

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

function fail(
  code:
    PlatformCoreCanonicalExecutionExecutingToTerminalBuilderErrorCode,
  message:
    string,
  issues:
    readonly unknown[] = [],
): never {
  throw new PlatformCoreCanonicalExecutionExecutingToTerminalBuilderError(
    code,
    message,
    issues,
  );
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function assertExactKeys(
  value:
    unknown,
  expected:
    ReadonlySet<string>,
  path:
    string,
): asserts value is Record<string, unknown> {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    fail(
      "INVALID_INPUT",
      `${path} must be a plain object.`,
    );
  }

  const keys =
    Object.keys(
      value,
    );

  if (
    keys.length !==
      expected.size
    || keys.some(
      (key) =>
        !expected.has(
          key,
        ),
    )
  ) {
    fail(
      "INVALID_INPUT",
      `${path} contains missing or unknown fields.`,
    );
  }
}

function isValidDateTime(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && Number.isFinite(
      Date.parse(
        value,
      ),
    )
  );
}

function cloneJson<T>(
  value:
    T,
): T {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      (entry) =>
        cloneJson(
          entry,
        ),
    ) as T;
  }

  if (
    isPlainRecord(
      value,
    )
  ) {
    const output:
      Record<string, unknown> =
      {};

    for (
      const [
        key,
        entry,
      ]
      of Object.entries(
        value,
      )
    ) {
      output[key] =
        cloneJson(
          entry,
        );
    }

    return output as T;
  }

  return value;
}

function deepFreeze<T>(
  value:
    T,
): T {
  if (
    value !== null
    && typeof value === "object"
    && !Object.isFrozen(
      value,
    )
  ) {
    for (
      const entry
      of Object.values(
        value as Record<string, unknown>,
      )
    ) {
      deepFreeze(
        entry,
      );
    }

    Object.freeze(
      value,
    );
  }

  return value;
}

function assertStateAfterInput(
  value:
    PlatformCoreExecutionTerminalStateAfterInput,
): void {
  assertExactKeys(
    value,
    STATE_AFTER_FIELDS,
    "$.transitionInput.state_after",
  );

  if (
    value.observation_state !==
      "CAPTURED"
    && value.observation_state !==
      "NOT_AVAILABLE"
    && value.observation_state !==
      "UNKNOWN"
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.state_after.observation_state is invalid.",
    );
  }

  if (
    value.state_ref !== null
    && (
      typeof value.state_ref
        !== "string"
      || value.state_ref.length
        === 0
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.state_after.state_ref must be null or a non-empty string.",
    );
  }

  if (
    value.state_sha256 !== null
    && (
      typeof value.state_sha256
        !== "string"
      || !SHA256_PATTERN.test(
        value.state_sha256,
      )
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.state_after.state_sha256 must be null or a lowercase SHA-256 digest.",
    );
  }
}

function assertTransitionInput(
  input:
    PlatformCoreExecutionExecutingToTerminalInput,
): void {
  assertExactKeys(
    input,
    TRANSITION_FIELDS,
    "$.transitionInput",
  );

  if (
    !TERMINAL_STATES.has(
      input.target_state,
    )
  ) {
    fail(
      "INVALID_TERMINAL_STATE",
      "transitionInput.target_state must be EXECUTED, FAILED or ABORTED.",
    );
  }

  if (
    !isValidDateTime(
      input.completed_at,
    )
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.completed_at must be a valid date-time string.",
    );
  }

  if (
    typeof input.evidence_reference
      !== "string"
    || input.evidence_reference.length
      === 0
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.evidence_reference must be a non-empty string.",
    );
  }

  assertStateAfterInput(
    input.state_after,
  );

  assertExactKeys(
    input.genealogy,
    GENEALOGY_FIELDS,
    "$.transitionInput.genealogy",
  );

  if (
    typeof input.genealogy.cause
      !== "string"
    || input.genealogy.cause.length
      === 0
  ) {
    fail(
      "INVALID_INPUT",
      "transitionInput.genealogy.cause must be a non-empty string.",
    );
  }

  if (
    input.genealogy.evidence_reference
      !== null
    && (
      typeof input.genealogy.evidence_reference
        !== "string"
      || input.genealogy.evidence_reference.length
        === 0
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
    PlatformCoreCanonicalExecutionExecutingV2,
): void {
  if (
    !isPlainRecord(
      predecessor,
    )
  ) {
    fail(
      "PREDECESSOR_SCHEMA_INVALID",
      "Canonical EXECUTION predecessor must be an object.",
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
    fail(
      "PREDECESSOR_SCHEMA_INVALID",
      "Canonical EXECUTION predecessor failed static schema validation.",
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
    fail(
      "PREDECESSOR_HASH_INVALID",
      "Canonical EXECUTION predecessor payload hash could not be recomputed.",
      [
        error,
      ],
    );
  }

  if (
    recomputed !==
      predecessorPayloadSha256
  ) {
    fail(
      "PREDECESSOR_HASH_INVALID",
      "Canonical EXECUTION predecessor payload hash does not match its canonical preimage.",
    );
  }

  if (
    predecessor.execution_version
      !== 2
    || predecessor.state
      !== "EXECUTING"
    || typeof predecessor.started_at
      !== "string"
    || !isValidDateTime(
      predecessor.started_at,
    )
    || predecessor.completed_at
      !== null
    || predecessor.evidence_state
      !== "PRESENT"
    || typeof predecessor.evidence_reference
      !== "string"
    || predecessor.evidence_reference.length
      === 0
  ) {
    fail(
      "PREDECESSOR_NOT_EXECUTING_V2",
      "Canonical EXECUTION predecessor must be an EXECUTING version-2 revision.",
    );
  }

  const consumption =
    predecessor
      .authorization_consumption;

  if (
    consumption.state
      !== "CONSUMED"
    || consumption.atomic
      !== true
    || typeof consumption.usage_counter_ref
      !== "string"
    || consumption.usage_counter_ref.length
      === 0
    || typeof consumption.consumption_event_ref
      !== "string"
    || consumption.consumption_event_ref.length
      === 0
    || !Number.isSafeInteger(
      consumption.consumption_index,
    )
    || consumption.consumption_index
      < 1
    || typeof consumption.consumed_at
      !== "string"
    || !isValidDateTime(
      consumption.consumed_at,
    )
  ) {
    fail(
      "PREDECESSOR_NOT_EXECUTING_V2",
      "Canonical EXECUTION predecessor does not carry valid committed authorization-consumption evidence.",
    );
  }

  if (
    predecessor.genealogy.derived_from
      !== predecessor.execution_id
    || predecessor.genealogy.previous_state
      !== "PENDING"
    || predecessor.genealogy.new_state
      !== "EXECUTING"
  ) {
    fail(
      "PREDECESSOR_NOT_EXECUTING_V2",
      "Canonical EXECUTION predecessor genealogy is not an EXECUTING version-2 successor genealogy.",
    );
  }
}

export function buildPlatformCoreCanonicalExecutionExecutingToTerminal(
  predecessor:
    PlatformCoreCanonicalExecutionExecutingV2,
  transitionInput:
    PlatformCoreExecutionExecutingToTerminalInput,
): PlatformCoreCanonicalExecutionTerminalV3 {
  assertTransitionInput(
    transitionInput,
  );

  verifyPredecessor(
    predecessor,
  );

  const clonedPredecessor =
    cloneJson(
      predecessor,
    );

  const {
    payload_sha256:
      _predecessorPayloadSha256,
    ...base
  } =
    clonedPredecessor;

  void _predecessorPayloadSha256;

  const candidate = {
    ...base,

    execution_version:
      3 as const,

    state_after:
      cloneJson(
        transitionInput.state_after,
      ),

    state:
      transitionInput.target_state,

    completed_at:
      transitionInput.completed_at,

    evidence_state:
      "PRESENT" as const,

    evidence_reference:
      transitionInput.evidence_reference,

    genealogy: {
      derived_from:
        predecessor.execution_id,

      previous_state:
        "EXECUTING" as const,

      new_state:
        transitionInput.target_state,

      cause:
        transitionInput.genealogy.cause,

      evidence_reference:
        transitionInput.genealogy.evidence_reference,

      timestamp:
        transitionInput.genealogy.timestamp,

      hash:
        predecessor.payload_sha256,
    },
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
    fail(
      "HASH_COMPUTATION_FAILED",
      "Canonical terminal EXECUTION payload hash computation failed.",
      [
        error,
      ],
    );
  }

  const built = {
    ...candidate,

    payload_sha256:
      payloadSha256,
  } as unknown as
    PlatformCoreCanonicalExecutionTerminalV3;

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      built,
    );

  if (
    !validation.valid
  ) {
    fail(
      "SUCCESSOR_SCHEMA_VALIDATION_FAILED",
      "Canonical terminal EXECUTION successor failed static schema validation.",
      validation.issues,
    );
  }

  return deepFreeze(
    built,
  );
}
