import {
  sha256Hex,
  stableStringify,
} from "./runtime-operations-evidence";

import type {
  RuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-envelope";

import type {
  RuntimeOperationsOpcVerificationResult,
} from "./runtime-operations-opc-verifier";

export type RuntimeOperationsLedgerEntry = {
  entryType:
    "HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY";

  revision:
    "HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0";

  sequence: number;

  identity: {
    runtimeIpr: "IPR-AI-0001";
    humanAuthorityIpr: "IPR-3";
    organization: "HERMETICUM B.C.E. S.r.l.";
  };

  source: {
    evidenceRevision: string;
    evidenceSha256: string;

    envelopeRevision: string;
    envelopeSha256: string;

    internalSeal: string;

    eventType:
      "RUNTIME_OPERATIONS_GOVERNANCE_EVIDENCE";

    sourceRevision: string;
    sourceGeneratedAt: string;

    operationalStatus: string;
  };

  verification: {
    verifierRevision: string;
    verified: true;
    totalChecks: number;
    passedChecks: number;
    failedChecks: 0;
  };

  chain: {
    previousEntrySha256: string | null;

    entrySha256: string;

    chainRootSha256: string;
  };

  governance: {
    appendOnly: true;
    hashOnlyEvidence: true;

    humanAuthorizationRequired: true;

    autonomousAuthorization: false;

    runtimeActivation: false;

    noSubmitFromCode: true;

    legalCertification: false;

    qualifiedElectronicSignature: false;
  };
};

export type RuntimeOperationsLedgerVerificationCheck = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

export type RuntimeOperationsLedgerVerificationResult = {
  verificationType:
    "HBCE_RUNTIME_OPERATIONS_LEDGER_VERIFICATION";

  revision:
    "HBCE-RUNTIME-OPERATIONS-LEDGER-VERIFIER-v1_0";

  verified: boolean;

  operationalStatus:
    | "PASS"
    | "FAIL_CLOSED";

  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };

  checks:
    RuntimeOperationsLedgerVerificationCheck[];

  chain: {
    expectedPreviousEntrySha256:
      | string
      | null;

    actualPreviousEntrySha256:
      | string
      | null;

    expectedEntrySha256: string;
    actualEntrySha256: string;

    expectedChainRootSha256: string;
    actualChainRootSha256: string;
  };

  governance: {
    failClosed: boolean;

    appendOnly: true;

    humanAuthorizationRequired: true;

    autonomousAuthorization: false;

    runtimeActivationFromVerification: false;

    noSubmitFromCode: true;

    legalCertification: false;
  };
};

export type BuildRuntimeOperationsLedgerEntryInput = {
  sequence: number;

  envelope:
    RuntimeOperationsOpcEnvelope;

  verification:
    RuntimeOperationsOpcVerificationResult;

  previousEntry?:
    RuntimeOperationsLedgerEntry | null;
};

function assertValidSequence(
  sequence: number,
): void {
  if (
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  ) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_INVALID_SEQUENCE",
    );
  }
}

function assertVerifiedEnvelope(
  verification:
    RuntimeOperationsOpcVerificationResult,
): void {
  if (
    verification.verified !== true ||
    verification.operationalStatus !==
      "PASS" ||
    verification.summary.failedChecks !==
      0
  ) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_UNVERIFIED_ENVELOPE",
    );
  }
}

function assertPreviousEntryConsistency(
  sequence: number,
  previousEntry:
    RuntimeOperationsLedgerEntry | null,
): void {
  if (sequence === 1) {
    if (previousEntry !== null) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_LEDGER_GENESIS_PREVIOUS_ENTRY_FORBIDDEN",
      );
    }

    return;
  }

  if (!previousEntry) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_PREVIOUS_ENTRY_REQUIRED",
    );
  }

  if (
    previousEntry.sequence !==
    sequence - 1
  ) {
    throw new Error(
      "HBCE_RUNTIME_OPERATIONS_LEDGER_SEQUENCE_DISCONTINUITY",
    );
  }
}

function buildCanonicalEntryPayload(
  input: {
    sequence: number;

    identity:
      RuntimeOperationsLedgerEntry["identity"];

    source:
      RuntimeOperationsLedgerEntry["source"];

    verification:
      RuntimeOperationsLedgerEntry["verification"];

    previousEntrySha256:
      string | null;

    governance:
      RuntimeOperationsLedgerEntry["governance"];
  },
): Record<string, unknown> {
  return {
    sequence:
      input.sequence,

    identity:
      input.identity,

    source:
      input.source,

    verification:
      input.verification,

    chain: {
      previousEntrySha256:
        input.previousEntrySha256,
    },

    governance:
      input.governance,
  };
}

