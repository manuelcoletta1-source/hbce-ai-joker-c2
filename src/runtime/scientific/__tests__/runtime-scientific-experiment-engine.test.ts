/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Experiment Engine Tests
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Selection: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  createRuntimeScientificExperiments,
  RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION,
  type RuntimeScientificExperimentEngineInput,
} from "../runtime-scientific-experiment-engine";

import type {
  RuntimeCapabilityAssessmentResult,
} from "../../self/runtime-capability-assessment";

function createCapabilityAssessment(
  overrides:
    Partial<RuntimeCapabilityAssessmentResult> = {},
): RuntimeCapabilityAssessmentResult {
  return {
    revision:
      "AIJC2-RUNTIME-CAPABILITY-ASSESSMENT-v1_0",

    assessmentId:
      "HBCE-CAPABILITY-ASSESSMENT-TEST-001",

    generatedAt:
      "2026-08-06T18:15:00+02:00",

    findings:
      Object.freeze([
        Object.freeze({
          id:
            "FINDING-CAPABILITY-GAP-001",

          category:
            "CAPABILITY_GAP",

          severity:
            "HIGH",

          title:
            "Semantic repository analysis is incomplete",

          description:
            "MOD-002 is not yet receiving every authorized source inspection.",

          evidence:
            Object.freeze([
              "Capability identifier: REPOSITORY-SEMANTIC-ANALYSIS.",
              "Capability score: 45/100.",
            ]),

          affectedCapabilityId:
            "REPOSITORY-SEMANTIC-ANALYSIS",

          score:
            45,

          operatorReviewRequired:
            true,
        }),
      ]),

    interventions:
      Object.freeze([
        Object.freeze({
          id:
            "INTERVENTION-FINDING-CAPABILITY-GAP-001",

          findingId:
            "FINDING-CAPABILITY-GAP-001",

          title:
            "Resolve capability gap: REPOSITORY-SEMANTIC-ANALYSIS",

          hypothesis:
            "If inspected files are composed into MOD-002, semantic capability coverage will improve.",

          expectedEffect:
            "The semantic capability gap is reduced.",

          priorityScore:
            82,

          expectedBenefit:
            88,

          expectedRisk:
            35,

          expectedEffort:
            50,

          evidenceConfidence:
            85,

          decision:
            "RECOMMEND",

          reasons:
            Object.freeze([
              "Priority score: 82/100.",
            ]),

          humanAuthorizationRequired:
            true,

          automaticExecution:
            false,

          automaticRepositoryMutation:
            false,
        }),
      ]),

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
        45,

      registeredCapabilities:
        1,

      capabilityGaps:
        1,
    },

    topRecommendation: {
      id:
        "INTERVENTION-FINDING-CAPABILITY-GAP-001",

      findingId:
        "FINDING-CAPABILITY-GAP-001",

      title:
        "Resolve capability gap: REPOSITORY-SEMANTIC-ANALYSIS",

      hypothesis:
        "If inspected files are composed into MOD-002, semantic capability coverage will improve.",

      expectedEffect:
        "The semantic capability gap is reduced.",

      priorityScore:
        82,

      expectedBenefit:
        88,

      expectedRisk:
        35,

      expectedEffort:
        50,

      evidenceConfidence:
        85,

      decision:
        "RECOMMEND",

      reasons:
        Object.freeze([
          "Priority score: 82/100.",
        ]),

      humanAuthorizationRequired:
        true,

      automaticExecution:
        false,

      automaticRepositoryMutation:
        false,
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

    ...overrides,
  };
}

function createInput(
  overrides:
    Partial<RuntimeScientificExperimentEngineInput> = {},
): RuntimeScientificExperimentEngineInput {
  return {
    executionId:
      "HBCE-SCIENTIFIC-EXPERIMENT-TEST-001",

    generatedAt:
      "2026-08-06T18:15:00+02:00",

    capabilityAssessment:
      createCapabilityAssessment(),

    hypothesesPerFinding:
      3,

    operatorAuthorized:
      true,

    ...overrides,
  };
}

