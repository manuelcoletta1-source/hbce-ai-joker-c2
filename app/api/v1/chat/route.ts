import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  buildHbceApiAuthErrorBody,
  validateHbceApiCredential,
} from "@/lib/api-auth";

import {
  buildHbceRateLimitQuotaErrorBody,
  validateHbceRateLimitQuota,
} from "@/lib/rate-limit-quota";

import {
  assertOperationalModuleExecutionAllowed,
  resolveOperationalModuleRuntimeContext,
  toOperationalModuleRuntimeProjection,
  type OperationalModuleRuntimeContext,
} from "@/src/modules/runtime-context";

const API_VERSION = "v1" as const;

const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-CHAT_OPERATIONAL_MODULE_CONTEXT-v78_0" as const;

const AUTH_GATE_REVISION =
  "API_V1_CHAT_RUNTIME_ENFORCEMENT_GATES_v77_4" as const;

const DEPLOY_SENTINEL =
  "API_V1_CHAT_OPERATIONAL_MODULE_CONTEXT_DEPLOY_SENTINEL_v78_0_20260805" as const;

const PRODUCT_NAME =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const HBCE_SELF_PILOT_HUMAN_IPR =
  "IPR-88505FE91013DCFE97C56ED1" as const;

const HBCE_SELF_PILOT_RUNTIME_IPR =
  "IPR-AI-0001" as const;

const HBCE_SELF_PILOT_TENANT_ID =
  "HBCE-TENANT-SELF-PILOT" as const;

const HBCE_SELF_PILOT_WORKSPACE_ID =
  "HBCE-WORKSPACE-RND" as const;

const LEGAL_CERTIFICATION = false as const;

const OPC_BOUNDARY =
  "technical proof receipt only" as const;

const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document" as const;

const INTERNAL_CHAT_PATH = "/api/chat" as const;

const MAX_MESSAGE_LENGTH = 80_000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 180;
const MAX_SESSION_ID_LENGTH = 220;
const MAX_MODULE_ID_LENGTH = 64;

const INTERNAL_CHAT_TIMEOUT_MS = 55_000;

const API_KEY_HEADER = "x-hbce-api-key" as const;
const AUTHORIZATION_HEADER = "authorization" as const;

const RUNTIME_ENFORCEMENT_REVISION =
  "API_V1_CHAT_RUNTIME_ENFORCEMENT_GATES_v1" as const;

type V1RuntimeEnforcementMode =
  | "STATIC_PILOT_COMPAT"
  | "DATABASE_ENFORCED";

const RUNTIME_ENFORCEMENT_MODE_ENV =
  "HBCE_API_V1_CHAT_RUNTIME_ENFORCEMENT_MODE" as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type UnknownRecord = Record<string, unknown>;

type V1ChatRequestBody = {
  sessionId?: unknown;
  humanIpr?: unknown;
  runtimeIpr?: unknown;
  tenant?: unknown;
  workspace?: unknown;

  /**
   * Explicit operational module selection.
   *
   * Example:
   * MOD-001
   *
   * No automatic module selection is performed.
   */
  moduleId?: unknown;

  message?: unknown;
  files?: unknown;
  constraints?: unknown;
  idempotencyKey?: unknown;
};

type V1BoundarySnapshot = {
  legalCertification: false;
  opc: typeof OPC_BOUNDARY;
  iprCard: typeof IPR_CARD_BOUNDARY;
  rawTextPersistence: false;
  sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY";
  automaticIprMemoryWrite: false;
};

type V1PolicySnapshot = {
  decision: "ALLOW" | "FAIL_CLOSED";
  scope: "HBCE_SELF_PILOT_RUNTIME_API_v1";
  memoryScope: "IPR_BOUND";
  requestedMemoryWriteSuppression: true;
  requestedSemanticPersistenceSuppression: true;
  sourceIntelligenceRawTextPersistence: false;
};

type V1RuntimeEnforcementSnapshot = {
  revision: typeof RUNTIME_ENFORCEMENT_REVISION;
  mode: V1RuntimeEnforcementMode;
  staticPilotApiKey:
    | "PASS"
    | "SKIPPED_DATABASE_ENFORCED";
  apiAuth:
    | "NOT_REQUESTED"
    | "API_AUTH_GRANTED";
  rateLimitQuota:
    | "NOT_REQUESTED"
    | "RATE_LIMIT_QUOTA_GRANTED";
  failClosed: boolean;
  credentialId: string | null;
  rateLimitProfileId: string | null;
  quotaStatus: string | null;
  boundary: {
    legalCertification: false;
    staticPilotCompatibility: boolean;
    databaseCredentialAuth:
      | "DISABLED_IN_STATIC_PILOT_COMPAT"
      | "ENFORCED";
    rateLimitQuota:
      | "DISABLED_IN_STATIC_PILOT_COMPAT"
      | "ENFORCED";
  };
};

type V1RuntimeEnforcementFailureSnapshot = {
  revision: typeof RUNTIME_ENFORCEMENT_REVISION;
  mode: V1RuntimeEnforcementMode;
  failClosed: true;
  apiAuth: unknown;
  rateLimitQuota: unknown;
  boundary: {
    legalCertification: false;
    staticPilotCompatibility: boolean;
    databaseCredentialAuth: "ENFORCED";
    rateLimitQuota:
      | "NOT_REACHED"
      | "ENFORCED";
  };
};

