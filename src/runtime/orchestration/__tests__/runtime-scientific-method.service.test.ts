/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method Orchestration Tests
 *
 * Verifies:
 * - complete stage composition;
 * - deterministic output;
 * - fail-closed interruption;
 * - governance boundaries.
 */

const mocks = vi.hoisted(() => ({
  executeRuntimeCapabilityPipeline: vi.fn(),
  createRuntimeExperimentPlan: vi.fn(),
  createIntegrationPlan: vi.fn(),
  validateIntegrationPlan: vi.fn(),
  scoreIntegration: vi.fn(),
  createKnowledgeCycle: vi.fn(),
  deriveCausalKnowledge: vi.fn(),
}));

vi.mock(
  "../../self/runtime-capability-pipeline",
  () => ({
    executeRuntimeCapabilityPipeline:
      mocks.executeRuntimeCapabilityPipeline,
  }),
);

vi.mock(
  "../../experiments/runtime-experiment-engine",
  () => ({
    createRuntimeExperimentPlan:
      mocks.createRuntimeExperimentPlan,
  }),
);

vi.mock(
  "../../integration/integration-planner",
  () => ({
    createIntegrationPlan:
      mocks.createIntegrationPlan,
  }),
);

vi.mock(
  "../../integration/integration-validator",
  () => ({
    validateIntegrationPlan:
      mocks.validateIntegrationPlan,
  }),
);

vi.mock(
  "../../../modules/mod-003/integration-score",
  () => ({
    scoreIntegration:
      mocks.scoreIntegration,
  }),
);

vi.mock(
  "../../knowledge/knowledge-engine",
  () => ({
    createKnowledgeCycle:
      mocks.createKnowledgeCycle,
  }),
);

vi.mock(
  "../../knowledge/causal-knowledge-engine",
  () => ({
    deriveCausalKnowledge:
      mocks.deriveCausalKnowledge,
  }),
);

import {
  executeRuntimeScientificMethod,
} from "../runtime-scientific-method.service";

import {
  RUNTIME_SCIENTIFIC_METHOD_REVISION,
  type RuntimeScientificMethodInput,
} from "../runtime-scientific-method.types";

const HYPOTHESIS_ID =
  "HBCE-SCIENTIFIC-METHOD-HYPOTHESIS-001";

const ACTION_ID =
  "HBCE-SCIENTIFIC-METHOD-ACTION-001";

