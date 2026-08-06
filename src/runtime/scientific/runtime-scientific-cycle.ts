/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Cycle
 *
 * Composes:
 *
 * RuntimeSelfState
 * → Runtime Capability Assessment
 * → Scientific Experiment Engine
 * → Scientific Decision Engine
 * → Governed Scientific Cycle Result
 *
 * This cycle analyses and proposes.
 * It does not execute code, modify GitHub, persist results,
 * perform automatic recall or authorize itself.
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
  assessRuntimeCapabilities,
  type RuntimeCapabilityAssessmentResult,
} from "../self/runtime-capability-assessment";

import {
  createRuntimeScientificExperiments,
  type RuntimeScientificExperimentEngineResult,
} from "./runtime-scientific-experiment-engine";

import {
  createRuntimeScientificDecision,
  type RuntimeScientificDecisionEngineResult,
  type RuntimeScientificDecisionThresholds,
} from "./runtime-scientific-decision-engine";

export const RUNTIME_SCIENTIFIC_CYCLE_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-CYCLE-v1_0" as const;

export type RuntimeScientificCycleStatus =
  | "COMPLETED"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export type RuntimeScientificCycleStage =
  | "CAPABILITY_ASSESSMENT"
  | "SCIENTIFIC_EXPERIMENTS"
  | "SCIENTIFIC_DECISION";

export interface RuntimeScientificCycleStageResult {
  readonly stage:
    RuntimeScientificCycleStage;

  readonly status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "FAIL"
    | "BLOCKED";

  readonly description: string;
}

export interface RuntimeScientificCycleInput {
  readonly cycleId: string;
  readonly generatedAt: string;

  readonly runtimeSelfState:
    RuntimeSelfState;

  /**
   * Number of competing hypotheses generated for every finding.
   * Allowed range: 2..5.
   */
  readonly hypothesesPerFinding?: number;

  readonly decisionThresholds?:
    Partial<RuntimeScientificDecisionThresholds>;

  /**
   * Allows governed evaluation and recommendation.
   * It does not authorize repository mutation.
   */
  readonly operatorAuthorized: boolean;

  /**
   * Explicit operator acceptance of the highest eligible proposal.
   * It remains separate from evaluation authorization.
   */
  readonly acceptedByOperator: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeScientificCycleSummary {
  readonly capabilityScore: number;
  readonly registeredCapabilities: number;
  readonly capabilityGaps: number;

  readonly findings: number;
  readonly interventionCandidates: number;

  readonly scientificQuestions: number;
  readonly scientificHypotheses: number;
  readonly experimentCandidates: number;

  readonly selectedCandidateId?: string;
  readonly selectedHypothesisId?: string;
  readonly selectedExperimentScore?: number;

  readonly finalDecision:
    RuntimeScientificDecisionEngineResult["decision"];
}

export interface RuntimeScientificCycleResult {
  readonly revision:
    typeof RUNTIME_SCIENTIFIC_CYCLE_REVISION;

  readonly cycleId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeScientificCycleStatus;

  readonly capabilityAssessment:
    RuntimeCapabilityAssessmentResult;

  readonly scientificExperiments:
    RuntimeScientificExperimentEngineResult;

  readonly scientificDecision:
    RuntimeScientificDecisionEngineResult;

  readonly stages:
    readonly RuntimeScientificCycleStageResult[];

