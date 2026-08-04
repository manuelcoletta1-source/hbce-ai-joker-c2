import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const REVISION =
  "HBCE-RUNTIME-EXTERNAL-EFFECT-IDEMPOTENCY-SELF-TEST-v1_0";

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

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const origin =
    getOrigin(request);

  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_SELF_TEST_READY",

      operationalStatus:
        "READY",

      revision:
        REVISION,

      generatedAt:
        new Date().toISOString(),

      product:
        "HBCE IPR Operational Identity & Proof Layer",

      apiVersion:
        "v1",

      runtime:
        "AI_JOKER_C2_SAAS_CORE_v0_1",

      endpoint:
        `${origin}/api/v1/runtime/external-effect-idempotency/self-test`,

      executionMethod:
        "POST",

      routeRegistered:
        true,

      selfTestExecuted:
        false,

      requiredChecks:
        16,

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        getPerformsMutation:
          false,

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
        "Readiness route only. The Level 9 persistent self-test is not executed by GET.",
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "X-HBCE-Level-9-Revision":
          REVISION,

        "X-HBCE-Level-9-Status":
          "READY",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_EXTERNAL_EFFECT_IDEMPOTENCY_NOT_CONNECTED",

      operationalStatus:
        "PENDING_IMPLEMENTATION",

      revision:
        REVISION,

      generatedAt:
        new Date().toISOString(),

      routeRegistered:
        true,

      selfTestExecuted:
        false,

      reason:
        "The route is registered, but the Level 9 adapter and persistent self-test are not connected in this verification step.",

      legalCertification:
        false,
    },
    {
      status: 501,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Level-9-Revision":
          REVISION,

        "X-HBCE-Level-9-Status":
          "PENDING_IMPLEMENTATION",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
