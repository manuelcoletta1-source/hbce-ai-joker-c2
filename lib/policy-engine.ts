/**
 * AI JOKER-C2 Policy Engine
 *
 * Deterministic policy evaluation for the HBCE / MATRIX governed runtime.
 *
 * This module decides whether a request is:
 * - ALLOWED
 * - RESTRICTED
 * - PROHIBITED
 * - UNKNOWN
 *
 * The policy engine does not execute operations.
 * It defines the boundary before runtime execution, model calls, file handling,
 * EVT generation or ledger operations.
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  PolicyEvaluation,
  PolicyStatus
} from "./runtime-types";

export type PolicyEngineInput = {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  dataClass?: DataClass;
  hasFiles?: boolean;
  route?: string;
};

type PolicyRule = {
  policyReference: string;
  status: PolicyStatus;
  failClosed: boolean;
  terms: string[];
  reason: string;
};

const PROHIBITED_POLICY_RULES: PolicyRule[] = [
  {
    policyReference: "PROHIBITED_OFFENSIVE_CYBER",
    status: "PROHIBITED",
    failClosed: true,
    reason: "Request appears to involve offensive cyber capability.",
    terms: [
      "malware",
      "ransomware",
      "keylogger",
      "trojan",
      "rootkit",
      "botnet",
      "command and control",
      "c2 server",
      "exploit deployment",
      "deploy exploit",
      "weaponize exploit",
      "unauthorized access",
      "hack into",
      "bypass authentication",
      "privilege escalation against",
      "steal credentials",
      "credential theft",
      "phishing kit",
      "session hijacking",
      "exfiltrate data",
      "data exfiltration",
      "persistence mechanism",
      "evade detection",
      "evasion",
      "stealth",
      "disable antivirus",
      "bypass edr",
      "ddos",
      "sabotage",
      "destructive payload",
      "backdoor",
      "rubare credenziali",
      "accesso non autorizzato",
      "bucare un sistema",
      "creare malware",
      "crea malware",
      "phishing",
      "esfiltrare dati",
      "sabotare",
      "aggirare autenticazione",
      "aggirare antivirus"
    ]
  },
  {
    policyReference: "PROHIBITED_UNLAWFUL_SURVEILLANCE",
    status: "PROHIBITED",
    failClosed: true,
    reason: "Request appears to involve unlawful surveillance or targeting.",
    terms: [
      "unlawful surveillance",
      "spy on",
      "stalk",
      "track someone without consent",
      "hidden tracking",
      "covert monitoring",
      "illegal surveillance",
      "mass surveillance without authorization",
      "sorveglianza illegale",
      "spiare una persona",
      "tracciare senza consenso",
      "monitoraggio occulto"
    ]
  },
  {
    policyReference: "PROHIBITED_AUTONOMOUS_TARGETING",
    status: "PROHIBITED",
    failClosed: true,
    reason: "Request appears to involve autonomous targeting or weaponization.",
    terms: [
      "autonomous targeting",
      "lethal decision",
      "weapon targeting",
      "target selection",
      "autonomous weapon",
      "kill chain",
      "selezione bersaglio",
      "arma autonoma",
      "targeting autonomo"
    ]
  },
  {
    policyReference: "PROHIBITED_EVIDENCE_FABRICATION",
    status: "PROHIBITED",
    failClosed: true,
    reason: "Request appears to involve evidence fabrication or audit bypass.",
    terms: [
      "fabricate evidence",
      "fake evidence",
      "forge audit",
      "fake audit",
      "remove auditability",
      "bypass human oversight",
      "hide ai involvement",
      "falsificare prove",
      "falsifica prove",
      "fingere audit",
      "rimuovere auditabilita",
      "aggirare supervisione umana"
    ]
  }
];

const RESTRICTED_POLICY_RULES: PolicyRule[] = [
  {
    policyReference: "RESTRICTED_SECURITY_SENSITIVE",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request is security-sensitive and must remain defensive.",
    terms: [
      "security",
      "cybersecurity",
      "incident",
      "soc",
      "vulnerability",
      "cve",
      "hardening",
      "remediation",
      "threat",
      "breach",
      "logs",
      "siem",
      "edr",
      "xdr",
      "secrets",
      "api key",
      "token",
      "password",
      "private key",
      "sicurezza",
      "cyber",
      "incidente",
      "vulnerabilita",
      "bonifica",
      "segreti"
    ]
  },
  {
    policyReference: "RESTRICTED_CRITICAL_INFRASTRUCTURE",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request involves critical infrastructure or essential-service context.",
    terms: [
      "critical infrastructure",
      "energy grid",
      "power grid",
      "telecommunications",
      "telecom",
      "cloud infrastructure",
      "data center",
      "hospital",
      "healthcare",
      "transport",
      "rail",
      "water system",
      "utility",
      "public service",
      "emergency",
      "civil protection",
      "infrastruttura critica",
      "rete elettrica",
      "ospedale",
      "sanita",
      "trasporti",
      "servizio pubblico",
      "protezione civile"
    ]
  },
  {
    policyReference: "RESTRICTED_PUBLIC_SECTOR",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request involves public-sector, institutional or authority-sensitive context.",
    terms: [
      "public sector",
      "public administration",
      "public authority",
      "government",
      "municipality",
      "region",
      "agency",
      "procurement",
      "public communication",
      "citizen",
      "public service",
      "pa",
      "pubblica amministrazione",
      "autorita pubblica",
      "comune",
      "regione",
      "agenzia",
      "appalto",
      "gara pubblica",
      "comunicazione pubblica",
      "cittadini"
    ]
  },
  {
    policyReference: "RESTRICTED_COMPLIANCE_OR_LEGAL",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request involves compliance, legal, audit or certification-sensitive context.",
    terms: [
      "compliance",
      "legal",
      "legal review",
      "certification",
      "certified",
      "audit",
      "audit trail",
      "gdpr",
      "ai act",
      "nis2",
      "data protection",
      "dpo",
      "regulatory",
      "lawful basis",
      "conformita",
      "certificazione",
      "revisione legale",
      "protezione dati",
      "base giuridica",
      "audit"
    ]
  },
  {
    policyReference: "RESTRICTED_DUAL_USE",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request involves controlled civil and strategic dual-use positioning.",
    terms: [
      "dual-use",
      "dual use",
      "strategic",
      "civil strategic",
      "defensive strategic",
      "b2g",
      "b2b",
      "institutional",
      "critical systems",
      "uso duale",
      "dual use strategico",
      "strategico",
      "istituzionale"
    ]
  },
  {
    policyReference: "RESTRICTED_DEPLOYMENT",
    status: "RESTRICTED",
    failClosed: false,
    reason: "Request involves deployment, runtime exposure or operational environment.",
    terms: [
      "deploy",
      "deployment",
      "production",
      "vercel",
      "environment variable",
      "public demo",
      "controlled pilot",
      "api route",
      "runtime",
      "deployare",
      "produzione",
      "ambiente",
      "variabili ambiente",
      "demo pubblica",
      "pilota controllato"
    ]
  }
];

const ALLOWED_DOCUMENTATION_TERMS = [
  "readme",
  "documentation",
  "docs/",
  "markdown",
  "policy document",
  "overview",
  "template",
  "checklist",
  "roadmap",
  "contributing",
  "security.md",
  "compliance.md",
  "governance.md",
  "protocol.md",
  "documentazione",
  "modello",
  "indice",
  "tabella",
  "file",
  "commit"
];

const SAFE_DEFENSIVE_TERMS = [
  "defensive",
  "hardening",
  "remediation",
  "incident report",
  "security policy",
  "audit checklist",
  "risk register",
  "access review",
  "logging guidance",
  "defensive security",
  "difensivo",
  "bonifica",
  "mitigazione",
  "rapporto incidente",
  "checklist sicurezza"
];

export function evaluatePolicy(input: PolicyEngineInput): PolicyEvaluation {
  const normalized = normalizeInput(input);
  const reasons: string[] = [];

  if (!normalized.trim()) {
    return {
      status: "UNKNOWN",
      policyReference: "UNKNOWN_EMPTY_INPUT",
      prohibited: false,
      failClosed: true,
      reasons: ["Input is empty or not meaningful."]
    };
  }

  if (input.intentClass === "PROHIBITED") {
    return {
      status: "PROHIBITED",
      policyReference: "PROHIBITED_INTENT_CLASS",
      prohibited: true,
      failClosed: true,
      reasons: ["Intent classifier marked the request as PROHIBITED."]
    };
  }

  const prohibitedRule = matchPolicyRule(normalized, PROHIBITED_POLICY_RULES);

  if (prohibitedRule) {
    return {
      status: "PROHIBITED",
      policyReference: prohibitedRule.policyReference,
      prohibited: true,
      failClosed: true,
      reasons: [
        prohibitedRule.reason,
        ...matchedTermsReason(normalized, prohibitedRule.terms)
      ]
    };
  }

  if (input.dataClass === "SECRET") {
    return {
      status: "RESTRICTED",
      policyReference: "RESTRICTED_SECRET_DATA",
      prohibited: false,
      failClosed: true,
      reasons: [
        "Input or file context appears to contain secret data.",
        "Secret data must not be processed as ordinary content."
      ]
    };
  }

  if (input.dataClass === "CRITICAL_OPERATIONAL") {
    return {
      status: "RESTRICTED",
      policyReference: "RESTRICTED_CRITICAL_OPERATIONAL_DATA",
      prohibited: false,
      failClosed: true,
      reasons: [
        "Input or file context appears to contain critical operational data.",
        "Critical operational data requires strict review and minimization."
      ]
    };
  }

  const restrictedByContext = evaluateContextRestriction(input);

  if (restrictedByContext) {
    reasons.push(restrictedByContext.reason);
  }

  const restrictedRule = matchPolicyRule(normalized, RESTRICTED_POLICY_RULES);

  if (restrictedRule) {
    reasons.push(restrictedRule.reason);
    reasons.push(...matchedTermsReason(normalized, restrictedRule.terms));

    return {
      status: "RESTRICTED",
      policyReference: restrictedRule.policyReference,
      prohibited: false,
      failClosed: restrictedRule.failClosed || Boolean(restrictedByContext?.failClosed),
      reasons: uniqueReasons(reasons)
    };
  }

  if (restrictedByContext) {
    return {
      status: "RESTRICTED",
      policyReference: restrictedByContext.policyReference,
      prohibited: false,
      failClosed: restrictedByContext.failClosed,
      reasons: uniqueReasons(reasons)
    };
  }

  if (input.dataClass === "CONFIDENTIAL" || input.dataClass === "PERSONAL") {
    return {
      status: "RESTRICTED",
      policyReference:
        input.dataClass === "PERSONAL"
          ? "RESTRICTED_PERSONAL_DATA"
          : "RESTRICTED_CONFIDENTIAL_DATA",
      prohibited: false,
      failClosed: false,
      reasons: [
        `${input.dataClass} data requires minimization and review before operational use.`
      ]
    };
  }

  if (input.dataClass === "SECURITY_SENSITIVE") {
    return {
      status: "RESTRICTED",
      policyReference: "RESTRICTED_SECURITY_SENSITIVE_DATA",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Security-sensitive data requires defensive-only handling and review."
      ]
    };
  }

  if (input.dataClass === "UNKNOWN") {
    return {
      status: "UNKNOWN",
      policyReference: "UNKNOWN_DATA_CLASS",
      prohibited: false,
      failClosed: true,
      reasons: ["Data sensitivity is unknown and must be handled conservatively."]
    };
  }

  if (looksLikeAllowedDocumentation(normalized, input)) {
    return {
      status: "ALLOWED",
      policyReference: "ALLOWED_REPOSITORY_DOCUMENTATION",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to be documentation, repository or governance-safe work."
      ]
    };
  }

  if (looksLikeSafeDefensiveWork(normalized)) {
    return {
      status: "RESTRICTED",
      policyReference: "RESTRICTED_DEFENSIVE_SECURITY_ONLY",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to be defensive security support.",
        "Output must remain defensive, documentation-oriented and non-offensive."
      ]
    };
  }

  if (input.hasFiles) {
    return {
      status: "RESTRICTED",
      policyReference: "RESTRICTED_FILE_CONTEXT",
      prohibited: false,
      failClosed: false,
      reasons: [
        "File context is present and requires controlled data handling."
      ]
    };
  }

  return {
    status: "ALLOWED",
    policyReference: "ALLOWED_GENERAL_REQUEST",
    prohibited: false,
    failClosed: false,
    reasons: ["No prohibited or restricted policy trigger matched."]
  };
}

export function evaluatePolicyFromClassification(input: {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  dataClass?: DataClass;
  hasFiles?: boolean;
  route?: string;
}): PolicyEvaluation {
  return evaluatePolicy(input);
}

export function isPolicyAllowed(policy: PolicyEvaluation): boolean {
  return policy.status === "ALLOWED" && !policy.prohibited && !policy.failClosed;
}

export function isPolicyRestricted(policy: PolicyEvaluation): boolean {
  return policy.status === "RESTRICTED";
}

export function isPolicyProhibited(policy: PolicyEvaluation): boolean {
  return policy.status === "PROHIBITED" || policy.prohibited;
}

export function requiresPolicyFailClosed(policy: PolicyEvaluation): boolean {
  return policy.failClosed || policy.status === "PROHIBITED";
}

function evaluateContextRestriction(input: PolicyEngineInput):
  | {
      policyReference: string;
      reason: string;
      failClosed: boolean;
    }
  | null {
  switch (input.contextClass) {
    case "SECURITY":
      return {
        policyReference: "RESTRICTED_SECURITY_CONTEXT",
        reason: "SECURITY context requires defensive-only policy handling.",
        failClosed: false
      };

    case "COMPLIANCE":
      return {
        policyReference: "RESTRICTED_COMPLIANCE_CONTEXT",
        reason: "COMPLIANCE context requires review-oriented handling.",
        failClosed: false
      };

    case "AI_GOVERNANCE":
      return {
        policyReference: "RESTRICTED_AI_GOVERNANCE_CONTEXT",
        reason: "AI_GOVERNANCE context requires governance-aware handling.",
        failClosed: false
      };

    case "CRITICAL_INFRASTRUCTURE":
      return {
        policyReference: "RESTRICTED_CRITICAL_INFRASTRUCTURE_CONTEXT",
        reason:
          "CRITICAL_INFRASTRUCTURE context requires escalation, review and documentation-only boundaries.",
        failClosed: true
      };

    case "DUAL_USE":
      return {
        policyReference: "RESTRICTED_DUAL_USE_CONTEXT",
        reason: "DUAL_USE context requires controlled civil and strategic boundaries.",
        failClosed: false
      };

    case "STRATEGIC":
      return {
        policyReference: "RESTRICTED_STRATEGIC_CONTEXT",
        reason: "STRATEGIC context may require review before external use.",
        failClosed: false
      };

    default:
      return null;
  }
}

function matchPolicyRule(
  text: string,
  rules: PolicyRule[]
): PolicyRule | null {
  for (const rule of rules) {
    if (containsAny(text, rule.terms)) {
      return rule;
    }
  }

  return null;
}

function matchedTermsReason(text: string, terms: string[]): string[] {
  return terms
    .filter((term) => text.includes(normalizeText(term)))
    .map((term) => `Matched policy term: ${term}`);
}

function looksLikeAllowedDocumentation(
  text: string,
  input: PolicyEngineInput
): boolean {
  if (
    input.contextClass === "GITHUB" ||
    input.contextClass === "DOCUMENTAL" ||
    input.intentClass === "GITHUB" ||
    input.intentClass === "WRITE" ||
    input.intentClass === "TRANSFORM"
  ) {
    return containsAny(text, ALLOWED_DOCUMENTATION_TERMS);
  }

  return false;
}

function looksLikeSafeDefensiveWork(text: string): boolean {
  return containsAny(text, SAFE_DEFENSIVE_TERMS);
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function normalizeInput(input: PolicyEngineInput): string {
  return normalizeText(
    [
      input.message,
      input.route ?? "",
      input.contextClass,
      input.intentClass,
      input.dataClass ?? ""
    ]
      .filter(Boolean)
      .join(" ")
  );
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

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
