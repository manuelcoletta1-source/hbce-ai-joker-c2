/**
 * AI JOKER-C2
 * Mission Runtime Execute Endpoint
 * HERMETICUM B.C.E.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  bootstrapRuntime,
  RuntimeBootstrapInput
} from "@/lib/runtime/bootstrap";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest
): Promise<NextResponse> {

  try {

    const body =
      (await request.json()) as RuntimeBootstrapInput;

    const result = bootstrapRuntime(body);

    return NextResponse.json(
      {
        ok: !result.failClosed,
        execution: result,
        timestamp: new Date().toISOString()
      },
      {
        status: result.failClosed ? 400 : 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error: unknown) {

    const message =
      error instanceof Error
        ? error.message
        : "RUNTIME_EXECUTION_FAILED";

    return NextResponse.json(
      {
        ok: false,
        failClosed: true,
        error: message,
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );

  }

}
