import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

import {
  canonicalizePlatformCorePayloadPreimage,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_AUTHORITY_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-AUTHORITY-REPOSITORY-v1" as const;

export const PLATFORM_CORE_AUTHORITY_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_AUTHORITY_MAX_ATTEMPTS =
  3 as const;

const TABLE =
  "public.hbce_platform_core_authorities" as const;

const AUTHORITY_ID_PATTERN =
  /^AUT-[0-9A-Z:_.-]+$/;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

export const PLATFORM_CORE_AUTHORITY_STATES = [
  "DRAFT",
  "PENDING",
  "ACTIVE",
  "LIMITED",
  "SUSPENDED",
  "CONTESTED",
  "COMPROMISED",
  "EXPIRED",
  "REVOKED",
  "SUPERSEDED",
  "UNKNOWN",
] as const;

export type PlatformCoreAuthorityState =
  (typeof PLATFORM_CORE_AUTHORITY_STATES)[number];

export type PlatformCoreCanonicalAuthority =
  Readonly<
    Record<string, unknown>
    & {
      readonly authority_id:
        string;

      readonly authority_version:
        number;

      readonly payload_sha256:
        string;

      readonly state:
        PlatformCoreAuthorityState;
    }
  >;

export type PlatformCoreAuthorityRepositoryErrorCode =
  | "INVALID_INPUT"
  | "STATIC_SCHEMA_VALIDATION_FAILED"
  | "PAYLOAD_HASH_MISMATCH"
  | "CONFLICTING_DUPLICATE"
  | "PERSISTED_RECORD_INVALID"
  | "SERIALIZATION_RETRIES_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreAuthorityRepositoryError
  extends Error {
  readonly code:
    PlatformCoreAuthorityRepositoryErrorCode;

  constructor(
    code:
      PlatformCoreAuthorityRepositoryErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreAuthorityRepositoryError";

    this.code =
      code;
  }
}

export type PlatformCoreAuthorityPersistence =
  Readonly<{
    authority:
      PlatformCoreCanonicalAuthority;

    persistedAt:
      string;

    idempotentReplay:
      boolean;
  }>;

type AuthorityRow = {
  readonly authority_id:
    unknown;

  readonly authority_version:
    unknown;

  readonly payload_sha256:
    unknown;

  readonly canonical_payload_preimage_utf8:
    unknown;

  readonly state:
    unknown;

  readonly persisted_at:
    unknown;
};

type StableAuthorityMaterial =
  Readonly<{
    canonical:
      PlatformCoreCanonicalAuthority;

    canonicalPayloadPreimageUtf8:
      string;

    payloadSha256:
      string;
  }>;

type DecodedAuthorityRow =
  Readonly<{
    canonical:
      PlatformCoreCanonicalAuthority;

    canonicalPayloadPreimageUtf8:
      string;

    payloadSha256:
      string;

    persistedAt:
      string;
  }>;

type SafeDecodedAuthorityRow =
  | Readonly<{
      ok:
        true;

      decoded:
        DecodedAuthorityRow;
    }>
  | Readonly<{
      ok:
        false;
    }>;

type PersistAttempt =
  | Readonly<{
      kind:
        "INSERTED";

      decoded:
        DecodedAuthorityRow;
    }>
  | Readonly<{
      kind:
        "EXISTING";

      decoded:
        DecodedAuthorityRow;
    }>
  | Readonly<{
      kind:
        "PERSISTED_INVALID";
    }>
  | Readonly<{
      kind:
        "CONFLICTING_DUPLICATE";
    }>;

type ReadAttempt =
  | Readonly<{
      kind:
        "NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "FOUND";

      decoded:
        DecodedAuthorityRow;
    }>
  | Readonly<{
      kind:
        "PERSISTED_INVALID";
    }>;

function failClosed(
  code:
    PlatformCoreAuthorityRepositoryErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreAuthorityRepositoryError(
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
    || typeof value !==
      "object"
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
    prototype ===
      Object.prototype
    || prototype ===
      null
  );
}

function deepFreeze<T>(
  value:
    T,
  seen:
    WeakSet<object> =
      new WeakSet<object>(),
): T {
  if (
    value === null
    || typeof value !==
      "object"
  ) {
    return value;
  }

  const object =
    value as object;

  if (
    seen.has(
      object,
    )
  ) {
    return value;
  }

  seen.add(
    object,
  );

  for (
    const child of
      Object.values(
        value as
          Record<string, unknown>,
      )
  ) {
    deepFreeze(
      child,
      seen,
    );
  }

  return Object.freeze(
    value,
  ) as T;
}

function requirePersistedString(
  value:
    unknown,
  field:
    string,
): string {
  if (
    typeof value !==
      "string"
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      `Persisted ${field} must be a string.`,
    );
  }

  return value;
}

