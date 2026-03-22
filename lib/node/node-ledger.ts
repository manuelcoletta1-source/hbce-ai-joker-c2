import {
  dbAppendLedgerEvent,
  dbGetLedgerTail,
  dbIsConfigured,
  dbVerifyLedger,
  type JokerPersistentLedgerEvent
} from "@/lib/joker-db";

import type {
  HBCELedgerEvent,
  HBCELedgerVerification,
  HBCENodeRuntimeEventInput,
  HBCENodeRuntimeEventResult
} from "@/lib/node/node-types";

function mapLedgerEvent(
  event: JokerPersistentLedgerEvent
): HBCELedgerEvent {
  return {
    seq: event.seq,
    id: event.id,
    ts: event.ts,
    kind: event.kind,
    actor: event.actor,
    node: event.node,
    payload: event.payload,
    prev_hash: event.prev_hash,
    hash: event.hash
  };
}

export function nodeLedgerIsConfigured(): boolean {
  return dbIsConfigured();
}

export async function nodeAppendEvent(
  input: HBCENodeRuntimeEventInput
): Promise<HBCENodeRuntimeEventResult> {
  if (!dbIsConfigured()) {
    return {
      ok: false,
      event: null
    };
  }

  const event = await dbAppendLedgerEvent({
    kind: input.kind,
    actor: input.actor,
    node: input.node,
    payload: input.payload
  });

  return {
    ok: true,
    event: mapLedgerEvent(event)
  };
}

export async function nodeGetLedgerTail(
  limit = 10
): Promise<HBCELedgerEvent[]> {
  if (!dbIsConfigured()) {
    return [];
  }

  const tail = await dbGetLedgerTail(limit);
  return tail.map(mapLedgerEvent);
}

export async function nodeVerifyLedger(): Promise<HBCELedgerVerification> {
  if (!dbIsConfigured()) {
    return {
      ok: false,
      checked: 0,
      broken_seq: null
    };
  }

  const result = await dbVerifyLedger();

  return {
    ok: result.ok,
    checked: result.checked,
    broken_seq: result.broken_seq
  };
}

export async function nodeGetLastLedgerEvent(): Promise<HBCELedgerEvent | null> {
  const tail = await nodeGetLedgerTail(1);
  return tail[0] ?? null;
}

export async function nodeGetLedgerSummary(): Promise<{
  integrity: boolean;
  checked_events: number;
  broken_at: number | null;
  last_seq: number | null;
  last_hash: string | null;
}> {
  if (!dbIsConfigured()) {
    return {
      integrity: false,
      checked_events: 0,
      broken_at: null,
      last_seq: null,
      last_hash: null
    };
  }

  const [verification, last] = await Promise.all([
    nodeVerifyLedger(),
    nodeGetLastLedgerEvent()
  ]);

  return {
    integrity: verification.ok,
    checked_events: verification.checked,
    broken_at: verification.broken_seq,
    last_seq: last?.seq ?? null,
    last_hash: last?.hash ?? null
  };
}
