import { NextResponse } from "next/server";

import {
  getLatestRuntimeOperationsLedgerEntry,
  listRuntimeOperationsLedgerEntries,
} from "@/src/runtime/operations/runtime-operations-ledger-repository";

import {
  verifyRuntimeOperationsLedgerEntry,
  type RuntimeOperationsLedgerEntry,
} from "@/src/runtime/operations/runtime-operations-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISION =
  "HBCE-RUNTIME-OPERATIONS-PERSISTENT-LEDGER-VERIFY-v1_0" as const;

const HERMETICUM_SIGIL =
  "🜏" as const;

const MAX_VERIFICATION_ENTRIES =
  1000 as const;

type PersistentLedgerEntryVerification = {
  sequence: number;
  recordedAt: string;
  verified: boolean;
  failedChecks: number;
  sequenceContinuity: boolean;
  previousHashBinding: boolean;
  entrySha256: string;
  previousEntrySha256: string | null;
  chainRootSha256: string;
};

function jsonHeaders(
  verificationStatus:
    | "PASS"
    | "FAIL_CLOSED",
) {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "X-HBCE-Revision":
      REVISION,

    "X-HBCE-Ledger-Verification":
      verificationStatus,

    "X-HBCE-Persistence":
      "false",

    "X-HBCE-Runtime-Activation":
      "false",
  };
}

function failClosed(
  generatedAt: string,
  reason: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      ok: false,

      status:
        "HBCE_RUNTIME_OPERATIONS_PERSISTENT_LEDGER_VERIFY_FAIL_CLOSED",

      operationalStatus:
        "FAIL_CLOSED",

      revision:
        REVISION,

      generatedAt,

      readOnly:
        true,

      reason,

      details:
        details ?? null,

      governance: {
        persistenceExecuted:
          false,

        sideEffects:
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
        503,

      headers:
        jsonHeaders(
          "FAIL_CLOSED",
        ),
    },
  );
}

