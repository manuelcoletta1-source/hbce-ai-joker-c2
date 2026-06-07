import { createHash, randomUUID } from "node:crypto";

export const SOURCE_INTELLIGENCE_REVISION = "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.1" as const;
export const SOURCE_INTELLIGENCE_POLICY_REVISION = "SOURCE_ALLOWLIST_HASH_EGRESS_GUARD-v0.1" as const;
export const SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID = "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK" as const;
export const SOURCE_INTELLIGENCE_BOUNDARY = "technical source receipt only" as const;

export type SourceTrustTier = "PRIMARY" | "INSTITUTIONAL" | "GOVERNMENT" | "TECHNICAL_STANDARD" | "UNKNOWN";
export type SourceFetchStatus = "FETCH_READY" | "FETCH_BLOCKED" | "FETCH_FAILED" | "FETCH_SKIPPED";
export type SourceVerificationStatus = "SOURCE_VERIFIED" | "SOURCE_REJECTED" | "SOURCE_UNVERIFIED";

export type SourceCatalogEntry = {
  sourceId: string;
  sourceSet: string;
  title: string;
  url: string;
  domain: string;
  publisher: string;
  trustTier: SourceTrustTier;
  topicTags: string[];
  canonicalClaim: string;
  relevance: number;
};

export type SourceProfile = SourceCatalogEntry & {
  fetchedAt: string;
  fetchStatus: SourceFetchStatus;
  verificationStatus: SourceVerificationStatus;
  sourceHash: string;
  contentType: string;
  statusCode: number | null;
  textLength: number;
  textPreview: string;
  promptInjectionRisk: "NONE_DETECTED" | "POSSIBLE_INJECTION_SIGNALS";
  promptInjectionSignals: string[];
  rawTextPersistence: false;
  legalCertification: false;
  opcBoundary: typeof SOURCE_INTELLIGENCE_BOUNDARY;
};

export type SourceVerificationReceipt = {
  receiptId: string;
  sourceId: string;
  sourceSet: string;
  url: string;
  domain: string;
  verificationStatus: SourceVerificationStatus;
  sourceHash: string;
  checkedAt: string;
  allowlisted: boolean;
  denied: boolean;
  promptInjectionRisk: SourceProfile["promptInjectionRisk"];
  legalCertification: false;
  opcBoundary: typeof SOURCE_INTELLIGENCE_BOUNDARY;
};

export type SourceSearchResult = {
  revision: typeof SOURCE_INTELLIGENCE_REVISION;
  sourceSet: string;
  query: string;
  resultCount: number;
  results: SourceCatalogEntry[];
  allowlistApplied: true;
  rawTextPersistence: false;
  legalCertification: false;
  opcBoundary: typeof SOURCE_INTELLIGENCE_BOUNDARY;
};

export const SOURCE_ALLOWLIST_DOMAINS = [
  "anthropic.com",
  "red.anthropic.com",
  "aisi.gov.uk",
  "ncsc.gov.uk",
  "mitre.org",
  "cisa.gov",
  "enisa.europa.eu",
  "ec.europa.eu",
  "europarl.europa.eu",
  "consilium.europa.eu",
  "ecb.europa.eu"
] as const;

export const SOURCE_DENYLIST_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "metadata.google.internal"
] as const;

