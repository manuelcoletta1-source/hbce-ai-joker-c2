/**
 * AI JOKER-C2 EVT Hash Module
 *
 * Deterministic canonicalization and SHA-256 hashing for the HBCE / MATRIX
 * governed runtime.
 *
 * This module supports:
 * - EVT integrity references
 * - ledger continuity
 * - verification
 * - evidence packs
 * - audit-ready traceability
 *
 * Hashing supports integrity.
 * Hashing does not create legal authorization, certification or compliance.
 */

import { createHash } from "crypto";

export const EVT_HASH_ALGORITHM = "sha256" as const;
export const EVT_CANONICALIZATION = "deterministic-json" as const;

export type HashAlgorithm = typeof EVT_HASH_ALGORITHM;
export type CanonicalizationMethod = typeof EVT_CANONICALIZATION;

export type HashResult = {
  hash: string;
  algorithm: HashAlgorithm;
  canonicalization: CanonicalizationMethod;
  canonical: string;
};

export type HashVerificationResult = {
  valid: boolean;
  expected: string;
  actual: string;
  algorithm: HashAlgorithm;
  canonicalization: CanonicalizationMethod;
  reason: string;
};

export function canonicalize(value: unknown): string {
  const canonicalValue = toCanonicalValue(value, new WeakSet<object>());

  return JSON.stringify(canonicalValue);
}

export function sha256(value: string): string {
  return `${EVT_HASH_ALGORITHM}:${createHash(EVT_HASH_ALGORITHM)
    .update(value, "utf8")
    .digest("hex")}`;
}

export function hashCanonical(value: unknown): HashResult {
  const canonical = canonicalize(value);

  return {
    hash: sha256(canonical),
    algorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    canonical
  };
}

export function hashText(value: string): HashResult {
  return {
    hash: sha256(value),
    algorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    canonical: value
  };
}

export function verifyHash(value: unknown, expectedHash: string): HashVerificationResult {
  const result = hashCanonical(value);
  const normalizedExpected = normalizeHash(expectedHash);
  const normalizedActual = normalizeHash(result.hash);
  const valid = normalizedExpected === normalizedActual;

  return {
    valid,
    expected: normalizedExpected,
    actual: normalizedActual,
    algorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    reason: valid
      ? "Hash verification succeeded."
      : "Hash verification failed."
  };
}

export function verifyTextHash(
  value: string,
  expectedHash: string
): HashVerificationResult {
  const result = hashText(value);
  const normalizedExpected = normalizeHash(expectedHash);
  const normalizedActual = normalizeHash(result.hash);
  const valid = normalizedExpected === normalizedActual;

  return {
    valid,
    expected: normalizedExpected,
    actual: normalizedActual,
    algorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    reason: valid
      ? "Text hash verification succeeded."
      : "Text hash verification failed."
  };
}

export function normalizeHash(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  if (/^[a-f0-9]{64}$/.test(trimmed)) {
    return `${EVT_HASH_ALGORITHM}:${trimmed}`;
  }

  if (trimmed.startsWith(`${EVT_HASH_ALGORITHM}:`)) {
    return trimmed;
  }

  return trimmed;
}

export function isSha256Hash(value: string): boolean {
  const normalized = normalizeHash(value);

  return new RegExp(`^${EVT_HASH_ALGORITHM}:[a-f0-9]{64}$`).test(normalized);
}

export function stripHashPrefix(value: string): string {
  const normalized = normalizeHash(value);

  if (normalized.startsWith(`${EVT_HASH_ALGORITHM}:`)) {
    return normalized.slice(`${EVT_HASH_ALGORITHM}:`.length);
  }

  return normalized;
}

export function buildTraceReference(value: unknown): {
  hash_algorithm: HashAlgorithm;
  canonicalization: CanonicalizationMethod;
  hash: string;
} {
  const result = hashCanonical(value);

  return {
    hash_algorithm: result.algorithm,
    canonicalization: result.canonicalization,
    hash: result.hash
  };
}

export function buildTextTraceReference(value: string): {
  hash_algorithm: HashAlgorithm;
  canonicalization: CanonicalizationMethod;
  hash: string;
} {
  const result = hashText(value);

  return {
    hash_algorithm: result.algorithm,
    canonicalization: result.canonicalization,
    hash: result.hash
  };
}

function toCanonicalValue(
  value: unknown,
  seen: WeakSet<object>
): unknown {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "symbol" || typeof value === "function") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCanonicalValue(item, seen));
  }

  if (value instanceof Map) {
    return Array.from(value.entries())
      .map(([key, mapValue]) => [
        String(key),
        toCanonicalValue(mapValue, seen)
      ])
      .sort(([leftKey], [rightKey]) =>
        String(leftKey).localeCompare(String(rightKey))
      );
  }

  if (value instanceof Set) {
    return Array.from(value.values())
      .map((item) => toCanonicalValue(item, seen))
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right))
      );
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    const objectValue = value as Record<string, unknown>;

    const canonicalObject = Object.keys(objectValue)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const item = objectValue[key];

        if (typeof item === "undefined" || typeof item === "function") {
          return accumulator;
        }

        accumulator[key] = toCanonicalValue(item, seen);
        return accumulator;
      }, {});

    seen.delete(value);

    return canonicalObject;
  }

  return null;
}
