import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const HBCE_IPR_RUNTIME_API_VERSION = "v1";
const HBCE_IPR_RUNTIME_PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const HBCE_IPR_RUNTIME_ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-OPERATIONS-LOOKUP-CONTRACT-v0.1";

const HBCE_RUNTIME = {
  runtime: "AI_JOKER_C2_SAAS_CORE_v0_1",
  runtimeIpr: "IPR-AI-0001",
  humanIpr: "IPR-88505FE91013DCFE97C56ED1",
  tenant: "HBCE-TENANT-SELF-PILOT",
  workspace: "HBCE-WORKSPACE-RND",
  access: "AUTHORIZATION_NOT_EVALUATED",
  policy: "NOT_EVALUATED",
  memory: "RUNTIME_ONLY",
  memoryScope: "RUNTIME_ONLY"
} as const;

const HBCE_BOUNDARY = {
  legalCertification: false,
  opcBoundary: "technical proof receipt only",
  iprCardBoundary:
    "IPR Card is an internal operational identity certificate, not an official public identity document.",
  rawTextPersistence: false,
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
  automaticIprMemoryWrite: false,
  runtimeMemoryWriteSuppressed: true,
  semanticPersistenceSuppressed: true,
  noNewIprMemory: true,
  noNewSemanticMemoryPersistable: true
} as const;

type OperationLookupRouteContext = {
  params: Promise<{
    operationId: string;
  }>;
};

type OperationLookupStatus =
  | "OPERATION_LOOKUP_CONTRACT_READY"
  | "OPERATION_ID_ACCEPTED_FORMAT"
  | "OPERATION_ID_INVALID"
  | "OPERATION_NOT_PERSISTED_BY_THIS_ROUTE";

