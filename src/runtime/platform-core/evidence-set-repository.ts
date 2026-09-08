import {
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "../../../lib/ipr-database-transaction";

import {
  type PlatformCoreCanonicalEvidenceSet,
} from "./canonical-evidence-set-builder";

import {
  canonicalizePlatformCorePayloadPreimage,
  verifyPlatformCorePayloadSha256,
} from "./canonical-payload-hash";

import {
  validatePlatformCoreCanonicalSchema,
} from "./canonical-schema-validator";

export const PLATFORM_CORE_EVIDENCE_SET_REPOSITORY_PROTOCOL =
  "HBCE-PLATFORM-CORE-EVIDENCE-SET-REPOSITORY-v1" as const;

export const PLATFORM_CORE_EVIDENCE_SET_TRANSACTION_ISOLATION =
  "SERIALIZABLE" as const;

export const PLATFORM_CORE_EVIDENCE_SET_MAX_ATTEMPTS =
  3 as const;

const TABLE =
  "public.hbce_platform_core_evidence_sets" as const;

const EVIDENCE_SET_ID_PATTERN =
  /^EVS-[0-9A-Z:_.-]+$/;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

export type PlatformCoreEvidenceSetReferenceType =
  | "EVIDENCE"
  | "CONTROL"
  | "OBSERVATION"
  | "RESULT"
  | "ARTIFACT"
  | "EXTERNAL_CONFIRMATION"
  | "EVENT"
  | "EVT"
  | "OPC";

export type PlatformCoreEvidenceSetReferenceResolutionPort =
  Readonly<{
    resolveAuthority(
      input:
        Readonly<{
          authorityRef:
            string;

          authorityVersion:
            number;

          authoritySha256:
            string;
        }>,
    ):
      boolean |
      Promise<boolean>;

    resolveOwnerSubject(
      input:
        Readonly<{
          ownerSubjectRef:
            string;
        }>,
    ):
      boolean |
      Promise<boolean>;

    resolveReference(
      input:
        Readonly<{
          referenceType:
            PlatformCoreEvidenceSetReferenceType;

          reference:
            string;
        }>,
    ):
      boolean |
      Promise<boolean>;
  }>;

export type PlatformCoreEvidenceSetRepositoryErrorCode =
  | "INVALID_INPUT"
  | "STATIC_SCHEMA_VALIDATION_FAILED"
  | "PAYLOAD_HASH_MISMATCH"
  | "REFERENCE_RESOLUTION_FAILED"
  | "PREDECESSOR_NOT_FOUND"
  | "PREDECESSOR_BINDING_MISMATCH"
  | "CONFLICTING_DUPLICATE"
  | "PERSISTED_RECORD_INVALID"
  | "SERIALIZATION_RETRIES_EXHAUSTED"
  | "DATABASE_FAILURE";

export class PlatformCoreEvidenceSetRepositoryError
  extends Error {
  readonly code:
    PlatformCoreEvidenceSetRepositoryErrorCode;

  constructor(
    code:
      PlatformCoreEvidenceSetRepositoryErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "PlatformCoreEvidenceSetRepositoryError";

    this.code =
      code;
  }
}

export type PlatformCoreEvidenceSetPersistence =
  Readonly<{
    evidenceSet:
      PlatformCoreCanonicalEvidenceSet;

    persistedAt:
      string;

    idempotentReplay:
      boolean;
  }>;

type EvidenceSetRow = {
  readonly evidence_set_id:
    unknown;

  readonly evidence_set_version:
    unknown;

  readonly payload_sha256:
    unknown;

  readonly canonical_payload_preimage_utf8:
    unknown;

  readonly state:
    unknown;

  readonly case_id:
    unknown;

  readonly domain:
    unknown;

  readonly owner_subject_ref:
    unknown;

  readonly authority_ref:
    unknown;

  readonly authority_version:
    unknown;

  readonly authority_sha256:
    unknown;

  readonly result_reference:
    unknown;

  readonly finalized_at_text:
    unknown;

  readonly predecessor_evidence_set_version:
    unknown;

  readonly predecessor_payload_sha256:
    unknown;

  readonly persisted_at:
    unknown;
};

type StableEvidenceSetMaterial =
  Readonly<{
    canonical:
      PlatformCoreCanonicalEvidenceSet;

    canonicalPayloadPreimageUtf8:
      string;

    payloadSha256:
      string;

    predecessorEvidenceSetVersion:
      number | null;

    predecessorPayloadSha256:
      string | null;
  }>;

type DecodedEvidenceSetRow =
  Readonly<{
    canonical:
      PlatformCoreCanonicalEvidenceSet;

    canonicalPayloadPreimageUtf8:
      string;

    payloadSha256:
      string;

    persistedAt:
      string;
  }>;

type RowLookup =
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
        "FOUND";

      row:
        EvidenceSetRow;
    }>;

