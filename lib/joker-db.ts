import { Redis } from "@upstash/redis";
import crypto from "crypto";

export type JokerPersistentMemoryRecord = {
  id: string;
  key: string;
  normalized_key: string;
  value: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type JokerPersistentLedgerEvent = {
  seq: number;
  id: string;
  ts: string;
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
};

let redisClient: Redis | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeKey(input: string): string {
  return input.trim().toLowerCase();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function computeLedgerHash(input: {
  seq: number;
  id: string;
  ts: string;
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
  prev_hash: string;
}): string {
  return sha256(
    stableStringify({
      seq: input.seq,
      id: input.id,
      ts: input.ts,
      kind: input.kind,
      actor: input.actor,
      node: input.node,
      payload: input.payload,
      prev_hash: input.prev_hash
    })
  );
}

export function dbIsConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getRedis(): Redis {
  if (!dbIsConfigured()) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
    );
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });
  }

  return redisClient;
}

function memoryRecordKey(normalizedKey: string): string {
  return `joker:memory:record:${normalizedKey}`;
}

function ledgerEventKey(seq: number): string {
  return `joker:ledger:event:${seq}`;
}

export async function dbSaveMemoryRecord(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<JokerPersistentMemoryRecord> {
  const redis = getRedis();

  const key = input.key.trim();
  const value = input.value.trim();
  const category = (input.category || "general").trim() || "general";
  const normalized = normalizeKey(key);

  if (!key) {
    throw new Error("Memory key is required");
  }

  if (!value) {
    throw new Error("Memory value is required");
  }

  const existing = await redis.get<JokerPersistentMemoryRecord>(
    memoryRecordKey(normalized)
  );

  if (existing) {
    const updated: JokerPersistentMemoryRecord = {
      ...existing,
      key,
      value,
      category,
      updatedAt: nowIso()
    };

    await redis.set(memoryRecordKey(normalized), updated);
    return updated;
  }

  const created: JokerPersistentMemoryRecord = {
    id: makeId(),
    key,
    normalized_key: normalized,
    value,
    category,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  await redis.set(memoryRecordKey(normalized), created);
  return created;
}

export async function dbGetMemoryByKey(
  key: string
): Promise<JokerPersistentMemoryRecord | null> {
  const redis = getRedis();
  const normalized = normalizeKey(key);

  if (!normalized) return null;

  const found = await redis.get<JokerPersistentMemoryRecord>(
    memoryRecordKey(normalized)
  );

  return found ?? null;
}

export async function dbDeleteMemoryByKey(key: string): Promise<boolean> {
  const redis = getRedis();
  const normalized = normalizeKey(key);

  if (!normalized) return false;

  const result = await redis.del(memoryRecordKey(normalized));
  return Number(result) > 0;
}

export async function dbListMemoryRecords(): Promise<
  JokerPersistentMemoryRecord[]
> {
  const redis = getRedis();
  const keys = await redis.keys("joker:memory:record:*");

  if (!Array.isArray(keys) || keys.length === 0) {
    return [];
  }

  const records = await Promise.all(
    keys.map((key) => redis.get<JokerPersistentMemoryRecord>(String(key)))
  );

  return records
    .filter(
      (record): record is JokerPersistentMemoryRecord =>
        Boolean(record && typeof record.key === "string")
    )
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function dbSearchMemory(
  query: string
): Promise<JokerPersistentMemoryRecord[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const all = await dbListMemoryRecords();

  return all.filter((record) => {
    const haystack = [
      record.key,
      record.value,
      record.category,
      record.normalized_key
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export async function dbAppendLedgerEvent(input: {
  kind: string;
  actor?: string;
  node?: string;
  payload?: Record<string, unknown>;
}): Promise<JokerPersistentLedgerEvent> {
  const redis = getRedis();

  const seq = Number(await redis.incr("joker:ledger:seq"));
  const prevSeq = seq - 1;

  let prevHash = "GENESIS";

  if (prevSeq > 0) {
    const prev = await redis.get<JokerPersistentLedgerEvent>(
      ledgerEventKey(prevSeq)
    );
    prevHash = prev?.hash || "GENESIS";
  }

  const base = {
    seq,
    id: makeId(),
    ts: nowIso(),
    kind: input.kind.trim() || "unknown",
    actor: input.actor?.trim() || "JOKER-C2",
    node: input.node?.trim() || "HBCE-MATRIX-NODE-0001-TORINO",
    payload: input.payload || {},
    prev_hash: prevHash
  };

  const event: JokerPersistentLedgerEvent = {
    ...base,
    hash: computeLedgerHash(base)
  };

  await redis.set(ledgerEventKey(seq), event);

  return event;
}

export async function dbGetLedgerTail(
  limit = 10
): Promise<JokerPersistentLedgerEvent[]> {
  const redis = getRedis();
  const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
  const maxSeq = Number(maxSeqRaw || 0);

  if (!maxSeq) return [];

  const seqs: number[] = [];
  for (let seq = maxSeq; seq >= 1 && seqs.length < limit; seq -= 1) {
    seqs.push(seq);
  }

  const events = await Promise.all(
    seqs.map((seq) => redis.get<JokerPersistentLedgerEvent>(ledgerEventKey(seq)))
  );

  return events.filter(
    (event): event is JokerPersistentLedgerEvent =>
      Boolean(event && typeof event.hash === "string")
  );
}

export async function dbVerifyLedger(): Promise<{
  ok: boolean;
  checked: number;
  broken_seq: number | null;
}> {
  const redis = getRedis();
  const maxSeqRaw = await redis.get<number>("joker:ledger:seq");
  const maxSeq = Number(maxSeqRaw || 0);

  if (!maxSeq) {
    return {
      ok: true,
      checked: 0,
      broken_seq: null
    };
  }

  let prevHash = "GENESIS";

  for (let seq = 1; seq <= maxSeq; seq += 1) {
    const event = await redis.get<JokerPersistentLedgerEvent>(ledgerEventKey(seq));

    if (!event) {
      return {
        ok: false,
        checked: seq,
        broken_seq: seq
      };
    }

    if (event.prev_hash !== prevHash) {
      return {
        ok: false,
        checked: seq,
        broken_seq: seq
      };
    }

    const expectedHash = computeLedgerHash({
      seq: event.seq,
      id: event.id,
      ts: event.ts,
      kind: event.kind,
      actor: event.actor,
      node: event.node,
      payload: event.payload,
      prev_hash: event.prev_hash
    });

    if (event.hash !== expectedHash) {
      return {
        ok: false,
        checked: seq,
        broken_seq: seq
      };
    }

    prevHash = event.hash;
  }

  return {
    ok: true,
    checked: maxSeq,
    broken_seq: null
  };
}
