/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Self State From Repository Tests
 *
 * Revision:
 * AIJC2-RUNTIME-SELF-STATE-FROM-REPOSITORY-TEST-v1_0
 *
 * Purpose:
 * - verify deterministic projection from governed repository evidence;
 * - verify real repository metadata reaches RuntimeSelfState;
 * - verify capabilities are derived from repository evidence;
 * - verify fail-closed governance boundaries;
 * - verify no automatic persistence, recall or mutation;
 * - verify legalCertification=false.
 */

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RepositorySnapshotServiceProjection,
} from "../../services/repository-snapshot.service";

import {
  buildRuntimeSelfStateFromRepository,
  RUNTIME_SELF_STATE_FROM_REPOSITORY_BOUNDARY,
} from "../runtime-self-state-from-repository";

function createRepositorySnapshot(
  overrides?: {
    inspectedFiles?: number;
    architectureOk?: boolean;
    architectureFindings?: RepositorySnapshotServiceProjection["structural"]["result"]["architecture"]["findings"];
    risks?: RepositorySnapshotServiceProjection["structural"]["result"]["risks"]["risks"];
  },
): RepositorySnapshotServiceProjection {
  const architectureFindings =
    overrides?.architectureFindings ??
    Object.freeze([]);

  const risks =
    overrides?.risks ??
    Object.freeze([]);

  const totalFiles =
    120;

  const inspectedFiles =
    overrides?.inspectedFiles ??
    96;

  return {
    ok:
      true,

    status:
      "REPOSITORY_SNAPSHOT_ANALYSIS_READY",

    revision:
      "AIJC2-RUNTIME-REPOSITORY-SNAPSHOT-SERVICE-v1_1",

    runtime:
      "AI_JOKER_C2",

    moduleId:
      "MOD-001",

    providerRevision:
      "AIJC2-GITHUB-REPOSITORY-SNAPSHOT-PROVIDER-v1_0",

    sourceInspectionProviderRevision:
      "AIJC2-GITHUB-SOURCE-INSPECTION-PROVIDER-v1_0",

    repositoryIntelligenceServiceRevision:
      "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-SERVICE-v1_0",

    operation: {
      operationId:
        "HBCE-RUNTIME-STATE-TEST-001",

      idempotencyKey:
        "HBCE-RUNTIME-STATE-TEST-IDEMPOTENCY-001",

      responseEvt:
        "EVT-RUNTIME-STATE-TEST-001",

      opcId:
        null,
    },

    identity: {
      humanIpr:
        "IPR-3",

      runtimeIpr:
        "IPR-AI-0001",

      tenantId:
        "HERMETICUM_BCE",

      workspaceId:
        "HBCE-RUNTIME-TEST",

      sessionId:
        "HBCE-RUNTIME-TEST-SESSION",
    },

    repository: {
      owner:
        "manuelcoletta1-source",

      repositoryId:
        "HBCE-AI-JOKER-C2",

      repositoryName:
        "hbce-ai-joker-c2",

      branch:
        "main",

      commitSha:
        "0123456789abcdef0123456789abcdef01234567",
    },

    snapshot: {
      metadata: {
        owner:
          "manuelcoletta1-source",

        repository:
          "hbce-ai-joker-c2",

        branch:
          "main",

        commitSha:
          "0123456789abcdef0123456789abcdef01234567",

        repositoryId:
          "HBCE-AI-JOKER-C2",
      } as RepositorySnapshotServiceProjection["snapshot"]["metadata"],

      totalFiles,

      inspectedFiles,

      uninspectedFiles:
        totalFiles -
        inspectedFiles,

      rawContentRetrieved:
        inspectedFiles >
        0,

      rawContentPersisted:
        false,
    },

    sourceInspection: {
      requested:
        true,

      executed:
        true,

      authorizedPaths:
        inspectedFiles,

      inspectedFiles,

      skippedFiles:
        totalFiles -
        inspectedFiles,

      inspectedBytes:
        500_000,

      rawContentRetrieved:
        inspectedFiles >
        0,

      rawContentPersisted:
        false,

      sourceExecuted:
        false,
    },

    structural: {
      moduleId:
        "MOD-001",

      serviceRevision:
        "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-SERVICE-v1_0",

      orchestratorRevision:
        "AIJC2-MOD001-REPOSITORY-ORCHESTRATOR-v1_0",

      runtime:
        "AI_JOKER_C2",

      identity: {
        humanIpr:
          "IPR-3",

        runtimeIpr:
          "IPR-AI-0001",

        tenantId:
          "HERMETICUM_BCE",

        workspaceId:
          "HBCE-RUNTIME-TEST",

        sessionId:
          "HBCE-RUNTIME-TEST-SESSION",
      },

      request: {
        mission:
          "Test governed runtime self-state projection",

        idempotencyKey:
          "HBCE-RUNTIME-STATE-TEST-IDEMPOTENCY-001",

        repositoryId:
          "HBCE-AI-JOKER-C2",

        repositoryName:
          "hbce-ai-joker-c2",

        branch:
          "main",

        commitSha:
          "0123456789abcdef0123456789abcdef01234567",
      },

      result: {
        scan: {
          repositoryId:
            "HBCE-AI-JOKER-C2",

          repositoryName:
            "hbce-ai-joker-c2",

          branch:
            "main",

          commitSha:
            "0123456789abcdef0123456789abcdef01234567",

          statistics: {
            totalFiles:
              totalFiles,

            sourceFiles:
              80,

            testFiles:
              20,

            documentationFiles:
              8,

            configurationFiles:
              4,

            apiFiles:
              10,

            runtimeFiles:
              30,

            moduleFiles:
              24,

            directories:
              32,
          },

          directories:
            Object.freeze([]),

          scannedAt:
            "2026-08-07T18:00:00.000Z",

          legalCertification:
            false,
        },

        architecture: {
          ok:
            overrides?.architectureOk ??
            true,

          status:
            overrides?.architectureOk ===
            false
              ? "REPOSITORY_ARCHITECTURE_MAP_FAIL_CLOSED"
              : "REPOSITORY_ARCHITECTURE_MAP_READY",

          revision:
            "AIJC2-MOD001-REPOSITORY-ARCHITECTURE-MAPPER-v1_0",

          repository: {
            repositoryId:
              "HBCE-AI-JOKER-C2",

            repositoryName:
              "hbce-ai-joker-c2",

            branch:
              "main",

            commitSha:
              "0123456789abcdef0123456789abcdef01234567",
          },

          summary: {
            totalNodes:
              152,

            directoryNodes:
              32,

            fileNodes:
              totalFiles,

            identifiedRoles:
              Object.freeze([
                "RUNTIME",
                "API",
                "MODULE",
                "TEST",
              ]),

            entrypointCount:
              4,

            boundaryCount:
              6,

            findingCount:
              architectureFindings.length,

            inspectedFileCoverage:
              Math.round(
                (
                  inspectedFiles /
                  totalFiles
                ) *
                  100,
              ),
          },

          nodes:
            Object.freeze([]),

          zones:
            Object.freeze([]),

          entrypoints:
            Object.freeze([]),

          boundaries:
            Object.freeze([]),

          findings:
            architectureFindings,

          governance: {
            evidenceBased:
              true,

            deterministic:
              true,

            astParsing:
              false,

            sourceExecution:
              false,

            humanAuthorizationRequired:
              true,

            persistentMemoryCreated:
              false,

            automaticRecallUsed:
              false,

            legalCertification:
              false,
          },

          legalCertification:
            false,
        },

        dependencyGraph:
          {
            revision:
              "AIJC2-MOD001-REPOSITORY-DEPENDENCY-GRAPH-v1_0",

            deterministic:
              true,

            legalCertification:
              false,
          } as RepositorySnapshotServiceProjection["structural"]["result"]["dependencyGraph"],

        risks: {
          revision:
            "AIJC2-MOD001-REPOSITORY-RISK-ANALYZER-v1_0",

          generatedAt:
            "2026-08-07T18:00:00.000Z",

          totalRisks:
            risks.length,

          risks,

          deterministic:
            true,

          legalCertification:
            false,
        },

        mutationPlan: {
          revision:
            "AIJC2-MOD001-REPOSITORY-MUTATION-PLANNER-v1_0",

          generatedAt:
            "2026-08-07T18:00:00.000Z",

          totalMutations:
            risks.length,

          mutations:
            Object.freeze(
              risks.map(
                (
                  risk,
                  index,
                ) => ({
                  id:
                    `MUT-${index + 1}`,

                  targetFile:
                    risk.affectedPath,

                  reason:
                    risk.title,

                  priority:
                    risk.level ===
                    "HIGH"
                      ? 1
                      : risk.level ===
                          "MEDIUM"
                        ? 2
                        : 3,

                  estimatedRisk:
                    risk.level,
                }),
              ),
            ),

          deterministic:
            true,

          autonomousExecution:
            false,

          humanAuthorizationRequired:
            true,

          legalCertification:
            false,
        },
      },

      governance: {
        deterministic:
          true,

        failClosed:
          true,

        autonomousExecution:
          false,

        humanAuthorizationRequired:
          true,

        humanAuthorizationVerified:
          true,

        evtRequired:
          true,

        unebdoRegistrationRequired:
          true,

        opcTechnicalClosureRequired:
          true,

        matrixInterpretationRequired:
          true,

        persistentMemoryCreated:
          false,

        automaticRecallUsed:
          false,

        legalCertification:
          false,
      },

      legalCertification:
        false,
    },

    governance: {
      deterministicNormalization:
        true,

      deterministicInspectionMerge:
        true,

      failClosed:
        true,

      evidenceBased:
        true,

      readOnlyGitHubAccess:
        true,

      explicitSourceAuthorizationRequired:
        true,

      rawContentRetrieved:
        inspectedFiles >
        0,

      rawContentPersisted:
        false,

      sourceExecution:
        false,

      autonomousExecution:
        false,

      autonomousMutation:
        false,

      humanAuthorizationRequired:
        true,

      humanAuthorizationVerified:
        true,

      evtRequired:
        true,

      unebdoRegistrationRequired:
        true,

      opcTechnicalClosureRequired:
        true,

      matrixInterpretationRequired:
        true,

      persistentMemoryCreated:
        false,

      automaticRecallUsed:
        false,

      legalCertification:
        false,
    },

    legalCertification:
      false,
  };
}

