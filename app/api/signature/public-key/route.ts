export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";

/**
 * =========================
 * PUBLIC KEY ENDPOINT
 * =========================
 */

export async function GET() {
  try {
    const publicKey = process.env.JOKER_SIGN_PUBLIC_KEY || null;
    const keyId = process.env.JOKER_SIGN_KEY_ID || "JOKER-SIGN-KEY-001";

    if (!publicKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Public key not configured"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,

      node: "HBCE-MATRIX-NODE-0001-TORINO",
      identity: "IPR-AI-0001",

      signature: {
        algorithm: "ed25519",
        key_id: keyId,
        public_key: publicKey
      }
    });

  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Public key retrieval failed"
      },
      { status: 500 }
    );
  }
}