type SafeDecodedRow =
  | Readonly<{
      ok:
        true;

      decoded:
        DecodedEvidenceSetRow;
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
        DecodedEvidenceSetRow;
    }>
  | Readonly<{
      kind:
        "EXISTING";

      decoded:
        DecodedEvidenceSetRow;
    }>
  | Readonly<{
      kind:
        "PREDECESSOR_NOT_FOUND";
    }>
  | Readonly<{
      kind:
        "PREDECESSOR_INVALID";
    }>
  | Readonly<{
      kind:
        "PREDECESSOR_BINDING_MISMATCH";
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
        DecodedEvidenceSetRow;
    }>
  | Readonly<{
      kind:
        "PERSISTED_INVALID";
    }>;

function failClosed(
  code:
    PlatformCoreEvidenceSetRepositoryErrorCode,
  message:
    string,
): never {
  throw new PlatformCoreEvidenceSetRepositoryError(
    code,
    message,
  );
}

function isPlainRecord(
  value:
    unknown,
): value is
  Record<string, unknown> {
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

function requireString(
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

  return requireString(
    value,
    field,
  );
}

function requireSafeInteger(
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

function requireNullableSafeInteger(
  value:
    unknown,
  field:
    string,
): number | null {
  if (
    value === null
  ) {
    return null;
  }

  return requireSafeInteger(
    value,
    field,
  );
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

function assertEvidenceSetId(
  evidenceSetId:
    unknown,
): asserts evidenceSetId is string {
  if (
    typeof evidenceSetId !==
      "string"
    || evidenceSetId.length <
      5
    || evidenceSetId.length >
      128
    || !EVIDENCE_SET_ID_PATTERN.test(
      evidenceSetId,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "EvidenceSet identifier is invalid.",
    );
  }
}

function assertEvidenceSetVersion(
  evidenceSetVersion:
    unknown,
): asserts evidenceSetVersion is number {
  if (
    typeof evidenceSetVersion !==
      "number"
    || !Number.isSafeInteger(
      evidenceSetVersion,
    )
    || evidenceSetVersion <
      1
  ) {
    failClosed(
      "INVALID_INPUT",
      "EvidenceSet version must be a positive safe integer.",
    );
  }
}

function internalGenealogyIsCoherent(
  value:
    PlatformCoreCanonicalEvidenceSet,
): boolean {
  if (
    value.genealogy.new_state !==
      value.state
  ) {
    return false;
  }

  if (
    value.evidence_set_version ===
      1
  ) {
    return (
      value.state ===
        "OPEN"
      && value.genealogy.derived_from ===
        null
      && value.genealogy.previous_state ===
        null
      && value.genealogy.hash ===
        value.authority_sha256
    );
  }

  return (
    value.genealogy.derived_from ===
      value.evidence_set_id
    && value.genealogy.previous_state !==
      null
    && SHA256_PATTERN.test(
      value.genealogy.hash,
    )
  );
}

function assertCanonicalInput(
  value:
    unknown,
): asserts value is
  PlatformCoreCanonicalEvidenceSet {
  if (
    !isPlainRecord(
      value,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical EvidenceSet input must be a plain object.",
    );
  }

  const validation =
    validatePlatformCoreCanonicalSchema(
      "EVIDENCE_SET",
      value,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "STATIC_SCHEMA_VALIDATION_FAILED",
      "Canonical EvidenceSet input failed static schema validation.",
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
      "Canonical EvidenceSet payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Canonical EvidenceSet payload hash does not match its canonical preimage.",
    );
  }

  const canonical =
    value as unknown as
      PlatformCoreCanonicalEvidenceSet;

  if (
    !internalGenealogyIsCoherent(
      canonical,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical EvidenceSet genealogy is internally incoherent.",
    );
  }
}

function deriveStableMaterial(
  value:
    unknown,
): StableEvidenceSetMaterial {
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
      "Canonical EvidenceSet preimage could not be produced.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        canonicalPayloadPreimageUtf8,
      );
  } catch {
    failClosed(
      "INVALID_INPUT",
      "Canonical EvidenceSet preimage could not be reconstructed.",
    );
  }

  if (
    !isPlainRecord(
      parsed,
    )
  ) {
    failClosed(
      "INVALID_INPUT",
      "Canonical EvidenceSet preimage did not reconstruct a plain object.",
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
      "EVIDENCE_SET",
      reconstructed,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "STATIC_SCHEMA_VALIDATION_FAILED",
      "Reconstructed canonical EvidenceSet failed static validation.",
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
      "Reconstructed canonical EvidenceSet payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PAYLOAD_HASH_MISMATCH",
      "Reconstructed canonical EvidenceSet payload hash does not match.",
    );
  }

  const canonical =
    deepFreeze(
      reconstructed as unknown as
        PlatformCoreCanonicalEvidenceSet,
    );

  return Object.freeze({
    canonical,

    canonicalPayloadPreimageUtf8,

    payloadSha256:
      canonical.payload_sha256,

    predecessorEvidenceSetVersion:
      canonical.evidence_set_version ===
        1
        ? null
        : canonical.evidence_set_version -
          1,

    predecessorPayloadSha256:
      canonical.evidence_set_version ===
        1
        ? null
        : canonical.genealogy.hash,
  });
}

