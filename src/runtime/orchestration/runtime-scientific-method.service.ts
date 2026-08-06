/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method Service
 *
 * Composes the governed scientific-method pipeline:
 *
 * MOD-001 Repository Intelligence
 * → Runtime Capability Pipeline
 * → Runtime Experiment Engine
 * → Integration Planner
 * → Integration Validator
 * → Human-Parity Integration Scorer
 * → Knowledge Runtime
 * → Causal Knowledge Engine
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  scoreIntegration,
} from "../../modules/mod-003/integration-score";

import {
  createRuntimeExperimentPlan,
} from "../experiments/runtime-experiment-engine";

import {
  createIntegrationPlan,
} from "../integration/integration-planner";

import {
  validateIntegrationPlan,
} from "../integration/integration-validator";

import {
  deriveCausalKnowledge,
} from "../knowledge/causal-knowledge-engine";

import {
  createKnowledgeCycle,
} from "../knowledge/knowledge-engine";

import {
  executeRuntimeCapabilityPipeline,
} from "../self/runtime-capability-pipeline";

import {
  RUNTIME_SCIENTIFIC_METHOD_REVISION,
  type RuntimeScientificMethodInput,
  type RuntimeScientificMethodOutput,
  type RuntimeScientificMethodStageResult,
  type RuntimeScientificMethodStatus,
} from "./runtime-scientific-method.types";

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

function validateAuthorizationBoundary(
  input: RuntimeScientificMethodInput,
): void {
  if (
    input.humanAuthorizationRequired !== true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    input.operatorAuthorized !==
    input.integrationPlan.operatorAuthorized
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_PLAN_AUTHORIZATION_MISMATCH",
    );
  }

  if (
    input.operatorAuthorized !==
    input.knowledgeCycle.operatorAuthorized
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_KNOWLEDGE_AUTHORIZATION_MISMATCH",
    );
  }
}

function validateHypothesisAlignment(
  input: RuntimeScientificMethodInput,
): void {
  const integrationHypothesisId =
    requireNonEmptyString(
      input.integrationPlan.hypothesis.id,
      "RUNTIME_SCIENTIFIC_METHOD_INTEGRATION_HYPOTHESIS_ID_REQUIRED",
    );

  const scoreHypothesisId =
    requireNonEmptyString(
      input.integrationScore.hypothesis.id,
      "RUNTIME_SCIENTIFIC_METHOD_SCORE_HYPOTHESIS_ID_REQUIRED",
    );

  const knowledgeHypothesisId =
    requireNonEmptyString(
      input.knowledgeCycle.hypothesis.id,
      "RUNTIME_SCIENTIFIC_METHOD_KNOWLEDGE_HYPOTHESIS_ID_REQUIRED",
    );

  const knowledgeActionHypothesisId =
    requireNonEmptyString(
      input.knowledgeCycle.action.hypothesisId,
      "RUNTIME_SCIENTIFIC_METHOD_ACTION_HYPOTHESIS_ID_REQUIRED",
    );

  const causalEvaluationHypothesisId =
    requireNonEmptyString(
      input.causal.evaluation.hypothesisId,
      "RUNTIME_SCIENTIFIC_METHOD_CAUSAL_HYPOTHESIS_ID_REQUIRED",
    );

  if (
    integrationHypothesisId !==
    scoreHypothesisId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_SCORE_HYPOTHESIS_MISMATCH",
    );
  }

  if (
    integrationHypothesisId !==
    knowledgeHypothesisId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_KNOWLEDGE_HYPOTHESIS_MISMATCH",
    );
  }

  if (
    knowledgeHypothesisId !==
    knowledgeActionHypothesisId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_ACTION_HYPOTHESIS_MISMATCH",
    );
  }

  if (
    knowledgeHypothesisId !==
    causalEvaluationHypothesisId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_CAUSAL_HYPOTHESIS_MISMATCH",
    );
  }
}

function validateActionAlignment(
  input: RuntimeScientificMethodInput,
): void {
  const knowledgeActionId =
    requireNonEmptyString(
      input.knowledgeCycle.action.id,
      "RUNTIME_SCIENTIFIC_METHOD_KNOWLEDGE_ACTION_ID_REQUIRED",
    );

  const causalActionId =
    requireNonEmptyString(
      input.causal.evaluation.actionId,
      "RUNTIME_SCIENTIFIC_METHOD_CAUSAL_ACTION_ID_REQUIRED",
    );

  if (
    knowledgeActionId !==
    causalActionId
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_CAUSAL_ACTION_MISMATCH",
    );
  }
}

function validateExperimentAlignment(
  input: RuntimeScientificMethodInput,
): void {
  const integrationHypothesisId =
    input.integrationPlan.hypothesis.id.trim();

  const experimentHypothesisExists =
    input.experiment.candidates.some(
      (candidate) =>
        candidate.hypothesis.id.trim() ===
        integrationHypothesisId,
    );

  if (!experimentHypothesisExists) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_PLAN_HYPOTHESIS_NOT_IN_EXPERIMENT",
    );
  }
}

