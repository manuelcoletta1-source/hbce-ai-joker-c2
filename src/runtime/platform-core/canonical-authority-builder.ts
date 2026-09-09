import {
  PlatformCoreCanonicalPayloadHashError,
  computePlatformCorePayloadSha256,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
  type PlatformCoreStaticValidationIssue,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_CANONICAL_AUTHORITY_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-AUTHORITY-BUILDER-v1" as const;

export type PlatformCoreCanonicalAuthorityBuilderErrorCode =
  | "INVALID_INPUT"
  | "RESERVED_FIELD"
  | "INVALID_PREDECESSOR"
  | "PREDECESSOR_HASH_MISMATCH"
  | "GENESIS_SOURCE_COMMITMENT_REQUIRED"
  | "PAYLOAD_HASH_FAILED"
  | "STATIC_SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalAuthorityBuilderError
  extends Error {
  readonly code:
    PlatformCoreCanonicalAuthorityBuilderErrorCode;

  readonly validationIssues:
    readonly PlatformCoreStaticValidationIssue[];

  constructor(
    code:
      PlatformCoreCanonicalAuthorityBuilderErrorCode,
    message:
      string,
    validationIssues:
      readonly PlatformCoreStaticValidationIssue[] = [],
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreCanonicalAuthorityBuilderError";

    this.code =
      code;

    this.validationIssues =
      Object.freeze([
        ...validationIssues,
      ]);
  }
}

export type PlatformCoreAuthorityState =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "LIMITED"
  | "SUSPENDED"
  | "CONTESTED"
  | "COMPROMISED"
  | "EXPIRED"
  | "REVOKED"
  | "SUPERSEDED"
  | "UNKNOWN";

export type PlatformCoreAuthorityEvidenceState =
  | "PRESENT"
  | "MISSING"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export type PlatformCoreAuthoritySourceType =
  | "HUMAN_GRANT"
  | "ORGANIZATIONAL_GRANT"
  | "CONTRACTUAL_REFERENCE"
  | "POLICY_REFERENCE"
  | "SYSTEM_POLICY"
  | "REGULATORY_REFERENCE"
  | "OTHER_CONTROLLED_REFERENCE";

export interface PlatformCoreAuthoritySourceInput {
  readonly source_type:
    PlatformCoreAuthoritySourceType;

  readonly source_ref:
    string;

  readonly source_sha256?:
    string |
    null;
}

export interface PlatformCoreAuthorityScopeInput {
  readonly action_classes:
    readonly string[];

  readonly target_refs:
    readonly string[];

  readonly iospace_refs:
    readonly string[];

  readonly constraint_refs:
    readonly string[];
}

export interface PlatformCoreAuthorityLimitsInput {
  readonly policy_refs:
    readonly string[];

  readonly quantitative_limit_refs:
    readonly string[];

  readonly condition_refs:
    readonly string[];
}

export interface PlatformCoreAuthorityGenealogyInput {
  readonly cause:
    string;

  readonly evidence_reference:
    string |
    null;

  readonly timestamp:
    string;
}

export interface PlatformCoreCanonicalAuthorityBoundary {
  readonly data_minimization:
    true;

  readonly reference_over_raw_evidence:
    true;

  readonly authority_not_identity:
    true;

  readonly authority_not_mandate:
    true;

  readonly authority_not_capability:
    true;

  readonly authority_not_authorization:
    true;

  readonly authority_not_execution:
    true;

  readonly active_authority_not_authorization:
    true;

  readonly dependency_versions_explicit:
    true;

  readonly append_only_genealogy:
    true;

  readonly no_automatic_execution_claim:
    true;

  readonly no_regulated_certification_claim:
    true;

  readonly no_public_authority_claim:
    true;

  readonly fail_closed:
    true;
}

export interface PlatformCoreAuthorityGenealogy {
  readonly derived_from:
    string |
    null;

  readonly previous_state:
    PlatformCoreAuthorityState |
    null;

  readonly new_state:
    PlatformCoreAuthorityState;

  readonly cause:
    string;

  readonly evidence_reference:
    string |
    null;

  readonly timestamp:
    string;

  readonly hash:
    string;
}

interface PlatformCoreCanonicalAuthoritySharedInput {
  readonly principal_ref:
    string;

  readonly actor_ref:
    string;

  readonly mandate_ref:
    string;

  readonly mandate_version:
    number;

  readonly capability_ref:
    string;

  readonly capability_version:
    number;

  readonly authority_source:
    PlatformCoreAuthoritySourceInput;

  readonly scope:
    PlatformCoreAuthorityScopeInput;

  readonly limits:
    PlatformCoreAuthorityLimitsInput;

  readonly state:
    PlatformCoreAuthorityState;

  readonly valid_from:
    string;

  readonly valid_until:
    string |
    null;

  readonly created_at:
    string;

  readonly updated_at:
    string;

  readonly evidence_state:
    PlatformCoreAuthorityEvidenceState;

  readonly evidence_reference:
    string |
    null;

  readonly genealogy:
    PlatformCoreAuthorityGenealogyInput;

  readonly revocation_reference?:
    string |
    null;

  readonly supersedes?:
    string |
    null;

  readonly note?:
    string |
    null;
}

export interface PlatformCoreCanonicalAuthorityGenesisInput
  extends PlatformCoreCanonicalAuthoritySharedInput {
  readonly authority_id:
    string;
}

export interface PlatformCoreCanonicalAuthoritySuccessorInput
  extends PlatformCoreCanonicalAuthoritySharedInput {}

export interface PlatformCoreCanonicalAuthority {
  readonly proto:
    "HBCE-AUTHORITY-v1";

  readonly kind:
    "HBCE_CORE_AUTHORITY";

  readonly version:
    "v1";

  readonly authority_id:
    string;

  readonly authority_version:
    number;

  readonly principal_ref:
    string;

  readonly actor_ref:
    string;

  readonly mandate_ref:
    string;

  readonly mandate_version:
    number;

  readonly capability_ref:
    string;

  readonly capability_version:
    number;

  readonly authority_source:
    Readonly<
      PlatformCoreAuthoritySourceInput
    >;

  readonly scope:
    Readonly<
      PlatformCoreAuthorityScopeInput
    >;

  readonly limits:
    Readonly<
      PlatformCoreAuthorityLimitsInput
    >;

  readonly state:
    PlatformCoreAuthorityState;

  readonly valid_from:
    string;

  readonly valid_until:
    string |
    null;

  readonly created_at:
    string;

  readonly updated_at:
    string;

  readonly evidence_state:
    PlatformCoreAuthorityEvidenceState;

  readonly evidence_reference:
    string |
    null;

  readonly revocation_reference?:
    string |
    null;

  readonly supersedes?:
    string |
    null;

  readonly payload_sha256:
    string;

  readonly append_only:
    true;

  readonly genealogy:
    Readonly<
      PlatformCoreAuthorityGenealogy
    >;

  readonly boundary:
    Readonly<
      PlatformCoreCanonicalAuthorityBoundary
    >;

  readonly note?:
    string |
    null;
}

type JsonPrimitive =
  | null
  | boolean
  | number
  | string;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]:
        JsonValue;
    };

