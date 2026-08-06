/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Improvement Planner Tests
 *
 * Verifies:
 * - deterministic roadmap generation;
 * - ordered dependencies;
 * - operator authorization boundary;
 * - explicit proposal acceptance boundary;
 * - optional knowledge-evolution integration;
 * - fail-closed governance.
 *
 * Read Only: true
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  createRuntimeImprovementPlan,
  RUNTIME_IMPROVEMENT_PLANNER_REVISION,
  type RuntimeImprovementPlanInput,
} from "../runtime-improvement-planner";

import type {
  RuntimeScientificCycleResult,
} from "../../scientific/runtime-scientific-cycle";

import type {
  RuntimeKnowledgeEvolutionResult,
} from "../../knowledge/runtime-knowledge-evolution";

const CYCLE_ID =
  "HBCE-SCIENTIFIC-CYCLE-TEST-001";

const CANDIDATE_ID =
  "EXPERIMENT-FINDING-001-TEST_FIRST";

const HYPOTHESIS_ID =
  "HYPOTHESIS-FINDING-001-TEST_FIRST";

function createScientificCycle(
  overrides:
    Partial<RuntimeScientificCycleResult> = {},
): RuntimeScientificCycleResult {
  const cycle =
    {
      revision:
        "AIJC2-RUNTIME-SCIENTIFIC-CYCLE-v1_0",

      cycleId:
        CYCLE_ID,

      generatedAt:
        "2026-08-06T19:45:00+02:00",

      status:
        "COMPLETED",

      capabilityAssessment: {
        revision:
          "AIJC2-RUNTIME-CAPABILITY-ASSESSMENT-v1_0",

        assessmentId:
          `${CYCLE_ID}-CAPABILITY-ASSESSMENT`,

        generatedAt:
          "2026-08-06T19:45:00+02:00",

        findings:
          Object.freeze([]),

        interventions:
          Object.freeze([]),

        summary: {
          totalFindings:
            1,

          criticalFindings:
            0,

          highFindings:
            1,

          mediumFindings:
            0,

          lowFindings:
            0,

          informationalFindings:
            0,

          interventionCandidates:
            1,

          recommendedInterventions:
            1,

          reviewRequiredInterventions:
            0,

          rejectedInterventions:
            0,

          capabilityScore:
            72,

          registeredCapabilities:
            8,

          capabilityGaps:
            1,
        },

        operatorAuthorized:
          true,

        governance: {
          readOnly:
            true,

          deterministic:
            true,

          failClosed:
            true,

          humanAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },

      scientificExperiments: {
        revision:
          "AIJC2-RUNTIME-SCIENTIFIC-EXPERIMENT-ENGINE-v1_0",

        executionId:
          `${CYCLE_ID}-SCIENTIFIC-EXPERIMENTS`,

        generatedAt:
          "2026-08-06T19:45:00+02:00",

        status:
          "RECOMMENDATION_AVAILABLE",

        questions:
          Object.freeze([]),

        hypotheses:
          Object.freeze([]),

        candidates:
          Object.freeze([]),

        ranking:
          Object.freeze([]),

        summary: {
          totalQuestions:
            1,

          totalHypotheses:
            3,

          totalCandidates:
            3,

          recommendedCandidates:
            1,

          reviewRequiredCandidates:
            2,

          rejectedCandidates:
            0,

          selectedCandidateId:
            CANDIDATE_ID,

          selectedHypothesisId:
            HYPOTHESIS_ID,

          highestScore:
            86,
        },

        operatorAuthorized:
          true,

        reasons:
          Object.freeze([
            "A deterministic candidate is available.",
          ]),

        governance: {
          readOnly:
            true,

          deterministic:
            true,

          failClosed:
            true,

          humanAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticSelection:
            false,

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },

      scientificDecision: {
        revision:
          "AIJC2-RUNTIME-SCIENTIFIC-DECISION-ENGINE-v1_0",

        decisionId:
          `${CYCLE_ID}-SCIENTIFIC-DECISION`,

        generatedAt:
          "2026-08-06T19:45:00+02:00",

        status:
          "DECISION_AVAILABLE",

        decision:
          "PROPOSE",

        proposal: {
          candidateId:
            CANDIDATE_ID,

          hypothesisId:
            HYPOTHESIS_ID,

          strategy:
            "TEST_FIRST",

          objective:
            "Resolve the selected runtime capability gap.",

          actionDescription:
            "Add deterministic tests and apply the smallest governed correction.",

          expectedEffect:
            "The selected capability gap is reduced without unrelated regressions.",

          acceptanceCriteria:
            Object.freeze([
              "TypeScript compilation passes.",
              "Production build passes.",
              "Relevant tests pass.",
              "Deterministic replay matches.",
            ]),

          rejectionCriteria:
            Object.freeze([
              "An unrelated regression is detected.",
              "The measured capability does not improve.",
            ]),

          expectedCost: {
            changedFiles:
              2,

            changedLines:
              160,

            affectedModules:
              1,

            addedTests:
              2,

            buildExecutions:
              2,

            operatorMinutes:
              40,
          },

          operatorAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticRepositoryMutation:
            false,
        },

        selectedRanking: {
          candidateId:
            CANDIDATE_ID,

          hypothesisId:
            HYPOTHESIS_ID,

          strategy:
            "TEST_FIRST",

          completionScore:
            88,

          benefitScore:
            88,

          regressionSafetyScore:
            98,

          reproducibilityScore:
            98,

          evidenceScore:
            85,

          efficiencyScore:
            80,

          riskPenalty:
            0,

          totalScore:
            86,

          rank:
            1,

          decision:
            "RECOMMEND",

          reasons:
            Object.freeze([
              "Candidate satisfies every scientific decision gate.",
            ]),
        },

        evidence: {
          experimentExecutionId:
            `${CYCLE_ID}-SCIENTIFIC-EXPERIMENTS`,

          candidateId:
            CANDIDATE_ID,

          hypothesisId:
            HYPOTHESIS_ID,

          totalScore:
            86,

          regressionSafetyScore:
            98,

          reproducibilityScore:
            98,

          evidenceScore:
            85,

          efficiencyScore:
            80,

          riskPenalty:
            0,

          scoreMargin:
            6,
        },

        gates:
          Object.freeze([]),

        reasons:
          Object.freeze([
            "The proposal satisfies every governed decision gate.",
          ]),

        operatorAuthorized:
          true,

        acceptedByOperator:
          true,

        governance: {
          readOnly:
            true,

          deterministic:
            true,

          failClosed:
            true,

          humanAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticSelection:
            false,

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },

      stages:
        Object.freeze([
          Object.freeze({
            stage:
              "CAPABILITY_ASSESSMENT",

            status:
              "PASS",

            description:
              "Capability assessment completed.",
          }),

          Object.freeze({
            stage:
              "SCIENTIFIC_EXPERIMENTS",

            status:
              "PASS",

            description:
              "Experiment recommendation available.",
          }),

          Object.freeze({
            stage:
              "SCIENTIFIC_DECISION",

            status:
              "PASS",

            description:
              "Scientific proposal accepted by the operator.",
          }),
        ]),

      summary: {
        capabilityScore:
          72,

        registeredCapabilities:
          8,

        capabilityGaps:
          1,

        findings:
          1,

        interventionCandidates:
          1,

        scientificQuestions:
          1,

        scientificHypotheses:
          3,

        experimentCandidates:
          3,

        selectedCandidateId:
          CANDIDATE_ID,

        selectedHypothesisId:
          HYPOTHESIS_ID,

        selectedExperimentScore:
          86,

        finalDecision:
          "PROPOSE",
      },

      reasons:
        Object.freeze([
          "The governed scientific cycle completed.",
        ]),

      operatorAuthorized:
        true,

      acceptedByOperator:
        true,

      governance: {
        readOnly:
          true,

        deterministic:
          true,

        failClosed:
          true,

        humanAuthorizationRequired:
          true,

        automaticExecution:
          false,

        automaticSelection:
          false,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        automaticRepositoryMutation:
          false,

        legalCertification:
          false,
      },

      legalCertification:
        false,
    } satisfies RuntimeScientificCycleResult;

  return {
    ...cycle,
    ...overrides,
  };
}

function createKnowledgeEvolution(
  overrides:
    Partial<RuntimeKnowledgeEvolutionResult> = {},
): RuntimeKnowledgeEvolutionResult {
  const evolution =
    {
      revision:
        "AIJC2-RUNTIME-KNOWLEDGE-EVOLUTION-v1_0",

      evolutionId:
        "HBCE-KNOWLEDGE-EVOLUTION-TEST-001",

      generatedAt:
        "2026-08-06T19:45:00+02:00",

      previousCycleId:
        "HBCE-SCIENTIFIC-CYCLE-TEST-000",

      currentCycleId:
        CYCLE_ID,

      status:
        "EVOLUTION_CONFIRMED",

      trend:
        "IMPROVEMENT",

      metrics:
        Object.freeze([]),

      findings:
        Object.freeze([]),

      decisionComparison: {
        previousDecision:
          "REVIEW_REQUIRED",

        currentDecision:
          "PROPOSE",

        changed:
          true,

        improved:
          true,

        regressed:
          false,
      },

      summary: {
        capabilityScoreDelta:
          7,

        registeredCapabilitiesDelta:
          1,

        capabilityGapsDelta:
          -1,

        findingsDelta:
          -1,

        interventionsDelta:
          -1,

        questionsDelta:
          -1,

        hypothesesDelta:
          -3,

        experimentCandidatesDelta:
          -3,

        selectedExperimentScoreDelta:
          6,

        newFindings:
          0,

        resolvedFindings:
          1,

        unchangedFindings:
          0,

        improvementSignals:
          5,

        regressionSignals:
          0,

        stableSignals:
          0,

        evolutionScore:
          80,

        trend:
          "IMPROVEMENT",
      },

      reasons:
        Object.freeze([
          "Capability score improved.",
        ]),

      operatorAuthorized:
        true,

      governance: {
        readOnly:
          true,

        deterministic:
          true,

        failClosed:
          true,

        humanAuthorizationRequired:
          true,

        automaticExecution:
          false,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        automaticRepositoryMutation:
          false,

        legalCertification:
          false,
      },

      legalCertification:
        false,
    } satisfies RuntimeKnowledgeEvolutionResult;

  return {
    ...evolution,
    ...overrides,
  };
}

function createInput(
  overrides:
    Partial<RuntimeImprovementPlanInput> = {},
): RuntimeImprovementPlanInput {
  return {
    planId:
      "HBCE-IMPROVEMENT-PLAN-TEST-001",

    generatedAt:
      "2026-08-06T19:45:00+02:00",

    scientificCycle:
      createScientificCycle(),

    knowledgeEvolution:
      createKnowledgeEvolution(),

    operatorAuthorized:
      true,

    acceptedByOperator:
      true,

    humanAuthorizationRequired:
      true,

    ...overrides,
  };
}

describe(
  "Runtime Improvement Planner",
  () => {
    it(
      "creates the complete six-step governed roadmap",
      () => {
        const result =
          createRuntimeImprovementPlan(
            createInput(),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_IMPROVEMENT_PLANNER_REVISION,
        );

        expect(
          result.status,
        ).toBe(
          "PLAN_READY",
        );

        expect(
          result.decision,
        ).toBe(
          "PROPOSE",
        );

        expect(
          result.steps,
        ).toHaveLength(6);

        expect(
          result.steps.map(
            (item) =>
              item.type,
          ),
        ).toEqual([
          "EVIDENCE",
          "TEST",
          "IMPLEMENTATION",
          "VALIDATION",
          "MEASUREMENT",
          "OPERATOR_REVIEW",
        ]);
      },
    );

    it(
      "creates deterministic output for identical input",
      () => {
        const input =
          createInput();

        const first =
          createRuntimeImprovementPlan(
            input,
          );

        const second =
          createRuntimeImprovementPlan(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "creates ordered and valid step dependencies",
      () => {
        const result =
          createRuntimeImprovementPlan(
            createInput(),
          );

        const [
          evidence,
          test,
          implementation,
          validation,
          measurement,
          operatorReview,
        ] = result.steps;

        expect(
          evidence.dependsOn,
        ).toEqual([]);

        expect(
          test.dependsOn,
        ).toEqual([
          evidence.id,
        ]);

        expect(
          implementation.dependsOn,
        ).toEqual([
          evidence.id,
          test.id,
        ]);

        expect(
          validation.dependsOn,
        ).toEqual([
          implementation.id,
        ]);

        expect(
          measurement.dependsOn,
        ).toEqual([
          validation.id,
        ]);

        expect(
          operatorReview.dependsOn,
        ).toEqual([
          measurement.id,
        ]);
      },
    );

    it(
      "keeps implementation stages under review without operator acceptance",
      () => {
        const scientificCycle =
          createScientificCycle({
            status:
              "REVIEW_REQUIRED",

            acceptedByOperator:
              false,

            scientificDecision: {
              ...createScientificCycle()
                .scientificDecision,

              status:
                "REVIEW_REQUIRED",

              decision:
                "REVIEW_REQUIRED",

              acceptedByOperator:
                false,
            },
          });

        const result =
          createRuntimeImprovementPlan(
            createInput({
              scientificCycle,

              acceptedByOperator:
                false,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          result.decision,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        const implementationStep =
          result.steps.find(
            (item) =>
              item.type ===
              "IMPLEMENTATION",
          );

        const validationStep =
          result.steps.find(
            (item) =>
              item.type ===
              "VALIDATION",
          );

        expect(
          implementationStep?.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );

        expect(
          validationStep?.status,
        ).toBe(
          "REVIEW_REQUIRED",
        );
      },
    );

    it(
      "produces no executable roadmap when no scientific proposal exists",
      () => {
        const scientificCycle =
          createScientificCycle({
            status:
              "BLOCKED",

            scientificDecision: {
              ...createScientificCycle()
                .scientificDecision,

              status:
                "BLOCKED",

              decision:
                "NO_ACTION",

              proposal:
                undefined,

              acceptedByOperator:
                false,
            },

            summary: {
              ...createScientificCycle()
                .summary,

              finalDecision:
                "NO_ACTION",
            },

            acceptedByOperator:
              false,
          });

        const result =
          createRuntimeImprovementPlan(
            createInput({
              scientificCycle,

              acceptedByOperator:
                false,

              knowledgeEvolution:
                undefined,
            }),
          );

        expect(
          result.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          result.decision,
        ).toBe(
          "NO_ACTION",
        );

        expect(
          result.objective,
        ).toBeUndefined();

        expect(
          result.steps,
        ).toHaveLength(0);
      },
    );

    it(
      "integrates the optional knowledge evolution report",
      () => {
        const result =
          createRuntimeImprovementPlan(
            createInput(),
          );

        expect(
          result.summary
            .evolutionTrend,
        ).toBe(
          "IMPROVEMENT",
        );

        expect(
          result.summary
            .evolutionScore,
        ).toBe(80);

        expect(
          result.objective
            ?.sourceEvolutionId,
        ).toBe(
          "HBCE-KNOWLEDGE-EVOLUTION-TEST-001",
        );
      },
    );

    it(
      "fails closed when knowledge evolution refers to another current cycle",
      () => {
        expect(
          () =>
            createRuntimeImprovementPlan(
              createInput({
                knowledgeEvolution:
                  createKnowledgeEvolution({
                    currentCycleId:
                      "DIFFERENT-CYCLE",
                  }),
              }),
            ),
        ).toThrow(
          "RUNTIME_IMPROVEMENT_PLANNER_EVOLUTION_CURRENT_CYCLE_MISMATCH",
        );
      },
    );

    it(
      "fails closed when acceptance is supplied without authorization",
      () => {
        expect(
          () =>
            createRuntimeImprovementPlan(
              createInput({
                operatorAuthorized:
                  false,

                acceptedByOperator:
                  true,
              }),
            ),
        ).toThrow(
          "RUNTIME_IMPROVEMENT_PLANNER_ACCEPTANCE_WITHOUT_AUTHORIZATION",
        );
      },
    );

    it(
      "calculates roadmap cost and risk summary",
      () => {
        const result =
          createRuntimeImprovementPlan(
            createInput(),
          );

        expect(
          result.summary
            .totalEstimatedChangedFiles,
        ).toBeGreaterThan(0);

        expect(
          result.summary
            .totalEstimatedChangedLines,
        ).toBeGreaterThan(0);

        expect(
          result.summary
            .totalEstimatedBuildExecutions,
        ).toBeGreaterThan(0);

        expect(
          result.summary
            .totalEstimatedOperatorMinutes,
        ).toBeGreaterThan(0);

        expect(
          [
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL",
          ],
        ).toContain(
          result.summary
            .highestRisk,
        );
      },
    );

    it(
      "preserves all HBCE governance boundaries",
      () => {
        const result =
          createRuntimeImprovementPlan(
            createInput(),
          );

        expect(
          result.governance.readOnly,
        ).toBe(true);

        expect(
          result.governance.deterministic,
        ).toBe(true);

        expect(
          result.governance.failClosed,
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

        expect(
          result.steps.every(
            (item) =>
              item.automaticExecution ===
                false &&
              item
                .automaticRepositoryMutation ===
                false,
          ),
        ).toBe(true);
      },
    );
  },
);
