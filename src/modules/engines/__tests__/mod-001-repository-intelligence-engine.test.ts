import {
  analyseRepositorySnapshot,
  MOD_001_ENGINE_MODULE_ID,
  MOD_001_ENGINE_REVISION,
  MOD_001_ENGINE_VERSION,
  type Mod001RepositorySnapshot,
} from "../mod-001-repository-intelligence-engine";

function createBaseSnapshot(
  overrides: Partial<Mod001RepositorySnapshot> = {},
): Mod001RepositorySnapshot {
  return {
    repositoryId:
      "REPO-HBCE-AI-JOKER-C2",

    repositoryName:
      "hbce-ai-joker-c2",

    branch:
      "main",

    commitSha:
      "0123456789abcdef0123456789abcdef01234567",

    objective:
      "Add deterministic tests for the MOD-001 Repository Intelligence Engine.",

    stack: {
      languages: [
        "TypeScript",
      ],

      frameworks: [
        "Next.js",
      ],

      runtimes: [
        "Node.js",
      ],

      databases: [],

      packageManagers: [
        "npm",
      ],

      testFrameworks: [
        "Jest",
      ],

      deploymentTargets: [
        "Vercel",
      ],
    },

    files: [
      {
        path:
          "src/modules/engines/mod-001-repository-intelligence-engine.ts",

        kind:
          "SOURCE",

        hash:
          "sha256:engine-source",

        sizeBytes:
          24_000,

        summary:
          "Deterministic repository snapshot analysis engine.",

        imports:
          [],

        exports: [
          "analyseRepositorySnapshot",
        ],

        inspected:
          true,
      },
    ],

    evidence: [
      {
        evidenceId:
          "EVIDENCE-MOD001-001",

        sourceType:
          "FILE",

        sourceRef:
          "src/modules/engines/mod-001-repository-intelligence-engine.ts",

        statement:
          "The target engine file exists and was inspected.",

        epistemicState:
          "FACT",
      },
    ],

    build: {
      command:
        "npm run build",

      executed:
        true,

      passed:
        true,

      outputHash:
        "sha256:build-pass",
    },

    tests: {
      command:
        "npm test -- mod-001-repository-intelligence-engine.test.ts",

      executed:
        true,

      passed:
        true,

      totalTests:
        1,

      passedTests:
        1,

      failedTests:
        0,

      outputHash:
        "sha256:test-pass",
    },

    targetFiles: [
      "src/modules/engines/mod-001-repository-intelligence-engine.ts",
    ],

    constraints: [
      "ONE_ATOMIC_MUTATION",
      "NO_AUTONOMOUS_COMMIT",
      "HUMAN_AUTHORIZATION_REQUIRED",
      "LEGAL_CERTIFICATION_FALSE",
    ],

    humanAuthorization:
      true,

    legalCertification:
      false,

    ...overrides,
  };
}