const SHA256_LOWER_HEX_PATTERN =
  /^[a-f0-9]{64}$/;

const BOUNDARY:
  PlatformCoreCanonicalAuthorityBoundary =
  Object.freeze({
    data_minimization:
      true,

    reference_over_raw_evidence:
      true,

    authority_not_identity:
      true,

    authority_not_mandate:
      true,

    authority_not_capability:
      true,

    authority_not_authorization:
      true,

    authority_not_execution:
      true,

    active_authority_not_authorization:
      true,

    dependency_versions_explicit:
      true,

    append_only_genealogy:
      true,

    no_automatic_execution_claim:
      true,

    no_regulated_certification_claim:
      true,

    no_public_authority_claim:
      true,

    fail_closed:
      true,
  });

const GENESIS_ALLOWED_FIELDS =
  Object.freeze(
    new Set<string>([
      "authority_id",
      "principal_ref",
      "actor_ref",
      "mandate_ref",
      "mandate_version",
      "capability_ref",
      "capability_version",
      "authority_source",
      "scope",
      "limits",
      "state",
      "valid_from",
      "valid_until",
      "created_at",
      "updated_at",
      "evidence_state",
      "evidence_reference",
      "revocation_reference",
      "supersedes",
      "note",
      "genealogy",
    ]),
  );

const GENESIS_RESERVED_FIELDS =
  Object.freeze(
    new Set<string>([
      "proto",
      "kind",
      "version",
      "authority_version",
      "payload_sha256",
      "append_only",
      "boundary",
    ]),
  );

