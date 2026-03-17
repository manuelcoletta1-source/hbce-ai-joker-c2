import { NextResponse } from "next/server";

import {
  dbGetLedgerTail,
  dbIsConfigured,
  dbVerifyLedger
} from "@/lib/joker-db";

import {
  signatureIsConfigured
} from "@/lib/joker-signature";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!dbIsConfigured()) {
      return NextResponse.json({
        ok: false,
        error: "Persistent DB not configured",
        node: "HBCE-MATRIX-NODE-0001-TORINO",
        identity: "IPR-AI-0001"
      });
    }

    const verification = await dbVerifyLedger();
    const tail = await dbGetLedgerTail(10);

    return NextResponse.json({
      ok: true,
      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",
      system: "JOKER-C2",
      verify: {
        ledger_integrity: verification.ok,
        checked_events: verification.checked,
        broken_at: verification.broken_seq
      },
      signature: {
        enabled: signatureIsConfigured()
      },
      storage: {
        type: "redis"
      },
      ledger_tail: tail.map((event) => ({
        seq: event.seq,
        id: event.id,
        kind: event.kind,
        ts: event.ts,
        hash: event.hash,
        prev_hash: event.prev_hash
      })),
      ts: new Date().toISOString()
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verify failed";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    );
  }
}
