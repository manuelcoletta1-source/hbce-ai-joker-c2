/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Research & Development Cycle
 *
 * High-level governed orchestration:
 *
 * RuntimeSelfState
 * → Current Scientific Cycle
 * → Optional Knowledge Evolution
 * → Improvement Plan
 * → Unified R&D Result
 *
 * This module analyses, compares and plans.
 * It does not execute experiments, modify files, create commits,
 * persist results, recall historical cycles automatically or
 * issue legal certification.
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
  RuntimeSelfState,
} from "../self/runtime-self.service";

import {
  createRuntimeScientificCycle,
  type RuntimeScientificCycleResult,
} from "../scientific/runtime-scientific-cycle";

import type {
  RuntimeScientificDecisionThresholds,
} from "../scientific/runtime-scientific-decision-engine";

import {
  compareRuntimeScientificCycles,
  type RuntimeKnowledgeEvolutionResult,
} from "../knowledge/runtime-knowledge-evolution";

import {
  createRuntimeImprovementPlan,
  type RuntimeImprovementPlanResult,
} from "../improvement/runtime-improvement-planner";

export const RUNTIME_RESEARCH_DEVELOPMENT_CYCLE_REVISION =
  "AIJC2-RUNTIME-RESEARCH-DEVELOPMENT-CYCLE-v1_0" as const;

export type RuntimeResearchDevelopmentStatus =
  | "PLAN_READY"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export type RuntimeResearchDevelopmentStage =
  | "SCIENTIFIC_CYCLE"
  | "KNOWLEDGE_EVOLUTION"
  | "IMPROVEMENT_PLANNING";

export interface RuntimeResearchDevelopmentStageResult {
  readonly stage:
    RuntimeResearchDevelopmentStage;

  readonly status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "BLOCKED"
    | "FAIL"
    | "SKIPPED";

  readonly description: string;
}

export interface RuntimeResearchDevelopmentCycleInput {
  readonly executionId: string;
  readonly generatedAt: string;

  readonly runtimeSelfState:
    RuntimeSelfState;

  /**
   * Optional earlier scientific cycle supplied explicitly by the operator.
   * No historical cycle is recalled automatically.
   */
  readonly previousScientificCycle?:
    RuntimeScientificCycleResult;

  readonly hypothesesPerFinding?: number;

  readonly decisionThresholds?:
    Partial<RuntimeScientificDecisionThresholds>;

  /**
   * Authorizes governed evaluation and roadmap production.
   * It never authorizes automatic repository mutation.
   */
  readonly operatorAuthorized: boolean;

  /**
   * Explicit acceptance of the selected scientific proposal.
   */
  readonly acceptedByOperator: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeResearchDevelopmentSummary {
  readonly scientificCycleId: string;

  readonly previousScientificCycleId?: string;

  readonly knowledgeEvolutionId?: string;

  readonly improvementPlanId: string;

  readonly capabilityScore: number;
  readonly registeredCapabilities: number;
  readonly capabilityGaps: number;

  readonly findings: number;
  readonly scientificHypotheses: number;
  readonly experimentCandidates: number;

  readonly selectedCandidateId?: string;
  readonly selectedHypothesisId?: string;
  readonly selectedExperimentScore?: number;

  readonly scientificDecision:
    RuntimeScientificCycleResult["summary"]["finalDecision"];

  readonly evolutionTrend?:
    RuntimeKnowledgeEvolutionResult["trend"];

  readonly evolutionScore?: number;

  readonly improvementPlanStatus:
    RuntimeImprovementPlanResult["status"];

  readonly improvementPlanDecision:
    RuntimeImprovementPlanResult["decision"];

  readonly roadmapSteps: number;

  readonly estimatedChangedFiles: number;
  readonly estimatedChangedLines: number;
  readonly estimatedBuildExecutions: number;
  readonly estimatedOperatorMinutes: number;
}

export interface RuntimeResearchDevelopmentCycleResult {
  readonly revision:
    typeof RUNTIME_RESEARCH_DEVELOPMENT_CYCLE_REVISION;

  readonly executionId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeResearchDevelopmentStatus;

  readonly scientificCycle:
    RuntimeScientificCycleResult;

  readonly knowledgeEvolution?:
    RuntimeKnowledgeEvolutionResult;