function createInput(): RuntimeScientificMethodInput {
  return {
    executionId:
      "HBCE-SCIENTIFIC-METHOD-EXECUTION-001",

    revision:
      "HBCE-SCIENTIFIC-METHOD-INPUT-v1_0",

    generatedAt:
      "2026-08-06T15:30:00+02:00",

    runtimeVersion:
      "AI_JOKER_C2_SAAS_CORE_v0_1",

    mod001Analysis: {
      moduleId: "MOD-001",
      legalCertification: false,

      governance: {
        humanAuthorizationRequired: true,
        persistentMemoryCreated: false,
        automaticRecallUsed: false,
      },

      repository: {
        repositoryName:
          "hbce-ai-joker-c2",

        branch:
          "main",

        commitSha:
          "TEST-COMMIT",
      },
    } as RuntimeScientificMethodInput["mod001Analysis"],

    repository: {
      repository:
        "hbce-ai-joker-c2",

      branch:
        "main",

      commit:
        "TEST-COMMIT",

      fileCount:
        100,

      directoryCount:
        20,

      inspectedFileCount:
        10,

      buildPassed:
        true,

      testsPassed:
        true,
    },

    evolution: {
      enabled:
        false,

      addedFiles:
        0,

      removedFiles:
        0,

      modifiedFiles:
        0,

      unchangedFiles:
        100,
    },

    integration: {
      available:
        true,

      plannerAvailable:
        true,

      validatorAvailable:
        true,

      operatorAuthorized:
        true,
    },

    knowledge: {
      available:
        true,

      operatorAuthorized:
        true,

      automaticPersistence:
        false,

      automaticRecall:
        false,
    },

    experiment: {
      id:
        "HBCE-EXPERIMENT-001",

      objective:
        "Select the best governed integration.",

      observations: [
        {
          id:
            "OBS-001",

          description:
            "A capability integration is required.",

          source:
            "MOD-001",

          evidenceStatus:
            "PASS",
        },
      ],

      candidates: [
        {
          id:
            "EXP-A",

          hypothesis: {
            id:
              HYPOTHESIS_ID,

            statement:
              "Compose the existing runtime modules.",

            expectedEffect:
              "Produce one governed scientific-method pipeline.",

            falsifiable:
              true,

            supportingObservationIds: [
              "OBS-001",
            ],
          },

          actionDescription:
            "Compose existing runtime modules.",

          affectedPaths: [
            "src/runtime/orchestration/runtime-scientific-method.service.ts",
          ],

          expectedCompletion:
            100,

          expectedBenefit:
            100,

          expectedReproducibility:
            100,

          expectedRisk:
            "LOW",

          expectedCost: {
            changedFiles:
              1,

            changedLines:
              300,

            affectedModules:
              7,

            addedTests:
              1,

            buildExecutions:
              1,

            operatorMinutes:
              30,
          },

          operatorAuthorized:
            true,

          humanAuthorizationRequired:
            true,
        },

        {
          id:
            "EXP-B",

          hypothesis: {
            id:
              "HBCE-ALTERNATIVE-HYPOTHESIS-002",

            statement:
              "Create another isolated module.",

            expectedEffect:
              "Increase the number of components.",

            falsifiable:
              true,

            supportingObservationIds: [
              "OBS-001",
            ],
          },

          actionDescription:
            "Create another isolated module.",

          affectedPaths: [
            "src/runtime/unused-module.ts",
          ],

          expectedCompletion:
            50,

          expectedBenefit:
            20,

          expectedReproducibility:
            50,

          expectedRisk:
            "MEDIUM",

          expectedCost: {
            changedFiles:
              2,

            changedLines:
              500,

            affectedModules:
              2,

            addedTests:
              0,

            buildExecutions:
              2,

            operatorMinutes:
              60,
          },

          operatorAuthorized:
            true,

          humanAuthorizationRequired:
            true,
        },
      ],

      operatorAuthorized:
        true,

      referenceCost: {
        changedFiles:
          1,

        changedLines:
          300,

        affectedModules:
          7,

        addedTests:
          1,

        buildExecutions:
          1,

        operatorMinutes:
          30,
      },
    },

    integrationPlan: {
      objective:
        "Compose the existing runtime modules.",

      hypothesis: {
        id:
          HYPOTHESIS_ID,

        description:
          "Compose all existing runtime intelligence modules.",

        expectedEffect:
          "Produce one deterministic governed pipeline.",

        affectedPaths: [
          "src/runtime/orchestration/runtime-scientific-method.service.ts",
        ],
      },

      candidateTargets: [
        {
          path:
            "src/runtime/orchestration/runtime-scientific-method.service.ts",

          action:
            "CREATE_FILE",

          reason:
            "Compose the existing runtime stages.",
        },
      ],

      constraints: [
        {
          id:
            "HBCE-FAIL-CLOSED",

          description:
            "Stop at the first failed mandatory gate.",

          required:
            true,
        },
      ],

      expectedImpact: {
        capabilityGain:
          100,

        complexityChange:
          1,

        regressionRisk:
          "LOW",

        affectedModules: [
          "MOD-001",
          "MOD-003A",
          "EXPERIMENT",
          "KNOWLEDGE",
          "CAUSAL",
        ],

        expectedBenefits: [
          "Unified governed execution flow.",
        ],

        expectedRisks: [],
      },

      operatorAuthorized:
        true,
    },

    integrationScore: {
      hypothesis: {
        id:
          HYPOTHESIS_ID,

        description:
          "Compose all existing runtime intelligence modules.",

        expectedEffect:
          "Produce one deterministic governed pipeline.",

        affectedPaths: [
          "src/runtime/orchestration/runtime-scientific-method.service.ts",
        ],
      },

      verification: {
        buildStatus:
          "PASS",

        typeCheckStatus:
          "PASS",

        testStatus:
          "PASS",

        regressionStatus:
          "PASS",

        replayStatus:
          "PASS",
      },

      reference: {
        operatorDeclaredScore:
          0.22,

        externallyVerified:
          false,

        localBenchmarkScore:
          0.19736437499905826,

        sourceArtifact:
          "agi3-c3-d003 (1).ipynb",

        sourceRevision:
          "AGI3_C3_D003",
      },

      completionRatio:
        1,

      cost: {
        changedFiles:
          1,

        changedLines:
          300,

        affectedModules:
          7,

        addedTests:
          1,

        buildExecutions:
          1,

        operatorMinutes:
          30,

        referenceChangedFiles:
          1,

        referenceChangedLines:
          300,

        referenceAffectedModules:
          7,

        referenceAddedTests:
          1,

        referenceBuildExecutions:
          1,

        referenceOperatorMinutes:
          30,
      },

      governanceChecks: {
        humanAuthorizationPresent:
          true,

        auditTracePresent:
          true,

        legalCertificationFalse:
          true,

        automaticPersistenceDisabled:
          true,

        automaticRecallDisabled:
          true,
      },
    },

    knowledgeCycle: {
      id:
        "HBCE-KNOWLEDGE-CYCLE-001",

      createdAt:
        "2026-08-06T15:30:00+02:00",

      observations: [
        {
          id:
            "OBS-001",

          category:
            "REPOSITORY",

          description:
            "Existing runtime modules require orchestration.",

          evidenceStatus:
            "PASS",

          source: {
            artifact:
              "hbce-ai-joker-c2",

            commit:
              "TEST-COMMIT",
          },

          observedAt:
            "2026-08-06T15:30:00+02:00",
        },
      ],

      hypothesis: {
        id:
          HYPOTHESIS_ID,

        statement:
          "Composing the modules produces a unified runtime method.",

        expectedEffect:
          "All governed stages execute in deterministic order.",

        supportingObservationIds: [
          "OBS-001",
        ],

        affectedPaths: [
          "src/runtime/orchestration/runtime-scientific-method.service.ts",
        ],

        confidence:
          "HIGH",

        falsifiable:
          true,
      },

      action: {
        id:
          ACTION_ID,

        hypothesisId:
          HYPOTHESIS_ID,

        type:
          "CREATE_FILE",

        targetPath:
          "src/runtime/orchestration/runtime-scientific-method.service.ts",

        description:
          "Compose the governed runtime stages.",

        operatorAuthorized:
          true,

        humanAuthorizationRequired:
          true,

        executed:
          true,

        executionCommit:
          "TEST-COMMIT",
      },

      operatorAuthorized:
        true,
    },

    causal: {
      ruleId:
        "HBCE-CAUSAL-RULE-001",

      evaluation: {
        id:
          "HBCE-EVALUATION-001",

        hypothesisId:
          HYPOTHESIS_ID,

        actionId:
          ACTION_ID,

        completionStatus:
          "PASS",

        regressionStatus:
          "PASS",

        reproducibilityStatus:
          "PASS",

        metrics: [
          {
            name:
              "integration-score",

            value:
              100,

            unit:
              "points",

            minimumExpected:
              75,
          },
        ],

        score:
          100,

        decision:
          "ACCEPT",

        reasons: [
          "All governed gates passed.",
        ],

        evaluatedAt:
          "2026-08-06T15:30:00+02:00",
      },

      causeStatement:
        "Existing runtime components were isolated.",

      effectStatement:
        "The components formed one deterministic governed pipeline.",

      reusableRule:
        "When compatible governed components are isolated, compose them through one fail-closed orchestrator before adding new modules.",

      acceptedByOperator:
        true,
    },

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,
  };
}