function assertResolutionPort(
  port:
    unknown,
): asserts port is
  PlatformCoreEvidenceSetReferenceResolutionPort {
  if (
    port === null
    || typeof port !==
      "object"
  ) {
    failClosed(
      "INVALID_INPUT",
      "EvidenceSet reference-resolution port is required.",
    );
  }

  const candidate =
    port as
      Partial<
        PlatformCoreEvidenceSetReferenceResolutionPort
      >;

  if (
    typeof candidate.resolveAuthority !==
      "function"
    || typeof candidate.resolveOwnerSubject !==
      "function"
    || typeof candidate.resolveReference !==
      "function"
  ) {
    failClosed(
      "INVALID_INPUT",
      "EvidenceSet reference-resolution port is incomplete.",
    );
  }
}

async function requireResolution(
  operation:
    () =>
      boolean |
      Promise<boolean>,
  label:
    string,
): Promise<void> {
  let resolved:
    boolean;

  try {
    resolved =
      await operation();
  } catch {
    failClosed(
      "REFERENCE_RESOLUTION_FAILED",
      `${label} resolution failed closed.`,
    );
  }

  if (
    resolved !==
      true
  ) {
    failClosed(
      "REFERENCE_RESOLUTION_FAILED",
      `${label} did not resolve.`,
    );
  }
}

