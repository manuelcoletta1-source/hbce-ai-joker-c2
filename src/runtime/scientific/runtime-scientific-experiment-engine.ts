/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Experiment Engine
 *
 * Converts governed capability findings and interventions into
 * deterministic scientific experiment candidates.
 *
 * Pipeline:
 *
 * Capability Assessment
 * → Scientific Question
 * → Competing Hypotheses
 * → Experiment Candidates
 * → Benefit / Risk / Effort / Reproducibility
 * → Deterministic Ranking
 * → Operator-Governed Recommendation
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
  RuntimeCapabilityAssessmentResult,
  RuntimeCapabilityFinding,
  RuntimeCapabilityIntervention,
} from "../self/runtime-capability-assessment";

export const RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-EXPERIMENT-ENGINE-v1_0" as const;

export type RuntimeScientificExperimentRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RuntimeScientificExperimentDecision =
  | "RECOMMEND"
  | "REVIEW_REQUIRED"
  | "REJECT";

export type RuntimeScientificExperimentStatus =
  | "READY_FOR_REVIEW"
  | "RECOMMENDATION_AVAILABLE"
  | "BLOCKED";

export type RuntimeScientificExperimentStrategy =
  | "MINIMAL_PATCH"
  | "TEST_FIRST"
  | "COMPOSITION"
  | "REFACTOR"
  | "EVIDENCE_EXPANSION";

export interface RuntimeScientificQuestion {
  readonly id: string;

  readonly findingId: string;

  readonly question: string;

  readonly evidence: readonly string[];

  readonly falsifiable: true;
}

export interface RuntimeScientificHypothesis {
  readonly id: string;

  readonly questionId: string;
  readonly findingId: string;

  readonly strategy:
    RuntimeScientificExperimentStrategy;

  readonly statement: string;
  readonly expectedEffect: string;

  readonly falsificationCondition: string;

  readonly supportingEvidence: readonly string[];

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeScientificExperimentCost {
  readonly changedFiles: number;
  readonly changedLines: number;
  readonly affectedModules: number;
  readonly addedTests: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;
}

export interface RuntimeScientificExperimentCandidate {
  readonly id: string;

  readonly questionId: string;
  readonly hypothesis: RuntimeScientificHypothesis;

  readonly findingId: string;
  readonly interventionId: string;

  readonly objective: string;
  readonly actionDescription: string;

  readonly expectedCompletion: number;
  readonly expectedBenefit: number;
  readonly expectedRegressionSafety: number;
  readonly expectedReproducibility: number;
  readonly evidenceConfidence: number;

  readonly expectedRisk:
    RuntimeScientificExperimentRiskLevel;

  readonly expectedCost:
    RuntimeScientificExperimentCost;

  readonly acceptanceCriteria: readonly string[];
  readonly rejectionCriteria: readonly string[];

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticRepositoryMutation: false;
}

export interface RuntimeScientificExperimentRanking {
  readonly candidateId: string;
  readonly hypothesisId: string;
  readonly strategy:
    RuntimeScientificExperimentStrategy;

  readonly completionScore: number;
  readonly benefitScore: number;
  readonly regressionSafetyScore: number;
  readonly reproducibilityScore: number;
  readonly evidenceScore: number;
  readonly efficiencyScore: number;
  readonly riskPenalty: number;

  readonly totalScore: number;
  readonly rank: number;

  readonly decision:
    RuntimeScientificExperimentDecision;

  readonly reasons: readonly string[];
}

export interface RuntimeScientificExperimentEngineInput {
  readonly executionId: string;
  readonly generatedAt: string;

  readonly capabilityAssessment:
    RuntimeCapabilityAssessmentResult;

  /**
   * Maximum experiments generated for each finding.
   * Allowed range: 2..5
   */
  readonly hypothesesPerFinding?: number;

  readonly operatorAuthorized: boolean;
}

export interface RuntimeScientificExperimentEngineSummary {
  readonly totalQuestions: number;
  readonly totalHypotheses: number;
  readonly totalCandidates: number;

  readonly recommendedCandidates: number;
  readonly reviewRequiredCandidates: number;
  readonly rejectedCandidates: number;

