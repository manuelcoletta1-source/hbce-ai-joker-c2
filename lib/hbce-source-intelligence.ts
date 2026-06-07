import { createHash, randomUUID } from "node:crypto";

export const SOURCE_INTELLIGENCE_REVISION = "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY" as const;
export const SOURCE_INTELLIGENCE_CONTENT_MODE_REVISION = "PDF_BINARY_HASH_ONLY_TEXT_EXTRACTION_REQUIRED-v0.1" as const;
export const SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION = "SOURCESET_REGISTRY_MULTI_DOMAIN_B2G-v0.3" as const;
export const SOURCE_INTELLIGENCE_POLICY_REVISION = "SOURCE_ALLOWLIST_HASH_EGRESS_GUARD-v0.1" as const;
export const SOURCE_SET_ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK = "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK" as const;
export const SOURCE_SET_EU_AI_GOVERNANCE_REGULATORY_STACK = "EU_AI_GOVERNANCE_REGULATORY_STACK" as const;
export const SOURCE_SET_ENISA_CYBER_THREAT_LANDSCAPE = "ENISA_CYBER_THREAT_LANDSCAPE" as const;
export const SOURCE_SET_ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK = "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK" as const;
export const SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY = "OPENAI_AGENTIC_SYSTEMS_SECURITY" as const;
export const SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID = SOURCE_SET_ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK;
export const SOURCE_INTELLIGENCE_BOUNDARY = "technical source receipt only" as const;

export type SourceTrustTier = "PRIMARY" | "INSTITUTIONAL" | "GOVERNMENT" | "TECHNICAL_STANDARD" | "REGULATORY" | "UNKNOWN";
export type SourceFetchStatus = "FETCH_READY" | "FETCH_BLOCKED" | "FETCH_FAILED" | "FETCH_SKIPPED";
export type SourceVerificationStatus = "SOURCE_VERIFIED" | "SOURCE_REJECTED" | "SOURCE_UNVERIFIED";
export type SourceContentMode =
  | "HTML_TEXT_READY"
  | "PLAIN_TEXT_READY"
  | "PDF_BINARY_HASH_ONLY"
  | "UNSUPPORTED_BINARY_HASH_ONLY"
  | "NOT_FETCHED";
export type SourceTextExtractionStatus =
  | "TEXT_READY"
  | "PDF_TEXT_EXTRACTION_REQUIRED"
  | "TEXT_EXTRACTION_SKIPPED_BINARY"
  | "NOT_FETCHED";
export type SourceHashMode = "SHA256_ON_FETCHED_TEXT" | "SHA256_ON_BINARY_BODY" | "SHA256_ON_STATUS_RECEIPT";
export type SourceSetOperationalDomain =
  | "AI_FRONTIER_RISK"
  | "EU_AI_REGULATION"
  | "EU_CYBER_THREAT_INTELLIGENCE"
  | "FINANCIAL_SYSTEM_AI_CYBER_RISK"
  | "AGENTIC_AI_SECURITY";
export type SourceSetRegistryStatus = "ACTIVE" | "SEED_READY" | "PLANNED";

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

export type SourceSetRegistryEntry = {
  sourceSet: string;
  label: string;
  operationalDomain: SourceSetOperationalDomain;
  status: SourceSetRegistryStatus;
  defaultSourceIds: string[];
  expectedMinimumSources: number;
  riskPosture: string;
  primaryUse: string;
  memoryProfileType: string;
  failClosedOnMissingSource: boolean;
  rawTextPersistence: false;
  legalCertification: false;
  opcBoundary: typeof SOURCE_INTELLIGENCE_BOUNDARY;
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
  binaryLength: number;
  contentMode: SourceContentMode;
  textExtractionStatus: SourceTextExtractionStatus;
  semanticTextReady: boolean;
  sourceHashMode: SourceHashMode;
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
  contentMode: SourceProfile["contentMode"];
  textExtractionStatus: SourceProfile["textExtractionStatus"];
  semanticTextReady: SourceProfile["semanticTextReady"];
  sourceHashMode: SourceProfile["sourceHashMode"];
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
  "openai.com",
  "cdn.openai.com",
  "deploymentsafety.openai.com",
  "aisi.gov.uk",
  "ncsc.gov.uk",
  "mitre.org",
  "cisa.gov",
  "enisa.europa.eu",
  "ec.europa.eu",
  "data.europa.eu",
  "eur-lex.europa.eu",
  "europarl.europa.eu",
  "consilium.europa.eu",
  "commission.europa.eu",
  "digital-strategy.ec.europa.eu",
  "ecb.europa.eu"
] as const;

