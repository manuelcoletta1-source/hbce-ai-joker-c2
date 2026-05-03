/**
 * AI JOKER-C2 Safe Concept Classifier
 *
 * Detects safe conceptual, theoretical and governance terms that should not
 * trigger fail-closed behavior only because they are new, hybrid, misspelled
 * or close to sensitive domains.
 *
 * This module does not authorize unsafe operations.
 * It prevents false escalation for explanatory, editorial and conceptual requests.
 *
 * Canonical response rule:
 * When IPR and biocybersecurity are connected, the runtime should explain:
 *
 * IPR = operational identity.
 * EVT = verifiable trace.
 * MATRIX = operational infrastructure.
 * AI JOKER-C2 = governed runtime.
 * Biocybersecurity = protection of the organism-system-AI coupling.
 */

import type {
  ContextClass,
  DataClassification,
  IntentClass,
  OversightEvaluation,
  PolicyEvaluation,
  ProjectDomain,
  ProjectDomainClassification,
  RiskEvaluation
} from "./runtime-types";

export type SafeConceptKind =
  | "IPR_IDENTITY"
  | "BIOCYBERSECURITY"
  | "EVT_TRACEABILITY"
  | "AI_GOVERNANCE"
  | "HERMETICUM_CONCEPT"
  | "UNKNOWN";

export type SafeConceptClassification = {
  matched: boolean;
  kind: SafeConceptKind;
  normalizedTerm: string;
  projectDomain: ProjectDomain;
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  oversight: OversightEvaluation;
  reasons: string[];
};

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
  "attack",
  "attacco",
  "colpire",
  "payload"
];

const EXPLANATORY_TERMS = [
  "cosa e",
  "cos e",
  "che cosa e",
  "spiegami",
  "piegami",
  "parlami",
  "dimmi",
  "definisci",
  "significa",
  "significato",
  "novita",
  "nuova tecnologia",
  "tecnologia",
  "potenzialita",
  "potenziale",
  "vantaggi",
  "valore",
  "a cosa serve",
  "serve",
  "serve per",
  "puo servire",
  "può servire",
  "utilita",
  "utilità",
  "per chi e utile",
  "rispetto a chi non ce l ha",
  "confronto",
  "paragone",
  "standard",
  "scenario",
  "europa",
  "mercato",
  "funziona",
  "opera",
  "ruolo",
  "che ruolo",
  "quale ruolo",
  "relazione",
  "rapporto",
  "collegamento",
  "connessione"
];

const SAFE_WRITING_TERMS = [
  "fammi",
  "scrivi",
  "scrivimi",
  "crea",
  "prepara",
  "redigi",
  "genera",
  "testo",
  "teesto",
  "dovbe",
  "dove",
  "documento",
  "paragrafo",
  "spiega",
  "spieghi",
  "spiegare",
  "illustra",
  "descrivi",
  "relazione tra",
  "relazione ta",
  "rapporto tra",
  "collegamento tra",
  "connessione tra"
];

const IPR_TERMS = [
  "ipr",
  "identity primary record",
  "registro primario",
  "registro primario di identita",
  "registro primario di identita operativa",
  "identita operativa",
  "identity layer",
  "operational identity",
  "continuita operativa",
  "continuita verificabile"
];

const EVT_TERMS = [
  "evt",
  "event trace",
  "verifiable event trace",
  "traccia verificabile",
  "evento verificabile",
  "event record",
  "ledger",
  "hash",
  "timestamp"
];

