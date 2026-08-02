import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeHbceTransactionDatabase,
  isHbceTransactionDatabaseConfigured,
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "@/lib/ipr-database-transaction";

import {
  queryHbceDatabase,
} from "@/lib/ipr-database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 300;

type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

type Check = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type GenericRow = Record<string, unknown>;

type ContentionWorkerResult = {
  workerId: string;
  attempt: number;
  transactionId: string;
  state: string;
  ok: boolean;
  error: string | null;
  rollbackError: string | null;
  readVersion: number | null;
  proposedVersion: number | null;
  committedVersion: number | null;
  durationMs: number;
};

type CountRow = {
  record_count?: unknown;
};

const REVISION =
  "HBCE-RUNTIME-SERIALIZATION-RETRY-IDEMPOTENCY-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const HUMAN_IPR =
  "IPR-HBCE-SERIALIZATION-SELF-TEST";

const RUNTIME_IPR = "IPR-AI-0001";

const MAX_RETRY_ATTEMPTS = 3;

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

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): Check {
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

function createSkippedCheck(
  id: string,
  label: string,
  reason: string,
): Check {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: { reason },
    error: `${id}_SKIPPED`,
  });
}

function buildSummary(
  checks: Check[],
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
    requiredChecks: requiredChecks.length,
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

function isSerializationFailure(
  error: string | null,
): boolean {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();

  return (
    normalized.includes("could not serialize access") ||
    normalized.includes("serialization failure") ||
    normalized.includes("sqlstate 40001") ||
    normalized.includes("code 40001") ||
    normalized.includes("40001")
  );
}

function createBarrier(participantCount: number): {
  wait: () => Promise<void>;
} {
  let arrived = 0;
  let release: (() => void) | null = null;

  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  return {
    async wait(): Promise<void> {
      arrived += 1;

      if (arrived >= participantCount) {
        release?.();
      }

      await released;
    },
  };
}

async function insertContentionSeed(
  memoryId: string,
  generatedAt: string,
  operationId: string,
): Promise<void> {
  const memoryHash = sha256(
    stableJson({
      memoryId,
      operationId,
      version: 0,
      generatedAt,
    }),
  );

  const result = await queryHbceDatabase(
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
        response_utc,
        record_payload,
        legal_certification
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'RUNTIME_ONLY',
        'SESSION_RUNTIME_ONLY',
        'DATABASE_PERSISTENT',
        'RUNTIME_MEMORY',
        'ACTIVE',
        'SERIALIZATION_CONFLICT_TEST',
        'HBCE Serialization Contention Seed',
        'version=0',
        false,
        true,
        false,
        'INTERNAL_TECHNICAL_TEST',
        'VERIFIED_SELF_TEST',
        false,
        '[]'::jsonb,
        $6,
        $7,
        $8::timestamptz,
        $9::jsonb,
        false
      )
      ON CONFLICT (memory_id)
      DO NOTHING
    `,
    [
      memoryId,
      sha256(`memory-key:${memoryId}`),
      HUMAN_IPR,
      RUNTIME_IPR,
      `HBCE-SERIALIZATION-SEED-${randomUUID()}`,
      memoryHash,
      sha256(
        stableJson({
          previousHash: null,
          memoryHash,
          operationId,
        }),
      ),
      generatedAt,
      stableJson({
        operationId,
        version: 0,
        purpose:
          "SERIALIZABLE_CONFLICT_RETRY_IDEMPOTENCY_TEST",
        legalCertification: false,
      }),
    ],
  );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "SERIALIZATION_SEED_INSERT_FAILED",
    );
  }
}

async function runContentionWorker(input: {
  workerId: string;
  memoryId: string;
  operationId: string;
  barrier: {
    wait: () => Promise<void>;
  } | null;
  attempt: number;
}): Promise<ContentionWorkerResult> {
  const startedAt = nowMs();

  const outcome = await withHbceDatabaseTransaction(
    async (tx: HbceTransactionContext) => {
      const readResult =
        await tx.query<GenericRow>(
          `
            SELECT
              memory_summary,
              record_payload
            FROM memory_records
            WHERE memory_id = $1
            LIMIT 1
          `,
          [input.memoryId],
        );

      if (readResult.rowCount !== 1) {
        throw new Error(
          "SERIALIZATION_CONTENTION_ROW_NOT_FOUND",
        );
      }

      const row = readResult.rows[0] ?? {};

      const payload =
        row.record_payload &&
        typeof row.record_payload === "object"
          ? row.record_payload as Record<string, unknown>
          : {};

      const readVersion =
        asNumber(payload.version) ?? 0;

      const proposedVersion =
        readVersion + 1;

      if (input.barrier) {
        await input.barrier.wait();
      }

      const updatedPayload = {
        ...payload,
        operationId: input.operationId,
        lastWorkerId: input.workerId,
        lastAttempt: input.attempt,
        version: proposedVersion,
        updatedAt: new Date().toISOString(),
      };

      const updateResult =
        await tx.query<GenericRow>(
          `
            UPDATE memory_records
            SET
              memory_summary = $2,
              record_payload = $3::jsonb,
              updated_at = CURRENT_TIMESTAMP
            WHERE memory_id = $1
            RETURNING
              memory_summary,
              record_payload
          `,
          [
            input.memoryId,
            `version=${proposedVersion};worker=${input.workerId};attempt=${input.attempt}`,
            stableJson(updatedPayload),
          ],
        );

      if (updateResult.rowCount !== 1) {
        throw new Error(
          "SERIALIZATION_CONTENTION_UPDATE_FAILED",
        );
      }

      const committedPayload =
        updateResult.rows[0]?.record_payload &&
        typeof updateResult.rows[0]?.record_payload === "object"
          ? updateResult.rows[0]?.record_payload as Record<string, unknown>
          : {};

      return {
        readVersion,
        proposedVersion,
        committedVersion:
          asNumber(committedPayload.version),
      };
    },
    {
      isolationLevel: "SERIALIZABLE",
      statementTimeoutMs: 120_000,
      lockTimeoutMs: 30_000,
      idleInTransactionSessionTimeoutMs: 120_000,
    },
  );

  if (outcome.ok) {
    return {
      workerId: input.workerId,
      attempt: input.attempt,
      transactionId: outcome.transactionId,
      state: outcome.state,
      ok: true,
      error: null,
      rollbackError: null,
      readVersion: outcome.value.readVersion,
      proposedVersion: outcome.value.proposedVersion,
      committedVersion: outcome.value.committedVersion,
      durationMs: elapsedMs(startedAt),
    };
  }

  return {
    workerId: input.workerId,
    attempt: input.attempt,
    transactionId: outcome.transactionId,
    state: outcome.state,
    ok: false,
    error: outcome.error,
    rollbackError: outcome.rollbackError,
    readVersion: null,
    proposedVersion: null,
    committedVersion: null,
    durationMs: elapsedMs(startedAt),
  };
}

async function readContentionVersion(
  memoryId: string,
): Promise<{
  version: number | null;
  lastWorkerId: string | null;
  lastAttempt: number | null;
}> {
  const result =
    await queryHbceDatabase<GenericRow>(
      `
        SELECT record_payload
        FROM memory_records
        WHERE memory_id = $1
        LIMIT 1
      `,
      [memoryId],
    );

  if (!result.ok || result.rowCount !== 1) {
    return {
      version: null,
      lastWorkerId: null,
      lastAttempt: null,
    };
  }

  const payload =
    result.rows[0]?.record_payload &&
    typeof result.rows[0]?.record_payload === "object"
      ? result.rows[0]?.record_payload as Record<string, unknown>
      : {};

  return {
    version: asNumber(payload.version),
    lastWorkerId: asString(payload.lastWorkerId),
    lastAttempt: asNumber(payload.lastAttempt),
  };
}

async function runIdempotentInsert(input: {
  memoryId: string;
  operationId: string;
  requestId: string;
  generatedAt: string;
}): Promise<{
  inserted: boolean;
  memoryId: string;
  requestId: string;
}> {
  const memoryHash = sha256(
    stableJson({
      memoryId: input.memoryId,
      operationId: input.operationId,
      idempotencyKey: input.operationId,
    }),
  );

  const result =
    await queryHbceDatabase<GenericRow>(
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
          response_utc,
          record_payload,
          legal_certification
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'RUNTIME_ONLY',
          'SESSION_RUNTIME_ONLY',
          'DATABASE_PERSISTENT',
          'RUNTIME_MEMORY',
          'ACTIVE',
          'IDEMPOTENCY_TEST',
          'HBCE Idempotency Record',
          'single canonical record for repeated operation key',
          false,
          true,
          false,
          'INTERNAL_TECHNICAL_TEST',
          'VERIFIED_SELF_TEST',
          false,
          '[]'::jsonb,
          $6,
          $7,
          $8::timestamptz,
          $9::jsonb,
          false
        )
        ON CONFLICT (memory_id)
        DO NOTHING
        RETURNING memory_id
      `,
      [
        input.memoryId,
        sha256(`idempotency-key:${input.operationId}`),
        HUMAN_IPR,
        RUNTIME_IPR,
        `HBCE-IDEMPOTENCY-SESSION-${input.requestId}`,
        memoryHash,
        sha256(
          stableJson({
            previousHash: null,
            memoryHash,
            operationId: input.operationId,
          }),
        ),
        input.generatedAt,
        stableJson({
          operationId: input.operationId,
          idempotencyKey: input.operationId,
          firstRequestId: input.requestId,
          legalCertification: false,
        }),
      ],
    );

  if (!result.ok) {
    throw new Error(
      result.error ??
      "IDEMPOTENT_INSERT_FAILED",
    );
  }

  return {
    inserted: result.rowCount === 1,
    memoryId: input.memoryId,
    requestId: input.requestId,
  };
}

