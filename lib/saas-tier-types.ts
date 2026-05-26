/**
 * HBCE / JOKER-C2 SaaS Tier Types
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
 * This file defines the canonical type layer for SaaS tier evaluation,
 * model escalation, runtime governance, memory scope, audit state,
 * persistence boundary and C2 Defense authorization.
 */

export const HBCE_SAAS_PROJECT = "Project HBCE R&D Transfer SaaS" as const;
export const HBCE_SAAS_TARGET_RELEASE = "SaaS Core v0.1" as const;
export const HBCE_SAAS_SOURCE_EVENT = "UP-EVT-0016" as const;
export const HBCE_SAAS_SOURCE_EVENT_AI = "UP-EVT-0016-AI" as const;
export const HBCE_SAAS_TARGET_CHECKPOINT = "2026-06-19T15:30:00+02:00" as const;

export const RUNTIME_ENTITY = "AI_JOKER" as const;
export const RUNTIME_IPR = "IPR-AI-0001" as const;
export const HBCE_ORGANIZATION = "HERMETICUM B.C.E. S.r.l." as const;
export const HBCE_CORE = "HBCE-CORE-v3" as const;

export const SAAS_TIERS = [
  "BASE",
  "IPR",
  "PRO",
  "GOVERNANCE",
  "C2_DEFENSE",
  "STRATEGIC"
] as const;

export type SaasTier = (typeof SAAS_TIERS)[number];

export const SAAS_ACCESS_LEVELS = [
  "LIMITED",
  "VERIFIED_INDIVIDUAL",
  "PROFESSIONAL_WORKFLOW",
  "VERIFIED_WORKSPACE",
  "AUTHORIZED_DEFENSIVE_CYBER",
  "CONTRACTUAL_STRATEGIC"
] as const;

export type SaasAccessLevel = (typeof SAAS_ACCESS_LEVELS)[number];

export const IDENTITY_STATES = [
  "NOT_VERIFIED",
  "CLIENT_TRANSPORT_ONLY",
  "SERVER_VALIDATION_REQUIRED",
  "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "IPR_VERIFIED_ORGANIZATION",
  "IPR_VERIFIED_WORKSPACE",
  "C2_DEFENSE_AUTHORIZED"
] as const;

export type IdentityState = (typeof IDENTITY_STATES)[number];

export const ORGANIZATION_STATES = [
  "NOT_REQUIRED",
  "NOT_VERIFIED",
  "PENDING_VERIFICATION",
  "IPR_VERIFIED_ORGANIZATION",
  "ACTIVE",
  "LIMITED",
  "SUSPENDED",
  "REVOKED"
] as const;

export type OrganizationState = (typeof ORGANIZATION_STATES)[number];

export const WORKSPACE_STATES = [
  "NOT_REQUIRED",
  "NOT_AVAILABLE",
  "PENDING",
  "ACTIVE",
  "LIMITED",
  "SUSPENDED",
  "REVOKED"
] as const;

export type WorkspaceState = (typeof WORKSPACE_STATES)[number];

export const MODEL_LEVELS = [
  "STANDARD",
  "ENHANCED",
  "ADVANCED",
  "C2_ESCALATED",
  "BLOCKED"
] as const;

export type ModelLevel = (typeof MODEL_LEVELS)[number];

export const RISK_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "BLOCKED"
] as const;

export type RuntimeRiskLevel = (typeof RISK_LEVELS)[number];

export const RUNTIME_DECISIONS = [
  "ALLOW",
  "ALLOW_WITH_AUDIT",
  "ALLOW_WITH_MANDATORY_AUDIT",
  "ESCALATE",
  "BLOCK",
  "FAIL_CLOSED"
] as const;

export type RuntimeDecision = (typeof RUNTIME_DECISIONS)[number];

export const MEMORY_SCOPES = [
  "RUNTIME_ONLY",
  "PROCESS_MEMORY_MVP",
  "IPR_BOUND",
  "WORKSPACE_BOUND",
  "DATABASE_PERSISTENT",
  "DEDICATED_CONTRACTUAL_SCOPE"
] as const;

