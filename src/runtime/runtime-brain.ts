/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Brain
 *
 * Canonical governed entry point for the AI JOKER-C2 Research &
 * Development runtime.
 *
 * RuntimeSelfState
 * + Optional Previous Scientific Cycle
 * + Explicit Human Authorization
 * → Research & Development Cycle
 * → Unified Runtime Brain Result
 *
 * This module:
 * - coordinates the governed R&D cycle;
 * - exposes one stable runtime entry point;
 * - preserves all HBCE governance boundaries;
 * - produces a deterministic operator-facing result.
 *
 * This module does not:
 * - inspect GitHub directly;
 * - execute experiments;
 * - edit repository files;
 * - create commits;
 * - persist results automatically;
 * - recall historical cycles automatically;
 * - authorize itself;
 * - issue legal certification.
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
} from "./self/runtime-self.service";

import type {
  RuntimeScientificCycleResult,
} from "./scientific/runtime-scientific-cycle";

import type {
  RuntimeScientificDecisionThresholds,
} from "./scientific/runtime-scientific-decision-engine";

import {
  createRuntimeResearchDevelopmentCycle,
  type RuntimeResearchDevelopmentCycleResult,
} from "./orchestration/runtime-research-development-cycle";

export const RUNTIME_BRAIN_REVISION =
  "AIJC2-RUNTIME-BRAIN-v1_0" as const;

export type RuntimeBrainStatus =
  | "OPERATIONAL"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

export type RuntimeBrainDecision =
  | "PLAN_READY"
  | "REVIEW_REQUIRED"
  | "NO_ACTION"
  | "REJECT";

export interface RuntimeBrainInput {
  readonly executionId: string;
  readonly generatedAt: string;

  readonly runtimeSelfState:
    RuntimeSelfState;

  /**
   * Optional previous scientific cycle supplied explicitly.
   * No automatic historical recall is permitted.
   */
  readonly previousScientificCycle?:
    RuntimeScientificCycleResult;

  /**
   * Number of competing hypotheses generated for every finding.
   * Allowed range: 2..5.
   */
  readonly hypothesesPerFinding?: number;

  readonly decisionThresholds?:
    Partial<RuntimeScientificDecisionThresholds>;

  /**
   * Authorizes governed evaluation and roadmap generation.
   * It never authorizes automatic execution or repository mutation.
   */
  readonly operatorAuthorized: boolean;

  /**
   * Explicit acceptance of the highest eligible scientific proposal.
   */
  readonly acceptedByOperator: boolean;

  readonly humanAuthorizationRequired: true;
}

export interface RuntimeBrainIdentity {
  readonly runtime:
    "AI_JOKER_C2";

  readonly runtimeIpr:
    "IPR-AI-0001";

  readonly humanAuthority:
    "IPR-3";

  readonly organization:
    "HERMETICUM_BCE";

  readonly product:
    "HBCE_IPR_OPERATIONAL_IDENTITY_AND_PROOF_LAYER";
}

export interface RuntimeBrainCapabilitySummary {
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
    RuntimeResearchDevelopmentCycleResult["summary"]["scientificDecision"];

  readonly evolutionTrend?:
    RuntimeResearchDevelopmentCycleResult["summary"]["evolutionTrend"];

  readonly evolutionScore?: number;

  readonly roadmapSteps: number;

  readonly estimatedChangedFiles: number;
  readonly estimatedChangedLines: number;
  readonly estimatedBuildExecutions: number;
  readonly estimatedOperatorMinutes: number;
}

export interface RuntimeBrainBoundary {
  readonly readOnly: true;
  readonly deterministic: true;
  readonly failClosed: true;

  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticSelection: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly automaticRepositoryMutation: false;

  readonly opcTechnicalProofOnly: true;

  readonly legalCertification: false;
}

export interface RuntimeBrainResult {
  readonly revision:
    typeof RUNTIME_BRAIN_REVISION;

  readonly executionId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeBrainStatus;

  readonly decision:
    RuntimeBrainDecision;

  readonly identity:
    RuntimeBrainIdentity;

  readonly researchDevelopment:
    RuntimeResearchDevelopmentCycleResult;

  readonly capabilities:
    RuntimeBrainCapabilitySummary;

  readonly reasons:
    readonly string[];

  readonly operatorAuthorized: boolean;
  readonly acceptedByOperator: boolean;

  readonly boundary:
    RuntimeBrainBoundary;

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
  state:
    RuntimeSelfState,
): void {
  if (
    state.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_RUNTIME_SELF_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_RUNTIME_SELF_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticPersistence !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_RUNTIME_SELF_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.automaticRecall !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_RUNTIME_SELF_RECALL_BOUNDARY_VIOLATION",
    );
  }

  if (
    state.operatorAuthorized !==
      true &&
    state.operatorAuthorized !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_RUNTIME_SELF_OPERATOR_AUTHORIZATION_INVALID",
    );
  }
}

function validatePreviousScientificCycle(
  cycle:
    RuntimeScientificCycleResult | undefined,
): void {
  if (
    cycle === undefined
  ) {
    return;
  }

  if (
    cycle.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_PREVIOUS_CYCLE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    cycle.governance.readOnly !==
      true ||
    cycle.governance.deterministic !==
      true ||
    cycle.governance.failClosed !==
      true ||
    cycle.governance
      .automaticExecution !==
      false ||
    cycle.governance
      .automaticPersistence !==
      false ||
    cycle.governance
      .automaticRecall !==
      false ||
    cycle.governance
      .automaticRepositoryMutation !==
      false
  ) {
    throw new Error(
      "RUNTIME_BRAIN_PREVIOUS_CYCLE_GOVERNANCE_BOUNDARY_VIOLATION",
    );
  }
}

