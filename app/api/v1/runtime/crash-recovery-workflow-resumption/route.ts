import { NextResponse } from "next/server";

import {
  runHbceRuntimeCrashRecoveryWorkflowResumptionSelfTest,
  type HbceRuntimeCrashRecoveryWorkflowResumptionResult,
} from "@/runtime/self-tests/hbce-runtime-crash-recovery-workflow-resumption-self-test";

/**
 * HBCE Runtime Level 8
 *
 * Route:
 * POST /api/v1/runtime/crash-recovery-workflow-resumption
 *
 * Artifact:
 * HBCE-RUNTIME-CRASH-RECOVERY-WORKFLOW-RESUMPTION-SELF-TEST-v1_1
 *
 * Boundary:
 * - technical runtime test only
 * - legalCertification = false
 * - controlled interruption only
 * - no real process termination
 * - no real model call
 * - no persistent business data
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const REVISION =
  "HBCE-RUNTIME-CRASH-RECOVERY-WORKFLOW-RESUMPTION-SELF-TEST-v1_1" as const;

type UnauthorizedResult = {
  ok: false;
  status: "HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED";
  operationalStatus: "FAIL";
  revision: typeof REVISION;
  legalCertification: false;
};

type InitializationFailureResult = {
  ok: false;
  status: "HBCE_RUNTIME_CRASH_RECOVERY_WORKFLOW_RESUMPTION_FAIL";
  operationalStatus: "FAIL";
  revision: typeof REVISION;
  generatedAt: string;
  error: string;
  legalCertification: false;
};

function isAuthorized(request: Request): boolean {
  const configuredSecret =
    process.env.HBCE_RUNTIME_SELF_TEST_SECRET;

  /*
   * Production is fail-closed.
   *
   * Development and test environments may execute without a secret.
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
      ? authorization.slice("Bearer ".length).trim()
      : null;

  return (
    bearerToken === configuredSecret ||
    explicitSecret === configuredSecret
  );
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildInitializationFailure(
  error: unknown,
): InitializationFailureResult {
  return {
    ok: false,
    status:
      "HBCE_RUNTIME_CRASH_RECOVERY_WORKFLOW_RESUMPTION_FAIL",
    operationalStatus: "FAIL",
    revision: REVISION,
    generatedAt: new Date().toISOString(),
    error: normalizeError(error),
    legalCertification: false,
  };
}

export async function POST(
  request: Request,
): Promise<
  NextResponse<
    | HbceRuntimeCrashRecoveryWorkflowResumptionResult
    | UnauthorizedResult
    | InitializationFailureResult
  >
> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        status:
          "HBCE_RUNTIME_SELF_TEST_UNAUTHORIZED",
        operationalStatus: "FAIL",
        revision: REVISION,
        legalCertification: false,
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "X-HBCE-Artifact": REVISION,
          "X-HBCE-Operational-Status": "FAIL",
          "X-HBCE-Legal-Certification": "false",
        },
      },
    );
  }

  try {
    const result =
      await runHbceRuntimeCrashRecoveryWorkflowResumptionSelfTest(
        {
          deployment: {
            origin:
              process.env
                .VERCEL_PROJECT_PRODUCTION_URL ??
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
    const failure =
      buildInitializationFailure(error);

    return NextResponse.json(failure, {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-Artifact": REVISION,
        "X-HBCE-Operational-Status": "FAIL",
        "X-HBCE-Legal-Certification": "false",
      },
    });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      status: "METHOD_NOT_ALLOWED",
      allowedMethods: ["POST"],
      reason:
        "The crash-recovery self-test creates temporary persistent runtime records and requires an explicitly authorized POST request.",
      revision: REVISION,
      legalCertification: false,
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
        "X-HBCE-Artifact": REVISION,
        "X-HBCE-Legal-Certification": "false",
      },
    },
  );
}
