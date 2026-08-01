import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type CheckStatus = "PASS" | "FAIL";

type EndToEndCheck = {
  id: string;
  label: string;
  required: boolean;
  method: "GET" | "POST";
  path: string;
  status: CheckStatus;
  httpStatus: number | null;
  durationMs: number;
  expectedStatus: string;
  actualStatus: string | null;
  operationalStatus: string | null;
  revision: string | null;
  error: string | null;
};

type JsonRecord = Record<string, unknown>;

const REVISION =
  "HBCE-RUNTIME-END-TO-END-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1";

const CHECK_DEFINITIONS = [
  {
    id: "RUNTIME_DIAGNOSTICS",
    label: "Runtime diagnostics",
    method: "GET",
    path: "/api/v1/runtime/diagnostics",
    expectedStatus: "HBCE_RUNTIME_DIAGNOSTICS_PASS",
  },
  {
    id: "MEMORY_SELF_TEST",
    label: "Memory persistence self-test",
    method: "POST",
    path: "/api/v1/runtime/memory/self-test",
    expectedStatus: "HBCE_RUNTIME_MEMORY_PASS",
  },
  {
    id: "EVT_SELF_TEST",
    label: "EVT ledger self-test",
    method: "POST",
    path: "/api/v1/runtime/evt/self-test",
    expectedStatus: "HBCE_RUNTIME_EVT_PASS",
  },
  {
    id: "OPC_SELF_TEST",
    label: "OPC ledger self-test",
    method: "POST",
    path: "/api/v1/runtime/opc/self-test",
    expectedStatus: "HBCE_RUNTIME_OPC_PASS",
  },
  {
    id: "AUDIT_SELF_TEST",
    label: "Audit ledger self-test",
    method: "POST",
    path: "/api/v1/runtime/audit/self-test",
    expectedStatus: "HBCE_RUNTIME_AUDIT_PASS",
  },
  {
    id: "MODEL_USAGE_SELF_TEST",
    label: "Model Usage ledger self-test",
    method: "POST",
    path: "/api/v1/runtime/model-usage/self-test",
    expectedStatus: "HBCE_RUNTIME_MODEL_USAGE_PASS",
  },
] as const;

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function valueAsString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return null;
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto =
    request.headers.get("x-forwarded-proto");

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ??
    request.headers.get("host");

  if (host) {
    return `${forwardedProto ?? "https"}://${host}`;
  }

  return request.nextUrl.origin;
}

async function readJsonSafely(
  response: Response,
): Promise<JsonRecord | null> {
  try {
    const value = await response.json();

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value as JsonRecord;
    }

    return null;
  } catch {
    return null;
  }
}

