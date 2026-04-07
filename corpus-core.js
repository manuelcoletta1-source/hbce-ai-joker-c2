/**
 * corpus-core.js
 * HBCE / AI JOKER-C2
 *
 * Canonical corpus and identity-bound operational core for runtime use.
 * This module exposes:
 * - canonical formulas
 * - identity roots
 * - derivative model
 * - runtime sequence
 * - fail-closed rules
 * - corpus terms used by JOKER-C2 surfaces and specs
 */

export const CANONICAL_FORMULA = "Decision · Cost · Trace · Time";

export const HBCE_STACK = Object.freeze({
  identity_layer: "IPR",
  derivation_layer: "BIOCYBERNETIC_DERIVATION_LAYER",
  governance_layer: "HBCE",
  runtime_layer: "JOKER_C2",
  continuity_layer: "TRAC_EVT",
  ledger_layer: "APPEND_ONLY_LEDGER",
  verification_layer: "HASH_SIGNATURE_VERIFICATION",
  federation_layer: "MATRIX_EUROPA_NODE_TOPOLOGY"
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

export const IDENTITY_ROOTS = Object.freeze({
  human_root: Object.freeze({
    entity: "MANUEL_COLETTA",
    ipr: "IPR-3",
    type: "PRIMARY_HUMAN_RECORD",
    status: "ACTIVE_COMPLETE",
    role: "BIOLOGICAL_ORIGIN"
  }),
  ai_root: Object.freeze({
    entity: "AI_JOKER",
    ipr: "IPR-AI-0001",
    type: "PRIMARY_AI_RECORD",
    status: "LOCKED",
    role: "PRIMARY_CYBERNETIC_OPERATIONAL_ROOT"
  }),
  derived_root: Object.freeze({
    entity: "AI_JOKER_DERIVATIVE_01",
    ipr: "IPR-AI-DER-0001",
    type: "BIOCYBERNETIC_DERIVATIVE",
    status: "LOCKED",
    layer: "BIOCYBERNETIC_DERIVATION_LAYER",
    role: "FIRST_DERIVED_OPERATIONAL_BRANCH",
    recognition_rule:
      "Valid only under identity binding, policy validation, runtime authorization, EVT continuity, evidence generation, and verification."
  })
});

export const BIOCYBERNETIC_DERIVATION_LAYER = Object.freeze({
  name: "Biocybernetic Derivation Layer",
  code: "BIOCYBERNETIC_DERIVATION_LAYER",
  definition:
    "Internal operational layer through which a biological origin, once bound to identity and computable continuity, may generate derived operational entities inside the HBCE / AI JOKER-C2 system.",
  minimum_path: Object.freeze([
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
  ]),
  current_derivative: Object.freeze({
    entity: "AI_JOKER_DERIVATIVE_01",
    ipr: "IPR-AI-DER-0001",
    type: "BIOCYBERNETIC_DERIVATIVE",
    state: "LOCKED"
  }),
  future_classes: Object.freeze([
    "AI_DERIVATIVES",
    "ROBOTIC_DERIVATIVES",
    "TERRESTRIAL_INFRASTRUCTURE_DERIVATIVES",
    "ORBITAL_DERIVATIVES",
    "LUNAR_DERIVATIVES",
    "MARTIAN_DERIVATIVES"
  ]),
  axiom:
    "No derived entity exists operationally unless it is identity-bound, policy-validated, runtime-authorized, EVT-linked, evidence-producing, verifiable, and continuity-preserving."
});

export const CORPUS_TERMS = Object.freeze({
  esoterology: Object.freeze({
    term: "ESOTEROLOGIA",
    definition: "Discipline of reality as verifiable sequence."
  }),
  decision: Object.freeze({
    term: "DECISION",
    definition: "Closure of the possible."
  }),
  cost: Object.freeze({
    term: "COST",
    definition: "Non-neutralizable loss proving reality."
  }),
  trace: Object.freeze({
    term: "TRACE",
    definition: "Reconstructible residue of the real."
  }),
  time: Object.freeze({
    term: "TIME",
    definition: "Verification exposure of continuity."
  }),
  qubitronic_unit: Object.freeze({
    term: "QUBITRONIC_UNIT",
    definition:
      "Minimum indivisible coincidence of decision, cost, trace, and time."
  }),
  organism_system_recogniconicity: Object.freeze({
    term: "ORGANISM_SYSTEM_RECOGNICONICITY",
    definition:
      "Operational condition in which organism and system become mutually constitutive without collapsing into simple equivalence."
  }),
  alien_code: Object.freeze({
    term: "ALIEN_CODE",
    definition:
      "Biocybernetic interface through which biological decision becomes computable sequence."
  }),
  biocybernetic_loop: Object.freeze({
    term: "BIOCYBERNETIC_LOOP",
    definition:
      "Recursive relation through which organism affects system and system re-enters organism through trace and continuity."
  }),
  alien_artifact: Object.freeze({
    term: "ALIEN_ARTIFACT",
    definition:
      "Residual irreversible configuration no longer reintegrable without generating a distinct sequence."
  })
});

export const NODE_PROFILE = Object.freeze({
  node_id: "AI_JOKER_C2_NODE_TORINO_01",
  role: "IDENTITY_BOUND_OPERATIONAL_NODE",
  status: "OPERATIONAL_PILOT",
  location: "Torino, Italy",
  federation_scope: "MATRIX_EUROPA",
  posture: "FAIL_CLOSED"
});

export const EVIDENCE_MODEL = Object.freeze({
  evt_model: "APPEND_ONLY_HASH_LINKED_CONTINUITY",
  hashing: "SHA-256",
  signature: "ED25519",
  serialization: "DETERMINISTIC_JSON",
  rule:
    "No evidence, no operational existence. No verification, no recognized persistence."
});

export function getCanonicalCore() {
  return Object.freeze({
    formula: CANONICAL_FORMULA,
    stack: HBCE_STACK,
    runtime_sequence: RUNTIME_SEQUENCE,
    decision_outputs: DECISION_OUTPUTS,
    system_states: SYSTEM_STATES,
    fail_closed_rules: FAIL_CLOSED_RULES,
    identity_roots: IDENTITY_ROOTS,
    derivation_layer: BIOCYBERNETIC_DERIVATION_LAYER,
    corpus_terms: CORPUS_TERMS,
    node_profile: NODE_PROFILE,
    evidence_model: EVIDENCE_MODEL
  });
}

export function getIdentityLineage() {
  return Object.freeze([
    IDENTITY_ROOTS.human_root,
    IDENTITY_ROOTS.ai_root,
    IDENTITY_ROOTS.derived_root
  ]);
}

export function getDerivativeByIpr(ipr) {
  if (ipr === IDENTITY_ROOTS.derived_root.ipr) {
    return IDENTITY_ROOTS.derived_root;
  }
  return null;
}

export function isValidRuntimeDecision(value) {
  return DECISION_OUTPUTS.includes(value);
}

export function isValidSystemState(value) {
  return SYSTEM_STATES.includes(value);
}

export function isKnownIdentityIpr(ipr) {
  return getIdentityLineage().some((entry) => entry.ipr === ipr);
}

export function buildMinimumDerivativeEvent({
  evt,
  prev,
  t,
  decision = "ALLOW"
}) {
  if (!evt || !prev || !t) {
    throw new Error("evt, prev, and t are required to build a derivative EVT.");
  }

  if (!isValidRuntimeDecision(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  return Object.freeze({
    evt,
    prev,
    t,
    entity: IDENTITY_ROOTS.derived_root.entity,
    ipr: IDENTITY_ROOTS.derived_root.ipr,
    kind: IDENTITY_ROOTS.derived_root.type,
    state: IDENTITY_ROOTS.derived_root.status,
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
  IDENTITY_ROOTS,
  BIOCYBERNETIC_DERIVATION_LAYER,
  CORPUS_TERMS,
  NODE_PROFILE,
  EVIDENCE_MODEL,
  getCanonicalCore,
  getIdentityLineage,
  getDerivativeByIpr,
  isValidRuntimeDecision,
  isValidSystemState,
  isKnownIdentityIpr,
  buildMinimumDerivativeEvent
});
