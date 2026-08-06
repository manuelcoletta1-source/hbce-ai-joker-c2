/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Scientific Method Dashboard ViewModel
 *
 * Converts the governed orchestration result into a stable,
 * read-only dashboard projection.
 *
 * Deterministic: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeScientificMethodOutput,
  RuntimeScientificMethodStage,
  RuntimeScientificMethodStatus,
} from "./runtime-scientific-method.types";

export const RUNTIME_SCIENTIFIC_METHOD_VIEW_MODEL_REVISION =
  "AIJC2-RUNTIME-SCIENTIFIC-METHOD-VIEW-MODEL-v1_0" as const;

export type RuntimeScientificMethodDashboardTone =
  | "SUCCESS"
  | "WARNING"
  | "DANGER"
  | "NEUTRAL";

export interface RuntimeScientificMethodStageView {
  readonly id: RuntimeScientificMethodStage;
  readonly label: string;

  readonly status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "FAIL";

  readonly tone:
    RuntimeScientificMethodDashboardTone;

  readonly description: string;
}

export interface RuntimeScientificMethodMetricView {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone:
    RuntimeScientificMethodDashboardTone;
}

export interface RuntimeScientificMethodRecommendationView {
  readonly candidateId?: string;
  readonly hypothesisId?: string;

  readonly decision:
    | "SELECT"
    | "REVIEW_REQUIRED"
    | "REJECT";

  readonly score?: number;
  readonly summary: string;
}

export interface RuntimeScientificMethodGovernanceView {
  readonly humanAuthorizationRequired: true;
  readonly operatorAuthorized: boolean;

  readonly readOnly: true;
  readonly deterministic: true;

  readonly automaticExecution: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly automaticRepositoryMutation: false;

  readonly legalCertification: false;
}

export interface RuntimeScientificMethodDashboardViewModel {
  readonly revision:
    typeof RUNTIME_SCIENTIFIC_METHOD_VIEW_MODEL_REVISION;

  readonly executionId: string;
  readonly generatedAt: string;

  readonly title:
    "AI JOKER-C2 Runtime Scientific Method";

  readonly status:
    RuntimeScientificMethodStatus;

  readonly statusTone:
    RuntimeScientificMethodDashboardTone;

  readonly repository: {
    readonly name: string;
    readonly branch: string;
    readonly commit: string;

    readonly fileCount: number;
    readonly directoryCount: number;
    readonly inspectedFileCount: number;
  };

  readonly metrics:
    readonly RuntimeScientificMethodMetricView[];

  readonly stages:
    readonly RuntimeScientificMethodStageView[];

  readonly recommendation:
    RuntimeScientificMethodRecommendationView;

  readonly causalKnowledge: {
    readonly decision:
      "ACCEPT"
      | "REVIEW_REQUIRED"
      | "REJECT";

    readonly ruleId?: string;
    readonly relation?: string;
    readonly confidence?: string;
    readonly confidenceScore?: number;
  };

  readonly reasons:
    readonly string[];

  readonly governance:
    RuntimeScientificMethodGovernanceView;
}

function mapStatusTone(
  status: RuntimeScientificMethodStatus,
): RuntimeScientificMethodDashboardTone {
  switch (status) {
    case "COMPLETED":
      return "SUCCESS";

    case "REVIEW_REQUIRED":
      return "WARNING";

    case "REJECTED":
    case "BLOCKED":
      return "DANGER";

    default:
      return "NEUTRAL";
  }
}

function mapStageTone(
  status:
    | "PASS"
    | "REVIEW_REQUIRED"
    | "FAIL",
): RuntimeScientificMethodDashboardTone {
  switch (status) {
    case "PASS":
      return "SUCCESS";

    case "REVIEW_REQUIRED":
      return "WARNING";

    case "FAIL":
      return "DANGER";

    default:
      return "NEUTRAL";
  }
}

function stageLabel(
  stage: RuntimeScientificMethodStage,
): string {
  switch (stage) {
    case "CAPABILITY_ANALYSIS":
      return "Capability Analysis";

    case "EXPERIMENT_RANKING":
      return "Experiment Ranking";

    case "INTEGRATION_PLANNING":
      return "Integration Planning";

    case "INTEGRATION_VALIDATION":
      return "Integration Validation";

    case "INTEGRATION_SCORING":
      return "Integration Scoring";

    case "KNOWLEDGE_CYCLE":
      return "Knowledge Cycle";

    case "CAUSAL_DERIVATION":
      return "Causal Derivation";

    default:
      return stage;
  }
}

function metricTone(
  value: number,
): RuntimeScientificMethodDashboardTone {
  if (value >= 75) {
    return "SUCCESS";
  }

  if (value >= 50) {
    return "WARNING";
  }

  return "DANGER";
}