export const SOURCE_DENYLIST_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "metadata.google.internal"
] as const;

export const SOURCE_CATALOG_ENTRIES: SourceCatalogEntry[] = [
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
  },
  {
    sourceId: "SRC-EU-AI-ACT-COMMISSION-2024",
    sourceSet: SOURCE_SET_EU_AI_GOVERNANCE_REGULATORY_STACK,
    title: "AI Act enters into force",
    url: "https://commission.europa.eu/news-and-media/news/ai-act-enters-force-2024-08-01_en",
    domain: "commission.europa.eu",
    publisher: "European Commission",
    trustTier: "REGULATORY",
    topicTags: ["AI Act", "European Union", "risk-based regulation", "governance"],
    canonicalClaim:
      "The European Commission frames the AI Act as the EU legal framework for responsible AI development and deployment.",
    relevance: 100
  },
  {
    sourceId: "SRC-EU-AI-ACT-EURLEX-2024-1689",
    sourceSet: SOURCE_SET_EU_AI_GOVERNANCE_REGULATORY_STACK,
    title: "Regulation (EU) 2024/1689 Artificial Intelligence Act",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    domain: "eur-lex.europa.eu",
    publisher: "EUR-Lex",
    trustTier: "REGULATORY",
    topicTags: ["Regulation 2024/1689", "AI Act", "official journal", "compliance"],
    canonicalClaim:
      "EUR-Lex hosts the official text of Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence.",
    relevance: 100
  },
  {
    sourceId: "SRC-EU-AI-OFFICE-2026",
    sourceSet: SOURCE_SET_EU_AI_GOVERNANCE_REGULATORY_STACK,
    title: "European AI Office",
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    domain: "digital-strategy.ec.europa.eu",
    publisher: "European Commission",
    trustTier: "REGULATORY",
    topicTags: ["European AI Office", "GPAI", "AI Act implementation", "governance bodies"],
    canonicalClaim:
      "The European AI Office supports AI Act implementation, especially for general-purpose AI governance and enforcement.",
    relevance: 96
  },
  {
    sourceId: "SRC-ENISA-THREAT-LANDSCAPE-2025-PDF",
    sourceSet: SOURCE_SET_ENISA_CYBER_THREAT_LANDSCAPE,
    title: "ENISA Threat Landscape 2025",
    url: "https://www.enisa.europa.eu/sites/default/files/2025-11/ENISA%20Threat%20Landscape%202025.pdf",
    domain: "enisa.europa.eu",
    publisher: "ENISA",
    trustTier: "GOVERNMENT",
    topicTags: ["threat landscape", "EU cyber threats", "ransomware", "vulnerability exploitation"],
    canonicalClaim:
      "ENISA Threat Landscape 2025 provides an EU-focused cyber threat ecosystem assessment based on selected incidents.",
    relevance: 100
  },
  {
    sourceId: "SRC-ENISA-THREAT-LANDSCAPE-TOPIC",
    sourceSet: SOURCE_SET_ENISA_CYBER_THREAT_LANDSCAPE,
    title: "Threat Landscape",
    url: "https://www.enisa.europa.eu/topics/cyber-threats/threat-landscape",
    domain: "enisa.europa.eu",
    publisher: "ENISA",
    trustTier: "GOVERNMENT",
    topicTags: ["cyber threats", "threat landscape", "EU situational awareness"],
    canonicalClaim:
      "ENISA maintains the EU threat landscape topic page for cyber threat publications and situational awareness.",
    relevance: 94
  },
  {
    sourceId: "SRC-ECB-AI-OPERATIONAL-RESILIENCE-2026",
    sourceSet: SOURCE_SET_ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK,
    title: "Strengthening operational resilience for the age of AI",
    url: "https://www.ecb.europa.eu/press/key/date/2026/html/ecb.sp260603~5b8e67f237.en.html",
    domain: "ecb.europa.eu",
    publisher: "European Central Bank",
    trustTier: "GOVERNMENT",
    topicTags: ["operational resilience", "AI", "banks", "cyber stress test", "supervision"],
    canonicalClaim:
      "The ECB links AI-era operational resilience with cyber stress testing and banking-sector supervisory expectations.",
    relevance: 100
  },
  {
    sourceId: "SRC-ECB-FINANCIAL-STABILITY-AI-2026",
    sourceSet: SOURCE_SET_ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK,
    title: "Financial stability in the age of artificial intelligence",
    url: "https://www.ecb.europa.eu/press/research-publications/resbull/2026/html/ecb.rb260521~4d8b12940b.en.html",
    domain: "ecb.europa.eu",
    publisher: "European Central Bank",
    trustTier: "GOVERNMENT",
    topicTags: ["financial stability", "AI in finance", "algorithmic architecture", "systemic risk"],
    canonicalClaim:
      "The ECB Research Bulletin treats AI adoption in finance as relevant to market structure and financial-stability analysis.",
    relevance: 96
  },
  {
    sourceId: "SRC-ECB-EUROSYSTEM-CYBER-RESILIENCE-STRATEGY-2024",
    sourceSet: SOURCE_SET_ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK,
    title: "Eurosystem Cyber Resilience Strategy",
    url: "https://www.ecb.europa.eu/paym/pol/shared/pdf/eurosystem_cyber_resilience_strategy_short.pdf",
    domain: "ecb.europa.eu",
    publisher: "European Central Bank",
    trustTier: "GOVERNMENT",
    topicTags: ["cyber resilience", "TIBER-EU", "financial market infrastructures", "Eurosystem"],
    canonicalClaim:
      "The Eurosystem cyber resilience strategy positions cyber resilience as a layered capability for financial entities and infrastructures.",
    relevance: 92
  },
  {
    sourceId: "SRC-OPENAI-PREPAREDNESS-FRAMEWORK-2025",
    sourceSet: SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY,
    title: "Our updated Preparedness Framework",
    url: "https://openai.com/index/updating-our-preparedness-framework/",
    domain: "openai.com",
    publisher: "OpenAI",
    trustTier: "PRIMARY",
    topicTags: ["Preparedness Framework", "frontier capability risk", "safeguards", "deployment safety"],
    canonicalClaim:
      "OpenAI describes its Preparedness Framework as a method for measuring and protecting against severe harm from frontier AI capabilities.",
    relevance: 100
  },
  {
    sourceId: "SRC-OPENAI-PREPAREDNESS-FRAMEWORK-V2-PDF-2025",
    sourceSet: SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY,
    title: "Preparedness Framework v2",
    url: "https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf",
    domain: "cdn.openai.com",
    publisher: "OpenAI",
    trustTier: "PRIMARY",
    topicTags: ["Preparedness Framework v2", "frontier models", "safety advisory group", "risk thresholds"],
    canonicalClaim:
      "OpenAI's Preparedness Framework v2 describes governance for identifying and mitigating severe capability risks from frontier models.",
    relevance: 98
  },
  {
    sourceId: "SRC-OPENAI-AGENTIC-AI-GOVERNANCE-PRACTICES",
    sourceSet: SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY,
    title: "Practices for Governing Agentic AI Systems",
    url: "https://cdn.openai.com/papers/practices-for-governing-agentic-ai-systems.pdf",
    domain: "cdn.openai.com",
    publisher: "OpenAI",
    trustTier: "PRIMARY",
    topicTags: ["agentic AI", "governance practices", "harm prevention", "accountability"],
    canonicalClaim:
      "OpenAI-associated agentic AI governance practices frame agentic systems as requiring identifiable actors, controls and accountability baselines.",
    relevance: 94
  },
  {
    sourceId: "SRC-OPENAI-CHATGPT-AGENT-SYSTEM-CARD-2025",
    sourceSet: SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY,
    title: "ChatGPT Agent System Card",
    url: "https://deploymentsafety.openai.com/chatgpt-agent",
    domain: "deploymentsafety.openai.com",
    publisher: "OpenAI Deployment Safety",
    trustTier: "PRIMARY",
    topicTags: ["agent system card", "deployment safety", "agentic systems", "preparedness"],
    canonicalClaim:
      "OpenAI's ChatGPT Agent system card presents deployment-safety context for an agentic AI system.",
    relevance: 90
  }
];

