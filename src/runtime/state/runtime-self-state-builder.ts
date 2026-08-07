/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Self State Builder
 *
 * Builds a governed RuntimeSelfState from real runtime evidence.
 *
 * Boundaries:
 * - deterministic;
 * - read-only;
 * - fail-closed;
 * - no automatic persistence;
 * - no automatic recall;
 * - no automatic repository mutation;
 * - no legal certification.
 */

export interface RuntimeRepositorySnapshot {
  readonly repository: string;
  readonly branch: string;
  readonly commit: string;
  readonly fileCount: number;
  readonly directoryCount: number;
  readonly inspectedFileCount: number;
  readonly buildPassed: boolean;
  readonly testsPassed: boolean;
}

export interface RuntimeRepositoryEvolution {
  readonly enabled: boolean;
  readonly addedFiles: number;
  readonly removedFiles: number;
  readonly modifiedFiles: number;
  readonly unchangedFiles: number;
}

export interface RuntimeIntegrationState {
  readonly available: boolean;
  readonly plannerAvailable: boolean;
  readonly validatorAvailable: boolean;
  readonly operatorAuthorized: boolean;
}

export interface RuntimeKnowledgeState {
  readonly available: boolean;
  readonly operatorAuthorized: boolean;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
}

export interface RuntimeCapability {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly status:
    | "OPERATIONAL"
    | "DEGRADED"
    | "BLOCKED";
  readonly evidence?: readonly string[];
}

export interface RuntimeCapabilityRegistry {
  readonly revision: string;
  readonly capabilities: readonly RuntimeCapability[];
  readonly capabilityIds: readonly string[];
  readonly totalCapabilities: number;
  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
  readonly automaticDiscovery: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly legalCertification: false;
}

export interface RuntimeCapabilityGap {
  readonly id: string;
  readonly capabilityId?: string;
  readonly description: string;
  readonly severity?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
}

export interface RuntimeCapabilityRecommendation {
  readonly id: string;
  readonly capabilityId?: string;
  readonly description: string;
}

export interface RuntimeCapabilityAnalysis {
  readonly revision: string;
  readonly totalCapabilities: number;
  readonly averageScore: number;
  readonly operationalCapabilities: number;
  readonly degradedCapabilities: number;
  readonly blockedCapabilities: number;
  readonly gaps: readonly RuntimeCapabilityGap[];
  readonly recommendations:
    readonly RuntimeCapabilityRecommendation[];
  readonly operationalStatus:
    | "OPERATIONAL"
    | "DEGRADED"
    | "BLOCKED";
  readonly legalCertification: false;
}

export interface RuntimeSelfState {
  readonly revision: string;
  readonly generatedAt: string;
  readonly runtimeVersion: string;

  readonly repository:
    RuntimeRepositorySnapshot;

  readonly evolution:
    RuntimeRepositoryEvolution;

  readonly integration:
    RuntimeIntegrationState;

  readonly knowledge:
    RuntimeKnowledgeState;

  readonly capabilities:
    readonly RuntimeCapability[];

  readonly capabilityRegistry:
    RuntimeCapabilityRegistry;

  readonly capabilityAnalysis:
    RuntimeCapabilityAnalysis;

  readonly operationalStatus:
    | "OPERATIONAL"
    | "DEGRADED"
    | "BLOCKED";

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly legalCertification: false;
}

export interface RuntimeSelfStateBuilderInput {
  readonly generatedAt: string;
  readonly runtimeVersion: string;

  readonly repository:
    RuntimeRepositorySnapshot;

  readonly evolution:
    RuntimeRepositoryEvolution;

  readonly integration:
    RuntimeIntegrationState;

  readonly knowledgeAvailable: boolean;

  readonly capabilities:
    readonly RuntimeCapability[];

  readonly capabilityGaps?:
    readonly RuntimeCapabilityGap[];

  readonly capabilityRecommendations?:
    readonly RuntimeCapabilityRecommendation[];

