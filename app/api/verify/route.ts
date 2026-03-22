import { NextResponse } from "next/server";

import { nodeGetPublicVerifySnapshot } from "@/lib/node/node-verify";
import { nodeLedgerIsConfigured } from "@/lib/node/node-ledger";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!nodeLedgerIsConfigured()) {
      return NextResponse.json({
        ok: false,
        error: "Persistent DB not configured",
        node: "HBCE-MATRIX-NODE-0001-TORINO",
        identity: "IPR-AI-0001",
        system: "JOKER-C2"
      });
    }

    const snapshot = await nodeGetPublicVerifySnapshot(10);

    return NextResponse.json({
      ok: true,
      node: snapshot.node,
      identity: snapshot.identity,
      system: snapshot.system,
      verify: snapshot.verify,
      continuity: snapshot.continuity,
      signature: snapshot.signature,
      storage: snapshot.storage,
      ledger_tail: snapshot.ledger_tail,
      ts: snapshot.ts
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
