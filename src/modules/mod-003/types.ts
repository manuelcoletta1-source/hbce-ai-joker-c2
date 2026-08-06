/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003
 * Repository Evolution Intelligence
 *
 * Shared Domain Types
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 */

export type EvolutionRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DependencyChangeType =
  | "ADDED"
  | "REMOVED"
  | "MODIFIED";

export type SemanticChangeImpact =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface DependencyChange {
  readonly source: string;
  readonly target: string;
  readonly type: DependencyChangeType;
}

export interface SemanticChange {
  readonly category: string;
  readonly description: string;
  readonly impact: SemanticChangeImpact;
}

export interface RepositoryEvolution {
  readonly previousCommit: string;
  readonly currentCommit: string;

  readonly addedFiles: number;
  readonly removedFiles: number;
  readonly modifiedFiles: number;
  readonly renamedFiles: number;

  readonly dependencyChanges: readonly DependencyChange[];
  readonly semanticChanges: readonly SemanticChange[];

  readonly riskLevel: EvolutionRiskLevel;

  readonly generatedAt: string;
}
