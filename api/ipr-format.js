export const IPR_EVENT_FORMAT = {
  name: "IPR-JSON-EVENT",
  version: "1.0.0",
  hash_algorithm: "SHA-512",
  anchor_types: ["bitcoin_txid", "ethereum_txid", "ipfs_cid"],
  required_fields: [
    "event_id",
    "timestamp",
    "subject",
    "root",
    "audit",
    "policy",
    "hash_chain",
    "status",
    "system"
  ]
};

export function createEmptyIprEvent() {
  return {
    format: {
      name: "IPR-JSON-EVENT",
      version: "1.0.0"
    },
    event_id: "",
    parent_event_id: null,
    timestamp: {
      iso8601: "",
      state: "LOCKED"
    },
    subject: {
      entity_name: "",
      ipr_id: "",
      binding: "SUBJECT-BOUND"
    },
    root: {
      root_id: "",
      root_hash_ref: ""
    },
    checkpoint: {
      type: "",
      description: ""
    },
    audit: {
      chain_scope: "GLOBAL"
    },
    baseline: {
      mode: "BASELINE",
      reference_event_id: "",
      is_current: false
    },
    anchors: {
      bitcoin_txid: "",
      ethereum_txid: "",
      ipfs_cid: ""
    },
    verification: {
      public_record_sha512: "",
      checkpoint_sha512: ""
    },
    policy: {
      decision: "HOLD",
      checks: []
    },
    ref_events: [],
    hash_chain: {
      previous_event_sha512: "",
      current_event_sha512: "",
      merkle_root_sha512: "",
      mode: "HASH-CHAIN"
    },
    status: {
      state: "ACTIVE",
      trace: "TRACE-PERSISTS"
    },
    location: {
      city: "",
      country: ""
    },
    system: {
      domain: "HBCE/IPR",
      core_version: "HBCE-CORE-v3",
      organization: "HERMETICUM B.C.E. S.r.l."
    }
  };
}

export function canonicalizeIprEvent(event) {
  return {
    format: {
      name: String(event?.format?.name || "IPR-JSON-EVENT"),
      version: String(event?.format?.version || "1.0.0")
    },
    event_id: String(event?.event_id || "").trim(),
    parent_event_id:
      event?.parent_event_id === null || event?.parent_event_id === undefined
        ? null
        : String(event.parent_event_id).trim(),
    timestamp: {
      iso8601: String(event?.timestamp?.iso8601 || "").trim(),
      state: String(event?.timestamp?.state || "LOCKED").trim()
    },
    subject: {
      entity_name: String(event?.subject?.entity_name || "").trim(),
      ipr_id: String(event?.subject?.ipr_id || "").trim(),
      binding: String(event?.subject?.binding || "SUBJECT-BOUND").trim()
    },
    root: {
      root_id: String(event?.root?.root_id || "").trim(),
      root_hash_ref: String(event?.root?.root_hash_ref || "").trim()
    },
    checkpoint: {
      type: String(event?.checkpoint?.type || "").trim(),
      description: String(event?.checkpoint?.description || "").trim()
    },
    audit: {
      chain_scope: String(event?.audit?.chain_scope || "GLOBAL").trim()
    },
    baseline: {
      mode: String(event?.baseline?.mode || "BASELINE").trim(),
      reference_event_id: String(event?.baseline?.reference_event_id || "").trim(),
      is_current: Boolean(event?.baseline?.is_current)
    },
    anchors: {
      bitcoin_txid: String(event?.anchors?.bitcoin_txid || "").trim(),
      ethereum_txid: String(event?.anchors?.ethereum_txid || "").trim(),
      ipfs_cid: String(event?.anchors?.ipfs_cid || "").trim()
    },
    verification: {
      public_record_sha512: String(event?.verification?.public_record_sha512 || "").trim(),
      checkpoint_sha512: String(event?.verification?.checkpoint_sha512 || "").trim()
    },
    policy: {
      decision: String(event?.policy?.decision || "HOLD").trim(),
      checks: Array.isArray(event?.policy?.checks)
        ? event.policy.checks.map((item) => String(item).trim()).filter(Boolean)
        : []
    },
    ref_events: Array.isArray(event?.ref_events)
      ? event.ref_events.map((item) => ({
          ref_id: String(item?.ref_id || "").trim(),
          timestamp: String(item?.timestamp || "").trim(),
          type: String(item?.type || "").trim(),
          ipr_id: String(item?.ipr_id || "").trim(),
          sha512: String(item?.sha512 || "").trim()
        }))
      : [],
    hash_chain: {
      previous_event_sha512: String(event?.hash_chain?.previous_event_sha512 || "").trim(),
      current_event_sha512: String(event?.hash_chain?.current_event_sha512 || "").trim(),
      merkle_root_sha512: String(event?.hash_chain?.merkle_root_sha512 || "").trim(),
      mode: String(event?.hash_chain?.mode || "HASH-CHAIN").trim()
    },
    status: {
      state: String(event?.status?.state || "ACTIVE").trim(),
      trace: String(event?.status?.trace || "TRACE-PERSISTS").trim()
    },
    location: {
      city: String(event?.location?.city || "").trim(),
      country: String(event?.location?.country || "").trim()
    },
    system: {
      domain: String(event?.system?.domain || "HBCE/IPR").trim(),
      core_version: String(event?.system?.core_version || "HBCE-CORE-v3").trim(),
      organization: String(event?.system?.organization || "HERMETICUM B.C.E. S.r.l.").trim()
    }
  };
}
