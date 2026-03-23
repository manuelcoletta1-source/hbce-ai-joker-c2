/**
 * =========================
 * HBCE DECISION LEDGER
 * =========================
 * append-only log (file-based fallback)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * ledger file locale (fallback)
 */
const LEDGER_PATH = path.join(process.cwd(), "ledger", "decision-log.json");

/**
 * ensure file exists
 */
function ensureLedger() {
  const dir = path.dirname(LEDGER_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify([]));
  }
}

/**
 * read ledger
 */
function readLedger() {
  ensureLedger();
  const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * write ledger
 */
function writeLedger(data) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2));
}

/**
 * hash event
 */
function hashEvent(event) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex");
}

/**
 * append event
 */
export function appendDecisionEvent(input) {
  const ledger = readLedger();

  const prev = ledger.length > 0 ? ledger[ledger.length - 1].hash : null;

  const event = {
    id: `EVT-${ledger.length + 1}`,
    ts: new Date().toISOString(),

    cause: input.cause,
    effect: input.effect,

    probability: input.probability,
    decision: input.decision,
    activation: input.activation,

    node: input.node || "HBCE-MATRIX-NODE-0001-TORINO",

    prev_hash: prev
  };

  const hash = hashEvent(event);

  const record = {
    ...event,
    hash
  };

  ledger.push(record);
  writeLedger(ledger);

  return record;
}
