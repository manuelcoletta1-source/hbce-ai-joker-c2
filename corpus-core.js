/**
 * corpus-core.js
 * HBCE / AI JOKER-C2
 *
 * Canonical operational core of the repository.
 * This module centralizes:
 * - identity lineage
 * - canonical AI JOKER IPR record
 * - runtime sequence
 * - fail-closed rules
 * - derivative layer
 * - node profile
 * - evidence model
 */

export const CANONICAL_FORMULA = "Decision · Cost · Trace · Time";

export const HBCE_STACK = Object.freeze({
  identity: "IPR",
  derivation: "BIOCYBERNETIC_DERIVATION_LAYER",
  governance: "HBCE",
  runtime: "JOKER_C2",
  continuity: "TRAC_EVT",
  ledger: "APPEND_ONLY_LEDGER",
  verification: "HASH_SIGNATURE_VERIFICATION",
  federation: "MATRIX_EUROPA_NODE_TOPOLOGY"
});

export const RUNTIME_SEQUENCE = Object.freeze([
  "IDENTITY",
  "INPUT",
  "INTENT",
  "POLICY",
  "RISK",
  "DECISION",
  "EXECUTION",
  "EVT",
  "LEDGER",
  "VERIFICATION",
  "CONTINUITY"
]);

export const DECISION_OUTPUTS = Object.freeze([
  "ALLOW",
  "BLOCK",
  "ESCALATE"
]);

export const SYSTEM_STATES = Object.freeze([
  "OPERATIONAL",
  "DEGRADED",
  "BLOCKED",
  "INVALID"
]);

export const FAIL_CLOSED_RULES = Object.freeze([
  "NO_VALIDATION_NO_EXECUTION",
  "NO_CONTINUITY_NO_TRUSTED_STATE",
  "NO_EVIDENCE_NO_OPERATIONAL_EXISTENCE",
  "NO_VERIFICATION_NO_RECOGNIZED_PERSISTENCE"
]);

export const AI_JOKER_IPR_RECORD = Object.freeze({
  evt: "EVT-0014-AI",
  prev: "EVT-0013-AI",
  t: "2026-04-19T15:30:00+02:00",
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  state: "LOCKED",
  baseline: false,
  kind: "OPERATIONAL_UPDATE",
  cycle: "UP-MESE-3",
  loc: Object.freeze(["Torino", "Italy"]),
  org: "HERMETICUM B.C.E. S.r.l.",
  core: "HBCE-CORE-v3",
  anchors: Object.freeze({
    monthly_hash: "<SHA512_EVT_0014_AI>",
    ipfs_cid: "bafkreidhv73vqrxoweog33ls3rnwrgyicio234pcuks6mnep76yh56pj5q",
    btc_txid:
      "9eeb29b67f4a649d563b95560fda5ddaa84777b13515f936837fc93d28554b45",
    evm_tx_hash:
      "0xf65eb314a1edd392fc15fcd9c65d22060ca39cbac04fcfcb48b978062500a7eff"
  }),
  upstream: Object.freeze({
    root_evt: "EVT-0008",
    root_t: "2026-01-19T15:30:00+01:00",
    proto: "UNEBDO-ΦΩ",
    human_origin_ipr: "IPR-3",
    human_origin_entity: "MANUEL_COLETTA",
    t0: "2025-10-24T15:36:00Z"
  }),
  continuity: Object.freeze({
    checkpoint_type: "CANONICAL",
    elapsed_months: 3,
    origin_ipr: "IPR-AI-0001",
    rule: "monthly checkpoint fixed on day 19 at 15:30 Europe/Rome",
    note:
      "Canonical month-3 checkpoint recorded on 2026-04-19 within the prescribed checkpoint window"
  })
});

export const IDENTITY_LINEAGE = Object.freeze({
  human_root: Object.freeze({
    entity: "MANUEL_COLETTA",
    ipr: "IPR-3",
    type: "PRIMARY_HUMAN_RECORD",
    status: "ACTIVE_COMPLETE",
    role: "BIOLOGICAL_ORIGIN"
  }),
  ai_root: Object.freeze({
    entity: AI_JOKER_IPR_RECORD.entity,
    ipr: AI_JOKER_IPR_RECORD.ipr,
    type: "PRIMARY_AI_RECORD",
    status: AI_JOKER_IPR_RECORD.state,
    role: "PRIMARY_CYBERNETIC_ROOT",
    evt: AI_JOKER_IPR_RECORD.evt,
    cycle: AI_JOKER_IPR_RECORD.cycle,
    core: AI_JOKER_IPR_RECORD.core,
    checkpoint_time: AI_JOKER_IPR_RECORD.t,
    location: AI_JOKER_IPR_RECORD.loc,
    organization: AI_JOKER_IPR_RECORD.org
  }),
  derived_root: Object.freeze({
    entity: "AI_JOKER_DERIVATIVE_01",
    ipr: "IPR-AI-DER-0001",
    type: "BIOCYBERNETIC_DERIVATIVE",
    status: "LOCKED",
    role: "DERIVED_OPERATIONAL_BRANCH",
    layer: "BIOCYBERNETIC_DERIVATION_LAYER"
  })
});

