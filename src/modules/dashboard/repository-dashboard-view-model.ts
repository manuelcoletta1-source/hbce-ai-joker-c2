/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Repository Intelligence Dashboard
 *
 * Deterministic Dashboard ViewModel
 *
 * Revision:
 * AIJC2-REPOSITORY-DASHBOARD-VIEW-MODEL-v1_0
 *
 * Purpose:
 * - combine MOD-001 structural intelligence and MOD-002 semantic
 *   intelligence into one canonical dashboard model;
 * - map runtime service projections without executing analysis;
 * - expose safe presentation-ready values;
 * - preserve fail-closed, authorization and legal boundaries.
 *
 * Explicit exclusions:
 * - no repository analysis execution;
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no autonomous mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import {
  createRepositoryDashboardModel,
  REPOSITORY_DASHBOARD_MODEL_REVISION,
  type RepositoryDashboardArchitectureSummary,
  type RepositoryDashboardCapability,
  type RepositoryDashboardDependencySummary,
  type RepositoryDashboardFinding,
  type RepositoryDashboardMetric,
  type RepositoryDashboardModel,
  type RepositoryDashboardModuleStatus,
  type RepositoryDashboardRecommendation,
  type RepositoryDashboardSemanticSummary,
  type RepositoryDashboardStatus,
} from "./repository-dashboard-model";

import type {
  RepositoryIntelligenceServiceProjection,
} from "../../runtime/services/repository-intelligence.service";

import type {
  RepositorySemanticIntelligenceServiceProjection,
} from "../../runtime/services/repository-semantic-intelligence.service";

export const REPOSITORY_DASHBOARD_VIEW_MODEL_REVISION =
  "AIJC2-REPOSITORY-DASHBOARD-VIEW-MODEL-v1_0" as const;

export interface RepositoryDashboardViewModelInput {
  structural:
    RepositoryIntelligenceServiceProjection | null;

  semantic:
    RepositorySemanticIntelligenceServiceProjection | null;

  generatedAt?:
    string;

  legalCertification:
    false;
}

export interface RepositoryDashboardViewModelResult {
  revision:
    typeof REPOSITORY_DASHBOARD_VIEW_MODEL_REVISION;

  model:
    RepositoryDashboardModel;

  sourceAvailability: {
    mod001Available:
      boolean;

    mod002Available:
      boolean;

    bothModulesAvailable:
      boolean;
  };

  governance: {
    deterministic:
      true;

    mappingOnly:
      true;

    analysisExecution:
      false;

    autonomousExecution:
      false;

    humanAuthorizationRequired:
      true;

    persistentMemoryCreated:
      false;

    automaticRecallUsed:
      false;

    legalCertification:
      false;
  };

  legalCertification:
    false;
}

export class RepositoryDashboardViewModelError
  extends Error {
  readonly code:
    string;

  constructor(
    code:
      string,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "RepositoryDashboardViewModelError";

    this.code =
      code;
  }
}

function normalizeOptionalString(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : null;
}

function resolveStatus(
  structural:
    RepositoryIntelligenceServiceProjection | null,
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): RepositoryDashboardStatus {
  if (
    !structural &&
    !semantic
  ) {
    return "NOT_EXECUTED";
  }

  if (
    structural?.result.architecture.ok ===
      false ||
    semantic?.ok ===
      false
  ) {
    return "FAIL_CLOSED";
  }

  if (
    !structural ||
    !semantic
  ) {
    return "DEGRADED";
  }

  return "READY";
}

