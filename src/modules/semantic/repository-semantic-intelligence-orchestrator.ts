/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Semantic Intelligence Orchestrator
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-ORCHESTRATOR-v1_2
 *
 * Purpose:
 * - coordinate the deterministic MOD-002 semantic pipeline;
 * - execute the semantic classifier;
 * - build semantic relations;
 * - derive repository capabilities;
 * - derive semantic findings;
 * - enrich components and domains;
 * - rebuild semantic summary and MATRIX interpretation;
 * - preserve epistemic, governance and human-authorization boundaries.
 *
 * Current pipeline:
 * RepositorySemanticInput
 *   -> Semantic Classifier
 *   -> Semantic Relation Engine
 *   -> Repository Capability Engine
 *   -> Repository Finding Engine
 *   -> Semantic Output Enrichment
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source-code execution;
 * - no AST parsing;
 * - no automatic repository discovery;
 * - no autonomous mutation;
 * - no commit, push, merge or deploy;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import {
  classifyRepositorySemantics,
  REPOSITORY_SEMANTIC_CLASSIFIER_REVISION,
} from "./repository-semantic-classifier";

import {
  buildSemanticRelations,
  REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION,
} from "./repository-semantic-relation-engine";

import {
  buildRepositoryCapabilities,
  REPOSITORY_CAPABILITY_ENGINE_REVISION,
} from "./repository-capability-engine";

import {
  buildRepositoryFindings,
  REPOSITORY_FINDING_ENGINE_REVISION,
} from "./repository-finding-engine";

import {
  normalizeRepositorySemanticConfidence,
  type RepositorySemanticCapability,
  type RepositorySemanticComponent,
  type RepositorySemanticDomainMap,
  type RepositorySemanticFinding,
  type RepositorySemanticInput,
  type RepositorySemanticMatrixInterpretation,
  type RepositorySemanticOutput,
  type RepositorySemanticRecommendation,
  type RepositorySemanticRelation,
  type RepositorySemanticSummary,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION =
  "AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-ORCHESTRATOR-v1_2" as const;

export interface RepositorySemanticOrchestratorOutput
  extends RepositorySemanticOutput {
  orchestrator: {
    revision:
      typeof REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION;

    classifierRevision:
      typeof REPOSITORY_SEMANTIC_CLASSIFIER_REVISION;

    relationEngineRevision:
      typeof REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION;

    capabilityEngineRevision:
      typeof REPOSITORY_CAPABILITY_ENGINE_REVISION;

    findingEngineRevision:
      typeof REPOSITORY_FINDING_ENGINE_REVISION;

    stages: readonly [
      "SEMANTIC_CLASSIFICATION",
      "SEMANTIC_RELATION_CONSTRUCTION",
      "CAPABILITY_CLASSIFICATION",
      "SEMANTIC_FINDING_CONSTRUCTION",
      "SEMANTIC_OUTPUT_ENRICHMENT",
    ];

    completedStages: 5;

    capabilityEngineExecuted: true;
    findingEngineExecuted: true;
    recommendationEngineExecuted: false;

    deterministic: true;
    failClosed: true;
    legalCertification: false;
  };
}

export class RepositorySemanticOrchestratorError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositorySemanticOrchestratorError";

    this.code =
      code;
  }
}

function enrichComponents(
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
): readonly RepositorySemanticComponent[] {
  const relationIdsByComponent =
    new Map<string, string[]>();

  const capabilityIdsByComponent =
    new Map<string, string[]>();

  for (const relation of relations) {
    const sourceRelations =
      relationIdsByComponent.get(
        relation.sourceComponentId,
      ) ?? [];

    sourceRelations.push(
      relation.relationId,
    );

    relationIdsByComponent.set(
      relation.sourceComponentId,
      sourceRelations,
    );

    const targetRelations =
      relationIdsByComponent.get(
        relation.targetComponentId,
      ) ?? [];

    targetRelations.push(
      relation.relationId,
    );

    relationIdsByComponent.set(
      relation.targetComponentId,
      targetRelations,
    );
  }

  for (const capability of capabilities) {
    for (
      const componentId
      of capability.componentIds
    ) {
      const current =
        capabilityIdsByComponent.get(
          componentId,
        ) ?? [];

      current.push(
        capability.capabilityId,
      );

      capabilityIdsByComponent.set(
        componentId,
        current,
      );
    }
  }

  return Object.freeze(
    components.map(
      (component) =>
        Object.freeze({
          ...component,

          relationIds:
            Object.freeze(
              [
                ...new Set(
                  relationIdsByComponent.get(
                    component.componentId,
                  ) ?? [],
                ),
              ].sort(),
            ),

          capabilityIds:
            Object.freeze(
              [
                ...new Set(
                  capabilityIdsByComponent.get(
                    component.componentId,
                  ) ?? [],
                ),
              ].sort(),
            ),
        }),
    ),
  );
}

