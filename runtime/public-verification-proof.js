import { buildLedgerProof } from "./event-merkle-chain.js";
import { resolveIprBinding } from "./ipr-binding-engine.js";

export function buildPublicVerificationProof() {
  const ledgerProof = buildLedgerProof();
  const binding = resolveIprBinding();

  if (ledgerProof.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: ledgerProof.reason || "ledger_proof_unavailable"
    };
  }

  if (binding.status !== "ALLOW") {
    return {
      status: "DENY",
      reason: binding.reason || "ipr_binding_unavailable"
    };
  }

  return {
    status: "ALLOW",
    proof_type: "PUBLIC_VERIFICATION_PROOF",
    timestamp: new Date().toISOString(),
    ipr_id: binding.binding.ipr_id,
    entity_name: binding.binding.entity_name,
    baseline_event: binding.binding.baseline_event,
    latest_event_id: ledgerProof.latest_event_id,
    latest_event_hash: ledgerProof.latest_event_hash,
    merkle_root: ledgerProof.merkle_root,
    total_events: ledgerProof.total_events,
    anchors: binding.binding.anchors
  };
}