type V1RuntimeEnforcementResult =
  | {
      ok: true;
      snapshot: V1RuntimeEnforcementSnapshot;
      headers: Record<string, string>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type OperationalModuleProjection =
  ReturnType<
    typeof toOperationalModuleRuntimeProjection
  >;

type V1ChatContractPayload = {
  ok: true;
  status: "HBCE_IPR_RUNTIME_CHAT_ENDPOINT_READY";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;
  endpoint: "/api/v1/chat";
  method: "POST";
  purpose: "Execute a governed AI interaction through JOKER-C2 with IPR, EVT, OPC, audit and usage visibility.";
  minimumInput: string[];
  optionalInput: string[];
  outputIncludes: string[];
  operationalModules: {
    explicitSelectionSupported: true;
    automaticSelection: false;
    promptInjection: false;
    persistentMemory: false;
    automaticRecall: false;
    moduleIdFormat: "MOD-XXX";
  };
  internalRuntimeBridge: {
    target: typeof INTERNAL_CHAT_PATH;
    mode: "SERVER_SIDE_BRIDGE_TO_EXISTING_JOKER_C2_CHAT_RUNTIME";
    timeoutMs: typeof INTERNAL_CHAT_TIMEOUT_MS;
  };
  runtimeContext: {
    runtime: typeof RUNTIME_NAME;
    humanIpr: typeof HBCE_SELF_PILOT_HUMAN_IPR;
    runtimeIpr: typeof HBCE_SELF_PILOT_RUNTIME_IPR;
    tenant: typeof HBCE_SELF_PILOT_TENANT_ID;
    workspace: typeof HBCE_SELF_PILOT_WORKSPACE_ID;
    access: "CONTRACT_READY";
  };
  boundary: V1BoundarySnapshot;
  generatedAt: string;
};

type V1ChatReadyPayload = {
  ok: true;
  status: "HBCE_IPR_RUNTIME_CHAT_READY";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;
  answer: unknown;
  responseEvt: unknown;
  opcId: unknown;
  auditId: unknown;
  usageId: unknown;

  operationalModule: OperationalModuleProjection;

  temporalSeal: {
    timezone: "Europe/Rome";
    locale:
      "Torino / Italia / Europa · UTC+2";
    utcCreatedAt: string;
    requestHash: string;
    responseHash: string;
  };

  memory: {
    scope: "IPR_BOUND";
    requestedAutomaticWriteSuppression: true;
    requestedSemanticPersistenceSuppression: true;
    note: "The /v1 wrapper requests no automatic IPR/semantic memory creation. Explicit operator save remains a separate governed action.";
  };

  enforcement?:
    | V1RuntimeEnforcementSnapshot
    | V1RuntimeEnforcementFailureSnapshot;

  policy: V1PolicySnapshot;

  risk: {
    posture: "GOVERNED_RUNTIME_BRIDGE";
    failClosed: true;
    sourceIntelligenceRawTextPersistence: false;
  };

  bridge: {
    internalEndpoint: typeof INTERNAL_CHAT_PATH;
    internalStatus: number;
    internalOk: boolean;
    internalRuntimeStatus: unknown;
    internalRouteRevision: unknown;
    internalResponseEvt: unknown;
    internalOpcId: unknown;
    internalAuditId: unknown;
    internalUsageId: unknown;
  };

  runtime: {
    humanIpr: string;
    runtimeIpr: string;
    tenant: string;
    workspace: string;
    sessionId: string;
    idempotencyKey: string | null;
    requestedModuleId: string | null;
  };

  legalCertification: false;
  boundary: V1BoundarySnapshot;
  rawRuntimeResponse: unknown;
};

type V1ChatFailPayload = {
  ok: false;
  status: "HBCE_IPR_RUNTIME_CHAT_FAIL";
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  routeRevision: typeof ROUTE_REVISION;

  failReason:
    | "MISSING_API_KEY"
    | "API_KEY_NOT_CONFIGURED"
    | "INVALID_API_KEY"
    | "API_AUTH_DENIED"
    | "RATE_LIMIT_QUOTA_DENIED"
    | "INVALID_JSON_BODY"
    | "MISSING_SESSION_ID"
    | "INVALID_SESSION_ID"
    | "MISSING_HUMAN_IPR"
    | "INVALID_HUMAN_IPR"
    | "INVALID_RUNTIME_IPR"
    | "INVALID_TENANT"
    | "INVALID_WORKSPACE"
    | "INVALID_MODULE_ID"
    | "OPERATIONAL_MODULE_SELECTION_DENIED"
    | "MISSING_MESSAGE"
    | "INVALID_MESSAGE"
    | "MESSAGE_TOO_LONG"
    | "INVALID_IDEMPOTENCY_KEY"
    | "INTERNAL_CHAT_TIMEOUT"
    | "INTERNAL_CHAT_BRIDGE_ERROR"
    | "INTERNAL_CHAT_RUNTIME_FAIL";

  message: string;

  expected?: Record<string, string>;

  bridge?: {
    internalEndpoint: typeof INTERNAL_CHAT_PATH;
    internalStatus?: number;
    internalOk?: boolean;
    internalPayload?: unknown;
  };

  operationalModule?: OperationalModuleProjection;

  enforcement?:
    | V1RuntimeEnforcementSnapshot
    | V1RuntimeEnforcementFailureSnapshot;

  policy: V1PolicySnapshot;
  legalCertification: false;
  boundary: V1BoundarySnapshot;
};

function utcNowIso(): string {
  return new Date().toISOString();
}

function normalizeString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function sha256Json(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function truncateString(
  value: string,
  maxLength: number,
): string {
  return value.length > maxLength
    ? value.slice(0, maxLength)
    : value;
}

function buildBoundary(): V1BoundarySnapshot {
  return {
    legalCertification:
      LEGAL_CERTIFICATION,

    opc:
      OPC_BOUNDARY,

    iprCard:
      IPR_CARD_BOUNDARY,

    rawTextPersistence:
      false,

    sourceProfileSaveMode:
      "EXPLICIT_OPERATOR_SAVE_ONLY",

    automaticIprMemoryWrite:
      false,
  };
}

function buildAllowPolicy(): V1PolicySnapshot {
  return {
    decision:
      "ALLOW",

    scope:
      "HBCE_SELF_PILOT_RUNTIME_API_v1",

    memoryScope:
      "IPR_BOUND",

    requestedMemoryWriteSuppression:
      true,

    requestedSemanticPersistenceSuppression:
      true,

    sourceIntelligenceRawTextPersistence:
      false,
  };
}

function buildFailPolicy(): V1PolicySnapshot {
  return {
    ...buildAllowPolicy(),
    decision:
      "FAIL_CLOSED",
  };
}

function jsonResponse<TPayload>(
  payload: TPayload,
  init?: ResponseInit,
) {
  return NextResponse.json(payload, {
    ...init,

    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      "X-HBCE-Product":
        PRODUCT_NAME,

      "X-HBCE-API-Version":
        API_VERSION,

      "X-HBCE-Route-Revision":
        ROUTE_REVISION,

      "X-HBCE-Auth-Gate-Revision":
        AUTH_GATE_REVISION,

      "X-HBCE-Deploy-Sentinel":
        DEPLOY_SENTINEL,

      "X-HBCE-Legal-Certification":
        "false",

      "X-HBCE-OPC-Boundary":
        OPC_BOUNDARY,

      ...(init?.headers ?? {}),
    },
  });
}

function fail(
  failReason: V1ChatFailPayload["failReason"],
  message: string,
  init: ResponseInit,
  extra?: Pick<
    V1ChatFailPayload,
    | "expected"
    | "bridge"
    | "operationalModule"
  >,
) {
  const payload: V1ChatFailPayload = {
    ok:
      false,

    status:
      "HBCE_IPR_RUNTIME_CHAT_FAIL",

    product:
      PRODUCT_NAME,

    apiVersion:
      API_VERSION,

    routeRevision:
      ROUTE_REVISION,

    failReason,

    message,

    ...(extra?.expected
      ? {
          expected:
            extra.expected,
        }
      : {}),

    ...(extra?.bridge
      ? {
          bridge:
            extra.bridge,
        }
      : {}),

    ...(extra?.operationalModule
      ? {
          operationalModule:
            extra.operationalModule,
        }
      : {}),

    policy:
      buildFailPolicy(),

    legalCertification:
      LEGAL_CERTIFICATION,

    boundary:
      buildBoundary(),
  };

  return jsonResponse(
    payload,
    init,
  );
}

function resolveRuntimeEnforcementMode():
  V1RuntimeEnforcementMode {
  const rawMode = normalizeString(
    process.env[
      RUNTIME_ENFORCEMENT_MODE_ENV
    ],
  )?.toUpperCase();

  return rawMode ===
    "DATABASE_ENFORCED"
    ? "DATABASE_ENFORCED"
    : "STATIC_PILOT_COMPAT";
}

function getRequestIp(
  request: NextRequest,
): string | null {
  const forwardedFor =
    normalizeString(
      request.headers.get(
        "x-forwarded-for",
      ),
    );

  if (forwardedFor) {
    return (
      forwardedFor
        .split(",")[0]
        ?.trim() || null
    );
  }

  return normalizeString(
    request.headers.get(
      "x-real-ip",
    ),
  );
}

function getRequestUserAgent(
  request: NextRequest,
): string | null {
  return normalizeString(
    request.headers.get(
      "user-agent",
    ),
  );
}

function buildStaticPilotRuntimeEnforcementSnapshot():
  V1RuntimeEnforcementSnapshot {
  return {
    revision:
      RUNTIME_ENFORCEMENT_REVISION,

    mode:
      "STATIC_PILOT_COMPAT",

    staticPilotApiKey:
      "PASS",

    apiAuth:
      "NOT_REQUESTED",

    rateLimitQuota:
      "NOT_REQUESTED",

    failClosed:
      true,

    credentialId:
      null,

    rateLimitProfileId:
      null,

    quotaStatus:
      null,

    boundary: {
      legalCertification:
        LEGAL_CERTIFICATION,

      staticPilotCompatibility:
        true,

      databaseCredentialAuth:
        "DISABLED_IN_STATIC_PILOT_COMPAT",

      rateLimitQuota:
        "DISABLED_IN_STATIC_PILOT_COMPAT",
    },
  };
}

function failWithRuntimeEnforcement(
  failReason: Extract<
    V1ChatFailPayload["failReason"],
    | "API_AUTH_DENIED"
    | "RATE_LIMIT_QUOTA_DENIED"
  >,
  message: string,
  init: ResponseInit,
  enforcement:
    V1RuntimeEnforcementFailureSnapshot,
) {
  const payload: V1ChatFailPayload = {
    ok:
      false,

    status:
      "HBCE_IPR_RUNTIME_CHAT_FAIL",

    product:
      PRODUCT_NAME,

    apiVersion:
      API_VERSION,

    routeRevision:
      ROUTE_REVISION,

    failReason,

    message,

    enforcement,

    policy:
      buildFailPolicy(),

    legalCertification:
      LEGAL_CERTIFICATION,

    boundary:
      buildBoundary(),
  };

  return jsonResponse(
    payload,
    init,
  );
}

async function validateRuntimeEnforcementGates(
  request: NextRequest,
  input: {
    sessionId: string;
    tenant: string;
    workspace: string;
    idempotencyKey: string | null;
  },
): Promise<V1RuntimeEnforcementResult> {
  const mode =
    resolveRuntimeEnforcementMode();

  if (
    mode ===
    "STATIC_PILOT_COMPAT"
  ) {
    return {
      ok:
        true,

      snapshot:
        buildStaticPilotRuntimeEnforcementSnapshot(),

      headers:
        {},
    };
  }

  const authResult =
    await validateHbceApiCredential({
      headers:
        request.headers,

      endpoint:
        "/api/v1/chat",

      method:
        "POST",

      tenantId:
        input.tenant,

      workspaceId:
        input.workspace,

      requestIp:
        getRequestIp(request),

      userAgent:
        getRequestUserAgent(request),
    });

  if (!authResult.ok) {
    const authBody =
      buildHbceApiAuthErrorBody(
        authResult,
      );

    return {
      ok:
        false,

      response:
        failWithRuntimeEnforcement(
          "API_AUTH_DENIED",
          authResult.message,
          {
            status:
              authResult.httpStatus,

            headers:
              authResult.httpStatus === 401
                ? {
                    "WWW-Authenticate":
                      'Bearer realm="HBCE API v1 chat", error="invalid_token"',
                  }
                : {},
          },
          {
            revision:
              RUNTIME_ENFORCEMENT_REVISION,

            mode,

            failClosed:
              true,

            apiAuth:
              authBody,

            rateLimitQuota:
              null,

            boundary: {
              legalCertification:
                LEGAL_CERTIFICATION,

              staticPilotCompatibility:
                false,

              databaseCredentialAuth:
                "ENFORCED",

              rateLimitQuota:
                "NOT_REACHED",
            },
          },
        ),
    };
  }

  const quotaResult =
    await validateHbceRateLimitQuota({
      tenantId:
        authResult.credential
          .tenantId ||
        input.tenant,

      workspaceId:
        authResult.credential
          .workspaceId ||
        input.workspace,

      credentialId:
        authResult.credential
          .credentialId,

      profileId:
        authResult.credential
          .rateLimitProfileId,

      endpoint:
        "/api/v1/chat",

      method:
        "POST",

      requestId:
        input.idempotencyKey ??
        input.sessionId,
    });

  if (!quotaResult.ok) {
    const quotaBody =
      buildHbceRateLimitQuotaErrorBody(
        quotaResult,
      );

    return {
      ok:
        false,

      response:
        failWithRuntimeEnforcement(
          "RATE_LIMIT_QUOTA_DENIED",
          quotaResult.message,
          {
            status:
              quotaResult.httpStatus,

            headers:
              quotaResult.headers,
          },
          {
            revision:
              RUNTIME_ENFORCEMENT_REVISION,

            mode,

            failClosed:
              true,

            apiAuth: {
              ok:
                true,

              status:
                authResult.status,

              revision:
                authResult.revision,

              credentialId:
                authResult
                  .credential
                  .credentialId,

              tenantId:
                authResult
                  .credential
                  .tenantId,

              workspaceId:
                authResult
                  .credential
                  .workspaceId,

              policy:
                authResult.policy,

              legalCertification:
                false,
            },

            rateLimitQuota:
              quotaBody,

            boundary: {
              legalCertification:
                LEGAL_CERTIFICATION,

              staticPilotCompatibility:
                false,

              databaseCredentialAuth:
                "ENFORCED",

              rateLimitQuota:
                "ENFORCED",
            },
          },
        ),
    };
  }

  return {
    ok:
      true,

    snapshot: {
      revision:
        RUNTIME_ENFORCEMENT_REVISION,

      mode,

      staticPilotApiKey:
        "SKIPPED_DATABASE_ENFORCED",

      apiAuth:
        "API_AUTH_GRANTED",

      rateLimitQuota:
        "RATE_LIMIT_QUOTA_GRANTED",

      failClosed:
        true,

      credentialId:
        authResult
          .credential
          .credentialId,

      rateLimitProfileId:
        authResult
          .credential
          .rateLimitProfileId,

      quotaStatus:
        quotaResult.quotaStatus,

      boundary: {
        legalCertification:
          LEGAL_CERTIFICATION,

        staticPilotCompatibility:
          false,

        databaseCredentialAuth:
          "ENFORCED",

        rateLimitQuota:
          "ENFORCED",
      },
    },

    headers:
      quotaResult.headers,
  };
}

function extractProvidedApiKey(
  request: NextRequest,
): string | null {
  const directKey =
    normalizeString(
      request.headers.get(
        API_KEY_HEADER,
      ),
    );

  if (directKey) {
    return directKey;
  }

  const authorization =
    normalizeString(
      request.headers.get(
        AUTHORIZATION_HEADER,
      ),
    );

  if (!authorization) {
    return null;
  }

  const bearerMatch =
    authorization.match(
      /^Bearer\s+(.+)$/i,
    );

  return bearerMatch
    ? normalizeString(
        bearerMatch[1],
      )
    : null;
}

function validatePilotApiKey(
  request: NextRequest,
) {
  const providedApiKey =
    extractProvidedApiKey(
      request,
    );

  if (!providedApiKey) {
    return fail(
      "MISSING_API_KEY",
      "Missing required HBCE API key for /api/v1/chat pilot access.",
      {
        status:
          401,

        headers: {
          "WWW-Authenticate":
            'Bearer realm="HBCE API v1 chat", error="missing_token"',
        },
      },
      {
        expected: {
          header:
            "x-hbce-api-key or Authorization: Bearer <token>",
        },
      },
    );
  }

  const expectedApiKey =
    normalizeString(
      process.env.HBCE_API_KEY,
    );

  if (!expectedApiKey) {
    return fail(
      "API_KEY_NOT_CONFIGURED",
      "HBCE_API_KEY is not configured for /api/v1/chat pilot access.",
      {
        status:
          503,
      },
      {
        expected: {
          environment:
            "HBCE_API_KEY",
        },
      },
    );
  }

  if (
    providedApiKey !==
    expectedApiKey
  ) {
    return fail(
      "INVALID_API_KEY",
      "Invalid HBCE API key for /api/v1/chat pilot access.",
      {
        status:
          403,
      },
      {
        expected: {
          header:
            "valid x-hbce-api-key or Authorization: Bearer <token>",
        },
      },
    );
  }

  return null;
}

async function readJsonBody(
  request: NextRequest,
): Promise<V1ChatRequestBody | null> {
  try {
    const parsed: unknown =
      await request.json();

    return isRecord(parsed)
      ? (parsed as V1ChatRequestBody)
      : null;
  } catch {
    return null;
  }
}

function extractRuntimeValue(
  payload: unknown,
  keys: string[],
): unknown {
  if (!isRecord(payload)) {
    return null;
  }

  for (const key of keys) {
    if (key in payload) {
      return payload[key];
    }
  }

  const nestedKeys = [
    "runtime",
    "trace",
    "memory",
    "response",
    "audit",
    "usage",
    "opc",
    "event",
  ];

  for (
    const nestedKey
    of nestedKeys
  ) {
    const nested =
      payload[nestedKey];

    if (!isRecord(nested)) {
      continue;
    }

    for (const key of keys) {
      if (key in nested) {
        return nested[key];
      }
    }
  }

  return null;
}

function extractAnswer(
  payload: unknown,
): unknown {
  return (
    extractRuntimeValue(
      payload,
      [
        "answer",
        "message",
        "content",
        "text",
        "responseText",
        "output",
      ],
    ) ??
    payload
  );
}

function buildInternalChatPayload(
  args: {
    body: V1ChatRequestBody;
    sessionId: string;
    humanIpr: string;
    runtimeIpr: string;
    tenant: string;
    workspace: string;
    message: string;
    idempotencyKey: string | null;
    moduleContext:
      OperationalModuleRuntimeContext;
  },
) {
  const constraints =
    isRecord(
      args.body.constraints,
    )
      ? args.body.constraints
      : {};

  const operationalModule =
    toOperationalModuleRuntimeProjection(
      args.moduleContext,
    );

  return {
    ...args.body,

    message:
      args.message,

    sessionId:
      args.sessionId,

    humanIpr:
      args.humanIpr,

    runtimeIpr:
      args.runtimeIpr,

    tenant:
      args.tenant,

    workspace:
      args.workspace,

    moduleId:
      operationalModule
        .requestedModuleId ??
      undefined,

    operationalModule,

    idempotencyKey:
      args.idempotencyKey ??
      undefined,

    files:
      args.body.files,

    apiVersion:
      API_VERSION,

    publicApiRoute:
      "/api/v1/chat",

    runtimeBridge: {
      product:
        PRODUCT_NAME,

      routeRevision:
        ROUTE_REVISION,

      target:
        INTERNAL_CHAT_PATH,

      mode:
        "SERVER_SIDE_BRIDGE_TO_EXISTING_JOKER_C2_CHAT_RUNTIME",
    },

    constraints: {
      ...constraints,

      legalCertification:
        false,

      opcBoundary:
        OPC_BOUNDARY,

      rawTextPersistence:
        false,

      sourceProfileSaveMode:
        "EXPLICIT_OPERATOR_SAVE_ONLY",

      automaticIprMemoryWrite:
        false,

      runtimeMemoryWriteSuppressed:
        true,

      semanticPersistenceSuppressed:
        true,

      noNewIprMemory:
        true,

      noNewSemanticMemoryPersistable:
        true,

      requestedByPublicApiV1:
        true,

      operationalModuleSelection:
        operationalModule
          .selectionState,

      operationalModulePromptInjected:
        false,

      operationalModulePersistentMemory:
        false,

      operationalModuleAutomaticRecall:
        false,
    },
  };
}

async function callInternalChat(
  request: NextRequest,
  payload: unknown,
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      INTERNAL_CHAT_TIMEOUT_MS,
    );

  try {
    const targetUrl =
      new URL(
        INTERNAL_CHAT_PATH,
        request.nextUrl.origin,
      );

    const response =
      await fetch(
        targetUrl,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            "X-HBCE-API-Version":
              API_VERSION,

            "X-HBCE-Route-Revision":
              ROUTE_REVISION,

            "X-HBCE-Legal-Certification":
              "false",

            "X-HBCE-OPC-Boundary":
              OPC_BOUNDARY,
          },

          body:
            JSON.stringify(payload),

          cache:
            "no-store",

          signal:
            controller.signal,
        },
      );

    const text =
      await response.text();

    let parsed: unknown =
      text;

    try {
      parsed =
        text
          ? JSON.parse(text)
          : null;
    } catch {
      parsed = {
        rawText:
          text,
      };
    }

    return {
      response,
      payload:
        parsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const payload:
    V1ChatContractPayload = {
    ok:
      true,

    status:
      "HBCE_IPR_RUNTIME_CHAT_ENDPOINT_READY",

    product:
      PRODUCT_NAME,

    apiVersion:
      API_VERSION,

    routeRevision:
      ROUTE_REVISION,

    endpoint:
      "/api/v1/chat",

    method:
      "POST",

    purpose:
      "Execute a governed AI interaction through JOKER-C2 with IPR, EVT, OPC, audit and usage visibility.",

    minimumInput: [
      "sessionId",
      "humanIpr",
      "message",
    ],

    optionalInput: [
      "runtimeIpr",
      "tenant",
      "workspace",
      "moduleId",
      "files",
      "constraints",
      "idempotencyKey",
    ],

    outputIncludes: [
      "answer",
      "responseEvt",
      "opcId",
      "auditId",
      "usageId",
      "operationalModule",
      "temporalSeal",
      "memory",
      "policy",
      "risk",
      "legalCertification:false",
    ],

    operationalModules: {
      explicitSelectionSupported:
        true,

      automaticSelection:
        false,

      promptInjection:
        false,

      persistentMemory:
        false,

      automaticRecall:
        false,

      moduleIdFormat:
        "MOD-XXX",
    },

    internalRuntimeBridge: {
      target:
        INTERNAL_CHAT_PATH,

      mode:
        "SERVER_SIDE_BRIDGE_TO_EXISTING_JOKER_C2_CHAT_RUNTIME",

      timeoutMs:
        INTERNAL_CHAT_TIMEOUT_MS,
    },

    runtimeContext: {
      runtime:
        RUNTIME_NAME,

      humanIpr:
        HBCE_SELF_PILOT_HUMAN_IPR,

      runtimeIpr:
        HBCE_SELF_PILOT_RUNTIME_IPR,

      tenant:
        HBCE_SELF_PILOT_TENANT_ID,

      workspace:
        HBCE_SELF_PILOT_WORKSPACE_ID,

      access:
        "CONTRACT_READY",
    },

    boundary:
      buildBoundary(),

    generatedAt:
      utcNowIso(),
  };

  return jsonResponse(payload);
}