const GENESIS_REQUIRED_FIELDS =
  Object.freeze([
    "authority_id",
    "principal_ref",
    "actor_ref",
    "mandate_ref",
    "mandate_version",
    "capability_ref",
    "capability_version",
    "authority_source",
    "scope",
    "limits",
    "state",
    "valid_from",
    "valid_until",
    "created_at",
    "updated_at",
    "evidence_state",
    "evidence_reference",
    "genealogy",
  ] as const);

const SUCCESSOR_ALLOWED_FIELDS =
  Object.freeze(
    new Set<string>([
      "principal_ref",
      "actor_ref",
      "mandate_ref",
      "mandate_version",
      "capability_ref",
      "capability_version",
      "authority_source",
      "scope",
      "limits",
      "state",
      "valid_from",
      "valid_until",
      "created_at",
      "updated_at",
      "evidence_state",
      "evidence_reference",
      "revocation_reference",
      "supersedes",
      "note",
      "genealogy",
    ]),
  );

const SUCCESSOR_RESERVED_FIELDS =
  Object.freeze(
    new Set<string>([
      "proto",
      "kind",
      "version",
      "authority_id",
      "authority_version",
      "payload_sha256",
      "append_only",
      "boundary",
    ]),
  );

const SUCCESSOR_REQUIRED_FIELDS =
  Object.freeze([
    "principal_ref",
    "actor_ref",
    "mandate_ref",
    "mandate_version",
    "capability_ref",
    "capability_version",
    "authority_source",
    "scope",
    "limits",
    "state",
    "valid_from",
    "valid_until",
    "created_at",
    "updated_at",
    "evidence_state",
    "evidence_reference",
    "genealogy",
  ] as const);

const OPTIONAL_FIELDS =
  Object.freeze([
    "revocation_reference",
    "supersedes",
    "note",
  ] as const);

const GENEALOGY_ALLOWED_FIELDS =
  Object.freeze(
    new Set<string>([
      "cause",
      "evidence_reference",
      "timestamp",
    ]),
  );

const GENEALOGY_RESERVED_FIELDS =
  Object.freeze(
    new Set<string>([
      "derived_from",
      "previous_state",
      "new_state",
      "hash",
    ]),
  );

const GENEALOGY_REQUIRED_FIELDS =
  Object.freeze([
    "cause",
    "evidence_reference",
    "timestamp",
  ] as const);

function fail(
  code:
    PlatformCoreCanonicalAuthorityBuilderErrorCode,
  message:
    string,
  validationIssues:
    readonly PlatformCoreStaticValidationIssue[] = [],
): never {
  throw new PlatformCoreCanonicalAuthorityBuilderError(
    code,
    message,
    validationIssues,
  );
}

function hasOwn(
  value:
    object,
  key:
    PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  );
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    value ===
      null ||
    typeof value !==
      "object" ||
    Array.isArray(
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
      Object.prototype ||
    prototype ===
      null
  );
}

function assertControlledRecord(
  value:
    unknown,
  allowed:
    ReadonlySet<string>,
  reserved:
    ReadonlySet<string>,
  required:
    readonly string[],
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

  for (
    const key of
    Reflect.ownKeys(
      value,
    )
  ) {
    if (
      typeof key !==
        "string"
    ) {
      fail(
        "INVALID_INPUT",
        `${path} may not contain symbol keys.`,
      );
    }

    const descriptor =
      Object.getOwnPropertyDescriptor(
        value,
        key,
      );

    if (
      descriptor ===
        undefined ||
      descriptor.enumerable !==
        true ||
      !Object.prototype.hasOwnProperty.call(
        descriptor,
        "value",
      )
    ) {
      fail(
        "INVALID_INPUT",
        `${path}.${key} must be an enumerable data property.`,
      );
    }

    if (
      reserved.has(
        key,
      )
    ) {
      fail(
        "RESERVED_FIELD",
        `${path} may not control reserved field ${key}.`,
      );
    }

    if (
      !allowed.has(
        key,
      )
    ) {
      fail(
        "INVALID_INPUT",
        `${path} contains unsupported field ${key}.`,
      );
    }
  }

  for (
    const key of
    required
  ) {
    if (
      !hasOwn(
        value,
        key,
      )
    ) {
      fail(
        "INVALID_INPUT",
        `${path} is missing required field ${key}.`,
      );
    }
  }
}

