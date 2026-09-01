import {
  PlatformCoreCanonicalPayloadHashError,
  computePlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
  type PlatformCoreStaticValidationIssue,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_CANONICAL_AUTHORIZATION_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-AUTHORIZATION-BUILDER-v1" as const;

export type PlatformCoreCanonicalAuthorizationBuilderErrorCode =
  | "INVALID_INPUT"
  | "RESERVED_FIELD"
  | "HASH_COMPUTATION_FAILED"
  | "SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalAuthorizationBuilderError
  extends Error {
  readonly code:
    PlatformCoreCanonicalAuthorizationBuilderErrorCode;

  readonly validationIssues:
    readonly PlatformCoreStaticValidationIssue[];

  constructor(
    code: PlatformCoreCanonicalAuthorizationBuilderErrorCode,
    message: string,
    validationIssues:
      readonly PlatformCoreStaticValidationIssue[] = [],
  ) {
    super(message);

    this.name =
      "PlatformCoreCanonicalAuthorizationBuilderError";

    this.code = code;

    this.validationIssues =
      Object.freeze([
        ...validationIssues,
      ]);
  }
}

export type PlatformCoreAuthorizationState =
  | "PENDING"
  | "AUTHORIZED"
  | "DENIED"
  | "REVIEW_REQUIRED"
  | "EXPIRED"
  | "REVOKED"
  | "SUPERSEDED"
  | "UNKNOWN";

export type PlatformCoreAuthorizationEvidenceState =
  | "PRESENT"
  | "MISSING"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export type PlatformCoreAuthorizationDecisionSourceType =
  | "HUMAN"
  | "POLICY_ENGINE"
  | "HUMAN_AND_POLICY"
  | "EMERGENCY_CONTROLLED";

export type PlatformCoreAuthorizationReplayMode =
  | "SINGLE_USE"
  | "BOUNDED_USE";

export interface PlatformCoreAuthorizationDependencyCommitmentsInput {
  readonly authority_sha256: string;
  readonly mandate_sha256: string;
  readonly capability_sha256: string;
}

export interface PlatformCoreAuthorizationActionBindingInput {
  readonly action_class: string;
  readonly target_ref: string;
  readonly action_sha256: string;
  readonly request_sha256: string;
}

export interface PlatformCoreAuthorizationDecisionSourceInput {
  readonly source_type:
    PlatformCoreAuthorizationDecisionSourceType;

  readonly authorizer_refs:
    readonly string[];
}

export interface PlatformCoreAuthorizationDecisionBasisInput {
  readonly policy_refs:
    readonly string[];

  readonly condition_refs:
    readonly string[];
}

export interface PlatformCoreAuthorizationReplayGuardInput {
  readonly mode:
    PlatformCoreAuthorizationReplayMode;

  readonly replay_key_sha256:
    string;

  readonly max_uses:
    number;

  readonly usage_counter_ref:
    string | null;
}

export interface PlatformCoreAuthorizationGenealogyInput {
  readonly derived_from:
    string | null;

  readonly previous_state:
    PlatformCoreAuthorizationState | null;

  readonly new_state:
    PlatformCoreAuthorizationState;

  readonly cause:
    string;

  readonly evidence_reference:
    string | null;

  readonly timestamp:
    string;

  readonly hash:
    string;
}

export interface PlatformCoreCanonicalAuthorizationInput {
  readonly authorization_id: string;
  readonly authorization_version: number;

  readonly principal_ref: string;
  readonly actor_ref: string;

  readonly authority_ref: string;
  readonly authority_version: number;

  readonly mandate_ref: string;
  readonly mandate_version: number;

  readonly capability_ref: string;
  readonly capability_version: number;

  readonly dependency_commitments:
    PlatformCoreAuthorizationDependencyCommitmentsInput;

  readonly iospace_ref: string;
  readonly enforcement_point_ref: string;

  readonly action_binding:
    PlatformCoreAuthorizationActionBindingInput;

  readonly decision_source:
    PlatformCoreAuthorizationDecisionSourceInput;

  readonly decision_basis:
    PlatformCoreAuthorizationDecisionBasisInput;

  readonly state:
    PlatformCoreAuthorizationState;

  readonly decided_at:
    string | null;

  readonly valid_from:
    string;

  readonly valid_until:
    string;

  readonly created_at:
    string;

  readonly updated_at:
    string;

  readonly evidence_state:
    PlatformCoreAuthorizationEvidenceState;

  readonly evidence_reference:
    string | null;

  readonly replay_guard:
    PlatformCoreAuthorizationReplayGuardInput;

  readonly genealogy:
    PlatformCoreAuthorizationGenealogyInput;

  readonly revocation_reference?:
    string | null;

  readonly supersedes?:
    string | null;

  readonly note?:
    string | null;
}

const BOUNDARY = Object.freeze({
  data_minimization: true,
  reference_over_raw_evidence: true,
  authorization_not_authority: true,
  authorization_not_execution: true,
  authorized_not_executed: true,
  request_digest_binding_required: true,
  action_digest_binding_required: true,
  dependency_versions_explicit: true,
  dependency_hashes_explicit: true,
  authority_must_be_usable_at_decision: true,
  stale_or_revoked_authority_invalidates_use: true,
  time_window_required: true,
  replay_protection_required: true,
  atomic_consumption_required: true,
  unknown_not_authorized: true,
  review_required_not_authorized: true,
  append_only_genealogy: true,
  no_automatic_success_claim: true,
  no_regulated_certification_claim: true,
  no_public_authority_claim: true,
  fail_closed: true,
} as const);

export type PlatformCoreCanonicalAuthorization =
  Readonly<
    Omit<
      PlatformCoreCanonicalAuthorizationInput,
      "replay_guard"
    >
  > & {
    readonly proto:
      "HBCE-AUTHORIZATION-v1";

    readonly kind:
      "HBCE_CORE_AUTHORIZATION";

    readonly version:
      "v1";

    readonly replay_guard:
      Readonly<
        PlatformCoreAuthorizationReplayGuardInput & {
          readonly requires_atomic_consumption:
            true;
        }
      >;

    readonly payload_sha256:
      string;

    readonly append_only:
      true;

    readonly boundary:
      typeof BOUNDARY;
  };

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

const REQUIRED_FIELDS =
  Object.freeze([
    "authorization_id",
    "authorization_version",
    "principal_ref",
    "actor_ref",
    "authority_ref",
    "authority_version",
    "mandate_ref",
    "mandate_version",
    "capability_ref",
    "capability_version",
    "dependency_commitments",
    "iospace_ref",
    "enforcement_point_ref",
    "action_binding",
    "decision_source",
    "decision_basis",
    "state",
    "decided_at",
    "valid_from",
    "valid_until",
    "created_at",
    "updated_at",
    "evidence_state",
    "evidence_reference",
    "replay_guard",
    "genealogy",
  ] as const);

const OPTIONAL_FIELDS =
  Object.freeze([
    "revocation_reference",
    "supersedes",
    "note",
  ] as const);

const ALLOWED_FIELDS =
  new Set<string>([
    ...REQUIRED_FIELDS,
    ...OPTIONAL_FIELDS,
  ]);

const RESERVED_FIELDS =
  new Set<string>([
    "proto",
    "kind",
    "version",
    "payload_sha256",
    "append_only",
    "boundary",
  ]);

function hasOwn(
  value: object,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  );
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

function failInput(
  message: string,
): never {
  throw new PlatformCoreCanonicalAuthorizationBuilderError(
    "INVALID_INPUT",
    message,
  );
}

function cloneJsonValue(
  value: unknown,
  path: string,
  ancestors: WeakSet<object>,
): JsonValue {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "string":
    case "boolean":
      return value;

    case "number":
      if (!Number.isFinite(value)) {
        return failInput(
          `Non-finite number at ${path}.`,
        );
      }

      return value;

    case "undefined":
      return failInput(
        `Undefined at ${path}.`,
      );

    case "bigint":
      return failInput(
        `BigInt at ${path}.`,
      );

    case "function":
      return failInput(
        `Function at ${path}.`,
      );

    case "symbol":
      return failInput(
        `Symbol at ${path}.`,
      );
  }

  if (typeof value !== "object") {
    return failInput(
      `Unsupported value at ${path}.`,
    );
  }

  if (ancestors.has(value)) {
    return failInput(
      `Cyclic value at ${path}.`,
    );
  }

  if (Array.isArray(value)) {
    ancestors.add(value);

    try {
      return value.map(
        (item, index) =>
          cloneJsonValue(
            item,
            `${path}[${index}]`,
            ancestors,
          ),
      );
    } finally {
      ancestors.delete(value);
    }
  }

  if (!isPlainObject(value)) {
    return failInput(
      `Only plain JSON objects are accepted at ${path}.`,
    );
  }

  if (
    Object.getOwnPropertySymbols(value)
      .length > 0
  ) {
    return failInput(
      `Symbol keys at ${path}.`,
    );
  }

  ancestors.add(value);

  try {
    const output:
      Record<string, JsonValue> =
      {};

    for (
      const key of
      Object.getOwnPropertyNames(value)
    ) {
      const descriptor =
        Object.getOwnPropertyDescriptor(
          value,
          key,
        );

      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        return failInput(
          `Accessor or non-enumerable property at ${path}.${key}.`,
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
    ancestors.delete(value);
  }
}

function cloneField<T>(
  value: T,
  path: string,
): T {
  return cloneJsonValue(
    value,
    path,
    new WeakSet<object>(),
  ) as unknown as T;
}

function assertInputEnvelope(
  input: unknown,
): asserts input is PlatformCoreCanonicalAuthorizationInput {
  if (!isPlainObject(input)) {
    failInput(
      "Canonical authorization input must be a plain object.",
    );
  }

  if (
    Object.getOwnPropertySymbols(input)
      .length > 0
  ) {
    failInput(
      "Canonical authorization input must not contain symbol keys.",
    );
  }

  for (
    const key of
    Object.getOwnPropertyNames(input)
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        input,
        key,
      );

    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !("value" in descriptor)
    ) {
      failInput(
        `Input property ${key} must be an enumerable data property.`,
      );
    }

    if (RESERVED_FIELDS.has(key)) {
      throw new PlatformCoreCanonicalAuthorizationBuilderError(
        "RESERVED_FIELD",
        `Caller must not control reserved field ${key}.`,
      );
    }

    if (!ALLOWED_FIELDS.has(key)) {
      failInput(
        `Unknown authorization field ${key}.`,
      );
    }
  }

  for (
    const field of
    REQUIRED_FIELDS
  ) {
    if (!hasOwn(input, field)) {
      failInput(
        `Missing required authorization field ${field}.`,
      );
    }
  }
}

