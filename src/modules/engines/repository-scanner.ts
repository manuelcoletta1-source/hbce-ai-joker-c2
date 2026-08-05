/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-001 Repository Scanner
 *
 * Deterministic Scanner Engine
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-SCANNER-v1_0
 *
 * Scope:
 * - analyse an explicitly supplied repository file list;
 * - classify files deterministically;
 * - aggregate directory and repository statistics;
 * - preserve fail-closed validation;
 * - perform no filesystem or GitHub access.
 *
 * Explicit exclusions:
 * - no filesystem scanning;
 * - no GitHub API access;
 * - no dynamic imports;
 * - no source-code execution;
 * - no persistent memory;
 * - no automatic recall;
 * - no autonomous mutation;
 * - legalCertification=false.
 */

import {
  REPOSITORY_SCANNER_BOUNDARY,
  REPOSITORY_SCANNER_REVISION,
  type RepositoryScannerDirectory,
  type RepositoryScannerFile,
  type RepositoryScannerInput,
  type RepositoryScannerOutput,
  type RepositoryScannerStatistics,
} from "./repository-scanner.types";

export const REPOSITORY_SCANNER_ENGINE_REVISION =
  "AIJC2-MOD001-REPOSITORY-SCANNER-v1_0" as const;

const SOURCE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "java",
  "kt",
  "kts",
  "go",
  "rs",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "php",
  "rb",
  "swift",
  "scala",
  "sh",
  "bash",
  "zsh",
]);

const DOCUMENTATION_EXTENSIONS = new Set([
  "md",
  "mdx",
  "txt",
  "rst",
  "adoc",
  "pdf",
  "doc",
  "docx",
]);

const CONFIGURATION_FILE_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "jsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vite.config.js",
  "vite.config.ts",
  "vitest.config.js",
  "vitest.config.ts",
  "jest.config.js",
  "jest.config.ts",
  "eslint.config.js",
  "eslint.config.mjs",
  ".eslintrc",
  ".eslintrc.json",
  ".prettierrc",
  ".prettierrc.json",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "vercel.json",
  "netlify.toml",
  "wrangler.toml",
]);

const CONFIGURATION_EXTENSIONS = new Set([
  "json",
  "jsonc",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "config",
  "env",
]);

export class RepositoryScannerError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryScannerError";
    this.code = code;
  }
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new RepositoryScannerError(
      "REPOSITORY_SCANNER_REQUIRED_STRING",
      `${fieldName} must be a string`,
    );
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RepositoryScannerError(
      "REPOSITORY_SCANNER_REQUIRED_STRING",
      `${fieldName} must not be empty`,
    );
  }

  return normalized;
}

function normalizePath(path: string): string {
  return path
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

function getFileName(path: string): string {
  const segments = path.split("/");

  return segments[segments.length - 1] ?? path;
}

function getDirectory(path: string): string {
  const normalized = normalizePath(path);
  const separatorIndex = normalized.lastIndexOf("/");

  if (separatorIndex < 0) {
    return ".";
  }

  return normalized.slice(0, separatorIndex) || ".";
}

function getExtension(path: string): string {
  const fileName = getFileName(path);
  const separatorIndex = fileName.lastIndexOf(".");

  if (
    separatorIndex <= 0 ||
    separatorIndex === fileName.length - 1
  ) {
    return "";
  }

  return fileName
    .slice(separatorIndex + 1)
    .toLowerCase();
}

function isTestFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  const fileName = getFileName(normalized);

  return (
    normalized.includes("/__tests__/") ||
    normalized.includes("/tests/") ||
    normalized.includes("/test/") ||
    fileName.includes(".test.") ||
    fileName.includes(".spec.") ||
    fileName.startsWith("test_") ||
    fileName.endsWith("_test.ts") ||
    fileName.endsWith("_test.js") ||
    fileName.endsWith("_test.py")
  );
}

function isDocumentationFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  const extension = getExtension(normalized);
  const fileName = getFileName(normalized);

  return (
    DOCUMENTATION_EXTENSIONS.has(extension) ||
    normalized.startsWith("docs/") ||
    normalized.includes("/docs/") ||
    fileName === "readme" ||
    fileName.startsWith("readme.")
  );
}

function isConfigurationFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  const fileName = getFileName(normalized);
  const extension = getExtension(normalized);

  return (
    CONFIGURATION_FILE_NAMES.has(fileName) ||
    CONFIGURATION_EXTENSIONS.has(extension) ||
    fileName.startsWith(".env") ||
    normalized.startsWith(".github/") ||
    normalized.includes("/.github/")
  );
}

function isSourceFile(path: string): boolean {
  return SOURCE_EXTENSIONS.has(
    getExtension(path),
  );
}

function isApiFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();

  return (
    normalized.startsWith("app/api/") ||
    normalized.includes("/app/api/") ||
    normalized.startsWith("pages/api/") ||
    normalized.includes("/pages/api/") ||
    normalized.startsWith("api/") ||
    normalized.includes("/api/")
  );
}

function isRuntimeFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();

  return (
    normalized.startsWith("src/runtime/") ||
    normalized.includes("/src/runtime/") ||
    normalized.startsWith("runtime/") ||
    normalized.includes("/runtime/")
  );
}

function isModuleFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();

  return (
    normalized.startsWith("src/modules/") ||
    normalized.includes("/src/modules/") ||
    normalized.startsWith("modules/") ||
    normalized.includes("/modules/")
  );
}

