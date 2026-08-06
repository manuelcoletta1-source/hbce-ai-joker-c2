/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003A
 * Human-Parity Integration Scorer
 *
 * Inspired by the ARC-AGI-3 scoring principle:
 * completion is rewarded, while inefficient action usage is
 * penalized quadratically.
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Legal Certification: false
 */

import type {
  IntegrationDecision,
  IntegrationEvidenceStatus,
  IntegrationHypothesis,
  IntegrationScoreComponents,
  IntegrationScoreReference,
  IntegrationScoreResult,
  IntegrationVerification,
} from "./integration-score.types";

export const INTEGRATION_SCORER_REVISION =
  "HBCE-HUMAN-PARITY-INTEGRATION-SCORER-v1_0" as const;

export interface IntegrationCost {
  /**
   * Actual measured intervention cost.
   */
  readonly changedFiles: number;
  readonly changedLines: number;
  readonly affectedModules: number;
  readonly addedTests: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;

  /**
   * Human-declared or empirically measured reasonable reference cost.
   */
  readonly referenceChangedFiles: number;
  readonly referenceChangedLines: number;
  readonly referenceAffectedModules: number;
  readonly referenceAddedTests: number;
  readonly referenceBuildExecutions: number;
  readonly referenceOperatorMinutes: number;
}

export interface IntegrationScoreInput {
  readonly hypothesis: IntegrationHypothesis;
  readonly verification: IntegrationVerification;
  readonly reference: IntegrationScoreReference;

  readonly completionRatio: number;
  readonly cost: IntegrationCost;

  readonly governanceChecks: {
    readonly humanAuthorizationPresent: boolean;
    readonly auditTracePresent: boolean;
    readonly legalCertificationFalse: boolean;
    readonly automaticPersistenceDisabled: boolean;
    readonly automaticRecallDisabled: boolean;
  };
}

export interface IntegrationEfficiencyBreakdown {
  readonly changedFiles: number;
  readonly changedLines: number;
  readonly affectedModules: number;
  readonly addedTests: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;
  readonly meanEfficiency: number;
  readonly squaredEfficiency: number;
}

export interface IntegrationScoreEvaluation {
  readonly revision:
    typeof INTEGRATION_SCORER_REVISION;

  readonly result:
    IntegrationScoreResult;

  readonly efficiency:
    IntegrationEfficiencyBreakdown;

  readonly legalCertification: false;
}

function requireFiniteNonNegative(
  value: number,
  code: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(code);
  }

  return value;
}

function requireRatio(
  value: number,
  code: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(code);
  }

  return value;
}

function clamp01(
  value: number,
): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function round(
  value: number,
  decimals = 6,
): number {
  const factor =
    10 ** decimals;

  return Math.round(
    value * factor,
  ) / factor;
}

/**
 * ARC-inspired efficiency:
 *
 * min(reference / actual, 1.0)²
 *
 * If both values are zero, the dimension is considered perfectly efficient.
 * If actual is zero but reference is positive, efficiency is also perfect.
 */
function calculateDimensionEfficiency(
  referenceValue: number,
  actualValue: number,
): number {
  const reference =
    requireFiniteNonNegative(
      referenceValue,
      "INTEGRATION_SCORE_REFERENCE_COST_INVALID",
    );

  const actual =
    requireFiniteNonNegative(
      actualValue,
      "INTEGRATION_SCORE_ACTUAL_COST_INVALID",
    );

  if (actual === 0) {
    return 1;
  }

  if (reference === 0) {
    return 0;
  }

  const raw =
    Math.min(
      reference / actual,
      1,
    );

  return round(
    raw ** 2,
  );
}

function calculateEfficiency(
  cost: IntegrationCost,
): Readonly<IntegrationEfficiencyBreakdown> {
  const changedFiles =
    calculateDimensionEfficiency(
      cost.referenceChangedFiles,
      cost.changedFiles,
    );

  const changedLines =
    calculateDimensionEfficiency(
      cost.referenceChangedLines,
      cost.changedLines,
    );

  const affectedModules =
    calculateDimensionEfficiency(
      cost.referenceAffectedModules,
      cost.affectedModules,
    );

  const addedTests =
    calculateDimensionEfficiency(
      cost.referenceAddedTests,
      cost.addedTests,
    );

  const buildExecutions =
    calculateDimensionEfficiency(
      cost.referenceBuildExecutions,
      cost.buildExecutions,
    );

  const operatorMinutes =
    calculateDimensionEfficiency(
      cost.referenceOperatorMinutes,
      cost.operatorMinutes,
    );

  const meanEfficiency =
    round(
      (
        changedFiles +
        changedLines +
        affectedModules +
        addedTests +
        buildExecutions +
        operatorMinutes
      ) / 6,
    );

  const squaredEfficiency =
    round(
      meanEfficiency ** 2,
    );

  return Object.freeze({
    changedFiles,
    changedLines,
    affectedModules,
    addedTests,
    buildExecutions,
    operatorMinutes,
    meanEfficiency,
    squaredEfficiency,
  });
}

function evidenceFactor(
  status: IntegrationEvidenceStatus,
): number {
  switch (status) {
    case "PASS":
      return 1;

    case "OPERATOR_DECLARED":
      return 0.75;

    case "NOT_RUN":
      return 0;

    case "FAIL":
    default:
      return 0;
  }
}

