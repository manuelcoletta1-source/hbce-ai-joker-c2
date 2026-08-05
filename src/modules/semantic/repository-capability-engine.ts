/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Repository Capability Engine
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-CAPABILITY-ENGINE-v1_0
 *
 * Purpose:
 * - derive repository capabilities from explicit component evidence;
 * - distinguish declared, implemented, tested, exposed, integrated
 *   and verified capabilities;
 * - avoid capability claims unsupported by evidence;
 * - preserve epistemic separation and deterministic execution;
 * - produce no autonomous repository action.
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
  normalizeRepositorySemanticConfidence,
  type RepositorySemanticCapability,
  type RepositorySemanticCapabilityState,
  type RepositorySemanticComponent,
  type RepositorySemanticComponentInput,
  type RepositorySemanticDomain,
  type RepositorySemanticEpistemicState,
  type RepositorySemanticEvidence,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_CAPABILITY_ENGINE_REVISION =
  "AIJC2-MOD002-REPOSITORY-CAPABILITY-ENGINE-v1_0" as const;

export interface RepositoryCapabilityEngineInput {
  components:
    readonly RepositorySemanticComponent[];

  componentInputs:
    readonly RepositorySemanticComponentInput[];

  evidence:
    readonly RepositorySemanticEvidence[];
}

export interface RepositoryCapabilityEngineOutput {
  revision:
    typeof REPOSITORY_CAPABILITY_ENGINE_REVISION;

  capabilities:
    readonly RepositorySemanticCapability[];

  summary: {
    totalCapabilities: number;
    declaredCapabilities: number;
    implementedCapabilities: number;
    testedCapabilities: number;
    exposedCapabilities: number;
    integratedCapabilities: number;
    verifiedCapabilities: number;
    notVerifiableCapabilities: number;
  };

  governance: {
    deterministic: true;
    evidenceBased: true;
    sourceExecution: false;
    autonomousExecution: false;
    persistentMemoryCreated: false;
    automaticRecallUsed: false;
    humanAuthorizationRequired: true;
    legalCertification: false;
  };

  legalCertification: false;
}

export class RepositoryCapabilityEngineError extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositoryCapabilityEngineError";

    this.code =
      code;
  }
}

type CapabilitySignal = {
  name: string;
  description: string;
  domain: RepositorySemanticDomain;
  state: RepositorySemanticCapabilityState;
  epistemicState: RepositorySemanticEpistemicState;
  confidence: number;
  componentIds: string[];
  evidenceIds: string[];
};

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new RepositoryCapabilityEngineError(
      "MOD002_CAPABILITY_REQUIRED_STRING",
      `${fieldName} must be a non-empty string`,
    );
  }

  return value.trim();
}

function normalizeCapabilityName(
  value: string,
): string {
  return value
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");
}

function buildEvidenceMap(
  evidence:
    readonly RepositorySemanticEvidence[],
): ReadonlyMap<
  string,
  RepositorySemanticEvidence
> {
  const map =
    new Map<
      string,
      RepositorySemanticEvidence
    >();

  for (const item of evidence) {
    const evidenceId =
      normalizeRequiredString(
        item.evidenceId,
        "evidence.evidenceId",
      );

    if (map.has(evidenceId)) {
      throw new RepositoryCapabilityEngineError(
        "MOD002_CAPABILITY_DUPLICATE_EVIDENCE_ID",
        `Duplicate evidence ID: ${evidenceId}`,
      );
    }

    map.set(
      evidenceId,
      item,
    );
  }

  return map;
}

function buildComponentInputMap(
  componentInputs:
    readonly RepositorySemanticComponentInput[],
): ReadonlyMap<
  string,
  RepositorySemanticComponentInput
> {
  const map =
    new Map<
      string,
      RepositorySemanticComponentInput
    >();

  for (const component of componentInputs) {
    const componentId =
      normalizeRequiredString(
        component.componentId,
        "componentInput.componentId",
      );

    if (map.has(componentId)) {
      throw new RepositoryCapabilityEngineError(
        "MOD002_CAPABILITY_DUPLICATE_COMPONENT_INPUT",
        `Duplicate component input ID: ${componentId}`,
      );
    }

    map.set(
      componentId,
      component,
    );
  }

  return map;
}

