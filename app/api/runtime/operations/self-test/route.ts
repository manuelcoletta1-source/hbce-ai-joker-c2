import { NextResponse } from "next/server";

import {
  buildRuntimeOperationsProjection,
  classifyRuntimeOperationTone,
} from "@/src/runtime/operations/runtime-operations-projection";

type Check = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

function check(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): Check {
  return {
    id,
    description,
    passed: Object.is(expected, actual),
    expected,
    actual,
  };
}

export async function GET() {
  const checks: Check[] = [];

  checks.push(
    check(
      "OPS-001",
      "PASS classification",
      "PASS",
      classifyRuntimeOperationTone("PASS"),
    ),
  );

  checks.push(
    check(
      "OPS-002",
      "REVIEW_REQUIRED classification",
      "REVIEW",
      classifyRuntimeOperationTone("REVIEW_REQUIRED"),
    ),
  );

  checks.push(
    check(
      "OPS-003",
      "BLOCKED classification",
      "BLOCKED",
      classifyRuntimeOperationTone("BLOCKED"),
    ),
  );

  checks.push(
    check(
      "OPS-004",
      "FAIL classification",
      "FAIL",
      classifyRuntimeOperationTone("FAIL"),
    ),
  );

  checks.push(
    check(
      "OPS-005",
      "DUE classification",
      "DUE",
      classifyRuntimeOperationTone("DUE"),
    ),
  );

  checks.push(
    check(
      "OPS-006",
      "EXECUTED classification",
      "EXECUTED",
      classifyRuntimeOperationTone("EXECUTED"),
    ),
  );

  const passProjection =
    buildRuntimeOperationsProjection({
      brain: {
        operationalStatus: "PASS",
        runtimeState: "ACTIVE",
      },

      scheduler: {
        operationalStatus: "PASS",
        schedulerState: "READY",
      },

      sourcesAvailable: {
        brain: true,
        scheduler: true,
      },
    });

  checks.push(
    check(
      "OPS-007",
      "Healthy sources produce PASS",
      "PASS",
      passProjection.operationalStatus,
    ),
  );

  checks.push(
    check(
      "OPS-008",
      "Human authorization remains required",
      true,
      passProjection.governance
        .humanAuthorizationRequired,
    ),
  );

  checks.push(
    check(
      "OPS-009",
      "Autonomous authorization remains disabled",
      false,
      passProjection.governance
        .autonomousAuthorization,
    ),
  );

  checks.push(
    check(
      "OPS-010",
      "Legal certification remains disabled",
      false,
      passProjection.governance
        .legalCertification,
    ),
  );

  const reviewProjection =
    buildRuntimeOperationsProjection({
      brain: {
        decision: "REVIEW_REQUIRED",
      },

      scheduler: {
        operationalStatus: "PASS",
      },

      sourcesAvailable: {
        brain: true,
        scheduler: true,
      },
    });

  checks.push(
    check(
      "OPS-011",
      "Review signal produces REVIEW_REQUIRED",
      "REVIEW_REQUIRED",
      reviewProjection.operationalStatus,
    ),
  );

  const blockedProjection =
    buildRuntimeOperationsProjection({
      brain: {
        decision: "BLOCKED",
      },

      scheduler: {
        operationalStatus: "PASS",
      },

      sourcesAvailable: {
        brain: true,
        scheduler: true,
      },
    });

  checks.push(
    check(
      "OPS-012",
      "Blocked signal produces BLOCKED",
      "BLOCKED",
      blockedProjection.operationalStatus,
    ),
  );

  checks.push(
    check(
      "OPS-013",
      "Blocked state activates fail-closed governance",
      true,
      blockedProjection.governance.failClosed,
    ),
  );

  const failedProjection =
    buildRuntimeOperationsProjection({
      brain: {
        operationalStatus: "FAIL",
      },

      scheduler: {
        operationalStatus: "PASS",
      },

      sourcesAvailable: {
        brain: true,
        scheduler: true,
      },
    });

  checks.push(
    check(
      "OPS-014",
      "Failure signal produces FAIL_CLOSED",
      "FAIL_CLOSED",
      failedProjection.operationalStatus,
    ),
  );

  const unavailableProjection =
    buildRuntimeOperationsProjection({
      brain: null,

      scheduler: {
        operationalStatus: "PASS",
      },

      sourcesAvailable: {
        brain: false,
        scheduler: true,
      },
    });

  checks.push(
    check(
      "OPS-015",
      "Unavailable authoritative source produces FAIL_CLOSED",
      "FAIL_CLOSED",
      unavailableProjection.operationalStatus,
    ),
  );

  checks.push(
    check(
      "OPS-016",
      "Projection revision is canonical",
      "HBCE-RUNTIME-OPERATIONS-PROJECTION-v1_0",
      passProjection.revision,
    ),
  );

  const passedChecks =
    checks.filter((item) => item.passed).length;

  const failedChecks =
    checks.length - passedChecks;

  const operationalStatus =
    failedChecks === 0
      ? "PASS"
      : "FAIL";

  const body = {
    ok: failedChecks === 0,

    status:
      failedChecks === 0
        ? "HBCE_RUNTIME_OPERATIONS_SELF_TEST_PASS"
        : "HBCE_RUNTIME_OPERATIONS_SELF_TEST_FAIL",

    operationalStatus,

    revision:
      "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_0",

    generatedAt: new Date().toISOString(),

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "DETERMINISTIC_RUNTIME_OPERATIONS_GOVERNANCE_SELF_TEST",

      externalEffects: false,

      runtimeActivation: false,

      autonomousExecution: false,

      submission: false,
    },

    summary: {
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      requiredChecks: checks.length,
      requiredPassed: passedChecks,
      requiredFailed: failedChecks,
    },

    checks,

    governance: {
      humanAuthorizationRequired: true,
      autonomousAuthorization: false,
      runtimeActivationFromSelfTest: false,
      noSubmitFromCode: true,
      failClosed: failedChecks > 0,
      legalCertification: false,
    },
  };

  return NextResponse.json(
    body,
    {
      status: failedChecks === 0 ? 200 : 500,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "X-HBCE-Revision":
          "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_0",

        "X-HBCE-Authorization":
          "HUMAN_AUTHORIZATION_REQUIRED",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