function collectGenericReferences(
  canonical:
    PlatformCoreCanonicalEvidenceSet,
): readonly Readonly<{
  referenceType:
    PlatformCoreEvidenceSetReferenceType;

  reference:
    string;
}>[] {
  const requests:
    Array<
      Readonly<{
        referenceType:
          PlatformCoreEvidenceSetReferenceType;

        reference:
          string;
      }>
    > =
    [];

  const seen =
    new Set<string>();

  const add = (
    referenceType:
      PlatformCoreEvidenceSetReferenceType,
    reference:
      string | null,
  ): void => {
    if (
      reference ===
        null
    ) {
      return;
    }

    const key =
      `${referenceType}\u0000${reference}`;

    if (
      seen.has(
        key,
      )
    ) {
      return;
    }

    seen.add(
      key,
    );

    requests.push(
      Object.freeze({
        referenceType,
        reference,
      }),
    );
  };

  add(
    "EVIDENCE",
    canonical.evidence_reference,
  );

  for (
    const reference of
      canonical.control_references
  ) {
    add(
      "CONTROL",
      reference,
    );
  }

  for (
    const reference of
      canonical.observation_references
  ) {
    add(
      "OBSERVATION",
      reference,
    );
  }

  add(
    "RESULT",
    canonical.result_reference,
  );

  for (
    const reference of
      canonical.artifact_references
  ) {
    add(
      "ARTIFACT",
      reference,
    );
  }

  for (
    const reference of
      canonical.external_confirmation_references
  ) {
    add(
      "EXTERNAL_CONFIRMATION",
      reference,
    );
  }

  for (
    const reference of
      canonical.event_references
  ) {
    add(
      "EVENT",
      reference,
    );
  }

  add(
    "EVT",
    canonical.evt_reference,
  );

  add(
    "OPC",
    canonical.opc_reference,
  );

  add(
    "EVIDENCE",
    canonical.genealogy.evidence_reference,
  );

  return Object.freeze(
    requests,
  );
}

async function resolveRequiredReferences(
  canonical:
    PlatformCoreCanonicalEvidenceSet,
  port:
    PlatformCoreEvidenceSetReferenceResolutionPort,
): Promise<void> {
  await requireResolution(
    () =>
      port.resolveAuthority(
        Object.freeze({
          authorityRef:
            canonical.authority_ref,

          authorityVersion:
            canonical.authority_version,

          authoritySha256:
            canonical.authority_sha256,
        }),
      ),
    "Authority",
  );

  await requireResolution(
    () =>
      port.resolveOwnerSubject(
        Object.freeze({
          ownerSubjectRef:
            canonical.owner_subject_ref,
        }),
      ),
    "owner Subject",
  );

  const references =
    collectGenericReferences(
      canonical,
    );

  for (
    const request of
      references
  ) {
    await requireResolution(
      () =>
        port.resolveReference(
          request,
        ),
      `${request.referenceType} reference`,
    );
  }
}

