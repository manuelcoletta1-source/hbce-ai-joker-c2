/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Repository Finding Engine
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-FINDING-ENGINE-v1_0
 *
 * Purpose:
 * - derive semantic findings from classified components, relations
 *   and capabilities;
 * - detect orphan components, ambiguous responsibilities,
 *   duplicated responsibilities and unsupported capability states;
 * - preserve epistemic separation and deterministic execution;
 * - produce at most evidence-based findings;
 * - perform no autonomous action.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source execution;
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
  type RepositorySemanticCapability,
  type RepositorySemanticComponent,
  type RepositorySemanticDomain,
  type RepositorySemanticFinding,
  type RepositorySemanticRelation,
  type RepositorySemanticSeverity,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_FINDING_ENGINE_REVISION =
  "AIJC2-MOD002-REPOSITORY-FINDING-ENGINE-v1_0" as const;

export type RepositoryFindingType =
  | "ORPHAN_COMPONENT"
  | "AMBIGUOUS_COMPONENT"
  | "UNVERIFIABLE_COMPONENT"
  | "DUPLICATED_PRIMARY_RESPONSIBILITY"
  | "DECLARED_CAPABILITY_ONLY"
  | "UNVERIFIABLE_CAPABILITY"
  | "ISOLATED_CAPABILITY"
  | "DOMAIN_WITHOUT_RELATIONS"
  | "API_WITHOUT_RUNTIME_RELATION"
  | "LOW_CONFIDENCE_COMPONENT";

export interface RepositoryFindingEngineInput {
  components:
    readonly RepositorySemanticComponent[];

  capabilities:
    readonly RepositorySemanticCapability[];

  relations:
    readonly RepositorySemanticRelation[];
}

export interface RepositoryFindingEngineFinding
  extends RepositorySemanticFinding {
  type: RepositoryFindingType;
}

export interface RepositoryFindingEngineSummary {
  totalFindings: number;

  infoFindings: number;

  lowFindings: number;

  mediumFindings: number;

  highFindings: number;

  criticalFindings: number;

  orphanComponents: number;

  ambiguousComponents: number;

  unverifiableComponents: number;

  duplicatedResponsibilities: number;

  declaredOnlyCapabilities: number;

  unverifiableCapabilities: number;

  isolatedCapabilities: number;

  blockingFindings: number;
}

export interface RepositoryFindingEngineOutput {
  revision:
    typeof REPOSITORY_FINDING_ENGINE_REVISION;

  findings:
    readonly RepositoryFindingEngineFinding[];

  summary:
    RepositoryFindingEngineSummary;

  governance: {
    deterministic: true;

    evidenceBased: true;

    failClosed: true;

    autonomousExecution: false;

    humanAuthorizationRequired: true;

    persistentMemoryCreated: false;

    automaticRecallUsed: false;

    legalCertification: false;
  };

  legalCertification: false;
}

export class RepositoryFindingEngineError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositoryFindingEngineError";

    this.code =
      code;
  }
}

type FindingDraft = {
  type: RepositoryFindingType;

  severity: RepositorySemanticSeverity;

  title: string;

  description: string;

  domain: RepositorySemanticDomain;

  componentIds: readonly string[];

  evidenceIds: readonly string[];

  epistemicState:
    RepositorySemanticFinding["epistemicState"];

  recommendation: string | null;
};

function validateInput(
  input: RepositoryFindingEngineInput,
): void {
  if (!Array.isArray(input.components)) {
    throw new RepositoryFindingEngineError(
      "MOD002_FINDING_COMPONENTS_REQUIRED",
      "components must be an array",
    );
  }

  if (!Array.isArray(input.capabilities)) {
    throw new RepositoryFindingEngineError(
      "MOD002_FINDING_CAPABILITIES_REQUIRED",
      "capabilities must be an array",
    );
  }

  if (!Array.isArray(input.relations)) {
    throw new RepositoryFindingEngineError(
      "MOD002_FINDING_RELATIONS_REQUIRED",
      "relations must be an array",
    );
  }

  const componentIds =
    new Set<string>();

  for (const component of input.components) {
    if (
      typeof component.componentId !== "string" ||
      component.componentId.trim().length === 0
    ) {
      throw new RepositoryFindingEngineError(
        "MOD002_FINDING_COMPONENT_ID_REQUIRED",
        "Every component requires a non-empty componentId",
      );
    }

    if (componentIds.has(component.componentId)) {
      throw new RepositoryFindingEngineError(
        "MOD002_FINDING_DUPLICATE_COMPONENT_ID",
        `Duplicate component ID: ${component.componentId}`,
      );
    }

    componentIds.add(component.componentId);
  }

  const capabilityIds =
    new Set<string>();

  for (const capability of input.capabilities) {
    if (
      typeof capability.capabilityId !== "string" ||
      capability.capabilityId.trim().length === 0
    ) {
      throw new RepositoryFindingEngineError(
        "MOD002_FINDING_CAPABILITY_ID_REQUIRED",
        "Every capability requires a non-empty capabilityId",
      );
    }

    if (capabilityIds.has(capability.capabilityId)) {
      throw new RepositoryFindingEngineError(
        "MOD002_FINDING_DUPLICATE_CAPABILITY_ID",
        `Duplicate capability ID: ${capability.capabilityId}`,
      );
    }

    capabilityIds.add(capability.capabilityId);
  }
}

