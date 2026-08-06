/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Self Architecture
 *
 * Governed Capability Registry
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

export type RuntimeCapabilityStatus =
  | "DECLARED"
  | "ACTIVE"
  | "DEGRADED"
  | "DISABLED"
  | "PLANNED";

export type RuntimeCapabilityEvidenceStatus =
  | "NOT_RUN"
  | "PASS"
  | "FAIL"
  | "PARTIAL"
  | "OPERATOR_DECLARED";

export type RuntimeCapabilityRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface RuntimeCapabilityEvidence {
  readonly id: string;
  readonly status: RuntimeCapabilityEvidenceStatus;
  readonly description: string;

  readonly sourceArtifact?: string;
  readonly sourceRevision?: string;
  readonly sourceCommit?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
}

export interface RuntimeCapabilityDependency {
  readonly capabilityId: string;
  readonly required: boolean;
  readonly reason: string;
}

export interface RuntimeCapability {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  readonly owner: string;
  readonly version: string;

  readonly status: RuntimeCapabilityStatus;

  /**
   * Deterministic capability score in the inclusive range 0..100.
   *
   * The registry does not calculate or alter this value.
   * It must be supplied by an authorized scoring process.
   */
  readonly score: number;

  readonly riskLevel: RuntimeCapabilityRiskLevel;

  readonly dependencies: readonly RuntimeCapabilityDependency[];
  readonly evidence: readonly RuntimeCapabilityEvidence[];

  readonly enabled: boolean;
  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
}

export interface RuntimeCapabilityRegistry {
  readonly revision: string;
  readonly generatedAt: string;

  readonly capabilities: readonly RuntimeCapability[];

  readonly automaticDiscovery: false;
  readonly automaticPersistence: false;
  readonly automaticRecall: false;
  readonly legalCertification: false;
}

export interface RuntimeCapabilityRegistryInput {
  readonly revision: string;
  readonly generatedAt: string;
  readonly capabilities: readonly RuntimeCapability[];
}

export interface RuntimeCapabilityLookupResult {
  readonly found: boolean;
  readonly capability?: RuntimeCapability;
}

export interface RuntimeCapabilityGap {
  readonly capabilityId: string;
  readonly capabilityName: string;

  readonly reason:
    | "MISSING_DEPENDENCY"
    | "LOW_SCORE"
    | "DEGRADED"
    | "DISABLED"
    | "PLANNED"
    | "FAILED_EVIDENCE";

  readonly description: string;
  readonly severity: RuntimeCapabilityRiskLevel;
}

export interface RuntimeCapabilityAnalysis {
  readonly totalCapabilities: number;
  readonly activeCapabilities: number;
  readonly degradedCapabilities: number;
  readonly disabledCapabilities: number;
  readonly plannedCapabilities: number;

  readonly averageScore: number;

