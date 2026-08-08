import { NextRequest, NextResponse } from "next/server";

import {
  buildRuntimeOperationsEvidence,
  type RuntimeOperationsEvidenceInput,
} from "@/src/runtime/operations/runtime-operations-evidence";

import {
  buildRuntimeOperationsOpcEnvelope,
} from "@/src/runtime/operations/runtime-operations-opc-envelope";

import {
  verifyRuntimeOperationsOpcEnvelope,
} from "@/src/runtime/operations/runtime-operations-opc-verifier";

import {
  getRuntimeOperationsLedgerEntryBySequence,
  appendVerifiedRuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

import {
  verifyRuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-OPERATIONS-PERSISTENCE-SELF-TEST-v1_0" as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

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
    passed: Object.is(
      expected,
      actual,
    ),
    expected,
    actual,
  };
}

function unauthorized(
  reason: string,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_UNAUTHORIZED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      reason,

      governance: {
        persistenceExecuted:
          false,

        humanAuthorizationRequired:
          true,

        autonomousAuthorization:
          false,

        runtimeActivation:
          false,

        noSubmitFromCode:
          true,

        legalCertification:
          false,

        qualifiedElectronicSignature:
          false,
      },
    },
    {
      status:
        401,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "X-HBCE-Revision":
          REVISION,

        "X-HBCE-Authorization":
          "REJECTED",

        "X-HBCE-Persistence":
          "false",
      },
    },
  );
}

function getExpectedManualToken():
  string | null {
  const value =
    process.env
      .HBCE_LEDGER_SELF_TEST_TOKEN;

  if (
    typeof value !== "string" ||
    value.length < 16
  ) {
    return null;
  }

  return value;
}

