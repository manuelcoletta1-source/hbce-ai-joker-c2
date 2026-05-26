/**
 * HBCE / JOKER-C2 Runtime Model Router
 *
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 *
 * Project: Project HBCE R&D Transfer SaaS
 * Release target: SaaS Core v0.1
 * Source event: UP-EVT-0016 / UP-EVT-0016-AI
 * Source event date: 2026-05-25T15:30:00+02:00
 * Target checkpoint: 2026-06-19T15:30:00+02:00
 *
 * This file routes JOKER-C2 requests to the correct model level.
 * The router does not grant authorization. It only selects a model
 * after SaaS tier, risk, proof and C2 boundary policy have been evaluated.
 */

import {
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  getSaasTierDefinition,
  type C2BoundaryState,
  type CyberRelevance,
  type ModelLevel,
  type OperationalValueLevel,
  type ProofRequirement,
  type RuntimeModelRoutingInput,
  type RuntimeModelRoutingResult,
  type RuntimeRiskLevel,
  type SaasTier,
  type SaasTierPolicyResult
} from "./saas-tier-types";

export type RuntimeModelConfig = {
  defaultModel: string;
  standardModel: string;
  enhancedModel: string;
  advancedModel: string;
  c2Model: string;
};

export type RuntimeModelRouterHealth = {
  configured: true;
  project: string;
  targetRelease: string;
  defaultModel: string;
  standardModel: string;
  enhancedModel: string;
  advancedModel: string;
  c2Model: string;
  availableModelLevels: ModelLevel[];
  c2EscalationRestricted: true;
  legalCertification: false;
  boundary: string;
};

export type RuntimeModelRouterDecisionFrame = {
  project: string;
  targetRelease: string;
  tier: SaasTier;
  modelLevel: ModelLevel;
  selectedModel: string;
  routingReason: string;
  riskLevel: RuntimeRiskLevel;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  proofRequirement: ProofRequirement;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  blocked: boolean;
  legalCertification: false;
  boundary: string;
};

export const DEFAULT_RUNTIME_MODEL_CONFIG: RuntimeModelConfig = {
  defaultModel: "gpt-4o-mini",
  standardModel: "gpt-4o-mini",
  enhancedModel: "gpt-4o",
  advancedModel: "gpt-5.5-thinking",
  c2Model: "gpt-5.5-thinking"
};

export const MODEL_LEVEL_ORDER: Record<ModelLevel, number> = {
  STANDARD: 0,
  ENHANCED: 1,
  ADVANCED: 2,
  C2_ESCALATED: 3,
  BLOCKED: -1
};

