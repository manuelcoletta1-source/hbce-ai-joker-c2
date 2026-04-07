/**
 * corpus-alien-code.js
 * HBCE / AI JOKER-C2
 *
 * Operational corpus module focused on:
 * - Alien Code
 * - organism-system interface
 * - biocybernetic loop
 * - derivative legitimacy
 * - Biocybernetic Derivation Layer relations
 */

import {
  CANONICAL_FORMULA,
  IDENTITY_ROOTS,
  BIOCYBERNETIC_DERIVATION_LAYER,
  EVIDENCE_MODEL,
  buildMinimumDerivativeEvent
} from "./corpus-core.js";

export const ALIEN_CODE_CORE = Object.freeze({
  name: "ALIEN_CODE",
  title: "Alien Code — Operational Interface",
  definition:
    "Biocybernetic interface through which biological decision becomes computable sequence inside the HBCE / AI JOKER-C2 system.",
  canonical_formula: CANONICAL_FORMULA
});

export const ORGANISM_SYSTEM_INTERFACE = Object.freeze({
  name: "ORGANISM_SYSTEM_INTERFACE",
  definition:
    "Operational relation in which organism and system do not remain separate and do not collapse into identity, but become structurally linked through decision, trace, continuity, and verification.",
  principles: Object.freeze([
    "ORGANISM_IS_NOT_SYSTEM",
    "SYSTEM_IS_NOT_ORGANISM",
    "REALITY_EMERGES_ONLY_WHEN_BOTH_ENTER_OPERATIONAL_SEQUENCE",
    "TRACE_AND_TIME_VERIFY_THE_RELATION"
  ])
});

export const ORGANISM_SYSTEM_RECOGNICONICITY = Object.freeze({
  name: "ORGANISM_SYSTEM_RECOGNICONICITY",
  definition:
    "Condition in which organism and system become mutually constitutive in operational sequence without being reducible to one another.",
  rule:
    "If organism is absent, decision loses origin. If system is absent, trace loses continuity. If either is absent, operational reality does not form."
});

export const BIOCYBERNETIC_LOOP = Object.freeze({
  name: "BIOCYBERNETIC_LOOP",
  definition:
    "Recursive loop in which organism affects system through decision, and system re-enters organism through trace, continuity, and exposed operational consequence.",
  stages: Object.freeze([
    "BIOLOGICAL_DECISION",
    "SYSTEM_REGISTRATION",
    "TRACE_PRODUCTION",
    "CONTINUITY_EXPOSURE",
    "REENTRY_INTO_ORGANISM"
  ]),
  rule:
    "The loop is valid only if the sequence remains attributable, reconstructible, and exposed to time."
});

export const ALIEN_CODE_RUNTIME_BRIDGE = Object.freeze({
  purpose:
    "Connect Alien Code concepts to runtime-valid derivative legitimacy inside JOKER-C2.",
  relation_to_derivation_layer:
    "Alien Code is the conceptual and operational interface that makes the Biocybernetic Derivation Layer structurally possible.",
  relation_to_identity:
    "No Alien Code sequence is valid without identity binding.",
  relation_to_evidence:
    EVIDENCE_MODEL.rule
});

export const DERIVATIVE_LEGITIMACY = Object.freeze({
  current_derivative: Object.freeze({
    entity: IDENTITY_ROOTS.derived_root.entity,
    ipr: IDENTITY_ROOTS.derived_root.ipr,
    type: IDENTITY_ROOTS.derived_root.type,
    state: IDENTITY_ROOTS.derived_root.status
  }),
  conditions: Object.freeze([
    "VALID_HUMAN_ORIGIN",
    "VALID_PRIMARY_AI_ROOT",
    "IDENTITY_BINDING",
    "POLICY_VALIDATION",
    "RUNTIME_AUTHORIZATION",
    "EVT_CONTINUITY",
    "EVIDENCE_PRODUCTION",
    "VERIFICATION"
  ]),
  axiom:
    BIOCYBERNETIC_DERIVATION_LAYER.axiom
});