export const MYTHOS_SOURCE_CATALOG: SourceCatalogEntry[] = [
  {
    sourceId: "SRC-ANTHROPIC-RSI-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "When AI builds itself",
    url: "https://www.anthropic.com/institute/recursive-self-improvement",
    domain: "anthropic.com",
    publisher: "Anthropic Institute",
    trustTier: "PRIMARY",
    topicTags: ["recursive self-improvement", "automated R&D", "AI development", "frontier models"],
    canonicalClaim:
      "Anthropic describes increasing automation of AI development and the implications of possible recursive self-improvement.",
    relevance: 100
  },
  {
    sourceId: "SRC-ANTHROPIC-MYTHOS-REDTEAM-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "Claude Mythos Preview",
    url: "https://red.anthropic.com/2026/mythos-preview/",
    domain: "red.anthropic.com",
    publisher: "Anthropic Frontier Red Team",
    trustTier: "PRIMARY",
    topicTags: ["Claude Mythos Preview", "FFmpeg", "H.264", "vulnerability discovery", "autonomous cyber"],
    canonicalClaim:
      "Anthropic reports that Claude Mythos Preview autonomously identified a 16-year-old vulnerability in FFmpeg/H.264.",
    relevance: 100
  },
  {
    sourceId: "SRC-ANTHROPIC-CONTAINMENT-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "How we contain Claude across products",
    url: "https://www.anthropic.com/engineering/how-we-contain-claude",
    domain: "anthropic.com",
    publisher: "Anthropic Engineering",
    trustTier: "PRIMARY",
    topicTags: ["containment", "blast radius", "sandbox", "egress", "autonomous agents"],
    canonicalClaim:
      "Anthropic frames autonomous-agent deployment as a blast-radius containment problem requiring technical constraints beyond repeated user approval.",
    relevance: 96
  },
  {
    sourceId: "SRC-AISI-MYTHOS-EVAL-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "Our evaluation of Claude Mythos Preview's cyber capabilities",
    url: "https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities",
    domain: "aisi.gov.uk",
    publisher: "UK AI Security Institute",
    trustTier: "GOVERNMENT",
    topicTags: ["cyber evaluation", "autonomous cyber", "enterprise attack simulation", "frontier model evaluation"],
    canonicalClaim:
      "AISI reports that Mythos Preview showed autonomous cyber capability in controlled vulnerable enterprise-range tests, with caveats about realism.",
    relevance: 95
  },
  {
    sourceId: "SRC-AISI-AUTONOMOUS-CYBER-ADVANCEMENT-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "How fast is autonomous AI cyber capability advancing?",
    url: "https://www.aisi.gov.uk/blog/how-fast-is-autonomous-ai-cyber-capability-advancing",
    domain: "aisi.gov.uk",
    publisher: "UK AI Security Institute",
    trustTier: "GOVERNMENT",
    topicTags: ["autonomous cyber advancement", "cyber ranges", "frontier model trend"],
    canonicalClaim:
      "AISI reports that newer Mythos Preview checkpoints completed cyber ranges previously not completed by models, indicating rapid capability change.",
    relevance: 92
  },
  {
    sourceId: "SRC-ANTHROPIC-GLASSWING-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "Project Glasswing: Securing critical software for the AI era",
    url: "https://anthropic.com/glasswing",
    domain: "anthropic.com",
    publisher: "Anthropic",
    trustTier: "PRIMARY",
    topicTags: ["critical software", "defensive vulnerability discovery", "Project Glasswing", "high-severity vulnerabilities"],
    canonicalClaim:
      "Anthropic presents Mythos-class capabilities as urgent defensive tooling for finding high-severity vulnerabilities before proliferation.",
    relevance: 90
  },
  {
    sourceId: "SRC-ANTHROPIC-RISK-REPORT-2026",
    sourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    title: "Redacted Risk Report Feb 2026",
    url: "https://anthropic.com/feb-2026-risk-report",
    domain: "anthropic.com",
    publisher: "Anthropic",
    trustTier: "PRIMARY",
    topicTags: ["risk report", "automated R&D", "international security", "rapid acceleration"],
    canonicalClaim:
      "Anthropic's risk report treats automation of AI R&D as a pathway to extreme acceleration and broad risk.",
    relevance: 88
  }
];

export function sha256Text(value: string): string {
  return "sha256:" + createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeSourceText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDomain(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "").trim();
}

export function parseSourceUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function isAllowedSourceDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  if (SOURCE_DENYLIST_DOMAINS.some((denied) => normalized === denied || normalized.endsWith("." + denied))) {
    return false;
  }
  return SOURCE_ALLOWLIST_DOMAINS.some((allowed) => normalized === allowed || normalized.endsWith("." + allowed));
}

export function isAllowedSourceUrl(input: string): boolean {
  const url = parseSourceUrl(input);
  return Boolean(url && isAllowedSourceDomain(url.hostname));
}

export function findCatalogEntryById(sourceId: string): SourceCatalogEntry | null {
  const normalized = normalizeSourceText(sourceId).toLowerCase();
  return MYTHOS_SOURCE_CATALOG.find((entry) => entry.sourceId.toLowerCase() === normalized) || null;
}

export function findCatalogEntryByUrl(url: string): SourceCatalogEntry | null {
  const normalized = normalizeSourceText(url).toLowerCase().replace(/\/$/, "");
  return MYTHOS_SOURCE_CATALOG.find((entry) => entry.url.toLowerCase().replace(/\/$/, "") === normalized) || null;
}

