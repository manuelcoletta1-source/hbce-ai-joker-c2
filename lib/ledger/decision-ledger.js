import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * =========================
 * HBCE DECISION LEDGER
 * signed append-only event log
 * =========================
 */

const LEDGER_PATH = path.join(process.cwd(), "ledger", "decision-log.json");
const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_KEY_ID = "JOKER-SIGN-KEY-001";

/**
 * -------------------------
 * filesystem helpers
 * -------------------------
 */
function ensureLedger() {
  const dir = path.dirname(LEDGER_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function readLedger() {
  ensureLedger();
  const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeLedger(data) {
  ensureLedger();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * -------------------------
 * canonical serialization
 * -------------------------
 */
function stableStringify(value) {
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
 * -------------------------
 * hashing
 * -------------------------
 */
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Event hash must exclude the final signature fields.
 */
function buildEventHashPayload(event) {
  const clone = { ...event };
  delete clone.hash;
  delete clone.signature;
  delete clone.public_key;
  delete clone.key_id;
  return clone;
}

/**
 * -------------------------
 * signing
 * -------------------------
 */
function loadSigningKeys() {
  const privateKeyPem = process.env.JOKER_SIGN_PRIVATE_KEY || "";
  const publicKeyPem = process.env.JOKER_SIGN_PUBLIC_KEY || "";

  if (!privateKeyPem || !publicKeyPem) {
    return {
      configured: false,
      privateKey: null,
      publicKey: null
    };
  }

  return {
    configured: true,
    privateKey: crypto.createPrivateKey(privateKeyPem),
    publicKey: crypto.createPublicKey(publicKeyPem)
  };
}

function signPayload(payload, privateKey) {
  const canonical = stableStringify(payload);
  const signature = crypto.sign(null, Buffer.from(canonical), privateKey);

  return {
    canonical,
    signature: signature.toString("hex")
  };
}

/**
 * -------------------------
 * public API
 * -------------------------
 */
export function appendDecisionEvent(input) {
  const ledger = readLedger();
  const prev = ledger.length > 0 ? ledger[ledger.length - 1] : null;

  const baseEvent = {
    id: `EVT-${String(ledger.length + 1).padStart(6, "0")}`,
    ts: new Date().toISOString(),

    node: input.node || DEFAULT_NODE,

    cause: input.cause || null,
    effect: input.effect || null,

    probability:
      typeof input.probability === "number" ? input.probability : 0,

    decision: input.decision || "UNKNOWN",
    activation: input.activation || "UNKNOWN",
    risk_level: input.risk_level || "UNKNOWN",

    prev_hash: prev ? prev.hash : null
  };

  const hashPayload = buildEventHashPayload(baseEvent);
  const hashCanonical = stableStringify(hashPayload);
  const eventHash = sha256(hashCanonical);

  const signing = loadSigningKeys();

  let signature = null;
  let publicKeyPem = null;
  let keyId = null;

  if (signing.configured) {
    const signablePayload = {
      ...hashPayload,
      hash: eventHash
    };

    const signed = signPayload(signablePayload, signing.privateKey);

    signature = signed.signature;
    publicKeyPem = process.env.JOKER_SIGN_PUBLIC_KEY || null;
    keyId = process.env.JOKER_SIGN_KEY_ID || DEFAULT_KEY_ID;
  }

  const record = {
    ...baseEvent,
    hash: eventHash,
    signature,
    public_key: publicKeyPem,
    key_id: keyId
  };

  ledger.push(record);
  writeLedger(ledger);

  return record;
}

export function ledgerSigningIsConfigured() {
  const privateKeyPem = process.env.J
