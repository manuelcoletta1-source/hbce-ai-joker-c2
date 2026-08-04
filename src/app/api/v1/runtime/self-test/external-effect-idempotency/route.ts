import { Pool } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

import {
  NeonRuntimeLevel9Adapter,
  type RuntimeLevel9DatabasePool,
} from "../../../../../../runtime/adapters/neon-runtime-level9.adapter";

import {
  runHbceRuntimeLevel9SelfTest,
  type RuntimeLevel9Result,
} from "../../../../../../runtime/self-tests/hbce-runtime-external-effect-idempotency-self-test";

/**
 * HBCE Runtime Level 9
 *
 * POST /api/v1/runtime/self-test/external-effect-idempotency
 *
 * This endpoint creates temporary persistent test records and therefore uses
 * POST rather than GET. It performs no real model call, no process termination,
 * no business-data creation and no automatic deployment or submission.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer" as const;
const REVISION =
  "HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0" as const;

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("HBCE_DATABASE_URL_NOT_CONFIGURED");
  }

  return databaseUrl;
}

function isAuthorized(request: Request): boolean {
  const configuredSecret =
    process.env.HBCE_RUNTIME_SELF_TEST_SECRET;

  /*
   * Fail closed in production.
   *
   * Local and test environments may execute without a secret so automated
   * tests can construct the route without provisioning deployment secrets.
   */
  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  const explicitHeader = request.headers.get(
    "x-hbce-runtime-self-test-secret",
  );

  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  return (
    bearerToken === configuredSecret ||
    explicitHeader === configuredSecret
  );
}

function buildFailureResult(
  error: unknown,
): RuntimeLevel9Result {
  const generatedAt = new Date().toISOString();

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return {
    ok: false,
    status: "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_FAIL",
    operationalStatus: "FAIL",
    revision: REVISION,
    generatedAt,
    product: PRODUCT,
    apiVersion: "v1",
    runtime: "AI_JOKER_C2_SAAS_CORE_v0_1",
    deployment: {
      origin:
        process.env.VERCEL_PROJECT_PRODUCTION_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "LOCAL_RUNTIME",
      runtimeEnvironment:
        process.env.NODE_ENV ?? "unknown",
      vercelEnvironment:
        process.env.VERCEL_ENV ?? "local",
      vercelRegion:
        process.env.VERCEL_REGION ?? "local",
      nodeVersion: process.version,
    },
    execution: {
      mode:
        "PERSISTENT_EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX_RECONCILIATION",
      operationId: "NOT_CREATED",
      idempotencyKey: "NOT_CREATED",
      originalWorker: "NOT_CREATED",
      recoveryWorker: "NOT_CREATED",
      competingWorker: "NOT_CREATED",
      crashPoint:
        "AFTER_EXTERNAL_EFFECT_AND_OUTBOX_COMMIT_BEFORE_WORKFLOW_CHECKPOINT_UPDATE",
      recoveryStrategy:
        "EXCLUSIVE_LEASE_EFFECT_RECONCILIATION_AND_WORKFLOW_RESUMPTION",
      firstFailure: message,
    },
    summary: {
      totalChecks: 16,
      passedChecks: 0,
      failedChecks: 1,
      skippedChecks: 15,
      requiredChecks: 16,
      requiredPassed: 0,
      requiredFailed: 1,
      durationMs: 0,
    },
    checks: [
      {
        id: "ENDPOINT_INITIALIZATION",
        label: "Initialize Level 9 runtime self-test endpoint",
        required: true,
        status: "FAIL",
        durationMs: 0,
        details: null,
        error: message,
      },
      ...Array.from(
        { length: 15 },
        (_, index) => ({
          id: `NOT_EXECUTED_${index + 2}`,
          label: "Not executed because endpoint initialization failed",
          required: true as const,
          status: "SKIPPED" as const,
          durationMs: 0,
          details: null,
          error: null,
        }),
      ),
    ],
    interpretation: {
      durableOperationCreated: false,
      idempotencyReplayResolved: false,
      persistentExternalEffectCreated: false,
      transactionalOutboxCreated: false,
      controlledCrashPersistedAfterEffectCommit: false,
      recoveryNeedDetected: false,
      exclusiveRecoveryLeaseAcquired: false,
      competingWorkerRejected: false,
      existingEffectReconciled: false,
      duplicateEffectRejected: false,
      workflowResumedWithoutDuplicateEffect: false,
      opcClosureGenerated: false,
      completedReplayResolvedWithoutNewEffects: false,
      cleanupCompleted: false,
      externalEffectIdempotencyPassed: false,
    },
    boundary: {
      legalCertification: false,
      technicalRuntimeTestOnly: true,
      uneBdoOpening: true,
      space: "HBCE_PRODUCTION_RUNTIME",
      time: generatedAt,
      usesDurableOperationRegistry: true,
      usesDurableStateMachine: true,
      usesCheckpointPersistence: true,
      usesExclusiveRecoveryLease: true,
      usesHeartbeat: true,
      rejectsCompetingRecoveryWorker: true,
      idempotencyRequired: true,
      usesPersistentExternalEffect: true,
      usesUniqueEffectConstraint: true,
      usesTransactionalOutbox: true,
      usesRecoveryReconciliation: true,
      performsControlledCrashInjection: true,
      performsRealProcessTermination: false,
      performsRealModelCall: false,
      createsTemporaryPersistentTestData: true,
      testRecordRetained: false,
      opcGeneratedAtClosure: true,
      replacesDisasterRecoveryTesting: false,
      replacesMultiRegionFailoverTesting: false,
      replacesHumanReview: false,
      externalDeliverySemantics:
        "AT_LEAST_ONCE_DELIVERY_WITH_IDEMPOTENT_CONSUMER_REQUIREMENT",
      note:
        "The Level 9 endpoint failed before completion. No PASS claim is authorized.",
    },
  };
}