function cloneJsonValue(
  value:
    unknown,
  path:
    string,
  ancestors:
    WeakSet<object>,
): JsonValue {
  if (
    value ===
      null
  ) {
    return null;
  }

  switch (
    typeof value
  ) {
    case "string":
    case "boolean":
      return value;

    case "number":
      if (
        !Number.isFinite(
          value,
        )
      ) {
        fail(
          "INVALID_INPUT",
          `Non-finite number at ${path}.`,
        );
      }

      return value;

    case "undefined":
      fail(
        "INVALID_INPUT",
        `Undefined at ${path}.`,
      );

    case "bigint":
    case "function":
    case "symbol":
      fail(
        "INVALID_INPUT",
        `Unsupported value at ${path}.`,
      );
  }

  const object =
    value as object;

  if (
    ancestors.has(
      object,
    )
  ) {
    fail(
      "INVALID_INPUT",
      `Cyclic value at ${path}.`,
    );
  }

  ancestors.add(
    object,
  );

  try {
    if (
      Array.isArray(
        value,
      )
    ) {
      if (
        Object.getOwnPropertySymbols(
          value,
        ).length >
        0
      ) {
        fail(
          "INVALID_INPUT",
          `${path} array may not contain symbol keys.`,
        );
      }

      const expectedNames =
        new Set<string>([
          "length",
        ]);

      const output:
        JsonValue[] =
        [];

      for (
        let index =
          0;
        index <
          value.length;
        index +=
          1
      ) {
        const key =
          String(
            index,
          );

        expectedNames.add(
          key,
        );

        const descriptor =
          Object.getOwnPropertyDescriptor(
            value,
            key,
          );

        if (
          descriptor ===
            undefined ||
          descriptor.enumerable !==
            true ||
          !Object.prototype.hasOwnProperty.call(
            descriptor,
            "value",
          )
        ) {
          fail(
            "INVALID_INPUT",
            `${path}[${index}] must be an enumerable data property.`,
          );
        }

        output.push(
          cloneJsonValue(
            descriptor.value,
            `${path}[${index}]`,
            ancestors,
          ),
        );
      }

      for (
        const name of
        Object.getOwnPropertyNames(
          value,
        )
      ) {
        if (
          !expectedNames.has(
            name,
          )
        ) {
          fail(
            "INVALID_INPUT",
            `${path} array contains unsupported property ${name}.`,
          );
        }
      }

      return output;
    }

    if (
      !isPlainRecord(
        value,
      )
    ) {
      fail(
        "INVALID_INPUT",
        `${path} must contain only JSON-compatible plain objects.`,
      );
    }

    const output:
      Record<string, JsonValue> =
      {};

    for (
      const key of
      Reflect.ownKeys(
        value,
      )
    ) {
      if (
        typeof key !==
          "string"
      ) {
        fail(
          "INVALID_INPUT",
          `${path} may not contain symbol keys.`,
        );
      }

      const descriptor =
        Object.getOwnPropertyDescriptor(
          value,
          key,
        );

      if (
        descriptor ===
          undefined ||
        descriptor.enumerable !==
          true ||
        !Object.prototype.hasOwnProperty.call(
          descriptor,
          "value",
        )
      ) {
        fail(
          "INVALID_INPUT",
          `${path}.${key} must be an enumerable data property.`,
        );
      }

      output[key] =
        cloneJsonValue(
          descriptor.value,
          `${path}.${key}`,
          ancestors,
        );
    }

    return output;
  } finally {
    ancestors.delete(
      object,
    );
  }
}

function cloneField<T>(
  value:
    T,
  path:
    string,
): T {
  return cloneJsonValue(
    value,
    path,
    new WeakSet<object>(),
  ) as unknown as T;
}

function copyGenealogyInput(
  value:
    unknown,
  path:
    string,
): PlatformCoreAuthorityGenealogyInput {
  assertControlledRecord(
    value,
    GENEALOGY_ALLOWED_FIELDS,
    GENEALOGY_RESERVED_FIELDS,
    GENEALOGY_REQUIRED_FIELDS,
    path,
  );

  return {
    cause:
      cloneField(
        value.cause,
        `${path}.cause`,
      ) as string,

    evidence_reference:
      cloneField(
        value.evidence_reference,
        `${path}.evidence_reference`,
      ) as
        string |
        null,

    timestamp:
      cloneField(
        value.timestamp,
        `${path}.timestamp`,
      ) as string,
  };
}