describe(
  "Runtime Scientific Experiment Engine",
  () => {
    it(
      "creates competing scientific hypotheses from capability findings",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput(),
          );

        expect(
          result.revision,
        ).toBe(
          RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION,
        );

        expect(
          result.questions,
        ).toHaveLength(1);

        expect(
          result.hypotheses,
        ).toHaveLength(3);

        expect(
          result.candidates,
        ).toHaveLength(3);

        expect(
          result.ranking,
        ).toHaveLength(3);

        expect(
          result.summary.totalQuestions,
        ).toBe(1);

        expect(
          result.summary.totalHypotheses,
        ).toBe(3);

        expect(
          result.summary.totalCandidates,
        ).toBe(3);
      },
    );

    it(
      "uses distinct strategies for competing hypotheses",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput(),
          );

        expect(
          result.hypotheses.map(
            (hypothesis) =>
              hypothesis.strategy,
          ),
        ).toEqual([
          "MINIMAL_PATCH",
          "TEST_FIRST",
          "COMPOSITION",
        ]);
      },
    );

    it(
      "ranks candidates deterministically",
      () => {
        const first =
          createRuntimeScientificExperiments(
            createInput(),
          );

        const second =
          createRuntimeScientificExperiments(
            createInput(),
          );

        expect(second).toEqual(first);

        expect(
          first.ranking.map(
            (candidate) =>
              candidate.rank,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          first.ranking[0]
            .totalScore,
        ).toBeGreaterThanOrEqual(
          first.ranking[1]
            .totalScore,
        );
      },
    );

    it(
      "creates falsifiable hypotheses",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput(),
          );

        expect(
          result.questions.every(
            (question) =>
              question.falsifiable,
          ),
        ).toBe(true);

        expect(
          result.hypotheses.every(
            (hypothesis) =>
              hypothesis
                .falsificationCondition
                .length > 0,
          ),
        ).toBe(true);
      },
    );

    it(
      "creates explicit acceptance and rejection criteria",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput(),
          );

        expect(
          result.candidates.every(
            (candidate) =>
              candidate.acceptanceCriteria
                .length > 0,
          ),
        ).toBe(true);

        expect(
          result.candidates.every(
            (candidate) =>
              candidate.rejectionCriteria
                .length > 0,
          ),
        ).toBe(true);
      },
    );

    it(
      "does not recommend experiments without operator authorization",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput({
              operatorAuthorized:
                false,
            }),
          );

        expect(
          result.operatorAuthorized,
        ).toBe(false);

        expect(
          result.ranking.every(
            (candidate) =>
              candidate.decision !==
              "RECOMMEND",
          ),
        ).toBe(true);

        expect(
          result.selectedCandidate,
        ).toBeUndefined();

        expect(
          result.summary
            .selectedCandidateId,
        ).toBeUndefined();
      },
    );

    it(
      "supports the maximum of five hypotheses per finding",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput({
              hypothesesPerFinding:
                5,
            }),
          );

        expect(
          result.hypotheses,
        ).toHaveLength(5);

        expect(
          result.candidates,
        ).toHaveLength(5);

        expect(
          result.hypotheses.map(
            (hypothesis) =>
              hypothesis.strategy,
          ),
        ).toEqual([
          "MINIMAL_PATCH",
          "TEST_FIRST",
          "COMPOSITION",
          "EVIDENCE_EXPANSION",
          "REFACTOR",
        ]);
      },
    );

    it(
      "fails closed for an invalid hypothesis count",
      () => {
        expect(
          () =>
            createRuntimeScientificExperiments(
              createInput({
                hypothesesPerFinding:
                  1,
              }),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_EXPERIMENT_HYPOTHESIS_COUNT_INVALID",
        );

        expect(
          () =>
            createRuntimeScientificExperiments(
              createInput({
                hypothesesPerFinding:
                  6,
              }),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_EXPERIMENT_HYPOTHESIS_COUNT_INVALID",
        );
      },
    );

    it(
      "fails closed when an intervention is missing",
      () => {
        expect(
          () =>
            createRuntimeScientificExperiments(
              createInput({
                capabilityAssessment:
                  createCapabilityAssessment({
                    interventions:
                      Object.freeze([]),

                    topRecommendation:
                      undefined,
                  }),
              }),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_EXPERIMENT_INTERVENTION_MISSING:FINDING-CAPABILITY-GAP-001",
        );
      },
    );

    it(
      "returns blocked when no capability findings exist",
      () => {
        const result =
          createRuntimeScientificExperiments(
            createInput({
              capabilityAssessment:
                createCapabilityAssessment({
                  findings:
                    Object.freeze([]),

                  interventions:
                    Object.freeze([]),

                  topRecommendation:
                    undefined,
                }),
            }),
          );

        expect(
          result.status,
        ).toBe(
          "BLOCKED",
        );

        expect(
          result.questions,
        ).toHaveLength(0);

        expect(
          result.candidates,
        ).toHaveLength(0);

        expect(
          result.ranking,
        ).toHaveLength(0);
      },
    );

    it(
      "fails closed when legalCertification is not false",
      () => {
        const invalidAssessment =
          createCapabilityAssessment() as
            RuntimeCapabilityAssessmentResult & {
              legalCertification:
                boolean;
            };

        Object.defineProperty(
          invalidAssessment,
          "legalCertification",
          {
            value:
              true,

            configurable:
              true,
          },
        );

        expect(
          () =>
            createRuntimeScientificExperiments(
              createInput({
                capabilityAssessment:
                  invalidAssessment,
              }),
            ),
        ).toThrow(
          "RUNTIME_SCIENTIFIC_EXPERIMENT_LEGAL_BOUNDARY_VIOLATION",
        );
      },
    );

    it(
      "preserves all HBCE governance boundaries",
      () => {
        const result =
          createRuntimeScientificExperiments(
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
            .automaticSelection,
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