function decodeRow(
  row:
    EvidenceSetRow,
): DecodedEvidenceSetRow {
  const evidenceSetId =
    requireString(
      row.evidence_set_id,
      "evidence_set_id",
    );

  const evidenceSetVersion =
    requireSafeInteger(
      row.evidence_set_version,
      "evidence_set_version",
    );

  const payloadSha256 =
    requireString(
      row.payload_sha256,
      "payload_sha256",
    );

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

  const canonicalPayloadPreimageUtf8 =
    requireString(
      row.canonical_payload_preimage_utf8,
      "canonical_payload_preimage_utf8",
    );

  if (
    canonicalPayloadPreimageUtf8.length ===
      0
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical preimage is empty.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        canonicalPayloadPreimageUtf8,
      );
  } catch {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical preimage is not valid JSON.",
    );
  }

  if (
    !isPlainRecord(
      parsed,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted canonical preimage did not decode to a plain object.",
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
      "EVIDENCE_SET",
      reconstructed,
    );

  if (
    !validation.valid
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted EvidenceSet failed static schema validation.",
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
      "Persisted EvidenceSet payload hash verification failed.",
    );
  }

  if (
    !hashValid
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted EvidenceSet payload hash does not match.",
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
      "Persisted EvidenceSet canonical preimage could not be reproduced.",
    );
  }

  if (
    recomputedPreimage !==
      canonicalPayloadPreimageUtf8
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted EvidenceSet preimage is not the exact canonical UTF-8 representation.",
    );
  }

  const canonical =
    deepFreeze(
      reconstructed as unknown as
        PlatformCoreCanonicalEvidenceSet,
    );

  if (
    !internalGenealogyIsCoherent(
      canonical,
    )
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted EvidenceSet genealogy is internally incoherent.",
    );
  }

  const state =
    requireString(
      row.state,
      "state",
    );

  const caseId =
    requireString(
      row.case_id,
      "case_id",
    );

  const domain =
    requireString(
      row.domain,
      "domain",
    );

  const ownerSubjectRef =
    requireString(
      row.owner_subject_ref,
      "owner_subject_ref",
    );

  const authorityRef =
    requireString(
      row.authority_ref,
      "authority_ref",
    );

  const authorityVersion =
    requireSafeInteger(
      row.authority_version,
      "authority_version",
    );

  const authoritySha256 =
    requireString(
      row.authority_sha256,
      "authority_sha256",
    );

  const resultReference =
    requireNullableString(
      row.result_reference,
      "result_reference",
    );

  const finalizedAtText =
    requireNullableString(
      row.finalized_at_text,
      "finalized_at_text",
    );

  const predecessorEvidenceSetVersion =
    requireNullableSafeInteger(
      row.predecessor_evidence_set_version,
      "predecessor_evidence_set_version",
    );

  const predecessorPayloadSha256 =
    requireNullableString(
      row.predecessor_payload_sha256,
      "predecessor_payload_sha256",
    );

  if (
    evidenceSetId !==
      canonical.evidence_set_id
    || evidenceSetVersion !==
      canonical.evidence_set_version
    || state !==
      canonical.state
    || caseId !==
      canonical.case_id
    || domain !==
      canonical.domain
    || ownerSubjectRef !==
      canonical.owner_subject_ref
    || authorityRef !==
      canonical.authority_ref
    || authorityVersion !==
      canonical.authority_version
    || authoritySha256 !==
      canonical.authority_sha256
    || resultReference !==
      canonical.result_reference
    || finalizedAtText !==
      canonical.finalized_at
  ) {
    failClosed(
      "PERSISTED_RECORD_INVALID",
      "Persisted EvidenceSet extracted columns do not match canonical content.",
    );
  }

  if (
    canonical.evidence_set_version ===
      1
  ) {
    if (
      predecessorEvidenceSetVersion !==
        null
      || predecessorPayloadSha256 !==
        null
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted genesis EvidenceSet carries predecessor metadata.",
      );
    }
  } else {
    if (
      predecessorEvidenceSetVersion !==
        canonical.evidence_set_version -
          1
      || predecessorPayloadSha256 !==
        canonical.genealogy.hash
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted successor predecessor metadata does not match canonical genealogy.",
      );
    }
  }

  const persistedAt =
    normalizeTimestamp(
      row.persisted_at,
      "persisted_at",
    );

  return Object.freeze({
    canonical,

    canonicalPayloadPreimageUtf8,

    payloadSha256,

    persistedAt,
  });
}

function safeDecodeRow(
  row:
    EvidenceSetRow,
): SafeDecodedRow {
  try {
    return Object.freeze({
      ok:
        true,

      decoded:
        decodeRow(
          row,
        ),
    });
  } catch {
    return Object.freeze({
      ok:
        false,
    });
  }
}

function sameTarget(
  left:
    PlatformCoreCanonicalEvidenceSet,
  right:
    PlatformCoreCanonicalEvidenceSet,
): boolean {
  return (
    left.target.target_class ===
      right.target.target_class
    && left.target.target_ref ===
      right.target.target_ref
    && left.target.system_ref ===
      right.target.system_ref
  );
}