function normalizeResponsibility(
  responsibility: string | null,
): string | null {
  if (!responsibility) {
    return null;
  }

  const normalized =
    responsibility
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  return normalized.length > 0
    ? normalized
    : null;
}

function buildRelationComponentSet(
  relations:
    readonly RepositorySemanticRelation[],
): ReadonlySet<string> {
  const related =
    new Set<string>();

  for (const relation of relations) {
    related.add(
      relation.sourceComponentId,
    );

    related.add(
      relation.targetComponentId,
    );
  }

  return related;
}

function buildComponentMap(
  components:
    readonly RepositorySemanticComponent[],
): ReadonlyMap<
  string,
  RepositorySemanticComponent
> {
  return new Map(
    components.map(
      (component) => [
        component.componentId,
        component,
      ],
    ),
  );
}

function detectOrphanComponents(
  components:
    readonly RepositorySemanticComponent[],
  relatedComponentIds:
    ReadonlySet<string>,
): FindingDraft[] {
  const findings:
    FindingDraft[] = [];

  if (components.length <= 1) {
    return findings;
  }

  for (const component of components) {
    if (
      relatedComponentIds.has(
        component.componentId,
      )
    ) {
      continue;
    }

    findings.push({
      type:
        "ORPHAN_COMPONENT",

      severity:
        "HIGH",

      title:
        "Component has no observed semantic relations",

      description:
        `The component ${component.path} is not connected to any other classified component through the supplied semantic relations.`,

      domain:
        component.domain,

      componentIds:
        Object.freeze([
          component.componentId,
        ]),

      evidenceIds:
        component.evidenceIds,

      epistemicState:
        "FACT",

      recommendation:
        "Verify whether the component is intentionally isolated, missing integration evidence or no longer required.",
    });
  }

  return findings;
}

function detectAmbiguousComponents(
  components:
    readonly RepositorySemanticComponent[],
): FindingDraft[] {
  const findings:
    FindingDraft[] = [];

  for (const component of components) {
    if (
      component.status ===
      "AMBIGUOUS"
    ) {
      findings.push({
        type:
          "AMBIGUOUS_COMPONENT",

        severity:
          "MEDIUM",

        title:
          "Component responsibility is ambiguous",

        description:
          `The component ${component.path} does not have a sufficiently precise semantic classification.`,

        domain:
          component.domain,

        componentIds:
          Object.freeze([
            component.componentId,
          ]),

        evidenceIds:
          component.evidenceIds,

        epistemicState:
          "INFERENCE",

        recommendation:
          "Supply direct implementation, test or documentation evidence clarifying the component responsibility.",
      });
    }

    if (
      component.status ===
      "NOT_VERIFIABLE"
    ) {
      findings.push({
        type:
          "UNVERIFIABLE_COMPONENT",

        severity:
          "HIGH",

        title:
          "Component responsibility is not verifiable",

        description:
          `The responsibility of ${component.path} cannot be established from the available evidence.`,

        domain:
          component.domain,

        componentIds:
          Object.freeze([
            component.componentId,
          ]),

        evidenceIds:
          component.evidenceIds,

        epistemicState:
          "NOT_VERIFIABLE",

        recommendation:
          "Inspect the component and provide direct evidence before using it in architectural decisions.",
      });
    }
  }

  return findings;
}

