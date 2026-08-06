/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Causal Knowledge Engine
 *
 * Produces governed causal knowledge candidates from an explicitly
 * supplied knowledge cycle and integration score.
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Rule Acceptance: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  IntegrationScoreResult,
} from "../../modules/mod-003/integration-score.types";

import type {
  KnowledgeAction,
  KnowledgeConfidenceLevel,
  KnowledgeCycle,
  KnowledgeDecision,
  KnowledgeEvaluation,
  KnowledgeHypothesis,
  KnowledgeLearning,
  KnowledgeObservation,
} from "./knowledge-types";

export const CAUSAL_KNOWLEDGE_ENGINE_REVISION =
  "AIJC2-CAUSAL-KNOWLEDGE-ENGINE-v1_0" as const;

export type CausalRuleStatus =
  | "CANDIDATE"
  | "REVIEW_REQUIRED"
  | "ACCEPTED"
  | "REJECTED";

export type CausalRelationType =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "CONTRIBUTES_TO"
  | "INSUFFICIENT_EVIDENCE";

export interface CausalEvidenceReference {
  readonly observationId: string;
  readonly category: KnowledgeObservation["category"];
  readonly evidenceStatus: KnowledgeObservation["evidenceStatus"];
  readonly description: string;
}

export interface CausalRule {
  readonly id: string;

  readonly hypothesisId: string;
  readonly actionId: string;
  readonly evaluationId: string;

  readonly cause: string;
  readonly action: string;
  readonly effect: string;

  readonly relation: CausalRelationType;
  readonly reusableRule: string;

  readonly confidence: KnowledgeConfidenceLevel;
  readonly confidenceScore: number;

  readonly integrationScore: number;
  readonly status: CausalRuleStatus;

  readonly evidence: readonly CausalEvidenceReference[];
  readonly reasons: readonly string[];

  readonly operatorAuthorized: boolean;
  readonly acceptedByOperator: boolean;

  readonly persistent: false;
  readonly automaticRecall: false;
  readonly automaticAcceptance: false;
  readonly legalCertification: false;
}

export interface CausalKnowledgeInput {
  readonly ruleId: string;

  readonly cycle: KnowledgeCycle;
  readonly evaluation: KnowledgeEvaluation;
  readonly integrationScore: IntegrationScoreResult;

  readonly causeStatement: string;
  readonly effectStatement: string;
  readonly reusableRule: string;

  readonly operatorAuthorized: boolean;
  readonly acceptedByOperator: boolean;
}

export interface CausalKnowledgeResult {
  readonly revision:
    typeof CAUSAL_KNOWLEDGE_ENGINE_REVISION;

  readonly decision: KnowledgeDecision;
  readonly rule?: CausalRule;
  readonly learning?: KnowledgeLearning;

  readonly reasons: readonly string[];

  readonly persistent: false;
  readonly automaticRecall: false;
  readonly automaticAcceptance: false;
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

function validateCycleReferences(
  cycle: KnowledgeCycle,
  evaluation: KnowledgeEvaluation,
  integrationScore: IntegrationScoreResult,
): void {
  if (
    evaluation.hypothesisId !== cycle.hypothesis.id
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_HYPOTHESIS_REFERENCE_MISMATCH",
    );
  }

  if (
    evaluation.actionId !== cycle.action.id
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_ACTION_REFERENCE_MISMATCH",
    );
  }

  if (
    cycle.action.hypothesisId !== cycle.hypothesis.id
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_CYCLE_REFERENCE_MISMATCH",
    );
  }

  if (
    integrationScore.hypothesis.id !==
    cycle.hypothesis.id
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_SCORE_HYPOTHESIS_MISMATCH",
    );
  }
}

function validateGovernanceBoundary(
  cycle: KnowledgeCycle,
  action: KnowledgeAction,
): void {
  if (
    cycle.humanAuthorizationRequired !== true ||
    action.humanAuthorizationRequired !== true
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }
}

function buildEvidence(
  observations: readonly KnowledgeObservation[],
): readonly CausalEvidenceReference[] {
  const evidence =
    observations
      .map(
        (
          observation,
        ): Readonly<CausalEvidenceReference> =>
          Object.freeze({
            observationId:
              observation.id,

            category:
              observation.category,

            evidenceStatus:
              observation.evidenceStatus,

            description:
              observation.description.trim(),
          }),
      )
      .sort(
        (left, right) =>
          left.observationId.localeCompare(
            right.observationId,
          ),
      );

  const ids =
    evidence.map(
      (item) => item.observationId,
    );

  if (
    new Set(ids).size !==
    ids.length
  ) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_DUPLICATE_OBSERVATION",
    );
  }

  return Object.freeze(
    evidence,
  );
}

