/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Self Service
 *
 * Builds a governed, deterministic projection of the runtime state.
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Discovery: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import {
  analyzeRuntimeCapabilities,
  createRuntimeCapabilityRegistry,
  type RuntimeCapability,
  type RuntimeCapabilityAnalysis,
  type RuntimeCapabilityRegistry,
} from "./runtime-capability-registry";

export type RuntimeSelfOperationalStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export interface RuntimeRepositoryProjection {
  readonly repository: string;
  readonly branch: string;
  readonly commit: string;

  readonly fileCount: number;
  readonly directoryCount: number;
  readonly inspectedFileCount: number;

  readonly buildPassed?: boolean;
  readonly testsPassed?: boolean;
}

export interface RuntimeEvolutionProjection {
  readonly enabled: boolean;

  readonly previousCommit?: string;
  readonly currentCommit?: string;

  readonly addedFiles: number;
  readonly removedFiles: number;
  readonly modifiedFiles: number;
  readonly unchangedFiles: number;

  readonly risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  readonly score?: number;
}

export interface RuntimeIntegrationProjection {
  readonly available: boolean;
  readonly plannerAvailable: boolean;
  readonly validatorAvailable: boolean;

  readonly activePlanId?: string;
  readonly activePlanStatus?: string;
  readonly operatorAuthorized: boolean;
}

export interface RuntimeKnowledgeProjection {
  readonly available: boolean;

  readonly activeCycleId?: string;
  readonly activeCycleStatus?: string;

  readonly operatorAuthorized: boolean;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
}

export interface RuntimeSelfState {
  readonly revision: string;
  readonly generatedAt: string;

  readonly runtimeId: "IPR-AI-0001";
  readonly runtimeName: "AI JOKER-C2";
  readonly runtimeVersion: string;

  readonly operationalStatus: RuntimeSelfOperationalStatus;

  readonly repository: RuntimeRepositoryProjection;
  readonly evolution: RuntimeEvolutionProjection;
  readonly integration: RuntimeIntegrationProjection;
  readonly knowledge: RuntimeKnowledgeProjection;

  readonly capabilityRegistry: RuntimeCapabilityRegistry;
  readonly capabilityAnalysis: RuntimeCapabilityAnalysis;

  readonly reasons: readonly string[];

  readonly humanAuthorizationRequired: true;
  readonly operatorAuthorized: boolean;

  readonly automaticDiscovery: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly automaticRepositoryMutation: false;
  readonly legalCertification: false;
}

export interface RuntimeSelfStateInput {
  readonly revision: string;
  readonly generatedAt: string;
  readonly runtimeVersion: string;

  readonly repository: RuntimeRepositoryProjection;
  readonly evolution: RuntimeEvolutionProjection;
  readonly integration: RuntimeIntegrationProjection;
  readonly knowledge: RuntimeKnowledgeProjection;

  readonly capabilities: readonly RuntimeCapability[];

  readonly operatorAuthorized: boolean;
}

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function requireNonNegativeInteger(
  value: number,
  code: string,
): number {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(code);
  }

  return value;
}

function normalizeRepositoryProjection(
  repository: RuntimeRepositoryProjection,
): Readonly<RuntimeRepositoryProjection> {
  return Object.freeze({
    repository: requireNonEmptyString(
      repository.repository,
      "RUNTIME_SELF_REPOSITORY_REQUIRED",
    ),

    branch: requireNonEmptyString(
      repository.branch,
      "RUNTIME_SELF_BRANCH_REQUIRED",
    ),

    commit: requireNonEmptyString(
      repository.commit,
      "RUNTIME_SELF_COMMIT_REQUIRED",
    ),

    fileCount: requireNonNegativeInteger(
      repository.fileCount,
      "RUNTIME_SELF_FILE_COUNT_INVALID",
    ),

    directoryCount: requireNonNegativeInteger(
      repository.directoryCount,
      "RUNTIME_SELF_DIRECTORY_COUNT_INVALID",
    ),

    inspectedFileCount: requireNonNegativeInteger(
      repository.inspectedFileCount,
      "RUNTIME_SELF_INSPECTED_FILE_COUNT_INVALID",
    ),

    buildPassed: repository.buildPassed,
    testsPassed: repository.testsPassed,
  });
}

function normalizeEvolutionProjection(
  evolution: RuntimeEvolutionProjection,
): Readonly<RuntimeEvolutionProjection> {
  if (
    evolution.enabled &&
    (
      !evolution.previousCommit?.trim() ||
      !evolution.currentCommit?.trim()
    )
  ) {
    throw new Error(
      "RUNTIME_SELF_EVOLUTION_COMMITS_REQUIRED",
    );
  }

  return Object.freeze({
    enabled: evolution.enabled === true,

    previousCommit:
      evolution.previousCommit?.trim(),

    currentCommit:
      evolution.currentCommit?.trim(),

    addedFiles: requireNonNegativeInteger(
      evolution.addedFiles,
      "RUNTIME_SELF_EVOLUTION_ADDED_INVALID",
    ),

    removedFiles: requireNonNegativeInteger(
      evolution.removedFiles,
      "RUNTIME_SELF_EVOLUTION_REMOVED_INVALID",
    ),

    modifiedFiles: requireNonNegativeInteger(
      evolution.modifiedFiles,
      "RUNTIME_SELF_EVOLUTION_MODIFIED_INVALID",
    ),

    unchangedFiles: requireNonNegativeInteger(
      evolution.unchangedFiles,
      "RUNTIME_SELF_EVOLUTION_UNCHANGED_INVALID",
    ),

    risk: evolution.risk,
    score: evolution.score,
  });
}

