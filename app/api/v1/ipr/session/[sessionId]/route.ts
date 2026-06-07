import { NextRequest, NextResponse } from "next/server";

const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-IPR_SESSION_LOOKUP-CONTRACT_ONLY-NEXT15_PARAMS";

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer";
const API_VERSION = "v1";
const RUNTIME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const HBCE_SELF_PILOT_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const HBCE_RUNTIME_IPR = "IPR-AI-0001";
const HBCE_TENANT = "HBCE-TENANT-SELF-PILOT";
const HBCE_WORKSPACE = "HBCE-WORKSPACE-RND";

const LEGAL_CERTIFICATION = false;
const OPC_BOUNDARY = "technical proof receipt only";
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document.";

type BoundarySnapshot = {
  legalCertification: false;
  opcBoundary: string;
  iprCardBoundary: string;
  rawTextPersistence: false;
  rawBinaryPersistence: false;
  automaticIprMemoryWrite: false;
  runtimeMemoryWriteSuppressed: true;
  semanticPersistenceSuppressed: true;
  noNewIprMemory: true;
  noNewSemanticMemoryPersistable: true;
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY";
  databaseReadPerformed: false;
  databaseWritePerformed: false;
};

type RuntimeContextSnapshot = {
  access: "ACCESS_GRANTED";
  humanIpr: string;
  runtimeIpr: string;
  tenant: string;
  workspace: string;
  memory: "DATABASE_PERSISTENT";
  memoryScope: "IPR_BOUND";
  policy: "ALLOW";
};

type SessionLookupResponse = {
  ok: boolean;
  status:
    | "HBCE_IPR_SESSION_LOOKUP_CONTRACT_READY"
    | "HBCE_IPR_SESSION_LOOKUP_BAD_REQUEST";
  product: string;
  apiVersion: string;
  routeRevision: string;
  runtime: string;
  method: "GET";
  endpoint: "/api/v1/ipr/session/{sessionId}";
  requestedSessionId: string | null;
  lookup: {
    lookupMode: "CONTRACT_RECEIPT_ONLY";
    persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE";
    sessionKnownByThisRoute: false;
    sessionLoadedFromDatabase: false;
    sessionValidatedAgainstDatabase: false;
    sessionMutationPerformed: false;
    failClosedOnMissingSessionId: true;
  };
  session: {
    sessionId: string | null;
    sessionStatus:
      | "SESSION_LOOKUP_CONTRACT_ONLY"
      | "SESSION_ID_REQUIRED";
    access: "ACCESS_GRANTED" | "ACCESS_NOT_EVALUATED";
    identityBinding:
      | "IPR_OPERATIONAL_IDENTITY_BOUND"
      | "NOT_EVALUATED_BY_THIS_ROUTE";
    ttlSeconds: number | null;
    ttlEvaluatedByThisRoute: false;
    expiredEvaluatedByThisRoute: false;
    createdAtLoaded: false;
    expiresAtLoaded: false;
  };
  runtimeContext: RuntimeContextSnapshot;
  boundary: BoundarySnapshot;
  publicContract: {
    request: {
      method: "GET";
      path: "/api/v1/ipr/session/{sessionId}";
      pathParams: {
        sessionId: "string";
      };
    };
    response: {
      status: string;
      sessionStatus: string;
      legalCertification: false;
      opcBoundary: string;
    };
    notes: string[];
  };
  nextRecommendedCalls: string[];
  generatedAt: string;
};

function utcNow(): string {
  return new Date().toISOString();
}

function normalizeSessionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 160);
}

function buildBoundary(): BoundarySnapshot {
  return {
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY,
    iprCardBoundary: IPR_CARD_BOUNDARY,
    rawTextPersistence: false,
    rawBinaryPersistence: false,
    automaticIprMemoryWrite: false,
    runtimeMemoryWriteSuppressed: true,
    semanticPersistenceSuppressed: true,
    noNewIprMemory: true,
    noNewSemanticMemoryPersistable: true,
    sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
    databaseReadPerformed: false,
    databaseWritePerformed: false
  };
}

function buildRuntimeContext(): RuntimeContextSnapshot {
  return {
    access: "ACCESS_GRANTED",
    humanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
    runtimeIpr: HBCE_RUNTIME_IPR,
    tenant: HBCE_TENANT,
    workspace: HBCE_WORKSPACE,
    memory: "DATABASE_PERSISTENT",
    memoryScope: "IPR_BOUND",
    policy: "ALLOW"
  };
}

function buildResponse(sessionId: string | null): SessionLookupResponse {
  const hasSessionId = Boolean(sessionId);

  return {
    ok: hasSessionId,
    status: hasSessionId
      ? "HBCE_IPR_SESSION_LOOKUP_CONTRACT_READY"
      : "HBCE_IPR_SESSION_LOOKUP_BAD_REQUEST",
    product: PRODUCT,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    runtime: RUNTIME,
    method: "GET",
    endpoint: "/api/v1/ipr/session/{sessionId}",
    requestedSessionId: sessionId,
    lookup: {
      lookupMode: "CONTRACT_RECEIPT_ONLY",
      persistenceMode: "NO_DATABASE_LOOKUP_IN_THIS_ROUTE",
      sessionKnownByThisRoute: false,
      sessionLoadedFromDatabase: false,
      sessionValidatedAgainstDatabase: false,
      sessionMutationPerformed: false,
      failClosedOnMissingSessionId: true
    },
    session: {
      sessionId,
      sessionStatus: hasSessionId
        ? "SESSION_LOOKUP_CONTRACT_ONLY"
        : "SESSION_ID_REQUIRED",
      access: hasSessionId ? "ACCESS_GRANTED" : "ACCESS_NOT_EVALUATED",
      identityBinding: hasSessionId
        ? "IPR_OPERATIONAL_IDENTITY_BOUND"
        : "NOT_EVALUATED_BY_THIS_ROUTE",
      ttlSeconds: hasSessionId ? 900 : null,
      ttlEvaluatedByThisRoute: false,
      expiredEvaluatedByThisRoute: false,
      createdAtLoaded: false,
      expiresAtLoaded: false
    },
    runtimeContext: buildRuntimeContext(),
    boundary: buildBoundary(),
    publicContract: {
      request: {
        method: "GET",
        path: "/api/v1/ipr/session/{sessionId}",
        pathParams: {
          sessionId: "string"
        }
      },
      response: {
        status: hasSessionId
          ? "HBCE_IPR_SESSION_LOOKUP_CONTRACT_READY"
          : "HBCE_IPR_SESSION_LOOKUP_BAD_REQUEST",
        sessionStatus: hasSessionId
          ? "SESSION_LOOKUP_CONTRACT_ONLY"
          : "SESSION_ID_REQUIRED",
        legalCertification: false,
        opcBoundary: OPC_BOUNDARY
      },
      notes: [
        "This endpoint is a public v1 contract lookup boundary.",
        "It does not perform database lookup in this route.",
        "It does not mutate session, memory, EVT, OPC, audit or model usage records.",
        "Runtime execution is delegated to /api/v1/chat and /api/v1/operations."
      ]
    },
    nextRecommendedCalls: [
      "/api/v1/chat",
      "/api/v1/operations",
      "/api/v1/capabilities",
      "/api/v1/openapi"
    ],
    generatedAt: utcNow()
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId?: string }> }
): Promise<NextResponse<SessionLookupResponse>> {
  const resolvedParams = await params;
  const sessionId = normalizeSessionId(resolvedParams?.sessionId);
  const body = buildResponse(sessionId);

  return NextResponse.json(body, {
    status: sessionId ? 200 : 400,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}
