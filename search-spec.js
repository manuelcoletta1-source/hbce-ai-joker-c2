/**
 * search-spec.js
 * HBCE / AI JOKER-C2
 *
 * Governed search specification for identity-bound retrieval.
 */

import core from "./corpus-core.js";

export const SEARCH_SPEC = Object.freeze({
  name: "JOKER_C2_SEARCH_SPEC",
  classification: "IDENTITY_BOUND_GOVERNED_SEARCH_MODEL",
  sequence: core.RUNTIME_SEQUENCE,
  fail_closed: true
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

export const SEARCH_OUTPUTS = Object.freeze([
  "CONTROLLED_RESULT",
  "BLOCKED_RESULT",
  "ESCALATED_RESULT",
  "DEGRADED_RESULT"
]);

export function isKnownSearchIntent(intent) {
  return SEARCH_INTENT_CLASSES.includes(intent);
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
  const base = core.buildMinimumEvt({
    evt,
    prev,
    t,
    entity,
    ipr,
    kind: "SEARCH_OPERATION",
    state,
    decision
  });

  const output = {
    ...base,
    query
  };

  if (derivative) {
    output.derivative_ipr = core.IDENTITY_LINEAGE.derived_root.ipr;
    output.derivation_layer = core.BIOCYBERNETIC_DERIVATION_LAYER.code;
  }

  return Object.freeze(output);
}

export default Object.freeze({
  SEARCH_SPEC,
  SEARCH_INTENT_CLASSES,
  SEARCH_OUTPUTS,
  isKnownSearchIntent,
  buildSearchEvent
});
