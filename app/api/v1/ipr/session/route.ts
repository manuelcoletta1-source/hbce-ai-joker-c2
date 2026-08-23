import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const API_VERSION = "v1" as const;
const ROUTE_REVISION = "HBCE-IPR-RUNTIME-API-v1-IPR_SESSION_CONTRACT-v0.1" as const;
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer" as const;
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const HBCE_SELF_PILOT_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1" as const;
const HBCE_SELF_PILOT_RUNTIME_IPR = "IPR-AI-0001" as const;
const HBCE_SELF_PILOT_TENANT_ID = "HBCE-TENANT-SELF-PILOT" as const;
const HBCE_SELF_PILOT_WORKSPACE_ID = "HBCE-WORKSPACE-RND" as const;

const LEGAL_CERTIFICATION = false as const;
const OPC_BOUNDARY = "technical proof receipt only" as const;
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document" as const;

const SESSION_TTL_SECONDS = 15 * 60;
const MAX_SESSION_NOTE_LENGTH = 1200;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IprSessionRequestBody = {
  humanIpr?: unknown;
  runtimeIpr?: unknown;
  tenant?: unknown;
  workspace?: unknown;
  sessionIntent?: unknown;
  constraints?: unknown;
  idempotencyKey?: unknown;
};

type PublicConstraintSnapshot = {
  policy: "ALLOW" | "FAIL_CLOSED";
  memory: "IPR_BOUND";
  persistenceMode: "SESSION_RECEIPT_ONLY_NO_DATABASE_WRITE";
  sourceIntelligenceRawTextPersistence: false;
  automaticIprMemoryWrite: false;
  legalCertification: false;
  opcBoundary: typeof OPC_BOUNDARY;
  iprCardBoundary: typeof IPR_CARD_BOUNDARY;
};

type SessionHealthPayload = {
  ok: true;
  status: "HBCE_IPR_SESSION_ENDPOINT_READY";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;
  endpoint: "/api/v1/ipr/session";
  publicContract: {
    method: "POST";
    purpose: "Open a governed IPR operational session for HBCE IPR Runtime API v1";
    minimumInput: string[];
    responseIncludes: string[];
    persistence: "No database session persistence in this contract endpoint";
  };
  runtimeContext: {
    runtime: typeof RUNTIME_NAME;
    expectedHumanIpr: typeof HBCE_SELF_PILOT_HUMAN_IPR;
    runtimeIpr: typeof HBCE_SELF_PILOT_RUNTIME_IPR;
    tenant: typeof HBCE_SELF_PILOT_TENANT_ID;
    workspace: typeof HBCE_SELF_PILOT_WORKSPACE_ID;
    access: "CONTRACT_READY";
  };
  boundary: PublicConstraintSnapshot;
  generatedAt: string;
};

type SessionReadyPayload = {
  ok: true;
  status: "HBCE_IPR_SESSION_CONTRACT_CREATED";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;
  session: {
    sessionId: string;
    sessionStatus: "AUTHORIZATION_NOT_EVALUATED";
    identityBinding: "UNVERIFIED_CLIENT_CLAIM";
    humanIpr: string;
    runtimeIpr: string;
    tenant: string;
    workspace: string;
    sessionIntent: string;
    createdAt: string;
    expiresAt: string;
    ttlSeconds: number;
    idempotencyKey: string | null;
    sessionHash: string;
  };
  runtimeContext: {
    runtime: typeof RUNTIME_NAME;
    memory: "RUNTIME_ONLY";
    memoryScope: "RUNTIME_ONLY";
    policy: "NOT_EVALUATED";
    modelRouting: "NOT_AUTHORIZED_BY_THIS_ROUTE";
    sourceIntelligence: "SOURCE_INTELLIGENCE_v0_3_AVAILABLE";
  };
  next: {
    chatEndpoint: "/api/v1/chat";
    operationsEndpoint: "/api/v1/operations";
    sessionLookupEndpointPlanned: "/api/v1/ipr/session/{sessionId}";
  };
  temporalSeal: {
    timezone: "Europe/Rome";
    locale: "Torino / Italia / Europa · UTC+2";
    utcCreatedAt: string;
    note: "Dual-Time Seal is represented by UTC timestamp plus declared Europe/Rome operational locale.";
  };
  policy: PublicConstraintSnapshot;
  trace: {
    evtCreated: false;
    opcCreated: false;
    auditCreated: false;
    usageCreated: false;
    reason: "Session contract endpoint only. EVT/OPC/audit/usage are produced by governed runtime operations such as /api/v1/chat.";
  };
  boundary: {
    legalCertification: false;
    opc: typeof OPC_BOUNDARY;
    iprCard: typeof IPR_CARD_BOUNDARY;
  };
};

