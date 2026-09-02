import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

import {
  derivePlatformCoreCanonicalObservedStateReference,
  type PlatformCoreCanonicalObservedStateReference,
} from "./canonical-observed-state-reference";

export const PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-STATE-SNAPSHOT-REPOSITORY-v1" as const;

export const PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS =
  3 as const;

const TABLE =
  "public.hbce_platform_core_canonical_state_snapshots" as const;

const STATE_REF_PATTERN =
  /^HBCE:STATE:OBSERVED:V1:SHA256:[0-9A-F]{64}$/;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

export type PlatformCoreCanonicalStateSnapshotRecord =
  Readonly<{
    stateRef:
      string;

    stateSha256:
      string;

    canonicalStateUtf8:
      string;

    createdAt:
      string;
  }>;

export type PlatformCoreCanonicalStateSnapshotEvidence =
  Readonly<
    PlatformCoreCanonicalStateSnapshotRecord
    & {
      idempotentReplay:
        boolean;
    }
  >;

export type PlatformCoreCanonicalStateSnapshotRepositoryErrorCode =
  | "INVALID_INPUT"
  | "EXISTING_SNAPSHOT_MISMATCH"
  | "PERSISTENCE_AMBIGUITY"
  | "SERIALIZATION_RETRY_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreCanonicalStateSnapshotRepositoryError
  extends Error {
  readonly code:
    PlatformCoreCanonicalStateSnapshotRepositoryErrorCode;

  readonly causeValue:
    unknown;

  constructor(input: {
    code:
      PlatformCoreCanonicalStateSnapshotRepositoryErrorCode;

    message:
      string;

    causeValue?:
      unknown;
  }) {
    super(
      input.message,
    );

    this.name =
      "PlatformCoreCanonicalStateSnapshotRepositoryError";

    this.code =
      input.code;

    this.causeValue =
      input.causeValue;
  }
}

type SnapshotRow = {
  readonly state_ref:
    unknown;

  readonly state_sha256:
    unknown;

  readonly canonical_state_utf8:
    unknown;

  readonly created_at:
    unknown;
};

type PersistAttempt =
  | Readonly<{
      kind:
        "INSERTED";

      row:
        SnapshotRow;
    }>
  | Readonly<{
      kind:
        "EXISTING";

      row:
        SnapshotRow;
    }>
  | Readonly<{
      kind:
        "AMBIGUOUS";
    }>;

type ReadAttempt =
  | Readonly<{
      kind:
        "FOUND";

      row:
        SnapshotRow;
    }>
  | Readonly<{
      kind:
        "NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "AMBIGUOUS";
    }>;

function failClosed(
  code:
    PlatformCoreCanonicalStateSnapshotRepositoryErrorCode,
  message:
    string,
  causeValue?:
    unknown,
): never {
  throw new PlatformCoreCanonicalStateSnapshotRepositoryError({
    code,
    message,
    causeValue,
  });
}

function requireString(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !== "string"
    || value.length === 0
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a non-empty string.`,
      value,
    );
  }

  return value;
}

function normalizeTimestamp(
  value:
    unknown,
  field:
    string,
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
      failClosed(
        "PERSISTENCE_AMBIGUITY",
        `${field} is not a valid timestamp.`,
        value,
      );
    }

    return value.toISOString();
  }

  if (
    typeof value !== "string"
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} must be a timestamp.`,
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
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      `${field} is not a valid timestamp.`,
      value,
    );
  }

  return new Date(
    millis,
  ).toISOString();
}

function assertStateRef(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !== "string"
    || !STATE_REF_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "stateRef is not a canonical observed-state reference.",
      value,
    );
  }
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

function deriveSnapshotMaterial(
  observedState:
    unknown,
): PlatformCoreCanonicalObservedStateReference {
  try {
    return derivePlatformCoreCanonicalObservedStateReference(
      observedState,
    );
  } catch (
    error
  ) {
    return failClosed(
      "INVALID_INPUT",
      "observedState cannot be represented as canonical Platform Core state.",
      error,
    );
  }
}

