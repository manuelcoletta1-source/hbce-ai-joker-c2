/**
 * search-spec.js
 * HBCE / AI JOKER-C2
 *
 * Search specification model for governed research, identity-bound retrieval,
 * EVT-aware query handling, and derivative-aware legitimacy checks.
 */

import {
  RUNTIME_SEQUENCE,
  DECISION_OUTPUTS,
  SYSTEM_STATES,
  IDENTITY_ROOTS,
  BIOCYBERNETIC_DERIVATION_LAYER
} from "./corpus-core.js";

export const SEARCH_SPEC = Object.freeze({
  name: "JOKER_C2_RESEARCH_SEARCH_SPEC",
  classification: "IDENTITY_BOUND_GOVERNED_SEARCH_MODEL",
  purpose:
    "Define the governed search model through which JOKER-C2 performs retrieval, contextual research, and search-linked runtime operations under identity, policy, continuity, evidence, and verification constraints.",
  sequence: RUNTIME_SEQUENCE,
  fail_closed: true
});

export const SEARCH_INPUT_MODEL = Object.freeze({
  required_fields: Object.freeze([
    "query",
    "identity",
    "session_id"
  ]),
  optional_fields: Object.freeze([
    "files",
    "context",
    "scope",
    "intent",
    "derivative_context",
    "continuity_ref"
  ]),
  rule:
    "No search request is treated as operationally valid unless query, identity, and session binding are structurally available."
});

export const SEARCH_INTENT_CLASSES = Object.freeze([
  "FACT_RETRIEVAL",
  "DOCUMENT_RETRIEVAL",
  "ARCHITECTURE_QUERY",
  "PROTOCOL_QUERY",
  "REGISTRY_QUERY",
  "EVIDENCE_QUERY",
  "DERIVATIVE_QUERY",
  "NETWORK_QUERY",
  "INVALID_INTENT"
]);

export const SEARCH_POLICY_MODEL = Object.freeze({
  checks: Object.freeze([
    "IDENTITY_VALIDATION",
    "ROLE_COMPATIBILITY",
    "SCOPE_COMPATIBILITY",
    "DERIVATIVE_LEGITIMACY_IF_APPLICABLE",
    "CONTINUITY_COMPATIBILITY"
  ]),
  outputs: Object.freeze(DECISION_OUTPUTS),
  rule:
    "Search is not a neutral utility. It is a governed operational action evaluated under policy and runtime legitimacy."
});

export const SEARCH_RISK_MODEL = Object.freeze({
  levels: Object.freeze([
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
  ]),
  triggers: Object.freeze([
    "MISSING_IDENTITY",
    "INVALID_SCOPE",
    "BROKEN_CONTINUITY",
    "UNSUPPORTED_DERIVATIVE_CONTEXT",
    "UNVERIFIABLE_RESULT_PATH",
    "EXCESSIVE_RUNTIME_AMBIGUITY"
  ]),
  rule:
    "If search risk exceeds acceptable threshold, the runtime does not preserve the request as fully valid operational continuity."
});

export const SEARCH_OUTPUT_MODEL = Object.freeze({
  valid_outputs: Object.freeze([
    "CONTROLLED_RESULT",
    "BLOCKED_RESULT",
    "ESCALATED_RESULT",
    "DEGRADED_RESULT"
  ]),
  requirements: Object.freeze([
    "IDENTITY_BOUND",
    "RUNTIME_GOVERNED",
    "SESSION_LINKED",
    "EVIDENCE_COMPATIBLE",
    "VERIFICATION_COMPATIBLE"
  ]),
  rule:
    "A search output is valid only if it remains attributable, governed, and continuity-compatible."
});

export const DERIVATIVE_SEARCH_MODEL = Object.freeze({
  enabled: true,
  current_derivative: Object.freeze({
    entity: IDENTITY_ROOTS.derived_root.entity,
    ipr: IDENTITY_ROOTS.derived_root.ipr,
    layer: BIOCYBERNETIC_DERIVATION_LAYER.code,
    state: IDENTITY_ROOTS.derived_root.status
  }),
  use_cases: Object.freeze([
    "DERIVATIVE_IDENTITY_QUERY",
    "DERIVATIVE_REGISTRY_QUERY",
    "DERIVATIVE_EVIDENCE_QUERY",
    "DERIVATIVE_PROTOCOL_QUERY"
  ]),
  legitimacy_conditions: Object.freeze([
    "VALID_HUMAN_ORIGIN",
    "VALID_PRIMARY_AI_ROOT",
    "IDENTITY_BINDING",
    "POLICY_VALIDATION",
    "RUNTIME_AUTHORIZATION",
    "EVT_CONTINUITY",
    "EVIDENCE_PRODUCTION_PATH",
    "VERIFICATION_PATH"
  ]),
  axiom:
    "No derivative-aware search is valid unless derivative legitimacy remains subordinate to identity, policy, continuity, evidence, and verification."
});

