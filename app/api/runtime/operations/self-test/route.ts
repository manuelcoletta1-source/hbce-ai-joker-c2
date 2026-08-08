import { NextResponse } from "next/server";

import {
  buildRuntimeOperationsProjection,
  classifyRuntimeOperationTone,
} from "@/src/runtime/operations/runtime-operations-projection";

import {
  buildRuntimeOperationsEvidence,
} from "@/src/runtime/operations/runtime-operations-evidence";

import {
  buildRuntimeOperationsOpcEnvelope,
} from "@/src/runtime/operations/runtime-operations-opc-envelope";

import {
  verifyRuntimeOperationsOpcEnvelope,
} from "@/src/runtime/operations/runtime-operations-opc-verifier";

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
  const generatedAt = new Date().toISOString();

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
      classifyRuntimeOperationTone(
        "REVIEW_REQUIRED",
      ),
    ),
  );

  checks.push(
    check(
      "OPS-003",
      "BLOCKED classification",
      "BLOCKED",
      classifyRuntimeOperationTone(
        "BLOCKED",
      ),
    ),
  );

  checks.push(
    check(
      "OPS-004",
      "FAIL classification",
      "FAIL",
      classifyRuntimeOperationTone(
        "FAIL",
      ),
    ),
  );

  checks.push(
    check(
      "OPS-005",
      "DUE classification",
      "DUE",
      classifyRuntimeOperationTone(
        "DUE",
      ),
    ),
  );

  checks.push(
    check(
      "OPS-006",
      "EXECUTED classification",
      "EXECUTED",
      classifyRuntimeOperationTone(
        "EXECUTED",
      ),
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
      blockedProjection.governance
        .failClosed,
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
      unavailableProjection
        .operationalStatus,
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
    checks.filter(
      (item) => item.passed,
    ).length;

  const failedChecks =
    checks.length - passedChecks;

  const selfTestPassed =
    failedChecks === 0;

  const operationalStatus =
    selfTestPassed
      ? "PASS"
      : "FAIL";

  /*
   * This object is the canonical source payload
   * used to generate the evidence receipt.
   *
   * It deliberately exists before OPC/EVT
   * verification so the verifier can independently
   * recompute every derived integrity value.
   */
  const baseBody = {
    ok: selfTestPassed,

    status:
      selfTestPassed
        ? "HBCE_RUNTIME_OPERATIONS_SELF_TEST_PASS"
        : "HBCE_RUNTIME_OPERATIONS_SELF_TEST_FAIL",

    operationalStatus,

    revision:
      "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_3",

    generatedAt,

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
      totalChecks:
        checks.length,

      passedChecks,

      failedChecks,

      requiredChecks:
        checks.length,

      requiredPassed:
        passedChecks,

      requiredFailed:
        failedChecks,
    },

    checks,

    governance: {
      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromSelfTest:
        false,

      noSubmitFromCode:
        true,

      failClosed:
        failedChecks > 0,

      legalCertification:
        false,
    },
  };

  /*
   * Layer 1:
   * Canonical evidence receipt.
   */
  const evidenceReceipt =
    buildRuntimeOperationsEvidence(
      baseBody,
    );

  /*
   * Layer 2:
   * IPR-bound OPC / EVT envelope.
   */
  const opcEvtEnvelope =
    buildRuntimeOperationsOpcEnvelope({
      evidence:
        evidenceReceipt,
    });

  /*
   * Layer 3:
   * Independent recomputation and verification.
   *
   * The verifier does not trust the hashes already
   * contained inside the generated objects.
   * It recalculates:
   *
   * - evidence SHA-256
   * - envelope SHA-256
   * - internal hash-bound seal
   * - IPR identity binding
   * - EVT binding
   * - OPC evidence reference
   * - governance invariants
   */
  const opcVerification =
    verifyRuntimeOperationsOpcEnvelope({
      sourceInput:
        baseBody,

      evidence:
        evidenceReceipt,

      envelope:
        opcEvtEnvelope,
    });

  /*
   * Overall endpoint state is stricter than
   * the functional self-test alone.
   *
   * Functional PASS without integrity PASS
   * is not accepted.
   */
  const overallPass =
    selfTestPassed &&
    opcVerification.verified;

  const totalChainChecks =
    checks.length +
    opcVerification.summary
      .totalChecks;

  const totalChainPassed =
    passedChecks +
    opcVerification.summary
      .passedChecks;

  const totalChainFailed =
    failedChecks +
    opcVerification.summary
      .failedChecks;

  const body = {
    ...baseBody,

    /*
     * Override the public result with the complete
     * chain state.
     */
    ok:
      overallPass,

    status:
      overallPass
        ? "HBCE_RUNTIME_OPERATIONS_SELF_TEST_PASS"
        : "HBCE_RUNTIME_OPERATIONS_SELF_TEST_FAIL",

    evidenceReceipt,

    opcEvtEnvelope,

    opcVerification,

    chainSummary: {
      totalChecks:
        totalChainChecks,

      passedChecks:
        totalChainPassed,

      failedChecks:
        totalChainFailed,

      functionalChecks: {
        total:
          checks.length,

        passed:
          passedChecks,

        failed:
          failedChecks,
      },

      integrityChecks: {
        total:
          opcVerification.summary
            .totalChecks,

        passed:
          opcVerification.summary
            .passedChecks,

        failed:
          opcVerification.summary
            .failedChecks,
      },

      selfTestPassed,

      opcVerificationPassed:
        opcVerification.verified,

      completeChainPassed:
        overallPass,
    },

    chainGovernance: {
      failClosed:
        !overallPass,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivation:
        false,

      externalEffects:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,

      qualifiedElectronicSignature:
        false,
    },
  };

  return NextResponse.json(
    body,
    {
      status:
        overallPass
          ? 200
          : 500,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-Revision":
          "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_3",

        "X-HBCE-Evidence-Revision":
          evidenceReceipt.revision,

        "X-HBCE-Evidence-SHA256":
          evidenceReceipt.integrity
            .sha256,

        "X-HBCE-OPC-EVT-Revision":
          opcEvtEnvelope.revision,

        "X-HBCE-Envelope-SHA256":
          opcEvtEnvelope.integrity
            .envelopeSha256,

        "X-HBCE-Internal-Seal":
          opcEvtEnvelope.internalSeal
            .value,

        "X-HBCE-OPC-Verifier-Revision":
          opcVerification.revision,

        "X-HBCE-OPC-Verification":
          opcVerification.verified
            ? "PASS"
            : "FAIL_CLOSED",

        "X-HBCE-Chain-Checks":
          String(
            totalChainChecks,
          ),

        "X-HBCE-Chain-Passed":
          String(
            totalChainPassed,
          ),

        "X-HBCE-Chain-Failed":
          String(
            totalChainFailed,
          ),

        "X-HBCE-Authorization":
          "HUMAN_AUTHORIZATION_REQUIRED",

        "X-HBCE-Autonomous-Authorization":
          "false",

        "X-HBCE-Runtime-Activation":
          "false",

        "X-HBCE-No-Submit-From-Code":
          "true",

        "X-HBCE-Legal-Certification":
          "false",

        "X-HBCE-Qualified-Electronic-Signature":
          "false",
      },
    },
  );
}