export async function POST(
  request: NextRequest,
) {
  const runtimeEnforcementMode =
    resolveRuntimeEnforcementMode();

  if (
    runtimeEnforcementMode ===
    "STATIC_PILOT_COMPAT"
  ) {
    const apiKeyFailure =
      validatePilotApiKey(
        request,
      );

    if (apiKeyFailure) {
      return apiKeyFailure;
    }
  }

  const body =
    await readJsonBody(
      request,
    );

  if (!body) {
    return fail(
      "INVALID_JSON_BODY",
      "Expected a JSON object body.",
      {
        status:
          400,
      },
    );
  }

  const sessionId =
    normalizeString(
      body.sessionId,
    );

  if (!sessionId) {
    return fail(
      "MISSING_SESSION_ID",
      "Missing required field: sessionId.",
      {
        status:
          400,
      },
      {
        expected: {
          sessionId:
            "string returned by /api/v1/ipr/session",
        },
      },
    );
  }

  if (
    sessionId.length >
    MAX_SESSION_ID_LENGTH
  ) {
    return fail(
      "INVALID_SESSION_ID",
      "sessionId is too long.",
      {
        status:
          400,
      },
    );
  }

  const humanIpr =
    normalizeString(
      body.humanIpr,
    );

  if (!humanIpr) {
    return fail(
      "MISSING_HUMAN_IPR",
      "Missing required field: humanIpr.",
      {
        status:
          400,
      },
      {
        expected: {
          humanIpr:
            HBCE_SELF_PILOT_HUMAN_IPR,
        },
      },
    );
  }

  if (
    humanIpr !==
    HBCE_SELF_PILOT_HUMAN_IPR
  ) {
    return fail(
      "INVALID_HUMAN_IPR",
      "The supplied humanIpr is not allowed for this self-pilot v1 contract endpoint.",
      {
        status:
          403,
      },
      {
        expected: {
          humanIpr:
            HBCE_SELF_PILOT_HUMAN_IPR,
        },
      },
    );
  }

  const runtimeIpr =
    normalizeString(
      body.runtimeIpr,
    ) ??
    HBCE_SELF_PILOT_RUNTIME_IPR;

  if (
    runtimeIpr !==
    HBCE_SELF_PILOT_RUNTIME_IPR
  ) {
    return fail(
      "INVALID_RUNTIME_IPR",
      "The supplied runtimeIpr is not allowed for this self-pilot v1 contract endpoint.",
      {
        status:
          403,
      },
      {
        expected: {
          runtimeIpr:
            HBCE_SELF_PILOT_RUNTIME_IPR,
        },
      },
    );
  }

  const tenant =
    normalizeString(
      body.tenant,
    ) ??
    HBCE_SELF_PILOT_TENANT_ID;

  if (
    tenant !==
    HBCE_SELF_PILOT_TENANT_ID
  ) {
    return fail(
      "INVALID_TENANT",
      "The supplied tenant is not allowed for this self-pilot v1 contract endpoint.",
      {
        status:
          403,
      },
      {
        expected: {
          tenant:
            HBCE_SELF_PILOT_TENANT_ID,
        },
      },
    );
  }

  const workspace =
    normalizeString(
      body.workspace,
    ) ??
    HBCE_SELF_PILOT_WORKSPACE_ID;

  if (
    workspace !==
    HBCE_SELF_PILOT_WORKSPACE_ID
  ) {
    return fail(
      "INVALID_WORKSPACE",
      "The supplied workspace is not allowed for this self-pilot v1 contract endpoint.",
      {
        status:
          403,
      },
      {
        expected: {
          workspace:
            HBCE_SELF_PILOT_WORKSPACE_ID,
        },
      },
    );
  }

  const rawModuleId =
    normalizeString(
      body.moduleId,
    );

  if (
    rawModuleId &&
    rawModuleId.length >
      MAX_MODULE_ID_LENGTH
  ) {
    return fail(
      "INVALID_MODULE_ID",
      `moduleId exceeds ${MAX_MODULE_ID_LENGTH} characters.`,
      {
        status:
          400,
      },
      {
        expected: {
          moduleId:
            "MOD-XXX",
        },
      },
    );
  }

  const moduleRuntimeContext =
    resolveOperationalModuleRuntimeContext({
      moduleId:
        rawModuleId,

      humanIpr,

      runtimeIpr,

      tenant,

      workspace,

      sessionId,
    });

  try {
    assertOperationalModuleExecutionAllowed(
      moduleRuntimeContext,
    );
  } catch {
    return fail(
      "OPERATIONAL_MODULE_SELECTION_DENIED",
      moduleRuntimeContext
        .selection
        .reason ??
        "Operational module selection was denied.",
      {
        status:
          409,
      },
      {
        operationalModule:
          toOperationalModuleRuntimeProjection(
            moduleRuntimeContext,
          ),

        expected: {
          moduleId:
            "registered, enabled and ACTIVE module identifier",
        },
      },
    );
  }

  const message =
    normalizeString(
      body.message,
    );

  if (!message) {
    return fail(
      "MISSING_MESSAGE",
      "Missing required field: message.",
      {
        status:
          400,
      },
      {
        expected: {
          message:
            "non-empty string",
        },
      },
    );
  }

  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {
    return fail(
      "MESSAGE_TOO_LONG",
      `message exceeds ${MAX_MESSAGE_LENGTH} characters.`,
      {
        status:
          413,
      },
    );
  }

  const idempotencyKey =
    normalizeString(
      body.idempotencyKey,
    );

  if (
    idempotencyKey &&
    idempotencyKey.length >
      MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    return fail(
      "INVALID_IDEMPOTENCY_KEY",
      `idempotencyKey exceeds ${MAX_IDEMPOTENCY_KEY_LENGTH} characters.`,
      {
        status:
          400,
      },
    );
  }

  const runtimeEnforcement =
    await validateRuntimeEnforcementGates(
      request,
      {
        sessionId,
        tenant,
        workspace,
        idempotencyKey,
      },
    );

  if (!runtimeEnforcement.ok) {
    return runtimeEnforcement.response;
  }

  const internalPayload =
    buildInternalChatPayload({
      body,
      sessionId,
      humanIpr,
      runtimeIpr,
      tenant,
      workspace,

      message:
        truncateString(
          message,
          MAX_MESSAGE_LENGTH,
        ),

      idempotencyKey,

      moduleContext:
        moduleRuntimeContext,
    });

  let bridgeResult:
    Awaited<
      ReturnType<
        typeof callInternalChat
      >
    >;

  try {
    bridgeResult =
      await callInternalChat(
        request,
        internalPayload,
      );
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      error.name ===
        "AbortError";

    return fail(
      isAbort
        ? "INTERNAL_CHAT_TIMEOUT"
        : "INTERNAL_CHAT_BRIDGE_ERROR",

      isAbort
        ? "Internal JOKER-C2 chat runtime timed out."
        : "Internal JOKER-C2 chat runtime bridge failed.",

      {
        status:
          isAbort
            ? 504
            : 502,
      },

      {
        bridge: {
          internalEndpoint:
            INTERNAL_CHAT_PATH,
        },

        operationalModule:
          toOperationalModuleRuntimeProjection(
            moduleRuntimeContext,
          ),
      },
    );
  }

  const internalStatus =
    bridgeResult.response.status;

  const internalOk =
    bridgeResult.response.ok;

  const internalRuntimeStatus =
    extractRuntimeValue(
      bridgeResult.payload,
      ["status"],
    );

  if (!internalOk) {
    return fail(
      "INTERNAL_CHAT_RUNTIME_FAIL",
      "Internal JOKER-C2 chat runtime returned a non-OK response.",
      {
        status:
          502,
      },
      {
        bridge: {
          internalEndpoint:
            INTERNAL_CHAT_PATH,

          internalStatus,

          internalOk,

          internalPayload:
            bridgeResult.payload,
        },

        operationalModule:
          toOperationalModuleRuntimeProjection(
            moduleRuntimeContext,
          ),
      },
    );
  }

  const responseEvt =
    extractRuntimeValue(
      bridgeResult.payload,
      [
        "responseEvt",
        "evtId",
        "eventId",
        "lastEvtId",
      ],
    );

  const opcId =
    extractRuntimeValue(
      bridgeResult.payload,
      [
        "opcId",
        "opcProofId",
        "lastOpcProofId",
      ],
    );

  const auditId =
    extractRuntimeValue(
      bridgeResult.payload,
      [
        "auditId",
        "lastAuditId",
      ],
    );

  const usageId =
    extractRuntimeValue(
      bridgeResult.payload,
      [
        "usageId",
        "modelUsageId",
        "lastUsageId",
      ],
    );

  const responseHash =
    sha256Json(
      bridgeResult.payload,
    );

  const operationalModule =
    toOperationalModuleRuntimeProjection(
      moduleRuntimeContext,
    );

  const payload:
    V1ChatReadyPayload = {
    ok:
      true,

    status:
      "HBCE_IPR_RUNTIME_CHAT_READY",

    product:
      PRODUCT_NAME,

    apiVersion:
      API_VERSION,

    routeRevision:
      ROUTE_REVISION,

    answer:
      extractAnswer(
        bridgeResult.payload,
      ),

    responseEvt,

    opcId,

    auditId,

    usageId,

    operationalModule,

    temporalSeal: {
      timezone:
        "Europe/Rome",

      locale:
        "Torino / Italia / Europa · UTC+2",

      utcCreatedAt:
        utcNowIso(),

      requestHash:
        sha256Json(
          internalPayload,
        ),

      responseHash,
    },

    memory: {
      scope:
        "IPR_BOUND",

      requestedAutomaticWriteSuppression:
        true,

      requestedSemanticPersistenceSuppression:
        true,

      note:
        "The /v1 wrapper requests no automatic IPR/semantic memory creation. Explicit operator save remains a separate governed action.",
    },

    enforcement:
      runtimeEnforcement.snapshot,

    policy:
      buildAllowPolicy(),

    risk: {
      posture:
        "GOVERNED_RUNTIME_BRIDGE",

      failClosed:
        true,

      sourceIntelligenceRawTextPersistence:
        false,
    },

    bridge: {
      internalEndpoint:
        INTERNAL_CHAT_PATH,

      internalStatus,

      internalOk,

      internalRuntimeStatus,

      internalRouteRevision:
        extractRuntimeValue(
          bridgeResult.payload,
          [
            "routeRevision",
            "revision",
          ],
        ),

      internalResponseEvt:
        responseEvt,

      internalOpcId:
        opcId,

      internalAuditId:
        auditId,

      internalUsageId:
        usageId,
    },

    runtime: {
      humanIpr,

      runtimeIpr,

      tenant,

      workspace,

      sessionId,

      idempotencyKey,

      requestedModuleId:
        operationalModule
          .requestedModuleId,
    },

    legalCertification:
      LEGAL_CERTIFICATION,

    boundary:
      buildBoundary(),

    rawRuntimeResponse:
      bridgeResult.payload,
  };

  return jsonResponse(
    payload,
    {
      headers:
        runtimeEnforcement.headers,
    },
  );
}