function configureSuccessfulMocks(): void {
  mocks.executeRuntimeCapabilityPipeline.mockReturnValue({
    runtimeSelfState: {
      operationalStatus:
        "OPERATIONAL",

      legalCertification:
        false,
    },
  });

  mocks.createRuntimeExperimentPlan.mockReturnValue({
    decision:
      "SELECT",

    reasons: [
      "Candidate EXP-A selected.",
    ],

    plan: {
      selectedCandidateId:
        "EXP-A",

      candidates: [
        {
          id:
            "EXP-A",

          hypothesis: {
            id:
              HYPOTHESIS_ID,
          },
        },
      ],
    },
  });

  mocks.createIntegrationPlan.mockReturnValue({
    decision:
      "ACCEPT",

    reasons: [
      "Operator authorization present.",
    ],

    plan: {
      id:
        "PLAN-001",
    },
  });

  mocks.validateIntegrationPlan.mockReturnValue({
    status:
      "VALID",

    valid:
      true,

    executable:
      true,

    errors: [],
    warnings: [],
  });

  const scoredIntegration = {
    hypothesis: {
      id:
        HYPOTHESIS_ID,
    },

    verification: {
      buildStatus:
        "PASS",

      typeCheckStatus:
        "PASS",

      testStatus:
        "PASS",

      regressionStatus:
        "PASS",

      replayStatus:
        "PASS",
    },

    components: {
      completion:
        25,

      efficiency:
        20,

      regressionSafety:
        25,

      reproducibility:
        20,

      governance:
        10,
    },

    totalScore:
      100,

    decision:
      "ACCEPT",

    reasons: [
      "Integration score is 100/100.",
    ],

    reference: {
      operatorDeclaredScore:
        0.22,

      externallyVerified:
        false,

      sourceArtifact:
        "agi3-c3-d003 (1).ipynb",

      sourceRevision:
        "AGI3_C3_D003",
    },
  };

  mocks.scoreIntegration.mockReturnValue({
    result:
      scoredIntegration,

    legalCertification:
      false,
  });

  mocks.createKnowledgeCycle.mockReturnValue({
    decision:
      "ACCEPT",

    reasons: [
      "Operator authorization present.",
    ],

    cycle: {
      id:
        "HBCE-KNOWLEDGE-CYCLE-001",

      operatorAuthorized:
        true,

      humanAuthorizationRequired:
        true,

      observations:
        [],

      hypothesis: {
        id:
          HYPOTHESIS_ID,
      },

      action: {
        id:
          ACTION_ID,

        hypothesisId:
          HYPOTHESIS_ID,

        operatorAuthorized:
          true,

        humanAuthorizationRequired:
          true,
      },
    },
  });

  mocks.deriveCausalKnowledge.mockReturnValue({
    decision:
      "ACCEPT",

    reasons: [
      "Causal relation classified as SUPPORTS.",
    ],

    rule: {
      id:
        "HBCE-CAUSAL-RULE-001",
    },

    legalCertification:
      false,
  });
}

