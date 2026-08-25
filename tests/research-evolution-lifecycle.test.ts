/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Research Evolution Lifecycle Tests
 *
 * Tests:
 * - successful VERIFIED BER creation;
 * - EVT failure;
 * - UNEBDO failure;
 * - OPC failure;
 * - BER persistence failure;
 * - empty evidence identifiers;
 * - no partial persistence;
 * - append-only duplicate protection.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  completeResearchMission,
  ResearchEvolutionLifecycleError,
  type ResearchEvolutionAdapters,
  type ResearchMissionCompletion,
} from "../runtime/research-evolution-lifecycle";

import {
  BerRegistryError,
  BiocyberneticEvolutionRegistry,
  InMemoryBerRegistryStorage,
} from "../research/ber/registry";

import type {
  BiocyberneticEvolutionRecord,
} from "../research/ber/biocybernetic-evolution-register";

function createMission(
  overrides: Partial<ResearchMissionCompletion> = {},
): ResearchMissionCompletion {
  return {
    berId: "BER-TEST-0001",

    missionId: "MISSION-TEST-0001",

    title: "BER lifecycle deterministic test",

    researchTrack: "ARC-AGI",

    ipr: {
      biologicalIprId: "IPR-3",

      biologicalSubjectName: "Manuel Coletta",

      cyberneticIprId: "IPR-AI-0001",

      cyberneticEntityName: "AI JOKER-C2",
    },

    artifact: {
      repository:
        "manuelcoletta1-source/hbce-ai-joker-c2",

      branch: "main",

      gitCommit:
        "0123456789abcdef0123456789abcdef01234567",

      filePath:
        "tests/research-evolution-lifecycle.test.ts",

      artifactSha256:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },

    benchmark: {
      provider: "Kaggle",

      competition: "ARC-AGI",

      score: 0.22,

      scoreScale: "official competition score",

      observedAt: "2026-07-30T12:00:00+02:00",

      observedLocation: "Torino, Italia",

      submissionId: "TEST-SUBMISSION-0001",

      notebookVersion: "TEST-V1",

      notebookSha256:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

      runtimeSha256:
        "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",

      submissionSha256:
        "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",

      officialResult: true,

      claimScope:
        "The test fixture represents one bounded benchmark observation.",

      limitations: [
        "Does not prove AGI.",

        "Does not validate the complete HBCE architecture.",

        "Does not constitute legal certification.",
      ],
    },

    knowledge: {
      outcome: "POSITIVE",

      hypothesis:
        "A completed research mission can produce a verified append-only BER record.",

      intervention:
        "Execute the deterministic research evolution lifecycle.",

      observation:
        "The lifecycle generated EVT, UNEBDO and OPC identifiers before persistence.",

      knowledgeGained: [
        "The BER lifecycle can be tested deterministically.",

        "Persistence occurs only after the evidence chain is complete.",
      ],

      lessonsLearned: [
        "Every evidence stage must fail closed.",

        "No synthetic identifier may replace a failed service response.",
      ],

      nextDecision:
        "Connect the tested lifecycle to persistent production storage.",
    },

    completedAt: "2026-07-30T12:00:00+02:00",

    ...overrides,
  };
}

interface AdapterProbe {
  eventCalls: number;
  unebdoCalls: number;
  opcCalls: number;
  persistenceCalls: number;
  persistedRecords: BiocyberneticEvolutionRecord[];
}

function createProbe(): AdapterProbe {
  return {
    eventCalls: 0,
    unebdoCalls: 0,
    opcCalls: 0,
    persistenceCalls: 0,
    persistedRecords: [],
  };
}

function createSuccessfulAdapters(
  probe: AdapterProbe,
): ResearchEvolutionAdapters {
  return {
    async createEvent() {
      probe.eventCalls += 1;

      return {
        eventId: "EVT-BER-TEST-0001",
      };
    },

    async createUnebdoAnchor() {
      probe.unebdoCalls += 1;

      return {
        unebdoAnchorId: "UNEBDO-BER-TEST-0001",
      };
    },

    async createOpcReceipt() {
      probe.opcCalls += 1;

      return {
        opcReceiptId: "OPC-BER-TEST-0001",
      };
    },

    async persistBerRecord(record) {
      probe.persistenceCalls += 1;

      probe.persistedRecords.push(
        structuredClone(record),
      );
    },
  };
}

async function expectLifecycleError(
  operation: () => Promise<unknown>,
  expectedCode:
    ResearchEvolutionLifecycleError["code"],
): Promise<ResearchEvolutionLifecycleError> {
  try {
    await operation();

    assert.fail(
      `Expected lifecycle error ${expectedCode}.`,
    );
  } catch (error) {
    assert.ok(
      error instanceof ResearchEvolutionLifecycleError,
    );

    assert.equal(error.code, expectedCode);

    return error;
  }
}

