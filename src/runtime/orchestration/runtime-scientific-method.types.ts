/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method
 *
 * Shared orchestration contracts connecting:
 *
 * MOD-001 Repository Intelligence
 * Runtime Capability Pipeline
 * Runtime Experiment Engine
 * Integration Planner
 * Integration Validator
 * Human-Parity Integration Scorer
 * Knowledge Runtime
 * Causal Knowledge Engine
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
  Mod001RepositoryAnalysisResult,
} from "../../modules/engines/mod-001-repository-intelligence-engine";

import type {
  IntegrationScoreInput,
  IntegrationScoreEvaluation,
} from "../../modules/mod-003/integration-score";

import type {
  IntegrationScoreResult,
} from "../../modules/mod-003/integration-score.types";

import type {
  RuntimeExperimentInput,
  RuntimeExperimentResult,
} from "../experiments/runtime-experiment-engine";

import type {
  IntegrationPlannerInput,
  IntegrationPlannerOutput,
} from "../integration/integration-types";

import type {
  IntegrationValidationResult,
} from "../integration/integration-validator";

import type {
  CausalKnowledgeResult,
} from "../knowledge/causal-knowledge-engine";

import type {
  KnowledgeCycleInput,
  KnowledgeCycleResult,
  KnowledgeEvaluation,
} from "../knowledge/knowledge-types";

import type {
  RuntimeCapabilityPipelineOutput,
} from "../self/runtime-capability-pipeline";

import type {
  RuntimeEvolutionProjection,
  RuntimeIntegrationProjection,
  RuntimeKnowledgeProjection,
  RuntimeRepositoryProjection,
} from "../self/runtime-self.service";

export const RUNTIME_SCIENTIFIC_METHOD_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-METHOD-v1_0" as const;

export type RuntimeScientificMethodStatus =
  | "COMPLETED"
  | "REVIEW_REQUIRED"
  | "REJECTED"
  | "BLOCKED";

export type RuntimeScientificMethodStage =
  | "CAPABILITY_ANALYSIS"
  | "EXPERIMENT_RANKING"
  | "INTEGRATION_PLANNING"
  | "INTEGRATION_VALIDATION"
  | "INTEGRATION_SCORING"
  | "KNOWLEDGE_CYCLE"
  | "CAUSAL_DERIVATION";

export interface RuntimeScientificMethodCausalInput {
  readonly ruleId: string;
  readonly evaluation: KnowledgeEvaluation;

  readonly causeStatement: string;
  readonly effectStatement: string;
  readonly reusableRule: string;

  readonly acceptedByOperator: boolean;
}

export interface RuntimeScientificMethodInput {
  readonly executionId: string;
  readonly revision: string;
  readonly generatedAt: string;
  readonly runtimeVersion: string;

  /**
   * Repository evidence already produced by MOD-001.
   * The orchestrator does not access GitHub or the filesystem.
   */
  readonly mod001Analysis: Mod001RepositoryAnalysisResult;

  readonly repository: RuntimeRepositoryProjection;
  readonly evolution: RuntimeEvolutionProjection;
  readonly integration: RuntimeIntegrationProjection;
  readonly knowledge: RuntimeKnowledgeProjection;

  /**
   * Multiple competing hypotheses ranked before integration.
   */
  readonly experiment: RuntimeExperimentInput;

  /**
   * Plan corresponding to the candidate authorized by the operator.
   */
  readonly integrationPlan: IntegrationPlannerInput;

  /**
   * Measured evidence used after implementation or controlled simulation.
   */
  readonly integrationScore: IntegrationScoreInput;

  /**
   * Observation, hypothesis and action cycle.
   */
  readonly knowledgeCycle: KnowledgeCycleInput;

  /**
   * Causal derivation data.
   * Cycle and score references are supplied by previous pipeline stages.
   */
  readonly causal: RuntimeScientificMethodCausalInput;

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
}

export interface RuntimeScientificMethodStageResult {
  readonly stage: RuntimeScientificMethodStage;

  readonly status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "FAIL";

  readonly description: string;
}

export interface RuntimeScientificMethodOutput {
  readonly revision:
    typeof RUNTIME_SCIENTIFIC_METHOD_REVISION;

  readonly executionId: string;
  readonly generatedAt: string;

  readonly status:
    RuntimeScientificMethodStatus;

  readonly capability:
    RuntimeCapabilityPipelineOutput;

  readonly experiment:
    RuntimeExperimentResult;

  readonly integrationPlan:
    IntegrationPlannerOutput;

  readonly integrationValidation:
    IntegrationValidationResult;

  readonly integrationScore:
    IntegrationScoreEvaluation;

  readonly knowledgeCycle:
    KnowledgeCycleResult;

  readonly causalKnowledge:
    CausalKnowledgeResult;

  /**
   * Canonical integration result reused by the causal stage.
   */
  readonly scoredIntegration:
    IntegrationScoreResult;

  readonly stages:
    readonly RuntimeScientificMethodStageResult[];

  readonly reasons:
    readonly string[];

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
    readonly humanAuthorizationRequired: true;

    readonly automaticExecution: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}