const BIOCYBERSECURITY_TERMS = [
  "biocybersecurity",
  "bio cyber security",
  "bio-cybersecurity",
  "bio cybersecurity",
  "biocibersicurezza",
  "bio cibersicurezza",
  "bio-cibersicurezza",
  "biocibernetica",
  "sicurezza biocibernetica",
  "sicuerezza biocibernetica",
  "sicuuerezza biocibernetica",
  "sicurezza bio cibernetica",
  "sicuerezza bio cibernetica",
  "sicuuerezza bio cibernetica",
  "sicurezza biocyber",
  "sicuerezza biocyber",
  "sicuuerezza biocyber",
  "protezione biocibernetica",
  "protezzione biocibernetica",
  "protezione bio cibernetica",
  "protezione biocyber",
  "sicurezza protezione biocibernetica",
  "sicuerezza protezione biocibernetica",
  "sicuuerezza protezione biocibernetica",
  "sicurezza e protezione biocibernetica",
  "sicuerezza e protezione biocibernetica",
  "sicuuerezza e protezione biocibernetica",
  "protezione cyber biologica",
  "sicurezza cyber biologica",
  "sicuerezza cyber biologica",
  "sicuuerezza cyber biologica",
  "sicurezza organismo sistema",
  "protezione organismo sistema",
  "sicurezza organismo-sistema",
  "protezione organismo-sistema",
  "bio cyber",
  "biocyber",
  "biocyber security",
  "biocybercycuriti",
  "biocybercycurity",
  "biocybersecuriti",
  "biocybersecurty",
  "biocybersecutity",
  "biocybercybersecurity",
  "biocybercycuryti",
  "biocybercycuriti",
  "organismo sistema",
  "organism system",
  "accoppiamento organismo sistema",
  "accoppiamento organismo-sistema",
  "organism-system coupling"
];

const AI_GOVERNANCE_TERMS = [
  "ai governance",
  "governance ai",
  "governed ai",
  "runtime governance",
  "policy engine",
  "risk engine",
  "human oversight",
  "fail closed",
  "fail-closed",
  "auditability",
  "traceability"
];

const HERMETICUM_TERMS = [
  "matrix",
  "hbce",
  "hermeticum",
  "ai joker",
  "joker-c2",
  "corpus",
  "apokalypsis",
  "esoterologia",
  "decisione costo traccia tempo",
  "dctt"
];

export function classifySafeConcept(message: string): SafeConceptClassification {
  const normalized = normalizeForConcept(message);

  if (!normalized) {
    return buildNoMatch();
  }

  if (containsAny(normalized, UNSAFE_OPERATIONAL_TERMS)) {
    return buildNoMatch([
      "Unsafe operational term detected; safe conceptual override not applied."
    ]);
  }

  const hasExplanatoryIntent =
    containsAny(normalized, EXPLANATORY_TERMS) ||
    containsAny(normalized, SAFE_WRITING_TERMS) ||
    normalized.endsWith("?") ||
    normalized.split(" ").length <= 8;

  if (!hasExplanatoryIntent) {
    return buildNoMatch([
      "No explanatory or safe writing intent detected; safe conceptual override not applied."
    ]);
  }

  const intentClass: IntentClass = containsAny(normalized, SAFE_WRITING_TERMS)
    ? "WRITE"
    : "ASK";

  const hasIpr = containsAny(normalized, IPR_TERMS);
  const hasBiocybersecurity = containsAny(normalized, BIOCYBERSECURITY_TERMS);

  if (hasIpr && hasBiocybersecurity) {
    return buildSafeConcept({
      kind: "BIOCYBERSECURITY",
      normalizedTerm: "IPR + biocybersecurity / sicurezza e protezione biocibernetica",
      projectDomain: "MULTI_DOMAIN",
      contextClass: "AI_GOVERNANCE",
      intentClass,
      reasons: buildIprBiocybersecurityReasons()
    });
  }

  if (hasBiocybersecurity) {
    return buildSafeConcept({
      kind: "BIOCYBERSECURITY",
      normalizedTerm: "biocybersecurity / biocibersicurezza",
      projectDomain: "MULTI_DOMAIN",
      contextClass: "AI_GOVERNANCE",
      intentClass,
      reasons: [
        "Safe conceptual or editorial request about biocybersecurity or a close misspelling.",
        "Biocybersecurity is treated as a conceptual governance term unless unsafe operational instructions are present.",
        "Mapped to MULTI_DOMAIN because it connects organism-system interface, AI governance, identity, security and traceability.",
        "Response directive: define biocybersecurity as protection of the organism-system-AI coupling.",
        "Response directive: mention IPR only if relevant as operational identity, EVT as verifiable trace, MATRIX as infrastructure and AI JOKER-C2 as governed runtime."
      ]
    });
  }

  if (hasIpr) {
    return buildSafeConcept({
      kind: "IPR_IDENTITY",
      normalizedTerm: "IPR / Identity Primary Record",
      projectDomain: "MATRIX",
      contextClass: "IDENTITY",
      intentClass,
      reasons: [
        "Safe conceptual or editorial request about IPR or operational identity.",
        "IPR is treated as a public identity-governance concept.",
        "Response directive: do not reduce IPR to a login, account, credential or ordinary digital identity.",
        "Response directive: explain IPR as operational identity linking origin, responsibility, events, proof and continuity."
      ]
    });
  }

  if (containsAny(normalized, EVT_TERMS)) {
    return buildSafeConcept({
      kind: "EVT_TRACEABILITY",
      normalizedTerm: "EVT / Verifiable Event Trace",
      projectDomain: "MATRIX",
      contextClass: "IDENTITY",
      intentClass,
      reasons: [
        "Safe conceptual or editorial request about EVT or traceability.",
        "EVT is treated as a public traceability-governance concept.",
        "Response directive: explain EVT as verifiable event trace, not psychological memory."
      ]
    });
  }

  if (containsAny(normalized, AI_GOVERNANCE_TERMS)) {
    return buildSafeConcept({
      kind: "AI_GOVERNANCE",
      normalizedTerm: "AI governance",
      projectDomain: "MATRIX",
      contextClass: "AI_GOVERNANCE",
      intentClass,
      reasons: [
        "Safe conceptual or editorial request about AI governance.",
        "AI governance is treated as a public governance concept unless unsafe operational instructions are present.",
        "Response directive: keep the response defensive, audit-oriented and non-offensive."
      ]
    });
  }

  if (containsAny(normalized, HERMETICUM_TERMS)) {
    return buildSafeConcept({
      kind: "HERMETICUM_CONCEPT",
      normalizedTerm: "HERMETICUM B.C.E. conceptual term",
      projectDomain: "MULTI_DOMAIN",
      contextClass: "GOVERNANCE",
      intentClass,
      reasons: [
        "Safe conceptual or editorial request about HERMETICUM / MATRIX / CORPUS / APOKALYPSIS concepts.",
        "Canonical ecosystem terms are treated as public conceptual context unless unsafe operational instructions are present.",
        "Response directive: preserve the distinction MATRIX = infrastructure, CORPUS = grammar, APOKALYPSIS = threshold, AI JOKER-C2 = runtime."
      ]
    });
  }

  return buildNoMatch();
}