export async function POST(
  request: Request,
): Promise<NextResponse<RuntimeLevel9Result | {
  ok: false;
  status: "HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED";
  operationalStatus: "FAIL";
  legalCertification: false;
}>> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        status: "HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED",
        operationalStatus: "FAIL",
        legalCertification: false,
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let pool: Pool | null = null;

  try {
    const databaseUrl = getDatabaseUrl();

    pool = new Pool({
      connectionString: databaseUrl,
    });

    /*
     * The adapter accepts the reduced pool contract used by the Level 9 test.
     * The explicit cast avoids coupling the adapter to driver-specific generic
     * metadata while retaining the actual persistent Neon Pool at runtime.
     */
    const adapter = new NeonRuntimeLevel9Adapter(
      pool as unknown as RuntimeLevel9DatabasePool,
    );

    const result = await runHbceRuntimeLevel9SelfTest(
      adapter,
      {
        deployment: {
          origin:
            process.env.VERCEL_PROJECT_PRODUCTION_URL ??
            process.env.NEXT_PUBLIC_APP_URL ??
            new URL(request.url).origin,
          runtimeEnvironment:
            process.env.NODE_ENV ?? "unknown",
          vercelEnvironment:
            process.env.VERCEL_ENV ?? "local",
          vercelRegion:
            process.env.VERCEL_REGION ?? "local",
          nodeVersion: process.version,
        },
      },
    );

    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-Artifact": REVISION,
        "X-HBCE-Operational-Status":
          result.operationalStatus,
        "X-HBCE-Legal-Certification": "false",
      },
    });
  } catch (error) {
    const result = buildFailureResult(error);

    return NextResponse.json(result, {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-Artifact": REVISION,
        "X-HBCE-Operational-Status": "FAIL",
        "X-HBCE-Legal-Certification": "false",
      },
    });
  } finally {
    if (pool) {
      await pool.end().catch(() => {
        /*
         * Do not replace the actual self-test result with a pool-shutdown
         * failure. Vercel may already terminate the serverless invocation.
         */
      });
    }
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      status: "METHOD_NOT_ALLOWED",
      allowedMethods: ["POST"],
      reason:
        "This self-test creates temporary persistent records and requires explicit POST authorization.",
      revision: REVISION,
      legalCertification: false,
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    },
  );
}
