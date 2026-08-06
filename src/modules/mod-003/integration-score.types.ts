/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003A
 * Governed Integration Scoring
 *
 * Inspired by the ARC-AGI-3 experimental discipline:
 * observation, hypothesis, action, measurement and verification.
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 */

export type IntegrationEvidenceStatus =
  | "NOT_RUN"
  | "PASS"
  | "FAIL"
  | "OPERATOR_DECLARED";

export type IntegrationDecision =
  | "ACCEPT"
  | "REJECT"
  | "REVIEW_REQUIRED";

export interface IntegrationScoreReference {
  /**
   * Human-declared external reference.
   *
   * Current HBCE reference:
   * ARC-AGI-3 score = 0.22
   */
  readonly operatorDeclaredScore: number;

  /**
   * Indicates whether the external score was independently verified
   * by the runtime.
   */
  readonly externallyVerified: boolean;

  /**
   * Local reproducible benchmark extracted from the canonical notebook.
   */
  readonly localBenchmarkScore?: number;

  readonly sourceArtifact: string;
  readonly sourceRevision: string;
}

export interface IntegrationHypothesis {
  readonly id: string;
  readonly description: string;
  readonly expectedEffect: string;
  readonly affectedPaths: readonly string[];
}

export interface IntegrationVerification {
  readonly buildStatus: IntegrationEvidenceStatus;
  readonly typeCheckStatus: IntegrationEvidenceStatus;
  readonly testStatus: IntegrationEvidenceStatus;
  readonly regressionStatus: IntegrationEvidenceStatus;
  readonly replayStatus: IntegrationEvidenceStatus;
}

export interface IntegrationScoreComponents {
  /**
   * Did the integration achieve the declared objective?
   * Range: 0..25
   */
  readonly completion: number;

  /**
   * Was the result obtained with a bounded and proportionate change?
   * Range: 0..20
   */
  readonly efficiency: number;

  /**
   * Did existing capabilities remain valid?
   * Range: 0..25
   */
  readonly regressionSafety: number;

  /**
   * Can the result be reproduced deterministically?
   * Range: 0..20
   */
  readonly reproducibility: number;

  /**
   * Is the evidence complete, traceable and operator-authorized?
   * Range: 0..10
   */
  readonly governance: number;
}

export interface IntegrationScoreResult {
  readonly hypothesis: IntegrationHypothesis;
  readonly verification: IntegrationVerification;
  readonly components: IntegrationScoreComponents;

  /**
   * Deterministic score in the inclusive range 0..100.
   */
  readonly totalScore: number;

  readonly decision: IntegrationDecision;
  readonly reasons: readonly string[];

  readonly reference: IntegrationScoreReference;
}

export const ARC_AGI_3_OPERATOR_REFERENCE: Readonly<IntegrationScoreReference> =
  Object.freeze({
    operatorDeclaredScore: 0.22,
    externallyVerified: false,
    localBenchmarkScore: 0.19736437499905826,
    sourceArtifact: "agi3-c3-d003 (1).ipynb",
    sourceRevision: "AGI3_C2_V84A_ADAPTIVE_INFORMATION_GAIN_STOPPING",
  });
