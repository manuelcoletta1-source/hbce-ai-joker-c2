/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Self State From Repository
 *
 * Revision:
 * AIJC2-RUNTIME-SELF-STATE-FROM-REPOSITORY-v1_0
 *
 * Purpose:
 * - transform a real governed Repository Snapshot Service projection
 *   into RuntimeSelfState;
 * - derive measurable runtime capabilities from repository evidence;
 * - preserve explicit build/test evidence;
 * - preserve fail-closed governance;
 * - never mutate the repository;
 * - never persist raw source content;
 * - never perform automatic recall;
 * - never issue legal certification.
 *
 * legalCertification=false
 */

import type {
  RepositorySnapshotServiceProjection,
} from "../services/repository-snapshot.service";

import {
  buildRuntimeSelfState,
  type RuntimeCapability,
  type RuntimeCapabilityGap,
  type RuntimeCapabilityRecommendation,
  type RuntimeRepositoryEvolution,
  type RuntimeSelfState,
} from "./runtime-self-state-builder";

export const RUNTIME_SELF_STATE_FROM_REPOSITORY_REVISION =
  "AIJC2-RUNTIME-SELF-STATE-FROM-REPOSITORY-v1_0" as const;

export interface RuntimeSelfStateFromRepositoryInput {
  readonly generatedAt: string;

  readonly runtimeVersion: string;

  readonly repositorySnapshot:
    RepositorySnapshotServiceProjection;

  /**
   * Build/test results are deliberately supplied as external
   * evidence because RepositorySnapshotService does not execute
   * builds or tests.
   */
  readonly buildPassed: boolean;

  readonly testsPassed: boolean;

  /**
   * Optional repository evolution evidence.
   *
   * When unavailable, evolution remains disabled rather than
   * fabricating change counts.
   */
  readonly evolution?:
    RuntimeRepositoryEvolution;

  readonly operatorAuthorized: boolean;
}