function requirePersistedSafeInteger(
  value:
    unknown,
  field:
    string,
): number {
  if (
    typeof value !==
      "number"
    || !Number.isSafeInteger(
      value,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      `Persisted ${field} must be a safe integer.`,
    );
  }

  return value;
}

function normalizePersistedTimestamp(
  value:
    unknown,
  field:
    string,
): string {
  if (
    value instanceof
      Date
  ) {
    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        `Persisted ${field} is an invalid Date.`,
      );
    }

    return value.toISOString();
  }

  if (
    typeof value !==
      "string"
    || value.length ===
      0
    || Number.isNaN(
      Date.parse(
        value,
      ),
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      `Persisted ${field} is not a valid timestamp.`,
    );
  }

  return new Date(
    value,
  ).toISOString();
}

function isAuthorityState(
  value:
    unknown,
): value is PlatformCoreAuthorityState {
  return (
    typeof value ===
      "string"
    && (
      PLATFORM_CORE_AUTHORITY_STATES as
        readonly string[]
    ).includes(
      value,
    )
  );
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

function assertAuthorityId(
  authorityId:
    unknown,
): asserts authorityId is string {
  if (
    typeof authorityId !==
      "string"
    || authorityId.length <
      5
    || authorityId.length >
      128
    || !AUTHORITY_ID_PATTERN.test(
      authorityId,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Authority identifier is invalid.",
    );
  }
}

function assertAuthorityVersion(
  authorityVersion:
    unknown,
): asserts authorityVersion is number {
  if (
    typeof authorityVersion !==
      "number"
    || !Number.isSafeInteger(
      authorityVersion,
    )
    || authorityVersion <
      1
  ) {
    failClosed(
      "INVALID_INPUT",
      "Authority version must be a positive safe integer.",
    );
  }
}

function assertCanonicalInput(
  value:
    unknown,
): asserts value is
  PlatformCoreCanonicalAuthority {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical Authority input must be a plain object.",
    );
  }

  const validation =
    validatePlatformCoreCanonicalSchema(
      "AUTHORITY",
      value,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "STATIC_SCHEMA_VALIDATION_FAILED",
      "Canonical Authority input failed static schema validation.",
    );
  }

  let hashValid:
    boolean;

  try {
    hashValid =
      verifyPlatformCorePayloadSha256(
        value,
      );
  } catch {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Canonical Authority payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Canonical Authority payload hash does not match its canonical preimage.",
    );
  }
}