  readonly summary:
    RuntimeScientificCycleSummary;

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

function stage(
  stageName:
    RuntimeScientificCycleStage,

  status:
    RuntimeScientificCycleStageResult["status"],

  description: string,
): Readonly<RuntimeScientificCycleStageResult> {
  return Object.freeze({
    stage:
      stageName,

    status,

    description,
  });
}

function validateGovernanceBoundary(
  input:
    RuntimeScientificCycleInput,
): void {
  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    input.runtimeSelfState
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.runtimeSelfState
      .humanAuthorizationRequired !== true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_RUNTIME_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.runtimeSelfState
      .automaticPersistence !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.runtimeSelfState
      .automaticRecall !== false
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_RECALL_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.acceptedByOperator === true &&
    input.operatorAuthorized !== true
  ) {
    throw new Error(
      "RUNTIME_SCIENTIFIC_CYCLE_ACCEPTANCE_WITHOUT_AUTHORIZATION",
    );
  }
}

function mapCapabilityStage(
  result:
    RuntimeCapabilityAssessmentResult,
): Readonly<RuntimeScientificCycleStageResult> {
  if (
    result.summary.criticalFindings >
    0
  ) {
    return stage(
      "CAPABILITY_ASSESSMENT",
      "REVIEW_REQUIRED",
      [
        `Capability score: ${result.summary.capabilityScore}/100.`,
        `Critical findings: ${result.summary.criticalFindings}.`,
        `Total findings: ${result.summary.totalFindings}.`,
      ].join(" "),
    );
  }

  if (
    result.summary.totalFindings ===
    0
  ) {
    return stage(
      "CAPABILITY_ASSESSMENT",
      "PASS",
      "No governed capability findings were detected.",
    );
  }

  return stage(
    "CAPABILITY_ASSESSMENT",
    "PASS",
    [
      `Capability score: ${result.summary.capabilityScore}/100.`,
      `Findings: ${result.summary.totalFindings}.`,
      `Interventions: ${result.summary.interventionCandidates}.`,
    ].join(" "),
  );
}

function mapExperimentStage(
  result:
    RuntimeScientificExperimentEngineResult,
): Readonly<RuntimeScientificCycleStageResult> {
  switch (result.status) {
    case "RECOMMENDATION_AVAILABLE":
      return stage(
        "SCIENTIFIC_EXPERIMENTS",
        "PASS",
        [
          `Generated ${result.summary.totalCandidates} experiment candidates.`,
          `Selected candidate: ${result.summary.selectedCandidateId ?? "none"}.`,
          `Highest score: ${result.summary.highestScore ?? 0}/100.`,
        ].join(" "),
      );

    case "READY_FOR_REVIEW":
      return stage(
        "SCIENTIFIC_EXPERIMENTS",
        "REVIEW_REQUIRED",
        [
          `Generated ${result.summary.totalCandidates} experiment candidates.`,
          "No candidate satisfied every recommendation gate.",
        ].join(" "),
      );

    case "BLOCKED":
      return stage(
        "SCIENTIFIC_EXPERIMENTS",
        "BLOCKED",
        result.reasons.join(" "),
      );

    default:
      return stage(
        "SCIENTIFIC_EXPERIMENTS",
        "FAIL",
        "Unknown scientific experiment status.",
      );
  }
}

function mapDecisionStage(
  result:
    RuntimeScientificDecisionEngineResult,
): Readonly<RuntimeScientificCycleStageResult> {
  switch (result.status) {
    case "DECISION_AVAILABLE":
      return stage(
        "SCIENTIFIC_DECISION",
        "PASS",
        [
          `Decision: ${result.decision}.`,
          `Candidate: ${result.proposal?.candidateId ?? "none"}.`,
          "Operator acceptance is present.",
        ].join(" "),
      );

    case "REVIEW_REQUIRED":
      return stage(
        "SCIENTIFIC_DECISION",
        "REVIEW_REQUIRED",
        result.reasons.join(" "),
      );

    case "BLOCKED":
      return stage(
        "SCIENTIFIC_DECISION",
        "BLOCKED",
        result.reasons.join(" "),
      );

    case "REJECTED":
      return stage(
        "SCIENTIFIC_DECISION",
        "FAIL",
        result.reasons.join(" "),
      );

    default:
      return stage(
        "SCIENTIFIC_DECISION",
        "FAIL",
        "Unknown scientific decision status.",
      );
  }
}

function determineCycleStatus(
  stages:
    readonly RuntimeScientificCycleStageResult[],
): RuntimeScientificCycleStatus {
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

  return "COMPLETED";
}

function buildReasons(
  status:
    RuntimeScientificCycleStatus,

  stages:
    readonly RuntimeScientificCycleStageResult[],
): readonly string[] {
  const reasons =
    stages.map(
      (item) =>
        `${item.stage}: ${item.description}`,
    );

  switch (status) {
    case "COMPLETED":
      reasons.push(
        "The governed scientific cycle completed every analytical and decision gate.",
      );
      break;

    case "REVIEW_REQUIRED":
      reasons.push(
        "At least one scientific-cycle stage requires explicit operator review or acceptance.",
      );
      break;

    case "BLOCKED":
      reasons.push(
        "The scientific cycle stopped because required evidence or candidates were unavailable.",
      );
      break;

    case "REJECTED":
      reasons.push(
        "The scientific cycle failed at least one mandatory gate.",
      );
      break;
  }

  reasons.push(
    "No code was executed and no repository mutation was performed.",
  );

  return Object.freeze(reasons);
}

function buildSummary(
  capabilityAssessment:
    RuntimeCapabilityAssessmentResult,

  scientificExperiments:
    RuntimeScientificExperimentEngineResult,

  scientificDecision:
    RuntimeScientificDecisionEngineResult,
): Readonly<RuntimeScientificCycleSummary> {
  return Object.freeze({
    capabilityScore:
      capabilityAssessment
        .summary.capabilityScore,

    registeredCapabilities:
      capabilityAssessment
        .summary.registeredCapabilities,

    capabilityGaps:
      capabilityAssessment
        .summary.capabilityGaps,

    findings:
      capabilityAssessment
        .summary.totalFindings,

    interventionCandidates:
      capabilityAssessment
        .summary.interventionCandidates,

    scientificQuestions:
      scientificExperiments
        .summary.totalQuestions,

    scientificHypotheses:
      scientificExperiments
        .summary.totalHypotheses,

    experimentCandidates:
      scientificExperiments
        .summary.totalCandidates,

    selectedCandidateId:
      scientificExperiments
        .summary.selectedCandidateId,

    selectedHypothesisId:
      scientificExperiments
        .summary.selectedHypothesisId,

    selectedExperimentScore:
      scientificExperiments
        .summary.highestScore,

    finalDecision:
      scientificDecision
        .decision,
  });
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

export function createRuntimeScientificCycle(
  input:
    RuntimeScientificCycleInput,
): Readonly<RuntimeScientificCycleResult> {
  const cycleId =
    requireNonEmptyString(
      input.cycleId,
      "RUNTIME_SCIENTIFIC_CYCLE_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_SCIENTIFIC_CYCLE_TIMESTAMP_REQUIRED",
    );

  validateGovernanceBoundary(
    input,
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
   * RuntimeSelfState → capability findings and interventions.
   */
  const capabilityAssessment =
    assessRuntimeCapabilities({
      assessmentId:
        `${cycleId}-CAPABILITY-ASSESSMENT`,

      generatedAt,

      runtimeSelfState:
        input.runtimeSelfState,

      operatorAuthorized,
    });

  const capabilityStage =
    mapCapabilityStage(
      capabilityAssessment,
    );

  /*
   * Stage 2:
   * Findings and interventions → competing scientific experiments.
   */
  const scientificExperiments =
    createRuntimeScientificExperiments({
      executionId:
        `${cycleId}-SCIENTIFIC-EXPERIMENTS`,

      generatedAt,

      capabilityAssessment,

      hypothesesPerFinding:
        input.hypothesesPerFinding,

      operatorAuthorized,
    });

  const experimentStage =
    mapExperimentStage(
      scientificExperiments,
    );

  /*
   * Stage 3:
   * Ranked experiments → one operator-facing governed decision.
   */
  const scientificDecision =
    createRuntimeScientificDecision({
      decisionId:
        `${cycleId}-SCIENTIFIC-DECISION`,

      generatedAt,

      experimentResult:
        scientificExperiments,

      thresholds:
        input.decisionThresholds,

      operatorAuthorized,

      acceptedByOperator,
    });

  const decisionStage =
    mapDecisionStage(
      scientificDecision,
    );

  const stages =
    Object.freeze([
      capabilityStage,
      experimentStage,
      decisionStage,
    ]);

  const status =
    determineCycleStatus(
      stages,
    );

  const summary =
    buildSummary(
      capabilityAssessment,
      scientificExperiments,
      scientificDecision,
    );

  const reasons =
    buildReasons(
      status,
      stages,
    );

  return Object.freeze({
    revision:
      RUNTIME_SCIENTIFIC_CYCLE_REVISION,

    cycleId,
    generatedAt,

    status,

    capabilityAssessment,
    scientificExperiments,
    scientificDecision,

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
