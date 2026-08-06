/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003A
 * Human-Parity Integration Scorer Tests
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  INTEGRATION_SCORER_REVISION,
  scoreIntegration,
  type IntegrationScoreInput,
} from "../integration-score";

import {
  ARC_AGI_3_OPERATOR_REFERENCE,
  type IntegrationHypothesis,
  type IntegrationVerification,
} from "../integration-score.types";

const HYPOTHESIS: Readonly<IntegrationHypothesis> =
  Object.freeze({
    id: "HBCE-INTEGRATION-HYPOTHESIS-001",

    description:
      "A bounded repository integration can add the required capability without regressions.",

    expectedEffect:
      "The integration compiles, passes tests and produces deterministic replay evidence.",

    affectedPaths: Object.freeze([
      "src/modules/mod-003/integration-score.ts",
      "src/modules/mod-003/__tests__/integration-score.test.ts",
    ]),
  });

const PASS_VERIFICATION: Readonly<IntegrationVerification> =
  Object.freeze({
    buildStatus: "PASS",
    typeCheckStatus: "PASS",
    testStatus: "PASS",
    regressionStatus: "PASS",
    replayStatus: "PASS",
  });

function createInput(
  overrides: Partial<IntegrationScoreInput> = {},
): IntegrationScoreInput {
  return {
    hypothesis: HYPOTHESIS,

    verification: PASS_VERIFICATION,

    reference:
      ARC_AGI_3_OPERATOR_REFERENCE,

    completionRatio: 1,

    cost: {
      changedFiles: 2,
      changedLines: 120,
      affectedModules: 1,
      addedTests: 1,
      buildExecutions: 1,
      operatorMinutes: 20,

      referenceChangedFiles: 2,
      referenceChangedLines: 120,
      referenceAffectedModules: 1,
      referenceAddedTests: 1,
      referenceBuildExecutions: 1,
      referenceOperatorMinutes: 20,
    },

    governanceChecks: {
      humanAuthorizationPresent: true,
      auditTracePresent: true,
      legalCertificationFalse: true,
      automaticPersistenceDisabled: true,
      automaticRecallDisabled: true,
    },

    ...overrides,
  };
}