async function countMemoryId(
  memoryId: string,
): Promise<number> {
  const result =
    await queryHbceDatabase<CountRow>(
      `
        SELECT COUNT(*)::int AS record_count
        FROM memory_records
        WHERE memory_id = $1
      `,
      [memoryId],
    );

  return (
    asNumber(
      result.rows[0]?.record_count,
    ) ?? -1
  );
}

async function deleteMemoryId(
  memoryId: string,
): Promise<void> {
  await queryHbceDatabase(
    `
      DELETE FROM memory_records
      WHERE memory_id = $1
    `,
    [memoryId],
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const checks: Check[] = [];

  const timestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const suffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  const operationId =
    `HBCE-SERIALIZATION-${timestamp}-${suffix}`;

  const contentionMemoryId =
    `MEM-SERIALIZATION-${timestamp}-${suffix}`;

  const idempotencyOperationId =
    `HBCE-IDEMPOTENCY-${timestamp}-${suffix}`;

  const idempotencyMemoryId =
    `MEM-IDEMPOTENCY-${timestamp}-${suffix}`;

  const configured =
    isHbceTransactionDatabaseConfigured();

  checks.push(
    createCheck({
      id: "SERIALIZATION_RUNTIME_CONFIGURATION",
      label:
        "Serialization retry and idempotency runtime configuration",
      status: configured ? "PASS" : "FAIL",
      durationMs: 0,
      details: {
        configured,
        transaction:
          describeHbceTransactionDatabase(),
        isolationLevel: "SERIALIZABLE",
        maxRetryAttempts:
          MAX_RETRY_ATTEMPTS,
      },
      error:
        configured
          ? null
          : "TRANSACTION_DATABASE_NOT_CONFIGURED",
    }),
  );

  if (!configured) {
    checks.push(
      createSkippedCheck(
        "SERIALIZATION_CONFLICT_INJECTION",
        "Create a real SERIALIZABLE write conflict",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "SERIALIZATION_FAILURE_DETECTION",
        "Verify exactly one serialization failure",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "SERIALIZATION_RETRY",
        "Retry the serialization loser",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "SERIALIZATION_FINAL_STATE",
        "Verify deterministic post-retry state",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "IDEMPOTENCY_CONCURRENT_REPLAY",
        "Replay one operation key concurrently",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "IDEMPOTENCY_SINGLE_RECORD_VERIFY",
        "Verify exactly one canonical idempotency record",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
      createSkippedCheck(
        "LEVEL_7_CLEANUP",
        "Remove Level 7 temporary records",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
    );
  } else {
    let seedCreated = false;
    let idempotencyRecordMayExist = false;

    try {
      const seedStartedAt = nowMs();

      await insertContentionSeed(
        contentionMemoryId,
        generatedAt,
        operationId,
      );

      seedCreated = true;

      checks.push(
        createCheck({
          id: "SERIALIZATION_CONTENTION_SEED",
          label:
            "Create shared contention seed record",
          status: "PASS",
          durationMs:
            elapsedMs(seedStartedAt),
          details: {
            operationId,
            contentionMemoryId,
            initialVersion: 0,
          },
        }),
      );

      const barrier = createBarrier(2);

      const conflictStartedAt = nowMs();

      const firstAttemptResults =
        await Promise.all([
          runContentionWorker({
            workerId:
              "HBCE-SERIALIZATION-WORKER-A",
            memoryId:
              contentionMemoryId,
            operationId,
            barrier,
            attempt: 1,
          }),

          runContentionWorker({
            workerId:
              "HBCE-SERIALIZATION-WORKER-B",
            memoryId:
              contentionMemoryId,
            operationId,
            barrier,
            attempt: 1,
          }),
        ]);

      const committedWorkers =
        firstAttemptResults.filter(
          (result) =>
            result.ok &&
            result.state === "COMMITTED",
        );

      const failedWorkers =
        firstAttemptResults.filter(
          (result) => !result.ok,
        );

      const serializationFailures =
        failedWorkers.filter(
          (result) =>
            isSerializationFailure(
              result.error,
            ),
        );

      const conflictObserved =
        committedWorkers.length === 1 &&
        failedWorkers.length === 1 &&
        serializationFailures.length === 1;

      checks.push(
        createCheck({
          id: "SERIALIZATION_CONFLICT_INJECTION",
          label:
            "Create a real SERIALIZABLE write conflict",
          status:
            conflictObserved
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(conflictStartedAt),
          details: {
            operationId,
            contentionMemoryId,
            firstAttemptResults,
            committedWorkerCount:
              committedWorkers.length,
            failedWorkerCount:
              failedWorkers.length,
            serializationFailureCount:
              serializationFailures.length,
          },
          error:
            conflictObserved
              ? null
              : "EXPECTED_SINGLE_SERIALIZATION_CONFLICT_NOT_OBSERVED",
        }),
      );

      checks.push(
        createCheck({
          id: "SERIALIZATION_FAILURE_DETECTION",
          label:
            "Verify exactly one serialization failure",
          status:
            serializationFailures.length === 1
              ? "PASS"
              : "FAIL",
          durationMs: 0,
          details: {
            detected:
              serializationFailures.map(
                (result) => ({
                  workerId:
                    result.workerId,
                  transactionId:
                    result.transactionId,
                  error:
                    result.error,
                  rollbackError:
                    result.rollbackError,
                }),
              ),
            expectedSqlState:
              "40001",
          },
          error:
            serializationFailures.length === 1
              ? null
              : "SERIALIZATION_FAILURE_COUNT_MISMATCH",
        }),
      );

      let retryResult:
        ContentionWorkerResult | null = null;

      const loser =
        serializationFailures[0] ?? null;

      if (loser) {
        const retryStartedAt = nowMs();

        retryResult =
          await runContentionWorker({
            workerId:
              loser.workerId,
            memoryId:
              contentionMemoryId,
            operationId,
            barrier: null,
            attempt: 2,
          });

        const retryPassed =
          retryResult.ok &&
          retryResult.state === "COMMITTED" &&
          retryResult.readVersion === 1 &&
          retryResult.proposedVersion === 2 &&
          retryResult.committedVersion === 2;

        checks.push(
          createCheck({
            id: "SERIALIZATION_RETRY",
            label:
              "Retry the serialization loser",
            status:
              retryPassed
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(retryStartedAt),
            details: {
              retryWorkerId:
                loser.workerId,
              retryAttempt: 2,
              maxRetryAttempts:
                MAX_RETRY_ATTEMPTS,
              retryResult,
            },
            error:
              retryPassed
                ? null
                : retryResult.error ??
                  "SERIALIZATION_RETRY_FAILED",
          }),
        );
      } else {
        checks.push(
          createSkippedCheck(
            "SERIALIZATION_RETRY",
            "Retry the serialization loser",
            "NO_SERIALIZATION_LOSER_AVAILABLE",
          ),
        );
      }

      const finalStateStartedAt = nowMs();

      const finalState =
        await readContentionVersion(
          contentionMemoryId,
        );

      const finalStatePassed =
        finalState.version === 2 &&
        finalState.lastAttempt === 2 &&
        retryResult?.ok === true;

      checks.push(
        createCheck({
          id: "SERIALIZATION_FINAL_STATE",
          label:
            "Verify deterministic post-retry state",
          status:
            finalStatePassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(finalStateStartedAt),
          details: {
            operationId,
            contentionMemoryId,
            expectedVersion: 2,
            finalState,
            successfulLogicalUpdates: 2,
            duplicateLogicalUpdates: 0,
          },
          error:
            finalStatePassed
              ? null
              : "SERIALIZATION_FINAL_STATE_MISMATCH",
        }),
      );

      const replayStartedAt = nowMs();

      const replayRequestIds = [
        `HBCE-IDEMPOTENCY-REQUEST-${randomUUID()}`,
        `HBCE-IDEMPOTENCY-REQUEST-${randomUUID()}`,
        `HBCE-IDEMPOTENCY-REQUEST-${randomUUID()}`,
      ];

      const replayResults =
        await Promise.all(
          replayRequestIds.map(
            (requestId) =>
              runIdempotentInsert({
                memoryId:
                  idempotencyMemoryId,
                operationId:
                  idempotencyOperationId,
                requestId,
                generatedAt,
              }),
          ),
        );

      idempotencyRecordMayExist = true;

      const insertedCount =
        replayResults.filter(
          (result) => result.inserted,
        ).length;

      const replayPassed =
        insertedCount === 1;

      checks.push(
        createCheck({
          id: "IDEMPOTENCY_CONCURRENT_REPLAY",
          label:
            "Replay one operation key concurrently",
          status:
            replayPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(replayStartedAt),
          details: {
            operationId:
              idempotencyOperationId,
            idempotencyMemoryId,
            concurrentReplayCount:
              replayResults.length,
            insertedCount,
            deduplicatedCount:
              replayResults.length -
              insertedCount,
            replayResults,
            conflictPolicy:
              "ON CONFLICT (memory_id) DO NOTHING",
          },
          error:
            replayPassed
              ? null
              : "IDEMPOTENCY_REPLAY_INSERT_COUNT_MISMATCH",
        }),
      );

      const idempotencyVerifyStartedAt =
        nowMs();

      const idempotencyCount =
        await countMemoryId(
          idempotencyMemoryId,
        );

      const idempotencyVerified =
        idempotencyCount === 1;

      checks.push(
        createCheck({
          id: "IDEMPOTENCY_SINGLE_RECORD_VERIFY",
          label:
            "Verify exactly one canonical idempotency record",
          status:
            idempotencyVerified
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              idempotencyVerifyStartedAt,
            ),
          details: {
            operationId:
              idempotencyOperationId,
            idempotencyMemoryId,
            expectedRecordCount: 1,
            actualRecordCount:
              idempotencyCount,
            duplicateRecordCount:
              Math.max(
                0,
                idempotencyCount - 1,
              ),
          },
          error:
            idempotencyVerified
              ? null
              : "IDEMPOTENCY_CANONICAL_RECORD_COUNT_MISMATCH",
        }),
      );
    } catch (error) {
      checks.push(
        createCheck({
          id: "LEVEL_7_UNHANDLED_ERROR",
          label:
            "Unhandled Level 7 runtime error",
          status: "FAIL",
          durationMs:
            elapsedMs(startedAt),
          details: {
            operationId,
            contentionMemoryId,
            idempotencyOperationId,
            idempotencyMemoryId,
          },
          error:
            normalizeError(error),
        }),
      );
    } finally {
      const cleanupStartedAt = nowMs();

      try {
        if (idempotencyRecordMayExist) {
          await deleteMemoryId(
            idempotencyMemoryId,
          );
        }

        if (seedCreated) {
          await deleteMemoryId(
            contentionMemoryId,
          );
        }

        const remainingContention =
          await countMemoryId(
            contentionMemoryId,
          );

        const remainingIdempotency =
          await countMemoryId(
            idempotencyMemoryId,
          );

        const cleanupPassed =
          remainingContention === 0 &&
          remainingIdempotency === 0;

        checks.push(
          createCheck({
            id: "LEVEL_7_CLEANUP",
            label:
              "Remove Level 7 temporary records",
            status:
              cleanupPassed
                ? "PASS"
                : "FAIL",
            durationMs:
              elapsedMs(cleanupStartedAt),
            details: {
              contentionMemoryId,
              idempotencyMemoryId,
              remainingContention,
              remainingIdempotency,
              remainingTotal:
                remainingContention +
                remainingIdempotency,
            },
            error:
              cleanupPassed
                ? null
                : "LEVEL_7_CLEANUP_INCOMPLETE",
          }),
        );
      } catch (cleanupError) {
        checks.push(
          createCheck({
            id: "LEVEL_7_CLEANUP",
            label:
              "Remove Level 7 temporary records",
            status: "FAIL",
            durationMs:
              elapsedMs(cleanupStartedAt),
            details: {
              contentionMemoryId,
              idempotencyMemoryId,
            },
            error:
              normalizeError(cleanupError),
          }),
        );
      }
    }
  }

  const requiredFailed =
    checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const ok = !requiredFailed;

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  const durationMs =
    elapsedMs(startedAt);

  const responseBody = {
    ok,

    status:
      ok
        ? "HBCE_RUNTIME_SERIALIZATION_RETRY_IDEMPOTENCY_PASS"
        : "HBCE_RUNTIME_SERIALIZATION_RETRY_IDEMPOTENCY_FAIL",

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

    execution: {
      mode:
        "SERIALIZABLE_CONFLICT_RETRY_AND_IDEMPOTENCY",

      isolationLevel:
        "SERIALIZABLE",

      maxRetryAttempts:
        MAX_RETRY_ATTEMPTS,

      contentionWorkers:
        2,

      idempotencyConcurrentReplays:
        3,

      operationId,

      contentionMemoryId,

      idempotencyOperationId,

      idempotencyMemoryId,

      firstFailure:
        firstFailure
          ? {
              id:
                firstFailure.id,
              error:
                firstFailure.error,
            }
          : null,
    },

    summary:
      buildSummary(
        checks,
        durationMs,
      ),

    checks,

    interpretation: {
      runtimeConfigured:
        checks.find(
          (check) =>
            check.id ===
            "SERIALIZATION_RUNTIME_CONFIGURATION",
        )?.status === "PASS",

      realSerializationConflictObserved:
        checks.find(
          (check) =>
            check.id ===
            "SERIALIZATION_CONFLICT_INJECTION",
        )?.status === "PASS",

      serializationFailureDetected:
        checks.find(
          (check) =>
            check.id ===
            "SERIALIZATION_FAILURE_DETECTION",
        )?.status === "PASS",

      serializationLoserRetried:
        checks.find(
          (check) =>
            check.id ===
            "SERIALIZATION_RETRY",
        )?.status === "PASS",

      deterministicFinalVersion:
        checks.find(
          (check) =>
            check.id ===
            "SERIALIZATION_FINAL_STATE",
        )?.status === "PASS",

      repeatedOperationDeduplicated:
        checks.find(
          (check) =>
            check.id ===
            "IDEMPOTENCY_CONCURRENT_REPLAY",
        )?.status === "PASS",

      exactlyOneIdempotencyRecord:
        checks.find(
          (check) =>
            check.id ===
            "IDEMPOTENCY_SINGLE_RECORD_VERIFY",
        )?.status === "PASS",

      cleanupCompleted:
        checks.find(
          (check) =>
            check.id ===
            "LEVEL_7_CLEANUP",
        )?.status === "PASS",

      serializationRetryIdempotencyPassed:
        ok,
    },

    boundary: {
      legalCertification:
        false,

      technicalRuntimeTestOnly:
        true,

      performsDirectDatabaseMutation:
        true,

      usesPersistentPoolSessions:
        true,

      isolationLevel:
        "SERIALIZABLE",

      createsRealSerializationConflict:
        true,

      expectedSerializationSqlState:
        "40001",

      boundedRetry:
        true,

      maxRetryAttempts:
        MAX_RETRY_ATTEMPTS,

      idempotencyMechanism:
        "CANONICAL_OPERATION_DERIVED_MEMORY_ID_PLUS_ON_CONFLICT_DO_NOTHING",

      idempotencyReplayCount:
        3,

      verifiesNoDuplicateCanonicalRecord:
        true,

      performsRealModelCall:
        false,

      createsPersistentBusinessData:
        false,

      replacesLoadTesting:
        false,

      replacesFormalExactlyOnceDelivery:
        false,

      replacesHumanReview:
        false,

      note:
        "Level 7 creates two simultaneous SERIALIZABLE transactions that read the same versioned record before either writes. PostgreSQL must commit one transaction and reject the other with a serialization failure. The rejected worker is retried against the new version and must commit exactly once. A separate concurrent replay test submits the same canonical operation key three times and verifies that only one record exists. Temporary records are removed after verification.",
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

        "X-HBCE-Level-7-Revision":
          REVISION,

        "X-HBCE-Level-7-Status":
          ok ? "PASS" : "FAIL",

        "X-HBCE-Legal-Certification":
          "false",
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
        "HBCE_RUNTIME_SERIALIZATION_RETRY_IDEMPOTENCY_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(request)}/api/v1/runtime/serialization-retry/self-test`,

      executionMethod:
        "POST",

      description:
        "Crea una contesa reale tra due transazioni PostgreSQL SERIALIZABLE sulla stessa riga versionata, verifica un conflitto di serializzazione, ritenta il worker respinto e dimostra idempotenza tramite replay concorrente della stessa operazione canonica.",

      scenarios: [
        {
          id:
            "SERIALIZATION_CONFLICT_AND_RETRY",

          flow: [
            "CREATE SHARED VERSIONED RECORD",
            "BEGIN SERIALIZABLE WORKER A",
            "BEGIN SERIALIZABLE WORKER B",
            "BOTH READ VERSION 0",
            "BARRIER RELEASE",
            "BOTH UPDATE SAME RECORD",
            "ONE COMMIT",
            "ONE SQLSTATE 40001 ROLLBACK",
            "RETRY LOSER",
            "FINAL VERSION 2",
          ],
        },

        {
          id:
            "CONCURRENT_IDEMPOTENCY_REPLAY",

          flow: [
            "DERIVE ONE CANONICAL MEMORY ID FROM OPERATION KEY",
            "SUBMIT THREE CONCURRENT INSERTS",
            "ON CONFLICT DO NOTHING",
            "VERIFY EXACTLY ONE CANONICAL RECORD",
          ],
        },
      ],

      warning:
        "GET non esegue il test. POST effettua transazioni concorrenti e scritture temporanee dirette nel ledger memory_records, seguite da cleanup.",

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        usesPersistentPoolSessions:
          true,

        isolationLevel:
          "SERIALIZABLE",

        expectedSerializationSqlState:
          "40001",

        maxRetryAttempts:
          MAX_RETRY_ATTEMPTS,

        idempotencyReplayCount:
          3,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        productionLoadTest:
          false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Level-7-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
