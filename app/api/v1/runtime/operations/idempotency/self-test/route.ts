import { createHash, randomUUID } from "node:crypto";

import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

import {
  appendRuntimeOperationsPersistentEvidence,
  RuntimeOperationsPersistentAppendError,
} from "@/src/runtime/operations/runtime-operations-persistent-append.service";

import {
  getLatestRuntimeOperationsLedgerEntry,
  getRuntimeOperationsLedgerEntryByOperationIdSha256,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

import type {
  RuntimeOperationsEvidenceInput,
} from "@/src/runtime/operations/runtime-operations-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-OPERATIONS-PERSISTENT-IDEMPOTENCY-SELF-TEST-v1_0" as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const HERMETICUM_SIGIL_CODEPOINT =
  "U+1F70F" as const;

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const RUNTIME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const RUNTIME_IPR =
  "IPR-AI-0001" as const;

const HUMAN_AUTHORITY_IPR =
  "IPR-3" as const;

const ORGANIZATION =
  "HERMETICUM B.C.E. S.r.l." as const;

const VERIFICATION_PAGE_SIZE =
  500 as const;

const MAX_VERIFICATION_ENTRIES =
  10_000 as const;

const CONCURRENT_REPLAY_COUNT =
  3 as const;

type Check = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

type OperationMode =
  | "SEQUENTIAL_IDEMPOTENCY"
  | "CONCURRENT_IDEMPOTENCY";

function check(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): Check {
  return {
    id,
    description,
    passed:
      Object.is(
        expected,
        actual,
      ),
    expected,
    actual,
  };
}

function sha256(
  value: string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    );
}

function commonHeaders(
  persistence:
    | "false"
    | "true"
    | "FAIL_CLOSED",
) {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "X-HBCE-Revision":
      REVISION,

    "X-HBCE-Persistence":
      persistence,

    "X-HBCE-Runtime-Activation":
      "false",

    "X-HBCE-Autonomous-Authorization":
      "false",

    "X-HBCE-No-Submit-From-Code":
      "true",

    "X-HBCE-Legal-Certification":
      "false",

    "X-HBCE-Qualified-Electronic-Signature":
      "false",

    /*
     * HTTP header values must remain ASCII/ByteString safe.
     * The canonical 🜏 marker remains in JSON/persisted evidence.
     */
    "X-HBCE-Hermeticum-Sigil-Codepoint":
      HERMETICUM_SIGIL_CODEPOINT,
  };
}

function getExpectedManualToken():
  string | null {
  const value =
    process.env
      .HBCE_LEDGER_SELF_TEST_TOKEN;

  if (
    typeof value !== "string" ||
    value.length < 16
  ) {
    return null;
  }

  return value;
}

function unauthorized(
  reason: string,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_UNAUTHORIZED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      reason,

      governance: {
        persistenceExecuted:
          false,

        persistenceAttempted:
          false,

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
    },
    {
      status:
        401,

      headers: {
        ...commonHeaders(
          "false",
        ),

        "X-HBCE-Authorization":
          "REJECTED",

        "X-HBCE-Idempotency":
          "NOT_EVALUATED",
      },
    },
  );
}

function preconditionFailClosed(
  generatedAt: string,
  reason: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_PRECONDITION_FAIL_CLOSED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      generatedAt,

      reason,

      details:
        details ?? null,

      governance: {
        persistenceExecuted:
          false,

        persistenceAttempted:
          false,

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
    },
    {
      status:
        409,

      headers: {
        ...commonHeaders(
          "false",
        ),

        "X-HBCE-Authorization":
          "MANUAL_AUTHORIZATION_ACCEPTED",

        "X-HBCE-Idempotency":
          "PRECONDITION_FAIL_CLOSED",
      },
    },
  );
}

