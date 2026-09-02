import type {
  PlatformCoreCanonicalExecutionExecutingV2,
} from "./canonical-execution-pending-to-executing-builder";

import {
  computePlatformCorePayloadSha256,
  PlatformCoreCanonicalPayloadHashError,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

import {
  persistPlatformCoreCanonicalStateSnapshot,
  PlatformCoreCanonicalStateSnapshotRepositoryError,
  type PlatformCoreCanonicalStateSnapshotEvidence,
} from "./canonical-state-snapshot-repository";

import {
  persistPlatformCoreExecutionObservationEvidence,
  PlatformCoreExecutionObservationEvidenceRepositoryError,
  type PlatformCoreExecutionObservationEvidencePersistence,
} from "./execution-observation-evidence-repository";

import type {
  PlatformCoreExecutionObservationReceipt,
} from "./execution-observation-source-port";

export const PLATFORM_CORE_CONCRETE_EXECUTION_OBSERVER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CONCRETE-EXECUTION-OBSERVER-v1" as const;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const EVIDENCE_REFERENCE_PATTERN =
  /^HBCE:OBS:EVIDENCE:V1:SHA256:[0-9A-F]{64}$/;

const READER_RESULT_FIELDS =
  Object.freeze([
    "executionId",
    "executionVersion",
    "executionSha256",
    "executionEngineRef",
    "enforcementPointRef",
    "terminalStateObserved",
    "observationState",
    "observedState",
    "observedAt",
  ] as const);

export type PlatformCorePostExecutionObservationRequest =
  Readonly<{
    executionId:
      string;

    executionVersion:
      2;

    executionSha256:
      string;

    executionEngineRef:
      string;

    enforcementPointRef:
      string;
  }>;

export type PlatformCorePostExecutionObservationResult =
  Readonly<{
    executionId:
      string;

    executionVersion:
      2;

    executionSha256:
      string;

    executionEngineRef:
      string;

    enforcementPointRef:
      string;

    terminalStateObserved:
      "EXECUTED" | "FAILED" | "ABORTED";

    observationState:
      "CAPTURED" | "NOT_AVAILABLE" | "UNKNOWN";

    observedState:
      unknown;

    observedAt:
      string;
  }>;

export interface PlatformCorePostExecutionObservationReader {
  readPostExecutionObservation(
    request:
      PlatformCorePostExecutionObservationRequest,
  ): Promise<PlatformCorePostExecutionObservationResult>;
}

export type PlatformCoreConcreteExecutionObserverErrorCode =
  | "INVALID_EXECUTION"
  | "EXECUTION_SCHEMA_INVALID"
  | "EXECUTION_HASH_INVALID"
  | "INVALID_READER"
  | "READER_FAILURE"
  | "INVALID_READER_RESULT"
  | "READER_BINDING_MISMATCH"
  | "SNAPSHOT_PERSISTENCE_FAILURE"
  | "EVIDENCE_PERSISTENCE_FAILURE"
  | "PERSISTENCE_BINDING_MISMATCH";

export class PlatformCoreConcreteExecutionObserverError
  extends Error {
  readonly code:
    PlatformCoreConcreteExecutionObserverErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreConcreteExecutionObserverErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreConcreteExecutionObserverError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

function failClosed(
  code:
    PlatformCoreConcreteExecutionObserverErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreConcreteExecutionObserverError({
    code,
    message,
    causeValue,
  });
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value,
    );

  return (
    prototype === Object.prototype
    || prototype === null
  );
}

function isNonEmptyTrimmedString(
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

function isValidDateTime(
  value:
    unknown,
): value is string {
  if (
    !isNonEmptyTrimmedString(
      value,
    )
  ) {
    return false;
  }

  return Number.isFinite(
    Date.parse(
      value,
    ),
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
    return failClosed(
      "INVALID_EXECUTION",
      "Concrete observer requires a canonical EXECUTION object.",
      execution,
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
    return failClosed(
      "EXECUTION_SCHEMA_INVALID",
      `Canonical EXECUTION schema validation failed: ${validation.code}.`,
      validation.issues,
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
      return failClosed(
        "EXECUTION_HASH_INVALID",
        `Canonical EXECUTION payload hash cannot be reproduced: ${error.code}.`,
        error,
      );
    }

    throw error;
  }

  if (
    recomputed !==
      executionPayloadSha256
  ) {
    return failClosed(
      "EXECUTION_HASH_INVALID",
      "Canonical EXECUTION payload hash does not reproduce exactly.",
      {
        expected:
          executionPayloadSha256,

        recomputed,
      },
    );
  }

  if (
    execution.execution_version !== 2
    || execution.state !== "EXECUTING"
    || !isNonEmptyTrimmedString(
      execution.execution_id,
    )
    || !isNonEmptyTrimmedString(
      execution.execution_engine_ref,
    )
    || !isNonEmptyTrimmedString(
      execution.enforcement_point_ref,
    )
    || !isSha256(
      execution.payload_sha256,
    )
  ) {
    return failClosed(
      "INVALID_EXECUTION",
      "Concrete observer requires an exact canonical EXECUTING/v2 execution.",
      execution,
    );
  }
}

function assertReader(
  reader:
    PlatformCorePostExecutionObservationReader,
): void {
  if (
    (
      typeof reader !== "object"
      || reader === null
    )
    && typeof reader !== "function"
  ) {
    return failClosed(
      "INVALID_READER",
      "Post-execution observation reader must be an object exposing readPostExecutionObservation.",
      reader,
    );
  }

  if (
    typeof reader.readPostExecutionObservation !==
      "function"
  ) {
    return failClosed(
      "INVALID_READER",
      "Post-execution observation reader does not expose readPostExecutionObservation.",
      reader,
    );
  }
}

function buildObservationRequest(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
): PlatformCorePostExecutionObservationRequest {
  return Object.freeze({
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
}

function captureDataProperty(
  value:
    Record<string, unknown>,
  key:
    string,
): unknown {
  const descriptor =
    Object.getOwnPropertyDescriptor(
      value,
      key,
    );

  if (
    !descriptor
    || !descriptor.enumerable
    || !(
      "value" in descriptor
    )
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      `${key} must be an enumerable data property.`,
      descriptor,
    );
  }

  return descriptor.value;
}

function captureReaderResult(
  value:
    unknown,
): PlatformCorePostExecutionObservationResult {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "Post-execution reader result must be a plain object.",
      value,
    );
  }

  if (
    Object.getOwnPropertySymbols(
      value,
    ).length !== 0
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "Post-execution reader result must not contain symbol keys.",
      value,
    );
  }

  const actualKeys =
    Object.getOwnPropertyNames(
      value,
    ).sort();

  const expectedKeys =
    [
      ...READER_RESULT_FIELDS,
    ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length
    || actualKeys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index]
    )
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "Post-execution reader result contains missing or unknown fields.",
      {
        actualKeys,
        expectedKeys,
      },
    );
  }

  const executionId =
    captureDataProperty(
      value,
      "executionId",
    );

  const executionVersion =
    captureDataProperty(
      value,
      "executionVersion",
    );

  const executionSha256 =
    captureDataProperty(
      value,
      "executionSha256",
    );

  const executionEngineRef =
    captureDataProperty(
      value,
      "executionEngineRef",
    );

  const enforcementPointRef =
    captureDataProperty(
      value,
      "enforcementPointRef",
    );

  const terminalStateObserved =
    captureDataProperty(
      value,
      "terminalStateObserved",
    );

  const observationState =
    captureDataProperty(
      value,
      "observationState",
    );

  const observedState =
    captureDataProperty(
      value,
      "observedState",
    );

  const observedAt =
    captureDataProperty(
      value,
      "observedAt",
    );

  if (
    !isNonEmptyTrimmedString(
      executionId,
    )
    || executionVersion !== 2
    || !isSha256(
      executionSha256,
    )
    || !isNonEmptyTrimmedString(
      executionEngineRef,
    )
    || !isNonEmptyTrimmedString(
      enforcementPointRef,
    )
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "Post-execution reader result has invalid execution provenance.",
      value,
    );
  }

  if (
    terminalStateObserved !== "EXECUTED"
    && terminalStateObserved !== "FAILED"
    && terminalStateObserved !== "ABORTED"
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "terminalStateObserved must be EXECUTED, FAILED or ABORTED.",
      terminalStateObserved,
    );
  }

  if (
    observationState !== "CAPTURED"
    && observationState !== "NOT_AVAILABLE"
    && observationState !== "UNKNOWN"
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "observationState must be CAPTURED, NOT_AVAILABLE or UNKNOWN.",
      observationState,
    );
  }

  if (
    !isValidDateTime(
      observedAt,
    )
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "observedAt must be a valid date-time string.",
      observedAt,
    );
  }

  if (
    observationState ===
      "CAPTURED"
  ) {
    if (
      observedState ===
        undefined
    ) {
      return failClosed(
        "INVALID_READER_RESULT",
        "CAPTURED observation requires observedState; JSON null remains a valid observed state.",
        observedState,
      );
    }
  } else if (
    observedState !==
      null
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "NOT_AVAILABLE or UNKNOWN observation requires observedState to be null.",
      observedState,
    );
  }

  if (
    terminalStateObserved ===
      "EXECUTED"
    && observationState !==
      "CAPTURED"
  ) {
    return failClosed(
      "INVALID_READER_RESULT",
      "EXECUTED requires a CAPTURED post-execution observation.",
      {
        terminalStateObserved,
        observationState,
      },
    );
  }

  return Object.freeze({
    executionId,
    executionVersion:
      2,
    executionSha256,
    executionEngineRef,
    enforcementPointRef,
    terminalStateObserved,
    observationState,
    observedState,
    observedAt,
  });
}

