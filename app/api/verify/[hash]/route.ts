export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextRequest, NextResponse } from "next/server";
import { dbIsConfigured } from "../../../../lib/joker-db";

type RouteContext = {
  params: Promise<{
    hash: string;
  }>;
};

function normalizeHash(value: string): string {
  return value.trim().toLowerCase();
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const hash = normalizeHash(params.hash || "");

    if (!hash) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing hash identifier"
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      hash,
      db_configured: dbIsConfigured(),
      verification: {
        status: "not_implemented",
        reason:
          "Hash verification endpoint is reachable, but verification logic is not yet implemented in this route."
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal error"
      },
      { status: 500 }
    );
  }
}
