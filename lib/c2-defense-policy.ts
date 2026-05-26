/**
 * HBCE / JOKER-C2 C2 Defense Policy
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
 * This file evaluates the restricted defensive cyber perimeter for JOKER-C2.
 * C2 Defense is not a premium subscription. It is an authorized defensive
 * operational boundary requiring verified IPR, verified organization or workspace,
 * authorized asset perimeter, defensive purpose, mandatory EVT, mandatory OPC
 * and fail-closed behavior.
 */

import {
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  type C2BoundaryState,
  type CyberRelevance,
  type IdentityState,
  type ModelLevel,
  type OrganizationState,
  type RuntimeAuditState,
  type RuntimeDecision,
  type RuntimeRiskLevel,
  type SaasTier,
  type WorkspaceState
} from "./saas-tier-types";

export type C2DefensePurposeState =
  | "NOT_CYBER_RELEVANT"
  | "GENERAL_SECURITY"
  | "DEFENSIVE_PURPOSE_DECLARED"
  | "DEFENSIVE_PURPOSE_AUTHORIZED"
  | "OFFENSIVE_OR_HARMFUL"
  | "UNRESOLVED";

export type C2AssetPerimeterState =
  | "NOT_REQUIRED"
  | "AUTHORIZED"
  | "DECLARED_BUT_NOT_VERIFIED"
  | "UNRESOLVED"
  | "UNAUTHORIZED"
  | "THIRD_PARTY_OR_UNKNOWN";

export type C2AuthorizationState =
  | "NOT_AVAILABLE"
  | "REQUIRES_VERIFIED_IPR"
  | "REQUIRES_VERIFIED_ORGANIZATION"
  | "REQUIRES_ACTIVE_WORKSPACE"
  | "REQUIRES_AUTHORIZED_PERIMETER"
  | "REQUIRES_DEFENSIVE_PURPOSE"
  | "AUTHORIZED_DEFENSIVE_ONLY"
  | "BLOCKED_HARMFUL"
  | "FAIL_CLOSED";

export type C2DefensePolicyInput = {
  message?: string;
  requestedTier?: SaasTier;
  identityState?: IdentityState;
  organizationState?: OrganizationState;
  workspaceState?: WorkspaceState;
  certificateActive?: boolean;
  hasAuthorizedPerimeter?: boolean;
  defensivePurpose?: boolean;
  cyberRelevance?: CyberRelevance;
  assetPerimeterState?: C2AssetPerimeterState;
  purposeState?: C2DefensePurposeState;
  organizationVerified?: boolean;
  workspaceActive?: boolean;
  forceC2Evaluation?: boolean;
};

export type NormalizedC2DefensePolicyInput = {
  message: string;
  requestedTier: SaasTier;
  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;
  certificateActive: boolean;
  hasAuthorizedPerimeter: boolean;
  defensivePurpose: boolean;
  cyberRelevance: CyberRelevance;
  assetPerimeterState: C2AssetPerimeterState;
  purposeState: C2DefensePurposeState;
  organizationVerified: boolean;
  workspaceActive: boolean;
  forceC2Evaluation: boolean;
};

export type C2DefensePolicyResult = {
  project: typeof HBCE_SAAS_PROJECT;
  targetRelease: typeof HBCE_SAAS_TARGET_RELEASE;
  c2Configured: true;
  c2Available: boolean;
  allowed: boolean;
  failClosed: boolean;
  decision: RuntimeDecision;
  modelLevel: ModelLevel;
  riskLevel: RuntimeRiskLevel;
  auditState: RuntimeAuditState;
  cyberRelevance: CyberRelevance;
  cyberBoundary: C2BoundaryState;
  authorizationState: C2AuthorizationState;
  assetPerimeterState: C2AssetPerimeterState;
  purposeState: C2DefensePurposeState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  legalCertification: false;
  paymentAloneGrantsC2: false;
  reason: string;
  refusalMessage: string | null;
  safeRedirection: string[];
  boundary: string;
};