function calculateEntrySha256(
  input: {
    sequence: number;

    identity:
      RuntimeOperationsLedgerEntry["identity"];

    source:
      RuntimeOperationsLedgerEntry["source"];

    verification:
      RuntimeOperationsLedgerEntry["verification"];

    previousEntrySha256:
      string | null;

    governance:
      RuntimeOperationsLedgerEntry["governance"];
  },
): string {
  return sha256Hex(
    stableStringify(
      buildCanonicalEntryPayload(
        input,
      ),
    ),
  );
}

function calculateChainRootSha256(
  previousEntry:
    RuntimeOperationsLedgerEntry | null,
  entrySha256: string,
): string {
  if (!previousEntry) {
    return sha256Hex(
      stableStringify({
        genesis:
          true,

        entrySha256,
      }),
    );
  }

  return sha256Hex(
    stableStringify({
      genesis:
        false,

      previousChainRootSha256:
        previousEntry.chain
          .chainRootSha256,

      previousEntrySha256:
        previousEntry.chain
          .entrySha256,

      entrySha256,
    }),
  );
}

export function buildRuntimeOperationsLedgerEntry(
  input:
    BuildRuntimeOperationsLedgerEntryInput,
): RuntimeOperationsLedgerEntry {
  assertValidSequence(
    input.sequence,
  );

  assertVerifiedEnvelope(
    input.verification,
  );

  const previousEntry =
    input.previousEntry ?? null;

  assertPreviousEntryConsistency(
    input.sequence,
    previousEntry,
  );

  const identity = {
    runtimeIpr:
      input.envelope.identity
        .runtimeIpr,

    humanAuthorityIpr:
      input.envelope.identity
        .humanAuthorityIpr,

    organization:
      input.envelope.identity
        .organization,
  };

  const source = {
    evidenceRevision:
      input.envelope.opc
        .evidenceRevision,

    evidenceSha256:
      input.envelope.opc
        .evidenceSha256,

    envelopeRevision:
      input.envelope.revision,

    envelopeSha256:
      input.envelope.integrity
        .envelopeSha256,

    internalSeal:
      input.envelope.internalSeal
        .value,

    eventType:
      input.envelope.event
        .eventType,

    sourceRevision:
      input.envelope.event
        .sourceRevision,

    sourceGeneratedAt:
      input.envelope.event
        .sourceGeneratedAt,

    operationalStatus:
      input.envelope.event
        .operationalStatus,
  };

  const verification = {
    verifierRevision:
      input.verification.revision,

    verified:
      true as const,

    totalChecks:
      input.verification.summary
        .totalChecks,

    passedChecks:
      input.verification.summary
        .passedChecks,

    failedChecks:
      0 as const,
  };

  const governance = {
    appendOnly:
      true as const,

    hashOnlyEvidence:
      true as const,

    humanAuthorizationRequired:
      true as const,

    autonomousAuthorization:
      false as const,

    runtimeActivation:
      false as const,

    noSubmitFromCode:
      true as const,

    legalCertification:
      false as const,

    qualifiedElectronicSignature:
      false as const,
  };

  const previousEntrySha256 =
    previousEntry
      ? previousEntry.chain
          .entrySha256
      : null;

  const entrySha256 =
    calculateEntrySha256({
      sequence:
        input.sequence,

      identity,

      source,

      verification,

      previousEntrySha256,

      governance,
    });

  const chainRootSha256 =
    calculateChainRootSha256(
      previousEntry,
      entrySha256,
    );

  return {
    entryType:
      "HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY",

    revision:
      "HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0",

    sequence:
      input.sequence,

    identity,

    source,

    verification,

    chain: {
      previousEntrySha256,

      entrySha256,

      chainRootSha256,
    },

    governance,
  };
}

function verificationCheck(
  id: string,
  description: string,
  expected: unknown,
  actual: unknown,
): RuntimeOperationsLedgerVerificationCheck {
  return {
    id,
    description,

    passed:
      Object.is(
        expected,
        actual,
      ),

    expected,
    actual,
  };
}

