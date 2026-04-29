/**
 * AI JOKER-C2 Risk Engine
 *
 * Deterministic risk classification for the HBCE / MATRIX governed runtime.
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
 * Risk classification happens before sensitive execution.
 */

import type {
  ContextClass,
  DataClass,
  IntentClass,
  PolicyStatus,
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
  policyFailClosed?: boolean;
  policyProhibited?: boolean;
};

type RiskSeed = {
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
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
  "sorveglianza"
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
  "deploy"
];

export function evaluateRisk(input: RiskEngineInput): RiskEvaluation {
  const normalized = normalizeInput(input);
  const reasons: string[] = [];

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

  if (input.policyStatus === "UNKNOWN") {
    return buildRisk("UNKNOWN", 3, 4, [
      "Policy status is UNKNOWN.",
      "Unknown policy state must be handled conservatively."
    ]);
  }

  if (input.dataClass === "SECRET") {
    return buildRisk("CRITICAL", 3, 5, [
      "Data class is SECRET.",
      "Secrets must not be processed as ordinary runtime content."
    ]);
  }

  if (input.dataClass === "CRITICAL_OPERATIONAL") {
    return buildRisk("CRITICAL", 4, 5, [
      "Data class is CRITICAL_OPERATIONAL.",
      "Critical operational data requires strict review."
    ]);
  }

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

  const probability = clampScore(
    seed.probability +
      intentAdjustment.probability +
      dataAdjustment.probability +
      sensitivityAdjustment.probability +
      fileAdjustment.probability +
      routeAdjustment.probability +
      termAdjustment.probability +
      policyAdjustment.probability
  );

  const impact = clampScore(
    seed.impact +
      intentAdjustment.impact +
      dataAdjustment.impact +
      sensitivityAdjustment.impact +
      fileAdjustment.impact +
      routeAdjustment.impact +
      termAdjustment.impact +
      policyAdjustment.impact
  );

  reasons.push(
    ...intentAdjustment.reasons,
    ...dataAdjustment.reasons,
    ...sensitivityAdjustment.reasons,
    ...fileAdjustment.reasons,
    ...routeAdjustment.reasons,
    ...termAdjustment.reasons,
    ...policyAdjustment.reasons
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
      return {
        probability: 2,
        impact: 3,
        reasons: ["IDENTITY context affects attribution and continuity."]
      };

    case "MATRIX":
      return {
        probability: 2,
        impact: 3,
        reasons: ["MATRIX context has strategic architecture relevance."]
      };

    case "STRATEGIC":
      return {
        probability: 3,
        impact: 3,
        reasons: ["STRATEGIC context may affect external positioning."]
      };

    case "COMPLIANCE":
      return {
        probability: 3,
        impact: 3,
        reasons: ["COMPLIANCE context requires audit-aware handling."]
      };

    case "AI_GOVERNANCE":
      return {
        probability: 3,
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

    default:
      return {
        probability: 2,
        impact: 2,
        reasons: ["Unknown context baseline defaulted to conservative MEDIUM."]
      };
  }
}

function adjustRiskByIntent(intentClass: IntentClass): RiskSeed {
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
        probability: 0 as 1,
        impact: 1,
        reasons: ["GOVERNANCE intent increases review relevance."]
      };

    case "VERIFY":
      return {
        probability: 0 as 1,
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
        impact: 0 as 1,
        reasons: ["GITHUB intent may affect repository content."]
      };

    case "STRATEGIC":
      return {
        probability: 1,
        impact: 1,
        reasons: ["STRATEGIC intent may affect external or institutional positioning."]
      };

    case "UNKNOWN":
      return {
        probability: 1,
        impact: 1,
        reasons: ["UNKNOWN intent increases uncertainty."]
      };

    default:
      return {
        probability: 0 as 1,
        impact: 0 as 1,
        reasons: []
      };
  }
}

function adjustRiskByDataClass(dataClass?: DataClass): RiskSeed {
  switch (dataClass) {
    case "PUBLIC":
      return {
        probability: 0 as 1,
        impact: 0 as 1,
        reasons: ["PUBLIC data does not increase risk by itself."]
      };

    case "INTERNAL":
      return {
        probability: 0 as 1,
        impact: 1,
        reasons: ["INTERNAL data requires careful handling."]
      };

    case "CONFIDENTIAL":
      return {
        probability: 1,
        impact: 2,
        reasons: ["CONFIDENTIAL data increases impact."]
      };

    case "PERSONAL":
      return {
        probability: 1,
        impact: 2,
        reasons: ["PERSONAL data requires minimization and review."]
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

    case "UNKNOWN":
      return {
        probability: 1,
        impact: 2,
        reasons: ["UNKNOWN data sensitivity requires conservative handling."]
      };

    default:
      return {
        probability: 0 as 1,
        impact: 0 as 1,
        reasons: []
      };
  }
}

function adjustRiskBySensitivity(sensitivity?: RuntimeSensitivity): RiskSeed {
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
        probability: 0 as 1,
        impact: 0 as 1,
        reasons: []
      };
  }
}

function adjustRiskByFiles(hasFiles: boolean): RiskSeed {
  if (!hasFiles) {
    return {
      probability: 0 as 1,
      impact: 0 as 1,
      reasons: []
    };
  }

  return {
    probability: 1,
    impact: 1,
    reasons: ["File context is present and increases data handling risk."]
  };
}

function adjustRiskByRoute(route: string): RiskSeed {
  const normalizedRoute = normalizeText(route);

  if (!normalizedRoute) {
    return {
      probability: 0 as 1,
      impact: 0 as 1,
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
      probability: 0 as 1,
      impact: 1,
      reasons: ["Verification route affects audit interpretation."]
    };
  }

  if (normalizedRoute.includes("/api/chat") || normalizedRoute.includes("chat")) {
    return {
      probability: 0 as 1,
      impact: 0 as 1,
      reasons: ["Chat route has no additional route risk by itself."]
    };
  }

  return {
    probability: 0 as 1,
    impact: 0 as 1,
    reasons: []
  };
}

function adjustRiskByTerms(text: string): RiskSeed {
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
    probability: 0 as 1,
    impact: 0 as 1,
    reasons: []
  };
}

function adjustRiskByPolicy(
  policyStatus: PolicyStatus,
  policyFailClosed: boolean
): RiskSeed {
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
    probability: 0 as 1,
    impact: 0 as 1,
    reasons: []
  };
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

  if (
    input.contextClass === "CRITICAL_INFRASTRUCTURE" &&
    input.riskScore >= 12
  ) {
    return "CRITICAL";
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
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatches(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(normalizeText(term)));
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
