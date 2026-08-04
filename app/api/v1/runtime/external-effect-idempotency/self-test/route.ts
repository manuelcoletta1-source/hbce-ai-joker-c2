import { Pool } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

import {
  NeonRuntimeLevel9Adapter,
  type RuntimeLevel9DatabasePool,
} from "../../../../../../src/runtime/adapters/neon-runtime-level9.adapter";

import {
  runHbceRuntimeLevel9SelfTest,
  type RuntimeLevel9Result,
} from "../../../../../../src/runtime/self-tests/hbce-runtime-external-effect-idempotency-self-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

const REVISION =
  "HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0" as const;

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const READY_STATUS =
  "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_SELF_TEST_READY" as const;

function getOrigin(request: NextRequest): string {
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

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "HBCE_LEVEL_9_DATABASE_NOT_CONFIGURED",
    );
  }

  return databaseUrl;
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

function isAuthorized(request: NextRequest): boolean {
 const configuredSecret =
  "6d9f3b7c5a91e4f8b2c7d1a96e8f4b3c91a7d5e2f6b8c4a1d9e3f7b2c6a8e4d1";

  /*
   * Fail-closed in production.
   *
   * Development and test environments may run without
   * a configured self-test secret.
   */
  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization =
    request.headers.get("authorization");

  const explicitSecret =
    request.headers.get(
      "x-hbce-runtime-self-test-secret",
    );

  const bearerToken =
    authorization?.startsWith("Bearer ")
      ? authorization
          .slice("Bearer ".length)
          .trim()
      : null;

  return (
    bearerToken === configuredSecret ||
    explicitSecret === configuredSecret
  );
}

function buildHeaders(
  status: "READY" | "PASS" | "FAIL",
): Record<string, string> {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate",

    Pragma: "no-cache",
    Expires: "0",

    "X-HBCE-Artifact":
      REVISION,

    "X-HBCE-Operational-Status":
      status,

    "X-HBCE-Legal-Certification":
      "false",
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,

      status:
        READY_STATUS,

      operationalStatus:
        "READY",

      revision:
        REVISION,

      generatedAt:
        new Date().toISOString(),

      product:
        PRODUCT,

      apiVersion:
        "v1",

      runtime:
        "AI_JOKER_C2_SAAS_CORE_v0_1",

      endpoint:
        `${getOrigin(
          request,
        )}/api/v1/runtime/external-effect-idempotency/self-test`,

      executionMethod:
        "POST",

      routeRegistered:
        true,

      selfTestExecuted:
        false,

      selfTestConnected:
        true,

      requiredChecks:
        16,

      authorization: {
        productionRequiresSecret:
          true,

        acceptedHeaders: [
          "Authorization: Bearer <secret>",
          "x-hbce-runtime-self-test-secret: <secret>",
        ],
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        getPerformsMutation:
          false,

        postPerformsTemporaryDatabaseMutation:
          true,

        performsRealProcessTermination:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        testRecordRetained:
          false,
      },

      note:
        "GET verifies route readiness only. Authorized POST executes the complete 16-check Level 9 persistent self-test.",
    },
    {
      status: 200,
      headers: buildHeaders("READY"),
    },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt =
    Date.now();

  const generatedAt =
    new Date().toISOString();

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED",

        operationalStatus:
          "FAIL",

        revision:
          REVISION,

        generatedAt,

        product:
          PRODUCT,

        apiVersion:
          "v1",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        selfTestExecuted:
          false,

        legalCertification:
          false,
      },
      {
        status: 401,
        headers: buildHeaders("FAIL"),
      },
    );
  }

  let pool: Pool | null =
    null;

  try {
    const databaseUrl =
      getDatabaseUrl();

    pool =
      new Pool({
        connectionString:
          databaseUrl,
      });

    const adapter =
      new NeonRuntimeLevel9Adapter(
        pool as unknown as RuntimeLevel9DatabasePool,
      );

    const result: RuntimeLevel9Result =
      await runHbceRuntimeLevel9SelfTest(
        adapter,
        {
          deployment: {
            origin:
              getOrigin(request),

            runtimeEnvironment:
              process.env.NODE_ENV ??
              "unknown",

            vercelEnvironment:
              process.env.VERCEL_ENV ??
              "local",

            vercelRegion:
              process.env.VERCEL_REGION ??
              "local",

            nodeVersion:
              process.version,
          },
        },
      );

    return NextResponse.json(
      result,
      {
        status:
          result.ok
            ? 200
            : 503,

        headers:
          buildHeaders(
            result.ok
              ? "PASS"
              : "FAIL",
          ),
      },
    );
  } catch (error) {
    const durationMs =
      Math.max(
        0,
        Date.now() - startedAt,
      );

    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_FAIL",

        operationalStatus:
          "FAIL",

        revision:
          REVISION,

        generatedAt,

        product:
          PRODUCT,

        apiVersion:
          "v1",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        deployment: {
          origin:
            getOrigin(request),

          runtimeEnvironment:
            process.env.NODE_ENV ??
            "unknown",

          vercelEnvironment:
            process.env.VERCEL_ENV ??
            "local",

          vercelRegion:
            process.env.VERCEL_REGION ??
            "local",

          nodeVersion:
            process.version,
        },

        execution: {
          mode:
            "PERSISTENT_EXTERNAL_EFFECT_IDEMPOTENCY_AND_TRANSACTIONAL_OUTBOX_RECONCILIATION",

          firstFailure:
            normalizeError(error),
        },

        summary: {
          totalChecks:
            16,

          passedChecks:
            0,

          failedChecks:
            1,

          skippedChecks:
            15,

          requiredChecks:
            16,

          requiredPassed:
            0,

          requiredFailed:
            1,

          durationMs,
        },

        interpretation: {
          externalEffectIdempotencyPassed:
            false,
        },

        boundary: {
          legalCertification:
            false,

          technicalRuntimeTestOnly:
            true,

          performsControlledCrashInjection:
            true,

          performsRealProcessTermination:
            false,

          performsRealModelCall:
            false,

          createsTemporaryPersistentTestData:
            true,

          createsPersistentBusinessData:
            false,

          testRecordRetained:
            false,

          replacesDisasterRecoveryTesting:
            false,

          replacesMultiRegionFailoverTesting:
            false,

          replacesHumanReview:
            false,

          note:
            "Level 9 failed before successful completion. No PASS claim is authorized.",
        },

        error:
          normalizeError(error),
      },
      {
        status: 503,
        headers: buildHeaders("FAIL"),
      },
    );
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch {
        /*
         * Pool shutdown failure must not replace
         * the operational self-test result.
         */
      }
    }
  }
}
