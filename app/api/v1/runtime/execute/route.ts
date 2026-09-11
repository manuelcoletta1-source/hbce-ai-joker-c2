/**
 * AI JOKER-C2
 * Mission Runtime Execute Endpoint
 * HERMETICUM B.C.E.
 *
 * Production control-plane ingress:
 * authenticated caller -> canonical AUTHORIZATION ->
 * durable Authority usability -> runtime bootstrap.
 *
 * Authorization consumption, canonical EXECUTION genesis and persistence
 * remain separate later boundaries.
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential,
} from "@/lib/api-auth";

import {
  bootstrapRuntime,
  type RuntimeBootstrapInput,
} from "@/lib/runtime/bootstrap";

import {
  buildPlatformCoreCanonicalAuthorization,
  PlatformCoreCanonicalAuthorizationBuilderError,
  type PlatformCoreCanonicalAuthorizationInput,
} from "@/src/runtime/platform-core/canonical-authorization-builder";

import {
  resolvePlatformCoreProductionAuthorizationAuthority,
} from "@/src/runtime/platform-core/production-authorization-authority-resolver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RUNTIME_EXECUTE_ENDPOINT =
  "/api/v1/runtime/execute" as const;

const RUNTIME_EXECUTE_METHOD =
  "POST" as const;

const RUNTIME_EXECUTE_SCOPE =
  "v1:runtime:execute" as const;

const ROUTE_REVISION =
  "HBCE-RUNTIME-EXECUTE-CONTROL-PLANE-v1.0" as const;

type RuntimeExecuteRequestBody =
  Readonly<{
    runtimeInput?:
      unknown;

    canonicalAuthorizationSource?:
      unknown;
  }>;

function isPlainRecord(
  value:
    unknown,
): value is
  Record<string, unknown> {
  if (
    value ===
      null
    || typeof value !==
      "object"
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

function json(
  body:
    Record<string, unknown>,
  status:
    number,
): NextResponse {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Route-Revision":
          ROUTE_REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

function deniedInput(
  reason:
    "RUNTIME_EXECUTION_INPUT_REQUIRED"
    | "CANONICAL_AUTHORIZATION_INVALID",
): NextResponse {
  return json(
    {
      ok:
        false,

      status:
        "RUNTIME_EXECUTION_DENIED",

      failClosed:
        true,

      reason,

      legalCertification:
        false,
    },
    400,
  );
}

function deniedAuthorityGate():
  NextResponse {
  return json(
    {
      ok:
        false,

      status:
        "RUNTIME_EXECUTION_DENIED",

      failClosed:
        true,

      reason:
        "AUTHORITY_GATE_DENIED",

      legalCertification:
        false,
    },
    403,
  );
}

export async function POST(
  request:
    NextRequest,
): Promise<
  NextResponse
> {
  const auth =
    await validateHbceApiCredential({
      headers:
        request.headers,

      endpoint:
        RUNTIME_EXECUTE_ENDPOINT,

      method:
        RUNTIME_EXECUTE_METHOD,

      requiredScopes: [
        RUNTIME_EXECUTE_SCOPE,
      ],
    });

  if (
    !auth.ok
  ) {
    return json(
      buildHbceApiAuthErrorBody(
        auth,
      ),
      auth.httpStatus,
    );
  }

  let rawBody:
    unknown;

  try {
    rawBody =
      await request.json();
  } catch {
    return deniedInput(
      "RUNTIME_EXECUTION_INPUT_REQUIRED",
    );
  }

  if (
    !isPlainRecord(
      rawBody,
    )
  ) {
    return deniedInput(
      "RUNTIME_EXECUTION_INPUT_REQUIRED",
    );
  }

  const body =
    rawBody as
      RuntimeExecuteRequestBody;

  try {
    let canonicalAuthorization;

    try {
      canonicalAuthorization =
        buildPlatformCoreCanonicalAuthorization(
          body.canonicalAuthorizationSource as
            PlatformCoreCanonicalAuthorizationInput,
        );
    } catch (error) {
      if (
        error instanceof
          PlatformCoreCanonicalAuthorizationBuilderError
      ) {
        return deniedInput(
          "CANONICAL_AUTHORIZATION_INVALID",
        );
      }

      throw error;
    }

    const authorityResolution =
      await resolvePlatformCoreProductionAuthorizationAuthority(
        canonicalAuthorization,
      );

    if (
      authorityResolution.kind !==
        "RESOLVED"
    ) {
      return deniedAuthorityGate();
    }

    const result =
      bootstrapRuntime(
        body.runtimeInput as
          RuntimeBootstrapInput,
      );

    return json(
      {
        ok:
          !result.failClosed,

        execution:
          result,

        timestamp:
          new Date().toISOString(),
      },
      result.failClosed
        ? 400
        : 200,
    );
  } catch {
    return json(
      {
        ok:
          false,

        failClosed:
          true,

        error:
          "RUNTIME_EXECUTION_FAILED",

        timestamp:
          new Date().toISOString(),

        legalCertification:
          false,
      },
      500,
    );
  }
}
