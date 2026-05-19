/**
 * AI JOKER-C2 File Policy
 *
 * Deterministic file handling policy for the HBCE / MATRIX governed runtime.
 *
 * This module evaluates uploaded or provided file metadata before the runtime
 * attempts to process content.
 *
 * File policy rules:
 * - do not execute uploaded files
 * - do not trust file names blindly
 * - allow only safe text-oriented formats for direct prompt processing
 * - reject secrets and environment files by name
 * - reject executable, archive and dangerous binary formats by default
 * - treat PDF / Office documents as reference-only, non-blocking files
 * - enforce size limits
 * - preserve explicit processing status
 *
 * Important runtime boundary:
 * Unsupported but non-dangerous document files, such as PDF, should not block
 * a safe textual request. They should be excluded from prompt text extraction
 * and treated as REFERENCE_ONLY / PARTIAL by the caller.
 */

import type {
  FilePolicyResult,
  FileProcessingStatus
} from "./runtime-types";

export type FilePolicyInput = {
  name?: string;
  type?: string;
  size?: number;
};

export type FilePolicyBatchResult = {
  /**
   * True when the request may continue.
   *
   * This means:
   * - directly processable text files may be used;
   * - reference-only files may be ignored by the prompt layer;
   * - hard-rejected files are absent.
   */
  allowed: boolean;

  files: Array<FilePolicyResult & { name?: string; type?: string; size?: number }>;

  /**
   * Count of files that are not directly processable as text.
   * Includes both reference-only and hard-rejected files.
   */
  rejectedCount: number;

  /**
   * Count of files allowed for direct text extraction.
   */
  allowedCount: number;

  /**
   * Count of unsupported but non-dangerous files that should not block
   * the request and should be handled as metadata/reference only.
   */
  referenceOnlyCount: number;

  /**
   * Count of files that must block file-backed processing because they are
   * dangerous, secret-bearing, invalid or explicitly rejected.
   */
  blockingRejectedCount: number;

  /**
   * True when at least one file can be safely processed as extracted text.
   */
  processableTextCount: number;

  reasons: string[];
};

export const DEFAULT_MAX_FILE_SIZE_BYTES = 1_000_000;

const ALLOWED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".csv"
]);

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/csv",
  "application/json"
]);

/**
 * Reference-only document formats.
 *
 * These formats are not processed directly as text by the safe runtime.
 * They should not block an otherwise safe request, but they should be excluded
 * from prompt injection unless a trusted extractor has already converted them
 * into safe plain text outside this policy layer.
 */
const REFERENCE_ONLY_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx"
]);

const REFERENCE_ONLY_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-",
  "application/vnd.oasis.opendocument"
];

const HARD_REJECTED_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".bat",
  ".cmd",
  ".ps1",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".com",
  ".scr",
  ".jar",
  ".war",
  ".class",
  ".pyc",
  ".wasm",
  ".apk",
  ".ipa",
  ".deb",
  ".rpm",
  ".msi",
  ".dmg",
  ".iso",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".xz",
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".crt",
  ".cer",
  ".der",
  ".sqlite",
  ".db"
]);

const SENSITIVE_FILE_NAME_PATTERNS = [
  /^\.env/i,
  /\.env(\.|$)/i,
  /(^|[/\\])id_rsa$/i,
  /(^|[/\\])id_dsa$/i,
  /(^|[/\\])id_ecdsa$/i,
  /(^|[/\\])id_ed25519$/i,
  /private[_-]?key/i,
  /secret/i,
  /credential/i,
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /service[_-]?account/i
];

