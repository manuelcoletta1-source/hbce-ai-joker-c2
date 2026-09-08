import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

export const PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-TYPED-REFERENCE-REGISTRY-REPOSITORY-v1" as const;

export const PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_MAX_ATTEMPTS =
  3 as const;

const TABLE =
  "public.hbce_platform_core_typed_reference_registry" as const;

const REFERENCE_PATTERN =
  /^[A-Z0-9_:\-.]+$/;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const REFERENCE_MIN_LENGTH =
  3 as const;

const REFERENCE_MAX_LENGTH =
  160 as const;

const COMMITMENT_PROFILE_MIN_LENGTH =
  1 as const;

const COMMITMENT_PROFILE_MAX_LENGTH =
  160 as const;

export const PLATFORM_CORE_TYPED_REFERENCE_TYPES =
  Object.freeze([
    "EVIDENCE",
    "CONTROL",
    "OBSERVATION",
    "RESULT",
    "ARTIFACT",
    "EXTERNAL_CONFIRMATION",
    "EVENT",
    "EVT",
    "OPC",
  ] as const);

export type PlatformCoreTypedReferenceType =
  typeof PLATFORM_CORE_TYPED_REFERENCE_TYPES[number];

export type PlatformCoreTypedReferenceRegistrationInput =
  Readonly<{
    referenceType:
      unknown;

    reference:
      unknown;

    backingCommitmentProfile:
      unknown;

    backingCommitmentSha256:
      unknown;
  }>;

export type PlatformCoreTypedReferenceRegistration =
  Readonly<{
    referenceType:
      PlatformCoreTypedReferenceType;

    reference:
      string;

    backingCommitmentProfile:
      string;

    backingCommitmentSha256:
      string;

    registeredAt:
      string;
  }>;

export type PlatformCoreTypedReferencePersistence =
  Readonly<{
    registration:
      PlatformCoreTypedReferenceRegistration;

    idempotentReplay:
      boolean;
  }>;

export type PlatformCoreTypedReferenceRegistryRepositoryErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_REFERENCE_TYPE"
  | "CONFLICTING_DUPLICATE"
  | "PERSISTED_RECORD_INVALID"
  | "SERIALIZATION_RETRIES_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreTypedReferenceRegistryRepositoryError
  extends Error {
  readonly code:
    PlatformCoreTypedReferenceRegistryRepositoryErrorCode;

  constructor(
    code:
      PlatformCoreTypedReferenceRegistryRepositoryErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreTypedReferenceRegistryRepositoryError";

    this.code =
      code;
  }
}

type TypedReferenceRow =
  Readonly<{
    reference_type:
      unknown;

    reference:
      unknown;

    backing_commitment_profile:
      unknown;

    backing_commitment_sha256:
      unknown;

    registered_at:
      unknown;
  }>;

type StableRegistrationMaterial =
  Readonly<{
    referenceType:
      PlatformCoreTypedReferenceType;

    reference:
      string;

    backingCommitmentProfile:
      string;

    backingCommitmentSha256:
      string;
  }>;

type PersistAttempt =
  | Readonly<{
      kind:
        "INSERTED";

      registration:
        PlatformCoreTypedReferenceRegistration;
    }>
  | Readonly<{
      kind:
        "EXISTING";

      registration:
        PlatformCoreTypedReferenceRegistration;
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

      registration:
        PlatformCoreTypedReferenceRegistration;
    }>
  | Readonly<{
      kind:
        "PERSISTED_INVALID";
    }>;

function failClosed(
  code:
    PlatformCoreTypedReferenceRegistryRepositoryErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreTypedReferenceRegistryRepositoryError(
    code,
    message,
  );
}

function isSupportedReferenceType(
  value:
    unknown,
): value is PlatformCoreTypedReferenceType {
  return (
    typeof value ===
      "string"
    && (
      PLATFORM_CORE_TYPED_REFERENCE_TYPES as
        readonly string[]
    ).includes(
      value,
    )
  );
}

function assertSupportedReferenceType(
  value:
    unknown,
): asserts value is PlatformCoreTypedReferenceType {
  if (
    typeof value !==
      "string"
  ) {
    failClosed(
      "INVALID_INPUT",
      "Typed reference type must be a string.",
    );
  }

  if (
    !isSupportedReferenceType(
      value,
    )
  ) {
    failClosed(
      "UNSUPPORTED_REFERENCE_TYPE",
      "Typed reference type is not supported.",
    );
  }
}

function assertReference(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !==
      "string"
    || value.length <
      REFERENCE_MIN_LENGTH
    || value.length >
      REFERENCE_MAX_LENGTH
    || !REFERENCE_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Typed reference is invalid.",
    );
  }
}