  readonly selectedCandidateId?: string;
  readonly selectedHypothesisId?: string;

  readonly highestScore?: number;
}

export interface RuntimeScientificExperimentEngineResult {
  readonly revision:
    typeof RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION;

  readonly executionId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeScientificExperimentStatus;

  readonly questions:
    readonly RuntimeScientificQuestion[];

  readonly hypotheses:
    readonly RuntimeScientificHypothesis[];

  readonly candidates:
    readonly RuntimeScientificExperimentCandidate[];

  readonly ranking:
    readonly RuntimeScientificExperimentRanking[];

  readonly selectedCandidate?:
    RuntimeScientificExperimentCandidate;

  readonly summary:
    RuntimeScientificExperimentEngineSummary;

  readonly reasons: readonly string[];

  readonly operatorAuthorized: boolean;

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

interface StrategyProfile {
  readonly strategy:
    RuntimeScientificExperimentStrategy;

  readonly completionModifier: number;
  readonly benefitModifier: number;
  readonly regressionSafety: number;
  readonly reproducibility: number;
  readonly risk:
    RuntimeScientificExperimentRiskLevel;

  readonly changedFiles: number;
  readonly changedLines: number;
  readonly affectedModules: number;
  readonly addedTests: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;
}

const STRATEGY_PROFILES:
  readonly StrategyProfile[] =
    Object.freeze([
      Object.freeze({
        strategy:
          "MINIMAL_PATCH",

        completionModifier:
          5,

        benefitModifier:
          -5,

        regressionSafety:
          90,

        reproducibility:
          90,

        risk:
          "LOW",

        changedFiles:
          1,

        changedLines:
          80,

        affectedModules:
          1,

        addedTests:
          1,

        buildExecutions:
          1,

        operatorMinutes:
          25,
      }),

      Object.freeze({
        strategy:
          "TEST_FIRST",

        completionModifier:
          0,

        benefitModifier:
          0,

        regressionSafety:
          98,

        reproducibility:
          98,

        risk:
          "LOW",

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
      }),

      Object.freeze({
        strategy:
          "COMPOSITION",

        completionModifier:
          8,

        benefitModifier:
          8,

        regressionSafety:
          85,

        reproducibility:
          92,

        risk:
          "MEDIUM",

        changedFiles:
          3,

        changedLines:
          260,

        affectedModules:
          3,

        addedTests:
          2,

        buildExecutions:
          2,

        operatorMinutes:
          55,
      }),

      Object.freeze({
        strategy:
          "EVIDENCE_EXPANSION",

        completionModifier:
          -10,

        benefitModifier:
          -5,

        regressionSafety:
          95,

        reproducibility:
          96,

        risk:
          "LOW",

        changedFiles:
          1,

        changedLines:
          120,

        affectedModules:
          2,

        addedTests:
          1,

        buildExecutions:
          1,

        operatorMinutes:
          35,
      }),

      Object.freeze({
        strategy:
          "REFACTOR",

        completionModifier:
          12,

        benefitModifier:
          15,

        regressionSafety:
          65,

        reproducibility:
          75,

        risk:
          "HIGH",

        changedFiles:
          6,

        changedLines:
          800,

        affectedModules:
          6,

        addedTests:
          3,

        buildExecutions:
          4,

        operatorMinutes:
          150,
      }),
    ]);

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

function requireHypothesisCount(
  value: number | undefined,
): number {
  const resolved =
    value ?? 3;

  if (
    !Number.isInteger(resolved) ||
    resolved < 2 ||
    resolved > 5
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_EXPERIMENT_HYPOTHESIS_COUNT_INVALID",
    );
  }

