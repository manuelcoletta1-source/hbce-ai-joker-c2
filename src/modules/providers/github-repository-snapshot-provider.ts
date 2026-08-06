/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Milestone 21 — Real Repository Analysis
 *
 * GitHub Repository Snapshot Provider
 *
 * Revision:
 * AIJC2-GITHUB-REPOSITORY-SNAPSHOT-PROVIDER-v1_0
 *
 * Purpose:
 * - read an explicitly authorized GitHub repository tree;
 * - resolve the current branch commit SHA;
 * - normalize GitHub tree entries into RepositoryScannerInput;
 * - preserve Git blob hashes as source evidence;
 * - reject truncated or malformed responses;
 * - perform no repository mutation.
 *
 * GitHub access:
 * - GET repository branch;
 * - GET recursive Git tree;
 * - optional read-only bearer token;
 * - no create, update, delete, commit, push, merge or deploy.
 *
 * Explicit exclusions:
 * - no autonomous repository discovery;
 * - no raw source-content retrieval;
 * - no source-code execution;
 * - no AST parsing;
 * - no persistent memory;
 * - no automatic recall;
 * - no legal certification.
 *
 * legalCertification=false
 */

import type {
  RepositoryScannerFile,
  RepositoryScannerInput,
} from "../engines/repository-scanner.types";

export const GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION =
  "AIJC2-GITHUB-REPOSITORY-SNAPSHOT-PROVIDER-v1_0" as const;

export const GITHUB_REST_API_VERSION =
  "2026-03-10" as const;

const GITHUB_API_ORIGIN =
  "https://api.github.com" as const;

export interface GitHubRepositorySnapshotProviderInput {
  owner: string;

  repository: string;

  branch: string;

  token?: string | null;

  repositoryId?: string | null;

  maximumFiles?: number;

  excludedPathPrefixes?: readonly string[];

  humanAuthorization: boolean;

  legalCertification: false;
}

export interface GitHubRepositorySnapshotMetadata {
  providerRevision:
    typeof GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION;

  apiVersion:
    typeof GITHUB_REST_API_VERSION;

  owner: string;

  repository: string;

  branch: string;

  commitSha: string;

  treeSha: string;

  totalTreeEntries: number;

  totalFiles: number;

  excludedFiles: number;

  authenticated: boolean;

  recursive: true;

  truncated: false;

  rawContentRetrieved: false;

  sourceExecution: false;

  legalCertification: false;
}

export interface GitHubRepositorySnapshotProviderOutput {
  ok: true;

  status:
    "GITHUB_REPOSITORY_SNAPSHOT_READY";

  snapshot: RepositoryScannerInput;

  metadata: GitHubRepositorySnapshotMetadata;

  governance: {
    deterministicNormalization: true;

    explicitRepositoryRequired: true;

    humanAuthorizationRequired: true;

    humanAuthorizationVerified: true;

    readOnlyGitHubAccess: true;

    rawContentRetrieved: false;

    autonomousExecution: false;

    autonomousMutation: false;

    persistentMemoryCreated: false;

    automaticRecallUsed: false;

    legalCertification: false;
  };

  legalCertification: false;
}

export class GitHubRepositorySnapshotProviderError
  extends Error {
  readonly code: string;

  readonly httpStatus: number | null;

  constructor(
    code: string,
    message: string,
    httpStatus: number | null = null,
  ) {
    super(message);

    this.name =
      "GitHubRepositorySnapshotProviderError";

    this.code =
      code;

    this.httpStatus =
      httpStatus;
  }
}

interface GitHubBranchResponse {
  name: string;

  commit: {
    sha: string;
  };
}

interface GitHubTreeEntry {
  path: string;

  mode: string;

  type:
    | "blob"
    | "tree"
    | "commit";

  sha: string;

  size?: number;

  url?: string;
}

interface GitHubTreeResponse {
  sha: string;

  url: string;

  tree: GitHubTreeEntry[];

  truncated: boolean;
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_REQUIRED_STRING",
      `${fieldName} must be a non-empty string`,
    );
  }

  return value.trim();
}

function normalizeRepositorySegment(
  value: unknown,
  fieldName: string,
): string {
  const normalized =
    normalizeRequiredString(
      value,
      fieldName,
    );

  if (
    normalized.includes("/") ||
    normalized.includes("\\") ||
    normalized.includes("..")
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_REPOSITORY_SEGMENT",
      `${fieldName} contains unsupported path characters`,
    );
  }

  return normalized;
}