function buildSourceInput(input: {
  generatedAt: string;
  mode: OperationMode;
  revision?: string;
}): RuntimeOperationsEvidenceInput {
  const revision =
    input.revision ??
    REVISION;

  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SOURCE_PASS",

    operationalStatus:
      "PASS",

    revision,

    generatedAt:
      input.generatedAt,

    product:
      PRODUCT,

    runtime:
      RUNTIME,

    execution: {
      mode:
        input.mode,

      persistence:
        true,

      externalEffects:
        true,

      runtimeActivation:
        false,

      autonomousExecution:
        false,

      submission:
        false,

      service:
        "appendRuntimeOperationsPersistentEvidence",

      proof:
        "STABLE_LOGICAL_OPERATION_ID_SHA256_DEDUPLICATION",
    },

    summary: {
      totalChecks:
        1,

      passedChecks:
        1,

      failedChecks:
        0,

      requiredChecks:
        1,

      requiredPassed:
        1,

      requiredFailed:
        0,
    },

    checks: [
      {
        id:
          input.mode ===
          "SEQUENTIAL_IDEMPOTENCY"
            ? "IDEMPOTENCY-SOURCE-SEQUENTIAL-001"
            : "IDEMPOTENCY-SOURCE-CONCURRENT-001",

        description:
          input.mode ===
          "SEQUENTIAL_IDEMPOTENCY"
            ? "Sequential operation-id idempotency source is manually authorized and canonical"
            : "Concurrent operation-id idempotency source is manually authorized and canonical",

        passed:
          true,

        expected:
          input.mode,

        actual:
          input.mode,
      },
    ],

    governance: {
      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromSelfTest:
        false,

      noSubmitFromCode:
        true,

      failClosed:
        false,

      legalCertification:
        false,
    },
  };
}

function buildAuthorization(
  authorizationRef: string,
) {
  return {
    humanAuthorized:
      true,

    authorizationRef,

    runtimeIpr:
      RUNTIME_IPR,

    humanAuthorityIpr:
      HUMAN_AUTHORITY_IPR,

    organization:
      ORGANIZATION,
  };
}

async function countRowsByOperationHash(
  operationIdSha256: string,
): Promise<number> {
  const result =
    await sql`
      SELECT COUNT(*)::int AS count
      FROM public.hbce_runtime_operations_ledger
      WHERE operation_id_sha256 = ${operationIdSha256}
    `;

  const value =
    result.rows[0]
      ?.count;

  const count =
    typeof value ===
      "number"
      ? value
      : Number(
          value ?? Number.NaN,
        );

  if (
    !Number.isSafeInteger(
      count,
    ) ||
    count < 0
  ) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_IDEMPOTENCY_INVALID_DATABASE_COUNT",
    );
  }

  return count;
}

async function countRawIdentifierOccurrences(
  operationId: string,
): Promise<number> {
  /*
   * This deliberately inspects the serialized persisted row.
   *
   * The raw operation identifier is used only as a query parameter and
   * must never appear inside the persisted ledger row. The route itself
   * also avoids placing operationId in sourceInput or authorizationRef.
   */
  const pattern =
    `%${operationId}%`;

  const result =
    await sql`
      SELECT COUNT(*)::int AS count
      FROM public.hbce_runtime_operations_ledger AS ledger
      WHERE to_jsonb(ledger)::text LIKE ${pattern}
    `;

  const value =
    result.rows[0]
      ?.count;

  const count =
    typeof value ===
      "number"
      ? value
      : Number(
          value ?? Number.NaN,
        );

  if (
    !Number.isSafeInteger(
      count,
    ) ||
    count < 0
  ) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_IDEMPOTENCY_INVALID_RAW_IDENTIFIER_COUNT",
    );
  }

  return count;
}

function settledError(
  result:
    PromiseSettledResult<unknown>,
): string | null {
  if (
    result.status ===
    "fulfilled"
  ) {
    return null;
  }

  return result.reason instanceof
    Error
    ? `${result.reason.name}:${result.reason.message}`
    : String(
        result.reason,
      );
}

