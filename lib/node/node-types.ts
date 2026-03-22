export type HBCEJokerSystem = "JOKER-C2";
export type HBCEAlgorithm = "SHA-256" | "ED25519";

export type HBCENodeRole = "CORE" | "EDGE" | "RELAY";
export type HBCENodeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DEGRADED"
  | "UNKNOWN";

export type HBCEContinuityStatus =
  | "STABLE"
  | "LIMITED"
  | "DEGRADED"
  | "BROKEN"
  | "UNKNOWN";

export type HBCELedgerStorageType = "redis" | "memory" | "unknown";

export interface HBCEIdentityRef {
  system: HBCEJokerSystem;
  identity: string;
  node: string;
}

export interface HBCEPublicKeyInfo {
  algorithm: "ED25519";
  public_key: string;
  issuer: string;
  node: string;
  issued_by: string;
}

export interface HBCEAnchorRef {
  algorithm: "SHA-256";
  hash: string;
  timestamp: string;
}

export interface HBCESignatureRef {
  algorithm: "ED25519";
  public_key: string;
  signature: string;
  payload_hash: string;
  signed_at: string;
}

export interface HBCENodeDescriptor {
  node_id: string;
  region: string;
  country: string;
  role: HBCENodeRole;
  status: HBCENodeStatus;
  endpoint: string;
}

export interface HBCENodeProbe {
  node_id: string;
  endpoint: string;
  reachable: boolean;
  status: "ONLINE" | "OFFLINE" | "UNKNOWN";
  checked_at: string;
}

export interface HBCENetworkStatus {
  total_nodes: number;
  active_nodes: number;
  inactive_nodes: number;
}

export interface HBCELedgerEvent {
  seq: number;
  id: string;
  ts: string;
  kind: string;
  actor: string;
  node: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

export interface HBCELedgerVerification {
  ok: boolean;
  checked: number;
  broken_seq: number | null;
}

export interface HBCEContinuityRef {
  continuity_reference: string;
  session_id?: string;
  current_state?: string;
  turn_count?: number;
  last_intent_class?: string;
  last_outcome_class?: string;
  updated_at?: string;
}

export interface HBCENodeHealth {
  node: string;
  identity: string;
  system: HBCEJokerSystem;
  status: HBCENodeStatus;
  continuity_status: HBCEContinuityStatus;
  signature_enabled: boolean;
  db_configured: boolean;
  storage: {
    type: HBCELedgerStorageType;
  };
  ledger: {
    integrity: boolean;
    checked_events: number;
    broken_at: number | null;
    last_seq: number | null;
    last_hash: string | null;
  };
  ts: string;
}

export interface HBCENodeRuntimeEventInput {
  kind: string;
  actor?: string;
  node?: string;
  payload?: Record<string, unknown>;
}

export interface HBCENodeRuntimeEventResult {
  ok: boolean;
  event: HBCELedgerEvent | null;
}

export interface HBCENodeEvidencePack {
  kind: "HBCE_JOKER_EVIDENCE_PACK";
  node: string;
  identity: string;
  system: HBCEJokerSystem;
  exported_at: string;
  ledger_tail: Array<{
    seq: number;
    id: string;
    ts: string;
    kind: string;
    actor: string;
    node: string;
    payload: Record<string, unknown>;
    prev_hash: string;
    hash: string;
  }>;
}
