/**
 * web-search.js
 * HBCE / AI JOKER-C2
 *
 * Governed web search layer scaffold for identity-bound, EVT-aware,
 * fail-closed, derivative-aware retrieval operations.
 */

import {
  IDENTITY_ROOTS,
  BIOCYBERNETIC_DERIVATION_LAYER,
  RUNTIME_SEQUENCE,
  FAIL_CLOSED_RULES
} from "./corpus-core.js";

import {
  SEARCH_SPEC,
  SEARCH_INPUT_MODEL,
  SEARCH_INTENT_CLASSES,
  SEARCH_POLICY_MODEL,
  SEARCH_RISK_MODEL,
  SEARCH_OUTPUT_MODEL,
  DERIVATIVE_SEARCH_MODEL,
  buildSearchEvent,
  explainSearchBlockers,
  canRunDerivativeSearch
} from "./search-spec.js";

export const WEB_SEARCH_CONFIG = Object.freeze({
  name: "JOKER_C2_WEB_SEARCH_LAYER",
  enabled: true,
  classification: "IDENTITY_BOUND_GOVERNED_WEB_SEARCH",
  runtime_mode: "FAIL_CLOSED",
  sequence: RUNTIME_SEQUENCE
});

export const WEB_SEARCH_DEFAULTS = Object.freeze({
  max_results: 8,
  timeout_ms: 12000,
  allow_derivative_context: true,
  require_verification_path: true,
  require_evt_continuity: true
});

export const WEB_SEARCH_SCOPES = Object.freeze([
  "GENERAL",
  "ARCHITECTURE",
  "PROTOCOL",
  "REGISTRY",
  "EVIDENCE",
  "NETWORK",
  "DERIVATIVE"
]);

export const WEB_SEARCH_ERROR_CODES = Object.freeze({
  MISSING_QUERY: "MISSING_QUERY",
  MISSING_IDENTITY: "MISSING_IDENTITY",
  INVALID_INTENT: "INVALID_INTENT",
  POLICY_BLOCKED: "POLICY_BLOCKED",
  RISK_BLOCKED: "RISK_BLOCKED",
  CONTINUITY_MISSING: "CONTINUITY_MISSING",
  VERIFICATION_PATH_MISSING: "VERIFICATION_PATH_MISSING",
  DERIVATIVE_LEGITIMACY_FAILED: "DERIVATIVE_LEGITIMACY_FAILED",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE"
});

export function normalizeWebSearchRequest(input = {}) {
  return Object.freeze({
    query: typeof input.query === "string" ? input.query.trim() : "",
    identity: input.identity || null,
    session_id: input.session_id || null,
    scope: input.scope || "GENERAL",
    intent: input.intent || "FACT_RETRIEVAL",
    derivative_context: input.derivative_context === true,
    continuity_ref: input.continuity_ref || null,
    verification_path: input.verification_path === true,
    evt_continuity: input.evt_continuity === true,
    policy_validation: input.policy_validation === true,
    runtime_authorization: input.runtime_authorization === true,
    valid_human_origin: input.valid_human_origin === true,
    valid_primary_ai_root: input.valid_primary_ai_root === true,
    evidence_production_path: input.evidence_production_path === true,
    scope_compatibility:
      input.scope_compatibility === undefined ? true : input.scope_compatibility === true,
    max_results:
      Number.isInteger(input.max_results) && input.max_results > 0
        ? input.max_results
        : WEB_SEARCH_DEFAULTS.max_results
  });
}

export function validateWebSearchRequest(request = {}) {
  const errors = [];

  if (!request.query) {
    errors.push(WEB_SEARCH_ERROR_CODES.MISSING_QUERY);
  }

  if (!request.identity || !request.identity.ipr) {
    errors.push(WEB_SEARCH_ERROR_CODES.MISSING_IDENTITY);
  }

  if (!SEARCH_INTENT_CLASSES.includes(request.intent)) {
    errors.push(WEB_SEARCH_ERROR_CODES.INVALID_INTENT);
  }

  if (!WEB_SEARCH_SCOPES.includes(request.scope)) {
    errors.push("INVALID_SCOPE");
  }

  if (WEB_SEARCH_DEFAULTS.require_evt_continuity && request.evt_continuity !== true) {
    errors.push(WEB_SEARCH_ERROR_CODES.CONTINUITY_MISSING);
  }

  if (WEB_SEARCH_DEFAULTS.require_verification_path && request.verification_path !== true) {
    errors.push(WEB_SEARCH_ERROR_CODES.VERIFICATION_PATH_MISSING);
  }

  if (request.policy_validation !== true) {
    errors.push(WEB_SEARCH_ERROR_CODES.POLICY_BLOCKED);
  }

  if (request.derivative_context === true && !canRunDerivativeSearch(request)) {
    errors.push(WEB_SEARCH_ERROR_CODES.DERIVATIVE_LEGITIMACY_FAILED);
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors
  });
}

