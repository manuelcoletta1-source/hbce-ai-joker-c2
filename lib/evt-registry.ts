import fs from "fs";
import path from "path";
import crypto from "crypto";

export type EVTRecord = {
  evt: string;
  prev: string | null;
  t: string;
  entity: string;
  ipr: string;
  state: string;
  baseline: boolean;
  kind: string;
  cycle: string;
  loc: string[];
  org: string;
  core: string;
  anchors: {
    monthly_hash: string;
    ipfs_cid?: string;
    btc_txid?: string;
    evm_tx_hash?: string;
  };
  upstream: {
    root_evt: string;
    root_prev: string;
    root_t: string;
    proto: string;
    inrim: string;
    t0: string;
  };
  continuity: {
    checkpoint_type: string;
    elapsed_months: number;
    origin_lock: string;
    origin_ipr: string;
    rule: string;
    note?: string;
  };
};

const EVT_DIR = path.join(process.cwd(), "registry", "evt");
const EVT_FILE = path.join(EVT_DIR, "evt-ledger.json");

function ensureRegistry() {
  if (!fs.existsSync(EVT_DIR)) {
    fs.mkdirSync(EVT_DIR, { recursive: true });
  }

  if (!fs.existsSync(EVT_FILE)) {
    fs.writeFileSync(EVT_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function computeEVTHash(
  payload: Omit<EVTRecord, "anchors"> & {
    anchors?: Partial<EVTRecord["anchors"]>;
  }
): string {
  const normalized = {
    ...payload,
    anchors: {
      ...(payload.anchors || {})
    }
  };

  if ("monthly_hash" in normalized.anchors) {
    delete normalized.anchors.monthly_hash;
  }

  return crypto
    .createHash("sha512")
    .update(stableStringify(normalized), "utf-8")
    .digest("hex");
}

export function readEVTLedger(): EVTRecord[] {
  ensureRegistry();
  const raw = fs.readFileSync(EVT_FILE, "utf-8");
  return JSON.parse(raw) as EVTRecord[];
}

export function writeEVTLedger(records: EVTRecord[]) {
  ensureRegistry();
  fs.writeFileSync(EVT_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export function appendEVTRecord(record: EVTRecord): EVTRecord {
  const ledger = readEVTLedger();

  if (ledger.some((item) => item.evt === record.evt)) {
    throw new Error(`EVT already exists: ${record.evt}`);
  }

  const expectedHash = computeEVTHash(record);

  if (record.anchors.monthly_hash !== expectedHash) {
    throw new Error("monthly_hash does not match canonical SHA-512 payload");
  }

  if (record.prev) {
    const prevExists = ledger.some((item) => item.evt === record.prev);
    if (!prevExists) {
      throw new Error(`Previous EVT not found: ${record.prev}`);
    }
  }

  ledger.push(record);
  writeEVTLedger(ledger);

  return record;
}

export function getEVTRecord(evt: string): EVTRecord | null {
  const ledger = readEVTLedger();
  return ledger.find((item) => item.evt === evt) || null;
}

export function verifyEVTRecord(record: EVTRecord) {
  const computed = computeEVTHash(record);

  return {
    evt: record.evt,
    valid: computed === record.anchors.monthly_hash,
    computed_hash: computed,
    stored_hash: record.anchors.monthly_hash
  };
}

export function verifyEVTChain() {
  const ledger = readEVTLedger();

  const results = ledger.map((record, index) => {
    const self = verifyEVTRecord(record);

    const prevValid =
      index === 0 ? true : record.prev === ledger[index - 1]?.evt;

    return {
      evt: record.evt,
      hash_valid: self.valid,
      prev_valid: prevValid
    };
  });

  return {
    total: ledger.length,
    valid: results.every((item) => item.hash_valid && item.prev_valid),
    results
  };
}