function buildModuleStatuses(
  structural:
    RepositoryIntelligenceServiceProjection | null,
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): readonly RepositoryDashboardModuleStatus[] {
  return Object.freeze([
    Object.freeze({
      moduleId:
        "MOD-001",

      moduleName:
        "Repository Intelligence",

      version:
        "1.1.0",

      status:
        structural
          ? (
              structural.result
                .architecture.ok
                ? "READY"
                : "FAIL_CLOSED"
            )
          : "NOT_EXECUTED",

      executed:
        structural !==
        null,

      verified:
        structural !==
          null &&
        structural.result
          .architecture.ok ===
          true,

      revision:
        structural
          ?.serviceRevision ??
        null,
    }),

    Object.freeze({
      moduleId:
        "MOD-002",

      moduleName:
        "Repository Semantic Intelligence",

      version:
        semantic
          ?.moduleVersion ??
        "1.0.0",

      status:
        semantic
          ? (
              semantic.ok
                ? "READY"
                : "FAIL_CLOSED"
            )
          : "NOT_EXECUTED",

      executed:
        semantic !==
        null,

      verified:
        semantic?.ok ===
        true,

      revision:
        semantic
          ?.serviceRevision ??
        null,
    }),
  ]);
}

function buildArchitectureSummary(
  structural:
    RepositoryIntelligenceServiceProjection | null,
): RepositoryDashboardArchitectureSummary {
  if (
    !structural
  ) {
    return Object.freeze({
      totalFiles:
        0,

      totalDirectories:
        0,

      sourceFiles:
        0,

      testFiles:
        0,

      documentationFiles:
        0,

      configurationFiles:
        0,

      apiFiles:
        0,

      runtimeFiles:
        0,

      moduleFiles:
        0,

      architectureNodes:
        0,

      architectureZones:
        0,

      architectureEntrypoints:
        0,

      architectureBoundaries:
        0,

      inspectedFileCoverage:
        0,
    });
  }

  const statistics =
    structural.result
      .scan.statistics;

  const architecture =
    structural.result
      .architecture;

  return Object.freeze({
    totalFiles:
      statistics.totalFiles,

    totalDirectories:
      statistics.directories,

    sourceFiles:
      statistics.sourceFiles,

    testFiles:
      statistics.testFiles,

    documentationFiles:
      statistics.documentationFiles,

    configurationFiles:
      statistics.configurationFiles,

    apiFiles:
      statistics.apiFiles,

    runtimeFiles:
      statistics.runtimeFiles,

    moduleFiles:
      statistics.moduleFiles,

    architectureNodes:
      architecture.summary
        .totalNodes,

    architectureZones:
      architecture.zones
        .length,

    architectureEntrypoints:
      architecture.summary
        .entrypointCount,

    architectureBoundaries:
      architecture.summary
        .boundaryCount,

    inspectedFileCoverage:
      architecture.summary
        .inspectedFileCoverage,
  });
}

function buildDependencySummary(
  structural:
    RepositoryIntelligenceServiceProjection | null,
): RepositoryDashboardDependencySummary {
  if (
    !structural
  ) {
    return Object.freeze({
      totalNodes:
        0,

      totalEdges:
        0,

      orphanNodes:
        0,

      cyclicDependencies:
        0,

      unresolvedDependencies:
        0,
    });
  }

  const graph =
    structural.result
      .dependencyGraph;

  const relatedNodes =
    new Set<string>();

  for (
    const edge
    of graph.edges
  ) {
    relatedNodes.add(
      edge.source,
    );

    relatedNodes.add(
      edge.target,
    );
  }

  const orphanNodes =
    graph.nodes.filter(
      (node) =>
        !relatedNodes.has(
          node.path,
        ),
    ).length;

  return Object.freeze({
    totalNodes:
      graph.totalNodes,

    totalEdges:
      graph.totalEdges,

    orphanNodes,

    cyclicDependencies:
      0,

    unresolvedDependencies:
      0,
  });
}

function buildCapabilities(
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): readonly RepositoryDashboardCapability[] {
  if (
    !semantic
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    semantic.result
      .capabilities
      .map(
        (
          capability,
        ) =>
          Object.freeze({
            capabilityId:
              capability
                .capabilityId,

            name:
              capability.name,

            description:
              capability
                .description,

            domain:
              capability.domain,

            state:
              capability.state,

            confidence:
              capability
                .confidence,

            componentIds:
              Object.freeze([
                ...capability
                  .componentIds,
              ]),

            evidenceIds:
              Object.freeze([
                ...capability
                  .evidenceIds,
              ]),
          }),
      ),
  );
}