function detectLowConfidenceComponents(
  components:
    readonly RepositorySemanticComponent[],
): FindingDraft[] {
  return components
    .filter(
      (component) =>
        component.confidence > 0 &&
        component.confidence < 50,
    )
    .map(
      (component) => ({
        type:
          "LOW_CONFIDENCE_COMPONENT" as const,

        severity:
          "LOW" as const,

        title:
          "Component classification has low confidence",

        description:
          `The semantic classification of ${component.path} has confidence ${component.confidence}.`,

        domain:
          component.domain,

        componentIds:
          Object.freeze([
            component.componentId,
          ]),

        evidenceIds:
          component.evidenceIds,

        epistemicState:
          "INFERENCE" as const,

        recommendation:
          "Provide additional direct evidence to strengthen the semantic classification.",
      }),
    );
}

function detectDuplicatedResponsibilities(
  components:
    readonly RepositorySemanticComponent[],
): FindingDraft[] {
  const grouped =
    new Map<
      string,
      RepositorySemanticComponent[]
    >();

  for (const component of components) {
    const responsibility =
      normalizeResponsibility(
        component.primaryResponsibility,
      );

    if (!responsibility) {
      continue;
    }

    const key =
      `${component.domain}:${responsibility}`;

    const current =
      grouped.get(key) ?? [];

    current.push(component);

    grouped.set(
      key,
      current,
    );
  }

  const findings:
    FindingDraft[] = [];

  for (const group of grouped.values()) {
    if (group.length < 2) {
      continue;
    }

    findings.push({
      type:
        "DUPLICATED_PRIMARY_RESPONSIBILITY",

      severity:
        "MEDIUM",

      title:
        "Possible duplicated primary responsibility",

      description:
        `Multiple components in domain ${group[0]?.domain ?? "UNKNOWN"} declare the same primary responsibility.`,

      domain:
        group[0]?.domain ??
        "UNKNOWN",

      componentIds:
        Object.freeze(
          group
            .map(
              (component) =>
                component.componentId,
            )
            .sort(),
        ),

      evidenceIds:
        Object.freeze(
          [
            ...new Set(
              group.flatMap(
                (component) =>
                  component.evidenceIds,
              ),
            ),
          ].sort(),
        ),

      epistemicState:
        "INFERENCE",

      recommendation:
        "Review whether the responsibility should be consolidated, divided more precisely or intentionally shared.",
    });
  }

  return findings;
}

function detectCapabilityFindings(
  capabilities:
    readonly RepositorySemanticCapability[],
  relatedComponentIds:
    ReadonlySet<string>,
): FindingDraft[] {
  const findings:
    FindingDraft[] = [];

  for (const capability of capabilities) {
    if (
      capability.state ===
      "DECLARED"
    ) {
      findings.push({
        type:
          "DECLARED_CAPABILITY_ONLY",

        severity:
          "MEDIUM",

        title:
          "Capability is declared but not implemented",

        description:
          `The capability ${capability.name} is supported only by declaration or documentation evidence.`,

        domain:
          capability.domain,

        componentIds:
          capability.componentIds,

        evidenceIds:
          capability.evidenceIds,

        epistemicState:
          capability.epistemicState,

        recommendation:
          "Provide implementation and verification evidence before treating the capability as operational.",
      });
    }

    if (
      capability.state ===
      "NOT_VERIFIABLE"
    ) {
      findings.push({
        type:
          "UNVERIFIABLE_CAPABILITY",

        severity:
          "HIGH",

        title:
          "Capability state is not verifiable",

        description:
          `The capability ${capability.name} cannot be verified from the supplied evidence.`,

        domain:
          capability.domain,

        componentIds:
          capability.componentIds,

        evidenceIds:
          capability.evidenceIds,

        epistemicState:
          "NOT_VERIFIABLE",

        recommendation:
          "Supply direct code, endpoint, integration or test evidence for the capability.",
      });
    }

    const isIsolated =
      capability.componentIds.length > 0 &&
      capability.componentIds.every(
        (componentId) =>
          !relatedComponentIds.has(
            componentId,
          ),
      );

    if (isIsolated) {
      findings.push({
        type:
          "ISOLATED_CAPABILITY",

        severity:
          capability.state ===
          "VERIFIED"
            ? "MEDIUM"
            : "HIGH",

        title:
          "Capability is not connected to observed semantic relations",

        description:
          `The capability ${capability.name} is associated only with components that have no observed semantic integration.`,

        domain:
          capability.domain,

        componentIds:
          capability.componentIds,

        evidenceIds:
          capability.evidenceIds,

        epistemicState:
          "INFERENCE",

        recommendation:
          "Verify the capability integration path through runtime, API, service or user-interface components.",
      });
    }
  }

  return findings;
}