export type RuntimeMemoryScope = (typeof MEMORY_SCOPES)[number];

export const MEMORY_AUTHORITIES = [
  "RUNTIME_ONLY",
  "CLIENT_TRANSPORT_ONLY",
  "SERVER_RUNTIME_VALIDATED",
  "DATABASE_VALIDATED",
  "WORKSPACE_AUTHORIZED"
] as const;

export type RuntimeMemoryAuthority = (typeof MEMORY_AUTHORITIES)[number];

export const PERSISTENCE_MODES = [
  "PROCESS_MEMORY_MVP",
  "DATABASE_PERSISTENT",
  "FAIL_CLOSED_PERSISTENCE"
] as const;

export type RuntimePersistenceMode = (typeof PERSISTENCE_MODES)[number];

export const CYBER_RELEVANCE_LEVELS = [
  "NONE",
  "GENERAL",
  "DEFENSIVE",
  "C2_RELEVANT",
  "BLOCKED"
] as const;

export type CyberRelevance = (typeof CYBER_RELEVANCE_LEVELS)[number];

export const C2_BOUNDARY_STATES = [
  "C2_NOT_AVAILABLE",
  "C2_REQUIRES_VERIFICATION",
  "C2_REQUIRES_ORGANIZATION",
  "C2_REQUIRES_AUTHORIZED_PERIMETER",
  "C2_AUTHORIZED_DEFENSIVE_ONLY",
  "C2_BLOCKED_UNAUTHORIZED",
  "C2_FAIL_CLOSED",
  "BLOCKED_HARMFUL_CYBER",
  "UNAUTHORIZED_OR_UNCLEAR"
] as const;

export type C2BoundaryState = (typeof C2_BOUNDARY_STATES)[number];

export const AUDIT_STATES = [
  "NOT_REQUIRED",
  "ENABLED",
  "REQUIRED",
  "MANDATORY",
  "BLOCKED",
  "FAIL_CLOSED"
] as const;

export type RuntimeAuditState = (typeof AUDIT_STATES)[number];

export const COMMERCIAL_STATES = [
  "RND_PROTOTYPE",
  "SAAS_CORE_V0_1_PREPARATION",
  "SAAS_CORE_V0_1_DEMO_READY",
  "PILOT_READY",
  "PRODUCTION_READY"
] as const;

export type CommercialState = (typeof COMMERCIAL_STATES)[number];

export const BILLING_MODES = [
  "FREE",
  "SELF_PILOT",
  "DEMO",
  "MONTHLY",
  "ANNUAL",
  "PILOT_CONTRACT",
  "STRATEGIC_CONTRACT"
] as const;

export type BillingMode = (typeof BILLING_MODES)[number];

export const DATA_CLASSIFICATIONS = [
  "PUBLIC",
  "INTERNAL",
  "OPERATIONAL",
  "SENSITIVE",
  "RESTRICTED",
  "NOT_APPLICABLE"
] as const;

export type RuntimeDataClassification = (typeof DATA_CLASSIFICATIONS)[number];

export const CONTEXT_CLASSES = [
  "GENERAL",
  "PRODUCT",
  "GOVERNANCE",
  "RUNTIME",
  "GITHUB",
  "DOCUMENTATION",
  "CYBER_DEFENSE",
  "COMPLIANCE",
  "EDITORIAL",
  "MATRIX",
  "IPR",
  "EVT",
  "OPC"
] as const;

export type RuntimeContextClass = (typeof CONTEXT_CLASSES)[number];

export const OPERATIONAL_VALUE_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
] as const;

export type OperationalValueLevel = (typeof OPERATIONAL_VALUE_LEVELS)[number];

export const PROOF_REQUIREMENTS = [
  "NONE",
  "EVT",
  "EVT_OPC",
  "MANDATORY_AUDIT"
] as const;

export type ProofRequirement = (typeof PROOF_REQUIREMENTS)[number];

