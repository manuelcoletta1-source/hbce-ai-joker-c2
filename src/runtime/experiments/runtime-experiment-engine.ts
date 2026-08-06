/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Experiment Engine
 *
 * Builds and ranks governed experimental candidates.
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Repository Mutation: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Legal Certification: false
 */

export const RUNTIME_EXPERIMENT_ENGINE_REVISION =
  "AIJC2-RUNTIME-EXPERIMENT-ENGINE-v1_0" as const;

export type RuntimeExperimentRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RuntimeExperimentStatus =
  | "CANDIDATE"
  | "REVIEW_REQUIRED"
  | "AUTHORIZED"
  | "REJECTED";

export type RuntimeExperimentDecision =
  | "SELECT"
  | "REVIEW_REQUIRED"
  | "REJECT";

export interface RuntimeExperimentObservation {
  readonly id: string;
  readonly description: string;
  readonly source: string;
  readonly evidenceStatus:
    | "PASS"
    | "PARTIAL"
    | "FAIL"
    | "OPERATOR_DECLARED";
}

export interface RuntimeExperimentHypothesis {
  readonly id: string;
  readonly statement: string;
  readonly expectedEffect: string;
  readonly falsifiable: boolean;
  readonly supportingObservationIds: readonly string[];
}

export interface RuntimeExperimentCost {
  readonly changedFiles: number;
  readonly changedLines: number;
  readonly affectedModules: number;
  readonly addedTests: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;
}

export interface RuntimeExperimentCandidate {
  readonly id: string;
  readonly hypothesis: RuntimeExperimentHypothesis;

  readonly actionDescription: string;
  readonly affectedPaths: readonly string[];

  /**
   * Inclusive range: 0..100
   */
  readonly expectedCompletion: number;

  /**
   * Inclusive range: 0..100
   */
  readonly expectedBenefit: number;

  /**
   * Inclusive range: 0..100
   */
  readonly expectedReproducibility: number;

  readonly expectedRisk: RuntimeExperimentRiskLevel;
  readonly expectedCost: RuntimeExperimentCost;

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
}

export interface RuntimeExperimentRanking {
  readonly candidateId: string;

  readonly completionScore: number;
  readonly benefitScore: number;
  readonly reproducibilityScore: number;
  readonly efficiencyScore: number;
  readonly riskPenalty: number;

  readonly totalScore: number;
  readonly rank: number;

  readonly decision: RuntimeExperimentDecision;
  readonly reasons: readonly string[];
}

export interface RuntimeExperimentPlan {
  readonly id: string;
  readonly objective: string;

  readonly observations: readonly RuntimeExperimentObservation[];
  readonly candidates: readonly RuntimeExperimentCandidate[];
  readonly ranking: readonly RuntimeExperimentRanking[];

  readonly selectedCandidateId?: string;

  readonly status: RuntimeExperimentStatus;
  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticRepositoryMutation: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly legalCertification: false;
}

export interface RuntimeExperimentInput {
  readonly id: string;
  readonly objective: string;

  readonly observations: readonly RuntimeExperimentObservation[];
  readonly candidates: readonly RuntimeExperimentCandidate[];

  readonly operatorAuthorized: boolean;

  /**
   * Human-declared reasonable reference cost.
   * Used to normalize efficiency across all candidates.
   */
  readonly referenceCost: RuntimeExperimentCost;
}

export interface RuntimeExperimentResult {
  readonly revision:
    typeof RUNTIME_EXPERIMENT_ENGINE_REVISION;

  readonly plan: RuntimeExperimentPlan;

  readonly decision:
    RuntimeExperimentDecision;

  readonly reasons: readonly string[];

  readonly legalCertification: false;
}

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function requireScore(
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

  return Math.trunc(value);
}

