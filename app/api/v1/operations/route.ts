import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_REVISION = "HBCE-IPR-RUNTIME-API-v1-OPERATIONS-CONTRACT-v0.1";
const API_VERSION = "v1";
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const DEFAULT_HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1";
const DEFAULT_RUNTIME_IPR = "IPR-AI-0001";
const DEFAULT_TENANT = "HBCE-TENANT-SELF-PILOT";
const DEFAULT_WORKSPACE = "HBCE-WORKSPACE-RND";

const LEGAL_CERTIFICATION = false;
const OPC_BOUNDARY = "technical proof receipt only";
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document.";

const SUPPORTED_OPERATION_TYPES = [
  "IPR_AI_AUDIT_TRAIL_DEMO",
  "DOCUMENT_AUDIT",
  "SOURCE_INTELLIGENCE_SUMMARY",
  "SOURCE_INTELLIGENCE_PROFILE_CANDIDATE",
  "EVT_OPC_PROOF_PIPELINE",
  "GOVERNED_RUNTIME_ASSESSMENT",
  "B2G_RISK_INTELLIGENCE_BRIEF"
] as const;

type SupportedOperationType = (typeof SUPPORTED_OPERATION_TYPES)[number];

type OperationRequestBody = {
  operationType?: string;
  subjectIpr?: string;
  humanIpr?: string;
  runtimeIpr?: string;
  tenant?: string;
  workspace?: string;
  sessionId?: string;
  payload?: unknown;
  constraints?: Record<string, unknown>;
  idempotencyKey?: string;
  callbackUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
};

type NormalizedOperationRequest = {
  operationType: string;
  subjectIpr: string;
  humanIpr: string;
  runtimeIpr: string;
  tenant: string;
  workspace: string;
  sessionId: string | null;
  payload: unknown;
  constraints: Record<string, unknown>;
  idempotencyKey: string | null;
  callbackUrl: string | null;
  webhookUrl: string | null;
  metadata: Record<string, unknown>;
};

function isoNow(): string {
  return new Date().toISOString();
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function shortHash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16).toUpperCase();
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, Object.keys(value as Record<string, unknown>).sort());
  } catch {
    try {
      return JSON.stringify(value ?? null);
    } catch {
      return String(value);
    }
  }
}

function stableJson(value: unknown): string {
  const seen = new WeakSet<object>();

  const normalize = (input: unknown): unknown => {
    if (input === null || typeof input !== "object") return input;
    if (seen.has(input as object)) return "[Circular]";
    seen.add(input as object);

    if (Array.isArray(input)) return input.map(normalize);

    const source = input as Record<string, unknown>;
    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize(source[key]);
        return acc;
      }, {});
  };

  return JSON.stringify(normalize(value));
}

function isSupportedOperationType(value: string): value is SupportedOperationType {
  return (SUPPORTED_OPERATION_TYPES as readonly string[]).includes(value);
}

function isAllowedCallbackUrl(value: string | null): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function buildTemporalSeal(nowIso: string) {
  return {
    status: "ACTIVE_TEMPORAL_RUNTIME_SEAL",
    scope: "HBCE_IPR_RUNTIME_API_v1_OPERATION_RECEIPT",
    utc: nowIso,
    timezone: "Europe/Rome",
    display: "Torino / Italia / Europa · UTC+2",
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY
  };
}

function buildContract() {
  return {
    status: "HBCE_IPR_RUNTIME_OPERATIONS_CONTRACT_READY",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    runtime: RUNTIME_NAME,
    endpoint: {
      path: "/api/v1/operations",
      publicPath: "/v1/operations",
      methods: ["GET", "POST"],
      mode: "ASYNC_OPERATION_RECEIPT_CONTRACT",
      persistenceMode: "CONTRACT_ONLY_NO_DATABASE_WRITE",
      executionMode: "ACCEPTED_NOT_EXECUTED_BY_THIS_ROUTE"
    },
    purpose: {
      summary:
        "Accept long-running or auditable HBCE/JOKER-C2 operations under a public v1 contract and return an operation receipt.",
      useCases: [
        "document audit",
        "proof pipeline",
        "source intelligence summary",
        "B2G risk intelligence brief",
        "governed runtime assessment",
        "IPR AI Audit Trail Demo orchestration"
      ]
    },
    supportedOperationTypes: SUPPORTED_OPERATION_TYPES,
    requiredInput: ["operationType", "subjectIpr", "payload"],
    optionalInput: [
      "sessionId",
      "humanIpr",
      "runtimeIpr",
      "tenant",
      "workspace",
      "constraints",
      "idempotencyKey",
      "callbackUrl",
      "webhookUrl",
      "metadata"
    ],
    outputContract: {
      minimum: [
        "operationId",
        "status",
        "responseEvt",
        "opcId",
        "createdAt",
        "legalCertification"
      ],
      statusValues: [
        "HBCE_OPERATION_CONTRACT_VALIDATED",
        "HBCE_OPERATION_REJECTED",
        "HBCE_OPERATION_CONTRACT_READY"
      ],
      pollingEndpoint: "/api/v1/operations/{operationId}",
      webhookSupport: "DECLARED_NOT_EXECUTED_BY_THIS_ROUTE"
    },
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      iprCardBoundary: IPR_CARD_BOUNDARY,
      publicIdentityBoundary:
        "This endpoint does not create an official public identity document.",
      noLegalAttestation: true,
      noThirdPartyAudit: true
    },
    runtimeContext: {
      access: "AUTHORIZATION_NOT_EVALUATED",
      memory: "RUNTIME_ONLY",
      memoryScope: "RUNTIME_ONLY",
      tenant: DEFAULT_TENANT,
      workspace: DEFAULT_WORKSPACE,
      policy: "NOT_EVALUATED"
    }
  };
}

