/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Decision Engine
 *
 * Converts a ranked scientific experiment result into one governed
 * operator-facing decision.
 *
 * The engine does not execute experiments, mutate the repository,
 * persist decisions or authorize itself.
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Selection: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeScientificExperimentCandidate,
  RuntimeScientificExperimentDecision,
  RuntimeScientificExperimentEngineResult,
  RuntimeScientificExperimentRanking,
} from "./runtime-scientific-experiment-engine";

export const RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-DECISION-ENGINE-v1_0" as const;

export type RuntimeScientificDecisionStatus =
  | "DECISION_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export type RuntimeScientificDecision =
  | "PROPOSE"
  | "REVIEW_REQUIRED"
  | "REJECT"
  | "NO_ACTION";

export interface RuntimeScientificDecisionThresholds {
  readonly minimumTotalScore: number;
  readonly minimumRegressionSafety: number;
  readonly minimumReproducibility: number;
  readonly minimumEvidenceScore: number;
  readonly maximumRiskPenalty: number;
  readonly minimumScoreMargin: number;
}

export interface RuntimeScientificDecisionEvidence {
  readonly experimentExecutionId: string;
  readonly candidateId?: string;
  readonly hypothesisId?: string;

  readonly totalScore?: number;
  readonly regressionSafetyScore?: number;
  readonly reproducibilityScore?: number;
  readonly evidenceScore?: number;
  readonly efficiencyScore?: number;
  readonly riskPenalty?: number;

  readonly scoreMargin?: number;
  readonly competingCandidateId?: string;
  readonly competingCandidateScore?: number;
}

export interface RuntimeScientificDecisionGate {
  readonly id: string;
  readonly label: string;
  readonly required: true;
  readonly passed: boolean;
  readonly description: string;
}

export interface RuntimeScientificDecisionProposal {
  readonly candidateId: string;
  readonly hypothesisId: string;

  readonly strategy:
    RuntimeScientificExperimentCandidate["hypothesis"]["strategy"];

  readonly objective: string;
  readonly actionDescription: string;
  readonly expectedEffect: string;

  readonly acceptanceCriteria: readonly string[];
  readonly rejectionCriteria: readonly string[];

  readonly expectedCost:
    RuntimeScientificExperimentCandidate["expectedCost"];

  readonly operatorAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticRepositoryMutation: false;
}

export interface RuntimeScientificDecisionEngineInput {
  readonly decisionId: string;
  readonly generatedAt: string;

  readonly experimentResult:
    RuntimeScientificExperimentEngineResult;

  readonly thresholds?:
    Partial<RuntimeScientificDecisionThresholds>;

  readonly operatorAuthorized: boolean;

  /**
   * Explicit operator acceptance is separate from authorization.
   * Authorization allows evaluation.
   * Acceptance allows the proposal to become operator-approved.
   */
  readonly acceptedByOperator: boolean;
}

export interface RuntimeScientificDecisionEngineResult {
  readonly revision:
    typeof RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION;

  readonly decisionId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeScientificDecisionStatus;

  readonly decision:
    RuntimeScientificDecision;

  readonly proposal?:
    RuntimeScientificDecisionProposal;

  readonly selectedRanking?:
    RuntimeScientificExperimentRanking;

  readonly evidence:
    RuntimeScientificDecisionEvidence;

  readonly gates:
    readonly RuntimeScientificDecisionGate[];

  readonly reasons:
    readonly string[];

  readonly operatorAuthorized: boolean;
  readonly acceptedByOperator: boolean;

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticExecution: false;
    readonly automaticSelection: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

const DEFAULT_THRESHOLDS:
  Readonly<RuntimeScientificDecisionThresholds> =
    Object.freeze({
      minimumTotalScore: 75,
      minimumRegressionSafety: 75,
      minimumReproducibility: 75,
      minimumEvidenceScore: 60,
      maximumRiskPenalty: 25,
      minimumScoreMargin: 3,
    });

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized =
    value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function requireThreshold(
  value: number,
  code: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(code);
  }

  return Math.round(value);
}

