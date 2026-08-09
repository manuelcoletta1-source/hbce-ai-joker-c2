import { sql } from "@vercel/postgres";

import {
  buildRuntimeOperationsLedgerEntry,
  verifyRuntimeOperationsLedgerEntry,
  type RuntimeOperationsLedgerEntry,
} from "./runtime-operations-ledger";

import type {
  RuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-envelope";

import type {
  RuntimeOperationsOpcVerificationResult,
} from "./runtime-operations-opc-verifier";

const HERMETICUM_SIGIL = "🜏" as const;

const LEDGER_TABLE =
  "public.hbce_runtime_operations_ledger" as const;

const CANONICAL_ENTRY_TYPE =
  "HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY" as const;

const CANONICAL_LEDGER_REVISION =
  "HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0" as const;

const CANONICAL_RUNTIME_IPR =
  "IPR-AI-0001" as const;

const CANONICAL_HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

const CANONICAL_ORGANIZATION =
  "HERMETICUM B.C.E. S.r.l." as const;

const CANONICAL_EVENT_TYPE =
  "RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE" as const;

export type RuntimeOperationsLedgerRepositoryRecord = {
  entry: RuntimeOperationsLedgerEntry;

  persistence: {
    table: typeof LEDGER_TABLE;

    recordedAt: string;

    /**
     * SHA-256 of the stable logical operation identifier.
     *
     * NULL is valid only for legacy rows created before the
     * operation-idempotency upgrade or for transitional callers that
     * have not yet been upgraded to supply an operation id.
     *
     * Raw operation identifiers are never persisted by this repository.
     */
    operationIdSha256: string | null;

    /**
     * True only when this repository call inserted a new row.
     *
     * Read APIs return false.
     */
    inserted: boolean;

    /**
     * True only when an append call resolved to an already-persisted
     * row carrying the same operation_id_sha256 and the exact same
     * Evidence / OPC payload hashes.
     */
    idempotentReplay: boolean;
  };
};

export type RuntimeOperationsLedgerListOptions = {
  limit?: number;
  afterSequence?: number;
};

export type RuntimeOperationsLedgerAppendInput = {
  envelope:
    RuntimeOperationsOpcEnvelope;

  verification:
    RuntimeOperationsOpcVerificationResult;

  /**
   * Optional during the migration window.
   *
   * New production callers should provide this value. The general
   * persistent append service will be upgraded in the next layer to
   * derive it from the caller-supplied stable logical operation id.
   */
  operationIdSha256?:
    string | null;
};

type DatabaseRow = Record<string, unknown>;

type PostgreSqlLikeError = {
  code?: unknown;
  constraint?: unknown;
};

export class RuntimeOperationsLedgerRepositoryError extends Error {
  readonly code: string;
  readonly causeValue: unknown;

  constructor(
    code: string,
    message: string,
    causeValue?: unknown,
  ) {
    super(message);

    this.name =
      "RuntimeOperationsLedgerRepositoryError";

    this.code =
      code;

    this.causeValue =
      causeValue;
  }
}

function fail(
  code: string,
  message: string,
  causeValue?: unknown,
): never {
  throw new RuntimeOperationsLedgerRepositoryError(
    code,
    message,
    causeValue,
  );
}

function asString(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_STRING",
      `Invalid database value for ${field}.`,
      value,
    );
  }

  return value;
}

function asBoolean(
  value: unknown,
  field: string,
): boolean {
  if (typeof value !== "boolean") {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_BOOLEAN",
      `Invalid database value for ${field}.`,
      value,
    );
  }

  return value;
}

function asSafeInteger(
  value: unknown,
  field: string,
): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "bigint"
        ? Number(value)
        : typeof value === "string"
          ? Number(value)
          : Number.NaN;

  if (
    !Number.isSafeInteger(normalized)
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_INTEGER",
      `Invalid database integer for ${field}.`,
      value,
    );
  }

  return normalized;
}

function asNullableString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null;
  }

  return asString(
    value,
    field,
  );
}

function asIsoTimestamp(
  value: unknown,
  field: string,
): string {
  const candidate =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? value
        : "";

  const parsed =
    Date.parse(candidate);

  if (
    candidate.length === 0 ||
    Number.isNaN(parsed)
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_TIMESTAMP",
      `Invalid database timestamp for ${field}.`,
      value,
    );
  }

  return new Date(
    parsed,
  ).toISOString();
}

