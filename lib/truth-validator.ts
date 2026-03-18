export type TruthLevel = "HIGH" | "MEDIUM" | "LOW";
export type TruthDecision = "PASS" | "WARN" | "BLOCK";

export type TruthSource = {
  title?: string;
  url?: string;
};

export type TruthValidationInput = {
  text: string;
  research: boolean;
  sources?: TruthSource[];
};

export type TruthValidationResult = {
  level: TruthLevel;
  decision: TruthDecision;
  score: number;
  reasons: string[];
  weak_sources: string[];
  strong_sources: string[];
};

const STRONG_SOURCE_PATTERNS = [
  "reuters.com",
  "ansa.it",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "ft.com",
  "bloomberg.com",
  "ec.europa.eu",
  "europa.eu",
  "consilium.europa.eu",
  "eeas.europa.eu",
  "enisa.europa.eu",
  "nato.int",
  "un.org",
  "imf.org",
  "worldbank.org",
  "oecd.org",
  "gov.uk",
  "bund.de",
  "gouvernement.fr"
];

const WEAK_SOURCE_PATTERNS = [
  "wikipedia.org",
  "blogspot.",
  "medium.com",
  "substack.com",
  "wordpress.com",
  "ilpoliticoweb.it"
];

const SUSPICIOUS_PATTERNS = [
  /\boperazione\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ]+\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ]+\b/u,
  /\bsecondo fonti non confermate\b/i
];

const HARD_BLOCK_PATTERNS = [
  /\bnon dispongo di accesso diretto\b/i,
  /\bknowledge cutoff\b/i,
  /\bfino a giugno 2024\b/i,
  /\bnon ho accesso in tempo reale\b/i
];

function normalizeUrl(url?: string): string {
  if (!url) return "";
  return url.trim().toLowerCase();
}

function scoreSources(sources: TruthSource[]) {
  const strong: string[] = [];
  const weak: string[] = [];

  for (const source of sources) {
    const url = normalizeUrl(source.url);

    if (!url) continue;

    if (STRONG_SOURCE_PATTERNS.some((pattern) => url.includes(pattern))) {
      strong.push(url);
      continue;
    }

    if (WEAK_SOURCE_PATTERNS.some((pattern) => url.includes(pattern))) {
      weak.push(url);
    }
  }

  return { strong, weak };
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  let count = 0;

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count += 1;
    }
  }

  return count;
}

export function validateTruth(
  input: TruthValidationInput
): TruthValidationResult {
  const text = input.text.trim();
  const sources = Array.isArray(input.sources) ? input.sources : [];

  const reasons: string[] = [];
  let score = 60;

  if (!text) {
    return {
      level: "LOW",
      decision: "BLOCK",
      score: 0,
      reasons: ["Empty output."],
      weak_sources: [],
      strong_sources: []
    };
  }

  const { strong, weak } = scoreSources(sources);

  const hardBlockMatches = countPatternMatches(text, HARD_BLOCK_PATTERNS);
  if (hardBlockMatches > 0) {
    return {
      level: "LOW",
      decision: "BLOCK",
      score: 0,
      reasons: ["Response contains a hard-block stale-access pattern."],
      weak_sources: weak,
      strong_sources: strong
    };
  }

  if (input.research) {
    if (sources.length === 0) {
      score -= 20;
      reasons.push("Research mode active but no sources returned.");
    }

    if (strong.length > 0) {
      score += Math.min(strong.length * 8, 24);
      reasons.push("Strong sources detected.");
    }

    if (weak.length > 0) {
      score -= Math.min(weak.length * 6, 18);
      reasons.push("Weak or low-authority sources detected.");
    }
  } else {
    if (strong.length > 0) {
      score += 8;
      reasons.push("Supporting sources present.");
    }
  }

  const suspiciousMatches = countPatternMatches(text, SUSPICIOUS_PATTERNS);
  if (suspiciousMatches > 0) {
    score -= suspiciousMatches * 10;
    reasons.push("Suspicious unsupported event naming detected.");
  }

  if (
    /\b\d{1,3}(?:[.,]\d{3})*(?:\s*miliardi|\s*milioni|\s*%)\b/i.test(text) &&
    strong.length === 0
  ) {
    score -= 10;
    reasons.push("Precise quantitative claims without strong sources.");
  }

  if (
    /\bsi conferma\b|\bè certo\b|\bsicuramente\b/i.test(text) &&
    strong.length === 0
  ) {
    score -= 8;
    reasons.push("High-confidence wording without strong sourcing.");
  }

  score = Math.max(0, Math.min(100, score));

  let level: TruthLevel;
  let decision: TruthDecision;

  if (score >= 75) {
    level = "HIGH";
    decision = "PASS";
  } else if (score >= 35) {
    level = "MEDIUM";
    decision = "WARN";
  } else {
    level = "LOW";
    decision = "WARN";
  }

  if (reasons.length === 0) {
    reasons.push("No major validation issue detected.");
  }

  return {
    level,
    decision,
    score,
    reasons,
    weak_sources: weak,
    strong_sources: strong
  };
}