function normalizeBody(body: OperationRequestBody): NormalizedOperationRequest {
  const subjectIpr =
    safeString(body.subjectIpr) ?? safeString(body.humanIpr) ?? DEFAULT_HUMAN_IPR;
  const humanIpr = safeString(body.humanIpr) ?? subjectIpr;

  return {
    operationType: safeString(body.operationType) ?? "GOVERNED_RUNTIME_ASSESSMENT",
    subjectIpr,
    humanIpr,
    runtimeIpr: safeString(body.runtimeIpr) ?? DEFAULT_RUNTIME_IPR,
    tenant: safeString(body.tenant) ?? DEFAULT_TENANT,
    workspace: safeString(body.workspace) ?? DEFAULT_WORKSPACE,
    sessionId: safeString(body.sessionId),
    payload: body.payload ?? null,
    constraints: safeRecord(body.constraints),
    idempotencyKey: safeString(body.idempotencyKey),
    callbackUrl: safeString(body.callbackUrl),
    webhookUrl: safeString(body.webhookUrl),
    metadata: safeRecord(body.metadata)
  };
}

function validateRequest(normalized: NormalizedOperationRequest) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!safeString(normalized.operationType)) {
    errors.push("MISSING_OPERATION_TYPE");
  }

  if (!isSupportedOperationType(normalized.operationType)) {
    errors.push("UNSUPPORTED_OPERATION_TYPE");
  }

  if (!safeString(normalized.subjectIpr)) {
    errors.push("MISSING_SUBJECT_IPR");
  }

  if (normalized.payload === null || typeof normalized.payload === "undefined") {
    errors.push("MISSING_PAYLOAD");
  }

  if (normalized.constraints.legalCertification === true) {
    errors.push("LEGAL_CERTIFICATION_NOT_AVAILABLE");
  }

  if (normalized.constraints.persistRawText === true) {
    errors.push("RAW_TEXT_PERSISTENCE_NOT_ALLOWED_IN_PUBLIC_V1_OPERATIONS");
  }

  if (normalized.callbackUrl && !isAllowedCallbackUrl(normalized.callbackUrl)) {
    errors.push("INVALID_CALLBACK_URL_HTTPS_REQUIRED");
  }

  if (normalized.webhookUrl && !isAllowedCallbackUrl(normalized.webhookUrl)) {
    errors.push("INVALID_WEBHOOK_URL_HTTPS_REQUIRED");
  }

  if (!normalized.idempotencyKey) {
    warnings.push("NO_IDEMPOTENCY_KEY_PROVIDED");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

function buildRejectedResponse(normalized: NormalizedOperationRequest, errors: string[], warnings: string[]) {
  const now = isoNow();
  const rejectionHash = sha256(
    stableJson({
      routeRevision: ROUTE_REVISION,
      normalized,
      errors,
      warnings,
      boundary: {
        legalCertification: LEGAL_CERTIFICATION,
        opcBoundary: OPC_BOUNDARY
      }
    })
  );

  return {
    ok: false,
    status: "HBCE_OPERATION_REJECTED",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    createdAt: now,
    operationId: null,
    operationType: normalized.operationType,
    subjectIpr: normalized.subjectIpr,
    validation: {
      ok: false,
      errors,
      warnings
    },
    policy: {
      decision: "DENY",
      reason: errors[0] ?? "OPERATION_REJECTED",
      failClosed: true
    },
    responseEvt: null,
    opcId: null,
    auditId: null,
    usageId: null,
    receiptHash: rejectionHash,
    temporalSeal: buildTemporalSeal(now),
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      iprCardBoundary: IPR_CARD_BOUNDARY
    }
  };
}