  readonly improvementPlan:
    RuntimeImprovementPlanResult;

  readonly stages:
    readonly RuntimeResearchDevelopmentStageResult[];

  readonly summary:
    RuntimeResearchDevelopmentSummary;

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

function validateRuntimeSelfState(
  state: RuntimeSelfState,
): void {
  if (
    state.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_RUNTIME_SELF_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticPersistence !==
    false
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticRecall !==
    false
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
    );
  }
}

function validatePreviousScientificCycle(
  previous:
    RuntimeScientificCycleResult | undefined,
): void {
  if (previous === undefined) {
    return;
  }

  if (
    previous.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_PREVIOUS_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    previous.governance.readOnly !==
      true ||
    previous.governance.deterministic !==
      true ||
    previous.governance.failClosed !==
      true ||
    previous.governance.automaticExecution !==
      false ||
    previous.governance.automaticPersistence !==
      false ||
    previous.governance.automaticRecall !==
      false ||
    previous.governance
      .automaticRepositoryMutation !==
      false
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_PREVIOUS_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function stage(
  stageName:
    RuntimeResearchDevelopmentStage,

  status:
    RuntimeResearchDevelopmentStageResult["status"],

  description: string,
): Readonly<RuntimeResearchDevelopmentStageResult> {
  return Object.freeze({
    stage:
      stageName,

    status,

    description,
  });
}

function mapScientificCycleStage(
  cycle:
    RuntimeScientificCycleResult,
): Readonly<RuntimeResearchDevelopmentStageResult> {
  switch (cycle.status) {
    case "COMPLETED":
      return stage(
        "SCIENTIFIC_CYCLE",
        "PASS",
        [
          `Scientific cycle ${cycle.cycleId} completed.`,
          `Decision: ${cycle.summary.finalDecision}.`,
          `Experiment candidates: ${cycle.summary.experimentCandidates}.`,
        ].join(" "),
      );

    case "REVIEW_REQUIRED":
      return stage(
        "SCIENTIFIC_CYCLE",
        "REVIEW_REQUIRED",
        cycle.reasons.join(" "),
      );

    case "BLOCKED":
      return stage(
        "SCIENTIFIC_CYCLE",
        "BLOCKED",
        cycle.reasons.join(" "),
      );

    case "REJECTED":
      return stage(
        "SCIENTIFIC_CYCLE",
        "FAIL",
        cycle.reasons.join(" "),
      );
  }
}

function mapKnowledgeEvolutionStage(
  evolution:
    RuntimeKnowledgeEvolutionResult | undefined,
): Readonly<RuntimeResearchDevelopmentStageResult> {
  if (evolution === undefined) {
    return stage(
      "KNOWLEDGE_EVOLUTION",
      "SKIPPED",
      "No previous scientific cycle was supplied. Knowledge evolution was not calculated.",
    );
  }

  switch (evolution.status) {
    case "EVOLUTION_CONFIRMED":
    case "STABLE":
      return stage(
        "KNOWLEDGE_EVOLUTION",
        "PASS",
        [
          `Trend: ${evolution.trend}.`,
          `Evolution score: ${evolution.summary.evolutionScore}/100.`,
          `Resolved findings: ${evolution.summary.resolvedFindings}.`,
          `New findings: ${evolution.summary.newFindings}.`,
        ].join(" "),
      );

    case "REVIEW_REQUIRED":
      return stage(
        "KNOWLEDGE_EVOLUTION",
        "REVIEW_REQUIRED",
        evolution.reasons.join(" "),
      );

    case "REGRESSION_DETECTED":
      return stage(
        "KNOWLEDGE_EVOLUTION",
        "REVIEW_REQUIRED",
        evolution.reasons.join(" "),
      );

    case "BLOCKED":
      return stage(
        "KNOWLEDGE_EVOLUTION",
        "BLOCKED",
        evolution.reasons.join(" "),
      );
  }
}

function mapImprovementPlanStage(
  plan:
    RuntimeImprovementPlanResult,
): Readonly<RuntimeResearchDevelopmentStageResult> {
  switch (plan.status) {
    case "PLAN_READY":
      return stage(
        "IMPROVEMENT_PLANNING",
        "PASS",
        [
          `Improvement plan ${plan.planId} is ready.`,
          `Roadmap steps: ${plan.summary.totalSteps}.`,
          `Estimated operator time: ${plan.summary.totalEstimatedOperatorMinutes} minutes.`,
        ].join(" "),
      );

    case "REVIEW_REQUIRED":
      return stage(
        "IMPROVEMENT_PLANNING",
        "REVIEW_REQUIRED",
        plan.reasons.join(" "),
      );

    case "BLOCKED":
      return stage(
        "IMPROVEMENT_PLANNING",
        "BLOCKED",
        plan.reasons.join(" "),
      );

    case "REJECTED":
      return stage(
        "IMPROVEMENT_PLANNING",
        "FAIL",
        plan.reasons.join(" "),
      );
  }
}

function determineStatus(
  stages:
    readonly RuntimeResearchDevelopmentStageResult[],
): RuntimeResearchDevelopmentStatus {
  if (
    stages.some(
      (item) =>
        item.status === "FAIL",
    )
  ) {
    return "REJECTED";
  }

  if (
    stages.some(
      (item) =>
        item.status === "BLOCKED",
    )
  ) {
    return "BLOCKED";
  }

  if (
    stages.some(
      (item) =>
        item.status ===
        "REVIEW_REQUIRED",
    )
  ) {
    return "REVIEW_REQUIRED";
  }

  return "PLAN_READY";
}

function buildSummary(
  scientificCycle:
    RuntimeScientificCycleResult,

  knowledgeEvolution:
    RuntimeKnowledgeEvolutionResult | undefined,

  improvementPlan:
    RuntimeImprovementPlanResult,
): Readonly<RuntimeResearchDevelopmentSummary> {
  return Object.freeze({
    scientificCycleId:
      scientificCycle.cycleId,

    previousScientificCycleId:
      knowledgeEvolution
        ?.previousCycleId,

    knowledgeEvolutionId:
      knowledgeEvolution
        ?.evolutionId,

    improvementPlanId:
      improvementPlan.planId,

    capabilityScore:
      scientificCycle.summary
        .capabilityScore,

    registeredCapabilities:
      scientificCycle.summary
        .registeredCapabilities,

    capabilityGaps:
      scientificCycle.summary
        .capabilityGaps,

    findings:
      scientificCycle.summary
        .findings,

    scientificHypotheses:
      scientificCycle.summary
        .scientificHypotheses,

    experimentCandidates:
      scientificCycle.summary
        .experimentCandidates,

    selectedCandidateId:
      scientificCycle.summary
        .selectedCandidateId,

    selectedHypothesisId:
      scientificCycle.summary
        .selectedHypothesisId,

    selectedExperimentScore:
      scientificCycle.summary
        .selectedExperimentScore,

    scientificDecision:
      scientificCycle.summary
        .finalDecision,

    evolutionTrend:
      knowledgeEvolution
        ?.trend,

    evolutionScore:
      knowledgeEvolution
        ?.summary.evolutionScore,

    improvementPlanStatus:
      improvementPlan.status,

    improvementPlanDecision:
      improvementPlan.decision,

    roadmapSteps:
      improvementPlan.summary
        .totalSteps,

    estimatedChangedFiles:
      improvementPlan.summary
        .totalEstimatedChangedFiles,

    estimatedChangedLines:
      improvementPlan.summary
        .totalEstimatedChangedLines,

    estimatedBuildExecutions:
      improvementPlan.summary
        .totalEstimatedBuildExecutions,

    estimatedOperatorMinutes:
      improvementPlan.summary
        .totalEstimatedOperatorMinutes,
  });
}

function buildReasons(
  status:
    RuntimeResearchDevelopmentStatus,

  stages:
    readonly RuntimeResearchDevelopmentStageResult[],

  knowledgeEvolution:
    RuntimeKnowledgeEvolutionResult | undefined,
): readonly string[] {
  const reasons =
    stages.map(
      (item) =>
        `${item.stage}: ${item.description}`,
    );

  switch (status) {
    case "PLAN_READY":
      reasons.push(
        "The governed R&D cycle produced a complete non-executable improvement roadmap.",
      );
      break;

    case "REVIEW_REQUIRED":
      reasons.push(
        "At least one R&D stage requires explicit human review or proposal acceptance.",
      );
      break;

    case "BLOCKED":
      reasons.push(
        "The R&D cycle stopped because mandatory evidence, experiments or proposals were unavailable.",
      );
      break;

    case "REJECTED":
      reasons.push(
        "The R&D cycle failed at least one mandatory governance or scientific gate.",
      );
      break;
  }

  if (
    knowledgeEvolution === undefined
  ) {
    reasons.push(
      "Knowledge evolution was skipped because no previous scientific cycle was explicitly supplied.",
    );
  }

  reasons.push(
    "No experiment, file modification, commit, persistence or automatic recall was performed.",
  );

  return Object.freeze(
    reasons,
  );
}

function createGovernance() {
  return Object.freeze({
    readOnly:
      true as const,

    deterministic:
      true as const,

    failClosed:
      true as const,

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

export function createRuntimeResearchDevelopmentCycle(
  input:
    RuntimeResearchDevelopmentCycleInput,
): Readonly<RuntimeResearchDevelopmentCycleResult> {
  const executionId =
    requireNonEmptyString(
      input.executionId,
      "RUNTIME_RD_CYCLE_EXECUTION_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_RD_CYCLE_TIMESTAMP_REQUIRED",
    );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    input.acceptedByOperator === true &&
    input.operatorAuthorized !== true
  ) {
    throw new Error(
      "RUNTIME_RD_CYCLE_ACCEPTANCE_WITHOUT_AUTHORIZATION",
    );
  }

  validateRuntimeSelfState(
    input.runtimeSelfState,
  );

  validatePreviousScientificCycle(
    input.previousScientificCycle,
  );

  const operatorAuthorized =
    input.operatorAuthorized ===
    true;

  const acceptedByOperator =
    operatorAuthorized &&
    input.acceptedByOperator ===
      true;

  /*
   * Stage 1:
   * Current RuntimeSelfState → governed scientific cycle.
   */
  const scientificCycle =
    createRuntimeScientificCycle({
      cycleId:
        `${executionId}-SCIENTIFIC-CYCLE`,

      generatedAt,

      runtimeSelfState:
        input.runtimeSelfState,

      hypothesesPerFinding:
        input.hypothesesPerFinding,

      decisionThresholds:
        input.decisionThresholds,

      operatorAuthorized,

      acceptedByOperator,

      humanAuthorizationRequired:
        true,
    });

  const scientificCycleStage =
    mapScientificCycleStage(
      scientificCycle,
    );

  /*
   * Stage 2:
   * Previous and current cycles → optional knowledge evolution.
   */
  const knowledgeEvolution =
    input.previousScientificCycle ===
    undefined
      ? undefined
      : compareRuntimeScientificCycles({
          evolutionId:
            `${executionId}-KNOWLEDGE-EVOLUTION`,

          generatedAt,

          previousCycle:
            input.previousScientificCycle,

          currentCycle:
            scientificCycle,

          operatorAuthorized,

          humanAuthorizationRequired:
            true,
        });

  const knowledgeEvolutionStage =
    mapKnowledgeEvolutionStage(
      knowledgeEvolution,
    );

  /*
   * Stage 3:
   * Scientific result + optional evolution → governed roadmap.
   */
  const improvementPlan =
    createRuntimeImprovementPlan({
      planId:
        `${executionId}-IMPROVEMENT-PLAN`,

      generatedAt,

      scientificCycle,

      knowledgeEvolution,

      operatorAuthorized,

      acceptedByOperator,

      humanAuthorizationRequired:
        true,
    });

  const improvementPlanStage =
    mapImprovementPlanStage(
      improvementPlan,
    );

  const stages =
    Object.freeze([
      scientificCycleStage,
      knowledgeEvolutionStage,
      improvementPlanStage,
    ]);

  const status =
    determineStatus(
      stages,
    );

  const summary =
    buildSummary(
      scientificCycle,
      knowledgeEvolution,
      improvementPlan,
    );

  const reasons =
    buildReasons(
      status,
      stages,
      knowledgeEvolution,
    );

  return Object.freeze({
    revision:
      RUNTIME_RESEARCH_DEVELOPMENT_CYCLE_REVISION,

    executionId,
    generatedAt,

    status,

    scientificCycle,
    knowledgeEvolution,
    improvementPlan,

    stages,
    summary,
    reasons,

    operatorAuthorized,
    acceptedByOperator,

    governance:
      createGovernance(),

    legalCertification:
      false,
  });
}
