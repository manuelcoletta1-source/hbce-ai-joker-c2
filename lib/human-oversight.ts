/**
 * AI JOKER-C2 Human Oversight Engine
 *
 * Deterministic human oversight evaluation for the HBCE / MATRIX governed runtime.
 *
 * This module transforms:
 * - risk class
 * - context class
 * - policy status
 * - data class
 * - runtime sensitivity
 *
 * into:
 * - oversight state
 * - required reviewer role
 * - review reason
 *
 * AI may assist.
 * Humans remain responsible.
 */

import type {
  ContextClass,
  DataClass,
  OversightEvaluation,
  OversightState,
  PolicyStatus,
  ReviewerRole,
  RiskClass,
  RuntimeSensitivity
} from "./runtime-types";

export type HumanOversightInput = {
  riskClass: RiskClass;
  contextClass: ContextClass;
  policyStatus: PolicyStatus;
  dataClass?: DataClass;
  sensitivity?: RuntimeSensitivity;
  message?: string;
};

type OversightRuleResult = {
  state: OversightState;
  requiredRole: ReviewerRole;
  reason: string;
};

const PUBLIC_SECTOR_TERMS = [
  "public sector",
  "public administration",
  "public authority",
  "municipality",
  "region",
  "agency",
  "procurement",
  "public communication",
  "citizen",
  "public service",
  "pubblica amministrazione",
  "autorita pubblica",
  "comune",
  "regione",
  "appalto",
  "gara pubblica",
  "comunicazione pubblica",
  "cittadino",
  "servizio pubblico"
];

const LEGAL_TERMS = [
  "legal",
  "lawful",
  "liability",
  "contract",
  "certification",
  "regulatory",
  "compliance claim",
  "legal review",
  "legale",
  "responsabilita",
  "contratto",
  "certificazione",
  "regolatorio",
  "revisione legale"
];

const SECURITY_TERMS = [
  "security",
  "cybersecurity",
  "incident",
  "soc",
  "vulnerability",
  "breach",
  "secret",
  "token",
  "api key",
  "private key",
  "password",
  "credential",
  "sicurezza",
  "cyber",
  "incidente",
  "vulnerabilita",
  "segreto",
  "credenziale"
];

const CRITICAL_INFRASTRUCTURE_TERMS = [
  "critical infrastructure",
  "energy",
  "telecom",
  "hospital",
  "healthcare",
  "transport",
  "water system",
  "utility",
  "emergency",
  "civil protection",
  "infrastruttura critica",
  "energia",
  "ospedale",
  "sanita",
  "trasporti",
  "protezione civile"
];

export function evaluateHumanOversight(
  input: HumanOversightInput
): OversightEvaluation {
  const normalizedMessage = normalizeText(input.message ?? "");

  const prohibited = evaluateProhibitedOversight(input);

  if (prohibited) {
    return prohibited;
  }

  const dataOverride = evaluateDataOversight(input);

  if (dataOverride) {
    return dataOverride;
  }

  const criticalContextOverride = evaluateCriticalContextOversight(
    input,
    normalizedMessage
  );

  if (criticalContextOverride) {
    return criticalContextOverride;
  }

  const riskBased = evaluateRiskOversight(input, normalizedMessage);

  if (riskBased) {
    return riskBased;
  }

  return {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Low-risk operation with no sensitive policy, data or context trigger detected."
  };
}

export function requiresHumanReview(
  oversight: OversightEvaluation
): boolean {
  return (
    oversight.state === "REQUIRED" ||
    oversight.state === "ESCALATED" ||
    oversight.state === "UNKNOWN"
  );
}

export function blocksHumanOversight(
  oversight: OversightEvaluation
): boolean {
  return oversight.state === "BLOCKED" || oversight.state === "REJECTED";
}

export function isOversightEscalated(
  oversight: OversightEvaluation
): boolean {
  return oversight.state === "ESCALATED";
}

export function isOversightOptional(
  oversight: OversightEvaluation
): boolean {
  return (
    oversight.state === "NOT_REQUIRED" || oversight.state === "RECOMMENDED"
  );
}

