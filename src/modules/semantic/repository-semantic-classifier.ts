/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Deterministic Semantic Classifier
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-SEMANTIC-CLASSIFIER-v1_0
 *
 * Purpose:
 * - validate explicit semantic input;
 * - classify repository components into semantic domains;
 * - infer responsibilities only from supplied evidence;
 * - preserve epistemic separation;
 * - identify ambiguous and unverifiable components;
 * - produce no autonomous mutation.
 *
 * Explicit exclusions:
 * - no filesystem access;
 * - no GitHub API access;
 * - no source execution;
 * - no AST parsing;
 * - no automatic repository discovery;
 * - no persistent memory;
 * - no automatic recall;
 * - no commit, push, merge or deploy;
 * - legalCertification=false.
 */

import {
  REPOSITORY_SEMANTIC_INTELLIGENCE_TYPES_REVISION,
  REPOSITORY_SEMANTIC_MODULE_ID,
  REPOSITORY_SEMANTIC_MODULE_VERSION,
  normalizeRepositorySemanticConfidence,
  type RepositorySemanticComponent,
  type RepositorySemanticComponentInput,
  type RepositorySemanticComponentStatus,
  type RepositorySemanticDomain,
  type RepositorySemanticDomainMap,
  type RepositorySemanticEpistemicState,
  type RepositorySemanticEvidence,
  type RepositorySemanticFinding,
  type RepositorySemanticInput,
  type RepositorySemanticMatrixInterpretation,
  type RepositorySemanticOutput,
  type RepositorySemanticRecommendation,
  type RepositorySemanticSummary,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_SEMANTIC_CLASSIFIER_REVISION =
  "AIJC2-MOD002-REPOSITORY-SEMANTIC-CLASSIFIER-v1_0" as const;

export class RepositorySemanticClassifierError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);

    this.name =
      "RepositorySemanticClassifierError";

    this.code =
      code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new RepositorySemanticClassifierError(
      "MOD002_REQUIRED_STRING",
      `${fieldName} must be a string`,
    );
  }

  const normalized =
    value.trim();

  if (normalized.length === 0) {
    throw new RepositorySemanticClassifierError(
      "MOD002_REQUIRED_STRING",
      `${fieldName} must not be empty`,
    );
  }

  return normalized;
}

