/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Repository Recommendation Engine
 *
 * Revision:
 * AIJC2-MOD002-REPOSITORY-RECOMMENDATION-ENGINE-v1_0
 *
 * Purpose:
 * - convert semantic findings into one deterministic priority recommendation;
 * - preserve severity, evidence and epistemic boundaries;
 * - reject unsupported autonomous execution;
 * - require human authorization before any operational follow-up;
 * - produce no repository mutation.
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

import type {
  RepositorySemanticFinding,
  RepositorySemanticRecommendation,
  RepositorySemanticSeverity,
} from "./repository-semantic-intelligence.types";

export const REPOSITORY_RECOMMENDATION_ENGINE_REVISION =
  "AIJC2-MOD002-REPOSITORY-RECOMMENDATION-ENGINE-v1_0" as const;

export interface RepositoryRecommendationEngineInput {
  findings:
    readonly RepositorySemanticFinding[];

  humanAuthorization:
    boolean;
}

export interface RepositoryRecommendationEngineOutput {
  revision:
    typeof REPOSITORY_RECOMMENDATION_ENGINE_REVISION;

  recommendation:
    RepositorySemanticRecommendation | null;

  consideredFindings:
    number;

  blockingFindings:
    number;

  actionableFindings:
    number;

  governance: {
    deterministic:
      true;

    evidenceBased:
      true;

    singleRecommendationOnly:
      true;

    autonomousExecution:
      false;

    humanAuthorizationRequired:
      true;

    humanAuthorizationVerified:
      boolean;

    persistentMemoryCreated:
      false;

    automaticRecallUsed:
      false;

    legalCertification:
      false;
  };

  legalCertification:
    false;
}

export class RepositoryRecommendationEngineError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "RepositoryRecommendationEngineError";

    this.code =
      code;
  }
}

type RankedFinding = {
  finding:
    RepositorySemanticFinding;

  severityWeight:
    number;

  evidenceWeight:
    number;

  authorizationWeight:
    number;
};

function validateInput(
  input:
    RepositoryRecommendationEngineInput,
): void {
  if (
    !Array.isArray(
      input.findings,
    )
  ) {
    throw new RepositoryRecommendationEngineError(
      "MOD002_RECOMMENDATION_FINDINGS_REQUIRED",
      "findings must be an array",
    );
  }

  const findingIds =
    new Set<string>();

  for (
    const finding
    of input.findings
  ) {
    if (
      typeof finding.findingId !==
        "string" ||
      finding.findingId.trim().length ===
        0
    ) {
      throw new RepositoryRecommendationEngineError(
        "MOD002_RECOMMENDATION_FINDING_ID_REQUIRED",
        "Every finding requires a non-empty findingId",
      );
    }

    if (
      findingIds.has(
        finding.findingId,
      )
    ) {
      throw new RepositoryRecommendationEngineError(
        "MOD002_RECOMMENDATION_DUPLICATE_FINDING_ID",
        `Duplicate finding ID: ${finding.findingId}`,
      );
    }

    findingIds.add(
      finding.findingId,
    );
  }
}

function getSeverityWeight(
  severity:
    RepositorySemanticSeverity,
): number {
  const weights:
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

  return weights[
    severity
  ];
}

function getEvidenceWeight(
  finding:
    RepositorySemanticFinding,
): number {
  if (
    finding.evidenceIds.length >
    0
  ) {
    return 0;
  }

  return 1;
}

function getAuthorizationWeight(
  finding:
    RepositorySemanticFinding,
): number {
  return finding
    .humanAuthorizationRequired
    ? 0
    : 1;
}

function rankFindings(
  findings:
    readonly RepositorySemanticFinding[],
): readonly RankedFinding[] {
  return Object.freeze(
    findings
      .map(
        (
          finding,
        ): RankedFinding => ({
          finding,

          severityWeight:
            getSeverityWeight(
              finding.severity,
            ),

          evidenceWeight:
            getEvidenceWeight(
              finding,
            ),

          authorizationWeight:
            getAuthorizationWeight(
              finding,
            ),
        }),
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.severityWeight -
            right.severityWeight ||
          left.evidenceWeight -
            right.evidenceWeight ||
          left.authorizationWeight -
            right.authorizationWeight ||
          left.finding.findingId.localeCompare(
            right.finding.findingId,
          ),
      ),
  );
}

function isActionableFinding(
  finding:
    RepositorySemanticFinding,
): boolean {
  return (
    finding.severity !==
      "INFO" &&
    (
      finding.recommendation !==
        null ||
      finding.description.trim().length >
        0
    )
  );
}

function buildRecommendation(
  finding:
    RepositorySemanticFinding,
): RepositorySemanticRecommendation {
  return Object.freeze({
    recommendationId:
      "SEM-RECOMMENDATION-001",

    priority:
      1,

    title:
      finding.title,

    description:
      finding.recommendation ??
      finding.description,

    targetComponentIds:
      Object.freeze([
        ...finding.componentIds,
      ]),

    sourceFindingIds:
      Object.freeze([
        finding.findingId,
      ]),

    executableAutomatically:
      false,

    humanAuthorizationRequired:
      true,
  });
}

/**
 * Selects at most one deterministic recommendation.
 *
 * No recommendation is produced when human authorization is absent.
 * This does not resolve or mutate the underlying finding.
 */
export function buildRepositoryRecommendation(
  input:
    RepositoryRecommendationEngineInput,
): RepositoryRecommendationEngineOutput {
  validateInput(
    input,
  );

  const rankedFindings =
    rankFindings(
      input.findings,
    );

  const actionableFindings =
    rankedFindings.filter(
      (
        ranked,
      ) =>
        isActionableFinding(
          ranked.finding,
        ),
    );

  const selected =
    input.humanAuthorization
      ? actionableFindings[0]
      : undefined;

  const recommendation =
    selected
      ? buildRecommendation(
          selected.finding,
        )
      : null;

  const blockingFindings =
    input.findings.filter(
      (finding) =>
        finding.severity ===
          "CRITICAL" ||
        finding.severity ===
          "HIGH",
    ).length;

  return Object.freeze({
    revision:
      REPOSITORY_RECOMMENDATION_ENGINE_REVISION,

    recommendation,

    consideredFindings:
      input.findings.length,

    blockingFindings,

    actionableFindings:
      actionableFindings.length,

    governance:
      Object.freeze({
        deterministic:
          true,

        evidenceBased:
          true,

        singleRecommendationOnly:
          true,

        autonomousExecution:
          false,

        humanAuthorizationRequired:
          true,

        humanAuthorizationVerified:
          input.humanAuthorization ===
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

export const REPOSITORY_RECOMMENDATION_ENGINE_BOUNDARY =
  Object.freeze({
    explicitFindingsRequired:
      true,

    deterministicRanking:
      true,

    severityPriority:
      true,

    evidencePriority:
      true,

    singleRecommendationOnly:
      true,

    humanAuthorizationRequired:
      true,

    autonomousExecution:
      false,

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

    legalCertification:
      false,
  });
