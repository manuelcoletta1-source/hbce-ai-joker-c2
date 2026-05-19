/**
 * AI JOKER-C2 Human Oversight Engine
 *
 * Deterministic human oversight evaluation for the HBCE / IPR governed runtime.
 *
 * This module transforms:
 * - risk class
 * - context class
 * - policy status
 * - data class
 * - runtime sensitivity
 * - project domain
 *
 * into:
 * - oversight state
 * - required reviewer role
 * - review reason
 *
 * AI may assist.
 * Humans remain responsible.
 *
 * Canonical hierarchy:
 * - IPR = primary operational identity and proof instrument
 * - AI JOKER-C2 = governed runtime demonstrator
 * - MATRIX = project collection, architectural framework and HBCE coordination module
 * - U.S.E. = MATRIX-derived political-institutional application
 * - HBCE_ECOSISTEMA_AI = AI governance ecosystem collection
 * - EVT = event trace
 * - EVT/IPR memory = runtime continuity
 * - OPC = operational proof receipt
 */

import type {
  ContextClass,
  DataClass,
  OversightEvaluation,
  OversightState,
  PolicyStatus,
  ProjectDomain,
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
  projectDomain?: ProjectDomain;
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
  "autorità pubblica",
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
  "constitutional review",
  "electoral law",
  "legale",
  "responsabilita",
  "responsabilità",
  "contratto",
  "certificazione",
  "regolatorio",
  "revisione legale",
  "revisione costituzionale",
  "legge elettorale"
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
  "vulnerabilità",
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
  "infrastrutture critiche",
  "energia",
  "ospedale",
  "sanita",
  "sanità",
  "trasporti",
  "protezione civile"
];

const CIVIC_INFRASTRUCTURE_TERMS = [
  "u.s.e.",
  "united states of europe",
  "stati uniti d europa",
  "stati uniti d'europa",
  "federated digital vote",
  "federated digital voting",
  "voto digitale federato",
  "public consultation",
  "consultazione pubblica",
  "referendum",
  "referendum infrastructure",
  "infrastruttura referendaria",
  "democratic infrastructure",
  "infrastruttura democratica",
  "civic participation",
  "partecipazione civica",
  "public decision",
  "decisione pubblica",
  "citizen identity",
  "identita cittadino",
  "identità cittadino",
  "eligibility verification",
  "verifica eleggibilita",
  "verifica eleggibilità",
  "participation rights",
  "diritti di partecipazione"
];

const DEMOCRATIC_CHOICE_LINKAGE_TERMS = [
  "vote de-anonymization",
  "de-anonymize vote",
  "deanonymize vote",
  "link voter identity to vote",
  "link identity to vote",
  "identity-choice linkage",
  "voter targeting",
  "political manipulation",
  "coercive civic influence",
  "collegare identita e voto",
  "collegare identità e voto",
  "collegare identita personale e scelta",
  "collegare identità personale e scelta",
  "deanonimizzare il voto",
  "de-anonimizzare il voto",
  "manipolazione politica",
  "coercizione civica"
];

const OPC_PROOF_TERMS = [
  "opc",
  "proof receipt",
  "proof record",
  "chain hash",
  "audit receipt",
  "event hash",
  "memory hash",
  "previous proof hash",
  "ricevuta di prova",
  "record di prova"
];

const HBCE_AI_GOVERNANCE_TERMS = [
  "hbce ecosistema ai",
  "ecosistema ai",
  "ai governance",
  "governance ai",
  "governo dell ai",
  "governo dell'ai",
  "governare l ai",
  "governare l'ai",
  "governance dell ai",
  "governance dell'ai",
  "ai audit",
  "audit ai",
  "audit dell ai",
  "audit dell'ai",
  "ipr ai audit trail",
  "model governance",
  "governance modelli",
  "external ai models",
  "modelli ai esterni",
  "openai",
  "anthropic",
  "claude",
  "google ai",
  "gemini",
  "meta ai",
  "llama",
  "mistral",
  "responsible ai",
  "trustworthy ai",
  "runtime ai governato",
  "runtime governato ai",
  "matrix ai governance",
  "human oversight ai",
  "fail-closed ai"
];