function assertBackingCommitmentProfile(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !==
      "string"
    || Array.from(
      value,
    ).length <
      COMMITMENT_PROFILE_MIN_LENGTH
    || Array.from(
      value,
    ).length >
      COMMITMENT_PROFILE_MAX_LENGTH
    || value.startsWith(
      " ",
    )
    || value.endsWith(
      " ",
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Backing commitment profile is invalid.",
    );
  }
}

function assertBackingCommitmentSha256(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !==
      "string"
    || !SHA256_PATTERN.test(
      value,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Backing commitment SHA-256 is invalid.",
    );
  }
}

function normalizeRegisteredAt(
  value:
    unknown,
): string {
  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted typed-reference registered_at is invalid.",
      );
    }

    return value.toISOString();
  }

  if (
    typeof value !==
      "string"
    || value.length ===
      0
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference registered_at is invalid.",
    );
  }

  const parsed =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference registered_at is invalid.",
    );
  }

  return parsed.toISOString();
}

function materialFromInput(
  input:
    PlatformCoreTypedReferenceRegistrationInput,
): StableRegistrationMaterial {
  if (
    input === null
    || typeof input !==
      "object"
    || Array.isArray(
      input,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Typed reference registration input is required.",
    );
  }

  const referenceType =
    input.referenceType;

  const reference =
    input.reference;

  const backingCommitmentProfile =
    input.backingCommitmentProfile;

  const backingCommitmentSha256 =
    input.backingCommitmentSha256;

  assertSupportedReferenceType(
    referenceType,
  );

  assertReference(
    reference,
  );

  assertBackingCommitmentProfile(
    backingCommitmentProfile,
  );

  assertBackingCommitmentSha256(
    backingCommitmentSha256,
  );

  return Object.freeze({
    referenceType,
    reference,
    backingCommitmentProfile,
    backingCommitmentSha256,
  });
}

function decodeRow(
  row:
    TypedReferenceRow,
): PlatformCoreTypedReferenceRegistration {
  const referenceType =
    row.reference_type;

  const reference =
    row.reference;

  const backingCommitmentProfile =
    row.backing_commitment_profile;

  const backingCommitmentSha256 =
    row.backing_commitment_sha256;

  if (
    !isSupportedReferenceType(
      referenceType,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference reference_type is invalid.",
    );
  }

  if (
    typeof reference !==
      "string"
    || reference.length <
      REFERENCE_MIN_LENGTH
    || reference.length >
      REFERENCE_MAX_LENGTH
    || !REFERENCE_PATTERN.test(
      reference,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference reference is invalid.",
    );
  }

  if (
    typeof backingCommitmentProfile !==
      "string"
    || Array.from(
      backingCommitmentProfile,
    ).length <
      COMMITMENT_PROFILE_MIN_LENGTH
    || Array.from(
      backingCommitmentProfile,
    ).length >
      COMMITMENT_PROFILE_MAX_LENGTH
    || backingCommitmentProfile.startsWith(
      " ",
    )
    || backingCommitmentProfile.endsWith(
      " ",
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference commitment profile is invalid.",
    );
  }

  if (
    typeof backingCommitmentSha256 !==
      "string"
    || !SHA256_PATTERN.test(
      backingCommitmentSha256,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted typed-reference commitment SHA-256 is invalid.",
    );
  }

  const registeredAt =
    normalizeRegisteredAt(
      row.registered_at,
    );

  return Object.freeze({
    referenceType,
    reference,
    backingCommitmentProfile,
    backingCommitmentSha256,
    registeredAt,
  });
}

