import crypto from "crypto";
import { sql } from "@vercel/postgres";

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

type EVTRegistryRow = {
  evt: string;
  prev: string | null;
  payload_json: unknown;
  monthly_hash: string;
  created_at?: string;
};

function assertDbConfigured() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL not configured");
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

function mapRowToRecord(row: EVTRegistryRow): EVTRecord {
  const payload =
    typeof row.payload_json === "string"
      ? (JSON.parse(row.payload_json) as EVTRecord)
      : (row.payload_json as EVTRecord);

  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid EVT payload for record ${row.evt}`);
  }

  return {
    ...payload,
    evt: String(row.evt),
    prev: row.prev ? String(row.prev) : null,
    anchors: {
      ...payload.anchors,
      monthly_hash: String(row.monthly_hash)
    }
  };
}

function extractNumericSuffix(evt: string): number {
  const match = evt.match(/^EVT-(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number(match[1] || 0);
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

export async function readEVTLedger(): Promise<EVTRecord[]> {
  assertDbConfigured();

  const result = await sql`
    SELECT
      evt,
      prev,
      payload_json,
      monthly_hash,
      created_at
    FROM evt_registry
    ORDER BY
      CAST(SUBSTRING(evt FROM 'EVT-(\d+)') AS INTEGER) ASC,
      created_at ASC,
      evt ASC;
  `;

  return result.rows.map((row) => mapRowToRecord(row as EVTRegistryRow));
}

export async function writeEVTLedger(records: EVTRecord[]): Promise<void> {
  assertDbConfigured();

  const normalized = [...records].sort(
    (a, b) => extractNumericSuffix(a.evt) - extractNumericSuffix(b.evt)
  );

  for (let i = 0; i < normalized.length; i++) {
    const record = normalized[i];
    const expectedHash = computeEVTHash(record);

    if (record.anchors.monthly_hash !== expectedHash) {
      throw new Error(
        `monthly_hash does not match canonical SHA-512 payload for ${record.evt}`
      );
    }

    if (i === 0) {
      if (record.prev !== null) {
        throw new Error(`First EVT must not have prev: ${record.evt}`);
      }
    } else {
      const expectedPrev = normalized[i - 1]?.evt || null;
      if (record.prev !== expectedPrev) {
        throw new Error(
          `Invalid chain while writing ledger: ${record.evt} prev must be ${expectedPrev}`
        );
      }
    }
  }

  const existing = await readEVTLedger();
  const existingMap = new Map(existing.map((item) => [item.evt, item]));
  const incomingMap = new Map(normalized.map((item) => [item.evt, item]));

  for (const record of normalized) {
    const stored = existingMap.get(record.evt);

    if (stored && stored.prev !== record.prev) {
      throw new Error(
        `Existing EVT chain conflict detected for ${record.evt}; abort destructive rewrite`
      );
    }
  }

  for (const record of normalized) {
    await sql`
      INSERT INTO evt_registry (
        evt,
        prev,
        t,
        monthly_hash,
        payload_json
      )
      VALUES (
        ${record.evt},
        ${record.prev},
        ${record.t},
        ${record.anchors.monthly_hash},
        ${JSON.stringify(record)}
      )
      ON CONFLICT (evt)
      DO UPDATE SET
        prev = EXCLUDED.prev,
        t = EXCLUDED.t,
        monthly_hash = EXCLUDED.monthly_hash,
        payload_json = EXCLUDED.payload_json;
    `;
  }

  const toDelete = existing
    .filter((item) => !incomingMap.has(item.evt))
    .map((item) => item.evt);

  for (const evt of toDelete) {
    await sql`
      DELETE FROM evt_registry
      WHERE evt = ${evt};
    `;
  }
}

export async function appendEVTRecord(record: EVTRecord): Promise<EVTRecord> {
  assertDbConfigured();

  const expectedHash = computeEVTHash(record);

  if (record.anchors.monthly_hash !== expectedHash) {
    throw new Error("monthly_hash does not match canonical SHA-512 payload");
  }

  const currentLedger = await readEVTLedger();
  const lastRecord =
    currentLedger.length > 0 ? currentLedger[currentLedger.length - 1] : null;

  if (lastRecord && record.prev !== lastRecord.evt) {
    throw new Error(
      `Invalid EVT chain append: expected prev=${lastRecord.evt}, received prev=${record.prev}`
    );
  }

  if (!lastRecord && record.prev !== null) {
    throw new Error(`First EVT must not define prev: ${record.evt}`);
  }

  try {
    await sql`
      INSERT INTO evt_registry (
        evt,
        prev,
        t,
        monthly_hash,
        payload_json
      )
      VALUES (
        ${record.evt},
        ${record.prev},
        ${record.t},
        ${record.anchors.monthly_hash},
        ${JSON.stringify(record)}
      );
    `;
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      throw new Error(`EVT already exists: ${record.evt}`);
    }

    throw error;
  }

  return record;
}

export async function getEVTRecord(evt: string): Promise<EVTRecord | null> {
  assertDbConfigured();

  const result = await sql`
    SELECT
      evt,
      prev,
      payload_json,
      monthly_hash,
      created_at
    FROM evt_registry
    WHERE evt = ${evt}
    LIMIT 1;
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToRecord(result.rows[0] as EVTRegistryRow);
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

export async function verifyEVTChain(): Promise<{
  total: number;
  valid: boolean;
  results: Array<{
    evt: string;
    hash_valid: boolean;
    prev_valid: boolean;
  }>;
}> {
  const ledger = await readEVTLedger();

  const results = ledger.map((record, index) => {
    const self = verifyEVTRecord(record);

    const prevValid =
      index === 0 ? record.prev === null : record.prev === ledger[index - 1]?.evt;

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