function deriveStableMaterial(
  value:
    unknown,
): StableAuthorityMaterial {
  assertCanonicalInput(
    value,
  );

  let canonicalPayloadPreimageUtf8:
    string;

  try {
    canonicalPayloadPreimageUtf8 =
      canonicalizePlatformCorePayloadPreimage(
        value,
      );
  } catch {
    failClosed(
      "INVALID_INPUT",
      "Canonical Authority preimage could not be produced.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        canonicalPayloadPreimageUtf8,
      ) as unknown;
  } catch {
    failClosed(
      "INVALID_INPUT",
      "Canonical Authority preimage could not be reconstructed.",
    );
  }

  if (
    !isPlainRecord(
      parsed,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical Authority preimage did not reconstruct a plain object.",
    );
  }

  const reconstructed:
    Record<string, unknown> = {
      ...parsed,

      payload_sha256:
        value.payload_sha256,
    };

  const validation =
    validatePlatformCoreCanonicalSchema(
      "AUTHORITY",
      reconstructed,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "STATIC_SCHEMA_VALIDATION_FAILED",
      "Reconstructed canonical Authority failed static schema validation.",
    );
  }

  let hashValid:
    boolean;

  try {
    hashValid =
      verifyPlatformCorePayloadSha256(
        reconstructed,
      );
  } catch {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Reconstructed canonical Authority payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Reconstructed canonical Authority payload hash does not match.",
    );
  }

  let recomputedPreimage:
    string;

  try {
    recomputedPreimage =
      canonicalizePlatformCorePayloadPreimage(
        reconstructed,
      );
  } catch {
    failClosed(
      "INVALID_INPUT",
      "Reconstructed canonical Authority preimage could not be reproduced.",
    );
  }

  if (
    recomputedPreimage !==
      canonicalPayloadPreimageUtf8
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical Authority preimage is not deterministic.",
    );
  }

  const canonical =
    deepFreeze(
      reconstructed as
        PlatformCoreCanonicalAuthority,
    );

  assertAuthorityId(
    canonical.authority_id,
  );

  assertAuthorityVersion(
    canonical.authority_version,
  );

  if (
    !SHA256_PATTERN.test(
      canonical.payload_sha256,
    )
  ) {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Canonical Authority payload_sha256 has invalid syntax.",
    );
  }

  if (
    !isAuthorityState(
      canonical.state,
    )
  ) {
    failClosed(
      "STATIC_SCHEMA_VALIDATION_FAILED",
      "Canonical Authority state is invalid.",
    );
  }

  return Object.freeze({
    canonical,

    canonicalPayloadPreimageUtf8,

    payloadSha256:
      canonical.payload_sha256,
  });
}

function decodeAuthorityRow(
  row:
    AuthorityRow,
): DecodedAuthorityRow {
  const authorityId =
    requirePersistedString(
      row.authority_id,
      "authority_id",
    );

  const authorityVersion =
    requirePersistedSafeInteger(
      row.authority_version,
      "authority_version",
    );

  const payloadSha256 =
    requirePersistedString(
      row.payload_sha256,
      "payload_sha256",
    );

  const canonicalPayloadPreimageUtf8 =
    requirePersistedString(
      row.canonical_payload_preimage_utf8,
      "canonical_payload_preimage_utf8",
    );

  const state =
    requirePersistedString(
      row.state,
      "state",
    );

  const persistedAt =
    normalizePersistedTimestamp(
      row.persisted_at,
      "persisted_at",
    );

  if (
    !AUTHORITY_ID_PATTERN.test(
      authorityId,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted authority_id has invalid syntax.",
    );
  }

  if (
    authorityVersion <
      1
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted authority_version is invalid.",
    );
  }

  if (
    !SHA256_PATTERN.test(
      payloadSha256,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted payload_sha256 has invalid syntax.",
    );
  }

  if (
    canonicalPayloadPreimageUtf8.length ===
      0
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical Authority preimage is empty.",
    );
  }

  if (
    !isAuthorityState(
      state,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority state is invalid.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        canonicalPayloadPreimageUtf8,
      ) as unknown;
  } catch {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical Authority preimage is not valid JSON.",
    );
  }

  if (
    !isPlainRecord(
      parsed,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical Authority preimage did not decode to a plain object.",
    );
  }

  const reconstructed:
    Record<string, unknown> = {
      ...parsed,

      payload_sha256:
        payloadSha256,
    };

  const validation =
    validatePlatformCoreCanonicalSchema(
      "AUTHORITY",
      reconstructed,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority failed static schema validation.",
    );
  }

  let hashValid:
    boolean;

  try {
    hashValid =
      verifyPlatformCorePayloadSha256(
        reconstructed,
      );
  } catch {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority payload hash does not match.",
    );
  }

  let recomputedPreimage:
    string;

  try {
    recomputedPreimage =
      canonicalizePlatformCorePayloadPreimage(
        reconstructed,
      );
  } catch {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority canonical preimage could not be reproduced.",
    );
  }

  if (
    recomputedPreimage !==
      canonicalPayloadPreimageUtf8
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority preimage is not the exact canonical UTF-8 representation.",
    );
  }

  const canonical =
    deepFreeze(
      reconstructed as
        PlatformCoreCanonicalAuthority,
    );

  if (
    canonical.authority_id !==
      authorityId
    || canonical.authority_version !==
      authorityVersion
    || canonical.payload_sha256 !==
      payloadSha256
    || canonical.state !==
      state
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted Authority extracted columns do not match canonical content.",
    );
  }

  return Object.freeze({
    canonical,

    canonicalPayloadPreimageUtf8,

    payloadSha256,

    persistedAt,
  });
}

