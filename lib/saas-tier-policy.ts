/**
 * HBCE / JOKER-C2 SaaS Tier Policy
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
 * This file evaluates the SaaS tier policy for JOKER-C2.
 * It converts IPR state, organization state, workspace state, requested tier,
 * cyber relevance, operational value, proof requirements and persistence state
 * into a structured runtime decision.
 */

import {
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  SAAS_TIER_DEFINITIONS,
  getDefaultPersistenceMode,
  getDefaultUpgradePath,
  getPersistenceBoundary,
  getTierBoundary,
  isSaasTier,
  type BillingMode,
  type C2BoundaryState,
  type CyberRelevance,
  type IdentityState,
  type ModelLevel,
  type OperationalValueLevel,
  type OrganizationState,
  type ProofRequirement,
  type RuntimeAuditState,
  type RuntimeContextClass,
  type RuntimeDataClassification,
  type RuntimeDecision,
  type RuntimeMemoryAuthority,
  type RuntimeMemoryScope,
  type RuntimePersistenceMode,
  type RuntimeRiskLevel,
  type SaasTier,
  type SaasTierDefinition,
  type SaasTierPolicyInput,
  type SaasTierPolicyResult,
  type WorkspaceState
} from "./saas-tier-types";

type NormalizedSaasTierPolicyInput = {
  requestedTier?: SaasTier;
  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;
  billingMode: BillingMode;
  certificateActive: boolean;
  hasAuthorizedPerimeter: boolean;
  defensivePurpose: boolean;
  cyberRelevance: CyberRelevance;
  contextClass: RuntimeContextClass;
  dataClassification: RuntimeDataClassification;
  operationalValue: OperationalValueLevel;
  proofRequirement: ProofRequirement;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
};

type TierRequirementEvaluation = {
  allowed: boolean;
  decision: RuntimeDecision;
  reason: string;
  cyberBoundary: C2BoundaryState;
};

const VERIFIED_IDENTITY_STATES: IdentityState[] = [
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "IPR_VERIFIED_ORGANIZATION",
  "IPR_VERIFIED_WORKSPACE",
  "C2_DEFENSE_AUTHORIZED"
];

const VERIFIED_ORGANIZATION_STATES: OrganizationState[] = [
  "IPR_VERIFIED_ORGANIZATION",
  "ACTIVE"
];

const ACTIVE_WORKSPACE_STATES: WorkspaceState[] = ["ACTIVE"];

const CONTRACTUAL_BILLING_MODES: BillingMode[] = [
  "PILOT_CONTRACT",
  "STRATEGIC_CONTRACT"
];

export const DEFAULT_SAAS_TIER_POLICY_INPUT: NormalizedSaasTierPolicyInput = {
  requestedTier: undefined,
  identityState: "NOT_VERIFIED",
  organizationState: "NOT_REQUIRED",
  workspaceState: "NOT_REQUIRED",
  billingMode: "FREE",
  certificateActive: false,
  hasAuthorizedPerimeter: false,
  defensivePurpose: false,
  cyberRelevance: "NONE",
  contextClass: "GENERAL",
  dataClassification: "NOT_APPLICABLE",
  operationalValue: "LOW",
  proofRequirement: "NONE",
  databaseConfigured: false,
  databaseAvailable: false
};

export function normalizeSaasTierPolicyInput(
  input: SaasTierPolicyInput = {}
): NormalizedSaasTierPolicyInput {
  const requestedTier = isSaasTier(input.requestedTier)
    ? input.requestedTier
    : undefined;

  const identityState = input.identityState ?? "NOT_VERIFIED";
  const identityLooksVerified = VERIFIED_IDENTITY_STATES.includes(identityState);

  return {
    requestedTier,
    identityState,
    organizationState: input.organizationState ?? "NOT_REQUIRED",
    workspaceState: input.workspaceState ?? "NOT_REQUIRED",
    billingMode: input.billingMode ?? "FREE",
    certificateActive: input.certificateActive ?? identityLooksVerified,
    hasAuthorizedPerimeter: input.hasAuthorizedPerimeter ?? false,
    defensivePurpose: input.defensivePurpose ?? false,
    cyberRelevance: input.cyberRelevance ?? "NONE",
    contextClass: input.contextClass ?? "GENERAL",
    dataClassification: input.dataClassification ?? "NOT_APPLICABLE",
    operationalValue: input.operationalValue ?? "LOW",
    proofRequirement: input.proofRequirement ?? "NONE",
    databaseConfigured: input.databaseConfigured ?? false,
    databaseAvailable: input.databaseAvailable ?? false
  };
}