  readonly operatorAuthorized: boolean;
}

function assertFiniteNonNegativeInteger(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      `RUNTIME_SELF_STATE_BUILDER_INVALID_${fieldName}`,
    );
  }
}

function assertScore(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `RUNTIME_SELF_STATE_BUILDER_INVALID_${fieldName}`,
    );
  }
}

function assertIsoTimestamp(
  value: string,
): void {
  const parsed =
    Date.parse(value);

  if (
    !value ||
    Number.isNaN(parsed)
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_INVALID_GENERATED_AT",
    );
  }
}

function assertRepositorySnapshot(
  repository:
    RuntimeRepositorySnapshot,
): void {
  if (
    !repository.repository.trim()
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_REPOSITORY_REQUIRED",
    );
  }

  if (
    !repository.branch.trim()
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_BRANCH_REQUIRED",
    );
  }

  if (
    !repository.commit.trim()
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_COMMIT_REQUIRED",
    );
  }

  assertFiniteNonNegativeInteger(
    repository.fileCount,
    "FILE_COUNT",
  );

  assertFiniteNonNegativeInteger(
    repository.directoryCount,
    "DIRECTORY_COUNT",
  );

  assertFiniteNonNegativeInteger(
    repository.inspectedFileCount,
    "INSPECTED_FILE_COUNT",
  );

  if (
    repository.inspectedFileCount >
    repository.fileCount
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_INSPECTED_FILES_EXCEED_TOTAL",
    );
  }
}

function assertEvolution(
  evolution:
    RuntimeRepositoryEvolution,
): void {
  assertFiniteNonNegativeInteger(
    evolution.addedFiles,
    "ADDED_FILES",
  );

  assertFiniteNonNegativeInteger(
    evolution.removedFiles,
    "REMOVED_FILES",
  );

  assertFiniteNonNegativeInteger(
    evolution.modifiedFiles,
    "MODIFIED_FILES",
  );

  assertFiniteNonNegativeInteger(
    evolution.unchangedFiles,
    "UNCHANGED_FILES",
  );
}

function normalizeCapabilities(
  capabilities:
    readonly RuntimeCapability[],
): readonly RuntimeCapability[] {
  const seen =
    new Set<string>();

  const normalized =
    capabilities.map(
      (
        capability,
      ) => {
        const id =
          capability.id.trim();

        const name =
          capability.name.trim();

        if (!id) {
          throw new Error(
            "RUNTIME_SELF_STATE_BUILDER_CAPABILITY_ID_REQUIRED",
          );
        }

        if (!name) {
          throw new Error(
            "RUNTIME_SELF_STATE_BUILDER_CAPABILITY_NAME_REQUIRED",
          );
        }

        if (
          seen.has(id)
        ) {
          throw new Error(
            "RUNTIME_SELF_STATE_BUILDER_DUPLICATE_CAPABILITY_ID",
          );
        }

        seen.add(id);

        assertScore(
          capability.score,
          "CAPABILITY_SCORE",
        );

        return {
          ...capability,
          id,
          name,
          evidence:
            capability.evidence
              ? [...capability.evidence]
              : [],
        };
      },
    );

  return normalized;
}

