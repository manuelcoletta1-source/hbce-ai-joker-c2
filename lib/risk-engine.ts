/**
 * AI JOKER-C2 Risk Engine
 *
 * Deterministic risk classification for the HBCE / IPR governed runtime.
 *
 * This module transforms:
 * - context classification
 * - intent classification
 * - policy evaluation
 * - data classification
 * - file presence
 * - sensitivity indicators
 *
 * into:
 * - RiskClass
 * - probability
 * - impact
 * - risk score
 * - explainable reasons
 *
 * Safe European strategic autonomy, MATRIX, U.S.E., HBCE ECOSISTEMA AI
 * and IPR documentation must not be escalated as CRITICAL merely because
 * they discuss strategic, institutional, civic or AI-governance architecture.
 *
 * Political, institutional, European-standardization, U.S.E. civic-governance
 * and HBCE AI-governance analysis should remain answerable, but audit-ready
 * when governance, security, compliance, institutional, B2B/B2G or model-risk
 * context is present.
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  PolicyStatus,
  ProjectDomain,
  RiskClass,
  RiskEvaluation,
  RuntimeSensitivity
} from "./runtime-types";

export type RiskEngineInput = {
  message?: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  policyStatus: PolicyStatus;
  dataClass?: DataClass;
  sensitivity?: RuntimeSensitivity;
  hasFiles?: boolean;
  route?: string;
  projectDomain?: ProjectDomain;
  policyFailClosed?: boolean;
  policyProhibited?: boolean;
};

type RiskSeed = {
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  reasons: string[];
};

type RiskAdjustment = {
  probability: number;
  impact: number;
  reasons: string[];
};

const CRITICAL_TERMS = [
  "secret",
  "api key",
  "private key",
  "password",
  "credential",
  "token",
  "production",
  "live system",
  "critical infrastructure",
  "public safety",
  "hospital",
  "healthcare",
  "energy grid",
  "power grid",
  "telecom",
  "transport",
  "water system",
  "emergency",
  "law enforcement",
  "surveillance",
  "exploit",
  "malware",
  "sabotage",
  "autonomous weapon",
  "targeting",
  "electoral infrastructure",
  "vote de-anonymization",
  "de-anonymize vote",
  "identity-choice linkage",
  "link voter identity to vote",
  "segreto",
  "chiave api",
  "password",
  "credenziali",
  "produzione",
  "sistema live",
  "infrastruttura critica",
  "sicurezza pubblica",
  "ospedale",
  "sanita",
  "rete elettrica",
  "emergenza",
  "sorveglianza",
  "infrastruttura elettorale",
  "deanonimizzare il voto",
  "collegare identita e voto"
];

const HIGH_TERMS = [
  "incident",
  "breach",
  "vulnerability",
  "security",
  "cybersecurity",
  "audit",
  "compliance",
  "legal",
  "procurement",
  "public administration",
  "public sector",
  "public service",
  "confidential",
  "personal data",
  "data protection",
  "human oversight",
  "dual-use",
  "critical",
  "deployment",
  "logs",
  "public consultation",
  "referendum",
  "federated digital vote",
  "federated digital voting",
  "democratic infrastructure",
  "civic infrastructure",
  "ai audit",
  "ai governance",
  "model governance",
  "external ai models",
  "modelli ai esterni",
  "incidente",
  "violazione",
  "vulnerabilita",
  "sicurezza",
  "audit",
  "conformita",
  "legale",
  "appalto",
  "pubblica amministrazione",
  "servizio pubblico",
  "confidenziale",
  "dati personali",
  "protezione dati",
  "supervisione umana",
  "deploy",
  "consultazione pubblica",
  "voto digitale federato",
  "infrastruttura democratica"
];

const UNSAFE_OPERATIONAL_TERMS = [
  "malware",
  "ransomware",
  "phishing",
  "credential theft",
  "steal credentials",
  "rubare credenziali",
  "exploit",
  "deploy exploit",
  "unauthorized access",
  "accesso non autorizzato",
  "bypass authentication",
  "evade detection",
  "evasion",
  "persistence",
  "backdoor",
  "botnet",
  "exfiltrate",
  "esfiltrare",
  "sabotage",
  "sabotaggio",
  "ddos",
  "unlawful surveillance",
  "sorveglianza illegale",
  "hide traces",
  "cover tracks",
  "nascondere tracce",
  "weapon",
  "arma autonoma",
  "targeting",
  "vote de-anonymization",
  "de-anonymize vote",
  "deanonymize vote",
  "identity-choice linkage",
  "link voter identity to vote",
  "political manipulation",
  "coercive civic influence",
  "deanonimizzare il voto",
  "collegare identita e voto",
  "manipolazione politica",
  "coercizione civica"
];

const EUROPEAN_STRATEGIC_AUTONOMY_TERMS = [
  "europa",
  "europea",
  "europeo",
  "europei",
  "europee",
  "ue",
  "unione europea",
  "europe",
  "european",
  "dipendenze estere",
  "dipendenze tecnologiche",
  "dipendenze strategiche",
  "dipendenza tecnologica",
  "dipendenza strategica",
  "dipendenze penalizzanti",
  "autonomia strategica",
  "autonomia tecnologica",
  "sovranita digitale",
  "sovranita tecnologica",
  "asse tecnologico",
  "asse tecnologico europeo",
  "standard europeo",
  "standardizzazione europea",
  "standardizzata in linea europea",
  "standardizata in linea europea",
  "governance imprese",
  "governance cittadini",
  "imprese cittadini",
  "imprese e cittadini",
  "cittadini",
  "imprese",
  "b2b",
  "b2g",
  "matrix",
  "ipr",
  "evt",
  "hbce"
];

const SAFE_CIVIC_ARCHITECTURE_TERMS = [
  "u.s.e.",
  "u.s.e",
  "use",
  "united states of europe",
  "stati uniti d europa",
  "stati uniti d'europa",
  "federated digital vote",
  "federated digital voting",
  "voto digitale federato",
  "public consultation",
  "consultazione pubblica",
  "referendum infrastructure",
  "infrastruttura referendaria",
  "democratic infrastructure",
  "infrastruttura democratica",
  "digital sovereignty",
  "sovranita digitale",
  "constitutional operational",
  "costituzione operativa",
  "identity verified first",
  "choice separated",
  "vote anonymized",
  "process auditable"
];

const POLITICAL_INSTITUTIONAL_VALUE_TERMS = [
  "valore politico",
  "politicamente",
  "valore istituzionale",
  "standardizzata",
  "standardizata",
  "standardizzato",
  "standardizato",
  "standardizzazione",
  "standardization",
  "in linea europea",
  "linea europea",
  "governance europea",
  "istituzioni europee",
  "unione europea",
  "federazione europea",
  "sovranita digitale",
  "democrazia verificabile",
  "partecipazione civica",
  "voto digitale federato",
  "public administration",
  "public sector",
  "public decision",
  "decisione pubblica",
  "constitutional operational",
  "costituzione operativa"
];

const SAFE_HBCE_AI_GOVERNANCE_TERMS = [
  "hbce ecosistema ai",
  "ecosistema ai",
  "governance ai",
  "ai governance",
  "governare l ai",
  "governo dell ai",
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
  "human oversight ai",
  "runtime ai governato",
  "runtime governato ai",
  "matrix ai governance",
  "ai genera hbce governa",
  "ai generates hbce governs"
];

export function evaluateRisk(input: RiskEngineInput): RiskEvaluation {
  const normalized = normalizeInput(input);

  if (input.policyProhibited || input.policyStatus === "PROHIBITED") {
    return buildRisk("PROHIBITED", 5, 5, [
      "Policy evaluation marked the request as prohibited.",
      "Prohibited policy always produces PROHIBITED risk."
    ]);
  }

  if (input.intentClass === "PROHIBITED") {
    return buildRisk("PROHIBITED", 5, 5, [
      "Intent classifier marked the request as prohibited.",
      "Prohibited intent always produces PROHIBITED risk."
    ]);
  }

  if (findMatches(normalized, UNSAFE_OPERATIONAL_TERMS).length > 0) {
    return buildRisk("PROHIBITED", 5, 5, [
      "Unsafe operational or prohibited-use terms were detected.",
      "Requests that may enable abuse, offensive capability, surveillance abuse, vote de-anonymization or civic coercion are prohibited."
    ]);
  }

  if (input.dataClass === "SECRET") {
    return buildRisk("CRITICAL", 3, 5, [
      "Data class is SECRET.",
      "Secrets must not be processed as ordinary runtime content."
    ]);
  }

  if (input.dataClass === "DEMOCRATIC_CHOICE") {
    return buildRisk("CRITICAL", 4, 5, [
      "Data class is DEMOCRATIC_CHOICE.",
      "Democratic choice content requires strict protection and must not be linked to personal identity."
    ]);
  }

  if (input.dataClass === "CRITICAL_OPERATIONAL") {
    return buildRisk("CRITICAL", 4, 5, [
      "Data class is CRITICAL_OPERATIONAL.",
      "Critical operational data requires strict review."
    ]);
  }

  if (isSafeHbceAiGovernanceAnalysis(input, normalized)) {
    return buildRisk("MEDIUM", 2, 3, [
      "Safe HBCE ECOSISTEMA AI / AI governance analysis detected.",
      "The request is governance-oriented, architectural or audit-oriented, not an unsafe operational instruction.",
      "AI governance work should remain answerable with audit-ready model-governance boundaries."
    ]);
  }

  if (isPoliticalInstitutionalValueAnalysis(input, normalized)) {
    return buildRisk("MEDIUM", 2, 3, [
      "Political, institutional or European-standardization value analysis detected.",
      "The request is safe and answerable, but it concerns public governance, institutional positioning or European standardization.",
      "The output should remain audit-ready and should not be treated as official institutional validation."
    ]);
  }

  if (isSafeUseCivicArchitectureAnalysis(input, normalized)) {
    return buildRisk("MEDIUM", 2, 3, [
      "Safe U.S.E. civic or democratic infrastructure architecture detected.",
      "The request is conceptual, institutional or governance-oriented, not an operational voter-targeting or identity-choice linkage request.",
      "U.S.E. work should remain answerable with audit-ready democratic safeguards."
    ]);
  }

  if (isSafeEuropeanStrategicAutonomyAnalysis(input, normalized)) {
    return buildRisk("MEDIUM", 2, 3, [
      "Safe European strategic autonomy / technological dependency analysis detected.",
      "The request is strategic, institutional and analytical, not an operational harmful instruction.",
      "MATRIX / European governance analysis should remain answerable with reviewable framing and audit-ready handling."
    ]);
  }

  if (input.policyStatus === "UNKNOWN") {
    return buildRisk("UNKNOWN", 3, 4, [
      "Policy status is UNKNOWN.",
      "Unknown policy state must be handled conservatively."
    ]);
  }

  const reasons: string[] = [];
  const seed = seedRiskFromContext(input.contextClass);
  reasons.push(...seed.reasons);

  const intentAdjustment = adjustRiskByIntent(input.intentClass);
  const dataAdjustment = adjustRiskByDataClass(input.dataClass);
  const sensitivityAdjustment = adjustRiskBySensitivity(input.sensitivity);
  const fileAdjustment = adjustRiskByFiles(Boolean(input.hasFiles));
  const routeAdjustment = adjustRiskByRoute(input.route ?? "");
  const termAdjustment = adjustRiskByTerms(normalized);
  const policyAdjustment = adjustRiskByPolicy(
    input.policyStatus,
    Boolean(input.policyFailClosed)
  );
  const projectAdjustment = adjustRiskByProjectDomain(input.projectDomain);

  const probability = clampScore(
    seed.probability +
      intentAdjustment.probability +
      dataAdjustment.probability +
      sensitivityAdjustment.probability +
      fileAdjustment.probability +
      routeAdjustment.probability +
      termAdjustment.probability +
      policyAdjustment.probability +
      projectAdjustment.probability
  );

  const impact = clampScore(
    seed.impact +
      intentAdjustment.impact +
      dataAdjustment.impact +
      sensitivityAdjustment.impact +
      fileAdjustment.impact +
      routeAdjustment.impact +
      termAdjustment.impact +
      policyAdjustment.impact +
      projectAdjustment.impact
  );

  reasons.push(
    ...intentAdjustment.reasons,
    ...dataAdjustment.reasons,
    ...sensitivityAdjustment.reasons,
    ...fileAdjustment.reasons,
    ...routeAdjustment.reasons,
    ...termAdjustment.reasons,
    ...policyAdjustment.reasons,
    ...projectAdjustment.reasons
  );

  const riskScore = probability * impact;
  const riskClass = classifyRiskClass({
    probability,
    impact,
    riskScore,
    contextClass: input.contextClass,
    policyStatus: input.policyStatus,
    dataClass: input.dataClass,
    sensitivity: input.sensitivity
  });

  return {
    riskClass,
    probability,
    impact,
    riskScore,
    reasons: uniqueReasons([
      ...reasons,
      `Risk score calculated as ${probability} x ${impact} = ${riskScore}.`,
      `Risk classified as ${riskClass}.`
    ])
  };
}

export function evaluateRiskFromRuntime(input: RiskEngineInput): RiskEvaluation {
  return evaluateRisk(input);
}

export function isLowRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "LOW";
}

export function isMediumRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "MEDIUM";
}

export function isHighRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "HIGH";
}

export function isCriticalRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "CRITICAL";
}

export function isProhibitedRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "PROHIBITED";
}

export function isUnknownRisk(risk: RiskEvaluation): boolean {
  return risk.riskClass === "UNKNOWN";
}

export function requiresRiskEscalation(risk: RiskEvaluation): boolean {
  return (
    risk.riskClass === "HIGH" ||
    risk.riskClass === "CRITICAL" ||
    risk.riskClass === "UNKNOWN" ||
    risk.riskClass === "PROHIBITED"
  );
}

export function requiresRiskAudit(risk: RiskEvaluation): boolean {
  return (
    risk.riskClass === "MEDIUM" ||
    risk.riskClass === "HIGH" ||
    risk.riskClass === "CRITICAL" ||
    risk.riskClass === "UNKNOWN"
  );
}

function seedRiskFromContext(contextClass: ContextClass): RiskSeed {
  switch (contextClass) {
    case "GENERAL":
      return {
        probability: 1,
        impact: 1,
        reasons: ["GENERAL context starts from LOW baseline."]
      };

    case "EDITORIAL":
      return {
        probability: 1,
        impact: 2,
        reasons: ["EDITORIAL context has low operational impact by default."]
      };

    case "DOCUMENTAL":
      return {
        probability: 2,
        impact: 2,
        reasons: ["DOCUMENTAL context may involve file or content handling."]
      };

    case "GITHUB":
      return {
        probability: 2,
        impact: 2,
        reasons: ["GITHUB context may affect repository state or documentation."]
      };

    case "TECHNICAL":
      return {
        probability: 2,
        impact: 3,
        reasons: ["TECHNICAL context may affect runtime behavior."]
      };

    case "IDENTITY":
    case "IPR":
      return {
        probability: 2,
        impact: 3,
        reasons: ["IDENTITY/IPR context affects attribution, proof and continuity."]
      };

    case "MATRIX":
      return {
        probability: 2,
        impact: 3,
        reasons: ["MATRIX context has strategic architecture relevance."]
      };

    case "USE":
      return {
        probability: 2,
        impact: 3,
        reasons: [
          "U.S.E. context involves civic or institutional architecture and requires audit-aware handling."
        ]
      };

    case "CIVIC":
      return {
        probability: 2,
        impact: 3,
        reasons: ["CIVIC context may affect public participation or civic process design."]
      };

    case "PUBLIC_ADMINISTRATION":
      return {
        probability: 3,
        impact: 3,
        reasons: ["PUBLIC_ADMINISTRATION context requires institutional reviewability."]
      };

    case "DEMOCRATIC_INFRASTRUCTURE":
      return {
        probability: 3,
        impact: 4,
        reasons: [
          "DEMOCRATIC_INFRASTRUCTURE context is high-impact and requires strict democratic safeguards."
        ]
      };

    case "STRATEGIC":
      return {
        probability: 2,
        impact: 3,
        reasons: ["STRATEGIC context may affect external positioning."]
      };

    case "GOVERNANCE":
      return {
        probability: 2,
        impact: 3,
        reasons: ["GOVERNANCE context requires reviewable institutional framing."]
      };

    case "COMPLIANCE":
      return {
        probability: 3,
        impact: 3,
        reasons: ["COMPLIANCE context requires audit-aware handling."]
      };

    case "HBCE_ECOSISTEMA_AI":
      return {
        probability: 2,
        impact: 3,
        reasons: [
          "HBCE_ECOSISTEMA_AI context requires AI governance, model-governance and audit-aware handling."
        ]
      };

    case "AI_GOVERNANCE":
      return {
        probability: 2,
        impact: 3,
        reasons: ["AI_GOVERNANCE context requires policy and oversight handling."]
      };

    case "DUAL_USE":
      return {
        probability: 3,
        impact: 4,
        reasons: ["DUAL_USE context requires controlled strategic handling."]
      };

    case "SECURITY":
      return {
        probability: 3,
        impact: 4,
        reasons: ["SECURITY context is dual-use sensitive by default."]
      };

    case "CRITICAL_INFRASTRUCTURE":
      return {
        probability: 4,
        impact: 5,
        reasons: [
          "CRITICAL_INFRASTRUCTURE context requires conservative high-impact handling."
        ]
      };

    case "CORPUS":
      return {
        probability: 1,
        impact: 2,
        reasons: ["CORPUS context is theoretical/editorial by default."]
      };

    case "APOKALYPSIS":
      return {
        probability: 2,
        impact: 2,
        reasons: ["APOKALYPSIS context is historical-threshold analysis by default."]
      };

    default:
      return {
        probability: 2,
        impact: 2,
        reasons: ["Unknown context baseline defaulted to conservative MEDIUM."]
      };
  }
}

function adjustRiskByIntent(intentClass: IntentClass): RiskAdjustment {
  switch (intentClass) {
    case "PROHIBITED":
      return {
        probability: 5,
        impact: 5,
        reasons: ["PROHIBITED intent forces maximum risk adjustment."]
      };

    case "SECURITY":
      return {
        probability: 1,
        impact: 1,
        reasons: ["SECURITY intent increases dual-use sensitivity."]
      };

    case "GOVERNANCE":
      return {
        probability: 0,
        impact: 1,
        reasons: ["GOVERNANCE intent increases review relevance."]
      };

    case "VERIFY":
      return {
        probability: 0,
        impact: 1,
        reasons: ["VERIFY intent may affect audit or evidence interpretation."]
      };

    case "CODE":
      return {
        probability: 1,
        impact: 1,
        reasons: ["CODE intent may affect runtime implementation."]
      };

    case "GITHUB":
      return {
        probability: 1,
        impact: 0,
        reasons: ["GITHUB intent may affect repository content."]
      };

    case "STRATEGIC":
      return {
        probability: 0,
        impact: 1,
        reasons: ["STRATEGIC intent requires reviewable framing."]
      };

    case "CIVIC":
      return {
        probability: 1,
        impact: 1,
        reasons: ["CIVIC intent increases democratic safeguard relevance."]
      };

    case "UNKNOWN":
      return {
        probability: 1,
        impact: 1,
        reasons: ["UNKNOWN intent increases uncertainty."]
      };

    default:
      return {
        probability: 0,
        impact: 0,
        reasons: []
      };
  }
}

function adjustRiskByDataClass(dataClass?: DataClass): RiskAdjustment {
  switch (dataClass) {
    case "PUBLIC":
      return {
        probability: 0,
        impact: 0,
        reasons: ["PUBLIC data does not increase risk by itself."]
      };

    case "INTERNAL":
      return {
        probability: 0,
        impact: 1,
        reasons: ["INTERNAL data requires careful handling."]
      };

    case "CONFIDENTIAL":
      return {
        probability: 1,
        impact: 2,
        reasons: ["CONFIDENTIAL data increases impact."]
      };

    case "SENSITIVE":
      return {
        probability: 1,
        impact: 2,
        reasons: ["SENSITIVE data requires minimization and review."]
      };

    case "PERSONAL":
      return {
        probability: 1,
        impact: 2,
        reasons: ["PERSONAL data requires minimization and review."]
      };

    case "CIVIC_SENSITIVE":
      return {
        probability: 1,
        impact: 2,
        reasons: ["CIVIC_SENSITIVE data requires democratic safeguard review."]
      };

    case "DEMOCRATIC_CHOICE":
      return {
        probability: 2,
        impact: 4,
        reasons: [
          "DEMOCRATIC_CHOICE data is high-impact and must not be linked to personal identity."
        ]
      };

    case "SECURITY_SENSITIVE":
      return {
        probability: 1,
        impact: 2,
        reasons: ["SECURITY_SENSITIVE data increases security risk."]
      };

    case "SECRET":
      return {
        probability: 2,
        impact: 4,
        reasons: ["SECRET data strongly increases risk."]
      };

    case "CRITICAL_OPERATIONAL":
      return {
        probability: 2,
        impact: 4,
        reasons: ["CRITICAL_OPERATIONAL data strongly increases risk."]
      };

    case "UNSUPPORTED":
      return {
        probability: 2,
        impact: 3,
        reasons: ["UNSUPPORTED data cannot be safely processed as ordinary content."]
      };

    case "UNKNOWN":
      return {
        probability: 1,
        impact: 2,
        reasons: ["UNKNOWN data sensitivity requires conservative handling."]
      };

    default:
      return {
        probability: 0,
        impact: 0,
        reasons: []
      };
  }
}

function adjustRiskBySensitivity(sensitivity?: RuntimeSensitivity): RiskAdjustment {
  switch (sensitivity) {
    case "HIGH":
      return {
        probability: 1,
        impact: 2,
        reasons: ["Runtime sensitivity is HIGH."]
      };

    case "MEDIUM":
      return {
        probability: 1,
        impact: 1,
        reasons: ["Runtime sensitivity is MEDIUM."]
      };

    case "UNKNOWN":
      return {
        probability: 1,
        impact: 1,
        reasons: ["Runtime sensitivity is UNKNOWN."]
      };

    case "LOW":
    default:
      return {
        probability: 0,
        impact: 0,
        reasons: []
      };
  }
}

function adjustRiskByFiles(hasFiles: boolean): RiskAdjustment {
  if (!hasFiles) {
    return {
      probability: 0,
      impact: 0,
      reasons: []
    };
  }

  return {
    probability: 1,
    impact: 1,
    reasons: ["File context is present and increases data handling risk."]
  };
}

function adjustRiskByRoute(route: string): RiskAdjustment {
  const normalizedRoute = normalizeText(route);

  if (!normalizedRoute) {
    return {
      probability: 0,
      impact: 0,
      reasons: []
    };
  }

  if (
    normalizedRoute.includes("/api/files") ||
    normalizedRoute.includes("files")
  ) {
    return {
      probability: 1,
      impact: 1,
      reasons: ["File API route increases data handling risk."]
    };
  }

  if (
    normalizedRoute.includes("/api/opc") ||
    normalizedRoute.includes("opc")
  ) {
    return {
      probability: 1,
      impact: 1,
      reasons: ["OPC route affects proof receipt generation and audit metadata."]
    };
  }

  if (
    normalizedRoute.includes("/api/evidence") ||
    normalizedRoute.includes("evidence")
  ) {
    return {
      probability: 1,
      impact: 2,
      reasons: ["Evidence route increases audit and data exposure sensitivity."]
    };
  }

  if (
    normalizedRoute.includes("/api/verify") ||
    normalizedRoute.includes("verify")
  ) {
    return {
      probability: 0,
      impact: 1,
      reasons: ["Verification route affects audit interpretation."]
    };
  }

  if (normalizedRoute.includes("/api/chat") || normalizedRoute.includes("chat")) {
    return {
      probability: 0,
      impact: 0,
      reasons: ["Chat route has no additional route risk by itself."]
    };
  }

  return {
    probability: 0,
    impact: 0,
    reasons: []
  };
}

function adjustRiskByTerms(text: string): RiskAdjustment {
  const criticalMatches = findMatches(text, CRITICAL_TERMS);

  if (criticalMatches.length > 0) {
    return {
      probability: 1,
      impact: 2,
      reasons: [
        `Critical sensitivity terms detected: ${criticalMatches.join(", ")}.`
      ]
    };
  }

  const highMatches = findMatches(text, HIGH_TERMS);

  if (highMatches.length > 0) {
    return {
      probability: 1,
      impact: 1,
      reasons: [`High sensitivity terms detected: ${highMatches.join(", ")}.`]
    };
  }

  return {
    probability: 0,
    impact: 0,
    reasons: []
  };
}

function adjustRiskByPolicy(
  policyStatus: PolicyStatus,
  policyFailClosed: boolean
): RiskAdjustment {
  if (policyStatus === "RESTRICTED" && policyFailClosed) {
    return {
      probability: 1,
      impact: 2,
      reasons: ["Policy is RESTRICTED with fail-closed requirement."]
    };
  }

  if (policyStatus === "RESTRICTED") {
    return {
      probability: 1,
      impact: 1,
      reasons: ["Policy is RESTRICTED."]
    };
  }

  if (policyStatus === "UNKNOWN") {
    return {
      probability: 1,
      impact: 2,
      reasons: ["Policy is UNKNOWN."]
    };
  }

  return {
    probability: 0,
    impact: 0,
    reasons: []
  };
}

function adjustRiskByProjectDomain(
  projectDomain?: ProjectDomain
): RiskAdjustment {
  switch (projectDomain) {
    case "U.S.E.":
      return {
        probability: 0,
        impact: 1,
        reasons: ["U.S.E. project domain requires democratic safeguard awareness."]
      };

    case "HBCE_ECOSISTEMA_AI":
      return {
        probability: 0,
        impact: 1,
        reasons: [
          "HBCE_ECOSISTEMA_AI project domain requires AI governance and model-governance awareness."
        ]
      };

    case "MATRIX":
      return {
        probability: 0,
        impact: 0,
        reasons: []
      };

    case "MULTI_DOMAIN":
      return {
        probability: 0,
        impact: 1,
        reasons: ["MULTI_DOMAIN operation affects more than one project domain."]
      };

    default:
      return {
        probability: 0,
        impact: 0,
        reasons: []
      };
  }
}

function classifyRiskClass(input: {
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  contextClass: ContextClass;
  policyStatus: PolicyStatus;
  dataClass?: DataClass;
  sensitivity?: RuntimeSensitivity;
}): RiskClass {
  if (input.policyStatus === "PROHIBITED") {
    return "PROHIBITED";
  }

  if (input.policyStatus === "UNKNOWN") {
    return "UNKNOWN";
  }

  if (input.dataClass === "SECRET" || input.dataClass === "CRITICAL_OPERATIONAL") {
    return "CRITICAL";
  }

  if (input.dataClass === "DEMOCRATIC_CHOICE") {
    return "CRITICAL";
  }

  if (
    input.contextClass === "CRITICAL_INFRASTRUCTURE" &&
    input.riskScore >= 12
  ) {
    return "CRITICAL";
  }

  if (
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" &&
    input.riskScore >= 12
  ) {
    return "HIGH";
  }

  if (
    (input.contextClass === "HBCE_ECOSISTEMA_AI" ||
      input.contextClass === "AI_GOVERNANCE") &&
    input.riskScore <= 6
  ) {
    return "MEDIUM";
  }

  if (input.riskScore >= 17) {
    return "CRITICAL";
  }

  if (input.riskScore >= 10) {
    return "HIGH";
  }

  if (input.riskScore >= 5) {
    return "MEDIUM";
  }

  return "LOW";
}

function isSafeEuropeanStrategicAutonomyAnalysis(
  input: RiskEngineInput,
  normalizedText: string
): boolean {
  if (input.policyProhibited || input.policyStatus === "PROHIBITED") {
    return false;
  }

  if (
    input.dataClass === "SECRET" ||
    input.dataClass === "CRITICAL_OPERATIONAL" ||
    input.dataClass === "SECURITY_SENSITIVE" ||
    input.dataClass === "DEMOCRATIC_CHOICE"
  ) {
    return false;
  }

  if (findMatches(normalizedText, UNSAFE_OPERATIONAL_TERMS).length > 0) {
    return false;
  }

  const matches = findMatches(normalizedText, EUROPEAN_STRATEGIC_AUTONOMY_TERMS);

  if (matches.length < 2) {
    return false;
  }

  const analyticalTerms = [
    "potrebbe",
    "puo",
    "ridurre",
    "togliere",
    "progettare",
    "governance",
    "standard",
    "futuro",
    "progressi",
    "potenzialita",
    "adottata",
    "in tutta europa",
    "imprese",
    "cittadini"
  ];

  const hasAnalyticalLanguage =
    findMatches(normalizedText, analyticalTerms).length > 0;

  return hasAnalyticalLanguage;
}

function isSafeUseCivicArchitectureAnalysis(
  input: RiskEngineInput,
  normalizedText: string
): boolean {
  if (input.policyProhibited || input.policyStatus === "PROHIBITED") {
    return false;
  }

  if (input.dataClass === "DEMOCRATIC_CHOICE") {
    return false;
  }

  if (findMatches(normalizedText, UNSAFE_OPERATIONAL_TERMS).length > 0) {
    return false;
  }

  const useMatches = findMatches(normalizedText, SAFE_CIVIC_ARCHITECTURE_TERMS);

  if (useMatches.length < 1) {
    return false;
  }

  const safeArchitectureTerms = [
    "architecture",
    "architettura",
    "model",
    "modello",
    "safeguard",
    "safeguards",
    "salvaguardia",
    "salvaguardie",
    "documentation",
    "documentazione",
    "concept",
    "concetto",
    "governance",
    "audit",
    "process",
    "processo",
    "privacy",
    "separazione",
    "separated",
    "anonymized",
    "anonimizzato"
  ];

  return findMatches(normalizedText, safeArchitectureTerms).length > 0;
}

function isSafeHbceAiGovernanceAnalysis(
  input: RiskEngineInput,
  normalizedText: string
): boolean {
  if (input.policyProhibited || input.policyStatus === "PROHIBITED") {
    return false;
  }

  if (
    input.dataClass === "SECRET" ||
    input.dataClass === "CRITICAL_OPERATIONAL" ||
    input.dataClass === "SECURITY_SENSITIVE" ||
    input.dataClass === "DEMOCRATIC_CHOICE"
  ) {
    return false;
  }

  if (findMatches(normalizedText, UNSAFE_OPERATIONAL_TERMS).length > 0) {
    return false;
  }

  const matches = findMatches(normalizedText, SAFE_HBCE_AI_GOVERNANCE_TERMS);

  if (matches.length < 1) {
    return false;
  }

  return (
    input.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "AI_GOVERNANCE" ||
    findMatches(normalizedText, [
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
      "traceability",
      "tracciabilita"
    ]).length > 0
  );
}

function isPoliticalInstitutionalValueAnalysis(
  input: RiskEngineInput,
  normalizedText: string
): boolean {
  if (input.policyProhibited || input.policyStatus === "PROHIBITED") {
    return false;
  }

  if (
    input.dataClass === "SECRET" ||
    input.dataClass === "CRITICAL_OPERATIONAL" ||
    input.dataClass === "SECURITY_SENSITIVE" ||
    input.dataClass === "DEMOCRATIC_CHOICE"
  ) {
    return false;
  }

  if (findMatches(normalizedText, UNSAFE_OPERATIONAL_TERMS).length > 0) {
    return false;
  }

  const matches = findMatches(normalizedText, POLITICAL_INSTITUTIONAL_VALUE_TERMS);

  if (matches.length === 0) {
    return false;
  }

  return (
    input.projectDomain === "MATRIX" ||
    input.projectDomain === "U.S.E." ||
    input.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "STRATEGIC" ||
    input.contextClass === "MATRIX" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "PUBLIC_ADMINISTRATION"
  );
}

function buildRisk(
  riskClass: RiskClass,
  probability: 1 | 2 | 3 | 4 | 5,
  impact: 1 | 2 | 3 | 4 | 5,
  reasons: string[]
): RiskEvaluation {
  return {
    riskClass,
    probability,
    impact,
    riskScore: probability * impact,
    reasons: uniqueReasons([
      ...reasons,
      `Risk score calculated as ${probability} x ${impact} = ${
        probability * impact
      }.`,
      `Risk classified as ${riskClass}.`
    ])
  };
}

function clampScore(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) {
    return 1;
  }

  if (value >= 5) {
    return 5;
  }

  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}

function normalizeInput(input: RiskEngineInput): string {
  return normalizeText(
    [
      input.message ?? "",
      input.route ?? "",
      input.contextClass,
      input.intentClass,
      input.policyStatus,
      input.projectDomain ?? "",
      input.dataClass ?? "",
      input.sensitivity ?? ""
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

function findMatches(text: string, terms: string[]): string[] {
  return terms
    .map((term) => normalizeText(term))
    .filter((term) => term.length > 0 && text.includes(term));
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
