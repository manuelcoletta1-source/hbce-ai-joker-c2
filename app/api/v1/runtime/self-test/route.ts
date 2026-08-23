import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";


const API_VERSION = "v1" as const;

const ROUTE_REVISION =
  "HBCE-API-V1-RUNTIME-OPERATIONAL-SELF-TEST-v1_0" as const;

const PRODUCT_NAME =
  "HBCE IPR Operational Identity & Proof Layer" as const;

const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const LEGAL_CERTIFICATION = false as const;

const OPC_BOUNDARY = "technical proof receipt only" as const;

const REQUEST_TIMEOUT_MS = 8_000;

type OperationalStatus = "PASS" | "DEGRADED" | "FAIL";

type CheckStatus = "PASS" | "FAIL";

type CheckDefinition = {
  id: string;
  label: string;
  method: "GET";
  path: string;
  required: boolean;
  expectedSignals: readonly string[];
};

type OperationalCheck = {
  id: string;
  label: string;
  method: "GET";
  path: string;
  required: boolean;
  status: CheckStatus;
  httpStatus: number | null;
  durationMs: number;
  contentType: string | null;
  matchedSignal: string | null;
  error: string | null;
};

type RuntimeOperationalSelfTestResponse = {
  ok: boolean;
  status:
    | "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_PASS"
    | "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_DEGRADED"
    | "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_FAIL";
  operationalStatus: OperationalStatus;
  revision: typeof ROUTE_REVISION;
  generatedAt: string;
  product: typeof PRODUCT_NAME;
  apiVersion: typeof API_VERSION;
  runtime: typeof RUNTIME_NAME;
  deployment: {
    origin: string;
    runtimeEnvironment: string;
    vercelEnvironment: string | null;
    vercelRegion: string | null;
    nodeVersion: string;
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    requiredChecks: number;
    requiredPassed: number;
    requiredFailed: number;
    optionalFailed: number;
    durationMs: number;
  };
  checks: OperationalCheck[];
  interpretation: {
    contractSurfaceReachable: boolean;
    runtimeHealthReachable: boolean;
    capabilitiesReachable: boolean;
    openApiReachable: boolean;
    staticSelfTestReachable: boolean;
    databaseDirectlyTested: false;
    memoryWritePerformed: false;
    modelCallPerformed: false;
    evtCreated: false;
    opcCreated: false;
    auditCreated: false;
    runtimeMutationPerformed: false;
  };
  boundary: {
    legalCertification: false;
    opcBoundary: typeof OPC_BOUNDARY;
    readOnly: true;
    performsInternalHttpChecks: true;
    performsDatabaseMutation: false;
    performsMemoryWrite: false;
    performsModelCall: false;
    createsOperationalReceipt: false;
    replacesHumanReview: false;
  };
};

const CHECKS: readonly CheckDefinition[] = [
  {
    id: "API_DISCOVERY",
    label: "API v1 discovery surface",
    method: "GET",
    path: "/api/v1",
    required: true,
    expectedSignals: [
      "HBCE_IPR_RUNTIME_API_DISCOVERY_READY",
      "HBCE",
      "\"ok\":true"
    ]
  },
  {
    id: "RUNTIME_HEALTH",
    label: "Runtime health endpoint",
    method: "GET",
    path: "/api/v1/health",
    required: true,
    expectedSignals: [
      "HBCE_IPR_RUNTIME_API_READY",
      "READY",
      "\"ok\":true"
    ]
  },
  {
    id: "CAPABILITIES",
    label: "Runtime capabilities endpoint",
    method: "GET",
    path: "/api/v1/capabilities",
    required: true,
    expectedSignals: [
      "HBCE_IPR_RUNTIME_CAPABILITIES_READY",
      "capabilities",
      "\"ok\":true"
    ]
  },
  {
    id: "OPENAPI",
    label: "OpenAPI contract endpoint",
    method: "GET",
    path: "/api/v1/openapi",
    required: false,
    expectedSignals: [
      "HBCE_IPR_RUNTIME_OPENAPI_READY",
      "openapi",
      "\"ok\":true"
    ]
  },
  {
    id: "STATIC_SELF_TEST",
    label: "Static API contract self-test",
    method: "GET",
    path: "/api/v1/self-test",
    required: true,
    expectedSignals: [
      "HBCE_IPR_RUNTIME_API_SELF_TEST_READY",
      "STATIC_CONTRACT_MATRIX_ONLY",
      "\"ok\":true"
    ]
  }
] as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const nowIso = (): string => new Date().toISOString();

const elapsedMs = (startedAt: number): number =>
  Math.max(0, Date.now() - startedAt);

const normalizeError = (_error: unknown): string =>
  "RUNTIME_SELF_TEST_CHECK_FAILED";

const getRequestOrigin = (request: NextRequest): string => {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  const forwardedProtocol = request.headers.get("x-forwarded-proto");

  const protocol =
    forwardedProtocol ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
};

const findExpectedSignal = (
  body: string,
  expectedSignals: readonly string[]
): string | null => {
  const normalizedBody = body.toLowerCase();

  for (const signal of expectedSignals) {
    if (normalizedBody.includes(signal.toLowerCase())) {
      return signal;
    }
  }

  return null;
};