describe(
  "AI JOKER-C2 Research Evolution Lifecycle",
  () => {
    it(
      "creates and persists one VERIFIED BER record",
      async () => {
        const probe = createProbe();

        const result =
          await completeResearchMission(
            createMission(),
            createSuccessfulAdapters(probe),
          );

        assert.equal(
          result.record.status,
          "VERIFIED",
        );

        assert.equal(
          result.eventId,
          "EVT-BER-TEST-0001",
        );

        assert.equal(
          result.unebdoAnchorId,
          "UNEBDO-BER-TEST-0001",
        );

        assert.equal(
          result.opcReceiptId,
          "OPC-BER-TEST-0001",
        );

        assert.deepEqual(
          result.record.evidenceChain,
          {
            previousBerId:
              undefined,

            eventId: "EVT-BER-TEST-0001",

            unebdoAnchorId:
              "UNEBDO-BER-TEST-0001",

            opcReceiptId:
              "OPC-BER-TEST-0001",
          },
        );

        assert.equal(probe.eventCalls, 1);

        assert.equal(probe.unebdoCalls, 1);

        assert.equal(probe.opcCalls, 1);

        assert.equal(
          probe.persistenceCalls,
          1,
        );

        assert.equal(
          probe.persistedRecords.length,
          1,
        );

        assert.equal(
          probe.persistedRecords[0].status,
          "VERIFIED",
        );
      },
    );

    it(
      "fails closed when EVT creation fails",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createEvent = async () => {
          probe.eventCalls += 1;

          throw new Error(
            "Simulated EVT failure.",
          );
        };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "EVT_CREATION_FAILED",
        );

        assert.equal(probe.eventCalls, 1);

        assert.equal(probe.unebdoCalls, 0);

        assert.equal(probe.opcCalls, 0);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "fails closed when UNEBDO anchoring fails",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createUnebdoAnchor =
          async () => {
            probe.unebdoCalls += 1;

            throw new Error(
              "Simulated UNEBDO failure.",
            );
          };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "UNEBDO_ANCHOR_FAILED",
        );

        assert.equal(probe.eventCalls, 1);

        assert.equal(probe.unebdoCalls, 1);

        assert.equal(probe.opcCalls, 0);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "fails closed when OPC receipt creation fails",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createOpcReceipt =
          async () => {
            probe.opcCalls += 1;

            throw new Error(
              "Simulated OPC failure.",
            );
          };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "OPC_RECEIPT_FAILED",
        );

        assert.equal(probe.eventCalls, 1);

        assert.equal(probe.unebdoCalls, 1);

        assert.equal(probe.opcCalls, 1);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "reports BER persistence failure after evidence creation",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.persistBerRecord =
          async () => {
            probe.persistenceCalls += 1;

            throw new Error(
              "Simulated registry failure.",
            );
          };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "BER_PERSISTENCE_FAILED",
        );

        assert.equal(probe.eventCalls, 1);

        assert.equal(probe.unebdoCalls, 1);

        assert.equal(probe.opcCalls, 1);

        assert.equal(
          probe.persistenceCalls,
          1,
        );
      },
    );

    it(
      "rejects an empty EVT identifier",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createEvent = async () => {
          probe.eventCalls += 1;

          return {
            eventId: "   ",
          };
        };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "INVALID_INPUT",
        );

        assert.equal(probe.unebdoCalls, 0);

        assert.equal(probe.opcCalls, 0);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "rejects an empty UNEBDO identifier",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createUnebdoAnchor =
          async () => {
            probe.unebdoCalls += 1;

            return {
              unebdoAnchorId: "",
            };
          };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "INVALID_INPUT",
        );

        assert.equal(probe.opcCalls, 0);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "rejects an empty OPC identifier",
      async () => {
        const probe = createProbe();

        const adapters =
          createSuccessfulAdapters(probe);

        adapters.createOpcReceipt =
          async () => {
            probe.opcCalls += 1;

            return {
              opcReceiptId: "",
            };
          };

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission(),
              adapters,
            ),

          "INVALID_INPUT",
        );

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "rejects invalid mission input before calling services",
      async () => {
        const probe = createProbe();

        await expectLifecycleError(
          () =>
            completeResearchMission(
              createMission({
                missionId: "",
              }),

              createSuccessfulAdapters(probe),
            ),

          "INVALID_INPUT",
        );

        assert.equal(probe.eventCalls, 0);

        assert.equal(probe.unebdoCalls, 0);

        assert.equal(probe.opcCalls, 0);

        assert.equal(
          probe.persistenceCalls,
          0,
        );
      },
    );

    it(
      "prevents duplicate BER identifiers in the append-only registry",
      async () => {
        const registry =
          new BiocyberneticEvolutionRegistry(
            new InMemoryBerRegistryStorage(),
          );

        const probe = createProbe();

        const firstResult =
          await completeResearchMission(
            createMission(),

            createSuccessfulAdapters(probe),
          );

        await registry.append(
          firstResult.record,
        );

        try {
          await registry.append(
            firstResult.record,
          );

          assert.fail(
            "Expected duplicate BER rejection.",
          );
        } catch (error) {
          assert.ok(
            error instanceof BerRegistryError,
          );

          assert.equal(
            error.code,
            "DUPLICATE_BER_ID",
          );
        }

        const timeline =
          await registry.getTimeline();

        assert.equal(timeline.length, 1);

        assert.equal(
          timeline[0].berId,
          "BER-TEST-0001",
        );
      },
    );
  },
);