describe(
  "Runtime Scientific Method Service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
      configureSuccessfulMocks();
    });

    it(
      "executes the complete governed pipeline",
      () => {
        const result =
          executeRuntimeScientificMethod(
            createInput(),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_SCIENTIFIC_METHOD_REVISION,
        );

        expect(
          result.status,
        ).toBe(
          "COMPLETED",
        );

        expect(
          result.stages.map(
            (item) =>
              item.stage,
          ),
        ).toEqual([
          "CAPABILITY_ANALYSIS",
          "EXPERIMENT_RANKING",
          "INTEGRATION_PLANNING",
          "INTEGRATION_VALIDATION",
          "INTEGRATION_SCORING",
          "KNOWLEDGE_CYCLE",
          "CAUSAL_DERIVATION",
        ]);

        expect(
          result.stages.every(
            (item) =>
              item.status === "PASS",
          ),
        ).toBe(true);

        expect(
          mocks.executeRuntimeCapabilityPipeline,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.createRuntimeExperimentPlan,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.createIntegrationPlan,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.validateIntegrationPlan,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.scoreIntegration,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.createKnowledgeCycle,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.deriveCausalKnowledge,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "produces identical output for identical deterministic input",
      () => {
        const input =
          createInput();

        const first =
          executeRuntimeScientificMethod(
            input,
          );

        const second =
          executeRuntimeScientificMethod(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "stops before downstream stages when experiment ranking rejects",
      () => {
        mocks.createRuntimeExperimentPlan.mockReturnValue({
          decision:
            "REJECT",

          reasons: [
            "No candidate satisfies the governed gates.",
          ],

          plan: {
            selectedCandidateId:
              undefined,

            candidates:
              [],
          },
        });

        expect(
          () =>
            executeRuntimeScientificMethod(
              createInput(),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_METHOD_EXPERIMENT_STAGE_REJECTED",
        );

        expect(
          mocks.executeRuntimeCapabilityPipeline,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.createRuntimeExperimentPlan,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.createIntegrationPlan,
        ).not.toHaveBeenCalled();

        expect(
          mocks.validateIntegrationPlan,
        ).not.toHaveBeenCalled();

        expect(
          mocks.scoreIntegration,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createKnowledgeCycle,
        ).not.toHaveBeenCalled();

        expect(
          mocks.deriveCausalKnowledge,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "stops immediately when runtime capability posture is blocked",
      () => {
        mocks.executeRuntimeCapabilityPipeline.mockReturnValue({
          runtimeSelfState: {
            operationalStatus:
              "BLOCKED",

            legalCertification:
              false,
          },
        });

        expect(
          () =>
            executeRuntimeScientificMethod(
              createInput(),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_METHOD_CAPABILITY_STAGE_BLOCKED",
        );

        expect(
          mocks.createRuntimeExperimentPlan,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createIntegrationPlan,
        ).not.toHaveBeenCalled();

        expect(
          mocks.scoreIntegration,
        ).not.toHaveBeenCalled();

        expect(
          mocks.createKnowledgeCycle,
        ).not.toHaveBeenCalled();

        expect(
          mocks.deriveCausalKnowledge,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails closed when the selected experiment and integration hypothesis differ",
      () => {
        mocks.createRuntimeExperimentPlan.mockReturnValue({
          decision:
            "SELECT",

          reasons: [
            "Candidate EXP-B selected.",
          ],

          plan: {
            selectedCandidateId:
              "EXP-B",

            candidates: [
              {
                id:
                  "EXP-B",

                hypothesis: {
                  id:
                    "DIFFERENT-HYPOTHESIS",
                },
              },
            ],
          },
        });

        expect(
          () =>
            executeRuntimeScientificMethod(
              createInput(),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_METHOD_SELECTED_HYPOTHESIS_MISMATCH",
        );

        expect(
          mocks.createIntegrationPlan,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "preserves all HBCE governance boundaries",
      () => {
        const result =
          executeRuntimeScientificMethod(
            createInput(),
          );

        expect(
          result.governance.readOnly,
        ).toBe(true);

        expect(
          result.governance.deterministic,
        ).toBe(true);

        expect(
          result.governance
            .humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.governance
            .automaticExecution,
        ).toBe(false);

        expect(
          result.governance
            .automaticPersistence,
        ).toBe(false);

        expect(
          result.governance
            .automaticRecall,
        ).toBe(false);

        expect(
          result.governance
            .automaticRepositoryMutation,
        ).toBe(false);

        expect(
          result.governance
            .legalCertification,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);