type SessionFailPayload = {
  ok: false;
  status: "HBCE_IPR_SESSION_FAIL";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;
  failReason:
    | "INVALID_JSON_BODY"
    | "MISSING_HUMAN_IPR"
    | "INVALID_HUMAN_IPR"
    | "INVALID_RUNTIME_IPR"
    | "INVALID_TENANT"
    | "INVALID_WORKSPACE";
  message: string;
  expected?: Record<string, string>;
  boundary: {
    legalCertification: false;
    opc: typeof OPC_BOUNDARY;
    iprCard: typeof IPR_CARD_BOUNDARY;
  };
};

function jsonResponse<TPayload>(payload: TPayload, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-HBCE-Product": PRODUCT_NAME,
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY,
      ...(init?.headers ?? {})
    }
  });
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSessionIntent(value: unknown): string {
  const raw = toStringOrNull(value);
  if (!raw) return "HBCE IPR Runtime API v1 governed operational session";
  return raw.slice(0, MAX_SESSION_NOTE_LENGTH);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function buildConstraintSnapshot(policy: "ALLOW" | "FAIL_CLOSED"): PublicConstraintSnapshot {
  return {
    policy,
    memory: "IPR_BOUND",
    persistenceMode: "SESSION_RECEIPT_ONLY_NO_DATABASE_WRITE",
    sourceIntelligenceRawTextPersistence: false,
    automaticIprMemoryWrite: false,
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY,
    iprCardBoundary: IPR_CARD_BOUNDARY
  };
}

function buildFail(
  failReason: SessionFailPayload["failReason"],
  message: string,
  status: number,
  expected?: Record<string, string>
) {
  const payload: SessionFailPayload = {
    ok: false,
    status: "HBCE_IPR_SESSION_FAIL",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    failReason,
    message,
    ...(expected ? { expected } : {}),
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opc: OPC_BOUNDARY,
      iprCard: IPR_CARD_BOUNDARY
    }
  };

  return jsonResponse(payload, { status });
}

async function readJsonBody(request: NextRequest): Promise<IprSessionRequestBody | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return {};
    return body as IprSessionRequestBody;
  } catch {
    return null;
  }
}

