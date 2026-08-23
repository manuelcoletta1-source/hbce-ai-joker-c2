/**
 * AI JOKER-C2
 * Mission Runtime Information Endpoint
 * HERMETICUM B.C.E.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

import {
  runtimeInfo,
  RUNTIME_BOUNDARIES
} from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.runtimeAuthorized) {
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

  const info = runtimeInfo();

  return NextResponse.json(
    {
      ok: true,

      runtime: info,

      capabilities: [
        "MISSION_RUNTIME",
        "CLAIM_CLASSIFICATION",
        "SOURCE_INTELLIGENCE",
        "SRSC_INTERPRETATION",
        "FAIL_CLOSED_EXECUTION"
      ],

      boundaries: [...RUNTIME_BOUNDARIES],

      verification: {
        legalCertification: false,
        autonomousLegalPersonhood: false,
        consciousnessProof: false,
        scientificConsensus: false
      },

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