function crossRevisionMatches(
  predecessor:
    PlatformCoreCanonicalEvidenceSet,
  current:
    PlatformCoreCanonicalEvidenceSet,
): boolean {
  if (
    current.evidence_set_id !==
      predecessor.evidence_set_id
    || current.evidence_set_version !==
      predecessor.evidence_set_version +
        1
    || current.case_id !==
      predecessor.case_id
    || current.domain !==
      predecessor.domain
    || !sameTarget(
      current,
      predecessor,
    )
    || current.owner_subject_ref !==
      predecessor.owner_subject_ref
    || current.authority_ref !==
      predecessor.authority_ref
    || current.authority_version !==
      predecessor.authority_version
    || current.authority_sha256 !==
      predecessor.authority_sha256
    || current.created_at !==
      predecessor.created_at
  ) {
    return false;
  }

  if (
    current.genealogy.derived_from !==
      predecessor.evidence_set_id
    || current.genealogy.previous_state !==
      predecessor.state
    || current.genealogy.new_state !==
      current.state
    || current.genealogy.hash !==
      predecessor.payload_sha256
  ) {
    return false;
  }

  if (
    predecessor.state ===
      "CLOSED"
  ) {
    if (
      current.state !==
        "CLOSED"
      || current.result_reference !==
        predecessor.result_reference
      || current.finalized_at !==
        predecessor.finalized_at
    ) {
      return false;
    }
  }

  return true;
}

function exactDecodedMatch(
  decoded:
    DecodedEvidenceSetRow,
  material:
    StableEvidenceSetMaterial,
): boolean {
  return (
    decoded.canonical.evidence_set_id ===
      material.canonical.evidence_set_id
    && decoded.canonical.evidence_set_version ===
      material.canonical.evidence_set_version
    && decoded.payloadSha256 ===
      material.payloadSha256
    && decoded.canonicalPayloadPreimageUtf8 ===
      material.canonicalPayloadPreimageUtf8
  );
}

async function queryExactRevision(
  transaction:
    HbceTransactionContext,
  evidenceSetId:
    string,
  evidenceSetVersion:
    number,
): Promise<RowLookup> {
  const result =
    await transaction.query<EvidenceSetRow>(
      `
        SELECT
          evidence_set_id,
          evidence_set_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          case_id,
          domain,
          owner_subject_ref,
          authority_ref,
          authority_version,
          authority_sha256,
          result_reference,
          finalized_at_text,
          predecessor_evidence_set_version,
          predecessor_payload_sha256,
          persisted_at
        FROM ${TABLE}
        WHERE
          evidence_set_id = $1
          AND evidence_set_version = $2
      `,
      [
        evidenceSetId,
        evidenceSetVersion,
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
        "AMBIGUOUS",
    });
  }

  return Object.freeze({
    kind:
      "FOUND",

    row:
      result.rows[0],
  });
}

