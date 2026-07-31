import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase,
} from "@/lib/ipr-database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

type SelfTestCheck = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type MemoryRecordRow = {
  memory_id?: unknown;
  memory_key_hash?: unknown;
  human_ipr?: unknown;
  runtime_ipr?: unknown;
  session_id?: unknown;
  scope?: unknown;
  authority?: unknown;
  persistence_mode?: unknown;
  memory_kind?: unknown;
  memory_status?: unknown;
  source_kind?: unknown;
  memory_title?: unknown;
  memory_summary?: unknown;
  save_raw?: unknown;
  save_synthesis?: unknown;
  reusable_in_prompt?: unknown;
  classification?: unknown;
  quality?: unknown;
  memory_hash?: unknown;
  memory_chain_hash?: unknown;
  record_payload?: unknown;
  legal_certification?: unknown;
  deleted_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type CountRow = {
  record_count?: unknown;
};

const REVISION = "HBCE-RUNTIME-MEMORY-SELF-TEST-v1_1";

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const TEST_RUNTIME_IPR = "IPR-AI-0001";
const TEST_HUMAN_IPR = "IPR-HBCE-MEMORY-SELF-TEST";

const TEST_SCOPE = "RUNTIME_ONLY";
const TEST_AUTHORITY = "SESSION_RUNTIME_ONLY";
const TEST_MEMORY_KIND = "RUNTIME_MEMORY";
const TEST_MEMORY_STATUS = "ACTIVE";
const TEST_SOURCE_KIND = "RUNTIME_MEMORY";

const TEST_CLASSIFICATION = "INTERNAL_TECHNICAL_TEST";
const TEST_QUALITY = "VERIFIED_SELF_TEST";

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function valueAsString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function valueAsBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

function valueAsNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): SelfTestCheck {
  return {
    id: input.id,
    label: input.label,
    required: input.required ?? true,
    status: input.status,
    durationMs: input.durationMs,
    details: input.details ?? {},
    error: input.error ?? null,
  };
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto =
    request.headers.get("x-forwarded-proto");

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ??
    request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

function buildSummary(
  checks: SelfTestCheck[],
  durationMs: number,
): Record<string, number> {
  const requiredChecks =
    checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,

    passedChecks:
      checks.filter(
        (check) => check.status === "PASS",
      ).length,

    failedChecks:
      checks.filter(
        (check) => check.status === "FAIL",
      ).length,

    skippedChecks:
      checks.filter(
        (check) => check.status === "SKIPPED",
      ).length,

    requiredChecks:
      requiredChecks.length,

    requiredPassed:
      requiredChecks.filter(
        (check) => check.status === "PASS",
      ).length,

    requiredFailed:
      requiredChecks.filter(
        (check) => check.status !== "PASS",
      ).length,

    durationMs,
  };
}

async function cleanupTestRecord(
  memoryId: string,
): Promise<SelfTestCheck> {
  const startedAt = nowMs();

  try {
    const deleteResult =
      await queryHbceDatabase(
        `
          DELETE FROM memory_records
          WHERE memory_id = $1
        `,
        [memoryId],
      );

    if (!deleteResult.ok) {
      return createCheck({
        id: "MEMORY_DELETE",
        label: "Delete temporary memory record",
        status: "FAIL",
        durationMs: elapsedMs(startedAt),
        details: {
          memoryId,
          queryStatus: deleteResult.status,
          queryDurationMs: deleteResult.durationMs,
          sqlHash: deleteResult.sqlHash,
        },
        error:
          deleteResult.error ??
          "MEMORY_DELETE_FAILED",
      });
    }

    return createCheck({
      id: "MEMORY_DELETE",
      label: "Delete temporary memory record",
      status: "PASS",
      durationMs: elapsedMs(startedAt),
      details: {
        memoryId,
        deletedRowCount: deleteResult.rowCount,
        queryStatus: deleteResult.status,
        queryDurationMs: deleteResult.durationMs,
        sqlHash: deleteResult.sqlHash,
      },
    });
  } catch (error) {
    return createCheck({
      id: "MEMORY_DELETE",
      label: "Delete temporary memory record",
      status: "FAIL",
      durationMs: elapsedMs(startedAt),
      details: {
        memoryId,
      },
      error: normalizeError(error),
    });
  }
}

