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
 * - allow only safe text-oriented formats by default
 * - reject secrets and environment files by name
 * - reject executable, archive and binary formats by default
 * - enforce size limits
 * - preserve explicit processing status
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
  allowed: boolean;
  files: Array<FilePolicyResult & { name?: string; type?: string; size?: number }>;
  rejectedCount: number;
  allowedCount: number;
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

const REJECTED_EXTENSIONS = new Set([
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
  ".db",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx"
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

  if (extension && REJECTED_EXTENSIONS.has(extension)) {
    return buildResult({
      allowed: false,
      status: "UNSUPPORTED",
      reason: `File extension ${extension} is not supported by the safe file policy.`,
      maxSizeBytes
    });
  }

  if (mimeType && isRejectedMimeType(mimeType)) {
    return buildResult({
      allowed: false,
      status: "UNSUPPORTED",
      reason: `MIME type ${mimeType} is not supported by the safe file policy.`,
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
      "File type could not be classified as a supported safe text-oriented format.",
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
  const rejectedCount = results.length - allowedCount;

  return {
    allowed: rejectedCount === 0,
    files: results,
    allowedCount,
    rejectedCount,
    reasons: results.map((result) => {
      const name = result.name ? `${result.name}: ` : "";
      return `${name}${result.reason}`;
    })
  };
}

export function isFileAllowed(result: FilePolicyResult): boolean {
  return result.allowed && result.status === "TEXT_EXTRACTED";
}

export function isFileRejected(result: FilePolicyResult): boolean {
  return (
    !result.allowed &&
    (result.status === "REJECTED" || result.status === "UNSUPPORTED")
  );
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
    `Allowed: ${result.allowed ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Reason: ${result.reason}`,
    `Max size bytes: ${result.maxSizeBytes}`
  ].join("\n");
}

export function getSupportedFilePolicyDescription(): string {
  return [
    "Supported file types by default:",
    Array.from(ALLOWED_EXTENSIONS).join(", "),
    "",
    "Supported MIME types by default:",
    Array.from(ALLOWED_MIME_TYPES).join(", "),
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
  return result.allowed;
}

export function isSensitiveFileName(fileName: string): boolean {
  const normalized = normalizeFileName(fileName);

  return SENSITIVE_FILE_NAME_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );
}

function isRejectedMimeType(mimeType: string): boolean {
  if (!mimeType) {
    return false;
  }

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
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
    mimeType.startsWith("application/pdf") ||
    mimeType.startsWith("application/msword") ||
    mimeType.startsWith("application/vnd.") ||
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
