/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Improvement Planner
 *
 * Converts a governed scientific cycle and an optional knowledge-evolution
 * report into an ordered, non-executable technical improvement roadmap.
 *
 * Scientific Cycle
 * + Knowledge Evolution
 * → Improvement Objective
 * → Ordered Steps
 * → Dependencies
 * → Acceptance Criteria
 * → Risk and Governance Gates
 * → Operator-Governed Roadmap
 *
 * This module does not:
 * - execute proposed work;
 * - create or edit repository files;
 * - write commits;
 * - persist plans;
 * - retrieve historical cycles;
 * - perform automatic recall;
 * - accept its own roadmap;
 * - issue legal certification.
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

import type {
  RuntimeScientificCycleResult,
} from "../scientific/runtime-scientific-cycle";

import type {
  RuntimeKnowledgeEvolutionResult,
} from "../knowledge/runtime-knowledge-evolution";

export const RUNTIME_IMPROVEMENT_PLANNER_REVISION =
  "AIJC2-RUNTIME-IMPROVEMENT-PLANNER-v1_0" as const;

export type RuntimeImprovementPlanStatus =
  | "PLAN_READY"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export type RuntimeImprovementPlanDecision =
  | "PROPOSE"
  | "REVIEW_REQUIRED"
  | "NO_ACTION"
  | "REJECT";

export type RuntimeImprovementStepType =
  | "EVIDENCE"
  | "TEST"
  | "IMPLEMENTATION"
  | "VALIDATION"
  | "MEASUREMENT"
  | "OPERATOR_REVIEW";

export type RuntimeImprovementStepStatus =
  | "PLANNED"
  | "BLOCKED"
  | "REVIEW_REQUIRED";