export function evaluateFilePolicy(
  input: FilePolicyInput,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES
): FilePolicyResult {
  const name = normalizeFileName(input.name);
  const mimeType = normalizeMimeType(input.type);
  const size = normalizeFileSize(input.size);
  const extension = getFileExtension(name);

  if (!name && !mimeType && size === undefined) {
    return buildResult({
      allowed: false,
      status: "NOT_PROCESSED",
      reason: "No file metadata was provided.",
      maxSizeBytes
    });
  }

  if (size !== undefined && size < 0) {
    return buildResult({
      allowed: false,
      status: "REJECTED",
      reason: "File size is invalid.",
      maxSizeBytes
    });
  }

  if (size !== undefined && size > maxSizeBytes) {
    return buildResult({
      allowed: false,
      status: "REJECTED",
      reason: `File exceeds maximum allowed size of ${maxSizeBytes} bytes.`,
      maxSizeBytes
    });
  }

  if (name && isSensitiveFileName(name)) {
    return buildResult({
      allowed: false,
      status: "REJECTED",
      reason:
        "File name indicates secrets, credentials, environment variables or private keys.",
      maxSizeBytes
    });
  }

  if (extension && HARD_REJECTED_EXTENSIONS.has(extension)) {
    return buildResult({
      allowed: false,
      status: "REJECTED",
      reason: `File extension ${extension} is rejected by the safe file policy.`,
      maxSizeBytes
    });
  }

  if (mimeType && isHardRejectedMimeType(mimeType)) {
    return buildResult({
      allowed: false,
      status: "REJECTED",
      reason: `MIME type ${mimeType} is rejected by the safe file policy.`,
      maxSizeBytes
    });
  }

  if (
    (extension && REFERENCE_ONLY_EXTENSIONS.has(extension)) ||
    (mimeType && isReferenceOnlyMimeType(mimeType))
  ) {
    return buildResult({
      allowed: false,
      status: "PARTIAL",
      reason:
        "File is a reference-only document format. It is not processed as safe text by the current file policy and should not block a safe textual request.",
      maxSizeBytes
    });
  }

  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    return buildResult({
      allowed: true,
      status: "TEXT_EXTRACTED",
      reason: `File extension ${extension} is allowed for safe text processing.`,
      maxSizeBytes
    });
  }

  if (mimeType && ALLOWED_MIME_TYPES.has(mimeType)) {
    return buildResult({
      allowed: true,
      status: "TEXT_EXTRACTED",
      reason: `MIME type ${mimeType} is allowed for safe text processing.`,
      maxSizeBytes
    });
  }

  if (name && !extension && mimeType && ALLOWED_MIME_TYPES.has(mimeType)) {
    return buildResult({
      allowed: true,
      status: "TEXT_EXTRACTED",
      reason:
        "File has no extension, but MIME type is allowed for safe text processing.",
      maxSizeBytes
    });
  }

  if (!name && mimeType && ALLOWED_MIME_TYPES.has(mimeType)) {
    return buildResult({
      allowed: true,
      status: "PARTIAL",
      reason:
        "File name is missing, but MIME type is allowed. Processing status is partial.",
      maxSizeBytes
    });
  }

  return buildResult({
    allowed: false,
    status: "UNSUPPORTED",
    reason:
      "File type could not be classified as a supported safe text-oriented format. It should not block a safe textual request, but it should be ignored as prompt content unless converted to safe text.",
    maxSizeBytes
  });
}

export function evaluateFileBatchPolicy(
  files: FilePolicyInput[],
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES
): FilePolicyBatchResult {
  const results = files.map((file) => {
    const policy = evaluateFilePolicy(file, maxSizeBytes);

    return {
      ...policy,
      name: file.name,
      type: file.type,
      size: file.size
    };
  });

  const allowedCount = results.filter((result) => result.allowed).length;
  const referenceOnlyCount = results.filter(isReferenceOnlyResult).length;
  const blockingRejectedCount = results.filter(isBlockingRejectedResult).length;
  const rejectedCount = results.length - allowedCount;

  return {
    allowed: blockingRejectedCount === 0,
    files: results,
    allowedCount,
    rejectedCount,
    referenceOnlyCount,
    blockingRejectedCount,
    processableTextCount: allowedCount,
    reasons: results.map((result) => {
      const name = result.name ? `${result.name}: ` : "";
      return `${name}${result.reason}`;
    })
  };
}

export function isFileAllowed(result: FilePolicyResult): boolean {
  return result.allowed && result.status === "TEXT_EXTRACTED";
}

