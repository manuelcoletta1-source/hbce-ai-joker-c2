import { NextRequest, NextResponse } from "next/server";

const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-SOURCE_INTELLIGENCE-CONTRACT-v1.0";
const API_VERSION = "v1";
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";
const SOURCE_LAYER_REVISION = "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY";
const SOURCESET_REGISTRY_REVISION = "SOURCESET_REGISTRY_MULTI_DOMAIN_B2G-v0.3";

const HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const RUNTIME_IPR = "IPR-AI-0001";
const TENANT = "HBCE-TENANT-SELF-PILOT";
const WORKSPACE = "HBCE-WORKSPACE-RND";

const SOURCE_PROFILE_SAVE_MODE = "EXPLICIT_OPERATOR_SAVE_ONLY";
const OPC_BOUNDARY = "technical proof receipt only";
const SOURCE_BOUNDARY = "technical source receipt only";

const SOURCE_SET_CATALOG = [
  {
    sourceSet: "EU_AI_GOVERNANCE_REGULATORY_STACK",
    label: "EU AI Governance",
    status: "SEED_READY",
    operationalDomain: "EU_AI_REGULATION",
    riskPosture: "EU_AI_REGULATORY_IMPLEMENTATION_SIGNAL",
    memoryProfileType: "SOURCE_INTELLIGENCE_REGULATORY_PROFILE",
    defaultSourceCount: 3,
    catalogSourcesForSourceSet: 3,
    sourcesSemanticTextReady: 3,
    pdfBinaryHashOnlySources: 0,
    defaultSourceIds: [
      "SRC-EU-AI-ACT-COMMISSION-2024",
      "SRC-EU-AI-ACT-EURLEX-2024-1689",
      "SRC-EU-AI-OFFICE-2026"
    ]
  },
  {
    sourceSet: "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK",
    label: "ECB AI/Cyber Risk",
    status: "SEED_READY",
    operationalDomain: "FINANCIAL_SYSTEM_AI_CYBER_RISK",
    riskPosture: "FINANCIAL_SYSTEM_AI_CYBER_RESILIENCE_SIGNAL",
    memoryProfileType: "SOURCE_INTELLIGENCE_FINANCIAL_SYSTEM_RISK_PROFILE",
    defaultSourceCount: 3,
    catalogSourcesForSourceSet: 3,
    sourcesSemanticTextReady: 2,
    pdfBinaryHashOnlySources: 1,
    defaultSourceIds: [
      "SRC-ECB-FINANCIAL-STABILITY-REVIEW-AI-2025",
      "SRC-ECB-SUPERVISION-CYBER-RESILIENCE-2025",
      "SRC-ECB-EUROSYSTEM-CYBER-RESILIENCE-STRATEGY-2024"
    ]
  },
  {
    sourceSet: "ENISA_CYBER_THREAT_LANDSCAPE",
    label: "ENISA Threat Landscape",
    status: "SEED_READY",
    operationalDomain: "EU_CYBER_THREAT_LANDSCAPE",
    riskPosture: "EU_CYBER_THREAT_LANDSCAPE_SIGNAL",
    memoryProfileType: "SOURCE_INTELLIGENCE_THREAT_LANDSCAPE_PROFILE",
    defaultSourceCount: 2,
    catalogSourcesForSourceSet: 2,
    sourcesSemanticTextReady: 1,
    pdfBinaryHashOnlySources: 1,
    defaultSourceIds: [
      "SRC-ENISA-THREAT-LANDSCAPE-2025",
      "SRC-ENISA-AI-CYBERSECURITY-REPORT-2025"
    ]
  },
  {
    sourceSet: "OPENAI_AGENTIC_SYSTEMS_SECURITY",
    label: "OpenAI Agentic Security",
    status: "SEED_READY",
    operationalDomain: "AGENTIC_AI_DEPLOYMENT_SECURITY",
    riskPosture: "AGENTIC_AI_DEPLOYMENT_SAFETY_SIGNAL",
    memoryProfileType: "SOURCE_INTELLIGENCE_AGENTIC_SECURITY_PROFILE",
    defaultSourceCount: 3,
    catalogSourcesForSourceSet: 4,
    sourcesSemanticTextReady: 2,
    pdfBinaryHashOnlySources: 1,
    defaultSourceIds: [
      "SRC-OPENAI-PREPAREDNESS-FRAMEWORK-2025",
      "SRC-OPENAI-SYSTEM-CARD-AGENTIC-SAFETY-2025",
      "SRC-OPENAI-AGENTIC-SYSTEMS-SECURITY-2026"
    ]
  },
  {
    sourceSet: "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK",
    label: "Anthropic Mythos",
    status: "ACTIVE",
    operationalDomain: "AI_FRONTIER_RISK",
    riskPosture: "CYBER_AUTONOMY_ACCELERATION_SIGNAL",
    memoryProfileType: "SOURCE_INTELLIGENCE_OPERATIONAL_PROFILE",
    defaultSourceCount: 3,
    catalogSourcesForSourceSet: 7,
    sourcesSemanticTextReady: 2,
    pdfBinaryHashOnlySources: 1,
    defaultSourceIds: [
      "SRC-ANTHROPIC-RSI-2026",
      "SRC-AISI-MYTHOS-EVAL-2026",
      "SRC-ANTHROPIC-RISK-REPORT-2026"
    ],
    verifiedHashes: {
      "SRC-ANTHROPIC-RSI-2026":
        "sha256:1d80dd6da838ea2a83a529dc71d17256f8f28ae22fb5663b56b74a02653e0038",
      "SRC-AISI-MYTHOS-EVAL-2026":
        "sha256:4a18fdd76c45a15e1abf8bf4516978390a0aad8847f5b2d283fdf36e6838dcfb",
      "SRC-ANTHROPIC-RISK-REPORT-2026":
        "sha256:08ad2ac000fcd8750dcce4b279eb4b900e906c504134d9b190571fdcfaead156"
    }
  }
] as const;