function normalizeBranch(
  value: unknown,
): string {
  const normalized =
    normalizeRequiredString(
      value,
      "branch",
    );

  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.endsWith("/") ||
    normalized.includes("\\")
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_BRANCH",
      "branch contains unsupported path characters",
    );
  }

  return normalized;
}

function normalizeMaximumFiles(
  value: unknown,
): number {
  if (
    value === undefined
  ) {
    return 25_000;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 100_000
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_MAXIMUM_FILES",
      "maximumFiles must be an integer between 1 and 100000",
    );
  }

  return value;
}

function normalizePath(
  value: string,
): string {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

function getDirectory(
  path: string,
): string {
  const normalized =
    normalizePath(
      path,
    );

  const separatorIndex =
    normalized.lastIndexOf("/");

  if (
    separatorIndex < 0
  ) {
    return ".";
  }

  return (
    normalized.slice(
      0,
      separatorIndex,
    ) ||
    "."
  );
}

function getExtension(
  path: string,
): string {
  const normalized =
    normalizePath(
      path,
    );

  const fileName =
    normalized.split("/").at(-1) ??
    normalized;

  const separatorIndex =
    fileName.lastIndexOf(".");

  if (
    separatorIndex <= 0 ||
    separatorIndex ===
      fileName.length - 1
  ) {
    return "";
  }

  return fileName
    .slice(
      separatorIndex + 1,
    )
    .toLowerCase();
}

function normalizeExcludedPrefixes(
  prefixes:
    readonly string[] | undefined,
): readonly string[] {
  if (
    !prefixes
  ) {
    return Object.freeze([
      ".git/",
      "node_modules/",
      ".next/",
      "dist/",
      "build/",
      "coverage/",
    ]);
  }

  return Object.freeze(
    [
      ...new Set(
        prefixes
          .map(
            (prefix) =>
              normalizePath(
                normalizeRequiredString(
                  prefix,
                  "excludedPathPrefixes",
                ),
              ),
          )
          .filter(
            (prefix) =>
              prefix.length > 0,
          )
          .map(
            (prefix) =>
              prefix.endsWith("/")
                ? prefix
                : `${prefix}/`,
          ),
      ),
    ].sort(),
  );
}

function isExcludedPath(
  path: string,
  excludedPrefixes:
    readonly string[],
): boolean {
  const normalized =
    normalizePath(
      path,
    );

  return excludedPrefixes.some(
    (prefix) =>
      normalized.startsWith(
        prefix,
      ),
  );
}

function buildHeaders(
  token:
    string | null,
): HeadersInit {
  const headers:
    Record<string, string> = {
    Accept:
      "application/vnd.github+json",

    "X-GitHub-Api-Version":
      GITHUB_REST_API_VERSION,

    "User-Agent":
      "HBCE-AI-JOKER-C2",
  };

  if (
    token
  ) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
}

async function parseGitHubError(
  response:
    Response,
): Promise<string> {
  try {
    const payload =
      await response.json() as {
        message?: unknown;
      };

    if (
      typeof payload.message ===
        "string" &&
      payload.message.trim().length >
        0
    ) {
      return payload.message.trim();
    }
  } catch {
    // Preserve the HTTP status when GitHub does not return JSON.
  }

  return (
    response.statusText ||
    "GitHub API request failed"
  );
}

async function fetchGitHubJson<T>(
  url: string,
  headers: HeadersInit,
): Promise<T> {
  let response:
    Response;

  try {
    response =
      await fetch(
        url,
        {
          method:
            "GET",

          headers,

          cache:
            "no-store",

          redirect:
            "error",
        },
      );
  } catch (error) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_NETWORK_FAILURE",
      error instanceof Error
        ? error.message
        : "GitHub API network request failed",
    );
  }

  if (
    !response.ok
  ) {
    const message =
      await parseGitHubError(
        response,
      );

    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_API_FAILURE",
      `GitHub API returned ${response.status}: ${message}`,
      response.status,
    );
  }

  try {
    return await response.json() as T;
  } catch {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_JSON_RESPONSE",
      "GitHub API returned an invalid JSON response",
      response.status,
    );
  }
}