export async function GET() {
  const generatedAt =
    new Date().toISOString();

  try {
    /*
     * Read-only persistent verification.
     *
     * The repository mapper already validates the canonical
     * database invariants for every row, including:
     * - HERMETICUM sigil 🜏
     * - Runtime IPR / human authority IPR
     * - organization
     * - SHA-256 field formats
     * - verified = true
     * - zero verification failures
     * - append-only / hash-only governance
     * - autonomous authorization disabled
     * - runtime activation disabled
     * - no-submit-from-code enabled
     * - legal certification / QES claims disabled
     *
     * This endpoint then independently verifies the cryptographic
     * ledger entry hash and previous-entry binding for every row.
     */
    const records =
      await listRuntimeOperationsLedgerEntries({
        limit:
          MAX_VERIFICATION_ENTRIES,

        afterSequence:
          0,
      });

    const latestRecord =
      await getLatestRuntimeOperationsLedgerEntry();

    if (
      records.length === 0
    ) {
      return failClosed(
        generatedAt,
        "Persistent Runtime Operations ledger is empty. Genesis entry is required before chain verification can pass.",
        {
          entryCount:
            0,

          latestEntryPresent:
            latestRecord !== null,
        },
      );
    }

    if (!latestRecord) {
      return failClosed(
        generatedAt,
        "Persistent ledger list returned entries but latest-entry lookup returned null.",
        {
          entryCount:
            records.length,
        },
      );
    }

    const firstRecord =
      records[0];

    const finalRecord =
      records[
        records.length - 1
      ];

    if (
      firstRecord.entry.sequence !== 1
    ) {
      return failClosed(
        generatedAt,
        "Persistent ledger genesis sequence is not 1.",
        {
          expected:
            1,

          actual:
            firstRecord.entry.sequence,
        },
      );
    }

    if (
      finalRecord.entry.sequence !==
      latestRecord.entry.sequence
    ) {
      return failClosed(
        generatedAt,
        "Persistent ledger verification window does not cover the current ledger tip.",
        {
          verificationLimit:
            MAX_VERIFICATION_ENTRIES,

          verifiedThroughSequence:
            finalRecord.entry.sequence,

          latestSequence:
            latestRecord.entry.sequence,

          instruction:
            "Increase or redesign the verification window before claiming full-chain verification.",
        },
      );
    }

    const entryVerifications:
      PersistentLedgerEntryVerification[] = [];

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
      index < records.length;
      index += 1
    ) {
      const record =
        records[index];

      const entry =
        record.entry;

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

      entryVerifications.push({
        sequence:
          entry.sequence,

        recordedAt:
          record.persistence
            .recordedAt,

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

    const tipCoverageVerified =
      finalRecord.entry.sequence ===
        latestRecord.entry.sequence &&
      finalRecord.entry.chain
        .entrySha256 ===
        latestRecord.entry.chain
          .entrySha256 &&
      finalRecord.entry.chain
        .chainRootSha256 ===
        latestRecord.entry.chain
          .chainRootSha256;

    const completeChainPassed =
      allEntriesVerified &&
      sequenceContinuityVerified &&
      previousHashBindingsVerified &&
      tipCoverageVerified &&
      totalFailedChecks === 0;

    if (!completeChainPassed) {
      return failClosed(
        generatedAt,
        "Persistent Runtime Operations ledger full-chain verification failed.",
        {
          entryCount:
            records.length,

          allEntriesVerified,

          sequenceContinuityVerified,

          previousHashBindingsVerified,

          tipCoverageVerified,

          totalFailedChecks,

          entries:
            entryVerifications,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,

        status:
          "HBCE_RUNTIME_OPERATIONS_PERSISTENT_LEDGER_VERIFY_PASS",

        operationalStatus:
          "PASS",

        revision:
          REVISION,

        generatedAt,

        product:
          "HBCE IPR Operational Identity & Proof Layer",

        runtime:
          "AI_JOKER_C2_SAAS_CORE_v0_1",

        readOnly:
          true,

        persistence: {
          executed:
            false,

          table:
            "public.hbce_runtime_operations_ledger",

          databaseMappingValidated:
            true,

          hermeticumSigil:
            HERMETICUM_SIGIL,
        },

        identity: {
          runtimeIpr:
            firstRecord.entry
              .identity.runtimeIpr,

          humanAuthorityIpr:
            firstRecord.entry
              .identity
              .humanAuthorityIpr,

          organization:
            firstRecord.entry
              .identity.organization,
        },

        chain: {
          entryCount:
            records.length,

          genesisSequence:
            firstRecord.entry.sequence,

          latestSequence:
            finalRecord.entry.sequence,

          genesisEntrySha256:
            firstRecord.entry.chain
              .entrySha256,

          latestEntrySha256:
            finalRecord.entry.chain
              .entrySha256,

          chainRootSha256:
            finalRecord.entry.chain
              .chainRootSha256,

          completeChainPassed:
            true,
        },

        verification: {
          verifierMode:
            "PERSISTENT_DATABASE_FULL_CHAIN_READ_ONLY",

          maximumVerificationEntries:
            MAX_VERIFICATION_ENTRIES,

          allEntriesVerified:
            true,

          sequenceContinuityVerified:
            true,

          previousHashBindingsVerified:
            true,

          tipCoverageVerified:
            true,

          totalFailedChecks:
            0,

          entries:
            entryVerifications,
        },

        governance: {
          persistenceExecuted:
            false,

          sideEffects:
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
          200,

        headers:
          jsonHeaders(
            "PASS",
          ),
      },
    );
  } catch (error) {
    const errorName =
      error instanceof Error
        ? error.name
        : "UnknownError";

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return failClosed(
      generatedAt,
      "Persistent Runtime Operations ledger verification encountered an exception.",
      {
        name:
          errorName,

        message:
          errorMessage,
      },
    );
  }
}