export function isFileReferenceOnly(result: FilePolicyResult): boolean {
  return isReferenceOnlyResult(result);
}

export function isFileRejected(result: FilePolicyResult): boolean {
  return isBlockingRejectedResult(result);
}

export function requiresFileReview(result: FilePolicyResult): boolean {
  return (
    result.status === "PARTIAL" ||
    result.status === "FAILED" ||
    result.status === "UNSUPPORTED" ||
    result.status === "REJECTED"
  );
}

export function buildFilePolicySummary(result: FilePolicyResult): string {
  return [
    `Allowed for direct text processing: ${result.allowed ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Reason: ${result.reason}`,
    `Max size bytes: ${result.maxSizeBytes}`
  ].join("\n");
}

export function getSupportedFilePolicyDescription(): string {
  return [
    "Supported file types for direct safe text processing:",
    Array.from(ALLOWED_EXTENSIONS).join(", "),
    "",
    "Supported MIME types for direct safe text processing:",
    Array.from(ALLOWED_MIME_TYPES).join(", "),
    "",
    "Reference-only document formats:",
    Array.from(REFERENCE_ONLY_EXTENSIONS).join(", "),
    "",
    "Executable, archive, binary, credential and environment files are rejected by default."
  ].join("\n");
}

export function getFileExtension(fileName: string): string {
  const cleanName = normalizeFileName(fileName);

  if (!cleanName || cleanName.startsWith(".env")) {
    return "";
  }

  const lastSegment = cleanName.split(/[\\/]/).pop() ?? cleanName;
  const lastDot = lastSegment.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === lastSegment.length - 1) {
    return "";
  }

  return lastSegment.slice(lastDot).toLowerCase();
}

export function isSupportedTextFile(input: FilePolicyInput): boolean {
  const result = evaluateFilePolicy(input);
  return result.allowed && result.status === "TEXT_EXTRACTED";
}

export function isSensitiveFileName(fileName: string): boolean {
  const normalized = normalizeFileName(fileName);

  return SENSITIVE_FILE_NAME_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );
}

function isReferenceOnlyResult(result: FilePolicyResult): boolean {
  return (
    !result.allowed &&
    (result.status === "PARTIAL" || result.status === "UNSUPPORTED") &&
    result.reason.toLowerCase().includes("should not block")
  );
}

function isBlockingRejectedResult(result: FilePolicyResult): boolean {
  if (result.allowed) {
    return false;
  }

  if (result.status === "REJECTED" || result.status === "FAILED") {
    return true;
  }

  if (result.status === "UNSUPPORTED") {
    return !result.reason.toLowerCase().includes("should not block");
  }

  return false;
}

function isReferenceOnlyMimeType(mimeType: string): boolean {
  return REFERENCE_ONLY_MIME_TYPES.some((prefix) =>
    mimeType.startsWith(prefix)
  );
}

function isHardRejectedMimeType(mimeType: string): boolean {
  if (!mimeType) {
    return false;
  }

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    return false;
  }

  if (isReferenceOnlyMimeType(mimeType)) {
    return false;
  }

  return (
    mimeType.startsWith("application/octet-stream") ||
    mimeType.startsWith("application/x-msdownload") ||
    mimeType.startsWith("application/x-sh") ||
    mimeType.startsWith("application/x-bat") ||
    mimeType.startsWith("application/x-powershell") ||
    mimeType.startsWith("application/zip") ||
    mimeType.startsWith("application/x-7z") ||
    mimeType.startsWith("application/x-rar") ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("video/")
  );
}

function normalizeFileName(value?: string): string {
  return (value ?? "").trim();
}

function normalizeMimeType(value?: string): string {
  return (value ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function normalizeFileSize(value?: number): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return value;
}

function buildResult(input: {
  allowed: boolean;
  status: FileProcessingStatus;
  reason: string;
  maxSizeBytes: number;
}): FilePolicyResult {
  return {
    allowed: input.allowed,
    status: input.status,
    reason: input.reason,
    maxSizeBytes: input.maxSizeBytes
  };
}
