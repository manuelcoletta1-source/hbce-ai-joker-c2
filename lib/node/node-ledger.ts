import crypto from "crypto";

export type LedgerEvent = {
  id: string;
  seq: number;
  kind: string;
  actor: string;
  node: string;
  timestamp: string;
  payload: Record<string, unknown>;
  hash: string;
};

const inMemoryLedger: LedgerEvent[] = [];

function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
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
  const timestamp = new Date().toISOString();

  const seq = inMemoryLedger.length + 1;

  const base = {
    seq,
    kind: input.kind,
    actor: input.actor,
    node: input.node,
    timestamp,
    payload: input.payload
  };

  const hash = generateHash(JSON.stringify(base));

  const event: LedgerEvent = {
    id: generateId(),
    ...base,
    hash
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

  for (let i = 0; i < inMemoryLedger.length; i++) {
    const event = inMemoryLedger[i];

    const recalculatedHash = generateHash(
      JSON.stringify({
        seq: event.seq,
        kind: event.kind,
        actor: event.actor,
        node: event.node,
        timestamp: event.timestamp,
        payload: event.payload
      })
    );

    if (recalculatedHash !== event.hash) {
      errors.push(`Hash mismatch at event ${event.id}`);
    }
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