function buildPreimage(
  input:
    PlatformCoreCanonicalAuthorizationInput,
): Record<string, unknown> {
  const replay =
    cloneField(
      input.replay_guard,
      "$.replay_guard",
    ) as unknown as
      Record<string, unknown>;

  if (
    hasOwn(
      replay,
      "requires_atomic_consumption",
    )
  ) {
    throw new PlatformCoreCanonicalAuthorizationBuilderError(
      "RESERVED_FIELD",
      "Caller must not control replay_guard.requires_atomic_consumption.",
    );
  }

  const preimage:
    Record<string, unknown> =
    {
      proto:
        "HBCE-AUTHORIZATION-v1",

      kind:
        "HBCE_CORE_AUTHORIZATION",

      version:
        "v1",

      authorization_id:
        cloneField(
          input.authorization_id,
          "$.authorization_id",
        ),

      authorization_version:
        cloneField(
          input.authorization_version,
          "$.authorization_version",
        ),

      principal_ref:
        cloneField(
          input.principal_ref,
          "$.principal_ref",
        ),

      actor_ref:
        cloneField(
          input.actor_ref,
          "$.actor_ref",
        ),

      authority_ref:
        cloneField(
          input.authority_ref,
          "$.authority_ref",
        ),

      authority_version:
        cloneField(
          input.authority_version,
          "$.authority_version",
        ),

      mandate_ref:
        cloneField(
          input.mandate_ref,
          "$.mandate_ref",
        ),

      mandate_version:
        cloneField(
          input.mandate_version,
          "$.mandate_version",
        ),

      capability_ref:
        cloneField(
          input.capability_ref,
          "$.capability_ref",
        ),

      capability_version:
        cloneField(
          input.capability_version,
          "$.capability_version",
        ),

      dependency_commitments:
        cloneField(
          input.dependency_commitments,
          "$.dependency_commitments",
        ),

      iospace_ref:
        cloneField(
          input.iospace_ref,
          "$.iospace_ref",
        ),

      enforcement_point_ref:
        cloneField(
          input.enforcement_point_ref,
          "$.enforcement_point_ref",
        ),

      action_binding:
        cloneField(
          input.action_binding,
          "$.action_binding",
        ),

      decision_source:
        cloneField(
          input.decision_source,
          "$.decision_source",
        ),

      decision_basis:
        cloneField(
          input.decision_basis,
          "$.decision_basis",
        ),

      state:
        cloneField(
          input.state,
          "$.state",
        ),

      decided_at:
        cloneField(
          input.decided_at,
          "$.decided_at",
        ),

      valid_from:
        cloneField(
          input.valid_from,
          "$.valid_from",
        ),

      valid_until:
        cloneField(
          input.valid_until,
          "$.valid_until",
        ),

      created_at:
        cloneField(
          input.created_at,
          "$.created_at",
        ),

      updated_at:
        cloneField(
          input.updated_at,
          "$.updated_at",
        ),

      evidence_state:
        cloneField(
          input.evidence_state,
          "$.evidence_state",
        ),

      evidence_reference:
        cloneField(
          input.evidence_reference,
          "$.evidence_reference",
        ),

      replay_guard: {
        ...replay,
        requires_atomic_consumption:
          true,
      },

      append_only:
        true,

      genealogy:
        cloneField(
          input.genealogy,
          "$.genealogy",
        ),

      boundary: {
        ...BOUNDARY,
      },
    };

  for (
    const field of
    OPTIONAL_FIELDS
  ) {
    if (hasOwn(input, field)) {
      preimage[field] =
        cloneField(
          (
            input as unknown as
              Record<string, unknown>
          )[field],
          `$.${field}`,
        );
    }
  }

  return preimage;
}

