export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

import { dbIsConfigured } from "../../../lib/joker-db";

const redis = dbIsConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

/**
 * =========================
 * CANONICAL SERIALIZATION
 * =========================
 */
function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const keys = Object.keys(value).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function readLedgerTail(limit = 10) {
  if (!redis) return [];

  const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
  const maxSeq = Number(maxSeqRaw || 0);

  if (!maxSeq) return [];

  const start = Math.max(1, maxSeq - limit + 1);
  const out: any[] = [];

  for (let seq = start; seq <= maxSeq; seq += 1) {
    const event = await redis.get<any>(`joker:ledger:event:${seq}`);
    if (event) out.push(event);
  }

  return out;
}

export async function GET() {
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

    const nodeId =
      process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
    const identity =
      process.env.JOKER_IDENTITY || "IPR-AI-0001";
    const keyId =
      process.env.JOKER_SIGN_KEY_ID || "JOKER-SIGN-KEY-001";
    const publicKey =
      process.env.JOKER_SIGN_PUBLIC_KEY || null;

    const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
    const maxSeq = Number(maxSeqRaw || 0);

    const tail = await readLedgerTail(10);
    const lastEvent = tail.length > 0 ? tail[tail.length - 1] : null;

    const pack = {
      version: "HBCE-EVIDENCE-PACK-1",
      ts: new Date().toISOString(),

      node: {
        node_id: nodeId,
        identity
      },

      signature: {
        algorithm: "ed25519",
        key_id: keyId,
        public_key: publicKey
      },

      ledger: {
        total_events: maxSeq,
        tail_count: tail.length,
        last_event_hash: lastEvent?.hash || null,
        last_event_id: lastEvent?.id || null
      },

      tail
    };

    const canonical = stableStringify(pack);
    const packHash = sha256(canonical);

    return NextResponse.json({
      ok: true,
      pack,
      integrity: {
        algorithm: "sha256",
        hash: packHash
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Evidence export failed"
      },
      { status: 500 }
    );
  }
}
