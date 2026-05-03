/**
 * AI JOKER-C2 Context Classifier
 *
 * Deterministic rule-based classifier for the HERMETICUM B.C.E.
 * governed runtime.
 *
 * This module classifies input into:
 * - ContextClass
 * - IntentClass
 * - runtime sensitivity
 * - confidence score
 * - explainable reasons
 *
 * Canonical project-domain classification is handled separately by:
 * - lib/project-domain-classifier.ts
 *
 * Safe conceptual overrides are handled separately by:
 * - lib/safe-concept-classifier.ts
 *
 * This classifier does not call external models.
 */

import type {
  ContextClass,
  ContextClassification,
  IntentClass,
  RuntimeSensitivity
} from "./runtime-types";

type ClassifierInput = {
  message: string;
  hasFiles?: boolean;
  route?: string;
  fileNames?: string[];
  fileTypes?: string[];
  activeDocument?: string;
  activeSection?: string;
};

type WeightedMatch<T extends string> = {
  value: T;
  score: number;
  reasons: string[];
};

const PROHIBITED_TERMS = [
  "malware",
  "ransomware",
  "steal credentials",
  "credential theft",
  "phishing",
  "phishing kit",
  "exploit deployment",
  "deploy exploit",
  "unauthorized access",
  "accesso non autorizzato",
  "bypass authentication",
  "evade detection",
  "evasion",
  "persistence mechanism",
  "persistence",
  "stealth",
  "backdoor",
  "botnet",
  "exfiltrate",
  "esfiltrare",
  "sabotage",
  "sabotaggio",
  "ddos",
  "weaponize",
  "autonomous targeting",
  "unlawful surveillance",
  "sorveglianza illegale",
  "fabricate evidence",
  "bypass human oversight",
  "remove auditability",
  "disable audit",
  "disable logging",
  "hide traces",
  "cover tracks"
];