const runCheck = async (
  origin: string,
  definition: CheckDefinition
): Promise<OperationalCheck> => {
  const startedAt = Date.now();
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${origin}${definition.path}`, {
      method: definition.method,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-HBCE-Internal-Self-Test": ROUTE_REVISION
      }
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    const matchedSignal = findExpectedSignal(
      body,
      definition.expectedSignals
    );

    const status: CheckStatus =
      response.ok && matchedSignal !== null ? "PASS" : "FAIL";

    return {
      id: definition.id,
      label: definition.label,
      method: definition.method,
      path: definition.path,
      required: definition.required,
      status,
      httpStatus: response.status,
      durationMs: elapsedMs(startedAt),
      contentType,
      matchedSignal,
      error:
        status === "PASS"
          ? null
          : response.ok
            ? "Endpoint responded but no expected readiness signal was found."
            : `Endpoint returned HTTP ${response.status}.`
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? `Request timed out after ${REQUEST_TIMEOUT_MS} ms.`
        : normalizeError(error);

    return {
      id: definition.id,
      label: definition.label,
      method: definition.method,
      path: definition.path,
      required: definition.required,
      status: "FAIL",
      httpStatus: null,
      durationMs: elapsedMs(startedAt),
      contentType: null,
      matchedSignal: null,
      error: errorMessage
    };
  } finally {
    clearTimeout(timeout);
  }
};

const resolveOperationalStatus = (
  requiredFailed: number,
  optionalFailed: number
): OperationalStatus => {
  if (requiredFailed > 0) {
    return "FAIL";
  }

  if (optionalFailed > 0) {
    return "DEGRADED";
  }

  return "PASS";
};

const resolveResponseStatus = (
  operationalStatus: OperationalStatus
): RuntimeOperationalSelfTestResponse["status"] => {
  switch (operationalStatus) {
    case "PASS":
      return "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_PASS";

    case "DEGRADED":
      return "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_DEGRADED";

    case "FAIL":
      return "HBCE_RUNTIME_OPERATIONAL_SELF_TEST_FAIL";
  }
};

const getCheckPassed = (
  checks: OperationalCheck[],
  id: string
): boolean =>
  checks.some((check) => check.id === id && check.status === "PASS");

export async function GET(
  request: NextRequest
): Promise<NextResponse<RuntimeOperationalSelfTestResponse>> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.runtimeAuthorized) {
    return NextResponse.json(
      {
        ok: false,
        reason: "AUTHENTICATION_REQUIRED",
        legalCertification: false
      } as unknown as RuntimeOperationalSelfTestResponse,
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }

  const testStartedAt = Date.now();
  const origin = getRequestOrigin(request);

  const checks = await Promise.all(
    CHECKS.map((definition) => runCheck(origin, definition))
  );

  const passedChecks = checks.filter(
    (check) => check.status === "PASS"
  ).length;

  const failedChecks = checks.length - passedChecks;

  const requiredChecks = checks.filter(
    (check) => check.required
  ).length;

  const requiredPassed = checks.filter(
    (check) => check.required && check.status === "PASS"
  ).length;

  const requiredFailed = requiredChecks - requiredPassed;

  const optionalFailed = checks.filter(
    (check) => !check.required && check.status === "FAIL"
  ).length;

  const operationalStatus = resolveOperationalStatus(
    requiredFailed,
    optionalFailed
  );

  const responseStatus = resolveResponseStatus(operationalStatus);

  const responseBody: RuntimeOperationalSelfTestResponse = {
    ok: operationalStatus !== "FAIL",
    status: responseStatus,
    operationalStatus,
    revision: ROUTE_REVISION,
    generatedAt: nowIso(),
    product: PRODUCT_NAME,
    apiVersion: API_VERSION,
    runtime: RUNTIME_NAME,
    deployment: {
      origin,
      runtimeEnvironment: process.env.NODE_ENV ?? "unknown",
      vercelEnvironment: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
      nodeVersion: process.version
    },
    summary: {
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      requiredChecks,
      requiredPassed,
      requiredFailed,
      optionalFailed,
      durationMs: elapsedMs(testStartedAt)
    },
    checks,
    interpretation: {
      contractSurfaceReachable: getCheckPassed(
        checks,
        "API_DISCOVERY"
      ),
      runtimeHealthReachable: getCheckPassed(
        checks,
        "RUNTIME_HEALTH"
      ),
      capabilitiesReachable: getCheckPassed(
        checks,
        "CAPABILITIES"
      ),
      openApiReachable: getCheckPassed(checks, "OPENAPI"),
      staticSelfTestReachable: getCheckPassed(
        checks,
        "STATIC_SELF_TEST"
      ),
      databaseDirectlyTested: false,
      memoryWritePerformed: false,
      modelCallPerformed: false,
      evtCreated: false,
      opcCreated: false,
      auditCreated: false,
      runtimeMutationPerformed: false
    },
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      readOnly: true,
      performsInternalHttpChecks: true,
      performsDatabaseMutation: false,
      performsMemoryWrite: false,
      performsModelCall: false,
      createsOperationalReceipt: false,
      replacesHumanReview: false
    }
  };

  const httpStatus =
    operationalStatus === "FAIL" ? 503 : 200;

  return NextResponse.json(responseBody, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Operational-Status": operationalStatus,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}