function normalizeThresholds(
  input:
    Partial<RuntimeScientificDecisionThresholds> | undefined,
): Readonly<RuntimeScientificDecisionThresholds> {
  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...input,
  };

  return Object.freeze({
    minimumTotalScore:
      requireThreshold(
        thresholds.minimumTotalScore,
        "RUNTIME_SCIENTIFIC_DECISION_MINIMUM_TOTAL_SCORE_INVALID",
      ),

    minimumRegressionSafety:
      requireThreshold(
        thresholds.minimumRegressionSafety,
        "RUNTIME_SCIENTIFIC_DECISION_MINIMUM_REGRESSION_SAFETY_INVALID",
      ),

    minimumReproducibility:
      requireThreshold(
        thresholds.minimumReproducibility,
        "RUNTIME_SCIENTIFIC_DECISION_MINIMUM_REPRODUCIBILITY_INVALID",
      ),

    minimumEvidenceScore:
      requireThreshold(
        thresholds.minimumEvidenceScore,
        "RUNTIME_SCIENTIFIC_DECISION_MINIMUM_EVIDENCE_SCORE_INVALID",
      ),

    maximumRiskPenalty:
      requireThreshold(
        thresholds.maximumRiskPenalty,
        "RUNTIME_SCIENTIFIC_DECISION_MAXIMUM_RISK_PENALTY_INVALID",
      ),

    minimumScoreMargin:
      requireThreshold(
        thresholds.minimumScoreMargin,
        "RUNTIME_SCIENTIFIC_DECISION_MINIMUM_SCORE_MARGIN_INVALID",
      ),
  });
}

function findSelectedRanking(
  result:
    RuntimeScientificExperimentEngineResult,
): RuntimeScientificExperimentRanking | undefined {
  const selectedCandidateId =
    result.summary.selectedCandidateId;

  if (
    selectedCandidateId === undefined
  ) {
    return undefined;
  }

  return result.ranking.find(
    (ranking) =>
      ranking.candidateId ===
      selectedCandidateId,
  );
}

function findSelectedCandidate(
  result:
    RuntimeScientificExperimentEngineResult,

  ranking:
    RuntimeScientificExperimentRanking,
): RuntimeScientificExperimentCandidate {
  const candidate =
    result.candidates.find(
      (item) =>
        item.id ===
        ranking.candidateId,
    );

  if (
    candidate === undefined
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_DECISION_SELECTED_CANDIDATE_NOT_FOUND",
    );
  }

  if (
    candidate.hypothesis.id !==
    ranking.hypothesisId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_DECISION_HYPOTHESIS_MISMATCH",
    );
  }

  return candidate;
}

function calculateScoreMargin(
  ranking:
    readonly RuntimeScientificExperimentRanking[],
): {
  readonly margin?: number;
  readonly competingCandidateId?: string;
  readonly competingCandidateScore?: number;
} {
  if (
    ranking.length < 2
  ) {
    return {};
  }

  const first =
    ranking[0];

  const second =
    ranking[1];

  if (
    first === undefined ||
    second === undefined
  ) {
    return {};
  }

  return {
    margin:
      Math.max(
        0,
        first.totalScore -
          second.totalScore,
      ),

    competingCandidateId:
      second.candidateId,

    competingCandidateScore:
      second.totalScore,
  };
}

function gate(
  id: string,
  label: string,
  passed: boolean,
  description: string,
): Readonly<RuntimeScientificDecisionGate> {
  return Object.freeze({
    id,
    label,
    required: true,
    passed,
    description,
  });
}

function buildGates(
  ranking:
    RuntimeScientificExperimentRanking,

  thresholds:
    RuntimeScientificDecisionThresholds,

  scoreMargin: number | undefined,

  operatorAuthorized: boolean,
): readonly RuntimeScientificDecisionGate[] {
  return Object.freeze([
    gate(
      "EXPERIMENT_RECOMMENDED",
      "Experiment recommendation",
      ranking.decision ===
        "RECOMMEND",
      `Experiment decision is ${ranking.decision}.`,
    ),

    gate(
      "TOTAL_SCORE",
      "Minimum total score",
      ranking.totalScore >=
        thresholds.minimumTotalScore,
      `Required ${thresholds.minimumTotalScore}/100; measured ${ranking.totalScore}/100.`,
    ),

    gate(
      "REGRESSION_SAFETY",
      "Minimum regression safety",
      ranking.regressionSafetyScore >=
        thresholds.minimumRegressionSafety,
      `Required ${thresholds.minimumRegressionSafety}/100; measured ${ranking.regressionSafetyScore}/100.`,
    ),

    gate(
      "REPRODUCIBILITY",
      "Minimum reproducibility",
      ranking.reproducibilityScore >=
        thresholds.minimumReproducibility,
      `Required ${thresholds.minimumReproducibility}/100; measured ${ranking.reproducibilityScore}/100.`,
    ),

    gate(
      "EVIDENCE",
      "Minimum evidence confidence",
      ranking.evidenceScore >=
        thresholds.minimumEvidenceScore,
      `Required ${thresholds.minimumEvidenceScore}/100; measured ${ranking.evidenceScore}/100.`,
    ),

    gate(
      "RISK",
      "Maximum risk penalty",
      ranking.riskPenalty <=
        thresholds.maximumRiskPenalty,
      `Maximum ${thresholds.maximumRiskPenalty}; measured ${ranking.riskPenalty}.`,
    ),

    gate(
      "SCORE_MARGIN",
      "Minimum ranking margin",
      scoreMargin === undefined ||
        scoreMargin >=
          thresholds.minimumScoreMargin,
      scoreMargin === undefined
        ? "No competing candidate exists; score-margin gate is satisfied."
        : `Required margin ${thresholds.minimumScoreMargin}; measured ${scoreMargin}.`,
    ),

    gate(
      "OPERATOR_AUTHORIZATION",
      "Operator authorization",
      operatorAuthorized,
      operatorAuthorized
        ? "Operator authorization is present."
        : "Operator authorization is missing.",
    ),
  ]);
}