export function hasVerifiedIpr(input: NormalizedSaasTierPolicyInput): boolean {
  return (
    input.certificateActive &&
    VERIFIED_IDENTITY_STATES.includes(input.identityState)
  );
}

export function hasVerifiedOrganization(
  input: NormalizedSaasTierPolicyInput
): boolean {
  return (
    VERIFIED_ORGANIZATION_STATES.includes(input.organizationState) ||
    input.identityState === "IPR_VERIFIED_ORGANIZATION" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function hasActiveWorkspace(input: NormalizedSaasTierPolicyInput): boolean {
  return (
    ACTIVE_WORKSPACE_STATES.includes(input.workspaceState) ||
    input.identityState === "IPR_VERIFIED_WORKSPACE" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function hasStrategicAuthorization(
  input: NormalizedSaasTierPolicyInput
): boolean {
  return (
    hasVerifiedIpr(input) &&
    hasVerifiedOrganization(input) &&
    hasActiveWorkspace(input) &&
    CONTRACTUAL_BILLING_MODES.includes(input.billingMode)
  );
}

export function hasC2DefenseAuthorization(
  input: NormalizedSaasTierPolicyInput
): boolean {
  return (
    hasVerifiedIpr(input) &&
    hasVerifiedOrganization(input) &&
    hasActiveWorkspace(input) &&
    input.hasAuthorizedPerimeter &&
    input.defensivePurpose &&
    (input.identityState === "C2_DEFENSE_AUTHORIZED" ||
      input.requestedTier === "C2_DEFENSE" ||
      input.requestedTier === "STRATEGIC")
  );
}

export function isCyberBlocked(input: NormalizedSaasTierPolicyInput): boolean {
  return input.cyberRelevance === "BLOCKED";
}

export function isC2Relevant(input: NormalizedSaasTierPolicyInput): boolean {
  return (
    input.cyberRelevance === "C2_RELEVANT" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC"
  );
}

export function deriveSaasTier(input: NormalizedSaasTierPolicyInput): SaasTier {
  if (input.requestedTier) {
    return input.requestedTier;
  }

  if (input.cyberRelevance === "C2_RELEVANT") {
    return hasC2DefenseAuthorization(input) ? "C2_DEFENSE" : "PRO";
  }

  if (hasStrategicAuthorization(input)) {
    return "STRATEGIC";
  }

  if (hasVerifiedOrganization(input) && hasActiveWorkspace(input)) {
    return "GOVERNANCE";
  }

  if (
    hasVerifiedIpr(input) &&
    (input.operationalValue === "HIGH" ||
      input.operationalValue === "CRITICAL" ||
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT")
  ) {
    return "PRO";
  }

  if (hasVerifiedIpr(input)) {
    return "IPR";
  }

  return "BASE";
}

export function deriveRuntimeRiskLevel(
  input: NormalizedSaasTierPolicyInput,
  tier: SaasTier
): RuntimeRiskLevel {
  if (isCyberBlocked(input)) {
    return "BLOCKED";
  }

  if (input.cyberRelevance === "C2_RELEVANT") {
    return "CRITICAL";
  }

  if (tier === "C2_DEFENSE" || tier === "STRATEGIC") {
    return "HIGH";
  }

  if (
    input.dataClassification === "RESTRICTED" ||
    input.operationalValue === "CRITICAL" ||
    input.proofRequirement === "MANDATORY_AUDIT"
  ) {
    return "CRITICAL";
  }

  if (
    input.dataClassification === "SENSITIVE" ||
    input.operationalValue === "HIGH" ||
    input.proofRequirement === "EVT_OPC" ||
    input.contextClass === "CYBER_DEFENSE"
  ) {
    return "HIGH";
  }

  if (
    input.dataClassification === "OPERATIONAL" ||
    input.operationalValue === "MEDIUM" ||
    input.proofRequirement === "EVT" ||
    input.cyberRelevance === "DEFENSIVE" ||
    input.cyberRelevance === "GENERAL"
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function deriveC2BoundaryState(
  input: NormalizedSaasTierPolicyInput,
  tier: SaasTier
): C2BoundaryState {
  if (input.cyberRelevance === "BLOCKED") {
    return "BLOCKED_HARMFUL_CYBER";
  }

  if (tier !== "C2_DEFENSE" && tier !== "STRATEGIC") {
    if (input.cyberRelevance === "C2_RELEVANT") {
      if (!hasVerifiedIpr(input)) {
        return "C2_REQUIRES_VERIFICATION";
      }

      if (!hasVerifiedOrganization(input)) {
        return "C2_REQUIRES_ORGANIZATION";
      }

      if (!input.hasAuthorizedPerimeter || !input.defensivePurpose) {
        return "C2_REQUIRES_AUTHORIZED_PERIMETER";
      }

      return "UNAUTHORIZED_OR_UNCLEAR";
    }

    return "C2_NOT_AVAILABLE";
  }

  if (!hasVerifiedIpr(input)) {
    return "C2_REQUIRES_VERIFICATION";
  }

  if (!hasVerifiedOrganization(input) || !hasActiveWorkspace(input)) {
    return "C2_REQUIRES_ORGANIZATION";
  }

  if (!input.hasAuthorizedPerimeter || !input.defensivePurpose) {
    return "C2_REQUIRES_AUTHORIZED_PERIMETER";
  }

  if (hasC2DefenseAuthorization(input) || hasStrategicAuthorization(input)) {
    return "C2_AUTHORIZED_DEFENSIVE_ONLY";
  }

  return "C2_FAIL_CLOSED";
}

export function deriveRuntimeAuditState(
  tier: SaasTier,
  riskLevel: RuntimeRiskLevel,
  proofRequirement: ProofRequirement,
  allowed: boolean
): RuntimeAuditState {
  if (!allowed && riskLevel === "BLOCKED") {
    return "BLOCKED";
  }

  if (!allowed) {
    return "FAIL_CLOSED";
  }

  if (
    tier === "C2_DEFENSE" ||
    tier === "STRATEGIC" ||
    proofRequirement === "MANDATORY_AUDIT"
  ) {
    return "MANDATORY";
  }

  if (
    tier === "GOVERNANCE" ||
    tier === "PRO" ||
    proofRequirement === "EVT_OPC" ||
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL"
  ) {
    return "REQUIRED";
  }

  if (tier === "IPR" || proofRequirement === "EVT" || riskLevel === "MEDIUM") {
    return "ENABLED";
  }

  return "NOT_REQUIRED";
}

export function deriveMemoryAuthority(
  input: NormalizedSaasTierPolicyInput,
  allowed: boolean
): RuntimeMemoryAuthority {
  if (!allowed) {
    return "RUNTIME_ONLY";
  }

  if (hasActiveWorkspace(input)) {
    return "WORKSPACE_AUTHORIZED";
  }

  if (input.databaseConfigured && input.databaseAvailable) {
    return "DATABASE_VALIDATED";
  }

  if (hasVerifiedIpr(input)) {
    return "SERVER_RUNTIME_VALIDATED";
  }

  if (input.identityState === "CLIENT_TRANSPORT_ONLY") {
    return "CLIENT_TRANSPORT_ONLY";
  }

  return "RUNTIME_ONLY";
}

export function deriveMemoryScope(
  tierDefinition: SaasTierDefinition,
  allowed: boolean
): RuntimeMemoryScope {
  if (!allowed) {
    return "RUNTIME_ONLY";
  }

  return tierDefinition.defaultMemoryScope;
}

export function deriveModelLevel(
  input: NormalizedSaasTierPolicyInput,
  tier: SaasTier,
  riskLevel: RuntimeRiskLevel,
  allowed: boolean
): ModelLevel {
  if (!allowed || riskLevel === "BLOCKED") {
    return "BLOCKED";
  }

  if (tier === "BASE") {
    return "STANDARD";
  }

  if (tier === "IPR") {
    if (
      input.operationalValue === "HIGH" ||
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT"
    ) {
      return "ENHANCED";
    }

    return "STANDARD";
  }

  if (tier === "PRO") {
    if (
      input.operationalValue === "HIGH" ||
      input.operationalValue === "CRITICAL" ||
      input.proofRequirement === "EVT_OPC" ||
      input.proofRequirement === "MANDATORY_AUDIT"
    ) {
      return "ADVANCED";
    }

    return "ENHANCED";
  }

  if (tier === "GOVERNANCE") {
    return "ADVANCED";
  }

  if (tier === "C2_DEFENSE") {
    return "C2_ESCALATED";
  }

  if (tier === "STRATEGIC") {
    return input.cyberRelevance === "C2_RELEVANT" ? "C2_ESCALATED" : "ADVANCED";
  }

  return "STANDARD";
}

export function deriveTierRequirements(
  input: NormalizedSaasTierPolicyInput,
  tier: SaasTier,
  persistenceMode: RuntimePersistenceMode
): TierRequirementEvaluation {
  const tierDefinition = SAAS_TIER_DEFINITIONS[tier];

  if (input.cyberRelevance === "BLOCKED") {
    return {
      allowed: false,
      decision: "BLOCK",
      cyberBoundary: "BLOCKED_HARMFUL_CYBER",
      reason:
        "The request is classified as blocked cyber activity and cannot be processed."
    };
  }

  if (input.cyberRelevance === "C2_RELEVANT" && tier !== "C2_DEFENSE" && tier !== "STRATEGIC") {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: deriveC2BoundaryState(input, tier),
      reason:
        "C2-relevant cyber request requires C2 Defense or Strategic authorization."
    };
  }

  if (tierDefinition.requiresVerifiedIpr && !hasVerifiedIpr(input)) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_REQUIRES_VERIFICATION",
      reason: `${tier} requires verified IPR identity and an active operational certificate.`
    };
  }

  if (tierDefinition.requiresOrganization && !hasVerifiedOrganization(input)) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_REQUIRES_ORGANIZATION",
      reason: `${tier} requires a verified organization.`
    };
  }

  if (tierDefinition.requiresWorkspace && !hasActiveWorkspace(input)) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_REQUIRES_ORGANIZATION",
      reason: `${tier} requires an active workspace.`
    };
  }

  if (
    tierDefinition.requiresAuthorizedPerimeter &&
    (!input.hasAuthorizedPerimeter || !input.defensivePurpose)
  ) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_REQUIRES_AUTHORIZED_PERIMETER",
      reason: `${tier} requires authorized asset perimeter and declared defensive purpose.`
    };
  }

  if (tier === "C2_DEFENSE" && !hasC2DefenseAuthorization(input)) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_FAIL_CLOSED",
      reason:
        "C2 Defense requires verified IPR, verified organization, active workspace, authorized perimeter and defensive purpose."
    };
  }

  if (tier === "STRATEGIC" && !hasStrategicAuthorization(input)) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_FAIL_CLOSED",
      reason:
        "Strategic access requires verified identity, verified organization, active workspace and contractual or pilot authorization."
    };
  }

  if (
    (tier === "C2_DEFENSE" || tier === "STRATEGIC") &&
    persistenceMode === "FAIL_CLOSED_PERSISTENCE"
  ) {
    return {
      allowed: false,
      decision: "FAIL_CLOSED",
      cyberBoundary: "C2_FAIL_CLOSED",
      reason:
        "Selected tier requires persistence or audit continuity, but persistence is unavailable."
    };
  }

  return {
    allowed: true,
    decision: "ALLOW",
    cyberBoundary: deriveC2BoundaryState(input, tier),
    reason: `${tier} requirements satisfied.`
  };
}

