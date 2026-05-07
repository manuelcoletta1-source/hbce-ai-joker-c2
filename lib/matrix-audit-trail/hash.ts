/**
 * MATRIX AI Audit Trail — Hash Utilities
 *
 * Client/server-safe deterministic SHA-256 helpers for the MVP.
 *
 * These helpers do not store data, upload data, or create legal certification.
 * They only compute deterministic hash commitments for audit trail records.
 */

import { createHash } from "crypto";

import type { MatrixHash } from "./types";

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

export function sha256Text(text: string): MatrixHash {
  const hash = createHash("sha256").update(text, "utf8").digest("hex");

  return `sha256:${hash}`;
}

export function sha256Canonical(value: unknown): MatrixHash {
  return sha256Text(canonicalize(value));
}

export function sha256Buffer(buffer: Buffer | Uint8Array): MatrixHash {
  const hash = createHash("sha256").update(buffer).digest("hex");

  return `sha256:${hash}`;
}

export function normalizeMatrixHash(value: string): MatrixHash {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.startsWith("sha256:")) {
    return trimmed as MatrixHash;
  }

  return `sha256:${trimmed}` as MatrixHash;
}

export function isMatrixHash(value: string | null | undefined): value is MatrixHash {
  if (!value) return false;

  return /^sha256:[a-f0-9]{64}$/.test(value.trim().toLowerCase());
}

export function shortHash(value: string | null | undefined): string {
  if (!value) return "-";

  const safe = value.trim();

  if (safe.length <= 24) return safe;

  return `${safe.slice(0, 16)}…${safe.slice(-8)}`;
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortCanonical(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const item = record[key];

        if (typeof item !== "undefined") {
          accumulator[key] = sortCanonical(item);
        }

        return accumulator;
      }, {});
  }

  return value;
}
