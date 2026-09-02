import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

import {
  derivePlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

import {
  derivePlatformCoreExecutionObservationEvidenceReference,
  type PlatformCoreExecutionObservationEvidenceReferenceInput,
} from "./execution-observation-evidence-reference";

export const PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-EXECUTION-OBSERVATION-EVIDENCE-REPOSITORY-v1" as const;

export const PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS =
  3 as const;

const EVIDENCE_TABLE =
  "public.hbce_platform_core_execution_observation_evidence" as const;

const SNAPSHOT_TABLE =
  "public.hbce_platform_core_canonical_state_snapshots" as const;

const EVIDENCE_REFERENCE_PATTERN =
  /^HBCE:OBS:EVIDENCE:V1:SHA256:[0-9A-F]{64}$/;

const STATE_REF_PATTERN =
  /^HBCE:STATE:OBSERVED:V1:SHA256:[0-9A-F]{64}$/;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

export type PlatformCoreExecutionObservationEvidenceRepositoryInput =
  PlatformCoreExecutionObservationEvidenceReferenceInput;

export type PlatformCoreExecutionObservationEvidenceRecord =
  Readonly<{
    evidenceReference:
      string;

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

    stateRef:
      string | null;

    stateSha256:
      string | null;

    observedAt:
      string;

    createdAt:
      string;
  }>;

export type PlatformCoreExecutionObservationEvidencePersistence =
  Readonly<
    PlatformCoreExecutionObservationEvidenceRecord
    & {
      idempotentReplay:
        boolean;
    }
  >;

export type PlatformCoreExecutionObservationEvidenceRepositoryErrorCode =
  | "INVALID_INPUT"
  | "SNAPSHOT_NOT_FOUND"
  | "SNAPSHOT_INVALID"
  | "EXISTING_EVIDENCE_MISMATCH"
  | "PERSISTENCE_AMBIGUITY"
  | "SERIALIZATION_RETRY_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreExecutionObservationEvidenceRepositoryError
  extends Error {
  readonly code:
    PlatformCoreExecutionObservationEvidenceRepositoryErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreExecutionObservationEvidenceRepositoryErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreExecutionObservationEvidenceRepositoryError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

type EvidenceRow = {
  readonly evidence_reference:
    unknown;

  readonly execution_id:
    unknown;

  readonly execution_version:
    unknown;

  readonly execution_sha256:
    unknown;

  readonly execution_engine_ref:
    unknown;

  readonly enforcement_point_ref:
    unknown;

  readonly terminal_state_observed:
    unknown;

  readonly observation_state:
    unknown;

  readonly state_ref:
    unknown;

  readonly state_sha256:
    unknown;

  readonly observed_at:
    unknown;

  readonly created_at:
    unknown;
};

type SnapshotRow = {
  readonly state_ref:
    unknown;

  readonly state_sha256:
    unknown;

  readonly canonical_state_utf8:
    unknown;
};

type StableEvidenceMaterial =
  Readonly<{
    input:
      PlatformCoreExecutionObservationEvidenceReferenceInput;

    canonicalEvidenceUtf8:
      string;

    evidenceSha256:
      string;

    evidenceReference:
      string;
  }>;

type SnapshotVerification =
  | Readonly<{
      kind:
        "NOT_REQUIRED";
    }>
  | Readonly<{
      kind:
        "VERIFIED";
    }>
  | Readonly<{
      kind:
        "NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "AMBIGUOUS";
    }>
  | Readonly<{
      kind:
        "INVALID";

      cause:
        unknown;
    }>;

type PersistAttempt =
  | Readonly<{
      kind:
        "INSERTED";

      row:
        EvidenceRow;
    }>
  | Readonly<{
      kind:
        "EXISTING";

      row:
        EvidenceRow;
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_AMBIGUOUS";
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_INVALID";

      cause:
        unknown;
    }>
  | Readonly<{
      kind:
        "AMBIGUOUS";
    }>;

type ReadAttempt =
  | Readonly<{
      kind:
        "FOUND";

      record:
        PlatformCoreExecutionObservationEvidenceRecord;
    }>
  | Readonly<{
      kind:
        "NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "EVIDENCE_INVALID";

      cause:
        unknown;
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_AMBIGUOUS";
    }>
  | Readonly<{
      kind:
        "SNAPSHOT_INVALID";

      cause:
        unknown;
    }>
  | Readonly<{
      kind:
        "AMBIGUOUS";
    }>;

function failClosed(
  code:
    PlatformCoreExecutionObservationEvidenceRepositoryErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreExecutionObservationEvidenceRepositoryError({
    code,
    message,
    causeValue,
  });
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
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a non-empty string.`,
      value,
    );
  }

  return value;
}

function requireNullableString(
  value:
    unknown,
  field:
    string,
): string | null {
  if (
    value === null
  ) {
    return null;
  }

  return requireNonEmptyString(
    value,
    field,
  );
}

function normalizeCreatedAt(
  value:
    unknown,
): string {
  if (
    value instanceof Date
  ) {
    const millis =
      value.getTime();

    if (
      !Number.isFinite(
        millis,
      )
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "created_at is not a valid timestamp.",
        value,
      );
    }

    return value.toISOString();
  }

  if (
    typeof value !== "string"
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "created_at must be a timestamp.",
      value,
    );
  }

  const millis =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      millis,
    )
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "created_at is not a valid timestamp.",
      value,
    );
  }

  return new Date(
    millis,
  ).toISOString();
}

function isSerializationFailureMessage(
  error:
    string,
): boolean {
  const normalized =
    error.toLowerCase();

  return (
    normalized.includes(
      "serialization failure",
    )
    || normalized.includes(
      "sqlstate 40001",
    )
    || normalized.includes(
      "code 40001",
    )
    || normalized.includes(
      "40001",
    )
  );
}

function assertEvidenceReference(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string"
    || !EVIDENCE_REFERENCE_PATTERN.test(
      value,
    )
  ) {
    return failClosed(
      "INVALID_INPUT",
      "evidenceReference is not a canonical execution-observation evidence reference.",
      value,
    );
  }
}

function snapshotInputFromCanonicalEvidence(
  canonicalEvidenceUtf8:
    string,
): PlatformCoreExecutionObservationEvidenceReferenceInput {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        canonicalEvidenceUtf8,
      ) as unknown;
  } catch (
    error
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Derived canonical evidence UTF-8 could not be parsed.",
      error,
    );
  }

  /*
   * Re-deriving from this parsed value validates its complete runtime shape.
   * Crucially, this operates on the already-captured canonical evidence,
   * never on the caller's original object.
   */

  let replay:
    ReturnType<
      typeof derivePlatformCoreExecutionObservationEvidenceReference
    >;

  try {
    replay =
      derivePlatformCoreExecutionObservationEvidenceReference(
        parsed as
          PlatformCoreExecutionObservationEvidenceReferenceInput,
      );
  } catch (
    error
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Derived canonical evidence could not be revalidated.",
      error,
    );
  }

  if (
    replay.canonicalEvidenceUtf8
      !== canonicalEvidenceUtf8
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Canonical evidence replay changed its exact UTF-8 representation.",
      {
        original:
          canonicalEvidenceUtf8,

        replay:
          replay.canonicalEvidenceUtf8,
      },
    );
  }

  return Object.freeze(
    parsed as
      PlatformCoreExecutionObservationEvidenceReferenceInput,
  );
}

function deriveStableEvidenceMaterial(
  input:
    PlatformCoreExecutionObservationEvidenceRepositoryInput,
): StableEvidenceMaterial {
  let derived:
    ReturnType<
      typeof derivePlatformCoreExecutionObservationEvidenceReference
    >;

  try {
    derived =
      derivePlatformCoreExecutionObservationEvidenceReference(
        input,
      );
  } catch (
    error
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Observation event material is invalid.",
      error,
    );
  }

  const stableInput =
    snapshotInputFromCanonicalEvidence(
      derived.canonicalEvidenceUtf8,
    );

  const replay =
    derivePlatformCoreExecutionObservationEvidenceReference(
      stableInput,
    );

  if (
    replay.canonicalEvidenceUtf8
      !== derived.canonicalEvidenceUtf8
    || replay.evidenceSha256
      !== derived.evidenceSha256
    || replay.evidenceReference
      !== derived.evidenceReference
  ) {
    return failClosed(
      "INVALID_INPUT",
      "Stable evidence snapshot does not reproduce the derived observation identity.",
      {
        derived,
        replay,
      },
    );
  }

  return Object.freeze({
    input:
      stableInput,

    canonicalEvidenceUtf8:
      derived.canonicalEvidenceUtf8,

    evidenceSha256:
      derived.evidenceSha256,

    evidenceReference:
      derived.evidenceReference,
  });
}

function decodeEvidenceRow(
  row:
    EvidenceRow,
): PlatformCoreExecutionObservationEvidenceRecord {
  const evidenceReference =
    requireNonEmptyString(
      row.evidence_reference,
      "evidence_reference",
    );

  const executionId =
    requireNonEmptyString(
      row.execution_id,
      "execution_id",
    );

  if (
    row.execution_version !== 2
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted execution_version must equal 2.",
      row.execution_version,
    );
  }

  const executionSha256 =
    requireNonEmptyString(
      row.execution_sha256,
      "execution_sha256",
    );

  const executionEngineRef =
    requireNonEmptyString(
      row.execution_engine_ref,
      "execution_engine_ref",
    );

  const enforcementPointRef =
    requireNonEmptyString(
      row.enforcement_point_ref,
      "enforcement_point_ref",
    );

  const terminalStateObserved =
    requireNonEmptyString(
      row.terminal_state_observed,
      "terminal_state_observed",
    );

  const observationState =
    requireNonEmptyString(
      row.observation_state,
      "observation_state",
    );

  const stateRef =
    requireNullableString(
      row.state_ref,
      "state_ref",
    );

  const stateSha256 =
    requireNullableString(
      row.state_sha256,
      "state_sha256",
    );

  const observedAt =
    requireNonEmptyString(
      row.observed_at,
      "observed_at",
    );

  const createdAt =
    normalizeCreatedAt(
      row.created_at,
    );

  if (
    !EVIDENCE_REFERENCE_PATTERN.test(
      evidenceReference,
    )
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted evidence_reference has invalid syntax.",
      evidenceReference,
    );
  }

  if (
    !SHA256_PATTERN.test(
      executionSha256,
    )
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted execution_sha256 has invalid syntax.",
      executionSha256,
    );
  }

  const material =
    {
      executionId,
      executionVersion:
        2 as const,
      executionSha256,
      executionEngineRef,
      enforcementPointRef,
      terminalStateObserved,
      observationState,
      stateRef,
      stateSha256,
      observedAt,
    } as
      PlatformCoreExecutionObservationEvidenceReferenceInput;

  let derived:
    ReturnType<
      typeof derivePlatformCoreExecutionObservationEvidenceReference
    >;

  try {
    derived =
      derivePlatformCoreExecutionObservationEvidenceReference(
        material,
      );
  } catch (
    error
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted observation evidence material is invalid.",
      error,
    );
  }

  if (
    derived.evidenceReference
      !== evidenceReference
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted observation evidence failed content-address verification.",
      {
        persisted:
          evidenceReference,

        recomputed:
          derived.evidenceReference,
      },
    );
  }

  return Object.freeze({
    evidenceReference,
    executionId,
    executionVersion:
      2,
    executionSha256,
    executionEngineRef,
    enforcementPointRef,
    terminalStateObserved:
      material.terminalStateObserved,
    observationState:
      material.observationState,
    stateRef:
      material.stateRef,
    stateSha256:
      material.stateSha256,
    observedAt,
    createdAt,
  });
}

function exactEvidenceMatch(
  record:
    PlatformCoreExecutionObservationEvidenceRecord,
  material:
    StableEvidenceMaterial,
): boolean {
  const input =
    material.input;

  return (
    record.evidenceReference
      === material.evidenceReference
    && record.executionId
      === input.executionId
    && record.executionVersion
      === input.executionVersion
    && record.executionSha256
      === input.executionSha256
    && record.executionEngineRef
      === input.executionEngineRef
    && record.enforcementPointRef
      === input.enforcementPointRef
    && record.terminalStateObserved
      === input.terminalStateObserved
    && record.observationState
      === input.observationState
    && record.stateRef
      === input.stateRef
    && record.stateSha256
      === input.stateSha256
    && record.observedAt
      === input.observedAt
  );
}

function decodeAndVerifySnapshotRow(
  row:
    SnapshotRow,
  expectedStateRef:
    string,
  expectedStateSha256:
    string,
): void {
  const stateRef =
    requireNonEmptyString(
      row.state_ref,
      "snapshot.state_ref",
    );

  const stateSha256 =
    requireNonEmptyString(
      row.state_sha256,
      "snapshot.state_sha256",
    );

  const canonicalStateUtf8 =
    requireNonEmptyString(
      row.canonical_state_utf8,
      "snapshot.canonical_state_utf8",
    );

  if (
    !STATE_REF_PATTERN.test(
      stateRef,
    )
    || !SHA256_PATTERN.test(
      stateSha256,
    )
  ) {
    return failClosed(
      "SNAPSHOT_INVALID",
      "Durable state snapshot identity has invalid syntax.",
      {
        stateRef,
        stateSha256,
      },
    );
  }

  if (
    stateRef !==
      expectedStateRef
    || stateSha256 !==
      expectedStateSha256
  ) {
    return failClosed(
      "SNAPSHOT_INVALID",
      "Durable state snapshot identity does not match observation evidence.",
      {
        expectedStateRef,
        expectedStateSha256,
        stateRef,
        stateSha256,
      },
    );
  }

  let parsedState:
    unknown;

  try {
    parsedState =
      JSON.parse(
        canonicalStateUtf8,
      ) as unknown;
  } catch (
    error
  ) {
    return failClosed(
      "SNAPSHOT_INVALID",
      "Durable canonical state snapshot is not valid JSON.",
      error,
    );
  }

  let recomputed:
    ReturnType<
      typeof derivePlatformCoreCanonicalObservedStateReference
    >;

  try {
    recomputed =
      derivePlatformCoreCanonicalObservedStateReference(
        parsedState,
      );
  } catch (
    error
  ) {
    return failClosed(
      "SNAPSHOT_INVALID",
      "Durable canonical state snapshot cannot be re-derived.",
      error,
    );
  }

  if (
    recomputed.canonicalStateUtf8
      !== canonicalStateUtf8
    || recomputed.stateRef
      !== stateRef
    || recomputed.stateSha256
      !== stateSha256
  ) {
    return failClosed(
      "SNAPSHOT_INVALID",
      "Durable canonical state snapshot failed content-address verification.",
      {
        persisted: {
          stateRef,
          stateSha256,
          canonicalStateUtf8,
        },

        recomputed,
      },
    );
  }
}

async function verifyCapturedSnapshot(
  transaction:
    HbceTransactionContext,
  input:
    PlatformCoreExecutionObservationEvidenceReferenceInput,
): Promise<SnapshotVerification> {
  if (
    input.observationState !==
      "CAPTURED"
  ) {
    return {
      kind:
        "NOT_REQUIRED",
    };
  }

  if (
    input.stateRef === null
    || input.stateSha256 === null
  ) {
    return {
      kind:
        "INVALID",

      cause:
        "CAPTURED_WITHOUT_STATE_MATERIAL",
    };
  }

  const result =
    await transaction.query<SnapshotRow>(
      `
        SELECT
          state_ref,
          state_sha256,
          canonical_state_utf8
        FROM ${SNAPSHOT_TABLE}
        WHERE
          state_ref = $1
      `,
      [
        input.stateRef,
      ],
    );

  if (
    result.rows.length === 0
  ) {
    return {
      kind:
        "NOT_FOUND",
    };
  }

  if (
    result.rows.length !== 1
  ) {
    return {
      kind:
        "AMBIGUOUS",
    };
  }

  try {
    decodeAndVerifySnapshotRow(
      result.rows[0],
      input.stateRef,
      input.stateSha256,
    );
  } catch (
    error
  ) {
    return {
      kind:
        "INVALID",

      cause:
        error,
    };
  }

  return {
    kind:
      "VERIFIED",
  };
}

async function persistAttempt(
  transaction:
    HbceTransactionContext,
  material:
    StableEvidenceMaterial,
): Promise<PersistAttempt> {
  const snapshot =
    await verifyCapturedSnapshot(
      transaction,
      material.input,
    );

  if (
    snapshot.kind ===
      "NOT_FOUND"
  ) {
    return {
      kind:
        "SNAPSHOT_NOT_FOUND",
    };
  }

  if (
    snapshot.kind ===
      "AMBIGUOUS"
  ) {
    return {
      kind:
        "SNAPSHOT_AMBIGUOUS",
    };
  }

  if (
    snapshot.kind ===
      "INVALID"
  ) {
    return {
      kind:
        "SNAPSHOT_INVALID",

      cause:
        snapshot.cause,
    };
  }

  const input =
    material.input;

  const inserted =
    await transaction.query<EvidenceRow>(
      `
        INSERT INTO ${EVIDENCE_TABLE} (
          evidence_reference,
          execution_id,
          execution_version,
          execution_sha256,
          execution_engine_ref,
          enforcement_point_ref,
          terminal_state_observed,
          observation_state,
          state_ref,
          state_sha256,
          observed_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        ON CONFLICT DO NOTHING
        RETURNING
          evidence_reference,
          execution_id,
          execution_version,
          execution_sha256,
          execution_engine_ref,
          enforcement_point_ref,
          terminal_state_observed,
          observation_state,
          state_ref,
          state_sha256,
          observed_at,
          created_at
      `,
      [
        material.evidenceReference,
        input.executionId,
        input.executionVersion,
        input.executionSha256,
        input.executionEngineRef,
        input.enforcementPointRef,
        input.terminalStateObserved,
        input.observationState,
        input.stateRef,
        input.stateSha256,
        input.observedAt,
      ],
    );

  if (
    inserted.rows.length === 1
  ) {
    return {
      kind:
        "INSERTED",

      row:
        inserted.rows[0],
    };
  }

  if (
    inserted.rows.length !== 0
  ) {
    return {
      kind:
        "AMBIGUOUS",
    };
  }

  const existing =
    await transaction.query<EvidenceRow>(
      `
        SELECT
          evidence_reference,
          execution_id,
          execution_version,
          execution_sha256,
          execution_engine_ref,
          enforcement_point_ref,
          terminal_state_observed,
          observation_state,
          state_ref,
          state_sha256,
          observed_at,
          created_at
        FROM ${EVIDENCE_TABLE}
        WHERE
          evidence_reference = $1
      `,
      [
        material.evidenceReference,
      ],
    );

  if (
    existing.rows.length === 1
  ) {
    return {
      kind:
        "EXISTING",

      row:
        existing.rows[0],
    };
  }

  return {
    kind:
      "AMBIGUOUS",
  };
}

async function readAttempt(
  transaction:
    HbceTransactionContext,
  evidenceReference:
    string,
): Promise<ReadAttempt> {
  const result =
    await transaction.query<EvidenceRow>(
      `
        SELECT
          evidence_reference,
          execution_id,
          execution_version,
          execution_sha256,
          execution_engine_ref,
          enforcement_point_ref,
          terminal_state_observed,
          observation_state,
          state_ref,
          state_sha256,
          observed_at,
          created_at
        FROM ${EVIDENCE_TABLE}
        WHERE
          evidence_reference = $1
      `,
      [
        evidenceReference,
      ],
    );

  if (
    result.rows.length === 0
  ) {
    return {
      kind:
        "NOT_FOUND",
    };
  }

  if (
    result.rows.length !== 1
  ) {
    return {
      kind:
        "AMBIGUOUS",
    };
  }

  let record:
    PlatformCoreExecutionObservationEvidenceRecord;

  try {
    record =
      decodeEvidenceRow(
        result.rows[0],
      );
  } catch (
    error
  ) {
    return {
      kind:
        "EVIDENCE_INVALID",

      cause:
        error,
    };
  }

  const material:
    PlatformCoreExecutionObservationEvidenceReferenceInput =
    Object.freeze({
      executionId:
        record.executionId,

      executionVersion:
        2,

      executionSha256:
        record.executionSha256,

      executionEngineRef:
        record.executionEngineRef,

      enforcementPointRef:
        record.enforcementPointRef,

      terminalStateObserved:
        record.terminalStateObserved,

      observationState:
        record.observationState,

      stateRef:
        record.stateRef,

      stateSha256:
        record.stateSha256,

      observedAt:
        record.observedAt,
    });

  const snapshot =
    await verifyCapturedSnapshot(
      transaction,
      material,
    );

  if (
    snapshot.kind ===
      "NOT_FOUND"
  ) {
    return {
      kind:
        "SNAPSHOT_NOT_FOUND",
    };
  }

  if (
    snapshot.kind ===
      "AMBIGUOUS"
  ) {
    return {
      kind:
        "SNAPSHOT_AMBIGUOUS",
    };
  }

  if (
    snapshot.kind ===
      "INVALID"
  ) {
    return {
      kind:
        "SNAPSHOT_INVALID",

      cause:
        snapshot.cause,
    };
  }

  return {
    kind:
      "FOUND",

    record,
  };
}

export async function persistPlatformCoreExecutionObservationEvidence(
  input:
    PlatformCoreExecutionObservationEvidenceRepositoryInput,
): Promise<PlatformCoreExecutionObservationEvidencePersistence> {
  const material =
    deriveStableEvidenceMaterial(
      input,
    );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          persistAttempt(
            transaction,
            material,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_TRANSACTION_ISOLATION,
        },
      );

    if (
      !outcome.ok
    ) {
      if (
        isSerializationFailureMessage(
          outcome.error,
        )
      ) {
        if (
          attempt <
            PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS
        ) {
          continue;
        }

        return failClosed(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Execution observation evidence persistence exhausted serialization retries.",
          outcome,
        );
      }

      return failClosed(
        "DATABASE_FAILURE",
        "Execution observation evidence persistence transaction failed.",
        outcome,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_NOT_FOUND"
    ) {
      return failClosed(
        "SNAPSHOT_NOT_FOUND",
        "CAPTURED observation evidence requires an existing durable canonical state snapshot.",
        material.input.stateRef,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Canonical state snapshot lookup returned an ambiguous durable result.",
        material.input.stateRef,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_INVALID"
    ) {
      return failClosed(
        "SNAPSHOT_INVALID",
        "Canonical state snapshot failed content-address verification.",
        outcome.value.cause,
      );
    }

    if (
      outcome.value.kind ===
        "AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Execution observation evidence persistence produced an ambiguous durable result.",
        outcome.value,
      );
    }

    const record =
      decodeEvidenceRow(
        outcome.value.row,
      );

    if (
      !exactEvidenceMatch(
        record,
        material,
      )
    ) {
      return failClosed(
        outcome.value.kind ===
          "EXISTING"
          ? "EXISTING_EVIDENCE_MISMATCH"
          : "PERSISTENCE_AMBIGUITY",
        "Durable execution observation evidence does not match derived event material.",
        {
          record,
          material,
        },
      );
    }

    return Object.freeze({
      ...record,

      idempotentReplay:
        outcome.value.kind ===
          "EXISTING",
    });
  }

  return failClosed(
    "SERIALIZATION_RETRY_EXHAUSTED",
    "Execution observation evidence persistence reached an unreachable retry state.",
  );
}

export async function readPlatformCoreExecutionObservationEvidence(
  evidenceReference:
    string,
): Promise<PlatformCoreExecutionObservationEvidenceRecord | null> {
  assertEvidenceReference(
    evidenceReference,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          readAttempt(
            transaction,
            evidenceReference,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_TRANSACTION_ISOLATION,

          readOnly:
            true,
        },
      );

    if (
      !outcome.ok
    ) {
      if (
        isSerializationFailureMessage(
          outcome.error,
        )
      ) {
        if (
          attempt <
            PLATFORM_CORE_EXECUTION_OBSERVATION_EVIDENCE_MAX_ATTEMPTS
        ) {
          continue;
        }

        return failClosed(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Execution observation evidence read exhausted serialization retries.",
          outcome,
        );
      }

      return failClosed(
        "DATABASE_FAILURE",
        "Execution observation evidence read transaction failed.",
        outcome,
      );
    }

    if (
      outcome.value.kind ===
        "NOT_FOUND"
    ) {
      return null;
    }

    if (
      outcome.value.kind ===
        "EVIDENCE_INVALID"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Persisted execution observation evidence failed read-back derivation.",
        outcome.value.cause,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_NOT_FOUND"
    ) {
      return failClosed(
        "SNAPSHOT_NOT_FOUND",
        "Persisted CAPTURED observation evidence references a missing state snapshot.",
        evidenceReference,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Persisted CAPTURED observation evidence resolved to an ambiguous state snapshot.",
        evidenceReference,
      );
    }

    if (
      outcome.value.kind ===
        "SNAPSHOT_INVALID"
    ) {
      return failClosed(
        "SNAPSHOT_INVALID",
        "Persisted CAPTURED observation evidence references an invalid state snapshot.",
        outcome.value.cause,
      );
    }

    if (
      outcome.value.kind ===
        "AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Execution observation evidence read returned an ambiguous durable result.",
        evidenceReference,
      );
    }

    if (
      outcome.value.record.evidenceReference
        !== evidenceReference
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Execution observation evidence read returned a different evidence_reference.",
        {
          requested:
            evidenceReference,

          returned:
            outcome.value.record.evidenceReference,
        },
      );
    }

    return outcome.value.record;
  }

  return failClosed(
    "SERIALIZATION_RETRY_EXHAUSTED",
    "Execution observation evidence read reached an unreachable retry state.",
  );
}
