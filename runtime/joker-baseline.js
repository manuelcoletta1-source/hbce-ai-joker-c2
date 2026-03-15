export const JOKER_BASELINE = {
  event_id: "EVT-0008",
  previous_event_id: "EVT-0007",

  checkpoint: {
    timestamp: "2026-01-19T15:30:00+01:00",
    status: "LOCKED"
  },

  subject: {
    entity_name: "AI_JOKER",
    ipr_id: "IPR-AI-0001",
    binding: "SUBJECT-BOUND"
  },

  root_reference: {
    ipr_root_id: "IPR-HERMETICUM-B.C.E.-000",
    pseudo_hash: "PSEUDO-<hash>"
  },

  checkpoint_freeze: {
    type: "CHECKPOINT_FREEZE",
    description: "IPR/Joker state frozen to EVT-0008"
  },

  audit: {
    chain_scope: "GLOBAL",
    persistence: "ACTIVE",
    trace_persists: true
  },

  baseline: {
    reference_event: "EVT-0008",
    is_canonical: true,
    is_mutable: false
  },

  anchors: {
    bitcoin_txid: "9eeb29b67f4a649d563b95560fda5ddaa84777b13515f936837fc93d28554b45",
    ethereum_txid: "0xf65eb314a1edd392fc15fcd9c65d22060ca39cbac04fcfcb48b978062500a7eff",
    ipfs_cid: "bafkreidhv73vqrxoweog33ls3rnwrgyicio234pcuks6mnep76yh56pj5q"
  },

  verification: {
    public_verify_record: "<sha-512-public-verify-record>",
    checkpoint_freeze_record: "<sha-512-checkpoint-freeze-v1>"
  },

  policy: {
    decision: "ALLOW",
    checks: [
      "TRACE_OK",
      "PUBLIC_VERIFY_OK",
      "POLICY_OK"
    ]
  },

  references: [
    {
      ref_id: "REF-0001",
      timestamp: "2026-03-13T18:05:00+01:00",
      type: "STRUCTURAL_NORMALIZATION",
      subject: "IPR-AI-0001",
      digest: "<sha-512-ref-0001>"
    },
    {
      ref_id: "REF-0002",
      timestamp: "2026-03-13T18:22:00+01:00",
      type: "HASH_EXTENSION",
      subject: "IPR-AI-0001",
      digest: "<sha-512-ref-0002>"
    }
  ],

  hash_chain: {
    evt_0007: "<sha-512-evt-0007>",
    evt_0008: "<sha-512-evt-0008>",
    merkle_evt_0008: "<sha-512-merkle-evt-0008>",
    mode: "HASH-CHAIN"
  },

  location: {
    city: "Torino",
    country: "Italy"
  },

  infrastructure: {
    domain: "HBCE/IPR",
    core_version: "HBCE-CORE-v3",
    legal_entity: "HERMETICUM B.C.E. S.r.l."
  }
};

export function getJokerBaseline() {
  return JOKER_BASELINE;
}

export function getJokerSubject() {
  return JOKER_BASELINE.subject;
}

export function getJokerAnchors() {
  return JOKER_BASELINE.anchors;
}