function assertGenesisInput(
  input:
    unknown,
): asserts input is
  PlatformCoreCanonicalAuthorityGenesisInput {
  assertControlledRecord(
    input,
    GENESIS_ALLOWED_FIELDS,
    GENESIS_RESERVED_FIELDS,
    GENESIS_REQUIRED_FIELDS,
    "$.genesisInput",
  );

  copyGenealogyInput(
    input.genealogy,
    "$.genesisInput.genealogy",
  );
}

function assertSuccessorInput(
  input:
    unknown,
): asserts input is
  PlatformCoreCanonicalAuthoritySuccessorInput {
  assertControlledRecord(
    input,
    SUCCESSOR_ALLOWED_FIELDS,
    SUCCESSOR_RESERVED_FIELDS,
    SUCCESSOR_REQUIRED_FIELDS,
    "$.successorInput",
  );

  copyGenealogyInput(
    input.genealogy,
    "$.successorInput.genealogy",
  );
}

function copyCommonCallerFields(
  input:
    PlatformCoreCanonicalAuthoritySharedInput,
  path:
    string,
): Record<string, unknown> {
  const output:
    Record<string, unknown> =
    {
      principal_ref:
        cloneField(
          input.principal_ref,
          `${path}.principal_ref`,
        ),

      actor_ref:
        cloneField(
          input.actor_ref,
          `${path}.actor_ref`,
        ),

      mandate_ref:
        cloneField(
          input.mandate_ref,
          `${path}.mandate_ref`,
        ),

      mandate_version:
        cloneField(
          input.mandate_version,
          `${path}.mandate_version`,
        ),

      capability_ref:
        cloneField(
          input.capability_ref,
          `${path}.capability_ref`,
        ),

      capability_version:
        cloneField(
          input.capability_version,
          `${path}.capability_version`,
        ),

      authority_source:
        cloneField(
          input.authority_source,
          `${path}.authority_source`,
        ),

      scope:
        cloneField(
          input.scope,
          `${path}.scope`,
        ),

      limits:
        cloneField(
          input.limits,
          `${path}.limits`,
        ),

      state:
        cloneField(
          input.state,
          `${path}.state`,
        ),

      valid_from:
        cloneField(
          input.valid_from,
          `${path}.valid_from`,
        ),

      valid_until:
        cloneField(
          input.valid_until,
          `${path}.valid_until`,
        ),

      created_at:
        cloneField(
          input.created_at,
          `${path}.created_at`,
        ),

      updated_at:
        cloneField(
          input.updated_at,
          `${path}.updated_at`,
        ),

      evidence_state:
        cloneField(
          input.evidence_state,
          `${path}.evidence_state`,
        ),

      evidence_reference:
        cloneField(
          input.evidence_reference,
          `${path}.evidence_reference`,
        ),
    };

  for (
    const field of
    OPTIONAL_FIELDS
  ) {
    if (
      hasOwn(
        input,
        field,
      )
    ) {
      output[field] =
        cloneField(
          (
            input as unknown as
              Record<string, unknown>
          )[field],
          `${path}.${field}`,
        );
    }
  }

  return output;
}

function requireGenesisSourceCommitment(
  authoritySource:
    unknown,
): string {
  if (
    !isPlainRecord(
      authoritySource,
    )
  ) {
    fail(
      "GENESIS_SOURCE_COMMITMENT_REQUIRED",
      "Production-eligible Authority genesis requires a controlled authority_source object.",
    );
  }

  const sourceSha256 =
    authoritySource[
      "source_sha256"
    ];

  if (
    typeof sourceSha256 !==
      "string" ||
    !SHA256_LOWER_HEX_PATTERN.test(
      sourceSha256,
    )
  ) {
    fail(
      "GENESIS_SOURCE_COMMITMENT_REQUIRED",
      "Production-eligible Authority genesis requires authority_source.source_sha256 as exactly 64 lowercase hexadecimal characters.",
    );
  }

  return sourceSha256;
}

