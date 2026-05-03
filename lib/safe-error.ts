/**
 * AI JOKER-C2 Safe Error Module
 *
 * Public-safe error normalization for the HERMETICUM B.C.E. governed runtime.
 *
 * This module prevents API routes and runtime modules from exposing:
 * - secrets
 * - stack traces
 * - raw internal errors
 * - sensitive file content
 * - provider errors with private metadata
 * - uncontrolled diagnostics
 *
 * Errors should be useful, bounded and safe.
 */

import type { SafeError, SafeErrorCode } from "./runtime-types";

export type SafeErrorInput = {
  code?: SafeErrorCode;
  message?: string;
  status?: number;
  cause?: unknown;
  publicDetails?: Record<string, unknown>;
};

export type SafeErrorResponse = {
  ok: false;
  error: {
    code: SafeErrorCode;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
};

export type SafeSuccessResponse<T> = {
  ok: true;
  data: T;
};

const DEFAULT_SAFE_ERROR: SafeError = {
  code: "RUNTIME_ERROR",
  message: "The runtime could not complete the operation safely.",
  status: 500
};

const SAFE_ERROR_MESSAGES: Record<SafeErrorCode, string> = {
  INPUT_ERROR: "The request input is invalid or incomplete.",
  DOMAIN_ERROR: "The request project domain could not be classified safely.",
  POLICY_ERROR: "The request could not pass runtime policy evaluation.",
  RISK_ERROR: "The request could not pass runtime risk evaluation.",
  MODEL_ERROR: "The model provider could not complete the request safely.",
  FILE_ERROR: "The file could not be processed safely.",
  EVT_ERROR: "The runtime event could not be created or verified safely.",
  LEDGER_ERROR: "The event ledger could not be updated or read safely.",
  SECURITY_ERROR: "The request triggered a security boundary.",
  RUNTIME_ERROR: "The runtime could not complete the operation safely."
};

const DEFAULT_STATUS_BY_CODE: Record<SafeErrorCode, number> = {
  INPUT_ERROR: 400,
  DOMAIN_ERROR: 422,
  POLICY_ERROR: 403,
  RISK_ERROR: 409,
  MODEL_ERROR: 502,
  FILE_ERROR: 400,
  EVT_ERROR: 500,
  LEDGER_ERROR: 500,
  SECURITY_ERROR: 403,
  RUNTIME_ERROR: 500
};

const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\bsk-proj-[A-Za-z0-9_-]{12,}\b/g,
  /\b[A-Za-z0-9_]*API[_-]?KEY[A-Za-z0-9_]*\s*[:=]\s*["']?[A-Za-z0-9._-]{8,}/gi,
  /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /\baccess[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{8,}/gi,
  /\brefresh[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{8,}/gi,
  /\bpassword\s*[:=]\s*["']?[^"'\s]{6,}/gi,
  /\bprivate[_-]?key\s*[:=][^\n]+/gi,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH |)PRIVATE KEY-----/gi
];

export function toSafeError(
  error: unknown,
  fallback?: SafeErrorInput
): SafeError {
  const fallbackCode = fallback?.code ?? "RUNTIME_ERROR";
  const fallbackStatus =
    fallback?.status ?? DEFAULT_STATUS_BY_CODE[fallbackCode] ?? 500;

  if (isSafeError(error)) {
    return normalizeSafeError(error);
  }

  if (isErrorLike(error)) {
    return normalizeSafeError({
      code: inferErrorCode(error, fallbackCode),
      message: fallback?.message ?? SAFE_ERROR_MESSAGES[fallbackCode],
      status: fallbackStatus
    });
  }

  if (typeof error === "string") {
    return normalizeSafeError({
      code: fallbackCode,
      message: fallback?.message ?? sanitizePublicMessage(error),
      status: fallbackStatus
    });
  }

  return normalizeSafeError({
    code: fallbackCode,
    message: fallback?.message ?? SAFE_ERROR_MESSAGES[fallbackCode],
    status: fallbackStatus
  });
}

export function createSafeError(input: SafeErrorInput): SafeError {
  const code = input.code ?? "RUNTIME_ERROR";

  return normalizeSafeError({
    code,
    message: input.message ?? SAFE_ERROR_MESSAGES[code],
    status: input.status ?? DEFAULT_STATUS_BY_CODE[code]
  });
}

export function createInputError(message?: string): SafeError {
  return createSafeError({ code: "INPUT_ERROR", message, status: 400 });
}

export function createDomainError(message?: string): SafeError {
  return createSafeError({ code: "DOMAIN_ERROR", message, status: 422 });
}

export function createPolicyError(message?: string): SafeError {
  return createSafeError({ code: "POLICY_ERROR", message, status: 403 });
}

export function createRiskError(message?: string): SafeError {
  return createSafeError({ code: "RISK_ERROR", message, status: 409 });
}

export function createModelError(message?: string): SafeError {
  return createSafeError({ code: "MODEL_ERROR", message, status: 502 });
}

export function createFileError(message?: string): SafeError {
  return createSafeError({ code: "FILE_ERROR", message, status: 400 });
}

export function createEvtError(message?: string): SafeError {
  return createSafeError({ code: "EVT_ERROR", message, status: 500 });
}

export function createLedgerError(message?: string): SafeError {
  return createSafeError({ code: "LEDGER_ERROR", message, status: 500 });
}

export function createSecurityError(message?: string): SafeError {
  return createSafeError({ code: "SECURITY_ERROR", message, status: 403 });
}

export function buildSafeErrorResponse(
  error: unknown,
  fallback?: SafeErrorInput
): SafeErrorResponse {
  const safeError = toSafeError(error, fallback);
  const details = sanitizePublicDetails(fallback?.publicDetails);

  return {
    ok: false,
    error: {
      code: safeError.code,
      message: safeError.message,
      status: safeError.status,
      ...(details ? { details } : {})
    }
  };
}

export function buildSafeSuccessResponse<T>(data: T): SafeSuccessResponse<T> {
  return { ok: true, data };
}

export function sanitizePublicMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return DEFAULT_SAFE_ERROR.message;
  }

  const withoutSecrets = SECRET_PATTERNS.reduce((current, pattern) => {
    return current.replace(pattern, "[REDACTED_SECRET]");
  }, trimmed);

  const withoutStackPaths = withoutSecrets
    .replace(/\/[A-Za-z0-9._/-]+\/node_modules\/[^\s)]+/g, "[INTERNAL_PATH]")
    .replace(/[A-Za-z]:\\[A-Za-z0-9._\\/-]+/g, "[INTERNAL_PATH]")
    .replace(/\bat\s+[A-Za-z0-9_$.[\]]+\s+\([^)]+\)/g, "[STACK_FRAME]")
    .replace(/\bat\s+[^\n]+/g, "[STACK_FRAME]");

  return truncateMessage(withoutStackPaths, 500);
}