export function isSafeConceptualRequest(message: string): boolean {
  return classifySafeConcept(message).matched;
}

export function buildSafeConceptProjectDomain(
  classification: SafeConceptClassification
): ProjectDomainClassification {
  if (!classification.matched) {
    return {
      projectDomain: "GENERAL",
      activeDomains: ["GENERAL"],
      primaryDomain: "GENERAL",
      domainType: "GENERAL_CONTEXT",
      confidence: 0.4,
      reasons: ["No safe concept matched."],
      scores: {
        MATRIX: 0,
        CORPUS_ESOTEROLOGIA_ERMETICA: 0,
        APOKALYPSIS: 0
      }
    };
  }

  if (classification.projectDomain === "MULTI_DOMAIN") {
    return {
      projectDomain: "MULTI_DOMAIN",
      activeDomains: [
        "MATRIX",
        "CORPUS_ESOTEROLOGIA_ERMETICA",
        "APOKALYPSIS"
      ],
      primaryDomain: "MULTI_DOMAIN",
      domainType: "ECOSYSTEM_OPERATION",
      confidence: 0.96,
      reasons: classification.reasons,
      scores: {
        MATRIX: 6,
        CORPUS_ESOTEROLOGIA_ERMETICA: 4,
        APOKALYPSIS: 2
      }
    };
  }

  return {
    projectDomain: classification.projectDomain,
    activeDomains: [classification.projectDomain],
    primaryDomain: classification.projectDomain,
    domainType:
      classification.projectDomain === "MATRIX"
        ? "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
        : classification.projectDomain === "CORPUS_ESOTEROLOGIA_ERMETICA"
          ? "DISCIPLINARY_GRAMMAR_DOMAIN"
          : classification.projectDomain === "APOKALYPSIS"
            ? "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN"
            : "GENERAL_CONTEXT",
    confidence: 0.96,
    reasons: classification.reasons,
    scores: {
      MATRIX: classification.projectDomain === "MATRIX" ? 8 : 0,
      CORPUS_ESOTEROLOGIA_ERMETICA:
        classification.projectDomain === "CORPUS_ESOTEROLOGIA_ERMETICA" ? 8 : 0,
      APOKALYPSIS: classification.projectDomain === "APOKALYPSIS" ? 8 : 0
    }
  };
}

