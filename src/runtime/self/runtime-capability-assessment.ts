/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Capability Assessment
 *
 * Converts an existing RuntimeSelfState into deterministic,
 * governed capability findings and ranked intervention candidates.
 *
 * This module does not:
 * - inspect GitHub directly;
 * - execute repository changes;
 * - persist findings;
 * - perform automatic recall;
 * - authorize interventions;
 * - claim legal certification.
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 * Automatic Execution: false
 * Automatic Persistence: false
 * Automatic Recall: false
 * Automatic Repository Mutation: false
 * Legal Certification: false
 */

import type {
  RuntimeSelfState,
} from "./runtime-self.service";

export const RUNTIME_CAPABILITY_ASSESSMENT_REVISION =
  "AIJC2-RUNTIME-CAPABILITY-ASSESSMENT-v1_0" as const;

export type RuntimeCapabilityFindingSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RuntimeCapabilityFindingCategory =
  | "CAPABILITY_GAP"
  | "LOW_CAPABILITY_SCORE"
  | "NO_REGISTERED_CAPABILITIES"
  | "REPOSITORY_EVIDENCE"
  | "INTEGRATION_POSTURE"
  | "KNOWLEDGE_POSTURE"
  | "GOVERNANCE";

export type RuntimeCapabilityInterventionDecision =
  | "RECOMMEND"
  | "REVIEW_REQUIRED"
  | "REJECT";

export interface RuntimeCapabilityFinding {
  readonly id: string;

  readonly category:
    RuntimeCapabilityFindingCategory;

  readonly severity:
    RuntimeCapabilityFindingSeverity;

  readonly title: string;
  readonly description: string;

  readonly evidence: readonly string[];

  readonly affectedCapabilityId?: string;

  readonly score?: number;

  readonly operatorReviewRequired: true;
}

export interface RuntimeCapabilityIntervention {
  readonly id: string;

  readonly findingId: string;

  readonly title: string;
  readonly hypothesis: string;
  readonly expectedEffect: string;

  readonly priorityScore: number;

  readonly expectedBenefit: number;
  readonly expectedRisk: number;
  readonly expectedEffort: number;
  readonly evidenceConfidence: number;

  readonly decision:
    RuntimeCapabilityInterventionDecision;

  readonly reasons: readonly string[];

  readonly humanAuthorizationRequired: true;

  readonly automaticExecution: false;
  readonly automaticRepositoryMutation: false;
}

export interface RuntimeCapabilityAssessmentInput {
  readonly assessmentId: string;
  readonly generatedAt: string;

  readonly runtimeSelfState:
    RuntimeSelfState;

  readonly operatorAuthorized: boolean;
}

export interface RuntimeCapabilityAssessmentSummary {
  readonly totalFindings: number;

  readonly criticalFindings: number;
  readonly highFindings: number;
  readonly mediumFindings: number;
  readonly lowFindings: number;
  readonly informationalFindings: number;

  readonly interventionCandidates: number;

  readonly recommendedInterventions: number;
  readonly reviewRequiredInterventions: number;
  readonly rejectedInterventions: number;

  readonly capabilityScore: number;
  readonly registeredCapabilities: number;
  readonly capabilityGaps: number;
}

export interface RuntimeCapabilityAssessmentResult {
  readonly revision:
    typeof RUNTIME_CAPABILITY_ASSESSMENT_REVISION;

  readonly assessmentId: string;
  readonly generatedAt: string;

  readonly findings:
    readonly RuntimeCapabilityFinding[];

  readonly interventions:
    readonly RuntimeCapabilityIntervention[];

  readonly summary:
    RuntimeCapabilityAssessmentSummary;

  readonly topRecommendation?:
    RuntimeCapabilityIntervention;

  readonly operatorAuthorized: boolean;

  readonly governance: {
    readonly readOnly: true;
    readonly deterministic: true;
    readonly failClosed: true;

    readonly humanAuthorizationRequired: true;

    readonly automaticExecution: false;
    readonly automaticPersistence: false;
    readonly automaticRecall: false;
    readonly automaticRepositoryMutation: false;

    readonly legalCertification: false;
  };

  readonly legalCertification: false;
}

interface CapabilityGapLike {
  readonly id?: unknown;
  readonly capabilityId?: unknown;
  readonly name?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly reason?: unknown;
  readonly score?: unknown;
  readonly severity?: unknown;
}

function requireNonEmptyString(
  value: string,
  code: string,
): string {
  const normalized =
    value.trim();

  if (normalized.length === 0) {
    throw new Error(code);
  }

  return normalized;
}