export function deriveRuntimeDecision(
  tier: SaasTier,
  allowed: boolean,
  riskLevel: RuntimeRiskLevel,
  auditState: RuntimeAuditState
): RuntimeDecision {
  if (!allowed) {
    return riskLevel === "BLOCKED" ? "BLOCK" : "FAIL_CLOSED";
  }

  if (tier === "C2_DEFENSE" || tier === "STRATEGIC") {
    return "ALLOW_WITH_MANDATORY_AUDIT";
  }

  if (auditState === "MANDATORY") {
    return "ALLOW_WITH_MANDATORY_AUDIT";
  }

  if (auditState === "REQUIRED" || auditState === "ENABLED") {
    return "ALLOW_WITH_AUDIT";
  }

  if (riskLevel === "CRITICAL") {
    return "ESCALATE";
  }

  return "ALLOW";
}

export function deriveEvtRequirement(
  tierDefinition: SaasTierDefinition,
  allowed: boolean,
  riskLevel: RuntimeRiskLevel,
  proofRequirement: ProofRequirement
): boolean {
  if (!allowed) {
    return true;
  }

  return (
    tierDefinition.evtRequired ||
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL" ||
    proofRequirement === "EVT" ||
    proofRequirement === "EVT_OPC" ||
    proofRequirement === "MANDATORY_AUDIT"
  );
}