export function createRuntimeScientificMethodViewModel(
  output: RuntimeScientificMethodOutput,
): Readonly<RuntimeScientificMethodDashboardViewModel> {
  const runtimeSelfState =
    output.capability.runtimeSelfState;

  const repository =
    runtimeSelfState.repository;

  const selectedCandidateId =
    output.experiment.plan.selectedCandidateId;

  const selectedRanking =
    selectedCandidateId === undefined
      ? undefined
      : output.experiment.plan.ranking.find(
          (item) =>
            item.candidateId ===
            selectedCandidateId,
        );

  const selectedCandidate =
    selectedCandidateId === undefined
      ? undefined
      : output.experiment.plan.candidates.find(
          (item) =>
            item.id ===
            selectedCandidateId,
        );

  const causalRule =
    output.causalKnowledge.rule;

  const capabilityScore =
    runtimeSelfState.capabilityAnalysis
      .averageScore;

  const integrationScore =
    output.scoredIntegration.totalScore;

  const metrics:
    readonly RuntimeScientificMethodMetricView[] =
      Object.freeze([
        Object.freeze({
          id:
            "CAPABILITY_SCORE",

          label:
            "Capability Score",

          value:
            `${capabilityScore}/100`,

          tone:
            metricTone(
              capabilityScore,
            ),
        }),

        Object.freeze({
          id:
            "INTEGRATION_SCORE",

          label:
            "Integration Score",

          value:
            `${integrationScore}/100`,

          tone:
            metricTone(
              integrationScore,
            ),
        }),

        Object.freeze({
          id:
            "CAPABILITY_COUNT",

          label:
            "Registered Capabilities",

          value:
            String(
              runtimeSelfState
                .capabilityAnalysis
                .totalCapabilities,
            ),

          tone:
            "NEUTRAL",
        }),

        Object.freeze({
          id:
            "CAPABILITY_GAPS",

          label:
            "Capability Gaps",

          value:
            String(
              runtimeSelfState
                .capabilityAnalysis
                .gaps.length,
            ),

          tone:
            runtimeSelfState
              .capabilityAnalysis
              .gaps.length === 0
              ? "SUCCESS"
              : "WARNING",
        }),

        Object.freeze({
          id:
            "EXPERIMENT_CANDIDATES",

          label:
            "Experimental Candidates",

          value:
            String(
              output.experiment
                .plan
                .candidates
                .length,
            ),

          tone:
            "NEUTRAL",
        }),
      ]);

  const stages:
    readonly RuntimeScientificMethodStageView[] =
      Object.freeze(
        output.stages.map(
          (item) =>
            Object.freeze({
              id:
                item.stage,

              label:
                stageLabel(
                  item.stage,
                ),

              status:
                item.status,

              tone:
                mapStageTone(
                  item.status,
                ),

              description:
                item.description,
            }),
        ),
      );

  const recommendation:
    Readonly<RuntimeScientificMethodRecommendationView> =
      Object.freeze({
        candidateId:
          selectedCandidateId,

        hypothesisId:
          selectedCandidate
            ?.hypothesis.id,

        decision:
          output.experiment.decision,

        score:
          selectedRanking
            ?.totalScore,

        summary:
          selectedCandidate === undefined
            ? "No experimental candidate has been selected."
            : selectedCandidate
                .actionDescription,
      });

  return Object.freeze({
    revision:
      RUNTIME_SCIENTIFIC_METHOD_VIEW_MODEL_REVISION,

    executionId:
      output.executionId,

    generatedAt:
      output.generatedAt,

    title:
      "AI JOKER-C2 Runtime Scientific Method",

    status:
      output.status,

    statusTone:
      mapStatusTone(
        output.status,
      ),

    repository:
      Object.freeze({
        name:
          repository.repository,

        branch:
          repository.branch,

        commit:
          repository.commit,

        fileCount:
          repository.fileCount,

        directoryCount:
          repository.directoryCount,

        inspectedFileCount:
          repository.inspectedFileCount,
      }),

    metrics,

    stages,

    recommendation,

    causalKnowledge:
      Object.freeze({
        decision:
          output.causalKnowledge
            .decision,

        ruleId:
          causalRule?.id,

        relation:
          causalRule?.relation,

        confidence:
          causalRule?.confidence,

        confidenceScore:
          causalRule?.confidenceScore,
      }),

    reasons:
      Object.freeze([
        ...output.reasons,
      ]),

    governance:
      Object.freeze({
        humanAuthorizationRequired:
          true,

        operatorAuthorized:
          output.capability
            .runtimeSelfState
            .operatorAuthorized,

        readOnly:
          true,

        deterministic:
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
  });
}