function requireNonNegativeCost(
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

function normalizeCost(
  cost: RuntimeExperimentCost,
  prefix: string,
): Readonly<RuntimeExperimentCost> {
  return Object.freeze({
    changedFiles:
      requireNonNegativeCost(
        cost.changedFiles,
        `${prefix}_CHANGED_FILES_INVALID`,
      ),

    changedLines:
      requireNonNegativeCost(
        cost.changedLines,
        `${prefix}_CHANGED_LINES_INVALID`,
      ),

    affectedModules:
      requireNonNegativeCost(
        cost.affectedModules,
        `${prefix}_AFFECTED_MODULES_INVALID`,
      ),

    addedTests:
      requireNonNegativeCost(
        cost.addedTests,
        `${prefix}_ADDED_TESTS_INVALID`,
      ),

    buildExecutions:
      requireNonNegativeCost(
        cost.buildExecutions,
        `${prefix}_BUILD_EXECUTIONS_INVALID`,
      ),

    operatorMinutes:
      requireNonNegativeCost(
        cost.operatorMinutes,
        `${prefix}_OPERATOR_MINUTES_INVALID`,
      ),
  });
}

function calculateDimensionEfficiency(
  reference: number,
  actual: number,
): number {
  if (actual === 0) {
    return 1;
  }

  if (reference === 0) {
    return 0;
  }

  return Math.min(
    reference / actual,
    1,
  ) ** 2;
}

function calculateEfficiency(
  referenceCost: RuntimeExperimentCost,
  actualCost: RuntimeExperimentCost,
): number {
  const values = [
    calculateDimensionEfficiency(
      referenceCost.changedFiles,
      actualCost.changedFiles,
    ),

    calculateDimensionEfficiency(
      referenceCost.changedLines,
      actualCost.changedLines,
    ),

    calculateDimensionEfficiency(
      referenceCost.affectedModules,
      actualCost.affectedModules,
    ),

    calculateDimensionEfficiency(
      referenceCost.addedTests,
      actualCost.addedTests,
    ),

    calculateDimensionEfficiency(
      referenceCost.buildExecutions,
      actualCost.buildExecutions,
    ),

    calculateDimensionEfficiency(
      referenceCost.operatorMinutes,
      actualCost.operatorMinutes,
    ),
  ];

  return Math.round(
    (
      values.reduce(
        (total, value) => total + value,
        0,
      ) /
      values.length
    ) * 100,
  );
}

function mapRiskPenalty(
  risk: RuntimeExperimentRiskLevel,
): number {
  switch (risk) {
    case "LOW":
      return 0;

    case "MEDIUM":
      return 10;

    case "HIGH":
      return 25;

    case "CRITICAL":
      return 50;

    default:
      return 50;
  }
}

function normalizeObservation(
  observation: RuntimeExperimentObservation,
): Readonly<RuntimeExperimentObservation> {
  return Object.freeze({
    id:
      requireNonEmptyString(
        observation.id,
        "RUNTIME_EXPERIMENT_OBSERVATION_ID_REQUIRED",
      ),

    description:
      requireNonEmptyString(
        observation.description,
        "RUNTIME_EXPERIMENT_OBSERVATION_DESCRIPTION_REQUIRED",
      ),

    source:
      requireNonEmptyString(
        observation.source,
        "RUNTIME_EXPERIMENT_OBSERVATION_SOURCE_REQUIRED",
      ),

    evidenceStatus:
      observation.evidenceStatus,
  });
}

function normalizeCandidate(
  candidate: RuntimeExperimentCandidate,
): Readonly<RuntimeExperimentCandidate> {
  if (
    candidate.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_EXPERIMENT_HUMAN_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  const affectedPaths =
    candidate.affectedPaths
      .map((path) =>
        requireNonEmptyString(
          path,
          "RUNTIME_EXPERIMENT_AFFECTED_PATH_REQUIRED",
        ),
      )
      .sort((left, right) =>
        left.localeCompare(right),
      );

  if (
    new Set(affectedPaths).size !==
    affectedPaths.length
  ) {
    throw new Error(
      `RUNTIME_EXPERIMENT_DUPLICATE_PATH:${candidate.id}`,
    );
  }

  return Object.freeze({
    id:
      requireNonEmptyString(
        candidate.id,
        "RUNTIME_EXPERIMENT_CANDIDATE_ID_REQUIRED",
      ),

    hypothesis:
      Object.freeze({
        id:
          requireNonEmptyString(
            candidate.hypothesis.id,
            "RUNTIME_EXPERIMENT_HYPOTHESIS_ID_REQUIRED",
          ),

        statement:
          requireNonEmptyString(
            candidate.hypothesis.statement,
            "RUNTIME_EXPERIMENT_HYPOTHESIS_STATEMENT_REQUIRED",
          ),

        expectedEffect:
          requireNonEmptyString(
            candidate.hypothesis.expectedEffect,
            "RUNTIME_EXPERIMENT_EXPECTED_EFFECT_REQUIRED",
          ),

        falsifiable:
          candidate.hypothesis.falsifiable === true,

        supportingObservationIds:
          Object.freeze(
            [...candidate.hypothesis.supportingObservationIds]
              .map((id) =>
                requireNonEmptyString(
                  id,
                  "RUNTIME_EXPERIMENT_SUPPORTING_OBSERVATION_ID_REQUIRED",
                ),
              )
              .sort((left, right) =>
                left.localeCompare(right),
              ),
          ),
      }),

    actionDescription:
      requireNonEmptyString(
        candidate.actionDescription,
        "RUNTIME_EXPERIMENT_ACTION_DESCRIPTION_REQUIRED",
      ),

    affectedPaths:
      Object.freeze(affectedPaths),

    expectedCompletion:
      requireScore(
        candidate.expectedCompletion,
        "RUNTIME_EXPERIMENT_COMPLETION_INVALID",
      ),

    expectedBenefit:
      requireScore(
        candidate.expectedBenefit,
        "RUNTIME_EXPERIMENT_BENEFIT_INVALID",
      ),

    expectedReproducibility:
      requireScore(
        candidate.expectedReproducibility,
        "RUNTIME_EXPERIMENT_REPRODUCIBILITY_INVALID",
      ),

    expectedRisk:
      candidate.expectedRisk,

    expectedCost:
      normalizeCost(
        candidate.expectedCost,
        "RUNTIME_EXPERIMENT_CANDIDATE_COST",
      ),

    operatorAuthorized:
      candidate.operatorAuthorized === true,

    humanAuthorizationRequired:
      true,
  });
}

function scoreCandidate(
  candidate: RuntimeExperimentCandidate,
  referenceCost: RuntimeExperimentCost,
): Omit<RuntimeExperimentRanking, "rank"> {
  const efficiencyScore =
    calculateEfficiency(
      referenceCost,
      candidate.expectedCost,
    );

  const riskPenalty =
    mapRiskPenalty(
      candidate.expectedRisk,
    );

  const weightedScore =
    (
      candidate.expectedCompletion *
      0.35
    ) +
    (
      candidate.expectedBenefit *
      0.25
    ) +
    (
      candidate.expectedReproducibility *
      0.20
    ) +
    (
      efficiencyScore *
      0.20
    ) -
    riskPenalty;

  const totalScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(weightedScore),
      ),
    );

  const reasons = [
    `Expected completion: ${candidate.expectedCompletion}/100.`,
    `Expected benefit: ${candidate.expectedBenefit}/100.`,
    `Expected reproducibility: ${candidate.expectedReproducibility}/100.`,
    `Expected efficiency: ${efficiencyScore}/100.`,
    `Risk penalty: ${riskPenalty}.`,
    `Final experiment score: ${totalScore}/100.`,
  ];

  let decision:
    RuntimeExperimentDecision =
      "REVIEW_REQUIRED";

  if (
    !candidate.operatorAuthorized ||
    candidate.expectedRisk === "CRITICAL"
  ) {
    decision = "REJECT";
  } else if (
    totalScore >= 75 &&
    candidate.hypothesis.falsifiable
  ) {
    decision = "SELECT";
  }

  if (!candidate.operatorAuthorized) {
    reasons.push(
      "Candidate lacks operator authorization.",
    );
  }

  if (!candidate.hypothesis.falsifiable) {
    reasons.push(
      "Hypothesis is not explicitly falsifiable.",
    );
  }

  return {
    candidateId:
      candidate.id,

    completionScore:
      candidate.expectedCompletion,

    benefitScore:
      candidate.expectedBenefit,

    reproducibilityScore:
      candidate.expectedReproducibility,

    efficiencyScore,
    riskPenalty,
    totalScore,
    decision,

    reasons:
      Object.freeze(reasons),
  };
}