type OperationLookupResponse = {
  ok: boolean;
  status: OperationLookupStatus;
  product: string;
  apiVersion: string;
  routeRevision: string;
  endpoint: string;
  method: "GET";
  operationId: string | null;
  operationLookup: {
    lookupMode: "CONTRACT_RECEIPT_ONLY";
    persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE";
    operationKnownByThisRoute: false;
    operationStatus: "UNKNOWN_OR_EXTERNAL" | "INVALID_OPERATION_ID";
    executionStatus: "NOT_EXECUTED_BY_THIS_ROUTE";
    pollingReady: true;
    webhookReady: false;
    expectedProducerEndpoint: "/api/v1/operations";
    expectedRuntimeExecutionEndpoints: string[];
  };
  identifiers: typeof HBCE_RUNTIME;
  technicalReceipt: {
    lookupReference: string;
    lookupEvt: null;
    lookupOpc: null;
    evtCreated: false;
    opcCreated: false;
    receiptScope: "CONTRACT_RESPONSE_RECEIPT_ONLY";
    lookupHash: string;
    lookupHashMode: "SHA256_ON_OPERATION_LOOKUP_PAYLOAD";
    createdAt: string;
    temporalSeal: {
      timezone: "Europe/Rome";
      label: "Torino / Italia / Europa · UTC+2";
      generatedAtUtc: string;
    };
  } | null;
  publicContract: {
    canonicalPath: "/api/v1/operations/[operationId]";
    recommendedPublicPath: "/v1/operations/{operationId}";
    description: string;
    usage: string[];
    responseSemantics: string[];
  };
  relatedEndpoints: {
    createOperation: "/api/v1/operations";
    chat: "/api/v1/chat";
    health: "/api/v1/health";
    capabilities: "/api/v1/capabilities";
  };
  boundary: typeof HBCE_BOUNDARY;
  failReason: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeOperationId(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) {
    return null;
  }

  if (!/^[A-Za-z0-9:_\-.]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function shortHash(input: string, length = 16): string {
  return createHash("sha256").update(input).digest("hex").slice(0, length).toUpperCase();
}

function buildLookupReceipt(operationId: string) {
  const createdAt = nowIso();
  const lookupPayload = JSON.stringify({
    product: HBCE_IPR_RUNTIME_PRODUCT,
    apiVersion: HBCE_IPR_RUNTIME_API_VERSION,
    routeRevision: HBCE_IPR_RUNTIME_ROUTE_REVISION,
    operationId,
    createdAt,
    boundary: HBCE_BOUNDARY
  });
  const lookupHash = `sha256:${createHash("sha256").update(lookupPayload).digest("hex")}`;
  const suffix = shortHash(`${operationId}:${createdAt}:${lookupHash}`);

  return {
    lookupReference: `REF-V1-OPERATION-LOOKUP-${suffix}`,
    lookupEvt: null,
    lookupOpc: null,
    evtCreated: false as const,
    opcCreated: false as const,
    receiptScope: "CONTRACT_RESPONSE_RECEIPT_ONLY" as const,
    lookupHash,
    lookupHashMode: "SHA256_ON_OPERATION_LOOKUP_PAYLOAD" as const,
    createdAt,
    temporalSeal: {
      timezone: "Europe/Rome" as const,
      label: "Torino / Italia / Europa · UTC+2" as const,
      generatedAtUtc: createdAt
    }
  };
}

function buildOperationLookupResponse(
  operationId: string | null,
  status: OperationLookupStatus,
  failReason: string | null
): OperationLookupResponse {
  const validOperationId = operationId !== null;

  return {
    ok: validOperationId,
    status,
    product: HBCE_IPR_RUNTIME_PRODUCT,
    apiVersion: HBCE_IPR_RUNTIME_API_VERSION,
    routeRevision: HBCE_IPR_RUNTIME_ROUTE_REVISION,
    endpoint: "/api/v1/operations/[operationId]",
    method: "GET",
    operationId,
    operationLookup: {
      lookupMode: "CONTRACT_RECEIPT_ONLY",
      persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE",
      operationKnownByThisRoute: false,
      operationStatus: validOperationId ? "UNKNOWN_OR_EXTERNAL" : "INVALID_OPERATION_ID",
      executionStatus: "NOT_EXECUTED_BY_THIS_ROUTE",
      pollingReady: true,
      webhookReady: false,
      expectedProducerEndpoint: "/api/v1/operations",
      expectedRuntimeExecutionEndpoints: [
        "/api/v1/chat",
        "/api/chat",
        "/api/sources/summarize"
      ]
    },
    identifiers: HBCE_RUNTIME,
    technicalReceipt: validOperationId ? buildLookupReceipt(operationId) : null,
    publicContract: {
      canonicalPath: "/api/v1/operations/[operationId]",
      recommendedPublicPath: "/v1/operations/{operationId}",
      description:
        "Lookup endpoint for HBCE IPR Runtime API v1 operation receipts. This route exposes contract-level polling semantics and does not perform database persistence or long-running workflow execution.",
      usage: [
        "Poll an operationId returned by POST /api/v1/operations.",
        "Expose a stable B2B/B2G API surface before enabling persistent operation records.",
        "Preserve the boundary that this contract lookup creates no EVT or OPC proof receipt."
      ],
      responseSemantics: [
        "A valid operationId format returns a lookup receipt, not a legal certification.",
        "operationKnownByThisRoute=false means this route does not query a persistent operation database yet.",
        "Runtime execution must be delegated to governed endpoints, not inferred from this lookup route."
      ]
    },
    relatedEndpoints: {
      createOperation: "/api/v1/operations",
      chat: "/api/v1/chat",
      health: "/api/v1/health",
      capabilities: "/api/v1/capabilities"
    },
    boundary: HBCE_BOUNDARY,
    failReason
  };
}

export async function GET(
  request: NextRequest,
  context: OperationLookupRouteContext
): Promise<NextResponse<OperationLookupResponse>> {
  void request;

  const params = await context.params;
  const operationId = normalizeOperationId(params.operationId);

  if (!operationId) {
    return NextResponse.json(
      buildOperationLookupResponse(null, "OPERATION_ID_INVALID", "INVALID_OPERATION_ID"),
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "X-HBCE-API-Version": HBCE_IPR_RUNTIME_API_VERSION,
          "X-HBCE-Route-Revision": HBCE_IPR_RUNTIME_ROUTE_REVISION,
          "X-HBCE-Legal-Certification": "false",
          "X-HBCE-OPC-Boundary": "technical-proof-receipt-only"
        }
      }
    );
  }

  return NextResponse.json(
    buildOperationLookupResponse(
      operationId,
      "OPERATION_NOT_PERSISTED_BY_THIS_ROUTE",
      null
    ),
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": HBCE_IPR_RUNTIME_API_VERSION,
        "X-HBCE-Route-Revision": HBCE_IPR_RUNTIME_ROUTE_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": "technical-proof-receipt-only"
      }
    }
  );
}
