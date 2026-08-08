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
  appendVerifiedRuntimeOperationsLedgerEntry,
  getLatestRuntimeOperationsLedgerEntry,
  getRuntimeOperationsLedgerEntryBySequence,
  listRuntimeOperationsLedgerEntries,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

import {
  verifyRuntimeOperationsLedgerEntry,
  type RuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-OPERATIONS-PERSISTENT-CONTINUITY-SELF-TEST-v1_1" as const;

const MANUAL_AUTHORIZATION_HEADER =
  "x-hbce-ledger-self-test-token" as const;

const REQUIRED_START_SEQUENCE =
  1 as const;

const REQUIRED_FINAL_SEQUENCE =
  2 as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const HERMETICUM_SIGIL_CODEPOINT =
  "U+1F70F" as const;

type Check = {
  id: string;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

type ChainVerificationEntry = {
  sequence: number;
  verified: boolean;
  failedChecks: number;
  sequenceContinuity: boolean;
  previousHashBinding: boolean;
  entrySha256: string;
  previousEntrySha256: string | null;
  chainRootSha256: string;
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

function commonHeaders(
  persistence:
    | "false"
    | "true"
    | "FAIL_CLOSED",
) {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "X-HBCE-Revision":
      REVISION,

    "X-HBCE-Persistence":
      persistence,

    "X-HBCE-Runtime-Activation":
      "false",

    "X-HBCE-Autonomous-Authorization":
      "false",

    "X-HBCE-No-Submit-From-Code":
      "true",

    "X-HBCE-Legal-Certification":
      "false",

    "X-HBCE-Qualified-Electronic-Signature":
      "false",

    /*
     * HTTP header values must remain ByteString/ASCII-safe in the
     * Fetch/Next.js Headers implementation. The canonical 🜏 marker
     * remains in JSON and persisted data; headers expose its code point.
     */
    "X-HBCE-Hermeticum-Sigil-Codepoint":
      HERMETICUM_SIGIL_CODEPOINT,
  };
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

function unauthorized(
  reason: string,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_UNAUTHORIZED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      reason,

      governance: {
        persistenceExecuted:
          false,

        persistenceAttempted:
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
        ...commonHeaders(
          "false",
        ),

        "X-HBCE-Authorization":
          "REJECTED",
      },
    },
  );
}

function preconditionFailClosed(
  generatedAt: string,
  reason: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_PRECONDITION_FAIL_CLOSED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      generatedAt,

      reason,

      details:
        details ?? null,

      governance: {
        persistenceExecuted:
          false,

        persistenceAttempted:
          false,

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
        409,

      headers: {
        ...commonHeaders(
          "false",
        ),

        "X-HBCE-Authorization":
          "MANUAL_AUTHORIZATION_ACCEPTED",

        "X-HBCE-Continuity-Precondition":
          "REJECTED",
      },
    },
  );
}

