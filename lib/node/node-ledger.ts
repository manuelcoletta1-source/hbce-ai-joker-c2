import crypto from "crypto";

type LedgerEvent = {
  id: string;
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

export async function nodeAppendEvent(input: {
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
}): Promise<LedgerEvent> {
  const timestamp = new Date().toISOString();

  const base = {
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