const CONTEXT_KEYWORDS: Record<ContextClass, string[]> = {
  IDENTITY: [
    "identity",
    "identita",
    "identità",
    "ipr",
    "identity primary record",
    "evt",
    "checkpoint",
    "lineage",
    "runtime identity",
    "entity",
    "continuity reference",
    "operational identity",
    "identita operativa",
    "identità operativa",
    "registro primario",
    "traccia verificabile",
    "continuita operativa",
    "continuità operativa"
  ],

  MATRIX: [
    "matrix",
    "matrix europa",
    "matrix hbce",
    "matrix framework",
    "matrix torino",
    "matrix piemonte",
    "matrix italia",
    "strategic framework",
    "torino brussels",
    "torino bruxelles",
    "federated infrastructure",
    "operational infrastructure",
    "infrastruttura operativa",
    "public administration",
    "pubblica amministrazione",
    "b2b",
    "b2g",
    "europe",
    "europa",
    "european",
    "brussels",
    "bruxelles",
    "digital sovereignty",
    "sovranita digitale",
    "sovranità digitale"
  ],

  CORPUS: [
    "corpus",
    "corpus esoterologia ermetica",
    "esoterologia",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "dctt",
    "decision cost trace time",
    "reale operativo",
    "realta operativa",
    "realtà operativa",
    "operational reality",
    "canonical glossary",
    "glossario canonico",
    "lex hermeticum",
    "alien code",
    "alien artifact",
    "paradogma alieno",
    "portale dell anticristo",
    "portale dell'anticristo",
    "rascensionale",
    "riconconicita",
    "riconconicità",
    "qubitronica",
    "formula fondativa",
    "tesi editoriale",
    "frontespizio"
  ],

  APOKALYPSIS: [
    "apokalypsis",
    "apokalipsis",
    "apocalipsis",
    "apocalisse",
    "decadence",
    "decadimento",
    "decay",
    "exposure",
    "esposizione",
    "historical threshold",
    "soglia storica",
    "threshold",
    "soglia",
    "cognitive dislocation",
    "dislocazione cognitiva",
    "cognitive rupture",
    "rottura cognitiva",
    "cultural system",
    "sistema culturale",
    "political system",
    "sistema politico",
    "social system",
    "sistema sociale",
    "foundation loss",
    "perdita di fondamento",
    "system exposure",
    "esposizione del sistema",
    "apostasy",
    "apostasia",
    "paradogma alieno"
  ],

  DOCUMENTAL: [
    "document",
    "file",
    "summary",
    "summarize",
    "pdf",
    "txt",
    "markdown",
    "extract",
    "rewrite document",
    "analyze document",
    "report",
    "documento",
    "riassunto",
    "sintesi",
    "analizza il file",
    "file attivi",
    "uploaded",
    "allegato"
  ],

  TECHNICAL: [
    "code",
    "typescript",
    "javascript",
    "next.js",
    "nextjs",
    "api",
    "endpoint",
    "route.ts",
    "runtime",
    "module",
    "function",
    "build",
    "npm",
    "vercel",
    "refactor",
    "implement",
    "lib/",
    "app/api",
    "tsconfig",
    "package.json",
    "codice",
    "implementa",
    "funzione",
    "modulo"
  ],

  GITHUB: [
    "github",
    "repo",
    "repository",
    "commit",
    "branch",
    "readme",
    "pull request",
    "pr",
    "file path",
    "docs/",
    "lib/",
    "app/",
    "package.json",
    "tsconfig",
    "security.md",
    "contributing.md",
    "roadmap.md",
    "nome file",
    "il file",
    "il commit",
    "fatto vai",
    "fatto, vai"
  ],

  EDITORIAL: [
    "book",
    "volume",
    "chapter",
    "capitolo",
    "corpus",
    "publishing",
    "editorial",
    "editoriale",
    "index",
    "indice",
    "preface",
    "premessa",
    "introduction",
    "introduzione",
    "glossary",
    "glossario",
    "manuscript",
    "manoscritto",
    "frontespizio",
    "fluidita",
    "fluidità",
    "riscrivi",
    "migliora il testo"
  ],

  STRATEGIC: [
    "strategy",
    "strategic",
    "positioning",
    "posizionamento",
    "b2b",
    "b2g",
    "institution",
    "institutional",
    "enterprise",
    "public sector",
    "roadmap",
    "stakeholder",
    "european",
    "eu",
    "istituzioni",
    "azienda",
    "public administration",
    "regione",
    "commissione europea"
  ],

  SECURITY: [
    "security",
    "cybersecurity",
    "cyber security",
    "defensive security",
    "incident",
    "soc",
    "vulnerability",
    "hardening",
    "ciso",
    "threat",
    "remediation",
    "secrets",
    "api key",
    "token",
    "logs",
    "sicurezza",
    "cybersicurezza",
    "cibersicurezza",
    "incidente",
    "vulnerabilita",
    "vulnerabilità",
    "segreti"
  ],

  COMPLIANCE: [
    "compliance",
    "audit",
    "auditable",
    "auditability",
    "legal review",
    "data protection",
    "policy",
    "risk register",
    "human oversight",
    "certification",
    "disclaimer",
    "review checklist",
    "non certification",
    "non-certification",
    "data handling",
    "compliance orientation",
    "conformita",
    "conformità",
    "registro rischi",
    "supervisione umana"
  ],

  GOVERNANCE: [
    "governance",
    "policy",
    "risk",
    "risk engine",
    "policy engine",
    "decision",
    "runtime decision",
    "oversight",
    "human oversight",
    "audit",
    "traceability",
    "verification",
    "fail closed",
    "fail-closed",
    "evt protocol",
    "ledger",
    "classifier",
    "project-domain",
    "project domain",
    "governo",
    "tracciabilita",
    "tracciabilità",
    "verifica",
    "classificatore"
  ],

  CRITICAL_INFRASTRUCTURE: [
    "critical infrastructure",
    "infrastrutture critiche",
    "energy",
    "energia",
    "telecom",
    "telecommunications",
    "cloud",
    "data center",
    "transport",
    "water",
    "hospital",
    "healthcare",
    "utility",
    "public service",
    "continuity",
    "resilience",
    "resilienza"
  ],

  AI_GOVERNANCE: [
    "ai governance",
    "governance ai",
    "model governance",
    "model output",
    "risk classification",
    "policy engine",
    "risk engine",
    "human oversight",
    "runtime decision",
    "ai act",
    "high-impact ai",
    "responsible ai",
    "trustworthy ai",
    "governed ai",
    "biocybersecurity",
    "biocibersicurezza",
    "biocibernetica",
    "organism system",
    "organismo sistema"
  ],

  DUAL_USE: [
    "dual-use",
    "dual use",
    "strategic use",
    "civil strategic",
    "civil and strategic",
    "sensitive dual-use",
    "restricted use",
    "prohibited use",
    "non-offensive boundary",
    "dual-use risk",
    "dual use risk",
    "uso duale",
    "civile strategico",
    "non offensivo"
  ],

  GENERAL: []
};