function assertExactExecutionBinding(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  result:
    PlatformCorePostExecutionObservationResult,
): void {
  if (
    result.executionId !==
      execution.execution_id
    || result.executionVersion !==
      execution.execution_version
    || result.executionSha256 !==
      execution.payload_sha256
    || result.executionEngineRef !==
      execution.execution_engine_ref
    || result.enforcementPointRef !==
      execution.enforcement_point_ref
  ) {
    return failClosed(
      "READER_BINDING_MISMATCH",
      "Post-execution observation does not bind to the exact canonical EXECUTING/v2 execution.",
      {
        execution: {
          executionId:
            execution.execution_id,

          executionVersion:
            execution.execution_version,

          executionSha256:
            execution.payload_sha256,

          executionEngineRef:
            execution.execution_engine_ref,

          enforcementPointRef:
            execution.enforcement_point_ref,
        },

        observation: {
          executionId:
            result.executionId,

          executionVersion:
            result.executionVersion,

          executionSha256:
            result.executionSha256,

          executionEngineRef:
            result.executionEngineRef,

          enforcementPointRef:
            result.enforcementPointRef,
        },
      },
    );
  }
}

function assertEvidencePersistenceBinding(
  persistence:
    PlatformCoreExecutionObservationEvidencePersistence,
  observation:
    PlatformCorePostExecutionObservationResult,
  stateRef:
    string | null,
  stateSha256:
    string | null,
): void {
  if (
    !EVIDENCE_REFERENCE_PATTERN.test(
      persistence.evidenceReference,
    )
    || persistence.executionId !==
      observation.executionId
    || persistence.executionVersion !==
      observation.executionVersion
    || persistence.executionSha256 !==
      observation.executionSha256
    || persistence.executionEngineRef !==
      observation.executionEngineRef
    || persistence.enforcementPointRef !==
      observation.enforcementPointRef
    || persistence.terminalStateObserved !==
      observation.terminalStateObserved
    || persistence.observationState !==
      observation.observationState
    || persistence.stateRef !==
      stateRef
    || persistence.stateSha256 !==
      stateSha256
    || persistence.observedAt !==
      observation.observedAt
  ) {
    return failClosed(
      "PERSISTENCE_BINDING_MISMATCH",
      "Durable observation evidence does not reproduce the exact concrete observation.",
      {
        persistence,
        observation,
        stateRef,
        stateSha256,
      },
    );
  }
}