function clampScore(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function capabilityStatus(
  score: number,
): RuntimeCapability["status"] {
  if (score >= 75) {
    return "OPERATIONAL";
  }

  if (score >= 40) {
    return "DEGRADED";
  }

  return "BLOCKED";
}

function calculateInspectionCoverage(
  snapshot:
    RepositorySnapshotServiceProjection,
): number {
  if (
    snapshot.snapshot.totalFiles <= 0
  ) {
    return 0;
  }

  return clampScore(
    (
      snapshot.snapshot.inspectedFiles /
      snapshot.snapshot.totalFiles
    ) * 100,
  );
}

function calculateArchitectureScore(
  snapshot:
    RepositorySnapshotServiceProjection,
): number {
  const architecture =
    snapshot.structural.result
      .architecture;

  if (!architecture.ok) {
    return 0;
  }

  let score =
    100;

  for (
    const finding
    of architecture.findings
  ) {
    switch (
      finding.severity
    ) {
      case "HIGH":
        score -= 25;
        break;

      case "MEDIUM":
        score -= 12;
        break;

      case "LOW":
        score -= 5;
        break;

      case "INFO":
        score -= 0;
        break;
    }
  }

  return clampScore(
    score,
  );
}

function calculateRiskScore(
  snapshot:
    RepositorySnapshotServiceProjection,
): number {
  const risks =
    snapshot.structural.result
      .risks.risks;

  let score =
    100;

  for (const risk of risks) {
    switch (risk.level) {
      case "HIGH":
        score -= 30;
        break;

      case "MEDIUM":
        score -= 15;
        break;

      case "LOW":
        score -= 5;
        break;
    }
  }

  return clampScore(
    score,
  );
}

function calculateMutationPlannerScore(
  snapshot:
    RepositorySnapshotServiceProjection,
): number {
  const mutationPlan =
    snapshot.structural.result
      .mutationPlan;

  const validGovernance =
    mutationPlan.deterministic ===
      true &&
    mutationPlan.autonomousExecution ===
      false &&
    mutationPlan.humanAuthorizationRequired ===
      true &&
    mutationPlan.legalCertification ===
      false;

  return validGovernance
    ? 100
    : 0;
}

function calculateRepositorySnapshotScore(
  snapshot:
    RepositorySnapshotServiceProjection,
): number {
  const scan =
    snapshot.structural.result
      .scan;

  const repositoryAvailable =
    snapshot.ok === true &&
    snapshot.repository
      .commitSha.length > 0 &&
    snapshot.snapshot.totalFiles >
      0 &&
    scan.statistics.totalFiles >
      0;

  return repositoryAvailable
    ? 100
    : 0;
}

function deriveCapabilities(
  snapshot:
    RepositorySnapshotServiceProjection,
): readonly RuntimeCapability[] {
  const inspectionCoverage =
    calculateInspectionCoverage(
      snapshot,
    );

  const architectureScore =
    calculateArchitectureScore(
      snapshot,
    );

  const riskScore =
    calculateRiskScore(
      snapshot,
    );

  const mutationPlannerScore =
    calculateMutationPlannerScore(
      snapshot,
    );

  const repositorySnapshotScore =
    calculateRepositorySnapshotScore(
      snapshot,
    );

  return Object.freeze([
    Object.freeze({
      id:
        "CAP-REPOSITORY-SNAPSHOT",

      name:
        "Governed Repository Snapshot",

      score:
        repositorySnapshotScore,

      status:
        capabilityStatus(
          repositorySnapshotScore,
        ),

      evidence:
        Object.freeze([
          `Repository: ${snapshot.repository.repositoryName}.`,
          `Branch: ${snapshot.repository.branch}.`,
          `Commit: ${snapshot.repository.commitSha}.`,
          `Files discovered: ${snapshot.snapshot.totalFiles}.`,
          `Directories discovered: ${snapshot.structural.result.scan.statistics.directories}.`,
          `Snapshot status: ${snapshot.status}.`,
        ]),
    }),

    Object.freeze({
      id:
        "CAP-SOURCE-INSPECTION",

      name:
        "Governed Source Inspection Coverage",

      score:
        inspectionCoverage,

      status:
        capabilityStatus(
          inspectionCoverage,
        ),

      evidence:
        Object.freeze([
          `Repository files: ${snapshot.snapshot.totalFiles}.`,
          `Inspected source files: ${snapshot.snapshot.inspectedFiles}.`,
          `Uninspected files: ${snapshot.snapshot.uninspectedFiles}.`,
          `Inspection coverage: ${inspectionCoverage}/100.`,
          `Raw source persisted: ${String(snapshot.snapshot.rawContentPersisted)}.`,
        ]),
    }),

    Object.freeze({
      id:
        "CAP-ARCHITECTURE-MAPPING",

      name:
        "Repository Architecture Mapping",

      score:
        architectureScore,

      status:
        capabilityStatus(
          architectureScore,
        ),

      evidence:
        Object.freeze([
          `Architecture status: ${snapshot.structural.result.architecture.status}.`,
          `Architecture nodes: ${snapshot.structural.result.architecture.summary.totalNodes}.`,
          `Identified roles: ${snapshot.structural.result.architecture.summary.identifiedRoles.length}.`,
          `Entrypoints: ${snapshot.structural.result.architecture.summary.entrypointCount}.`,
          `Boundaries: ${snapshot.structural.result.architecture.summary.boundaryCount}.`,
          `Architecture findings: ${snapshot.structural.result.architecture.summary.findingCount}.`,
        ]),
    }),

    Object.freeze({
      id:
        "CAP-REPOSITORY-RISK-ANALYSIS",

      name:
        "Repository Risk Analysis",

      score:
        riskScore,

      status:
        capabilityStatus(
          riskScore,
        ),

      evidence:
        Object.freeze([
          `Total repository risks: ${snapshot.structural.result.risks.totalRisks}.`,
          `Derived risk-control score: ${riskScore}/100.`,
          `Risk analysis deterministic: ${String(snapshot.structural.result.risks.deterministic)}.`,
        ]),
    }),

    Object.freeze({
      id:
        "CAP-GOVERNED-MUTATION-PLANNING",

      name:
        "Governed Mutation Planning",

      score:
        mutationPlannerScore,

      status:
        capabilityStatus(
          mutationPlannerScore,
        ),

      evidence:
        Object.freeze([
          `Mutation candidates: ${snapshot.structural.result.mutationPlan.totalMutations}.`,
          `Deterministic planner: ${String(snapshot.structural.result.mutationPlan.deterministic)}.`,
          `Autonomous execution: ${String(snapshot.structural.result.mutationPlan.autonomousExecution)}.`,
          `Human authorization required: ${String(snapshot.structural.result.mutationPlan.humanAuthorizationRequired)}.`,
          `Legal certification: ${String(snapshot.structural.result.mutationPlan.legalCertification)}.`,
        ]),
    }),
  ]);
}

function deriveCapabilityGaps(
  snapshot:
    RepositorySnapshotServiceProjection,
  capabilities:
    readonly RuntimeCapability[],
): readonly RuntimeCapabilityGap[] {
  const gaps:
    RuntimeCapabilityGap[] =
    [];

  const sourceInspection =
    capabilities.find(
      (capability) =>
        capability.id ===
        "CAP-SOURCE-INSPECTION",
    );

  if (
    sourceInspection &&
    sourceInspection.score < 75
  ) {
    gaps.push({
      id:
        "GAP-SOURCE-INSPECTION-COVERAGE",

      capabilityId:
        sourceInspection.id,

      description:
        `Governed source inspection coverage is ${sourceInspection.score}/100; target operational threshold is 75/100.`,

      severity:
        sourceInspection.score === 0
          ? "HIGH"
          : "MEDIUM",
    });
  }

  const architecture =
    capabilities.find(
      (capability) =>
        capability.id ===
        "CAP-ARCHITECTURE-MAPPING",
    );

  if (
    architecture &&
    architecture.score < 75
  ) {
    gaps.push({
      id:
        "GAP-ARCHITECTURE-EVIDENCE",

      capabilityId:
        architecture.id,

      description:
        `Architecture evidence score is ${architecture.score}/100 and requires governed review.`,

      severity:
        architecture.score < 40
          ? "HIGH"
          : "MEDIUM",
    });
  }

  const risk =
    capabilities.find(
      (capability) =>
        capability.id ===
        "CAP-REPOSITORY-RISK-ANALYSIS",
    );

  if (
    risk &&
    risk.score < 75
  ) {
    gaps.push({
      id:
        "GAP-REPOSITORY-RISK-POSTURE",

      capabilityId:
        risk.id,

      description:
        `Repository risk-control score is ${risk.score}/100.`,

      severity:
        risk.score < 40
          ? "HIGH"
          : "MEDIUM",
    });
  }

  if (
    snapshot.structural.result
      .architecture.findings.some(
        (finding) =>
          finding.severity ===
          "HIGH",
      )
  ) {
    gaps.push({
      id:
        "GAP-HIGH-ARCHITECTURE-FINDINGS",

      capabilityId:
        "CAP-ARCHITECTURE-MAPPING",

      description:
        "One or more HIGH architecture findings require explicit operator review.",

      severity:
        "HIGH",
    });
  }

  return Object.freeze(
    gaps,
  );
}

function deriveRecommendations(
  gaps:
    readonly RuntimeCapabilityGap[],
): readonly RuntimeCapabilityRecommendation[] {
  return Object.freeze(
    gaps.map(
      (
        gap,
        index,
      ) =>
        Object.freeze({
          id:
            `REC-${index + 1}-${gap.id}`,

          capabilityId:
            gap.capabilityId,

          description:
            gap.id ===
            "GAP-SOURCE-INSPECTION-COVERAGE"
              ? "Increase explicitly authorized source inspection coverage before raising confidence in repository-level capability claims."
              : gap.id ===
                  "GAP-ARCHITECTURE-EVIDENCE"
                ? "Review architecture findings and improve evidence coverage before accepting architecture-level recommendations."
                : gap.id ===
                    "GAP-REPOSITORY-RISK-POSTURE"
                  ? "Review repository risks and validate bounded remediation candidates under human authorization."
                  : "Review HIGH architecture findings before accepting any repository mutation proposal.",
        }),
    ),
  );
}

function validateProjection(
  snapshot:
    RepositorySnapshotServiceProjection,
): void {
  if (
    snapshot.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    snapshot.governance
      .autonomousMutation !==
    false
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_AUTONOMOUS_MUTATION_VIOLATION",
    );
  }

  if (
    snapshot.governance
      .persistentMemoryCreated !==
    false
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_MEMORY_BOUNDARY_VIOLATION",
    );
  }

  if (
    snapshot.governance
      .automaticRecallUsed !==
    false
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_RECALL_BOUNDARY_VIOLATION",
    );
  }

  if (
    snapshot.governance
      .humanAuthorizationVerified !==
    true
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_HUMAN_AUTHORIZATION_REQUIRED",
    );
  }
}

