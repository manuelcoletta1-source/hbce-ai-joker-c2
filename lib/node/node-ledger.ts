import crypto from "crypto";

export type LedgerEvent = {
  id: string;
  seq: number;
  kind: string;
  actor: string;
  node: string;
  ts: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
};

const inMemoryLedger: LedgerEvent[] = [];

function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
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

function computeEventHash(input: {
  seq: number;
  kind: string;
  actor: string;
  node: string;
  ts: string;
  payload: Record<string, unknown>;
  prev_hash: string;
}): string {
  return generateHash(
    stableStringify({
      seq: input.seq,
      kind: input.kind,
      actor: input.actor,
      node: input.node,
      ts: input.ts,
      payload: input.payload,
      prev_hash: input.prev_hash
    })
  );
}

export function nodeLedgerIsConfigured(): boolean {
  return true;
}

export async function nodeAppendEvent(input: {
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
}): Promise<LedgerEvent> {
  const seq = inMemoryLedger.length + 1;
  const ts = new Date().toISOString();
  const prev = inMemoryLedger[inMemoryLedger.length - 1] || null;
  const prev_hash = prev?.hash || "GENESIS";

  const base = {
    seq,
    kind: input.kind,
    actor: input.actor,
    node: input.node,
    ts,
    payload: input.payload,
    prev_hash
  };

  const event: LedgerEvent = {
    id: generateId(),
    ...base,
    hash: computeEventHash(base)
  };

  inMemoryLedger.push(event);

  return event;
}

export async function nodeGetLedger(): Promise<LedgerEvent[]> {
  return [...inMemoryLedger];
}

export async function nodeGetLedgerTail(limit = 10): Promise<LedgerEvent[]> {
  if (limit <= 0) return [];
  return [...inMemoryLedger].slice(-limit).reverse();
}

export async function nodeGetLastEvent(): Promise<LedgerEvent | null> {
  if (inMemoryLedger.length === 0) return null;
  return inMemoryLedger[inMemoryLedger.length - 1];
}

export async function nodeVerifyLedger(): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let expectedPrevHash = "GENESIS";

  for (let i = 0; i < inMemoryLedger.length; i++) {
    const event = inMemoryLedger[i];

    if (event.prev_hash !== expectedPrevHash) {
      errors.push(`prev_hash mismatch at event ${event.id}`);
    }

    const recalculatedHash = computeEventHash({
      seq: event.seq,
      kind: event.kind,
      actor: event.actor,
      node: event.node,
      ts: event.ts,
      payload: event.payload,
      prev_hash: event.prev_hash
    });

    if (recalculatedHash !== event.hash) {
      errors.push(`hash mismatch at event ${event.id}`);
    }

    expectedPrevHash = event.hash;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function nodeGetLedgerSummary(): Promise<{
  integrity: boolean;
  checked_events: number;
  broken_at: number | null;
  last_seq: number | null;
  last_hash: string | null;
}> {
  const verification = await nodeVerifyLedger();
  const lastEvent = await nodeGetLastEvent();

  return {
    integrity: verification.valid,
    checked_events: inMemoryLedger.length,
    broken_at: verification.valid ? null : -1,
    last_seq: lastEvent?.seq ?? null,
    last_hash: lastEvent?.hash ?? null
  };
}