function validateInput(
  input: RepositoryScannerInput,
): void {
  normalizeRequiredString(
    input.repositoryId,
    "repositoryId",
  );

  normalizeRequiredString(
    input.repositoryName,
    "repositoryName",
  );

  normalizeRequiredString(
    input.branch,
    "branch",
  );

  normalizeRequiredString(
    input.commitSha,
    "commitSha",
  );

  if (!Array.isArray(input.files)) {
    throw new RepositoryScannerError(
      "REPOSITORY_SCANNER_FILES_REQUIRED",
      "files must be an array",
    );
  }

  const seenPaths = new Set<string>();

  for (const file of input.files) {
    const normalizedPath = normalizePath(
      normalizeRequiredString(
        file.path,
        "file.path",
      ),
    );

    if (normalizedPath.length === 0) {
      throw new RepositoryScannerError(
        "REPOSITORY_SCANNER_INVALID_PATH",
        "file.path must not be empty",
      );
    }

    if (seenPaths.has(normalizedPath)) {
      throw new RepositoryScannerError(
        "REPOSITORY_SCANNER_DUPLICATE_PATH",
        `Duplicate repository file path: ${normalizedPath}`,
      );
    }

    seenPaths.add(normalizedPath);

    if (
      !Number.isInteger(file.sizeBytes) ||
      file.sizeBytes < 0
    ) {
      throw new RepositoryScannerError(
        "REPOSITORY_SCANNER_INVALID_SIZE",
        `Invalid sizeBytes for ${normalizedPath}`,
      );
    }

    if (typeof file.inspected !== "boolean") {
      throw new RepositoryScannerError(
        "REPOSITORY_SCANNER_INVALID_INSPECTION_STATE",
        `inspected must be boolean for ${normalizedPath}`,
      );
    }
  }
}

function normalizeFile(
  file: RepositoryScannerFile,
): RepositoryScannerFile {
  const path = normalizePath(file.path);

  return Object.freeze({
    path,

    extension:
      getExtension(path),

    directory:
      getDirectory(path),

    sizeBytes:
      file.sizeBytes,

    ...(file.hash
      ? {
          hash:
            file.hash.trim(),
        }
      : {}),

    inspected:
      file.inspected,
  });
}

function buildDirectories(
  files: readonly RepositoryScannerFile[],
): readonly RepositoryScannerDirectory[] {
  const fileCountByDirectory =
    new Map<string, number>();

  for (const file of files) {
    fileCountByDirectory.set(
      file.directory,
      (
        fileCountByDirectory.get(
          file.directory,
        ) ?? 0
      ) + 1,
    );
  }

  return Object.freeze(
    [...fileCountByDirectory.entries()]
      .sort(
        ([left], [right]) =>
          left.localeCompare(right),
      )
      .map(
        ([path, fileCount]) =>
          Object.freeze({
            path,
            fileCount,
          }),
      ),
  );
}

function buildStatistics(
  files: readonly RepositoryScannerFile[],
  directories:
    readonly RepositoryScannerDirectory[],
): RepositoryScannerStatistics {
  let sourceFiles = 0;
  let testFiles = 0;
  let documentationFiles = 0;
  let configurationFiles = 0;
  let apiFiles = 0;
  let runtimeFiles = 0;
  let moduleFiles = 0;

  for (const file of files) {
    if (isSourceFile(file.path)) {
      sourceFiles += 1;
    }

    if (isTestFile(file.path)) {
      testFiles += 1;
    }

    if (isDocumentationFile(file.path)) {
      documentationFiles += 1;
    }

    if (isConfigurationFile(file.path)) {
      configurationFiles += 1;
    }

    if (isApiFile(file.path)) {
      apiFiles += 1;
    }

    if (isRuntimeFile(file.path)) {
      runtimeFiles += 1;
    }

    if (isModuleFile(file.path)) {
      moduleFiles += 1;
    }
  }

  return Object.freeze({
    totalFiles:
      files.length,

    sourceFiles,

    testFiles,

    documentationFiles,

    configurationFiles,

    apiFiles,

    runtimeFiles,

    moduleFiles,

    directories:
      directories.length,
  });
}

/**
 * Builds a deterministic repository index from an explicitly supplied
 * file list.
 *
 * The scanner does not access the filesystem or external services.
 */
export function scanRepository(
  input: RepositoryScannerInput,
): RepositoryScannerOutput {
  validateInput(input);

  const files = Object.freeze(
    input.files
      .map(normalizeFile)
      .sort(
        (left, right) =>
          left.path.localeCompare(
            right.path,
          ),
      ),
  );

  const directories =
    buildDirectories(files);

  const statistics =
    buildStatistics(
      files,
      directories,
    );

  return Object.freeze({
    repositoryId:
      input.repositoryId.trim(),

    repositoryName:
      input.repositoryName.trim(),

    branch:
      input.branch.trim(),

    commitSha:
      input.commitSha.trim(),

    statistics,

    directories,

    scannedAt:
      new Date().toISOString(),

    legalCertification:
      false,
  });
}

export const REPOSITORY_SCANNER_ENGINE_BOUNDARY =
  Object.freeze({
    ...REPOSITORY_SCANNER_BOUNDARY,

    revision:
      REPOSITORY_SCANNER_REVISION,

    engineRevision:
      REPOSITORY_SCANNER_ENGINE_REVISION,

    deterministicClassification:
      true,

    duplicatePathsRejected:
      true,

    invalidFileSizesRejected:
      true,

    normalizedRepositoryPaths:
      true,

    sourceExecution:
      false,

    autonomousMutation:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,
  });