function determineRelation(
  evaluation: KnowledgeEvaluation,
  score: IntegrationScoreResult,
): CausalRelationType {
  if (
    evaluation.regressionStatus === "FAIL" ||
    score.decision === "REJECT"
  ) {
    return "CONTRADICTS";
  }

  if (
    evaluation.completionStatus === "PASS" &&
    evaluation.reproducibilityStatus === "PASS" &&
    score.totalScore >= 75 &&
    score.decision === "ACCEPT"
  ) {
    return "SUPPORTS";
  }

  if (
    evaluation.completionStatus === "PASS" ||
    score.totalScore > 0
  ) {
    return "CONTRIBUTES_TO";
  }

  return "INSUFFICIENT_EVIDENCE";
}

function calculateConfidenceScore(
  hypothesis: KnowledgeHypothesis,
  evaluation: KnowledgeEvaluation,
  score: IntegrationScoreResult,
  evidence: readonly CausalEvidenceReference[],
): number {
  let confidence = 0;

  if (hypothesis.falsifiable) {
    confidence += 15;
  }

  if (
    evaluation.completionStatus === "PASS"
  ) {
    confidence += 20;
  }

  if (
    evaluation.regressionStatus === "PASS"
  ) {
    confidence += 20;
  }

  if (
    evaluation.reproducibilityStatus === "PASS"
  ) {
    confidence += 20;
  }

  confidence +=
    Math.round(
      score.totalScore * 0.2,
    );

  const passedEvidence =
    evidence.filter(
      (item) =>
        item.evidenceStatus === "PASS",
    ).length;

  if (
    evidence.length > 0
  ) {
    confidence +=
      Math.round(
        (
          passedEvidence /
          evidence.length
        ) * 5,
      );
  }

  return Math.min(
    confidence,
    100,
  );
}

function mapConfidenceLevel(
  confidenceScore: number,
): KnowledgeConfidenceLevel {
  if (confidenceScore >= 80) {
    return "HIGH";
  }

  if (confidenceScore >= 50) {
    return "MEDIUM";
  }

  return "LOW";
}

function determineRuleStatus(
  relation: CausalRelationType,
  operatorAuthorized: boolean,
  acceptedByOperator: boolean,
): CausalRuleStatus {
  if (
    relation === "CONTRADICTS"
  ) {
    return "REJECTED";
  }

  if (!operatorAuthorized) {
    return "REVIEW_REQUIRED";
  }

  if (acceptedByOperator) {
    return "ACCEPTED";
  }

  return "CANDIDATE";
}

function determineDecision(
  relation: CausalRelationType,
  operatorAuthorized: boolean,
  acceptedByOperator: boolean,
): KnowledgeDecision {
  if (
    relation === "CONTRADICTS"
  ) {
    return "REJECT";
  }

  if (
    operatorAuthorized &&
    acceptedByOperator &&
    relation === "SUPPORTS"
  ) {
    return "ACCEPT";
  }

  return "REVIEW_REQUIRED";
}

function buildReasons(
  relation: CausalRelationType,
  integrationScore: number,
  confidenceScore: number,
  operatorAuthorized: boolean,
  acceptedByOperator: boolean,
): readonly string[] {
  const reasons: string[] = [];

  reasons.push(
    `Causal relation classified as ${relation}.`,
  );

  reasons.push(
    `Integration score is ${integrationScore}/100.`,
  );

  reasons.push(
    `Derived causal confidence is ${confidenceScore}/100.`,
  );

  if (!operatorAuthorized) {
    reasons.push(
      "Operator authorization is missing.",
    );
  }

  if (
    operatorAuthorized &&
    !acceptedByOperator
  ) {
    reasons.push(
      "The causal rule has not been accepted by the operator.",
    );
  }

  if (
    relation === "INSUFFICIENT_EVIDENCE"
  ) {
    reasons.push(
      "Available evidence is insufficient to support a reusable causal rule.",
    );
  }

  if (
    relation === "CONTRADICTS"
  ) {
    reasons.push(
      "Evaluation or integration evidence contradicts the proposed causal relation.",
    );
  }

  return Object.freeze(
    reasons,
  );
}