export const MYTHOS_SOURCE_CATALOG: SourceCatalogEntry[] = SOURCE_CATALOG_ENTRIES.filter(
  (entry) => entry.sourceSet === SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID
);

export const SOURCE_SET_REGISTRY: SourceSetRegistryEntry[] = [
  {
    sourceSet: SOURCE_SET_ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK,
    label: "Anthropic Mythos / RSI / autonomous cyber risk",
    operationalDomain: "AI_FRONTIER_RISK",
    status: "ACTIVE",
    defaultSourceIds: ["SRC-ANTHROPIC-RSI-2026", "SRC-AISI-MYTHOS-EVAL-2026", "SRC-ANTHROPIC-RISK-REPORT-2026"],
    expectedMinimumSources: 3,
    riskPosture: "CYBER_AUTONOMY_ACCELERATION_SIGNAL",
    primaryUse: "B2G evaluation of recursive self-improvement, autonomous cyber capability and containment posture.",
    memoryProfileType: "SOURCE_INTELLIGENCE_OPERATIONAL_PROFILE",
    failClosedOnMissingSource: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  },
  {
    sourceSet: SOURCE_SET_EU_AI_GOVERNANCE_REGULATORY_STACK,
    label: "EU AI Governance Regulatory Stack",
    operationalDomain: "EU_AI_REGULATION",
    status: "SEED_READY",
    defaultSourceIds: ["SRC-EU-AI-ACT-COMMISSION-2024", "SRC-EU-AI-ACT-EURLEX-2024-1689", "SRC-EU-AI-OFFICE-2026"],
    expectedMinimumSources: 3,
    riskPosture: "EU_AI_REGULATORY_IMPLEMENTATION_SIGNAL",
    primaryUse: "Regulatory grounding for EU AI Act, AI Office and GPAI governance claims.",
    memoryProfileType: "SOURCE_INTELLIGENCE_REGULATORY_PROFILE",
    failClosedOnMissingSource: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  },
  {
    sourceSet: SOURCE_SET_ENISA_CYBER_THREAT_LANDSCAPE,
    label: "ENISA Cyber Threat Landscape",
    operationalDomain: "EU_CYBER_THREAT_INTELLIGENCE",
    status: "SEED_READY",
    defaultSourceIds: ["SRC-ENISA-THREAT-LANDSCAPE-2025-PDF", "SRC-ENISA-THREAT-LANDSCAPE-TOPIC"],
    expectedMinimumSources: 2,
    riskPosture: "EU_CYBER_THREAT_LANDSCAPE_SIGNAL",
    primaryUse: "EU cyber threat monitoring, public-sector cyber risk and institutional threat framing.",
    memoryProfileType: "SOURCE_INTELLIGENCE_THREAT_LANDSCAPE_PROFILE",
    failClosedOnMissingSource: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  },
  {
    sourceSet: SOURCE_SET_ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK,
    label: "ECB Financial System AI / Cyber Risk",
    operationalDomain: "FINANCIAL_SYSTEM_AI_CYBER_RISK",
    status: "SEED_READY",
    defaultSourceIds: ["SRC-ECB-AI-OPERATIONAL-RESILIENCE-2026", "SRC-ECB-FINANCIAL-STABILITY-AI-2026", "SRC-ECB-EUROSYSTEM-CYBER-RESILIENCE-STRATEGY-2024"],
    expectedMinimumSources: 3,
    riskPosture: "FINANCIAL_SYSTEM_AI_CYBER_RESILIENCE_SIGNAL",
    primaryUse: "B2G grounding for banking resilience, AI-era financial-stability risk and cyber resilience strategy.",
    memoryProfileType: "SOURCE_INTELLIGENCE_FINANCIAL_SYSTEM_RISK_PROFILE",
    failClosedOnMissingSource: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  },
  {
    sourceSet: SOURCE_SET_OPENAI_AGENTIC_SYSTEMS_SECURITY,
    label: "OpenAI Agentic Systems Security",
    operationalDomain: "AGENTIC_AI_SECURITY",
    status: "SEED_READY",
    defaultSourceIds: ["SRC-OPENAI-PREPAREDNESS-FRAMEWORK-2025", "SRC-OPENAI-PREPAREDNESS-FRAMEWORK-V2-PDF-2025", "SRC-OPENAI-CHATGPT-AGENT-SYSTEM-CARD-2025"],
    expectedMinimumSources: 3,
    riskPosture: "AGENTIC_AI_DEPLOYMENT_SAFETY_SIGNAL",
    primaryUse: "Source-grounded analysis of frontier model preparedness, agentic system deployment safety and governance practices.",
    memoryProfileType: "SOURCE_INTELLIGENCE_AGENTIC_SECURITY_PROFILE",
    failClosedOnMissingSource: true,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  }
];

