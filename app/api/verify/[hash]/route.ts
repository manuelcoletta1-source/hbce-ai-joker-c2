import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

import {
  dbIsConfigured
} from "@/lib/joker-db";

export const runtime = "nodejs";

const redis = dbIsConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

export async function GET(
  req: Request,
  { params }: { params: { hash: string } }
) {
  try {
    if (!redis) {
      return NextResponse.json(
        {
          ok: false,
          error: "DB not configured"
        },
        { status: 500 }
      );
    }

    const targetHash = params.hash;

    const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
    const maxSeq = Number(maxSeqRaw || 0);

    if (!maxSeq) {
      return NextResponse.json({
        ok: false,
        error: "Empty ledger"
      });
    }

    let found = null;

    for (let seq = 1; seq <= maxSeq; seq++) {
      const event = await redis.get<any>(`joker:ledger:event:${seq}`);

      if (event?.hash === targetHash) {
        found = event;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({
        ok: false,
        found: false,
        hash: targetHash
      });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",
      event: {
        seq: found.seq,
        id: found.id,
        kind: found.kind,
        ts: found.ts,
        hash: found.hash,
        prev_hash: found.prev_hash,
        payload: found.payload
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Verification failed"
      },
      { status: 500 }
    );
  }
}