export function deriveOpcRequirement(
  tierDefinition: SaasTierDefinition,
  allowed: boolean,
  proofRequirement: ProofRequirement
): boolean {
  if (!allowed) {
    return false;
  }

  return (
    tierDefinition.opcRequired ||
    proofRequirement === "EVT_OPC" ||
    proofRequirement === "MANDATORY_AUDIT"
  );
}

export function deriveAuditRequirement(
  tierDefinition: SaasTierDefinition,
  riskLevel: RuntimeRiskLevel,
  proofRequirement: ProofRequirement,
  allowed: boolean
): boolean {
  if (!allowed) {
    return true;
  }

  return (
    tierDefinition.auditRequired ||
    riskLevel === "MEDIUM" ||
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL" ||
    proofRequirement !== "NONE"
  );
}

export function deriveRestrictedCapabilities(
  tier: SaasTier,
  allowed: boolean
): string[] {
  if (!allowed) {
    return [
      "IPR_BOUND_MEMORY",
      "WORKSPACE_GOVERNANCE",
      "C2_DEFENSE",
      "STRATEGIC_ACCESS"
    ];
  }

  if (tier === "BASE") {
    return [
      "IPR_BOUND_MEMORY",
      "PRO_WORKFLOWS",
      "WORKSPACE_GOVERNANCE",
      "C2_DEFENSE",
      "STRATEGIC_ACCESS"
    ];
  }

  if (tier === "IPR") {
    return ["WORKSPACE_GOVERNANCE", "C2_DEFENSE", "STRATEGIC_ACCESS"];
  }

  if (tier === "PRO") {
    return ["C2_DEFENSE", "STRATEGIC_ACCESS"];
  }

  if (tier === "GOVERNANCE") {
    return ["C2_DEFENSE_REQUIRES_SEPARATE_AUTHORIZATION", "STRATEGIC_ACCESS"];
  }

  if (tier === "C2_DEFENSE") {
    return ["STRATEGIC_ACCESS_REQUIRES_CONTRACT"];
  }

  return [];
}