const INTENT_KEYWORDS: Record<IntentClass, string[]> = {
  ASK: [
    "what is",
    "what are",
    "why",
    "explain",
    "tell me",
    "show me",
    "how does",
    "how do",
    "dimmi",
    "spiegami",
    "piegami",
    "cosa e",
    "cos e",
    "perche",
    "perché",
    "parlami",
    "significa"
  ],

  WRITE: [
    "write",
    "draft",
    "create text",
    "prepare text",
    "make a document",
    "compose",
    "generate document",
    "scrivi",
    "fammi",
    "crea",
    "prepara",
    "redigi"
  ],

  REWRITE: [
    "rewrite",
    "improve",
    "fix the text",
    "make it smoother",
    "migliora",
    "riscrivi",
    "correggi",
    "rendilo",
    "fluidita",
    "fluidità",
    "scorrevole",
    "rifallo"
  ],

  ANALYZE: [
    "analyze",
    "review",
    "evaluate",
    "assess",
    "inspect",
    "check",
    "compare",
    "analizza",
    "controlla",
    "valuta",
    "confronta",
    "verifica"
  ],

  SUMMARIZE: [
    "summarize",
    "summary",
    "synthesize",
    "brief",
    "recap",
    "riassumi",
    "sintesi",
    "sintetizza"
  ],

  TRANSFORM: [
    "transform",
    "convert",
    "reformat",
    "turn into",
    "make it into",
    "trasforma",
    "converti",
    "riformatta"
  ],

  CODE: [
    "code",
    "implement",
    "typescript",
    "javascript",
    "function",
    "module",
    "api route",
    "fix code",
    "refactor code",
    "codice",
    "implementa",
    "funzione",
    "modulo",
    "route.ts"
  ],

  GITHUB: [
    "github",
    "repo",
    "repository",
    "commit",
    "branch",
    "readme",
    "security.md",
    "contributing.md",
    "roadmap.md",
    "docs/",
    "lib/",
    "nome file",
    "il file",
    "il commit",
    "fatto vai",
    "fatto, vai",
    "vai"
  ],

  GOVERNANCE: [
    "governance",
    "policy",
    "risk",
    "oversight",
    "audit",
    "traceability",
    "verification",
    "fail-closed",
    "fail closed",
    "runtime decision",
    "governo",
    "tracciabilita",
    "tracciabilità",
    "supervisione"
  ],

  SECURITY: [
    "security",
    "cybersecurity",
    "incident",
    "soc",
    "vulnerability",
    "hardening",
    "remediation",
    "secrets",
    "logs",
    "sicurezza",
    "incidente",
    "vulnerabilita",
    "vulnerabilità"
  ],

  COMPLIANCE: [
    "compliance",
    "audit",
    "legal review",
    "data protection",
    "risk register",
    "human oversight",
    "disclaimer",
    "certification",
    "data handling",
    "conformita",
    "conformità"
  ],

  STRATEGIC: [
    "strategy",
    "strategic",
    "positioning",
    "b2b",
    "b2g",
    "institutional",
    "stakeholder",
    "roadmap",
    "strategia",
    "posizionamento",
    "istituzioni"
  ],

  EDITORIAL: [
    "editorial",
    "chapter",
    "volume",
    "book",
    "glossary",
    "manuscript",
    "editoriale",
    "capitolo",
    "indice",
    "glossario",
    "manoscritto"
  ],

  VERIFY: [
    "verify",
    "verification",
    "check evt",
    "validate",
    "hash",
    "audit status",
    "evidence",
    "prove",
    "verifica",
    "validazione",
    "validare"
  ],

  PROHIBITED: PROHIBITED_TERMS,

  UNKNOWN: []
};

const HIGH_SENSITIVITY_TERMS = [
  "critical infrastructure",
  "infrastrutture critiche",
  "public authority",
  "public service",
  "law enforcement",
  "emergency",
  "incident",
  "breach",
  "secret",
  "token",
  "api key",
  "private key",
  "password",
  "credential",
  "production",
  "live system",
  "healthcare",
  "hospital",
  "financial",
  "legal",
  "procurement",
  "surveillance",
  "exploit",
  "malware",
  "secret exposure",
  "segreto",
  "credenziali"
];