export function createRuntimeExperimentPlan(
  input: RuntimeExperimentInput,
): Readonly<RuntimeExperimentResult> {
  const id =
    requireNonEmptyString(
      input.id,
      "RUNTIME_EXPERIMENT_ID_REQUIRED",
    );

  const objective =
    requireNonEmptyString(
      input.objective,
      "RUNTIME_EXPERIMENT_OBJECTIVE_REQUIRED",
    );

  if (
    !Array.isArray(input.observations) ||
    input.observations.length === 0
  ) {
    throw new Error(
      "RUNTIME_EXPERIMENT_OBSERVATIONS_REQUIRED",
    );
  }

  if (
    !Array.isArray(input.candidates) ||
    input.candidates.length < 2
  ) {
    throw new Error(
      "RUNTIME_EXPERIMENT_MULTIPLE_CANDIDATES_REQUIRED",
    );
  }

  const observations =
    input.observations
      .map(normalizeObservation)
      .sort((left, right) =>
        left.id.localeCompare(right.id),
      );

  const observationIds =
    observations.map(
      (observation) =>
        observation.id,
    );

  if (
    new Set(observationIds).size !==
    observationIds.length
  ) {
    throw new Error(
      "RUNTIME_EXPERIMENT_DUPLICATE_OBSERVATION",
    );
  }

  const observationIdSet =
    new Set(observationIds);

  const candidates =
    input.candidates
      .map(normalizeCandidate)
      .sort((left, right) =>
        left.id.localeCompare(right.id),
      );

  const candidateIds =
    candidates.map(
      (candidate) =>
        candidate.id,
    );

  if (
    new Set(candidateIds).size !==
    candidateIds.length
  ) {
    throw new Error(
      "RUNTIME_EXPERIMENT_DUPLICATE_CANDIDATE",
    );
  }

  for (const candidate of candidates) {
    for (
      const observationId
      of candidate.hypothesis.supportingObservationIds
    ) {
      if (
        !observationIdSet.has(
          observationId,
        )
      ) {
        throw new Error(
          `RUNTIME_EXPERIMENT_UNKNOWN_OBSERVATION:${candidate.id}:${observationId}`,
        );
      }
    }
  }

  const referenceCost =
    normalizeCost(
      input.referenceCost,
      "RUNTIME_EXPERIMENT_REFERENCE_COST",
    );

  const ranking =
    candidates
      .map((candidate) =>
        scoreCandidate(
          candidate,
          referenceCost,
        ),
      )
      .sort((left, right) => {
        if (
          right.totalScore !==
          left.totalScore
        ) {
          return (
            right.totalScore -
            left.totalScore
          );
        }

        return left.candidateId.localeCompare(
          right.candidateId,
        );
      })
      .map(
        (
          candidateRanking,
          index,
        ): Readonly<RuntimeExperimentRanking> =>
          Object.freeze({
            ...candidateRanking,
            rank:
              index + 1,
          }),
      );

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const selected =
    ranking.find(
      (candidate) =>
        candidate.decision === "SELECT",
    );

  const selectedCandidateId =
    operatorAuthorized
      ? selected?.candidateId
      : undefined;

  const status:
    RuntimeExperimentStatus =
      !operatorAuthorized
        ? "REVIEW_REQUIRED"
        : selectedCandidateId !== undefined
          ? "AUTHORIZED"
          : "REJECTED";

  const decision:
    RuntimeExperimentDecision =
      !operatorAuthorized
        ? "REVIEW_REQUIRED"
        : selectedCandidateId !== undefined
          ? "SELECT"
          : "REJECT";

  const reasons: string[] = [];

  if (!operatorAuthorized) {
    reasons.push(
      "Experiment plan requires operator authorization.",
    );
  }

  if (
    operatorAuthorized &&
    selectedCandidateId !== undefined
  ) {
    reasons.push(
      `Candidate ${selectedCandidateId} has the highest eligible deterministic score.`,
    );
  }

  if (
    operatorAuthorized &&
    selectedCandidateId === undefined
  ) {
    reasons.push(
      "No candidate satisfies the governed experiment-selection gates.",
    );
  }

  const plan:
    Readonly<RuntimeExperimentPlan> =
      Object.freeze({
        id,
        objective,

        observations:
          Object.freeze(observations),

        candidates:
          Object.freeze(candidates),

        ranking:
          Object.freeze(ranking),

        selectedCandidateId,

        status,
        operatorAuthorized,

        humanAuthorizationRequired:
          true,

        automaticExecution:
          false,

        automaticRepositoryMutation:
          false,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        legalCertification:
          false,
      });

  return Object.freeze({
    revision:
      RUNTIME_EXPERIMENT_ENGINE_REVISION,

    plan,
    decision,

    reasons:
      Object.freeze(reasons),

    legalCertification:
      false,
  });
}
