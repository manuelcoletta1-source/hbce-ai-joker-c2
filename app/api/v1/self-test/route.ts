import { NextResponse } from "next/server";

const API_REVISION = "HBCE-IPR-RUNTIME-API-v1-SELF_TEST_CONTRACT-v1.0" as const;
const API_VERSION = "v1" as const;
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer" as const;
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;
const SOURCE_INTELLIGENCE_REVISION = "HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY" as const;

const HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1" as const;
const RUNTIME_IPR = "IPR-AI-0001" as const;
const TENANT = "HBCE-TENANT-SELF-PILOT" as const;
const WORKSPACE = "HBCE-WORKSPACE-RND" as const;

const LEGAL_CERTIFICATION = false as const;
const OPC_BOUNDARY = "technical proof receipt only" as const;
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document" as const;

const nowIso = (): string => new Date().toISOString();

type HttpMethod = "GET" | "POST";

type EndpointTestStatus =
  | "CONTRACT_DECLARED"
  | "CONTRACT_DECLARED_DYNAMIC_ROUTE"
  | "CONTRACT_DECLARED_BRIDGE_ROUTE"
  | "CONTRACT_DECLARED_RECEIPT_ROUTE";

type EndpointTest = {
  order: number;
  method: HttpMethod;
  path: string;
  routeFile: string;
  status: EndpointTestStatus;
  expectedBoundary: {
    legalCertification: false;
    opcBoundary: typeof OPC_BOUNDARY;
    rawTextPersistence?: false;
    automaticIprMemoryWrite?: false;
    databaseLookup?: false;
    rawPromptReturned?: false;
    rawCompletionReturned?: false;
  };
  expectedSmokeSignal: string;
};

const endpointTests: EndpointTest[] = [
  {
    order: 1,
    method: "GET",
    path: "/api/v1",
    routeFile: "app/api/v1/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_API_DISCOVERY_READY"
  },
  {
    order: 2,
    method: "GET",
    path: "/api/v1/health",
    routeFile: "app/api/v1/health/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_API_READY"
  },
  {
    order: 3,
    method: "GET",
    path: "/api/v1/capabilities",
    routeFile: "app/api/v1/capabilities/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_CAPABILITIES_READY"
  },
  {
    order: 4,
    method: "GET",
    path: "/api/v1/ipr/session",
    routeFile: "app/api/v1/ipr/session/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_SESSION_CONTRACT_READY"
  },
  {
    order: 5,
    method: "POST",
    path: "/api/v1/ipr/session",
    routeFile: "app/api/v1/ipr/session/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_SESSION_READY"
  },
  {
    order: 6,
    method: "GET",
    path: "/api/v1/ipr/session/{sessionId}",
    routeFile: "app/api/v1/ipr/session/[sessionId]/route.ts",
    status: "CONTRACT_DECLARED_DYNAMIC_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_SESSION_LOOKUP_CONTRACT_READY"
  },
  {
    order: 7,
    method: "GET",
    path: "/api/v1/chat",
    routeFile: "app/api/v1/chat/route.ts",
    status: "CONTRACT_DECLARED_BRIDGE_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_CHAT_CONTRACT_READY"
  },
  {
    order: 8,
    method: "POST",
    path: "/api/v1/chat",
    routeFile: "app/api/v1/chat/route.ts",
    status: "CONTRACT_DECLARED_BRIDGE_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_CHAT_READY"
  },
  {
    order: 9,
    method: "GET",
    path: "/api/v1/files",
    routeFile: "app/api/v1/files/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_FILE_INTAKE_CONTRACT_READY"
  },
  {
    order: 10,
    method: "POST",
    path: "/api/v1/files",
    routeFile: "app/api/v1/files/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_FILE_INTAKE_CONTRACT_READY"
  },
  {
    order: 11,
    method: "GET",
    path: "/api/v1/operations",
    routeFile: "app/api/v1/operations/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_OPERATIONS_CONTRACT_READY"
  },
  {
    order: 12,
    method: "POST",
    path: "/api/v1/operations",
    routeFile: "app/api/v1/operations/route.ts",
    status: "CONTRACT_DECLARED_RECEIPT_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_OPERATION_ACCEPTED"
  },
  {
    order: 13,
    method: "GET",
    path: "/api/v1/operations/{operationId}",
    routeFile: "app/api/v1/operations/[operationId]/route.ts",
    status: "CONTRACT_DECLARED_DYNAMIC_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "OPERATION_NOT_PERSISTED_BY_THIS_ROUTE"
  },
  {
    order: 14,
    method: "GET",
    path: "/api/v1/events",
    routeFile: "app/api/v1/events/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_EVENTS_CONTRACT_READY"
  },
  {
    order: 15,
    method: "GET",
    path: "/api/v1/opc/{opcId}",
    routeFile: "app/api/v1/opc/[opcId]/route.ts",
    status: "CONTRACT_DECLARED_DYNAMIC_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "OPC_RECEIPT_CONTRACT_READY"
  },
  {
    order: 16,
    method: "GET",
    path: "/api/v1/audit/{auditId}",
    routeFile: "app/api/v1/audit/[auditId]/route.ts",
    status: "CONTRACT_DECLARED_DYNAMIC_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      rawPromptReturned: false,
      rawCompletionReturned: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "AUDIT_RECEIPT_CONTRACT_READY"
  },
  {
    order: 17,
    method: "GET",
    path: "/api/v1/model-usage/{usageId}",
    routeFile: "app/api/v1/model-usage/[usageId]/route.ts",
    status: "CONTRACT_DECLARED_DYNAMIC_ROUTE",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      rawPromptReturned: false,
      rawCompletionReturned: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "MODEL_USAGE_RECEIPT_CONTRACT_READY"
  },
  {
    order: 18,
    method: "GET",
    path: "/api/v1/openapi",
    routeFile: "app/api/v1/openapi/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_OPENAPI_READY"
  },
  {
    order: 19,
    method: "GET",
    path: "/api/v1/self-test",
    routeFile: "app/api/v1/self-test/route.ts",
    status: "CONTRACT_DECLARED",
    expectedBoundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      databaseLookup: false,
      rawTextPersistence: false,
      automaticIprMemoryWrite: false
    },
    expectedSmokeSignal: "HBCE_IPR_RUNTIME_API_SELF_TEST_READY"
  }
];

