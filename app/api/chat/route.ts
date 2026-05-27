import { NextRequest, NextResponse } from "next/server";

import {
  executeRuntimeChatCompletion,
  getRuntimeHealthSnapshot
} from "@/lib/runtime/runtime-orchestrator";

import type {
  RuntimeChatRequest,
  RuntimeChatResponse,
  RuntimeHealthResponse
} from "@/lib/runtime/runtime-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RUNTIME_NAME = "AI_JOKER-C2";

export async function GET(): Promise<NextResponse> {
  try {
    const health = await getRuntimeHealthSnapshot();

    return buildJsonResponse<RuntimeHealthResponse>(
      health,
      200
    );
  } catch (error) {
    return buildJsonResponse(
      buildFatalHealthFailure(error),
      500
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = await readRuntimeBody(request);

    const runtimeResponse =
      await executeRuntimeChatCompletion({
        request,
        body
      });

    return buildJsonResponse<RuntimeChatResponse>(
      runtimeResponse,
      resolveHttpStatus(runtimeResponse)
    );
  } catch (error) {
    return buildJsonResponse(
      buildFatalRuntimeFailure(error),
      500
    );
  }
}

async function readRuntimeBody(
  request: NextRequest
): Promise<RuntimeChatRequest> {
  try {
    const parsed = (await request.json()) as unknown;

    if (!isObject(parsed)) {
      return {};
    }

    return parsed as RuntimeChatRequest;
  } catch {
    return {};
  }
}

function resolveHttpStatus(
  response: RuntimeChatResponse
): number {
  if (
    response.policy?.decision === "BLOCK"
  ) {
    return 400;
  }

  if (
    response.ok === false ||
    response.state === "PROVIDER_ERROR" ||
    response.state === "FATAL_RUNTIME_ERROR"
  ) {
    return 500;
  }

  return 200;
}

function buildFatalHealthFailure(
  error: unknown
): RuntimeHealthResponse {
  return {
    ok: false,

    runtime: "AI_JOKER",

    state: "HEALTHCHECK_FAILURE",

    provider: "UNKNOWN",

    apiMode: "FAILED",

    model: "UNKNOWN",

    standardModel: "UNKNOWN",

    deepModel: "UNKNOWN",

    openAIConfigured: false,

    legalCertification: false,

    error: toErrorMessage(error),

    boundary: {
      legalCertification: false,
      runtime:
        "health snapshot generation failure",
      opc:
        "technical proof receipt only",
      evt:
        "technical operational trace only"
    }
  };
}

function buildFatalRuntimeFailure(
  error: unknown
): RuntimeChatResponse {
  const message = toErrorMessage(error);

  return {
    ok: false,

    answer: [
      "JOKER-C2 runtime fatal failure.",
      "",
      "The orchestration gateway failed before completion.",
      "",
      "Boundary:",
      "- EVT generation may be incomplete;",
      "- OPC generation may be incomplete;",
      "- audit persistence may be incomplete;",
      "- memory persistence may be incomplete;",
      "",
      "Error:",
      message,
      "",
      "legalCertification=false"
    ].join("\n"),

    response: [
      "JOKER-C2 runtime fatal failure.",
      "",
      message
    ].join("\n"),

    runtime: {
      entity: "AI_JOKER",
      ipr: "IPR-AI-0001",
      aiEvt: "EVT-0016-AI",
      state: "FATAL_RUNTIME_ERROR"
    },

    runtimeName: "AI_JOKER",

    provider: "UNKNOWN",

    providerName: "UNKNOWN",

    apiMode: "FAILED",

    model: "UNKNOWN",

    modelLevel: "UNKNOWN",

    state: "FATAL_RUNTIME_ERROR",

    status: "FATAL_RUNTIME_ERROR",

    diagnostics: {
      runtimeState: "FATAL_RUNTIME_ERROR",
      error: message,
      legalCertification: false
    },

    boundary: {
      legalCertification: false,
      runtime:
        "fatal orchestration failure",
      opc:
        "technical proof receipt only",
      evt:
        "technical operational trace only",
      memory:
        "runtime continuity layer only"
    }
  };
}

function buildJsonResponse<T>(
  payload: T,
  status = 200
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-HBCE-Runtime": RUNTIME_NAME,
      "X-HBCE-Legal-Certification":
        "false"
    }
  });
}

function toErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown runtime failure";
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
