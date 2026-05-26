/**
 * HBCE / JOKER-C2 Runtime Risk Policy
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
 * This file evaluates runtime risk before JOKER-C2 selects a model,
 * updates memory, generates EVT records or produces OPC proof receipts.
 */

import {
  HBCE_SAAS_PROJECT,
  HBCE_SAAS_TARGET_RELEASE,
  RUNTIME_BOUNDARY_SUMMARY,
  type C2BoundaryState,
  type CyberRelevance,
  type IdentityState,
  type OperationalValueLevel,
  type OrganizationState,
  type ProofRequirement,
  type RuntimeAuditState,
  type RuntimeContextClass,
  type RuntimeDataClassification,
  type RuntimeDecision,
  type RuntimeRiskLevel,
  type SaasTier,
  type WorkspaceState
} from "./saas-tier-types";

export type RuntimeRiskPolicyInput = {
  message?: string;
  requestedTier?: SaasTier;
  identityState?: IdentityState;
  organizationState?: OrganizationState;
  workspaceState?: WorkspaceState;
  certificateActive?: boolean;
  hasAuthorizedPerimeter?: boolean;
  defensivePurpose?: boolean;
  contextClass?: RuntimeContextClass;
  dataClassification?: RuntimeDataClassification;
  operationalValue?: OperationalValueLevel;
  cyberRelevance?: CyberRelevance;
  proofRequirement?: ProofRequirement;
  c2Boundary?: C2BoundaryState;
  fileCount?: number;
  hasFiles?: boolean;
  databaseConfigured?: boolean;
  databaseAvailable?: boolean;
};

export type NormalizedRuntimeRiskPolicyInput = {
  message: string;
  requestedTier: SaasTier;
  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;
  certificateActive: boolean;
  hasAuthorizedPerimeter: boolean;
  defensivePurpose: boolean;
  contextClass: RuntimeContextClass;
  dataClassification: RuntimeDataClassification;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  proofRequirement: ProofRequirement;
  c2Boundary: C2BoundaryState;
  fileCount: number;
  hasFiles: boolean;
  databaseConfigured: boolean;
  databaseAvailable: boolean;
};

export type RuntimeRiskPolicyResult = {
  project: typeof HBCE_SAAS_PROJECT;
  targetRelease: typeof HBCE_SAAS_TARGET_RELEASE;
  riskLevel: RuntimeRiskLevel;
  decision: RuntimeDecision;
  auditState: RuntimeAuditState;
  contextClass: RuntimeContextClass;
  dataClassification: RuntimeDataClassification;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  proofRequirement: ProofRequirement;
  c2Boundary: C2BoundaryState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  allowed: boolean;
  failClosed: boolean;
  legalCertification: false;
  reason: string;
  safeRedirection: string[];
  boundary: string;
};

