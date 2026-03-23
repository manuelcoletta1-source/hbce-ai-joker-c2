export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * =========================
 * LEDGER PATH
 * =========================
 */
const LEDGER_PATH = path.join(
  process.cwd(),
  "ledger",
  "decision-log.json"
);

/**
 * =========================
 * HELPERS
 * =========================
 */

function readLedger() {
  if (!fs.existsSync(LEDGER_PATH)) return [];
  const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
  return JSON.parse(raw);
}

function hashEvent(event: any) {
  const clone = { ...event };
  delete clone.hash;

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(clone))
    .digest("hex");
}

/**
 * =========================
 * VERIFY CHAIN
 * =========================
 */
function verifyLedgerChain(ledger: any[]) {
  let valid = true;

  for (let i = 0; i < ledger.length; i++) {
    const current = ledger[i];

    const recalculated = hashEvent(current);

    if (current.hash !== recalculated) {
      return {
        valid: false,
        error: `Hash mismatch at index ${i}`
      };
    }

    if (i > 0) {
      const prev = ledger[i - 1];

      if (current.prev_hash !== prev.hash) {
        return {
          valid: false,
          error: `Chain broken at index ${i}`
        };
      }
    }
  }

  return {
    valid,
    total_events: ledger.length
  };
}

/**
 * =========================
 * ROUTE
 * =========================
 */

export async function GET() {
  try {
    const ledger = readLedger();

    const chainCheck = verifyLedgerChain(ledger);

    return NextResponse.json({
      ok: true,
      node: "HBCE-MATRIX-NODE-0001-TORINO",

      ledger: {
        total_events: ledger.length,
        integrity: chainCheck.valid,
        last_event:
          ledger.length > 0 ? ledger[ledger.length - 1] : null
      },

      chain: chainCheck
    });

  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Verification failed"
      },
      { status: 500 }
    );
  }
}
