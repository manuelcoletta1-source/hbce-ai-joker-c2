/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Semantic Intelligence Orchestrator
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-ORCHESTRATOR-v1_1
 *
 * Purpose:
 * - coordinate the deterministic MOD-002 semantic pipeline;
 * - execute the semantic classifier;
 * - build semantic relations;
 * - derive repository capabilities;
 * - enrich components and domains with relation and capability identifiers;
 * - rebuild the semantic summary and MATRIX interpretation;
 * - preserve epistemic, governance and human-authorization boundaries.
 *
 * Current pipeline:
 * RepositorySemanticInput
 *   -> Semantic Classifier
 *   -> Semantic Relation Engine
 *   -> Repository Capability Engine
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
  normalizeRepositorySemanticConfidence,
  type RepositorySemanticCapability,
  type RepositorySemanticComponent,
  type RepositorySemanticDomainMap,
  type RepositorySemanticInput,
  type RepositorySemanticMatrixInterpretation,
  type RepositorySemanticOutput,
  type RepositorySemanticRelation,
  type RepositorySemanticSummary,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_SEMANTIC_INTELLIGENCE_ORCHESTRATOR_REVISION =
  "AIJC2-MOD002-REPOSITORY-SEMANTIC-INTELLIGENCE-ORCHESTRATOR-v1_1" as const;

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

    stages: readonly [
      "SEMANTIC_CLASSIFICATION",
      "SEMANTIC_RELATION_CONSTRUCTION",
      "CAPABILITY_CLASSIFICATION",
      "SEMANTIC_OUTPUT_ENRICHMENT",
    ];

    completedStages: 4;

    capabilityEngineExecuted: true;
    findingEngineExecuted: false;
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
        const domainRelationIds =
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

        const domainCapabilityIds =
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

        return Object.freeze({
          ...domain,

          relationIds:
            Object.freeze(
              [
                ...new Set(
                  domainRelationIds,
                ),
              ].sort(),
            ),

          capabilityIds:
            Object.freeze(
              [
                ...new Set(
                  domainCapabilityIds,
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

    classifiedComponents:
      components.filter(
        (component) =>
          component.status ===
          "CLASSIFIED",
      ).length,

    orphanedComponents:
      components.filter(
        (component) =>
          component.status ===
          "ORPHANED",
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

function rebuildMatrixInterpretation(
  previous:
    RepositorySemanticMatrixInterpretation,
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
  capabilities:
    readonly RepositorySemanticCapability[],
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

  let nextPriority =
    previous.nextPriority;

  if (!nextPriority) {
    if (
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
 * Version v1.1 coordinates:
 * 1. deterministic semantic classification;
 * 2. deterministic semantic relation construction;
 * 3. deterministic repository capability classification;
 * 4. semantic output enrichment.
 *
 * Dedicated finding and recommendation engines remain explicitly
 * unavailable until their implementations and tests exist.
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

  const domains =
    enrichDomains(
      classified.domains,
      components,
      relations,
      capabilities,
    );

  const summary =
    rebuildSummary(
      classified.summary,
      components,
      domains,
      relations,
      capabilities,
    );

  const matrixInterpretation =
    rebuildMatrixInterpretation(
      classified.matrixInterpretation,
      components,
      relations,
      capabilities,
    );

  const hasBlockingFinding =
    classified.findings.some(
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

        stages:
          Object.freeze([
            "SEMANTIC_CLASSIFICATION",
            "SEMANTIC_RELATION_CONSTRUCTION",
            "CAPABILITY_CLASSIFICATION",
            "SEMANTIC_OUTPUT_ENRICHMENT",
          ] as const),

        completedStages:
          4,

        capabilityEngineExecuted:
          true,

        findingEngineExecuted:
          false,

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
      false,

    recommendationEngineIntegrated:
      false,

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