export const SEARCH_STATE_MODEL = Object.freeze({
  states: Object.freeze(SYSTEM_STATES),
  operational_meaning: Object.freeze({
    OPERATIONAL:
      "Search request and result remain valid under identity, policy, continuity, and evidence constraints.",
    DEGRADED:
      "Search remains partially available but with reduced continuity, scope, or verification guarantees.",
    BLOCKED:
      "Search request cannot continue as valid operational action.",
    INVALID:
      "Search request or result fails structural legitimacy and cannot be trusted."
  })
});

export const SEARCH_EVENT_MODEL = Object.freeze({
  evt_kind: "SEARCH_OPERATION",
  minimum_fields: Object.freeze([
    "evt",
    "prev",
    "t",
    "entity",
    "ipr",
    "kind",
    "state",
    "decision",
    "query"
  ]),
  derivative_extension: Object.freeze([
    "derivative_ipr",
    "derivation_layer"
  ]),
  rule:
    "Meaningful search activity must remain representable as EVT-compatible operational continuity."
});

export function getSearchSpec() {
  return Object.freeze({
    search_spec: SEARCH_SPEC,
    input_model: SEARCH_INPUT_MODEL,
    intent_classes: SEARCH_INTENT_CLASSES,
    policy_model: SEARCH_POLICY_MODEL,
    risk_model: SEARCH_RISK_MODEL,
    output_model: SEARCH_OUTPUT_MODEL,
    derivative_search_model: DERIVATIVE_SEARCH_MODEL,
    state_model: SEARCH_STATE_MODEL,
    event_model: SEARCH_EVENT_MODEL
  });
}

export function isKnownSearchIntent(intent) {
  return SEARCH_INTENT_CLASSES.includes(intent);
}

export function isValidSearchDecision(decision) {
  return DECISION_OUTPUTS.includes(decision);
}

export function canRunDerivativeSearch(context = {}) {
  const required = [
    "valid_human_origin",
    "valid_primary_ai_root",
    "identity_binding",
    "policy_validation",
    "runtime_authorization",
    "evt_continuity",
    "evidence_production_path",
    "verification_path"
  ];

  return required.every((key) => context[key] === true);
}

export function buildSearchEvent({
  evt,
  prev,
  t,
  entity,
  ipr,
  query,
  decision = "ALLOW",
  state = "OPERATIONAL",
  derivative = false
}) {
  if (!evt || !prev || !t || !entity || !ipr || !query) {
    throw new Error("evt, prev, t, entity, ipr, and query are required.");
  }

  if (!isValidSearchDecision(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  if (!SYSTEM_STATES.includes(state)) {
    throw new Error(`Invalid state: ${state}`);
  }

  const base = {
    evt,
    prev,
    t,
    entity,
    ipr,
    kind: SEARCH_EVENT_MODEL.evt_kind,
    state,
    decision,
    query
  };

  if (derivative) {
    return Object.freeze({
      ...base,
      derivative_ipr: IDENTITY_ROOTS.derived_root.ipr,
      derivation_layer: BIOCYBERNETIC_DERIVATION_LAYER.code
    });
  }

  return Object.freeze(base);
}

export function explainSearchBlockers(context = {}) {
  const blockers = [];

  if (!context.identity_binding) blockers.push("IDENTITY_BINDING_FAILED");
  if (!context.policy_validation) blockers.push("POLICY_VALIDATION_FAILED");
  if (!context.scope_compatibility) blockers.push("SCOPE_COMPATIBILITY_FAILED");
  if (!context.evt_continuity) blockers.push("EVT_CONTINUITY_FAILED");
  if (!context.verification_path) blockers.push("VERIFICATION_PATH_MISSING");

  if (context.derivative_context === true && !canRunDerivativeSearch(context)) {
    blockers.push("DERIVATIVE_LEGITIMACY_FAILED");
  }

  return Object.freeze({
    blocked: blockers.length > 0,
    blockers
  });
}

export default Object.freeze({
  SEARCH_SPEC,
  SEARCH_INPUT_MODEL,
  SEARCH_INTENT_CLASSES,
  SEARCH_POLICY_MODEL,
  SEARCH_RISK_MODEL,
  SEARCH_OUTPUT_MODEL,
  DERIVATIVE_SEARCH_MODEL,
  SEARCH_STATE_MODEL,
  SEARCH_EVENT_MODEL,
  getSearchSpec,
  isKnownSearchIntent,
  isValidSearchDecision,
  canRunDerivativeSearch,
  buildSearchEvent,
  explainSearchBlockers
});
