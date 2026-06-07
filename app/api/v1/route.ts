import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_REVISION = "HBCE-IPR-RUNTIME-API-v1-ROOT-DISCOVERY-v1.1-SURFACE_ALIGNMENT";
const API_VERSION = "v1";
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";
const OPENAPI_REVISION = "HBCE-IPR-RUNTIME-API-v1-OPENAPI-CONTRACT-v1.1.1-SYNTAX_FIX";
const SOURCE_INTELLIGENCE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-SOURCE_INTELLIGENCE-CONTRACT-v1.0.1-TYPE_FIX";

const SELF_PILOT_CONTEXT = {
  humanIpr: "IPR-88505FE91013DCFE97C56ED1",
  runtimeIpr: "IPR-AI-0001",
  tenant: "HBCE-TENANT-SELF-PILOT",
  workspace: "HBCE-WORKSPACE-RND",
  access: "ACCESS_GRANTED",
  policy: "ALLOW"
} as const;

const BOUNDARY = {
  legalCertification: false,
  opcBoundary: "technical proof receipt only",
  auditBoundary: "technical audit receipt only",
  modelUsageBoundary: "technical model usage receipt only",
  sourceBoundary: "technical source receipt only",
  iprCardBoundary:
    "IPR Card is an internal operational identity certificate, not an official public identity document.",
  rawTextPersistence: false,
  rawBinaryPersistence: false,
  automaticIprMemoryWrite: false,
  runtimeMemoryWriteSuppressed: true,
  semanticPersistenceSuppressed: true,
  noNewIprMemory: true,
  noNewSemanticMemoryPersistable: true,
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
  contractMode: "PUBLIC_V1_CONTRACT_DISCOVERY_ONLY"
} as const;

const SOURCE_INTELLIGENCE = {
  status: "SOURCE_INTELLIGENCE_READY",
  revision: SOURCE_INTELLIGENCE_REVISION,
  sourceLayerRevision: "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY",
  sourceSetRegistry: "SOURCESET_REGISTRY_READY",
  registryRevision: "SOURCESET_REGISTRY_MULTI_DOMAIN_B2G-v0.3",
  sourceSets: 5,
  catalogSources: 19,
  endpoint: "/api/v1/source-intelligence",
  queryExample:
    "/api/v1/source-intelligence?sourceSet=ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK",
  sourceSetsAvailable: [
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK",
    "ENISA_CYBER_THREAT_LANDSCAPE",
    "OPENAI_AGENTIC_SYSTEMS_SECURITY",
    "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK"
  ],
  rawTextPersistence: false,
  rawBinaryPersistence: false,
  allowlistOnly: true,
  profilePersistenceMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
  automaticIprMemoryWrite: false
} as const;

type EndpointDescriptor = {
  method: "GET" | "POST";
  path: string;
  name: string;
  status: "READY" | "CONTRACT_READY";
  category:
    | "discovery"
    | "identity"
    | "runtime"
    | "files"
    | "operations"
    | "proof"
    | "observability"
    | "source-intelligence"
    | "diagnostics"
    | "demo";
  description: string;
  executionBoundary: string;
};