export function classifyWebSearchRisk(request = {}) {
  const triggers = [];

  if (!request.identity?.ipr) triggers.push("MISSING_IDENTITY");
  if (!request.scope_compatibility) triggers.push("INVALID_SCOPE");
  if (!request.evt_continuity) triggers.push("BROKEN_CONTINUITY");
  if (!request.verification_path) triggers.push("UNVERIFIABLE_RESULT_PATH");

  if (request.derivative_context === true && !canRunDerivativeSearch(request)) {
    triggers.push("UNSUPPORTED_DERIVATIVE_CONTEXT");
  }

  let level = "LOW";
  if (triggers.length >= 1) level = "MEDIUM";
  if (triggers.length >= 2) level = "HIGH";
  if (triggers.length >= 4) level = "CRITICAL";

  return Object.freeze({
    level,
    triggers
  });
}

export function authorizeWebSearch(request = {}) {
  const validation = validateWebSearchRequest(request);
  if (!validation.valid) {
    return Object.freeze({
      authorized: false,
      decision: "BLOCK",
      reason: validation.errors
    });
  }

  const risk = classifyWebSearchRisk(request);
  if (risk.level === "HIGH" || risk.level === "CRITICAL") {
    return Object.freeze({
      authorized: false,
      decision: "BLOCK",
      reason: risk.triggers.length ? risk.triggers : [WEB_SEARCH_ERROR_CODES.RISK_BLOCKED]
    });
  }

  return Object.freeze({
    authorized: true,
    decision: "ALLOW",
    reason: []
  });
}

export function buildWebSearchContext(input = {}) {
  const request = normalizeWebSearchRequest(input);
  const blockers = explainSearchBlockers(request);
  const authorization = authorizeWebSearch(request);
  const risk = classifyWebSearchRisk(request);

  return Object.freeze({
    config: WEB_SEARCH_CONFIG,
    defaults: WEB_SEARCH_DEFAULTS,
    request,
    blockers,
    authorization,
    risk
  });
}

export async function runGovernedWebSearch(input = {}, provider = async () => []) {
  const context = buildWebSearchContext(input);

  if (!context.authorization.authorized) {
    return Object.freeze({
      ok: false,
      state: "BLOCKED",
      output: "BLOCKED_RESULT",
      decision: "BLOCK",
      reason: context.authorization.reason,
      results: []
    });
  }

  let results;
  try {
    results = await provider({
      query: context.request.query,
      scope: context.request.scope,
      intent: context.request.intent,
      max_results: context.request.max_results
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      state: "DEGRADED",
      output: "DEGRADED_RESULT",
      decision: "ESCALATE",
      reason: [WEB_SEARCH_ERROR_CODES.PROVIDER_UNAVAILABLE],
      error: error instanceof Error ? error.message : String(error),
      results: []
    });
  }

  return Object.freeze({
    ok: true,
    state: "OPERATIONAL",
    output: "CONTROLLED_RESULT",
    decision: "ALLOW",
    reason: [],
    results: Array.isArray(results) ? results.slice(0, context.request.max_results) : []
  });
}

export function buildWebSearchEvt({
  evt,
  prev,
  t,
  query,
  decision = "ALLOW",
  state = "OPERATIONAL",
  derivative = false
}) {
  return buildSearchEvent({
    evt,
    prev,
    t,
    entity: derivative ? IDENTITY_ROOTS.derived_root.entity : IDENTITY_ROOTS.ai_root.entity,
    ipr: derivative ? IDENTITY_ROOTS.derived_root.ipr : IDENTITY_ROOTS.ai_root.ipr,
    query,
    decision,
    state,
    derivative
  });
}

export function getWebSearchProtocolProfile() {
  return Object.freeze({
    search_spec: SEARCH_SPEC.name,
    input_model: SEARCH_INPUT_MODEL.required_fields,
    policy_checks: SEARCH_POLICY_MODEL.checks,
    risk_triggers: SEARCH_RISK_MODEL.triggers,
    output_model: SEARCH_OUTPUT_MODEL.valid_outputs,
    derivative_model: DERIVATIVE_SEARCH_MODEL.current_derivative,
    fail_closed_rules: FAIL_CLOSED_RULES
  });
}

export default Object.freeze({
  WEB_SEARCH_CONFIG,
  WEB_SEARCH_DEFAULTS,
  WEB_SEARCH_SCOPES,
  WEB_SEARCH_ERROR_CODES,
  normalizeWebSearchRequest,
  validateWebSearchRequest,
  classifyWebSearchRisk,
  authorizeWebSearch,
  buildWebSearchContext,
  runGovernedWebSearch,
  buildWebSearchEvt,
  getWebSearchProtocolProfile,
  BIOCYBERNETIC_DERIVATION_LAYER,
  IDENTITY_ROOTS
});