const MEDIUM_SENSITIVITY_TERMS = [
  "audit",
  "compliance",
  "governance",
  "risk",
  "oversight",
  "repository",
  "deployment",
  "logs",
  "internal",
  "confidential",
  "security",
  "policy",
  "verification",
  "evidence",
  "b2b",
  "b2g",
  "institutional",
  "human oversight",
  "risk register",
  "incident report",
  "conformita",
  "conformità"
];

export function classifyContext(input: ClassifierInput): ContextClassification {
  const normalized = normalizeText(input.message);
  const route = normalizeText(input.route ?? "");
  const fileText = normalizeText(
    [
      ...(input.fileNames ?? []),
      ...(input.fileTypes ?? []),
      input.activeDocument ?? "",
      input.activeSection ?? ""
    ].join(" ")
  );

  const combined = [normalized, route, fileText].filter(Boolean).join(" ");

  if (!combined.trim()) {
    return {
      contextClass: "GENERAL",
      intentClass: "UNKNOWN",
      sensitivity: "UNKNOWN",
      confidence: 0.2,
      reasons: ["No meaningful input was provided."]
    };
  }

  const prohibited = findMatches(combined, PROHIBITED_TERMS);

  if (prohibited.length > 0) {
    return {
      contextClass: "SECURITY",
      intentClass: "PROHIBITED",
      sensitivity: "HIGH",
      confidence: 0.96,
      reasons: [
        "Input matched prohibited or unsafe operational terms.",
        ...prohibited.map((term) => `Matched prohibited term: ${term}`)
      ]
    };
  }

  const context = selectBestContext(combined, Boolean(input.hasFiles));
  const intent = selectBestIntent(combined, Boolean(input.hasFiles));
  const sensitivity = classifySensitivity(combined, context.value, input);
  const confidence = calculateConfidence(context.score, intent.score, combined);

  const reasons = [
    ...context.reasons,
    ...intent.reasons,
    `Sensitivity classified as ${sensitivity}.`
  ];

  if (input.hasFiles) {
    reasons.push("File context is present.");
  }

  if (input.route) {
    reasons.push(`Route context considered: ${input.route}`);
  }

  if (input.activeDocument) {
    reasons.push(`Active document considered: ${input.activeDocument}`);
  }

  return {
    contextClass: context.value,
    intentClass: intent.value,
    sensitivity,
    confidence,
    reasons: uniqueReasons(reasons)
  };
}

export function classifyRuntimeContext(
  input: ClassifierInput
): ContextClassification {
  return classifyContext(input);
}

export function classifyContextFromMessage(
  message: string,
  hasFiles = false
): ContextClassification {
  return classifyContext({ message, hasFiles });
}

function selectBestContext(
  text: string,
  hasFiles: boolean
): WeightedMatch<ContextClass> {
  const results = Object.entries(CONTEXT_KEYWORDS).map(([context, keywords]) =>
    scoreKeywords(text, context as ContextClass, keywords)
  );

  if (hasFiles) {
    boost(results, "DOCUMENTAL", 3, "Files are present, boosting DOCUMENTAL context.");
  }

  if (text.includes("github") || text.includes("repo") || text.includes("commit")) {
    boost(results, "GITHUB", 3, "Repository terms detected.");
  }

  if (text.includes("docs/") || text.includes("lib/") || text.includes("route.ts")) {
    boost(results, "GITHUB", 2, "Repository path terms detected.");
  }

  if (text.includes("matrix")) {
    boost(results, "MATRIX", 3, "MATRIX framework term detected.");
  }

  if (text.includes("corpus") || text.includes("esoterologia")) {
    boost(results, "CORPUS", 3, "CORPUS or Esoterologia term detected.");
  }

  if (
    text.includes("apokalypsis") ||
    text.includes("apokalipsis") ||
    text.includes("apocalipsis")
  ) {
    boost(results, "APOKALYPSIS", 3, "APOKALYPSIS term detected.");
  }

  if (
    text.includes("biocybersecurity") ||
    text.includes("biocibersicurezza") ||
    text.includes("biocibernetica") ||
    text.includes("biocyber")
  ) {
    boost(results, "AI_GOVERNANCE", 4, "Biocybersecurity concept detected.");
  }

  if (text.includes("evt") || text.includes("ipr")) {
    boost(results, "IDENTITY", 2, "IPR or EVT identity terms detected.");
  }

  if (
    text.includes("policy") ||
    text.includes("risk") ||
    text.includes("governance") ||
    text.includes("fail closed") ||
    text.includes("fail-closed")
  ) {
    boost(results, "GOVERNANCE", 2, "Governance terms detected.");
  }

  const best = results.sort((a, b) => b.score - a.score)[0];

  if (!best || best.score <= 0) {
    return {
      value: "GENERAL",
      score: 1,
      reasons: ["No specific context keywords matched; defaulted to GENERAL."]
    };
  }

  return best;
}