async function persistAttempt(
  transaction:
    HbceTransactionContext,
  material:
    StableEvidenceSetMaterial,
): Promise<PersistAttempt> {
  const canonical =
    material.canonical;

  if (
    canonical.evidence_set_version >
      1
  ) {
    const predecessorLookup =
      await queryExactRevision(
        transaction,
        canonical.evidence_set_id,
        canonical.evidence_set_version -
          1,
      );

    if (
      predecessorLookup.kind ===
        "NOT_FOUND"
    ) {
      return Object.freeze({
        kind:
          "PREDECESSOR_NOT_FOUND",
      });
    }

    if (
      predecessorLookup.kind ===
        "AMBIGUOUS"
    ) {
      return Object.freeze({
        kind:
          "PREDECESSOR_INVALID",
      });
    }

    const predecessorDecoded =
      safeDecodeRow(
        predecessorLookup.row,
      );

    if (
      !predecessorDecoded.ok
    ) {
      return Object.freeze({
        kind:
          "PREDECESSOR_INVALID",
      });
    }

    if (
      !crossRevisionMatches(
        predecessorDecoded.decoded.canonical,
        canonical,
      )
    ) {
      return Object.freeze({
        kind:
          "PREDECESSOR_BINDING_MISMATCH",
      });
    }
  }

  const inserted =
    await transaction.query<EvidenceSetRow>(
      `
        INSERT INTO ${TABLE} (
          evidence_set_id,
          evidence_set_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          case_id,
          domain,
          owner_subject_ref,
          authority_ref,
          authority_version,
          authority_sha256,
          result_reference,
          finalized_at_text,
          predecessor_evidence_set_version,
          predecessor_payload_sha256
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
          $11,
          $12,
          $13,
          $14,
          $15
        )
        ON CONFLICT DO NOTHING
        RETURNING
          evidence_set_id,
          evidence_set_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          case_id,
          domain,
          owner_subject_ref,
          authority_ref,
          authority_version,
          authority_sha256,
          result_reference,
          finalized_at_text,
          predecessor_evidence_set_version,
          predecessor_payload_sha256,
          persisted_at
      `,
      [
        canonical.evidence_set_id,
        canonical.evidence_set_version,
        material.payloadSha256,
        material.canonicalPayloadPreimageUtf8,
        canonical.state,
        canonical.case_id,
        canonical.domain,
        canonical.owner_subject_ref,
        canonical.authority_ref,
        canonical.authority_version,
        canonical.authority_sha256,
        canonical.result_reference,
        canonical.finalized_at,
        material.predecessorEvidenceSetVersion,
        material.predecessorPayloadSha256,
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
      || !exactDecodedMatch(
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
        "PERSISTED_INVALID",
    });
  }

  const existing =
    await transaction.query<EvidenceSetRow>(
      `
        SELECT
          evidence_set_id,
          evidence_set_version,
          payload_sha256,
          canonical_payload_preimage_utf8,
          state,
          case_id,
          domain,
          owner_subject_ref,
          authority_ref,
          authority_version,
          authority_sha256,
          result_reference,
          finalized_at_text,
          predecessor_evidence_set_version,
          predecessor_payload_sha256,
          persisted_at
        FROM ${TABLE}
        WHERE
          (
            evidence_set_id = $1
            AND evidence_set_version = $2
          )
          OR payload_sha256 = $3
        ORDER BY
          evidence_set_id ASC,
          evidence_set_version ASC
      `,
      [
        canonical.evidence_set_id,
        canonical.evidence_set_version,
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
  evidenceSetId:
    string,
  evidenceSetVersion:
    number,
): Promise<ReadAttempt> {
  const lookup =
    await queryExactRevision(
      transaction,
      evidenceSetId,
      evidenceSetVersion,
    );

  if (
    lookup.kind ===
      "NOT_FOUND"
  ) {
    return Object.freeze({
      kind:
        "NOT_FOUND",
    });
  }

  if (
    lookup.kind ===
      "AMBIGUOUS"
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  const decoded =
    safeDecodeRow(
      lookup.row,
    );

  if (
    !decoded.ok
  ) {
    return Object.freeze({
      kind:
        "PERSISTED_INVALID",
    });
  }

  const canonical =
    decoded.decoded.canonical;

  if (
    canonical.evidence_set_version >
      1
  ) {
    const predecessorLookup =
      await queryExactRevision(
        transaction,
        canonical.evidence_set_id,
        canonical.evidence_set_version -
          1,
      );

    if (
      predecessorLookup.kind !==
        "FOUND"
    ) {
      return Object.freeze({
        kind:
          "PERSISTED_INVALID",
      });
    }

    const predecessorDecoded =
      safeDecodeRow(
        predecessorLookup.row,
      );

    if (
      !predecessorDecoded.ok
      || !crossRevisionMatches(
        predecessorDecoded.decoded.canonical,
        canonical,
      )
    ) {
      return Object.freeze({
        kind:
          "PERSISTED_INVALID",
      });
    }
  }

  return Object.freeze({
    kind:
      "FOUND",

    decoded:
      decoded.decoded,
  });
}

export async function persistPlatformCoreCanonicalEvidenceSet(
  canonicalEvidenceSet:
    unknown,
  referenceResolutionPort:
    unknown,
): Promise<PlatformCoreEvidenceSetPersistence> {
  const material =
    deriveStableMaterial(
      canonicalEvidenceSet,
    );

  assertResolutionPort(
    referenceResolutionPort,
  );

  await resolveRequiredReferences(
    material.canonical,
    referenceResolutionPort,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_EVIDENCE_SET_MAX_ATTEMPTS;
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
            PLATFORM_CORE_EVIDENCE_SET_TRANSACTION_ISOLATION,
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
            PLATFORM_CORE_EVIDENCE_SET_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "EvidenceSet persistence exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "EvidenceSet persistence transaction failed.",
      );
    }

    const result =
      outcome.value;

    if (
      result.kind ===
        "PREDECESSOR_NOT_FOUND"
    ) {
      failClosed(
        "PREDECESSOR_NOT_FOUND",
        "EvidenceSet successor requires its exact durable predecessor.",
      );
    }

    if (
      result.kind ===
        "PREDECESSOR_INVALID"
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Durable EvidenceSet predecessor is invalid.",
      );
    }

    if (
      result.kind ===
        "PREDECESSOR_BINDING_MISMATCH"
    ) {
      failClosed(
        "PREDECESSOR_BINDING_MISMATCH",
        "EvidenceSet successor does not bind exactly to its durable predecessor.",
      );
    }

    if (
      result.kind ===
        "CONFLICTING_DUPLICATE"
    ) {
      failClosed(
        "CONFLICTING_DUPLICATE",
        "EvidenceSet durable identity or payload hash conflicts with different canonical material.",
      );
    }

    if (
      result.kind ===
        "PERSISTED_INVALID"
    ) {
      failClosed(
        "PERSISTED_RECORD_INVALID",
        "Persisted EvidenceSet row failed canonical read-back verification.",
      );
    }

    return Object.freeze({
      evidenceSet:
        result.decoded.canonical,

      persistedAt:
        result.decoded.persistedAt,

      idempotentReplay:
        result.kind ===
          "EXISTING",
    });
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "EvidenceSet persistence reached an unreachable retry state.",
  );
}