function buildAcceptedResponse(normalized: NormalizedOperationRequest, warnings: string[]) {
  const now = isoNow();
  const operationSeed = stableJson({
    routeRevision: ROUTE_REVISION,
    idempotencyKey: normalized.idempotencyKey,
    operationType: normalized.operationType,
    subjectIpr: normalized.subjectIpr,
    humanIpr: normalized.humanIpr,
    runtimeIpr: normalized.runtimeIpr,
    tenant: normalized.tenant,
    workspace: normalized.workspace,
    sessionId: normalized.sessionId,
    payloadHash: sha256(stableJson(normalized.payload)),
    createdAt: now
  });

  const operationHash = sha256(operationSeed);
  const operationSuffix = shortHash(operationSeed);
  const operationId = normalized.idempotencyKey
    ? `OPR-${shortHash(`${normalized.idempotencyKey}:${normalized.subjectIpr}:${normalized.operationType}`)}`
    : `OPR-${operationSuffix}`;
  const responseReference =
    `REF-V1-OPERATION-${operationSuffix.slice(0, 16)}`;

  return {
    ok: true,
    status: "HBCE_OPERATION_CONTRACT_VALIDATED",
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    operationId,
    operationType: normalized.operationType as SupportedOperationType,
    operationStatus: "CONTRACT_VALIDATED_NO_AUTHORIZATION_DECISION",
    executionStatus: "NOT_EXECUTED_BY_THIS_ROUTE",
    createdAt: now,
    updatedAt: now,
    polling: {
      statusEndpoint: `/api/v1/operations/${operationId}`,
      publicStatusEndpoint: `/v1/operations/${operationId}`,
      recommendedPollingSeconds: 10,
      webhookDeclared: Boolean(normalized.callbackUrl || normalized.webhookUrl),
      webhookExecutedByThisRoute: false
    },
    subject: {
      subjectIpr: normalized.subjectIpr,
      humanIpr: normalized.humanIpr,
      runtimeIpr: normalized.runtimeIpr,
      identityBinding: "UNVERIFIED_CLIENT_CLAIM",
      sessionId: normalized.sessionId,
      tenant: normalized.tenant,
      workspace: normalized.workspace
    },
    request: {
      idempotencyKey: normalized.idempotencyKey,
      payloadHash: sha256(stableJson(normalized.payload)),
      payloadPersistence: "HASH_ONLY_IN_RESPONSE",
      rawPayloadPersistence: false,
      metadata: normalized.metadata,
      constraints: {
        ...normalized.constraints,
        legalCertification: LEGAL_CERTIFICATION,
        opcBoundary: OPC_BOUNDARY,
        rawTextPersistence: false,
        automaticIprMemoryWrite: false,
        sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
      }
    },
    governance: {
      access: "AUTHORIZATION_NOT_EVALUATED",
      policy: "NOT_EVALUATED",
      authorityEvaluation: "NOT_PERFORMED_BY_CONTRACT_ENDPOINT",
      requestedScopeOnly: true,
      clientClaimsCreateAuthority: false,
      failClosed: true,
      memoryScope: "RUNTIME_ONLY",
      runtimeMemoryWriteSuppressed: true,
      semanticPersistenceSuppressed: true,
      noNewIprMemory: true,
      noNewSemanticMemoryPersistable: true,
      sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY"
    },
    proof: {
      responseReference,
      responseEvt: null,
      opcId: null,
      evtCreated: false,
      opcCreated: false,
      technicalReceiptCreated: false,
      contractResponseReceiptCreated: true,
      opcBoundary: OPC_BOUNDARY,
      legalCertification: LEGAL_CERTIFICATION,
      auditId: null,
      usageId: null,
      receiptHash: operationHash,
      receiptScope: "CONTRACT_RESPONSE_RECEIPT_ONLY",
      proofScope: "NO_EVT_NO_OPC_CREATED"
    },
    temporalSeal: buildTemporalSeal(now),
    validation: {
      ok: true,
      errors: [],
      warnings
    },
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      iprCardBoundary: IPR_CARD_BOUNDARY,
      publicIdentityBoundary:
        "This endpoint does not create an official public identity document.",
      noLegalAttestation: true,
      noThirdPartyAudit: true
    },
    next: {
      statusLookup: `/api/v1/operations/${operationId}`,
      implementationNote:
        "A persistent operation store can be connected in the next route without changing this public contract."
    }
  };
}

export async function GET() {
  return NextResponse.json(buildContract(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}

export async function POST(request: NextRequest) {
  let body: OperationRequestBody;

  try {
    body = (await request.json()) as OperationRequestBody;
  } catch {
    const normalized = normalizeBody({
      operationType: "GOVERNED_RUNTIME_ASSESSMENT",
      subjectIpr: DEFAULT_HUMAN_IPR,
      payload: null
    });
    const response = buildRejectedResponse(normalized, ["INVALID_JSON_BODY"], []);
    return NextResponse.json(response, {
      status: 400,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": API_VERSION,
        "X-HBCE-Route-Revision": ROUTE_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": OPC_BOUNDARY
      }
    });
  }

  const normalized = normalizeBody(body);
  const validation = validateRequest(normalized);

  if (!validation.ok) {
    const response = buildRejectedResponse(normalized, validation.errors, validation.warnings);
    return NextResponse.json(response, {
      status: 400,
      headers: {
        "Cache-Control": "no-store",
        "X-HBCE-API-Version": API_VERSION,
        "X-HBCE-Route-Revision": ROUTE_REVISION,
        "X-HBCE-Legal-Certification": "false",
        "X-HBCE-OPC-Boundary": OPC_BOUNDARY,
        "X-HBCE-Policy-Decision": "DENY"
      }
    });
  }

  const response = buildAcceptedResponse(normalized, validation.warnings);

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY,
      "X-HBCE-Policy-Decision": "NOT_EVALUATED",
      "X-HBCE-Operation-Id": response.operationId
    }
  });
}