async function persistCapturedSnapshot(
  observedState:
    unknown,
): Promise<PlatformCoreCanonicalStateSnapshotEvidence> {
  try {
    return await persistPlatformCoreCanonicalStateSnapshot(
      observedState,
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreCanonicalStateSnapshotRepositoryError
    ) {
      return failClosed(
        "SNAPSHOT_PERSISTENCE_FAILURE",
        `Canonical post-execution state snapshot persistence failed: ${error.code}.`,
        error,
      );
    }

    return failClosed(
      "SNAPSHOT_PERSISTENCE_FAILURE",
      "Canonical post-execution state snapshot persistence failed.",
      error,
    );
  }
}

async function persistObservationEvidence(
  input:
    Parameters<
      typeof persistPlatformCoreExecutionObservationEvidence
    >[0],
): Promise<PlatformCoreExecutionObservationEvidencePersistence> {
  try {
    return await persistPlatformCoreExecutionObservationEvidence(
      input,
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreExecutionObservationEvidenceRepositoryError
    ) {
      return failClosed(
        "EVIDENCE_PERSISTENCE_FAILURE",
        `Execution observation evidence persistence failed: ${error.code}.`,
        error,
      );
    }

    return failClosed(
      "EVIDENCE_PERSISTENCE_FAILURE",
      "Execution observation evidence persistence failed.",
      error,
    );
  }
}

