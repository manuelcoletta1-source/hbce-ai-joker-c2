/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Governed Integration Runtime
 *
 * Shared Integration Types
 *
 * Deterministic: true
 * Fail Closed: true
 * Human Authorization Required: true
 * Automatic Repository Mutation: false
 * Automatic Recall: false
 * Persistent Memory: false
 * Legal Certification: false
 */

import type {
  IntegrationDecision,
  IntegrationEvidenceStatus,
  IntegrationHypothesis,
  IntegrationScoreResult,
} from "../../modules/mod-003/integration-score.types";

export type IntegrationRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type IntegrationPlanStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "AUTHORIZED"
  | "REJECTED"
  | "IMPLEMENTED"
  | "VERIFIED"
  | "FAILED";

export type IntegrationActionType =
  | "CREATE_FILE"
  | "UPDATE_FILE"
  | "DELETE_FILE"
  | "ADD_EXPORT"
  | "ADD_IMPORT"
  | "ADD_TEST"
  | "UPDATE_TEST"
  | "UPDATE_ROUTE"
  | "UPDATE_SERVICE"
  | "UPDATE_DASHBOARD"
  | "UPDATE_DOCUMENTATION";

export interface IntegrationTarget {
  readonly path: string;
  readonly action: IntegrationActionType;
  readonly reason: string;
}

export interface IntegrationConstraint {
  readonly id: string;
  readonly description: string;
  readonly required: boolean;
}

export interface IntegrationEvidence {
  readonly id: string;
  readonly category:
    | "BUILD"
    | "TYPE_CHECK"
    | "TEST"
    | "REGRESSION"
    | "REPLAY"
    | "OPERATOR"
    | "RUNTIME";

  readonly status: IntegrationEvidenceStatus;
  readonly description: string;
  readonly source?: string;
}

export interface IntegrationExpectedImpact {
  readonly capabilityGain: number;
  readonly complexityChange: number;
  readonly regressionRisk: IntegrationRiskLevel;
  readonly affectedModules: readonly string[];
  readonly expectedBenefits: readonly string[];
  readonly expectedRisks: readonly string[];
}

export interface IntegrationPlan {
  readonly id: string;
  readonly title: string;
  readonly objective: string;

  readonly hypothesis: IntegrationHypothesis;

  readonly targets: readonly IntegrationTarget[];
  readonly constraints: readonly IntegrationConstraint[];

  readonly expectedImpact: IntegrationExpectedImpact;

  readonly status: IntegrationPlanStatus;

  readonly humanAuthorizationRequired: true;
  readonly operatorAuthorized: boolean;

  readonly createdAt: string;
}

export interface IntegrationExecutionRecord {
  readonly planId: string;
  readonly commit?: string;

  readonly changedPaths: readonly string[];
  readonly evidence: readonly IntegrationEvidence[];

  readonly buildStatus: IntegrationEvidenceStatus;
  readonly testStatus: IntegrationEvidenceStatus;
  readonly regressionStatus: IntegrationEvidenceStatus;

  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface IntegrationEvaluation {
  readonly plan: IntegrationPlan;
  readonly execution?: IntegrationExecutionRecord;
  readonly score?: IntegrationScoreResult;

  readonly finalDecision: IntegrationDecision;
  readonly reasons: readonly string[];
}

export interface IntegrationPlannerInput {
  readonly objective: string;
  readonly hypothesis: IntegrationHypothesis;

  readonly candidateTargets: readonly IntegrationTarget[];
  readonly constraints: readonly IntegrationConstraint[];

  readonly expectedImpact: IntegrationExpectedImpact;

  readonly operatorAuthorized: boolean;
}

export interface IntegrationPlannerOutput {
  readonly plan: IntegrationPlan;
  readonly decision: IntegrationDecision;
  readonly reasons: readonly string[];
}