function calculateCapabilityAnalysis(
  capabilities:
    readonly RuntimeCapability[],
  gaps:
    readonly RuntimeCapabilityGap[],
  recommendations:
    readonly RuntimeCapabilityRecommendation[],
): RuntimeCapabilityAnalysis {
  const totalCapabilities =
    capabilities.length;

  const operationalCapabilities =
    capabilities.filter(
      (capability) =>
        capability.status ===
        "OPERATIONAL",
    ).length;

  const degradedCapabilities =
    capabilities.filter(
      (capability) =>
        capability.status ===
        "DEGRADED",
    ).length;

  const blockedCapabilities =
    capabilities.filter(
      (capability) =>
        capability.status ===
        "BLOCKED",
    ).length;

  const averageScore =
    totalCapabilities === 0
      ? 0
      : Math.round(
          capabilities.reduce(
            (
              total,
              capability,
            ) =>
              total +
              capability.score,
            0,
          ) /
            totalCapabilities,
        );

  const operationalStatus:
    RuntimeCapabilityAnalysis["operationalStatus"] =
    blockedCapabilities > 0
      ? "BLOCKED"
      : degradedCapabilities > 0
        ? "DEGRADED"
        : totalCapabilities > 0
          ? "OPERATIONAL"
          : "BLOCKED";

  return {
    revision:
      "AIJC2-RUNTIME-CAPABILITY-ANALYSIS-v1_0",

    totalCapabilities,

    averageScore,

    operationalCapabilities,

    degradedCapabilities,

    blockedCapabilities,

    gaps:
      [...gaps],

    recommendations:
      [...recommendations],

    operationalStatus,

    legalCertification:
      false,
  };
}

function calculateOperationalStatus(
  repository:
    RuntimeRepositorySnapshot,
  capabilityAnalysis:
    RuntimeCapabilityAnalysis,
): RuntimeSelfState["operationalStatus"] {
  if (
    !repository.buildPassed ||
    !repository.testsPassed ||
    capabilityAnalysis.operationalStatus ===
      "BLOCKED"
  ) {
    return "BLOCKED";
  }

  if (
    capabilityAnalysis.operationalStatus ===
    "DEGRADED"
  ) {
    return "DEGRADED";
  }

  return "OPERATIONAL";
}

export function buildRuntimeSelfState(
  input:
    RuntimeSelfStateBuilderInput,
): RuntimeSelfState {
  assertIsoTimestamp(
    input.generatedAt,
  );

  if (
    !input.runtimeVersion.trim()
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_RUNTIME_VERSION_REQUIRED",
    );
  }

  if (
    !input.operatorAuthorized
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_OPERATOR_AUTHORIZATION_REQUIRED",
    );
  }

  assertRepositorySnapshot(
    input.repository,
  );

  assertEvolution(
    input.evolution,
  );

  if (
    input.integration.operatorAuthorized !==
    true
  ) {
    throw new Error(
      "RUNTIME_SELF_STATE_BUILDER_INTEGRATION_AUTHORIZATION_REQUIRED",
    );
  }

  const capabilities =
    normalizeCapabilities(
      input.capabilities,
    );

  const capabilityRegistry:
    RuntimeCapabilityRegistry = {
    revision:
      "AIJC2-RUNTIME-CAPABILITY-REGISTRY-v1_0",

    capabilities,

    capabilityIds:
      capabilities.map(
        (capability) =>
          capability.id,
      ),

    totalCapabilities:
      capabilities.length,

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    automaticDiscovery:
      false,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,
  };

  const capabilityAnalysis =
    calculateCapabilityAnalysis(
      capabilities,
      input.capabilityGaps ??
        [],
      input.capabilityRecommendations ??
        [],
    );

  const operationalStatus =
    calculateOperationalStatus(
      input.repository,
      capabilityAnalysis,
    );

  return {
    revision:
      "AIJC2-RUNTIME-SELF-STATE-BUILDER-v1_0",

    generatedAt:
      input.generatedAt,

    runtimeVersion:
      input.runtimeVersion,

    repository: {
      ...input.repository,
    },

    evolution: {
      ...input.evolution,
    },

    integration: {
      ...input.integration,
      operatorAuthorized:
        true,
    },

    knowledge: {
      available:
        input.knowledgeAvailable,

      operatorAuthorized:
        true,

      automaticPersistence:
        false,

      automaticRecall:
        false,
    },

    capabilities,

    capabilityRegistry,

    capabilityAnalysis,

    operationalStatus,

    operatorAuthorized:
      true,

    humanAuthorizationRequired:
      true,

    automaticPersistence:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,
  };
}
