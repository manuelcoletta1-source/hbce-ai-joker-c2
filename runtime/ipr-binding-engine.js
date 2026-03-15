import { getJokerBaseline } from "./joker-baseline.js";

export function resolveIprBinding() {
  const baseline = getJokerBaseline();

  if (!baseline) {
    return {
      status: "DENY",
      reason: "baseline_unavailable"
    };
  }

  const subject = baseline.subject;
  const rootReference = baseline.root_reference;
  const anchors = baseline.anchors;
  const checkpoint = baseline.checkpoint;

  if (!subject || subject.ipr_id !== "IPR-AI-0001") {
    return {
      status: "DENY",
      reason: "invalid_ipr_subject"
    };
  }

  if (!checkpoint || checkpoint.status !== "LOCKED") {
    return {
      status: "DENY",
      reason: "checkpoint_not_locked"
    };
  }

  return {
    status: "ALLOW",
    binding: {
      entity_name: subject.entity_name,
      ipr_id: subject.ipr_id,
      binding: subject.binding,
      root_id: rootReference?.ipr_root_id || null,
      baseline_event: baseline.event_id,
      checkpoint_timestamp: checkpoint.timestamp,
      anchors: {
        bitcoin_txid: anchors?.bitcoin_txid || null,
        ethereum_txid: anchors?.ethereum_txid || null,
        ipfs_cid: anchors?.ipfs_cid || null
      }
    }
  };
}