function assertEquals<T>(
  actual: T,
  expected: T,
  field: string,
): void {
  if (!Object.is(actual, expected)) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_CANONICAL_MISMATCH",
      `Canonical database invariant failed for ${field}.`,
      {
        expected,
        actual,
      },
    );
  }
}

function assertSha256(
  value: string,
  field: string,
): void {
  if (
    !/^[0-9a-f]{64}$/.test(
      value,
    )
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_SHA256",
      `Invalid SHA-256 value for ${field}.`,
      value,
    );
  }
}

function normalizeOperationIdSha256(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  assertSha256(
    value,
    "operation_id_sha256",
  );

  return value;
}

function mapDatabaseRow(
  row: DatabaseRow,
): RuntimeOperationsLedgerRepositoryRecord {
  const sequence =
    asSafeInteger(
      row.sequence,
      "sequence",
    );

  const hermeticumSigil =
    asString(
      row.hermeticum_sigil,
      "hermeticum_sigil",
    );

  const entryType =
    asString(
      row.entry_type,
      "entry_type",
    );

  const revision =
    asString(
      row.revision,
      "revision",
    );

  const runtimeIpr =
    asString(
      row.runtime_ipr,
      "runtime_ipr",
    );

  const humanAuthorityIpr =
    asString(
      row.human_authority_ipr,
      "human_authority_ipr",
    );

  const organization =
    asString(
      row.organization,
      "organization",
    );

  const evidenceRevision =
    asString(
      row.evidence_revision,
      "evidence_revision",
    );

  const evidenceSha256 =
    asString(
      row.evidence_sha256,
      "evidence_sha256",
    );

  const envelopeRevision =
    asString(
      row.envelope_revision,
      "envelope_revision",
    );

  const envelopeSha256 =
    asString(
      row.envelope_sha256,
      "envelope_sha256",
    );

  const internalSeal =
    asString(
      row.internal_seal,
      "internal_seal",
    );

  const eventType =
    asString(
      row.event_type,
      "event_type",
    );

  const sourceRevision =
    asString(
      row.source_revision,
      "source_revision",
    );

  const sourceGeneratedAt =
    asIsoTimestamp(
      row.source_generated_at,
      "source_generated_at",
    );

  const operationalStatus =
    asString(
      row.operational_status,
      "operational_status",
    );

  const verifierRevision =
    asString(
      row.verifier_revision,
      "verifier_revision",
    );

  const verified =
    asBoolean(
      row.verified,
      "verified",
    );

  const verificationTotalChecks =
    asSafeInteger(
      row.verification_total_checks,
      "verification_total_checks",
    );

  const verificationPassedChecks =
    asSafeInteger(
      row.verification_passed_checks,
      "verification_passed_checks",
    );

  const verificationFailedChecks =
    asSafeInteger(
      row.verification_failed_checks,
      "verification_failed_checks",
    );

  const previousEntrySha256 =
    asNullableString(
      row.previous_entry_sha256,
      "previous_entry_sha256",
    );

  const entrySha256 =
    asString(
      row.entry_sha256,
      "entry_sha256",
    );

  const chainRootSha256 =
    asString(
      row.chain_root_sha256,
      "chain_root_sha256",
    );

  const appendOnly =
    asBoolean(
      row.append_only,
      "append_only",
    );

  const hashOnlyEvidence =
    asBoolean(
      row.hash_only_evidence,
      "hash_only_evidence",
    );

  const humanAuthorizationRequired =
    asBoolean(
      row.human_authorization_required,
      "human_authorization_required",
    );

  const autonomousAuthorization =
    asBoolean(
      row.autonomous_authorization,
      "autonomous_authorization",
    );

  const runtimeActivation =
    asBoolean(
      row.runtime_activation,
      "runtime_activation",
    );

  const noSubmitFromCode =
    asBoolean(
      row.no_submit_from_code,
      "no_submit_from_code",
    );

  const legalCertification =
    asBoolean(
      row.legal_certification,
      "legal_certification",
    );

  const qualifiedElectronicSignature =
    asBoolean(
      row.qualified_electronic_signature,
      "qualified_electronic_signature",
    );

  const recordedAt =
    asIsoTimestamp(
      row.recorded_at,
      "recorded_at",
    );

  /*
   * Backward-compatible mapper behavior:
   *
   * - production after the migration returns the column
   * - legacy database rows contain NULL
   * - an unmigrated non-production schema may omit the field from SELECT *
   *
   * Writes using operation idempotency still require the migrated schema.
   */
  const operationIdSha256 =
    row.operation_id_sha256 ===
      undefined
      ? null
      : asNullableString(
          row.operation_id_sha256,
          "operation_id_sha256",
        );

  assertEquals(
    hermeticumSigil,
    HERMETICUM_SIGIL,
    "hermeticum_sigil",
  );

  assertEquals(
    entryType,
    CANONICAL_ENTRY_TYPE,
    "entry_type",
  );

  assertEquals(
    revision,
    CANONICAL_LEDGER_REVISION,
    "revision",
  );

  assertEquals(
    runtimeIpr,
    CANONICAL_RUNTIME_IPR,
    "runtime_ipr",
  );

  assertEquals(
    humanAuthorityIpr,
    CANONICAL_HUMAN_AUTHORITY_IPR,
    "human_authority_ipr",
  );

  assertEquals(
    organization,
    CANONICAL_ORGANIZATION,
    "organization",
  );

  assertEquals(
    eventType,
    CANONICAL_EVENT_TYPE,
    "event_type",
  );

  assertEquals(
    verified,
    true,
    "verified",
  );

  assertEquals(
    verificationFailedChecks,
    0,
    "verification_failed_checks",
  );

  assertEquals(
    appendOnly,
    true,
    "append_only",
  );

  assertEquals(
    hashOnlyEvidence,
    true,
    "hash_only_evidence",
  );

  assertEquals(
    humanAuthorizationRequired,
    true,
    "human_authorization_required",
  );

  assertEquals(
    autonomousAuthorization,
    false,
    "autonomous_authorization",
  );

  assertEquals(
    runtimeActivation,
    false,
    "runtime_activation",
  );

  assertEquals(
    noSubmitFromCode,
    true,
    "no_submit_from_code",
  );

  assertEquals(
    legalCertification,
    false,
    "legal_certification",
  );

  assertEquals(
    qualifiedElectronicSignature,
    false,
    "qualified_electronic_signature",
  );

  if (
    verificationPassedChecks +
      verificationFailedChecks !==
    verificationTotalChecks
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_DB_INVALID_VERIFICATION_COUNTS",
      "Persisted verification counts are inconsistent.",
      {
        verificationTotalChecks,
        verificationPassedChecks,
        verificationFailedChecks,
      },
    );
  }

  assertSha256(
    evidenceSha256,
    "evidence_sha256",
  );

  assertSha256(
    envelopeSha256,
    "envelope_sha256",
  );

  assertSha256(
    internalSeal,
    "internal_seal",
  );

  if (
    previousEntrySha256 !== null
  ) {
    assertSha256(
      previousEntrySha256,
      "previous_entry_sha256",
    );
  }

  assertSha256(
    entrySha256,
    "entry_sha256",
  );

  assertSha256(
    chainRootSha256,
    "chain_root_sha256",
  );

  if (
    operationIdSha256 !== null
  ) {
    assertSha256(
      operationIdSha256,
      "operation_id_sha256",
    );
  }

  const entry: RuntimeOperationsLedgerEntry = {
    entryType:
      CANONICAL_ENTRY_TYPE,

    revision:
      CANONICAL_LEDGER_REVISION,

    sequence,

    identity: {
      runtimeIpr:
        CANONICAL_RUNTIME_IPR,

      humanAuthorityIpr:
        CANONICAL_HUMAN_AUTHORITY_IPR,

      organization:
        CANONICAL_ORGANIZATION,
    },

    source: {
      evidenceRevision,

      evidenceSha256,

      envelopeRevision,

      envelopeSha256,

      internalSeal,

      eventType:
        CANONICAL_EVENT_TYPE,

      sourceRevision,

      sourceGeneratedAt,

      operationalStatus,
    },

    verification: {
      verifierRevision,

      verified:
        true,

      totalChecks:
        verificationTotalChecks,

      passedChecks:
        verificationPassedChecks,

      failedChecks:
        0,
    },

    chain: {
      previousEntrySha256,

      entrySha256,

      chainRootSha256,
    },

    governance: {
      appendOnly:
        true,

      hashOnlyEvidence:
        true,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivation:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,

      qualifiedElectronicSignature:
        false,
    },
  };

  return {
    entry,

    persistence: {
      table:
        LEDGER_TABLE,

      recordedAt,

      operationIdSha256,

      inserted:
        false,

      idempotentReplay:
        false,
    },
  };
}

