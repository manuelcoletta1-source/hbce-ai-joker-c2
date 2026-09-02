import type {
  PlatformCoreCanonicalExecutionExecutingV2,
} from "./canonical-execution-pending-to-executing-builder";

import type {
  PlatformCoreExecutionStateAfterObservationSource,
} from "./execution-state-after-observation-adapter";

import {
  computePlatformCorePayloadSha256,
  PlatformCoreCanonicalPayloadHashError,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_EXECUTION_OBSERVATION_SOURCE_PORT_PROTOCOL =
  "HBCE-PLATFORM-CORE-EXECUTION-OBSERVATION-SOURCE-PORT-v1" as const;

export interface PlatformCoreExecutionObservationReceipt {
  readonly executionId:
    string;

  readonly executionVersion:
    2;

  readonly executionSha256:
    string;

  readonly executionEngineRef:
    string;

  readonly enforcementPointRef:
    string;

  readonly terminalStateObserved:
    "EXECUTED" | "FAILED" | "ABORTED";

  readonly observationState:
    "CAPTURED" | "NOT_AVAILABLE" | "UNKNOWN";

  readonly stateRef:
    string | null;

  readonly stateSha256:
    string | null;

  readonly evidenceReference:
    string;

  readonly observedAt:
    string;
}

export interface PlatformCoreValidatedExecutionObservation {
  readonly executionId:
    string;

  readonly executionVersion:
    2;

  readonly executionSha256:
    string;

  readonly executionEngineRef:
    string;

  readonly enforcementPointRef:
    string;

  readonly evidenceReference:
    string;

  readonly observedAt:
    string;

  readonly stateAfterSource:
    PlatformCoreExecutionStateAfterObservationSource;
}

export type PlatformCoreExecutionObservationSourcePortErrorCode =
  | "INVALID_EXECUTION"
  | "EXECUTION_SCHEMA_INVALID"
  | "EXECUTION_HASH_INVALID"
  | "INVALID_RECEIPT"
  | "EXECUTION_BINDING_MISMATCH"
  | "INVALID_OBSERVATION";

export class PlatformCoreExecutionObservationSourcePortError
  extends Error {
  readonly code:
    PlatformCoreExecutionObservationSourcePortErrorCode;

  constructor(
    code:
      PlatformCoreExecutionObservationSourcePortErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreExecutionObservationSourcePortError";

    this.code =
      code;
  }
}

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

function failClosed(
  code:
    PlatformCoreExecutionObservationSourcePortErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreExecutionObservationSourcePortError(
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

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && value.length > 0
    && value.trim() === value
  );
}

function isSha256(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string"
    && SHA256_PATTERN.test(
      value,
    )
  );
}

function isDateTime(
  value:
    unknown,
): value is string {
  if (
    !isNonEmptyString(
      value,
    )
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return Number.isFinite(
    parsed,
  );
}

function assertExecution(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
): void {
  if (
    !isPlainRecord(
      execution,
    )
  ) {
    failClosed(
      "INVALID_EXECUTION",
      "Observation source port requires a canonical EXECUTION object.",
    );
  }

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EXECUTION",
      execution,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "EXECUTION_SCHEMA_INVALID",
      `Canonical EXECUTION schema validation failed: ${validation.code}.`,
    );
  }

  const {
    payload_sha256:
      executionPayloadSha256,
    ...executionPreimage
  } =
    execution;

  let recomputed:
    string;

  try {
    recomputed =
      computePlatformCorePayloadSha256(
        executionPreimage,
      );
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreCanonicalPayloadHashError
    ) {
      failClosed(
        "EXECUTION_HASH_INVALID",
        `Canonical EXECUTION payload hash cannot be reproduced: ${error.code}.`,
      );
    }

    throw error;
  }

  if (
    recomputed !==
      executionPayloadSha256
  ) {
    failClosed(
      "EXECUTION_HASH_INVALID",
      "Canonical EXECUTION payload hash does not reproduce exactly.",
    );
  }

  if (
    execution.execution_version !== 2
    || execution.state !== "EXECUTING"
    || !isNonEmptyString(
      execution.execution_id,
    )
    || !isNonEmptyString(
      execution.execution_engine_ref,
    )
    || !isNonEmptyString(
      execution.enforcement_point_ref,
    )
    || !isSha256(
      execution.payload_sha256,
    )
  ) {
    failClosed(
      "INVALID_EXECUTION",
      "Observation source port requires an exact canonical EXECUTING/v2 execution.",
    );
  }
}