function createSkippedCheck(
  id: string,
  label: string,
  reason: string,
): SelfTestCheck {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: {
      reason,
    },
    error: `${id}_SKIPPED`,
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const checks: SelfTestCheck[] = [];

  const memoryId =
    `HBCE-MEMORY-SELF-TEST-${randomUUID()}`;

  const sessionId =
    `HBCE-SELF-TEST-SESSION-${randomUUID()}`;

  const testNonce = randomUUID();

  const payload = {
    testType:
      "HBCE_RUNTIME_MEMORY_CONTINUITY",

    revision:
      REVISION,

    memoryId,
    sessionId,

    runtimeIpr:
      TEST_RUNTIME_IPR,

    humanIpr:
      TEST_HUMAN_IPR,

    scope:
      TEST_SCOPE,

    authority:
      TEST_AUTHORITY,

    memoryKind:
      TEST_MEMORY_KIND,

    sourceKind:
      TEST_SOURCE_KIND,

    nonce:
      testNonce,

    generatedAt,

    legalCertification:
      false,
  };

  const payloadCanonical =
    stableJson(payload);

  const memoryKeyHash =
    sha256(
      `memory-key:${memoryId}`,
    );

  const memoryHash =
    sha256(
      payloadCanonical,
    );

  const memoryChainHash =
    sha256(
      stableJson({
        previousHash: null,
        memoryHash,
        runtimeIpr: TEST_RUNTIME_IPR,
        sessionId,
      }),
    );

  let recordMayExist = false;

  try {
    const configurationStartedAt = nowMs();

    const configured =
      isHbceDatabaseConfigured();

    const databaseDescription =
      describeDefaultHbceDatabase();

    checks.push(
      createCheck({
        id: "DATABASE_CONFIGURATION",
        label: "HBCE database configuration",
        status: configured ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(configurationStartedAt),
        details: {
          configured,
          available:
            databaseDescription.available,
          kind:
            databaseDescription.kind,
          driver:
            databaseDescription.driver,
          mode:
            databaseDescription.mode,
          databaseUrlPresent:
            databaseDescription.databaseUrlPresent,
          schemaVersion:
            databaseDescription.schemaVersion,
          persistenceMode:
            databaseDescription.persistenceMode,
        },
        error:
          configured
            ? null
            : "DATABASE_URL_NOT_CONFIGURED",
      }),
    );

    if (!configured) {
      checks.push(
        createSkippedCheck(
          "MEMORY_INSERT",
          "Insert temporary memory record",
          "DATABASE_NOT_CONFIGURED",
        ),

        createSkippedCheck(
          "MEMORY_READ",
          "Read temporary memory record",
          "DATABASE_NOT_CONFIGURED",
        ),

        createSkippedCheck(
          "MEMORY_VERIFY",
          "Verify memory continuity",
          "DATABASE_NOT_CONFIGURED",
        ),

        createSkippedCheck(
          "MEMORY_DELETE",
          "Delete temporary memory record",
          "DATABASE_NOT_CONFIGURED",
        ),

        createSkippedCheck(
          "MEMORY_CLEANUP_VERIFY",
          "Verify temporary record cleanup",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      const insertStartedAt = nowMs();

      const insertResult =
        await queryHbceDatabase<MemoryRecordRow>(
          `
            INSERT INTO memory_records (
              memory_id,
              memory_key_hash,
              human_ipr,
              runtime_ipr,
              session_id,
              scope,
              authority,
              persistence_mode,
              memory_kind,
              memory_status,
              source_kind,
              memory_title,
              memory_summary,
              save_raw,
              save_synthesis,
              reusable_in_prompt,
              classification,
              quality,
              threshold_detected,
              semantic_terms,
              memory_hash,
              memory_chain_hash,
              record_payload,
              legal_certification,
              response_utc,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              'DATABASE_PERSISTENT',
              $8,
              $9,
              $10,
              $11,
              $12,
              false,
              true,
              false,
              $13,
              $14,
              false,
              '[]'::jsonb,
              $15,
              $16,
              $17::jsonb,
              false,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            RETURNING
              memory_id,
              memory_key_hash,
              human_ipr,
              runtime_ipr,
              session_id,
              scope,
              authority,
              persistence_mode,
              memory_kind,
              memory_status,
              source_kind,
              memory_hash,
              memory_chain_hash,
              legal_certification,
              created_at,
              updated_at
          `,
          [
            memoryId,
            memoryKeyHash,
            TEST_HUMAN_IPR,
            TEST_RUNTIME_IPR,
            sessionId,
            TEST_SCOPE,
            TEST_AUTHORITY,
            TEST_MEMORY_KIND,
            TEST_MEMORY_STATUS,
            TEST_SOURCE_KIND,
            "HBCE Runtime Memory Self-Test",
            "Temporary technical record for runtime memory continuity verification.",
            TEST_CLASSIFICATION,
            TEST_QUALITY,
            memoryHash,
            memoryChainHash,
            payloadCanonical,
          ],
        );

      const recordInserted =
        insertResult.ok &&
        insertResult.rowCount === 1;

      recordMayExist = recordInserted;

      checks.push(
        createCheck({
          id: "MEMORY_INSERT",
          label: "Insert temporary memory record",
          status:
            recordInserted
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(insertStartedAt),
          details: {
            memoryId,
            rowCount:
              insertResult.rowCount,
            queryStatus:
              insertResult.status,
            queryDurationMs:
              insertResult.durationMs,
            sqlHash:
              insertResult.sqlHash,
            canonicalValues: {
              scope:
                TEST_SCOPE,
              authority:
                TEST_AUTHORITY,
              memoryKind:
                TEST_MEMORY_KIND,
              memoryStatus:
                TEST_MEMORY_STATUS,
              sourceKind:
                TEST_SOURCE_KIND,
            },
          },
          error:
            insertResult.error ??
            (
              recordInserted
                ? null
                : "MEMORY_INSERT_FAILED"
            ),
        }),
      );

      if (!recordInserted) {
        checks.push(
          createSkippedCheck(
            "MEMORY_READ",
            "Read temporary memory record",
            "MEMORY_INSERT_FAILED",
          ),

          createSkippedCheck(
            "MEMORY_VERIFY",
            "Verify memory continuity",
            "MEMORY_INSERT_FAILED",
          ),
        );
      } else {
        const readStartedAt = nowMs();

        const readResult =
          await queryHbceDatabase<MemoryRecordRow>(
            `
              SELECT
                memory_id,
                memory_key_hash,
                human_ipr,
                runtime_ipr,
                session_id,
                scope,
                authority,
                persistence_mode,
                memory_kind,
                memory_status,
                source_kind,
                memory_title,
                memory_summary,
                save_raw,
                save_synthesis,
                reusable_in_prompt,
                classification,
                quality,
                memory_hash,
                memory_chain_hash,
                record_payload,
                legal_certification,
                deleted_at,
                created_at,
                updated_at
              FROM memory_records
              WHERE memory_id = $1
              LIMIT 1
            `,
            [memoryId],
          );

        const readSucceeded =
          readResult.ok &&
          readResult.rowCount === 1 &&
          Boolean(readResult.rows[0]);

        checks.push(
          createCheck({
            id: "MEMORY_READ",
            label: "Read temporary memory record",
            status:
              readSucceeded
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(readStartedAt),
            details: {
              memoryId,
              rowCount:
                readResult.rowCount,
              queryStatus:
                readResult.status,
              queryDurationMs:
                readResult.durationMs,
              sqlHash:
                readResult.sqlHash,
            },
            error:
              readResult.error ??
              (
                readSucceeded
                  ? null
                  : "MEMORY_READ_FAILED"
              ),
          }),
        );

        if (!readSucceeded) {
          checks.push(
            createSkippedCheck(
              "MEMORY_VERIFY",
              "Verify memory continuity",
              "MEMORY_READ_FAILED",
            ),
          );
        } else {
          const verifyStartedAt = nowMs();
          const row = readResult.rows[0];

          const storedPayload =
            row.record_payload !== null &&
            typeof row.record_payload === "object"
              ? row.record_payload
              : null;

          const comparisons = {
            memoryId:
              valueAsString(row.memory_id) ===
              memoryId,

            memoryKeyHash:
              valueAsString(row.memory_key_hash) ===
              memoryKeyHash,

            humanIpr:
              valueAsString(row.human_ipr) ===
              TEST_HUMAN_IPR,

            runtimeIpr:
              valueAsString(row.runtime_ipr) ===
              TEST_RUNTIME_IPR,

            sessionId:
              valueAsString(row.session_id) ===
              sessionId,

            scope:
              valueAsString(row.scope) ===
              TEST_SCOPE,

            authority:
              valueAsString(row.authority) ===
              TEST_AUTHORITY,

            persistenceMode:
              valueAsString(
                row.persistence_mode,
              ) === "DATABASE_PERSISTENT",

            memoryKind:
              valueAsString(row.memory_kind) ===
              TEST_MEMORY_KIND,

            memoryStatus:
              valueAsString(row.memory_status) ===
              TEST_MEMORY_STATUS,

            sourceKind:
              valueAsString(row.source_kind) ===
              TEST_SOURCE_KIND,

            saveRaw:
              valueAsBoolean(row.save_raw) ===
              false,

            saveSynthesis:
              valueAsBoolean(
                row.save_synthesis,
              ) === true,

            reusableInPrompt:
              valueAsBoolean(
                row.reusable_in_prompt,
              ) === false,

            memoryHash:
              valueAsString(row.memory_hash) ===
              memoryHash,

            memoryChainHash:
              valueAsString(
                row.memory_chain_hash,
              ) === memoryChainHash,

            payload:
              storedPayload !== null &&
              stableJson(storedPayload) ===
                payloadCanonical,

            legalCertification:
              valueAsBoolean(
                row.legal_certification,
              ) === false,

            deletedAt:
              row.deleted_at === null,

            createdAt:
              valueAsString(row.created_at) !==
              null,

            updatedAt:
              valueAsString(row.updated_at) !==
              null,
          };

          const failedComparisons =
            Object.entries(comparisons)
              .filter(([, passed]) => !passed)
              .map(([name]) => name);

          const continuityVerified =
            failedComparisons.length === 0;

          checks.push(
            createCheck({
              id: "MEMORY_VERIFY",
              label: "Verify memory continuity",
              status:
                continuityVerified
                  ? "PASS"
                  : "FAIL",
              durationMs:
                elapsedMs(verifyStartedAt),
              details: {
                memoryId,
                comparisons,
                failedComparisons,
                expectedMemoryHash:
                  memoryHash,
                storedMemoryHash:
                  valueAsString(
                    row.memory_hash,
                  ),
                expectedChainHash:
                  memoryChainHash,
                storedChainHash:
                  valueAsString(
                    row.memory_chain_hash,
                  ),
              },
              error:
                continuityVerified
                  ? null
                  : `MEMORY_CONTINUITY_MISMATCH:${failedComparisons.join(",")}`,
            }),
          );
        }
      }

      const deleteCheck =
        await cleanupTestRecord(memoryId);

      checks.push(deleteCheck);

      const cleanupVerifyStartedAt = nowMs();

      const cleanupResult =
        await queryHbceDatabase<CountRow>(
          `
            SELECT COUNT(*)::int AS record_count
            FROM memory_records
            WHERE memory_id = $1
          `,
          [memoryId],
        );

      const remainingRecords =
        valueAsNumber(
          cleanupResult.rows[0]?.record_count,
        ) ?? -1;

      const cleanupVerified =
        cleanupResult.ok &&
        remainingRecords === 0;

      checks.push(
        createCheck({
          id: "MEMORY_CLEANUP_VERIFY",
          label: "Verify temporary record cleanup",
          status:
            cleanupVerified
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(cleanupVerifyStartedAt),
          details: {
            memoryId,
            remainingRecords,
            queryStatus:
              cleanupResult.status,
            queryDurationMs:
              cleanupResult.durationMs,
            sqlHash:
              cleanupResult.sqlHash,
          },
          error:
            cleanupResult.error ??
            (
              cleanupVerified
                ? null
                : "MEMORY_CLEANUP_NOT_CONFIRMED"
            ),
        }),
      );

      recordMayExist =
        !cleanupVerified;
    }
  } catch (error) {
    checks.push(
      createCheck({
        id: "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled memory self-test runtime error",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          memoryId,
        },
        error:
          normalizeError(error),
      }),
    );
  } finally {
    if (recordMayExist) {
      try {
        await queryHbceDatabase(
          `
            DELETE FROM memory_records
            WHERE memory_id = $1
          `,
          [memoryId],
        );
      } catch {
        // Best-effort cleanup only.
      }
    }
  }

  const requiredFailed =
    checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const ok =
    !requiredFailed;

  const status =
    ok
      ? "HBCE_RUNTIME_MEMORY_PASS"
      : "HBCE_RUNTIME_MEMORY_FAIL";

  const durationMs =
    elapsedMs(startedAt);

  const responseBody = {
    ok,
    status,

    operationalStatus:
      ok ? "PASS" : "FAIL",

    revision:
      REVISION,

    generatedAt,

    product:
      PRODUCT,

    apiVersion:
      API_VERSION,

    runtime:
      RUNTIME_NAME,

    deployment: {
      origin:
        getRequestOrigin(request),

      runtimeEnvironment:
        process.env.VERCEL_ENV ??
        process.env.NODE_ENV ??
        "unknown",

      vercelEnvironment:
        process.env.VERCEL_ENV ??
        null,

      vercelRegion:
        process.env.VERCEL_REGION ??
        process.env.AWS_REGION ??
        null,

      nodeVersion:
        process.version,
    },

    testRecord: {
      memoryId,
      sessionId,

      runtimeIpr:
        TEST_RUNTIME_IPR,

      humanIpr:
        TEST_HUMAN_IPR,

      scope:
        TEST_SCOPE,

      authority:
        TEST_AUTHORITY,

      memoryKind:
        TEST_MEMORY_KIND,

      memoryStatus:
        TEST_MEMORY_STATUS,

      sourceKind:
        TEST_SOURCE_KIND,

      memoryKeyHash,
      memoryHash,
      memoryChainHash,

      temporary:
        true,

      retained:
        recordMayExist,
    },

    summary:
      buildSummary(
        checks,
        durationMs,
      ),

    checks,

    interpretation: {
      databaseConfigured:
        checks.find(
          (check) =>
            check.id ===
            "DATABASE_CONFIGURATION",
        )?.status === "PASS",

      memoryWriteSucceeded:
        checks.find(
          (check) =>
            check.id ===
            "MEMORY_INSERT",
        )?.status === "PASS",

      memoryReadSucceeded:
        checks.find(
          (check) =>
            check.id ===
            "MEMORY_READ",
        )?.status === "PASS",

      memoryContinuityVerified:
        checks.find(
          (check) =>
            check.id ===
            "MEMORY_VERIFY",
        )?.status === "PASS",

      temporaryRecordDeleted:
        checks.find(
          (check) =>
            check.id ===
            "MEMORY_DELETE",
        )?.status === "PASS",

      cleanupVerified:
        checks.find(
          (check) =>
            check.id ===
            "MEMORY_CLEANUP_VERIFY",
        )?.status === "PASS",
    },

    boundary: {
      legalCertification:
        false,

      technicalRuntimeTestOnly:
        true,

      requiresExplicitPost:
        true,

      performsDatabaseRead:
        true,

      performsDatabaseMutation:
        true,

      performsTemporaryMemoryWrite:
        true,

      performsTemporaryMemoryDelete:
        true,

      persistsTestMemory:
        false,

      createsEvt:
        false,

      createsOpc:
        false,

      createsAuditRecord:
        false,

      performsModelCall:
        false,

      reusableInPrompt:
        false,

      replacesHumanReview:
        false,
    },
  };

  return NextResponse.json(
    responseBody,
    {
      status:
        ok ? 200 : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-Memory-Test-Revision":
          REVISION,

        "X-HBCE-Memory-Test-Status":
          ok ? "PASS" : "FAIL",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_MEMORY_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(request)}/api/v1/runtime/memory/self-test`,

      executionMethod:
        "POST",

      description:
        "Executes a temporary write, read, deterministic verification, deletion and cleanup verification cycle against the canonical HBCE memory_records table.",

      canonicalRecordValues: {
        scope:
          TEST_SCOPE,

        authority:
          TEST_AUTHORITY,

        memoryKind:
          TEST_MEMORY_KIND,

        memoryStatus:
          TEST_MEMORY_STATUS,

        sourceKind:
          TEST_SOURCE_KIND,
      },

      warning:
        "GET does not execute the self-test because the test performs temporary database mutations.",

      boundary: {
        legalCertification:
          false,

        getPerformsDatabaseMutation:
          false,

        postPerformsTemporaryDatabaseMutation:
          true,

        persistsTestMemory:
          false,

        createsEvt:
          false,

        createsOpc:
          false,

        createsAuditRecord:
          false,

        performsModelCall:
          false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Memory-Test-Revision":
          REVISION,
      },
    },
  );
}
