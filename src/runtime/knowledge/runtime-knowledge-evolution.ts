/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * Runtime Knowledge Evolution
 *
 * Compares two governed scientific cycles and produces a deterministic
 * evolution report.
 *
 * Previous Scientific Cycle
 * → Current Scientific Cycle
 * → Capability Delta
 * → Findings Delta
 * → Experiment Delta
 * → Decision Delta
 * → Trend Classification
 * → Governed Evolution Report
 *
 * This module does not:
 * - persist cycles;
 * - retrieve historical cycles automatically;
 * - execute experiments;
 * - modify the repository;
 * - accept proposals;
 * - issue legal certification.
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
  RuntimeScientificCycleResult,
} from "../scientific/runtime-scientific-cycle";

export const RUNTIME_KNOWLEDGE_EVOLUTION_REVISION =
  "AIJC2-RUNTIME-KNOWLEDGE-EVOLUTION-v1_0" as const;

export type RuntimeKnowledgeEvolutionTrend =
  | "STRONG_IMPROVEMENT"
  | "IMPROVEMENT"
  | "STABLE"
  | "REGRESSION"
  | "STRONG_REGRESSION"
  | "INCONCLUSIVE";

export type RuntimeKnowledgeEvolutionStatus =
  | "EVOLUTION_CONFIRMED"
  | "STABLE"
  | "REGRESSION_DETECTED"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export type RuntimeKnowledgeEvolutionFindingChange =
  | "ADDED"
  | "RESOLVED"
  | "UNCHANGED";

export interface RuntimeKnowledgeEvolutionMetric {
  readonly id: string;
  readonly label: string;

  readonly previousValue: number;
  readonly currentValue: number;
  readonly delta: number;

  readonly direction:
    | "IMPROVED"
    | "REGRESSED"
    | "UNCHANGED";

  readonly higherIsBetter: boolean;
}

export interface RuntimeKnowledgeEvolutionFinding {
  readonly findingId: string;

  readonly change:
    RuntimeKnowledgeEvolutionFindingChange;

  readonly previousSeverity?: string;
  readonly currentSeverity?: string;

  readonly title: string;
}

export interface RuntimeKnowledgeEvolutionDecisionComparison {
  readonly previousDecision:
    RuntimeScientificCycleResult["summary"]["finalDecision"];

  readonly currentDecision:
    RuntimeScientificCycleResult["summary"]["finalDecision"];

  readonly changed: boolean;

  readonly improved: boolean;
  readonly regressed: boolean;
}

export interface RuntimeKnowledgeEvolutionInput {
  readonly evolutionId: string;
  readonly generatedAt: string;

  readonly previousCycle:
    RuntimeScientificCycleResult;

  readonly currentCycle:
    RuntimeScientificCycleResult;

  readonly operatorAuthorized: boolean;
  readonly humanAuthorizationRequired: true;
}

export interface RuntimeKnowledgeEvolutionSummary {
  readonly capabilityScoreDelta: number;
  readonly registeredCapabilitiesDelta: number;
  readonly capabilityGapsDelta: number;

  readonly findingsDelta: number;
  readonly interventionsDelta: number;

  readonly questionsDelta: number;
  readonly hypothesesDelta: number;
  readonly experimentCandidatesDelta: number;

  readonly selectedExperimentScoreDelta?: number;

  readonly newFindings: number;
  readonly resolvedFindings: number;
  readonly unchangedFindings: number;

  readonly improvementSignals: number;
  readonly regressionSignals: number;
  readonly stableSignals: number;

  readonly evolutionScore: number;

  readonly trend:
    RuntimeKnowledgeEvolutionTrend;
}

export interface RuntimeKnowledgeEvolutionResult {
  readonly revision:
    typeof RUNTIME_KNOWLEDGE_EVOLUTION_REVISION;

  readonly evolutionId: string;
  readonly generatedAt: string;

  readonly previousCycleId: string;
  readonly currentCycleId: string;

  readonly status:
    RuntimeKnowledgeEvolutionStatus;

  readonly trend:
    RuntimeKnowledgeEvolutionTrend;

  readonly metrics:
    readonly RuntimeKnowledgeEvolutionMetric[];

  readonly findings:
    readonly RuntimeKnowledgeEvolutionFinding[];

  readonly decisionComparison:
    RuntimeKnowledgeEvolutionDecisionComparison;

  readonly summary:
    RuntimeKnowledgeEvolutionSummary;

