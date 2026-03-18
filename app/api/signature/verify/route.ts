import { NextResponse } from "next/server";
import {
  verifyJokerSignature,
  type JokerSignatureEnvelope
} from "@/lib/joker-signature";

export const runtime = "nodejs";

type VerifyBody = {
  payload?: Record<string, unknown>;
  signature?: JokerSignatureEnvelope;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;

    if (!isObject(body?.payload)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid payload"
        },
        { status: 400 }
      );
    }

    if (!body?.signature || typeof body.signature !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid signature envelope"
        },
        { status: 400 }
      );
    }

    const signature = body.signature;

    if (
      signature.algorithm !== "ED25519" ||
      typeof signature.public_key !== "string" ||
      typeof signature.signature !== "string" ||
      typeof signature.payload_hash !== "string" ||
      typeof signature.signed_at !== "string"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Malformed signature envelope"
        },
        { status: 400 }
      );
    }

    const valid = verifyJokerSignature(body.payload, signature);

    return NextResponse.json({
      ok: true,
      verified: valid,
      algorithm: signature.algorithm,
      payload_hash: signature.payload_hash,
      signed_at: signature.signed_at
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Signature verification failed"
      },
      { status: 500 }
    );
  }
}
