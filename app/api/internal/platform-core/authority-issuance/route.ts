import { NextRequest, NextResponse } from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential,
} from "@/lib/api-auth";

import {
  issuePlatformCoreCanonicalAuthorityGenesis,
} from "@/src/runtime/platform-core/authority-issuance.service";

import type {
  PlatformCoreCanonicalAuthorityGenesisInput,
} from "@/src/runtime/platform-core/canonical-authority-builder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUTHORITY_ISSUANCE_ENDPOINT =
  "/api/internal/platform-core/authority-issuance" as const;

const AUTHORITY_ISSUANCE_METHOD =
  "POST" as const;

const AUTHORITY_ISSUANCE_SCOPE =
  "internal:platform-core:authority-issue" as const;

const ROUTE_REVISION =
  "HBCE-PLATFORM-CORE-AUTHORITY-ISSUANCE-ROUTE-v1.0" as const;

function json(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-Route-Revision":
          ROUTE_REVISION,
        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  const auth =
    await validateHbceApiCredential({
      headers: request.headers,
      endpoint:
        AUTHORITY_ISSUANCE_ENDPOINT,
      method:
        AUTHORITY_ISSUANCE_METHOD,
      requiredScopes: [
        AUTHORITY_ISSUANCE_SCOPE,
      ],
    });

  if (!auth.ok) {
    return json(
      buildHbceApiAuthErrorBody(
        auth,
      ),
      auth.httpStatus,
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return json(
      {
        ok: false,
        status:
          "AUTHORITY_ISSUANCE_DENIED",
        reason:
          "AUTHORITY_GENESIS_INPUT_REQUIRED",
        legalCertification: false,
      },
      400,
    );
  }

  const persistence =
    await issuePlatformCoreCanonicalAuthorityGenesis(
      input as
        PlatformCoreCanonicalAuthorityGenesisInput,
    );

  return json(
    {
      ok: true,
      status:
        "AUTHORITY_ISSUANCE_PERSISTED",
      authority:
        persistence.authority,
      persistedAt:
        persistence.persistedAt,
      idempotentReplay:
        persistence.idempotentReplay,
      legalCertification: false,
    },
    persistence.idempotentReplay
      ? 200
      : 201,
  );
}
