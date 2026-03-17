import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { dbGetLedgerTail, dbIsConfigured } from "@/lib/joker-db";
import {
  signJokerPayload,
  signatureIsConfigured
} from "@/lib/joker-signature";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!dbIsConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Persistent DB not configured"
        },
        { status: 500 }
      );
    }

    if (!signatureIsConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Signature layer not configured"
        },
        { status: 500 }
      );
    }

    const tail = await dbGetLedgerTail(20);

    const evidencePayload = {
      kind: "HBCE_JOKER_EVIDENCE_PACK",
      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",
      system: "JOKER-C2",
      exported_at: new Date().toISOString(),
      ledger_tail: tail.map((event) => ({
        seq: event.seq,
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        actor: event.actor,
        node: event.node,
        payload: event.payload,
        prev_hash: event.prev_hash,
        hash: event.hash
      }))
    };

    const signature = signJokerPayload(evidencePayload);

    const artifact = {
      evidence: evidencePayload,
      signature
    };

    const filename = `joker-evidence-${Date.now()}.json`;

    const blob = await put(
      filename,
      JSON.stringify(artifact, null, 2),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false
      }
    );

    return NextResponse.json({
      ok: true,
      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",
      evidence_url: blob.url,
      filename,
      signature: {
        algorithm: signature.algorithm,
        payload_hash: signature.payload_hash,
        signed_at: signature.signed_at
      },
      ledger: {
        exported_events: tail.length
      },
      ts: new Date().toISOString()
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Evidence export failed";

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    );
  }
}
