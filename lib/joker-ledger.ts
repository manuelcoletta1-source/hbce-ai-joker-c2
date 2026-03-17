import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type JokerLedgerEvent = {
  id: string;
  ts: string;
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
};

type JokerLedgerStore = {
  events: JokerLedgerEvent[];
};

const LEDGER_DIR = "/tmp/joker-ledger";
const LEDGER_FILE = path.join(LEDGER_DIR, "ledger.json");

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
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

async function ensureStore(): Promise<void> {
  await fs.mkdir(LEDGER_DIR, { recursive: true });

  try {
    await fs.access(LEDGER_FILE);
  } catch {
    const initial: JokerLedgerStore = {
      events: []
    };

    await fs.writeFile(
      LEDGER_FILE,
      JSON.stringify(initial, null, 2),
      "utf-8"
    );
  }
}

async function readStore(): Promise<JokerLedgerStore> {
  await ensureStore();

  const raw = await fs.readFile(LEDGER_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<JokerLedgerStore>;

  return {
    events: Array.isArray(parsed.events) ? parsed.events : []
  };
}

async function writeStore(store: JokerLedgerStore): Promise<void> {
  await ensureStore();

  await fs.writeFile(
    LEDGER_FILE,
    JSON.stringify(store, null, 2),
    "utf-8"
  );
}

function computeEventHash(input: {
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

export async function appendLedgerEvent(input: {
  kind: string;
  actor?: string;
  node?: string;
  payload?: Record<string, unknown>;
}): Promise<JokerLedgerEvent> {
  const store = await readStore();
  const prev = store.events[store.events.length - 1];

  const eventBase = {
    id: makeId(),
    ts: nowIso(),
    kind: input.kind.trim() || "unknown",
    actor: input.actor?.trim() || "JOKER-C2",
    node: input.node?.trim() || "HBCE-MATRIX-NODE-0001-TORINO",
    payload: input.payload || {},
    prev_hash: prev?.hash || "GENESIS"
  };

  const event: JokerLedgerEvent = {
    ...eventBase,
    hash: computeEventHash(eventBase)
  };

  store.events.push(event);
  await writeStore(store);

  return event;
}

export async function listLedgerEvents(): Promise<JokerLedgerEvent[]> {
  const store = await readStore();
  return [...store.events].reverse();
}

export async function getLedgerTail(limit = 10): Promise<JokerLedgerEvent[]> {
  const store = await readStore();
  return store.events.slice(-limit).reverse();
}

export async function verifyLedger(): Promise<{
  ok: boolean;
  checked: number;
  broken_index: number | null;
}> {
  const store = await readStore();

  for (let index = 0; index < store.events.length; index += 1) {
    const current = store.events[index];
    const prev = store.events[index - 1];

    const expectedPrevHash = prev?.hash || "GENESIS";
    if (current.prev_hash !== expectedPrevHash) {
      return {
        ok: false,
        checked: index + 1,
        broken_index: index
      };
    }

    const expectedHash = computeEventHash({
      id: current.id,
      ts: current.ts,
      kind: current.kind,
      actor: current.actor,
      node: current.node,
      payload: current.payload,
      prev_hash: current.prev_hash
    });

    if (current.hash !== expectedHash) {
      return {
        ok: false,
        checked: index + 1,
        broken_index: index
      };
    }
  }

  return {
    ok: true,
    checked: store.events.length,
    broken_index: null
  };
}
