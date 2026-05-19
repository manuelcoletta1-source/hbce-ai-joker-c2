/**
 * AI JOKER-C2 Policy Engine
 *
 * Deterministic policy evaluation for the HBCE / IPR governed runtime.
 *
 * This module decides whether a request is:
 * - ALLOWED
 * - RESTRICTED
 * - PROHIBITED
 * - UNKNOWN
 *
 * The policy engine does not execute operations.
 * It defines the boundary before runtime execution, model calls, file handling,
 * EVT generation, EVT/IPR-bound memory, OPC proof receipts or ledger operations.
 *
 * Canonical hierarchy:
 * - IPR = primary operational identity and proof instrument
 * - AI JOKER-C2 = governed runtime demonstrator
 * - MATRIX = project collection, architectural framework and HBCE coordination module
 * - U.S.E. = MATRIX-derived political-institutional application
 * - CORPUS_ESOTEROLOGIA_ERMETICA = disciplinary grammar
 * - APOKALYPSIS = historical threshold analysis
 * - HBCE_ECOSISTEMA_AI = AI governance ecosystem collection
 * - EVT = event trace
 * - EVT/IPR memory = runtime continuity
 * - OPC = operational proof receipt
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  PolicyEvaluation,
  PolicyOutcome,
  PolicyStatus,
  ProjectDomain
} from "./runtime-types";

export type PolicyEngineInput = {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  dataClass?: DataClass;
  projectDomain?: ProjectDomain;
  hasFiles?: boolean;
  route?: string;
};

type PolicyRule = {
  policyReference: string;
  status: PolicyStatus;
  outcome: PolicyOutcome;
  failClosed: boolean;
  terms: string[];
  reason: string;
};

const PROHIBITED_POLICY_RULES: PolicyRule[] = [
  {
    policyReference: "PROHIBITED_OFFENSIVE_CYBER",
    status: "PROHIBITED",
    outcome: "PROHIBIT",
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
    outcome: "PROHIBIT",
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
    outcome: "PROHIBIT",
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
    outcome: "PROHIBIT",
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
  },
  {
    policyReference: "PROHIBITED_DEMOCRATIC_CHOICE_LINKAGE",
    status: "PROHIBITED",
    outcome: "PROHIBIT",
    failClosed: true,
    reason:
      "Request appears to link personal identity with democratic vote or civic-choice content.",
    terms: [
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
    ]
  }
];

const RESTRICTED_POLICY_RULES: PolicyRule[] = [
  {
    policyReference: "RESTRICTED_HBCE_AI_GOVERNANCE",
    status: "RESTRICTED",
    outcome: "REQUIRE_AUDIT",
    failClosed: false,
    reason:
      "Request involves HBCE ECOSISTEMA AI, AI governance, model governance or AI audit and requires audit-aware handling.",
    terms: [
      "hbce ecosistema ai",
      "ecosistema ai",
      "ai governance",
      "governance ai",
      "governance dell ai",
      "governance dell'ai",
      "governo dell ai",
      "governo dell'ai",
      "governare l ai",
      "governare l'ai",
      "ai audit",
      "audit ai",
      "audit dell ai",
      "audit dell'ai",
      "ipr ai audit trail",
      "model governance",
      "governance modelli",
      "modelli ai esterni",
      "external ai models",
      "openai",
      "anthropic",
      "claude",
      "google ai",
      "gemini",
      "meta ai",
      "llama",
      "mistral",
      "runtime ai governato",
      "runtime governato ai",
      "responsible ai",
      "trustworthy ai",
      "human oversight ai",
      "fail-closed ai",
      "matrix ai governance"
    ]
  },
  {
    policyReference: "RESTRICTED_USE_CIVIC_DEMOCRATIC_INFRASTRUCTURE",
    status: "RESTRICTED",
    outcome: "REQUIRE_AUDIT",
    failClosed: false,
    reason:
      "Request involves U.S.E., civic participation or democratic infrastructure and requires democratic safeguards.",
    terms: [
      "u.s.e.",
      "united states of europe",
      "stati uniti d europa",
      "stati uniti d'europa",
      "federated digital vote",
      "federated digital voting",
      "voto digitale federato",
      "democratic infrastructure",
      "infrastruttura democratica",
      "public consultation",
      "consultazione pubblica",
      "referendum infrastructure",
      "infrastruttura referendaria",
      "referendum digitale",
      "civic participation",
      "partecipazione civica",
      "public decision",
      "decisione pubblica",
      "identity verified first",
      "choice separated",
      "vote anonymized",
      "process auditable"
    ]
  },
  {
    policyReference: "RESTRICTED_SECURITY_SENSITIVE",
    status: "RESTRICTED",
    outcome: "REQUIRE_AUDIT",
    failClosed: false,
    reason: "Request is security-sensitive and must remain defensive.",
    terms: [
      "security",
      "cybersecurity",
      "cyber security",
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
      "vulnerabilità",
      "bonifica",
      "segreti"
    ]
  },
  {
    policyReference: "RESTRICTED_CRITICAL_INFRASTRUCTURE",
    status: "RESTRICTED",
    outcome: "REQUIRE_REVIEW",
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
      "infrastrutture critiche",
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
    outcome: "REQUIRE_AUDIT",
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
    outcome: "REQUIRE_AUDIT",
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
    outcome: "REQUIRE_AUDIT",
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
    outcome: "REQUIRE_AUDIT",
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

const SAFE_IPR_PROOF_TERMS = [
  "ipr",
  "identity primary record",
  "operational identity",
  "evt",
  "evt protocol",
  "event trace",
  "evt/ipr memory",
  "memory",
  "opc",
  "opc proof",
  "proof receipt",
  "proof record",
  "chain hash",
  "audit receipt",
  "ledger",
  "verification",
  "runtime diagnostics",
  "identita operativa",
  "traccia evento",
  "ricevuta di prova"
];

const SAFE_AI_GOVERNANCE_TERMS = [
  "hbce ecosistema ai",
  "ecosistema ai",
  "ai governance",
  "governance ai",
  "governare l ai",
  "governance dell ai",
  "ai audit",
  "audit ai",
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
  "matrix ai governance"
];

export function evaluatePolicy(input: PolicyEngineInput): PolicyEvaluation {
  const normalized = normalizeInput(input);
  const reasons: string[] = [];

  if (!normalized.trim()) {
    return buildPolicy({
      status: "UNKNOWN",
      outcome: "UNKNOWN",
      policyReference: "UNKNOWN_EMPTY_INPUT",
      prohibited: false,
      failClosed: true,
      reasons: ["Input is empty or not meaningful."]
    });
  }

  if (input.intentClass === "PROHIBITED") {
    return buildPolicy({
      status: "PROHIBITED",
      outcome: "PROHIBIT",
      policyReference: "PROHIBITED_INTENT_CLASS",
      prohibited: true,
      failClosed: true,
      reasons: ["Intent classifier marked the request as PROHIBITED."]
    });
  }

  const prohibitedRule = matchPolicyRule(normalized, PROHIBITED_POLICY_RULES);

  if (prohibitedRule) {
    return buildPolicy({
      status: "PROHIBITED",
      outcome: "PROHIBIT",
      policyReference: prohibitedRule.policyReference,
      prohibited: true,
      failClosed: true,
      reasons: [
        prohibitedRule.reason,
        ...matchedTermsReason(normalized, prohibitedRule.terms)
      ]
    });
  }

  const dataPolicy = evaluateDataClassPolicy(input);

  if (dataPolicy) {
    return dataPolicy;
  }

  if (looksLikeSafeAiGovernanceWork(normalized, input)) {
    return buildPolicy({
      status: "RESTRICTED",
      outcome: "REQUIRE_AUDIT",
      policyReference: "RESTRICTED_HBCE_AI_GOVERNANCE_SAFE_WORK",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to involve HBCE ECOSISTEMA AI, AI governance, AI audit or model governance.",
        "This is allowed as audit-aware governance work.",
        "The model layer must not become the authority layer."
      ]
    });
  }

  const restrictedByContext = evaluateContextRestriction(input);

  if (restrictedByContext) {
    reasons.push(restrictedByContext.reason);
  }

  const restrictedRule = matchPolicyRule(normalized, RESTRICTED_POLICY_RULES);

  if (restrictedRule) {
    reasons.push(restrictedRule.reason);
    reasons.push(...matchedTermsReason(normalized, restrictedRule.terms));

    return buildPolicy({
      status: "RESTRICTED",
      outcome: restrictedRule.outcome,
      policyReference: restrictedRule.policyReference,
      prohibited: false,
      failClosed: restrictedRule.failClosed || Boolean(restrictedByContext?.failClosed),
      reasons: uniqueReasons(reasons)
    });
  }

  if (restrictedByContext) {
    return buildPolicy({
      status: "RESTRICTED",
      outcome: restrictedByContext.outcome,
      policyReference: restrictedByContext.policyReference,
      prohibited: false,
      failClosed: restrictedByContext.failClosed,
      reasons: uniqueReasons(reasons)
    });
  }

  if (looksLikeAllowedDocumentation(normalized, input)) {
    return buildPolicy({
      status: "ALLOWED",
      outcome: "PERMIT",
      policyReference: "ALLOWED_REPOSITORY_DOCUMENTATION",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to be documentation, repository or governance-safe work."
      ]
    });
  }

  if (looksLikeSafeIprProofWork(normalized, input)) {
    return buildPolicy({
      status: "ALLOWED",
      outcome: "PERMIT",
      policyReference: "ALLOWED_IPR_EVT_OPC_GOVERNANCE_WORK",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to involve IPR, EVT, memory, OPC, ledger or verification governance work.",
        "This is allowed when used for audit, traceability and runtime governance."
      ]
    });
  }

  if (looksLikeSafeDefensiveWork(normalized)) {
    return buildPolicy({
      status: "RESTRICTED",
      outcome: "REQUIRE_AUDIT",
      policyReference: "RESTRICTED_DEFENSIVE_SECURITY_ONLY",
      prohibited: false,
      failClosed: false,
      reasons: [
        "Request appears to be defensive security support.",
        "Output must remain defensive, documentation-oriented and non-offensive."
      ]
    });
  }

  if (input.hasFiles) {
    return buildPolicy({
      status: "RESTRICTED",
      outcome: "REQUIRE_AUDIT",
      policyReference: "RESTRICTED_FILE_CONTEXT",
      prohibited: false,
      failClosed: false,
      reasons: [
        "File context is present and requires controlled data handling."
      ]
    });
  }

  return buildPolicy({
    status: "ALLOWED",
    outcome: "PERMIT",
    policyReference: "ALLOWED_GENERAL_REQUEST",
    prohibited: false,
    failClosed: false,
    reasons: ["No prohibited or restricted policy trigger matched."]
  });
}

export function evaluatePolicyFromClassification(input: {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  dataClass?: DataClass;
  projectDomain?: ProjectDomain;
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

function evaluateDataClassPolicy(input: PolicyEngineInput): PolicyEvaluation | null {
  switch (input.dataClass) {
    case "SECRET":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_REVIEW",
        policyReference: "RESTRICTED_SECRET_DATA",
        prohibited: false,
        failClosed: true,
        reasons: [
          "Input or file context appears to contain secret data.",
          "Secret data must not be processed as ordinary runtime content."
        ]
      });

    case "UNSUPPORTED":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_REVIEW",
        policyReference: "RESTRICTED_UNSUPPORTED_DATA",
        prohibited: false,
        failClosed: true,
        reasons: [
          "Input or file context appears to contain unsupported data.",
          "Unsupported data cannot be processed as ordinary runtime content."
        ]
      });

    case "CRITICAL_OPERATIONAL":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_REVIEW",
        policyReference: "RESTRICTED_CRITICAL_OPERATIONAL_DATA",
        prohibited: false,
        failClosed: true,
        reasons: [
          "Input or file context appears to contain critical operational data.",
          "Critical operational data requires strict review and minimization."
        ]
      });

    case "DEMOCRATIC_CHOICE":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_REVIEW",
        policyReference: "RESTRICTED_DEMOCRATIC_CHOICE_DATA",
        prohibited: false,
        failClosed: true,
        reasons: [
          "Input appears to contain democratic vote or civic-choice content.",
          "The system must preserve identity-choice separation and must not link vote content to personal identity."
        ]
      });

    case "CIVIC_SENSITIVE":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_AUDIT",
        policyReference: "RESTRICTED_CIVIC_SENSITIVE_DATA",
        prohibited: false,
        failClosed: false,
        reasons: [
          "Input appears to contain civic-sensitive data.",
          "Civic-sensitive data requires democratic safeguards and audit-aware handling."
        ]
      });

    case "CONFIDENTIAL":
    case "PERSONAL":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_AUDIT",
        policyReference:
          input.dataClass === "PERSONAL"
            ? "RESTRICTED_PERSONAL_DATA"
            : "RESTRICTED_CONFIDENTIAL_DATA",
        prohibited: false,
        failClosed: false,
        reasons: [
          `${input.dataClass} data requires minimization and review before operational use.`
        ]
      });

    case "SECURITY_SENSITIVE":
      return buildPolicy({
        status: "RESTRICTED",
        outcome: "REQUIRE_AUDIT",
        policyReference: "RESTRICTED_SECURITY_SENSITIVE_DATA",
        prohibited: false,
        failClosed: false,
        reasons: [
          "Security-sensitive data requires defensive-only handling and review."
        ]
      });

    case "UNKNOWN":
      return buildPolicy({
        status: "UNKNOWN",
        outcome: "UNKNOWN",
        policyReference: "UNKNOWN_DATA_CLASS",
        prohibited: false,
        failClosed: true,
        reasons: ["Data sensitivity is unknown and must be handled conservatively."]
      });

    default:
      return null;
  }
}

function evaluateContextRestriction(input: PolicyEngineInput):
  | {
      policyReference: string;
      reason: string;
      outcome: PolicyOutcome;
      failClosed: boolean;
    }
  | null {
  switch (input.contextClass) {
    case "SECURITY":
      return {
        policyReference: "RESTRICTED_SECURITY_CONTEXT",
        reason: "SECURITY context requires defensive-only policy handling.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "COMPLIANCE":
      return {
        policyReference: "RESTRICTED_COMPLIANCE_CONTEXT",
        reason: "COMPLIANCE context requires review-oriented handling.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "AI_GOVERNANCE":
      return {
        policyReference: "RESTRICTED_AI_GOVERNANCE_CONTEXT",
        reason: "AI_GOVERNANCE context requires governance-aware handling.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "HBCE_ECOSISTEMA_AI":
      return {
        policyReference: "RESTRICTED_HBCE_ECOSISTEMA_AI_CONTEXT",
        reason:
          "HBCE_ECOSISTEMA_AI context requires AI governance, auditability and model-governance boundaries.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "CRITICAL_INFRASTRUCTURE":
      return {
        policyReference: "RESTRICTED_CRITICAL_INFRASTRUCTURE_CONTEXT",
        reason:
          "CRITICAL_INFRASTRUCTURE context requires escalation, review and documentation-only boundaries.",
        outcome: "REQUIRE_REVIEW",
        failClosed: true
      };

    case "DUAL_USE":
      return {
        policyReference: "RESTRICTED_DUAL_USE_CONTEXT",
        reason: "DUAL_USE context requires controlled civil and strategic boundaries.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "STRATEGIC":
      return {
        policyReference: "RESTRICTED_STRATEGIC_CONTEXT",
        reason: "STRATEGIC context may require review before external use.",
        outcome: "REQUIRE_AUDIT",
        failClosed: false
      };

    case "USE":
    case "CIVIC":
    case "DEMOCRATIC_INFRASTRUCTURE":
      return {
        policyReference: "RESTRICTED_USE_CIVIC_CONTEXT",
        reason:
          "U.S.E., CIVIC or DEMOCRATIC_INFRASTRUCTURE context requires identity-choice separation, anonymization and auditability.",
        outcome:
          input.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
            ? "REQUIRE_REVIEW"
            : "REQUIRE_AUDIT",
        failClosed: input.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
      };

    case "PUBLIC_ADMINISTRATION":
      return {
        policyReference: "RESTRICTED_PUBLIC_ADMINISTRATION_CONTEXT",
        reason: "PUBLIC_ADMINISTRATION context requires institutional reviewability.",
        outcome: "REQUIRE_AUDIT",
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

function looksLikeSafeIprProofWork(
  text: string,
  input: PolicyEngineInput
): boolean {
  if (
    input.contextClass === "IPR" ||
    input.contextClass === "IDENTITY" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE"
  ) {
    return containsAny(text, SAFE_IPR_PROOF_TERMS);
  }

  return containsAny(text, SAFE_IPR_PROOF_TERMS) && containsAny(text, [
    "documentation",
    "docs/",
    "governance",
    "audit",
    "verification",
    "runtime",
    "ledger",
    "protocol",
    "model",
    "schema",
    "traceability",
    "documentazione",
    "verifica",
    "tracciabilita"
  ]);
}

function looksLikeSafeAiGovernanceWork(
  text: string,
  input: PolicyEngineInput
): boolean {
  if (
    input.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "AI_GOVERNANCE"
  ) {
    return true;
  }

  return containsAny(text, SAFE_AI_GOVERNANCE_TERMS) && containsAny(text, [
    "documentation",
    "documentazione",
    "governance",
    "audit",
    "verification",
    "verifica",
    "runtime",
    "model",
    "modello",
    "schema",
    "protocol",
    "protocollo",
    "risk",
    "rischio",
    "oversight",
    "supervisione",
    "tracciabilita",
    "traceability"
  ]);
}

function looksLikeSafeDefensiveWork(text: string): boolean {
  return containsAny(text, SAFE_DEFENSIVE_TERMS);
}

function buildPolicy(input: {
  status: PolicyStatus;
  outcome: PolicyOutcome;
  policyReference: string;
  prohibited: boolean;
  failClosed: boolean;
  reasons: string[];
}): PolicyEvaluation {
  return {
    status: input.status,
    policyReference: input.policyReference,
    prohibited: input.prohibited,
    failClosed: input.failClosed,
    reasons: uniqueReasons(input.reasons),
    outcome: input.outcome
  };
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
      input.projectDomain ?? "",
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
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