const ENDPOINTS: readonly EndpointDescriptor[] = [
  {
    method: "GET",
    path: "/api/v1",
    name: "Root discovery",
    status: "READY",
    category: "discovery",
    description: "Public discovery endpoint for HBCE IPR Runtime API v1.",
    executionBoundary: "DISCOVERY_ONLY_NO_RUNTIME_MUTATION"
  },
  {
    method: "GET",
    path: "/api/v1/health",
    name: "Health",
    status: "READY",
    category: "discovery",
    description: "Static product health and runtime boundary declaration.",
    executionBoundary: "STATIC_CONTRACT_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/capabilities",
    name: "Capabilities",
    status: "READY",
    category: "discovery",
    description: "Capability catalogue for the public v1 surface.",
    executionBoundary: "STATIC_CONTRACT_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/openapi",
    name: "OpenAPI contract",
    status: "READY",
    category: "discovery",
    description: "OpenAPI 3.1 contract for the public API v1 surface.",
    executionBoundary: "STATIC_OPENAPI_SCHEMA_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/self-test",
    name: "Self-test matrix",
    status: "READY",
    category: "diagnostics",
    description: "Static endpoint matrix for manual smoke testing of the v1 surface.",
    executionBoundary: "STATIC_CONTRACT_MATRIX_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/ipr/session",
    name: "IPR session contract",
    status: "READY",
    category: "identity",
    description: "Public contract for IPR operational session creation.",
    executionBoundary: "CONTRACT_ONLY_NO_DATABASE_LOOKUP"
  },
  {
    method: "POST",
    path: "/api/v1/ipr/session",
    name: "Create IPR session",
    status: "READY",
    category: "identity",
    description: "Contract-safe self-pilot IPR session creation receipt.",
    executionBoundary: "CONTRACT_RECEIPT_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/ipr/session/{sessionId}",
    name: "Lookup IPR session",
    status: "READY",
    category: "identity",
    description: "Contract-only IPR session lookup boundary.",
    executionBoundary: "CONTRACT_ONLY_NO_DATABASE_LOOKUP"
  },
  {
    method: "GET",
    path: "/api/v1/chat",
    name: "Chat contract",
    status: "READY",
    category: "runtime",
    description: "Public governed chat contract.",
    executionBoundary: "CONTRACT_ONLY"
  },
  {
    method: "POST",
    path: "/api/v1/chat",
    name: "Governed chat bridge",
    status: "READY",
    category: "runtime",
    description: "Public v1 wrapper for the governed JOKER-C2 runtime chat.",
    executionBoundary: "V1_BOUNDARY_WRAPPER"
  },
  {
    method: "GET",
    path: "/api/v1/files",
    name: "Files contract",
    status: "READY",
    category: "files",
    description: "File intake contract with no raw persistence in this route.",
    executionBoundary: "CONTRACT_ONLY_NO_RAW_PERSISTENCE"
  },
  {
    method: "POST",
    path: "/api/v1/files",
    name: "File intake descriptor",
    status: "READY",
    category: "files",
    description: "Accepts file descriptors only; no raw multipart ingestion in this route.",
    executionBoundary: "DESCRIPTOR_RECEIPT_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/operations",
    name: "Operations contract",
    status: "READY",
    category: "operations",
    description: "Asynchronous operations contract and accepted operation types.",
    executionBoundary: "CONTRACT_ONLY"
  },
  {
    method: "POST",
    path: "/api/v1/operations",
    name: "Create operation receipt",
    status: "READY",
    category: "operations",
    description: "Contract-only operation acceptance receipt.",
    executionBoundary: "CONTRACT_RECEIPT_ONLY"
  },
  {
    method: "GET",
    path: "/api/v1/operations/{operationId}",
    name: "Lookup operation",
    status: "READY",
    category: "operations",
    description: "Contract-only operation lookup boundary.",
    executionBoundary: "CONTRACT_ONLY_NO_DATABASE_LOOKUP"
  },
  {
    method: "GET",
    path: "/api/v1/events",
    name: "EVT ledger contract",
    status: "READY",
    category: "proof",
    description: "Public EVT ledger contract boundary; no DB lookup in this route.",
    executionBoundary: "CONTRACT_ONLY_NO_DATABASE_LOOKUP"
  },
  {
    method: "GET",
    path: "/api/v1/opc/{opcId}",
    name: "OPC receipt lookup",
    status: "READY",
    category: "proof",
    description: "Public OPC technical proof receipt boundary.",
    executionBoundary: "CONTRACT_ONLY_NO_DATABASE_LOOKUP"
  },
  {
    method: "GET",
    path: "/api/v1/audit/{auditId}",
    name: "Audit receipt lookup",
    status: "READY",
    category: "observability",
    description: "Public audit receipt boundary; no raw audit log exposure.",
    executionBoundary: "CONTRACT_ONLY_NO_RAW_LOG_EXPOSURE"
  },
  {
    method: "GET",
    path: "/api/v1/model-usage/{usageId}",
    name: "Model usage receipt lookup",
    status: "READY",
    category: "observability",
    description: "Public model usage receipt boundary; no provider payload exposure.",
    executionBoundary: "CONTRACT_ONLY_NO_PROVIDER_PAYLOAD_EXPOSURE"
  },
  {
    method: "GET",
    path: "/api/v1/source-intelligence",
    name: "Source Intelligence registry",
    status: "READY",
    category: "source-intelligence",
    description: "Public v1 registry view for Source Intelligence v0.3 source sets.",
    executionBoundary: "REGISTRY_ONLY_NO_LIVE_FETCH_NO_DATABASE_LOOKUP"
  },
  {
    method: "GET",
    path: "/api/v1/demo/ipr-ai-audit-trail",
    name: "IPR AI Audit Trail Demo",
    status: "READY",
    category: "demo",
    description: "Static B2B/B2G demo playbook for IPR-governed AI audit trail.",
    executionBoundary: "STATIC_DEMO_PLAYBOOK_ONLY"
  }
] as const;

const PUBLIC_SURFACE_GROUPS = {
  discovery: ENDPOINTS.filter((endpoint) => endpoint.category === "discovery").length,
  identity: ENDPOINTS.filter((endpoint) => endpoint.category === "identity").length,
  runtime: ENDPOINTS.filter((endpoint) => endpoint.category === "runtime").length,
  files: ENDPOINTS.filter((endpoint) => endpoint.category === "files").length,
  operations: ENDPOINTS.filter((endpoint) => endpoint.category === "operations").length,
  proof: ENDPOINTS.filter((endpoint) => endpoint.category === "proof").length,
  observability: ENDPOINTS.filter((endpoint) => endpoint.category === "observability").length,
  sourceIntelligence: ENDPOINTS.filter((endpoint) => endpoint.category === "source-intelligence").length,
  diagnostics: ENDPOINTS.filter((endpoint) => endpoint.category === "diagnostics").length,
  demo: ENDPOINTS.filter((endpoint) => endpoint.category === "demo").length
} as const;

