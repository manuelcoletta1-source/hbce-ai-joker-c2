export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

import { dbIsConfigured } from "@/lib/joker-db";

const redis = dbIsConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

type RouteContext = {
  params: Promise<{
    hash: string;
  }>;
};

/**
 * =========================
 * HASH VERIFICATION
 * =========================
 */
function computeHash(event: any) {
  const clone = { ...event };
  delete clone.hash;

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(clone))
    .digest("hex");
}

export async function GET(
  _request: Request,
  context: RouteContext
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

    const { hash: targetHash } = await context.params;

    const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
    const maxSeq = Number(maxSeqRaw || 0);

    if (!maxSeq) {
      return NextResponse.json({
        ok: false,
        error: "Empty ledger"
      });
    }

    let found: any = null;
    let prev: any = null;

    for (let seq = 1; seq <= maxSeq; seq += 1) {
      const event = await redis.get<any>(`joker:ledger:event:${seq}`);

      if (!event) continue;

      if (event.hash === targetHash) {
        found = event;

        if (seq > 1) {
          prev = await redis.get<any>(
            `joker:ledger:event:${seq - 1}`
          );
        }

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

    /**
     * =========================
     * 🔥 INTEGRITY CHECK
     * =========================
     */
    const recalculatedHash = computeHash(found);
    const hashValid = recalculatedHash === found.hash;

    /**
     * =========================
     * 🔗 CHAIN CHECK
     * =========================
     */
    let chainValid = true;

    if (prev) {
      chainValid = found.prev_hash === prev.hash;
    }

    return NextResponse.json({
      ok: true,
      found: true,

      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",

      verification: {
        hash_valid: hashValid,
        chain_valid: chainValid,
        integrity: hashValid && chainValid
      },

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

  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Verification failed"
      },
      { status: 500 }
    );
  }
}