export type SaasTierDefinition = {
  tier: SaasTier;
  label: string;
  accessLevel: SaasAccessLevel;
  defaultModelLevel: ModelLevel;
  allowedModelLevels: ModelLevel[];
  defaultMemoryScope: RuntimeMemoryScope;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  c2Available: boolean;
  requiresVerifiedIpr: boolean;
  requiresOrganization: boolean;
  requiresWorkspace: boolean;
  requiresAuthorizedPerimeter: boolean;
  paymentAloneGrantsAccess: boolean;
  description: string;
};

export type SaasTierPolicyInput = {
  requestedTier?: SaasTier;
  identityState?: IdentityState;
  organizationState?: OrganizationState;
  workspaceState?: WorkspaceState;
  billingMode?: BillingMode;
  certificateActive?: boolean;
  hasAuthorizedPerimeter?: boolean;
  defensivePurpose?: boolean;
  cyberRelevance?: CyberRelevance;
  contextClass?: RuntimeContextClass;
  dataClassification?: RuntimeDataClassification;
  operationalValue?: OperationalValueLevel;
  proofRequirement?: ProofRequirement;
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
};

export type SaasTierPolicyResult = {
  project: typeof HBCE_SAAS_PROJECT;
  targetRelease: typeof HBCE_SAAS_TARGET_RELEASE;
  tier: SaasTier;
  tierLabel: string;
  accessLevel: SaasAccessLevel;
  allowed: boolean;
  decision: RuntimeDecision;
  modelLevel: ModelLevel;
  memoryScope: RuntimeMemoryScope;
  memoryAuthority: RuntimeMemoryAuthority;
  persistenceMode: RuntimePersistenceMode;
  riskLevel: RuntimeRiskLevel;
  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;
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
};

export type RuntimeModelRoutingInput = {
  tier: SaasTier;
  requestedModel?: string;
  standardModel?: string;
  enhancedModel?: string;
  advancedModel?: string;
  c2Model?: string;
  riskLevel: RuntimeRiskLevel;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  c2Boundary: C2BoundaryState;
  proofRequirement: ProofRequirement;
  auditRequired: boolean;
};

export type RuntimeModelRoutingResult = {
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
};

export type RuntimeBoundarySummary = {
  legalCertification: false;
  opc: "technical proof receipt only";
  evt: "operational continuity record only";
  c2: "authorized defensive cyber use only";
  ipr: "operational identity record only";
  memory: "memory does not authorize unsafe future requests";
};

export const RUNTIME_BOUNDARY_SUMMARY: RuntimeBoundarySummary = {
  legalCertification: false,
  opc: "technical proof receipt only",
  evt: "operational continuity record only",
  c2: "authorized defensive cyber use only",
  ipr: "operational identity record only",
  memory: "memory does not authorize unsafe future requests"
};