export function normalizeModelName(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

export function normalizeRuntimeModelConfig(
  input: Partial<RuntimeModelConfig> = {}
): RuntimeModelConfig {
  const defaultModel = normalizeModelName(
    input.defaultModel,
    DEFAULT_RUNTIME_MODEL_CONFIG.defaultModel
  );

  return {
    defaultModel,
    standardModel: normalizeModelName(
      input.standardModel,
      input.defaultModel ?? DEFAULT_RUNTIME_MODEL_CONFIG.standardModel
    ),
    enhancedModel: normalizeModelName(
      input.enhancedModel,
      input.standardModel ??
        input.defaultModel ??
        DEFAULT_RUNTIME_MODEL_CONFIG.enhancedModel
    ),
    advancedModel: normalizeModelName(
      input.advancedModel,
      input.enhancedModel ??
        input.standardModel ??
        input.defaultModel ??
        DEFAULT_RUNTIME_MODEL_CONFIG.advancedModel
    ),
    c2Model: normalizeModelName(
      input.c2Model,
      input.advancedModel ??
        input.enhancedModel ??
        input.standardModel ??
        input.defaultModel ??
        DEFAULT_RUNTIME_MODEL_CONFIG.c2Model
    )
  };
}

export function normalizeRuntimeModelRoutingInput(
  input: RuntimeModelRoutingInput
): RuntimeModelRoutingInput {
  return {
    tier: input.tier,
    requestedModel: input.requestedModel,
    standardModel: input.standardModel,
    enhancedModel: input.enhancedModel,
    advancedModel: input.advancedModel,
    c2Model: input.c2Model,
    riskLevel: input.riskLevel,
    operationalValue: input.operationalValue,
    cyberRelevance: input.cyberRelevance,
    c2Boundary: input.c2Boundary,
    proofRequirement: input.proofRequirement,
    auditRequired: input.auditRequired
  };
}

export function isC2BoundaryAuthorized(boundary: C2BoundaryState): boolean {
  return boundary === "C2_AUTHORIZED_DEFENSIVE_ONLY";
}

export function isC2BoundaryBlocked(boundary: C2BoundaryState): boolean {
  return (
    boundary === "BLOCKED_HARMFUL_CYBER" ||
    boundary === "UNAUTHORIZED_OR_UNCLEAR" ||
    boundary === "C2_BLOCKED_UNAUTHORIZED" ||
    boundary === "C2_FAIL_CLOSED"
  );
}

export function isCyberEscalationRequested(input: {
  tier: SaasTier;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
}): boolean {
  return (
    input.tier === "C2_DEFENSE" ||
    input.tier === "STRATEGIC" ||
    input.cyberRelevance === "C2_RELEVANT" ||
    input.c2Boundary === "C2_AUTHORIZED_DEFENSIVE_ONLY"
  );
}

export function deriveRequestedModelLevel(input: {
  tier: SaasTier;
  riskLevel: RuntimeRiskLevel;
  operationalValue: OperationalValueLevel;
  proofRequirement: ProofRequirement;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  auditRequired: boolean;
}): ModelLevel {
  if (input.riskLevel === "BLOCKED" || isC2BoundaryBlocked(input.c2Boundary)) {
    return "BLOCKED";
  }

  if (
    input.cyberRelevance === "BLOCKED" ||
    input.c2Boundary === "BLOCKED_HARMFUL_CYBER"
  ) {
    return "BLOCKED";
  }

  if (
    isCyberEscalationRequested(input) &&
    isC2BoundaryAuthorized(input.c2Boundary)
  ) {
    return "C2_ESCALATED";
  }

  if (
    input.tier === "STRATEGIC" &&
    input.cyberRelevance !== "C2_RELEVANT" &&
    !isC2BoundaryBlocked(input.c2Boundary)
  ) {
    return "ADVANCED";
  }

  if (input.tier === "GOVERNANCE") {
    return "ADVANCED";
  }

  if (input.tier === "PRO") {
    if (
      input.operationalValue === "HIGH" ||
      input.operationalValue === "CRITICAL" ||
      input.riskLevel === "HIGH" ||
      input.riskLevel === "CRITICAL" ||
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT" ||
      input.auditRequired
    ) {
      return "ADVANCED";
    }

    return "ENHANCED";
  }

  if (input.tier === "IPR") {
    if (
      input.operationalValue === "HIGH" ||
      input.riskLevel === "HIGH" ||
      input.proofRequirement === "EVT_OPC" ||
      input.auditRequired
    ) {
      return "ENHANCED";
    }

    return "STANDARD";
  }

  return "STANDARD";
}

export function clampModelLevelToTier(input: {
  requestedLevel: ModelLevel;
  tier: SaasTier;
  c2Boundary: C2BoundaryState;
}): ModelLevel {
  if (input.requestedLevel === "BLOCKED") {
    return "BLOCKED";
  }

  const tierDefinition = getSaasTierDefinition(input.tier);

  if (
    input.requestedLevel === "C2_ESCALATED" &&
    !isC2BoundaryAuthorized(input.c2Boundary)
  ) {
    return "BLOCKED";
  }

  if (tierDefinition.allowedModelLevels.includes(input.requestedLevel)) {
    return input.requestedLevel;
  }

  const allowedLevels = tierDefinition.allowedModelLevels
    .filter((level) => level !== "BLOCKED")
    .sort((left, right) => MODEL_LEVEL_ORDER[right] - MODEL_LEVEL_ORDER[left]);

  const requestedOrder = MODEL_LEVEL_ORDER[input.requestedLevel];

  const closestAllowed = allowedLevels.find(
    (level) => MODEL_LEVEL_ORDER[level] <= requestedOrder
  );

  return closestAllowed ?? tierDefinition.defaultModelLevel;
}

export function selectModelForLevel(
  level: ModelLevel,
  config: RuntimeModelConfig
): string {
  if (level === "BLOCKED") {
    return "BLOCKED";
  }

  if (level === "C2_ESCALATED") {
    return config.c2Model;
  }

  if (level === "ADVANCED") {
    return config.advancedModel;
  }

  if (level === "ENHANCED") {
    return config.enhancedModel;
  }

  return config.standardModel || config.defaultModel;
}

export function buildModelRoutingReason(input: {
  tier: SaasTier;
  requestedLevel: ModelLevel;
  finalLevel: ModelLevel;
  riskLevel: RuntimeRiskLevel;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  proofRequirement: ProofRequirement;
  auditRequired: boolean;
}): string {
  if (input.finalLevel === "BLOCKED") {
    return `Model routing blocked. Tier: ${input.tier}. Risk: ${input.riskLevel}. Cyber relevance: ${input.cyberRelevance}. C2 boundary: ${input.c2Boundary}.`;
  }

  if (input.finalLevel === "C2_ESCALATED") {
    return `C2 model escalation selected because tier ${input.tier} is authorized for defensive C2 use under boundary ${input.c2Boundary}. EVT and OPC audit are mandatory.`;
  }

  if (input.finalLevel === "ADVANCED") {
    return `Advanced model selected for tier ${input.tier} with operational value ${input.operationalValue}, risk ${input.riskLevel}, proof requirement ${input.proofRequirement} and auditRequired=${input.auditRequired}.`;
  }

  if (input.finalLevel === "ENHANCED") {
    return `Enhanced model selected for verified operational work under tier ${input.tier}.`;
  }

  if (input.requestedLevel !== input.finalLevel) {
    return `Standard model selected after tier clamp. Requested level ${input.requestedLevel} is not available under tier ${input.tier}.`;
  }

  return `Standard model selected for low-risk or ordinary request under tier ${input.tier}.`;
}

export function routeRuntimeModel(
  rawInput: RuntimeModelRoutingInput
): RuntimeModelRoutingResult {
  const input = normalizeRuntimeModelRoutingInput(rawInput);

  const config = normalizeRuntimeModelConfig({
    defaultModel: input.standardModel,
    standardModel: input.standardModel,
    enhancedModel: input.enhancedModel,
    advancedModel: input.advancedModel,
    c2Model: input.c2Model
  });

  const requestedLevel = deriveRequestedModelLevel({
    tier: input.tier,
    riskLevel: input.riskLevel,
    operationalValue: input.operationalValue,
    proofRequirement: input.proofRequirement,
    cyberRelevance: input.cyberRelevance,
    c2Boundary: input.c2Boundary,
    auditRequired: input.auditRequired
  });

  const finalLevel = clampModelLevelToTier({
    requestedLevel,
    tier: input.tier,
    c2Boundary: input.c2Boundary
  });

  const selectedModel =
    finalLevel === "BLOCKED"
      ? "BLOCKED"
      : normalizeModelName(input.requestedModel, selectModelForLevel(finalLevel, config));

  const blocked =
    finalLevel === "BLOCKED" ||
    selectedModel === "BLOCKED" ||
    input.riskLevel === "BLOCKED" ||
    isC2BoundaryBlocked(input.c2Boundary);

  const routingReason = buildModelRoutingReason({
    tier: input.tier,
    requestedLevel,
    finalLevel,
    riskLevel: input.riskLevel,
    operationalValue: input.operationalValue,
    cyberRelevance: input.cyberRelevance,
    c2Boundary: input.c2Boundary,
    proofRequirement: input.proofRequirement,
    auditRequired: input.auditRequired
  });

  return {
    selectedModel: blocked ? "BLOCKED" : selectedModel,
    modelLevel: blocked ? "BLOCKED" : finalLevel,
    routingReason,
    tier: input.tier,
    riskLevel: input.riskLevel,
    cyberRelevance: input.cyberRelevance,
    c2Boundary: input.c2Boundary,
    evtRequired:
      input.proofRequirement === "EVT" ||
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT" ||
      input.auditRequired ||
      input.tier === "GOVERNANCE" ||
      input.tier === "C2_DEFENSE" ||
      input.tier === "STRATEGIC",
    opcRequired:
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT" ||
      input.tier === "GOVERNANCE" ||
      input.tier === "C2_DEFENSE" ||
      input.tier === "STRATEGIC",
    auditRequired:
      input.auditRequired ||
      input.proofRequirement === "MANDATORY_AUDIT" ||
      input.tier === "PRO" ||
      input.tier === "GOVERNANCE" ||
      input.tier === "C2_DEFENSE" ||
      input.tier === "STRATEGIC",
    blocked
  };
}

export function routeRuntimeModelFromSaasPolicy(
  policy: SaasTierPolicyResult,
  config: Partial<RuntimeModelConfig> = {}
): RuntimeModelRoutingResult {
  const normalizedConfig = normalizeRuntimeModelConfig(config);

  return routeRuntimeModel({
    tier: policy.tier,
    standardModel: normalizedConfig.standardModel,
    enhancedModel: normalizedConfig.enhancedModel,
    advancedModel: normalizedConfig.advancedModel,
    c2Model: normalizedConfig.c2Model,
    riskLevel: policy.riskLevel,
    operationalValue:
      policy.riskLevel === "CRITICAL"
        ? "CRITICAL"
        : policy.riskLevel === "HIGH"
          ? "HIGH"
          : policy.riskLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
    cyberRelevance: policy.cyberRelevance,
    c2Boundary: policy.cyberBoundary,
    proofRequirement:
      policy.opcRequired && policy.auditRequired
        ? "MANDATORY_AUDIT"
        : policy.opcRequired
          ? "EVT_OPC"
          : policy.evtRequired
            ? "EVT"
            : "NONE",
    auditRequired: policy.auditRequired
  });
}

export function buildRuntimeModelPromptFrame(
  routing: RuntimeModelRoutingResult
): string {
  return [
    "HBCE Runtime Model Router",
    `Tier: ${routing.tier}`,
    `Selected model: ${routing.selectedModel}`,
    `Model level: ${routing.modelLevel}`,
    `Risk level: ${routing.riskLevel}`,
    `Cyber relevance: ${routing.cyberRelevance}`,
    `C2 boundary: ${routing.c2Boundary}`,
    `EVT required: ${routing.evtRequired}`,
    `OPC required: ${routing.opcRequired}`,
    `Audit required: ${routing.auditRequired}`,
    `Blocked: ${routing.blocked}`,
    `Reason: ${routing.routingReason}`,
    `Boundary: model escalation does not bypass policy. ${RUNTIME_BOUNDARY_SUMMARY.opc}. legalCertification = false.`
  ].join("\n");
}

export function toRuntimeModelDecisionFrame(
  routing: RuntimeModelRoutingResult,
  proofRequirement: ProofRequirement = "NONE"
): RuntimeModelRouterDecisionFrame {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    tier: routing.tier,
    modelLevel: routing.modelLevel,
    selectedModel: routing.selectedModel,
    routingReason: routing.routingReason,
    riskLevel: routing.riskLevel,
    operationalValue:
      routing.riskLevel === "CRITICAL"
        ? "CRITICAL"
        : routing.riskLevel === "HIGH"
          ? "HIGH"
          : routing.riskLevel === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
    cyberRelevance: routing.cyberRelevance,
    c2Boundary: routing.c2Boundary,
    proofRequirement,
    evtRequired: routing.evtRequired,
    opcRequired: routing.opcRequired,
    auditRequired: routing.auditRequired,
    blocked: routing.blocked,
    legalCertification: false,
    boundary:
      "Model escalation follows SaaS tier, risk, proof and C2 boundary policy. It does not grant authorization by itself."
  };
}