const buildCurlExamples = () => [
  "curl -s https://<domain>/api/v1 | jq",
  "curl -s https://<domain>/api/v1/health | jq",
  "curl -s https://<domain>/api/v1/capabilities | jq",
  "curl -s https://<domain>/api/v1/openapi | jq",
  "curl -s https://<domain>/api/v1/self-test | jq",
  "curl -s https://<domain>/api/v1/ipr/session/SESSION-V1-DEMO | jq",
  "curl -s https://<domain>/api/v1/operations/OP-V1-DEMO | jq",
  "curl -s https://<domain>/api/v1/opc/OPC-V1-DEMO | jq",
  "curl -s https://<domain>/api/v1/audit/AUDIT-V1-DEMO | jq",
  "curl -s https://<domain>/api/v1/model-usage/USAGE-V1-DEMO | jq"
];

type SelfTestResponse = {
  ok: true;
  status: "HBCE_IPR_RUNTIME_API_SELF_TEST_READY";
  revision: typeof API_REVISION;
  generatedAt: string;
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  runtime: typeof RUNTIME_NAME;
  runtimeContext: {
    humanIpr: typeof HUMAN_IPR;
    runtimeIpr: typeof RUNTIME_IPR;
    tenant: typeof TENANT;
    workspace: typeof WORKSPACE;
    access: "ACCESS_GRANTED";
    memory: "DATABASE_PERSISTENT";
    memoryScope: "IPR_BOUND";
    policy: "ALLOW";
  };
  sourceIntelligence: {
    status: "SOURCE_INTELLIGENCE_READY";
    revision: typeof SOURCE_INTELLIGENCE_REVISION;
    sourceSetRegistry: "SOURCESET_REGISTRY_READY";
    sourceSets: 5;
    catalogSources: 19;
    rawTextPersistence: false;
    sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY";
  };
  boundary: {
    legalCertification: false;
    opcBoundary: typeof OPC_BOUNDARY;
    iprCardBoundary: typeof IPR_CARD_BOUNDARY;
    rawTextPersistence: false;
    automaticIprMemoryWrite: false;
    noNewIprMemory: true;
    noNewSemanticMemoryPersistable: true;
    databaseLookupPerformedByThisRoute: false;
    runtimeMutationPerformedByThisRoute: false;
  };
  surface: {
    endpointCount: number;
    declaredEndpoints: EndpointTest[];
  };
  smokeTest: {
    mode: "STATIC_CONTRACT_MATRIX_ONLY";
    performsHttpFetch: false;
    performsDatabaseLookup: false;
    performsRuntimeMutation: false;
    performsMemoryWrite: false;
    expectedDeploymentResult: "NEXT_BUILD_SHOULD_PASS_AND_ENDPOINTS_SHOULD_RETURN_JSON";
    curlExamples: string[];
  };
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse<SelfTestResponse>> {
  return NextResponse.json(
    {
      ok: true,
      status: "HBCE_IPR_RUNTIME_API_SELF_TEST_READY",
      revision: API_REVISION,
      generatedAt: nowIso(),
      product: PRODUCT_NAME,
      apiVersion: API_VERSION,
      runtime: RUNTIME_NAME,
      runtimeContext: {
        humanIpr: HUMAN_IPR,
        runtimeIpr: RUNTIME_IPR,
        tenant: TENANT,
        workspace: WORKSPACE,
        access: "ACCESS_GRANTED",
        memory: "DATABASE_PERSISTENT",
        memoryScope: "IPR_BOUND",
        policy: "ALLOW"
      },
      sourceIntelligence: {
        status: "SOURCE_INTELLIGENCE_READY",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceSetRegistry: "SOURCESET_REGISTRY_READY",
        sourceSets: 5,
        catalogSources: 19,
        rawTextPersistence: false,
        sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
      },
      boundary: {
        legalCertification: LEGAL_CERTIFICATION,
        opcBoundary: OPC_BOUNDARY,
        iprCardBoundary: IPR_CARD_BOUNDARY,
        rawTextPersistence: false,
        automaticIprMemoryWrite: false,
        noNewIprMemory: true,
        noNewSemanticMemoryPersistable: true,
        databaseLookupPerformedByThisRoute: false,
        runtimeMutationPerformedByThisRoute: false
      },
      surface: {
        endpointCount: endpointTests.length,
        declaredEndpoints: endpointTests
      },
      smokeTest: {
        mode: "STATIC_CONTRACT_MATRIX_ONLY",
        performsHttpFetch: false,
        performsDatabaseLookup: false,
        performsRuntimeMutation: false,
        performsMemoryWrite: false,
        expectedDeploymentResult: "NEXT_BUILD_SHOULD_PASS_AND_ENDPOINTS_SHOULD_RETURN_JSON",
        curlExamples: buildCurlExamples()
      }
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": API_VERSION,
        "X-HBCE-API-Revision": API_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": OPC_BOUNDARY
      }
    }
  );
}