function createInput(
  repositorySnapshot =
    createRepositorySnapshot(),
) {
  return {
    generatedAt:
      "2026-08-07T18:05:00.000Z",

    runtimeVersion:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    repositorySnapshot,

    buildPassed:
      true,

    testsPassed:
      true,

    operatorAuthorized:
      true,
  } as const;
}

describe(
  "Runtime Self State From Repository",
  () => {
    it(
      "projects real repository identity and evidence into RuntimeSelfState",
      () => {
        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(),
          );

        expect(
          result.repository.repository,
        ).toBe(
          "hbce-ai-joker-c2",
        );

        expect(
          result.repository.branch,
        ).toBe(
          "main",
        );

        expect(
          result.repository.commit,
        ).toBe(
          "0123456789abcdef0123456789abcdef01234567",
        );

        expect(
          result.repository.fileCount,
        ).toBe(
          120,
        );

        expect(
          result.repository.directoryCount,
        ).toBe(
          32,
        );

        expect(
          result.repository.inspectedFileCount,
        ).toBe(
          96,
        );
      },
    );

    it(
      "registers repository-derived runtime capabilities",
      () => {
        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(),
          );

        expect(
          result.capabilities.length,
        ).toBe(
          5,
        );

        expect(
          result.capabilityRegistry
            .totalCapabilities,
        ).toBe(
          5,
        );

        expect(
          result.capabilityRegistry
            .capabilityIds,
        ).toEqual([
          "CAP-REPOSITORY-SNAPSHOT",
          "CAP-SOURCE-INSPECTION",
          "CAP-ARCHITECTURE-MAPPING",
          "CAP-REPOSITORY-RISK-ANALYSIS",
          "CAP-GOVERNED-MUTATION-PLANNING",
        ]);
      },
    );

    it(
      "derives operational scores from repository evidence",
      () => {
        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(),
          );

        const snapshotCapability =
          result.capabilities.find(
            (
              capability,
            ) =>
              capability.id ===
              "CAP-REPOSITORY-SNAPSHOT",
          );

        const inspectionCapability =
          result.capabilities.find(
            (
              capability,
            ) =>
              capability.id ===
              "CAP-SOURCE-INSPECTION",
          );

        const architectureCapability =
          result.capabilities.find(
            (
              capability,
            ) =>
              capability.id ===
              "CAP-ARCHITECTURE-MAPPING",
          );

        const riskCapability =
          result.capabilities.find(
            (
              capability,
            ) =>
              capability.id ===
              "CAP-REPOSITORY-RISK-ANALYSIS",
          );

        expect(
          snapshotCapability?.score,
        ).toBe(
          100,
        );

        expect(
          inspectionCapability?.score,
        ).toBe(
          80,
        );

        expect(
          architectureCapability?.score,
        ).toBe(
          100,
        );

        expect(
          riskCapability?.score,
        ).toBe(
          100,
        );

        expect(
          result.capabilityAnalysis
            .averageScore,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "creates a source inspection gap when coverage is below operational threshold",
      () => {
        const snapshot =
          createRepositorySnapshot({
            inspectedFiles:
              24,
          });

        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(
              snapshot,
            ),
          );

        expect(
          result.capabilityAnalysis
            .gaps.some(
              (gap) =>
                gap.id ===
                "GAP-SOURCE-INSPECTION-COVERAGE",
            ),
        ).toBe(
          true,
        );

        expect(
          result.capabilityAnalysis
            .recommendations.length,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "penalizes HIGH architecture findings deterministically",
      () => {
        const snapshot =
          createRepositorySnapshot({
            architectureFindings:
              Object.freeze([
                {
                  findingId:
                    "ARCH-HIGH-001",

                  severity:
                    "HIGH",

                  title:
                    "Critical architecture boundary",

                  description:
                    "A high-severity architecture finding is present.",

                  affectedPaths:
                    Object.freeze([
                      "src/runtime",
                    ]),

                  evidence:
                    Object.freeze([
                      "Test evidence",
                    ]),
                },
              ]),
          });

        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(
              snapshot,
            ),
          );

        const architecture =
          result.capabilities.find(
            (
              capability,
            ) =>
              capability.id ===
              "CAP-ARCHITECTURE-MAPPING",
          );

        expect(
          architecture?.score,
        ).toBe(
          75,
        );

        expect(
          architecture?.status,
        ).toBe(
          "OPERATIONAL",
        );
      },
    );

    it(
      "penalizes repository risks deterministically",
      () => {
        const snapshot =
          createRepositorySnapshot({
            risks:
              Object.freeze([
                {
                  id:
                    "RISK-1",

                  level:
                    "MEDIUM",

                  title:
                    "Large file",

                  description:
                    "Large source files may become difficult to maintain.",

                  affectedPath:
                    "src/runtime/example.ts",
                },
              ]),
          });

        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(
              snapshot,
            ),
          );

        const capability =
          result.capabilities.find(
            (
              item,
            ) =>
              item.id ===
              "CAP-REPOSITORY-RISK-ANALYSIS",
          );

        expect(
          capability?.score,
        ).toBe(
          85,
        );
      },
    );

    it(
      "preserves build and test evidence",
      () => {
        const result =
          buildRuntimeSelfStateFromRepository({
            ...createInput(),

            buildPassed:
              false,

            testsPassed:
              true,
          });

        expect(
          result.repository.buildPassed,
        ).toBe(
          false,
        );

        expect(
          result.repository.testsPassed,
        ).toBe(
          true,
        );

        expect(
          result.operationalStatus,
        ).toBe(
          "BLOCKED",
        );
      },
    );

    it(
      "produces equivalent deterministic state for equivalent input",
      () => {
        const input =
          createInput();

        const first =
          buildRuntimeSelfStateFromRepository(
            input,
          );

        const second =
          buildRuntimeSelfStateFromRepository(
            input,
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      "fails closed without operator authorization",
      () => {
        expect(
          () =>
            buildRuntimeSelfStateFromRepository({
              ...createInput(),

              operatorAuthorized:
                false,
            }),
        ).toThrow(
          "RUNTIME_SELF_STATE_FROM_REPOSITORY_OPERATOR_AUTHORIZATION_REQUIRED",
        );
      },
    );

    it(
      "fails closed when legal certification boundary is violated",
      () => {
        const snapshot =
          createRepositorySnapshot();

        const invalidSnapshot = {
          ...snapshot,

          legalCertification:
            true,
        } as unknown as RepositorySnapshotServiceProjection;

        expect(
          () =>
            buildRuntimeSelfStateFromRepository(
              createInput(
                invalidSnapshot,
              ),
            ),
        ).toThrow(
          "RUNTIME_SELF_STATE_FROM_REPOSITORY_LEGAL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "fails closed when autonomous repository mutation is enabled",
      () => {
        const snapshot =
          createRepositorySnapshot();

        const invalidSnapshot = {
          ...snapshot,

          governance: {
            ...snapshot.governance,

            autonomousMutation:
              true,
          },
        } as unknown as RepositorySnapshotServiceProjection;

        expect(
          () =>
            buildRuntimeSelfStateFromRepository(
              createInput(
                invalidSnapshot,
              ),
            ),
        ).toThrow(
          "RUNTIME_SELF_STATE_FROM_REPOSITORY_AUTONOMOUS_MUTATION_VIOLATION",
        );
      },
    );

    it(
      "fails closed when automatic recall is reported",
      () => {
        const snapshot =
          createRepositorySnapshot();

        const invalidSnapshot = {
          ...snapshot,

          governance: {
            ...snapshot.governance,

            automaticRecallUsed:
              true,
          },
        } as unknown as RepositorySnapshotServiceProjection;

        expect(
          () =>
            buildRuntimeSelfStateFromRepository(
              createInput(
                invalidSnapshot,
              ),
            ),
        ).toThrow(
          "RUNTIME_SELF_STATE_FROM_REPOSITORY_RECALL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "preserves every runtime governance boundary",
      () => {
        const result =
          buildRuntimeSelfStateFromRepository(
            createInput(),
          );

        expect(
          result.operatorAuthorized,
        ).toBe(
          true,
        );

        expect(
          result.humanAuthorizationRequired,
        ).toBe(
          true,
        );

        expect(
          result.automaticPersistence,
        ).toBe(
          false,
        );

        expect(
          result.automaticRecall,
        ).toBe(
          false,
        );

        expect(
          result.legalCertification,
        ).toBe(
          false,
        );

        expect(
          result.capabilityRegistry
            .automaticDiscovery,
        ).toBe(
          false,
        );

        expect(
          result.capabilityRegistry
            .automaticPersistence,
        ).toBe(
          false,
        );

        expect(
          result.capabilityRegistry
            .automaticRecall,
        ).toBe(
          false,
        );

        expect(
          RUNTIME_SELF_STATE_FROM_REPOSITORY_BOUNDARY
            .automaticRepositoryMutation,
        ).toBe(
          false,
        );

        expect(
          RUNTIME_SELF_STATE_FROM_REPOSITORY_BOUNDARY
            .legalCertification,
        ).toBe(
          false,
        );
      },
    );
  },
);