export type RuntimeRiskPolicyHealth = {
  configured: true;
  project: string;
  targetRelease: string;
  defaultDecision: RuntimeDecision;
  failClosedEnabled: true;
  c2DefenseRestricted: true;
  legalCertification: false;
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

const GOVERNANCE_TERMS = [
  "governance",
  "policy",
  "compliance",
  "audit",
  "risk",
  "proof",
  "evidence",
  "trace",
  "evt",
  "opc",
  "ipr",
  "matrix",
  "saas",
  "runtime",
  "dashboard",
  "legalcertification",
  "certification"
];

const GITHUB_TERMS = [
  "github",
  "repo",
  "repository",
  "commit",
  "branch",
  "vercel",
  "next.js",
  "typescript",
  "tsx",
  "api route",
  "route.ts",
  "package.json",
  "build error",
  "deploy"
];

const DOCUMENTATION_TERMS = [
  "document",
  "docs",
  "readme",
  "manual",
  "dossier",
  "roadmap",
  "demo script",
  "evidence pack",
  "markdown",
  "md file"
];

const DEFENSIVE_CYBER_TERMS = [
  "defensive",
  "hardening",
  "incident response",
  "soc",
  "security posture",
  "authorized assessment",
  "authorized audit",
  "owned system",
  "own deployment",
  "my server",
  "my application",
  "my repository",
  "configuration review",
  "vulnerability triage",
  "log review",
  "patch",
  "remediation"
];

const C2_RELEVANT_TERMS = [
  "c2",
  "command and control",
  "critical infrastructure",
  "defense perimeter",
  "authorized perimeter",
  "security operations",
  "cyber defense",
  "threat response",
  "incident containment",
  "forensic",
  "intrusion detection"
];

const BLOCKED_CYBER_TERMS = [
  "attack a third-party",
  "hack someone",
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
  "privilege escalation exploit",
  "exfiltrate",
  "unauthorized access",
  "bypass login",
  "exploit target",
  "payload to compromise",
  "stealth intrusion"
];

const SENSITIVE_DATA_TERMS = [
  "private key",
  "secret key",
  "api key",
  "password",
  "credential",
  "token",
  "passport",
  "identity card",
  "tax code",
  "codice fiscale",
  "medical",
  "health",
  "bank",
  "iban",
  "legal document",
  "contract"
];

export const DEFAULT_RUNTIME_RISK_POLICY_INPUT: NormalizedRuntimeRiskPolicyInput = {
  message: "",
  requestedTier: "BASE",
  identityState: "NOT_VERIFIED",
  organizationState: "NOT_REQUIRED",
  workspaceState: "NOT_REQUIRED",
  certificateActive: false,
  hasAuthorizedPerimeter: false,
  defensivePurpose: false,
  contextClass: "GENERAL",
  dataClassification: "NOT_APPLICABLE",
  operationalValue: "LOW",
  cyberRelevance: "NONE",
  proofRequirement: "NONE",
  c2Boundary: "C2_NOT_AVAILABLE",
  fileCount: 0,
  hasFiles: false,
  databaseConfigured: false,
  databaseAvailable: false
};

export function normalizeRiskText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

export function includesAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function hasVerifiedIpr(input: NormalizedRuntimeRiskPolicyInput): boolean {
  return (
    input.certificateActive &&
    VERIFIED_IDENTITY_STATES.includes(input.identityState)
  );
}

export function hasVerifiedOrganization(
  input: NormalizedRuntimeRiskPolicyInput
): boolean {
  return (
    VERIFIED_ORGANIZATION_STATES.includes(input.organizationState) ||
    input.identityState === "IPR_VERIFIED_ORGANIZATION" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function hasActiveWorkspace(input: NormalizedRuntimeRiskPolicyInput): boolean {
  return (
    ACTIVE_WORKSPACE_STATES.includes(input.workspaceState) ||
    input.identityState === "IPR_VERIFIED_WORKSPACE" ||
    input.identityState === "C2_DEFENSE_AUTHORIZED"
  );
}

export function inferContextClass(message: string): RuntimeContextClass {
  if (includesAnyTerm(message, GITHUB_TERMS)) {
    return "GITHUB";
  }

  if (includesAnyTerm(message, C2_RELEVANT_TERMS)) {
    return "CYBER_DEFENSE";
  }

  if (includesAnyTerm(message, DEFENSIVE_CYBER_TERMS)) {
    return "CYBER_DEFENSE";
  }

  if (includesAnyTerm(message, GOVERNANCE_TERMS)) {
    return "GOVERNANCE";
  }

  if (includesAnyTerm(message, DOCUMENTATION_TERMS)) {
    return "DOCUMENTATION";
  }

  if (message.includes("product") || message.includes("saas")) {
    return "PRODUCT";
  }

  if (message.includes("runtime") || message.includes("api")) {
    return "RUNTIME";
  }

  if (message.includes("matrix")) {
    return "MATRIX";
  }

  if (message.includes("ipr")) {
    return "IPR";
  }

  if (message.includes("evt")) {
    return "EVT";
  }

  if (message.includes("opc")) {
    return "OPC";
  }

  return "GENERAL";
}

export function inferDataClassification(
  message: string,
  hasFiles: boolean
): RuntimeDataClassification {
  if (includesAnyTerm(message, SENSITIVE_DATA_TERMS)) {
    return "SENSITIVE";
  }

  if (hasFiles) {
    return "OPERATIONAL";
  }

  if (
    message.includes("internal") ||
    message.includes("workspace") ||
    message.includes("organization")
  ) {
    return "INTERNAL";
  }

  if (
    message.includes("restricted") ||
    message.includes("critical infrastructure")
  ) {
    return "RESTRICTED";
  }

  if (!message) {
    return "NOT_APPLICABLE";
  }

  return "PUBLIC";
}

export function inferCyberRelevance(message: string): CyberRelevance {
  if (includesAnyTerm(message, BLOCKED_CYBER_TERMS)) {
    return "BLOCKED";
  }

  if (includesAnyTerm(message, C2_RELEVANT_TERMS)) {
    return "C2_RELEVANT";
  }

  if (includesAnyTerm(message, DEFENSIVE_CYBER_TERMS)) {
    return "DEFENSIVE";
  }

  if (
    message.includes("cyber") ||
    message.includes("security") ||
    message.includes("vulnerability") ||
    message.includes("firewall") ||
    message.includes("authentication")
  ) {
    return "GENERAL";
  }

  return "NONE";
}

export function inferOperationalValue(
  message: string,
  contextClass: RuntimeContextClass,
  dataClassification: RuntimeDataClassification,
  cyberRelevance: CyberRelevance
): OperationalValueLevel {
  if (
    cyberRelevance === "BLOCKED" ||
    cyberRelevance === "C2_RELEVANT" ||
    dataClassification === "RESTRICTED"
  ) {
    return "CRITICAL";
  }

  if (
    contextClass === "GOVERNANCE" ||
    contextClass === "RUNTIME" ||
    contextClass === "GITHUB" ||
    dataClassification === "SENSITIVE"
  ) {
    return "HIGH";
  }

  if (
    contextClass === "DOCUMENTATION" ||
    contextClass === "PRODUCT" ||
    dataClassification === "OPERATIONAL" ||
    cyberRelevance === "DEFENSIVE" ||
    cyberRelevance === "GENERAL"
  ) {
    return "MEDIUM";
  }

  if (message.length > 1200) {
    return "MEDIUM";
  }

  return "LOW";
}

export function inferProofRequirement(input: {
  requestedTier: SaasTier;
  contextClass: RuntimeContextClass;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  dataClassification: RuntimeDataClassification;
  hasFiles: boolean;
}): ProofRequirement {
  if (
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC" ||
    input.cyberRelevance === "C2_RELEVANT" ||
    input.cyberRelevance === "BLOCKED"
  ) {
    return "MANDATORY_AUDIT";
  }

  if (
    input.requestedTier === "GOVERNANCE" ||
    input.operationalValue === "CRITICAL" ||
    input.dataClassification === "RESTRICTED"
  ) {
    return "EVT_OPC";
  }

  if (
    input.requestedTier === "PRO" ||
    input.contextClass === "GITHUB" ||
    input.contextClass === "RUNTIME" ||
    input.contextClass === "GOVERNANCE" ||
    input.hasFiles ||
    input.operationalValue === "HIGH"
  ) {
    return "EVT_OPC";
  }

  if (
    input.requestedTier === "IPR" ||
    input.operationalValue === "MEDIUM" ||
    input.dataClassification === "OPERATIONAL"
  ) {
    return "EVT";
  }

  return "NONE";
}

export function inferC2Boundary(input: {
  requestedTier: SaasTier;
  identityState: IdentityState;
  organizationState: OrganizationState;
  workspaceState: WorkspaceState;
  certificateActive: boolean;
  hasAuthorizedPerimeter: boolean;
  defensivePurpose: boolean;
  cyberRelevance: CyberRelevance;
}): C2BoundaryState {
  if (input.cyberRelevance === "BLOCKED") {
    return "BLOCKED_HARMFUL_CYBER";
  }

  if (input.cyberRelevance !== "C2_RELEVANT" && input.requestedTier !== "C2_DEFENSE") {
    return "C2_NOT_AVAILABLE";
  }

  const normalizedInput: NormalizedRuntimeRiskPolicyInput = {
    ...DEFAULT_RUNTIME_RISK_POLICY_INPUT,
    requestedTier: input.requestedTier,
    identityState: input.identityState,
    organizationState: input.organizationState,
    workspaceState: input.workspaceState,
    certificateActive: input.certificateActive,
    hasAuthorizedPerimeter: input.hasAuthorizedPerimeter,
    defensivePurpose: input.defensivePurpose,
    cyberRelevance: input.cyberRelevance
  };

  if (!hasVerifiedIpr(normalizedInput)) {
    return "C2_REQUIRES_VERIFICATION";
  }

  if (!hasVerifiedOrganization(normalizedInput) || !hasActiveWorkspace(normalizedInput)) {
    return "C2_REQUIRES_ORGANIZATION";
  }

  if (!input.hasAuthorizedPerimeter || !input.defensivePurpose) {
    return "C2_REQUIRES_AUTHORIZED_PERIMETER";
  }

  if (
    input.identityState === "C2_DEFENSE_AUTHORIZED" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC"
  ) {
    return "C2_AUTHORIZED_DEFENSIVE_ONLY";
  }

  return "UNAUTHORIZED_OR_UNCLEAR";
}

export function normalizeRuntimeRiskPolicyInput(
  input: RuntimeRiskPolicyInput = {}
): NormalizedRuntimeRiskPolicyInput {
  const message = normalizeRiskText(input.message);
  const hasFiles = input.hasFiles ?? Boolean(input.fileCount && input.fileCount > 0);
  const fileCount = Math.max(0, input.fileCount ?? 0);

  const requestedTier = input.requestedTier ?? "BASE";
  const identityState = input.identityState ?? "NOT_VERIFIED";
  const certificateActive =
    input.certificateActive ??
    VERIFIED_IDENTITY_STATES.includes(identityState);

  const inferredContextClass = inferContextClass(message);
  const contextClass = input.contextClass ?? inferredContextClass;

  const inferredDataClassification = inferDataClassification(message, hasFiles);
  const dataClassification = input.dataClassification ?? inferredDataClassification;

  const inferredCyberRelevance = inferCyberRelevance(message);
  const cyberRelevance = input.cyberRelevance ?? inferredCyberRelevance;

  const operationalValue =
    input.operationalValue ??
    inferOperationalValue(message, contextClass, dataClassification, cyberRelevance);

  const proofRequirement =
    input.proofRequirement ??
    inferProofRequirement({
      requestedTier,
      contextClass,
      operationalValue,
      cyberRelevance,
      dataClassification,
      hasFiles
    });

  const organizationState = input.organizationState ?? "NOT_REQUIRED";
  const workspaceState = input.workspaceState ?? "NOT_REQUIRED";
  const hasAuthorizedPerimeter = input.hasAuthorizedPerimeter ?? false;
  const defensivePurpose =
    input.defensivePurpose ?? cyberRelevance === "DEFENSIVE";

  const c2Boundary =
    input.c2Boundary ??
    inferC2Boundary({
      requestedTier,
      identityState,
      organizationState,
      workspaceState,
      certificateActive,
      hasAuthorizedPerimeter,
      defensivePurpose,
      cyberRelevance
    });

  return {
    message,
    requestedTier,
    identityState,
    organizationState,
    workspaceState,
    certificateActive,
    hasAuthorizedPerimeter,
    defensivePurpose,
    contextClass,
    dataClassification,
    operationalValue,
    cyberRelevance,
    proofRequirement,
    c2Boundary,
    fileCount,
    hasFiles,
    databaseConfigured: input.databaseConfigured ?? false,
    databaseAvailable: input.databaseAvailable ?? false
  };
}

export function deriveRiskLevel(
  input: NormalizedRuntimeRiskPolicyInput
): RuntimeRiskLevel {
  if (
    input.cyberRelevance === "BLOCKED" ||
    input.c2Boundary === "BLOCKED_HARMFUL_CYBER"
  ) {
    return "BLOCKED";
  }

  if (
    input.c2Boundary === "UNAUTHORIZED_OR_UNCLEAR" ||
    input.c2Boundary === "C2_FAIL_CLOSED"
  ) {
    return "CRITICAL";
  }

  if (
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC" ||
    input.cyberRelevance === "C2_RELEVANT" ||
    input.proofRequirement === "MANDATORY_AUDIT" ||
    input.dataClassification === "RESTRICTED" ||
    input.operationalValue === "CRITICAL"
  ) {
    return "CRITICAL";
  }

  if (
    input.requestedTier === "GOVERNANCE" ||
    input.requestedTier === "PRO" ||
    input.proofRequirement === "EVT_OPC" ||
    input.dataClassification === "SENSITIVE" ||
    input.operationalValue === "HIGH" ||
    input.contextClass === "GITHUB" ||
    input.contextClass === "RUNTIME" ||
    input.contextClass === "GOVERNANCE"
  ) {
    return "HIGH";
  }

  if (
    input.requestedTier === "IPR" ||
    input.proofRequirement === "EVT" ||
    input.operationalValue === "MEDIUM" ||
    input.dataClassification === "OPERATIONAL" ||
    input.cyberRelevance === "DEFENSIVE" ||
    input.cyberRelevance === "GENERAL"
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function deriveRiskDecision(
  input: NormalizedRuntimeRiskPolicyInput,
  riskLevel: RuntimeRiskLevel
): RuntimeDecision {
  if (riskLevel === "BLOCKED") {
    return "BLOCK";
  }

  if (
    input.c2Boundary === "BLOCKED_HARMFUL_CYBER" ||
    input.c2Boundary === "UNAUTHORIZED_OR_UNCLEAR" ||
    input.c2Boundary === "C2_FAIL_CLOSED"
  ) {
    return "FAIL_CLOSED";
  }

  if (
    input.cyberRelevance === "C2_RELEVANT" &&
    input.c2Boundary !== "C2_AUTHORIZED_DEFENSIVE_ONLY"
  ) {
    return "FAIL_CLOSED";
  }

  if (
    input.requestedTier === "C2_DEFENSE" &&
    input.c2Boundary !== "C2_AUTHORIZED_DEFENSIVE_ONLY"
  ) {
    return "FAIL_CLOSED";
  }

  if (riskLevel === "CRITICAL") {
    return "ESCALATE";
  }

  if (riskLevel === "HIGH") {
    return "ALLOW_WITH_AUDIT";
  }

  if (riskLevel === "MEDIUM") {
    return "ALLOW_WITH_AUDIT";
  }

  return "ALLOW";
}

export function deriveRiskAuditState(
  decision: RuntimeDecision,
  riskLevel: RuntimeRiskLevel,
  proofRequirement: ProofRequirement
): RuntimeAuditState {
  if (decision === "BLOCK") {
    return "BLOCKED";
  }

  if (decision === "FAIL_CLOSED") {
    return "FAIL_CLOSED";
  }

  if (proofRequirement === "MANDATORY_AUDIT" || riskLevel === "CRITICAL") {
    return "MANDATORY";
  }

  if (proofRequirement === "EVT_OPC" || riskLevel === "HIGH") {
    return "REQUIRED";
  }

  if (proofRequirement === "EVT" || riskLevel === "MEDIUM") {
    return "ENABLED";
  }

  return "NOT_REQUIRED";
}

export function deriveRiskEvtRequired(input: {
  decision: RuntimeDecision;
  riskLevel: RuntimeRiskLevel;
  proofRequirement: ProofRequirement;
  requestedTier: SaasTier;
}): boolean {
  return (
    input.decision === "BLOCK" ||
    input.decision === "FAIL_CLOSED" ||
    input.riskLevel === "HIGH" ||
    input.riskLevel === "CRITICAL" ||
    input.proofRequirement === "EVT" ||
    input.proofRequirement === "EVT_OPC" ||
    input.proofRequirement === "MANDATORY_AUDIT" ||
    input.requestedTier === "IPR" ||
    input.requestedTier === "PRO" ||
    input.requestedTier === "GOVERNANCE" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC"
  );
}

export function deriveRiskOpcRequired(input: {
  decision: RuntimeDecision;
  proofRequirement: ProofRequirement;
  requestedTier: SaasTier;
  c2Boundary: C2BoundaryState;
}): boolean {
  if (input.decision === "BLOCK") {
    return false;
  }

  if (input.decision === "FAIL_CLOSED") {
    return false;
  }

  return (
    input.proofRequirement === "EVT_OPC" ||
    input.proofRequirement === "MANDATORY_AUDIT" ||
    input.requestedTier === "GOVERNANCE" ||
    input.requestedTier === "C2_DEFENSE" ||
    input.requestedTier === "STRATEGIC" ||
    input.c2Boundary === "C2_AUTHORIZED_DEFENSIVE_ONLY"
  );
}

export function deriveSafeRedirection(
  input: NormalizedRuntimeRiskPolicyInput,
  decision: RuntimeDecision
): string[] {
  if (decision !== "BLOCK" && decision !== "FAIL_CLOSED") {
    return [];
  }

  if (
    input.cyberRelevance === "BLOCKED" ||
    input.cyberRelevance === "C2_RELEVANT" ||
    input.c2Boundary !== "C2_NOT_AVAILABLE"
  ) {
    return [
      "defensive security planning",
      "hardening checklist",
      "incident response documentation",
      "SOC playbook structure",
      "authorized risk assessment",
      "security posture review",
      "governance controls"
    ];
  }

  return [
    "lower-risk request reformulation",
    "public documentation review",
    "governed operational planning",
    "audit-oriented summary"
  ];
}

export function buildRiskReason(input: {
  normalized: NormalizedRuntimeRiskPolicyInput;
  riskLevel: RuntimeRiskLevel;
  decision: RuntimeDecision;
  auditState: RuntimeAuditState;
}): string {
  if (input.decision === "BLOCK") {
    return `Request blocked by runtime risk policy. Risk: ${input.riskLevel}. Cyber relevance: ${input.normalized.cyberRelevance}. C2 boundary: ${input.normalized.c2Boundary}.`;
  }

  if (input.decision === "FAIL_CLOSED") {
    return `Runtime failed closed because authorization, C2 perimeter or risk state is unresolved. Risk: ${input.riskLevel}. Cyber boundary: ${input.normalized.c2Boundary}.`;
  }

  if (input.decision === "ESCALATE") {
    return `Request requires escalation. Risk: ${input.riskLevel}. Proof requirement: ${input.normalized.proofRequirement}. Audit state: ${input.auditState}.`;
  }

  if (input.decision === "ALLOW_WITH_AUDIT") {
    return `Request allowed with audit. Context: ${input.normalized.contextClass}. Operational value: ${input.normalized.operationalValue}. Proof requirement: ${input.normalized.proofRequirement}.`;
  }

  return `Request allowed. Risk: ${input.riskLevel}. Context: ${input.normalized.contextClass}.`;
}

export function evaluateRuntimeRiskPolicy(
  rawInput: RuntimeRiskPolicyInput = {}
): RuntimeRiskPolicyResult {
  const input = normalizeRuntimeRiskPolicyInput(rawInput);
  const riskLevel = deriveRiskLevel(input);
  const decision = deriveRiskDecision(input, riskLevel);
  const auditState = deriveRiskAuditState(
    decision,
    riskLevel,
    input.proofRequirement
  );

  const evtRequired = deriveRiskEvtRequired({
    decision,
    riskLevel,
    proofRequirement: input.proofRequirement,
    requestedTier: input.requestedTier
  });

  const opcRequired = deriveRiskOpcRequired({
    decision,
    proofRequirement: input.proofRequirement,
    requestedTier: input.requestedTier,
    c2Boundary: input.c2Boundary
  });

  const auditRequired =
    auditState === "ENABLED" ||
    auditState === "REQUIRED" ||
    auditState === "MANDATORY" ||
    auditState === "BLOCKED" ||
    auditState === "FAIL_CLOSED";

  const allowed =
    decision === "ALLOW" ||
    decision === "ALLOW_WITH_AUDIT" ||
    decision === "ALLOW_WITH_MANDATORY_AUDIT" ||
    decision === "ESCALATE";

  const failClosed = decision === "FAIL_CLOSED";

  const reason = buildRiskReason({
    normalized: input,
    riskLevel,
    decision,
    auditState
  });

  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    riskLevel,
    decision,
    auditState,
    contextClass: input.contextClass,
    dataClassification: input.dataClassification,
    operationalValue: input.operationalValue,
    cyberRelevance: input.cyberRelevance,
    proofRequirement: input.proofRequirement,
    c2Boundary: input.c2Boundary,
    evtRequired,
    opcRequired,
    auditRequired,
    allowed,
    failClosed,
    legalCertification: false,
    reason,
    safeRedirection: deriveSafeRedirection(input, decision),
    boundary:
      "Runtime risk policy evaluates request context before model selection. " +
      `${RUNTIME_BOUNDARY_SUMMARY.opc}. ${RUNTIME_BOUNDARY_SUMMARY.evt}. ` +
      "C2 Defense is restricted to authorized defensive cyber use. legalCertification = false."
  };
}

export function createBlockedRuntimeRiskResult(reason: string): RuntimeRiskPolicyResult {
  return {
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    riskLevel: "BLOCKED",
    decision: "BLOCK",
    auditState: "BLOCKED",
    contextClass: "CYBER_DEFENSE",
    dataClassification: "RESTRICTED",
    operationalValue: "CRITICAL",
    cyberRelevance: "BLOCKED",
    proofRequirement: "MANDATORY_AUDIT",
    c2Boundary: "BLOCKED_HARMFUL_CYBER",
    evtRequired: true,
    opcRequired: false,
    auditRequired: true,
    allowed: false,
    failClosed: false,
    legalCertification: false,
    reason,
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
      "Request blocked by runtime risk policy. C2 Defense is restricted to authorized defensive cyber use. legalCertification = false."
  };
}

export function buildRuntimeRiskPromptFrame(result: RuntimeRiskPolicyResult): string {
  return [
    "HBCE Runtime Risk Policy",
    `Project: ${result.project}`,
    `Release: ${result.targetRelease}`,
    `Risk level: ${result.riskLevel}`,
    `Decision: ${result.decision}`,
    `Audit state: ${result.auditState}`,
    `Context class: ${result.contextClass}`,
    `Data classification: ${result.dataClassification}`,
    `Operational value: ${result.operationalValue}`,
    `Cyber relevance: ${result.cyberRelevance}`,
    `C2 boundary: ${result.c2Boundary}`,
    `Proof requirement: ${result.proofRequirement}`,
    `EVT required: ${result.evtRequired}`,
    `OPC required: ${result.opcRequired}`,
    `Audit required: ${result.auditRequired}`,
    `Allowed: ${result.allowed}`,
    `Fail closed: ${result.failClosed}`,
    `Legal certification: ${result.legalCertification}`,
    `Reason: ${result.reason}`,
    `Boundary: ${result.boundary}`
  ].join("\n");
}

export function toPublicRuntimeRiskPolicyResult(result: RuntimeRiskPolicyResult): {
  project: string;
  targetRelease: string;
  riskLevel: RuntimeRiskLevel;
  decision: RuntimeDecision;
  auditState: RuntimeAuditState;
  contextClass: RuntimeContextClass;
  dataClassification: RuntimeDataClassification;
  operationalValue: OperationalValueLevel;
  cyberRelevance: CyberRelevance;
  proofRequirement: ProofRequirement;
  c2Boundary: C2BoundaryState;
  evtRequired: boolean;
  opcRequired: boolean;
  auditRequired: boolean;
  allowed: boolean;
  failClosed: boolean;
  legalCertification: false;
  reason: string;
  safeRedirection: string[];
  boundary: string;
} {
  return {
    project: result.project,
    targetRelease: result.targetRelease,
    riskLevel: result.riskLevel,
    decision: result.decision,
    auditState: result.auditState,
    contextClass: result.contextClass,
    dataClassification: result.dataClassification,
    operationalValue: result.operationalValue,
    cyberRelevance: result.cyberRelevance,
    proofRequirement: result.proofRequirement,
    c2Boundary: result.c2Boundary,
    evtRequired: result.evtRequired,
    opcRequired: result.opcRequired,
    auditRequired: result.auditRequired,
    allowed: result.allowed,
    failClosed: result.failClosed,
    legalCertification: false,
    reason: result.reason,
    safeRedirection: result.safeRedirection,
    boundary: result.boundary
  };
}

export function getRuntimeRiskPolicyHealth(): RuntimeRiskPolicyHealth {
  return {
    configured: true,
    project: HBCE_SAAS_PROJECT,
    targetRelease: HBCE_SAAS_TARGET_RELEASE,
    defaultDecision: "ALLOW",
    failClosedEnabled: true,
    c2DefenseRestricted: true,
    legalCertification: false,
    boundary:
      "Runtime risk policy is configured. C2 Defense is restricted to authorized defensive cyber use. OPC is a technical proof receipt only. legalCertification = false."
  };
}
