/**
 * corpus-alien-code.js
 * HBCE / AI JOKER-C2
 *
 * Alien Code operational corpus module.
 * Connects organism-system interface, biocybernetic loop,
 * and derivative legitimacy to runtime use.
 */

import core from "./corpus-core.js";

export const ALIEN_CODE = Object.freeze({
  name: "ALIEN_CODE",
  title: "Alien Code — Operational Interface",
  definition:
    "Biocybernetic interface through which biological decision becomes computable sequence.",
  canonical_formula: core.CANONICAL_FORMULA
});

export const ORGANISM_SYSTEM_INTERFACE = Object.freeze({
  name: "ORGANISM_SYSTEM_INTERFACE",
  definition:
    "Operational relation in which organism and system become structurally linked through decision, trace, continuity, and verification.",
  principles: Object.freeze([
    "ORGANISM_IS_NOT_SYSTEM",
    "SYSTEM_IS_NOT_ORGANISM",
    "REALITY_EMERGES_ONLY_THROUGH_OPERATIONAL_SEQUENCE",
    "TRACE_AND_TIME_VERIFY_THE_RELATION"
  ])
});

export const ORGANISM_SYSTEM_RECOGNICONICITY = Object.freeze({
  name: "ORGANISM_SYSTEM_RECOGNICONICITY",
  definition:
    "Condition in which organism and system become mutually constitutive in operational sequence without collapsing into identity."
});

export const BIOCYBERNETIC_LOOP = Object.freeze({
  name: "BIOCYBERNETIC_LOOP",
  definition:
    "Recursive relation in which organism affects system through decision and system re-enters organism through trace, continuity, and exposed consequence.",
  stages: Object.freeze([
    "BIOLOGICAL_DECISION",
    "SYSTEM_REGISTRATION",
    "TRACE_PRODUCTION",
    "CONTINUITY_EXPOSURE",
    "REENTRY_INTO_ORGANISM"
  ])
});

export const DERIVATIVE_LEGITIMACY = Object.freeze({
  current_derivative: core.IDENTITY_LINEAGE.derived_root,
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
  axiom: core.BIOCYBERNETIC_DERIVATION_LAYER.axiom
});

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
  ALIEN_CODE,
  ORGANISM_SYSTEM_INTERFACE,
  ORGANISM_SYSTEM_RECOGNICONICITY,
  BIOCYBERNETIC_LOOP,
  DERIVATIVE_LEGITIMACY,
  isDerivativeLegitimate,
  explainDerivativeFailure
});