function assertPositiveSequence(
  sequence: number,
): void {
  if (
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_INVALID_SEQUENCE",
      "Ledger sequence must be a positive safe integer.",
      sequence,
    );
  }
}

function normalizeLimit(
  value: number | undefined,
): number {
  const limit =
    value ?? 100;

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 1000
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_INVALID_LIMIT",
      "Ledger list limit must be an integer between 1 and 1000.",
      value,
    );
  }

  return limit;
}

function assertVerificationMatchesEnvelope(
  envelope:
    RuntimeOperationsOpcEnvelope,
  verification:
    RuntimeOperationsOpcVerificationResult,
): void {
  if (
    verification.verified !== true ||
    verification.operationalStatus !==
      "PASS" ||
    verification.summary.failedChecks !==
      0
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_UNVERIFIED_ENVELOPE",
      "Only independently verified OPC/EVT envelopes may be persisted.",
      {
        verified:
          verification.verified,

        operationalStatus:
          verification.operationalStatus,

        failedChecks:
          verification.summary.failedChecks,
      },
    );
  }

  assertEquals(
    verification.integrity
      .evidenceSha256Expected,
    envelope.opc
      .evidenceSha256,
    "verification.evidenceSha256Expected",
  );

  assertEquals(
    verification.integrity
      .evidenceSha256Actual,
    envelope.opc
      .evidenceSha256,
    "verification.evidenceSha256Actual",
  );

  assertEquals(
    verification.integrity
      .envelopeSha256Expected,
    envelope.integrity
      .envelopeSha256,
    "verification.envelopeSha256Expected",
  );

  assertEquals(
    verification.integrity
      .envelopeSha256Actual,
    envelope.integrity
      .envelopeSha256,
    "verification.envelopeSha256Actual",
  );

  assertEquals(
    verification.integrity
      .internalSealExpected,
    envelope.internalSeal
      .value,
    "verification.internalSealExpected",
  );

  assertEquals(
    verification.integrity
      .internalSealActual,
    envelope.internalSeal
      .value,
    "verification.internalSealActual",
  );

  assertEquals(
    envelope.identity.runtimeIpr,
    CANONICAL_RUNTIME_IPR,
    "envelope.identity.runtimeIpr",
  );

  assertEquals(
    envelope.identity
      .humanAuthorityIpr,
    CANONICAL_HUMAN_AUTHORITY_IPR,
    "envelope.identity.humanAuthorityIpr",
  );

  assertEquals(
    envelope.identity
      .organization,
    CANONICAL_ORGANIZATION,
    "envelope.identity.organization",
  );

  assertEquals(
    envelope.event.eventType,
    CANONICAL_EVENT_TYPE,
    "envelope.event.eventType",
  );

  assertEquals(
    envelope.governance
      .humanAuthorizationRequired,
    true,
    "envelope.governance.humanAuthorizationRequired",
  );

  assertEquals(
    envelope.governance
      .autonomousAuthorization,
    false,
    "envelope.governance.autonomousAuthorization",
  );

  assertEquals(
    envelope.governance
      .runtimeActivation,
    false,
    "envelope.governance.runtimeActivation",
  );

  assertEquals(
    envelope.governance
      .legalCertification,
    false,
    "envelope.governance.legalCertification",
  );

  assertEquals(
    envelope.internalSeal
      .qualifiedElectronicSignature,
    false,
    "envelope.internalSeal.qualifiedElectronicSignature",
  );
}