function decodeSnapshotRow(
  row:
    SnapshotRow,
): PlatformCoreCanonicalStateSnapshotRecord {
  const stateRef =
    requireString(
      row.state_ref,
      "state_ref",
    );

  const stateSha256 =
    requireString(
      row.state_sha256,
      "state_sha256",
    );

  const canonicalStateUtf8 =
    requireString(
      row.canonical_state_utf8,
      "canonical_state_utf8",
    );

  const createdAt =
    normalizeTimestamp(
      row.created_at,
      "created_at",
    );

  if (
    !STATE_REF_PATTERN.test(
      stateRef,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted state_ref has invalid syntax.",
      stateRef,
    );
  }

  if (
    !SHA256_PATTERN.test(
      stateSha256,
    )
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted state_sha256 has invalid syntax.",
      stateSha256,
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
      "PERSISTENCE_AMBIGUITY",
      "Persisted canonical_state_utf8 is not valid JSON.",
      error,
    );
  }

  let recomputed:
    PlatformCoreCanonicalObservedStateReference;

  try {
    recomputed =
      derivePlatformCoreCanonicalObservedStateReference(
        parsedState,
      );
  } catch (
    error
  ) {
    return failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted canonical state cannot be re-derived.",
      error,
    );
  }

  if (
    recomputed.canonicalStateUtf8
      !== canonicalStateUtf8
    || recomputed.stateSha256
      !== stateSha256
    || recomputed.stateRef
      !== stateRef
  ) {
    failClosed(
      "PERSISTENCE_AMBIGUITY",
      "Persisted canonical state failed content-address verification.",
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

  return Object.freeze({
    stateRef,
    stateSha256,
    canonicalStateUtf8,
    createdAt,
  });
}

function exactSnapshotMatch(
  record:
    PlatformCoreCanonicalStateSnapshotRecord,
  expected:
    PlatformCoreCanonicalObservedStateReference,
): boolean {
  return (
    record.stateRef
      === expected.stateRef
    && record.stateSha256
      === expected.stateSha256
    && record.canonicalStateUtf8
      === expected.canonicalStateUtf8
  );
}

async function persistAttempt(
  transaction:
    HbceTransactionContext,
  material:
    PlatformCoreCanonicalObservedStateReference,
): Promise<PersistAttempt> {
  const inserted =
    await transaction.query<SnapshotRow>(
      `
        INSERT INTO ${TABLE} (
          state_ref,
          state_sha256,
          canonical_state_utf8
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT DO NOTHING
        RETURNING
          state_ref,
          state_sha256,
          canonical_state_utf8,
          created_at
      `,
      [
        material.stateRef,
        material.stateSha256,
        material.canonicalStateUtf8,
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
    await transaction.query<SnapshotRow>(
      `
        SELECT
          state_ref,
          state_sha256,
          canonical_state_utf8,
          created_at
        FROM ${TABLE}
        WHERE
          state_ref = $1
          OR state_sha256 = $2
        ORDER BY
          state_ref ASC
      `,
      [
        material.stateRef,
        material.stateSha256,
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
  stateRef:
    string,
): Promise<ReadAttempt> {
  const result =
    await transaction.query<SnapshotRow>(
      `
        SELECT
          state_ref,
          state_sha256,
          canonical_state_utf8,
          created_at
        FROM ${TABLE}
        WHERE
          state_ref = $1
      `,
      [
        stateRef,
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

  return {
    kind:
      "FOUND",

    row:
      result.rows[0],
  };
}

export async function persistPlatformCoreCanonicalStateSnapshot(
  observedState:
    unknown,
): Promise<PlatformCoreCanonicalStateSnapshotEvidence> {
  const material =
    deriveSnapshotMaterial(
      observedState,
    );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS;
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
            PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_TRANSACTION_ISOLATION,
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
          PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS
        ) {
          continue;
        }

        return failClosed(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Canonical state snapshot persistence exhausted serialization retries.",
          outcome,
        );
      }

      return failClosed(
        "DATABASE_FAILURE",
        "Canonical state snapshot persistence transaction failed.",
        outcome,
      );
    }

    if (
      outcome.value.kind ===
        "AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Canonical state snapshot persistence produced an ambiguous durable result.",
        outcome.value,
      );
    }

    const record =
      decodeSnapshotRow(
        outcome.value.row,
      );

    if (
      !exactSnapshotMatch(
        record,
        material,
      )
    ) {
      return failClosed(
        outcome.value.kind ===
          "EXISTING"
          ? "EXISTING_SNAPSHOT_MISMATCH"
          : "PERSISTENCE_AMBIGUITY",
        "Durable canonical state snapshot does not match derived observed state.",
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
    "Canonical state snapshot persistence reached an unreachable retry state.",
  );
}

export async function readPlatformCoreCanonicalStateSnapshot(
  stateRef:
    string,
): Promise<PlatformCoreCanonicalStateSnapshotRecord | null> {
  assertStateRef(
    stateRef,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          readAttempt(
            transaction,
            stateRef,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_TRANSACTION_ISOLATION,

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
          PLATFORM_CORE_CANONICAL_STATE_SNAPSHOT_MAX_ATTEMPTS
        ) {
          continue;
        }

        return failClosed(
          "SERIALIZATION_RETRY_EXHAUSTED",
          "Canonical state snapshot read exhausted serialization retries.",
          outcome,
        );
      }

      return failClosed(
        "DATABASE_FAILURE",
        "Canonical state snapshot read transaction failed.",
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
        "AMBIGUOUS"
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Canonical state snapshot read returned an ambiguous durable result.",
        outcome.value,
      );
    }

    const record =
      decodeSnapshotRow(
        outcome.value.row,
      );

    if (
      record.stateRef !==
        stateRef
    ) {
      return failClosed(
        "PERSISTENCE_AMBIGUITY",
        "Canonical state snapshot read returned a different state_ref.",
        {
          requested:
            stateRef,

          returned:
            record.stateRef,
        },
      );
    }

    return record;
  }

  return failClosed(
    "SERIALIZATION_RETRY_EXHAUSTED",
    "Canonical state snapshot read reached an unreachable retry state.",
  );
}
