import { NextRequest, NextResponse } from "next/server";
import { readEVTLedger, verifyEVTChain } from "../../../lib/evt-registry";

export async function GET(_req: NextRequest) {
  try {
    const ledger = await readEVTLedger();
    const verification = await verifyEVTChain();

    return NextResponse.json({
      ok: true,
      registry: "EVT",
      total: ledger.length,
      verification,
      events: ledger
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