export async function GET() {
  const payload: SessionHealthPayload = {
    ok: true,
    status: "HBCE_IPR_SESSION_ENDPOINT_READY",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    endpoint: "/api/v1/ipr/session",
    publicContract: {
      method: "POST",
      purpose: "Open a governed IPR operational session for HBCE IPR Runtime API v1",
      minimumInput: ["humanIpr"],
      responseIncludes: [
        "sessionId",
        "sessionStatus",
        "identityBinding",
        "humanIpr",
        "runtimeIpr",
        "tenant",
        "workspace",
        "temporalSeal",
        "policy",
        "boundary"
      ],
      persistence: "No database session persistence in this contract endpoint"
    },
    runtimeContext: {
      runtime: RUNTIME_NAME,
      expectedHumanIpr: HBCE_SELF_PILOT_HUMAN_IPR,
      runtimeIpr: HBCE_SELF_PILOT_RUNTIME_IPR,
      tenant: HBCE_SELF_PILOT_TENANT_ID,
      workspace: HBCE_SELF_PILOT_WORKSPACE_ID,
      access: "CONTRACT_READY"
    },
    boundary: buildConstraintSnapshot("ALLOW"),
    generatedAt: new Date().toISOString()
  };

  return jsonResponse(payload);
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  if (body === null) {
    return buildFail("INVALID_JSON_BODY", "Request body must be valid JSON.", 400);
  }

  const humanIpr = toStringOrNull(body.humanIpr);
  const runtimeIpr = toStringOrNull(body.runtimeIpr) ?? HBCE_SELF_PILOT_RUNTIME_IPR;
  const tenant = toStringOrNull(body.tenant) ?? HBCE_SELF_PILOT_TENANT_ID;
  const workspace = toStringOrNull(body.workspace) ?? HBCE_SELF_PILOT_WORKSPACE_ID;
  const idempotencyKey = toStringOrNull(body.idempotencyKey);
  const sessionIntent = normalizeSessionIntent(body.sessionIntent);

  if (!humanIpr) {
    return buildFail("MISSING_HUMAN_IPR", "humanIpr is required to open an IPR-bound operational session.", 400, {
      humanIpr: HBCE_SELF_PILOT_HUMAN_IPR
    });
  }

  if (humanIpr !== HBCE_SELF_PILOT_HUMAN_IPR) {
    return buildFail("INVALID_HUMAN_IPR", "The supplied humanIpr is outside the active self-pilot IPR scope.", 403, {
      humanIpr: HBCE_SELF_PILOT_HUMAN_IPR
    });
  }

  if (runtimeIpr !== HBCE_SELF_PILOT_RUNTIME_IPR) {
    return buildFail("INVALID_RUNTIME_IPR", "The supplied runtimeIpr is outside the active JOKER-C2 runtime scope.", 403, {
      runtimeIpr: HBCE_SELF_PILOT_RUNTIME_IPR
    });
  }

  if (tenant !== HBCE_SELF_PILOT_TENANT_ID) {
    return buildFail("INVALID_TENANT", "The supplied tenant is outside the active HBCE self-pilot tenant scope.", 403, {
      tenant: HBCE_SELF_PILOT_TENANT_ID
    });
  }

  if (workspace !== HBCE_SELF_PILOT_WORKSPACE_ID) {
    return buildFail("INVALID_WORKSPACE", "The supplied workspace is outside the active HBCE R&D workspace scope.", 403, {
      workspace: HBCE_SELF_PILOT_WORKSPACE_ID
    });
  }

  const now = new Date();
  const expiresAt = addSeconds(now, SESSION_TTL_SECONDS);
  const sessionId = `IPR-SESSION-${now
    .toISOString()
    .replace(/[-:.TZ]/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const sessionHash = sha256(
    JSON.stringify({
      apiVersion: API_VERSION,
      routeRevision: ROUTE_REVISION,
      sessionId,
      humanIpr,
      runtimeIpr,
      tenant,
      workspace,
      sessionIntent,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      idempotencyKey
    })
  );

  const payload: SessionReadyPayload = {
    ok: true,
    status: "HBCE_IPR_SESSION_CONTRACT_CREATED",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    session: {
      sessionId,
      sessionStatus: "AUTHORIZATION_NOT_EVALUATED",
      identityBinding: "UNVERIFIED_CLIENT_CLAIM",
      humanIpr,
      runtimeIpr,
      tenant,
      workspace,
      sessionIntent,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: SESSION_TTL_SECONDS,
      idempotencyKey,
      sessionHash
    },
    runtimeContext: {
      runtime: RUNTIME_NAME,
      memory: "RUNTIME_ONLY",
      memoryScope: "RUNTIME_ONLY",
      policy: "NOT_EVALUATED",
      modelRouting: "NOT_AUTHORIZED_BY_THIS_ROUTE",
      sourceIntelligence: "SOURCE_INTELLIGENCE_v0_3_AVAILABLE"
    },
    next: {
      chatEndpoint: "/api/v1/chat",
      operationsEndpoint: "/api/v1/operations",
      sessionLookupEndpointPlanned: "/api/v1/ipr/session/{sessionId}"
    },
    temporalSeal: {
      timezone: "Europe/Rome",
      locale: "Torino / Italia / Europa · UTC+2",
      utcCreatedAt: now.toISOString(),
      note: "Dual-Time Seal is represented by UTC timestamp plus declared Europe/Rome operational locale."
    },
    policy: buildConstraintSnapshot("FAIL_CLOSED"),
    trace: {
      evtCreated: false,
      opcCreated: false,
      auditCreated: false,
      usageCreated: false,
      reason: "Session contract endpoint only. EVT/OPC/audit/usage are produced by governed runtime operations such as /api/v1/chat."
    },
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opc: OPC_BOUNDARY,
      iprCard: IPR_CARD_BOUNDARY
    }
  };

  return jsonResponse(payload, { status: 201 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}