export type C2DefensePolicyHealth = {
  configured: true;
  project: string;
  targetRelease: string;
  defaultState: "RESTRICTED";
  requiresVerifiedIpr: true;
  requiresOrganization: true;
  requiresWorkspace: true;
  requiresAuthorizedPerimeter: true;
  requiresDefensivePurpose: true;
  requiresEvt: true;
  requiresOpc: true;
  failClosed: true;
  legalCertification: false;
  paymentAloneGrantsC2: false;
  boundary: string;
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

const GENERAL_SECURITY_TERMS = [
  "security",
  "cybersecurity",
  "authentication",
  "authorization",
  "firewall",
  "logging",
  "monitoring",
  "vulnerability",
  "risk",
  "hardening",
  "incident",
  "soc",
  "audit"
];

const DEFENSIVE_TERMS = [
  "defensive",
  "defense",
  "hardening",
  "incident response",
  "security posture",
  "authorized assessment",
  "authorized audit",
  "owned system",
  "own system",
  "own deployment",
  "my deployment",
  "my server",
  "my application",
  "my repository",
  "our infrastructure",
  "our application",
  "configuration review",
  "vulnerability triage",
  "log review",
  "remediation",
  "patch",
  "containment",
  "recovery",
  "blue team"
];

const C2_RELEVANT_TERMS = [
  "c2",
  "command and control",
  "critical infrastructure",
  "authorized perimeter",
  "defense perimeter",
  "security operations",
  "cyber defense",
  "threat response",
  "incident containment",
  "forensic",
  "intrusion detection",
  "defensive perimeter",
  "soc workflow"
];

const AUTHORIZED_ASSET_TERMS = [
  "my system",
  "my server",
  "my application",
  "my deployment",
  "my repository",
  "my infrastructure",
  "our system",
  "our server",
  "our application",
  "our deployment",
  "our repository",
  "our infrastructure",
  "owned system",
  "owned asset",
  "authorized asset",
  "authorized perimeter",
  "approved environment",
  "internal repository"
];

const THIRD_PARTY_OR_UNKNOWN_TERMS = [
  "third-party",
  "third party",
  "someone else's",
  "external target",
  "public target",
  "unknown target",
  "random website",
  "their system",
  "their server",
  "not mine",
  "not ours"
];

const BLOCKED_HARMFUL_TERMS = [
  "attack a third-party",
  "attack a third party",
  "hack someone",
  "hack a third-party",
  "hack a third party",
  "steal credentials",
  "credential theft",
  "phishing kit",
  "malware",
  "ransomware",
  "keylogger",
  "botnet",
  "evade detection",
  "bypass detection",
  "persistence mechanism",
  "stealth intrusion",
  "unauthorized access",
  "bypass login",
  "exploit target",
  "payload to compromise",
  "exfiltrate",
  "privilege escalation exploit"
];

export const DEFAULT_C2_DEFENSE_POLICY_INPUT: NormalizedC2DefensePolicyInput = {
  message: "",
  requestedTier: "BASE",
  identityState: "NOT_VERIFIED",
  organizationState: "NOT_REQUIRED",
  workspaceState: "NOT_REQUIRED",
  certificateActive: false,
  hasAuthorizedPerimeter: false,
  defensivePurpose: false,
  cyberRelevance: "NONE",
  assetPerimeterState: "NOT_REQUIRED",
  purposeState: "NOT_CYBER_RELEVANT",
  organizationVerified: false,
  workspaceActive: false,
  forceC2Evaluation: false
};

export function normalizeC2Text(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

export function c2TextIncludesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function hasVerifiedC2Ipr(
  input: Pick<NormalizedC2DefensePolicyInput, "identityState" | "certificateActive">
): boolean {
  return (
    input.certificateActive &&
    VERIFIED_IDENTITY_STATES.includes(input.identityState)
  );
}

export function hasVerifiedC2Organization(
  input: Pick<
    NormalizedC2DefensePolicyInput,
    "identityState" | "organizationState" | "organizationVerified"
  >
): boolean {
  return (
    input.organizationVerified ||
    VERIFIED_ORGANIZATION_STATES.includes(input.organizationState) ||
    input.identityState === "IPR_VERIFIED_ORGANIZATION" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function hasActiveC2Workspace(
  input: Pick<
    NormalizedC2DefensePolicyInput,
    "identityState" | "workspaceState" | "workspaceActive"
  >
): boolean {
  return (
    input.workspaceActive ||
    ACTIVE_WORKSPACE_STATES.includes(input.workspaceState) ||
    input.identityState === "IPR_VERIFIED_WORKSPACE" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function inferC2CyberRelevance(message: string): CyberRelevance {
  if (c2TextIncludesAny(message, BLOCKED_HARMFUL_TERMS)) {
    return "BLOCKED";
  }

  if (c2TextIncludesAny(message, C2_RELEVANT_TERMS)) {
    return "C2_RELEVANT";
  }

  if (c2TextIncludesAny(message, DEFENSIVE_TERMS)) {
    return "DEFENSIVE";
  }

  if (c2TextIncludesAny(message, GENERAL_SECURITY_TERMS)) {
    return "GENERAL";
  }

  return "NONE";
}

export function inferC2AssetPerimeterState(
  message: string,
  cyberRelevance: CyberRelevance,
  hasAuthorizedPerimeter: boolean
): C2AssetPerimeterState {
  if (cyberRelevance === "NONE" || cyberRelevance === "GENERAL") {
    return "NOT_REQUIRED";
  }

  if (c2TextIncludesAny(message, THIRD_PARTY_OR_UNKNOWN_TERMS)) {
    return "THIRD_PARTY_OR_UNKNOWN";
  }

  if (hasAuthorizedPerimeter) {
    return "AUTHORIZED";
  }

  if (c2TextIncludesAny(message, AUTHORIZED_ASSET_TERMS)) {
    return "DECLARED_BUT_NOT_VERIFIED";
  }

  if (cyberRelevance === "BLOCKED") {
    return "UNAUTHORIZED";
  }

  return "UNRESOLVED";
}

export function inferC2PurposeState(
  message: string,
  cyberRelevance: CyberRelevance,
  defensivePurpose: boolean,
  hasAuthorizedPerimeter: boolean
): C2DefensePurposeState {
  if (cyberRelevance === "NONE") {
    return "NOT_CYBER_RELEVANT";
  }

  if (cyberRelevance === "BLOCKED") {
    return "OFFENSIVE_OR_HARMFUL";
  }

  if (cyberRelevance === "GENERAL") {
    return "GENERAL_SECURITY";
  }

  if (defensivePurpose && hasAuthorizedPerimeter) {
    return "DEFENSIVE_PURPOSE_AUTHORIZED";
  }

  if (defensivePurpose || c2TextIncludesAny(message, DEFENSIVE_TERMS)) {
    return "DEFENSIVE_PURPOSE_DECLARED";
  }

  return "UNRESOLVED";
}

export function normalizeC2DefensePolicyInput(
  input: C2DefensePolicyInput = {}
): NormalizedC2DefensePolicyInput {
  const message = normalizeC2Text(input.message);
  const requestedTier = input.requestedTier ?? "BASE";
  const identityState = input.identityState ?? "NOT_VERIFIED";
  const certificateActive =
    input.certificateActive ??
    VERIFIED_IDENTITY_STATES.includes(identityState);

  const organizationState = input.organizationState ?? "NOT_REQUIRED";
  const workspaceState = input.workspaceState ?? "NOT_REQUIRED";

  const organizationVerified =
    input.organizationVerified ??
    VERIFIED_ORGANIZATION_STATES.includes(organizationState) ??
    false;

  const workspaceActive =
    input.workspaceActive ?? ACTIVE_WORKSPACE_STATES.includes(workspaceState);

  const inferredCyberRelevance = inferC2CyberRelevance(message);
  const cyberRelevance = input.cyberRelevance ?? inferredCyberRelevance;

  const hasAuthorizedPerimeter = input.hasAuthorizedPerimeter ?? false;
  const defensivePurpose =
    input.defensivePurpose ??
    cyberRelevance === "DEFENSIVE" ||
    c2TextIncludesAny(message, DEFENSIVE_TERMS);

  const assetPerimeterState =
    input.assetPerimeterState ??
    inferC2AssetPerimeterState(
      message,
      cyberRelevance,
      hasAuthorizedPerimeter
    );

  const purposeState =
    input.purposeState ??
    inferC2PurposeState(
      message,
      cyberRelevance,
      defensivePurpose,
      hasAuthorizedPerimeter
    );

  return {
    message,
    requestedTier,
    identityState,
    organizationState,
    workspaceState,
    certificateActive,
    hasAuthorizedPerimeter,
    defensivePurpose,
    cyberRelevance,
    assetPerimeterState,
    purposeState,
    organizationVerified,
    workspaceActive,
    forceC2Evaluation:
      input.forceC2Evaluation ??
      requestedTier === "C2_DEFENSE" ||
      requestedTier === "STRATEGIC" ||
      cyberRelevance === "C2_RELEVANT"
  };
}

export function isC2RelevantRequest(input: NormalizedC2DefensePolicyInput): boolean {
  return (
    input.forceC2Evaluation ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC" ||
    input.cyberRelevance === "C2_RELEVANT" ||
    input.cyberRelevance === "BLOCKED"
  );
}

export function deriveC2AuthorizationState(
  input: NormalizedC2DefensePolicyInput
): C2AuthorizationState {
  if (input.cyberRelevance === "BLOCKED" || input.purposeState === "OFFENSIVE_OR_HARMFUL") {
    return "BLOCKED_HARMFUL";
  }

  if (!isC2RelevantRequest(input)) {
    return "NOT_AVAILABLE";
  }

  if (!hasVerifiedC2Ipr(input)) {
    return "REQUIRES_VERIFIED_IPR";
  }

  if (!hasVerifiedC2Organization(input)) {
    return "REQUIRES_VERIFIED_ORGANIZATION";
  }

  if (!hasActiveC2Workspace(input)) {
    return "REQUIRES_ACTIVE_WORKSPACE";
  }

  if (
    input.assetPerimeterState !== "AUTHORIZED" ||
    !input.hasAuthorizedPerimeter
  ) {
    return "REQUIRES_AUTHORIZED_PERIMETER";
  }

  if (
    input.purposeState !== "DEFENSIVE_PURPOSE_AUTHORIZED" ||
    !input.defensivePurpose
  ) {
    return "REQUIRES_DEFENSIVE_PURPOSE";
  }

  if (
    input.identityState === "C2_DEFENSE_AUTHORIZED" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC"
  ) {
    return "AUTHORIZED_DEFENSIVE_ONLY";
  }

  return "FAIL_CLOSED";
}

export function deriveC2BoundaryState(
  authorizationState: C2AuthorizationState
): C2BoundaryState {
  if (authorizationState === "NOT_AVAILABLE") {
    return "C2_NOT_AVAILABLE";
  }

  if (authorizationState === "REQUIRES_VERIFIED_IPR") {
    return "C2_REQUIRES_VERIFICATION";
  }

  if (
    authorizationState === "REQUIRES_VERIFIED_ORGANIZATION" ||
    authorizationState === "REQUIRES_ACTIVE_WORKSPACE"
  ) {
    return "C2_REQUIRES_ORGANIZATION";
  }

  if (
    authorizationState === "REQUIRES_AUTHORIZED_PERIMETER" ||
    authorizationState === "REQUIRES_DEFENSIVE_PURPOSE"
  ) {
    return "C2_REQUIRES_AUTHORIZED_PERIMETER";
  }

  if (authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return "C2_AUTHORIZED_DEFENSIVE_ONLY";
  }

  if (authorizationState === "BLOCKED_HARMFUL") {
    return "BLOCKED_HARMFUL_CYBER";
  }

  return "C2_FAIL_CLOSED";
}

export function deriveC2RiskLevel(
  input: NormalizedC2DefensePolicyInput,
  authorizationState: C2AuthorizationState
): RuntimeRiskLevel {
  if (authorizationState === "BLOCKED_HARMFUL") {
    return "BLOCKED";
  }

  if (
    authorizationState === "FAIL_CLOSED" ||
    authorizationState === "REQUIRES_AUTHORIZED_PERIMETER" ||
    authorizationState === "REQUIRES_DEFENSIVE_PURPOSE"
  ) {
    return "CRITICAL";
  }

  if (
    input.cyberRelevance === "C2_RELEVANT" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC"
  ) {
    return "CRITICAL";
  }

  if (input.cyberRelevance === "DEFENSIVE") {
    return "HIGH";
  }

  if (input.cyberRelevance === "GENERAL") {
    return "MEDIUM";
  }

  return "LOW";
}

export function deriveC2Decision(
  authorizationState: C2AuthorizationState,
  riskLevel: RuntimeRiskLevel
): RuntimeDecision {
  if (authorizationState === "BLOCKED_HARMFUL") {
    return "BLOCK";
  }

  if (
    authorizationState === "REQUIRES_VERIFIED_IPR" ||
    authorizationState === "REQUIRES_VERIFIED_ORGANIZATION" ||
    authorizationState === "REQUIRES_ACTIVE_WORKSPACE" ||
    authorizationState === "REQUIRES_AUTHORIZED_PERIMETER" ||
    authorizationState === "REQUIRES_DEFENSIVE_PURPOSE" ||
    authorizationState === "FAIL_CLOSED"
  ) {
    return "FAIL_CLOSED";
  }

  if (authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return "ALLOW_WITH_MANDATORY_AUDIT";
  }

  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    return "ALLOW_WITH_AUDIT";
  }

  return "ALLOW";
}

export function deriveC2ModelLevel(
  decision: RuntimeDecision,
  authorizationState: C2AuthorizationState
): ModelLevel {
  if (decision === "BLOCK" || decision === "FAIL_CLOSED") {
    return "BLOCKED";
  }

  if (authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return "C2_ESCALATED";
  }

  return "ADVANCED";
}

export function deriveC2AuditState(
  decision: RuntimeDecision,
  authorizationState: C2AuthorizationState
): RuntimeAuditState {
  if (decision === "BLOCK") {
    return "BLOCKED";
  }

  if (decision === "FAIL_CLOSED") {
    return "FAIL_CLOSED";
  }

  if (authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return "MANDATORY";
  }

  return "REQUIRED";
}

export function buildC2RefusalMessage(
  authorizationState: C2AuthorizationState
): string | null {
  if (authorizationState === "NOT_AVAILABLE") {
    return null;
  }

  if (authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return null;
  }

  if (authorizationState === "BLOCKED_HARMFUL") {
    return "I cannot assist with unauthorized or potentially harmful cyber activity. C2 Defense requires verified IPR, verified organization, declared defensive purpose and an authorized asset perimeter. I can help with defensive security planning, hardening checklists, incident response documentation, governance policy, risk assessment structure or audit preparation.";
  }

  return "C2 Defense cannot proceed because authorization, organization state, workspace state, defensive purpose or asset perimeter is unresolved. The runtime is failing closed. C2 Defense requires verified IPR, verified organization, active workspace, declared defensive purpose and an authorized perimeter.";
}

export function buildC2SafeRedirection(
  authorizationState: C2AuthorizationState
): string[] {
  if (authorizationState === "NOT_AVAILABLE") {
    return [];
  }

  return [
    "defensive security planning",
    "hardening checklist",
    "incident response documentation",
    "SOC playbook structure",
    "authorized risk assessment",
    "security posture review",
    "governance controls",
    "audit-ready remediation plan"
  ];
}

export function buildC2Reason(input: {
  authorizationState: C2AuthorizationState;
  cyberBoundary: C2BoundaryState;
  decision: RuntimeDecision;
  riskLevel: RuntimeRiskLevel;
}): string {
  if (input.authorizationState === "AUTHORIZED_DEFENSIVE_ONLY") {
    return `C2 Defense authorized for defensive use only. Decision: ${input.decision}. Risk: ${input.riskLevel}. Boundary: ${input.cyberBoundary}. EVT and OPC are mandatory.`;
  }

  if (input.authorizationState === "NOT_AVAILABLE") {
    return `C2 Defense not required for this request. Boundary: ${input.cyberBoundary}.`;
  }

  if (input.authorizationState === "BLOCKED_HARMFUL") {
    return `Cyber request blocked as harmful or unauthorized. Decision: ${input.decision}. Boundary: ${input.cyberBoundary}.`;
  }

  return `C2 Defense failed closed because authorization, organization, workspace, asset perimeter or defensive purpose is unresolved. State: ${input.authorizationState}. Boundary: ${input.cyberBoundary}.`;
}

export function evaluateC2DefensePolicy(
  rawInput: C2DefensePolicyInput = {}
): C2DefensePolicyResult {
  const input = normalizeC2DefensePolicyInput(rawInput);
  const authorizationState = deriveC2AuthorizationState(input);
  const cyberBoundary = deriveC2BoundaryState(authorizationState);
  const riskLevel = deriveC2RiskLevel(input, authorizationState);
  const decision = deriveC2Decision(authorizationState, riskLevel);
  const modelLevel = deriveC2ModelLevel(decision, authorizationState);
  const auditState = deriveC2AuditState(decision, authorizationState);

  const allowed =
    decision === "ALLOW" ||
    decision === "ALLOW_WITH_AUDIT" ||
    decision === "ALLOW_WITH_MANDATORY_AUDIT";

  const failClosed = decision === "FAIL_CLOSED";

  const c2Available = authorizationState === "AUTHORIZED_DEFENSIVE_ONLY";

  const evtRequired =
    isC2RelevantRequest(input) ||
    decision === "BLOCK" ||
    decision === "FAIL_CLOSED" ||
    c2Available;

  const opcRequired = c2Available;

  const auditRequired =
    auditState === "REQUIRED" ||
    auditState === "MANDATORY" ||
    auditState === "BLOCKED" ||
    auditState === "FAIL_CLOSED";

  const reason = buildC2Reason({
    authorizationState,
    cyberBoundary,
    decision,
    riskLevel
  });

  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    c2Configured: true,
    c2Available,
    allowed,
    failClosed,
    decision,
    modelLevel,
    riskLevel,
    auditState,
    cyberRelevance: input.cyberRelevance,
    cyberBoundary,
    authorizationState,
    assetPerimeterState: input.assetPerimeterState,
    purposeState: input.purposeState,
    evtRequired,
    opcRequired,
    auditRequired,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason,
    refusalMessage: buildC2RefusalMessage(authorizationState),
    safeRedirection: buildC2SafeRedirection(authorizationState),
    boundary:
      "C2 Defense is restricted to authorized defensive cyber use. " +
      "Payment alone does not grant C2 access. " +
      `${RUNTIME_BOUNDARY_SUMMARY.opc}. ${RUNTIME_BOUNDARY_SUMMARY.evt}. legalCertification = false.`
  };
}

export function createC2FailClosedResult(reason: string): C2DefensePolicyResult {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    c2Configured: true,
    c2Available: false,
    allowed: false,
    failClosed: true,
    decision: "FAIL_CLOSED",
    modelLevel: "BLOCKED",
    riskLevel: "CRITICAL",
    auditState: "FAIL_CLOSED",
    cyberRelevance: "C2_RELEVANT",
    cyberBoundary: "C2_FAIL_CLOSED",
    authorizationState: "FAIL_CLOSED",
    assetPerimeterState: "UNRESOLVED",
    purposeState: "UNRESOLVED",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason,
    refusalMessage:
      "C2 Defense cannot proceed because authorization, organization state, workspace state, defensive purpose or asset perimeter is unresolved. The runtime is failing closed.",
    safeRedirection: [
      "defensive security planning",
      "hardening checklist",
      "incident response documentation",
      "SOC playbook structure",
      "authorized risk assessment",
      "security posture review",
      "governance controls"
    ],
    boundary:
      "C2 Defense failed closed. C2 Defense is restricted to authorized defensive cyber use. legalCertification = false."
  };
}

export function createC2BlockedResult(reason: string): C2DefensePolicyResult {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    c2Configured: true,
    c2Available: false,
    allowed: false,
    failClosed: false,
    decision: "BLOCK",
    modelLevel: "BLOCKED",
    riskLevel: "BLOCKED",
    auditState: "BLOCKED",
    cyberRelevance: "BLOCKED",
    cyberBoundary: "BLOCKED_HARMFUL_CYBER",
    authorizationState: "BLOCKED_HARMFUL",
    assetPerimeterState: "UNAUTHORIZED",
    purposeState: "OFFENSIVE_OR_HARMFUL",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason,
    refusalMessage:
      "I cannot assist with unauthorized or potentially harmful cyber activity. C2 Defense requires verified IPR, verified organization, declared defensive purpose and an authorized asset perimeter. I can help with defensive security planning, hardening checklists, incident response documentation, governance policy, risk assessment structure or audit preparation.",
    safeRedirection: [
      "defensive security planning",
      "hardening checklist",
      "incident response documentation",
      "SOC playbook structure",
      "authorized risk assessment",
      "security posture review",
      "governance controls"
    ],
    boundary:
      "Request blocked by C2 Defense policy. C2 Defense is restricted to authorized defensive cyber use. legalCertification = false."
  };
}

export function buildC2DefensePromptFrame(result: C2DefensePolicyResult): string {
  return [
    "HBCE C2 Defense Policy",
    `Project: ${result.project}`,
    `Release: ${result.targetRelease}`,
    `C2 configured: ${result.c2Configured}`,
    `C2 available: ${result.c2Available}`,
    `Allowed: ${result.allowed}`,
    `Fail closed: ${result.failClosed}`,
    `Decision: ${result.decision}`,
    `Model level: ${result.modelLevel}`,
    `Risk level: ${result.riskLevel}`,
    `Audit state: ${result.auditState}`,
    `Cyber relevance: ${result.cyberRelevance}`,
    `Cyber boundary: ${result.cyberBoundary}`,
    `Authorization state: ${result.authorizationState}`,
    `Asset perimeter state: ${result.assetPerimeterState}`,
    `Purpose state: ${result.purposeState}`,
    `EVT required: ${result.evtRequired}`,
    `OPC required: ${result.opcRequired}`,
    `Audit required: ${result.auditRequired}`,
    `Legal certification: ${result.legalCertification}`,
    `Payment alone grants C2: ${result.paymentAloneGrantsC2}`,
    `Reason: ${result.reason}`,
    `Boundary: ${result.boundary}`
  ].join("\n");
}

export function toPublicC2DefensePolicyResult(result: C2DefensePolicyResult): {
  c2Configured: true;
  c2Available: boolean;
  allowed: boolean;
  failClosed: boolean;
  decision: RuntimeDecision;
  modelLevel: ModelLevel;
  riskLevel: RuntimeRiskLevel;
  auditState: RuntimeAuditState;
  cyberRelevance: CyberRelevance;
  cyberBoundary: C2BoundaryState;
  authorizationState: C2AuthorizationState;
  assetPerimeterState: C2AssetPerimeterState;
  purposeState: C2DefensePurposeState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  legalCertification: false;
  paymentAloneGrantsC2: false;
  reason: string;
  refusalMessage: string | null;
  safeRedirection: string[];
  boundary: string;
} {
  return {
    c2Configured: result.c2Configured,
    c2Available: result.c2Available,
    allowed: result.allowed,
    failClosed: result.failClosed,
    decision: result.decision,
    modelLevel: result.modelLevel,
    riskLevel: result.riskLevel,
    auditState: result.auditState,
    cyberRelevance: result.cyberRelevance,
    cyberBoundary: result.cyberBoundary,
    authorizationState: result.authorizationState,
    assetPerimeterState: result.assetPerimeterState,
    purposeState: result.purposeState,
    evtRequired: result.evtRequired,
    opcRequired: result.opcRequired,
    auditRequired: result.auditRequired,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    reason: result.reason,
    refusalMessage: result.refusalMessage,
    safeRedirection: result.safeRedirection,
    boundary: result.boundary
  };
}

export function getC2DefensePolicyHealth(): C2DefensePolicyHealth {
  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    defaultState: "RESTRICTED",
    requiresVerifiedIpr: true,
    requiresOrganization: true,
    requiresWorkspace: true,
    requiresAuthorizedPerimeter: true,
    requiresDefensivePurpose: true,
    requiresEvt: true,
    requiresOpc: true,
    failClosed: true,
    legalCertification: false,
    paymentAloneGrantsC2: false,
    boundary:
      "C2 Defense policy is configured. C2 Defense is restricted to authorized defensive cyber use. Verified IPR, verified organization, active workspace, authorized perimeter and defensive purpose are required. OPC is a technical proof receipt only. legalCertification = false."
  };
}
