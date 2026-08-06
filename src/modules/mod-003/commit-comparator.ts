/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003
 * Commit Comparator
 *
 * Deterministic
 * Read Only
 * Fail Closed
 */

import {
  createRepositorySnapshotDiff,
  RepositorySnapshotDiff,
  RepositorySnapshotFile,
} from "./snapshot-diff";

export interface RepositoryCommitSnapshot {
  readonly commit: string;
  readonly files: readonly RepositorySnapshotFile[];
}

export interface RepositoryCommitComparison {
  readonly previousCommit: string;
  readonly currentCommit: string;
  readonly diff: Readonly<RepositorySnapshotDiff>;
}

function normalizeCommit(commit: string): string {
  const normalized = commit.trim();

  if (normalized.length === 0) {
    throw new Error("MOD_003_INVALID_COMMIT");
  }

  return normalized;
}

export function compareRepositoryCommits(
  previous: RepositoryCommitSnapshot,
  current: RepositoryCommitSnapshot,
): Readonly<RepositoryCommitComparison> {
  const previousCommit = normalizeCommit(previous.commit);
  const currentCommit = normalizeCommit(current.commit);

  const diff = createRepositorySnapshotDiff({
    previousFiles: previous.files,
    currentFiles: current.files,
  });

  return Object.freeze({
    previousCommit,
    currentCommit,
    diff,
  });
}