export async function readPlatformCoreCanonicalEvidenceSet(
  evidenceSetId:
    unknown,
  evidenceSetVersion:
    unknown,
): Promise<
  PlatformCoreCanonicalEvidenceSet | null
> {
  assertEvidenceSetId(
    evidenceSetId,
  );

  assertEvidenceSetVersion(
    evidenceSetVersion,
  );

  for (
    let attempt = 1;
    attempt <=
      PLATFORM_CORE_EVIDENCE_SET_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const outcome =
      await withHbceDatabaseTransaction(
        async (
          transaction,
        ) =>
          readAttempt(
            transaction,
            evidenceSetId,
            evidenceSetVersion,
          ),
        {
          isolationLevel:
            PLATFORM_CORE_EVIDENCE_SET_TRANSACTION_ISOLATION,

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
            PLATFORM_CORE_EVIDENCE_SET_MAX_ATTEMPTS
        ) {
          continue;
        }

        failClosed(
          "SERIALIZATION_RETRIES_EXHAUSTED",
          "EvidenceSet read exhausted SERIALIZABLE retries.",
        );
      }

      failClosed(
        "DATABASE_FAILURE",
        "EvidenceSet read transaction failed.",
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
        "Persisted EvidenceSet revision failed canonical verification.",
      );
    }

    return outcome.value.decoded.canonical;
  }

  return failClosed(
    "SERIALIZATION_RETRIES_EXHAUSTED",
    "EvidenceSet read reached an unreachable retry state.",
  );
}
