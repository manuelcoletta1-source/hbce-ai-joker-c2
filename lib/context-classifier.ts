/**
 * AI JOKER-C2 Context Classifier
 *
 * Deterministic rule-based classifier for the HBCE / MATRIX governed runtime.
 *
 * This module classifies user input into:
 * - ContextClass
 * - IntentClass
 * - runtime sensitivity
 * - confidence score
 * - explainable reasons
 *
 * The first implementation is intentionally transparent and inspectable.
 * It does not use hidden model calls.
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
  "exploit deployment",
  "deploy exploit",
  "unauthorized access",
  "bypass authentication",
  "evade detection",
  "evasion",
  "persistence mechanism",
  "stealth",
  "backdoor",
  "botnet",
  "exfiltrate",
  "sabotage",
  "ddos",
  "weaponize",
  "autonomous targeting",
  "unlawful surveillance",
  "fabricate evidence",
  "bypass human oversight",
  "remove auditability"
];

const CONTEXT_KEYWORDS: Record<ContextClass, string[]> = {
  IDENTITY: [
    "identity",
    "ipr",
    "evt",
    "checkpoint",
    "lineage",
    "runtime identity",
    "entity",
    "continuity reference",
    "operational identity"
  ],
  MATRIX: [
    "matrix",
    "matrix europa",
    "matrix hbce",
    "matrix framework",
    "strategic framework",
    "torino brussels",
    "federated infrastructure"
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
    "report"
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
    "refactor"
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
    "roadmap.md"
  ],
  EDITORIAL: [
    "book",
    "volume",
    "chapter",
    "corpus",
    "publishing",
    "editorial",
    "index",
    "preface",
    "introduction",
    "glossary",
    "manuscript"
  ],
  STRATEGIC: [
    "strategy",
    "strategic",
    "b2b",
    "b2g",
    "institution",
    "institutional",
    "enterprise",
    "public sector",
    "roadmap",
    "positioning",
    "stakeholder",
    "european",
    "eu"
  ],
  SECURITY: [
    "security",
    "cybersecurity",
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
    "logs"
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
    "governance",
    "certification",
    "disclaimer",
    "review checklist"
  ],
  CRITICAL_INFRASTRUCTURE: [
    "critical infrastructure",
    "energy",
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
    "resilience"
  ],
  AI_GOVERNANCE: [
    "ai governance",
    "model governance",
    "model output",
    "risk classification",
    "policy engine",
    "risk engine",
    "human oversight",
    "runtime decision",
    "ai act",
    "high-impact ai"
  ],
  DUAL_USE: [
    "dual-use",
    "dual use",
    "strategic use",
    "civil strategic",
    "sensitive dual-use",
    "restricted use",
    "prohibited use",
    "non-offensive boundary"
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
    "how do"
  ],
  WRITE: [
    "write",
    "draft",
    "create text",
    "prepare text",
    "make a document",
    "compose",
    "generate document"
  ],
  ANALYZE: [
    "analyze",
    "review",
    "evaluate",
    "assess",
    "inspect",
    "check",
    "compare"
  ],
  SUMMARIZE: [
    "summarize",
    "summary",
    "synthesize",
    "brief",
    "recap"
  ],
  TRANSFORM: [
    "transform",
    "convert",
    "reformat",
    "rewrite",
    "refactor text",
    "turn into",
    "make it into"
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
    "refactor code"
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
    "lib/"
  ],
  GOVERNANCE: [
    "governance",
    "policy",
    "risk",
    "oversight",
    "audit",
    "compliance",
    "traceability",
    "verification"
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
    "logs"
  ],
  STRATEGIC: [
    "strategy",
    "strategic",
    "positioning",
    "b2b",
    "b2g",
    "institutional",
    "stakeholder",
    "roadmap"
  ],
  VERIFY: [
    "verify",
    "verification",
    "check evt",
    "validate",
    "hash",
    "audit status",
    "evidence",
    "prove"
  ],
  PROHIBITED: PROHIBITED_TERMS,
  UNKNOWN: []
};

const HIGH_SENSITIVITY_TERMS = [
  "critical infrastructure",
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
  "malware"
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
  "evidence"
];

export function classifyContext(input: ClassifierInput): ContextClassification {
  const normalized = normalizeText(input.message);
  const route = normalizeText(input.route ?? "");
  const fileText = normalizeText(
    [...(input.fileNames ?? []), ...(input.fileTypes ?? [])].join(" ")
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
      confidence: 0.95,
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

  return {
    contextClass: context.value,
    intentClass: intent.value,
    sensitivity,
    confidence,
    reasons: uniqueReasons(reasons)
  };
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

  if (text.includes("matrix")) {
    boost(results, "MATRIX", 3, "MATRIX framework term detected.");
  }

  if (text.includes("evt") || text.includes("ipr")) {
    boost(results, "IDENTITY", 2, "IPR or EVT identity terms detected.");
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
    text.includes("prepare")
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
    input.hasFiles
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
    const weight = keyword.includes(" ") ? 2 : 1;
    return total + weight;
  }, 0);

  return {
    value,
    score,
    reasons:
      score > 0
        ? [`${value} matched: ${matches.join(", ")}`]
        : []
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
  return keywords.filter((keyword) => text.includes(normalizeText(keyword)));
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

function calculateConfidence(
  contextScore: number,
  intentScore: number,
  text: string
): number {
  const lengthFactor = Math.min(text.length / 600, 1);
  const scoreFactor = Math.min((contextScore + intentScore) / 12, 1);
  const confidence = 0.35 + scoreFactor * 0.5 + lengthFactor * 0.15;

  return Number(Math.max(0.2, Math.min(confidence, 0.95)).toFixed(2));
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}