function assertAuthoritySchema(
  value:
    unknown,
  errorCode:
    PlatformCoreCanonicalAuthorityBuilderErrorCode,
  message:
    string,
): void {
  let validation:
    ReturnType<
      typeof validatePlatformCoreCanonicalSchema
    >;

  try {
    validation =
      validatePlatformCoreCanonicalSchema(
        "AUTHORITY",
        value,
      );
  } catch {
    fail(
      errorCode,
      message,
    );
  }

  if (
    !validation.valid
  ) {
    fail(
      errorCode,
      message,
      validation.issues,
    );
  }
}

function assertCanonicalPredecessor(
  predecessor:
    unknown,
): asserts predecessor is
  PlatformCoreCanonicalAuthority {
  if (
    !isPlainRecord(
      predecessor,
    )
  ) {
    fail(
      "INVALID_PREDECESSOR",
      "Canonical Authority predecessor must be a plain object.",
    );
  }

  assertAuthoritySchema(
    predecessor,
    "INVALID_PREDECESSOR",
    "Canonical Authority predecessor failed static AUTHORITY schema validation.",
  );

  let verified:
    boolean;

  try {
    verified =
      verifyPlatformCorePayloadSha256(
        predecessor,
      );
  } catch {
    fail(
      "PREDECESSOR_HASH_MISMATCH",
      "Canonical Authority predecessor payload hash verification failed.",
    );
  }

  if (
    verified !==
      true
  ) {
    fail(
      "PREDECESSOR_HASH_MISMATCH",
      "Canonical Authority predecessor payload hash does not reproduce exactly.",
    );
  }

  const canonicalPredecessor =
    predecessor as unknown as
      PlatformCoreCanonicalAuthority;

  if (
    !Number.isSafeInteger(
      canonicalPredecessor.authority_version,
    ) ||
    canonicalPredecessor.authority_version >=
      Number.MAX_SAFE_INTEGER
  ) {
    fail(
      "INVALID_PREDECESSOR",
      "Canonical Authority predecessor authority_version must support an exact safe +1 successor revision.",
    );
  }

  if (
    canonicalPredecessor.state !==
      canonicalPredecessor.genealogy.new_state
  ) {
    fail(
      "INVALID_PREDECESSOR",
      "Canonical Authority predecessor state must equal genealogy.new_state.",
    );
  }

  if (
    canonicalPredecessor.authority_version ===
      1
  ) {
    if (
      canonicalPredecessor.genealogy.derived_from !==
        null ||
      canonicalPredecessor.genealogy.previous_state !==
        null
    ) {
      fail(
        "INVALID_PREDECESSOR",
        "Canonical Authority genesis predecessor must have null derived_from and previous_state.",
      );
    }

    const sourceSha256 =
      canonicalPredecessor.authority_source.source_sha256;

    if (
      typeof sourceSha256 !==
        "string" ||
      !SHA256_LOWER_HEX_PATTERN.test(
        sourceSha256,
      )
    ) {
      fail(
        "INVALID_PREDECESSOR",
        "Canonical Authority genesis predecessor requires a valid authority source SHA-256 commitment.",
      );
    }

    if (
      canonicalPredecessor.genealogy.hash !==
        sourceSha256
    ) {
      fail(
        "INVALID_PREDECESSOR",
        "Canonical Authority genesis predecessor genealogy hash must equal authority source SHA-256.",
      );
    }
  } else {
    if (
      canonicalPredecessor.genealogy.derived_from !==
        canonicalPredecessor.authority_id
    ) {
      fail(
        "INVALID_PREDECESSOR",
        "Canonical Authority successor predecessor genealogy derived_from must equal its authority_id.",
      );
    }

    if (
      canonicalPredecessor.genealogy.previous_state ===
        null
    ) {
      fail(
        "INVALID_PREDECESSOR",
        "Canonical Authority non-genesis predecessor genealogy previous_state must not be null.",
      );
    }
  }
}

function deepFreeze<T>(
  value:
    T,
  seen:
    WeakSet<object> =
      new WeakSet<object>(),
): T {
  if (
    value ===
      null ||
    typeof value !==
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
    const key of
    Reflect.ownKeys(
      object,
    )
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        object,
        key,
      );

    if (
      descriptor !==
        undefined &&
      Object.prototype.hasOwnProperty.call(
        descriptor,
        "value",
      )
    ) {
      deepFreeze(
        descriptor.value,
        seen,
      );
    }
  }

  Object.freeze(
    object,
  );

  return value;
}