function stage(
  stageName:
    RuntimeScientificMethodStageResult["stage"],

  status:
    RuntimeScientificMethodStageResult["status"],

  description: string,
): Readonly<RuntimeScientificMethodStageResult> {
  return Object.freeze({
    stage: stageName,
    status,
    description,
  });
}

function determineFinalStatus(
  stages:
    readonly RuntimeScientificMethodStageResult[],
): RuntimeScientificMethodStatus {
  const hasFailure =
    stages.some(
      (item) =>
        item.status === "FAIL",
    );

  if (hasFailure) {
    return "REJECTED";
  }

  const requiresReview =
    stages.some(
      (item) =>
        item.status ===
        "REVIEW_REQUIRED",
    );

  if (requiresReview) {
    return "REVIEW_REQUIRED";
  }

  return "COMPLETED";
}

function buildFinalReasons(
  status: RuntimeScientificMethodStatus,
  stages:
    readonly RuntimeScientificMethodStageResult[],
): readonly string[] {
  const reasons =
    stages.map(
      (item) =>
        `${item.stage}: ${item.description}`,
    );

  if (status === "COMPLETED") {
    reasons.push(
      "All governed scientific-method stages completed successfully.",
    );
  }

  if (status === "REVIEW_REQUIRED") {
    reasons.push(
      "At least one stage requires explicit operator review.",
    );
  }

  if (status === "REJECTED") {
    reasons.push(
      "At least one stage failed a mandatory governed gate.",
    );
  }

  return Object.freeze(reasons);
}

