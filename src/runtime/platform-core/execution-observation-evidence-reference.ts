import {
  createHash,
} from "node:crypto";

export const PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PROFILE =
  "HBCE_PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_V1_SHA256" as const;

export const PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PREFIX =
  "HBCE:OBS:EVIDENCE:V1:SHA256:" as const;

export type PlatformCoreExecutionObservationEvidenceTerminalState =
  | "EXECUTED"
  | "FAILED"
  | "ABORTED";

export type PlatformCoreExecutionObservationEvidenceObservationState =
  | "CAPTURED"
  | "NOT_AVAILABLE"
  | "UNKNOWN";

export type PlatformCoreExecutionObservationEvidenceReferenceInput =
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
      PlatformCoreExecutionObservationEvidenceTerminalState;

    observationState:
      PlatformCoreExecutionObservationEvidenceObservationState;

    stateRef:
      string | null;

    stateSha256:
      string | null;

    observedAt:
      string;
  }>;

export type PlatformCoreExecutionObservationEvidenceReference =
  Readonly<{
    canonicalEvidenceUtf8:
      string;

    evidenceSha256:
      string;

    evidenceReference:
      string;
  }>;

export type PlatformCoreExecutionObservationEvidenceReferenceErrorCode =
  | "INVALID_INPUT"
  | "INVALID_OBSERVATION";

export class PlatformCoreExecutionObservationEvidenceReferenceError
  extends Error {
  readonly code:
    PlatformCoreExecutionObservationEvidenceReferenceErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreExecutionObservationEvidenceReferenceErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreExecutionObservationEvidenceReferenceError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const STATE_REF_PATTERN =
  /^HBCE:STATE:OBSERVED:V1:SHA256:[0-9A-F]{64}$/;

const INPUT_KEYS =
  [
    "enforcementPointRef",
    "executionEngineRef",
    "executionId",
    "executionSha256",
    "executionVersion",
    "observationState",
    "observedAt",
    "stateRef",
    "stateSha256",
    "terminalStateObserved",
  ] as const;

type CapturedInput =
  PlatformCoreExecutionObservationEvidenceReferenceInput;

function failClosed(
  code:
    PlatformCoreExecutionObservationEvidenceReferenceErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreExecutionObservationEvidenceReferenceError({
    code,
    message,
    causeValue,
  });
}

function isPlainObject(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    typeof value !== "object"
    || value === null
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

function requireNonEmptyString(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.trim() !== value
  ) {
    return failClosed(
      "INVALID_INPUT",
      `${field} must be a non-empty trimmed string.`,
      value,
    );
  }

  return value;
}

function requireSha256(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !== "string"
    || !SHA256_PATTERN.test(
      value,
    )
  ) {
    return failClosed(
      "INVALID_INPUT",
      `${field} must be a lowercase SHA-256 digest.`,
      value,
    );
  }

  return value;
}

function requireObservedAt(
  value:
    unknown,
): string {
  const observedAt =
    requireNonEmptyString(
      value,
      "observedAt",
    );

  const millis =
    Date.parse(
      observedAt,
    );

  if (
    !Number.isFinite(
      millis,
    )
  ) {
    return failClosed(
      "INVALID_INPUT",
      "observedAt must be a valid timestamp.",
      value,
    );
  }

  /*
   * observedAt is deliberately NOT normalized here.
   *
   * Its exact string representation is evidence material and therefore
   * hash-significant under this v1 profile.
   */

  return observedAt;
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
      "INVALID_INPUT",
      `${key} must be an enumerable data property.`,
      descriptor,
    );
  }

  return descriptor.value;
}

