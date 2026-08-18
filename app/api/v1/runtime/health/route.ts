/**
 * AI JOKER-C2
 * Mission Runtime Health Endpoint
 * HERMETICUM B.C.E.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  resolveIprAccountSessionFromRequestAsync
} from "@/lib/ipr-auth-session-resolver";

import {
  RUNTIME_BOUNDARIES,
  RUNTIME_FRAMEWORK,
  RUNTIME_NAME,
  RUNTIME_STATUS,
  RUNTIME_VERSION
} from "@/lib/runtime";

import { runtimeHealth } from "@/lib/runtime/bootstrap";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionResolution =
    await resolveIprAccountSessionFromRequestAsync(request);

  if (!sessionResolution.authenticated) {
    return NextResponse.json(
      {
        ok: false,
        reason: "AUTHENTICATION_REQUIRED",
        legalCertification: false
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  }
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
  } catch {
    const message = "RUNTIME_HEALTH_UNAVAILABLE";

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