function normalizePath(
  value: string,
): string {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

function getFileName(
  path: string,
): string {
  const normalized =
    normalizePath(path);

  const segments =
    normalized.split("/");

  return (
    segments[
      segments.length - 1
    ] ??
    normalized
  );
}

function buildEvidenceMap(
  evidence:
    readonly RepositorySemanticEvidence[],
): ReadonlyMap<
  string,
  RepositorySemanticEvidence
> {
  const evidenceMap =
    new Map<
      string,
      RepositorySemanticEvidence
    >();

  for (
    const item
    of evidence
  ) {
    const evidenceId =
      normalizeRequiredString(
        item.evidenceId,
        "evidence.evidenceId",
      );

    if (
      evidenceMap.has(
        evidenceId,
      )
    ) {
      throw new RepositorySemanticClassifierError(
        "MOD002_DUPLICATE_EVIDENCE_ID",
        `Duplicate semantic evidence ID: ${evidenceId}`,
      );
    }

    evidenceMap.set(
      evidenceId,
      Object.freeze({
        ...item,

        evidenceId,

        sourceRef:
          normalizeRequiredString(
            item.sourceRef,
            "evidence.sourceRef",
          ),

        statement:
          normalizeRequiredString(
            item.statement,
            "evidence.statement",
          ),

        confidence:
          normalizeRepositorySemanticConfidence(
            item.confidence,
          ),
      }),
    );
  }

  return evidenceMap;
}

function validateInput(
  input: RepositorySemanticInput,
): void {
  if (
    input.legalCertification !==
    false
  ) {
    throw new RepositorySemanticClassifierError(
      "MOD002_LEGAL_BOUNDARY_VIOLATION",
      "Repository Semantic Intelligence requires legalCertification=false",
    );
  }

  normalizeRequiredString(
    input.identity.humanIpr,
    "identity.humanIpr",
  );

  normalizeRequiredString(
    input.identity.runtimeIpr,
    "identity.runtimeIpr",
  );

  normalizeRequiredString(
    input.identity.tenantId,
    "identity.tenantId",
  );

  normalizeRequiredString(
    input.identity.workspaceId,
    "identity.workspaceId",
  );

  normalizeRequiredString(
    input.identity.sessionId,
    "identity.sessionId",
  );

  normalizeRequiredString(
    input.repository.repositoryId,
    "repository.repositoryId",
  );

  normalizeRequiredString(
    input.repository.repositoryName,
    "repository.repositoryName",
  );

  normalizeRequiredString(
    input.repository.branch,
    "repository.branch",
  );

  normalizeRequiredString(
    input.repository.commitSha,
    "repository.commitSha",
  );

  normalizeRequiredString(
    input.mission,
    "mission",
  );

  normalizeRequiredString(
    input.idempotencyKey,
    "idempotencyKey",
  );

  if (
    !Array.isArray(
      input.components,
    )
  ) {
    throw new RepositorySemanticClassifierError(
      "MOD002_COMPONENTS_REQUIRED",
      "components must be an array",
    );
  }

  if (
    !Array.isArray(
      input.evidence,
    )
  ) {
    throw new RepositorySemanticClassifierError(
      "MOD002_EVIDENCE_REQUIRED",
      "evidence must be an array",
    );
  }

  const componentIds =
    new Set<string>();

  const componentPaths =
    new Set<string>();

  for (
    const component
    of input.components
  ) {
    const componentId =
      normalizeRequiredString(
        component.componentId,
        "component.componentId",
      );

    const path =
      normalizePath(
        normalizeRequiredString(
          component.path,
          "component.path",
        ),
      );

    normalizeRequiredString(
      component.name,
      "component.name",
    );

    if (
      componentIds.has(
        componentId,
      )
    ) {
      throw new RepositorySemanticClassifierError(
        "MOD002_DUPLICATE_COMPONENT_ID",
        `Duplicate semantic component ID: ${componentId}`,
      );
    }

    if (
      componentPaths.has(
        path,
      )
    ) {
      throw new RepositorySemanticClassifierError(
        "MOD002_DUPLICATE_COMPONENT_PATH",
        `Duplicate semantic component path: ${path}`,
      );
    }

    componentIds.add(
      componentId,
    );

    componentPaths.add(
      path,
    );
  }

  buildEvidenceMap(
    input.evidence,
  );
}

function classifyDomain(
  component:
    RepositorySemanticComponentInput,
): RepositorySemanticDomain {
  const path =
    normalizePath(
      component.path,
    ).toLowerCase();

  const name =
    component.name
      .trim()
      .toLowerCase();

  const combined =
    `${path} ${name}`;

  if (
    path.startsWith("app/api/") ||
    path.includes("/app/api/") ||
    path.startsWith("pages/api/") ||
    path.includes("/pages/api/")
  ) {
    return "API";
  }

  if (
    combined.includes("identity") ||
    combined.includes("ipr")
  ) {
    return "IDENTITY";
  }

  if (
    combined.includes("memory") ||
    combined.includes("recall")
  ) {
    return "MEMORY";
  }

  if (
    combined.includes("source-intelligence") ||
    combined.includes("source intelligence")
  ) {
    return "SOURCE_INTELLIGENCE";
  }

  if (
    path.startsWith("src/modules/") ||
    path.includes("/src/modules/") ||
    path.startsWith("modules/") ||
    path.includes("/modules/")
  ) {
    return "OPERATIONAL_MODULES";
  }

  if (
    path.startsWith("src/runtime/") ||
    path.includes("/src/runtime/") ||
    path.startsWith("runtime/") ||
    path.includes("/runtime/")
  ) {
    return "RUNTIME";
  }

  if (
    combined.includes("repository") ||
    combined.includes("database") ||
    combined.includes("persistence") ||
    combined.includes("migration") ||
    combined.includes("postgres")
  ) {
    return "PERSISTENCE";
  }

  if (
    combined.includes("auth") ||
    combined.includes("security") ||
    combined.includes("rate-limit") ||
    combined.includes("anti-abuse")
  ) {
    return "SECURITY";
  }

  if (
    combined.includes("opc") ||
    combined.includes("unebdo") ||
    combined.includes("matrix") ||
    combined.includes("governance") ||
    combined.includes("policy")
  ) {
    return "GOVERNANCE";
  }

  if (
    path.includes("/__tests__/") ||
    path.includes("/tests/") ||
    path.includes(".test.") ||
    path.includes(".spec.")
  ) {
    return "TESTING";
  }

  if (
    path.startsWith("docs/") ||
    path.includes("/docs/") ||
    path.endsWith(".md") ||
    path.endsWith(".mdx")
  ) {
    return "DOCUMENTATION";
  }

  if (
    path.startsWith(".github/") ||
    path.endsWith(".json") ||
    path.endsWith(".yaml") ||
    path.endsWith(".yml") ||
    path.endsWith(".toml") ||
    path.includes("config.")
  ) {
    return "CONFIGURATION";
  }

  if (
    path.startsWith("app/") ||
    path.startsWith("pages/") ||
    path.includes("/components/") ||
    path.includes("/interface/") ||
    path.includes("/ui/")
  ) {
    return "USER_INTERFACE";
  }

  if (
    combined.includes("evidence") ||
    combined.includes("receipt") ||
    combined.includes("audit")
  ) {
    return "EVIDENCE";
  }

  if (
    path.startsWith("src/") ||
    path.startsWith("lib/") ||
    path.includes("/src/") ||
    path.includes("/lib/")
  ) {
    return "APPLICATION";
  }

  return "UNKNOWN";
}

function selectEvidence(
  component:
    RepositorySemanticComponentInput,
  evidenceMap:
    ReadonlyMap<
      string,
      RepositorySemanticEvidence
    >,
): readonly RepositorySemanticEvidence[] {
  return Object.freeze(
    component.evidenceIds
      .map(
        (evidenceId) =>
          evidenceMap.get(
            evidenceId,
          ),
      )
      .filter(
        (
          evidence,
        ): evidence is RepositorySemanticEvidence =>
          evidence !== undefined,
      ),
  );
}

function calculateComponentConfidence(
  component:
    RepositorySemanticComponentInput,
  selectedEvidence:
    readonly RepositorySemanticEvidence[],
  domain:
    RepositorySemanticDomain,
): number {
  if (
    selectedEvidence.length === 0
  ) {
    return 0;
  }

  const evidenceAverage =
    selectedEvidence.reduce(
      (
        total,
        evidence,
      ) =>
        total +
        evidence.confidence,
      0,
    ) /
    selectedEvidence.length;

  let structuralBonus =
    0;

  if (
    component.summary &&
    component.summary.trim().length >
      0
  ) {
    structuralBonus +=
      10;
  }

  if (
    component.exports.length >
    0
  ) {
    structuralBonus +=
      5;
  }

  if (
    component.imports.length >
    0
  ) {
    structuralBonus +=
      5;
  }

  if (
    domain !== "UNKNOWN"
  ) {
    structuralBonus +=
      10;
  }

  return normalizeRepositorySemanticConfidence(
    evidenceAverage +
    structuralBonus,
  );
}

function inferResponsibility(
  component:
    RepositorySemanticComponentInput,
  domain:
    RepositorySemanticDomain,
  selectedEvidence:
    readonly RepositorySemanticEvidence[],
): {
  primaryResponsibility: string | null;
  secondaryResponsibilities:
    readonly string[];
  epistemicState:
    RepositorySemanticEpistemicState;
} {
  const summary =
    component.summary?.trim() ??
    "";

  if (
    summary.length > 0
  ) {
    return {
      primaryResponsibility:
        summary,

      secondaryResponsibilities:
        Object.freeze([]),

      epistemicState:
        selectedEvidence.length > 0
          ? "FACT"
          : "INFERENCE",
    };
  }

  if (
    selectedEvidence.length === 0
  ) {
    return {
      primaryResponsibility:
        null,

      secondaryResponsibilities:
        Object.freeze([]),

      epistemicState:
        "NOT_VERIFIABLE",
    };
  }

  const name =
    getFileName(
      component.path,
    );

  const responsibility =
    domain === "UNKNOWN"
      ? null
      : `Provide ${domain.toLowerCase().replaceAll("_", " ")} responsibility through ${name}.`;

  return {
    primaryResponsibility:
      responsibility,

    secondaryResponsibilities:
      Object.freeze([]),

    epistemicState:
      responsibility
        ? "INFERENCE"
        : "NOT_VERIFIABLE",
  };
}

function classifyStatus(
  domain:
    RepositorySemanticDomain,
  responsibility:
    string | null,
  evidenceCount: number,
): RepositorySemanticComponentStatus {
  if (
    evidenceCount === 0
  ) {
    return "NOT_VERIFIABLE";
  }

  if (
    domain === "UNKNOWN"
  ) {
    return "AMBIGUOUS";
  }

  if (!responsibility) {
    return "AMBIGUOUS";
  }

  return "CLASSIFIED";
}

function classifyComponent(
  component:
    RepositorySemanticComponentInput,
  evidenceMap:
    ReadonlyMap<
      string,
      RepositorySemanticEvidence
    >,
): RepositorySemanticComponent {
  const domain =
    classifyDomain(
      component,
    );

  const selectedEvidence =
    selectEvidence(
      component,
      evidenceMap,
    );

  const responsibility =
    inferResponsibility(
      component,
      domain,
      selectedEvidence,
    );

  const confidence =
    calculateComponentConfidence(
      component,
      selectedEvidence,
      domain,
    );

  const status =
    classifyStatus(
      domain,
      responsibility
        .primaryResponsibility,
      selectedEvidence.length,
    );

  return Object.freeze({
    componentId:
      component.componentId.trim(),

    path:
      normalizePath(
        component.path,
      ),

    name:
      component.name.trim(),

    domain,

    primaryResponsibility:
      responsibility
        .primaryResponsibility,

    secondaryResponsibilities:
      responsibility
        .secondaryResponsibilities,

    capabilityIds:
      Object.freeze([]),

    relationIds:
      Object.freeze([]),

    evidenceIds:
      Object.freeze([
        ...component.evidenceIds,
      ]),

    epistemicState:
      responsibility
        .epistemicState,

    confidence,

    status,
  });
}

function buildDomains(
  components:
    readonly RepositorySemanticComponent[],
): readonly RepositorySemanticDomainMap[] {
  const componentsByDomain =
    new Map<
      RepositorySemanticDomain,
      string[]
    >();

  for (
    const component
    of components
  ) {
    const current =
      componentsByDomain.get(
        component.domain,
      ) ??
      [];

    current.push(
      component.componentId,
    );

    componentsByDomain.set(
      component.domain,
      current,
    );
  }

  return Object.freeze(
    [...componentsByDomain.entries()]
      .sort(
        ([left], [right]) =>
          left.localeCompare(
            right,
          ),
      )
      .map(
        (
          [
            domain,
            componentIds,
          ],
          index,
        ) =>
          Object.freeze({
            domainId:
              `SEM-DOMAIN-${String(index + 1).padStart(3, "0")}`,

            name:
              domain,

            description:
              `Semantic domain containing components classified as ${domain}.`,

            componentIds:
              Object.freeze([
                ...componentIds,
              ]),

            capabilityIds:
              Object.freeze([]),

            relationIds:
              Object.freeze([]),

            findingIds:
              Object.freeze([]),
          }),
      ),
  );
}

function buildFindings(
  components:
    readonly RepositorySemanticComponent[],
): readonly RepositorySemanticFinding[] {
  const findings:
    RepositorySemanticFinding[] =
    [];

  const unverifiable =
    components.filter(
      (component) =>
        component.status ===
        "NOT_VERIFIABLE",
    );

  for (
    const component
    of unverifiable
  ) {
    findings.push({
      findingId:
        `SEM-FINDING-${String(findings.length + 1).padStart(3, "0")}`,

      severity:
        "HIGH",

      title:
        "Component responsibility is not verifiable",

      description:
        `The responsibility of ${component.path} cannot be determined from the supplied evidence.`,

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
        "Inspect the component and supply direct code, test or documentation evidence.",

      humanAuthorizationRequired:
        true,
    });
  }

  const ambiguous =
    components.filter(
      (component) =>
        component.status ===
        "AMBIGUOUS",
    );

  for (
    const component
    of ambiguous
  ) {
    findings.push({
      findingId:
        `SEM-FINDING-${String(findings.length + 1).padStart(3, "0")}`,

      severity:
        "MEDIUM",

      title:
        "Component semantic domain is ambiguous",

      description:
        `The component ${component.path} could not be assigned a sufficiently specific semantic responsibility.`,

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
        "Provide a component summary or additional evidence before architectural decisions are made.",

      humanAuthorizationRequired:
        true,
    });
  }

  return Object.freeze(
    findings.map(
      (finding) =>
        Object.freeze({
          ...finding,

          componentIds:
            Object.freeze([
              ...finding.componentIds,
            ]),

          evidenceIds:
            Object.freeze([
              ...finding.evidenceIds,
            ]),
        }),
    ),
  );
}

function selectRecommendation(
  findings:
    readonly RepositorySemanticFinding[],
): RepositorySemanticRecommendation | null {
  const ordered =
    [...findings].sort(
      (
        left,
        right,
      ) => {
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

        return (
          severityWeight[
            left.severity
          ] -
          severityWeight[
            right.severity
          ]
        );
      },
    );

  const first =
    ordered[0];

  if (!first) {
    return null;
  }

  return Object.freeze({
    recommendationId:
      "SEM-RECOMMENDATION-001",

    priority:
      1,

    title:
      first.title,

    description:
      first.recommendation ??
      first.description,

    targetComponentIds:
      first.componentIds,

    sourceFindingIds:
      Object.freeze([
        first.findingId,
      ]),

    executableAutomatically:
      false,

    humanAuthorizationRequired:
      true,
  });
}

function calculateAverageConfidence(
  components:
    readonly RepositorySemanticComponent[],
): number {
  if (
    components.length === 0
  ) {
    return 0;
  }

  return normalizeRepositorySemanticConfidence(
    components.reduce(
      (
        total,
        component,
      ) =>
        total +
        component.confidence,
      0,
    ) /
    components.length,
  );
}

function buildSummary(
  components:
    readonly RepositorySemanticComponent[],
  domains:
    readonly RepositorySemanticDomainMap[],
  findings:
    readonly RepositorySemanticFinding[],
): RepositorySemanticSummary {
  return Object.freeze({
    totalComponents:
      components.length,

    totalDomains:
      domains.length,

    totalCapabilities:
      0,

    totalRelations:
      0,

    totalFindings:
      findings.length,

    classifiedComponents:
      components.filter(
        (component) =>
          component.status ===
          "CLASSIFIED",
      ).length,

    orphanedComponents:
      0,

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
      ),
  });
}

