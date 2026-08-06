/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Capability Pipeline
 *
 * Composes:
 * MOD-001 Repository Intelligence
 * → Runtime Capability Extractor
 * → Capability Registry
 * → Capability Analysis
 * → Runtime Self State
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

import type {
  Mod001RepositoryAnalysisResult,
} from "../../modules/engines/mod-001-repository-intelligence-engine";

import {
  extractRuntimeCapabilitiesFromMod001,
  type RuntimeCapabilityExtractorOutput,
} from "./runtime-capability-extractor";

import {
  createRuntimeSelfState,
  type RuntimeEvolutionProjection,
  type RuntimeIntegrationProjection,
  type RuntimeKnowledgeProjection,
  type RuntimeRepositoryProjection,
  type RuntimeSelfState,
} from "./runtime-self.service";

export const RUNTIME_CAPABILITY_PIPELINE_REVISION =
  "AIJC2-RUNTIME-CAPABILITY-PIPELINE-v1_0" as const;

export interface RuntimeCapabilityPipelineInput {
  readonly revision: string;
  readonly generatedAt: string;
  readonly runtimeVersion: string;

  readonly mod001Analysis: Mod001RepositoryAnalysisResult;

  readonly repository: RuntimeRepositoryProjection;
  readonly evolution: RuntimeEvolutionProjection;
  readonly integration: RuntimeIntegrationProjection;
  readonly knowledge: RuntimeKnowledgeProjection;

  readonly operatorAuthorized: boolean;
}

export interface RuntimeCapabilityPipelineOutput {
  readonly revision:
    typeof RUNTIME_CAPABILITY_PIPELINE_REVISION;

  readonly extractor:
    RuntimeCapabilityExtractorOutput;

  readonly runtimeSelfState:
    RuntimeSelfState;

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
    readonly humanAuthorizationRequired: true;
    readonly automaticDiscovery: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;
    readonly legalCertification: false;
  };

  readonly legalCertification: false;
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

function validateRepositoryAlignment(
  analysis: Mod001RepositoryAnalysisResult,
  repository: RuntimeRepositoryProjection,
): void {
  const analysisRepositoryName =
    analysis.repository.repositoryName.trim();

  const projectionRepositoryName =
    repository.repository.trim();

  if (
    analysisRepositoryName.length > 0 &&
    projectionRepositoryName.length > 0 &&
    analysisRepositoryName !== projectionRepositoryName
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_REPOSITORY_MISMATCH",
    );
  }

  const analysisBranch =
    analysis.repository.branch?.trim();

  const projectionBranch =
    repository.branch.trim();

  if (
    analysisBranch !== undefined &&
    analysisBranch.length > 0 &&
    analysisBranch !== projectionBranch
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_BRANCH_MISMATCH",
    );
  }

  const analysisCommit =
    analysis.repository.commitSha?.trim();

  const projectionCommit =
    repository.commit.trim();

  if (
    analysisCommit !== undefined &&
    analysisCommit.length > 0 &&
    analysisCommit !== projectionCommit
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_COMMIT_MISMATCH",
    );
  }
}

function validateGovernanceBoundary(
  input: RuntimeCapabilityPipelineInput,
): void {
  if (
    input.mod001Analysis
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.mod001Analysis.governance
      .humanAuthorizationRequired !== true
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.mod001Analysis.governance
      .persistentMemoryCreated !== false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    input.mod001Analysis.governance
      .automaticRecallUsed !== false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_RECALL_BOUNDARY_VIOLATION",
    );
  }
}

export function executeRuntimeCapabilityPipeline(
  input: RuntimeCapabilityPipelineInput,
): Readonly<RuntimeCapabilityPipelineOutput> {
  const revision =
    requireNonEmptyString(
      input.revision,
      "RUNTIME_CAPABILITY_PIPELINE_INPUT_REVISION_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_CAPABILITY_PIPELINE_TIMESTAMP_REQUIRED",
    );

  const runtimeVersion =
    requireNonEmptyString(
      input.runtimeVersion,
      "RUNTIME_CAPABILITY_PIPELINE_RUNTIME_VERSION_REQUIRED",
    );

  validateGovernanceBoundary(
    input,
  );

  validateRepositoryAlignment(
    input.mod001Analysis,
    input.repository,
  );

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const extractor =
    extractRuntimeCapabilitiesFromMod001({
      analysis:
        input.mod001Analysis,

      operatorAuthorized,
    });

  if (
    extractor.capabilities.length === 0
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_NO_CAPABILITIES_EXTRACTED",
    );
  }

  const runtimeSelfState =
    createRuntimeSelfState({
      revision:
        `${revision}-SELF-STATE`,

      generatedAt,

      runtimeVersion,

      repository:
        input.repository,

      evolution:
        input.evolution,

      integration:
        input.integration,

      knowledge:
        input.knowledge,

      capabilities:
        extractor.capabilities,

      operatorAuthorized,
    });

  if (
    runtimeSelfState
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_PIPELINE_OUTPUT_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  return Object.freeze({
    revision:
      RUNTIME_CAPABILITY_PIPELINE_REVISION,

    extractor,

    runtimeSelfState,

    governance:
      Object.freeze({
        readOnly:
          true,

        deterministic:
          true,

        humanAuthorizationRequired:
          true,

        automaticDiscovery:
          false,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        automaticRepositoryMutation:
          false,

        legalCertification:
          false,
      }),

    legalCertification:
      false,
  });
}