function includesAny(
  value: string,
  terms: readonly string[],
): boolean {
  const normalized =
    value.toLowerCase();

  return terms.some(
    (term) =>
      normalized.includes(
        term.toLowerCase(),
      ),
  );
}

function deriveState(
  input:
    RepositorySemanticComponentInput,
  evidence:
    readonly RepositorySemanticEvidence[],
): RepositorySemanticCapabilityState {
  const combined =
    [
      input.path,
      input.name,
      input.summary ?? "",
      ...input.exports,
      ...input.endpoints,
      ...input.testRefs,
      ...input.documentationRefs,
      ...evidence.map(
        (item) =>
          `${item.sourceType} ${item.statement}`,
      ),
    ]
      .join(" ")
      .toLowerCase();

  const hasDocumentation =
    input.documentationRefs.length > 0 ||
    evidence.some(
      (item) =>
        item.sourceType ===
        "DOCUMENTATION",
    );

  const hasCodeEvidence =
    input.exports.length > 0 ||
    input.imports.length > 0 ||
    evidence.some(
      (item) =>
        item.sourceType ===
          "FILE" ||
        item.sourceType ===
          "EXPORT" ||
        item.sourceType ===
          "IMPORT",
    );

  const hasTests =
    input.testRefs.length > 0 ||
    evidence.some(
      (item) =>
        item.sourceType ===
        "TEST",
    );

  const hasEndpoint =
    input.endpoints.length > 0 ||
    evidence.some(
      (item) =>
        item.sourceType ===
        "ENDPOINT",
    );

  const hasIntegrationSignal =
    includesAny(
      combined,
      [
        "integrated",
        "integration",
        "orchestrator",
        "runtime service",
        "connected",
        "pipeline",
      ],
    );

  const hasPassSignal =
    includesAny(
      combined,
      [
        "verified pass",
        "tests passed",
        "pass",
        "17 passed",
        "10 passed",
        "build passed",
      ],
    );

  if (
    hasCodeEvidence &&
    hasTests &&
    hasEndpoint &&
    hasIntegrationSignal &&
    hasPassSignal
  ) {
    return "VERIFIED";
  }

  if (
    hasCodeEvidence &&
    hasTests &&
    hasEndpoint &&
    hasIntegrationSignal
  ) {
    return "INTEGRATED";
  }

  if (
    hasCodeEvidence &&
    hasEndpoint
  ) {
    return "EXPOSED";
  }

  if (
    hasCodeEvidence &&
    hasTests
  ) {
    return "TESTED";
  }

  if (hasCodeEvidence) {
    return "IMPLEMENTED";
  }

  if (hasDocumentation) {
    return "DECLARED";
  }

  return "NOT_VERIFIABLE";
}

function deriveEpistemicState(
  state:
    RepositorySemanticCapabilityState,
): RepositorySemanticEpistemicState {
  switch (state) {
    case "VERIFIED":
    case "INTEGRATED":
    case "EXPOSED":
    case "TESTED":
    case "IMPLEMENTED":
      return "FACT";

    case "DECLARED":
      return "FACT";

    case "NOT_VERIFIABLE":
      return "NOT_VERIFIABLE";

    default:
      return "INFERENCE";
  }
}

function deriveConfidence(
  state:
    RepositorySemanticCapabilityState,
  evidence:
    readonly RepositorySemanticEvidence[],
): number {
  const evidenceAverage =
    evidence.length === 0
      ? 0
      : evidence.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.confidence,
          0,
        ) /
        evidence.length;

  const stateBase:
    Record<
      RepositorySemanticCapabilityState,
      number
    > = {
      DECLARED:
        45,

      IMPLEMENTED:
        65,

      TESTED:
        75,

      EXPOSED:
        78,

      INTEGRATED:
        88,

      VERIFIED:
        100,

      NOT_VERIFIABLE:
        0,
    };

  return normalizeRepositorySemanticConfidence(
    (
      stateBase[state] +
      evidenceAverage
    ) /
    2,
  );
}