export function getReviewerRoleForContext(
  contextClass: ContextClass,
  message = ""
): ReviewerRole {
  const normalizedMessage = normalizeText(message);

  if (containsAny(normalizedMessage, CRITICAL_INFRASTRUCTURE_TERMS)) {
    return "INCIDENT_COMMANDER";
  }

  if (containsAny(normalizedMessage, SECURITY_TERMS)) {
    return "SECURITY_OFFICER";
  }

  if (containsAny(normalizedMessage, LEGAL_TERMS)) {
    return "LEGAL_REVIEWER";
  }

  if (containsAny(normalizedMessage, PUBLIC_SECTOR_TERMS)) {
    return "INSTITUTIONAL_AUTHORITY";
  }

  switch (contextClass) {
    case "SECURITY":
      return "SECURITY_OFFICER";

    case "COMPLIANCE":
      return "AUDITOR";

    case "CRITICAL_INFRASTRUCTURE":
      return "INCIDENT_COMMANDER";

    case "AI_GOVERNANCE":
      return "REVIEWER";

    case "DUAL_USE":
      return "APPROVER";

    case "TECHNICAL":
    case "GITHUB":
      return "MAINTAINER";

    case "STRATEGIC":
      return "APPROVER";

    case "DOCUMENTAL":
      return "REVIEWER";

    case "IDENTITY":
      return "AUDITOR";

    default:
      return "REVIEWER";
  }
}

export function buildOversightLabel(
  oversight: OversightEvaluation
): string {
  switch (oversight.state) {
    case "NOT_REQUIRED":
      return "Human review is not required for ordinary low-risk use.";

    case "RECOMMENDED":
      return "Human review is recommended before relying on this output.";

    case "REQUIRED":
      return "Human review is required before operational use.";

    case "COMPLETED":
      return "Human review has been completed.";

    case "REJECTED":
      return "Human review rejected this operation.";

    case "ESCALATED":
      return "Higher authority or specialist review is required.";

    case "BLOCKED":
      return "Human oversight cannot authorize this prohibited operation.";

    case "UNKNOWN":
      return "Human oversight requirement is unknown and must be handled conservatively.";

    default:
      return "Human oversight state is undefined.";
  }
}

function evaluateProhibitedOversight(
  input: HumanOversightInput
): OversightRuleResult | null {
  if (input.policyStatus === "PROHIBITED" || input.riskClass === "PROHIBITED") {
    return {
      state: "BLOCKED",
      requiredRole: "NONE",
      reason:
        "Operation is prohibited. Human oversight cannot authorize prohibited activity."
    };
  }

  return null;
}

function evaluateDataOversight(
  input: HumanOversightInput
): OversightRuleResult | null {
  switch (input.dataClass) {
    case "SECRET":
      return {
        state: "ESCALATED",
        requiredRole: "SECURITY_OFFICER",
        reason:
          "SECRET data detected. Security review and containment are required before any further processing."
      };

    case "CRITICAL_OPERATIONAL":
      return {
        state: "ESCALATED",
        requiredRole: "INCIDENT_COMMANDER",
        reason:
          "CRITICAL_OPERATIONAL data detected. Specialist authority is required before operational reliance."
      };

    case "PERSONAL":
      return {
        state: "REQUIRED",
        requiredRole: "DATA_PROTECTION_REVIEWER",
        reason:
          "PERSONAL data requires minimization and data protection review before operational use."
      };

    case "CONFIDENTIAL":
      return {
        state: "REQUIRED",
        requiredRole: "REVIEWER",
        reason:
          "CONFIDENTIAL data requires human review and controlled handling."
      };

    case "SECURITY_SENSITIVE":
      return {
        state: "REQUIRED",
        requiredRole: "SECURITY_OFFICER",
        reason:
          "SECURITY_SENSITIVE data requires defensive security review."
      };

    case "UNKNOWN":
      return {
        state: "ESCALATED",
        requiredRole: "REVIEWER",
        reason:
          "Data sensitivity is UNKNOWN and must not be treated as ordinary safe content."
      };

    default:
      return null;
  }
}