type SourceSetCatalogEntry = (typeof SOURCE_SET_CATALOG)[number];

type SourceIntelligenceBoundary = {
  legalCertification: false;
  opcBoundary: typeof OPC_BOUNDARY;
  sourceBoundary: typeof SOURCE_BOUNDARY;
  rawTextPersistence: false;
  rawBinaryPersistence: false;
  promptInjectionScreening: "ACTIVE";
  allowlistOnly: true;
  sourceProfileSaveMode: typeof SOURCE_PROFILE_SAVE_MODE;
  automaticIprMemoryWrite: false;
  noNewIprMemory: true;
  noNewSemanticMemoryPersistable: true;
  explicitOperatorSaveOnly: true;
};

type SourceIntelligenceResponse = {
  ok: true;
  status: "HBCE_SOURCE_INTELLIGENCE_V1_CONTRACT_READY";
  routeRevision: typeof ROUTE_REVISION;
  apiVersion: typeof API_VERSION;
  product: typeof PRODUCT_NAME;
  runtime: typeof RUNTIME_NAME;
  generatedAt: string;
  request: {
    sourceSet: string | null;
    sourceSetMatched: boolean;
    mode: "SOURCESET_DETAIL" | "REGISTRY_OVERVIEW";
  };
  identity: {
    humanIpr: typeof HUMAN_IPR;
    runtimeIpr: typeof RUNTIME_IPR;
    tenant: typeof TENANT;
    workspace: typeof WORKSPACE;
    access: "ACCESS_GRANTED";
    policy: "ALLOW";
  };
  sourceIntelligence: {
    status: "SOURCE_INTELLIGENCE_CONTRACT_READY";
    sourceLayerRevision: typeof SOURCE_LAYER_REVISION;
    sourceSetRegistryRevision: typeof SOURCESET_REGISTRY_REVISION;
    registryStatus: "SOURCESET_REGISTRY_READY";
    sourceSets: number;
    catalogSources: 19;
    defaultSourceCount: number;
    sourcesSemanticTextReady: number;
    pdfBinaryHashOnlySources: number;
    endpointDelegation: {
      health: "/api/sources/health";
      search: "/api/sources/search";
      fetch: "/api/sources/fetch";
      verify: "/api/sources/verify";
      register: "/api/sources/register";
      summarize: "/api/sources/summarize";
      chat: "/api/chat";
    };
    publicV1Endpoint: "/api/v1/source-intelligence";
    selectedSourceSet: SourceSetCatalogEntry | null;
    sourceSetCatalog: readonly SourceSetCatalogEntry[];
  };
  contract: {
    description: string;
    method: "GET";
    path: "/api/v1/source-intelligence";
    query: {
      sourceSet: "optional SourceSet identifier";
    };
    executionMode: "CONTRACT_REGISTRY_VIEW_ONLY";
    performsHttpFetch: false;
    performsDatabaseLookup: false;
    performsRuntimeMutation: false;
    performsMemoryWrite: false;
    performsSourceProfilePersistence: false;
  };
  boundary: SourceIntelligenceBoundary;
  next: {
    liveFetch: "/api/sources/fetch";
    liveSummarize: "/api/sources/summarize";
    governedChat: "/api/v1/chat";
    openapi: "/api/v1/openapi";
    selfTest: "/api/v1/self-test";
  };
};

function utcNow(): string {
  return new Date().toISOString();
}