export const SAAS_TIER_DEFINITIONS: Record<SaasTier, SaasTierDefinition> = {
  BASE: {
    tier: "BASE",
    label: "Base",
    accessLevel: "LIMITED",
    defaultModelLevel: "STANDARD",
    allowedModelLevels: ["STANDARD"],
    defaultMemoryScope: "RUNTIME_ONLY",
    evtRequired: false,
    opcRequired: false,
    auditRequired: false,
    c2Available: false,
    requiresVerifiedIpr: false,
    requiresOrganization: false,
    requiresWorkspace: false,
    requiresAuthorizedPerimeter: false,
    paymentAloneGrantsAccess: true,
    description:
      "Exploratory governed access for low-risk, non-verified or limited users."
  },
  IPR: {
    tier: "IPR",
    label: "IPR",
    accessLevel: "VERIFIED_INDIVIDUAL",
    defaultModelLevel: "ENHANCED",
    allowedModelLevels: ["STANDARD", "ENHANCED"],
    defaultMemoryScope: "IPR_BOUND",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    c2Available: false,
    requiresVerifiedIpr: true,
    requiresOrganization: false,
    requiresWorkspace: false,
    requiresAuthorizedPerimeter: false,
    paymentAloneGrantsAccess: false,
    description:
      "Verified individual access with IPR-bound continuity, memory and audit-aware runtime behavior."
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    accessLevel: "PROFESSIONAL_WORKFLOW",
    defaultModelLevel: "ADVANCED",
    allowedModelLevels: ["ENHANCED", "ADVANCED"],
    defaultMemoryScope: "IPR_BOUND",
    evtRequired: true,
    opcRequired: true,
    auditRequired: true,
    c2Available: false,
    requiresVerifiedIpr: true,
    requiresOrganization: false,
    requiresWorkspace: false,
    requiresAuthorizedPerimeter: false,
    paymentAloneGrantsAccess: true,
    description:
      "Professional operational workflow tier for documents, reports, repository work and proof-ready outputs."
  },
  GOVERNANCE: {
    tier: "GOVERNANCE",
    label: "Governance",
    accessLevel: "VERIFIED_WORKSPACE",
    defaultModelLevel: "ADVANCED",
    allowedModelLevels: ["ADVANCED"],
    defaultMemoryScope: "WORKSPACE_BOUND",
    evtRequired: true,
    opcRequired: true,
    auditRequired: true,
    c2Available: false,
    requiresVerifiedIpr: true,
    requiresOrganization: true,
    requiresWorkspace: true,
    requiresAuthorizedPerimeter: false,
    paymentAloneGrantsAccess: true,
    description:
      "Organization and workspace tier for governed AI processes, policy, audit and responsibility mapping."
  },
  C2_DEFENSE: {
    tier: "C2_DEFENSE",
    label: "C2 Defense",
    accessLevel: "AUTHORIZED_DEFENSIVE_CYBER",
    defaultModelLevel: "C2_ESCALATED",
    allowedModelLevels: ["ADVANCED", "C2_ESCALATED"],
    defaultMemoryScope: "WORKSPACE_BOUND",
    evtRequired: true,
    opcRequired: true,
    auditRequired: true,
    c2Available: true,
    requiresVerifiedIpr: true,
    requiresOrganization: true,
    requiresWorkspace: true,
    requiresAuthorizedPerimeter: true,
    paymentAloneGrantsAccess: false,
    description:
      "Restricted defensive cyber perimeter for verified organizations, authorized assets and mandatory audit."
  },
  STRATEGIC: {
    tier: "STRATEGIC",
    label: "Strategic",
    accessLevel: "CONTRACTUAL_STRATEGIC",
    defaultModelLevel: "ADVANCED",
    allowedModelLevels: ["ADVANCED", "C2_ESCALATED"],
    defaultMemoryScope: "DEDICATED_CONTRACTUAL_SCOPE",
    evtRequired: true,
    opcRequired: true,
    auditRequired: true,
    c2Available: true,
    requiresVerifiedIpr: true,
    requiresOrganization: true,
    requiresWorkspace: true,
    requiresAuthorizedPerimeter: true,
    paymentAloneGrantsAccess: false,
    description:
      "Contractual or pilot-governed tier for B2B, B2G, critical infrastructure and dedicated runtime deployments."
  }
};

export const SAAS_TIER_ORDER: Record<SaasTier, number> = {
  BASE: 0,
  IPR: 1,
  PRO: 2,
  GOVERNANCE: 3,
  C2_DEFENSE: 4,
  STRATEGIC: 5
};

export const DEFAULT_TIER_UPGRADE_PATH: Record<SaasTier, SaasTier[]> = {
  BASE: ["IPR", "PRO"],
  IPR: ["PRO", "GOVERNANCE"],
  PRO: ["GOVERNANCE", "C2_DEFENSE", "STRATEGIC"],
  GOVERNANCE: ["C2_DEFENSE", "STRATEGIC"],
  C2_DEFENSE: ["STRATEGIC"],
  STRATEGIC: []
};

export function isSaasTier(value: unknown): value is SaasTier {
  return typeof value === "string" && SAAS_TIERS.includes(value as SaasTier);
}

export function isModelLevel(value: unknown): value is ModelLevel {
  return typeof value === "string" && MODEL_LEVELS.includes(value as ModelLevel);
}

export function isRuntimeRiskLevel(value: unknown): value is RuntimeRiskLevel {
  return typeof value === "string" && RISK_LEVELS.includes(value as RuntimeRiskLevel);
}

