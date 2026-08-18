/**
 * AI JOKER-C2
 * Runtime Capabilities Endpoint
 * HERMETICUM B.C.E.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  {
    id: "MISSION_RUNTIME",
    enabled: true,
    description: "Mission orchestration"
  },
  {
    id: "CLAIM_CLASSIFICATION",
    enabled: true,
    description: "Claim classification"
  },
  {
    id: "SOURCE_INTELLIGENCE",
    enabled: true,
    description: "Source Intelligence evaluation"
  },
  {
    id: "SRSC_INTERPRETATION",
    enabled: true,
    description: "SRSC interpretation engine"
  },
  {
    id: "FAIL_CLOSED_EXECUTION",
    enabled: true,
    description: "Fail-Closed runtime execution"
  }
] as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.authenticated) {
    return NextResponse.json(
      {
        ok: false,
        reason: "AUTHENTICATION_REQUIRED",
        legalCertification: false
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      capabilities: CAPABILITIES,
      total: CAPABILITIES.length,
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
