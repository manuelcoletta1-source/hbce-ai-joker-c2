export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import {
  getEVTRecord,
  verifyEVTRecord,
  type EVTRecord
} from "@/lib/evt-registry";

type RouteContext = {
  params: Promise<{
    evt: string;
  }>;
};

function buildChainView(record: EVTRecord) {
  return {
    evt: record.evt,
    prev: record.prev,
    continuity: {
      checkpoint_type: record.continuity.checkpoint_type,
      elapsed_months: record.continuity.elapsed_months,
      origin_lock: record.continuity.origin_lock,
      origin_ipr: record.continuity.origin_ipr,
      rule: record.continuity.rule,
      note: record.continuity.note || null
    },
    upstream: {
      root_evt: record.upstream.root_evt,
      root_prev: record.upstream.root_prev,
      root_t: record.upstream.root_t,
      proto: record.upstream.proto,
      inrim: record.upstream.inrim,
      t0: record.upstream.t0
    }
  };
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { evt } = await context.params;

    if (!evt || !evt.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing evt identifier"
        },
        { status: 400 }
      );
    }

    const record = getEVTRecord(evt.trim());

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          found: false,
          evt: evt.trim()
        },
        { status: 404 }
      );
    }

    const verification = verifyEVTRecord(record);

    return NextResponse.json({
      ok: true,
      found: true,
      registry: "EVT",
      evt: record.evt,
      verification: {
        valid: verification.valid,
        computed_hash: verification.computed_hash,
        stored_hash: verification.stored_hash
      },
      chain: buildChainView(record),
      event: record
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "EVT lookup failed"
      },
      { status: 500 }
    );
  }
}
