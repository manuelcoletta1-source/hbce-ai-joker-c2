import { nodeGetLedgerSummary, nodeGetLedgerTail } from "@/lib/node/node-ledger";
import { nodeGetTrustSummary } from "@/lib/node/node-trust";
import { nodeGetContinuitySummary } from "@/lib/node/node-continuity";

import type { HBCENodeHealth } from "@/lib/node/node-types";

const DEFAULT_NODE = "HBCE-MATRIX-NODE-0001-TORINO";
const DEFAULT_IDENTITY = "IPR-AI-0001";
const DEFAULT_SYSTEM = "JOKER-C2";

function nowIso(): string {
  return new Date().toISOString();
}

export async function nodeGetHealth(): Promise<HBCENodeHealth> {
  const [ledger, trust, continuity] = await Promise.all([
    nodeGetLedgerSummary(),
    Promise.resolve(nodeGetTrustSummary()),
    Promise.resolve(nodeGetContinuitySummary())
  ]);

  const status =
    ledger.integrity && trust.enabled
      ? "ACTIVE"
      : ledger.integrity || trust.enabled
      ? "DEGRADED"
      : "UNKNOWN";

  return {
    node: DEFAULT_NODE,
    identity: DEFAULT_IDENTITY,
    system: DEFAULT_SYSTEM,
    status,
    continuity_status: continuity.continuity_status,
    signature_enabled: trust.enabled,
    db_configured: ledger.last_seq !== null || ledger.checked_events > 0 || ledger.integrity,
    storage: {
      type: "redis"
    },
    ledger: {
      integrity: ledger.integrity,
      checked_events: ledger.checked_events,
      broken_at: ledger.broken_at,
      last_seq: ledger.last_seq,
      last_hash: ledger.last_hash
    },
    ts: nowIso()
  };
}

export async function nodeGetPublicVerifySnapshot(limit = 10): Promise<{
  node: string;
  identity: string;
  system: string;
  verify: {
    ledger_integrity: boolean;
    checked_events: number;
    broken_at: number | null;
  };
  continuity: {
    continuity_status: string;
    active_sessions: number;
    latest: ReturnType<typeof nodeGetContinuitySummary>["latest"];
  };
  signature: {
    enabled: boolean;
    algorithm: "ED25519";
    issuer: string;
    node: string;
    issued_by: string;
    public_key_available: boolean;
  };
  storage: {
    type: "redis";
  };
  ledger_tail: Array<{
    seq: number;
    id: string;
    kind: string;
    ts: string;
    hash: string;
    prev_hash: string;
  }>;
  ts: string;
}> {
  const [health, tail, trust, continuity] = await Promise.all([
    nodeGetHealth(),
    nodeGetLedgerTail(limit),
    Promise.resolve(nodeGetTrustSummary()),
    Promise.resolve(nodeGetContinuitySummary())
  ]);

  return {
    node: health.node,
    identity: health.identity,
    system: health.system,
    verify: {
      ledger_integrity: health.ledger.integrity,
      checked_events: health.ledger.checked_events,
      broken_at: health.ledger.broken_at
    },
    continuity: {
      continuity_status: continuity.continuity_status,
      active_sessions: continuity.active_sessions,
      latest: continuity.latest
    },
    signature: {
      enabled: trust.enabled,
      algorithm: trust.algorithm,
      issuer: trust.issuer,
      node: trust.node,
      issued_by: trust.issued_by,
      public_key_available: trust.public_key_available
    },
    storage: {
      type: "redis"
    },
    ledger_tail: tail.map((event) => ({
      seq: event.seq,
      id: event.id,
      kind: event.kind,
      ts: event.ts,
      hash: event.hash,
      prev_hash: event.prev_hash
    })),
    ts: nowIso()
  };
}