function buildFindings(
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): readonly RepositoryDashboardFinding[] {
  if (
    !semantic
  ) {
    return Object.freeze([]);
  }

  return Object.freeze(
    semantic.result
      .findings
      .map(
        (
          finding,
        ) =>
          Object.freeze({
            findingId:
              finding.findingId,

            type:
              "type" in
                finding &&
              typeof finding.type ===
                "string"
                ? finding.type
                : "SEMANTIC_FINDING",

            severity:
              finding.severity,

            title:
              finding.title,

            description:
              finding.description,

            domain:
              finding.domain,

            componentIds:
              Object.freeze([
                ...finding
                  .componentIds,
              ]),

            evidenceIds:
              Object.freeze([
                ...finding
                  .evidenceIds,
              ]),

            recommendation:
              finding.recommendation,

            blocking:
              finding.severity ===
                "CRITICAL" ||
              finding.severity ===
                "HIGH",

            humanAuthorizationRequired:
              true,
          }),
      ),
  );
}

function buildRecommendation(
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): RepositoryDashboardRecommendation | null {
  const recommendation =
    semantic?.result
      .recommendation;

  if (
    !recommendation
  ) {
    return null;
  }

  return Object.freeze({
    recommendationId:
      recommendation
        .recommendationId,

    priority:
      recommendation.priority,

    title:
      recommendation.title,

    description:
      recommendation
        .description,

    targetComponentIds:
      Object.freeze([
        ...recommendation
          .targetComponentIds,
      ]),

    sourceFindingIds:
      Object.freeze([
        ...recommendation
          .sourceFindingIds,
      ]),

    executableAutomatically:
      false,

    humanAuthorizationRequired:
      true,
  });
}

function buildSemanticSummary(
  semantic:
    RepositorySemanticIntelligenceServiceProjection | null,
): RepositoryDashboardSemanticSummary {
  if (
    !semantic
  ) {
    return Object.freeze({
      totalComponents:
        0,

      totalDomains:
        0,

      totalCapabilities:
        0,

      totalRelations:
        0,

      totalFindings:
        0,

      classifiedComponents:
        0,

      orphanedComponents:
        0,

      ambiguousComponents:
        0,

      verifiedCapabilities:
        0,

      implementedCapabilities:
        0,

      declaredCapabilities:
        0,

      isolatedCapabilities:
        0,

      blockingFindings:
        0,

      averageConfidence:
        0,
    });
  }

  const summary =
    semantic.result
      .summary;

  const capabilities =
    semantic.result
      .capabilities;

  const findings =
    semantic.result
      .findings;

  return Object.freeze({
    totalComponents:
      summary.totalComponents,

    totalDomains:
      summary.totalDomains,

    totalCapabilities:
      summary.totalCapabilities,

    totalRelations:
      summary.totalRelations,

    totalFindings:
      summary.totalFindings,

    classifiedComponents:
      summary.classifiedComponents,

    orphanedComponents:
      summary.orphanedComponents,

    ambiguousComponents:
      summary.ambiguousComponents,

    verifiedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "VERIFIED",
      ).length,

    implementedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
            "IMPLEMENTED" ||
          capability.state ===
            "TESTED" ||
          capability.state ===
            "EXPOSED" ||
          capability.state ===
            "INTEGRATED",
      ).length,

    declaredCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "DECLARED",
      ).length,

    isolatedCapabilities:
      semantic.result
        .matrixInterpretation
        .isolatedCapabilities
        .length,

    blockingFindings:
      findings.filter(
        (finding) =>
          finding.severity ===
            "CRITICAL" ||
          finding.severity ===
            "HIGH",
      ).length,

    averageConfidence:
      summary.averageConfidence,
  });
}