  readonly reasons:
    readonly string[];

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

interface FindingProjection {
  readonly id: string;
  readonly title: string;
  readonly severity: string;
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

function requireFiniteNumber(
  value: number,
  code: string,
): number {
  if (!Number.isFinite(value)) {
    throw new Error(code);
  }

  return value;
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

function compareMetric(
  id: string,
  label: string,
  previousValue: number,
  currentValue: number,
  higherIsBetter: boolean,
): Readonly<RuntimeKnowledgeEvolutionMetric> {
  requireFiniteNumber(
    previousValue,
    `RUNTIME_KNOWLEDGE_EVOLUTION_PREVIOUS_${id}_INVALID`,
  );

  requireFiniteNumber(
    currentValue,
    `RUNTIME_KNOWLEDGE_EVOLUTION_CURRENT_${id}_INVALID`,
  );

  const delta =
    currentValue - previousValue;

  let direction:
    RuntimeKnowledgeEvolutionMetric["direction"] =
      "UNCHANGED";

  if (delta !== 0) {
    const improved =
      higherIsBetter
        ? delta > 0
        : delta < 0;

    direction =
      improved
        ? "IMPROVED"
        : "REGRESSED";
  }

  return Object.freeze({
    id,
    label,

    previousValue,
    currentValue,
    delta,

    direction,
    higherIsBetter,
  });
}

function validateCycle(
  cycle:
    RuntimeScientificCycleResult,

  prefix: string,
): void {
  if (
    cycle.legalCertification !==
    false
  ) {
    throw new Error(
      `RUNTIME_KNOWLEDGE_EVOLUTION_${prefix}_LEGAL_BOUNDARY_VIOLATION`,
    );
  }

  if (
    cycle.governance.readOnly !==
      true ||
    cycle.governance.deterministic !==
      true ||
    cycle.governance.failClosed !==
      true ||
    cycle.governance.automaticExecution !==
      false ||
    cycle.governance.automaticPersistence !==
      false ||
    cycle.governance.automaticRecall !==
      false ||
    cycle.governance
      .automaticRepositoryMutation !==
      false
  ) {
    throw new Error(
      `RUNTIME_KNOWLEDGE_EVOLUTION_${prefix}_GOVERNANCE_BOUNDARY_VIOLATION`,
    );
  }

  requireNonEmptyString(
    cycle.cycleId,
    `RUNTIME_KNOWLEDGE_EVOLUTION_${prefix}_CYCLE_ID_REQUIRED`,
  );

  requireNonEmptyString(
    cycle.generatedAt,
    `RUNTIME_KNOWLEDGE_EVOLUTION_${prefix}_TIMESTAMP_REQUIRED`,
  );
}

function findingProjection(
  cycle:
    RuntimeScientificCycleResult,
): readonly FindingProjection[] {
  return Object.freeze(
    cycle.capabilityAssessment
      .findings
      .map(
        (finding) =>
          Object.freeze({
            id:
              finding.id,

            title:
              finding.title,

            severity:
              finding.severity,
          }),
      )
      .sort(
        (left, right) =>
          left.id.localeCompare(
            right.id,
          ),
      ),
  );
}

function compareFindings(
  previousCycle:
    RuntimeScientificCycleResult,

  currentCycle:
    RuntimeScientificCycleResult,
): readonly RuntimeKnowledgeEvolutionFinding[] {
  const previous =
    findingProjection(
      previousCycle,
    );

  const current =
    findingProjection(
      currentCycle,
    );

  const previousMap =
    new Map(
      previous.map(
        (finding) => [
          finding.id,
          finding,
        ],
      ),
    );

  const currentMap =
    new Map(
      current.map(
        (finding) => [
          finding.id,
          finding,
        ],
      ),
    );

  const findingIds =
    Array.from(
      new Set([
        ...previousMap.keys(),
        ...currentMap.keys(),
      ]),
    ).sort();

  return Object.freeze(
    findingIds.map(
      (
        findingId,
      ): Readonly<RuntimeKnowledgeEvolutionFinding> => {
        const previousFinding =
          previousMap.get(
            findingId,
          );

        const currentFinding =
          currentMap.get(
            findingId,
          );

        if (
          previousFinding ===
          undefined
        ) {
          if (
            currentFinding ===
            undefined
          ) {
            throw new Error(
              `RUNTIME_KNOWLEDGE_EVOLUTION_FINDING_NOT_FOUND:${findingId}`,
            );
          }

          return Object.freeze({
            findingId,

            change:
              "ADDED",

            currentSeverity:
              currentFinding.severity,

            title:
              currentFinding.title,
          });
        }

        if (
          currentFinding ===
          undefined
        ) {
          return Object.freeze({
            findingId,

            change:
              "RESOLVED",

            previousSeverity:
              previousFinding.severity,

            title:
              previousFinding.title,
          });
        }

        return Object.freeze({
          findingId,

          change:
            "UNCHANGED",

          previousSeverity:
            previousFinding.severity,

          currentSeverity:
            currentFinding.severity,

          title:
            currentFinding.title,
        });
      },
    ),
  );
}

function decisionWeight(
  decision:
    RuntimeScientificCycleResult["summary"]["finalDecision"],
): number {
  switch (decision) {
    case "PROPOSE":
      return 4;

    case "REVIEW_REQUIRED":
      return 3;

    case "NO_ACTION":
      return 2;

    case "REJECT":
      return 1;

    default:
      return 0;
  }
}

function compareDecisions(
  previousCycle:
    RuntimeScientificCycleResult,

  currentCycle:
    RuntimeScientificCycleResult,
): Readonly<RuntimeKnowledgeEvolutionDecisionComparison> {
  const previousDecision =
    previousCycle.summary
      .finalDecision;

  const currentDecision =
    currentCycle.summary
      .finalDecision;

  const previousWeight =
    decisionWeight(
      previousDecision,
    );

  const currentWeight =
    decisionWeight(
      currentDecision,
    );

  return Object.freeze({
    previousDecision,
    currentDecision,

    changed:
      previousDecision !==
      currentDecision,

    improved:
      currentWeight >
      previousWeight,

    regressed:
      currentWeight <
      previousWeight,
  });
}

function optionalDelta(
  previousValue:
    number | undefined,

  currentValue:
    number | undefined,
): number | undefined {
  if (
    previousValue === undefined ||
    currentValue === undefined
  ) {
    return undefined;
  }

  return (
    currentValue -
    previousValue
  );
}

function calculateEvolutionScore(
  metrics:
    readonly RuntimeKnowledgeEvolutionMetric[],

  findings:
    readonly RuntimeKnowledgeEvolutionFinding[],

  decision:
    RuntimeKnowledgeEvolutionDecisionComparison,
): number {
  let score = 50;

  for (
    const metric
    of metrics
  ) {
    if (
      metric.direction ===
      "IMPROVED"
    ) {
      score += 6;
    }

    if (
      metric.direction ===
      "REGRESSED"
    ) {
      score -= 6;
    }
  }

  for (
    const finding
    of findings
  ) {
    if (
      finding.change ===
      "RESOLVED"
    ) {
      score += 5;
    }

    if (
      finding.change ===
      "ADDED"
    ) {
      score -= 5;
    }
  }

  if (
    decision.improved
  ) {
    score += 8;
  }

  if (
    decision.regressed
  ) {
    score -= 8;
  }

  return clampScore(
    score,
  );
}

function determineTrend(
  evolutionScore: number,

  improvementSignals: number,

  regressionSignals: number,
): RuntimeKnowledgeEvolutionTrend {
  if (
    improvementSignals === 0 &&
    regressionSignals === 0
  ) {
    return "STABLE";
  }

  if (
    improvementSignals > 0 &&
    regressionSignals > 0 &&
    Math.abs(
      improvementSignals -
      regressionSignals,
    ) <= 1
  ) {
    return "INCONCLUSIVE";
  }

  if (
    evolutionScore >= 75
  ) {
    return "STRONG_IMPROVEMENT";
  }

  if (
    evolutionScore >= 58
  ) {
    return "IMPROVEMENT";
  }

  if (
    evolutionScore <= 25
  ) {
    return "STRONG_REGRESSION";
  }

  if (
    evolutionScore <= 42
  ) {
    return "REGRESSION";
  }

  return "STABLE";
}

function determineStatus(
  trend:
    RuntimeKnowledgeEvolutionTrend,

  operatorAuthorized: boolean,
): RuntimeKnowledgeEvolutionStatus {
  if (
    !operatorAuthorized
  ) {
    return "REVIEW_REQUIRED";
  }

  switch (trend) {
    case "STRONG_IMPROVEMENT":
    case "IMPROVEMENT":
      return "EVOLUTION_CONFIRMED";

    case "STABLE":
      return "STABLE";

    case "REGRESSION":
    case "STRONG_REGRESSION":
      return "REGRESSION_DETECTED";

    case "INCONCLUSIVE":
    default:
      return "REVIEW_REQUIRED";
  }
}

function buildReasons(
  trend:
    RuntimeKnowledgeEvolutionTrend,

  metrics:
    readonly RuntimeKnowledgeEvolutionMetric[],

  findings:
    readonly RuntimeKnowledgeEvolutionFinding[],

  decision:
    RuntimeKnowledgeEvolutionDecisionComparison,

  operatorAuthorized: boolean,
): readonly string[] {
  const reasons: string[] = [
    `Evolution trend: ${trend}.`,
  ];

  for (
    const metric
    of metrics
  ) {
    reasons.push(
      `${metric.label}: ${metric.previousValue} → ${metric.currentValue} (${metric.delta >= 0 ? "+" : ""}${metric.delta}); ${metric.direction}.`,
    );
  }

  const resolvedFindings =
    findings.filter(
      (finding) =>
        finding.change ===
        "RESOLVED",
    ).length;

  const newFindings =
    findings.filter(
      (finding) =>
        finding.change ===
        "ADDED",
    ).length;

  reasons.push(
    `Resolved findings: ${resolvedFindings}.`,
  );

  reasons.push(
    `New findings: ${newFindings}.`,
  );

  reasons.push(
    `Decision changed: ${decision.changed}. Previous: ${decision.previousDecision}. Current: ${decision.currentDecision}.`,
  );

  if (
    !operatorAuthorized
  ) {
    reasons.push(
      "Operator authorization is absent; the evolution report remains under review.",
    );
  }

  reasons.push(
    "No historical cycle was retrieved automatically and no result was persisted.",
  );

  return Object.freeze(
    reasons,
  );
}

function createGovernance() {
  return Object.freeze({
    readOnly:
      true as const,

    deterministic:
      true as const,

    failClosed:
      true as const,

    humanAuthorizationRequired:
      true as const,

    automaticExecution:
      false as const,

    automaticPersistence:
      false as const,

    automaticRecall:
      false as const,

    automaticRepositoryMutation:
      false as const,

    legalCertification:
      false as const,
  });
}

export function compareRuntimeScientificCycles(
  input:
    RuntimeKnowledgeEvolutionInput,
): Readonly<RuntimeKnowledgeEvolutionResult> {
  const evolutionId =
    requireNonEmptyString(
      input.evolutionId,
      "RUNTIME_KNOWLEDGE_EVOLUTION_ID_REQUIRED",
    );

  const generatedAt =
    requireNonEmptyString(
      input.generatedAt,
      "RUNTIME_KNOWLEDGE_EVOLUTION_TIMESTAMP_REQUIRED",
    );

  if (
    input.humanAuthorizationRequired !==
    true
  ) {
    throw new Error(
      "RUNTIME_KNOWLEDGE_EVOLUTION_AUTHORIZATION_INVARIANT_VIOLATION",
    );
  }

  validateCycle(
    input.previousCycle,
    "PREVIOUS",
  );

  validateCycle(
    input.currentCycle,
    "CURRENT",
  );

  if (
    input.previousCycle.cycleId ===
    input.currentCycle.cycleId
  ) {
    throw new Error(
      "RUNTIME_KNOWLEDGE_EVOLUTION_DISTINCT_CYCLES_REQUIRED",
    );
  }

  const previousSummary =
    input.previousCycle
      .summary;

  const currentSummary =
    input.currentCycle
      .summary;

  const metrics =
    Object.freeze([
      compareMetric(
        "CAPABILITY_SCORE",
        "Capability Score",
        previousSummary
          .capabilityScore,
        currentSummary
          .capabilityScore,
        true,
      ),

      compareMetric(
        "REGISTERED_CAPABILITIES",
        "Registered Capabilities",
        previousSummary
          .registeredCapabilities,
        currentSummary
          .registeredCapabilities,
        true,
      ),

      compareMetric(
        "CAPABILITY_GAPS",
        "Capability Gaps",
        previousSummary
          .capabilityGaps,
        currentSummary
          .capabilityGaps,
        false,
      ),

      compareMetric(
        "FINDINGS",
        "Findings",
        previousSummary
          .findings,
        currentSummary
          .findings,
        false,
      ),

      compareMetric(
        "INTERVENTION_CANDIDATES",
        "Intervention Candidates",
        previousSummary
          .interventionCandidates,
        currentSummary
          .interventionCandidates,
        false,
      ),

      compareMetric(
        "SCIENTIFIC_QUESTIONS",
        "Scientific Questions",
        previousSummary
          .scientificQuestions,
        currentSummary
          .scientificQuestions,
        false,
      ),

      compareMetric(
        "SCIENTIFIC_HYPOTHESES",
        "Scientific Hypotheses",
        previousSummary
          .scientificHypotheses,
        currentSummary
          .scientificHypotheses,
        false,
      ),

      compareMetric(
        "EXPERIMENT_CANDIDATES",
        "Experiment Candidates",
        previousSummary
          .experimentCandidates,
        currentSummary
          .experimentCandidates,
        false,
      ),
    ]);

  const findings =
    compareFindings(
      input.previousCycle,
      input.currentCycle,
    );

  const decisionComparison =
    compareDecisions(
      input.previousCycle,
      input.currentCycle,
    );

  const improvementSignals =
    metrics.filter(
      (metric) =>
        metric.direction ===
        "IMPROVED",
    ).length +
    findings.filter(
      (finding) =>
        finding.change ===
        "RESOLVED",
    ).length +
    (
      decisionComparison.improved
        ? 1
        : 0
    );

  const regressionSignals =
    metrics.filter(
      (metric) =>
        metric.direction ===
        "REGRESSED",
    ).length +
    findings.filter(
      (finding) =>
        finding.change ===
        "ADDED",
    ).length +
    (
      decisionComparison.regressed
        ? 1
        : 0
    );

  const stableSignals =
    metrics.filter(
      (metric) =>
        metric.direction ===
        "UNCHANGED",
    ).length +
    findings.filter(
      (finding) =>
        finding.change ===
        "UNCHANGED",
    ).length;

  const evolutionScore =
    calculateEvolutionScore(
      metrics,
      findings,
      decisionComparison,
    );

  const trend =
    determineTrend(
      evolutionScore,
      improvementSignals,
      regressionSignals,
    );

  const operatorAuthorized =
    input.operatorAuthorized ===
    true;

  const status =
    determineStatus(
      trend,
      operatorAuthorized,
    );

  const selectedExperimentScoreDelta =
    optionalDelta(
      previousSummary
        .selectedExperimentScore,

      currentSummary
        .selectedExperimentScore,
    );

  const summary:
    Readonly<RuntimeKnowledgeEvolutionSummary> =
      Object.freeze({
        capabilityScoreDelta:
          currentSummary
            .capabilityScore -
          previousSummary
            .capabilityScore,

        registeredCapabilitiesDelta:
          currentSummary
            .registeredCapabilities -
          previousSummary
            .registeredCapabilities,

        capabilityGapsDelta:
          currentSummary
            .capabilityGaps -
          previousSummary
            .capabilityGaps,

        findingsDelta:
          currentSummary.findings -
          previousSummary.findings,

        interventionsDelta:
          currentSummary
            .interventionCandidates -
          previousSummary
            .interventionCandidates,

        questionsDelta:
          currentSummary
            .scientificQuestions -
          previousSummary
            .scientificQuestions,

        hypothesesDelta:
          currentSummary
            .scientificHypotheses -
          previousSummary
            .scientificHypotheses,

        experimentCandidatesDelta:
          currentSummary
            .experimentCandidates -
          previousSummary
            .experimentCandidates,

        selectedExperimentScoreDelta,

        newFindings:
          findings.filter(
            (finding) =>
              finding.change ===
              "ADDED",
          ).length,

        resolvedFindings:
          findings.filter(
            (finding) =>
              finding.change ===
              "RESOLVED",
          ).length,

        unchangedFindings:
          findings.filter(
            (finding) =>
              finding.change ===
              "UNCHANGED",
          ).length,

        improvementSignals,
        regressionSignals,
        stableSignals,

        evolutionScore,
        trend,
      });

  const reasons =
    buildReasons(
      trend,
      metrics,
      findings,
      decisionComparison,
      operatorAuthorized,
    );

  return Object.freeze({
    revision:
      RUNTIME_KNOWLEDGE_EVOLUTION_REVISION,

    evolutionId,
    generatedAt,

    previousCycleId:
      input.previousCycle.cycleId,

    currentCycleId:
      input.currentCycle.cycleId,

    status,
    trend,

    metrics,
    findings,

    decisionComparison,

    summary,
    reasons,

    operatorAuthorized,

    governance:
      createGovernance(),

    legalCertification:
      false,
  });
}