function mapBrainStatus(
  result:
    RuntimeResearchDevelopmentCycleResult,
): RuntimeBrainStatus {
  switch (result.status) {
    case "PLAN_READY":
      return "OPERATIONAL";

    case "REVIEW_REQUIRED":
      return "REVIEW_REQUIRED";

    case "BLOCKED":
      return "BLOCKED";

    case "REJECTED":
      return "REJECTED";
  }
}

function mapBrainDecision(
  result:
    RuntimeResearchDevelopmentCycleResult,
): RuntimeBrainDecision {
  switch (
    result.improvementPlan.decision
  ) {
    case "PROPOSE":
      return "PLAN_READY";

    case "REVIEW_REQUIRED":
      return "REVIEW_REQUIRED";

    case "NO_ACTION":
      return "NO_ACTION";

    case "REJECT":
      return "REJECT";
  }
}

function createIdentity():
  Readonly<RuntimeBrainIdentity> {
  return Object.freeze({
    runtime:
      "AI_JOKER_C2",

    runtimeIpr:
      "IPR-AI-0001",

    humanAuthority:
      "IPR-3",

    organization:
      "HERMETICUM_BCE",

    product:
      "HBCE_IPR_OPERATIONAL_IDENTITY_AND_PROOF_LAYER",
  });
}

function createBoundary():
  Readonly<RuntimeBrainBoundary> {
  return Object.freeze({
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

    opcTechnicalProofOnly:
      true,

    legalCertification:
      false,
  });
}

function createCapabilitySummary(
  result:
    RuntimeResearchDevelopmentCycleResult,
): Readonly<RuntimeBrainCapabilitySummary> {
  const summary =
    result.summary;

  return Object.freeze({
    capabilityScore:
      summary.capabilityScore,

    registeredCapabilities:
      summary.registeredCapabilities,

    capabilityGaps:
      summary.capabilityGaps,

    findings:
      summary.findings,

    scientificHypotheses:
      summary.scientificHypotheses,

    experimentCandidates:
      summary.experimentCandidates,

    selectedCandidateId:
      summary.selectedCandidateId,

    selectedHypothesisId:
      summary.selectedHypothesisId,

    selectedExperimentScore:
      summary.selectedExperimentScore,

    scientificDecision:
      summary.scientificDecision,

    evolutionTrend:
      summary.evolutionTrend,

    evolutionScore:
      summary.evolutionScore,

    roadmapSteps:
      summary.roadmapSteps,

    estimatedChangedFiles:
      summary.estimatedChangedFiles,

    estimatedChangedLines:
      summary.estimatedChangedLines,

    estimatedBuildExecutions:
      summary.estimatedBuildExecutions,

    estimatedOperatorMinutes:
      summary.estimatedOperatorMinutes,
  });
}

function createReasons(
  status:
    RuntimeBrainStatus,

  decision:
    RuntimeBrainDecision,

  result:
    RuntimeResearchDevelopmentCycleResult,
): readonly string[] {
  const reasons: string[] = [
    `Runtime Brain status: ${status}.`,
    `Runtime Brain decision: ${decision}.`,
    ...result.reasons,
  ];

  switch (status) {
    case "OPERATIONAL":
      reasons.push(
        "The runtime produced a complete governed R&D roadmap.",
      );
      break;

    case "REVIEW_REQUIRED":
      reasons.push(
        "At least one runtime stage requires explicit operator review or acceptance.",
      );
      break;

    case "BLOCKED":
      reasons.push(
        "The runtime could not produce an actionable roadmap because mandatory evidence or proposals were unavailable.",
      );
      break;

    case "REJECTED":
      reasons.push(
        "At least one mandatory scientific or governance gate failed.",
      );
      break;
  }

  reasons.push(
    "No automatic execution, persistence, recall or repository mutation occurred.",
  );

  reasons.push(
    "OPC remains a technical proof receipt only.",
  );

  reasons.push(
    "legalCertification=false.",
  );

  return Object.freeze(
    reasons,
  );
}

export function executeRuntimeBrain(
  input:
    RuntimeBrainInput,
): Readonly<RuntimeBrainResult> {
  const executionId =
    requireNonEmptyString(
      input.executionId,
      "RUNTIME_BRAIN_EXECUTION_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_BRAIN_TIMESTAMP_REQUIRED",
    );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  if (
    input.acceptedByOperator ===
      true &&
    input.operatorAuthorized !==
      true
  ) {
    throw new Error(
      "RUNTIME_BRAIN_ACCEPTANCE_WITHOUT_AUTHORIZATION",
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

  const researchDevelopment =
    createRuntimeResearchDevelopmentCycle({
      executionId:
        `${executionId}-RD`,

      generatedAt,

      runtimeSelfState:
        input.runtimeSelfState,

      previousScientificCycle:
        input.previousScientificCycle,

      hypothesesPerFinding:
        input.hypothesesPerFinding,

      decisionThresholds:
        input.decisionThresholds,

      operatorAuthorized,

      acceptedByOperator,

      humanAuthorizationRequired:
        true,
    });

  const status =
    mapBrainStatus(
      researchDevelopment,
    );

  const decision =
    mapBrainDecision(
      researchDevelopment,
    );

  const capabilities =
    createCapabilitySummary(
      researchDevelopment,
    );

  const reasons =
    createReasons(
      status,
      decision,
      researchDevelopment,
    );

  return Object.freeze({
    revision:
      RUNTIME_BRAIN_REVISION,

    executionId,
    generatedAt,

    status,
    decision,

    identity:
      createIdentity(),

    researchDevelopment,

    capabilities,

    reasons,

    operatorAuthorized,
    acceptedByOperator,

    boundary:
      createBoundary(),

    legalCertification:
      false,
  });
}