function determineOperationalStatus(
  input: RuntimeSelfStateInput,
  capabilityAnalysis: RuntimeCapabilityAnalysis,
): {
  readonly status: RuntimeSelfOperationalStatus;
  readonly reasons: readonly string[];
} {
  const reasons: string[] = [];

  if (!input.operatorAuthorized) {
    reasons.push(
      "Operator authorization is missing.",
    );

    return Object.freeze({
      status: "BLOCKED",
      reasons: Object.freeze(reasons),
    });
  }

  if (input.repository.buildPassed === false) {
    reasons.push(
      "Repository build evidence reports failure.",
    );
  }

  if (input.repository.testsPassed === false) {
    reasons.push(
      "Repository test evidence reports failure.",
    );
  }

  if (
    input.evolution.enabled &&
    (
      input.evolution.risk === "HIGH" ||
      input.evolution.risk === "CRITICAL"
    )
  ) {
    reasons.push(
      `Repository evolution risk is ${input.evolution.risk}.`,
    );
  }

  if (capabilityAnalysis.disabledCapabilities > 0) {
    reasons.push(
      `${capabilityAnalysis.disabledCapabilities} capability or capabilities are disabled.`,
    );
  }

  if (capabilityAnalysis.degradedCapabilities > 0) {
    reasons.push(
      `${capabilityAnalysis.degradedCapabilities} capability or capabilities are degraded.`,
    );
  }

  const hasCriticalGap =
    capabilityAnalysis.gaps.some(
      (gap) => gap.severity === "CRITICAL",
    );

  if (hasCriticalGap) {
    reasons.push(
      "At least one critical capability gap is present.",
    );
  }

  if (
    input.repository.buildPassed === false ||
    input.repository.testsPassed === false ||
    hasCriticalGap
  ) {
    return Object.freeze({
      status: "BLOCKED",
      reasons: Object.freeze(reasons),
    });
  }

  const hasHighGap =
    capabilityAnalysis.gaps.some(
      (gap) => gap.severity === "HIGH",
    );

  if (
    hasHighGap ||
    input.evolution.risk === "HIGH" ||
    input.evolution.risk === "CRITICAL"
  ) {
    return Object.freeze({
      status: "REVIEW_REQUIRED",
      reasons: Object.freeze(reasons),
    });
  }

  if (
    capabilityAnalysis.degradedCapabilities > 0 ||
    capabilityAnalysis.averageScore < 75
  ) {
    reasons.push(
      "Runtime capability posture is below the operational target.",
    );

    return Object.freeze({
      status: "DEGRADED",
      reasons: Object.freeze(reasons),
    });
  }

  reasons.push(
    "Runtime self-state satisfies the current governed operational gates.",
  );

  return Object.freeze({
    status: "OPERATIONAL",
    reasons: Object.freeze(reasons),
  });
}

export function createRuntimeSelfState(
  input: RuntimeSelfStateInput,
): Readonly<RuntimeSelfState> {
  const revision = requireNonEmptyString(
    input.revision,
    "RUNTIME_SELF_REVISION_REQUIRED",
  );

  const generatedAt = requireNonEmptyString(
    input.generatedAt,
    "RUNTIME_SELF_TIMESTAMP_REQUIRED",
  );

  const runtimeVersion = requireNonEmptyString(
    input.runtimeVersion,
    "RUNTIME_SELF_VERSION_REQUIRED",
  );

  const repository =
    normalizeRepositoryProjection(
      input.repository,
    );

  const evolution =
    normalizeEvolutionProjection(
      input.evolution,
    );

  const capabilityRegistry =
    createRuntimeCapabilityRegistry({
      revision:
        `${revision}-CAPABILITY-REGISTRY`,

      generatedAt,

      capabilities:
        input.capabilities,
    });

  const capabilityAnalysis =
    analyzeRuntimeCapabilities(
      capabilityRegistry,
    );

  const operational =
    determineOperationalStatus(
      input,
      capabilityAnalysis,
    );

  return Object.freeze({
    revision,
    generatedAt,

    runtimeId: "IPR-AI-0001",
    runtimeName: "AI JOKER-C2",
    runtimeVersion,

    operationalStatus:
      operational.status,

    repository,
    evolution,

    integration: Object.freeze({
      ...input.integration,

      available:
        input.integration.available === true,

      plannerAvailable:
        input.integration.plannerAvailable === true,

      validatorAvailable:
        input.integration.validatorAvailable === true,

      operatorAuthorized:
        input.integration.operatorAuthorized === true,
    }),

    knowledge: Object.freeze({
      ...input.knowledge,

      available:
        input.knowledge.available === true,

      operatorAuthorized:
        input.knowledge.operatorAuthorized === true,

      automaticPersistence: false,
      automaticRecall: false,
    }),

    capabilityRegistry,
    capabilityAnalysis,

    reasons:
      operational.reasons,

    humanAuthorizationRequired: true,
    operatorAuthorized:
      input.operatorAuthorized === true,

    automaticDiscovery: false,
    automaticPersistence: false,
    automaticRecall: false,
    automaticRepositoryMutation: false,
    legalCertification: false,
  });
}