function normalizeSourceSet(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function findSourceSet(sourceSet: string | null): SourceSetCatalogEntry | null {
  if (!sourceSet) return null;
  return SOURCE_SET_CATALOG.find((entry) => entry.sourceSet === sourceSet) ?? null;
}

function buildBoundary(): SourceIntelligenceBoundary {
  return {
    legalCertification: false,
    opcBoundary: OPC_BOUNDARY,
    sourceBoundary: SOURCE_BOUNDARY,
    rawTextPersistence: false,
    rawBinaryPersistence: false,
    promptInjectionScreening: "ACTIVE",
    allowlistOnly: true,
    sourceProfileSaveMode: SOURCE_PROFILE_SAVE_MODE,
    automaticIprMemoryWrite: false,
    noNewIprMemory: true,
    noNewSemanticMemoryPersistable: true,
    explicitOperatorSaveOnly: true
  };
}

function buildResponse(request: NextRequest): SourceIntelligenceResponse {
  const requestUrl = new URL(request.url);
  const requestedSourceSet = normalizeSourceSet(requestUrl.searchParams.get("sourceSet"));
  const selectedSourceSet = findSourceSet(requestedSourceSet);

  const selectedOrAll = selectedSourceSet ? [selectedSourceSet] : SOURCE_SET_CATALOG;
  const defaultSourceCount = selectedOrAll.reduce(
    (total, sourceSet) => total + sourceSet.defaultSourceCount,
    0
  );
  const sourcesSemanticTextReady = selectedOrAll.reduce(
    (total, sourceSet) => total + sourceSet.sourcesSemanticTextReady,
    0
  );
  const pdfBinaryHashOnlySources = selectedOrAll.reduce(
    (total, sourceSet) => total + sourceSet.pdfBinaryHashOnlySources,
    0
  );

  return {
    ok: true,
    status: "HBCE_SOURCE_INTELLIGENCE_V1_CONTRACT_READY",
    routeRevision: ROUTE_REVISION,
    apiVersion: API_VERSION,
    product: PRODUCT_NAME,
    runtime: RUNTIME_NAME,
    generatedAt: utcNow(),
    request: {
      sourceSet: requestedSourceSet,
      sourceSetMatched: Boolean(selectedSourceSet),
      mode: selectedSourceSet ? "SOURCESET_DETAIL" : "REGISTRY_OVERVIEW"
    },
    identity: {
      humanIpr: HUMAN_IPR,
      runtimeIpr: RUNTIME_IPR,
      tenant: TENANT,
      workspace: WORKSPACE,
      access: "ACCESS_GRANTED",
      policy: "ALLOW"
    },
    sourceIntelligence: {
      status: "SOURCE_INTELLIGENCE_CONTRACT_READY",
      sourceLayerRevision: SOURCE_LAYER_REVISION,
      sourceSetRegistryRevision: SOURCESET_REGISTRY_REVISION,
      registryStatus: "SOURCESET_REGISTRY_READY",
      sourceSets: SOURCE_SET_CATALOG.length,
      catalogSources: 19,
      defaultSourceCount,
      sourcesSemanticTextReady,
      pdfBinaryHashOnlySources,
      endpointDelegation: {
        health: "/api/sources/health",
        search: "/api/sources/search",
        fetch: "/api/sources/fetch",
        verify: "/api/sources/verify",
        register: "/api/sources/register",
        summarize: "/api/sources/summarize",
        chat: "/api/chat"
      },
      publicV1Endpoint: "/api/v1/source-intelligence",
      selectedSourceSet,
      sourceSetCatalog: selectedSourceSet ? [selectedSourceSet] : SOURCE_SET_CATALOG
    },
    contract: {
      description:
        "Public v1 contract view for HBCE Source Intelligence v0.3. This route exposes the governed SourceSet registry and boundary metadata without fetching sources, reading the database, mutating runtime state, or persisting source profiles.",
      method: "GET",
      path: "/api/v1/source-intelligence",
      query: {
        sourceSet: "optional SourceSet identifier"
      },
      executionMode: "CONTRACT_REGISTRY_VIEW_ONLY",
      performsHttpFetch: false,
      performsDatabaseLookup: false,
      performsRuntimeMutation: false,
      performsMemoryWrite: false,
      performsSourceProfilePersistence: false
    },
    boundary: buildBoundary(),
    next: {
      liveFetch: "/api/sources/fetch",
      liveSummarize: "/api/sources/summarize",
      governedChat: "/api/v1/chat",
      openapi: "/api/v1/openapi",
      selfTest: "/api/v1/self-test"
    }
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<SourceIntelligenceResponse>> {
  return NextResponse.json(buildResponse(request), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY,
      "X-HBCE-Source-Boundary": SOURCE_BOUNDARY,
      "X-HBCE-Raw-Text-Persistence": "false",
      "X-HBCE-Source-Profile-Save-Mode": SOURCE_PROFILE_SAVE_MODE
    }
  });
}