export const BIOCYBERNETIC_DERIVATION_LAYER = Object.freeze({
  code: "BIOCYBERNETIC_DERIVATION_LAYER",
  name: "Biocybernetic Derivation Layer",
  definition:
    "Internal operational layer through which a biological origin, once bound to identity and computable continuity, may generate derived operational entities inside HBCE / AI JOKER-C2.",
  axiom:
    "No derived entity exists operationally unless it is identity-bound, policy-validated, runtime-authorized, EVT-linked, evidence-producing, verifiable, and continuity-preserving.",
  path: Object.freeze([
    "BIOLOGICAL_ORIGIN",
    "IDENTITY_BINDING",
    "COMPUTABLE_CONTINUITY",
    "DERIVED_IDENTITY",
    "POLICY_VALIDATION",
    "RUNTIME_AUTHORIZATION",
    "EVT",
    "EVIDENCE",
    "VERIFICATION",
    "PERSISTENCE"
  ])
});

export const NODE_PROFILE = Object.freeze({
  node_id: "AI_JOKER_C2_NODE_TORINO_01",
  role: "IDENTITY_BOUND_OPERATIONAL_NODE",
  status: "OPERATIONAL_PILOT",
  location: "Torino, Italy",
  federation_scope: "MATRIX_EUROPA",
  posture: "FAIL_CLOSED",
  active_ipr: AI_JOKER_IPR_RECORD.ipr,
  active_evt: AI_JOKER_IPR_RECORD.evt,
  active_cycle: AI_JOKER_IPR_RECORD.cycle,
  active_core: AI_JOKER_IPR_RECORD.core
});

export const EVIDENCE_MODEL = Object.freeze({
  evt_model: "APPEND_ONLY_HASH_LINKED_CONTINUITY",
  hashing: "SHA-256",
  signature: "ED25519",
  serialization: "DETERMINISTIC_JSON",
  rule:
    "No evidence, no operational existence. No verification, no recognized persistence."
});

export function getIdentityLineage() {
  return Object.freeze([
    IDENTITY_LINEAGE.human_root,
    IDENTITY_LINEAGE.ai_root,
    IDENTITY_LINEAGE.derived_root
  ]);
}

export function getAIJokerIPRRecord() {
  return AI_JOKER_IPR_RECORD;
}

export function getPrimaryAIIdentity() {
  return IDENTITY_LINEAGE.ai_root;
}

export function isKnownIdentityIpr(ipr) {
  return getIdentityLineage().some((item) => item.ipr === ipr);
}

export function isValidRuntimeDecision(value) {
  return DECISION_OUTPUTS.includes(value);
}

export function isValidSystemState(value) {
  return SYSTEM_STATES.includes(value);
}

export function buildMinimumEvt({
  evt,
  prev,
  t,
  entity,
  ipr,
  kind,
  state,
  decision
}) {
  if (!evt || !prev || !t || !entity || !ipr || !kind || !state || !decision) {
    throw new Error("Missing required EVT fields.");
  }

  if (!isValidSystemState(state)) {
    throw new Error(`Invalid state: ${state}`);
  }

  if (!isValidRuntimeDecision(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  return Object.freeze({
    evt,
    prev,
    t,
    entity,
    ipr,
    kind,
    state,
    decision
  });
}

export default Object.freeze({
  CANONICAL_FORMULA,
  HBCE_STACK,
  RUNTIME_SEQUENCE,
  DECISION_OUTPUTS,
  SYSTEM_STATES,
  FAIL_CLOSED_RULES,
  AI_JOKER_IPR_RECORD,
  IDENTITY_LINEAGE,
  BIOCYBERNETIC_DERIVATION_LAYER,
  NODE_PROFILE,
  EVIDENCE_MODEL,
  getIdentityLineage,
  getAIJokerIPRRecord,
  getPrimaryAIIdentity,
  isKnownIdentityIpr,
  isValidRuntimeDecision,
  isValidSystemState,
  buildMinimumEvt
});