function validateBranchResponse(
  response:
    GitHubBranchResponse,
  expectedBranch:
    string,
): void {
  if (
    typeof response !== "object" ||
    response === null ||
    typeof response.name !==
      "string" ||
    typeof response.commit !==
      "object" ||
    response.commit === null ||
    typeof response.commit.sha !==
      "string" ||
    response.commit.sha.trim().length ===
      0
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_BRANCH_RESPONSE",
      "GitHub returned an invalid branch response",
    );
  }

  if (
    response.name !==
    expectedBranch
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_BRANCH_MISMATCH",
      `GitHub returned branch ${response.name} instead of ${expectedBranch}`,
    );
  }
}

function validateTreeResponse(
  response:
    GitHubTreeResponse,
): void {
  if (
    typeof response !== "object" ||
    response === null ||
    typeof response.sha !==
      "string" ||
    response.sha.trim().length ===
      0 ||
    !Array.isArray(
      response.tree,
    ) ||
    typeof response.truncated !==
      "boolean"
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_INVALID_TREE_RESPONSE",
      "GitHub returned an invalid repository tree response",
    );
  }

  if (
    response.truncated
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_TREE_TRUNCATED",
      "GitHub truncated the recursive repository tree; snapshot generation stopped fail-closed",
    );
  }
}

function normalizeTreeFiles(
  entries:
    readonly GitHubTreeEntry[],
  excludedPrefixes:
    readonly string[],
  maximumFiles:
    number,
): {
  files: readonly RepositoryScannerFile[];

  excludedFiles: number;
} {
  const seenPaths =
    new Set<string>();

  const files:
    RepositoryScannerFile[] = [];

  let excludedFiles =
    0;

  const blobEntries =
    entries
      .filter(
        (entry) =>
          entry.type ===
          "blob",
      )
      .sort(
        (left, right) =>
          left.path.localeCompare(
            right.path,
          ),
      );

  for (
    const entry
    of blobEntries
  ) {
    if (
      typeof entry.path !==
        "string" ||
      typeof entry.sha !==
        "string" ||
      entry.path.trim().length ===
        0 ||
      entry.sha.trim().length ===
        0
    ) {
      throw new GitHubRepositorySnapshotProviderError(
        "GITHUB_SNAPSHOT_INVALID_TREE_ENTRY",
        "GitHub returned a malformed blob entry",
      );
    }

    const path =
      normalizePath(
        entry.path,
      );

    if (
      isExcludedPath(
        path,
        excludedPrefixes,
      )
    ) {
      excludedFiles +=
        1;

      continue;
    }

    if (
      seenPaths.has(
        path,
      )
    ) {
      throw new GitHubRepositorySnapshotProviderError(
        "GITHUB_SNAPSHOT_DUPLICATE_PATH",
        `GitHub tree contains duplicate path: ${path}`,
      );
    }

    seenPaths.add(
      path,
    );

    const sizeBytes =
      entry.size === undefined
        ? 0
        : entry.size;

    if (
      !Number.isInteger(
        sizeBytes,
      ) ||
      sizeBytes < 0
    ) {
      throw new GitHubRepositorySnapshotProviderError(
        "GITHUB_SNAPSHOT_INVALID_FILE_SIZE",
        `GitHub returned an invalid size for ${path}`,
      );
    }

    files.push(
      Object.freeze({
        path,

        extension:
          getExtension(
            path,
          ),

        directory:
          getDirectory(
            path,
          ),

        sizeBytes,

        hash:
          entry.sha.trim(),

        inspected:
          false,
      }),
    );

    if (
      files.length >
      maximumFiles
    ) {
      throw new GitHubRepositorySnapshotProviderError(
        "GITHUB_SNAPSHOT_MAXIMUM_FILES_EXCEEDED",
        `Repository contains more than the authorized maximum of ${maximumFiles} files`,
      );
    }
  }

  return {
    files:
      Object.freeze(
        files,
      ),

    excludedFiles,
  };
}

/**
 * Builds a normalized, read-only RepositoryScannerInput from an
 * explicitly identified GitHub repository and branch.
 *
 * This provider retrieves repository metadata and tree entries only.
 * It does not retrieve raw file contents, so every file remains
 * inspected=false until a separate authorized inspection stage occurs.
 */