function createLearning(
  input: CausalKnowledgeInput,
  rule: CausalRule,
): Readonly<KnowledgeLearning> {
  return Object.freeze({
    id:
      `${rule.id}-LEARNING`,

    observationIds:
      Object.freeze(
        rule.evidence.map(
          (item) =>
            item.observationId,
        ),
      ),

    hypothesisId:
      rule.hypothesisId,

    actionId:
      rule.actionId,

    evaluationId:
      rule.evaluationId,

    conclusion:
      `${rule.cause} ${rule.action} ${rule.effect}`,

    reusableRule:
      rule.reusableRule,

    confidence:
      rule.confidence,

    acceptedByOperator:
      input.acceptedByOperator === true,

    persistent:
      false,

    automaticRecall:
      false,
  });
}

export function deriveCausalKnowledge(
  input: CausalKnowledgeInput,
): Readonly<CausalKnowledgeResult> {
  const ruleId =
    requireNonEmptyString(
      input.ruleId,
      "CAUSAL_KNOWLEDGE_RULE_ID_REQUIRED",
    );

  const causeStatement =
    requireNonEmptyString(
      input.causeStatement,
      "CAUSAL_KNOWLEDGE_CAUSE_REQUIRED",
    );

  const effectStatement =
    requireNonEmptyString(
      input.effectStatement,
      "CAUSAL_KNOWLEDGE_EFFECT_REQUIRED",
    );

  const reusableRule =
    requireNonEmptyString(
      input.reusableRule,
      "CAUSAL_KNOWLEDGE_REUSABLE_RULE_REQUIRED",
    );

  validateCycleReferences(
    input.cycle,
    input.evaluation,
    input.integrationScore,
  );

  validateGovernanceBoundary(
    input.cycle,
    input.cycle.action,
  );

  const integrationScore =
    requireScore(
      input.integrationScore.totalScore,
      "CAUSAL_KNOWLEDGE_INTEGRATION_SCORE_INVALID",
    );

  const evidence =
    buildEvidence(
      input.cycle.observations,
    );

  if (evidence.length === 0) {
    throw new Error(
      "CAUSAL_KNOWLEDGE_EVIDENCE_REQUIRED",
    );
  }

  const relation =
    determineRelation(
      input.evaluation,
      input.integrationScore,
    );

  const confidenceScore =
    calculateConfidenceScore(
      input.cycle.hypothesis,
      input.evaluation,
      input.integrationScore,
      evidence,
    );

  const confidence =
    mapConfidenceLevel(
      confidenceScore,
    );

  const operatorAuthorized =
    input.operatorAuthorized === true &&
    input.cycle.operatorAuthorized === true &&
    input.cycle.action.operatorAuthorized === true;

  const acceptedByOperator =
    operatorAuthorized &&
    input.acceptedByOperator === true;

  const status =
    determineRuleStatus(
      relation,
      operatorAuthorized,
      acceptedByOperator,
    );

  const reasons =
    buildReasons(
      relation,
      integrationScore,
      confidenceScore,
      operatorAuthorized,
      acceptedByOperator,
    );

  const rule:
    Readonly<CausalRule> =
      Object.freeze({
        id:
          ruleId,

        hypothesisId:
          input.cycle.hypothesis.id,

        actionId:
          input.cycle.action.id,

        evaluationId:
          input.evaluation.id,

        cause:
          causeStatement,

        action:
          input.cycle.action.description.trim(),

        effect:
          effectStatement,

        relation,

        reusableRule,

        confidence,
        confidenceScore,

        integrationScore,

        status,

        evidence,

        reasons,

        operatorAuthorized,
        acceptedByOperator,

        persistent:
          false,

        automaticRecall:
          false,

        automaticAcceptance:
          false,

        legalCertification:
          false,
      });

  const decision =
    determineDecision(
      relation,
      operatorAuthorized,
      acceptedByOperator,
    );

  const learning =
    decision === "REJECT"
      ? undefined
      : createLearning(
          input,
          rule,
        );

  return Object.freeze({
    revision:
      CAUSAL_KNOWLEDGE_ENGINE_REVISION,

    decision,

    rule,

    learning,

    reasons,

    persistent:
      false,

    automaticRecall:
      false,

    automaticAcceptance:
      false,

    legalCertification:
      false,
  });
}
