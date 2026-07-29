/**
 * AI JOKER-C2
 * Mission Runtime Health Endpoint
 * HERMETICUM B.C.E.
 */

import { NextResponse } from "next/server";

import {
  RUNTIME_BOUNDARIES,
  RUNTIME_FRAMEWORK,
  RUNTIME_NAME,
  RUNTIME_STATUS,
  RUNTIME_VERSION
} from "@/lib/runtime";

import { runtimeHealth } from "@/lib/runtime/bootstrap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const health = runtimeHealth();

    return NextResponse.json(
      {
        ok: true,
        runtime: {
          name: RUNTIME_NAME,
          version: RUNTIME_VERSION,
          status: RUNTIME_STATUS,
          framework: RUNTIME_FRAMEWORK,
          initialized: health.initialized,
          failClosed: health.failClosed,
          boundaries: [...RUNTIME_BOUNDARIES]
        },
        verification: {
          legalCertification: false,
          autonomousLegalPersonhood: false,
          consciousnessProof: false
        },
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_RUNTIME_HEALTH_ERROR";

    return NextResponse.json(
      {
        ok: false,
        runtime: {
          status: "FAILED_CLOSED"
        },
        error: message,
        timestamp: new Date().toISOString()
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