function safeDecodeAuthorityRow(
  row:
    AuthorityRow,
): SafeDecodedAuthorityRow {
  try {
    return Object.freeze({
      ok:
        true,

      decoded:
        decodeAuthorityRow(
          row,
        ),
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreAuthorityRepositoryError
    ) {
      return Object.freeze({
        ok:
          false,
      });
    }

    return Object.freeze({
      ok:
        false,
    });
  }
}

function exactDecodedMatch(
  decoded:
    DecodedAuthorityRow,
  material:
    StableAuthorityMaterial,
): boolean {
  return (
    decoded.canonical.authority_id ===
      material.canonical.authority_id
    && decoded.canonical.authority_version ===
      material.canonical.authority_version
    && decoded.payloadSha256 ===
      material.payloadSha256
    && decoded.canonicalPayloadPreimageUtf8 ===
      material.canonicalPayloadPreimageUtf8
    && decoded.canonical.state ===
      material.canonical.state
  );
}

async function persistAttempt(
  transaction:
    HbceTransactionContext,
  material:
    StableAuthorityMaterial,
): Promise<PersistAttempt> {
  const canonical =
    material.canonical;

  const inserted =
    await transaction.query<AuthorityRow>(
      `
        INSERT INTO ${TABLE} (
          authority_id,
          authority_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT DO NOTHING
        RETURNING
          authority_id,
          authority_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          persisted_at
      `,
      [
        canonical.authority_id,
        canonical.authority_version,
        material.payloadSha256,
        material.canonicalPayloadPreimageUtf8,
        canonical.state,
      ],
    );

  if (
    inserted.rows.length ===
      1
  ) {
    const decoded =
      safeDecodeAuthorityRow(
        inserted.rows[0],
      );

    if (
      !decoded.ok
    ) {
      return Object.freeze({
        kind:
          "PERSISTED_INVALID",
      });
    }

    if (
      !exactDecodedMatch(
        decoded.decoded,
        material,
      )
    ) {
      return Object.freeze({
        kind:
          "PERSISTED_INVALID",
      });
    }

    return Object.freeze({
      kind:
        "INSERTED",

      decoded:
        decoded.decoded,
    });
  }

  if (
    inserted.rows.length !==
      0
  ) {
    return Object.freeze({
      kind:
        "CONFLICTING_DUPLICATE",
    });
  }

  const existing =
    await transaction.query<AuthorityRow>(
      `
        SELECT
          authority_id,
          authority_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          persisted_at
        FROM ${TABLE}
        WHERE
          (
            authority_id = $1
            AND authority_version = $2
          )
          OR payload_sha256 = $3
        ORDER BY
          authority_id ASC,
          authority_version ASC
      `,
      [
        canonical.authority_id,
        canonical.authority_version,
        material.payloadSha256,
      ],
    );

  if (
    existing.rows.length !==
      1
  ) {
    return Object.freeze({
      kind:
        "CONFLICTING_DUPLICATE",
    });
  }

  const decoded =
    safeDecodeAuthorityRow(
      existing.rows[0],
    );

  if (
    !decoded.ok
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  if (
    !exactDecodedMatch(
      decoded.decoded,
      material,
    )
  ) {
    return Object.freeze({
      kind:
        "CONFLICTING_DUPLICATE",
    });
  }

  return Object.freeze({
    kind:
      "EXISTING",

    decoded:
      decoded.decoded,
  });
}

async function readAttempt(
  transaction:
    HbceTransactionContext,
  authorityId:
    string,
  authorityVersion:
    number,
): Promise<ReadAttempt> {
  const result =
    await transaction.query<AuthorityRow>(
      `
        SELECT
          authority_id,
          authority_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          persisted_at
        FROM ${TABLE}
        WHERE
          authority_id = $1
          AND authority_version = $2
      `,
      [
        authorityId,
        authorityVersion,
      ],
    );

  if (
    result.rows.length ===
      0
  ) {
    return Object.freeze({
      kind:
        "NOT_FOUND",
    });
  }

  if (
    result.rows.length !==
      1
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  const decoded =
    safeDecodeAuthorityRow(
      result.rows[0],
    );

  if (
    !decoded.ok
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  if (
    decoded.decoded.canonical.authority_id !==
      authorityId
    || decoded.decoded.canonical.authority_version !==
      authorityVersion
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  return Object.freeze({
    kind:
      "FOUND",

    decoded:
      decoded.decoded,
  });
}

export async function persistPlatformCoreCanonicalAuthority(
  canonicalAuthority:
    unknown,
): Promise<PlatformCoreAuthorityPersistence> {
  const material =
    deriveStableMaterial(
      canonicalAuthority,
    );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_AUTHORITY_MAX_ATTEMPTS;
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
            PLATFORM_CORE_AUTHORITY_TRANSACTION_ISOLATION,
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
            PLATFORM_CORE_AUTHORITY_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "Authority persistence exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "Authority persistence transaction failed.",
      );
    }

    if (
      outcome.value.kind ===
        "CONFLICTING_DUPLICATE"
    ) {
      failClosed(
        "CONFLICTING_DUPLICATE",
        "Authority durable identity or payload hash conflicts with different canonical material.",
      );
    }

    if (
      outcome.value.kind ===
        "PERSISTED_INVALID"
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted Authority row failed canonical read-back verification.",
      );
    }

    return Object.freeze({
      authority:
        outcome.value.decoded.canonical,

      persistedAt:
        outcome.value.decoded.persistedAt,

      idempotentReplay:
        outcome.value.kind ===
          "EXISTING",
    });
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "Authority persistence reached an unreachable retry state.",
  );
}

export async function readPlatformCoreCanonicalAuthority(
  authorityId:
    unknown,
  authorityVersion:
    unknown,
): Promise<
  PlatformCoreCanonicalAuthority | null
> {
  assertAuthorityId(
    authorityId,
  );

  assertAuthorityVersion(
    authorityVersion,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_AUTHORITY_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          readAttempt(
            transaction,
            authorityId,
            authorityVersion,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_AUTHORITY_TRANSACTION_ISOLATION,

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
            PLATFORM_CORE_AUTHORITY_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "Authority read exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "Authority read transaction failed.",
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
        "PERSISTED_INVALID"
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted Authority revision failed canonical verification.",
      );
    }

    return outcome.value.decoded.canonical;
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "Authority read reached an unreachable retry state.",
  );
}