function safeDecodeRow(
  row:
    TypedReferenceRow,
):
  | Readonly<{
      ok:
        true;

      registration:
        PlatformCoreTypedReferenceRegistration;
    }>
  | Readonly<{
      ok:
        false;
    }> {
  try {
    return Object.freeze({
      ok:
        true,

      registration:
        decodeRow(
          row,
        ),
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreTypedReferenceRegistryRepositoryError
      && error.code ===
        "PERSISTED_RECORD_INVALID"
    ) {
      return Object.freeze({
        ok:
          false,
      });
    }

    throw error;
  }
}

function exactMaterialMatch(
  registration:
    PlatformCoreTypedReferenceRegistration,
  material:
    StableRegistrationMaterial,
): boolean {
  return (
    registration.referenceType ===
      material.referenceType
    && registration.reference ===
      material.reference
    && registration.backingCommitmentProfile ===
      material.backingCommitmentProfile
    && registration.backingCommitmentSha256 ===
      material.backingCommitmentSha256
  );
}

function isSerializationFailure(
  error:
    unknown,
): boolean {
  let normalized =
    "";

  if (
    error instanceof Error
  ) {
    normalized =
      `${error.name} ${error.message}`.toLowerCase();
  } else if (
    typeof error ===
      "string"
  ) {
    normalized =
      error.toLowerCase();
  } else if (
    error !== null
    && typeof error ===
      "object"
  ) {
    const candidate =
      error as
        Record<string, unknown>;

    normalized =
      [
        candidate.code,
        candidate.sqlState,
        candidate.sqlstate,
        candidate.message,
      ]
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
              "string",
        )
        .join(
          " ",
        )
        .toLowerCase();
  }

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

async function persistAttempt(
  transaction:
    HbceTransactionContext,
  material:
    StableRegistrationMaterial,
): Promise<PersistAttempt> {
  const inserted =
    await transaction.query<TypedReferenceRow>(
      `
        INSERT INTO ${TABLE} (
          reference_type,
          reference,
          backing_commitment_profile,
          backing_commitment_sha256
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        ON CONFLICT DO NOTHING
        RETURNING
          reference_type,
          reference,
          backing_commitment_profile,
          backing_commitment_sha256,
          registered_at
      `,
      [
        material.referenceType,
        material.reference,
        material.backingCommitmentProfile,
        material.backingCommitmentSha256,
      ],
    );

  if (
    inserted.rows.length ===
      1
  ) {
    const decoded =
      safeDecodeRow(
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
      !exactMaterialMatch(
        decoded.registration,
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

      registration:
        decoded.registration,
    });
  }

  if (
    inserted.rows.length !==
      0
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  const existing =
    await transaction.query<TypedReferenceRow>(
      `
        SELECT
          reference_type,
          reference,
          backing_commitment_profile,
          backing_commitment_sha256,
          registered_at
        FROM ${TABLE}
        WHERE
          reference_type = $1
          AND reference = $2
      `,
      [
        material.referenceType,
        material.reference,
      ],
    );

  if (
    existing.rows.length >
      1
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  if (
    existing.rows.length ===
      0
  ) {
    return Object.freeze({
      kind:
        "CONFLICTING_DUPLICATE",
    });
  }

  const decoded =
    safeDecodeRow(
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
    !exactMaterialMatch(
      decoded.registration,
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

    registration:
      decoded.registration,
  });
}

async function readAttempt(
  transaction:
    HbceTransactionContext,
  referenceType:
    PlatformCoreTypedReferenceType,
  reference:
    string,
): Promise<ReadAttempt> {
  const result =
    await transaction.query<TypedReferenceRow>(
      `
        SELECT
          reference_type,
          reference,
          backing_commitment_profile,
          backing_commitment_sha256,
          registered_at
        FROM ${TABLE}
        WHERE
          reference_type = $1
          AND reference = $2
      `,
      [
        referenceType,
        reference,
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
    safeDecodeRow(
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
    decoded.registration.referenceType !==
      referenceType
    || decoded.registration.reference !==
      reference
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  return Object.freeze({
    kind:
      "FOUND",

    registration:
      decoded.registration,
  });
}

export async function persistPlatformCoreTypedReferenceRegistration(
  input:
    PlatformCoreTypedReferenceRegistrationInput,
): Promise<
  PlatformCoreTypedReferencePersistence
> {
  const material =
    materialFromInput(
      input,
    );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_MAX_ATTEMPTS;
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
            PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_TRANSACTION_ISOLATION,
        },
      );

    if (
      !outcome.ok
    ) {
      if (
        isSerializationFailure(
          outcome.error,
        )
      ) {
        if (
          attempt <
            PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "Typed reference registration exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "Typed reference registration transaction failed.",
      );
    }

    if (
      outcome.value.kind ===
        "CONFLICTING_DUPLICATE"
    ) {
      failClosed(
        "CONFLICTING_DUPLICATE",
        "Typed reference durable identity conflicts with different commitment material.",
      );
    }

    if (
      outcome.value.kind ===
        "PERSISTED_INVALID"
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted typed-reference registration failed read-back verification.",
      );
    }

    return Object.freeze({
      registration:
        outcome.value.registration,

      idempotentReplay:
        outcome.value.kind ===
          "EXISTING",
    });
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "Typed reference registration reached an unreachable retry state.",
  );
}

export async function readPlatformCoreTypedReferenceRegistration(
  referenceType:
    unknown,
  reference:
    unknown,
): Promise<
  PlatformCoreTypedReferenceRegistration | null
> {
  assertSupportedReferenceType(
    referenceType,
  );

  assertReference(
    reference,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          readAttempt(
            transaction,
            referenceType,
            reference,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_TRANSACTION_ISOLATION,

          readOnly:
            true,
        },
      );

    if (
      !outcome.ok
    ) {
      if (
        isSerializationFailure(
          outcome.error,
        )
      ) {
        if (
          attempt <
            PLATFORM_CORE_TYPED_REFERENCE_REGISTRY_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "Typed reference read exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "Typed reference read transaction failed.",
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
        "Persisted typed-reference registration is invalid.",
      );
    }

    return outcome.value.registration;
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "Typed reference read reached an unreachable retry state.",
  );
}