function assertIdempotentReplayMatchesEnvelope(
  existing:
    RuntimeOperationsLedgerRepositoryRecord,
  envelope:
    RuntimeOperationsOpcEnvelope,
): void {
  const mismatches: string[] =
    [];

  if (
    existing.entry.source
      .evidenceSha256 !==
    envelope.opc
      .evidenceSha256
  ) {
    mismatches.push(
      "evidenceSha256",
    );
  }

  if (
    existing.entry.source
      .envelopeSha256 !==
    envelope.integrity
      .envelopeSha256
  ) {
    mismatches.push(
      "envelopeSha256",
    );
  }

  if (
    existing.entry.source
      .internalSeal !==
    envelope.internalSeal
      .value
  ) {
    mismatches.push(
      "internalSeal",
    );
  }

  if (
    existing.entry.source
      .sourceRevision !==
    envelope.event
      .sourceRevision
  ) {
    mismatches.push(
      "sourceRevision",
    );
  }

  if (
    existing.entry.source
      .sourceGeneratedAt !==
    new Date(
      envelope.event
        .sourceGeneratedAt,
    ).toISOString()
  ) {
    mismatches.push(
      "sourceGeneratedAt",
    );
  }

  if (
    mismatches.length > 0
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_OPERATION_IDEMPOTENCY_CONFLICT",
      "The supplied operation_id_sha256 is already bound to a different persisted Evidence / OPC payload.",
      {
        sequence:
          existing.entry
            .sequence,

        operationIdSha256:
          existing.persistence
            .operationIdSha256,

        mismatches,

        persisted: {
          evidenceSha256:
            existing.entry.source
              .evidenceSha256,

          envelopeSha256:
            existing.entry.source
              .envelopeSha256,

          internalSeal:
            existing.entry.source
              .internalSeal,

          sourceRevision:
            existing.entry.source
              .sourceRevision,

          sourceGeneratedAt:
            existing.entry.source
              .sourceGeneratedAt,
        },

        attempted: {
          evidenceSha256:
            envelope.opc
              .evidenceSha256,

          envelopeSha256:
            envelope.integrity
              .envelopeSha256,

          internalSeal:
            envelope.internalSeal
              .value,

          sourceRevision:
            envelope.event
              .sourceRevision,

          sourceGeneratedAt:
            envelope.event
              .sourceGeneratedAt,
        },
      },
    );
  }
}

