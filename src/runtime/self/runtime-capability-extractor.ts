/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Capability Extractor
 *
 * Projects verified MOD-001 analysis results into the governed
 * Runtime Capability Registry contract.
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
  Mod001RepositoryFinding,
} from "../../modules/engines/mod-001-repository-intelligence-engine";

import type {
  RuntimeCapability,
  RuntimeCapabilityEvidence,
  RuntimeCapabilityEvidenceStatus,
  RuntimeCapabilityRiskLevel,
  RuntimeCapabilityStatus,
} from "./runtime-capability-registry";

export const RUNTIME_CAPABILITY_EXTRACTOR_REVISION =
  "AIJC2-RUNTIME-CAPABILITY-EXTRACTOR-v1_0" as const;

export interface RuntimeCapabilityExtractorInput {
  readonly analysis: Mod001RepositoryAnalysisResult;

  /**
   * Authorization is supplied explicitly by the calling runtime.
   * It is never inferred from a build result or repository posture.
   */
  readonly operatorAuthorized: boolean;
}

export interface RuntimeCapabilityExtractorOutput {
  readonly revision:
    typeof RUNTIME_CAPABILITY_EXTRACTOR_REVISION;

  readonly capabilities:
    readonly RuntimeCapability[];

  readonly source: {
    readonly moduleId: "MOD-001";
    readonly moduleRevision: string;
    readonly repositoryId: string;
    readonly repositoryName: string;
    readonly branch: string | null;
    readonly commitSha: string | null;
  };

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
    readonly automaticDiscovery: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;
    readonly humanAuthorizationRequired: true;
    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

function mapRiskLevel(
  risk: Mod001RepositoryAnalysisResult["posture"]["risk"],
): RuntimeCapabilityRiskLevel {
  switch (risk) {
    case "LOW":
      return "LOW";

    case "MODERATE":
      return "MEDIUM";

    case "HIGH":
      return "HIGH";

    case "UNKNOWN":
    default:
      return "CRITICAL";
  }
}

function mapCapabilityStatus(
  analysis: Mod001RepositoryAnalysisResult,
  operatorAuthorized: boolean,
): RuntimeCapabilityStatus {
  if (!operatorAuthorized) {
    return "DISABLED";
  }

  if (!analysis.ok) {
    return "DEGRADED";
  }

  if (analysis.posture.overallConfidence < 75) {
    return "DEGRADED";
  }

  return "ACTIVE";
}

function mapFindingEvidenceStatus(
  finding: Mod001RepositoryFinding,
): RuntimeCapabilityEvidenceStatus {
  if (
    finding.severity === "CRITICAL" ||
    finding.severity === "HIGH"
  ) {
    return "FAIL";
  }

  if (
    finding.epistemicState === "NOT_VERIFIABLE" ||
    finding.epistemicState === "HYPOTHESIS"
  ) {
    return "PARTIAL";
  }

  return "PASS";
}

function normalizeEvidenceId(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (normalized.length === 0) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_EVIDENCE_ID_INVALID",
    );
  }

  return normalized;
}

function buildFindingEvidence(
  analysis: Mod001RepositoryAnalysisResult,
): readonly RuntimeCapabilityEvidence[] {
  return Object.freeze(
    [...analysis.findings]
      .sort((left, right) =>
        left.findingId.localeCompare(
          right.findingId,
        ),
      )
      .map(
        (
          finding,
        ): Readonly<RuntimeCapabilityEvidence> =>
          Object.freeze({
            id:
              `MOD001-${normalizeEvidenceId(
                finding.findingId,
              )}`,

            status:
              mapFindingEvidenceStatus(
                finding,
              ),

            description:
              `${finding.title}: ${finding.description}`,

            sourceArtifact:
              analysis.repository.repositoryName,

            sourceRevision:
              analysis.revision,

            sourceCommit:
              analysis.repository.commitSha ??
              undefined,

            sourcePath:
              finding.affectedFiles.length === 1
                ? finding.affectedFiles[0]
                : undefined,
          }),
      ),
  );
}