export function verifyRuntimeOperationsLedgerEntry(
  input: {
    entry:
      RuntimeOperationsLedgerEntry;

    previousEntry?:
      RuntimeOperationsLedgerEntry | null;
  },
): RuntimeOperationsLedgerVerificationResult {
  const previousEntry =
    input.previousEntry ?? null;

  const entry =
    input.entry;

  const expectedPreviousEntrySha256 =
    previousEntry
      ? previousEntry.chain
          .entrySha256
      : null;

  const actualPreviousEntrySha256 =
    entry.chain
      .previousEntrySha256;

  const expectedEntrySha256 =
    calculateEntrySha256({
      sequence:
        entry.sequence,

      identity:
        entry.identity,

      source:
        entry.source,

      verification:
        entry.verification,

      previousEntrySha256:
        actualPreviousEntrySha256,

      governance:
        entry.governance,
    });

  const actualEntrySha256 =
    entry.chain
      .entrySha256;

  const expectedChainRootSha256 =
    calculateChainRootSha256(
      previousEntry,
      expectedEntrySha256,
    );

  const actualChainRootSha256 =
    entry.chain
      .chainRootSha256;

  const checks:
    RuntimeOperationsLedgerVerificationCheck[] =
    [];

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-001",
      "Ledger entry revision is canonical",
      "HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0",
      entry.revision,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-002",
      "Ledger entry type is canonical",
      "HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY",
      entry.entryType,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-003",
      "Previous entry hash binding is valid",
      expectedPreviousEntrySha256,
      actualPreviousEntrySha256,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-004",
      "Entry SHA-256 matches canonical entry payload",
      expectedEntrySha256,
      actualEntrySha256,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-005",
      "Chain root SHA-256 matches canonical chain state",
      expectedChainRootSha256,
      actualChainRootSha256,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-006",
      "Runtime IPR is canonical",
      "IPR-AI-0001",
      entry.identity
        .runtimeIpr,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-007",
      "Human authority IPR is canonical",
      "IPR-3",
      entry.identity
        .humanAuthorityIpr,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-008",
      "Organization binding is canonical",
      "HERMETICUM B.C.E. S.r.l.",
      entry.identity
        .organization,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-009",
      "Verification status remains true",
      true,
      entry.verification
        .verified,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-010",
      "Verification failed checks remain zero",
      0,
      entry.verification
        .failedChecks,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-011",
      "Append-only invariant remains enabled",
      true,
      entry.governance
        .appendOnly,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-012",
      "Hash-only evidence invariant remains enabled",
      true,
      entry.governance
        .hashOnlyEvidence,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-013",
      "Human authorization remains required",
      true,
      entry.governance
        .humanAuthorizationRequired,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-014",
      "Autonomous authorization remains disabled",
      false,
      entry.governance
        .autonomousAuthorization,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-015",
      "Runtime activation remains disabled",
      false,
      entry.governance
        .runtimeActivation,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-016",
      "NO_SUBMIT_FROM_CODE remains enabled",
      true,
      entry.governance
        .noSubmitFromCode,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-017",
      "Legal certification remains disabled",
      false,
      entry.governance
        .legalCertification,
    ),
  );

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-018",
      "Qualified electronic signature claim remains disabled",
      false,
      entry.governance
        .qualifiedElectronicSignature,
    ),
  );

  if (entry.sequence === 1) {
    checks.push(
      verificationCheck(
        "LEDGER-VERIFY-019",
        "Genesis entry has no previous entry hash",
        null,
        entry.chain
          .previousEntrySha256,
      ),
    );
  } else {
    checks.push(
      verificationCheck(
        "LEDGER-VERIFY-019",
        "Non-genesis entry has previous entry hash",
        true,
        typeof entry.chain
          .previousEntrySha256 ===
          "string" &&
          entry.chain
            .previousEntrySha256
            .length === 64,
      ),
    );
  }

  checks.push(
    verificationCheck(
      "LEDGER-VERIFY-020",
      "Sequence is a positive safe integer",
      true,
      Number.isSafeInteger(
        entry.sequence,
      ) &&
        entry.sequence > 0,
    ),
  );

  const passedChecks =
    checks.filter(
      (item) => item.passed,
    ).length;

  const failedChecks =
    checks.length -
    passedChecks;

  const verified =
    failedChecks === 0;

  return {
    verificationType:
      "HBCE_RUNTIME_OPERATIONS_LEDGER_VERIFICATION",

    revision:
      "HBCE-RUNTIME-OPERATIONS-LEDGER-VERIFIER-v1_0",

    verified,

    operationalStatus:
      verified
        ? "PASS"
        : "FAIL_CLOSED",

    summary: {
      totalChecks:
        checks.length,

      passedChecks,

      failedChecks,
    },

    checks,

    chain: {
      expectedPreviousEntrySha256,

      actualPreviousEntrySha256,

      expectedEntrySha256,

      actualEntrySha256,

      expectedChainRootSha256,

      actualChainRootSha256,
    },

    governance: {
      failClosed:
        !verified,

      appendOnly:
        true,

      humanAuthorizationRequired:
        true,

      autonomousAuthorization:
        false,

      runtimeActivationFromVerification:
        false,

      noSubmitFromCode:
        true,

      legalCertification:
        false,
    },
  };
}