export async function createGitHubRepositorySnapshot(
  input:
    GitHubRepositorySnapshotProviderInput,
): Promise<GitHubRepositorySnapshotProviderOutput> {
  if (
    input.legalCertification !==
    false
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_LEGAL_BOUNDARY_VIOLATION",
      "GitHub Repository Snapshot Provider requires legalCertification=false",
    );
  }

  if (
    input.humanAuthorization !==
    true
  ) {
    throw new GitHubRepositorySnapshotProviderError(
      "GITHUB_SNAPSHOT_HUMAN_AUTHORIZATION_REQUIRED",
      "Human authorization is required before GitHub repository access",
    );
  }

  const owner =
    normalizeRepositorySegment(
      input.owner,
      "owner",
    );

  const repository =
    normalizeRepositorySegment(
      input.repository,
      "repository",
    );

  const branch =
    normalizeBranch(
      input.branch,
    );

  const repositoryId =
    normalizeOptionalRepositoryId(
      input.repositoryId,
      owner,
      repository,
    );

  const maximumFiles =
    normalizeMaximumFiles(
      input.maximumFiles,
    );

  const excludedPrefixes =
    normalizeExcludedPrefixes(
      input.excludedPathPrefixes,
    );

  const token =
    typeof input.token ===
      "string" &&
    input.token.trim().length >
      0
      ? input.token.trim()
      : null;

  const headers =
    buildHeaders(
      token,
    );

  const encodedOwner =
    encodeURIComponent(
      owner,
    );

  const encodedRepository =
    encodeURIComponent(
      repository,
    );

  const encodedBranch =
    encodeURIComponent(
      branch,
    );

  const branchResponse =
    await fetchGitHubJson<GitHubBranchResponse>(
      `${GITHUB_API_ORIGIN}/repos/${encodedOwner}/${encodedRepository}/branches/${encodedBranch}`,
      headers,
    );

  validateBranchResponse(
    branchResponse,
    branch,
  );

  const commitSha =
    branchResponse
      .commit
      .sha
      .trim();

  const treeResponse =
    await fetchGitHubJson<GitHubTreeResponse>(
      `${GITHUB_API_ORIGIN}/repos/${encodedOwner}/${encodedRepository}/git/trees/${encodedBranch}?recursive=1`,
      headers,
    );

  validateTreeResponse(
    treeResponse,
  );

  const normalized =
    normalizeTreeFiles(
      treeResponse.tree,
      excludedPrefixes,
      maximumFiles,
    );

  const snapshot:
    RepositoryScannerInput =
    Object.freeze({
      repositoryId,

      repositoryName:
        repository,

      branch,

      commitSha,

      files:
        normalized.files,
    });

  return Object.freeze({
    ok:
      true,

    status:
      "GITHUB_REPOSITORY_SNAPSHOT_READY",

    snapshot,

    metadata:
      Object.freeze({
        providerRevision:
          GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_REVISION,

        apiVersion:
          GITHUB_REST_API_VERSION,

        owner,

        repository,

        branch,

        commitSha,

        treeSha:
          treeResponse.sha.trim(),

        totalTreeEntries:
          treeResponse.tree.length,

        totalFiles:
          normalized.files.length,

        excludedFiles:
          normalized.excludedFiles,

        authenticated:
          token !== null,

        recursive:
          true,

        truncated:
          false,

        rawContentRetrieved:
          false,

        sourceExecution:
          false,

        legalCertification:
          false,
      }),

    governance:
      Object.freeze({
        deterministicNormalization:
          true,

        explicitRepositoryRequired:
          true,

        humanAuthorizationRequired:
          true,

        humanAuthorizationVerified:
          true,

        readOnlyGitHubAccess:
          true,

        rawContentRetrieved:
          false,

        autonomousExecution:
          false,

        autonomousMutation:
          false,

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

function normalizeOptionalRepositoryId(
  value: unknown,
  owner: string,
  repository: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return `${owner}/${repository}`;
  }

  return value.trim();
}

export const GITHUB_REPOSITORY_SNAPSHOT_PROVIDER_BOUNDARY =
  Object.freeze({
    explicitOwnerRequired:
      true,

    explicitRepositoryRequired:
      true,

    explicitBranchRequired:
      true,

    humanAuthorizationRequired:
      true,

    readOnlyGitHubAccess:
      true,

    branchMetadataRead:
      true,

    recursiveTreeRead:
      true,

    rawContentRetrieval:
      false,

    filesystemAccess:
      false,

    sourceExecution:
      false,

    astParsing:
      false,

    automaticRepositoryDiscovery:
      false,

    autonomousMutation:
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
