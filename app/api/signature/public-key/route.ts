import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ⚠️ questa deve essere la tua vera public key ED25519
const PUBLIC_KEY = process.env.JOKER_PUBLIC_KEY || "";

export async function GET() {
  if (!PUBLIC_KEY) {
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
    algorithm: "ED25519",
    public_key: PUBLIC_KEY,
    issuer: "JOKER-C2",
    node: "HBCE-MATRIX-NODE-0001-TORINO",
    issued_by: "HERMETICUM B.C.E. S.r.l.",
    timestamp: new Date().toISOString()
  });
}