/**
 * Observes the already-executed target exactly once through a concrete
 * post-execution reader and turns that observation into durable evidence.
 *
 * This component does NOT:
 *
 * - execute or dispatch the action;
 * - retry the external observation;
 * - consume authorization;
 * - call the observation source-port validator;
 * - build state_after;
 * - create terminal EXECUTION;
 * - create OUTCOME;
 * - update MATRIX;
 * - trigger FEEDBACK.
 *
 * CAPTURED flow:
 *
 * external read
 * -> canonical state snapshot persistence
 * -> observation evidence persistence
 * -> immutable receipt
 *
 * NOT_AVAILABLE / UNKNOWN flow:
 *
 * external read
 * -> observation evidence persistence with null state material
 * -> immutable receipt
 */
export async function observePlatformCorePostExecution(
  execution:
    PlatformCoreCanonicalExecutionExecutingV2,
  reader:
    PlatformCorePostExecutionObservationReader,
): Promise<PlatformCoreExecutionObservationReceipt> {
  assertExecution(
    execution,
  );

  assertReader(
    reader,
  );

  const request =
    buildObservationRequest(
      execution,
    );

  let rawResult:
    PlatformCorePostExecutionObservationResult;

  try {
    rawResult =
      await reader.readPostExecutionObservation(
        request,
      );
  } catch (
    error
  ) {
    return failClosed(
      "READER_FAILURE",
      "Post-execution observation reader failed.",
      error,
    );
  }

  const observation =
    captureReaderResult(
      rawResult,
    );

  assertExactExecutionBinding(
    execution,
    observation,
  );

  let stateRef:
    string | null =
      null;

  let stateSha256:
    string | null =
      null;

  if (
    observation.observationState ===
      "CAPTURED"
  ) {
    const snapshot =
      await persistCapturedSnapshot(
        observation.observedState,
      );

    stateRef =
      snapshot.stateRef;

    stateSha256 =
      snapshot.stateSha256;
  }

  const evidence =
    await persistObservationEvidence({
      executionId:
        observation.executionId,

      executionVersion:
        observation.executionVersion,

      executionSha256:
        observation.executionSha256,

      executionEngineRef:
        observation.executionEngineRef,

      enforcementPointRef:
        observation.enforcementPointRef,

      terminalStateObserved:
        observation.terminalStateObserved,

      observationState:
        observation.observationState,

      stateRef,

      stateSha256,

      observedAt:
        observation.observedAt,
    });

  assertEvidencePersistenceBinding(
    evidence,
    observation,
    stateRef,
    stateSha256,
  );

  return Object.freeze({
    executionId:
      evidence.executionId,

    executionVersion:
      evidence.executionVersion,

    executionSha256:
      evidence.executionSha256,

    executionEngineRef:
      evidence.executionEngineRef,

    enforcementPointRef:
      evidence.enforcementPointRef,

    terminalStateObserved:
      evidence.terminalStateObserved,

    observationState:
      evidence.observationState,

    stateRef:
      evidence.stateRef,

    stateSha256:
      evidence.stateSha256,

    evidenceReference:
      evidence.evidenceReference,

    observedAt:
      evidence.observedAt,
  });
}
