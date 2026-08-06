/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method Response Mapper
 *
 * Safely extracts a dashboard ViewModel from an unknown API response.
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeScientificMethodDashboardViewModel,
  RuntimeScientificMethodMetricView,
  RuntimeScientificMethodStageView,
} from "./runtime-scientific-method.view-model";

export const RUNTIME_SCIENTIFIC_METHOD_MAPPER_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-METHOD-MAPPER-v1_0" as const;

export interface RuntimeScientificMethodMapperResult {
  readonly mapped: boolean;

  readonly model?: RuntimeScientificMethodDashboardViewModel;

  readonly reason:
    | "VIEW_MODEL_DIRECT"
    | "VIEW_MODEL_NESTED"
    | "UNSUPPORTED_RESPONSE";

  readonly revision:
    typeof RUNTIME_SCIENTIFIC_METHOD_MAPPER_REVISION;

  readonly legalCertification: false;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isString(
  value: unknown,
): value is string {
  return typeof value === "string";
}

function isBoolean(
  value: unknown,
): value is boolean {
  return typeof value === "boolean";
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isDashboardTone(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["statusTone"] {
  return (
    value === "SUCCESS" ||
    value === "WARNING" ||
    value === "DANGER" ||
    value === "NEUTRAL"
  );
}

function isScientificMethodStatus(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["status"] {
  return (
    value === "COMPLETED" ||
    value === "REVIEW_REQUIRED" ||
    value === "REJECTED" ||
    value === "BLOCKED"
  );
}

function isStageStatus(
  value: unknown,
): value is RuntimeScientificMethodStageView["status"] {
  return (
    value === "PASS" ||
    value === "REVIEW_REQUIRED" ||
    value === "FAIL"
  );
}

function isStageId(
  value: unknown,
): value is RuntimeScientificMethodStageView["id"] {
  return (
    value === "CAPABILITY_ANALYSIS" ||
    value === "EXPERIMENT_RANKING" ||
    value === "INTEGRATION_PLANNING" ||
    value === "INTEGRATION_VALIDATION" ||
    value === "INTEGRATION_SCORING" ||
    value === "KNOWLEDGE_CYCLE" ||
    value === "CAUSAL_DERIVATION"
  );
}

function isMetricView(
  value: unknown,
): value is RuntimeScientificMethodMetricView {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.label) &&
    isString(value.value) &&
    isDashboardTone(value.tone)
  );
}

function isStageView(
  value: unknown,
): value is RuntimeScientificMethodStageView {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStageId(value.id) &&
    isString(value.label) &&
    isStageStatus(value.status) &&
    isDashboardTone(value.tone) &&
    isString(value.description)
  );
}

function isRepositoryView(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["repository"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.name) &&
    isString(value.branch) &&
    isString(value.commit) &&
    isFiniteNumber(value.fileCount) &&
    isFiniteNumber(value.directoryCount) &&
    isFiniteNumber(value.inspectedFileCount)
  );
}

function isRecommendationView(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["recommendation"] {
  if (!isRecord(value)) {
    return false;
  }

  const candidateIdValid =
    value.candidateId === undefined ||
    isString(value.candidateId);

  const hypothesisIdValid =
    value.hypothesisId === undefined ||
    isString(value.hypothesisId);

  const scoreValid =
    value.score === undefined ||
    isFiniteNumber(value.score);

  const decisionValid =
    value.decision === "SELECT" ||
    value.decision === "REVIEW_REQUIRED" ||
    value.decision === "REJECT";

  return (
    candidateIdValid &&
    hypothesisIdValid &&
    scoreValid &&
    decisionValid &&
    isString(value.summary)
  );
}

function isCausalKnowledgeView(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["causalKnowledge"] {
  if (!isRecord(value)) {
    return false;
  }

  const decisionValid =
    value.decision === "ACCEPT" ||
    value.decision === "REVIEW_REQUIRED" ||
    value.decision === "REJECT";

  const ruleIdValid =
    value.ruleId === undefined ||
    isString(value.ruleId);

  const relationValid =
    value.relation === undefined ||
    isString(value.relation);

  const confidenceValid =
    value.confidence === undefined ||
    isString(value.confidence);

  const confidenceScoreValid =
    value.confidenceScore === undefined ||
    isFiniteNumber(value.confidenceScore);

  return (
    decisionValid &&
    ruleIdValid &&
    relationValid &&
    confidenceValid &&
    confidenceScoreValid
  );
}

function isGovernanceView(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel["governance"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.humanAuthorizationRequired === true &&
    isBoolean(value.operatorAuthorized) &&
    value.readOnly === true &&
    value.deterministic === true &&
    value.automaticExecution === false &&
    value.automaticPersistence === false &&
    value.automaticRecall === false &&
    value.automaticRepositoryMutation === false &&
    value.legalCertification === false
  );
}

export function isRuntimeScientificMethodDashboardViewModel(
  value: unknown,
): value is RuntimeScientificMethodDashboardViewModel {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.revision !==
    "AIJC2-RUNTIME-SCIENTIFIC-METHOD-VIEW-MODEL-v1_0"
  ) {
    return false;
  }

  if (
    value.title !==
    "AI JOKER-C2 Runtime Scientific Method"
  ) {
    return false;
  }

  if (
    !isString(value.executionId) ||
    !isString(value.generatedAt) ||
    !isScientificMethodStatus(value.status) ||
    !isDashboardTone(value.statusTone)
  ) {
    return false;
  }

  if (!isRepositoryView(value.repository)) {
    return false;
  }

  if (
    !Array.isArray(value.metrics) ||
    !value.metrics.every(isMetricView)
  ) {
    return false;
  }

  if (
    !Array.isArray(value.stages) ||
    !value.stages.every(isStageView)
  ) {
    return false;
  }

  if (
    !isRecommendationView(value.recommendation)
  ) {
    return false;
  }

  if (
    !isCausalKnowledgeView(value.causalKnowledge)
  ) {
    return false;
  }

  if (
    !Array.isArray(value.reasons) ||
    !value.reasons.every(isString)
  ) {
    return false;
  }

  return isGovernanceView(value.governance);
}

export function mapRuntimeScientificMethodResponse(
  response: unknown,
): Readonly<RuntimeScientificMethodMapperResult> {
  if (
    isRuntimeScientificMethodDashboardViewModel(
      response,
    )
  ) {
    return Object.freeze({
      mapped: true,
      model: response,
      reason: "VIEW_MODEL_DIRECT",
      revision:
        RUNTIME_SCIENTIFIC_METHOD_MAPPER_REVISION,
      legalCertification: false,
    });
  }

  if (
    isRecord(response) &&
    isRuntimeScientificMethodDashboardViewModel(
      response.viewModel,
    )
  ) {
    return Object.freeze({
      mapped: true,
      model: response.viewModel,
      reason: "VIEW_MODEL_NESTED",
      revision:
        RUNTIME_SCIENTIFIC_METHOD_MAPPER_REVISION,
      legalCertification: false,
    });
  }

  return Object.freeze({
    mapped: false,
    reason: "UNSUPPORTED_RESPONSE",
    revision:
      RUNTIME_SCIENTIFIC_METHOD_MAPPER_REVISION,
    legalCertification: false,
  });
}
