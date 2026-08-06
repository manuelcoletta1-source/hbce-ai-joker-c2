/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Knowledge Runtime
 *
 * Shared governed domain types for:
 * observation, hypothesis, action, evaluation and learning.
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Recall: false
 * Automatic Persistence: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

export type KnowledgeRecordStatus =
  | "DRAFT"
  | "OBSERVED"
  | "HYPOTHESIZED"
  | "AUTHORIZED"
  | "EXECUTED"
  | "EVALUATED"
  | "ACCEPTED"
  | "REJECTED"
  | "ARCHIVED";

export type KnowledgeEvidenceStatus =
  | "NOT_RUN"
  | "PASS"
  | "FAIL"
  | "PARTIAL"
  | "OPERATOR_DECLARED";

export type KnowledgeConfidenceLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type KnowledgeDecision =
  | "ACCEPT"
  | "REJECT"
  | "REVIEW_REQUIRED";

export type KnowledgeObservationCategory =
  | "REPOSITORY"
  | "BUILD"
  | "TYPE_CHECK"
  | "TEST"
  | "REGRESSION"
  | "RUNTIME"
  | "SEMANTIC"
  | "ARCHITECTURAL"
  | "OPERATOR";

export type KnowledgeActionType =
  | "CREATE_FILE"
  | "UPDATE_FILE"
  | "DELETE_FILE"
  | "ADD_IMPORT"
  | "ADD_EXPORT"
  | "ADD_TEST"
  | "UPDATE_TEST"
  | "UPDATE_ROUTE"
  | "UPDATE_SERVICE"
  | "UPDATE_DASHBOARD"
  | "UPDATE_DOCUMENTATION"
  | "NO_ACTION";

export interface KnowledgeSourceReference {
  readonly artifact: string;
  readonly revision?: string;
  readonly commit?: string;
  readonly path?: string;
  readonly hash?: string;
}

export interface KnowledgeObservation {
  readonly id: string;
  readonly category: KnowledgeObservationCategory;

  readonly description: string;
  readonly measuredValue?: number;
  readonly unit?: string;

  readonly evidenceStatus: KnowledgeEvidenceStatus;
  readonly source: KnowledgeSourceReference;

  readonly observedAt: string;
}

export interface KnowledgeHypothesis {
  readonly id: string;

  readonly statement: string;
  readonly expectedEffect: string;

  readonly supportingObservationIds: readonly string[];
  readonly affectedPaths: readonly string[];

  readonly confidence: KnowledgeConfidenceLevel;
  readonly falsifiable: boolean;
}

export interface KnowledgeAction {
  readonly id: string;
  readonly hypothesisId: string;

  readonly type: KnowledgeActionType;
  readonly targetPath?: string;
  readonly description: string;

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;

  readonly executed: boolean;
  readonly executionCommit?: string;
}

export interface KnowledgeMetric {
  readonly name: string;
  readonly value: number;
  readonly unit?: string;

  readonly minimumExpected?: number;
  readonly maximumExpected?: number;
}

export interface KnowledgeEvaluation {
  readonly id: string;
  readonly hypothesisId: string;
  readonly actionId: string;

  readonly completionStatus: KnowledgeEvidenceStatus;
  readonly regressionStatus: KnowledgeEvidenceStatus;
  readonly reproducibilityStatus: KnowledgeEvidenceStatus;

  readonly metrics: readonly KnowledgeMetric[];

  readonly score: number;
  readonly decision: KnowledgeDecision;
  readonly reasons: readonly string[];

  readonly evaluatedAt: string;
}

export interface KnowledgeLearning {
  readonly id: string;

  readonly observationIds: readonly string[];
  readonly hypothesisId: string;
  readonly actionId: string;
  readonly evaluationId: string;

  readonly conclusion: string;
  readonly reusableRule?: string;

  readonly confidence: KnowledgeConfidenceLevel;
  readonly acceptedByOperator: boolean;

  readonly persistent: false;
  readonly automaticRecall: false;
}

export interface KnowledgeCycle {
  readonly id: string;

  readonly observations: readonly KnowledgeObservation[];
  readonly hypothesis: KnowledgeHypothesis;
  readonly action: KnowledgeAction;
  readonly evaluation?: KnowledgeEvaluation;
  readonly learning?: KnowledgeLearning;

  readonly status: KnowledgeRecordStatus;

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;

  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface KnowledgeCycleInput {
  readonly id: string;
  readonly createdAt: string;

  readonly observations: readonly KnowledgeObservation[];
  readonly hypothesis: KnowledgeHypothesis;
  readonly action: KnowledgeAction;

  readonly operatorAuthorized: boolean;
}

export interface KnowledgeCycleResult {
  readonly cycle: KnowledgeCycle;
  readonly decision: KnowledgeDecision;
  readonly reasons: readonly string[];
}