function asIdempotentReplay(
  record:
    RuntimeOperationsLedgerRepositoryRecord,
): RuntimeOperationsLedgerRepositoryRecord {
  return {
    ...record,

    persistence: {
      ...record.persistence,

      inserted:
        false,

      idempotentReplay:
        true,
    },
  };
}

function asInsertedRecord(
  record:
    RuntimeOperationsLedgerRepositoryRecord,
): RuntimeOperationsLedgerRepositoryRecord {
  return {
    ...record,

    persistence: {
      ...record.persistence,

      inserted:
        true,

      idempotentReplay:
        false,
    },
  };
}

function isOperationIdUniqueViolation(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const postgresError =
    error as PostgreSqlLikeError;

  return (
    postgresError.code ===
      "23505" &&
    postgresError.constraint ===
      "hbce_runtime_operations_ledger_operation_id_sha256_unique"
  );
}

function wrapDatabaseError(
  operation: string,
  error: unknown,
): never {
  if (
    error instanceof
    RuntimeOperationsLedgerRepositoryError
  ) {
    throw error;
  }

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  fail(
    "HBCE_RUNTIME_OPERATIONS_LEDGER_DATABASE_FAILURE",
    `Runtime Operations ledger database ${operation} failed closed: ${message}`,
    error,
  );
}

export async function getLatestRuntimeOperationsLedgerEntry():
  Promise<RuntimeOperationsLedgerRepositoryRecord | null> {
  try {
    const result = await sql`
      SELECT *
      FROM public.hbce_runtime_operations_ledger
      ORDER BY sequence DESC
      LIMIT 1
    `;

    if (
      result.rows.length === 0
    ) {
      return null;
    }

    return mapDatabaseRow(
      result.rows[0] as DatabaseRow,
    );
  } catch (error) {
    return wrapDatabaseError(
      "getLatest",
      error,
    );
  }
}

export async function getRuntimeOperationsLedgerEntryBySequence(
  sequence: number,
): Promise<RuntimeOperationsLedgerRepositoryRecord | null> {
  assertPositiveSequence(
    sequence,
  );

  try {
    const result = await sql`
      SELECT *
      FROM public.hbce_runtime_operations_ledger
      WHERE sequence = ${sequence}
      LIMIT 1
    `;

    if (
      result.rows.length === 0
    ) {
      return null;
    }

    return mapDatabaseRow(
      result.rows[0] as DatabaseRow,
    );
  } catch (error) {
    return wrapDatabaseError(
      "getBySequence",
      error,
    );
  }
}