describe(
  "MOD-003A Human-Parity Integration Scorer",
  () => {
    it(
      "accepts a complete, efficient and governed integration",
      () => {
        const evaluation =
          scoreIntegration(
            createInput(),
          );

        expect(
          evaluation.revision,
        ).toBe(
          INTEGRATION_SCORER_REVISION,
        );

        expect(
          evaluation.result.totalScore,
        ).toBe(100);

        expect(
          evaluation.result.decision,
        ).toBe("ACCEPT");

        expect(
          evaluation.result.components,
        ).toEqual({
          completion: 25,
          efficiency: 20,
          regressionSafety: 25,
          reproducibility: 20,
          governance: 10,
        });

        expect(
          evaluation.efficiency
            .meanEfficiency,
        ).toBe(1);

        expect(
          evaluation.efficiency
            .squaredEfficiency,
        ).toBe(1);

        expect(
          evaluation.legalCertification,
        ).toBe(false);
      },
    );

    it(
      "produces identical output for identical deterministic input",
      () => {
        const input =
          createInput();

        const first =
          scoreIntegration(
            input,
          );

        const second =
          scoreIntegration(
            input,
          );

        expect(second).toEqual(first);
      },
    );

    it(
      "quadratically penalizes an oversized integration",
      () => {
        const evaluation =
          scoreIntegration(
            createInput({
              cost: {
                changedFiles: 4,
                changedLines: 240,
                affectedModules: 2,
                addedTests: 2,
                buildExecutions: 2,
                operatorMinutes: 40,

                referenceChangedFiles: 2,
                referenceChangedLines: 120,
                referenceAffectedModules: 1,
                referenceAddedTests: 1,
                referenceBuildExecutions: 1,
                referenceOperatorMinutes: 20,
              },
            }),
          );

        expect(
          evaluation.efficiency
            .changedFiles,
        ).toBe(0.25);

        expect(
          evaluation.efficiency
            .meanEfficiency,
        ).toBe(0.25);

        expect(
          evaluation.efficiency
            .squaredEfficiency,
        ).toBe(0.0625);

        expect(
          evaluation.result.totalScore,
        ).toBe(6);

        expect(
          evaluation.result.decision,
        ).toBe("REVIEW_REQUIRED");
      },
    );

    it(
      "requires review when deterministic replay was not executed",
      () => {
        const evaluation =
          scoreIntegration(
            createInput({
              verification: {
                ...PASS_VERIFICATION,
                replayStatus: "NOT_RUN",
              },
            }),
          );

        expect(
          evaluation.result.totalScore,
        ).toBe(0);

        expect(
          evaluation.result.components
            .reproducibility,
        ).toBe(0);

        expect(
          evaluation.result.decision,
        ).toBe("REVIEW_REQUIRED");

        expect(
          evaluation.result.reasons,
        ).toContain(
          "Deterministic replay was not executed.",
        );
      },
    );

    it(
      "rejects an integration when regression evidence fails",
      () => {
        const evaluation =
          scoreIntegration(
            createInput({
              verification: {
                ...PASS_VERIFICATION,
                regressionStatus: "FAIL",
              },
            }),
          );

        expect(
          evaluation.result.totalScore,
        ).toBe(0);

        expect(
          evaluation.result.components
            .regressionSafety,
        ).toBe(0);

        expect(
          evaluation.result.decision,
        ).toBe("REJECT");

        expect(
          evaluation.result.reasons,
        ).toContain(
          "Regression evidence failed.",
        );
      },
    );

    it(
      "rejects an integration without human authorization",
      () => {
        const evaluation =
          scoreIntegration(
            createInput({
              governanceChecks: {
                humanAuthorizationPresent: false,
                auditTracePresent: true,
                legalCertificationFalse: true,
                automaticPersistenceDisabled: true,
                automaticRecallDisabled: true,
              },
            }),
          );

        expect(
          evaluation.result.decision,
        ).toBe("REJECT");

        expect(
          evaluation.result.reasons,
        ).toContain(
          "Human authorization evidence is missing.",
        );
      },
    );

    it(
      "rejects an integration when the legal boundary is not proven",
      () => {
        const evaluation =
          scoreIntegration(
            createInput({
              governanceChecks: {
                humanAuthorizationPresent: true,
                auditTracePresent: true,
                legalCertificationFalse: false,
                automaticPersistenceDisabled: true,
                automaticRecallDisabled: true,
              },
            }),
          );

        expect(
          evaluation.result.decision,
        ).toBe("REJECT");

        expect(
          evaluation.result.reasons,
        ).toContain(
          "legalCertification=false boundary is not proven.",
        );
      },
    );

    it(
      "fails closed for completion ratios outside the accepted range",
      () => {
        expect(
          () =>
            scoreIntegration(
              createInput({
                completionRatio: 1.01,
              }),
            ),
        ).toThrow(
          "INTEGRATION_SCORE_COMPLETION_RATIO_INVALID",
        );

        expect(
          () =>
            scoreIntegration(
              createInput({
                completionRatio: -0.01,
              }),
            ),
        ).toThrow(
          "INTEGRATION_SCORE_COMPLETION_RATIO_INVALID",
        );
      },
    );

    it(
      "fails closed for negative integration costs",
      () => {
        expect(
          () =>
            scoreIntegration(
              createInput({
                cost: {
                  changedFiles: -1,
                  changedLines: 120,
                  affectedModules: 1,
                  addedTests: 1,
                  buildExecutions: 1,
                  operatorMinutes: 20,

                  referenceChangedFiles: 2,
                  referenceChangedLines: 120,
                  referenceAffectedModules: 1,
                  referenceAddedTests: 1,
                  referenceBuildExecutions: 1,
                  referenceOperatorMinutes: 20,
                },
              }),
            ),
        ).toThrow(
          "INTEGRATION_SCORE_ACTUAL_COST_INVALID",
        );
      },
    );

    it(
      "preserves the external ARC-AGI-3 score as operator-declared evidence",
      () => {
        const evaluation =
          scoreIntegration(
            createInput(),
          );

        expect(
          evaluation.result.reference
            .operatorDeclaredScore,
        ).toBe(0.22);

        expect(
          evaluation.result.reference
            .externallyVerified,
        ).toBe(false);

        expect(
          evaluation.result.reference
            .sourceArtifact,
        ).toBe(
          "agi3-c3-d003 (1).ipynb",
        );
      },
    );
  },
);