async function executeCheck(input: {
  origin: string;
  id: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  expectedStatus: string;
}): Promise<EndToEndCheck> {
  const startedAt = nowMs();

  try {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      120_000,
    );

    let response: Response;

    try {
      response = await fetch(
        `${input.origin}${input.path}`,
        {
          method: input.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-HBCE-End-To-End-Test": REVISION,
          },
          body:
            input.method === "POST"
              ? JSON.stringify({
                  source:
                    "HBCE_RUNTIME_END_TO_END_SELF_TEST",
                  revision:
                    REVISION,
                })
              : undefined,
          cache: "no-store",
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    const body =
      await readJsonSafely(response);

    const actualStatus =
      valueAsString(body?.status);

    const operationalStatus =
      valueAsString(
        body?.operationalStatus,
      );

    const revision =
      valueAsString(body?.revision);

    const passed =
      response.ok &&
      actualStatus ===
        input.expectedStatus &&
      (
        operationalStatus === null ||
        operationalStatus === "PASS"
      );

    return {
      id: input.id,
      label: input.label,
      required: true,
      method: input.method,
      path: input.path,
      status:
        passed ? "PASS" : "FAIL",
      httpStatus:
        response.status,
      durationMs:
        elapsedMs(startedAt),
      expectedStatus:
        input.expectedStatus,
      actualStatus,
      operationalStatus,
      revision,
      error:
        passed
          ? null
          : `END_TO_END_CHECK_FAILED:${input.id}`,
    };
  } catch (error) {
    return {
      id: input.id,
      label: input.label,
      required: true,
      method: input.method,
      path: input.path,
      status: "FAIL",
      httpStatus: null,
      durationMs:
        elapsedMs(startedAt),
      expectedStatus:
        input.expectedStatus,
      actualStatus: null,
      operationalStatus: null,
      revision: null,
      error:
        normalizeError(error),
    };
  }
}

function buildSummary(
  checks: EndToEndCheck[],
  durationMs: number,
) {
  const passed =
    checks.filter(
      (check) =>
        check.status === "PASS",
    ).length;

  const failed =
    checks.filter(
      (check) =>
        check.status === "FAIL",
    ).length;

  return {
    totalChecks:
      checks.length,
    passedChecks:
      passed,
    failedChecks:
      failed,
    requiredChecks:
      checks.length,
    requiredPassed:
      passed,
    requiredFailed:
      failed,
    durationMs,
  };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt =
    new Date().toISOString();

  const origin =
    getRequestOrigin(request);

  const checks:
    EndToEndCheck[] = [];

  /*
   * Esecuzione sequenziale intenzionale.
   *
   * Evita picchi simultanei sul database serverless e rende
   * l'ordine diagnostico leggibile:
   * diagnostics -> memory -> EVT -> OPC -> audit -> model usage.
   */
  for (
    const definition of
    CHECK_DEFINITIONS
  ) {
    checks.push(
      await executeCheck({
        origin,
        id: definition.id,
        label: definition.label,
        method: definition.method,
        path: definition.path,
        expectedStatus:
          definition.expectedStatus,
      }),
    );
  }

  const ok =
    checks.every(
      (check) =>
        check.status === "PASS",
    );

  const durationMs =
    elapsedMs(startedAt);

  const firstFailure =
    checks.find(
      (check) =>
        check.status === "FAIL",
    ) ?? null;

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_END_TO_END_PASS"
          : "HBCE_RUNTIME_END_TO_END_FAIL",

      operationalStatus:
        ok ? "PASS" : "FAIL",

      revision:
        REVISION,

      generatedAt,

      product:
        PRODUCT,

      apiVersion:
        API_VERSION,

      runtime:
        RUNTIME_NAME,

      deployment: {
        origin,

        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",

        vercelEnvironment:
          process.env.VERCEL_ENV ??
          null,

        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,

        nodeVersion:
          process.version,
      },

      execution: {
        mode:
          "SEQUENTIAL_OPERATIONAL_ORCHESTRATION",

        order:
          CHECK_DEFINITIONS.map(
            (definition) =>
              definition.id,
          ),

        firstFailure:
          firstFailure
            ? {
                id:
                  firstFailure.id,
                path:
                  firstFailure.path,
                error:
                  firstFailure.error,
              }
            : null,
      },

      summary:
        buildSummary(
          checks,
          durationMs,
        ),

      checks,

      interpretation: {
        runtimeDiagnosticsPassed:
          checks.find(
            (check) =>
              check.id ===
              "RUNTIME_DIAGNOSTICS",
          )?.status === "PASS",

        memoryPassed:
          checks.find(
            (check) =>
              check.id ===
              "MEMORY_SELF_TEST",
          )?.status === "PASS",

        evtPassed:
          checks.find(
            (check) =>
              check.id ===
              "EVT_SELF_TEST",
          )?.status === "PASS",

        opcPassed:
          checks.find(
            (check) =>
              check.id ===
              "OPC_SELF_TEST",
          )?.status === "PASS",

        auditPassed:
          checks.find(
            (check) =>
              check.id ===
              "AUDIT_SELF_TEST",
          )?.status === "PASS",

        modelUsagePassed:
          checks.find(
            (check) =>
              check.id ===
              "MODEL_USAGE_SELF_TEST",
          )?.status === "PASS",

        completeOperationalChainPassed:
          ok,
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        orchestrationMode:
          "EXISTING_SELF_TEST_ENDPOINTS",

        directDatabaseMutation:
          false,

        downstreamTemporaryDatabaseMutation:
          true,

        downstreamRecordsRetained:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        verifiesCrossRecordForeignKeys:
          false,

        verifiesSharedTransaction:
          false,

        replacesHumanReview:
          false,

        note:
          "This v1 end-to-end test verifies that every production runtime layer independently completes its real temporary persistence cycle in one ordered orchestration. It does not yet create one shared cross-linked transaction across all ledgers.",
      },
    },
    {
      status:
        ok ? 200 : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-End-To-End-Test-Revision":
          REVISION,

        "X-HBCE-End-To-End-Test-Status":
          ok ? "PASS" : "FAIL",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_END_TO_END_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getRequestOrigin(
          request,
        )}/api/v1/runtime/end-to-end/self-test`,

      executionMethod:
        "POST",

      description:
        "Orchestra in sequenza i self-test di Diagnostics, Memory, EVT, OPC, Audit e Model Usage e verifica che l'intera superficie operativa di produzione risponda PASS.",

      executionOrder:
        CHECK_DEFINITIONS.map(
          (definition) => ({
            id:
              definition.id,
            method:
              definition.method,
            path:
              definition.path,
            expectedStatus:
              definition.expectedStatus,
          }),
        ),

      warning:
        "GET non esegue il test. POST attiva i self-test downstream, che effettuano mutazioni temporanee e cleanup sui rispettivi ledger.",

      boundary: {
        legalCertification:
          false,

        getPerformsMutation:
          false,

        postTriggersTemporaryDownstreamMutations:
          true,

        downstreamRecordsRetained:
          false,

        performsRealModelCall:
          false,

        verifiesSharedCrossLedgerTransaction:
          false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-End-To-End-Test-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