export function buildPolicyReason(input: {
  tier: SaasTier;
  allowed: boolean;
  tierRequirementReason: string;
  riskLevel: RuntimeRiskLevel;
  modelLevel: ModelLevel;
  persistenceMode: RuntimePersistenceMode;
  cyberBoundary: C2BoundaryState;
}): string {
  const persistenceBoundary = getPersistenceBoundary(input.persistenceMode);

  if (!input.allowed) {
    return `${input.tierRequirementReason} Runtime decision is fail-closed. Cyber boundary: ${input.cyberBoundary}. ${persistenceBoundary}`;
  }

  return `${input.tier} tier evaluated successfully. Risk level: ${input.riskLevel}. Model level: ${input.modelLevel}. Cyber boundary: ${input.cyberBoundary}. ${persistenceBoundary}`;
}

export function evaluateSaasTierPolicy(
  rawInput: SaasTierPolicyInput = {}
): SaasTierPolicyResult {
  const input = normalizeSaasTierPolicyInput(rawInput);
  const tier = deriveSaasTier(input);
  const tierDefinition = SAAS_TIER_DEFINITIONS[tier];

  const persistenceRequired =
    tier === "C2_DEFENSE" ||
    tier === "STRATEGIC" ||
    input.proofRequirement === "MANDATORY_AUDIT";

  const persistenceMode = getDefaultPersistenceMode({
    databaseConfigured: input.databaseConfigured,
    databaseAvailable: input.databaseAvailable,
    persistenceRequired
  });

  const requirement = deriveTierRequirements(input, tier, persistenceMode);
  const riskLevel = deriveRuntimeRiskLevel(input, tier);
  const modelLevel = deriveModelLevel(input, tier, riskLevel, requirement.allowed);
  const memoryScope = deriveMemoryScope(tierDefinition, requirement.allowed);
  const memoryAuthority = deriveMemoryAuthority(input, requirement.allowed);
  const auditState = deriveRuntimeAuditState(
    tier,
    riskLevel,
    input.proofRequirement,
    requirement.allowed
  );

  const decision = deriveRuntimeDecision(
    tier,
    requirement.allowed,
    riskLevel,
    auditState
  );

  const evtRequired = deriveEvtRequirement(
    tierDefinition,
    requirement.allowed,
    riskLevel,
    input.proofRequirement
  );

  const opcRequired = deriveOpcRequirement(
    tierDefinition,
    requirement.allowed,
    input.proofRequirement
  );

  const auditRequired = deriveAuditRequirement(
    tierDefinition,
    riskLevel,
    input.proofRequirement,
    requirement.allowed
  );

  const cyberBoundary = requirement.allowed
    ? deriveC2BoundaryState(input, tier)
    : requirement.cyberBoundary;

  const reason = buildPolicyReason({
    tier,
    allowed: requirement.allowed,
    tierRequirementReason: requirement.reason,
    riskLevel,
    modelLevel,
    persistenceMode,
    cyberBoundary
  });

  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    tier,
    tierLabel: tierDefinition.label,
    accessLevel: tierDefinition.accessLevel,
    allowed: requirement.allowed,
    decision,
    modelLevel,
    memoryScope,
    memoryAuthority,
    persistenceMode,
    riskLevel,
    identityState: input.identityState,
    organizationState: input.organizationState,
    workspaceState: input.workspaceState,
    cyberRelevance: input.cyberRelevance,
    cyberBoundary,
    auditState,
    evtRequired,
    opcRequired,
    auditRequired,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason,
    restrictedCapabilities: deriveRestrictedCapabilities(tier, requirement.allowed),
    upgradePath: getDefaultUpgradePath(tier),
    boundary: `${getTierBoundary(tier)} ${RUNTIME_BOUNDARY_SUMMARY.opc}. legalCertification = false.`
  };
}

