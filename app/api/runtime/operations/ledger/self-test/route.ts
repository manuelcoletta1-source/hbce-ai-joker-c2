import { NextResponse } from "next/server";

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
  buildRuntimeOperationsLedgerEntry,
  verifyRuntimeOperationsLedgerEntry,
  verifyRuntimeOperationsLedgerChain,
  type RuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger";

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

function buildSourceInput(
  generatedAt: string,
): RuntimeOperationsEvidenceInput {
  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_SELF_TEST_PASS",

    operationalStatus:
      "PASS",

    revision:
      "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_3",

    generatedAt,

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "DETERMINISTIC_RUNTIME_OPERATIONS_LEDGER_SELF_TEST",

      externalEffects:
        false,

      runtimeActivation:
        false,

      autonomousExecution:
        false,

      submission:
        false,
    },

    summary: {
      totalChecks:
        16,

      passedChecks:
        16,

      failedChecks:
        0,

      requiredChecks:
        16,

      requiredPassed:
        16,

      requiredFailed:
        0,
    },

    checks: [
      {
        id:
          "OPS-LEDGER-SOURCE-001",

        description:
          "Synthetic verified operations source",

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

function buildVerifiedArtifacts(
  generatedAt: string,
) {
  const sourceInput =
    buildSourceInput(
      generatedAt,
    );

  const evidence =
    buildRuntimeOperationsEvidence(
      sourceInput,
    );

  const envelope =
    buildRuntimeOperationsOpcEnvelope({
      evidence,
    });

  const verification =
    verifyRuntimeOperationsOpcEnvelope({
      sourceInput,
      evidence,
      envelope,
    });

  return {
    sourceInput,
    evidence,
    envelope,
    verification,
  };
}

function cloneLedgerEntry(
  entry: RuntimeOperationsLedgerEntry,
): RuntimeOperationsLedgerEntry {
  return JSON.parse(
    JSON.stringify(
      entry,
    ),
  ) as RuntimeOperationsLedgerEntry;
}

export async function GET() {
  const generatedAt =
    new Date().toISOString();

  const checks: Check[] = [];

  /*
   * STEP 1
   * Build first verified evidence chain.
   */
  const firstArtifacts =
    buildVerifiedArtifacts(
      generatedAt,
    );

  checks.push(
    check(
      "LEDGER-PROD-001",
      "First OPC envelope verification passes",
      true,
      firstArtifacts
        .verification
        .verified,
    ),
  );

  /*
   * STEP 2
   * Build genesis ledger entry.
   */
  const genesis =
    buildRuntimeOperationsLedgerEntry({
      sequence:
        1,

      envelope:
        firstArtifacts
          .envelope,

      verification:
        firstArtifacts
          .verification,

      previousEntry:
        null,
    });

  checks.push(
    check(
      "LEDGER-PROD-002",
      "Genesis sequence is one",
      1,
      genesis.sequence,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-003",
      "Genesis previous entry hash is null",
      null,
      genesis.chain
        .previousEntrySha256,
    ),
  );

  const genesisVerification =
    verifyRuntimeOperationsLedgerEntry({
      entry:
        genesis,

      previousEntry:
        null,
    });

  checks.push(
    check(
      "LEDGER-PROD-004",
      "Genesis entry verification passes",
      true,
      genesisVerification
        .verified,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-005",
      "Genesis ledger verification has zero failures",
      0,
      genesisVerification
        .summary
        .failedChecks,
    ),
  );

  /*
   * STEP 3
   * Build second verified evidence chain.
   *
   * The timestamp differs deliberately so
   * evidence and entry hashes must differ.
   */
  const secondGeneratedAt =
    new Date(
      new Date(
        generatedAt,
      ).getTime() + 1,
    ).toISOString();

  const secondArtifacts =
    buildVerifiedArtifacts(
      secondGeneratedAt,
    );

  checks.push(
    check(
      "LEDGER-PROD-006",
      "Second OPC envelope verification passes",
      true,
      secondArtifacts
        .verification
        .verified,
    ),
  );

  /*
   * STEP 4
   * Append second ledger entry.
   */
  const second =
    buildRuntimeOperationsLedgerEntry({
      sequence:
        2,

      envelope:
        secondArtifacts
          .envelope,

      verification:
        secondArtifacts
          .verification,

      previousEntry:
        genesis,
    });

  checks.push(
    check(
      "LEDGER-PROD-007",
      "Second entry sequence is two",
      2,
      second.sequence,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-008",
      "Second entry binds genesis SHA-256",
      genesis.chain
        .entrySha256,
      second.chain
        .previousEntrySha256,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-009",
      "Second entry SHA-256 differs from genesis",
      false,
      second.chain
        .entrySha256 ===
        genesis.chain
          .entrySha256,
    ),
  );

  /*
   * STEP 5
   * Verify complete legitimate chain.
   */
  const validChainVerification =
    verifyRuntimeOperationsLedgerChain([
      genesis,
      second,
    ]);

  checks.push(
    check(
      "LEDGER-PROD-010",
      "Two-entry ledger chain verifies",
      true,
      validChainVerification
        .verified,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-011",
      "Two-entry ledger has zero failed entries",
      0,
      validChainVerification
        .failedEntries,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-012",
      "Two-entry ledger verified entries equal two",
      2,
      validChainVerification
        .verifiedEntries,
    ),
  );

  /*
   * STEP 6
   * Deliberately tamper with the second entry.
   *
   * This does not touch persistent storage.
   * It operates only on an in-memory clone.
   */
  const tamperedSecond =
    cloneLedgerEntry(
      second,
    );

  tamperedSecond.source
    .operationalStatus =
    "TAMPERED";

  const tamperedEntryVerification =
    verifyRuntimeOperationsLedgerEntry({
      entry:
        tamperedSecond,

      previousEntry:
        genesis,
    });

  checks.push(
    check(
      "LEDGER-PROD-013",
      "Tampered entry is rejected",
      false,
      tamperedEntryVerification
        .verified,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-014",
      "Tampered entry triggers FAIL_CLOSED",
      "FAIL_CLOSED",
      tamperedEntryVerification
        .operationalStatus,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-015",
      "Tampered entry produces verification failures",
      true,
      tamperedEntryVerification
        .summary
        .failedChecks > 0,
    ),
  );

  /*
   * STEP 7
   * Verify a chain containing the tampered entry.
   */
  const tamperedChainVerification =
    verifyRuntimeOperationsLedgerChain([
      genesis,
      tamperedSecond,
    ]);

  checks.push(
    check(
      "LEDGER-PROD-016",
      "Tampered ledger chain is rejected",
      false,
      tamperedChainVerification
        .verified,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-017",
      "Tampered ledger chain triggers FAIL_CLOSED",
      "FAIL_CLOSED",
      tamperedChainVerification
        .operationalStatus,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-018",
      "Tampered ledger reports failed entry",
      true,
      tamperedChainVerification
        .failedEntries > 0,
    ),
  );

  /*
   * STEP 8
   * Governance invariants.
   */
  checks.push(
    check(
      "LEDGER-PROD-019",
      "Append-only governance remains enabled",
      true,
      genesis.governance
        .appendOnly,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-020",
      "Hash-only evidence governance remains enabled",
      true,
      genesis.governance
        .hashOnlyEvidence,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-021",
      "Human authorization remains required",
      true,
      genesis.governance
        .humanAuthorizationRequired,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-022",
      "Autonomous authorization remains disabled",
      false,
      genesis.governance
        .autonomousAuthorization,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-023",
      "Runtime activation remains disabled",
      false,
      genesis.governance
        .runtimeActivation,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-024",
      "NO_SUBMIT_FROM_CODE remains enabled",
      true,
      genesis.governance
        .noSubmitFromCode,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-025",
      "Legal certification remains disabled",
      false,
      genesis.governance
        .legalCertification,
    ),
  );

  checks.push(
    check(
      "LEDGER-PROD-026",
      "Qualified electronic signature claim remains disabled",
      false,
      genesis.governance
        .qualifiedElectronicSignature,
    ),
  );

  const passedChecks =
    checks.filter(
      (item) => item.passed,
    ).length;

  const failedChecks =
    checks.length -
    passedChecks;

  const requiredChecks =
    checks.length;

  const operationalStatus =
    failedChecks === 0
      ? "PASS"
      : "FAIL_CLOSED";

  const body = {
    ok:
      failedChecks === 0,

    status:
      failedChecks === 0
        ? "HBCE_RUNTIME_OPERATIONS_LEDGER_SELF_TEST_PASS"
        : "HBCE_RUNTIME_OPERATIONS_LEDGER_SELF_TEST_FAIL",

    operationalStatus,

    revision:
      "HBCE-RUNTIME-OPERATIONS-LEDGER-SELF-TEST-v1_0",

    generatedAt,

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "DETERMINISTIC_APPEND_ONLY_LEDGER_AND_TAMPER_DETECTION_SELF_TEST",

      persistence:
        false,

      externalEffects:
        false,

      runtimeActivation:
        false,

      autonomousExecution:
        false,

      submission:
        false,

      deliberateTamperSimulation:
        true,
    },

    summary: {
      totalChecks:
        checks.length,

      passedChecks,

      failedChecks,

      requiredChecks,

      requiredPassed:
        passedChecks,

      requiredFailed:
        failedChecks,
    },

    checks,

    genesis: {
      sequence:
        genesis.sequence,

      evidenceSha256:
        genesis.source
          .evidenceSha256,

      envelopeSha256:
        genesis.source
          .envelopeSha256,

      entrySha256:
        genesis.chain
          .entrySha256,

      chainRootSha256:
        genesis.chain
          .chainRootSha256,

      previousEntrySha256:
        genesis.chain
          .previousEntrySha256,

      verified:
        genesisVerification
          .verified,
    },

    secondEntry: {
      sequence:
        second.sequence,

      evidenceSha256:
        second.source
          .evidenceSha256,

      envelopeSha256:
        second.source
          .envelopeSha256,

      entrySha256:
        second.chain
          .entrySha256,

      chainRootSha256:
        second.chain
          .chainRootSha256,

      previousEntrySha256:
        second.chain
          .previousEntrySha256,
    },

    validChain: {
      verified:
        validChainVerification
          .verified,

      operationalStatus:
        validChainVerification
          .operationalStatus,

      totalEntries:
        validChainVerification
          .totalEntries,

      verifiedEntries:
        validChainVerification
          .verifiedEntries,

      failedEntries:
        validChainVerification
          .failedEntries,
    },

    tamperTest: {
      simulation:
        "SECOND_ENTRY_OPERATIONAL_STATUS_MUTATION",

      originalValue:
        second.source
          .operationalStatus,

      tamperedValue:
        tamperedSecond.source
          .operationalStatus,

      entryVerified:
        tamperedEntryVerification
          .verified,

      entryOperationalStatus:
        tamperedEntryVerification
          .operationalStatus,

      entryFailedChecks:
        tamperedEntryVerification
          .summary
          .failedChecks,

      chainVerified:
        tamperedChainVerification
          .verified,

      chainOperationalStatus:
        tamperedChainVerification
          .operationalStatus,

      failedEntries:
        tamperedChainVerification
          .failedEntries,

      tamperDetected:
        !tamperedEntryVerification
          .verified &&
        !tamperedChainVerification
          .verified,
    },

    governance: {
      appendOnly:
        true,

      hashOnlyEvidence:
        true,

      failClosed:
        failedChecks > 0,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromSelfTest:
        false,

      persistenceFromSelfTest:
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
        failedChecks === 0
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
          "HBCE-RUNTIME-OPERATIONS-LEDGER-SELF-TEST-v1_0",

        "X-HBCE-Ledger":
          failedChecks === 0
            ? "PASS"
            : "FAIL_CLOSED",

        "X-HBCE-Ledger-Checks":
          String(
            checks.length,
          ),

        "X-HBCE-Ledger-Passed":
          String(
            passedChecks,
          ),

        "X-HBCE-Ledger-Failed":
          String(
            failedChecks,
          ),

        "X-HBCE-Genesis-Entry-SHA256":
          genesis.chain
            .entrySha256,

        "X-HBCE-Chain-Root-SHA256":
          second.chain
            .chainRootSha256,

        "X-HBCE-Tamper-Detection":
          !tamperedEntryVerification
              .verified &&
          !tamperedChainVerification
              .verified
            ? "PASS"
            : "FAIL",

        "X-HBCE-Persistence":
          "false",

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