function assertReceipt(
  receipt:
    PlatformCoreExecutionObservationReceipt,
): void {
  if (
    !isNonEmptyString(
      receipt.executionId,
    )
    || receipt.executionVersion !== 2
    || !isSha256(
      receipt.executionSha256,
    )
    || !isNonEmptyString(
      receipt.executionEngineRef,
    )
    || !isNonEmptyString(
      receipt.enforcementPointRef,
    )
    || !isNonEmptyString(
      receipt.evidenceReference,
    )
    || !isDateTime(
      receipt.observedAt,
    )
  ) {
    failClosed(
      "INVALID_RECEIPT",
      "Execution observation receipt identity or provenance is invalid.",
    );
  }

  if (
    receipt.terminalStateObserved !== "EXECUTED"
    && receipt.terminalStateObserved !== "FAILED"
    && receipt.terminalStateObserved !== "ABORTED"
  ) {
    failClosed(
      "INVALID_OBSERVATION",
      "terminalStateObserved is invalid.",
    );
  }

  if (
    receipt.observationState !== "CAPTURED"
    && receipt.observationState !== "NOT_AVAILABLE"
    && receipt.observationState !== "UNKNOWN"
  ) {
    failClosed(
      "INVALID_OBSERVATION",
      "observationState is invalid.",
    );
  }

  if (
    receipt.observationState === "CAPTURED"
  ) {
    if (
      !isNonEmptyString(
        receipt.stateRef,
      )
      || !isSha256(
        receipt.stateSha256,
      )
    ) {
      failClosed(
        "INVALID_OBSERVATION",
        "CAPTURED observation requires stateRef and stateSha256.",
      );
    }
  } else if (
    receipt.stateRef !== null
    || receipt.stateSha256 !== null
  ) {
    failClosed(
      "INVALID_OBSERVATION",
      "NOT_AVAILABLE or UNKNOWN observation requires null stateRef and stateSha256.",
    );
  }

  if (
    receipt.terminalStateObserved === "EXECUTED"
    && receipt.observationState !== "CAPTURED"
  ) {
    failClosed(
      "INVALID_OBSERVATION",
      "EXECUTED requires CAPTURED post-execution state.",
    );
  }
}

function assertExactBinding(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  receipt:
    PlatformCoreExecutionObservationReceipt,
): void {
  if (
    receipt.executionId !==
      execution.execution_id
    || receipt.executionVersion !==
      execution.execution_version
    || receipt.executionSha256 !==
      execution.payload_sha256
    || receipt.executionEngineRef !==
      execution.execution_engine_ref
    || receipt.enforcementPointRef !==
      execution.enforcement_point_ref
  ) {
    failClosed(
      "EXECUTION_BINDING_MISMATCH",
      "Execution observation receipt does not bind to the exact canonical EXECUTING/v2 execution.",
    );
  }
}

/**
 * Validates a receipt already produced by a concrete execution observer.
 *
 * This port does NOT:
 *
 * - execute an action;
 * - observe an external system;
 * - infer execution success;
 * - compute state hashes;
 * - persist evidence;
 * - consume authorization;
 * - create terminal EXECUTION;
 * - create OUTCOME;
 * - update MATRIX;
 * - trigger FEEDBACK.
 *
 * A concrete execution engine / enforcement-point adapter must produce
 * the receipt. This function only verifies exact execution provenance
 * and exposes the already-observed state to the canonical state_after
 * adapter.
 */
export function validatePlatformCoreExecutionObservation(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  receipt:
    PlatformCoreExecutionObservationReceipt,
): PlatformCoreValidatedExecutionObservation {
  assertExecution(
    execution,
  );

  assertReceipt(
    receipt,
  );

  assertExactBinding(
    execution,
    receipt,
  );

  const stateAfterSource:
    PlatformCoreExecutionStateAfterObservationSource =
    Object.freeze({
      terminalStateObserved:
        receipt.terminalStateObserved,

      observationState:
        receipt.observationState,

      stateRef:
        receipt.stateRef,

      stateSha256:
        receipt.stateSha256,
    });

  return Object.freeze({
    executionId:
      receipt.executionId,

    executionVersion:
      receipt.executionVersion,

    executionSha256:
      receipt.executionSha256,

    executionEngineRef:
      receipt.executionEngineRef,

    enforcementPointRef:
      receipt.enforcementPointRef,

    evidenceReference:
      receipt.evidenceReference,

    observedAt:
      receipt.observedAt,

    stateAfterSource,
  });
}