export function toPublicRuntimeModelRoutingResult(
  routing: RuntimeModelRoutingResult
): {
  selectedModel: string;
  modelLevel: ModelLevel;
  routingReason: string;
  tier: SaasTier;
  riskLevel: RuntimeRiskLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  blocked: boolean;
  legalCertification: false;
  boundary: string;
} {
  return {
    selectedModel: routing.selectedModel,
    modelLevel: routing.modelLevel,
    routingReason: routing.routingReason,
    tier: routing.tier,
    riskLevel: routing.riskLevel,
    cyberRelevance: routing.cyberRelevance,
    c2Boundary: routing.c2Boundary,
    evtRequired: routing.evtRequired,
    opcRequired: routing.opcRequired,
    auditRequired: routing.auditRequired,
    blocked: routing.blocked,
    legalCertification: false,
    boundary:
      "Runtime model routing is governed by SaaS tier policy. C2 escalation is restricted to authorized defensive cyber use."
  };
}

export function getRuntimeModelRouterHealth(
  config: Partial<RuntimeModelConfig> = {}
): RuntimeModelRouterHealth {
  const normalizedConfig = normalizeRuntimeModelConfig(config);

  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    defaultModel: normalizedConfig.defaultModel,
    standardModel: normalizedConfig.standardModel,
    enhancedModel: normalizedConfig.enhancedModel,
    advancedModel: normalizedConfig.advancedModel,
    c2Model: normalizedConfig.c2Model,
    availableModelLevels: [
      "STANDARD",
      "ENHANCED",
      "ADVANCED",
      "C2_ESCALATED",
      "BLOCKED"
    ],
    c2EscalationRestricted: true,
    legalCertification: false,
    boundary:
      "Runtime model router is configured. C2 escalation is restricted to authorized defensive cyber use. Model escalation does not bypass governance."
  };
}

export function createBlockedModelRoutingResult(reason: string): RuntimeModelRoutingResult {
  return {
    selectedModel: "BLOCKED",
    modelLevel: "BLOCKED",
    routingReason: reason,
    tier: "BASE",
    riskLevel: "BLOCKED",
    cyberRelevance: "BLOCKED",
    c2Boundary: "UNAUTHORIZED_OR_UNCLEAR",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    blocked: true
  };
}
