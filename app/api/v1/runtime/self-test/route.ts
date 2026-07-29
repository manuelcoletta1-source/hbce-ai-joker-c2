/**
 * AI JOKER-C2
 * Mission Runtime Self-Test Endpoint
 * HERMETICUM B.C.E.
 */

import { NextResponse } from "next/server";

import {
  RUNTIME_BOUNDARIES,
  RUNTIME_FRAMEWORK,
  RUNTIME_NAME,
  RUNTIME_STATUS,
  RUNTIME_VERSION,
  runtimeInfo
} from "@/lib/runtime";

import { runtimeHealth } from "@/lib/runtime/bootstrap";

export const dynamic = "force-dynamic";

interface SelfTestCheck {
  id: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

export async function GET(): Promise<NextResponse> {
  try {
    const info = runtimeInfo();
    const health = runtimeHealth();

    const checks: SelfTestCheck[] = [
      {
        id: "RUNTIME_NAME_MATCH",
        passed: info.name === RUNTIME_NAME,
        expected: RUNTIME_NAME,
        actual: info.name
      },
      {
        id: "RUNTIME_VERSION_MATCH",
        passed: info.version === RUNTIME_VERSION,
        expected: RUNTIME_VERSION,
        actual: info.version
      },
      {
        id: "RUNTIME_STATUS_ACTIVE",
        passed:
          info.status === RUNTIME_STATUS &&
          health.status === RUNTIME_STATUS,
        expected: RUNTIME_STATUS,
        actual: {
          info: info.status,
          health: health.status
        }
      },
      {
        id: "FRAMEWORK_MATCH",
        passed:
          info.framework === RUNTIME_FRAMEWORK &&
          health.framework === RUNTIME_FRAMEWORK,
        expected: RUNTIME_FRAMEWORK,
        actual: {
          info: info.framework,
          health: health.framework
        }
      },
      {
        id: "RUNTIME_INITIALIZED",
        passed: health.initialized === true,
        expected: true,
        actual: health.initialized
      },
      {
        id: "FAIL_CLOSED_ENABLED",
        passed:
          health.failClosed === true &&
          RUNTIME_BOUNDARIES.includes("FAIL_CLOSED"),
        expected: true,
        actual: {
          health: health.failClosed,
          boundaryPresent: RUNTIME_BOUNDARIES.includes("FAIL_CLOSED")
        }
      },
      {
        id: "BOUNDARIES_REGISTERED",
        passed:
          Array.isArray(info.boundaries) &&
          info.boundaries.length === RUNTIME_BOUNDARIES.length,
        expected: RUNTIME_BOUNDARIES.length,
        actual: info.boundaries.length
      }
    ];

    const failedChecks = checks.filter((check) => !check.passed);
    const passed = failedChecks.length === 0;

    return NextResponse.json(
      {
        ok: passed,
        selfTest: {
          passed,
          totalChecks: checks.length,
          passedChecks: checks.length - failedChecks.length,
          failedChecks: failedChecks.length,
          checks
        },
        runtime: {
          name: RUNTIME_NAME,
          version: RUNTIME_VERSION,
          framework: RUNTIME_FRAMEWORK,
          status: passed ? RUNTIME_STATUS : "FAILED_CLOSED"
        },
        timestamp: new Date().toISOString()
      },
      {
        status: passed ? 200 : 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "RUNTIME_SELF_TEST_FAILED";

    return NextResponse.json(
      {
        ok: false,
        selfTest: {
          passed: false,
          failClosed: true
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
