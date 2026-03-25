import { NextRequest, NextResponse } from "next/server";
import { verifyEVTChain } from "@/lib/evt-registry";

export async function GET(_req: NextRequest) {
  try {
    const result = await verifyEVTChain();

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
        error: error instanceof Error ? error.message : "Internal error"
      },
      { status: 500 }
    );
  }
}