function buildPostureEvidence(
  analysis: Mod001RepositoryAnalysisResult,
): readonly RuntimeCapabilityEvidence[] {
  const buildStatus:
    RuntimeCapabilityEvidenceStatus =
      analysis.posture.buildConfidence === 100
        ? "PASS"
        : analysis.posture.buildConfidence > 0
          ? "PARTIAL"
          : "NOT_RUN";

  const testStatus:
    RuntimeCapabilityEvidenceStatus =
      analysis.posture.testConfidence === 100
        ? "PASS"
        : analysis.posture.testConfidence > 0
          ? "PARTIAL"
          : "NOT_RUN";

  return Object.freeze([
    Object.freeze({
      id: "MOD001-POSTURE-OVERALL-CONFIDENCE",
      status:
        analysis.posture.overallConfidence >= 75
          ? "PASS"
          : analysis.posture.overallConfidence > 0
            ? "PARTIAL"
            : "FAIL",

      description:
        `MOD-001 overall repository confidence is ${analysis.posture.overallConfidence}/100.`,

      sourceArtifact:
        analysis.repository.repositoryName,

      sourceRevision:
        analysis.revision,

      sourceCommit:
        analysis.repository.commitSha ??
        undefined,
    }),

    Object.freeze({
      id: "MOD001-POSTURE-BUILD",
      status: buildStatus,

      description:
        `MOD-001 build confidence is ${analysis.posture.buildConfidence}/100.`,

      sourceArtifact:
        analysis.repository.repositoryName,

      sourceRevision:
        analysis.revision,

      sourceCommit:
        analysis.repository.commitSha ??
        undefined,
    }),

    Object.freeze({
      id: "MOD001-POSTURE-TESTS",
      status: testStatus,

      description:
        `MOD-001 test confidence is ${analysis.posture.testConfidence}/100.`,

      sourceArtifact:
        analysis.repository.repositoryName,

      sourceRevision:
        analysis.revision,

      sourceCommit:
        analysis.repository.commitSha ??
        undefined,
    }),

    Object.freeze({
      id: "MOD001-GOVERNANCE-BOUNDARY",
      status:
        analysis.legalCertification === false &&
        analysis.governance
          .persistentMemoryCreated === false &&
        analysis.governance
          .automaticRecallUsed === false &&
        analysis.governance
          .humanAuthorizationRequired === true
          ? "PASS"
          : "FAIL",

      description:
        "MOD-001 preserves human authorization, no automatic recall, no persistent memory creation and legalCertification=false.",

      sourceArtifact:
        analysis.repository.repositoryName,

      sourceRevision:
        analysis.revision,

      sourceCommit:
        analysis.repository.commitSha ??
        undefined,
    }),
  ]);
}

function buildCapabilityEvidence(
  analysis: Mod001RepositoryAnalysisResult,
): readonly RuntimeCapabilityEvidence[] {
  const evidence = [
    ...buildPostureEvidence(
      analysis,
    ),

    ...buildFindingEvidence(
      analysis,
    ),
  ];

  evidence.sort(
    (left, right) =>
      left.id.localeCompare(
        right.id,
      ),
  );

  const evidenceIds =
    evidence.map(
      (item) => item.id,
    );

  if (
    new Set(evidenceIds).size !==
    evidenceIds.length
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_DUPLICATE_EVIDENCE",
    );
  }

  return Object.freeze(
    evidence,
  );
}

function validateAnalysisBoundary(
  analysis: Mod001RepositoryAnalysisResult,
): void {
  if (
    analysis.moduleId !==
    "MOD-001"
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_INVALID_SOURCE_MODULE",
    );
  }

  if (
    analysis.legalCertification !==
    false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  if (
    analysis.governance
      .humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_AUTHORIZATION_BOUNDARY_VIOLATION",
    );
  }

  if (
    analysis.governance
      .persistentMemoryCreated !==
    false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_PERSISTENCE_BOUNDARY_VIOLATION",
    );
  }

  if (
    analysis.governance
      .automaticRecallUsed !==
    false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_EXTRACTOR_RECALL_BOUNDARY_VIOLATION",
    );
  }
}

export function extractRuntimeCapabilitiesFromMod001(
  input: RuntimeCapabilityExtractorInput,
): Readonly<RuntimeCapabilityExtractorOutput> {
  validateAnalysisBoundary(
    input.analysis,
  );

  const analysis =
    input.analysis;

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const capability:
    Readonly<RuntimeCapability> =
      Object.freeze({
        id:
          "CAP-REPOSITORY-INTELLIGENCE",

        name:
          "Repository Intelligence",

        description:
          "Deterministic analysis of an explicitly supplied repository snapshot, including posture, findings, missing evidence and one governed atomic mutation recommendation.",

        owner:
          analysis.moduleId,

        version:
          analysis.version,

        status:
          mapCapabilityStatus(
            analysis,
            operatorAuthorized,
          ),

        score:
          analysis.posture
            .overallConfidence,

        riskLevel:
          mapRiskLevel(
            analysis.posture.risk,
          ),

        dependencies:
          Object.freeze([]),

        evidence:
          buildCapabilityEvidence(
            analysis,
          ),

        enabled:
          analysis.ok &&
          operatorAuthorized,

        operatorAuthorized,

        humanAuthorizationRequired:
          true,
      });

  return Object.freeze({
    revision:
      RUNTIME_CAPABILITY_EXTRACTOR_REVISION,

    capabilities:
      Object.freeze([
        capability,
      ]),

    source:
      Object.freeze({
        moduleId:
          "MOD-001",

        moduleRevision:
          analysis.revision,

        repositoryId:
          analysis.repository
            .repositoryId,

        repositoryName:
          analysis.repository
            .repositoryName,

        branch:
          analysis.repository
            .branch,

        commitSha:
          analysis.repository
            .commitSha,
      }),

    governance:
      Object.freeze({
        readOnly:
          true,

        deterministic:
          true,

        automaticDiscovery:
          false,

        automaticPersistence:
          false,

        automaticRecall:
          false,

        automaticRepositoryMutation:
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