function buildMatrixInterpretation(
  components:
    readonly RepositorySemanticComponent[],
  recommendation:
    RepositorySemanticRecommendation | null,
): RepositorySemanticMatrixInterpretation {
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

  return Object.freeze({
    verifiedCapabilities:
      Object.freeze([]),

    implementedCapabilities:
      Object.freeze([]),

    declaredCapabilities:
      Object.freeze([]),

    isolatedCapabilities:
      Object.freeze([]),

    ambiguousDomains,

    nextPriority:
      recommendation?.title ??
      null,
  });
}

/**
 * Executes the first deterministic semantic classification stage.
 *
 * This version classifies domains and responsibilities only.
 * Capabilities and semantic relations remain intentionally empty until
 * their dedicated engines and tests exist.
 */
export function classifyRepositorySemantics(
  input: RepositorySemanticInput,
): RepositorySemanticOutput {
  validateInput(
    input,
  );

  const evidenceMap =
    buildEvidenceMap(
      input.evidence,
    );

  const components =
    Object.freeze(
      input.components
        .map(
          (component) =>
            classifyComponent(
              component,
              evidenceMap,
            ),
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.path.localeCompare(
              right.path,
            ),
        ),
    );

  const domains =
    buildDomains(
      components,
    );

  const findings =
    buildFindings(
      components,
    );

  const recommendation =
    input.humanAuthorization
      ? selectRecommendation(
          findings,
        )
      : null;

  const hasBlockingFinding =
    findings.some(
      (finding) =>
        finding.severity ===
          "CRITICAL" ||
        finding.severity ===
          "HIGH",
    );

  const ok =
    input.humanAuthorization ===
      true &&
    !hasBlockingFinding;

  return Object.freeze({
    ok,

    status:
      ok
        ? "REPOSITORY_SEMANTIC_INTELLIGENCE_READY"
        : "REPOSITORY_SEMANTIC_INTELLIGENCE_FAIL_CLOSED",

    revision:
      REPOSITORY_SEMANTIC_INTELLIGENCE_TYPES_REVISION,

    moduleId:
      REPOSITORY_SEMANTIC_MODULE_ID,

    version:
      REPOSITORY_SEMANTIC_MODULE_VERSION,

    identity:
      Object.freeze({
        humanIpr:
          input.identity.humanIpr.trim(),

        runtimeIpr:
          input.identity.runtimeIpr.trim(),

        tenantId:
          input.identity.tenantId.trim(),

        workspaceId:
          input.identity.workspaceId.trim(),

        sessionId:
          input.identity.sessionId.trim(),
      }),

    repository:
      Object.freeze({
        repositoryId:
          input.repository.repositoryId.trim(),

        repositoryName:
          input.repository.repositoryName.trim(),

        branch:
          input.repository.branch.trim(),

        commitSha:
          input.repository.commitSha.trim(),
      }),

    mission:
      input.mission.trim(),

    summary:
      buildSummary(
        components,
        domains,
        findings,
      ),

    domains,

    components,

    capabilities:
      Object.freeze([]),

    relations:
      Object.freeze([]),

    findings,

    recommendation,

    matrixInterpretation:
      buildMatrixInterpretation(
        components,
        recommendation,
      ),

    governance:
      Object.freeze({
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

        humanAuthorizationVerified:
          input.humanAuthorization ===
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

    legalCertification:
      false,
  });
}

export const REPOSITORY_SEMANTIC_CLASSIFIER_BOUNDARY =
  Object.freeze({
    moduleId:
      REPOSITORY_SEMANTIC_MODULE_ID,

    classifierRevision:
      REPOSITORY_SEMANTIC_CLASSIFIER_REVISION,

    explicitInputRequired:
      true,

    explicitEvidenceRequired:
      true,

    deterministicClassification:
      true,

    responsibilityInference:
      true,

    capabilityClassification:
      false,

    semanticRelationConstruction:
      false,

    filesystemAccess:
      false,

    githubApiAccess:
      false,

    sourceExecution:
      false,

    astParsing:
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
