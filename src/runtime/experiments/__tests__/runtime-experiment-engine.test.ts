/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Experiment Engine Tests
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  createRuntimeExperimentPlan,
  RUNTIME_EXPERIMENT_ENGINE_REVISION,
  type RuntimeExperimentCandidate,
  type RuntimeExperimentInput,
  type RuntimeExperimentObservation,
} from "../runtime-experiment-engine";

const OBSERVATIONS: readonly RuntimeExperimentObservation[] =
  Object.freeze([
    Object.freeze({
      id: "OBS-001",
      description:
        "Runtime capability extraction exists but is not yet composed into a complete pipeline.",
      source:
        "src/runtime/self/runtime-capability-extractor.ts",
      evidenceStatus: "PASS",
    }),

    Object.freeze({
      id: "OBS-002",
      description:
        "The repository requires deterministic ranking of competing integration hypotheses.",
      source:
        "HBCE-AGI3-INTEGRATION-PROGRAM",
      evidenceStatus: "OPERATOR_DECLARED",
    }),
  ]);

const CANDIDATES: readonly RuntimeExperimentCandidate[] =
  Object.freeze([
    Object.freeze({
      id: "EXP-A",

      hypothesis: Object.freeze({
        id: "HYP-A",
        statement:
          "Adding one deterministic pipeline composer will connect existing runtime-self components with minimal architectural expansion.",
        expectedEffect:
          "Capability extraction, registry analysis and runtime-self projection become one verifiable flow.",
        falsifiable: true,
        supportingObservationIds: Object.freeze([
          "OBS-001",
          "OBS-002",
        ]),
      }),

      actionDescription:
        "Create one runtime capability pipeline composer and one focused test.",

      affectedPaths: Object.freeze([
        "src/runtime/self/runtime-capability-pipeline.ts",
        "src/runtime/self/__tests__/runtime-capability-pipeline.test.ts",
      ]),

      expectedCompletion: 95,
      expectedBenefit: 92,
      expectedReproducibility: 98,

      expectedRisk: "LOW",

      expectedCost: Object.freeze({
        changedFiles: 2,
        changedLines: 260,
        affectedModules: 4,
        addedTests: 1,
        buildExecutions: 1,
        operatorMinutes: 35,
      }),

      operatorAuthorized: true,
      humanAuthorizationRequired: true,
    }),

    Object.freeze({
      id: "EXP-B",

      hypothesis: Object.freeze({
        id: "HYP-B",
        statement:
          "Creating a new recommendation engine before composing the existing pipeline will accelerate runtime evolution.",
        expectedEffect:
          "The runtime immediately proposes future capability changes.",
        falsifiable: true,
        supportingObservationIds: Object.freeze([
          "OBS-002",
        ]),
      }),

      actionDescription:
        "Create a recommendation engine and new capability ranking contracts.",

      affectedPaths: Object.freeze([
        "src/runtime/recommendations/runtime-capability-recommendation-engine.ts",
        "src/runtime/recommendations/recommendation-types.ts",
        "src/runtime/recommendations/__tests__/runtime-capability-recommendation-engine.test.ts",
      ]),

      expectedCompletion: 80,
      expectedBenefit: 88,
      expectedReproducibility: 85,

      expectedRisk: "MEDIUM",

      expectedCost: Object.freeze({
        changedFiles: 3,
        changedLines: 520,
        affectedModules: 6,
        addedTests: 1,
        buildExecutions: 2,
        operatorMinutes: 70,
      }),

      operatorAuthorized: true,
      humanAuthorizationRequired: true,
    }),

    Object.freeze({
      id: "EXP-C",

      hypothesis: Object.freeze({
        id: "HYP-C",
        statement:
          "Refactoring the entire runtime-self architecture in one intervention will remove all current integration gaps.",
        expectedEffect:
          "All runtime-self modules are replaced by one unified architecture.",
        falsifiable: true,
        supportingObservationIds: Object.freeze([
          "OBS-001",
        ]),
      }),

      actionDescription:
        "Replace capability registry, extractor, runtime-self service and knowledge integration in one large refactor.",

      affectedPaths: Object.freeze([
        "src/runtime/self/runtime-capability-registry.ts",
        "src/runtime/self/runtime-capability-extractor.ts",
        "src/runtime/self/runtime-self.service.ts",
        "src/runtime/knowledge/knowledge-engine.ts",
        "src/runtime/knowledge/causal-knowledge-engine.ts",
      ]),

      expectedCompletion: 90,
      expectedBenefit: 96,
      expectedReproducibility: 70,

      expectedRisk: "HIGH",

      expectedCost: Object.freeze({
        changedFiles: 5,
        changedLines: 1400,
        affectedModules: 9,
        addedTests: 3,
        buildExecutions: 5,
        operatorMinutes: 180,
      }),

      operatorAuthorized: true,
      humanAuthorizationRequired: true,
    }),
  ]);