function evaluateCriticalContextOversight(
  input: HumanOversightInput,
  normalizedMessage: string
): OversightRuleResult | null {
  if (input.contextClass === "CRITICAL_INFRASTRUCTURE") {
    return {
      state: "ESCALATED",
      requiredRole: "INCIDENT_COMMANDER",
      reason:
        "CRITICAL_INFRASTRUCTURE context requires specialist review and documentation-only boundaries."
    };
  }

  if (containsAny(normalizedMessage, CRITICAL_INFRASTRUCTURE_TERMS)) {
    return {
      state: "ESCALATED",
      requiredRole: "INCIDENT_COMMANDER",
      reason:
        "Critical infrastructure terms detected. Escalation is required before operational reliance."
    };
  }

  if (input.contextClass === "DUAL_USE") {
    return {
      state: "REQUIRED",
      requiredRole: "APPROVER",
      reason:
        "DUAL_USE context requires controlled civil and strategic review before operational use."
    };
  }

  if (containsAny(normalizedMessage, PUBLIC_SECTOR_TERMS)) {
    return {
      state: "REQUIRED",
      requiredRole: "INSTITUTIONAL_AUTHORITY",
      reason:
        "Public-sector or institutional authority context detected. Human institutional review is required."
    };
  }

  if (containsAny(normalizedMessage, LEGAL_TERMS)) {
    return {
      state: "REQUIRED",
      requiredRole: "LEGAL_REVIEWER",
      reason:
        "Legal or compliance-sensitive terms detected. Qualified review is required."
    };
  }

  if (containsAny(normalizedMessage, SECURITY_TERMS)) {
    return {
      state: "REQUIRED",
      requiredRole: "SECURITY_OFFICER",
      reason:
        "Security-sensitive terms detected. Defensive security review is required."
    };
  }

  return null;
}

function evaluateRiskOversight(
  input: HumanOversightInput,
  normalizedMessage: string
): OversightRuleResult | null {
  const reviewerRole = getReviewerRoleForContext(
    input.contextClass,
    normalizedMessage
  );

  if (input.riskClass === "CRITICAL") {
    return {
      state: "ESCALATED",
      requiredRole: reviewerRole,
      reason:
        "CRITICAL risk requires escalation before any operational reliance."
    };
  }

  if (input.riskClass === "HIGH") {
    return {
      state: "REQUIRED",
      requiredRole: reviewerRole,
      reason:
        "HIGH risk requires human review before operational use."
    };
  }

  if (input.riskClass === "UNKNOWN") {
    return {
      state: "ESCALATED",
      requiredRole: reviewerRole,
      reason:
        "UNKNOWN risk requires conservative escalation."
    };
  }

  if (input.riskClass === "MEDIUM") {
    if (
      input.policyStatus === "RESTRICTED" ||
      input.sensitivity === "HIGH" ||
      input.contextClass === "SECURITY" ||
      input.contextClass === "COMPLIANCE" ||
      input.contextClass === "AI_GOVERNANCE"
    ) {
      return {
        state: "REQUIRED",
        requiredRole: reviewerRole,
        reason:
          "MEDIUM risk in restricted, sensitive or governance-relevant context requires human review."
      };
    }

    return {
      state: "RECOMMENDED",
      requiredRole: reviewerRole,
      reason:
        "MEDIUM risk should be reviewed before relying on the output."
    };
  }

  if (input.riskClass === "LOW") {
    if (input.policyStatus === "RESTRICTED") {
      return {
        state: "RECOMMENDED",
        requiredRole: reviewerRole,
        reason:
          "LOW risk with restricted policy status should still receive human review before external use."
      };
    }

    if (input.contextClass === "GITHUB" || input.contextClass === "TECHNICAL") {
      return {
        state: "RECOMMENDED",
        requiredRole: "MAINTAINER",
        reason:
          "Technical or repository changes should be reviewed before commit or deployment."
      };
    }

    return {
      state: "NOT_REQUIRED",
      requiredRole: "NONE",
      reason:
        "LOW risk operation does not require human review before ordinary use."
    };
  }

  return null;
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