export function executeRuntimeScientificMethod(
  input: RuntimeScientificMethodInput,
): Readonly<RuntimeScientificMethodOutput> {
  const executionId =
    requireNonEmptyString(
      input.executionId,
      "RUNTIME_SCIENTIFIC_METHOD_EXECUTION_ID_REQUIRED",
    );

  const revision =
    requireNonEmptyString(
      input.revision,
      "RUNTIME_SCIENTIFIC_METHOD_INPUT_REVISION_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_SCIENTIFIC_METHOD_TIMESTAMP_REQUIRED",
    );

  const runtimeVersion =
    requireNonEmptyString(
      input.runtimeVersion,
      "RUNTIME_SCIENTIFIC_METHOD_RUNTIME_VERSION_REQUIRED",
    );

  validateAuthorizationBoundary(input);
  validateHypothesisAlignment(input);
  validateActionAlignment(input);
  validateExperimentAlignment(input);

  const stages:
    RuntimeScientificMethodStageResult[] = [];

  /*
   * Stage 1:
   * MOD-001 → Capability Extraction → Registry → Runtime Self
   */
  const capability =
    executeRuntimeCapabilityPipeline({
      revision:
        `${revision}-CAPABILITY`,

      generatedAt,

      runtimeVersion,

      mod001Analysis:
        input.mod001Analysis,

      repository:
        input.repository,

      evolution:
        input.evolution,

      integration:
        input.integration,

      knowledge:
        input.knowledge,

      operatorAuthorized:
        input.operatorAuthorized,
    });

  const capabilityStatus =
    capability.runtimeSelfState
      .operationalStatus;

  stages.push(
    stage(
      "CAPABILITY_ANALYSIS",

      capabilityStatus === "BLOCKED"
        ? "FAIL"
        : capabilityStatus ===
            "OPERATIONAL"
          ? "PASS"
          : "REVIEW_REQUIRED",

      `Runtime capability posture is ${capabilityStatus}.`,
    ),
  );

  if (
    capabilityStatus === "BLOCKED"
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_CAPABILITY_STAGE_BLOCKED",
    );
  }

  /*
   * Stage 2:
   * Rank competing experimental hypotheses.
   */
  const experiment =
    createRuntimeExperimentPlan(
      input.experiment,
    );

  stages.push(
    stage(
      "EXPERIMENT_RANKING",

      experiment.decision === "REJECT"
        ? "FAIL"
        : experiment.decision === "SELECT"
          ? "PASS"
          : "REVIEW_REQUIRED",

      experiment.reasons.join(" "),
    ),
  );

  if (
    experiment.decision === "REJECT"
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_EXPERIMENT_STAGE_REJECTED",
    );
  }

  const selectedCandidateId =
    experiment.plan.selectedCandidateId;

  if (
    input.operatorAuthorized &&
    selectedCandidateId === undefined
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_NO_EXPERIMENT_SELECTED",
    );
  }

  if (
    selectedCandidateId !== undefined
  ) {
    const selectedCandidate =
      experiment.plan.candidates.find(
        (candidate) =>
          candidate.id ===
          selectedCandidateId,
      );

    if (
      selectedCandidate === undefined
    ) {
      throw new Error(
        "RUNTIME_SCIENTIFIC_METHOD_SELECTED_EXPERIMENT_NOT_FOUND",
      );
    }

    if (
      selectedCandidate.hypothesis.id !==
      input.integrationPlan.hypothesis.id
    ) {
      throw new Error(
        "RUNTIME_SCIENTIFIC_METHOD_SELECTED_HYPOTHESIS_MISMATCH",
      );
    }
  }

  /*
   * Stage 3:
   * Build the governed integration plan.
   */
  const integrationPlan =
    createIntegrationPlan(
      input.integrationPlan,
    );

  stages.push(
    stage(
      "INTEGRATION_PLANNING",

      integrationPlan.decision === "REJECT"
        ? "FAIL"
        : integrationPlan.decision ===
            "ACCEPT"
          ? "PASS"
          : "REVIEW_REQUIRED",

      integrationPlan.reasons.join(" "),
    ),
  );

  if (
    integrationPlan.decision === "REJECT"
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_PLAN_STAGE_REJECTED",
    );
  }

  /*
   * Stage 4:
   * Validate paths, constraints and authorization.
   */
  const integrationValidation =
    validateIntegrationPlan(
      integrationPlan.plan,
    );

  stages.push(
    stage(
      "INTEGRATION_VALIDATION",

      !integrationValidation.valid
        ? "FAIL"
        : integrationValidation.executable
          ? "PASS"
          : "REVIEW_REQUIRED",

      [
        ...integrationValidation.errors.map(
          (error) =>
            `${error.code}: ${error.message}`,
        ),

        ...integrationValidation.warnings.map(
          (warning) =>
            `${warning.code}: ${warning.message}`,
        ),
      ].join(" ") ||
        "Integration plan passed validation.",
    ),
  );

  if (!integrationValidation.valid) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_VALIDATION_STAGE_FAILED",
    );
  }

  /*
   * Stage 5:
   * Score measured completion, efficiency, regression safety,
   * reproducibility and governance.
   */
  const integrationScore =
    scoreIntegration(
      input.integrationScore,
    );

  const scoredIntegration =
    integrationScore.result;

  stages.push(
    stage(
      "INTEGRATION_SCORING",

      scoredIntegration.decision ===
      "REJECT"
        ? "FAIL"
        : scoredIntegration.decision ===
            "ACCEPT"
          ? "PASS"
          : "REVIEW_REQUIRED",

      scoredIntegration.reasons.join(" "),
    ),
  );

  if (
    scoredIntegration.decision ===
    "REJECT"
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_SCORING_STAGE_REJECTED",
    );
  }

  /*
   * Stage 6:
   * Construct the governed knowledge cycle.
   */
  const knowledgeCycle =
    createKnowledgeCycle(
      input.knowledgeCycle,
    );

  stages.push(
    stage(
      "KNOWLEDGE_CYCLE",

      knowledgeCycle.decision === "REJECT"
        ? "FAIL"
        : knowledgeCycle.decision ===
            "ACCEPT"
          ? "PASS"
          : "REVIEW_REQUIRED",

      knowledgeCycle.reasons.join(" "),
    ),
  );

  if (
    knowledgeCycle.decision === "REJECT"
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_METHOD_KNOWLEDGE_STAGE_REJECTED",
    );
  }

  /*
   * Stage 7:
   * Derive an operator-governed causal rule candidate.
   */
  const causalKnowledge =
    deriveCausalKnowledge({
      ruleId:
        input.causal.ruleId,

      cycle:
        knowledgeCycle.cycle,

      evaluation:
        input.causal.evaluation,

      integrationScore:
        scoredIntegration,

      causeStatement:
        input.causal.causeStatement,

      effectStatement:
        input.causal.effectStatement,

      reusableRule:
        input.causal.reusableRule,

      operatorAuthorized:
        input.operatorAuthorized,

      acceptedByOperator:
        input.causal
          .acceptedByOperator,
    });

  stages.push(
    stage(
      "CAUSAL_DERIVATION",

      causalKnowledge.decision === "REJECT"
        ? "FAIL"
        : causalKnowledge.decision ===
            "ACCEPT"
          ? "PASS"
          : "REVIEW_REQUIRED",

      causalKnowledge.reasons.join(" "),
    ),
  );

  const frozenStages =
    Object.freeze(stages);

  const status =
    determineFinalStatus(
      frozenStages,
    );

  const reasons =
    buildFinalReasons(
      status,
      frozenStages,
    );

  return Object.freeze({
    revision:
      RUNTIME_SCIENTIFIC_METHOD_REVISION,

    executionId,
    generatedAt,

    status,

    capability,
    experiment,
    integrationPlan,
    integrationValidation,
    integrationScore,
    knowledgeCycle,
    causalKnowledge,
    scoredIntegration,

    stages:
      frozenStages,

    reasons,

    governance:
      Object.freeze({
        readOnly:
          true,

        deterministic:
          true,

        humanAuthorizationRequired:
          true,

        automaticExecution:
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
