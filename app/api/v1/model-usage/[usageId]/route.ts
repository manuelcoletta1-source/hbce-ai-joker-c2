import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_VERSION = "v1";
const ROUTE_REVISION = "HBCE-IPR-RUNTIME-API-v1-OPC_LOOKUP_CONTRACT-v1.0";
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer";
const PRODUCT_FAMILY = "HBCE_IPR_RUNTIME_API";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";
const HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const RUNTIME_IPR = "IPR-AI-0001";
const TENANT = "HBCE-TENANT-SELF-PILOT";
const WORKSPACE = "HBCE-WORKSPACE-RND";
const LEGAL_CERTIFICATION = false;
const OPC_BOUNDARY = "technical proof receipt only";
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document.";

type RouteParams = {
  params: Promise<{
    opcId?: string;
  }>;
};

type BoundarySnapshot = {
  legalCertification: false;
  opcBoundary: string;
  iprCardBoundary: string;
  rawTextPersistence: false;
  automaticIprMemoryWrite: false;
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY";
  runtimeMemoryWriteSuppressed: true;
  semanticPersistenceSuppressed: true;
  noNewIprMemory: true;
  noNewSemanticMemoryPersistable: true;
  databaseReadPerformed: false;
  databaseWritePerformed: false;
  externalCertificationPerformed: false;
};

