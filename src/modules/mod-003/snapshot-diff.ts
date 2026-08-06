/**
 * HERMETICUM B.C.E. S.r.l.
 * AI JOKER-C2
 *
 * MOD-003
 * Repository Evolution Intelligence
 *
 * Snapshot Diff
 *
 * Deterministic: true
 * Fail Closed: true
 * Read Only: true
 * Human Authorization Required: true
 */

export interface RepositorySnapshotFile {
  readonly path: string;
  readonly hash?: string;
  readonly sizeBytes?: number;
}

export interface RepositorySnapshotDiffInput {
  readonly previousFiles: readonly RepositorySnapshotFile[];
  readonly currentFiles: readonly RepositorySnapshotFile[];
}

export interface ModifiedRepositoryFile {
  readonly path: string;
  readonly previousHash: string;
  readonly currentHash: string;
  readonly previousSizeBytes?: number;
  readonly currentSizeBytes?: number;
}

export interface RepositorySnapshotDiff {
  readonly addedFiles: readonly RepositorySnapshotFile[];
  readonly removedFiles: readonly RepositorySnapshotFile[];
  readonly modifiedFiles: readonly ModifiedRepositoryFile[];
  readonly unchangedFiles: readonly RepositorySnapshotFile[];
}

function normalizePath(path: string): string {
  return path.trim().replaceAll("\\", "/");
}

function normalizeHash(hash: string | undefined): string | undefined {
  if (typeof hash !== "string") {
    return undefined;
  }

  const normalized = hash.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeSizeBytes(sizeBytes: number | undefined): number | undefined {
  if (
    typeof sizeBytes !== "number" ||
    !Number.isFinite(sizeBytes) ||
    sizeBytes < 0
  ) {
    return undefined;
  }

  return Math.trunc(sizeBytes);
}

function normalizeFile(
  file: RepositorySnapshotFile,
): Readonly<RepositorySnapshotFile> {
  const path = normalizePath(file.path);

  if (path.length === 0) {
    throw new Error(
      "MOD_003_SNAPSHOT_DIFF_INVALID_FILE_PATH",
    );
  }

  return Object.freeze({
    path,
    hash: normalizeHash(file.hash),
    sizeBytes: normalizeSizeBytes(file.sizeBytes),
  });
}

function compareFilesByPath(
  left: RepositorySnapshotFile,
  right: RepositorySnapshotFile,
): number {
  return left.path.localeCompare(right.path);
}

function buildFileMap(
  files: readonly RepositorySnapshotFile[],
): ReadonlyMap<string, Readonly<RepositorySnapshotFile>> {
  const map = new Map<string, Readonly<RepositorySnapshotFile>>();

  for (const file of files) {
    const normalizedFile = normalizeFile(file);

    if (map.has(normalizedFile.path)) {
      throw new Error(
        `MOD_003_SNAPSHOT_DIFF_DUPLICATE_PATH:${normalizedFile.path}`,
      );
    }

    map.set(normalizedFile.path, normalizedFile);
  }

  return map;
}

function hasFileChanged(
  previousFile: RepositorySnapshotFile,
  currentFile: RepositorySnapshotFile,
): boolean {
  const previousHash = normalizeHash(previousFile.hash);
  const currentHash = normalizeHash(currentFile.hash);

  if (previousHash !== undefined && currentHash !== undefined) {
    return previousHash !== currentHash;
  }

  return previousFile.sizeBytes !== currentFile.sizeBytes;
}

export function createRepositorySnapshotDiff(
  input: RepositorySnapshotDiffInput,
): Readonly<RepositorySnapshotDiff> {
  if (
    !Array.isArray(input.previousFiles) ||
    !Array.isArray(input.currentFiles)
  ) {
    throw new Error(
      "MOD_003_SNAPSHOT_DIFF_INVALID_INPUT",
    );
  }

  const previousFilesByPath = buildFileMap(input.previousFiles);
  const currentFilesByPath = buildFileMap(input.currentFiles);

  const addedFiles: RepositorySnapshotFile[] = [];
  const removedFiles: RepositorySnapshotFile[] = [];
  const modifiedFiles: ModifiedRepositoryFile[] = [];
  const unchangedFiles: RepositorySnapshotFile[] = [];

  for (const [path, currentFile] of currentFilesByPath.entries()) {
    const previousFile = previousFilesByPath.get(path);

    if (previousFile === undefined) {
      addedFiles.push(currentFile);
      continue;
    }

    if (!hasFileChanged(previousFile, currentFile)) {
      unchangedFiles.push(currentFile);
      continue;
    }

    const previousHash = normalizeHash(previousFile.hash);
    const currentHash = normalizeHash(currentFile.hash);

    if (previousHash === undefined || currentHash === undefined) {
      throw new Error(
        `MOD_003_SNAPSHOT_DIFF_MISSING_HASH_FOR_MODIFIED_FILE:${path}`,
      );
    }

    modifiedFiles.push(
      Object.freeze({
        path,
        previousHash,
        currentHash,
        previousSizeBytes: previousFile.sizeBytes,
        currentSizeBytes: currentFile.sizeBytes,
      }),
    );
  }

  for (const [path, previousFile] of previousFilesByPath.entries()) {
    if (!currentFilesByPath.has(path)) {
      removedFiles.push(previousFile);
    }
  }

  addedFiles.sort(compareFilesByPath);
  removedFiles.sort(compareFilesByPath);
  unchangedFiles.sort(compareFilesByPath);
  modifiedFiles.sort((left, right) =>
    left.path.localeCompare(right.path),
  );

  return Object.freeze({
    addedFiles: Object.freeze(addedFiles),
    removedFiles: Object.freeze(removedFiles),
    modifiedFiles: Object.freeze(modifiedFiles),
    unchangedFiles: Object.freeze(unchangedFiles),
  });
}
