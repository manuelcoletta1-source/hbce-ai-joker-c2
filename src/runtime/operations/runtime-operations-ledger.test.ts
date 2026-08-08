import {
  buildRuntimeOperationsEvidence,
  type RuntimeOperationsEvidenceInput,
} from "./runtime-operations-evidence";

import {
  buildRuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-envelope";

import {
  verifyRuntimeOperationsOpcEnvelope,
} from "./runtime-operations-opc-verifier";

import {
  buildRuntimeOperationsLedgerEntry,
  verifyRuntimeOperationsLedgerEntry,
  verifyRuntimeOperationsLedgerChain,
  type RuntimeOperationsLedgerEntry,
} from "./runtime-operations-ledger";

function buildSourceInput(
  generatedAt: string,
  revision = "HBCE-RUNTIME-OPERATIONS-SELF-TEST-v1_3",
): RuntimeOperationsEvidenceInput {
  return {
    ok: true,

    status:
      "HBCE_RUNTIME_OPERATIONS_SELF_TEST_PASS",

    operationalStatus:
      "PASS",

    revision,

    generatedAt,

    product:
      "HBCE IPR Operational Identity & Proof Layer",

    runtime:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    execution: {
      mode:
        "DETERMINISTIC_RUNTIME_OPERATIONS_GOVERNANCE_SELF_TEST",

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
          "OPS-TEST-001",

        description:
          "Synthetic canonical PASS check",

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

  if (!verification.verified) {
    throw new Error(
      "TEST_SETUP_OPC_VERIFICATION_FAILED",
    );
  }

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
    JSON.stringify(entry),
  ) as RuntimeOperationsLedgerEntry;
}

describe(
  "runtime operations append-only ledger",
  () => {
    it(
      "creates a valid genesis entry",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,

            previousEntry:
              null,
          });

        expect(
          genesis.entryType,
        ).toBe(
          "HBCE_RUNTIME_OPERATIONS_APPEND_ONLY_LEDGER_ENTRY",
        );

        expect(
          genesis.revision,
        ).toBe(
          "HBCE-RUNTIME-OPERATIONS-LEDGER-v1_0",
        );

        expect(
          genesis.sequence,
        ).toBe(
          1,
        );

        expect(
          genesis.chain
            .previousEntrySha256,
        ).toBeNull();

        expect(
          genesis.chain
            .entrySha256,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );

        expect(
          genesis.chain
            .chainRootSha256,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );
      },
    );

    it(
      "verifies a valid genesis entry",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,
          });

        const result =
          verifyRuntimeOperationsLedgerEntry({
            entry:
              genesis,

            previousEntry:
              null,
          });

        expect(
          result.verified,
        ).toBe(
          true,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "PASS",
        );

        expect(
          result.summary.failedChecks,
        ).toBe(
          0,
        );

        expect(
          result.summary.totalChecks,
        ).toBe(
          20,
        );
      },
    );

    it(
      "creates a second entry bound to the genesis entry",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const secondArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        const second =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              2,

            envelope:
              secondArtifacts.envelope,

            verification:
              secondArtifacts.verification,

            previousEntry:
              genesis,
          });

        expect(
          second.sequence,
        ).toBe(
          2,
        );

        expect(
          second.chain
            .previousEntrySha256,
        ).toBe(
          genesis.chain
            .entrySha256,
        );

        expect(
          second.chain
            .entrySha256,
        ).not.toBe(
          genesis.chain
            .entrySha256,
        );

        expect(
          second.chain
            .chainRootSha256,
        ).not.toBe(
          genesis.chain
            .chainRootSha256,
        );
      },
    );

    it(
      "verifies a valid two-entry chain",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const secondArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        const second =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              2,

            envelope:
              secondArtifacts.envelope,

            verification:
              secondArtifacts.verification,

            previousEntry:
              genesis,
          });

        const result =
          verifyRuntimeOperationsLedgerChain([
            genesis,
            second,
          ]);

        expect(
          result.verified,
        ).toBe(
          true,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "PASS",
        );

        expect(
          result.totalEntries,
        ).toBe(
          2,
        );

        expect(
          result.verifiedEntries,
        ).toBe(
          2,
        );

        expect(
          result.failedEntries,
        ).toBe(
          0,
        );
      },
    );

    it(
      "detects tampering with ledger source data",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,
          });

        const tampered =
          cloneLedgerEntry(
            genesis,
          );

        tampered.source
          .operationalStatus =
          "TAMPERED";

        const result =
          verifyRuntimeOperationsLedgerEntry({
            entry:
              tampered,

            previousEntry:
              null,
          });

        expect(
          result.verified,
        ).toBe(
          false,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "FAIL_CLOSED",
        );

        expect(
          result.summary.failedChecks,
        ).toBeGreaterThan(
          0,
        );

        const hashCheck =
          result.checks.find(
            (item) =>
              item.id ===
              "LEDGER-VERIFY-004",
          );

        expect(
          hashCheck?.passed,
        ).toBe(
          false,
        );
      },
    );

    it(
      "detects tampering with entry SHA-256",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,
          });

        const tampered =
          cloneLedgerEntry(
            genesis,
          );

        tampered.chain
          .entrySha256 =
          "0".repeat(
            64,
          );

        const result =
          verifyRuntimeOperationsLedgerEntry({
            entry:
              tampered,

            previousEntry:
              null,
          });

        expect(
          result.verified,
        ).toBe(
          false,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "FAIL_CLOSED",
        );

        expect(
          result.chain
            .expectedEntrySha256,
        ).not.toBe(
          result.chain
            .actualEntrySha256,
        );
      },
    );

    it(
      "detects tampering with chain root SHA-256",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,
          });

        const tampered =
          cloneLedgerEntry(
            genesis,
          );

        tampered.chain
          .chainRootSha256 =
          "f".repeat(
            64,
          );

        const result =
          verifyRuntimeOperationsLedgerEntry({
            entry:
              tampered,

            previousEntry:
              null,
          });

        expect(
          result.verified,
        ).toBe(
          false,
        );

        expect(
          result.chain
            .expectedChainRootSha256,
        ).not.toBe(
          result.chain
            .actualChainRootSha256,
        );
      },
    );

    it(
      "detects a broken previous-entry binding",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const secondArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        const second =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              2,

            envelope:
              secondArtifacts.envelope,

            verification:
              secondArtifacts.verification,

            previousEntry:
              genesis,
          });

        const tampered =
          cloneLedgerEntry(
            second,
          );

        tampered.chain
          .previousEntrySha256 =
          "a".repeat(
            64,
          );

        const result =
          verifyRuntimeOperationsLedgerEntry({
            entry:
              tampered,

            previousEntry:
              genesis,
          });

        expect(
          result.verified,
        ).toBe(
          false,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "FAIL_CLOSED",
        );

        const previousHashCheck =
          result.checks.find(
            (item) =>
              item.id ===
              "LEDGER-VERIFY-003",
          );

        expect(
          previousHashCheck?.passed,
        ).toBe(
          false,
        );
      },
    );

    it(
      "detects sequence discontinuity in a chain",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const secondArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        const second =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              2,

            envelope:
              secondArtifacts.envelope,

            verification:
              secondArtifacts.verification,

            previousEntry:
              genesis,
          });

        const tampered =
          cloneLedgerEntry(
            second,
          );

        tampered.sequence =
          3;

        const result =
          verifyRuntimeOperationsLedgerChain([
            genesis,
            tampered,
          ]);

        expect(
          result.verified,
        ).toBe(
          false,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "FAIL_CLOSED",
        );

        expect(
          result.failedEntries,
        ).toBe(
          1,
        );
      },
    );

    it(
      "rejects construction of sequence two without a previous entry",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        expect(
          () =>
            buildRuntimeOperationsLedgerEntry({
              sequence:
                2,

              envelope:
                artifacts.envelope,

              verification:
                artifacts.verification,

              previousEntry:
                null,
            }),
        ).toThrow(
          "HBCE_RUNTIME_OPERATIONS_LEDGER_PREVIOUS_ENTRY_REQUIRED",
        );
      },
    );

    it(
      "rejects a previous entry with discontinuous sequence",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const thirdArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T13:00:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        expect(
          () =>
            buildRuntimeOperationsLedgerEntry({
              sequence:
                3,

              envelope:
                thirdArtifacts.envelope,

              verification:
                thirdArtifacts.verification,

              previousEntry:
                genesis,
            }),
        ).toThrow(
          "HBCE_RUNTIME_OPERATIONS_LEDGER_SEQUENCE_DISCONTINUITY",
        );
      },
    );

    it(
      "rejects invalid sequence zero",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        expect(
          () =>
            buildRuntimeOperationsLedgerEntry({
              sequence:
                0,

              envelope:
                artifacts.envelope,

              verification:
                artifacts.verification,
            }),
        ).toThrow(
          "HBCE_RUNTIME_OPERATIONS_LEDGER_INVALID_SEQUENCE",
        );
      },
    );

    it(
      "rejects genesis construction when a previous entry is supplied",
      () => {
        const firstArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const secondArtifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:55:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              firstArtifacts.envelope,

            verification:
              firstArtifacts.verification,
          });

        expect(
          () =>
            buildRuntimeOperationsLedgerEntry({
              sequence:
                1,

              envelope:
                secondArtifacts.envelope,

              verification:
                secondArtifacts.verification,

              previousEntry:
                genesis,
            }),
        ).toThrow(
          "HBCE_RUNTIME_OPERATIONS_LEDGER_GENESIS_PREVIOUS_ENTRY_FORBIDDEN",
        );
      },
    );

    it(
      "rejects an unverified OPC envelope",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const invalidVerification = {
          ...artifacts.verification,

          verified:
            false,

          operationalStatus:
            "FAIL_CLOSED" as const,

          summary: {
            ...artifacts.verification
              .summary,

            passedChecks:
              artifacts.verification
                .summary
                .totalChecks -
              1,

            failedChecks:
              1,
          },
        };

        expect(
          () =>
            buildRuntimeOperationsLedgerEntry({
              sequence:
                1,

              envelope:
                artifacts.envelope,

              verification:
                invalidVerification,
            }),
        ).toThrow(
          "HBCE_RUNTIME_OPERATIONS_LEDGER_UNVERIFIED_ENVELOPE",
        );
      },
    );

    it(
      "preserves governance invariants on ledger entries",
      () => {
        const artifacts =
          buildVerifiedArtifacts(
            "2026-08-08T12:50:07.923Z",
          );

        const genesis =
          buildRuntimeOperationsLedgerEntry({
            sequence:
              1,

            envelope:
              artifacts.envelope,

            verification:
              artifacts.verification,
          });

        expect(
          genesis.governance,
        ).toEqual({
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
        });
      },
    );

    it(
      "verifies an empty ledger without creating authority",
      () => {
        const result =
          verifyRuntimeOperationsLedgerChain(
            [],
          );

        expect(
          result.verified,
        ).toBe(
          true,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "PASS",
        );

        expect(
          result.totalEntries,
        ).toBe(
          0,
        );

        expect(
          result.governance
            .humanAuthorizationRequired,
        ).toBe(
          true,
        );

        expect(
          result.governance
            .autonomousAuthorization,
        ).toBe(
          false,
        );

        expect(
          result.governance
            .runtimeActivation,
        ).toBe(
          false,
        );
      },
    );
  },
);
