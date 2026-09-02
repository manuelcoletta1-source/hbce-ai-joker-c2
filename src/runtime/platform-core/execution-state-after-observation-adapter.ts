import type {
  PlatformCoreExecutionTerminalState,
  PlatformCoreExecutionTerminalStateAfterInput,
} from "./canonical-execution-executing-to-terminal-builder";

export const PLATFORM_CORE_EXECUTION_STATE_AFTER_OBSERVATION_ADAPTER_PROTOCOL =
  "HBCE-PLATFORM-CORE-EXECUTION-STATE-AFTER-OBSERVATION-ADAPTER-v1" as const;

export type PlatformCoreExecutionStateAfterObservationState =
  | "CAPTURED"
  | "NOT_AVAILABLE"
  | "UNKNOWN";

export type PlatformCoreExecutionStateAfterObservationSource =
  Readonly<{
    terminalStateObserved:
      PlatformCoreExecutionTerminalState;

    observationState:
      PlatformCoreExecutionStateAfterObservationState;

    stateRef:
      string | null;

    stateSha256:
      string | null;
  }>;

export type PlatformCoreExecutionObservedTerminalStateAfter =
  Readonly<{
    target_state:
      PlatformCoreExecutionTerminalState;

    state_after:
      Readonly<
        PlatformCoreExecutionTerminalStateAfterInput
      >;
  }>;

export type PlatformCoreExecutionStateAfterObservationAdapterErrorCode =
  | "INVALID_SOURCE"
  | "INVALID_TERMINAL_STATE"
  | "INVALID_OBSERVATION_STATE"
  | "INVALID_STATE_REFERENCE"
  | "INVALID_STATE_SHA256"
  | "STATE_AFTER_INCONSISTENT";

export class PlatformCoreExecutionStateAfterObservationAdapterError
  extends Error {
  readonly code:
    PlatformCoreExecutionStateAfterObservationAdapterErrorCode;

  constructor(
    code:
      PlatformCoreExecutionStateAfterObservationAdapterErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreExecutionStateAfterObservationAdapterError";

    this.code =
      code;
  }
}

const SOURCE_FIELDS =
  new Set<string>([
    "terminalStateObserved",
    "observationState",
    "stateRef",
    "stateSha256",
  ]);

const STATE_REFERENCE_PATTERN =
  /^[A-Z0-9_:\-.]+$/;

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

function failClosed(
  code:
    PlatformCoreExecutionStateAfterObservationAdapterErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreExecutionStateAfterObservationAdapterError(
    code,
    message,
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

function assertExactSourceShape(
  value:
    unknown,
): asserts value is PlatformCoreExecutionStateAfterObservationSource {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    failClosed(
      "INVALID_SOURCE",
      "state-after observation source must be a plain object.",
    );
  }

  const keys =
    Object.keys(
      value,
    );

  if (
    keys.length !==
      SOURCE_FIELDS.size
    || keys.some(
      (key) =>
        !SOURCE_FIELDS.has(
          key,
        ),
    )
  ) {
    failClosed(
      "INVALID_SOURCE",
      "state-after observation source contains missing or unknown fields.",
    );
  }
}

function assertTerminalState(
  value:
    unknown,
): asserts value is PlatformCoreExecutionTerminalState {
  if (
    value !== "EXECUTED"
    && value !== "FAILED"
    && value !== "ABORTED"
  ) {
    failClosed(
      "INVALID_TERMINAL_STATE",
      "terminalStateObserved must be EXECUTED, FAILED or ABORTED.",
    );
  }
}

function assertObservationState(
  value:
    unknown,
): asserts value is PlatformCoreExecutionStateAfterObservationState {
  if (
    value !== "CAPTURED"
    && value !== "NOT_AVAILABLE"
    && value !== "UNKNOWN"
  ) {
    failClosed(
      "INVALID_OBSERVATION_STATE",
      "observationState must be CAPTURED, NOT_AVAILABLE or UNKNOWN.",
    );
  }
}

function assertStateReference(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string"
    || value.length < 3
    || value.length > 160
    || !STATE_REFERENCE_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "INVALID_STATE_REFERENCE",
      "CAPTURED stateRef must be a valid canonical reference.",
    );
  }
}

function assertStateSha256(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string"
    || !SHA256_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "INVALID_STATE_SHA256",
      "CAPTURED stateSha256 must be a lowercase SHA-256 digest.",
    );
  }
}

/**
 * Pure adapter from an already-produced execution-state observation
 * into the exact canonical state_after structure consumed by the
 * Platform Core terminal-execution pipeline.
 *
 * This adapter:
 *
 * - performs no execution;
 * - performs no persistence;
 * - performs no authorization consumption;
 * - creates no evidence;
 * - creates no OUTCOME;
 * - performs no MATRIX transition;
 * - does not infer state from execution success;
 * - does not compute stateSha256 from raw state.
 *
 * The upstream execution-observation boundary remains responsible for
 * producing the canonical state reference and the digest commitment to
 * the actually observed post-execution state.
 */
export function buildPlatformCoreExecutionStateAfterFromObservation(
  source:
    PlatformCoreExecutionStateAfterObservationSource,
): PlatformCoreExecutionObservedTerminalStateAfter {
  assertExactSourceShape(
    source,
  );

  assertTerminalState(
    source.terminalStateObserved,
  );

  assertObservationState(
    source.observationState,
  );

  if (
    source.observationState ===
      "CAPTURED"
  ) {
    assertStateReference(
      source.stateRef,
    );

    assertStateSha256(
      source.stateSha256,
    );
  } else if (
    source.stateRef !== null
    || source.stateSha256 !== null
  ) {
    failClosed(
      "STATE_AFTER_INCONSISTENT",
      "NOT_AVAILABLE or UNKNOWN requires null stateRef and stateSha256.",
    );
  }

  if (
    source.terminalStateObserved ===
      "EXECUTED"
    && source.observationState !==
      "CAPTURED"
  ) {
    failClosed(
      "STATE_AFTER_INCONSISTENT",
      "EXECUTED requires a CAPTURED post-execution state observation.",
    );
  }

  const stateAfter:
    Readonly<
      PlatformCoreExecutionTerminalStateAfterInput
    > =
    Object.freeze({
      observation_state:
        source.observationState,

      state_ref:
        source.stateRef,

      state_sha256:
        source.stateSha256,
    });

  return Object.freeze({
    target_state:
      source.terminalStateObserved,

    state_after:
      stateAfter,
  });
}