function detectDomainsWithoutRelations(
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
): FindingDraft[] {
  const domains =
    new Map<
      RepositorySemanticDomain,
      RepositorySemanticComponent[]
    >();

  for (const component of components) {
    const current =
      domains.get(
        component.domain,
      ) ?? [];

    current.push(component);

    domains.set(
      component.domain,
      current,
    );
  }

  const componentMap =
    buildComponentMap(
      components,
    );

  const relatedDomains =
    new Set<RepositorySemanticDomain>();

  for (const relation of relations) {
    const source =
      componentMap.get(
        relation.sourceComponentId,
      );

    const target =
      componentMap.get(
        relation.targetComponentId,
      );

    if (source) {
      relatedDomains.add(
        source.domain,
      );
    }

    if (target) {
      relatedDomains.add(
        target.domain,
      );
    }
  }

  const findings:
    FindingDraft[] = [];

  for (
    const [
      domain,
      domainComponents,
    ]
    of domains
  ) {
    if (
      domainComponents.length < 2 ||
      relatedDomains.has(domain)
    ) {
      continue;
    }

    findings.push({
      type:
        "DOMAIN_WITHOUT_RELATIONS",

      severity:
        "MEDIUM",

      title:
        "Semantic domain has no observed internal relations",

      description:
        `The domain ${domain} contains multiple components but no semantic relations were observed.`,

      domain,

      componentIds:
        Object.freeze(
          domainComponents
            .map(
              (component) =>
                component.componentId,
            )
            .sort(),
        ),

      evidenceIds:
        Object.freeze(
          [
            ...new Set(
              domainComponents.flatMap(
                (component) =>
                  component.evidenceIds,
              ),
            ),
          ].sort(),
        ),

      epistemicState:
        "INFERENCE",

      recommendation:
        "Inspect imports, exports and runtime interactions to determine whether domain relations are missing or genuinely absent.",
    });
  }

  return findings;
}

function detectApiWithoutRuntimeRelation(
  components:
    readonly RepositorySemanticComponent[],
  relations:
    readonly RepositorySemanticRelation[],
): FindingDraft[] {
  const componentMap =
    buildComponentMap(
      components,
    );

  const runtimeRelatedApiIds =
    new Set<string>();

  for (const relation of relations) {
    const source =
      componentMap.get(
        relation.sourceComponentId,
      );

    const target =
      componentMap.get(
        relation.targetComponentId,
      );

    if (!source || !target) {
      continue;
    }

    if (
      source.domain === "API" &&
      target.domain === "RUNTIME"
    ) {
      runtimeRelatedApiIds.add(
        source.componentId,
      );
    }

    if (
      target.domain === "API" &&
      source.domain === "RUNTIME"
    ) {
      runtimeRelatedApiIds.add(
        target.componentId,
      );
    }
  }

  return components
    .filter(
      (component) =>
        component.domain ===
          "API" &&
        !runtimeRelatedApiIds.has(
          component.componentId,
        ),
    )
    .map(
      (component) => ({
        type:
          "API_WITHOUT_RUNTIME_RELATION" as const,

        severity:
          "MEDIUM" as const,

        title:
          "API component has no observed runtime relation",

        description:
          `The API component ${component.path} is not connected to a runtime component in the current semantic relation set.`,

        domain:
          "API" as const,

        componentIds:
          Object.freeze([
            component.componentId,
          ]),

        evidenceIds:
          component.evidenceIds,

        epistemicState:
          "INFERENCE" as const,

        recommendation:
          "Verify whether the API route delegates to a governed runtime service and provide relation evidence.",
      }),
    );
}

function sortFindingDrafts(
  drafts:
    readonly FindingDraft[],
): FindingDraft[] {
  const severityWeight:
    Record<
      RepositorySemanticSeverity,
      number
    > = {
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
    };

  return [...drafts].sort(
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
      left.type.localeCompare(
        right.type,
      ) ||
      left.title.localeCompare(
        right.title,
      ) ||
      left.componentIds
        .join(":")
        .localeCompare(
          right.componentIds.join(
            ":",
          ),
        ),
  );
}

