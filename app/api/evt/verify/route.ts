export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyEVTChain } from "@/lib/evt-registry";

export async function GET() {
  try {
    const result = verifyEVTChain();

    return NextResponse.json({
      ok: true,
      registry: "EVT",
      chain_valid: result.valid,
      total_events: result.total,
      details: result.results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Chain verification failed"
      },
      { status: 500 }
    );
  }
}