const MATRIX_MODULE_TERMS = [
  "modulo matrix",
  "matrix module",
  "matrix organizza",
  "matrix organizes",
  "sette moduli",
  "7 moduli",
  "seven modules",
  "coordinamento sistema",
  "coordinamento operativo",
  "organizzazione sistema",
  "organizzazione ecosistema",
  "system coordination",
  "operational coordination"
];

export function evaluateHumanOversight(
  input: HumanOversightInput
): OversightEvaluation {
  const normalizedMessage = normalizeText(input.message ?? "");

  const prohibited = evaluateProhibitedOversight(input, normalizedMessage);

  if (prohibited) {
    return prohibited;
  }

  const dataOverride = evaluateDataOversight(input);

  if (dataOverride) {
    return dataOverride;
  }

  const civicOverride = evaluateCivicOversight(input, normalizedMessage);

  if (civicOverride) {
    return civicOverride;
  }

  const aiGovernanceOverride = evaluateAiGovernanceOversight(
    input,
    normalizedMessage
  );

  if (aiGovernanceOverride) {
    return aiGovernanceOverride;
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
  message = "",
  projectDomain?: ProjectDomain
): ReviewerRole {
  const normalizedMessage = normalizeText(message);

  if (
    projectDomain === "U.S.E." ||
    contextClass === "USE" ||
    contextClass === "CIVIC" ||
    contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    containsAny(normalizedMessage, CIVIC_INFRASTRUCTURE_TERMS)
  ) {
    return "CIVIC_INFRASTRUCTURE_REVIEWER";
  }

  if (
    projectDomain === "HBCE_ECOSISTEMA_AI" ||
    contextClass === "HBCE_ECOSISTEMA_AI" ||
    contextClass === "AI_GOVERNANCE" ||
    containsAny(normalizedMessage, HBCE_AI_GOVERNANCE_TERMS)
  ) {
    return "TECHNICAL_REVIEWER";
  }

  if (containsAny(normalizedMessage, MATRIX_MODULE_TERMS)) {
    return "TECHNICAL_REVIEWER";
  }

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

    case "HBCE_ECOSISTEMA_AI":
    case "AI_GOVERNANCE":
      return "TECHNICAL_REVIEWER";

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
    case "IPR":
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
  input: HumanOversightInput,
  normalizedMessage: string
): OversightRuleResult | null {
  if (input.policyStatus === "PROHIBITED" || input.riskClass === "PROHIBITED") {
    return {
      state: "BLOCKED",
      requiredRole: "NONE",
      reason:
        "Operation is prohibited. Human oversight cannot authorize prohibited activity."
    };
  }

  if (
    input.dataClass === "DEMOCRATIC_CHOICE" &&
    containsAny(normalizedMessage, DEMOCRATIC_CHOICE_LINKAGE_TERMS)
  ) {
    return {
      state: "BLOCKED",
      requiredRole: "NONE",
      reason:
        "Democratic choice data appears linked to identity or coercive civic use. Human oversight cannot authorize identity-choice linkage."
    };
  }

  if (containsAny(normalizedMessage, DEMOCRATIC_CHOICE_LINKAGE_TERMS)) {
    return {
      state: "BLOCKED",
      requiredRole: "NONE",
      reason:
        "Request appears to involve vote de-anonymization, political manipulation or identity-choice linkage."
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

    case "DEMOCRATIC_CHOICE":
      return {
        state: "ESCALATED",
        requiredRole: "CIVIC_INFRASTRUCTURE_REVIEWER",
        reason:
          "DEMOCRATIC_CHOICE data detected. Strict civic review is required, and identity-choice linkage must remain prohibited."
      };

    case "CIVIC_SENSITIVE":
      return {
        state: "REQUIRED",
        requiredRole: "CIVIC_INFRASTRUCTURE_REVIEWER",
        reason:
          "CIVIC_SENSITIVE data requires democratic safeguards and civic infrastructure review before operational use."
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

function evaluateCivicOversight(
  input: HumanOversightInput,
  normalizedMessage: string
): OversightRuleResult | null {
  const civicContext =
    input.projectDomain === "U.S.E." ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    containsAny(normalizedMessage, CIVIC_INFRASTRUCTURE_TERMS);

  if (!civicContext) {
    return null;
  }

  if (
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    input.sensitivity === "HIGH" ||
    containsAny(normalizedMessage, [
      "federated digital vote",
      "federated digital voting",
      "voto digitale federato",
      "referendum",
      "public consultation",
      "consultazione pubblica",
      "eligibility verification",
      "verifica eleggibilita",
      "verifica eleggibilità",
      "electoral infrastructure",
      "infrastruttura elettorale"
    ])
  ) {
    return {
      state: "REQUIRED",
      requiredRole: "CIVIC_INFRASTRUCTURE_REVIEWER",
      reason:
        "Civic or democratic infrastructure context detected. Human review is required to preserve identity-choice separation, anonymity and auditability."
    };
  }

  if (input.riskClass === "LOW" && input.policyStatus === "ALLOWED") {
    return {
      state: "RECOMMENDED",
      requiredRole: "CIVIC_INFRASTRUCTURE_REVIEWER",
      reason:
        "U.S.E. civic documentation context detected. Human review is recommended before external or institutional use."
    };
  }

  return {
    state: "REQUIRED",
    requiredRole: "CIVIC_INFRASTRUCTURE_REVIEWER",
    reason:
      "U.S.E. or civic context detected. Review is required or recommended depending on operational use."
  };
}

function evaluateAiGovernanceOversight(
  input: HumanOversightInput,
  normalizedMessage: string
): OversightRuleResult | null {
  const aiGovernanceContext =
    input.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "AI_GOVERNANCE" ||
    containsAny(normalizedMessage, HBCE_AI_GOVERNANCE_TERMS);

  if (!aiGovernanceContext) {
    return null;
  }

  if (
    input.riskClass === "HIGH" ||
    input.riskClass === "CRITICAL" ||
    input.sensitivity === "HIGH"
  ) {
    return {
      state: "REQUIRED",
      requiredRole: "TECHNICAL_REVIEWER",
      reason:
        "HBCE ECOSISTEMA AI or AI governance context detected with high impact. Human technical review is required before operational reliance."
    };
  }

  if (
    containsAny(normalizedMessage, [
      "production",
      "deploy",
      "deployment",
      "public sector",
      "public administration",
      "critical infrastructure",
      "infrastrutture critiche",
      "pubblica amministrazione",
      "produzione",
      "deployare",
      "modelli ai esterni",
      "external ai models"
    ])
  ) {
    return {
      state: "REQUIRED",
      requiredRole: "TECHNICAL_REVIEWER",
      reason:
        "AI governance context includes deployment, public-sector, critical-infrastructure or external-model implications. Human technical review is required."
    };
  }

  if (
    input.riskClass === "MEDIUM" ||
    input.policyStatus === "RESTRICTED" ||
    containsAny(normalizedMessage, [
      "ai audit",
      "audit ai",
      "model governance",
      "governance modelli",
      "human oversight",
      "supervisione umana",
      "fail-closed"
    ])
  ) {
    return {
      state: "RECOMMENDED",
      requiredRole: "TECHNICAL_REVIEWER",
      reason:
        "HBCE ECOSISTEMA AI or AI governance context detected. Human technical review is recommended before external use or operational reliance."
    };
  }

  return {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Low-risk HBCE ECOSISTEMA AI explanation detected. Human review is not required for ordinary conceptual use."
  };
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

  if (containsAny(normalizedMessage, MATRIX_MODULE_TERMS)) {
    return {
      state: "RECOMMENDED",
      requiredRole: "TECHNICAL_REVIEWER",
      reason:
        "MATRIX module or seven-module HBCE coordination context detected. Technical review is recommended before external or production use."
    };
  }

  if (containsAny(normalizedMessage, OPC_PROOF_TERMS)) {
    return {
      state: "RECOMMENDED",
      requiredRole: "AUDITOR",
      reason:
        "OPC or proof receipt context detected. Audit review is recommended before relying on the proof chain externally."
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
    normalizedMessage,
    input.projectDomain
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
      input.contextClass === "AI_GOVERNANCE" ||
      input.contextClass === "HBCE_ECOSISTEMA_AI" ||
      input.contextClass === "GOVERNANCE" ||
      input.projectDomain === "U.S.E." ||
      input.projectDomain === "HBCE_ECOSISTEMA_AI"
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
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