function extractCapabilityNames(
  component:
    RepositorySemanticComponent,
  input:
    RepositorySemanticComponentInput,
): readonly string[] {
  const candidates =
    new Set<string>();

  for (const exported of input.exports) {
    const normalized =
      normalizeCapabilityName(
        exported,
      );

    if (normalized.length > 0) {
      candidates.add(
        normalized,
      );
    }
  }

  for (const endpoint of input.endpoints) {
    const normalized =
      normalizeCapabilityName(
        endpoint,
      );

    if (normalized.length > 0) {
      candidates.add(
        `Expose ${normalized}`,
      );
    }
  }

  if (
    candidates.size === 0 &&
    component.primaryResponsibility
  ) {
    candidates.add(
      normalizeCapabilityName(
        component.primaryResponsibility,
      ),
    );
  }

  return Object.freeze(
    [...candidates].sort(),
  );
}

function buildSignals(
  components:
    readonly RepositorySemanticComponent[],
  componentInputMap:
    ReadonlyMap<
      string,
      RepositorySemanticComponentInput
    >,
  evidenceMap:
    ReadonlyMap<
      string,
      RepositorySemanticEvidence
    >,
): readonly CapabilitySignal[] {
  const signals:
    CapabilitySignal[] = [];

  for (const component of components) {
    const input =
      componentInputMap.get(
        component.componentId,
      );

    if (!input) {
      continue;
    }

    const evidence =
      input.evidenceIds
        .map(
          (evidenceId) =>
            evidenceMap.get(
              evidenceId,
            ),
        )
        .filter(
          (
            item,
          ): item is RepositorySemanticEvidence =>
            item !== undefined,
        );

    const capabilityNames =
      extractCapabilityNames(
        component,
        input,
      );

    for (
      const capabilityName
      of capabilityNames
    ) {
      const state =
        deriveState(
          input,
          evidence,
        );

      signals.push({
        name:
          capabilityName,

        description:
          component.primaryResponsibility ??
          `Capability derived from component ${component.name}.`,

        domain:
          component.domain,

        state,

        epistemicState:
          deriveEpistemicState(
            state,
          ),

        confidence:
          deriveConfidence(
            state,
            evidence,
          ),

        componentIds: [
          component.componentId,
        ],

        evidenceIds:
          evidence.map(
            (item) =>
              item.evidenceId,
          ),
      });
    }
  }

  return Object.freeze(
    signals,
  );
}

function mergeSignals(
  signals:
    readonly CapabilitySignal[],
): readonly RepositorySemanticCapability[] {
  const grouped =
    new Map<
      string,
      CapabilitySignal[]
    >();

  for (const signal of signals) {
    const key =
      `${signal.domain}:${signal.name.toLowerCase()}`;

    const current =
      grouped.get(key) ?? [];

    current.push(signal);
    grouped.set(key, current);
  }

  const statePriority:
    Record<
      RepositorySemanticCapabilityState,
      number
    > = {
      NOT_VERIFIABLE:
        0,

      DECLARED:
        1,

      IMPLEMENTED:
        2,

      TESTED:
        3,

      EXPOSED:
        4,

      INTEGRATED:
        5,

      VERIFIED:
        6,
    };

  return Object.freeze(
    [...grouped.entries()]
      .sort(
        ([left], [right]) =>
          left.localeCompare(
            right,
          ),
      )
      .map(
        (
          [
            ,
            group,
          ],
          index,
        ) => {
          const strongest =
            [...group].sort(
              (
                left,
                right,
              ) =>
                statePriority[
                  right.state
                ] -
                statePriority[
                  left.state
                ],
            )[0];

          if (!strongest) {
            throw new RepositoryCapabilityEngineError(
              "MOD002_CAPABILITY_EMPTY_SIGNAL_GROUP",
              "Capability signal group cannot be empty",
            );
          }

          const componentIds =
            Object.freeze(
              [
                ...new Set(
                  group.flatMap(
                    (item) =>
                      item.componentIds,
                  ),
                ),
              ].sort(),
            );

          const evidenceIds =
            Object.freeze(
              [
                ...new Set(
                  group.flatMap(
                    (item) =>
                      item.evidenceIds,
                  ),
                ),
              ].sort(),
            );

          const confidence =
            normalizeRepositorySemanticConfidence(
              group.reduce(
                (
                  total,
                  item,
                ) =>
                  total +
                  item.confidence,
                0,
              ) /
              group.length,
            );

          return Object.freeze({
            capabilityId:
              `SEM-CAPABILITY-${String(index + 1).padStart(3, "0")}`,

            name:
              strongest.name,

            description:
              strongest.description,

            domain:
              strongest.domain,

            componentIds,

            evidenceIds,

            state:
              strongest.state,

            epistemicState:
              strongest.epistemicState,

            confidence,
          });
        },
      ),
  );
}