function buildContinuitySourceInput(
  generatedAt: string,
  genesisEntrySha256: string,
  genesisChainRootSha256: string,
): RuntimeOperationsEvidenceInput {
  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SOURCE_PASS",

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
        "MANUALLY_AUTHORIZED_PERSISTENT_LEDGER_SEQUENCE_2_CONTINUITY_PROOF",

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
          "CONTINUITY-SOURCE-001",

        description:
          "Sequence 2 continuity source is manually authorized and canonical",

        passed:
          true,

        expected:
          `SEQUENCE_1_TO_SEQUENCE_2:${genesisEntrySha256}:${genesisChainRootSha256}`,

        actual:
          `SEQUENCE_1_TO_SEQUENCE_2:${genesisEntrySha256}:${genesisChainRootSha256}`,
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

function verifyPersistentChain(
  entries: RuntimeOperationsLedgerEntry[],
): {
  verified: boolean;
  totalFailedChecks: number;
  sequenceContinuityVerified: boolean;
  previousHashBindingsVerified: boolean;
  entries: ChainVerificationEntry[];
} {
  const details:
    ChainVerificationEntry[] =
    [];

  let previousEntry:
    RuntimeOperationsLedgerEntry | null =
    null;

  let totalFailedChecks =
    0;

  let sequenceContinuityVerified =
    true;

  let previousHashBindingsVerified =
    true;

  let allEntriesVerified =
    true;

  for (
    let index = 0;
    index < entries.length;
    index += 1
  ) {
    const entry =
      entries[index];

    const expectedSequence =
      index + 1;

    const sequenceContinuity =
      entry.sequence ===
      expectedSequence;

    const expectedPreviousHash =
      previousEntry === null
        ? null
        : previousEntry.chain
            .entrySha256;

    const previousHashBinding =
      entry.chain
        .previousEntrySha256 ===
      expectedPreviousHash;

    const verification =
      verifyRuntimeOperationsLedgerEntry({
        entry,
        previousEntry,
      });

    const entryVerified =
      verification.verified ===
        true &&
      verification.summary
        .failedChecks === 0 &&
      sequenceContinuity &&
      previousHashBinding;

    totalFailedChecks +=
      verification.summary
        .failedChecks;

    if (!sequenceContinuity) {
      sequenceContinuityVerified =
        false;
    }

    if (!previousHashBinding) {
      previousHashBindingsVerified =
        false;
    }

    if (!entryVerified) {
      allEntriesVerified =
        false;
    }

    details.push({
      sequence:
        entry.sequence,

      verified:
        entryVerified,

      failedChecks:
        verification.summary
          .failedChecks,

      sequenceContinuity,

      previousHashBinding,

      entrySha256:
        entry.chain
          .entrySha256,

      previousEntrySha256:
        entry.chain
          .previousEntrySha256,

      chainRootSha256:
        entry.chain
          .chainRootSha256,
    });

    previousEntry =
      entry;
  }

  return {
    verified:
      allEntriesVerified &&
      totalFailedChecks === 0 &&
      sequenceContinuityVerified &&
      previousHashBindingsVerified,

    totalFailedChecks,

    sequenceContinuityVerified,

    previousHashBindingsVerified,

    entries:
      details,
  };
}

export async function GET() {
  try {
    const latest =
      await getLatestRuntimeOperationsLedgerEntry();

    const observedLatestSequence =
      latest?.entry
        .sequence ?? null;

    const eligible =
      observedLatestSequence ===
      REQUIRED_START_SEQUENCE;

    const completed =
      observedLatestSequence !== null &&
      observedLatestSequence >=
        REQUIRED_FINAL_SEQUENCE;

    const continuityState =
      completed
        ? "COMPLETE"
        : eligible
          ? "ELIGIBLE"
          : "MISSING_GENESIS";

    const status =
      completed
        ? "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_COMPLETE"
        : eligible
          ? "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_READY"
          : "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_PRECONDITION_FAIL_CLOSED";

    const operationalStatus =
      completed
        ? "PASS"
        : eligible
          ? "READY"
          : "FAIL_CLOSED";

    const message =
      completed
        ? "Sequence 2 already exists. The continuity proof is complete and POST is no longer eligible."
        : eligible
          ? "POST performs exactly one manually authorized persistent append and is accepted only when the current ledger tip is sequence 1."
          : "Genesis sequence 1 is required before the Sequence 2 continuity proof can be authorized.";

    return NextResponse.json(
      {
        ok:
          completed ||
          eligible,

        status,

        operationalStatus,

        revision:
          REVISION,

        method:
          "POST",

        readOnly:
          true,

        sideEffects:
          false,

        message,

        continuityState,

        precondition: {
          requiredCurrentSequence:
            REQUIRED_START_SEQUENCE,

          requiredResultSequence:
            REQUIRED_FINAL_SEQUENCE,

          observedLatestSequence,

          eligible,

          completed,
        },

        requirements: {
          environmentVariable:
            "HBCE_LEDGER_SELF_TEST_TOKEN",

          requestHeader:
            MANUAL_AUTHORIZATION_HEADER,

          minimumTokenLength:
            16,

          authorizationRequiredOnlyWhenEligible:
            true,
        },

        identity: {
          hermeticumSigil:
            HERMETICUM_SIGIL,

          hermeticumSigilCodepoint:
            HERMETICUM_SIGIL_CODEPOINT,
        },

        governance: {
          persistenceExecuted:
            false,

          persistenceAttempted:
            false,

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
          completed ||
          eligible
            ? 200
            : 409,

        headers: {
          ...commonHeaders(
            "false",
          ),

          "X-HBCE-Authorization":
            eligible
              ? "HUMAN_AUTHORIZATION_REQUIRED"
              : completed
                ? "NOT_REQUIRED_CONTINUITY_COMPLETE"
                : "PRECONDITION_NOT_MET",

          "X-HBCE-Continuity-State":
            continuityState,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_READ_FAIL_CLOSED",

        operationalStatus:
          "FAIL_CLOSED",

        revision:
          REVISION,

        readOnly:
          true,

        sideEffects:
          false,

        error: {
          name:
            error instanceof Error
              ? error.name
              : "UnknownError",

          message:
            error instanceof Error
              ? error.message
              : String(error),
        },

        governance: {
          persistenceExecuted:
            false,

          persistenceAttempted:
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
          500,

        headers: {
          ...commonHeaders(
            "false",
          ),

          "X-HBCE-Authorization":
            "NOT_EVALUATED",

          "X-HBCE-Continuity-State":
            "FAIL_CLOSED",
        },
      },
    );
  }
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
      "Manual continuity authorization token is invalid.",
    );
  }

  const generatedAt =
    new Date().toISOString();

  const checks:
    Check[] =
    [];

  let persistenceAttempted =
    false;

  let persistenceConfirmed =
    false;

  try {
    /*
     * 1. Preflight.
     *
     * This endpoint is intentionally one-shot.
     * It may create Sequence 2 only when the current persistent tip
     * is exactly Sequence 1.
     */
    const latestBefore =
      await getLatestRuntimeOperationsLedgerEntry();

    checks.push(
      check(
        "CONT-001",
        "Persistent ledger has an existing tip",
        true,
        latestBefore !== null,
      ),
    );

    if (!latestBefore) {
      return preconditionFailClosed(
        generatedAt,
        "Persistent ledger is empty. Genesis sequence 1 must exist before continuity proof.",
      );
    }

    checks.push(
      check(
        "CONT-002",
        "Current persistent tip is exactly sequence 1",
        REQUIRED_START_SEQUENCE,
        latestBefore.entry
          .sequence,
      ),
    );

    if (
      latestBefore.entry
        .sequence !==
      REQUIRED_START_SEQUENCE
    ) {
      return preconditionFailClosed(
        generatedAt,
        "Continuity proof is one-shot and requires the current persistent tip to be sequence 1.",
        {
          requiredCurrentSequence:
            REQUIRED_START_SEQUENCE,

          observedCurrentSequence:
            latestBefore.entry
              .sequence,

          persistenceExecuted:
            false,

          instruction:
            "Do not retry this endpoint after sequence 2 already exists.",
        },
      );
    }

    const genesis =
      latestBefore.entry;

    checks.push(
      check(
        "CONT-003",
        "Genesis previous-entry SHA-256 is null",
        null,
        genesis.chain
          .previousEntrySha256,
      ),
    );

    checks.push(
      check(
        "CONT-004",
        "Genesis Runtime IPR is canonical",
        "IPR-AI-0001",
        genesis.identity
          .runtimeIpr,
      ),
    );

    checks.push(
      check(
        "CONT-005",
        "Genesis human authority IPR is canonical",
        "IPR-3",
        genesis.identity
          .humanAuthorityIpr,
      ),
    );

    checks.push(
      check(
        "CONT-006",
        "Genesis organization is canonical",
        "HERMETICUM B.C.E. S.r.l.",
        genesis.identity
          .organization,
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
        "CONT-007",
        "Genesis independently verifies before append",
        true,
        genesisVerification
          .verified,
      ),
    );

    checks.push(
      check(
        "CONT-008",
        "Genesis verification has zero failures",
        0,
        genesisVerification
          .summary
          .failedChecks,
      ),
    );

    if (
      !genesisVerification
        .verified
    ) {
      return preconditionFailClosed(
        generatedAt,
        "Genesis entry failed independent verification before continuity append.",
        {
          sequence:
            genesis.sequence,

          failedChecks:
            genesisVerification
              .summary
              .failedChecks,
        },
      );
    }

    /*
     * 2. Build a fresh evidence receipt for the continuity event.
     *
     * generatedAt and the explicit Genesis bindings make this
     * continuity event cryptographically distinct from Sequence 1.
     */
    const sourceInput =
      buildContinuitySourceInput(
        generatedAt,
        genesis.chain
          .entrySha256,
        genesis.chain
          .chainRootSha256,
      );

    checks.push(
      check(
        "CONT-009",
        "Continuity source requires human authorization",
        true,
        sourceInput.governance
          .humanAuthorizationRequired,
      ),
    );

    checks.push(
      check(
        "CONT-010",
        "Continuity source disables autonomous authorization",
        false,
        sourceInput.governance
          .autonomousAuthorization,
      ),
    );

    const evidence =
      buildRuntimeOperationsEvidence(
        sourceInput,
      );

    checks.push(
      check(
        "CONT-011",
        "Continuity evidence verification passes",
        true,
        evidence.verification
          .allRequiredChecksPassed,
      ),
    );

    const envelope =
      buildRuntimeOperationsOpcEnvelope({
        evidence,
      });

    checks.push(
      check(
        "CONT-012",
        "Continuity envelope binds canonical Runtime IPR",
        "IPR-AI-0001",
        envelope.identity
          .runtimeIpr,
      ),
    );

    checks.push(
      check(
        "CONT-013",
        "Continuity envelope binds canonical human authority IPR",
        "IPR-3",
        envelope.identity
          .humanAuthorityIpr,
      ),
    );

    checks.push(
      check(
        "CONT-014",
        "Continuity envelope binds canonical organization",
        "HERMETICUM B.C.E. S.r.l.",
        envelope.identity
          .organization,
      ),
    );

    const opcVerification =
      verifyRuntimeOperationsOpcEnvelope({
        sourceInput,
        evidence,
        envelope,
      });

    checks.push(
      check(
        "CONT-015",
        "Continuity OPC/EVT independent verification passes",
        true,
        opcVerification
          .verified,
      ),
    );

    checks.push(
      check(
        "CONT-016",
        "Continuity OPC/EVT verification has zero failures",
        0,
        opcVerification
          .summary
          .failedChecks,
      ),
    );

    if (
      !opcVerification
        .verified
    ) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_OPC_VERIFICATION_FAILED",
      );
    }

    checks.push(
      check(
        "CONT-017",
        "Continuity evidence SHA-256 differs from Genesis evidence",
        true,
        evidence.integrity
          .sha256 !==
          genesis.source
            .evidenceSha256,
      ),
    );

    checks.push(
      check(
        "CONT-018",
        "Continuity envelope SHA-256 differs from Genesis envelope",
        true,
        envelope.integrity
          .envelopeSha256 !==
          genesis.source
            .envelopeSha256,
      ),
    );

    /*
     * 3. Real external effect.
     *
     * No retry occurs in this function.
     * Concurrent competing requests are resolved by the database
     * append lock + sequence continuity trigger.
     */
    persistenceAttempted =
      true;

    const persisted =
      await appendVerifiedRuntimeOperationsLedgerEntry({
        envelope,
        verification:
          opcVerification,
      });

    persistenceConfirmed =
      true;

    checks.push(
      check(
        "CONT-019",
        "Persisted continuity sequence is exactly 2",
        REQUIRED_FINAL_SEQUENCE,
        persisted.entry
          .sequence,
      ),
    );

    checks.push(
      check(
        "CONT-020",
        "Sequence 2 previous-entry SHA-256 binds Genesis entry SHA-256",
        genesis.chain
          .entrySha256,
        persisted.entry
          .chain
          .previousEntrySha256,
      ),
    );

    checks.push(
      check(
        "CONT-021",
        "Sequence 2 entry SHA-256 differs from Genesis entry SHA-256",
        true,
        persisted.entry
          .chain
          .entrySha256 !==
          genesis.chain
            .entrySha256,
      ),
    );

    checks.push(
      check(
        "CONT-022",
        "Sequence 2 chain root differs from Genesis chain root",
        true,
        persisted.entry
          .chain
          .chainRootSha256 !==
          genesis.chain
            .chainRootSha256,
      ),
    );

    /*
     * 4. Independent reread.
     */
    const rereadSequence2 =
      await getRuntimeOperationsLedgerEntryBySequence(
        REQUIRED_FINAL_SEQUENCE,
      );

    checks.push(
      check(
        "CONT-023",
        "Sequence 2 can be independently reread",
        true,
        rereadSequence2 !== null,
      ),
    );

    if (!rereadSequence2) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SEQUENCE_2_REREAD_MISSING",
      );
    }

    const rereadGenesis =
      await getRuntimeOperationsLedgerEntryBySequence(
        REQUIRED_START_SEQUENCE,
      );

    checks.push(
      check(
        "CONT-024",
        "Genesis can be independently reread after Sequence 2 append",
        true,
        rereadGenesis !== null,
      ),
    );

    if (!rereadGenesis) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_GENESIS_REREAD_MISSING",
      );
    }

    checks.push(
      check(
        "CONT-025",
        "Reread Sequence 2 entry SHA-256 matches persisted result",
        persisted.entry
          .chain
          .entrySha256,
        rereadSequence2.entry
          .chain
          .entrySha256,
      ),
    );

    checks.push(
      check(
        "CONT-026",
        "Reread Sequence 2 previous hash still binds Genesis",
        rereadGenesis.entry
          .chain
          .entrySha256,
        rereadSequence2.entry
          .chain
          .previousEntrySha256,
      ),
    );

    const sequence2Verification =
      verifyRuntimeOperationsLedgerEntry({
        entry:
          rereadSequence2.entry,

        previousEntry:
          rereadGenesis.entry,
      });

    checks.push(
      check(
        "CONT-027",
        "Sequence 2 independently verifies against Genesis",
        true,
        sequence2Verification
          .verified,
      ),
    );

    checks.push(
      check(
        "CONT-028",
        "Sequence 2 verification has zero failures",
        0,
        sequence2Verification
          .summary
          .failedChecks,
      ),
    );

    /*
     * 5. Full persistent two-entry chain verification.
     */
    const records =
      await listRuntimeOperationsLedgerEntries({
        limit:
          1000,

        afterSequence:
          0,
      });

    checks.push(
      check(
        "CONT-029",
        "Persistent ledger contains exactly two entries after continuity proof",
        REQUIRED_FINAL_SEQUENCE,
        records.length,
      ),
    );

    const latestAfter =
      await getLatestRuntimeOperationsLedgerEntry();

    checks.push(
      check(
        "CONT-030",
        "Persistent ledger has a tip after continuity append",
        true,
        latestAfter !== null,
      ),
    );

    if (!latestAfter) {
      throw new Error(
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_LATEST_ENTRY_MISSING",
      );
    }

    checks.push(
      check(
        "CONT-031",
        "Persistent ledger tip is exactly sequence 2",
        REQUIRED_FINAL_SEQUENCE,
        latestAfter.entry
          .sequence,
      ),
    );

    const chainEntries =
      records.map(
        (record) =>
          record.entry,
      );

    const chainVerification =
      verifyPersistentChain(
        chainEntries,
      );

    checks.push(
      check(
        "CONT-032",
        "Full persistent two-entry chain verifies",
        true,
        chainVerification
          .verified,
      ),
    );

    checks.push(
      check(
        "CONT-033",
        "Full persistent chain has zero cryptographic verification failures",
        0,
        chainVerification
          .totalFailedChecks,
      ),
    );

    checks.push(
      check(
        "CONT-034",
        "Persistent chain sequence continuity is verified",
        true,
        chainVerification
          .sequenceContinuityVerified,
      ),
    );

    checks.push(
      check(
        "CONT-035",
        "Persistent chain previous-hash bindings are verified",
        true,
        chainVerification
          .previousHashBindingsVerified,
      ),
    );

    checks.push(
      check(
        "CONT-036",
        "Sequence 2 preserves append-only governance",
        true,
        rereadSequence2.entry
          .governance
          .appendOnly,
      ),
    );

    checks.push(
      check(
        "CONT-037",
        "Sequence 2 preserves hash-only evidence governance",
        true,
        rereadSequence2.entry
          .governance
          .hashOnlyEvidence,
      ),
    );

    checks.push(
      check(
        "CONT-038",
        "Sequence 2 preserves mandatory human authorization",
        true,
        rereadSequence2.entry
          .governance
          .humanAuthorizationRequired,
      ),
    );

    checks.push(
      check(
        "CONT-039",
        "Sequence 2 keeps autonomous authorization disabled",
        false,
        rereadSequence2.entry
          .governance
          .autonomousAuthorization,
      ),
    );

    checks.push(
      check(
        "CONT-040",
        "Sequence 2 keeps runtime activation disabled",
        false,
        rereadSequence2.entry
          .governance
          .runtimeActivation,
      ),
    );

    checks.push(
      check(
        "CONT-041",
        "Sequence 2 keeps NO_SUBMIT_FROM_CODE enabled",
        true,
        rereadSequence2.entry
          .governance
          .noSubmitFromCode,
      ),
    );

    checks.push(
      check(
        "CONT-042",
        "Sequence 2 keeps legal certification disabled",
        false,
        rereadSequence2.entry
          .governance
          .legalCertification,
      ),
    );

    checks.push(
      check(
        "CONT-043",
        "Sequence 2 keeps qualified electronic signature claim disabled",
        false,
        rereadSequence2.entry
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
      persistenceConfirmed &&
      latestAfter.entry
        .sequence ===
        REQUIRED_FINAL_SEQUENCE &&
      chainVerification
        .verified;

    return NextResponse.json(
      {
        ok:
          completePass,

        status:
          completePass
            ? "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_PASS"
            : "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_FAIL",

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
            "MANUALLY_AUTHORIZED_PERSISTENT_LEDGER_SEQUENCE_2_CONTINUITY_PROOF",

          persistence:
            true,

          externalEffects:
            true,

          manualAuthorization:
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

        continuity: {
          genesis: {
            sequence:
              rereadGenesis.entry
                .sequence,

            entrySha256:
              rereadGenesis.entry
                .chain
                .entrySha256,

            chainRootSha256:
              rereadGenesis.entry
                .chain
                .chainRootSha256,
          },

          sequence2: {
            sequence:
              rereadSequence2.entry
                .sequence,

            hermeticumSigil:
              HERMETICUM_SIGIL,

            hermeticumSigilCodepoint:
              HERMETICUM_SIGIL_CODEPOINT,

            previousEntrySha256:
              rereadSequence2.entry
                .chain
                .previousEntrySha256,

            entrySha256:
              rereadSequence2.entry
                .chain
                .entrySha256,

            chainRootSha256:
              rereadSequence2.entry
                .chain
                .chainRootSha256,

            independentlyVerified:
              sequence2Verification
                .verified,
          },

          fullChain: {
            entryCount:
              records.length,

            genesisSequence:
              records[0]?.entry
                .sequence ?? null,

            latestSequence:
              latestAfter.entry
                .sequence,

            sequenceContinuityVerified:
              chainVerification
                .sequenceContinuityVerified,

            previousHashBindingsVerified:
              chainVerification
                .previousHashBindingsVerified,

            completeChainPassed:
              chainVerification
                .verified,

            totalFailedChecks:
              chainVerification
                .totalFailedChecks,

            entries:
              chainVerification
                .entries,
          },
        },

        persistence: {
          table:
            persisted.persistence
              .table,

          recordedAt:
            persisted.persistence
              .recordedAt,

          persistenceAttempted,

          persistenceConfirmed,

          reread:
            true,
        },

        governance: {
          failClosed:
            !completePass,

          persistenceExecuted:
            persistenceConfirmed,

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
          ...commonHeaders(
            persistenceConfirmed
              ? "true"
              : "FAIL_CLOSED",
          ),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Continuity":
            completePass
              ? "SEQUENCE_1_TO_2_PASS"
              : "FAIL_CLOSED",

          "X-HBCE-Persistence-Sequence":
            String(
              rereadSequence2.entry
                .sequence,
            ),

          "X-HBCE-Evidence-SHA256":
            evidence.integrity
              .sha256,

          "X-HBCE-Envelope-SHA256":
            envelope.integrity
              .envelopeSha256,

          "X-HBCE-Ledger-Entry-SHA256":
            rereadSequence2.entry
              .chain
              .entrySha256,

          "X-HBCE-Previous-Entry-SHA256":
            rereadSequence2.entry
              .chain
              .previousEntrySha256 ?? "",

          "X-HBCE-Chain-Root-SHA256":
            rereadSequence2.entry
              .chain
              .chainRootSha256,

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
        ok: false,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_CONTINUITY_SELF_TEST_FAIL",

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

          persistenceAttempted,

          persistenceConfirmed,

          persistenceMayHaveOccurred:
            persistenceAttempted &&
            !persistenceConfirmed,

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
          ...commonHeaders(
            persistenceAttempted
              ? "FAIL_CLOSED"
              : "false",
          ),

          "X-HBCE-Authorization":
            "MANUAL_AUTHORIZATION_ACCEPTED",

          "X-HBCE-Continuity":
            "FAIL_CLOSED",
        },
      },
    );
  }
}