function buildMetrics(
  architecture:
    RepositoryDashboardArchitectureSummary,
  dependencies:
    RepositoryDashboardDependencySummary,
  semantic:
    RepositoryDashboardSemanticSummary,
): readonly RepositoryDashboardMetric[] {
  return Object.freeze([
    Object.freeze({
      metricId:
        "DASH-METRIC-FILES",

      label:
        "Repository files",

      value:
        architecture.totalFiles,

      unit:
        "COUNT",

      sourceModuleId:
        "MOD-001",
    }),

    Object.freeze({
      metricId:
        "DASH-METRIC-COVERAGE",

      label:
        "Inspected file coverage",

      value:
        architecture
          .inspectedFileCoverage,

      unit:
        "PERCENT",

      sourceModuleId:
        "MOD-001",
    }),

    Object.freeze({
      metricId:
        "DASH-METRIC-DEPENDENCY-NODES",

      label:
        "Dependency nodes",

      value:
        dependencies.totalNodes,

      unit:
        "COUNT",

      sourceModuleId:
        "MOD-001",
    }),

    Object.freeze({
      metricId:
        "DASH-METRIC-CAPABILITIES",

      label:
        "Semantic capabilities",

      value:
        semantic.totalCapabilities,

      unit:
        "COUNT",

      sourceModuleId:
        "MOD-002",
    }),

    Object.freeze({
      metricId:
        "DASH-METRIC-FINDINGS",

      label:
        "Semantic findings",

      value:
        semantic.totalFindings,

      unit:
        "COUNT",

      sourceModuleId:
        "MOD-002",
    }),

    Object.freeze({
      metricId:
        "DASH-METRIC-CONFIDENCE",

      label:
        "Semantic confidence",

      value:
        semantic.averageConfidence,

      unit:
        "PERCENT",

      sourceModuleId:
        "MOD-002",
    }),
  ]);
}

function validateInput(
  input:
    RepositoryDashboardViewModelInput,
): void {
  if (
    input.legalCertification !==
    false
  ) {
    throw new RepositoryDashboardViewModelError(
      "REPOSITORY_DASHBOARD_VIEW_MODEL_LEGAL_BOUNDARY_VIOLATION",
      "Repository Dashboard ViewModel requires legalCertification=false",
    );
  }

  if (
    !input.structural &&
    !input.semantic
  ) {
    return;
  }

  if (
    input.structural &&
    input.structural
      .legalCertification !==
      false
  ) {
    throw new RepositoryDashboardViewModelError(
      "REPOSITORY_DASHBOARD_VIEW_MODEL_MOD001_BOUNDARY_VIOLATION",
      "MOD-001 projection requires legalCertification=false",
    );
  }

  if (
    input.semantic &&
    input.semantic
      .legalCertification !==
      false
  ) {
    throw new RepositoryDashboardViewModelError(
      "REPOSITORY_DASHBOARD_VIEW_MODEL_MOD002_BOUNDARY_VIOLATION",
      "MOD-002 projection requires legalCertification=false",
    );
  }
}

/**
 * Builds one immutable Repository Dashboard model from explicit MOD-001
 * and MOD-002 runtime service projections.
 *
 * This ViewModel performs mapping only. It does not execute either
 * operational module.
 */
