export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextRequest, NextResponse } from "next/server";
import {
  appendEVTRecord,
  computeEVTHash,
  readEVTLedger,
  verifyEVTChain,
  type EVTRecord
} from "@/lib/evt-registry";

type EVTCreateInput = Omit<EVTRecord, "anchors"> & {
  anchors?: Partial<EVTRecord["anchors"]>;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateEVTInput(body: unknown): EVTCreateInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid EVT payload");
  }

  const input = body as Record<string, unknown>;

  if (typeof input.evt !== "string" || !input.evt.trim()) {
    throw new Error("Missing evt");
  }

  if (
    input.prev !== null &&
    typeof input.prev !== "string" &&
    typeof input.prev !== "undefined"
  ) {
    throw new Error("Invalid prev");
  }

  if (typeof input.t !== "string" || !input.t.trim()) {
    throw new Error("Missing t");
  }

  if (typeof input.entity !== "string" || !input.entity.trim()) {
    throw new Error("Missing entity");
  }

  if (typeof input.ipr !== "string" || !input.ipr.trim()) {
    throw new Error("Missing ipr");
  }

  if (typeof input.state !== "string" || !input.state.trim()) {
    throw new Error("Missing state");
  }

  if (typeof input.baseline !== "boolean") {
    throw new Error("Missing baseline");
  }

  if (typeof input.kind !== "string" || !input.kind.trim()) {
    throw new Error("Missing kind");
  }

  if (typeof input.cycle !== "string" || !input.cycle.trim()) {
    throw new Error("Missing cycle");
  }

  if (!isStringArray(input.loc)) {
    throw new Error("Invalid loc");
  }

  if (typeof input.org !== "string" || !input.org.trim()) {
    throw new Error("Missing org");
  }

  if (typeof input.core !== "string" || !input.core.trim()) {
    throw new Error("Missing core");
  }

  if (!input.upstream || typeof input.upstream !== "object") {
    throw new Error("Missing upstream");
  }

  if (!input.continuity || typeof input.continuity !== "object") {
    throw new Error("Missing continuity");
  }

  const upstream = input.upstream as Record<string, unknown>;
  const continuity = input.continuity as Record<string, unknown>;
  const anchors =
    input.anchors && typeof input.anchors === "object"
      ? (input.anchors as Record<string, unknown>)
      : {};

  return {
    evt: input.evt.trim(),
    prev:
      typeof input.prev === "string" && input.prev.trim()
        ? input.prev.trim()
        : null,
    t: input.t.trim(),
    entity: input.entity.trim(),
    ipr: input.ipr.trim(),
    state: input.state.trim(),
    baseline: input.baseline,
    kind: input.kind.trim(),
    cycle: input.cycle.trim(),
    loc: input.loc,
    org: input.org.trim(),
    core: input.core.trim(),
    anchors: {
      monthly_hash:
        typeof anchors.monthly_hash === "string"
          ? anchors.monthly_hash.trim()
          : "",
      ipfs_cid:
        typeof anchors.ipfs_cid === "string" ? anchors.ipfs_cid.trim() : undefined,
      btc_txid:
        typeof anchors.btc_txid === "string" ? anchors.btc_txid.trim() : undefined,
      evm_tx_hash:
        typeof anchors.evm_tx_hash === "string"
          ? anchors.evm_tx_hash.trim()
          : undefined
    },
    upstream: {
      root_evt:
        typeof upstream.root_evt === "string" ? upstream.root_evt.trim() : "",
      root_prev:
        typeof upstream.root_prev === "string" ? upstream.root_prev.trim() : "",
      root_t: typeof upstream.root_t === "string" ? upstream.root_t.trim() : "",
      proto: typeof upstream.proto === "string" ? upstream.proto.trim() : "",
      inrim: typeof upstream.inrim === "string" ? upstream.inrim.trim() : "",
      t0: typeof upstream.t0 === "string" ? upstream.t0.trim() : ""
    },
    continuity: {
      checkpoint_type:
        typeof continuity.checkpoint_type === "string"
          ? continuity.checkpoint_type.trim()
          : "",
      elapsed_months:
        typeof continuity.elapsed_months === "number"
          ? continuity.elapsed_months
          : 0,
      origin_lock:
        typeof continuity.origin_lock === "string"
          ? continuity.origin_lock.trim()
          : "",
      origin_ipr:
        typeof continuity.origin_ipr === "string"
          ? continuity.origin_ipr.trim()
          : "",
      rule: typeof continuity.rule === "string" ? continuity.rule.trim() : "",
      note:
        typeof continuity.note === "string"
          ? continuity.note.trim()
          : undefined
    }
  };
}

export async function GET() {
  try {
    const ledger = readEVTLedger();
    const verification = verifyEVTChain();

    return NextResponse.json({
      ok: true,
      registry: "EVT",
      total: ledger.length,
      verification,
      events: ledger
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "EVT read failed"
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const input = validateEVTInput(raw);

    const computedHash = computeEVTHash(input);

    const record: EVTRecord = {
      ...input,
      anchors: {
        monthly_hash:
          input.anchors?.monthly_hash && input.anchors.monthly_hash.length > 0
            ? input.anchors.monthly_hash
            : computedHash,
        ipfs_cid: input.anchors?.ipfs_cid,
        btc_txid: input.anchors?.btc_txid,
        evm_tx_hash: input.anchors?.evm_tx_hash
      }
    };

    const saved = appendEVTRecord(record);

    return NextResponse.json({
      ok: true,
      registry: "EVT",
      event: saved,
      verification: {
        monthly_hash: saved.anchors.monthly_hash,
        computed_hash: computedHash,
        valid: saved.anchors.monthly_hash === computedHash
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "EVT write failed"
      },
      { status: 400 }
    );
  }
}