  return resolved;
}

function clampScore(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function riskPenalty(
  risk:
    RuntimeScientificExperimentRiskLevel,
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

function calculateEfficiency(
  cost:
    RuntimeScientificExperimentCost,
): number {
  const fileScore =
    Math.min(
      1 / Math.max(
        cost.changedFiles,
        1,
      ),
      1,
    );

  const lineScore =
    Math.min(
      150 / Math.max(
        cost.changedLines,
        1,
      ),
      1,
    );

  const moduleScore =
    Math.min(
      2 / Math.max(
        cost.affectedModules,
        1,
      ),
      1,
    );

  const testScore =
    cost.addedTests > 0
      ? 1
      : 0.25;

  const buildScore =
    Math.min(
      2 / Math.max(
        cost.buildExecutions,
        1,
      ),
      1,
    );

  const operatorScore =
    Math.min(
      45 / Math.max(
        cost.operatorMinutes,
        1,
      ),
      1,
    );

  return clampScore(
    (
      fileScore +
      lineScore +
      moduleScore +
      testScore +
      buildScore +
      operatorScore
    ) /
      6 *
      100,
  );
}

function createQuestion(
  finding:
    RuntimeCapabilityFinding,
): Readonly<RuntimeScientificQuestion> {
  return Object.freeze({
    id:
      `QUESTION-${finding.id}`,

    findingId:
      finding.id,

    question:
      `Which bounded, reproducible and operator-governed intervention can resolve "${finding.title}" with the highest benefit and lowest regression risk?`,

    evidence:
      Object.freeze([
        ...finding.evidence,
      ]),

    falsifiable:
      true,
  });
}

function strategyStatement(
  strategy:
    RuntimeScientificExperimentStrategy,

  finding:
    RuntimeCapabilityFinding,
): string {
  switch (strategy) {
    case "MINIMAL_PATCH":
      return `A minimal bounded correction targeting "${finding.title}" will improve the affected capability without changing unrelated modules.`;

    case "TEST_FIRST":
      return `Adding deterministic acceptance tests before changing "${finding.title}" will reduce regression risk and expose the smallest valid correction.`;

    case "COMPOSITION":
      return `Composing existing compatible runtime components will resolve "${finding.title}" more safely than introducing another isolated module.`;

    case "EVIDENCE_EXPANSION":
      return `Expanding governed repository evidence will clarify whether "${finding.title}" is a real structural defect or an incomplete observation.`;

    case "REFACTOR":
      return `A broader refactor of the affected runtime area will resolve "${finding.title}" and improve adjacent capabilities.`;

    default:
      return `A governed intervention will resolve "${finding.title}".`;
  }
}

function strategyEffect(
  strategy:
    RuntimeScientificExperimentStrategy,

  finding:
    RuntimeCapabilityFinding,
): string {
  switch (strategy) {
    case "MINIMAL_PATCH":
      return `The finding ${finding.id} is reduced through the smallest verified implementation surface.`;

    case "TEST_FIRST":
      return `The finding ${finding.id} becomes reproducible through failing and passing acceptance evidence.`;

    case "COMPOSITION":
      return `The finding ${finding.id} is reduced by connecting capabilities that already exist in the runtime.`;

    case "EVIDENCE_EXPANSION":
      return `Confidence in the finding ${finding.id} increases or the finding is falsified by additional repository evidence.`;

    case "REFACTOR":
      return `The finding ${finding.id} and related architectural weaknesses are reduced through structural reorganization.`;

    default:
      return `The finding ${finding.id} is measurably reduced.`;
  }
}

function falsificationCondition(
  strategy:
    RuntimeScientificExperimentStrategy,

  finding:
    RuntimeCapabilityFinding,
): string {
  switch (strategy) {
    case "MINIMAL_PATCH":
      return "The targeted capability score does not improve, or any unrelated regression is detected.";

    case "TEST_FIRST":
      return "The new test cannot reproduce the finding, or the implementation passes without changing the measured capability.";

    case "COMPOSITION":
      return "The composed modules remain disconnected, produce incompatible contracts or decrease runtime capability score.";

    case "EVIDENCE_EXPANSION":
      return "Additional inspection does not increase evidence confidence and does not clarify the finding.";

    case "REFACTOR":
      return "The refactor fails build, typecheck, deterministic replay or produces lower aggregate capability posture.";

    default:
      return `The finding ${finding.id} is not measurably reduced.`;
  }
}

function createHypothesis(
  finding:
    RuntimeCapabilityFinding,

  question:
    RuntimeScientificQuestion,

  profile:
    StrategyProfile,
): Readonly<RuntimeScientificHypothesis> {
  return Object.freeze({
    id:
      `HYPOTHESIS-${finding.id}-${profile.strategy}`,

    questionId:
      question.id,

    findingId:
      finding.id,

    strategy:
      profile.strategy,

    statement:
      strategyStatement(
        profile.strategy,
        finding,
      ),

    expectedEffect:
      strategyEffect(
        profile.strategy,
        finding,
      ),

    falsificationCondition:
      falsificationCondition(
        profile.strategy,
        finding,
      ),

    supportingEvidence:
      Object.freeze([
        ...finding.evidence,
      ]),

    humanAuthorizationRequired:
      true,
  });
}

function matchIntervention(
  finding:
    RuntimeCapabilityFinding,

  interventions:
    readonly RuntimeCapabilityIntervention[],
): RuntimeCapabilityIntervention {
  const intervention =
    interventions.find(
      (candidate) =>
        candidate.findingId ===
        finding.id,
    );

  if (intervention === undefined) {
    throw new Error(
      `RUNTIME_SCIENTIFIC_EXPERIMENT_INTERVENTION_MISSING:${finding.id}`,
    );
  }

  return intervention;
}

function createCandidate(
  finding:
    RuntimeCapabilityFinding,

  intervention:
    RuntimeCapabilityIntervention,

  question:
    RuntimeScientificQuestion,

  hypothesis:
    RuntimeScientificHypothesis,

  profile:
    StrategyProfile,

  operatorAuthorized: boolean,
): Readonly<RuntimeScientificExperimentCandidate> {
  const expectedCompletion =
    clampScore(
      intervention.expectedBenefit +
      profile.completionModifier,
    );

  const expectedBenefit =
    clampScore(
      intervention.expectedBenefit +
      profile.benefitModifier,
    );

  const evidenceConfidence =
    clampScore(
      intervention.evidenceConfidence,
    );

  return Object.freeze({
    id:
      `EXPERIMENT-${finding.id}-${profile.strategy}`,

    questionId:
      question.id,

    hypothesis,

    findingId:
      finding.id,

    interventionId:
      intervention.id,

    objective:
      `Test whether the ${profile.strategy} strategy resolves ${finding.id}.`,

    actionDescription:
      `${intervention.title} using strategy ${profile.strategy}.`,

    expectedCompletion,

    expectedBenefit,

    expectedRegressionSafety:
      profile.regressionSafety,

    expectedReproducibility:
      profile.reproducibility,

    evidenceConfidence,

    expectedRisk:
      profile.risk,

    expectedCost:
      Object.freeze({
        changedFiles:
          profile.changedFiles,

        changedLines:
          profile.changedLines,

        affectedModules:
          profile.affectedModules,

        addedTests:
          profile.addedTests,

        buildExecutions:
          profile.buildExecutions,

        operatorMinutes:
          profile.operatorMinutes,
      }),

    acceptanceCriteria:
      Object.freeze([
        "TypeScript compilation passes.",
        "Production build passes.",
        "Relevant tests pass.",
        "No unrelated regression is detected.",
        "Deterministic replay produces the same result.",
        "The targeted capability score or evidence confidence improves.",
        "The operator explicitly accepts the measured result.",
      ]),

    rejectionCriteria:
      Object.freeze([
        hypothesis.falsificationCondition,
        "Human authorization is missing.",
        "The implementation requires automatic repository mutation.",
        "The legalCertification=false boundary is violated.",
      ]),

    operatorAuthorized,

    humanAuthorizationRequired:
      true,

    automaticExecution:
      false,

    automaticRepositoryMutation:
      false,
  });
}

function rankCandidate(
  candidate:
    RuntimeScientificExperimentCandidate,
): Omit<
  RuntimeScientificExperimentRanking,
  "rank"
> {
  const efficiencyScore =
    calculateEfficiency(
      candidate.expectedCost,
    );

  const penalty =
    riskPenalty(
      candidate.expectedRisk,
    );

  const totalScore =
    clampScore(
      candidate.expectedCompletion *
        0.20 +
      candidate.expectedBenefit *
        0.20 +
      candidate.expectedRegressionSafety *
        0.20 +
      candidate.expectedReproducibility *
        0.15 +
      candidate.evidenceConfidence *
        0.15 +
      efficiencyScore *
        0.10 -
      penalty,
    );

  let decision:
    RuntimeScientificExperimentDecision =
      "REVIEW_REQUIRED";

  if (
    !candidate.operatorAuthorized ||
    candidate.expectedRisk ===
      "CRITICAL"
  ) {
    decision =
      "REJECT";
  } else if (
    totalScore >= 75 &&
    candidate.expectedRegressionSafety >=
      75 &&
    candidate.expectedReproducibility >=
      75
  ) {
    decision =
      "RECOMMEND";
  }

  const reasons: string[] = [
    `Expected completion: ${candidate.expectedCompletion}/100.`,
    `Expected benefit: ${candidate.expectedBenefit}/100.`,
    `Regression safety: ${candidate.expectedRegressionSafety}/100.`,
    `Reproducibility: ${candidate.expectedReproducibility}/100.`,
    `Evidence confidence: ${candidate.evidenceConfidence}/100.`,
    `Efficiency: ${efficiencyScore}/100.`,
    `Risk penalty: ${penalty}.`,
    `Final scientific experiment score: ${totalScore}/100.`,
  ];

  if (
    !candidate.operatorAuthorized
  ) {
    reasons.push(
      "Operator authorization is missing.",
    );
  }

  if (
    candidate.expectedRisk ===
    "CRITICAL"
  ) {
    reasons.push(
      "Critical-risk experiments cannot be recommended.",
    );
  }

  return {
    candidateId:
      candidate.id,

    hypothesisId:
      candidate.hypothesis.id,

    strategy:
      candidate.hypothesis.strategy,

    completionScore:
      candidate.expectedCompletion,

    benefitScore:
      candidate.expectedBenefit,

    regressionSafetyScore:
      candidate.expectedRegressionSafety,

    reproducibilityScore:
      candidate.expectedReproducibility,

    evidenceScore:
      candidate.evidenceConfidence,

    efficiencyScore,

    riskPenalty:
      penalty,

    totalScore,

    decision,

    reasons:
      Object.freeze(reasons),
  };
}

export function createRuntimeScientificExperiments(
  input:
    RuntimeScientificExperimentEngineInput,
): Readonly<RuntimeScientificExperimentEngineResult> {
  const executionId =
    requireNonEmptyString(
      input.executionId,
      "RUNTIME_SCIENTIFIC_EXPERIMENT_EXECUTION_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_SCIENTIFIC_EXPERIMENT_TIMESTAMP_REQUIRED",
    );

  const hypothesesPerFinding =
    requireHypothesisCount(
      input.hypothesesPerFinding,
    );

  if (
    input.capabilityAssessment
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_EXPERIMENT_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.capabilityAssessment
      .governance.readOnly !== true ||
    input.capabilityAssessment
      .governance.deterministic !== true ||
    input.capabilityAssessment
      .governance.failClosed !== true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_EXPERIMENT_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }

  const findings =
    [...input.capabilityAssessment.findings]
      .sort(
        (left, right) =>
          left.id.localeCompare(
            right.id,
          ),
      );

  if (findings.length === 0) {
    return Object.freeze({
      revision:
        RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION,

      executionId,
      generatedAt,

      status:
        "BLOCKED",

      questions:
        Object.freeze([]),

      hypotheses:
        Object.freeze([]),

      candidates:
        Object.freeze([]),

      ranking:
        Object.freeze([]),

      summary:
        Object.freeze({
          totalQuestions:
            0,

          totalHypotheses:
            0,

          totalCandidates:
            0,

          recommendedCandidates:
            0,

          reviewRequiredCandidates:
            0,

          rejectedCandidates:
            0,
        }),

      reasons:
        Object.freeze([
          "No capability findings are available for scientific experimentation.",
        ]),

      operatorAuthorized:
        input.operatorAuthorized ===
        true,

      governance:
        Object.freeze({
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
        }),

      legalCertification:
        false,
    });
  }

  const questions:
    RuntimeScientificQuestion[] = [];

  const hypotheses:
    RuntimeScientificHypothesis[] = [];

  const candidates:
    RuntimeScientificExperimentCandidate[] = [];

  const selectedProfiles =
    STRATEGY_PROFILES.slice(
      0,
      hypothesesPerFinding,
    );

  const operatorAuthorized =
    input.operatorAuthorized ===
      true;

  for (const finding of findings) {
    const question =
      createQuestion(
        finding,
      );

    questions.push(question);

    const intervention =
      matchIntervention(
        finding,
        input.capabilityAssessment
          .interventions,
      );

    for (
      const profile
      of selectedProfiles
    ) {
      const hypothesis =
        createHypothesis(
          finding,
          question,
          profile,
        );

      hypotheses.push(
        hypothesis,
      );

      candidates.push(
        createCandidate(
          finding,
          intervention,
          question,
          hypothesis,
          profile,
          operatorAuthorized,
        ),
      );
    }
  }

  const ranking =
    candidates
      .map(
        (candidate) =>
          rankCandidate(
            candidate,
          ),
      )
      .sort(
        (left, right) => {
          if (
            right.totalScore !==
            left.totalScore
          ) {
            return (
              right.totalScore -
              left.totalScore
            );
          }

          return left.candidateId
            .localeCompare(
              right.candidateId,
            );
        },
      )
      .map(
        (
          candidate,
          index,
        ): Readonly<RuntimeScientificExperimentRanking> =>
          Object.freeze({
            ...candidate,

            rank:
              index + 1,
          }),
      );

  const selectedRanking =
    ranking.find(
      (candidate) =>
        candidate.decision ===
        "RECOMMEND",
    );

  const selectedCandidate =
    selectedRanking === undefined
      ? undefined
      : candidates.find(
          (candidate) =>
            candidate.id ===
            selectedRanking.candidateId,
        );

  if (
    selectedRanking !== undefined &&
    selectedCandidate === undefined
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_EXPERIMENT_SELECTED_CANDIDATE_NOT_FOUND",
    );
  }

  const status:
    RuntimeScientificExperimentStatus =
      selectedCandidate !== undefined
        ? "RECOMMENDATION_AVAILABLE"
        : "READY_FOR_REVIEW";

  const reasons: string[] = [];

  if (
    selectedCandidate !== undefined
  ) {
    reasons.push(
      `Experiment ${selectedCandidate.id} has the highest eligible deterministic score.`,
    );

    reasons.push(
      "The recommendation does not authorize execution or repository mutation.",
    );
  } else {
    reasons.push(
      "No experiment satisfies all recommendation gates.",
    );
  }

  if (!operatorAuthorized) {
    reasons.push(
      "Operator authorization is absent; every candidate remains rejected or under review.",
    );
  }

  const summary:
    Readonly<RuntimeScientificExperimentEngineSummary> =
      Object.freeze({
        totalQuestions:
          questions.length,

        totalHypotheses:
          hypotheses.length,

        totalCandidates:
          candidates.length,

        recommendedCandidates:
          ranking.filter(
            (candidate) =>
              candidate.decision ===
              "RECOMMEND",
          ).length,

        reviewRequiredCandidates:
          ranking.filter(
            (candidate) =>
              candidate.decision ===
              "REVIEW_REQUIRED",
          ).length,

        rejectedCandidates:
          ranking.filter(
            (candidate) =>
              candidate.decision ===
              "REJECT",
          ).length,

        selectedCandidateId:
          selectedCandidate?.id,

        selectedHypothesisId:
          selectedCandidate
            ?.hypothesis.id,

        highestScore:
          ranking[0]?.totalScore,
      });

  return Object.freeze({
    revision:
      RUNTIME_SCIENTIFIC_EXPERIMENT_ENGINE_REVISION,

    executionId,
    generatedAt,

    status,

    questions:
      Object.freeze(
        questions,
      ),

    hypotheses:
      Object.freeze(
        hypotheses,
      ),

    candidates:
      Object.freeze(
        candidates,
      ),

    ranking:
      Object.freeze(
        ranking,
      ),

    selectedCandidate,

    summary,

    reasons:
      Object.freeze(
        reasons,
      ),

    operatorAuthorized,

    governance:
      Object.freeze({
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
      }),

    legalCertification:
      false,
  });
}
