import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

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

type Level5IdentifierSet = {
  operationId?: unknown;
  memoryId?: unknown;
  evtId?: unknown;
  proofId?: unknown;
  auditId?: unknown;
  usageId?: unknown;
  sessionId?: unknown;
  threadId?: unknown;
  requestId?: unknown;
};

type Level5Scenario = {
  operationId?: unknown;
  identifiers?: Level5IdentifierSet;
};

type Level5Check = {
  id?: unknown;
  status?: unknown;
  details?: Record<string, unknown>;
  error?: unknown;
};

type Level5Response = {
  ok?: unknown;
  status?: unknown;
  operationalStatus?: unknown;
  revision?: unknown;
  generatedAt?: unknown;
  scenarios?: {
    commit?: Level5Scenario;
    rollback?: Level5Scenario;
    firstFailure?: unknown;
  };
  summary?: Record<string, unknown>;
  checks?: Level5Check[];
  interpretation?: Record<string, unknown>;
  boundary?: Record<string, unknown>;
};

type WorkerResult = {
  workerId: string;
  requestId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  httpStatus: number;
  response: Level5Response | null;
  rawResponseHash: string | null;
  error: string | null;
};

const REVISION =
  "HBCE-RUNTIME-CONCURRENT-GOVERNED-EXECUTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const CONCURRENCY = 2;

const LEVEL_5_PATH =
  "/api/v1/runtime/model-transaction/self-test";

const EXPECTED_LEVEL_5_STATUS =
  "HBCE_RUNTIME_GOVERNED_REAL_MODEL_TRANSACTION_PASS";

const EXPECTED_LEVEL_5_REVISION =
  "HBCE-RUNTIME-GOVERNED-REAL-MODEL-TRANSACTION-SELF-TEST-v1_1";

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
  return typeof value === "string" && value.length > 0
    ? value
    : null;
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

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const forwardedHost =
    request.headers.get("x-forwarded-host");
  const host =
    forwardedHost ??
    request.headers.get("host");

  return host
    ? `${proto ?? "https"}://${host}`
    : request.nextUrl.origin;
}

function buildSummary(
  checks: Check[],
  durationMs: number,
): Record<string, number> {
  const required =
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

    requiredChecks: required.length,

    requiredPassed:
      required.filter(
        (check) => check.status === "PASS",
      ).length,

    requiredFailed:
      required.filter(
        (check) => check.status !== "PASS",
      ).length,

    durationMs,
  };
}

function collectIdentifierValues(
  response: Level5Response,
): Record<string, string | null> {
  const commit =
    response.scenarios?.commit?.identifiers ?? {};

  const rollback =
    response.scenarios?.rollback?.identifiers ?? {};

  return {
    commitOperationId:
      asString(commit.operationId),

    commitMemoryId:
      asString(commit.memoryId),

    commitEvtId:
      asString(commit.evtId),

    commitProofId:
      asString(commit.proofId),

    commitAuditId:
      asString(commit.auditId),

    commitUsageId:
      asString(commit.usageId),

    commitSessionId:
      asString(commit.sessionId),

    commitThreadId:
      asString(commit.threadId),

    commitRequestId:
      asString(commit.requestId),

    rollbackOperationId:
      asString(rollback.operationId),

    rollbackMemoryId:
      asString(rollback.memoryId),

    rollbackEvtId:
      asString(rollback.evtId),

    rollbackProofId:
      asString(rollback.proofId),

    rollbackAuditId:
      asString(rollback.auditId),

    rollbackUsageId:
      asString(rollback.usageId),

    rollbackSessionId:
      asString(rollback.sessionId),

    rollbackThreadId:
      asString(rollback.threadId),

    rollbackRequestId:
      asString(rollback.requestId),
  };
}

function collectProviderResponseIds(
  response: Level5Response,
): string[] {
  if (!Array.isArray(response.checks)) {
    return [];
  }

  return response.checks
    .map((check) =>
      asString(
        check.details?.providerResponseId,
      ),
    )
    .filter(
      (value): value is string =>
        value !== null,
    );
}

function allUnique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