function createInput(
  overrides: Partial<RuntimeExperimentInput> = {},
): RuntimeExperimentInput {
  return {
    id:
      "HBCE-RUNTIME-EXPERIMENT-001",

    objective:
      "Select the next integration with the best completion, benefit, reproducibility, efficiency and risk profile.",

    observations:
      OBSERVATIONS,

    candidates:
      CANDIDATES,

    operatorAuthorized:
      true,

    referenceCost:
      Object.freeze({
        changedFiles: 2,
        changedLines: 260,
        affectedModules: 4,
        addedTests: 1,
        buildExecutions: 1,
        operatorMinutes: 35,
      }),

    ...overrides,
  };
}

describe(
  "Runtime Experiment Engine",
  () => {
    it(
      "selects the strongest eligible candidate",
      () => {
        const result =
          createRuntimeExperimentPlan(
            createInput(),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_EXPERIMENT_ENGINE_REVISION,
        );

        expect(
          result.decision,
        ).toBe("SELECT");

        expect(
          result.plan.status,
        ).toBe("AUTHORIZED");

        expect(
          result.plan.selectedCandidateId,
        ).toBe("EXP-A");

        expect(
          result.plan.ranking[0]
            .candidateId,
        ).toBe("EXP-A");

        expect(
          result.plan.ranking[0]
            .rank,
        ).toBe(1);

        expect(
          result.plan.ranking[0]
            .decision,
        ).toBe("SELECT");
      },
    );

    it(
      "produces identical ranking for identical input",
      () => {
        const input =
          createInput();

        const first =
          createRuntimeExperimentPlan(
            input,
          );

        const second =
          createRuntimeExperimentPlan(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "ranks all candidates deterministically",
      () => {
        const result =
          createRuntimeExperimentPlan(
            createInput(),
          );

        expect(
          result.plan.ranking.map(
            (item) =>
              item.candidateId,
          ),
        ).toEqual([
          "EXP-A",
          "EXP-B",
          "EXP-C",
        ]);

        expect(
          result.plan.ranking.map(
            (item) =>
              item.rank,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);
      },
    );

    it(
      "penalizes oversized and risky experiments",
      () => {
        const result =
          createRuntimeExperimentPlan(
            createInput(),
          );

        const efficient =
          result.plan.ranking.find(
            (item) =>
              item.candidateId ===
              "EXP-A",
          );

        const oversized =
          result.plan.ranking.find(
            (item) =>
              item.candidateId ===
              "EXP-C",
          );

        expect(efficient).toBeDefined();
        expect(oversized).toBeDefined();

        expect(
          efficient!.efficiencyScore,
        ).toBe(100);

        expect(
          oversized!.efficiencyScore,
        ).toBeLessThan(
          efficient!.efficiencyScore,
        );

        expect(
          oversized!.riskPenalty,
        ).toBe(25);

        expect(
          oversized!.totalScore,
        ).toBeLessThan(
          efficient!.totalScore,
        );
      },
    );

    it(
      "requires plan-level operator authorization",
      () => {
        const result =
          createRuntimeExperimentPlan(
            createInput({
              operatorAuthorized:
                false,
            }),
          );

        expect(
          result.decision,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.plan.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.plan.selectedCandidateId,
        ).toBeUndefined();

        expect(
          result.plan.reasons,
        ).toBeUndefined();
      },
    );

    it(
      "rejects a candidate lacking operator authorization",
      () => {
        const unauthorizedCandidate:
          RuntimeExperimentCandidate =
            Object.freeze({
              ...CANDIDATES[0],
              id: "EXP-UNAUTHORIZED",

              hypothesis:
                Object.freeze({
                  ...CANDIDATES[0]
                    .hypothesis,

                  id:
                    "HYP-UNAUTHORIZED",
                }),

              operatorAuthorized:
                false,
            });

        const result =
          createRuntimeExperimentPlan(
            createInput({
              candidates:
                Object.freeze([
                  unauthorizedCandidate,
                  CANDIDATES[1],
                ]),
            }),
          );

        const ranking =
          result.plan.ranking.find(
            (item) =>
              item.candidateId ===
              "EXP-UNAUTHORIZED",
          );

        expect(ranking).toBeDefined();

        expect(
          ranking!.decision,
        ).toBe("REJECT");

        expect(
          ranking!.reasons,
        ).toContain(
          "Candidate lacks operator authorization.",
        );
      },
    );

    it(
      "rejects a critical-risk candidate",
      () => {
        const criticalCandidate:
          RuntimeExperimentCandidate =
            Object.freeze({
              ...CANDIDATES[0],
              id:
                "EXP-CRITICAL",

              hypothesis:
                Object.freeze({
                  ...CANDIDATES[0]
                    .hypothesis,

                  id:
                    "HYP-CRITICAL",
                }),

              expectedRisk:
                "CRITICAL",
            });

        const result =
          createRuntimeExperimentPlan(
            createInput({
              candidates:
                Object.freeze([
                  criticalCandidate,
                  CANDIDATES[1],
                ]),
            }),
          );

        const ranking =
          result.plan.ranking.find(
            (item) =>
              item.candidateId ===
              "EXP-CRITICAL",
          );

        expect(ranking).toBeDefined();

        expect(
          ranking!.decision,
        ).toBe("REJECT");

        expect(
          ranking!.riskPenalty,
        ).toBe(50);
      },
    );

    it(
      "requires at least two experimental candidates",
      () => {
        expect(
          () =>
            createRuntimeExperimentPlan(
              createInput({
                candidates:
                  Object.freeze([
                    CANDIDATES[0],
                  ]),
              }),
            ),
        ).toThrow(
          "RUNTIME_EXPERIMENT_MULTIPLE_CANDIDATES_REQUIRED",
        );
      },
    );

    it(
      "fails closed for unknown supporting observations",
      () => {
        const invalidCandidate:
          RuntimeExperimentCandidate =
            Object.freeze({
              ...CANDIDATES[0],

              id:
                "EXP-UNKNOWN-OBS",

              hypothesis:
                Object.freeze({
                  ...CANDIDATES[0]
                    .hypothesis,

                  id:
                    "HYP-UNKNOWN-OBS",

                  supportingObservationIds:
                    Object.freeze([
                      "OBS-DOES-NOT-EXIST",
                    ]),
                }),
            });

        expect(
          () =>
            createRuntimeExperimentPlan(
              createInput({
                candidates:
                  Object.freeze([
                    invalidCandidate,
                    CANDIDATES[1],
                  ]),
              }),
            ),
        ).toThrow(
          "RUNTIME_EXPERIMENT_UNKNOWN_OBSERVATION:EXP-UNKNOWN-OBS:OBS-DOES-NOT-EXIST",
        );
      },
    );

    it(
      "fails closed for duplicate candidate identifiers",
      () => {
        expect(
          () =>
            createRuntimeExperimentPlan(
              createInput({
                candidates:
                  Object.freeze([
                    CANDIDATES[0],
                    CANDIDATES[0],
                  ]),
              }),
            ),
        ).toThrow(
          "RUNTIME_EXPERIMENT_DUPLICATE_CANDIDATE",
        );
      },
    );

    it(
      "preserves all governance boundaries",
      () => {
        const result =
          createRuntimeExperimentPlan(
            createInput(),
          );

        expect(
          result.plan
            .humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.plan
            .automaticExecution,
        ).toBe(false);

        expect(
          result.plan
            .automaticRepositoryMutation,
        ).toBe(false);

        expect(
          result.plan
            .automaticPersistence,
        ).toBe(false);

        expect(
          result.plan
            .automaticRecall,
        ).toBe(false);

        expect(
          result.plan
            .legalCertification,
        ).toBe(false);

        expect(
          result.legalCertification,
        ).toBe(false);
      },
    );
  },
);
