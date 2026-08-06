/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003
 * Change Classifier
 *
 * Deterministic
 * Fail Closed
 * Read Only
 */

import { RepositorySnapshotDiff } from "./snapshot-diff";

export type ChangeRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface RepositoryChangeClassification {

  readonly risk: ChangeRisk;

  readonly score: number;

  readonly summary: string;

}

function clamp(value: number): number {

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return Math.trunc(value);

}

export function classifyRepositoryChanges(

  diff: RepositorySnapshotDiff,

): Readonly<RepositoryChangeClassification> {

  const added = diff.addedFiles.length;

  const removed = diff.removedFiles.length;

  const modified = diff.modifiedFiles.length;

  let score =
    added +
    (modified * 2) +
    (removed * 3);

  score = clamp(score);

  let risk: ChangeRisk = "LOW";

  if (score >= 75) {

    risk = "CRITICAL";

  } else if (score >= 40) {

    risk = "HIGH";

  } else if (score >= 15) {

    risk = "MEDIUM";

  }

  return Object.freeze({

    risk,

    score,

    summary:
      `added=${added}, modified=${modified}, removed=${removed}`,

  });

}
