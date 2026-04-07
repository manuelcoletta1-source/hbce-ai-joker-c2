/**
 * web-search.js
 * HBCE / AI JOKER-C2
 *
 * Fail-closed governed web-search scaffold.
 */

import core from "./corpus-core.js";
import { isKnownSearchIntent, buildSearchEvent } from "./search-spec.js";
import { isDerivativeLegitimate } from "./corpus-alien-code.js";

export const WEB_SEARCH_CONFIG = Object.freeze({
  name: "JOKER_C2_WEB_SEARCH_LAYER",
  classification: "IDENTITY_BOUND_GOVERNED_WEB_SEARCH",
  runtime_mode: "FAIL_CLOSED",
  sequence: core.RUNTIME_SEQUENCE
});

export function normalizeWebSearchRequest(input = {}) {
  return Object.freeze({
    query: typeof input.query === "string" ? input.query.trim() : "",
    identity: input.identity || null,
    intent: input.intent || "FACT_RETRIEVAL",
    derivative_context: input.derivative_context === true,
    evt_continuity: input.evt_continuity === true,
    verification_path: input.verification_path === true,
    policy_validation: input.policy_validation === true,
    runtime_authorization: input.runtime_authorization === true,
    valid_human_origin: input.valid_human_origin === true,
    valid_primary_ai_root: input.valid_primary_ai_root === true,
    evidence_production_path: input.evidence_production_path === true
  });
}

export function authorizeWebSearch(input = {}) {
  const req = normalizeWebSearchRequest(input);
  const reasons = [];

  if (!req.query) reasons.push("MISSING_QUERY");
  if (!req.identity?.ipr) reasons.push("MISSING_IDENTITY");
  if (!isKnownSearchIntent(req.intent)) reasons.push("INVALID_INTENT");
  if (!req.evt_continuity) reasons.push("CONTINUITY_MISSING");
  if (!req.verification_path) reasons.push("VERIFICATION_PATH_MISSING");
  if (!req.policy_validation) reasons.push("POLICY_BLOCKED");

  if (req.derivative_context) {
    const legit = isDerivativeLegitimate({
      valid_human_origin: req.valid_human_origin,
      valid_primary_ai_root: req.valid_primary_ai_root,
      identity_binding: true,
      policy_validation: req.policy_validation,
      runtime_authorization: req.runtime_authorization,
      evt_continuity: req.evt_continuity,
      evidence_production: req.evidence_production_path,
      verification: req.verification_path
    });

    if (!legit) reasons.push("DERIVATIVE_LEGITIMACY_FAILED");
  }

  return Object.freeze({
    authorized: reasons.length === 0,
    decision: reasons.length === 0 ? "ALLOW" : "BLOCK",
    reasons
  });
}

export function buildWebSearchEvt({
  evt,
  prev,
  t,
  query,
  derivative = false
}) {
  return buildSearchEvent({
    evt,
    prev,
    t,
    entity: derivative ? core.IDENTITY_LINEAGE.derived_root.entity : core.IDENTITY_LINEAGE.ai_root.entity,
    ipr: derivative ? core.IDENTITY_LINEAGE.derived_root.ipr : core.IDENTITY_LINEAGE.ai_root.ipr,
    query,
    decision: "ALLOW",
    state: "OPERATIONAL",
    derivative
  });
}

export default Object.freeze({
  WEB_SEARCH_CONFIG,
  normalizeWebSearchRequest,
  authorizeWebSearch,
  buildWebSearchEvt
});