export function isRuntimeDecision(value: unknown): value is RuntimeDecision {
  return typeof value === "string" && RUNTIME_DECISIONS.includes(value as RuntimeDecision);
}

export function isCyberRelevance(value: unknown): value is CyberRelevance {
  return (
    typeof value === "string" &&
    CYBER_RELEVANCE_LEVELS.includes(value as CyberRelevance)
  );
}

export function isC2BoundaryState(value: unknown): value is C2BoundaryState {
  return (
    typeof value === "string" &&
    C2_BOUNDARY_STATES.includes(value as C2BoundaryState)
  );
}

export function getSaasTierDefinition(tier: SaasTier): SaasTierDefinition {
  return SAAS_TIER_DEFINITIONS[tier];
}

export function compareSaasTiers(left: SaasTier, right: SaasTier): number {
  return SAAS_TIER_ORDER[left] - SAAS_TIER_ORDER[right];
}

export function isTierAtLeast(current: SaasTier, minimum: SaasTier): boolean {
  return SAAS_TIER_ORDER[current] >= SAAS_TIER_ORDER[minimum];
}

export function getDefaultUpgradePath(tier: SaasTier): SaasTier[] {
  return DEFAULT_TIER_UPGRADE_PATH[tier];
}

export function getDefaultPersistenceMode(input: {
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
  persistenceRequired?: boolean;
}): RuntimePersistenceMode {
  if (input.databaseConfigured && input.databaseAvailable) {
    return "DATABASE_PERSISTENT";
  }

  if (input.persistenceRequired) {
    return "FAIL_CLOSED_PERSISTENCE";
  }

  return "PROCESS_MEMORY_MVP";
}

export function getPersistenceBoundary(mode: RuntimePersistenceMode): string {
  if (mode === "DATABASE_PERSISTENT") {
    return "Persistence mode: DATABASE_PERSISTENT. Boundary: operational persistence enabled.";
  }

  if (mode === "FAIL_CLOSED_PERSISTENCE") {
    return "Persistence mode: FAIL_CLOSED_PERSISTENCE. Boundary: required persistence unavailable.";
  }

  return "Persistence mode: PROCESS_MEMORY_MVP. Boundary: non-persistent serverless memory.";
}

export function getTierBoundary(tier: SaasTier): string {
  if (tier === "C2_DEFENSE") {
    return "C2 Defense is restricted to verified defensive cyber use within an authorized perimeter. Payment alone does not grant C2 access.";
  }

  if (tier === "STRATEGIC") {
    return "Strategic access is contractual or pilot-governed and does not create legal certification.";
  }

  return "JOKER-C2 SaaS access is governed by IPR, tier, risk, model routing, EVT, OPC and runtime policy boundaries.";
}

export function createBlockedTierPolicyResult(reason: string): SaasTierPolicyResult {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    tier: "BASE",
    tierLabel: SAAS_TIER_DEFINITIONS.BASE.label,
    accessLevel: "LIMITED",
    allowed: false,
    decision: "FAIL_CLOSED",
    modelLevel: "BLOCKED",
    memoryScope: "RUNTIME_ONLY",
    memoryAuthority: "RUNTIME_ONLY",
    persistenceMode: "PROCESS_MEMORY_MVP",
    riskLevel: "BLOCKED",
    identityState: "NOT_VERIFIED",
    organizationState: "NOT_VERIFIED",
    workspaceState: "NOT_AVAILABLE",
    cyberRelevance: "BLOCKED",
    cyberBoundary: "UNAUTHORIZED_OR_UNCLEAR",
    auditState: "REQUIRED",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason,
    restrictedCapabilities: [
      "IPR_BOUND_MEMORY",
      "WORKSPACE_GOVERNANCE",
      "C2_DEFENSE",
      "STRATEGIC_ACCESS"
    ],
    upgradePath: ["IPR", "PRO"],
    boundary:
      "Runtime failed closed. Authorization, perimeter, identity or risk could not be resolved."
  };
}
