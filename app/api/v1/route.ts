import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_REVISION = "HBCE-IPR-RUNTIME-API-v1-ROOT-DISCOVERY-v1.0";
const API_VERSION = "v1";
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

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
  iprCardBoundary:
    "IPR Card is an internal operational identity certificate, not an official public identity document.",
  rawTextPersistence: false,
  rawBinaryPersistence: false,
  automaticIprMemoryWrite: false,
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
} as const;

const SOURCE_INTELLIGENCE = {
  status: "SOURCE_INTELLIGENCE_READY",
  revision: "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY",
  sourceSetRegistry: "SOURCESET_REGISTRY_READY",
  sourceSets: 5,
  catalogSources: 19,
  sourceSetsAvailable: [
    "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK",
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE",
    "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK",
    "OPENAI_AGENTIC_SYSTEMS_SECURITY"
  ],
  rawTextPersistence: false,
  profilePersistenceMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
} as const;

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1",
    name: "Root discovery",
    status: "READY",
    description: "Public discovery endpoint for HBCE IPR Runtime API v1."
  },
  {
    method: "GET",
    path: "/api/v1/health",
    name: "Health",
    status: "READY",
    description: "Static product health and runtime boundary declaration."
  },
  {
    method: "GET",
    path: "/api/v1/capabilities",
    name: "Capabilities",
    status: "READY",
    description: "Capability catalogue for the public v1 surface."
  },
  {
    method: "GET",
    path: "/api/v1/ipr/session",
    name: "IPR session contract",
    status: "READY",
    description: "Public contract for IPR operational session creation."
  },
  {
    method: "POST",
    path: "/api/v1/ipr/session",
    name: "Create IPR session",
    status: "READY",
    description: "Contract-safe self-pilot IPR session creation."
  },
  {
    method: "GET",
    path: "/api/v1/ipr/session/{sessionId}",
    name: "Lookup IPR session",
    status: "READY",
    description: "Contract-only IPR session lookup boundary."
  },
  {
    method: "GET",
    path: "/api/v1/chat",
    name: "Chat contract",
    status: "READY",
    description: "Public governed chat contract."
  },
  {
    method: "POST",
    path: "/api/v1/chat",
    name: "Governed chat bridge",
    status: "READY",
    description: "Public v1 wrapper for the governed JOKER-C2 runtime chat."
  },
  {
    method: "GET",
    path: "/api/v1/files",
    name: "Files contract",
    status: "READY",
    description: "File intake contract with no raw persistence in this route."
  },
  {
    method: "POST",
    path: "/api/v1/files",
    name: "File intake descriptor",
    status: "READY",
    description: "Accepts file descriptors only; no raw multipart ingestion in this route."
  },
  {
    method: "GET",
    path: "/api/v1/operations",
    name: "Operations contract",
    status: "READY",
    description: "Asynchronous operations contract and accepted operation types."
  },
  {
    method: "POST",
    path: "/api/v1/operations",
    name: "Create operation receipt",
    status: "READY",
    description: "Contract-only operation acceptance receipt."
  },
  {
    method: "GET",
    path: "/api/v1/operations/{operationId}",
    name: "Lookup operation",
    status: "READY",
    description: "Contract-only operation lookup boundary."
  },
  {
    method: "GET",
    path: "/api/v1/events",
    name: "EVT ledger contract",
    status: "READY",
    description: "Public EVT ledger contract boundary; no DB lookup in this route."
  },
  {
    method: "GET",
    path: "/api/v1/opc/{opcId}",
    name: "OPC receipt lookup",
    status: "READY",
    description: "Public OPC technical proof receipt boundary."
  },
  {
    method: "GET",
    path: "/api/v1/audit/{auditId}",
    name: "Audit receipt lookup",
    status: "READY",
    description: "Public audit receipt boundary; no raw audit log exposure."
  },
  {
    method: "GET",
    path: "/api/v1/model-usage/{usageId}",
    name: "Model usage receipt lookup",
    status: "READY",
    description: "Public model usage receipt boundary; no provider payload exposure."
  },
  {
    method: "GET",
    path: "/api/v1/openapi",
    name: "OpenAPI contract",
    status: "READY",
    description: "OpenAPI 3.1 contract for the public API v1 surface."
  }
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
        "Public discovery endpoint for the HBCE IPR Runtime API v1: operational identity, governed AI runtime, EVT, OPC, audit, model usage and Source Intelligence boundaries.",
      formula:
        "IPR identifies the operational subject. JOKER-C2 executes the governed AI interaction. EVT traces the event. OPC produces the technical proof receipt. MATRIX organizes the process. HBCE governs the runtime.",
      selfPilotContext: SELF_PILOT_CONTEXT,
      layers: {
        identityLayer: "IPR_OPERATIONAL_IDENTITY",
        runtimeLayer: "AI_JOKER_C2_GOVERNED_RUNTIME",
        proofLayer: "EVT_OPC_AUDIT_USAGE",
        memoryLayer: "IPR_BOUND_MEMORY",
        sourceLayer: "SOURCE_INTELLIGENCE_v0_3",
        boundaryLayer: "LEGAL_CERTIFICATION_FALSE_TECHNICAL_RECEIPT_ONLY"
      },
      endpoints: ENDPOINTS,
      endpointCount: ENDPOINTS.length,
      openapi: {
        status: "AVAILABLE",
        path: "/api/v1/openapi",
        version: "3.1.0"
      },
      sourceIntelligence: SOURCE_INTELLIGENCE,
      demo: {
        name: "IPR AI Audit Trail Demo",
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