  readonly gaps: readonly RuntimeCapabilityGap[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeString(value: string): string {
  return value.trim();
}

function normalizeScore(score: number): number {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("RUNTIME_CAPABILITY_SCORE_OUT_OF_RANGE");
  }

  return Math.trunc(score);
}

function compareCapabilities(
  left: RuntimeCapability,
  right: RuntimeCapability,
): number {
  return left.id.localeCompare(right.id);
}

function compareDependencies(
  left: RuntimeCapabilityDependency,
  right: RuntimeCapabilityDependency,
): number {
  return left.capabilityId.localeCompare(right.capabilityId);
}

function compareEvidence(
  left: RuntimeCapabilityEvidence,
  right: RuntimeCapabilityEvidence,
): number {
  return left.id.localeCompare(right.id);
}

function normalizeDependency(
  dependency: RuntimeCapabilityDependency,
): Readonly<RuntimeCapabilityDependency> {
  const capabilityId = normalizeString(dependency.capabilityId);
  const reason = normalizeString(dependency.reason);

  if (!isNonEmptyString(capabilityId)) {
    throw new Error("RUNTIME_CAPABILITY_DEPENDENCY_ID_REQUIRED");
  }

  if (!isNonEmptyString(reason)) {
    throw new Error(
      `RUNTIME_CAPABILITY_DEPENDENCY_REASON_REQUIRED:${capabilityId}`,
    );
  }

  return Object.freeze({
    capabilityId,
    required: dependency.required === true,
    reason,
  });
}

function normalizeEvidence(
  evidence: RuntimeCapabilityEvidence,
): Readonly<RuntimeCapabilityEvidence> {
  const id = normalizeString(evidence.id);
  const description = normalizeString(evidence.description);

  if (!isNonEmptyString(id)) {
    throw new Error("RUNTIME_CAPABILITY_EVIDENCE_ID_REQUIRED");
  }

  if (!isNonEmptyString(description)) {
    throw new Error(
      `RUNTIME_CAPABILITY_EVIDENCE_DESCRIPTION_REQUIRED:${id}`,
    );
  }

  return Object.freeze({
    id,
    status: evidence.status,
    description,
    sourceArtifact: evidence.sourceArtifact?.trim(),
    sourceRevision: evidence.sourceRevision?.trim(),
    sourceCommit: evidence.sourceCommit?.trim(),
    sourcePath: evidence.sourcePath?.trim(),
    sourceHash: evidence.sourceHash?.trim(),
  });
}

function normalizeCapability(
  capability: RuntimeCapability,
): Readonly<RuntimeCapability> {
  const id = normalizeString(capability.id);
  const name = normalizeString(capability.name);
  const description = normalizeString(capability.description);
  const owner = normalizeString(capability.owner);
  const version = normalizeString(capability.version);

  if (!isNonEmptyString(id)) {
    throw new Error("RUNTIME_CAPABILITY_ID_REQUIRED");
  }

  if (!isNonEmptyString(name)) {
    throw new Error(`RUNTIME_CAPABILITY_NAME_REQUIRED:${id}`);
  }

  if (!isNonEmptyString(description)) {
    throw new Error(`RUNTIME_CAPABILITY_DESCRIPTION_REQUIRED:${id}`);
  }

  if (!isNonEmptyString(owner)) {
    throw new Error(`RUNTIME_CAPABILITY_OWNER_REQUIRED:${id}`);
  }

  if (!isNonEmptyString(version)) {
    throw new Error(`RUNTIME_CAPABILITY_VERSION_REQUIRED:${id}`);
  }

  if (capability.humanAuthorizationRequired !== true) {
    throw new Error(
      `RUNTIME_CAPABILITY_HUMAN_AUTHORIZATION_INVARIANT_VIOLATION:${id}`,
    );
  }

  const dependencies = capability.dependencies
    .map(normalizeDependency)
    .sort(compareDependencies);

  const dependencyIds = dependencies.map(
    (dependency) => dependency.capabilityId,
  );

  if (new Set(dependencyIds).size !== dependencyIds.length) {
    throw new Error(`RUNTIME_CAPABILITY_DUPLICATE_DEPENDENCY:${id}`);
  }

  const evidence = capability.evidence
    .map(normalizeEvidence)
    .sort(compareEvidence);

  const evidenceIds = evidence.map((item) => item.id);

  if (new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error(`RUNTIME_CAPABILITY_DUPLICATE_EVIDENCE:${id}`);
  }

  return Object.freeze({
    id,
    name,
    description,
    owner,
    version,
    status: capability.status,
    score: normalizeScore(capability.score),
    riskLevel: capability.riskLevel,
    dependencies: Object.freeze(dependencies),
    evidence: Object.freeze(evidence),
    enabled: capability.enabled === true,
    operatorAuthorized: capability.operatorAuthorized === true,
    humanAuthorizationRequired: true,
  });
}

export function createRuntimeCapabilityRegistry(
  input: RuntimeCapabilityRegistryInput,
): Readonly<RuntimeCapabilityRegistry> {
  const revision = normalizeString(input.revision);
  const generatedAt = normalizeString(input.generatedAt);

  if (!isNonEmptyString(revision)) {
    throw new Error("RUNTIME_CAPABILITY_REGISTRY_REVISION_REQUIRED");
  }

  if (!isNonEmptyString(generatedAt)) {
    throw new Error("RUNTIME_CAPABILITY_REGISTRY_TIMESTAMP_REQUIRED");
  }

  const capabilities = input.capabilities
    .map(normalizeCapability)
    .sort(compareCapabilities);

  const capabilityIds = capabilities.map((capability) => capability.id);

  if (new Set(capabilityIds).size !== capabilityIds.length) {
    throw new Error("RUNTIME_CAPABILITY_REGISTRY_DUPLICATE_CAPABILITY");
  }

  const capabilityIdSet = new Set(capabilityIds);

  for (const capability of capabilities) {
    for (const dependency of capability.dependencies) {
      if (
        dependency.required &&
        !capabilityIdSet.has(dependency.capabilityId)
      ) {
        throw new Error(
          `RUNTIME_CAPABILITY_REQUIRED_DEPENDENCY_NOT_REGISTERED:${capability.id}:${dependency.capabilityId}`,
        );
      }

      if (dependency.capabilityId === capability.id) {
        throw new Error(
          `RUNTIME_CAPABILITY_SELF_DEPENDENCY:${capability.id}`,
        );
      }
    }
  }

  return Object.freeze({
    revision,
    generatedAt,
    capabilities: Object.freeze(capabilities),
    automaticDiscovery: false,
    automaticPersistence: false,
    automaticRecall: false,
    legalCertification: false,
  });
}

export function findRuntimeCapability(
  registry: RuntimeCapabilityRegistry,
  capabilityId: string,
): Readonly<RuntimeCapabilityLookupResult> {
  const normalizedCapabilityId = normalizeString(capabilityId);

  if (!isNonEmptyString(normalizedCapabilityId)) {
    throw new Error("RUNTIME_CAPABILITY_LOOKUP_ID_REQUIRED");
  }

  const capability = registry.capabilities.find(
    (candidate) => candidate.id === normalizedCapabilityId,
  );

  if (capability === undefined) {
    return Object.freeze({
      found: false,
    });
  }

  return Object.freeze({
    found: true,
    capability,
  });
}

function determineGapSeverity(
  capability: RuntimeCapability,
): RuntimeCapabilityRiskLevel {
  if (
    capability.status === "DISABLED" ||
    capability.score < 25
  ) {
    return "CRITICAL";
  }

  if (
    capability.status === "DEGRADED" ||
    capability.score < 50
  ) {
    return "HIGH";
  }

  if (
    capability.status === "PLANNED" ||
    capability.score < 75
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function analyzeRuntimeCapabilities(
  registry: RuntimeCapabilityRegistry,
): Readonly<RuntimeCapabilityAnalysis> {
  const gaps: RuntimeCapabilityGap[] = [];
  const capabilityById = new Map(
    registry.capabilities.map((capability) => [
      capability.id,
      capability,
    ]),
  );

  let activeCapabilities = 0;
  let degradedCapabilities = 0;
  let disabledCapabilities = 0;
  let plannedCapabilities = 0;
  let scoreTotal = 0;

  for (const capability of registry.capabilities) {
    scoreTotal += capability.score;

    if (capability.status === "ACTIVE") {
      activeCapabilities += 1;
    }

    if (capability.status === "DEGRADED") {
      degradedCapabilities += 1;

      gaps.push(
        Object.freeze({
          capabilityId: capability.id,
          capabilityName: capability.name,
          reason: "DEGRADED",
          description: "Capability is operating in a degraded state.",
          severity: determineGapSeverity(capability),
        }),
      );
    }

    if (capability.status === "DISABLED") {
      disabledCapabilities += 1;

      gaps.push(
        Object.freeze({
          capabilityId: capability.id,
          capabilityName: capability.name,
          reason: "DISABLED",
          description: "Capability is currently disabled.",
          severity: determineGapSeverity(capability),
        }),
      );
    }

    if (capability.status === "PLANNED") {
      plannedCapabilities += 1;

      gaps.push(
        Object.freeze({
          capabilityId: capability.id,
          capabilityName: capability.name,
          reason: "PLANNED",
          description: "Capability has been declared but is not operational.",
          severity: determineGapSeverity(capability),
        }),
      );
    }

    if (capability.score < 75) {
      gaps.push(
        Object.freeze({
          capabilityId: capability.id,
          capabilityName: capability.name,
          reason: "LOW_SCORE",
          description:
            `Capability score ${capability.score}/100 is below the operational threshold of 75.`,
          severity: determineGapSeverity(capability),
        }),
      );
    }

    const hasFailedEvidence = capability.evidence.some(
      (evidence) => evidence.status === "FAIL",
    );

    if (hasFailedEvidence) {
      gaps.push(
        Object.freeze({
          capabilityId: capability.id,
          capabilityName: capability.name,
          reason: "FAILED_EVIDENCE",
          description:
            "At least one registered capability evidence item has failed.",
          severity: "HIGH",
        }),
      );
    }

    for (const dependency of capability.dependencies) {
      if (!dependency.required) {
        continue;
      }

      const registeredDependency = capabilityById.get(
        dependency.capabilityId,
      );

      if (
        registeredDependency === undefined ||
        registeredDependency.status === "DISABLED" ||
        !registeredDependency.enabled
      ) {
        gaps.push(
          Object.freeze({
            capabilityId: capability.id,
            capabilityName: capability.name,
            reason: "MISSING_DEPENDENCY",
            description:
              `Required capability dependency ${dependency.capabilityId} is unavailable.`,
            severity: "CRITICAL",
          }),
        );
      }
    }
  }

  gaps.sort((left, right) => {
    const capabilityComparison = left.capabilityId.localeCompare(
      right.capabilityId,
    );

    if (capabilityComparison !== 0) {
      return capabilityComparison;
    }

    return left.reason.localeCompare(right.reason);
  });

  const totalCapabilities = registry.capabilities.length;

  const averageScore =
    totalCapabilities === 0
      ? 0
      : Math.trunc(scoreTotal / totalCapabilities);

  return Object.freeze({
    totalCapabilities,
    activeCapabilities,
    degradedCapabilities,
    disabledCapabilities,
    plannedCapabilities,
    averageScore,
    gaps: Object.freeze(gaps),
  });
}
