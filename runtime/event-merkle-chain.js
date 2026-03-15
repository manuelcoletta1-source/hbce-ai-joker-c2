import { getEventLedger } from "./event-ledger.js";

function buildHash(input) {
  const text = JSON.stringify(input);
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return `hash-${Math.abs(hash)}`;
}

function pairwiseHash(left, right) {
  return buildHash({
    left: left || null,
    right: right || null
  });
}

export function buildMerkleRoot() {
  const ledger = getEventLedger();

  if (!ledger.length) {
    return {
      status: "DENY",
      reason: "empty_ledger"
    };
  }

  let level = ledger.map((event) => event.event_hash);

  while (level.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || level[i];
      nextLevel.push(pairwiseHash(left, right));
    }

    level = nextLevel;
  }

  return {
    status: "ALLOW",
    merkle_root: level[0],
    total_events: ledger.length
  };
}

export function buildLedgerProof() {
  const ledger = getEventLedger();
  const merkle = buildMerkleRoot();

  if (merkle.status !== "ALLOW") {
    return merkle;
  }

  return {
    status: "ALLOW",
    total_events: ledger.length,
    latest_event_id: ledger[ledger.length - 1].event_id,
    latest_event_hash: ledger[ledger.length - 1].event_hash,
    merkle_root: merkle.merkle_root
  };
}