function enrichDomains(
  domains:
    readonly RepositorySemanticDomainMap[],
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
  findings:
    readonly RepositorySemanticFinding[],
): readonly RepositorySemanticDomainMap[] {
  const componentById =
    new Map(
      components.map(
        (component) => [
          component.componentId,
          component,
        ],
      ),
    );

  return Object.freeze(
    domains.map(
      (domain) => {
        const relationIds =
          relations
            .filter(
              (relation) => {
                const source =
                  componentById.get(
                    relation.sourceComponentId,
                  );

                const target =
                  componentById.get(
                    relation.targetComponentId,
                  );

                return (
                  source?.domain ===
                    domain.name ||
                  target?.domain ===
                    domain.name
                );
              },
            )
            .map(
              (relation) =>
                relation.relationId,
            );

        const capabilityIds =
          capabilities
            .filter(
              (capability) =>
                capability.domain ===
                domain.name,
            )
            .map(
              (capability) =>
                capability.capabilityId,
            );

        const findingIds =
          findings
            .filter(
              (finding) =>
                finding.domain ===
                domain.name,
            )
            .map(
              (finding) =>
                finding.findingId,
            );

        return Object.freeze({
          ...domain,

          relationIds:
            Object.freeze(
              [
                ...new Set(
                  relationIds,
                ),
              ].sort(),
            ),

          capabilityIds:
            Object.freeze(
              [
                ...new Set(
                  capabilityIds,
                ),
              ].sort(),
            ),

          findingIds:
            Object.freeze(
              [
                ...new Set(
                  findingIds,
                ),
              ].sort(),
            ),
        });
      },
    ),
  );
}

function calculateAverageConfidence(
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
): number {
  const values = [
    ...components.map(
      (component) =>
        component.confidence,
    ),

    ...relations.map(
      (relation) =>
        relation.confidence,
    ),

    ...capabilities.map(
      (capability) =>
        capability.confidence,
    ),
  ];

  if (values.length === 0) {
    return 0;
  }

  return normalizeRepositorySemanticConfidence(
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length,
  );
}

