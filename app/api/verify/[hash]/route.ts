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

/**
 * =========================
 * HASH VERIFICATION
 * =========================
 */
function buildHashPayload(event: any) {
  const clone = { ...event };
  delete clone.hash;
  delete clone.signature;
  delete clone.public_key;
  delete clone.key_id;
  return clone;
}

function computeHash(event: any) {
  const payload = buildHashPayload(event);

  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

/**
 * =========================
 * SIGNATURE VERIFICATION
 * =========================
 */
function verifyEventSignature(event: any) {
  if (!event?.signature || !event?.public_key) {
    return {
      configured: false,
      valid: false
    };
  }

  try {
    const signablePayload = {
      ...buildHashPayload(event),
      hash: event.hash
    };

    const canonical = stableStringify(signablePayload);

    const publicKey = crypto.createPublicKey(event.public_key);

    const valid = crypto.verify(
      null,
      Buffer.from(canonical),
      publicKey,
      Buffer.from(event.signature, "hex")
    );

    return {
      configured: true,
      valid
    };
  } catch {
    return {
      configured: true,
      valid: false
    };
  }
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
          prev = await redis.get<any>(`joker:ledger:event:${seq - 1}`);
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
     * HASH INTEGRITY
     * =========================
     */
    const recalculatedHash = computeHash(found);
    const hashValid = recalculatedHash === found.hash;

    /**
     * =========================
     * CHAIN INTEGRITY
     * =========================
     */
    let chainValid = true;

    if (prev) {
      chainValid = found.prev_hash === prev.hash;
    }

    /**
     * =========================
     * SIGNATURE INTEGRITY
     * =========================
     */
    const signatureCheck = verifyEventSignature(found);

    return NextResponse.json({
      ok: true,
      found: true,

      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",

      verification: {
        hash_valid: hashValid,
        chain_valid: chainValid,
        signature_configured: signatureCheck.configured,
        signature_valid: signatureCheck.valid,
        integrity:
          hashValid &&
          chainValid &&
          (!signatureCheck.configured || signatureCheck.valid)
      },

      event: {
        seq: found.seq,
        id: found.id,
        kind: found.kind,
        ts: found.ts,
        hash: found.hash,
        prev_hash: found.prev_hash,
        key_id: found.key_id || null,
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
