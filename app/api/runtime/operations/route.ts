import { NextResponse } from "next/server";

import {
  buildRuntimeOperationsProjection,
  type RuntimeOperationsProjection,
} from "@/src/runtime/operations/runtime-operations-projection";

type RuntimeSourceResult = {
  ok: boolean;
  status: number;
  data: unknown;
  error: string | null;
};

async function fetchRuntimeSource(
  request: Request,
  pathname: string,
): Promise<RuntimeSourceResult> {
  try {
    const baseUrl = new URL(request.url);

    const targetUrl = new URL(pathname, baseUrl.origin);

    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    let data: unknown = null;

    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          raw: text,
        };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok
        ? null
        : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown runtime source failure.",
    };
  }
}

function buildResponse(input: {
  brain: RuntimeSourceResult;
  scheduler: RuntimeSourceResult;
}): {
  httpStatus: number;
  body: {
    ok: boolean;
    status:
      | "HBCE_RUNTIME_OPERATIONS_PASS"
      | "HBCE_RUNTIME_OPERATIONS_REVIEW_REQUIRED"
      | "HBCE_RUNTIME_OPERATIONS_BLOCKED"
      | "HBCE_RUNTIME_OPERATIONS_FAIL_CLOSED";
    operationalStatus: RuntimeOperationsProjection["operationalStatus"];
    revision: "HBCE-RUNTIME-OPERATIONS-API-v1_0";
    generatedAt: string;
    product: "HBCE IPR Operational Identity & Proof Layer";
    runtime: "AI_JOKER_C2_SAAS_CORE_v0_1";
    projection: RuntimeOperationsProjection;
    sources: {
      brain: {
        available: boolean;
        httpStatus: number;
        error: string | null;
      };
      scheduler: {
        available: boolean;
        httpStatus: number;
        error: string | null;
      };
    };
    governance: {
      humanAuthorizationRequired: true;
      autonomousAuthorization: false;
      runtimeActivationFromApi: false;
      noSubmitFromCode: true;
      failClosed: boolean;
      legalCertification: false;
    };
  };
} {
  const projection = buildRuntimeOperationsProjection({
    brain: input.brain.data,
    scheduler: input.scheduler.data,
    sourcesAvailable: {
      brain: input.brain.ok,
      scheduler: input.scheduler.ok,
    },
  });

  const statusMap = {
    PASS: "HBCE_RUNTIME_OPERATIONS_PASS",
    REVIEW_REQUIRED:
      "HBCE_RUNTIME_OPERATIONS_REVIEW_REQUIRED",
    BLOCKED: "HBCE_RUNTIME_OPERATIONS_BLOCKED",
    FAIL_CLOSED: "HBCE_RUNTIME_OPERATIONS_FAIL_CLOSED",
  } as const;

  const httpStatus =
    projection.operationalStatus === "FAIL_CLOSED"
      ? 503
      : 200;

  return {
    httpStatus,

    body: {
      ok: projection.operationalStatus !== "FAIL_CLOSED",

      status: statusMap[projection.operationalStatus],

      operationalStatus: projection.operationalStatus,

      revision: "HBCE-RUNTIME-OPERATIONS-API-v1_0",

      generatedAt: new Date().toISOString(),

      product: "HBCE IPR Operational Identity & Proof Layer",

      runtime: "AI_JOKER_C2_SAAS_CORE_v0_1",

      projection,

      sources: {
        brain: {
          available: input.brain.ok,
          httpStatus: input.brain.status,
          error: input.brain.error,
        },

        scheduler: {
          available: input.scheduler.ok,
          httpStatus: input.scheduler.status,
          error: input.scheduler.error,
        },
      },

      governance: {
        humanAuthorizationRequired: true,
        autonomousAuthorization: false,
        runtimeActivationFromApi: false,
        noSubmitFromCode: true,
        failClosed: projection.governance.failClosed,
        legalCertification: false,
      },
    },
  };
}

export async function GET(request: Request) {
  const [brain, scheduler] = await Promise.all([
    fetchRuntimeSource(
      request,
      "/api/runtime/brain",
    ),

    fetchRuntimeSource(
      request,
      "/api/runtime/scheduler",
    ),
  ]);

  const response = buildResponse({
    brain,
    scheduler,
  });

  return NextResponse.json(
    response.body,
    {
      status: response.httpStatus,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma: "no-cache",

        Expires: "0",

        "X-HBCE-Runtime":
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        "X-HBCE-Revision":
          "HBCE-RUNTIME-OPERATIONS-API-v1_0",

        "X-HBCE-Authorization":
          "HUMAN_AUTHORIZATION_REQUIRED",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