function rebuildSummary(
  previous:
    RepositorySemanticSummary,
  components:
    readonly RepositorySemanticComponent[],
  domains:
    readonly RepositorySemanticDomainMap[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
  findings:
    readonly RepositorySemanticFinding[],
): RepositorySemanticSummary {
  return Object.freeze({
    ...previous,

    totalComponents:
      components.length,

    totalDomains:
      domains.length,

    totalCapabilities:
      capabilities.length,

    totalRelations:
      relations.length,

    totalFindings:
      findings.length,

    classifiedComponents:
      components.filter(
        (component) =>
          component.status ===
          "CLASSIFIED",
      ).length,

    orphanedComponents:
      findings.filter(
        (finding) =>
          finding.title ===
          "Component has no observed semantic relations",
      ).length,

    ambiguousComponents:
      components.filter(
        (component) =>
          component.status ===
            "AMBIGUOUS" ||
          component.status ===
            "NOT_VERIFIABLE",
      ).length,

    averageConfidence:
      calculateAverageConfidence(
        components,
        relations,
        capabilities,
      ),
  });
}

function selectRecommendation(
  findings:
    readonly RepositorySemanticFinding[],
): RepositorySemanticRecommendation | null {
  const severityWeight = {
    CRITICAL:
      1,

    HIGH:
      2,

    MEDIUM:
      3,

    LOW:
      4,

    INFO:
      5,
  } as const;

  const selected =
    [...findings].sort(
      (
        left,
        right,
      ) =>
        severityWeight[
          left.severity
        ] -
          severityWeight[
            right.severity
          ] ||
        left.findingId.localeCompare(
          right.findingId,
        ),
    )[0];

  if (!selected) {
    return null;
  }

  return Object.freeze({
    recommendationId:
      "SEM-RECOMMENDATION-001",

    priority:
      1,

    title:
      selected.title,

    description:
      selected.recommendation ??
      selected.description,

    targetComponentIds:
      Object.freeze([
        ...selected.componentIds,
      ]),

    sourceFindingIds:
      Object.freeze([
        selected.findingId,
      ]),

    executableAutomatically:
      false,

    humanAuthorizationRequired:
      true,
  });
}

function rebuildMatrixInterpretation(
  previous:
    RepositorySemanticMatrixInterpretation,
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
  findings:
    readonly RepositorySemanticFinding[],
  recommendation:
    RepositorySemanticRecommendation | null,
): RepositorySemanticMatrixInterpretation {
  const relatedComponentIds =
    new Set<string>();

  for (const relation of relations) {
    relatedComponentIds.add(
      relation.sourceComponentId,
    );

    relatedComponentIds.add(
      relation.targetComponentId,
    );
  }

  const verifiedCapabilities =
    Object.freeze(
      capabilities
        .filter(
          (capability) =>
            capability.state ===
            "VERIFIED",
        )
        .map(
          (capability) =>
            capability.capabilityId,
        )
        .sort(),
    );

  const implementedCapabilities =
    Object.freeze(
      capabilities
        .filter(
          (capability) =>
            capability.state ===
              "IMPLEMENTED" ||
            capability.state ===
              "TESTED" ||
            capability.state ===
              "EXPOSED" ||
            capability.state ===
              "INTEGRATED",
        )
        .map(
          (capability) =>
            capability.capabilityId,
        )
        .sort(),
    );

  const declaredCapabilities =
    Object.freeze(
      capabilities
        .filter(
          (capability) =>
            capability.state ===
            "DECLARED",
        )
        .map(
          (capability) =>
            capability.capabilityId,
        )
        .sort(),
    );

  const isolatedCapabilities =
    Object.freeze(
      capabilities
        .filter(
          (capability) =>
            capability.componentIds
              .every(
                (componentId) =>
                  !relatedComponentIds.has(
                    componentId,
                  ),
              ),
        )
        .map(
          (capability) =>
            capability.capabilityId,
        )
        .sort(),
    );

  const ambiguousDomains =
    Object.freeze(
      [
        ...new Set(
          components
            .filter(
              (component) =>
                component.status ===
                  "AMBIGUOUS" ||
                component.status ===
                  "NOT_VERIFIABLE",
            )
            .map(
              (component) =>
                component.domain,
            ),
        ),
      ].sort(),
    );

  let nextPriority =
    recommendation?.title ??
    previous.nextPriority;

  if (!nextPriority) {
    if (
      findings.length > 0
    ) {
      nextPriority =
        findings[0]?.title ??
        null;
    } else if (
      capabilities.length === 0
    ) {
      nextPriority =
        "Supply implementation, endpoint, test or documentation evidence to derive repository capabilities.";
    } else if (
      isolatedCapabilities.length > 0
    ) {
      nextPriority =
        "Verify the integration of isolated repository capabilities.";
    } else if (
      relations.length === 0 &&
      components.length > 1
    ) {
      nextPriority =
        "Verify semantic relations between classified components.";
    } else {
      nextPriority =
        null;
    }
  }

  return Object.freeze({
    ...previous,

    verifiedCapabilities,

    implementedCapabilities,

    declaredCapabilities,

    isolatedCapabilities,

    ambiguousDomains,

    nextPriority,
  });
}

function validateClassifierOutput(
  output:
    RepositorySemanticOutput,
): void {
  if (
    output.legalCertification !==
    false
  ) {
    throw new RepositorySemanticOrchestratorError(
      "MOD002_ORCHESTRATOR_LEGAL_BOUNDARY_VIOLATION",
      "Repository Semantic Intelligence orchestrator requires legalCertification=false",
    );
  }

  if (
    output.governance
      .autonomousExecution !==
    false
  ) {
    throw new RepositorySemanticOrchestratorError(
      "MOD002_ORCHESTRATOR_AUTONOMOUS_EXECUTION_VIOLATION",
      "Autonomous semantic execution is not permitted",
    );
  }

  if (
    output.governance
      .persistentMemoryCreated !==
    false
  ) {
    throw new RepositorySemanticOrchestratorError(
      "MOD002_ORCHESTRATOR_MEMORY_BOUNDARY_VIOLATION",
      "MOD-002 must not create persistent memory automatically",
    );
  }

  if (
    output.governance
      .automaticRecallUsed !==
    false
  ) {
    throw new RepositorySemanticOrchestratorError(
      "MOD002_ORCHESTRATOR_RECALL_BOUNDARY_VIOLATION",
      "MOD-002 must not use automatic recall",
    );
  }
}

/**
 * Executes the currently implemented MOD-002 semantic pipeline.
 *
 * Version v1.2 coordinates:
 * 1. deterministic semantic classification;
 * 2. deterministic semantic relation construction;
 * 3. deterministic repository capability classification;
 * 4. deterministic semantic finding construction;
 * 5. semantic output enrichment.
 *
 * A dedicated recommendation engine remains explicitly unavailable.
 * The orchestrator selects at most one temporary recommendation from
 * the ordered findings until that engine is implemented and tested.
 */
export function executeRepositorySemanticIntelligence(
  input:
    RepositorySemanticInput,
): RepositorySemanticOrchestratorOutput {
  const classified =
    classifyRepositorySemantics(
      input,
    );

  validateClassifierOutput(
    classified,
  );

  const relations =
    buildSemanticRelations(
      classified.components,
    );

  const capabilityEngine =
    buildRepositoryCapabilities({
      components:
        classified.components,

      componentInputs:
        input.components,

      evidence:
        input.evidence,
    });

  const capabilities =
    capabilityEngine.capabilities;

  const components =
    enrichComponents(
      classified.components,
      relations,
      capabilities,
    );

  const findingEngine =
    buildRepositoryFindings({
      components,

      capabilities,

      relations,
    });

  const findings =
    findingEngine.findings;

  const recommendation =
    input.humanAuthorization
      ? selectRecommendation(
          findings,
        )
      : null;

  const domains =
    enrichDomains(
      classified.domains,
      components,
      relations,
      capabilities,
      findings,
    );

  const summary =
    rebuildSummary(
      classified.summary,
      components,
      domains,
      relations,
      capabilities,
      findings,
    );

  const matrixInterpretation =
    rebuildMatrixInterpretation(
      classified.matrixInterpretation,
      components,
      relations,
      capabilities,
      findings,
      recommendation,
    );

  const hasBlockingFinding =
    findings.some(
      (finding) =>
        finding.severity ===
          "CRITICAL" ||
        finding.severity ===
          "HIGH",
    );

  const ok =
    classified.governance
      .humanAuthorizationVerified ===
      true &&
    !hasBlockingFinding;

  return Object.freeze({
    ...classified,

    ok,

    status:
      ok
        ? "REPOSITORY_SEMANTIC_INTELLIGENCE_READY"
        : "REPOSITORY_SEMANTIC_INTELLIGENCE_FAIL_CLOSED",

    summary,

    domains,

    components,

    capabilities,

    relations,

    findings,

    recommendation,

    matrixInterpretation,

    governance:
      Object.freeze({
        ...classified.governance,

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
      }),

    orchestrator:
      Object.freeze({
        revision:
          REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION,

        classifierRevision:
          REPOSITORY_SEMANTIC_CLASSIFIER_REVISION,

        relationEngineRevision:
          REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION,

        capabilityEngineRevision:
          REPOSITORY_CAPABILITY_ENGINE_REVISION,

        findingEngineRevision:
          REPOSITORY_FINDING_ENGINE_REVISION,

        stages:
          Object.freeze([
            "SEMANTIC_CLASSIFICATION",
            "SEMANTIC_RELATION_CONSTRUCTION",
            "CAPABILITY_CLASSIFICATION",
            "SEMANTIC_FINDING_CONSTRUCTION",
            "SEMANTIC_OUTPUT_ENRICHMENT",
          ] as const),

        completedStages:
          5,

        capabilityEngineExecuted:
          true,

        findingEngineExecuted:
          true,

        recommendationEngineExecuted:
          false,

        deterministic:
          true,

        failClosed:
          true,

        legalCertification:
          false,
      }),

    legalCertification:
      false,
  });
}

export const REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_BOUNDARY =
  Object.freeze({
    classifierIntegrated:
      true,

    relationEngineIntegrated:
      true,

    capabilityEngineIntegrated:
      true,

    findingEngineIntegrated:
      true,

    recommendationEngineIntegrated:
      false,

    temporarySingleRecommendationSelection:
      true,

    explicitInputRequired:
      true,

    explicitEvidenceRequired:
      true,

    deterministicExecution:
      true,

    failClosed:
      true,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    astParsing:
      false,

    automaticRepositoryDiscovery:
      false,

    automaticMutation:
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
  });
