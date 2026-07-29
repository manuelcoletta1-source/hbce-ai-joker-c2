/**
 * AI JOKER-C2
 * Runtime Capabilities Endpoint
 * HERMETICUM B.C.E.
 */

import { NextResponse } from "next/server";

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

export async function GET(): Promise<NextResponse> {
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