function computePayloadSha256(
  preimage:
    Record<string, unknown>,
): string {
  try {
    return computePlatformCorePayloadSha256(
      preimage,
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PlatformCoreCanonicalPayloadHashError
    ) {
      fail(
        "PAYLOAD_HASH_FAILED",
        `Canonical Authority payload hash computation failed: ${error.code}.`,
      );
    }

    fail(
      "PAYLOAD_HASH_FAILED",
      "Canonical Authority payload hash computation failed.",
    );
  }
}

function finalizeCanonicalAuthority(
  preimage:
    Record<string, unknown>,
): PlatformCoreCanonicalAuthority {
  const payloadSha256 =
    computePayloadSha256(
      preimage,
    );

  const candidate:
    Record<string, unknown> =
    {
      ...preimage,

      payload_sha256:
        payloadSha256,
    };

  assertAuthoritySchema(
    candidate,
    "STATIC_SCHEMA_VALIDATION_FAILED",
    "Canonical AUTHORITY failed static schema validation.",
  );

  return deepFreeze(
    candidate,
  ) as unknown as
    PlatformCoreCanonicalAuthority;
}

function buildGenesisPreimage(
  input:
    PlatformCoreCanonicalAuthorityGenesisInput,
): Record<string, unknown> {
  const common =
    copyCommonCallerFields(
      input,
      "$.genesisInput",
    );

  const genealogyInput =
    copyGenealogyInput(
      input.genealogy,
      "$.genesisInput.genealogy",
    );

  const sourceSha256 =
    requireGenesisSourceCommitment(
      common[
        "authority_source"
      ],
    );

  return {
    proto:
      "HBCE-AUTHORITY-v1",

    kind:
      "HBCE_CORE_AUTHORITY",

    version:
      "v1",

    authority_id:
      cloneField(
        input.authority_id,
        "$.genesisInput.authority_id",
      ),

    authority_version:
      1,

    ...common,

    append_only:
      true,

    genealogy: {
      derived_from:
        null,

      previous_state:
        null,

      new_state:
        common[
          "state"
        ],

      cause:
        genealogyInput.cause,

      evidence_reference:
        genealogyInput.evidence_reference,

      timestamp:
        genealogyInput.timestamp,

      hash:
        sourceSha256,
    },

    boundary: {
      ...BOUNDARY,
    },
  };
}

function buildSuccessorPreimage(
  predecessor:
    PlatformCoreCanonicalAuthority,
  input:
    PlatformCoreCanonicalAuthoritySuccessorInput,
): Record<string, unknown> {
  const common =
    copyCommonCallerFields(
      input,
      "$.successorInput",
    );

  const genealogyInput =
    copyGenealogyInput(
      input.genealogy,
      "$.successorInput.genealogy",
    );

  return {
    proto:
      "HBCE-AUTHORITY-v1",

    kind:
      "HBCE_CORE_AUTHORITY",

    version:
      "v1",

    authority_id:
      cloneField(
        predecessor.authority_id,
        "$.predecessor.authority_id",
      ),

    authority_version:
      predecessor.authority_version +
      1,

    ...common,

    append_only:
      true,

    genealogy: {
      derived_from:
        predecessor.authority_id,

      previous_state:
        predecessor.state,

      new_state:
        common[
          "state"
        ],

      cause:
        genealogyInput.cause,

      evidence_reference:
        genealogyInput.evidence_reference,

      timestamp:
        genealogyInput.timestamp,

      hash:
        predecessor.payload_sha256,
    },

    boundary: {
      ...BOUNDARY,
    },
  };
}

export function buildPlatformCoreCanonicalAuthorityGenesis(
  input:
    PlatformCoreCanonicalAuthorityGenesisInput,
): PlatformCoreCanonicalAuthority {
  assertGenesisInput(
    input,
  );

  const preimage =
    buildGenesisPreimage(
      input,
    );

  return finalizeCanonicalAuthority(
    preimage,
  );
}

export function buildPlatformCoreCanonicalAuthoritySuccessor(
  predecessor:
    unknown,
  input:
    PlatformCoreCanonicalAuthoritySuccessorInput,
): PlatformCoreCanonicalAuthority {
  assertCanonicalPredecessor(
    predecessor,
  );

  assertSuccessorInput(
    input,
  );

  const preimage =
    buildSuccessorPreimage(
      predecessor,
      input,
    );

  return finalizeCanonicalAuthority(
    preimage,
  );
}
