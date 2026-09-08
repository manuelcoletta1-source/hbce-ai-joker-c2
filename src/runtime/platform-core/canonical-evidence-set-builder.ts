import {
  computePlatformCorePayloadSha256,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_CANONICAL_EVIDENCE_SET_BUILDER_PROTOCOL =
  "HBCE-PLATFORM-CORE-CANONICAL-EVIDENCE-SET-BUILDER-v1" as const;

export type PlatformCoreCanonicalEvidenceSetBuilderErrorCode =
  | "INVALID_INPUT"
  | "INVALID_PREDECESSOR"
  | "PREDECESSOR_HASH_MISMATCH"
  | "INVALID_TRANSITION"
  | "RESERVED_FIELD_CONTROL"
  | "PAYLOAD_HASH_FAILED"
  | "STATIC_SCHEMA_VALIDATION_FAILED";

export class PlatformCoreCanonicalEvidenceSetBuilderError
extends Error {
  readonly code:
    PlatformCoreCanonicalEvidenceSetBuilderErrorCode;

  constructor(
    code:
      PlatformCoreCanonicalEvidenceSetBuilderErrorCode,
    message:
      string,
  ) {
    super(message);

    this.name =
      "PlatformCoreCanonicalEvidenceSetBuilderError";

    this.code =
      code;
  }
}

export type PlatformCoreEvidenceSetState =
  | "OPEN"
  | "CLOSED";

export type PlatformCoreEvidenceSetEvidenceState =
  | "PRESENT"
  | "MISSING"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export interface PlatformCoreEvidenceSetTargetInput {
  readonly target_class:
    string;

  readonly target_ref:
    string;

  readonly system_ref:
    string | null;
}

export interface PlatformCoreEvidenceSetGenealogyInput {
  readonly cause:
    string;

  readonly evidence_reference:
    string | null;

  readonly timestamp:
    string;
}

export interface PlatformCoreCanonicalEvidenceSetGenesisInput {
  readonly evidence_set_id:
    string;

  readonly case_id:
    string;

  readonly domain:
    string;

  readonly target:
    PlatformCoreEvidenceSetTargetInput;

  readonly owner_subject_ref:
    string;

  readonly authority_ref:
    string;

  readonly authority_version:
    number;

  readonly authority_sha256:
    string;

  readonly created_at:
    string;

  readonly evidence_state:
    PlatformCoreEvidenceSetEvidenceState;

  readonly evidence_reference:
    string | null;

  readonly control_references:
    readonly string[];

  readonly observation_references:
    readonly string[];

  readonly artifact_references:
    readonly string[];

  readonly external_confirmation_references:
    readonly string[];

  readonly event_references:
    readonly string[];

  readonly evt_reference:
    string | null;

  readonly opc_reference:
    string | null;

  readonly genealogy:
    PlatformCoreEvidenceSetGenealogyInput;
}

export interface PlatformCoreCanonicalEvidenceSetSuccessorInput {
  readonly state:
    PlatformCoreEvidenceSetState;

  readonly finalized_at:
    string | null;

  readonly result_reference:
    string | null;

  readonly evidence_state:
    PlatformCoreEvidenceSetEvidenceState;

  readonly evidence_reference:
    string | null;

  readonly control_references:
    readonly string[];

  readonly observation_references:
    readonly string[];

  readonly artifact_references:
    readonly string[];

  readonly external_confirmation_references:
    readonly string[];

  readonly event_references:
    readonly string[];

  readonly evt_reference:
    string | null;

  readonly opc_reference:
    string | null;

  readonly genealogy:
    PlatformCoreEvidenceSetGenealogyInput;
}

export interface PlatformCoreCanonicalEvidenceSet {
  readonly proto:
    "HBCE-EVIDENCE-SET-v1";

  readonly kind:
    "HBCE_CORE_EVIDENCE_SET";

  readonly version:
    "v1";

  readonly evidence_set_id:
    string;

  readonly evidence_set_version:
    number;

  readonly case_id:
    string;

  readonly domain:
    string;

  readonly target:
    Readonly<{
      target_class:
        string;

      target_ref:
        string;

      system_ref:
        string | null;
    }>;

  readonly owner_subject_ref:
    string;

  readonly authority_ref:
    string;

  readonly authority_version:
    number;

  readonly authority_sha256:
    string;

  readonly state:
    PlatformCoreEvidenceSetState;

  readonly created_at:
    string;

  readonly finalized_at:
    string | null;

  readonly evidence_state:
    PlatformCoreEvidenceSetEvidenceState;

  readonly evidence_reference:
    string | null;

  readonly control_references:
    readonly string[];

  readonly observation_references:
    readonly string[];

  readonly result_reference:
    string | null;

  readonly artifact_references:
    readonly string[];

  readonly external_confirmation_references:
    readonly string[];

  readonly event_references:
    readonly string[];

  readonly evt_reference:
    string | null;

  readonly opc_reference:
    string | null;

  readonly payload_sha256:
    string;

  readonly append_only:
    true;

  readonly genealogy:
    Readonly<{
      derived_from:
        string | null;

      previous_state:
        PlatformCoreEvidenceSetState | null;

      new_state:
        PlatformCoreEvidenceSetState;

      cause:
        string;

      evidence_reference:
        string | null;

      timestamp:
        string;

      hash:
        string;
    }>;

  readonly boundary:
    PlatformCoreCanonicalEvidenceSetBoundary;
}

export interface PlatformCoreCanonicalEvidenceSetBoundary {
  readonly data_minimization:
    true;

  readonly reference_over_raw_evidence:
    true;

  readonly identity_binding_required:
    true;

  readonly authority_binding_required:
    true;

  readonly evidence_set_not_authority:
    true;

  readonly evidence_set_not_authorization:
    true;

  readonly evidence_set_not_execution:
    true;

  readonly evidence_set_not_outcome:
    true;

  readonly result_separate_from_state:
    true;

  readonly external_confirmation_separate_from_result:
    true;

  readonly environment_issue_separate_from_control_result:
    true;

  readonly analysis_not_canonical_evidence:
    true;

  readonly closed_history_not_silently_mutable:
    true;

  readonly domain_specific_semantics_in_adapters:
    true;

  readonly unknown_not_pass:
    true;

  readonly missing_evidence_not_verified:
    true;

  readonly append_only_genealogy:
    true;

  readonly no_regulated_certification_claim:
    true;

  readonly no_public_authority_claim:
    true;

  readonly fail_closed:
    true;
}

const BOUNDARY:
  PlatformCoreCanonicalEvidenceSetBoundary =
  Object.freeze({
    data_minimization:
      true,

    reference_over_raw_evidence:
      true,

    identity_binding_required:
      true,

    authority_binding_required:
      true,

    evidence_set_not_authority:
      true,

    evidence_set_not_authorization:
      true,

    evidence_set_not_execution:
      true,

    evidence_set_not_outcome:
      true,

    result_separate_from_state:
      true,

    external_confirmation_separate_from_result:
      true,

    environment_issue_separate_from_control_result:
      true,

    analysis_not_canonical_evidence:
      true,

    closed_history_not_silently_mutable:
      true,

    domain_specific_semantics_in_adapters:
      true,

    unknown_not_pass:
      true,

    missing_evidence_not_verified:
      true,

    append_only_genealogy:
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
    new Set([
      "evidence_set_id",
      "case_id",
      "domain",
      "target",
      "owner_subject_ref",
      "authority_ref",
      "authority_version",
      "authority_sha256",
      "created_at",
      "evidence_state",
      "evidence_reference",
      "control_references",
      "observation_references",
      "artifact_references",
      "external_confirmation_references",
      "event_references",
      "evt_reference",
      "opc_reference",
      "genealogy",
    ]),
  );

const GENESIS_RESERVED_FIELDS =
  Object.freeze(
    new Set([
      "proto",
      "kind",
      "version",
      "evidence_set_version",
      "state",
      "finalized_at",
      "result_reference",
      "payload_sha256",
      "append_only",
      "boundary",
    ]),
  );

const SUCCESSOR_ALLOWED_FIELDS =
  Object.freeze(
    new Set([
      "state",
      "finalized_at",
      "result_reference",
      "evidence_state",
      "evidence_reference",
      "control_references",
      "observation_references",
      "artifact_references",
      "external_confirmation_references",
      "event_references",
      "evt_reference",
      "opc_reference",
      "genealogy",
    ]),
  );

const SUCCESSOR_RESERVED_FIELDS =
  Object.freeze(
    new Set([
      "proto",
      "kind",
      "version",
      "evidence_set_id",
      "evidence_set_version",
      "case_id",
      "domain",
      "target",
      "owner_subject_ref",
      "authority_ref",
      "authority_version",
      "authority_sha256",
      "created_at",
      "payload_sha256",
      "append_only",
      "boundary",
    ]),
  );

const TARGET_ALLOWED_FIELDS =
  Object.freeze(
    new Set([
      "target_class",
      "target_ref",
      "system_ref",
    ]),
  );

const GENEALOGY_ALLOWED_FIELDS =
  Object.freeze(
    new Set([
      "cause",
      "evidence_reference",
      "timestamp",
    ]),
  );

const GENEALOGY_RESERVED_FIELDS =
  Object.freeze(
    new Set([
      "derived_from",
      "previous_state",
      "new_state",
      "hash",
    ]),
  );

function fail(
  code:
    PlatformCoreCanonicalEvidenceSetBuilderErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreCanonicalEvidenceSetBuilderError(
    code,
    message,
  );
}

function isPlainRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value,
    );

  return (
    prototype === Object.prototype ||
    prototype === null
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
  if (!isPlainRecord(value)) {
    fail(
      "INVALID_INPUT",
      `${path} must be a plain object.`,
    );
  }

  for (
    const key of
    Reflect.ownKeys(value)
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
      descriptor === undefined ||
      descriptor.enumerable !== true ||
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
        "RESERVED_FIELD_CONTROL",
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
      !Object.prototype.hasOwnProperty.call(
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

function copyReferenceArray(
  value:
    unknown,
  path:
    string,
): string[] {
  if (!Array.isArray(value)) {
    fail(
      "INVALID_INPUT",
      `${path} must be an array.`,
    );
  }

  return value.map(
    (
      item,
      index,
    ) => {
      if (
        typeof item !==
        "string"
      ) {
        fail(
          "INVALID_INPUT",
          `${path}[${index}] must be a string.`,
        );
      }

      return item;
    },
  );
}

function copyTarget(
  value:
    unknown,
): PlatformCoreEvidenceSetTargetInput {
  assertControlledRecord(
    value,
    TARGET_ALLOWED_FIELDS,
    new Set<string>(),
    [
      "target_class",
      "target_ref",
      "system_ref",
    ],
    "$.target",
  );

  return {
    target_class:
      value.target_class as string,

    target_ref:
      value.target_ref as string,

    system_ref:
      value.system_ref as
        string | null,
  };
}

function copyGenealogyInput(
  value:
    unknown,
  path:
    string,
): PlatformCoreEvidenceSetGenealogyInput {
  assertControlledRecord(
    value,
    GENEALOGY_ALLOWED_FIELDS,
    GENEALOGY_RESERVED_FIELDS,
    [
      "cause",
      "evidence_reference",
      "timestamp",
    ],
    path,
  );

  return {
    cause:
      value.cause as string,

    evidence_reference:
      value.evidence_reference as
        string | null,

    timestamp:
      value.timestamp as string,
  };
}

function staticValidationSucceeded(
  result:
    unknown,
): boolean {
  if (
    result === null ||
    typeof result !==
    "object"
  ) {
    return false;
  }

  const record =
    result as Record<
      string,
      unknown
    >;

  for (
    const key of
    [
      "valid",
      "ok",
      "success",
    ]
  ) {
    if (
      typeof record[key] ===
      "boolean"
    ) {
      return (
        record[key] ===
        true
      );
    }
  }

  return false;
}

function assertEvidenceSetSchema(
  value:
    unknown,
  errorCode:
    PlatformCoreCanonicalEvidenceSetBuilderErrorCode,
  message:
    string,
): void {
  let result:
    unknown;

  try {
    result =
      validatePlatformCoreCanonicalSchema(
        "EVIDENCE_SET",
        value,
      );
  } catch {
    fail(
      errorCode,
      message,
    );
  }

  if (
    !staticValidationSucceeded(
      result,
    )
  ) {
    fail(
      errorCode,
      message,
    );
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
    value === null ||
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
      descriptor !== undefined &&
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
  } catch {
    fail(
      "PAYLOAD_HASH_FAILED",
      "Canonical EvidenceSet payload hash computation failed.",
    );
  }
}

function finalizeCanonicalEvidenceSet(
  preimage:
    Omit<
      PlatformCoreCanonicalEvidenceSet,
      "payload_sha256"
    >,
): PlatformCoreCanonicalEvidenceSet {
  const payloadSha256 =
    computePayloadSha256(
      preimage as unknown as
        Record<string, unknown>,
    );

  const candidate:
    PlatformCoreCanonicalEvidenceSet =
    {
      ...preimage,

      payload_sha256:
        payloadSha256,
    };

  assertEvidenceSetSchema(
    candidate,
    "STATIC_SCHEMA_VALIDATION_FAILED",
    "Canonical EvidenceSet failed static schema validation.",
  );

  return deepFreeze(
    candidate,
  );
}

function assertGenesisInput(
  input:
    unknown,
): asserts input is
  PlatformCoreCanonicalEvidenceSetGenesisInput {
  assertControlledRecord(
    input,
    GENESIS_ALLOWED_FIELDS,
    GENESIS_RESERVED_FIELDS,
    [
      "evidence_set_id",
      "case_id",
      "domain",
      "target",
      "owner_subject_ref",
      "authority_ref",
      "authority_version",
      "authority_sha256",
      "created_at",
      "evidence_state",
      "evidence_reference",
      "control_references",
      "observation_references",
      "artifact_references",
      "external_confirmation_references",
      "event_references",
      "evt_reference",
      "opc_reference",
      "genealogy",
    ],
    "$.genesisInput",
  );

  copyTarget(
    input.target,
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
  PlatformCoreCanonicalEvidenceSetSuccessorInput {
  assertControlledRecord(
    input,
    SUCCESSOR_ALLOWED_FIELDS,
    SUCCESSOR_RESERVED_FIELDS,
    [
      "state",
      "finalized_at",
      "result_reference",
      "evidence_state",
      "evidence_reference",
      "control_references",
      "observation_references",
      "artifact_references",
      "external_confirmation_references",
      "event_references",
      "evt_reference",
      "opc_reference",
      "genealogy",
    ],
    "$.successorInput",
  );

  copyGenealogyInput(
    input.genealogy,
    "$.successorInput.genealogy",
  );
}

function assertCanonicalPredecessor(
  predecessor:
    unknown,
): asserts predecessor is
  PlatformCoreCanonicalEvidenceSet {
  if (!isPlainRecord(predecessor)) {
    fail(
      "INVALID_PREDECESSOR",
      "Canonical EvidenceSet predecessor must be a plain object.",
    );
  }

  assertEvidenceSetSchema(
    predecessor,
    "INVALID_PREDECESSOR",
    "Canonical EvidenceSet predecessor failed static schema validation.",
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
      "Canonical EvidenceSet predecessor payload hash verification failed.",
    );
  }

  if (
    verified !==
    true
  ) {
    fail(
      "PREDECESSOR_HASH_MISMATCH",
      "Canonical EvidenceSet predecessor payload hash does not reproduce exactly.",
    );
  }
}

function assertSuccessorLifecycle(
  predecessor:
    PlatformCoreCanonicalEvidenceSet,
  input:
    PlatformCoreCanonicalEvidenceSetSuccessorInput,
): void {
  if (
    input.state !==
      "OPEN" &&
    input.state !==
      "CLOSED"
  ) {
    fail(
      "INVALID_TRANSITION",
      "EvidenceSet successor state must be OPEN or CLOSED.",
    );
  }

  if (
    predecessor.state ===
      "CLOSED" &&
    input.state !==
      "CLOSED"
  ) {
    fail(
      "INVALID_TRANSITION",
      "Canonical EvidenceSet cannot transition from CLOSED to OPEN.",
    );
  }

  if (
    predecessor.state ===
      "OPEN" &&
    input.state ===
      "OPEN"
  ) {
    if (
      input.finalized_at !==
        null ||
      input.result_reference !==
        null
    ) {
      fail(
        "INVALID_TRANSITION",
        "OPEN EvidenceSet successor requires null finalized_at and result_reference.",
      );
    }

    return;
  }

  if (
    predecessor.state ===
      "OPEN" &&
    input.state ===
      "CLOSED"
  ) {
    if (
      typeof input.finalized_at !==
        "string" ||
      input.finalized_at.length ===
        0
    ) {
      fail(
        "INVALID_TRANSITION",
        "OPEN to CLOSED EvidenceSet transition requires finalized_at.",
      );
    }

    if (
      typeof input.result_reference !==
        "string" ||
      input.result_reference.length ===
        0
    ) {
      fail(
        "INVALID_TRANSITION",
        "OPEN to CLOSED EvidenceSet transition requires result_reference.",
      );
    }

    return;
  }

  if (
    predecessor.state ===
      "CLOSED" &&
    input.state ===
      "CLOSED"
  ) {
    if (
      input.finalized_at !==
        predecessor.finalized_at
    ) {
      fail(
        "INVALID_TRANSITION",
        "CLOSED EvidenceSet successor may not replace finalized_at.",
      );
    }

    if (
      input.result_reference !==
        predecessor.result_reference
    ) {
      fail(
        "INVALID_TRANSITION",
        "CLOSED EvidenceSet successor may not replace result_reference.",
      );
    }
  }
}

export function buildPlatformCoreCanonicalEvidenceSetGenesis(
  input:
    PlatformCoreCanonicalEvidenceSetGenesisInput,
): PlatformCoreCanonicalEvidenceSet {
  assertGenesisInput(
    input,
  );

  const target =
    copyTarget(
      input.target,
    );

  const genealogyInput =
    copyGenealogyInput(
      input.genealogy,
      "$.genesisInput.genealogy",
    );

  const preimage:
    Omit<
      PlatformCoreCanonicalEvidenceSet,
      "payload_sha256"
    > =
    {
      proto:
        "HBCE-EVIDENCE-SET-v1",

      kind:
        "HBCE_CORE_EVIDENCE_SET",

      version:
        "v1",

      evidence_set_id:
        input.evidence_set_id,

      evidence_set_version:
        1,

      case_id:
        input.case_id,

      domain:
        input.domain,

      target: {
        ...target,
      },

      owner_subject_ref:
        input.owner_subject_ref,

      authority_ref:
        input.authority_ref,

      authority_version:
        input.authority_version,

      authority_sha256:
        input.authority_sha256,

      state:
        "OPEN",

      created_at:
        input.created_at,

      finalized_at:
        null,

      evidence_state:
        input.evidence_state,

      evidence_reference:
        input.evidence_reference,

      control_references:
        copyReferenceArray(
          input.control_references,
          "$.genesisInput.control_references",
        ),

      observation_references:
        copyReferenceArray(
          input.observation_references,
          "$.genesisInput.observation_references",
        ),

      result_reference:
        null,

      artifact_references:
        copyReferenceArray(
          input.artifact_references,
          "$.genesisInput.artifact_references",
        ),

      external_confirmation_references:
        copyReferenceArray(
          input.external_confirmation_references,
          "$.genesisInput.external_confirmation_references",
        ),

      event_references:
        copyReferenceArray(
          input.event_references,
          "$.genesisInput.event_references",
        ),

      evt_reference:
        input.evt_reference,

      opc_reference:
        input.opc_reference,

      append_only:
        true,

      genealogy: {
        derived_from:
          null,

        previous_state:
          null,

        new_state:
          "OPEN",

        cause:
          genealogyInput.cause,

        evidence_reference:
          genealogyInput
            .evidence_reference,

        timestamp:
          genealogyInput.timestamp,

        hash:
          input.authority_sha256,
      },

      boundary: {
        ...BOUNDARY,
      },
    };

  return finalizeCanonicalEvidenceSet(
    preimage,
  );
}

export function buildPlatformCoreCanonicalEvidenceSetSuccessor(
  predecessor:
    unknown,
  input:
    PlatformCoreCanonicalEvidenceSetSuccessorInput,
): PlatformCoreCanonicalEvidenceSet {
  assertCanonicalPredecessor(
    predecessor,
  );

  assertSuccessorInput(
    input,
  );

  assertSuccessorLifecycle(
    predecessor,
    input,
  );

  const genealogyInput =
    copyGenealogyInput(
      input.genealogy,
      "$.successorInput.genealogy",
    );

  const preimage:
    Omit<
      PlatformCoreCanonicalEvidenceSet,
      "payload_sha256"
    > =
    {
      proto:
        predecessor.proto,

      kind:
        predecessor.kind,

      version:
        predecessor.version,

      evidence_set_id:
        predecessor.evidence_set_id,

      evidence_set_version:
        predecessor.evidence_set_version +
        1,

      case_id:
        predecessor.case_id,

      domain:
        predecessor.domain,

      target: {
        target_class:
          predecessor
            .target
            .target_class,

        target_ref:
          predecessor
            .target
            .target_ref,

        system_ref:
          predecessor
            .target
            .system_ref,
      },

      owner_subject_ref:
        predecessor.owner_subject_ref,

      authority_ref:
        predecessor.authority_ref,

      authority_version:
        predecessor.authority_version,

      authority_sha256:
        predecessor.authority_sha256,

      state:
        input.state,

      created_at:
        predecessor.created_at,

      finalized_at:
        input.finalized_at,

      evidence_state:
        input.evidence_state,

      evidence_reference:
        input.evidence_reference,

      control_references:
        copyReferenceArray(
          input.control_references,
          "$.successorInput.control_references",
        ),

      observation_references:
        copyReferenceArray(
          input.observation_references,
          "$.successorInput.observation_references",
        ),

      result_reference:
        input.result_reference,

      artifact_references:
        copyReferenceArray(
          input.artifact_references,
          "$.successorInput.artifact_references",
        ),

      external_confirmation_references:
        copyReferenceArray(
          input.external_confirmation_references,
          "$.successorInput.external_confirmation_references",
        ),

      event_references:
        copyReferenceArray(
          input.event_references,
          "$.successorInput.event_references",
        ),

      evt_reference:
        input.evt_reference,

      opc_reference:
        input.opc_reference,

      append_only:
        true,

      genealogy: {
        derived_from:
          predecessor.evidence_set_id,

        previous_state:
          predecessor.state,

        new_state:
          input.state,

        cause:
          genealogyInput.cause,

        evidence_reference:
          genealogyInput
            .evidence_reference,

        timestamp:
          genealogyInput.timestamp,

        hash:
          predecessor.payload_sha256,
      },

      boundary: {
        ...BOUNDARY,
      },
    };

  return finalizeCanonicalEvidenceSet(
    preimage,
  );
}