export function buildPlatformCoreCanonicalAuthorization(
  input:
    PlatformCoreCanonicalAuthorizationInput,
): PlatformCoreCanonicalAuthorization {
  assertInputEnvelope(input);

  const preimage =
    buildPreimage(input);

  let payloadSha256:
    string;

  try {
    payloadSha256 =
      computePlatformCorePayloadSha256(
        preimage,
      );
  } catch (error) {
    if (
      error instanceof
      PlatformCoreCanonicalPayloadHashError
    ) {
      throw new PlatformCoreCanonicalAuthorizationBuilderError(
        "HASH_COMPUTATION_FAILED",
        `Canonical authorization hash failed: ${error.code}.`,
      );
    }

    throw error;
  }

  const finalObject = {
    ...preimage,
    payload_sha256:
      payloadSha256,
  };

  const validation =
    validatePlatformCoreCanonicalSchema(
      "AUTHORIZATION",
      finalObject,
    );

  if (!validation.valid) {
    throw new PlatformCoreCanonicalAuthorizationBuilderError(
      "SCHEMA_VALIDATION_FAILED",
      `Canonical AUTHORIZATION validation failed: ${validation.code}.`,
      validation.issues,
    );
  }

  return finalObject as unknown as
    PlatformCoreCanonicalAuthorization;
}
