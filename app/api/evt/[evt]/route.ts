import { NextRequest, NextResponse } from "next/server";
import {
  getEVTRecord,
  verifyEVTRecord
} from "../../../../lib/evt-registry";

type RouteContext = {
  params: Promise<{
    evt: string;
  }>;
};

function normalizeEvt(evt: string): string {
  return evt.trim().toUpperCase();
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const evt = normalizeEvt(params.evt || "");

    if (!evt) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing EVT identifier"
        },
        { status: 400 }
      );
    }

    const record = await getEVTRecord(evt);

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: `EVT not found: ${evt}`
        },
        { status: 404 }
      );
    }

    const verification = verifyEVTRecord(record);

    return NextResponse.json({
      ok: true,
      record,
      verification
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