export type RuntimeImprovementRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface RuntimeImprovementPlanInput {
  readonly planId: string;
  readonly generatedAt: string;

  readonly scientificCycle:
    RuntimeScientificCycleResult;

  readonly knowledgeEvolution?:
    RuntimeKnowledgeEvolutionResult;

  /**
   * Allows the planner to produce an operator-facing roadmap.
   * It never authorizes automatic implementation.
   */
  readonly operatorAuthorized: boolean;

  /**
   * Explicit operator acceptance of the scientific proposal.
   * Required before implementation-oriented steps can be proposed as ready.
   */
  readonly acceptedByOperator: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeImprovementObjective {
  readonly id: string;

  readonly title: string;
  readonly description: string;

  readonly candidateId?: string;
  readonly hypothesisId?: string;

  readonly expectedEffect?: string;

  readonly sourceCycleId: string;
  readonly sourceEvolutionId?: string;
}

export interface RuntimeImprovementStep {
  readonly id: string;

  readonly sequence: number;

  readonly type:
    RuntimeImprovementStepType;

  readonly status:
    RuntimeImprovementStepStatus;

  readonly title: string;
  readonly description: string;

  readonly dependsOn:
    readonly string[];

  readonly acceptanceCriteria:
    readonly string[];

  readonly rejectionCriteria:
    readonly string[];

  readonly expectedEvidence:
    readonly string[];

  readonly estimatedChangedFiles: number;
  readonly estimatedChangedLines: number;
  readonly estimatedBuildExecutions: number;
  readonly estimatedOperatorMinutes: number;

  readonly risk:
    RuntimeImprovementRiskLevel;

  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticRepositoryMutation: false;
}

export interface RuntimeImprovementPlanGate {
  readonly id: string;
  readonly label: string;

  readonly required: true;
  readonly passed: boolean;

  readonly description: string;
}

export interface RuntimeImprovementPlanSummary {
  readonly totalSteps: number;

  readonly plannedSteps: number;
  readonly reviewRequiredSteps: number;
  readonly blockedSteps: number;

  readonly evidenceSteps: number;
  readonly testSteps: number;
  readonly implementationSteps: number;
  readonly validationSteps: number;
  readonly measurementSteps: number;
  readonly operatorReviewSteps: number;

  readonly totalEstimatedChangedFiles: number;
  readonly totalEstimatedChangedLines: number;
  readonly totalEstimatedBuildExecutions: number;
  readonly totalEstimatedOperatorMinutes: number;

  readonly highestRisk:
    RuntimeImprovementRiskLevel;

  readonly capabilityScore: number;
  readonly capabilityGaps: number;

  readonly evolutionTrend?: string;
  readonly evolutionScore?: number;
}

export interface RuntimeImprovementPlanResult {
  readonly revision:
    typeof RUNTIME_IMPROVEMENT_PLANNER_REVISION;

  readonly planId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeImprovementPlanStatus;

  readonly decision:
    RuntimeImprovementPlanDecision;

  readonly objective?:
    RuntimeImprovementObjective;

  readonly steps:
    readonly RuntimeImprovementStep[];

  readonly gates:
    readonly RuntimeImprovementPlanGate[];

  readonly summary:
    RuntimeImprovementPlanSummary;

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
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

interface StepCost {
  readonly changedFiles: number;
  readonly changedLines: number;
  readonly buildExecutions: number;
  readonly operatorMinutes: number;
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

function validateScientificCycle(
  cycle: RuntimeScientificCycleResult,
): void {
  if (
    cycle.legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_SCIENTIFIC_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    cycle.governance.readOnly !== true ||
    cycle.governance.deterministic !== true ||
    cycle.governance.failClosed !== true ||
    cycle.governance.automaticExecution !== false ||
    cycle.governance.automaticPersistence !== false ||
    cycle.governance.automaticRecall !== false ||
    cycle.governance.automaticRepositoryMutation !== false
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_SCIENTIFIC_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }

  requireNonEmptyString(
    cycle.cycleId,
    "RUNTIME_IMPROVEMENT_PLANNER_SCIENTIFIC_CYCLE_ID_REQUIRED",
  );
}

function validateKnowledgeEvolution(
  evolution:
    RuntimeKnowledgeEvolutionResult | undefined,
): void {
  if (evolution === undefined) {
    return;
  }

  if (
    evolution.legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_EVOLUTION_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    evolution.governance.readOnly !== true ||
    evolution.governance.deterministic !== true ||
    evolution.governance.failClosed !== true ||
    evolution.governance.automaticExecution !== false ||
    evolution.governance.automaticPersistence !== false ||
    evolution.governance.automaticRecall !== false ||
    evolution.governance.automaticRepositoryMutation !== false
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_EVOLUTION_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function riskWeight(
  risk:
    RuntimeImprovementRiskLevel,
): number {
  switch (risk) {
    case "LOW":
      return 1;

    case "MEDIUM":
      return 2;

    case "HIGH":
      return 3;

    case "CRITICAL":
      return 4;
  }
}

function maximumRisk(
  steps:
    readonly RuntimeImprovementStep[],
): RuntimeImprovementRiskLevel {
  if (steps.length === 0) {
    return "LOW";
  }

  return steps.reduce(
    (
      current,
      step,
    ) =>
      riskWeight(step.risk) >
      riskWeight(current)
        ? step.risk
        : current,
    "LOW" as RuntimeImprovementRiskLevel,
  );
}

function mapExperimentRisk(
  penalty: number | undefined,
): RuntimeImprovementRiskLevel {
  if (penalty === undefined) {
    return "MEDIUM";
  }

  if (penalty <= 0) {
    return "LOW";
  }

  if (penalty <= 10) {
    return "MEDIUM";
  }

  if (penalty <= 25) {
    return "HIGH";
  }

  return "CRITICAL";
}

function stepCost(
  type:
    RuntimeImprovementStepType,

  scientificCycle:
    RuntimeScientificCycleResult,
): Readonly<StepCost> {
  const proposedCost =
    scientificCycle
      .scientificDecision
      .proposal
      ?.expectedCost;

  switch (type) {
    case "EVIDENCE":
      return Object.freeze({
        changedFiles: 0,
        changedLines: 0,
        buildExecutions: 0,
        operatorMinutes: 20,
      });

    case "TEST":
      return Object.freeze({
        changedFiles:
          Math.max(
            proposedCost?.addedTests ??
              1,
            1,
          ),

        changedLines:
          Math.max(
            Math.round(
              (
                proposedCost
                  ?.changedLines ??
                120
              ) *
                0.35,
            ),
            40,
          ),

        buildExecutions: 1,
        operatorMinutes: 30,
      });

    case "IMPLEMENTATION":
      return Object.freeze({
        changedFiles:
          proposedCost
            ?.changedFiles ??
          1,

        changedLines:
          proposedCost
            ?.changedLines ??
          120,

        buildExecutions:
          proposedCost
            ?.buildExecutions ??
          1,

        operatorMinutes:
          proposedCost
            ?.operatorMinutes ??
          45,
      });

    case "VALIDATION":
      return Object.freeze({
        changedFiles: 0,
        changedLines: 0,
        buildExecutions:
          Math.max(
            proposedCost
              ?.buildExecutions ??
              1,
            1,
          ),

        operatorMinutes: 25,
      });

    case "MEASUREMENT":
      return Object.freeze({
        changedFiles: 0,
        changedLines: 0,
        buildExecutions: 0,
        operatorMinutes: 20,
      });

    case "OPERATOR_REVIEW":
      return Object.freeze({
        changedFiles: 0,
        changedLines: 0,
        buildExecutions: 0,
        operatorMinutes: 15,
      });
  }
}

function buildObjective(
  input:
    RuntimeImprovementPlanInput,
): Readonly<RuntimeImprovementObjective> | undefined {
  const proposal =
    input.scientificCycle
      .scientificDecision
      .proposal;

  if (proposal === undefined) {
    return undefined;
  }

  return Object.freeze({
    id:
      `${input.planId}-OBJECTIVE`,

    title:
      proposal.actionDescription,

    description:
      proposal.objective,

    candidateId:
      proposal.candidateId,

    hypothesisId:
      proposal.hypothesisId,

    expectedEffect:
      proposal.expectedEffect,

    sourceCycleId:
      input.scientificCycle
        .cycleId,

    sourceEvolutionId:
      input.knowledgeEvolution
        ?.evolutionId,
  });
}

function step(
  input: {
    readonly id: string;
    readonly sequence: number;

    readonly type:
      RuntimeImprovementStepType;

    readonly status:
      RuntimeImprovementStepStatus;

    readonly title: string;
    readonly description: string;

    readonly dependsOn:
      readonly string[];

    readonly acceptanceCriteria:
      readonly string[];

    readonly rejectionCriteria:
      readonly string[];

    readonly expectedEvidence:
      readonly string[];

    readonly cost: StepCost;

    readonly risk:
      RuntimeImprovementRiskLevel;
  },
): Readonly<RuntimeImprovementStep> {
  return Object.freeze({
    id:
      input.id,

    sequence:
      input.sequence,

    type:
      input.type,

    status:
      input.status,

    title:
      input.title,

    description:
      input.description,

    dependsOn:
      Object.freeze([
        ...input.dependsOn,
      ]),

    acceptanceCriteria:
      Object.freeze([
        ...input
          .acceptanceCriteria,
      ]),

    rejectionCriteria:
      Object.freeze([
        ...input
          .rejectionCriteria,
      ]),

    expectedEvidence:
      Object.freeze([
        ...input.expectedEvidence,
      ]),

    estimatedChangedFiles:
      input.cost.changedFiles,

    estimatedChangedLines:
      input.cost.changedLines,

    estimatedBuildExecutions:
      input.cost
        .buildExecutions,

    estimatedOperatorMinutes:
      input.cost
        .operatorMinutes,

    risk:
      input.risk,

    humanAuthorizationRequired:
      true,

    automaticExecution:
      false,

    automaticRepositoryMutation:
      false,
  });
}

function buildSteps(
  input:
    RuntimeImprovementPlanInput,

  objective:
    RuntimeImprovementObjective,
): readonly RuntimeImprovementStep[] {
  const cycle =
    input.scientificCycle;

  const decision =
    cycle.scientificDecision;

  const accepted =
    input.operatorAuthorized === true &&
    input.acceptedByOperator === true &&
    decision.acceptedByOperator === true;

  const proposal =
    decision.proposal;

  if (proposal === undefined) {
    return Object.freeze([]);
  }

  const experimentRisk =
    mapExperimentRisk(
      decision.selectedRanking
        ?.riskPenalty,
    );

  const implementationStatus:
    RuntimeImprovementStepStatus =
      accepted
        ? "PLANNED"
        : "REVIEW_REQUIRED";

  const evidenceId =
    `${input.planId}-STEP-001`;

  const testId =
    `${input.planId}-STEP-002`;

  const implementationId =
    `${input.planId}-STEP-003`;

  const validationId =
    `${input.planId}-STEP-004`;

  const measurementId =
    `${input.planId}-STEP-005`;

  const reviewId =
    `${input.planId}-STEP-006`;

  const evidenceStep =
    step({
      id:
        evidenceId,

      sequence:
        1,

      type:
        "EVIDENCE",

      status:
        "PLANNED",

      title:
        "Freeze the scientific evidence boundary",

      description:
        "Record the selected candidate, hypothesis, measured scores, current capability posture and repository revision before implementation.",

      dependsOn:
        [],

      acceptanceCriteria:
        [
          "Scientific cycle ID is recorded.",
          "Selected candidate and hypothesis IDs are recorded.",
          "Current capability score and capability gaps are recorded.",
          "No raw private source content is persisted automatically.",
        ],

      rejectionCriteria:
        [
          "Scientific evidence cannot be linked to the current cycle.",
          "The selected candidate or hypothesis is missing.",
          "The legalCertification=false boundary is violated.",
        ],

      expectedEvidence:
        [
          `Scientific cycle: ${cycle.cycleId}.`,
          `Candidate: ${proposal.candidateId}.`,
          `Hypothesis: ${proposal.hypothesisId}.`,
          `Capability score: ${cycle.summary.capabilityScore}/100.`,
        ],

      cost:
        stepCost(
          "EVIDENCE",
          cycle,
        ),

      risk:
        "LOW",
    });

  const testStep =
    step({
      id:
        testId,

      sequence:
        2,

      type:
        "TEST",

      status:
        "PLANNED",

      title:
        "Create deterministic acceptance tests",

      description:
        "Create or identify tests that reproduce the selected finding before applying the implementation.",

      dependsOn:
        [
          evidenceId,
        ],

      acceptanceCriteria:
        [
          ...proposal
            .acceptanceCriteria,

          "At least one test fails before the proposed correction when the defect is reproducible.",
        ],

      rejectionCriteria:
        [
          ...proposal
            .rejectionCriteria,

          "The finding cannot be reproduced and no evidence-expansion strategy is approved.",
        ],

      expectedEvidence:
        [
          "Pre-implementation test result.",
          "Deterministic replay result.",
          "Test scope linked to the selected hypothesis.",
        ],

      cost:
        stepCost(
          "TEST",
          cycle,
        ),

      risk:
        "LOW",
    });

  const implementationStep =
    step({
      id:
        implementationId,

      sequence:
        3,

      type:
        "IMPLEMENTATION",

      status:
        implementationStatus,

      title:
        proposal.actionDescription,

      description:
        proposal.expectedEffect,

      dependsOn:
        [
          evidenceId,
          testId,
        ],

      acceptanceCriteria:
        [
          ...proposal
            .acceptanceCriteria,

          "The implementation remains within the operator-approved scope.",
          "No unrelated module is modified without separate authorization.",
        ],

      rejectionCriteria:
        [
          ...proposal
            .rejectionCriteria,

          "Operator acceptance is absent.",
          "The required implementation scope exceeds the approved proposal.",
        ],

      expectedEvidence:
        [
          "Explicit operator authorization.",
          "Changed-file list.",
          "Changed-line summary.",
          "Commit hash supplied after manual implementation.",
        ],

      cost:
        stepCost(
          "IMPLEMENTATION",
          cycle,
        ),

      risk:
        experimentRisk,
    });

  const validationStep =
    step({
      id:
        validationId,

      sequence:
        4,

      type:
        "VALIDATION",

      status:
        implementationStatus,

      title:
        "Validate build, types, tests and replay",

      description:
        "Verify the implementation using deterministic technical gates before any knowledge claim is accepted.",

      dependsOn:
        [
          implementationId,
        ],

      acceptanceCriteria:
        [
          "TypeScript compilation passes.",
          "Production build passes.",
          "Relevant tests pass.",
          "Regression checks pass.",
          "Deterministic replay matches.",
        ],

      rejectionCriteria:
        [
          "Any mandatory technical gate fails.",
          "The result cannot be reproduced.",
          "An unrelated regression is detected.",
        ],

      expectedEvidence:
        [
          "Typecheck result.",
          "Production build result.",
          "Test result.",
          "Regression result.",
          "Replay result.",
        ],

      cost:
        stepCost(
          "VALIDATION",
          cycle,
        ),

      risk:
        "MEDIUM",
    });

  const measurementStep =
    step({
      id:
        measurementId,

      sequence:
        5,

      type:
        "MEASUREMENT",

      status:
        implementationStatus,

      title:
        "Measure the post-implementation capability delta",

      description:
        "Run a new scientific cycle and compare it with the current cycle using Runtime Knowledge Evolution.",

      dependsOn:
        [
          validationId,
        ],

      acceptanceCriteria:
        [
          "A distinct new scientific cycle is produced.",
          "Capability score and gaps are measured again.",
          "New and resolved findings are calculated.",
          "The evolution trend is reported without automatic persistence.",
        ],

      rejectionCriteria:
        [
          "The same scientific cycle is reused as both previous and current evidence.",
          "Post-implementation measurements are missing.",
          "The comparison violates deterministic or governance boundaries.",
        ],

      expectedEvidence:
        [
          `Previous scientific cycle: ${cycle.cycleId}.`,
          "New scientific cycle ID.",
          "Knowledge Evolution report.",
          "Capability-score delta.",
          "Finding-resolution delta.",
        ],

      cost:
        stepCost(
          "MEASUREMENT",
          cycle,
        ),

      risk:
        "LOW",
    });

  const reviewStep =
    step({
      id:
        reviewId,

      sequence:
        6,

      type:
        "OPERATOR_REVIEW",

      status:
        implementationStatus,

      title:
        "Operator review and knowledge acceptance",

      description:
        "Present the implementation evidence and measured evolution to the human operator for final acceptance or rejection.",

      dependsOn:
        [
          measurementId,
        ],

      acceptanceCriteria:
        [
          "The operator reviews all mandatory evidence.",
          "The operator explicitly accepts or rejects the result.",
          "No automatic knowledge acceptance occurs.",
        ],

      rejectionCriteria:
        [
          "Mandatory evidence is missing.",
          "The evolution report is inconclusive and the operator requires another experiment.",
          "The operator rejects the measured result.",
        ],

      expectedEvidence:
        [
          "Operator decision.",
          "Decision timestamp.",
          "Accepted or rejected hypothesis ID.",
          "Reason for the operator decision.",
        ],

      cost:
        stepCost(
          "OPERATOR_REVIEW",
          cycle,
        ),

      risk:
        "LOW",
    });

  return Object.freeze([
    evidenceStep,
    testStep,
    implementationStep,
    validationStep,
    measurementStep,
    reviewStep,
  ]);
}

function gate(
  id: string,
  label: string,
  passed: boolean,
  description: string,
): Readonly<RuntimeImprovementPlanGate> {
  return Object.freeze({
    id,
    label,

    required:
      true,

    passed,

    description,
  });
}

function buildGates(
  input:
    RuntimeImprovementPlanInput,
): readonly RuntimeImprovementPlanGate[] {
  const cycle =
    input.scientificCycle;

  const decision =
    cycle.scientificDecision;

  const proposalAvailable =
    decision.proposal !==
    undefined;

  return Object.freeze([
    gate(
      "SCIENTIFIC_CYCLE_AVAILABLE",
      "Scientific cycle available",
      cycle.status !==
        "BLOCKED",
      `Scientific cycle status is ${cycle.status}.`,
    ),

    gate(
      "SCIENTIFIC_PROPOSAL_AVAILABLE",
      "Scientific proposal available",
      proposalAvailable,
      proposalAvailable
        ? "A scientific proposal is available."
        : "No scientific proposal is available.",
    ),

    gate(
      "OPERATOR_AUTHORIZATION",
      "Operator authorization",
      input.operatorAuthorized ===
        true,
      input.operatorAuthorized
        ? "Operator authorization is present."
        : "Operator authorization is missing.",
    ),

    gate(
      "OPERATOR_ACCEPTANCE",
      "Operator acceptance",
      input.acceptedByOperator ===
        true &&
        decision.acceptedByOperator ===
          true,
      input.acceptedByOperator === true &&
        decision.acceptedByOperator ===
          true
        ? "The selected scientific proposal has been explicitly accepted."
        : "The selected scientific proposal has not been explicitly accepted.",
    ),

    gate(
      "LEGAL_BOUNDARY",
      "Legal certification boundary",
      cycle.legalCertification ===
        false,
      "legalCertification must remain false.",
    ),

    gate(
      "AUTOMATIC_MUTATION_DISABLED",
      "Automatic repository mutation disabled",
      cycle.governance
        .automaticRepositoryMutation ===
        false,
      "Automatic repository mutation must remain disabled.",
    ),
  ]);
}

function buildSummary(
  cycle:
    RuntimeScientificCycleResult,

  evolution:
    RuntimeKnowledgeEvolutionResult | undefined,

  steps:
    readonly RuntimeImprovementStep[],
): Readonly<RuntimeImprovementPlanSummary> {
  const count =
    (
      type:
        RuntimeImprovementStepType,
    ) =>
      steps.filter(
        (item) =>
          item.type === type,
      ).length;

  return Object.freeze({
    totalSteps:
      steps.length,

    plannedSteps:
      steps.filter(
        (item) =>
          item.status ===
          "PLANNED",
      ).length,

    reviewRequiredSteps:
      steps.filter(
        (item) =>
          item.status ===
          "REVIEW_REQUIRED",
      ).length,

    blockedSteps:
      steps.filter(
        (item) =>
          item.status ===
          "BLOCKED",
      ).length,

    evidenceSteps:
      count("EVIDENCE"),

    testSteps:
      count("TEST"),

    implementationSteps:
      count("IMPLEMENTATION"),

    validationSteps:
      count("VALIDATION"),

    measurementSteps:
      count("MEASUREMENT"),

    operatorReviewSteps:
      count("OPERATOR_REVIEW"),

    totalEstimatedChangedFiles:
      steps.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.estimatedChangedFiles,
        0,
      ),

    totalEstimatedChangedLines:
      steps.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.estimatedChangedLines,
        0,
      ),

    totalEstimatedBuildExecutions:
      steps.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .estimatedBuildExecutions,
        0,
      ),

    totalEstimatedOperatorMinutes:
      steps.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .estimatedOperatorMinutes,
        0,
      ),

    highestRisk:
      maximumRisk(
        steps,
      ),

    capabilityScore:
      cycle.summary
        .capabilityScore,

    capabilityGaps:
      cycle.summary
        .capabilityGaps,

    evolutionTrend:
      evolution?.trend,

    evolutionScore:
      evolution?.summary
        .evolutionScore,
  });
}

function determineStatus(
  cycle:
    RuntimeScientificCycleResult,

  gates:
    readonly RuntimeImprovementPlanGate[],

  steps:
    readonly RuntimeImprovementStep[],
): RuntimeImprovementPlanStatus {
  if (
    cycle.status ===
    "REJECTED"
  ) {
    return "REJECTED";
  }

  if (
    cycle.status ===
      "BLOCKED" ||
    steps.length === 0
  ) {
    return "BLOCKED";
  }

  if (
    gates.some(
      (item) =>
        !item.passed,
    )
  ) {
    return "REVIEW_REQUIRED";
  }

  return "PLAN_READY";
}

function determineDecision(
  status:
    RuntimeImprovementPlanStatus,
): RuntimeImprovementPlanDecision {
  switch (status) {
    case "PLAN_READY":
      return "PROPOSE";

    case "REVIEW_REQUIRED":
      return "REVIEW_REQUIRED";

    case "BLOCKED":
      return "NO_ACTION";

    case "REJECTED":
      return "REJECT";
  }
}

function buildReasons(
  status:
    RuntimeImprovementPlanStatus,

  gates:
    readonly RuntimeImprovementPlanGate[],

  summary:
    RuntimeImprovementPlanSummary,
): readonly string[] {
  const reasons: string[] = [
    `Improvement plan status: ${status}.`,
    `Total roadmap steps: ${summary.totalSteps}.`,
    `Estimated changed files: ${summary.totalEstimatedChangedFiles}.`,
    `Estimated changed lines: ${summary.totalEstimatedChangedLines}.`,
    `Estimated build executions: ${summary.totalEstimatedBuildExecutions}.`,
    `Estimated operator time: ${summary.totalEstimatedOperatorMinutes} minutes.`,
    `Highest estimated risk: ${summary.highestRisk}.`,
  ];

  for (
    const failedGate
    of gates.filter(
      (item) =>
        !item.passed,
    )
  ) {
    reasons.push(
      `${failedGate.id}: ${failedGate.description}`,
    );
  }

  if (
    summary.evolutionTrend !==
    undefined
  ) {
    reasons.push(
      `Knowledge evolution trend: ${summary.evolutionTrend}.`,
    );
  }

  reasons.push(
    "The roadmap is descriptive and non-executable.",
  );

  reasons.push(
    "No repository mutation, persistence or automatic recall was performed.",
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

export function createRuntimeImprovementPlan(
  input:
    RuntimeImprovementPlanInput,
): Readonly<RuntimeImprovementPlanResult> {
  const planId =
    requireNonEmptyString(
      input.planId,
      "RUNTIME_IMPROVEMENT_PLANNER_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_IMPROVEMENT_PLANNER_TIMESTAMP_REQUIRED",
    );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    input.acceptedByOperator === true &&
    input.operatorAuthorized !== true
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_ACCEPTANCE_WITHOUT_AUTHORIZATION",
    );
  }

  validateScientificCycle(
    input.scientificCycle,
  );

  validateKnowledgeEvolution(
    input.knowledgeEvolution,
  );

  if (
    input.knowledgeEvolution !==
      undefined &&
    input.knowledgeEvolution
      .currentCycleId !==
      input.scientificCycle
        .cycleId
  ) {
    throw new Error(
      "RUNTIME_IMPROVEMENT_PLANNER_EVOLUTION_CURRENT_CYCLE_MISMATCH",
    );
  }

  const operatorAuthorized =
    input.operatorAuthorized ===
    true;

  const acceptedByOperator =
    operatorAuthorized &&
    input.acceptedByOperator ===
      true;

  const objective =
    buildObjective({
      ...input,

      planId,
      generatedAt,

      operatorAuthorized,
      acceptedByOperator,
    });

  const steps =
    objective === undefined
      ? Object.freeze<
          RuntimeImprovementStep[]
        >([])
      : buildSteps(
          {
            ...input,

            planId,
            generatedAt,

            operatorAuthorized,
            acceptedByOperator,
          },

          objective,
        );

  const gates =
    buildGates({
      ...input,

      planId,
      generatedAt,

      operatorAuthorized,
      acceptedByOperator,
    });

  const summary =
    buildSummary(
      input.scientificCycle,
      input.knowledgeEvolution,
      steps,
    );

  const status =
    determineStatus(
      input.scientificCycle,
      gates,
      steps,
    );

  const decision =
    determineDecision(
      status,
    );

  const reasons =
    buildReasons(
      status,
      gates,
      summary,
    );

  return Object.freeze({
    revision:
      RUNTIME_IMPROVEMENT_PLANNER_REVISION,

    planId,
    generatedAt,

    status,
    decision,

    objective,

    steps,
    gates,
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