function mapRejectedExperimentDecision(
  decision:
    RuntimeScientificExperimentDecision,
): RuntimeScientificDecision {
  if (
    decision === "REJECT"
  ) {
    return "REJECT";
  }

  return "REVIEW_REQUIRED";
}

function createProposal(
  candidate:
    RuntimeScientificExperimentCandidate,
): Readonly<RuntimeScientificDecisionProposal> {
  return Object.freeze({
    candidateId:
      candidate.id,

    hypothesisId:
      candidate.hypothesis.id,

    strategy:
      candidate.hypothesis.strategy,

    objective:
      candidate.objective,

    actionDescription:
      candidate.actionDescription,

    expectedEffect:
      candidate.hypothesis
        .expectedEffect,

    acceptanceCriteria:
      Object.freeze([
        ...candidate
          .acceptanceCriteria,
      ]),

    rejectionCriteria:
      Object.freeze([
        ...candidate
          .rejectionCriteria,
      ]),

    expectedCost:
      candidate.expectedCost,

    operatorAuthorizationRequired:
      true,

    automaticExecution:
      false,

    automaticRepositoryMutation:
      false,
  });
}

function emptyGovernance() {
  return Object.freeze({
    readOnly: true as const,
    deterministic: true as const,
    failClosed: true as const,

    humanAuthorizationRequired:
      true as const,

    automaticExecution:
      false as const,

    automaticSelection:
      false as const,

    automaticPersistence:
      false as const,

    automaticRecall:
      false as const,

    automaticRepositoryMutation:
      false as const,

    legalCertification:
      false as const,
  });
}