describe(
  "MOD-001 Repository Intelligence Engine",
  () => {
    test(
      "returns an analysis-ready result when evidence is sufficient",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot(),
          );

        expect(
          result.ok,
        ).toBe(true);

        expect(
          result.status,
        ).toBe(
          "MOD001_REPOSITORY_ANALYSIS_READY",
        );

        expect(
          result.revision,
        ).toBe(
          MOD_001_ENGINE_REVISION,
        );

        expect(
          result.moduleId,
        ).toBe(
          MOD_001_ENGINE_MODULE_ID,
        );

        expect(
          result.version,
        ).toBe(
          MOD_001_ENGINE_VERSION,
        );

        expect(
          result.repository.repositoryName,
        ).toBe(
          "hbce-ai-joker-c2",
        );

        expect(
          result.objective.supplied,
        ).toBe(true);

        expect(
          result.posture.overallConfidence,
        ).toBeGreaterThanOrEqual(55);

        expect(
          result.nextMutation.allowed,
        ).toBe(true);

        expect(
          result.nextMutation.filePath,
        ).toBe(
          "src/modules/engines/mod-001-repository-intelligence-engine.ts",
        );

        expect(
          result.nextMutation.requiresHumanAuthorization,
        ).toBe(true);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );

    test(
      "fails closed when the objective is missing",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              objective:
                null,
            }),
          );

        expect(
          result.ok,
        ).toBe(false);

        expect(
          result.status,
        ).toBe(
          "MOD001_REPOSITORY_ANALYSIS_FAIL_CLOSED",
        );

        expect(
          result.nextMutation.allowed,
        ).toBe(false);

        expect(
          result.nextMutation.filePath,
        ).toBeNull();

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-OBJECTIVE-MISSING",
          ),
        ).toBe(true);

        expect(
          result.missingEvidence,
        ).toContain(
          "Concrete and measurable repository objective",
        );
      },
    );

    test(
      "fails closed when no repository files are supplied",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              files:
                [],
            }),
          );

        expect(
          result.ok,
        ).toBe(false);

        expect(
          result.nextMutation.allowed,
        ).toBe(false);

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-NO-FILES",
          ),
        ).toBe(true);

        expect(
          result.posture.inspectedFileCoverage,
        ).toBe(0);
      },
    );

    test(
      "fails closed when the target file was not inspected",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              files: [
                {
                  path:
                    "src/modules/engines/mod-001-repository-intelligence-engine.ts",

                  kind:
                    "SOURCE",

                  hash:
                    null,

                  sizeBytes:
                    null,

                  summary:
                    null,

                  imports:
                    [],

                  exports:
                    [],

                  inspected:
                    false,
                },
              ],
            }),
          );

        expect(
          result.ok,
        ).toBe(false);

        expect(
          result.nextMutation.allowed,
        ).toBe(false);

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-TARGETS-NOT-INSPECTED",
          ),
        ).toBe(true);
      },
    );

    test(
      "fails closed when human authorization is absent",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              humanAuthorization:
                false,
            }),
          );

        expect(
          result.nextMutation.allowed,
        ).toBe(false);

        expect(
          result.nextMutation.reason,
        ).toBe(
          "Human authorization is absent.",
        );

        expect(
          result.nextMutation.requiresHumanAuthorization,
        ).toBe(true);
      },
    );

    test(
      "rejects more than one target file for the next atomic mutation",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              files: [
                {
                  path:
                    "src/modules/engines/mod-001-repository-intelligence-engine.ts",

                  kind:
                    "SOURCE",

                  hash:
                    "sha256:file-a",

                  sizeBytes:
                    20_000,

                  summary:
                    "Engine.",

                  imports:
                    [],

                  exports:
                    [
                      "analyseRepositorySnapshot",
                    ],

                  inspected:
                    true,
                },

                {
                  path:
                    "src/modules/engines/__tests__/mod-001-repository-intelligence-engine.test.ts",

                  kind:
                    "TEST",

                  hash:
                    "sha256:file-b",

                  sizeBytes:
                    8_000,

                  summary:
                    "Engine tests.",

                  imports:
                    [
                      "../mod-001-repository-intelligence-engine",
                    ],

                  exports:
                    [],

                  inspected:
                    true,
                },
              ],

              targetFiles: [
                "src/modules/engines/mod-001-repository-intelligence-engine.ts",
                "src/modules/engines/__tests__/mod-001-repository-intelligence-engine.test.ts",
              ],

              evidence: [
                {
                  evidenceId:
                    "EVIDENCE-MOD001-001",

                  sourceType:
                    "FILE",

                  sourceRef:
                    "src/modules/engines/mod-001-repository-intelligence-engine.ts",

                  statement:
                    "The engine file was inspected.",

                  epistemicState:
                    "FACT",
                },

                {
                  evidenceId:
                    "EVIDENCE-MOD001-002",

                  sourceType:
                    "FILE",

                  sourceRef:
                    "src/modules/engines/__tests__/mod-001-repository-intelligence-engine.test.ts",

                  statement:
                    "The test file was inspected.",

                  epistemicState:
                    "FACT",
                },
              ],
            }),
          );

        expect(
          result.ok,
        ).toBe(true);

        expect(
          result.nextMutation.allowed,
        ).toBe(false);

        expect(
          result.nextMutation.reason,
        ).toBe(
          "Exactly one target file is required for the next atomic mutation.",
        );
      },
    );

    test(
      "reports unavailable build and test evidence without fabricating PASS",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              build: {
                command:
                  null,

                executed:
                  false,

                passed:
                  null,

                outputHash:
                  null,
              },

              tests: {
                command:
                  null,

                executed:
                  false,

                passed:
                  null,

                totalTests:
                  null,

                passedTests:
                  null,

                failedTests:
                  null,

                outputHash:
                  null,
              },
            }),
          );

        expect(
          result.posture.buildConfidence,
        ).toBe(0);

        expect(
          result.posture.testConfidence,
        ).toBe(0);

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-BUILD-NOT-EXECUTED",
          ),
        ).toBe(true);

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-TESTS-NOT-EXECUTED",
          ),
        ).toBe(true);

        expect(
          result.missingEvidence,
        ).toContain(
          "Build execution evidence",
        );

        expect(
          result.missingEvidence,
        ).toContain(
          "Test execution evidence",
        );
      },
    );

    test(
      "rejects legalCertification=true",
      () => {
        const invalidSnapshot = {
          ...createBaseSnapshot(),

          legalCertification:
            true,
        } as unknown as Mod001RepositorySnapshot;

        expect(
          () =>
            analyseRepositorySnapshot(
              invalidSnapshot,
            ),
        ).toThrow(
          "Repository Intelligence requires legalCertification=false",
        );
      },
    );

    test(
      "detects duplicate paths in the supplied repository snapshot",
      () => {
        const repeatedFile = {
          path:
            "src/modules/engines/mod-001-repository-intelligence-engine.ts",

          kind:
            "SOURCE" as const,

          hash:
            "sha256:duplicate",

          sizeBytes:
            20_000,

          summary:
            "Duplicate engine snapshot.",

          imports:
            [],

          exports:
            [
              "analyseRepositorySnapshot",
            ],

          inspected:
            true,
        };

        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot({
              files: [
                repeatedFile,
                repeatedFile,
              ],
            }),
          );

        expect(
          result.findings.some(
            (finding) =>
              finding.findingId ===
              "MOD001-FINDING-DUPLICATE-PATHS",
          ),
        ).toBe(true);
      },
    );

    test(
      "does not create persistent memory or automatic recall claims",
      () => {
        const result =
          analyseRepositorySnapshot(
            createBaseSnapshot(),
          );

        expect(
          result.governance.persistentMemoryCreated,
        ).toBe(false);

        expect(
          result.governance.automaticRecallUsed,
        ).toBe(false);

        expect(
          result.governance.humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance.legalCertification,
        ).toBe(false);
      },
    );
  },
);