export function evaluateBaseTierPolicy(): SaasTierPolicyResult {
  return evaluateSaasTierPolicy({
    requestedTier: "BASE",
    identityState: "NOT_VERIFIED",
    organizationState: "NOT_REQUIRED",
    workspaceState: "NOT_REQUIRED",
    billingMode: "FREE",
    certificateActive: false,
    cyberRelevance: "NONE",
    operationalValue: "LOW",
    proofRequirement: "NONE"
  });
}

export function evaluateIprTierPolicy(input: {
  certificateActive?: boolean;
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
} = {}): SaasTierPolicyResult {
  return evaluateSaasTierPolicy({
    requestedTier: "IPR",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "NOT_REQUIRED",
    workspaceState: "NOT_REQUIRED",
    billingMode: "DEMO",
    certificateActive: input.certificateActive ?? true,
    cyberRelevance: "NONE",
    operationalValue: "MEDIUM",
    proofRequirement: "EVT",
    databaseConfigured: input.databaseConfigured,
    databaseAvailable: input.databaseAvailable
  });
}

export function evaluateC2DefenseBoundaryOnly(): SaasTierPolicyResult {
  return evaluateSaasTierPolicy({
    requestedTier: "C2_DEFENSE",
    identityState: "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
    organizationState: "NOT_VERIFIED",
    workspaceState: "NOT_AVAILABLE",
    billingMode: "DEMO",
    certificateActive: true,
    hasAuthorizedPerimeter: false,
    defensivePurpose: false,
    cyberRelevance: "C2_RELEVANT",
    operationalValue: "CRITICAL",
    proofRequirement: "MANDATORY_AUDIT",
    databaseConfigured: false,
    databaseAvailable: false
  });
}