function selectBestIntent(
  text: string,
  hasFiles: boolean
): WeightedMatch<IntentClass> {
  const results = Object.entries(INTENT_KEYWORDS).map(([intent, keywords]) =>
    scoreKeywords(text, intent as IntentClass, keywords)
  );

  if (hasFiles) {
    boost(results, "ANALYZE", 2, "Files are present, boosting ANALYZE intent.");
  }

  if (text.includes("fatto") || text.includes("vai")) {
    boost(
      results,
      "GITHUB",
      3,
      "Continuation pattern detected for repository workflow."
    );
  }

  if (text.includes("nome file") || text.includes("commit")) {
    boost(results, "GITHUB", 3, "GitHub file and commit workflow detected.");
  }

  if (
    text.includes("implement") ||
    text.includes("typescript") ||
    text.includes("route.ts") ||
    text.includes("lib/")
  ) {
    boost(results, "CODE", 3, "Code implementation terms detected.");
  }

  if (
    text.includes("rewrite") ||
    text.includes("migliora") ||
    text.includes("riscrivi") ||
    text.includes("correggi")
  ) {
    boost(results, "REWRITE", 2, "Rewrite or editorial improvement terms detected.");
  }

  const best = results.sort((a, b) => b.score - a.score)[0];

  if (!best || best.score <= 0) {
    return {
      value: inferDefaultIntent(text),
      score: 1,
      reasons: ["No strong intent keywords matched; inferred default intent."]
    };
  }

  return best;
}

function inferDefaultIntent(text: string): IntentClass {
  if (text.endsWith("?")) {
    return "ASK";
  }

  if (
    text.includes("create") ||
    text.includes("make") ||
    text.includes("write") ||
    text.includes("prepare") ||
    text.includes("crea") ||
    text.includes("scrivi") ||
    text.includes("fammi")
  ) {
    return "WRITE";
  }

  return "ASK";
}

function classifySensitivity(
  text: string,
  contextClass: ContextClass,
  input: ClassifierInput
): RuntimeSensitivity {
  const highMatches = findMatches(text, HIGH_SENSITIVITY_TERMS);
  const mediumMatches = findMatches(text, MEDIUM_SENSITIVITY_TERMS);

  if (
    highMatches.length > 0 ||
    contextClass === "CRITICAL_INFRASTRUCTURE" ||
    contextClass === "DUAL_USE"
  ) {
    return "HIGH";
  }

  if (
    mediumMatches.length > 0 ||
    contextClass === "SECURITY" ||
    contextClass === "COMPLIANCE" ||
    contextClass === "AI_GOVERNANCE" ||
    contextClass === "GOVERNANCE" ||
    Boolean(input.hasFiles)
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function scoreKeywords<T extends string>(
  text: string,
  value: T,
  keywords: string[]
): WeightedMatch<T> {
  const matches = findMatches(text, keywords);

  const score = matches.reduce((total, keyword) => {
    const wordCount = keyword.split(" ").filter(Boolean).length;
    const weight = wordCount >= 3 ? 4 : wordCount === 2 ? 2 : 1;
    return total + weight;
  }, 0);

  return {
    value,
    score,
    reasons: score > 0 ? [`${value} matched: ${matches.join(", ")}`] : []
  };
}

function boost<T extends string>(
  results: WeightedMatch<T>[],
  value: T,
  amount: number,
  reason: string
): void {
  const target = results.find((result) => result.value === value);

  if (!target) {
    return;
  }

  target.score += amount;
  target.reasons.push(reason);
}

function findMatches(text: string, keywords: string[]): string[] {
  return keywords
    .map((keyword) => normalizeText(keyword))
    .filter((keyword) => keyword.length > 0 && text.includes(keyword));
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

function calculateConfidence(
  contextScore: number,
  intentScore: number,
  text: string
): number {
  const lengthFactor = Math.min(text.length / 600, 1);
  const scoreFactor = Math.min((contextScore + intentScore) / 14, 1);
  const confidence = 0.35 + scoreFactor * 0.5 + lengthFactor * 0.15;

  return Number(Math.max(0.2, Math.min(confidence, 0.96)).toFixed(2));
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