export async function GET() {
  const generatedAt =
    new Date().toISOString();

  try {
    const latest =
      await getLatestRuntimeOperationsLedgerEntry();

    const schema =
      await sql`
        SELECT
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'hbce_runtime_operations_ledger'
              AND column_name = 'operation_id_sha256'
          ) AS operation_id_sha256_column_exists
      `;

    const columnExists =
      schema.rows[0]
        ?.operation_id_sha256_column_exists ===
      true;

    const ready =
      latest !==
        null &&
      columnExists;

    return NextResponse.json(
      {
        ok:
          ready,

        status:
          ready
            ? "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_READY"
            : "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_PRECONDITION_FAIL_CLOSED",

        operationalStatus:
          ready
            ? "READY"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        method:
          "POST",

        readOnly:
          true,

        sideEffects:
          false,

        observed: {
          persistentLedgerPresent:
            latest !==
            null,

          latestSequence:
            latest?.entry
              .sequence ?? null,

          latestEntrySha256:
            latest?.entry
              .chain
              .entrySha256 ?? null,

          operationIdSha256ColumnExists:
            columnExists,
        },

        proofPlan: {
          sequentialFirstInsert:
            true,

          sequentialReplay:
            true,

          concurrentReplayCount:
            CONCURRENT_REPLAY_COUNT,

          exactlyOneConcurrentInsert:
            true,

          sourceRevisionConflictFailClosed:
            true,

          rawOperationIdentifierPersistenceForbidden:
            true,

          finalFullChainVerification:
            true,
        },

        requirements: {
          environmentVariable:
            "HBCE_LEDGER_SELF_TEST_TOKEN",

          requestHeader:
            MANUAL_AUTHORIZATION_HEADER,

          minimumTokenLength:
            16,
        },

        identity: {
          runtimeIpr:
            RUNTIME_IPR,

          humanAuthorityIpr:
            HUMAN_AUTHORITY_IPR,

          organization:
            ORGANIZATION,

          hermeticumSigil:
            HERMETICUM_SIGIL,

          hermeticumSigilCodepoint:
            HERMETICUM_SIGIL_CODEPOINT,
        },

        governance: {
          persistenceExecuted:
            false,

          persistenceAttempted:
            false,

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
      },
      {
        status:
          ready
            ? 200
            : 409,

        headers: {
          ...commonHeaders(
            "false",
          ),

          "X-HBCE-Authorization":
            ready
              ? "HUMAN_AUTHORIZATION_REQUIRED"
              : "PRECONDITION_NOT_MET",

          "X-HBCE-Idempotency":
            ready
              ? "READY"
              : "PRECONDITION_FAIL_CLOSED",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_READ_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        error: {
          name:
            error instanceof
            Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof
            Error
              ? error.message
              : String(
                  error,
                ),
        },

        governance: {
          persistenceExecuted:
            false,

          persistenceAttempted:
            false,

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
      },
      {
        status:
          500,

        headers: {
          ...commonHeaders(
            "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "NOT_EVALUATED",

          "X-HBCE-Idempotency":
            "FAIL_CLOSED",
        },
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const expectedToken =
    getExpectedManualToken();

  if (!expectedToken) {
    return unauthorized(
      "HBCE_LEDGER_SELF_TEST_TOKEN is missing or shorter than 16 characters.",
    );
  }

  const suppliedToken =
    request.headers.get(
      MANUAL_AUTHORIZATION_HEADER,
    );

  if (
    suppliedToken !==
    expectedToken
  ) {
    return unauthorized(
      "Manual persistent idempotency authorization token is invalid.",
    );
  }

  const generatedAt =
    new Date().toISOString();

  const checks:
    Check[] =
    [];

  let persistenceAttempted =
    false;

  try {
    /*
     * PRECONDITION
     *
     * The general persistent append service is a continuation service.
     * Genesis / previous continuity evidence must already exist.
     */
    const latestBefore =
      await getLatestRuntimeOperationsLedgerEntry();

    checks.push(
      check(
        "IDEMP-001",
        "Persistent ledger has an existing tip",
        true,
        latestBefore !==
          null,
      ),
    );

    if (!latestBefore) {
      return preconditionFailClosed(
        generatedAt,
        "Persistent ledger is empty. Existing verified continuity is required before idempotency proof.",
      );
    }

    const initialSequence =
      latestBefore.entry
        .sequence;

    /*
     * Fresh logical operation identifiers exist only in process memory.
     * Only SHA-256(operationId) is expected to reach persistence.
     */
    const runNonce =
      randomUUID();

    const sequentialOperationId =
      `HBCE-IDEMPOTENCY-SEQ-${runNonce}`;

    const concurrentOperationId =
      `HBCE-IDEMPOTENCY-CONCURRENT-${runNonce}`;

    const sequentialOperationIdSha256 =
      sha256(
        sequentialOperationId,
      );

    const concurrentOperationIdSha256 =
      sha256(
        concurrentOperationId,
      );

    checks.push(
      check(
        "IDEMP-002",
        "Sequential logical operation id derives a lowercase SHA-256",
        true,
        /^[0-9a-f]{64}$/.test(
          sequentialOperationIdSha256,
        ),
      ),
    );

    checks.push(
      check(
        "IDEMP-003",
        "Concurrent logical operation id derives a lowercase SHA-256",
        true,
        /^[0-9a-f]{64}$/.test(
          concurrentOperationIdSha256,
        ),
      ),
    );

    const sequentialSource =
      buildSourceInput({
        generatedAt,

        mode:
          "SEQUENTIAL_IDEMPOTENCY",
      });

    const sequentialAuthorization =
      buildAuthorization(
        `HBCE-MANUAL-AUTH-IDEMPOTENCY-SEQUENTIAL-${generatedAt}`,
      );

    /*
     * TEST A
     * First logical operation call must INSERT exactly one new row.
     */
    persistenceAttempted =
      true;

    const first =
      await appendRuntimeOperationsPersistentEvidence({
        sourceInput:
          sequentialSource,

        authorization:
          sequentialAuthorization,

        operationId:
          sequentialOperationId,

        expectedTip: {
          sequence:
            latestBefore.entry
              .sequence,

          entrySha256:
            latestBefore.entry
              .chain
              .entrySha256,
        },

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

    checks.push(
      check(
        "IDEMP-004",
        "First sequential call inserts a row",
        true,
        first.idempotency
          .inserted,
      ),
    );

    checks.push(
      check(
        "IDEMP-005",
        "First sequential call is not a replay",
        false,
        first.idempotency
          .replayed,
      ),
    );

    checks.push(
      check(
        "IDEMP-006",
        "First sequential call advances sequence by exactly one",
        initialSequence +
          1,
        first.persistence
          .sequence,
      ),
    );

    checks.push(
      check(
        "IDEMP-007",
        "Service-derived operation SHA-256 matches independent derivation",
        sequentialOperationIdSha256,
        first.idempotency
          .operationIdSha256,
      ),
    );

    checks.push(
      check(
        "IDEMP-008",
        "Service reports raw operation identifier not persisted",
        false,
        first.idempotency
          .rawOperationIdPersisted,
      ),
    );

    /*
     * TEST B
     * Same logical operation id must resolve to the exact same persisted
     * entry without another append.
     */
    const second =
      await appendRuntimeOperationsPersistentEvidence({
        sourceInput:
          sequentialSource,

        authorization:
          buildAuthorization(
            `HBCE-MANUAL-AUTH-IDEMPOTENCY-SEQUENTIAL-REPLAY-${generatedAt}`,
          ),

        operationId:
          sequentialOperationId,

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

    checks.push(
      check(
        "IDEMP-009",
        "Sequential retry does not insert",
        false,
        second.idempotency
          .inserted,
      ),
    );

    checks.push(
      check(
        "IDEMP-010",
        "Sequential retry is identified as idempotent replay",
        true,
        second.idempotency
          .replayed,
      ),
    );

    checks.push(
      check(
        "IDEMP-011",
        "Sequential replay returns original sequence",
        first.persistence
          .sequence,
        second.persistence
          .sequence,
      ),
    );

    checks.push(
      check(
        "IDEMP-012",
        "Sequential replay returns original ledger entry SHA-256",
        first.append
          .entrySha256,
        second.append
          .entrySha256,
      ),
    );

    checks.push(
      check(
        "IDEMP-013",
        "Sequential replay returns original Evidence SHA-256",
        first.evidence
          .sha256,
        second.evidence
          .sha256,
      ),
    );

    const sequentialRecord =
      await getRuntimeOperationsLedgerEntryByOperationIdSha256(
        sequentialOperationIdSha256,
      );

    checks.push(
      check(
        "IDEMP-014",
        "Sequential operation can be independently reread by operation hash",
        true,
        sequentialRecord !==
          null,
      ),
    );

    const sequentialRowCount =
      await countRowsByOperationHash(
        sequentialOperationIdSha256,
      );

    checks.push(
      check(
        "IDEMP-015",
        "Sequential operation hash exists in exactly one persistent row",
        1,
        sequentialRowCount,
      ),
    );

    const sequentialRawCount =
      await countRawIdentifierOccurrences(
        sequentialOperationId,
      );

    checks.push(
      check(
        "IDEMP-016",
        "Raw sequential operation identifier is absent from serialized persistent rows",
        0,
        sequentialRawCount,
      ),
    );

    /*
     * TEST C
     * Reusing the logical operation id with a different source revision
     * must fail closed before a second persistence attempt.
     */
    let conflictCode:
      string | null =
      null;

    let conflictStage:
      string | null =
      null;

    let conflictPersistenceAttempted:
      boolean | null =
      null;

    try {
      await appendRuntimeOperationsPersistentEvidence({
        sourceInput:
          buildSourceInput({
            generatedAt,

            mode:
              "SEQUENTIAL_IDEMPOTENCY",

            revision:
              `${REVISION}-CONFLICT`,
          }),

        authorization:
          buildAuthorization(
            `HBCE-MANUAL-AUTH-IDEMPOTENCY-CONFLICT-${generatedAt}`,
          ),

        operationId:
          sequentialOperationId,

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

      conflictCode =
        "NO_ERROR";

      conflictStage =
        "NO_ERROR";

      conflictPersistenceAttempted =
        true;
    } catch (error) {
      if (
        error instanceof
        RuntimeOperationsPersistentAppendError
      ) {
        conflictCode =
          error.code;

        conflictStage =
          error.stage;

        conflictPersistenceAttempted =
          error.persistenceAttempted;
      } else {
        throw error;
      }
    }

    checks.push(
      check(
        "IDEMP-017",
        "Same operation id with different source revision fails closed",
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_OPERATION_ID_SOURCE_REVISION_CONFLICT",
        conflictCode,
      ),
    );

    checks.push(
      check(
        "IDEMP-018",
        "Source revision conflict is detected in IDEMPOTENCY stage",
        "IDEMPOTENCY",
        conflictStage,
      ),
    );

    checks.push(
      check(
        "IDEMP-019",
        "Source revision conflict performs no persistence attempt",
        false,
        conflictPersistenceAttempted,
      ),
    );

    checks.push(
      check(
        "IDEMP-020",
        "Conflict attempt still leaves exactly one row for sequential operation hash",
        1,
        await countRowsByOperationHash(
          sequentialOperationIdSha256,
        ),
      ),
    );

    /*
     * TEST D
     * Three simultaneous callers submit one new stable operation id.
     *
     * Required outcome:
     * - all callers resolve successfully
     * - exactly one INSERT
     * - remaining callers resolve as replay
     * - exactly one persistent row exists for the operation hash
     */
    const latestBeforeConcurrent =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestBeforeConcurrent) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_IDEMPOTENCY_LATEST_MISSING_BEFORE_CONCURRENCY",
      );
    }

    const concurrentSource =
      buildSourceInput({
        generatedAt,

        mode:
          "CONCURRENT_IDEMPOTENCY",
      });

    const concurrentCalls =
      Array.from(
        {
          length:
            CONCURRENT_REPLAY_COUNT,
        },
        (
          _,
          index,
        ) =>
          appendRuntimeOperationsPersistentEvidence({
            sourceInput:
              concurrentSource,

            authorization:
              buildAuthorization(
                `HBCE-MANUAL-AUTH-IDEMPOTENCY-CONCURRENT-${index + 1}-${generatedAt}`,
              ),

            operationId:
              concurrentOperationId,

            expectedTip: {
              sequence:
                latestBeforeConcurrent.entry
                  .sequence,

              entrySha256:
                latestBeforeConcurrent.entry
                  .chain
                  .entrySha256,
            },

            verification: {
              pageSize:
                VERIFICATION_PAGE_SIZE,

              maximumEntries:
                MAX_VERIFICATION_ENTRIES,
            },
          }),
      );

    const concurrentSettled =
      await Promise.allSettled(
        concurrentCalls,
      );

    const concurrentFailures =
      concurrentSettled
        .filter(
          (
            result,
          ) =>
            result.status ===
            "rejected",
        );

    const concurrentResults =
      concurrentSettled.flatMap(
        (
          result,
        ) =>
          result.status ===
          "fulfilled"
            ? [
                result.value,
              ]
            : [],
      );

    const concurrentInserted =
      concurrentResults.filter(
        (
          result,
        ) =>
          result.idempotency
            .inserted ===
          true,
      ).length;

    const concurrentReplayed =
      concurrentResults.filter(
        (
          result,
        ) =>
          result.idempotency
            .replayed ===
          true,
      ).length;

    const concurrentSequences =
      [
        ...new Set(
          concurrentResults.map(
            (
              result,
            ) =>
              result.persistence
                .sequence,
          ),
        ),
      ];

    const concurrentEntryHashes =
      [
        ...new Set(
          concurrentResults.map(
            (
              result,
            ) =>
              result.append
                .entrySha256,
          ),
        ),
      ];

    checks.push(
      check(
        "IDEMP-021",
        "All concurrent callers resolve successfully",
        CONCURRENT_REPLAY_COUNT,
        concurrentResults
          .length,
      ),
    );

    checks.push(
      check(
        "IDEMP-022",
        "Concurrent operation produces exactly one INSERT",
        1,
        concurrentInserted,
      ),
    );

    checks.push(
      check(
        "IDEMP-023",
        "Remaining concurrent callers resolve as replay",
        CONCURRENT_REPLAY_COUNT -
          1,
        concurrentReplayed,
      ),
    );

    checks.push(
      check(
        "IDEMP-024",
        "Concurrent callers resolve to exactly one persistent sequence",
        1,
        concurrentSequences
          .length,
      ),
    );

    checks.push(
      check(
        "IDEMP-025",
        "Concurrent callers resolve to exactly one ledger entry SHA-256",
        1,
        concurrentEntryHashes
          .length,
      ),
    );

    checks.push(
      check(
        "IDEMP-026",
        "Concurrent operation hash exists in exactly one persistent row",
        1,
        await countRowsByOperationHash(
          concurrentOperationIdSha256,
        ),
      ),
    );

    const concurrentRecord =
      await getRuntimeOperationsLedgerEntryByOperationIdSha256(
        concurrentOperationIdSha256,
      );

    checks.push(
      check(
        "IDEMP-027",
        "Concurrent winning operation can be independently reread by operation hash",
        true,
        concurrentRecord !==
          null,
      ),
    );

    checks.push(
      check(
        "IDEMP-028",
        "Concurrent persisted operation hash matches independent derivation",
        concurrentOperationIdSha256,
        concurrentRecord
          ?.persistence
          .operationIdSha256 ??
          null,
      ),
    );

    checks.push(
      check(
        "IDEMP-029",
        "Raw concurrent operation identifier is absent from serialized persistent rows",
        0,
        await countRawIdentifierOccurrences(
          concurrentOperationId,
        ),
      ),
    );

    checks.push(
      check(
        "IDEMP-030",
        "Concurrent promise set contains zero rejected callers",
        0,
        concurrentFailures
          .length,
      ),
    );

    /*
     * TEST E
     * Final replay of the first operation occurs after another logical
     * operation has advanced the ledger tip. It must still replay the
     * original row while independently verifying the complete latest chain.
     */
    const finalReplay =
      await appendRuntimeOperationsPersistentEvidence({
        sourceInput:
          sequentialSource,

        authorization:
          buildAuthorization(
            `HBCE-MANUAL-AUTH-IDEMPOTENCY-FINAL-REPLAY-${generatedAt}`,
          ),

        operationId:
          sequentialOperationId,

        verification: {
          pageSize:
            VERIFICATION_PAGE_SIZE,

          maximumEntries:
            MAX_VERIFICATION_ENTRIES,
        },
      });

    const latestAfter =
      await getLatestRuntimeOperationsLedgerEntry();

    if (!latestAfter) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_IDEMPOTENCY_LATEST_MISSING_AFTER_PROOF",
      );
    }

    checks.push(
      check(
        "IDEMP-031",
        "Final replay remains a replay after ledger tip advanced",
        true,
        finalReplay.idempotency
          .replayed,
      ),
    );

    checks.push(
      check(
        "IDEMP-032",
        "Final replay still resolves to original sequential sequence",
        first.persistence
          .sequence,
        finalReplay.persistence
          .sequence,
      ),
    );

    checks.push(
      check(
        "IDEMP-033",
        "Final full-chain verification passes",
        true,
        finalReplay.verification
          .fullChain
          .verified,
      ),
    );

    checks.push(
      check(
        "IDEMP-034",
        "Final full-chain verification has zero failures",
        0,
        finalReplay.verification
          .fullChain
          .totalFailedChecks,
      ),
    );

    checks.push(
      check(
        "IDEMP-035",
        "Final full-chain verification covers current persistent tip",
        latestAfter.entry
          .sequence,
        finalReplay.verification
          .fullChain
          .latestSequence,
      ),
    );

    checks.push(
      check(
        "IDEMP-036",
        "Exactly two new logical operations were persisted during proof",
        initialSequence +
          2,
        latestAfter.entry
          .sequence,
      ),
    );

    checks.push(
      check(
        "IDEMP-037",
        "Final ledger sequence continuity is verified",
        true,
        finalReplay.verification
          .fullChain
          .sequenceContinuityVerified,
      ),
    );

    checks.push(
      check(
        "IDEMP-038",
        "Final previous-hash bindings are verified",
        true,
        finalReplay.verification
          .fullChain
          .previousHashBindingsVerified,
      ),
    );

    checks.push(
      check(
        "IDEMP-039",
        "All final ledger entries independently cryptographically verify",
        true,
        finalReplay.verification
          .fullChain
          .allEntriesCryptographicallyVerified,
      ),
    );

    const failedChecks =
      checks.filter(
        (
          item,
        ) =>
          !item.passed,
      );

    const passedChecks =
      checks.length -
      failedChecks.length;

    const completePass =
      failedChecks.length ===
        0;

    return NextResponse.json(
      {
        ok:
          completePass,

        status:
          completePass
            ? "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_PASS"
            : "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_FAIL_CLOSED",

        operationalStatus:
          completePass
            ? "PASS"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        product:
          PRODUCT,

        runtime:
          RUNTIME,

        execution: {
          mode:
            "PERSISTENT_OPERATION_IDEMPOTENCY_SEQUENTIAL_CONCURRENT_AND_CONFLICT_PROOF",

          initialSequence,

          finalSequence:
            latestAfter.entry
              .sequence,

          distinctLogicalOperations:
            2,

          requestedConcurrentCalls:
            CONCURRENT_REPLAY_COUNT,

          persistenceAttempted,
        },

        summary: {
          totalChecks:
            checks.length,

          passedChecks,

          failedChecks:
            failedChecks.length,

          requiredChecks:
            checks.length,

          requiredPassed:
            passedChecks,

          requiredFailed:
            failedChecks.length,
        },

        operations: {
          sequential: {
            operationIdPersisted:
              false,

            operationIdSha256:
              sequentialOperationIdSha256,

            sequence:
              first.persistence
                .sequence,

            entrySha256:
              first.append
                .entrySha256,

            firstCall: {
              inserted:
                first.idempotency
                  .inserted,

              replayed:
                first.idempotency
                  .replayed,
            },

            secondCall: {
              inserted:
                second.idempotency
                  .inserted,

              replayed:
                second.idempotency
                  .replayed,
            },

            rawIdentifierOccurrences:
              sequentialRawCount,

            persistentRowCount:
              sequentialRowCount,
          },

          conflict: {
            expectedCode:
              "HBCE_RUNTIME_OPERATIONS_PERSISTENT_APPEND_OPERATION_ID_SOURCE_REVISION_CONFLICT",

            observedCode:
              conflictCode,

            observedStage:
              conflictStage,

            persistenceAttempted:
              conflictPersistenceAttempted,
          },

          concurrent: {
            operationIdPersisted:
              false,

            operationIdSha256:
              concurrentOperationIdSha256,

            fulfilled:
              concurrentResults
                .length,

            rejected:
              concurrentFailures
                .length,

            inserted:
              concurrentInserted,

            replayed:
              concurrentReplayed,

            uniqueSequences:
              concurrentSequences,

            uniqueEntrySha256:
              concurrentEntryHashes,

            rejectionErrors:
              concurrentFailures.map(
                settledError,
              ),
          },
        },

        verification: {
          finalReplay: {
            sequence:
              finalReplay.persistence
                .sequence,

            entrySha256:
              finalReplay.append
                .entrySha256,

            idempotentReplay:
              finalReplay.idempotency
                .replayed,
          },

          fullChain:
            finalReplay.verification
              .fullChain,
        },

        checks,

        identity: {
          runtimeIpr:
            RUNTIME_IPR,

          humanAuthorityIpr:
            HUMAN_AUTHORITY_IPR,

          organization:
            ORGANIZATION,

          hermeticumSigil:
            HERMETICUM_SIGIL,

          hermeticumSigilCodepoint:
            HERMETICUM_SIGIL_CODEPOINT,
        },

        governance: {
          failClosed:
            !completePass,

          appendOnly:
            true,

          hashOnlyEvidence:
            true,

          rawOperationIdentifiersPersisted:
            false,

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
      },
      {
        status:
          completePass
            ? 200
            : 503,

        headers: {
          ...commonHeaders(
            completePass
              ? "true"
              : "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Idempotency":
            completePass
              ? "PASS"
              : "FAIL_CLOSED",

          "X-HBCE-Initial-Sequence":
            String(
              initialSequence,
            ),

          "X-HBCE-Final-Sequence":
            String(
              latestAfter.entry
                .sequence,
            ),

          "X-HBCE-Sequential-Operation-SHA256":
            sequentialOperationIdSha256,

          "X-HBCE-Concurrent-Operation-SHA256":
            concurrentOperationIdSha256,
        },
      },
    );
  } catch (error) {
    const structured =
      error instanceof
      RuntimeOperationsPersistentAppendError;

    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        error: {
          name:
            error instanceof
            Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof
            Error
              ? error.message
              : String(
                  error,
                ),

          code:
            structured
              ? error.code
              : "HBCE_RUNTIME_OPERATIONS_PERSISTENT_IDEMPOTENCY_SELF_TEST_UNEXPECTED_FAILURE",

          stage:
            structured
              ? error.stage
              : "UNKNOWN",

          causeValue:
            structured
              ? error.causeValue
              : null,
        },

        persistence: {
          attempted:
            structured
              ? error.persistenceAttempted
              : persistenceAttempted,

          confirmed:
            structured
              ? error.persistenceConfirmed
              : false,

          persistedSequence:
            structured
              ? error.persistedSequence
              : null,
        },

        partialChecks:
          checks,

        governance: {
          failClosed:
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
      },
      {
        status:
          500,

        headers: {
          ...commonHeaders(
            "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Idempotency":
            "FAIL_CLOSED",
        },
      },
    );
  }
}
