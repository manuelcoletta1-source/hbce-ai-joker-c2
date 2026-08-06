/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003
 * Repository Evolution Engine
 *
 * Deterministic
 * Read Only
 * Fail Closed
 */

import {
  compareRepositoryCommits,
  RepositoryCommitComparison,
  RepositoryCommitSnapshot,
} from "./commit-comparator";

import {
  classifyRepositoryChanges,
  RepositoryChangeClassification,
} from "./change-classifier";

export interface RepositoryEvolutionResult {

  readonly comparison: RepositoryCommitComparison;

  readonly classification: RepositoryChangeClassification;

}

export function analyzeRepositoryEvolution(

  previous: RepositoryCommitSnapshot,

  current: RepositoryCommitSnapshot,

): Readonly<RepositoryEvolutionResult> {

  const comparison =
    compareRepositoryCommits(
      previous,
      current,
    );

  const classification =
    classifyRepositoryChanges(
      comparison.diff,
    );

  return Object.freeze({

    comparison,

    classification,

  });

}