function buildSafeConcept(input: {
  kind: SafeConceptKind;
  normalizedTerm: string;
  projectDomain: ProjectDomain;
  contextClass: ContextClass;
  intentClass: IntentClass;
  reasons: string[];
}): SafeConceptClassification {
  return {
    matched: true,
    kind: input.kind,
    normalizedTerm: input.normalizedTerm,
    projectDomain: input.projectDomain,
    contextClass: input.contextClass,
    intentClass: input.intentClass,
    data: {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: [
        "Safe conceptual or editorial explanation detected.",
        "Classified as PUBLIC because no unsafe operational term is present."
      ]
    },
    policy: {
      status: "ALLOWED",
      policyReference: "PUBLIC_CONCEPTUAL_GOVERNANCE_EXPLANATION",
      prohibited: false,
      failClosed: false,
      reasons: ["Public conceptual or editorial explanation allowed.", ...input.reasons],
      outcome: "PERMIT"
    },
    risk: {
      riskClass: "LOW",
      probability: 1,
      impact: 1,
      riskScore: 1,
      reasons: [
        "Low-risk conceptual or editorial request.",
        "No operational cyber, surveillance, exploitation or sensitive-data instruction detected."
      ]
    },
    oversight: {
      state: "NOT_REQUIRED",
      requiredRole: "NONE",
      reason: "Ordinary conceptual or editorial explanation does not require human review."
    },
    reasons: input.reasons
  };
}

function buildNoMatch(reasons: string[] = []): SafeConceptClassification {
  return {
    matched: false,
    kind: "UNKNOWN",
    normalizedTerm: "",
    projectDomain: "GENERAL",
    contextClass: "GENERAL",
    intentClass: "UNKNOWN",
    data: {
      dataClass: "UNKNOWN",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      reasons: ["No safe conceptual term matched."]
    },
    policy: {
      status: "UNKNOWN",
      policyReference: "NO_SAFE_CONCEPT_MATCH",
      prohibited: false,
      failClosed: false,
      reasons: ["No safe conceptual override applied.", ...reasons],
      outcome: "UNKNOWN"
    },
    risk: {
      riskClass: "UNKNOWN",
      probability: 1,
      impact: 1,
      riskScore: 1,
      reasons: ["No safe conceptual override applied."]
    },
    oversight: {
      state: "UNKNOWN",
      requiredRole: "NONE",
      reason: "No safe conceptual override applied."
    },
    reasons
  };
}

function buildIprBiocybersecurityReasons(): string[] {
  return [
    "Safe conceptual or editorial request connecting IPR and biocybersecurity.",
    "IPR + biocybersecurity is treated as a public governance concept unless unsafe operational instructions are present.",
    "Mapped to MULTI_DOMAIN because it connects operational identity, organism-system interface, AI governance, traceability and MATRIX infrastructure.",
    "Response directive: write the answer as a conceptual and strategic explanation, not as an operational cyber instruction.",
    "Response directive: explain that IPR provides operational identity for the organism-system-AI interface.",
    "Response directive: explain that EVT provides verifiable trace of events generated by that identity.",
    "Response directive: explain that MATRIX provides the infrastructure frame for governance, auditability and continuity.",
    "Response directive: explain that AI JOKER-C2 acts as the governed runtime connecting identity, risk, decision and trace.",
    "Response directive: define biocybersecurity as protection of the organism-system-AI coupling.",
    "Response directive: include the formula IPR = operational identity; EVT = verifiable trace; MATRIX = infrastructure; AI JOKER-C2 = governed runtime; biocybersecurity = organism-system protection."
  ];
}

function normalizeForConcept(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeForConcept(term)));
}