async function executeWorker(
  origin: string,
  index: number,
): Promise<WorkerResult> {
  const workerId =
    `HBCE-CONCURRENT-WORKER-${index + 1}`;

  const requestId =
    `HBCE-CONCURRENT-REQUEST-${randomUUID()}`;

  const startedAtMs = nowMs();
  const startedAt = new Date().toISOString();

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    240_000,
  );

  try {
    const response = await fetch(
      `${origin}${LEVEL_5_PATH}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-HBCE-Concurrent-Worker": workerId,
          "X-HBCE-Concurrent-Request": requestId,
        },

        body: JSON.stringify({
          concurrentParentRevision: REVISION,
          concurrentWorkerId: workerId,
          concurrentRequestId: requestId,
        }),

        cache: "no-store",
        signal: controller.signal,
      },
    );

    const raw = await response.text();

    let body: Level5Response | null = null;

    try {
      body = JSON.parse(raw) as Level5Response;
    } catch {
      body = null;
    }

    return {
      workerId,
      requestId,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: elapsedMs(startedAtMs),
      httpStatus: response.status,
      response: body,
      rawResponseHash: sha256(raw),
      error:
        body === null
          ? "LEVEL_5_RESPONSE_NOT_JSON"
          : null,
    };
  } catch (error) {
    return {
      workerId,
      requestId,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: elapsedMs(startedAtMs),
      httpStatus: 0,
      response: null,
      rawResponseHash: null,
      error: normalizeError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const origin = getOrigin(request);
  const checks: Check[] = [];

  const configurationStartedAt = nowMs();

  const openAIConfigured =
    Boolean(process.env.OPENAI_API_KEY);

  const databaseConfigured =
    Boolean(
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      process.env.NEON_DATABASE_URL,
    );

  const configured =
    openAIConfigured &&
    databaseConfigured;

  checks.push(
    createCheck({
      id: "CONCURRENT_RUNTIME_CONFIGURATION",
      label:
        "Concurrent governed execution configuration",
      status:
        configured ? "PASS" : "FAIL",
      durationMs:
        elapsedMs(configurationStartedAt),
      details: {
        origin,
        concurrency: CONCURRENCY,
        downstreamPath: LEVEL_5_PATH,
        expectedDownstreamStatus:
          EXPECTED_LEVEL_5_STATUS,
        expectedDownstreamRevision:
          EXPECTED_LEVEL_5_REVISION,
        openAIConfigured,
        databaseConfigured,
        expectedRealModelCalls:
          CONCURRENCY * 2,
      },
      error:
        configured
          ? null
          : "CONCURRENT_RUNTIME_NOT_CONFIGURED",
    }),
  );

  let workers: WorkerResult[] = [];

  if (!configured) {
    checks.push(
      createCheck({
        id: "CONCURRENT_WORKER_EXECUTION",
        label:
          "Execute governed workers concurrently",
        status: "SKIPPED",
        durationMs: 0,
        details: {
          reason:
            "CONCURRENT_RUNTIME_NOT_CONFIGURED",
        },
        error:
          "CONCURRENT_WORKER_EXECUTION_SKIPPED",
      }),
    );
  } else {
    const workerStartedAt = nowMs();

    workers = await Promise.all(
      Array.from(
        { length: CONCURRENCY },
        (_, index) =>
          executeWorker(origin, index),
      ),
    );

    const workerEvaluations =
      workers.map((worker) => ({
        workerId: worker.workerId,
        requestId: worker.requestId,
        httpStatus: worker.httpStatus,
        durationMs: worker.durationMs,
        error: worker.error,
        ok:
          worker.response?.ok === true,
        status:
          asString(worker.response?.status),
        revision:
          asString(worker.response?.revision),
        firstFailure:
          worker.response?.scenarios
            ?.firstFailure ?? null,
      }));

    const everyWorkerPassed =
      workers.every(
        (worker) =>
          worker.error === null &&
          worker.httpStatus === 200 &&
          worker.response?.ok === true &&
          worker.response?.status ===
            EXPECTED_LEVEL_5_STATUS &&
          worker.response?.revision ===
            EXPECTED_LEVEL_5_REVISION,
      );

    checks.push(
      createCheck({
        id: "CONCURRENT_WORKER_EXECUTION",
        label:
          "Execute governed workers concurrently",
        status:
          everyWorkerPassed
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(workerStartedAt),
        details: {
          concurrency: CONCURRENCY,
          expectedRealModelCalls:
            CONCURRENCY * 2,
          workers: workerEvaluations,
        },
        error:
          everyWorkerPassed
            ? null
            : "ONE_OR_MORE_CONCURRENT_WORKERS_FAILED",
      }),
    );

    const overlapStartedAt = nowMs();

    const startTimes =
      workers
        .map((worker) =>
          Date.parse(worker.startedAt),
        )
        .filter(Number.isFinite);

    const completeTimes =
      workers
        .map((worker) =>
          Date.parse(worker.completedAt),
        )
        .filter(Number.isFinite);

    const earliestCompletion =
      Math.min(...completeTimes);

    const latestStart =
      Math.max(...startTimes);

    const temporalOverlap =
      startTimes.length === CONCURRENCY &&
      completeTimes.length === CONCURRENCY &&
      latestStart <= earliestCompletion;

    checks.push(
      createCheck({
        id: "CONCURRENT_TEMPORAL_OVERLAP",
        label:
          "Verify concurrent execution overlap",
        status:
          temporalOverlap ? "PASS" : "FAIL",
        durationMs:
          elapsedMs(overlapStartedAt),
        details: {
          startTimes:
            workers.map(
              (worker) => ({
                workerId: worker.workerId,
                startedAt: worker.startedAt,
                completedAt:
                  worker.completedAt,
                durationMs:
                  worker.durationMs,
              }),
            ),
          latestStartUtc:
            Number.isFinite(latestStart)
              ? new Date(
                  latestStart,
                ).toISOString()
              : null,
          earliestCompletionUtc:
            Number.isFinite(
              earliestCompletion,
            )
              ? new Date(
                  earliestCompletion,
                ).toISOString()
              : null,
          temporalOverlap,
        },
        error:
          temporalOverlap
            ? null
            : "CONCURRENT_EXECUTIONS_DID_NOT_OVERLAP",
      }),
    );

    const isolationStartedAt = nowMs();

    const identifierMaps =
      workers
        .filter(
          (
            worker,
          ): worker is WorkerResult & {
            response: Level5Response;
          } =>
            worker.response !== null,
        )
        .map((worker) => ({
          workerId: worker.workerId,
          identifiers:
            collectIdentifierValues(
              worker.response,
            ),
        }));

    const identifierEntries =
      identifierMaps.flatMap(
        (worker) =>
          Object.entries(
            worker.identifiers,
          )
            .filter(
              (
                entry,
              ): entry is [string, string] =>
                entry[1] !== null,
            )
            .map(([field, value]) => ({
              workerId: worker.workerId,
              field,
              value,
            })),
      );

    const allIdentifierValues =
      identifierEntries.map(
        (entry) => entry.value,
      );

    const expectedIdentifierCount =
      CONCURRENCY * 18;

    const identifiersComplete =
      allIdentifierValues.length ===
      expectedIdentifierCount;

    const identifiersUnique =
      identifiersComplete &&
      allUnique(allIdentifierValues);

    checks.push(
      createCheck({
        id: "CONCURRENT_LEDGER_IDENTITY_ISOLATION",
        label:
          "Verify cross-worker identifier isolation",
        status:
          identifiersUnique
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(isolationStartedAt),
        details: {
          workerCount: workers.length,
          expectedIdentifierCount,
          actualIdentifierCount:
            allIdentifierValues.length,
          identifiersComplete,
          identifiersUnique,
          workers: identifierMaps,
        },
        error:
          identifiersUnique
            ? null
            : "CONCURRENT_IDENTIFIER_COLLISION_OR_MISSING_IDENTIFIER",
      }),
    );

    const providerStartedAt = nowMs();

    const providerResponseMaps =
      workers
        .filter(
          (
            worker,
          ): worker is WorkerResult & {
            response: Level5Response;
          } =>
            worker.response !== null,
        )
        .map((worker) => ({
          workerId: worker.workerId,
          responseIds:
            collectProviderResponseIds(
              worker.response,
            ),
        }));

    const providerResponseIds =
      providerResponseMaps.flatMap(
        (entry) => entry.responseIds,
      );

    const expectedProviderResponses =
      CONCURRENCY * 4;

    /*
      Each Level 5 response exposes the providerResponseId
      in both the model-call check and the associated
      transaction/verify checks. We therefore deduplicate
      and require two unique provider responses per worker.
    */
    const uniqueProviderResponseIds =
      [...new Set(providerResponseIds)];

    const providerResponsesComplete =
      uniqueProviderResponseIds.length ===
      CONCURRENCY * 2;

    const providerResponsesUnique =
      providerResponsesComplete &&
      allUnique(uniqueProviderResponseIds);

    checks.push(
      createCheck({
        id: "CONCURRENT_PROVIDER_RESPONSE_ISOLATION",
        label:
          "Verify OpenAI response isolation",
        status:
          providerResponsesUnique
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(providerStartedAt),
        details: {
          expectedUniqueProviderResponses:
            CONCURRENCY * 2,
          actualUniqueProviderResponses:
            uniqueProviderResponseIds.length,
          observedProviderResponseReferences:
            providerResponseIds.length,
          referenceUpperBound:
            expectedProviderResponses,
          providerResponsesUnique,
          workers: providerResponseMaps,
          responseIdHashes:
            uniqueProviderResponseIds.map(
              (responseId) =>
                sha256(responseId),
            ),
        },
        error:
          providerResponsesUnique
            ? null
            : "CONCURRENT_PROVIDER_RESPONSE_COLLISION_OR_MISSING_RESPONSE",
      }),
    );

    const contaminationStartedAt =
      nowMs();

    const workerHashes =
      workers.map((worker) => ({
        workerId: worker.workerId,
        rawResponseHash:
          worker.rawResponseHash,
      }));

    const responseHashes =
      workerHashes
        .map(
          (worker) =>
            worker.rawResponseHash,
        )
        .filter(
          (value): value is string =>
            value !== null,
        );

    const responseEnvelopesDistinct =
      responseHashes.length ===
        CONCURRENCY &&
      allUnique(responseHashes);

    const noDownstreamFailure =
      workers.every(
        (worker) =>
          worker.response?.scenarios
            ?.firstFailure === null,
      );

    const allDownstreamCleanupPassed =
      workers.every((worker) => {
        const checks =
          worker.response?.checks;

        if (!Array.isArray(checks)) {
          return false;
        }

        const commitCleanup =
          checks.find(
            (check) =>
              check.id ===
              "REAL_MODEL_COMMIT_CLEANUP",
          );

        const rollbackVerify =
          checks.find(
            (check) =>
              check.id ===
              "REAL_MODEL_ROLLBACK_VERIFY",
          );

        return (
          commitCleanup?.status === "PASS" &&
          rollbackVerify?.status === "PASS"
        );
      });

    const noCrossContamination =
      responseEnvelopesDistinct &&
      noDownstreamFailure &&
      allDownstreamCleanupPassed;

    checks.push(
      createCheck({
        id: "CONCURRENT_CONTAMINATION_GUARD",
        label:
          "Verify no cross-worker ledger contamination",
        status:
          noCrossContamination
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(contaminationStartedAt),
        details: {
          responseEnvelopesDistinct,
          noDownstreamFailure,
          allDownstreamCleanupPassed,
          workerResponseHashes:
            workerHashes,
          downstreamCleanupSemantics:
            "Each Level 5 worker independently verifies committed cleanup and rollback zero-residue.",
        },
        error:
          noCrossContamination
            ? null
            : "CONCURRENT_CROSS_WORKER_CONTAMINATION_GUARD_FAILED",
      }),
    );
  }

  const ok =
    !checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  const durationMs =
    elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_CONCURRENT_GOVERNED_EXECUTION_PASS"
          : "HBCE_RUNTIME_CONCURRENT_GOVERNED_EXECUTION_FAIL",

      operationalStatus:
        ok ? "PASS" : "FAIL",

      revision: REVISION,
      generatedAt,
      product: PRODUCT,
      apiVersion: API_VERSION,
      runtime: RUNTIME_NAME,

      deployment: {
        origin,

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
          "PARALLEL_LEVEL_5_GOVERNED_EXECUTION_ORCHESTRATION",

        concurrency:
          CONCURRENCY,

        expectedRealModelCalls:
          CONCURRENCY * 2,

        downstreamEndpoint:
          `${origin}${LEVEL_5_PATH}`,

        downstreamExpectedStatus:
          EXPECTED_LEVEL_5_STATUS,

        downstreamExpectedRevision:
          EXPECTED_LEVEL_5_REVISION,

        firstFailure:
          firstFailure
            ? {
                id: firstFailure.id,
                error: firstFailure.error,
              }
            : null,
      },

      workers:
        workers.map((worker) => ({
          workerId:
            worker.workerId,

          requestId:
            worker.requestId,

          startedAt:
            worker.startedAt,

          completedAt:
            worker.completedAt,

          durationMs:
            worker.durationMs,

          httpStatus:
            worker.httpStatus,

          ok:
            worker.response?.ok ??
            false,

          status:
            worker.response?.status ??
            null,

          revision:
            worker.response?.revision ??
            null,

          generatedAt:
            worker.response?.generatedAt ??
            null,

          firstFailure:
            worker.response?.scenarios
              ?.firstFailure ??
            null,

          rawResponseHash:
            worker.rawResponseHash,

          error:
            worker.error,
        })),

      summary:
        buildSummary(
          checks,
          durationMs,
        ),

      checks,

      interpretation: {
        concurrentRuntimeConfigured:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_RUNTIME_CONFIGURATION",
          )?.status === "PASS",

        concurrentWorkersPassed:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_WORKER_EXECUTION",
          )?.status === "PASS",

        executionsOverlapped:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_TEMPORAL_OVERLAP",
          )?.status === "PASS",

        ledgerIdentifiersIsolated:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_LEDGER_IDENTITY_ISOLATION",
          )?.status === "PASS",

        providerResponsesIsolated:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_PROVIDER_RESPONSE_ISOLATION",
          )?.status === "PASS",

        noCrossWorkerContamination:
          checks.find(
            (check) =>
              check.id ===
              "CONCURRENT_CONTAMINATION_GUARD",
          )?.status === "PASS",

        concurrentGovernedExecutionPassed:
          ok,
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        orchestratesExistingLevel5Endpoint:
          true,

        directDatabaseMutation:
          false,

        downstreamTemporaryDatabaseMutation:
          true,

        performsRealModelCalls:
          true,

        expectedRealModelCallCount:
          CONCURRENCY * 2,

        concurrency:
          CONCURRENCY,

        concurrentIsolationEvidence: [
          "TEMPORAL_OVERLAP",
          "UNIQUE_OPERATION_IDENTIFIERS",
          "UNIQUE_LEDGER_IDENTIFIERS",
          "UNIQUE_SESSION_AND_THREAD_IDENTIFIERS",
          "UNIQUE_PROVIDER_RESPONSE_IDENTIFIERS",
          "INDEPENDENT_COMMIT_CLEANUP",
          "INDEPENDENT_ROLLBACK_ZERO_RESIDUE",
        ],

        rawPromptPersisted:
          false,

        rawOutputPersisted:
          false,

        createsPersistentBusinessData:
          false,

        verifiesDatabaseSerializationFailureRetry:
          false,

        verifiesSharedResourceContention:
          false,

        replacesLoadTesting:
          false,

        replacesProviderAttestation:
          false,

        replacesHumanReview:
          false,

        note:
          "Level 6 executes two complete Level 5 governed real-model transactions in parallel. It verifies temporal overlap, unique OpenAI response identifiers, unique Memory/EVT/OPC/Audit/Model Usage identifiers, independent commit cleanup and independent rollback zero-residue. It is a bounded concurrency-isolation self-test, not a production load or stress test.",
      },
    },
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

        "X-HBCE-Concurrent-Execution-Revision":
          REVISION,

        "X-HBCE-Concurrent-Execution-Status":
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
  const origin = getOrigin(request);

  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_CONCURRENT_GOVERNED_EXECUTION_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${origin}/api/v1/runtime/concurrent-execution/self-test`,

      executionMethod:
        "POST",

      description:
        "Orchestra due esecuzioni complete e simultanee del Livello 5. Ogni worker effettua due chiamate reali OpenAI e verifica commit e rollback sui cinque ledger. Il Livello 6 controlla sovrapposizione temporale, unicità degli identificatori e assenza di contaminazione tra worker.",

      downstream: {
        path:
          LEVEL_5_PATH,

        expectedStatus:
          EXPECTED_LEVEL_5_STATUS,

        expectedRevision:
          EXPECTED_LEVEL_5_REVISION,
      },

      executionPlan: {
        concurrency:
          CONCURRENCY,

        level5Workers:
          CONCURRENCY,

        realModelCallsPerWorker:
          2,

        expectedRealModelCalls:
          CONCURRENCY * 2,

        checks: [
          "CONCURRENT_WORKER_EXECUTION",
          "CONCURRENT_TEMPORAL_OVERLAP",
          "CONCURRENT_LEDGER_IDENTITY_ISOLATION",
          "CONCURRENT_PROVIDER_RESPONSE_ISOLATION",
          "CONCURRENT_CONTAMINATION_GUARD",
        ],
      },

      warning:
        "POST performs four billable real OpenAI model calls through two concurrent Level 5 workers and triggers temporary downstream database writes. GET performs neither.",

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        orchestratesExistingLevel5Endpoint:
          true,

        performsRealModelCalls:
          true,

        expectedRealModelCallCount:
          CONCURRENCY * 2,

        directDatabaseMutation:
          false,

        downstreamTemporaryDatabaseMutation:
          true,

        rawPromptPersisted:
          false,

        rawOutputPersisted:
          false,

        createsPersistentBusinessData:
          false,

        boundedConcurrencyTest:
          true,

        productionLoadTest:
          false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Concurrent-Execution-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