export function buildRuntimeSelfStateFromRepository(
  input:
    RuntimeSelfStateFromRepositoryInput,
): RuntimeSelfState {
  if (
    input.operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_FROM_REPOSITORY_OPERATOR_AUTHORIZATION_REQUIRED",
    );
  }

  validateProjection(
    input.repositorySnapshot,
  );

  const snapshot =
    input.repositorySnapshot;

  const capabilities =
    deriveCapabilities(
      snapshot,
    );

  const capabilityGaps =
    deriveCapabilityGaps(
      snapshot,
      capabilities,
    );

  const capabilityRecommendations =
    deriveRecommendations(
      capabilityGaps,
    );

  const evolution:
    RuntimeRepositoryEvolution =
    input.evolution ??
    Object.freeze({
      enabled:
        false,

      addedFiles:
        0,

      removedFiles:
        0,

      modifiedFiles:
        0,

      unchangedFiles:
        0,
    });

  return buildRuntimeSelfState({
    generatedAt:
      input.generatedAt,

    runtimeVersion:
      input.runtimeVersion,

    repository: {
      repository:
        snapshot.repository
          .repositoryName,

      branch:
        snapshot.repository.branch,

      commit:
        snapshot.repository
          .commitSha,

      fileCount:
        snapshot.snapshot
          .totalFiles,

      directoryCount:
        snapshot.structural
          .result.scan.statistics
          .directories,

      inspectedFileCount:
        snapshot.snapshot
          .inspectedFiles,

      buildPassed:
        input.buildPassed,

      testsPassed:
        input.testsPassed,
    },

    evolution,

    integration: {
      available:
        snapshot.ok,

      plannerAvailable:
        snapshot.structural
          .result.mutationPlan
          .deterministic ===
        true,

      validatorAvailable:
        snapshot.structural
          .result.architecture
          .ok ===
        true,

      operatorAuthorized:
        true,
    },

    knowledgeAvailable:
      true,

    capabilities,

    capabilityGaps,

    capabilityRecommendations,

    operatorAuthorized:
      true,
  });
}

export const RUNTIME_SELF_STATE_FROM_REPOSITORY_BOUNDARY =
  Object.freeze({
    realRepositoryEvidenceRequired:
      true,

    explicitBuildEvidenceRequired:
      true,

    explicitTestEvidenceRequired:
      true,

    deterministicCapabilityDerivation:
      true,

    sourceInspectionCoverageMeasured:
      true,

    architectureEvidenceMeasured:
      true,

    repositoryRiskMeasured:
      true,

    mutationPlannerGovernanceMeasured:
      true,

    automaticRepositoryMutation:
      false,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    rawSourcePersistence:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,
  });