function buildSourceInput(
  generatedAt: string,
): RuntimeOperationsEvidenceInput {
  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SOURCE_PASS",

    operationalStatus:
      "PASS",

    revision:
      REVISION,

    generatedAt,

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "MANUALLY_AUTHORIZED_PERSISTENT_RUNTIME_OPERATIONS_LEDGER_SELF_TEST",

      persistence:
        true,

      externalEffects:
        true,

      runtimeActivation:
        false,

      autonomousExecution:
        false,

      submission:
        false,
    },

    summary: {
      totalChecks:
        1,

      passedChecks:
        1,

      failedChecks:
        0,

      requiredChecks:
        1,

      requiredPassed:
        1,

      requiredFailed:
        0,
    },

    checks: [
      {
        id:
          "PERSIST-SOURCE-001",

        description:
          "Manually authorized persistence source is canonical",

        passed:
          true,

        expected:
          "PASS",

        actual:
          "PASS",
      },
    ],

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
        false,

      legalCertification:
        false,
    },
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_READY",

      operationalStatus:
        "READY",

      revision:
        REVISION,

      method:
        "POST",

      sideEffects:
        false,

      message:
        "POST is required because this self-test performs a real append to the persistent ledger.",

      requirements: {
        environmentVariable:
          "HBCE_LEDGER_SELF_TEST_TOKEN",

        requestHeader:
          MANUAL_AUTHORIZATION_HEADER,

        minimumTokenLength:
          16,
      },

      governance: {
        persistenceExecuted:
          false,

        humanAuthorizationRequired:
          true,

        autonomousAuthorization:
          false,

        runtimeActivation:
          false,

        noSubmitFromCode:
          true,

        legalCertification:
          false,

        qualifiedElectronicSignature:
          false,
      },
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "X-HBCE-Revision":
          REVISION,

        "X-HBCE-Persistence":
          "false",

        "X-HBCE-Authorization":
          "HUMAN_AUTHORIZATION_REQUIRED",
      },
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  const expectedToken =
    getExpectedManualToken();

  if (!expectedToken) {
    return unauthorized(
      "HBCE_LEDGER_SELF_TEST_TOKEN is missing or shorter than 16 characters.",
    );
  }

  const suppliedToken =
    request.headers.get(
      MANUAL_AUTHORIZATION_HEADER,
    );

  if (
    suppliedToken !==
    expectedToken
  ) {
    return unauthorized(
      "Manual persistence authorization token is invalid.",
    );
  }

  const generatedAt =
    new Date().toISOString();

  const checks: Check[] =
    [];

  try {
    /*
     * 1. Build canonical evidence source.
     */
    const sourceInput =
      buildSourceInput(
        generatedAt,
      );

    checks.push(
      check(
        "PERSIST-001",
        "Persistence source requires human authorization",
        true,
        sourceInput.governance
          .humanAuthorizationRequired,
      ),
    );

    checks.push(
      check(
        "PERSIST-002",
        "Persistence source disables autonomous authorization",
        false,
        sourceInput.governance
          .autonomousAuthorization,
      ),
    );

    /*
     * 2. Build evidence receipt.
     */
    const evidence =
      buildRuntimeOperationsEvidence(
        sourceInput,
      );

    checks.push(
      check(
        "PERSIST-003",
        "Evidence verification passes",
        true,
        evidence.verification
          .allRequiredChecksPassed,
      ),
    );

    /*
     * 3. Build OPC / EVT envelope.
     */
    const envelope =
      buildRuntimeOperationsOpcEnvelope({
        evidence,
      });

    checks.push(
      check(
        "PERSIST-004",
        "Runtime IPR binding is canonical",
        "IPR-AI-0001",
        envelope.identity
          .runtimeIpr,
      ),
    );

    checks.push(
      check(
        "PERSIST-005",
        "Human authority IPR binding is canonical",
        "IPR-3",
        envelope.identity
          .humanAuthorityIpr,
      ),
    );

    checks.push(
      check(
        "PERSIST-006",
        "Organization binding is canonical",
        "HERMETICUM B.C.E. S.r.l.",
        envelope.identity
          .organization,
      ),
    );

    /*
     * 4. Independently verify evidence, envelope,
     *    internal seal and governance.
     */
    const opcVerification =
      verifyRuntimeOperationsOpcEnvelope({
        sourceInput,
        evidence,
        envelope,
      });

    checks.push(
      check(
        "PERSIST-007",
        "OPC/EVT independent verification passes",
        true,
        opcVerification
          .verified,
      ),
    );

    checks.push(
      check(
        "PERSIST-008",
        "OPC/EVT verification has zero failures",
        0,
        opcVerification
          .summary
          .failedChecks,
      ),
    );

    if (
      !opcVerification.verified
    ) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_OPC_VERIFICATION_FAILED",
      );
    }

    /*
     * 5. REAL EXTERNAL EFFECT.
     *
     * This is the first point where the self-test writes
     * to the persistent append-only database ledger.
     */
    const persisted =
      await appendVerifiedRuntimeOperationsLedgerEntry({
        envelope,
        verification:
          opcVerification,
      });

    checks.push(
      check(
        "PERSIST-009",
        "Persistent ledger sequence is positive",
        true,
        Number.isSafeInteger(
          persisted.entry
            .sequence,
        ) &&
          persisted.entry
            .sequence > 0,
      ),
    );

    checks.push(
      check(
        "PERSIST-010",
        "Persisted entry carries canonical Runtime IPR",
        "IPR-AI-0001",
        persisted.entry
          .identity
          .runtimeIpr,
      ),
    );

    checks.push(
      check(
        "PERSIST-011",
        "Persisted entry carries canonical human authority IPR",
        "IPR-3",
        persisted.entry
          .identity
          .humanAuthorityIpr,
      ),
    );

    checks.push(
      check(
        "PERSIST-012",
        "Persisted evidence SHA-256 matches envelope",
        envelope.opc
          .evidenceSha256,
        persisted.entry
          .source
          .evidenceSha256,
      ),
    );

    checks.push(
      check(
        "PERSIST-013",
        "Persisted envelope SHA-256 matches source envelope",
        envelope.integrity
          .envelopeSha256,
        persisted.entry
          .source
          .envelopeSha256,
      ),
    );

    checks.push(
      check(
        "PERSIST-014",
        "Persisted internal seal matches source envelope",
        envelope.internalSeal
          .value,
        persisted.entry
          .source
          .internalSeal,
      ),
    );

    /*
     * 6. Read the row back using an independent repository read.
     */
    const reread =
      await getRuntimeOperationsLedgerEntryBySequence(
        persisted.entry
          .sequence,
      );

    checks.push(
      check(
        "PERSIST-015",
        "Persisted entry can be read back by sequence",
        true,
        reread !== null,
      ),
    );

    if (!reread) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_REREAD_MISSING",
      );
    }

    checks.push(
      check(
        "PERSIST-016",
        "Reread entry SHA-256 matches inserted entry",
        persisted.entry
          .chain
          .entrySha256,
        reread.entry
          .chain
          .entrySha256,
      ),
    );

    checks.push(
      check(
        "PERSIST-017",
        "Reread chain root SHA-256 matches inserted entry",
        persisted.entry
          .chain
          .chainRootSha256,
        reread.entry
          .chain
          .chainRootSha256,
      ),
    );

    checks.push(
      check(
        "PERSIST-018",
        "Reread evidence SHA-256 matches inserted entry",
        persisted.entry
          .source
          .evidenceSha256,
        reread.entry
          .source
          .evidenceSha256,
      ),
    );

    /*
     * 7. Cryptographically verify the row after persistence.
     */
    let previousEntry = null;

    if (
      reread.entry
        .sequence > 1
    ) {
      const previousRecord =
        await getRuntimeOperationsLedgerEntryBySequence(
          reread.entry
            .sequence - 1,
        );

      if (!previousRecord) {
        throw new Error(
          "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_PREVIOUS_ENTRY_MISSING",
        );
      }

      previousEntry =
        previousRecord.entry;
    }

    const postPersistenceVerification =
      verifyRuntimeOperationsLedgerEntry({
        entry:
          reread.entry,

        previousEntry,
      });

    checks.push(
      check(
        "PERSIST-019",
        "Post-persistence cryptographic ledger verification passes",
        true,
        postPersistenceVerification
          .verified,
      ),
    );

    checks.push(
      check(
        "PERSIST-020",
        "Post-persistence ledger verification has zero failures",
        0,
        postPersistenceVerification
          .summary
          .failedChecks,
      ),
    );

    checks.push(
      check(
        "PERSIST-021",
        "Persisted ledger remains append-only",
        true,
        reread.entry
          .governance
          .appendOnly,
      ),
    );

    checks.push(
      check(
        "PERSIST-022",
        "Persisted ledger remains hash-only evidence",
        true,
        reread.entry
          .governance
          .hashOnlyEvidence,
      ),
    );

    checks.push(
      check(
        "PERSIST-023",
        "Human authorization remains required after persistence",
        true,
        reread.entry
          .governance
          .humanAuthorizationRequired,
      ),
    );

    checks.push(
      check(
        "PERSIST-024",
        "Autonomous authorization remains disabled after persistence",
        false,
        reread.entry
          .governance
          .autonomousAuthorization,
      ),
    );

    checks.push(
      check(
        "PERSIST-025",
        "Runtime activation remains disabled after persistence",
        false,
        reread.entry
          .governance
          .runtimeActivation,
      ),
    );

    checks.push(
      check(
        "PERSIST-026",
        "NO_SUBMIT_FROM_CODE remains enabled after persistence",
        true,
        reread.entry
          .governance
          .noSubmitFromCode,
      ),
    );

    checks.push(
      check(
        "PERSIST-027",
        "Legal certification remains disabled",
        false,
        reread.entry
          .governance
          .legalCertification,
      ),
    );

    checks.push(
      check(
        "PERSIST-028",
        "Qualified electronic signature claim remains disabled",
        false,
        reread.entry
          .governance
          .qualifiedElectronicSignature,
      ),
    );
    const passedChecks =
      checks.filter(
        (item) =>
          item.passed,
      ).length;

    const failedChecks =
      checks.length -
      passedChecks;

    const completePass =
      failedChecks === 0 &&
      postPersistenceVerification
        .verified;

    return NextResponse.json(
      {
        ok:
          completePass,

        status:
          completePass
            ? "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_PASS"
            : "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_FAIL",

        operationalStatus:
          completePass
            ? "PASS"
            : "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        product:
          "HBCE IPR Operational Identity & Proof Layer",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        execution: {
          mode:
            "MANUALLY_AUTHORIZED_PERSISTENT_RUNTIME_OPERATIONS_LEDGER_SELF_TEST",

          persistence:
            true,

          externalEffects:
            true,

          runtimeActivation:
            false,

          autonomousExecution:
            false,

          submission:
            false,

          manualAuthorization:
            true,
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

        evidence: {
          revision:
            evidence.revision,

          sha256:
            evidence.integrity
              .sha256,

          verified:
            evidence.verification
              .allRequiredChecksPassed,
        },

        opcEvt: {
          revision:
            envelope.revision,

          envelopeSha256:
            envelope.integrity
              .envelopeSha256,

          internalSeal:
            envelope.internalSeal
              .value,

          verified:
            opcVerification
              .verified,
        },

        persistence: {
          table:
            persisted.persistence
              .table,

          recordedAt:
            persisted.persistence
              .recordedAt,

          sequence:
            reread.entry
              .sequence,

          hermeticumSigil:
            "🜏",

          entrySha256:
            reread.entry
              .chain
              .entrySha256,

          previousEntrySha256:
            reread.entry
              .chain
              .previousEntrySha256,

          chainRootSha256:
            reread.entry
              .chain
              .chainRootSha256,

          reread:
            true,

          postPersistenceVerified:
            postPersistenceVerification
              .verified,
        },

        governance: {
          failClosed:
            !completePass,

          appendOnly:
            true,

          hashOnlyEvidence:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          persistenceExecuted:
            true,

          externalEffects:
            true,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          qualifiedElectronicSignature:
            false,
        },
      },
      {
        status:
          completePass
            ? 200
            : 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          "X-HBCE-Revision":
            REVISION,

          "X-HBCE-Persistence":
            "true",

          "X-HBCE-Persistence-Sequence":
            String(
              reread.entry
                .sequence,
            ),

          "X-HBCE-Evidence-SHA256":
            evidence.integrity
              .sha256,

          "X-HBCE-Envelope-SHA256":
            envelope.integrity
              .envelopeSha256,

          "X-HBCE-Ledger-Entry-SHA256":
            reread.entry
              .chain
              .entrySha256,

          "X-HBCE-Chain-Root-SHA256":
            reread.entry
              .chain
              .chainRootSha256,

          "X-HBCE-Hermeticum-Sigil":
            "🜏",

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

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
  } catch (error) {
    const passedChecks =
      checks.filter(
        (item) =>
          item.passed,
      ).length;

    const failedChecks =
      checks.length -
      passedChecks;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        ok:
          false,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENCE_SELF_TEST_FAIL",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        generatedAt,

        error: {
          name:
            error instanceof Error
              ? error.name
              : "UnknownError",

          message,
        },

        summary: {
          totalChecks:
            checks.length,

          passedChecks,

          failedChecks:
            failedChecks + 1,
        },

        checks,

        governance: {
          failClosed:
            true,

          persistenceMayHaveOccurred:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivation:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,

          qualifiedElectronicSignature:
            false,
        },
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          "X-HBCE-Revision":
            REVISION,

          "X-HBCE-Persistence":
            "FAIL_CLOSED",

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Runtime-Activation":
            "false",

          "X-HBCE-Legal-Certification":
            "false",
        },
      },
    );
  }
}