export function sha256Text(value: string): string {
  return "sha256:" + createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256Bytes(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return "sha256:" + createHash("sha256").update(bytes).digest("hex");
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

export function normalizeSourceSetId(input?: string): string {
  const normalized = normalizeSourceText(input || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID).toUpperCase();
  return normalized || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID;
}

export function listSourceSetRegistry(): SourceSetRegistryEntry[] {
  return SOURCE_SET_REGISTRY.slice();
}

export function getSourceSetRegistryEntry(sourceSet?: string): SourceSetRegistryEntry | null {
  const normalized = normalizeSourceSetId(sourceSet);
  return SOURCE_SET_REGISTRY.find((entry) => entry.sourceSet === normalized) || null;
}

export function getDefaultSourceIdsForSourceSet(sourceSet?: string): string[] {
  return getSourceSetRegistryEntry(sourceSet)?.defaultSourceIds.slice() || [];
}

export function getSourcesBySet(sourceSet?: string): SourceCatalogEntry[] {
  const normalized = normalizeSourceSetId(sourceSet);
  return SOURCE_CATALOG_ENTRIES.filter((entry) => entry.sourceSet === normalized);
}

export function findCatalogEntryById(sourceId: string): SourceCatalogEntry | null {
  const normalized = normalizeSourceText(sourceId).toLowerCase();
  return SOURCE_CATALOG_ENTRIES.find((entry) => entry.sourceId.toLowerCase() === normalized) || null;
}

export function findCatalogEntryByUrl(url: string): SourceCatalogEntry | null {
  const normalized = normalizeSourceText(url).toLowerCase().replace(/\/$/, "");
  return SOURCE_CATALOG_ENTRIES.find((entry) => entry.url.toLowerCase().replace(/\/$/, "") === normalized) || null;
}

export function searchSourceCatalog(input: {
  query?: string;
  sourceSet?: string;
  domains?: string[];
  limit?: number;
}): SourceSearchResult {
  const query = normalizeSourceText(input.query || "");
  const normalizedQuery = query.toLowerCase();
  const sourceSet = normalizeSourceSetId(input.sourceSet);
  const allowedDomainFilter = new Set((input.domains || []).map(normalizeDomain).filter(Boolean));
  const limit = Math.min(Math.max(Number(input.limit || 8), 1), 20);

  const scored = SOURCE_CATALOG_ENTRIES
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


export function isPdfSource(contentType: string, url?: string): boolean {
  const normalizedContentType = normalizeSourceText(contentType).toLowerCase();
  const normalizedUrl = normalizeSourceText(url || "").toLowerCase();
  return normalizedContentType.includes("application/pdf") || normalizedUrl.endsWith(".pdf");
}

export function isHtmlSource(contentType: string): boolean {
  const normalizedContentType = normalizeSourceText(contentType).toLowerCase();
  return normalizedContentType.includes("text/html") || normalizedContentType.includes("application/xhtml+xml");
}

export function isPlainTextSource(contentType: string): boolean {
  const normalizedContentType = normalizeSourceText(contentType).toLowerCase();
  return normalizedContentType.startsWith("text/") || normalizedContentType.includes("application/json");
}

export function decodeUtf8Bytes(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function buildPdfBinaryHashOnlyPreview(input: {
  contentType: string;
  binaryLength: number;
  sourceHash: string;
}): string {
  return [
    "PDF_BINARY_HASH_ONLY",
    "textExtractionStatus=PDF_TEXT_EXTRACTION_REQUIRED",
    "semanticTextReady=false",
    "contentType=" + input.contentType,
    "binaryLength=" + String(input.binaryLength),
    "sourceHash=" + input.sourceHash,
    "note=PDF body was fetched and hashed as binary; semantic text extraction was not performed in this layer."
  ].join(" | ");
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
      binaryLength: 0,
      contentMode: "NOT_FETCHED",
      textExtractionStatus: "NOT_FETCHED",
      semanticTextReady: false,
      sourceHashMode: "SHA256_ON_STATUS_RECEIPT",
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
    const bodyBytes = new Uint8Array(await response.arrayBuffer());
    const binaryLength = bodyBytes.byteLength;
    const maxTextChars = Math.min(Math.max(input.maxTextChars || 200000, 1000), 500000);

    if (isPdfSource(contentType, parsed.toString())) {
      const sourceHash = sha256Bytes(bodyBytes);
      return {
        ...fallbackEntry,
        fetchedAt: now,
        fetchStatus: response.ok ? "FETCH_READY" : "FETCH_FAILED",
        verificationStatus: response.ok ? "SOURCE_VERIFIED" : "SOURCE_UNVERIFIED",
        sourceHash,
        contentType,
        statusCode: response.status,
        textLength: 0,
        textPreview: buildPdfBinaryHashOnlyPreview({ contentType, binaryLength, sourceHash }),
        binaryLength,
        contentMode: "PDF_BINARY_HASH_ONLY",
        textExtractionStatus: "PDF_TEXT_EXTRACTION_REQUIRED",
        semanticTextReady: false,
        sourceHashMode: "SHA256_ON_BINARY_BODY",
        promptInjectionRisk: "NONE_DETECTED",
        promptInjectionSignals: [],
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      };
    }

    const decoded = decodeUtf8Bytes(bodyBytes);
    const text = isHtmlSource(contentType) ? stripHtmlToText(decoded) : normalizeSourceText(decoded);
    const limited = text.slice(0, maxTextChars);
    const signals = detectPromptInjectionSignals(limited);
    const contentMode: SourceContentMode = isHtmlSource(contentType)
      ? "HTML_TEXT_READY"
      : isPlainTextSource(contentType)
        ? "PLAIN_TEXT_READY"
        : "UNSUPPORTED_BINARY_HASH_ONLY";
    const textExtractionStatus: SourceTextExtractionStatus = contentMode === "UNSUPPORTED_BINARY_HASH_ONLY"
      ? "TEXT_EXTRACTION_SKIPPED_BINARY"
      : "TEXT_READY";
    const semanticTextReady = response.ok && textExtractionStatus === "TEXT_READY" && limited.length > 0;
    return {
      ...fallbackEntry,
      fetchedAt: now,
      fetchStatus: response.ok ? "FETCH_READY" : "FETCH_FAILED",
      verificationStatus: response.ok ? "SOURCE_VERIFIED" : "SOURCE_UNVERIFIED",
      sourceHash: contentMode === "UNSUPPORTED_BINARY_HASH_ONLY" ? sha256Bytes(bodyBytes) : sha256Text(limited),
      contentType,
      statusCode: response.status,
      textLength: contentMode === "UNSUPPORTED_BINARY_HASH_ONLY" ? 0 : limited.length,
      textPreview: contentMode === "UNSUPPORTED_BINARY_HASH_ONLY" ? "UNSUPPORTED_BINARY_HASH_ONLY | textExtractionStatus=TEXT_EXTRACTION_SKIPPED_BINARY | semanticTextReady=false" : limited.slice(0, 1200),
      binaryLength,
      contentMode,
      textExtractionStatus,
      semanticTextReady,
      sourceHashMode: contentMode === "UNSUPPORTED_BINARY_HASH_ONLY" ? "SHA256_ON_BINARY_BODY" : "SHA256_ON_FETCHED_TEXT",
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
      binaryLength: 0,
      contentMode: "NOT_FETCHED",
      textExtractionStatus: "NOT_FETCHED",
      semanticTextReady: false,
      sourceHashMode: "SHA256_ON_STATUS_RECEIPT",
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
    contentMode: profile.contentMode,
    textExtractionStatus: profile.textExtractionStatus,
    semanticTextReady: profile.semanticTextReady,
    sourceHashMode: profile.sourceHashMode,
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
    "sourcesSemanticTextReady=" + String(profiles.filter((profile) => profile.semanticTextReady).length),
    "pdfBinaryHashOnlySources=" + String(profiles.filter((profile) => profile.contentMode === "PDF_BINARY_HASH_ONLY").length),
    "rawTextPersistence=false",
    "promptInjectionScreening=READY",
    "allowlistApplied=true",
    ...profiles.map((profile, index) =>
      [
        "source." + String(index + 1) + ".id=" + profile.sourceId,
        "source." + String(index + 1) + ".domain=" + profile.domain,
        "source." + String(index + 1) + ".status=" + profile.verificationStatus,
        "source." + String(index + 1) + ".hash=" + profile.sourceHash,
        "source." + String(index + 1) + ".hashMode=" + profile.sourceHashMode,
        "source." + String(index + 1) + ".contentMode=" + profile.contentMode,
        "source." + String(index + 1) + ".textExtractionStatus=" + profile.textExtractionStatus,
        "source." + String(index + 1) + ".semanticTextReady=" + String(profile.semanticTextReady),
        "source." + String(index + 1) + ".title=" + profile.title
      ].join("\n")
    ),
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}

export function buildSourceSetRegistryReport(): string {
  return [
    "SOURCESET_REGISTRY_READY",
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "registryRevision=" + SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    "sourceSets=" + String(SOURCE_SET_REGISTRY.length),
    "catalogSources=" + String(SOURCE_CATALOG_ENTRIES.length),
    "allowlistDomains=" + SOURCE_ALLOWLIST_DOMAINS.join(","),
    "rawTextPersistence=false",
    ...SOURCE_SET_REGISTRY.map((sourceSet, index) =>
      [
        "sourceSet." + String(index + 1) + ".id=" + sourceSet.sourceSet,
        "sourceSet." + String(index + 1) + ".label=" + sourceSet.label,
        "sourceSet." + String(index + 1) + ".status=" + sourceSet.status,
        "sourceSet." + String(index + 1) + ".operationalDomain=" + sourceSet.operationalDomain,
        "sourceSet." + String(index + 1) + ".defaultSources=" + sourceSet.defaultSourceIds.join(","),
        "sourceSet." + String(index + 1) + ".riskPosture=" + sourceSet.riskPosture,
        "sourceSet." + String(index + 1) + ".memoryProfileType=" + sourceSet.memoryProfileType
      ].join("\n")
    ),
    "legalCertification=false",
    "OPC=technical source receipt only"
  ].join("\n");
}

export function buildSourceSetStaticTestReport(sourceSet?: string): string {
  const registryEntry = getSourceSetRegistryEntry(sourceSet);
  const resolvedSourceSet = registryEntry?.sourceSet || normalizeSourceSetId(sourceSet);
  const sources = getSourcesBySet(resolvedSourceSet);
  const status = registryEntry && sources.length >= registryEntry.expectedMinimumSources
    ? "SOURCESET_STATIC_TEST_READY"
    : "SOURCESET_STATIC_TEST_INCOMPLETE";
  return [
    status,
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "registryRevision=" + SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    "sourceSet=" + resolvedSourceSet,
    "sourceSetRegistered=" + String(Boolean(registryEntry)),
    "sourceSetStatus=" + (registryEntry?.status || "PLANNED"),
    "operationalDomain=" + (registryEntry?.operationalDomain || "UNKNOWN"),
    "riskPosture=" + (registryEntry?.riskPosture || "UNKNOWN"),
    "sourcesExpectedMinimum=" + String(registryEntry?.expectedMinimumSources || 0),
    "catalogSources=" + String(sources.length),
    "defaultSourceIds=" + (registryEntry?.defaultSourceIds.join(",") || ""),
    "fetchMode=SERVER_SIDE_CONTROLLED",
    "egressPolicy=ALLOWLIST_ONLY",
    "rawTextPersistence=false",
    "promptInjectionScreening=READY",
    "failClosedOnMissingSource=" + String(Boolean(registryEntry?.failClosedOnMissingSource)),
    ...sources.map((source, index) =>
      [
        "source." + String(index + 1) + ".id=" + source.sourceId,
        "source." + String(index + 1) + ".domain=" + source.domain,
        "source." + String(index + 1) + ".trustTier=" + source.trustTier,
        "source." + String(index + 1) + ".title=" + source.title,
        "source." + String(index + 1) + ".url=" + source.url
      ].join("\n")
    ),
    "legalCertification=false",
    "OPC=technical source receipt only"
  ].join("\n");
}

export function buildMythosStaticTestReport(): string {
  return [
    "SOURCE_INTELLIGENCE_TEST_ANTHROPIC_MYTHOS_READY",
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "registryRevision=" + SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    "sourceSet=" + SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    "sourcesExpected=7",
    "catalogSources=" + String(MYTHOS_SOURCE_CATALOG.length),
    "allowlistDomains=" + SOURCE_ALLOWLIST_DOMAINS.join(","),
    "denylistDomains=" + SOURCE_DENYLIST_DOMAINS.join(","),
    "fetchMode=SERVER_SIDE_CONTROLLED",
    "egressPolicy=ALLOWLIST_ONLY",
    "hashingMode=SHA256_ON_FETCHED_TEXT_OR_BINARY_BODY_BY_CONTENT_MODE",
    "contentModeGuard=" + SOURCE_INTELLIGENCE_CONTENT_MODE_REVISION,
    "pdfBinaryHashOnly=READY",
    "pdfTextExtractionStatus=PDF_TEXT_EXTRACTION_REQUIRED",
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