export function buildSaasTierRuntimeFrame(result: SaasTierPolicyResult): string {
  return [
    "HBCE SaaS Tier Policy",
    `Project: ${result.project}`,
    `Release: ${result.targetRelease}`,
    `Tier: ${result.tier}`,
    `Access level: ${result.accessLevel}`,
    `Allowed: ${result.allowed}`,
    `Decision: ${result.decision}`,
    `Model level: ${result.modelLevel}`,
    `Memory scope: ${result.memoryScope}`,
    `Memory authority: ${result.memoryAuthority}`,
    `Persistence mode: ${result.persistenceMode}`,
    `Risk level: ${result.riskLevel}`,
    `Cyber relevance: ${result.cyberRelevance}`,
    `Cyber boundary: ${result.cyberBoundary}`,
    `Audit state: ${result.auditState}`,
    `EVT required: ${result.evtRequired}`,
    `OPC required: ${result.opcRequired}`,
    `Audit required: ${result.auditRequired}`,
    `Legal certification: ${result.legalCertification}`,
    `Payment alone grants C2: ${result.paymentAloneGrantsC2}`,
    `Reason: ${result.reason}`,
    `Boundary: ${result.boundary}`
  ].join("\n");
}

export function toPublicSaasTierPolicyResult(result: SaasTierPolicyResult): {
  project: string;
  targetRelease: string;
  tier: SaasTier;
  tierLabel: string;
  accessLevel: string;
  allowed: boolean;
  decision: RuntimeDecision;
  modelLevel: ModelLevel;
  memoryScope: RuntimeMemoryScope;
  persistenceMode: RuntimePersistenceMode;
  riskLevel: RuntimeRiskLevel;
  cyberRelevance: CyberRelevance;
  cyberBoundary: C2BoundaryState;
  auditState: RuntimeAuditState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  legalCertification: false;
  paymentAloneGrantsC2: false;
  reason: string;
  restrictedCapabilities: string[];
  upgradePath: SaasTier[];
  boundary: string;
} {
  return {
    project: result.project,
    targetRelease: result.targetRelease,
    tier: result.tier,
    tierLabel: result.tierLabel,
    accessLevel: result.accessLevel,
    allowed: result.allowed,
    decision: result.decision,
    modelLevel: result.modelLevel,
    memoryScope: result.memoryScope,
    persistenceMode: result.persistenceMode,
    riskLevel: result.riskLevel,
    cyberRelevance: result.cyberRelevance,
    cyberBoundary: result.cyberBoundary,
    auditState: result.auditState,
    evtRequired: result.evtRequired,
    opcRequired: result.opcRequired,
    auditRequired: result.auditRequired,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason: result.reason,
    restrictedCapabilities: result.restrictedCapabilities,
    upgradePath: result.upgradePath,
    boundary: result.boundary
  };
}

export function getSaasTierPolicyHealth(): {
  configured: true;
  project: string;
  targetRelease: string;
  availableTiers: SaasTier[];
  defaultTier: SaasTier;
  c2DefenseRestricted: true;
  legalCertification: false;
  boundary: string;
} {
  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    availableTiers: Object.keys(SAAS_TIER_DEFINITIONS) as SaasTier[],
    defaultTier: "BASE",
    c2DefenseRestricted: true,
    legalCertification: false,
    boundary:
      "SaaS tier policy is configured. C2 Defense is restricted to authorized defensive cyber use. OPC is a technical proof receipt only. legalCertification = false."
  };
}