export async function getRuntimeOperationsLedgerEntryByOperationIdSha256(
  operationIdSha256: string,
): Promise<RuntimeOperationsLedgerRepositoryRecord | null> {
  const normalized =
    normalizeOperationIdSha256(
      operationIdSha256,
    );

  if (!normalized) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_OPERATION_ID_REQUIRED",
      "operationIdSha256 is required for idempotency lookup.",
      operationIdSha256,
    );
  }

  try {
    const result = await sql`
      SELECT *
      FROM public.hbce_runtime_operations_ledger
      WHERE operation_id_sha256 = ${normalized}
      LIMIT 1
    `;

    if (
      result.rows.length === 0
    ) {
      return null;
    }

    return mapDatabaseRow(
      result.rows[0] as DatabaseRow,
    );
  } catch (error) {
    return wrapDatabaseError(
      "getByOperationIdSha256",
      error,
    );
  }
}

export async function listRuntimeOperationsLedgerEntries(
  options:
    RuntimeOperationsLedgerListOptions = {},
): Promise<RuntimeOperationsLedgerRepositoryRecord[]> {
  const limit =
    normalizeLimit(
      options.limit,
    );

  const afterSequence =
    options.afterSequence ?? 0;

  if (
    !Number.isSafeInteger(
      afterSequence,
    ) ||
    afterSequence < 0
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_INVALID_AFTER_SEQUENCE",
      "afterSequence must be a non-negative safe integer.",
      afterSequence,
    );
  }

  try {
    const result = await sql`
      SELECT *
      FROM public.hbce_runtime_operations_ledger
      WHERE sequence > ${afterSequence}
      ORDER BY sequence ASC
      LIMIT ${limit}
    `;

    return result.rows.map(
      (row) =>
        mapDatabaseRow(
          row as DatabaseRow,
        ),
    );
  } catch (error) {
    return wrapDatabaseError(
      "list",
      error,
    );
  }
}