export function verifyRuntimeOperationsLedgerChain(
  entries:
    RuntimeOperationsLedgerEntry[],
): {
  verified: boolean;

  operationalStatus:
    | "PASS"
    | "FAIL_CLOSED";

  totalEntries: number;

  verifiedEntries: number;

  failedEntries: number;

  results:
    RuntimeOperationsLedgerVerificationResult[];

  governance: {
    failClosed: boolean;
    appendOnly: true;
    humanAuthorizationRequired: true;
    autonomousAuthorization: false;
    runtimeActivation: false;
    noSubmitFromCode: true;
    legalCertification: false;
  };
} {
  if (entries.length === 0) {
    return {
      verified:
        true,

      operationalStatus:
        "PASS",

      totalEntries:
        0,

      verifiedEntries:
        0,

      failedEntries:
        0,

      results:
        [],

      governance: {
        failClosed:
          false,

        appendOnly:
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
      },
    };
  }

  const results:
    RuntimeOperationsLedgerVerificationResult[] =
    [];

  for (
    let index = 0;
    index < entries.length;
    index += 1
  ) {
    const entry =
      entries[index];

    const previousEntry =
      index === 0
        ? null
        : entries[index - 1];

    /*
     * Sequence continuity is verified here
     * separately from the entry-level hash
     * verification.
     */
    const expectedSequence =
      index + 1;

    if (
      entry.sequence !==
      expectedSequence
    ) {
      results.push({
        verificationType:
          "HBCE_RUNTIME_OPERATIONS_LEDGER_VERIFICATION",

        revision:
          "HBCE-RUNTIME-OPERATIONS-LEDGER-VERIFIER-v1_0",

        verified:
          false,

        operationalStatus:
          "FAIL_CLOSED",

        summary: {
          totalChecks:
            1,

          passedChecks:
            0,

          failedChecks:
            1,
        },

        checks: [
          {
            id:
              "LEDGER-VERIFY-SEQUENCE",

            description:
              "Ledger sequence continuity",

            passed:
              false,

            expected:
              expectedSequence,

            actual:
              entry.sequence,
          },
        ],

        chain: {
          expectedPreviousEntrySha256:
            previousEntry
              ? previousEntry.chain
                  .entrySha256
              : null,

          actualPreviousEntrySha256:
            entry.chain
              .previousEntrySha256,

          expectedEntrySha256:
            entry.chain
              .entrySha256,

          actualEntrySha256:
            entry.chain
              .entrySha256,

          expectedChainRootSha256:
            entry.chain
              .chainRootSha256,

          actualChainRootSha256:
            entry.chain
              .chainRootSha256,
        },

        governance: {
          failClosed:
            true,

          appendOnly:
            true,

          humanAuthorizationRequired:
            true,

          autonomousAuthorization:
            false,

          runtimeActivationFromVerification:
            false,

          noSubmitFromCode:
            true,

          legalCertification:
            false,
        },
      });

      continue;
    }

    results.push(
      verifyRuntimeOperationsLedgerEntry({
        entry,
        previousEntry,
      }),
    );
  }

  const verifiedEntries =
    results.filter(
      (result) =>
        result.verified,
    ).length;

  const failedEntries =
    results.length -
    verifiedEntries;

  const verified =
    failedEntries === 0;

  return {
    verified,

    operationalStatus:
      verified
        ? "PASS"
        : "FAIL_CLOSED",

    totalEntries:
      entries.length,

    verifiedEntries,

    failedEntries,

    results,

    governance: {
      failClosed:
        !verified,

      appendOnly:
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
    },
  };
}