type OpcContractReceipt = {
  id: string;
  normalizedOpcId: string;
  requestedAt: string;
  routeRevision: string;
  apiVersion: string;
  product: string;
  productFamily: string;
  runtime: string;
  status: "OPC_RECEIPT_CONTRACT_READY" | "OPC_ID_INVALID";
  lookupMode: "CONTRACT_RECEIPT_ONLY";
  persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE";
  opcKnownByThisRoute: false;
  opcLoadedFromDatabase: false;
  proofMaterialLoaded: false;
  chainHashLoaded: false;
  legalCertification: false;
  opcBoundary: string;
  technicalReceiptHash: string;
  links: {
    self: string;
    apiHealth: string;
    apiCapabilities: string;
    eventLedger: string;
    operations: string;
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeIdentifier(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 160);
}

function isValidOpcId(value: string): boolean {
  if (!value) {
    return false;
  }

  return /^[A-Za-z0-9:_./-]{3,160}$/.test(value);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function buildBoundarySnapshot(): BoundarySnapshot {
  return {
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY,
    iprCardBoundary: IPR_CARD_BOUNDARY,
    rawTextPersistence: false,
    automaticIprMemoryWrite: false,
    sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
    runtimeMemoryWriteSuppressed: true,
    semanticPersistenceSuppressed: true,
    noNewIprMemory: true,
    noNewSemanticMemoryPersistable: true,
    databaseReadPerformed: false,
    databaseWritePerformed: false,
    externalCertificationPerformed: false
  };
}

function buildReceiptHash(input: {
  opcId: string;
  requestedAt: string;
  status: string;
}): string {
  return sha256(
    JSON.stringify({
      routeRevision: ROUTE_REVISION,
      apiVersion: API_VERSION,
      product: PRODUCT_NAME,
      runtime: RUNTIME_NAME,
      opcId: input.opcId,
      status: input.status,
      requestedAt: input.requestedAt,
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE"
    })
  );
}

function buildOpcReceipt(opcId: string, requestUrl: URL): OpcContractReceipt {
  const requestedAt = nowIso();
  const valid = isValidOpcId(opcId);
  const status: OpcContractReceipt["status"] = valid
    ? "OPC_RECEIPT_CONTRACT_READY"
    : "OPC_ID_INVALID";

  return {
    id: `OPC-V1-LOOKUP-${createHash("sha256").update(`${opcId}:${requestedAt}`).digest("hex").slice(0, 12).toUpperCase()}`,
    normalizedOpcId: opcId,
    requestedAt,
    routeRevision: ROUTE_REVISION,
    apiVersion: API_VERSION,
    product: PRODUCT_NAME,
    productFamily: PRODUCT_FAMILY,
    runtime: RUNTIME_NAME,
    status,
    lookupMode: "CONTRACT_RECEIPT_ONLY",
    persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE",
    opcKnownByThisRoute: false,
    opcLoadedFromDatabase: false,
    proofMaterialLoaded: false,
    chainHashLoaded: false,
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY,
    technicalReceiptHash: buildReceiptHash({ opcId, requestedAt, status }),
    links: {
      self: requestUrl.pathname,
      apiHealth: "/api/v1/health",
      apiCapabilities: "/api/v1/capabilities",
      eventLedger: "/api/v1/events",
      operations: "/api/v1/operations"
    }
  };
}

function buildContract(requestUrl: URL) {
  return {
    status: "HBCE_IPR_RUNTIME_OPC_LOOKUP_CONTRACT_READY",
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    product: PRODUCT_NAME,
    productFamily: PRODUCT_FAMILY,
    runtime: RUNTIME_NAME,
    method: "GET",
    endpoint: "/api/v1/opc/{opcId}",
    receivedPath: requestUrl.pathname,
    purpose:
      "Public v1 lookup contract for OPC technical proof receipts produced by governed HBCE/JOKER-C2 runtime operations.",
    input: {
      pathParams: {
        opcId: {
          type: "string",
          required: true,
          example: "OPC-20260607183000-ABCDEF12",
          validation: "3-160 characters; A-Z, a-z, 0-9, colon, underscore, dot, slash, hyphen"
        }
      }
    },
    output: {
      receiptStatus: ["OPC_RECEIPT_CONTRACT_READY", "OPC_ID_INVALID"],
      includes: [
        "normalizedOpcId",
        "lookupMode",
        "persistenceMode",
        "technicalReceiptHash",
        "boundary",
        "runtimeContext",
        "links"
      ]
    },
    runtimeContext: {
      humanIpr: HUMAN_IPR,
      runtimeIpr: RUNTIME_IPR,
      tenant: TENANT,
      workspace: WORKSPACE,
      access: "ACCESS_GRANTED",
      policy: "ALLOW"
    },
    boundary: buildBoundarySnapshot(),
    integrationNotes: [
      "This route does not certify the OPC receipt legally.",
      "This route does not read the OPC proof database.",
      "Database-backed proof retrieval can be added later behind the same public v1 contract.",
      "OPC remains a technical proof receipt only unless an external legal certification process is explicitly integrated."
    ]
  };
}

export async function GET(request: NextRequest, context: RouteParams) {
  const requestUrl = new URL(request.url);
  const params = await context.params;
  const opcId = normalizeIdentifier(params.opcId);
  const receipt = buildOpcReceipt(opcId, requestUrl);
  const valid = receipt.status === "OPC_RECEIPT_CONTRACT_READY";

  return NextResponse.json(
    {
      ok: valid,
      status: receipt.status,
      contractStatus: "HBCE_IPR_RUNTIME_OPC_LOOKUP_CONTRACT_READY",
      apiVersion: API_VERSION,
      routeRevision: ROUTE_REVISION,
      product: PRODUCT_NAME,
      productFamily: PRODUCT_FAMILY,
      runtime: RUNTIME_NAME,
      opc: receipt,
      runtimeContext: {
        humanIpr: HUMAN_IPR,
        runtimeIpr: RUNTIME_IPR,
        tenant: TENANT,
        workspace: WORKSPACE,
        access: "ACCESS_GRANTED",
        policy: "ALLOW"
      },
      boundary: buildBoundarySnapshot(),
      contract: buildContract(requestUrl)
    },
    {
      status: valid ? 200 : 400,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": API_VERSION,
        "X-HBCE-Route-Revision": ROUTE_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": OPC_BOUNDARY
      }
    }
  );
}