function buildSummary(
  capabilities:
    readonly RepositorySemanticCapability[],
): RepositoryCapabilityEngineOutput["summary"] {
  return Object.freeze({
    totalCapabilities:
      capabilities.length,

    declaredCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "DECLARED",
      ).length,

    implementedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "IMPLEMENTED",
      ).length,

    testedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "TESTED",
      ).length,

    exposedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "EXPOSED",
      ).length,

    integratedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "INTEGRATED",
      ).length,

    verifiedCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "VERIFIED",
      ).length,

    notVerifiableCapabilities:
      capabilities.filter(
        (capability) =>
          capability.state ===
          "NOT_VERIFIABLE",
      ).length,
  });
}

function validateInput(
  input:
    RepositoryCapabilityEngineInput,
): void {
  if (
    !Array.isArray(
      input.components,
    )
  ) {
    throw new RepositoryCapabilityEngineError(
      "MOD002_CAPABILITY_COMPONENTS_REQUIRED",
      "components must be an array",
    );
  }

  if (
    !Array.isArray(
      input.componentInputs,
    )
  ) {
    throw new RepositoryCapabilityEngineError(
      "MOD002_CAPABILITY_COMPONENT_INPUTS_REQUIRED",
      "componentInputs must be an array",
    );
  }

  if (
    !Array.isArray(
      input.evidence,
    )
  ) {
    throw new RepositoryCapabilityEngineError(
      "MOD002_CAPABILITY_EVIDENCE_REQUIRED",
      "evidence must be an array",
    );
  }
}

/**
 * Derives repository capabilities exclusively from supplied semantic
 * components, component metadata and evidence.
 *
 * A capability is never marked VERIFIED unless implementation, tests,
 * exposure, integration and PASS evidence are all observable.
 */
export function buildRepositoryCapabilities(
  input:
    RepositoryCapabilityEngineInput,
): RepositoryCapabilityEngineOutput {
  validateInput(input);

  const componentInputMap =
    buildComponentInputMap(
      input.componentInputs,
    );

  const evidenceMap =
    buildEvidenceMap(
      input.evidence,
    );

  const signals =
    buildSignals(
      input.components,
      componentInputMap,
      evidenceMap,
    );

  const capabilities =
    mergeSignals(
      signals,
    );

  return Object.freeze({
    revision:
      REPOSITORY_CAPABILITY_ENGINE_REVISION,

    capabilities,

    summary:
      buildSummary(
        capabilities,
      ),

    governance:
      Object.freeze({
        deterministic:
          true,

        evidenceBased:
          true,

        sourceExecution:
          false,

        autonomousExecution:
          false,

        persistentMemoryCreated:
          false,

        automaticRecallUsed:
          false,

        humanAuthorizationRequired:
          true,

        legalCertification:
          false,
      }),

    legalCertification:
      false,
  });
}

export const REPOSITORY_CAPABILITY_ENGINE_BOUNDARY =
  Object.freeze({
    explicitComponentsRequired:
      true,

    explicitComponentInputsRequired:
      true,

    explicitEvidenceRequired:
      true,

    deterministicClassification:
      true,

    declaredCapabilitySupported:
      true,

    implementedCapabilitySupported:
      true,

    testedCapabilitySupported:
      true,

    exposedCapabilitySupported:
      true,

    integratedCapabilitySupported:
      true,

    verifiedCapabilitySupported:
      true,

    verificationRequiresPassEvidence:
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
