export const IPR_SAMPLE_EVENT = {
  format: {
    name: "IPR-JSON-EVENT",
    version: "1.0.0"
  },
  event_id: "EVT-0008",
  parent_event_id: "EVT-0007",
  timestamp: {
    iso8601: "2026-01-19T15:30:00+01:00",
    state: "LOCKED"
  },
  subject: {
    entity_name: "AI_JOKER",
    ipr_id: "IPR-AI-0001",
    binding: "SUBJECT-BOUND"
  },
  root: {
    root_id: "IPR-HERMETICUM-B.C.E.-000",
    root_hash_ref: "PSEUDO-<hash>"
  },
  checkpoint: {
    type: "CHECKPOINT_FREEZE",
    description: "IPR/Joker state frozen to EVT-0008"
  },
  audit: {
    chain_scope: "GLOBAL"
  },
  baseline: {
    mode: "BASELINE",
    reference_event_id: "EVT-0008",
    is_current: true
  },
  anchors: {
    bitcoin_txid: "9eeb29b67f4a649d563b95560fda5ddaa84777b13515f936837fc93d28554b45",
    ethereum_txid: "0xf65eb314a1edd392fc15fcd9c65d22060ca39cbac04fcfcb48b978062500a7eff",
    ipfs_cid: "bafkreidhv73vqrxoweog33ls3rnwrgyicio234pcuks6mnep76yh56pj5q"
  },
  verification: {
    public_record_sha512: "<sha-512-public-verify-record>",
    checkpoint_sha512: "<sha-512-checkpoint-freeze-v1>"
  },
  policy: {
    decision: "ALLOW",
    checks: ["TRACE_OK", "PUBLIC_VERIFY_OK", "POLICY_OK"]
  },
  ref_events: [
    {
      ref_id: "REF-0001",
      timestamp: "2026-03-13T18:05:00+01:00",
      type: "STRUCTURAL_NORMALIZATION",
      ipr_id: "IPR-AI-0001",
      sha512: "<sha-512-ref-0001>"
    },
    {
      ref_id: "REF-0002",
      timestamp: "2026-03-13T18:22:00+01:00",
      type: "HASH_EXTENSION",
      ipr_id: "IPR-AI-0001",
      sha512: "<sha-512-ref-0002>"
    }
  ],
  hash_chain: {
    previous_event_sha512: "<sha-512-evt-0007>",
    current_event_sha512: "<sha-512-evt-0008>",
    merkle_root_sha512: "<sha-512-merkle-evt-0008>",
    mode: "HASH-CHAIN"
  },
  status: {
    state: "ACTIVE",
    trace: "TRACE-PERSISTS"
  },
  location: {
    city: "Torino",
    country: "Italy"
  },
  system: {
    domain: "HBCE/IPR",
    core_version: "HBCE-CORE-v3",
    organization: "HERMETICUM B.C.E. S.r.l."
  }
};