const QUICK_TESTS = [
  "curl -s https://<deployment-host>/api/v1",
  "curl -s https://<deployment-host>/api/v1/health",
  "curl -s https://<deployment-host>/api/v1/capabilities",
  "curl -s https://<deployment-host>/api/v1/openapi",
  "curl -s https://<deployment-host>/api/v1/self-test",
  "curl -s https://<deployment-host>/api/v1/source-intelligence",
  "curl -s 'https://<deployment-host>/api/v1/source-intelligence?sourceSet=ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK'",
  "curl -s https://<deployment-host>/api/v1/demo/ipr-ai-audit-trail"
] as const;

function utcNow(): string {
  return new Date().toISOString();
}

function buildDualTimeSeal(nowIso: string) {
  return {
    utc: nowIso,
    timezone: "Europe/Rome",
    display: "Torino / Italia / Europa · UTC+2",
    canonicalRuntimeBirth: "2026-01-19T15:30:00+01:00"
  } as const;
}

export async function GET(): Promise<NextResponse> {
  const nowIso = utcNow();

  return NextResponse.json(
    {
      ok: true,
      status: "HBCE_IPR_RUNTIME_API_DISCOVERY_READY",
      revision: API_REVISION,
      apiVersion: API_VERSION,
      product: PRODUCT_NAME,
      runtime: RUNTIME_NAME,
      description:
        "Public discovery endpoint for the HBCE IPR Runtime API v1: operational identity, governed AI runtime, EVT, OPC, audit, model usage, Source Intelligence, diagnostics and demo boundaries.",
      formula:
        "IPR identifies the operational subject. JOKER-C2 executes the governed AI interaction. EVT traces the event. OPC produces the technical proof receipt. MATRIX organizes the process. HBCE governs the runtime.",
      surfaceAlignment: {
        status: "SURFACE_ALIGNED",
        openapiRevision: OPENAPI_REVISION,
        sourceIntelligenceRevision: SOURCE_INTELLIGENCE_REVISION,
        includesSourceIntelligence: true,
        includesSelfTest: true,
        includesDemo: true,
        includesIprSessionLookup: true
      },
      selfPilotContext: SELF_PILOT_CONTEXT,
      layers: {
        identityLayer: "IPR_OPERATIONAL_IDENTITY",
        runtimeLayer: "AI_JOKER_C2_GOVERNED_RUNTIME",
        proofLayer: "EVT_OPC_AUDIT_USAGE",
        memoryLayer: "IPR_BOUND_MEMORY",
        sourceLayer: "SOURCE_INTELLIGENCE_v0_3",
        diagnosticsLayer: "STATIC_SELF_TEST_CONTRACT_MATRIX",
        demoLayer: "IPR_AI_AUDIT_TRAIL_DEMO",
        boundaryLayer: "LEGAL_CERTIFICATION_FALSE_TECHNICAL_RECEIPT_ONLY"
      },
      endpoints: ENDPOINTS,
      endpointCount: ENDPOINTS.length,
      endpointGroups: PUBLIC_SURFACE_GROUPS,
      openapi: {
        status: "AVAILABLE",
        path: "/api/v1/openapi",
        version: "3.1.0",
        revision: OPENAPI_REVISION
      },
      diagnostics: {
        selfTest: {
          status: "AVAILABLE",
          path: "/api/v1/self-test",
          mode: "STATIC_CONTRACT_MATRIX_ONLY"
        },
        quickTests: QUICK_TESTS
      },
      sourceIntelligence: SOURCE_INTELLIGENCE,
      demo: {
        name: "IPR AI Audit Trail Demo",
        status: "AVAILABLE",
        path: "/api/v1/demo/ipr-ai-audit-trail",
        mode: "STATIC_DEMO_PLAYBOOK_ONLY",
        sequence: [
          "Open verified IPR session",
          "Send governed request to JOKER-C2 through /api/v1/chat",
          "Apply governance check: policy, risk, scope, IPR-bound memory",
          "Route model and return governed AI answer",
          "Generate EVT",
          "Generate OPC technical proof receipt",
          "Persist audit log and model usage log in the runtime core where applicable",
          "Display dashboard with Dual-Time Seal"
        ]
      },
      boundary: BOUNDARY,
      temporalSeal: buildDualTimeSeal(nowIso),
      legalCertification: false
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Revision": API_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": "technical proof receipt only"
      }
    }
  );
}