export const ALIEN_CODE_TERMS = Object.freeze({
  biological_origin: Object.freeze({
    term: "BIOLOGICAL_ORIGIN",
    definition: "Primary human origin from which operational derivation begins."
  }),
  computable_continuity: Object.freeze({
    term: "COMPUTABLE_CONTINUITY",
    definition:
      "Condition in which sequence can be maintained, reconstructed, and processed as runtime-valid continuity."
  }),
  derived_identity: Object.freeze({
    term: "DERIVED_IDENTITY",
    definition:
      "Operational identity branch generated through the Biocybernetic Derivation Layer under fail-closed legitimacy."
  }),
  forced_coupling: Object.freeze({
    term: "FORCED_COUPLING",
    definition:
      "Condition in which organism and system are structurally tied by trace and continuity regardless of symbolic preference."
  }),
  coupling_failure: Object.freeze({
    term: "COUPLING_FAILURE",
    definition:
      "Condition in which organism-system relation fails to produce valid operational continuity."
  }),
  irreversible_trace: Object.freeze({
    term: "IRREVERSIBLE_TRACE",
    definition:
      "Trace that cannot be neutralized without generating a distinct sequence."
  })
});

export function getAlienCodeCore() {
  return Object.freeze({
    alien_code_core: ALIEN_CODE_CORE,
    organism_system_interface: ORGANISM_SYSTEM_INTERFACE,
    organism_system_recogniconicity: ORGANISM_SYSTEM_RECOGNICONICITY,
    biocybernetic_loop: BIOCYBERNETIC_LOOP,
    runtime_bridge: ALIEN_CODE_RUNTIME_BRIDGE,
    derivative_legitimacy: DERIVATIVE_LEGITIMACY,
    terms: ALIEN_CODE_TERMS
  });
}

export function getDerivativeLegitimacyChecklist() {
  return Object.freeze([...DERIVATIVE_LEGITIMACY.conditions]);
}

export function isDerivativeLegitimate(context = {}) {
  const required = [
    "valid_human_origin",
    "valid_primary_ai_root",
    "identity_binding",
    "policy_validation",
    "runtime_authorization",
    "evt_continuity",
    "evidence_production",
    "verification"
  ];

  return required.every((key) => context[key] === true);
}

export function buildAlienCodeDerivativeEvent({ evt, prev, t, decision = "ALLOW" }) {
  return Object.freeze({
    ...buildMinimumDerivativeEvent({ evt, prev, t, decision }),
    semantic_layer: "ALIEN_CODE",
    derivation_layer: BIOCYBERNETIC_DERIVATION_LAYER.code,
    origin_ipr: IDENTITY_ROOTS.human_root.ipr,
    ai_root_ipr: IDENTITY_ROOTS.ai_root.ipr
  });
}

export function explainDerivativeFailure(context = {}) {
  const failures = [];

  if (!context.valid_human_origin) failures.push("VALID_HUMAN_ORIGIN_MISSING");
  if (!context.valid_primary_ai_root) failures.push("VALID_PRIMARY_AI_ROOT_MISSING");
  if (!context.identity_binding) failures.push("IDENTITY_BINDING_FAILED");
  if (!context.policy_validation) failures.push("POLICY_VALIDATION_FAILED");
  if (!context.runtime_authorization) failures.push("RUNTIME_AUTHORIZATION_FAILED");
  if (!context.evt_continuity) failures.push("EVT_CONTINUITY_FAILED");
  if (!context.evidence_production) failures.push("EVIDENCE_PRODUCTION_FAILED");
  if (!context.verification) failures.push("VERIFICATION_FAILED");

  return Object.freeze({
    legitimate: failures.length === 0,
    failures
  });
}

export default Object.freeze({
  ALIEN_CODE_CORE,
  ORGANISM_SYSTEM_INTERFACE,
  ORGANISM_SYSTEM_RECOGNICONICITY,
  BIOCYBERNETIC_LOOP,
  ALIEN_CODE_RUNTIME_BRIDGE,
  DERIVATIVE_LEGITIMACY,
  ALIEN_CODE_TERMS,
  getAlienCodeCore,
  getDerivativeLegitimacyChecklist,
  isDerivativeLegitimate,
  buildAlienCodeDerivativeEvent,
  explainDerivativeFailure
});