export async function appendVerifiedRuntimeOperationsLedgerEntry(
  input:
    RuntimeOperationsLedgerAppendInput,
): Promise<RuntimeOperationsLedgerRepositoryRecord> {
  assertVerificationMatchesEnvelope(
    input.envelope,
    input.verification,
  );

  const operationIdSha256 =
    normalizeOperationIdSha256(
      input.operationIdSha256,
    );

  /*
   * First idempotency gate.
   *
   * This prevents a sequential retry from creating a second ledger
   * entry. Reuse of the same key with a different payload fails closed.
   */
  if (
    operationIdSha256 !== null
  ) {
    const existing =
      await getRuntimeOperationsLedgerEntryByOperationIdSha256(
        operationIdSha256,
      );

    if (existing) {
      assertIdempotentReplayMatchesEnvelope(
        existing,
        input.envelope,
      );

      return asIdempotentReplay(
        existing,
      );
    }
  }

  /*
   * The application derives the candidate sequence from the latest
   * persisted entry.
   *
   * The database trigger remains authoritative for continuity and
   * serializes concurrent append attempts with an advisory transaction
   * lock. If another writer wins the sequence race, the database remains
   * the source of truth.
   */
  const latestRecord =
    await getLatestRuntimeOperationsLedgerEntry();

  const previousEntry =
    latestRecord?.entry ?? null;

  const sequence =
    previousEntry
      ? previousEntry.sequence + 1
      : 1;

  if (
    !Number.isSafeInteger(
      sequence,
    )
  ) {
    fail(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_REPOSITORY_SEQUENCE_OVERFLOW",
      "Next ledger sequence is not a safe integer.",
      sequence,
    );
  }

  const candidate =
    buildRuntimeOperationsLedgerEntry({
      sequence,

      envelope:
        input.envelope,

      verification:
        input.verification,

      previousEntry,
    });

  try {
    const result = await sql`
      INSERT INTO public.hbce_runtime_operations_ledger (
        sequence,

        operation_id_sha256,

        hermeticum_sigil,

        entry_type,
        revision,

        runtime_ipr,
        human_authority_ipr,
        organization,

        evidence_revision,
        evidence_sha256,

        envelope_revision,
        envelope_sha256,

        internal_seal,

        event_type,
        source_revision,
        source_generated_at,
        operational_status,

        verifier_revision,
        verified,

        verification_total_checks,
        verification_passed_checks,
        verification_failed_checks,

        previous_entry_sha256,
        entry_sha256,
        chain_root_sha256,

        append_only,
        hash_only_evidence,
        human_authorization_required,
        autonomous_authorization,
        runtime_activation,
        no_submit_from_code,
        legal_certification,
        qualified_electronic_signature
      )
      VALUES (
        ${candidate.sequence},

        ${operationIdSha256},

        ${HERMETICUM_SIGIL},

        ${candidate.entryType},
        ${candidate.revision},

        ${candidate.identity.runtimeIpr},
        ${candidate.identity.humanAuthorityIpr},
        ${candidate.identity.organization},

        ${candidate.source.evidenceRevision},
        ${candidate.source.evidenceSha256},

        ${candidate.source.envelopeRevision},
        ${candidate.source.envelopeSha256},

        ${candidate.source.internalSeal},

        ${candidate.source.eventType},
        ${candidate.source.sourceRevision},
        ${candidate.source.sourceGeneratedAt},
        ${candidate.source.operationalStatus},

        ${candidate.verification.verifierRevision},
        ${candidate.verification.verified},

        ${candidate.verification.totalChecks},
        ${candidate.verification.passedChecks},
        ${candidate.verification.failedChecks},

        ${candidate.chain.previousEntrySha256},
        ${candidate.chain.entrySha256},
        ${candidate.chain.chainRootSha256},

        ${candidate.governance.appendOnly},
        ${candidate.governance.hashOnlyEvidence},
        ${candidate.governance.humanAuthorizationRequired},
        ${candidate.governance.autonomousAuthorization},
        ${candidate.governance.runtimeActivation},
        ${candidate.governance.noSubmitFromCode},
        ${candidate.governance.legalCertification},
        ${candidate.governance.qualifiedElectronicSignature}
      )
      RETURNING *
    `;

    if (
      result.rows.length !== 1
    ) {
      fail(
        "HBCE_RUNTIME_OPERATIONS_LEDGER_DATABASE_INSERT_CARDINALITY_FAILURE",
        "Persistent ledger append did not return exactly one row.",
        result.rows.length,
      );
    }

    const persisted =
      mapDatabaseRow(
        result.rows[0] as DatabaseRow,
      );

    /*
     * Do not trust the database round-trip merely because INSERT
     * succeeded. Re-verify the persisted entry against the prior entry.
     */
    const persistedVerification =
      verifyRuntimeOperationsLedgerEntry({
        entry:
          persisted.entry,

        previousEntry,
      });

    if (
      persistedVerification.verified !==
        true ||
      persistedVerification
        .operationalStatus !==
        "PASS" ||
      persistedVerification
        .summary
        .failedChecks !== 0
    ) {
      fail(
        "HBCE_RUNTIME_OPERATIONS_LEDGER_DATABASE_POST_INSERT_VERIFICATION_FAILED",
        "Persisted ledger entry failed cryptographic chain verification.",
        persistedVerification,
      );
    }

    assertEquals(
      persisted.entry.chain
        .entrySha256,
      candidate.chain
        .entrySha256,
      "persisted.entrySha256",
    );

    assertEquals(
      persisted.entry.chain
        .chainRootSha256,
      candidate.chain
        .chainRootSha256,
      "persisted.chainRootSha256",
    );

    assertEquals(
      persisted.entry.chain
        .previousEntrySha256,
      candidate.chain
        .previousEntrySha256,
      "persisted.previousEntrySha256",
    );

    assertEquals(
      persisted.persistence
        .operationIdSha256,
      operationIdSha256,
      "persisted.operationIdSha256",
    );

    return asInsertedRecord(
      persisted,
    );
  } catch (error) {
    /*
     * Second idempotency gate.
     *
     * Two concurrent requests carrying the same operation id may both
     * pass the pre-read. PostgreSQL's partial UNIQUE index is then the
     * final arbiter. The losing request rereads the winner and returns it
     * only when the persisted payload is exactly the same.
     */
    if (
      operationIdSha256 !== null &&
      isOperationIdUniqueViolation(
        error,
      )
    ) {
      try {
        const existing =
          await getRuntimeOperationsLedgerEntryByOperationIdSha256(
            operationIdSha256,
          );

        if (!existing) {
          fail(
            "HBCE_RUNTIME_OPERATIONS_LEDGER_OPERATION_IDEMPOTENCY_REREAD_MISSING",
            "Operation-id uniqueness conflict occurred but the winning ledger row could not be reread.",
            {
              operationIdSha256,
            },
          );
        }

        assertIdempotentReplayMatchesEnvelope(
          existing,
          input.envelope,
        );

        return asIdempotentReplay(
          existing,
        );
      } catch (
        idempotencyError
      ) {
        return wrapDatabaseError(
          "appendVerifiedEntryIdempotencyResolution",
          idempotencyError,
        );
      }
    }

    return wrapDatabaseError(
      "appendVerifiedEntry",
      error,
    );
  }
}