function calculateRegressionSafety(
  verification: IntegrationVerification,
): number {
  if (
    verification.buildStatus === "FAIL" ||
    verification.typeCheckStatus === "FAIL" ||
    verification.testStatus === "FAIL" ||
    verification.regressionStatus === "FAIL"
  ) {
    return 0;
  }

  const factors = [
    evidenceFactor(
      verification.buildStatus,
    ),
    evidenceFactor(
      verification.typeCheckStatus,
    ),
    evidenceFactor(
      verification.testStatus,
    ),
    evidenceFactor(
      verification.regressionStatus,
    ),
  ];

  return round(
    factors.reduce(
      (total, value) =>
        total + value,
      0,
    ) / factors.length,
  );
}

function calculateReproducibility(
  verification: IntegrationVerification,
): number {
  return evidenceFactor(
    verification.replayStatus,
  );
}

function calculateGovernance(
  input: IntegrationScoreInput,
): number {
  const checks = [
    input.governanceChecks
      .humanAuthorizationPresent,

    input.governanceChecks
      .auditTracePresent,

    input.governanceChecks
      .legalCertificationFalse,

    input.governanceChecks
      .automaticPersistenceDisabled,

    input.governanceChecks
      .automaticRecallDisabled,
  ];

  const passed =
    checks.filter(
      (value) => value === true,
    ).length;

  return round(
    passed / checks.length,
  );
}

function toComponentScore(
  normalizedValue: number,
  maximum: number,
): number {
  return Math.round(
    clamp01(
      normalizedValue,
    ) * maximum,
  );
}

function buildReasons(
  input: IntegrationScoreInput,
  totalScore: number,
  efficiency: IntegrationEfficiencyBreakdown,
  regressionSafety: number,
  reproducibility: number,
  governance: number,
): readonly string[] {
  const reasons: string[] = [];

  reasons.push(
    `Completion ratio: ${round(input.completionRatio)}.`,
  );

  reasons.push(
    `Efficiency mean: ${efficiency.meanEfficiency}; quadratic efficiency: ${efficiency.squaredEfficiency}.`,
  );

  reasons.push(
    `Regression safety factor: ${regressionSafety}.`,
  );

  reasons.push(
    `Reproducibility factor: ${reproducibility}.`,
  );

  reasons.push(
    `Governance factor: ${governance}.`,
  );

  reasons.push(
    `Final normalized integration score: ${totalScore}/100.`,
  );

  if (
    input.governanceChecks
      .humanAuthorizationPresent !== true
  ) {
    reasons.push(
      "Human authorization evidence is missing.",
    );
  }

  if (
    input.governanceChecks
      .legalCertificationFalse !== true
  ) {
    reasons.push(
      "legalCertification=false boundary is not proven.",
    );
  }

  if (
    input.verification
      .regressionStatus === "FAIL"
  ) {
    reasons.push(
      "Regression evidence failed.",
    );
  }

  if (
    input.verification
      .replayStatus === "NOT_RUN"
  ) {
    reasons.push(
      "Deterministic replay was not executed.",
    );
  }

  return Object.freeze(
    reasons,
  );
}

function determineDecision(
  input: IntegrationScoreInput,
  totalScore: number,
  regressionSafety: number,
  reproducibility: number,
  governance: number,
): IntegrationDecision {
  if (
    input.governanceChecks
      .humanAuthorizationPresent !== true ||
    input.governanceChecks
      .legalCertificationFalse !== true ||
    regressionSafety === 0
  ) {
    return "REJECT";
  }

  if (
    totalScore >= 75 &&
    reproducibility > 0 &&
    governance === 1
  ) {
    return "ACCEPT";
  }

  return "REVIEW_REQUIRED";
}

export function scoreIntegration(
  input: IntegrationScoreInput,
): Readonly<IntegrationScoreEvaluation> {
  const completion =
    requireRatio(
      input.completionRatio,
      "INTEGRATION_SCORE_COMPLETION_RATIO_INVALID",
    );

  const efficiency =
    calculateEfficiency(
      input.cost,
    );

  const regressionSafety =
    calculateRegressionSafety(
      input.verification,
    );

  const reproducibility =
    calculateReproducibility(
      input.verification,
    );

  const governance =
    calculateGovernance(
      input,
    );

  /**
   * Multiplicative fail-closed score.
   *
   * Any zero factor collapses the score to zero.
   * Efficiency is already quadratically penalized.
   */
  const normalizedScore =
    round(
      completion *
      efficiency.squaredEfficiency *
      regressionSafety *
      reproducibility *
      governance,
    );

  const totalScore =
    Math.round(
      normalizedScore * 100,
    );

  const components:
    Readonly<IntegrationScoreComponents> =
      Object.freeze({
        completion:
          toComponentScore(
            completion,
            25,
          ),

        efficiency:
          toComponentScore(
            efficiency.squaredEfficiency,
            20,
          ),

        regressionSafety:
          toComponentScore(
            regressionSafety,
            25,
          ),

        reproducibility:
          toComponentScore(
            reproducibility,
            20,
          ),

        governance:
          toComponentScore(
            governance,
            10,
          ),
      });

  const decision =
    determineDecision(
      input,
      totalScore,
      regressionSafety,
      reproducibility,
      governance,
    );

  const reasons =
    buildReasons(
      input,
      totalScore,
      efficiency,
      regressionSafety,
      reproducibility,
      governance,
    );

  const result:
    Readonly<IntegrationScoreResult> =
      Object.freeze({
        hypothesis:
          input.hypothesis,

        verification:
          input.verification,

        components,

        totalScore,

        decision,

        reasons,

        reference:
          input.reference,
      });

  return Object.freeze({
    revision:
      INTEGRATION_SCORER_REVISION,

    result,

    efficiency,

    legalCertification:
      false,
  });
}