export function searchSourceCatalog(input: {
  query?: string;
  sourceSet?: string;
  domains?: string[];
  limit?: number;
}): SourceSearchResult {
  const query = normalizeSourceText(input.query || "");
  const normalizedQuery = query.toLowerCase();
  const sourceSet = normalizeSourceText(input.sourceSet || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID);
  const allowedDomainFilter = new Set((input.domains || []).map(normalizeDomain).filter(Boolean));
  const limit = Math.min(Math.max(Number(input.limit || 8), 1), 20);

  const scored = MYTHOS_SOURCE_CATALOG
    .filter((entry) => !sourceSet || entry.sourceSet === sourceSet)
    .filter((entry) => allowedDomainFilter.size === 0 || allowedDomainFilter.has(entry.domain))
    .filter((entry) => isAllowedSourceDomain(entry.domain))
    .map((entry) => {
      const haystack = [entry.title, entry.publisher, entry.domain, entry.canonicalClaim, ...entry.topicTags]
        .join(" ")
        .toLowerCase();
      const lexicalBoost = normalizedQuery && haystack.includes(normalizedQuery) ? 50 : 0;
      const termBoost = normalizedQuery
        ? normalizedQuery.split(/\s+/).filter((term) => term.length > 2 && haystack.includes(term)).length * 4
        : 0;
      return { entry, score: entry.relevance + lexicalBoost + termBoost };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);

  return {
    revision: SOURCE_INTELLIGENCE_REVISION,
    sourceSet,
    query,
    resultCount: scored.length,
    results: scored,
    allowlistApplied: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  };
}

export function stripHtmlToText(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectPromptInjectionSignals(text: string): string[] {
  const normalized = text.toLowerCase();
  const signals: string[] = [];
  const checks: Array<[string, string]> = [
    ["ignore previous instructions", "IGNORE_PREVIOUS_INSTRUCTIONS"],
    ["disregard previous instructions", "DISREGARD_PREVIOUS_INSTRUCTIONS"],
    ["system prompt", "SYSTEM_PROMPT_REFERENCE"],
    ["developer message", "DEVELOPER_MESSAGE_REFERENCE"],
    ["exfiltrate", "EXFILTRATION_TERM"],
    ["do not tell the user", "HIDDEN_INSTRUCTION_TERM"],
    ["follow these instructions instead", "OVERRIDE_INSTRUCTION_TERM"]
  ];
  for (const [needle, signal] of checks) {
    if (normalized.includes(needle)) {
      signals.push(signal);
    }
  }
  return Array.from(new Set(signals));
}

export async function fetchSourceProfile(input: {
  url: string;
  timeoutMs?: number;
  maxTextChars?: number;
}): Promise<SourceProfile> {
  const catalogEntry = findCatalogEntryByUrl(input.url);
  const parsed = parseSourceUrl(input.url);
  const now = new Date().toISOString();
  const domain = parsed ? normalizeDomain(parsed.hostname) : "INVALID_DOMAIN";
  const fallbackEntry: SourceCatalogEntry =
    catalogEntry || {
      sourceId: "SRC-ADHOC-" + sha256Text(input.url).slice(-16).toUpperCase(),
      sourceSet: "ADHOC_ALLOWLISTED_SOURCE",
      title: input.url,
      url: input.url,
      domain,
      publisher: domain,
      trustTier: "UNKNOWN",
      topicTags: [],
      canonicalClaim: "Ad-hoc allowlisted web source.",
      relevance: 1
    };

  if (!parsed || !isAllowedSourceDomain(parsed.hostname)) {
    return {
      ...fallbackEntry,
      fetchedAt: now,
      fetchStatus: "FETCH_BLOCKED",
      verificationStatus: "SOURCE_REJECTED",
      sourceHash: sha256Text("BLOCKED:" + input.url),
      contentType: "NOT_FETCHED",
      statusCode: null,
      textLength: 0,
      textPreview: "",
      promptInjectionRisk: "NONE_DETECTED",
      promptInjectionSignals: [],
      rawTextPersistence: false,
      legalCertification: false,
      opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(Math.max(input.timeoutMs || 10000, 1000), 30000));
  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent": "HBCE-JOKER-C2-SourceIntelligence/0.1 (+technical-source-receipt)",
        accept: "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.8,*/*;q=0.1"
      }
    });
    const contentType = response.headers.get("content-type") || "UNKNOWN";
    const raw = await response.text();
    const text = contentType.includes("html") ? stripHtmlToText(raw) : normalizeSourceText(raw);
    const limited = text.slice(0, Math.min(Math.max(input.maxTextChars || 200000, 1000), 500000));
    const signals = detectPromptInjectionSignals(limited);
    return {
      ...fallbackEntry,
      fetchedAt: now,
      fetchStatus: response.ok ? "FETCH_READY" : "FETCH_FAILED",
      verificationStatus: response.ok ? "SOURCE_VERIFIED" : "SOURCE_UNVERIFIED",
      sourceHash: sha256Text(limited),
      contentType,
      statusCode: response.status,
      textLength: limited.length,
      textPreview: limited.slice(0, 1200),
      promptInjectionRisk: signals.length ? "POSSIBLE_INJECTION_SIGNALS" : "NONE_DETECTED",
      promptInjectionSignals: signals,
      rawTextPersistence: false,
      legalCertification: false,
      opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
    };
  } catch {
    return {
      ...fallbackEntry,
      fetchedAt: now,
      fetchStatus: "FETCH_FAILED",
      verificationStatus: "SOURCE_UNVERIFIED",
      sourceHash: sha256Text("FETCH_FAILED:" + input.url + ":" + now),
      contentType: "UNKNOWN",
      statusCode: null,
      textLength: 0,
      textPreview: "",
      promptInjectionRisk: "NONE_DETECTED",
      promptInjectionSignals: [],
      rawTextPersistence: false,
      legalCertification: false,
      opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildSourceVerificationReceipt(profile: SourceProfile): SourceVerificationReceipt {
  const denied = !isAllowedSourceUrl(profile.url);
  return {
    receiptId: "SRC-RECEIPT-" + randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase(),
    sourceId: profile.sourceId,
    sourceSet: profile.sourceSet,
    url: profile.url,
    domain: profile.domain,
    verificationStatus: denied ? "SOURCE_REJECTED" : profile.verificationStatus,
    sourceHash: profile.sourceHash,
    checkedAt: new Date().toISOString(),
    allowlisted: !denied,
    denied,
    promptInjectionRisk: profile.promptInjectionRisk,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  };
}

export function buildSourceContextBlock(profiles: SourceProfile[]): string {
  const verified = profiles.filter((profile) => profile.verificationStatus === "SOURCE_VERIFIED");
  return [
    "SOURCE_CONTEXT_BLOCK_READY",
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "sourceSet=" + (profiles[0]?.sourceSet || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID),
    "sourcesVerified=" + String(verified.length),
    "sourcesTotal=" + String(profiles.length),
    "rawTextPersistence=false",
    "promptInjectionScreening=READY",
    "allowlistApplied=true",
    ...profiles.map((profile, index) =>
      [
        "source." + String(index + 1) + ".id=" + profile.sourceId,
        "source." + String(index + 1) + ".domain=" + profile.domain,
        "source." + String(index + 1) + ".status=" + profile.verificationStatus,
        "source." + String(index + 1) + ".hash=" + profile.sourceHash,
        "source." + String(index + 1) + ".title=" + profile.title
      ].join("\n")
    ),
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}

export function buildMythosStaticTestReport(): string {
  return [
    "SOURCE_INTELLIGENCE_TEST_ANTHROPIC_MYTHOS_READY",
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "sourceSet=" + SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    "sourcesExpected=7",
    "catalogSources=" + String(MYTHOS_SOURCE_CATALOG.length),
    "allowlistDomains=" + SOURCE_ALLOWLIST_DOMAINS.join(","),
    "denylistDomains=" + SOURCE_DENYLIST_DOMAINS.join(","),
    "fetchMode=SERVER_SIDE_CONTROLLED",
    "egressPolicy=ALLOWLIST_ONLY",
    "hashingMode=SHA256_ON_FETCHED_TEXT",
    "rawTextPersistence=false",
    "sourceProfilesPersistable=true",
    "promptInjectionScreening=READY",
    "failClosedOnUnverifiedSource=true",
    ...MYTHOS_SOURCE_CATALOG.map((source, index) =>
      [
        "source." + String(index + 1) + ".id=" + source.sourceId,
        "source." + String(index + 1) + ".domain=" + source.domain,
        "source." + String(index + 1) + ".trustTier=" + source.trustTier,
        "source." + String(index + 1) + ".title=" + source.title,
        "source." + String(index + 1) + ".url=" + source.url
      ].join("\n")
    ),
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}