function requireScore(
  value: number,
  code: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(code);
  }

  return Math.round(value);
}

function clampScore(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function readOptionalString(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

function readOptionalScore(
  value: unknown,
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return clampScore(value);
}

function mapGapSeverity(
  gap: CapabilityGapLike,
): RuntimeCapabilityFindingSeverity {
  const explicitSeverity =
    readOptionalString(
      gap.severity,
    )?.toUpperCase();

  if (
    explicitSeverity === "CRITICAL"
  ) {
    return "CRITICAL";
  }

  if (
    explicitSeverity === "HIGH"
  ) {
    return "HIGH";
  }

  if (
    explicitSeverity === "MEDIUM"
  ) {
    return "MEDIUM";
  }

  if (
    explicitSeverity === "LOW"
  ) {
    return "LOW";
  }

  const score =
    readOptionalScore(
      gap.score,
    );

  if (score === undefined) {
    return "MEDIUM";
  }

  if (score < 25) {
    return "CRITICAL";
  }

  if (score < 50) {
    return "HIGH";
  }

  if (score < 75) {
    return "MEDIUM";
  }

  return "LOW";
}

function severityWeight(
  severity:
    RuntimeCapabilityFindingSeverity,
): number {
  switch (severity) {
    case "CRITICAL":
      return 100;

    case "HIGH":
      return 80;

    case "MEDIUM":
      return 60;

    case "LOW":
      return 35;

    case "INFO":
    default:
      return 10;
  }
}

function buildGapFinding(
  gap: CapabilityGapLike,
  index: number,
): Readonly<RuntimeCapabilityFinding> {
  const capabilityId =
    readOptionalString(
      gap.capabilityId,
    ) ??
    readOptionalString(
      gap.id,
    ) ??
    `CAPABILITY-GAP-${index + 1}`;

  const title =
    readOptionalString(
      gap.title,
    ) ??
    readOptionalString(
      gap.name,
    ) ??
    `Capability gap ${index + 1}`;

  const description =
    readOptionalString(
      gap.description,
    ) ??
    readOptionalString(
      gap.reason,
    ) ??
    "The runtime reported an unresolved capability gap.";

  const score =
    readOptionalScore(
      gap.score,
    );

  return Object.freeze({
    id:
      `FINDING-CAPABILITY-GAP-${String(
        index + 1,
      ).padStart(3, "0")}`,

    category:
      "CAPABILITY_GAP",

    severity:
      mapGapSeverity(gap),

    title,

    description,

    evidence:
      Object.freeze([
        `Capability identifier: ${capabilityId}.`,

        score === undefined
          ? "Capability score was not supplied."
          : `Capability score: ${score}/100.`,
      ]),

    affectedCapabilityId:
      capabilityId,

    score,

    operatorReviewRequired:
      true,
  });
}

function buildCapabilityScoreFinding(
  averageScore: number,
): Readonly<RuntimeCapabilityFinding> | undefined {
  if (averageScore >= 75) {
    return undefined;
  }

  const severity:
    RuntimeCapabilityFindingSeverity =
      averageScore < 25
        ? "CRITICAL"
        : averageScore < 50
          ? "HIGH"
          : "MEDIUM";

  return Object.freeze({
    id:
      "FINDING-LOW-CAPABILITY-SCORE",

    category:
      "LOW_CAPABILITY_SCORE",

    severity,

    title:
      "Runtime capability score requires improvement",

    description:
      "The aggregated runtime capability score is below the governed operational threshold of 75/100.",

    evidence:
      Object.freeze([
        `Measured capability score: ${averageScore}/100.`,
        "Governed operational threshold: 75/100.",
      ]),

    score:
      averageScore,

    operatorReviewRequired:
      true,
  });
}

function buildNoCapabilitiesFinding(
  totalCapabilities: number,
): Readonly<RuntimeCapabilityFinding> | undefined {
  if (totalCapabilities > 0) {
    return undefined;
  }

  return Object.freeze({
    id:
      "FINDING-NO-REGISTERED-CAPABILITIES",

    category:
      "NO_REGISTERED_CAPABILITIES",

    severity:
      "CRITICAL",

    title:
      "No runtime capabilities are registered",

    description:
      "The RuntimeSelfState contains no registered capabilities. Capability-based recommendations cannot be trusted until extraction and registration produce evidence.",

    evidence:
      Object.freeze([
        "Registered capabilities: 0.",
      ]),

    score:
      0,

    operatorReviewRequired:
      true,
  });
}

function buildRepositoryEvidenceFinding(
  state: RuntimeSelfState,
): Readonly<RuntimeCapabilityFinding> | undefined {
  const repository =
    state.repository;

  if (
    repository.fileCount > 0 &&
    repository.inspectedFileCount > 0
  ) {
    return undefined;
  }

  const severity:
    RuntimeCapabilityFindingSeverity =
      repository.fileCount === 0
        ? "HIGH"
        : "MEDIUM";

  return Object.freeze({
    id:
      "FINDING-REPOSITORY-EVIDENCE-INCOMPLETE",

    category:
      "REPOSITORY_EVIDENCE",

    severity,

    title:
      "Repository evidence is incomplete",

    description:
      "The runtime cannot produce a high-confidence capability assessment without repository files and governed source inspections.",

    evidence:
      Object.freeze([
        `Repository files: ${repository.fileCount}.`,
        `Inspected files: ${repository.inspectedFileCount}.`,
        `Directories: ${repository.directoryCount}.`,
      ]),

    operatorReviewRequired:
      true,
  });
}

function calculateExpectedBenefit(
  finding:
    RuntimeCapabilityFinding,
): number {
  const severity =
    severityWeight(
      finding.severity,
    );

  const scoreDeficit =
    finding.score === undefined
      ? 25
      : 100 - finding.score;

  return clampScore(
    severity * 0.65 +
    scoreDeficit * 0.35,
  );
}

function calculateExpectedRisk(
  finding:
    RuntimeCapabilityFinding,
): number {
  switch (finding.category) {
    case "NO_REGISTERED_CAPABILITIES":
      return 35;

    case "REPOSITORY_EVIDENCE":
      return 20;

    case "LOW_CAPABILITY_SCORE":
      return 30;

    case "CAPABILITY_GAP":
      return finding.severity === "CRITICAL"
        ? 45
        : finding.severity === "HIGH"
          ? 35
          : 25;

    case "INTEGRATION_POSTURE":
    case "KNOWLEDGE_POSTURE":
      return 40;

    case "GOVERNANCE":
      return 60;

    default:
      return 30;
  }
}

function calculateExpectedEffort(
  finding:
    RuntimeCapabilityFinding,
): number {
  switch (finding.category) {
    case "REPOSITORY_EVIDENCE":
      return 20;

    case "NO_REGISTERED_CAPABILITIES":
      return 55;

    case "LOW_CAPABILITY_SCORE":
      return 50;

    case "CAPABILITY_GAP":
      return finding.severity === "CRITICAL"
        ? 65
        : finding.severity === "HIGH"
          ? 50
          : 35;

    default:
      return 45;
  }
}

function calculateEvidenceConfidence(
  finding:
    RuntimeCapabilityFinding,
): number {
  const evidenceCount =
    finding.evidence.length;

  const scoreEvidence =
    finding.score === undefined
      ? 0
      : 20;

  return clampScore(
    45 +
    Math.min(
      evidenceCount * 10,
      30,
    ) +
    scoreEvidence,
  );
}

function buildInterventionTitle(
  finding:
    RuntimeCapabilityFinding,
): string {
  switch (finding.category) {
    case "NO_REGISTERED_CAPABILITIES":
      return "Restore capability extraction and registration";

    case "REPOSITORY_EVIDENCE":
      return "Complete governed repository inspection";

    case "LOW_CAPABILITY_SCORE":
      return "Raise the weakest runtime capabilities";

    case "CAPABILITY_GAP":
      return finding.affectedCapabilityId === undefined
        ? "Resolve the detected capability gap"
        : `Resolve capability gap: ${finding.affectedCapabilityId}`;

    case "INTEGRATION_POSTURE":
      return "Complete runtime integration";

    case "KNOWLEDGE_POSTURE":
      return "Complete governed knowledge evidence";

    case "GOVERNANCE":
      return "Restore governance invariants";

    default:
      return "Review runtime capability finding";
  }
}

function buildInterventionHypothesis(
  finding:
    RuntimeCapabilityFinding,
): string {
  switch (finding.category) {
    case "NO_REGISTERED_CAPABILITIES":
      return "If capability extraction and registration are restored, the runtime will produce measurable and rankable operational capabilities.";

    case "REPOSITORY_EVIDENCE":
      return "If additional authorized source files are inspected, capability confidence and repository coverage will increase.";

    case "LOW_CAPABILITY_SCORE":
      return "If the lowest-scoring capabilities are improved before new capabilities are added, the aggregate runtime posture will increase with lower regression risk.";

    case "CAPABILITY_GAP":
      return `If the finding "${finding.title}" is resolved through a bounded integration, the associated capability gap will decrease without requiring autonomous repository mutation.`;

    default:
      return `If the finding "${finding.title}" is resolved, runtime capability posture should improve.`;
  }
}

function buildInterventionEffect(
  finding:
    RuntimeCapabilityFinding,
): string {
  switch (finding.category) {
    case "NO_REGISTERED_CAPABILITIES":
      return "At least one governed capability becomes registered and measurable.";

    case "REPOSITORY_EVIDENCE":
      return "Repository evidence coverage increases and capability assessment confidence improves.";

    case "LOW_CAPABILITY_SCORE":
      return "Average capability score moves toward or above the governed 75/100 threshold.";

    case "CAPABILITY_GAP":
      return "The selected capability gap is reduced or removed after operator-authorized implementation and verification.";

    default:
      return "Runtime capability posture improves through a measurable, governed intervention.";
  }
}

function buildIntervention(
  finding:
    RuntimeCapabilityFinding,

  operatorAuthorized: boolean,
): Readonly<RuntimeCapabilityIntervention> {
  const expectedBenefit =
    calculateExpectedBenefit(
      finding,
    );

  const expectedRisk =
    calculateExpectedRisk(
      finding,
    );

  const expectedEffort =
    calculateExpectedEffort(
      finding,
    );

  const evidenceConfidence =
    calculateEvidenceConfidence(
      finding,
    );

  const priorityScore =
    clampScore(
      expectedBenefit * 0.4 +
      evidenceConfidence * 0.3 +
      (100 - expectedRisk) * 0.2 +
      (100 - expectedEffort) * 0.1,
    );

  let decision:
    RuntimeCapabilityInterventionDecision =
      "REVIEW_REQUIRED";

  if (
    finding.category === "GOVERNANCE" &&
    finding.severity === "CRITICAL"
  ) {
    decision =
      "REJECT";
  } else if (
    operatorAuthorized &&
    priorityScore >= 70 &&
    expectedRisk < 50
  ) {
    decision =
      "RECOMMEND";
  }

  const reasons: string[] = [
    `Finding severity: ${finding.severity}.`,
    `Expected benefit: ${expectedBenefit}/100.`,
    `Expected risk: ${expectedRisk}/100.`,
    `Expected effort: ${expectedEffort}/100.`,
    `Evidence confidence: ${evidenceConfidence}/100.`,
    `Priority score: ${priorityScore}/100.`,
  ];

  if (!operatorAuthorized) {
    reasons.push(
      "Operator authorization is absent; recommendation remains under review.",
    );
  }

  if (decision === "REJECT") {
    reasons.push(
      "The finding violates a critical governance boundary and cannot be recommended as a normal integration.",
    );
  }

  return Object.freeze({
    id:
      `INTERVENTION-${finding.id}`,

    findingId:
      finding.id,

    title:
      buildInterventionTitle(
        finding,
      ),

    hypothesis:
      buildInterventionHypothesis(
        finding,
      ),

    expectedEffect:
      buildInterventionEffect(
        finding,
      ),

    priorityScore,

    expectedBenefit,
    expectedRisk,
    expectedEffort,
    evidenceConfidence,

    decision,

    reasons:
      Object.freeze(reasons),

    humanAuthorizationRequired:
      true,

    automaticExecution:
      false,

    automaticRepositoryMutation:
      false,
  });
}

function buildSummary(
  findings:
    readonly RuntimeCapabilityFinding[],

  interventions:
    readonly RuntimeCapabilityIntervention[],

  capabilityScore: number,

  registeredCapabilities: number,

  capabilityGaps: number,
): Readonly<RuntimeCapabilityAssessmentSummary> {
  return Object.freeze({
    totalFindings:
      findings.length,

    criticalFindings:
      findings.filter(
        (finding) =>
          finding.severity === "CRITICAL",
      ).length,

    highFindings:
      findings.filter(
        (finding) =>
          finding.severity === "HIGH",
      ).length,

    mediumFindings:
      findings.filter(
        (finding) =>
          finding.severity === "MEDIUM",
      ).length,

    lowFindings:
      findings.filter(
        (finding) =>
          finding.severity === "LOW",
      ).length,

    informationalFindings:
      findings.filter(
        (finding) =>
          finding.severity === "INFO",
      ).length,

    interventionCandidates:
      interventions.length,

    recommendedInterventions:
      interventions.filter(
        (intervention) =>
          intervention.decision ===
          "RECOMMEND",
      ).length,

    reviewRequiredInterventions:
      interventions.filter(
        (intervention) =>
          intervention.decision ===
          "REVIEW_REQUIRED",
      ).length,

    rejectedInterventions:
      interventions.filter(
        (intervention) =>
          intervention.decision ===
          "REJECT",
      ).length,

    capabilityScore,
    registeredCapabilities,
    capabilityGaps,
  });
}

export function assessRuntimeCapabilities(
  input:
    RuntimeCapabilityAssessmentInput,
): Readonly<RuntimeCapabilityAssessmentResult> {
  const assessmentId =
    requireNonEmptyString(
      input.assessmentId,
      "RUNTIME_CAPABILITY_ASSESSMENT_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_CAPABILITY_ASSESSMENT_TIMESTAMP_REQUIRED",
    );

  if (
    input.runtimeSelfState
      .legalCertification !== false
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_ASSESSMENT_LEGAL_BOUNDARY_VIOLATION",
    );
  }

  const capabilityAnalysis =
    input.runtimeSelfState
      .capabilityAnalysis;

  const averageScore =
    requireScore(
      capabilityAnalysis.averageScore,
      "RUNTIME_CAPABILITY_ASSESSMENT_AVERAGE_SCORE_INVALID",
    );

  const totalCapabilities =
    capabilityAnalysis.totalCapabilities;

  if (
    !Number.isInteger(
      totalCapabilities,
    ) ||
    totalCapabilities < 0
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_ASSESSMENT_CAPABILITY_COUNT_INVALID",
    );
  }

  if (
    !Array.isArray(
      capabilityAnalysis.gaps,
    )
  ) {
    throw new Error(
      "RUNTIME_CAPABILITY_ASSESSMENT_GAPS_REQUIRED",
    );
  }

  const findings:
    RuntimeCapabilityFinding[] = [];

  const noCapabilitiesFinding =
    buildNoCapabilitiesFinding(
      totalCapabilities,
    );

  if (
    noCapabilitiesFinding !==
    undefined
  ) {
    findings.push(
      noCapabilitiesFinding,
    );
  }

  const scoreFinding =
    buildCapabilityScoreFinding(
      averageScore,
    );

  if (
    scoreFinding !== undefined
  ) {
    findings.push(
      scoreFinding,
    );
  }

  const repositoryFinding =
    buildRepositoryEvidenceFinding(
      input.runtimeSelfState,
    );

  if (
    repositoryFinding !==
    undefined
  ) {
    findings.push(
      repositoryFinding,
    );
  }

  capabilityAnalysis.gaps.forEach(
    (gap, index) => {
      findings.push(
        buildGapFinding(
          gap as CapabilityGapLike,
          index,
        ),
      );
    },
  );

  const orderedFindings =
    [...findings].sort(
      (left, right) => {
        const severityDifference =
          severityWeight(
            right.severity,
          ) -
          severityWeight(
            left.severity,
          );

        if (
          severityDifference !== 0
        ) {
          return severityDifference;
        }

        return left.id.localeCompare(
          right.id,
        );
      },
    );

  const operatorAuthorized =
    input.operatorAuthorized === true;

  const interventions =
    orderedFindings
      .map(
        (finding) =>
          buildIntervention(
            finding,
            operatorAuthorized,
          ),
      )
      .sort(
        (left, right) => {
          if (
            right.priorityScore !==
            left.priorityScore
          ) {
            return (
              right.priorityScore -
              left.priorityScore
            );
          }

          return left.id.localeCompare(
            right.id,
          );
        },
      );

  const topRecommendation =
    interventions.find(
      (intervention) =>
        intervention.decision ===
        "RECOMMEND",
    );

  const summary =
    buildSummary(
      orderedFindings,
      interventions,
      averageScore,
      totalCapabilities,
      capabilityAnalysis.gaps.length,
    );

  return Object.freeze({
    revision:
      RUNTIME_CAPABILITY_ASSESSMENT_REVISION,

    assessmentId,
    generatedAt,

    findings:
      Object.freeze(
        orderedFindings,
      ),

    interventions:
      Object.freeze(
        interventions,
      ),

    summary,

    topRecommendation,

    operatorAuthorized,

    governance:
      Object.freeze({
        readOnly:
          true,

        deterministic:
          true,

        failClosed:
          true,

        humanAuthorizationRequired:
          true,

        automaticExecution:
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