export function sanitizePublicDetails(
  details?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(details).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, sanitizePublicMessage(value)] as const;
    }

    return [key, value] as const;
  });

  return Object.fromEntries(sanitizedEntries);
}

export function isSafeError(value: unknown): value is SafeError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SafeError>;

  return Boolean(
    candidate.code &&
      candidate.message &&
      typeof candidate.status === "number"
  );
}

export function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

export function getHttpStatusFromError(error: SafeError): number {
  if (Number.isInteger(error.status) && error.status >= 400 && error.status <= 599) {
    return error.status;
  }

  return 500;
}

export function isClientError(error: SafeError): boolean {
  return error.status >= 400 && error.status < 500;
}

export function isServerError(error: SafeError): boolean {
  return error.status >= 500;
}

export function buildSafeDiagnostic(error: SafeError): Record<string, unknown> {
  return {
    code: error.code,
    status: error.status,
    message: error.message
  };
}

export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({
      error: "Value could not be serialized safely."
    });
  }
}

export function wrapAsyncRuntimeError<T>(
  promise: Promise<T>,
  fallback?: SafeErrorInput
): Promise<T> {
  return promise.catch((error) => {
    throw toSafeError(error, fallback);
  });
}

export function assertOrThrowSafeError(
  condition: unknown,
  input: SafeErrorInput
): asserts condition {
  if (!condition) {
    throw createSafeError(input);
  }
}

function normalizeSafeError(error: SafeError): SafeError {
  const code = normalizeErrorCode(error.code);
  const status = normalizeStatus(error.status, code);
  const message = sanitizePublicMessage(error.message || SAFE_ERROR_MESSAGES[code]);

  return { code, message, status };
}

function normalizeErrorCode(code: string): SafeErrorCode {
  const allowed: SafeErrorCode[] = [
    "INPUT_ERROR",
    "DOMAIN_ERROR",
    "POLICY_ERROR",
    "RISK_ERROR",
    "MODEL_ERROR",
    "FILE_ERROR",
    "EVT_ERROR",
    "LEDGER_ERROR",
    "SECURITY_ERROR",
    "RUNTIME_ERROR"
  ];

  return allowed.includes(code as SafeErrorCode)
    ? (code as SafeErrorCode)
    : "RUNTIME_ERROR";
}

function normalizeStatus(status: number, code: SafeErrorCode): number {
  if (Number.isInteger(status) && status >= 400 && status <= 599) {
    return status;
  }

  return DEFAULT_STATUS_BY_CODE[code] ?? 500;
}

function inferErrorCode(error: Error, fallbackCode: SafeErrorCode): SafeErrorCode {
  const text = `${error.name} ${error.message}`.toLowerCase();

  if (
    text.includes("input") ||
    text.includes("validation") ||
    text.includes("invalid request") ||
    text.includes("bad request")
  ) {
    return "INPUT_ERROR";
  }

  if (
    text.includes("domain") ||
    text.includes("project domain") ||
    text.includes("project-domain") ||
    text.includes("classification") ||
    text.includes("classifier")
  ) {
    return "DOMAIN_ERROR";
  }

  if (
    text.includes("policy") ||
    text.includes("prohibited") ||
    text.includes("not allowed")
  ) {
    return "POLICY_ERROR";
  }

  if (text.includes("risk")) {
    return "RISK_ERROR";
  }

  if (
    text.includes("openai") ||
    text.includes("model") ||
    text.includes("provider") ||
    text.includes("upstream")
  ) {
    return "MODEL_ERROR";
  }

  if (
    text.includes("file") ||
    text.includes("upload") ||
    text.includes("mime")
  ) {
    return "FILE_ERROR";
  }

  if (text.includes("evt") || text.includes("event")) {
    return "EVT_ERROR";
  }

  if (text.includes("ledger")) {
    return "LEDGER_ERROR";
  }

  if (
    text.includes("secret") ||
    text.includes("credential") ||
    text.includes("token") ||
    text.includes("security")
  ) {
    return "SECURITY_ERROR";
  }

  return fallbackCode;
}

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength - 3)}...`;
}