function finalizeFindings(
  drafts:
    readonly FindingDraft[],
): readonly RepositoryFindingEngineFinding[] {
  return Object.freeze(
    sortFindingDrafts(
      drafts,
    ).map(
      (
        draft,
        index,
      ) =>
        Object.freeze({
          findingId:
            `SEM-FINDING-${String(index + 1).padStart(3, "0")}`,

          type:
            draft.type,

          severity:
            draft.severity,

          title:
            draft.title,

          description:
            draft.description,

          domain:
            draft.domain,

          componentIds:
            Object.freeze([
              ...draft.componentIds,
            ]),

          evidenceIds:
            Object.freeze([
              ...draft.evidenceIds,
            ]),

          epistemicState:
            draft.epistemicState,

          recommendation:
            draft.recommendation,

          humanAuthorizationRequired:
            true,
        }),
    ),
  );
}

function buildSummary(
  findings:
    readonly RepositoryFindingEngineFinding[],
): RepositoryFindingEngineSummary {
  const countSeverity = (
    severity:
      RepositorySemanticSeverity,
  ): number =>
    findings.filter(
      (finding) =>
        finding.severity ===
        severity,
    ).length;

  const countType = (
    type:
      RepositoryFindingType,
  ): number =>
    findings.filter(
      (finding) =>
        finding.type === type,
    ).length;

  return Object.freeze({
    totalFindings:
      findings.length,

    infoFindings:
      countSeverity("INFO"),

    lowFindings:
      countSeverity("LOW"),

    mediumFindings:
      countSeverity("MEDIUM"),

    highFindings:
      countSeverity("HIGH"),

    criticalFindings:
      countSeverity("CRITICAL"),

    orphanComponents:
      countType(
        "ORPHAN_COMPONENT",
      ),

    ambiguousComponents:
      countType(
        "AMBIGUOUS_COMPONENT",
      ),

    unverifiableComponents:
      countType(
        "UNVERIFIABLE_COMPONENT",
      ),

    duplicatedResponsibilities:
      countType(
        "DUPLICATED_PRIMARY_RESPONSIBILITY",
      ),

    declaredOnlyCapabilities:
      countType(
        "DECLARED_CAPABILITY_ONLY",
      ),

    unverifiableCapabilities:
      countType(
        "UNVERIFIABLE_CAPABILITY",
      ),

    isolatedCapabilities:
      countType(
        "ISOLATED_CAPABILITY",
      ),

    blockingFindings:
      findings.filter(
        (finding) =>
          finding.severity ===
            "CRITICAL" ||
          finding.severity ===
            "HIGH",
      ).length,
  });
}

/**
 * Derives deterministic semantic findings from the current MOD-002
 * component, capability and relation state.
 *
 * Findings are diagnostic only. No finding is executed automatically.
 */
export function buildRepositoryFindings(
  input:
    RepositoryFindingEngineInput,
): RepositoryFindingEngineOutput {
  validateInput(input);

  const relatedComponentIds =
    buildRelationComponentSet(
      input.relations,
    );

  const drafts:
    FindingDraft[] = [
    ...detectOrphanComponents(
      input.components,
      relatedComponentIds,
    ),

    ...detectAmbiguousComponents(
      input.components,
    ),

    ...detectLowConfidenceComponents(
      input.components,
    ),

    ...detectDuplicatedResponsibilities(
      input.components,
    ),

    ...detectCapabilityFindings(
      input.capabilities,
      relatedComponentIds,
    ),

    ...detectDomainsWithoutRelations(
      input.components,
      input.relations,
    ),

    ...detectApiWithoutRuntimeRelation(
      input.components,
      input.relations,
    ),
  ];

  const findings =
    finalizeFindings(
      drafts,
    );

  return Object.freeze({
    revision:
      REPOSITORY_FINDING_ENGINE_REVISION,

    findings,

    summary:
      buildSummary(
        findings,
      ),

    governance:
      Object.freeze({
        deterministic:
          true,

        evidenceBased:
          true,

        failClosed:
          true,

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

export const REPOSITORY_FINDING_ENGINE_BOUNDARY =
  Object.freeze({
    explicitComponentsRequired:
      true,

    explicitCapabilitiesRequired:
      true,

    explicitRelationsRequired:
      true,

    orphanDetection:
      true,

    ambiguousComponentDetection:
      true,

    unverifiableComponentDetection:
      true,

    duplicatedResponsibilityDetection:
      true,

    declaredCapabilityDetection:
      true,

    unverifiableCapabilityDetection:
      true,

    isolatedCapabilityDetection:
      true,

    apiRuntimeBoundaryDetection:
      true,

    deterministic:
      true,

    evidenceBased:
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