export function buildRepositoryDashboardViewModel(
  input:
    RepositoryDashboardViewModelInput,
): RepositoryDashboardViewModelResult {
  validateInput(
    input,
  );

  const structural =
    input.structural;

  const semantic =
    input.semantic;

  const status =
    resolveStatus(
      structural,
      semantic,
    );

  const identity =
    semantic?.identity ??
    structural?.identity ?? {
      humanIpr:
        "UNAVAILABLE",

      runtimeIpr:
        "UNAVAILABLE",

      tenantId:
        "UNAVAILABLE",

      workspaceId:
        "UNAVAILABLE",

      sessionId:
        "UNAVAILABLE",
    };

  const repository =
    semantic?.repository ??
    (
      structural
        ? {
            repositoryId:
              structural.request
                .repositoryId,

            repositoryName:
              structural.request
                .repositoryName,

            branch:
              structural.request
                .branch,

            commitSha:
              structural.request
                .commitSha,
          }
        : {
            repositoryId:
              "UNAVAILABLE",

            repositoryName:
              "UNAVAILABLE",

            branch:
              "UNAVAILABLE",

            commitSha:
              "UNAVAILABLE",
          }
    );

  const architecture =
    buildArchitectureSummary(
      structural,
    );

  const dependencies =
    buildDependencySummary(
      structural,
    );

  const semanticSummary =
    buildSemanticSummary(
      semantic,
    );

  const capabilities =
    buildCapabilities(
      semantic,
    );

  const findings =
    buildFindings(
      semantic,
    );

  const recommendation =
    buildRecommendation(
      semantic,
    );

  const modules =
    buildModuleStatuses(
      structural,
      semantic,
    );

  const metrics =
    buildMetrics(
      architecture,
      dependencies,
      semanticSummary,
    );

  const humanAuthorizationVerified =
    (
      structural?.governance
        .humanAuthorizationVerified ??
      false
    ) &&
    (
      semantic?.governance
        .humanAuthorizationVerified ??
      false
    );

  const model =
    createRepositoryDashboardModel({
      ok:
        status ===
        "READY",

      status,

      identity,

      repository,

      operation: {
        operationId:
          semantic?.operation
            .operationId ??
          null,

        responseEvt:
          semantic?.operation
            .responseEvt ??
          null,

        opcId:
          semantic?.operation
            .opcId ??
          null,

        generatedAt:
          normalizeOptionalString(
            input.generatedAt,
          ) ??
          new Date().toISOString(),
      },

      modules,

      metrics,

      architecture,

      dependencies,

      semantic:
        semanticSummary,

      capabilities,

      findings,

      recommendation,

      matrixInterpretation:
        semantic?.result
          .matrixInterpretation ?? {
          verifiedCapabilities:
            Object.freeze([]),

          implementedCapabilities:
            Object.freeze([]),

          declaredCapabilities:
            Object.freeze([]),

          isolatedCapabilities:
            Object.freeze([]),

          ambiguousDomains:
            Object.freeze([]),

          nextPriority:
            null,
        },

      governance: {
        deterministic:
          true,

        failClosed:
          true,

        evidenceBased:
          true,

        autonomousExecution:
          false,

        humanAuthorizationRequired:
          true,

        humanAuthorizationVerified,

        evtRequired:
          true,

        unebdoRegistrationRequired:
          true,

        opcTechnicalClosureRequired:
          true,

        matrixInterpretationRequired:
          true,

        persistentMemoryCreated:
          false,

        automaticRecallUsed:
          false,

        legalCertification:
          false,
      },

      legalCertification:
        false,
    });

  return Object.freeze({
    revision:
      REPOSITORY_DASHBOARD_VIEW_MODEL_REVISION,

    model,

    sourceAvailability:
      Object.freeze({
        mod001Available:
          structural !==
          null,

        mod002Available:
          semantic !==
          null,

        bothModulesAvailable:
          structural !==
            null &&
          semantic !==
            null,
      }),

    governance:
      Object.freeze({
        deterministic:
          true,

        mappingOnly:
          true,

        analysisExecution:
          false,

        autonomousExecution:
          false,

        humanAuthorizationRequired:
          true,

        persistentMemoryCreated:
          false,

        automaticRecallUsed:
          false,

        legalCertification:
          false,
      }),

    legalCertification:
      false,
  });
}

export const REPOSITORY_DASHBOARD_VIEW_MODEL_BOUNDARY =
  Object.freeze({
    mod001ProjectionSupported:
      true,

    mod002ProjectionSupported:
      true,

    partialProjectionSupported:
      true,

    deterministicMapping:
      true,

    analysisExecution:
      false,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    automaticRepositoryDiscovery:
      false,

    autonomousMutation:
      false,

    commitExecution:
      false,

    pushExecution:
      false,

    mergeExecution:
      false,

    deployExecution:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,

    dashboardModelRevision:
      REPOSITORY_DASHBOARD_MODEL_REVISION,
  });