export function createRuntimeScientificDecision(
  input:
    RuntimeScientificDecisionEngineInput,
): Readonly<RuntimeScientificDecisionEngineResult> {
  const decisionId =
    requireNonEmptyString(
      input.decisionId,
      "RUNTIME_SCIENTIFIC_DECISION_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_SCIENTIFIC_DECISION_TIMESTAMP_REQUIRED",
    );

  const thresholds =
    normalizeThresholds(
      input.thresholds,
    );

  if (
    input.experimentResult
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_DECISION_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  const experimentGovernance =
    input.experimentResult
      .governance;

  if (
    experimentGovernance.readOnly !== true ||
    experimentGovernance.deterministic !== true ||
    experimentGovernance.failClosed !== true ||
    experimentGovernance.automaticExecution !== false ||
    experimentGovernance.automaticRepositoryMutation !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_DECISION_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const acceptedByOperator =
    operatorAuthorized &&
    input.acceptedByOperator === true;

  if (
    input.experimentResult.status ===
      "BLOCKED"
  ) {
    return Object.freeze({
      revision:
        RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION,

      decisionId,
      generatedAt,

      status:
        "BLOCKED",

      decision:
        "NO_ACTION",

      evidence:
        Object.freeze({
          experimentExecutionId:
            input.experimentResult
              .executionId,
        }),

      gates:
        Object.freeze([]),

      reasons:
        Object.freeze([
          "Scientific experiment generation is blocked.",
          "No candidate can be proposed.",
        ]),

      operatorAuthorized,
      acceptedByOperator,

      governance:
        emptyGovernance(),

      legalCertification:
        false,
    });
  }

  const selectedRanking =
    findSelectedRanking(
      input.experimentResult,
    );

  if (
    selectedRanking === undefined
  ) {
    return Object.freeze({
      revision:
        RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION,

      decisionId,
      generatedAt,

      status:
        "REVIEW_REQUIRED",

      decision:
        "REVIEW_REQUIRED",

      evidence:
        Object.freeze({
          experimentExecutionId:
            input.experimentResult
              .executionId,
        }),

      gates:
        Object.freeze([]),

      reasons:
        Object.freeze([
          "No scientific experiment candidate has been selected.",
          "Manual operator review is required.",
        ]),

      operatorAuthorized,
      acceptedByOperator,

      governance:
        emptyGovernance(),

      legalCertification:
        false,
    });
  }

  const selectedCandidate =
    findSelectedCandidate(
      input.experimentResult,
      selectedRanking,
    );

  const scoreMarginResult =
    calculateScoreMargin(
      input.experimentResult
        .ranking,
    );

  const gates =
    buildGates(
      selectedRanking,
      thresholds,
      scoreMarginResult.margin,
      operatorAuthorized,
    );

  const failedGates =
    gates.filter(
      (item) =>
        !item.passed,
    );

  const evidence:
    Readonly<RuntimeScientificDecisionEvidence> =
      Object.freeze({
        experimentExecutionId:
          input.experimentResult
            .executionId,

        candidateId:
          selectedRanking
            .candidateId,

        hypothesisId:
          selectedRanking
            .hypothesisId,

        totalScore:
          selectedRanking
            .totalScore,

        regressionSafetyScore:
          selectedRanking
            .regressionSafetyScore,

        reproducibilityScore:
          selectedRanking
            .reproducibilityScore,

        evidenceScore:
          selectedRanking
            .evidenceScore,

        efficiencyScore:
          selectedRanking
            .efficiencyScore,

        riskPenalty:
          selectedRanking
            .riskPenalty,

        scoreMargin:
          scoreMarginResult.margin,

        competingCandidateId:
          scoreMarginResult
            .competingCandidateId,

        competingCandidateScore:
          scoreMarginResult
            .competingCandidateScore,
      });

  if (
    selectedRanking.decision ===
      "REJECT"
  ) {
    return Object.freeze({
      revision:
        RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION,

      decisionId,
      generatedAt,

      status:
        "REJECTED",

      decision:
        "REJECT",

      selectedRanking,

      evidence,
      gates,

      reasons:
        Object.freeze([
          "The selected scientific experiment was rejected by the experiment engine.",
          ...selectedRanking.reasons,
        ]),

      operatorAuthorized,
      acceptedByOperator,

      governance:
        emptyGovernance(),

      legalCertification:
        false,
    });
  }

  if (
    failedGates.length > 0
  ) {
    return Object.freeze({
      revision:
        RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION,

      decisionId,
      generatedAt,

      status:
        "REVIEW_REQUIRED",

      decision:
        mapRejectedExperimentDecision(
          selectedRanking.decision,
        ),

      selectedRanking,

      evidence,
      gates,

      reasons:
        Object.freeze([
          "The scientific proposal did not satisfy every mandatory decision gate.",

          ...failedGates.map(
            (item) =>
              `${item.id}: ${item.description}`,
          ),
        ]),

      operatorAuthorized,
      acceptedByOperator,

      governance:
        emptyGovernance(),

      legalCertification:
        false,
    });
  }

  const proposal =
    createProposal(
      selectedCandidate,
    );

  const reasons: string[] = [
    `Candidate ${proposal.candidateId} satisfies every scientific decision gate.`,
    `Hypothesis ${proposal.hypothesisId} is the highest eligible ranked hypothesis.`,
    "The proposal remains non-executable until separately implemented and verified.",
  ];

  if (
    !acceptedByOperator
  ) {
    reasons.push(
      "The operator has authorized evaluation but has not accepted the proposal.",
    );
  }

  if (
    acceptedByOperator
  ) {
    reasons.push(
      "The operator explicitly accepted the proposal for subsequent controlled implementation.",
    );
  }

  return Object.freeze({
    revision:
      RUNTIME_SCIENTIFIC_DECISION_ENGINE_REVISION,

    decisionId,
    generatedAt,

    status:
      acceptedByOperator
        ? "DECISION_AVAILABLE"
        : "REVIEW_REQUIRED",

    decision:
      acceptedByOperator
        ? "PROPOSE"
        : "REVIEW_REQUIRED",

    proposal,
    selectedRanking,

    evidence,
    gates,

    reasons:
      Object.freeze(reasons),

    operatorAuthorized,
    acceptedByOperator,

    governance:
      emptyGovernance(),

    legalCertification:
      false,
  });
}