function captureInput(
  input:
    PlatformCoreExecutionObservationEvidenceReferenceInput,
): CapturedInput {
  if (
    !isPlainObject(
      input,
    )
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Observation evidence material must be a plain object.",
      input,
    );
  }

  if (
    Object.getOwnPropertySymbols(
      input,
    ).length !== 0
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Observation evidence material must not contain symbol keys.",
      input,
    );
  }

  const actualKeys =
    Object.getOwnPropertyNames(
      input,
    ).sort();

  if (
    actualKeys.length !==
      INPUT_KEYS.length
    || actualKeys.some(
      (
        key,
        index,
      ) =>
        key !==
        INPUT_KEYS[index]
    )
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Observation evidence material contains an unknown or missing field.",
      {
        actualKeys,
        expectedKeys:
          INPUT_KEYS,
      },
    );
  }

  const executionId =
    requireNonEmptyString(
      captureDataProperty(
        input,
        "executionId",
      ),
      "executionId",
    );

  const executionVersion =
    captureDataProperty(
      input,
      "executionVersion",
    );

  if (
    executionVersion !== 2
  ) {
    return failClosed(
      "INVALID_INPUT",
      "executionVersion must equal 2.",
      executionVersion,
    );
  }

  const executionSha256 =
    requireSha256(
      captureDataProperty(
        input,
        "executionSha256",
      ),
      "executionSha256",
    );

  const executionEngineRef =
    requireNonEmptyString(
      captureDataProperty(
        input,
        "executionEngineRef",
      ),
      "executionEngineRef",
    );

  const enforcementPointRef =
    requireNonEmptyString(
      captureDataProperty(
        input,
        "enforcementPointRef",
      ),
      "enforcementPointRef",
    );

  const terminalStateObserved =
    captureDataProperty(
      input,
      "terminalStateObserved",
    );

  if (
    terminalStateObserved !== "EXECUTED"
    && terminalStateObserved !== "FAILED"
    && terminalStateObserved !== "ABORTED"
  ) {
    return failClosed(
      "INVALID_OBSERVATION",
      "terminalStateObserved is invalid.",
      terminalStateObserved,
    );
  }

  const observationState =
    captureDataProperty(
      input,
      "observationState",
    );

  if (
    observationState !== "CAPTURED"
    && observationState !== "NOT_AVAILABLE"
    && observationState !== "UNKNOWN"
  ) {
    return failClosed(
      "INVALID_OBSERVATION",
      "observationState is invalid.",
      observationState,
    );
  }

  const rawStateRef =
    captureDataProperty(
      input,
      "stateRef",
    );

  const rawStateSha256 =
    captureDataProperty(
      input,
      "stateSha256",
    );

  let stateRef:
    string | null;

  let stateSha256:
    string | null;

  if (
    observationState === "CAPTURED"
  ) {
    if (
      typeof rawStateRef !== "string"
      || !STATE_REF_PATTERN.test(
        rawStateRef,
      )
    ) {
      return failClosed(
        "INVALID_OBSERVATION",
        "CAPTURED observation requires a canonical observed-state reference.",
        rawStateRef,
      );
    }

    stateRef =
      rawStateRef;

    stateSha256 =
      requireSha256(
        rawStateSha256,
        "stateSha256",
      );

    const digestFromReference =
      stateRef.slice(
        "HBCE:STATE:OBSERVED:V1:SHA256:".length,
      ).toLowerCase();

    if (
      digestFromReference !==
        stateSha256
    ) {
      return failClosed(
        "INVALID_OBSERVATION",
        "stateRef and stateSha256 do not identify the same canonical state.",
        {
          stateRef,
          stateSha256,
        },
      );
    }
  } else {
    if (
      rawStateRef !== null
      || rawStateSha256 !== null
    ) {
      return failClosed(
        "INVALID_OBSERVATION",
        "NOT_AVAILABLE or UNKNOWN observation requires null state material.",
        {
          stateRef:
            rawStateRef,

          stateSha256:
            rawStateSha256,
        },
      );
    }

    stateRef =
      null;

    stateSha256 =
      null;
  }

  if (
    terminalStateObserved ===
      "EXECUTED"
    && observationState !==
      "CAPTURED"
  ) {
    return failClosed(
      "INVALID_OBSERVATION",
      "EXECUTED requires CAPTURED post-execution state.",
      {
        terminalStateObserved,
        observationState,
      },
    );
  }

  const observedAt =
    requireObservedAt(
      captureDataProperty(
        input,
        "observedAt",
      ),
    );

  return Object.freeze({
    executionId,
    executionVersion:
      2,
    executionSha256,
    executionEngineRef,
    enforcementPointRef,
    terminalStateObserved,
    observationState,
    stateRef,
    stateSha256,
    observedAt,
  });
}

function encodeString(
  value:
    string,
): string {
  const encoded =
    JSON.stringify(
      value,
    );

  if (
    typeof encoded !== "string"
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Evidence string could not be encoded as canonical JSON.",
      value,
    );
  }

  return encoded;
}

function encodeNullableString(
  value:
    string | null,
): string {
  return value === null
    ? "null"
    : encodeString(
        value,
      );
}

function canonicalizeEvidence(
  input:
    CapturedInput,
): string {
  /*
   * Key order is part of the v1 profile and is fixed lexicographically.
   *
   * No evidenceReference field exists in this preimage, preventing
   * self-referential hashing.
   */

  return (
    "{"
    + `"enforcementPointRef":${encodeString(input.enforcementPointRef)},`
    + `"executionEngineRef":${encodeString(input.executionEngineRef)},`
    + `"executionId":${encodeString(input.executionId)},`
    + `"executionSha256":${encodeString(input.executionSha256)},`
    + `"executionVersion":2,`
    + `"observationState":${encodeString(input.observationState)},`
    + `"observedAt":${encodeString(input.observedAt)},`
    + `"stateRef":${encodeNullableString(input.stateRef)},`
    + `"stateSha256":${encodeNullableString(input.stateSha256)},`
    + `"terminalStateObserved":${encodeString(input.terminalStateObserved)}`
    + "}"
  );
}

/**
 * Derives the immutable reference of one exact execution-observation event.
 *
 * The function:
 *
 * - captures every evidence input data property exactly once;
 * - rejects accessors, symbol keys and unknown fields;
 * - preserves the exact observedAt representation;
 * - validates CAPTURED vs non-CAPTURED state semantics;
 * - binds stateRef to stateSha256;
 * - produces one canonical evidence UTF-8 preimage;
 * - hashes exactly that returned preimage;
 * - derives evidenceReference from that digest.
 *
 * It does NOT:
 *
 * - execute an action;
 * - read an external target;
 * - persist a state snapshot;
 * - persist observation evidence;
 * - accept a caller-supplied evidenceReference;
 * - consume authorization;
 * - create state_after;
 * - create terminal EXECUTION;
 * - create OUTCOME;
 * - update MATRIX;
 * - trigger FEEDBACK.
 */
export function derivePlatformCoreExecutionObservationEvidenceReference(
  input:
    PlatformCoreExecutionObservationEvidenceReferenceInput,
): PlatformCoreExecutionObservationEvidenceReference {
  const captured =
    captureInput(
      input,
    );

  const canonicalEvidenceUtf8 =
    canonicalizeEvidence(
      captured,
    );

  const evidenceSha256 =
    createHash(
      "sha256",
    )
      .update(
        canonicalEvidenceUtf8,
        "utf8",
      )
      .digest(
        "hex",
      );

  const evidenceReference =
    (
      PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REFERENCE_PREFIX
      + evidenceSha256.toUpperCase()
    );

  return Object.freeze({
    canonicalEvidenceUtf8,
    evidenceSha256,
    evidenceReference,
  });
}
