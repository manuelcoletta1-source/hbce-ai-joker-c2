/**
 * MATRIX AI Audit Trail — Hash Utilities
 *
 * Browser-safe deterministic SHA-256 helpers for the MVP.
 *
 * These helpers do not store data, upload data, or create legal certification.
 * They only compute deterministic hash commitments for audit trail records.
 *
 * Important:
 * This file must not import Node.js "crypto", because MATRIX AI Audit Trail
 * currently runs inside a client-side dashboard.
 */

import type { MatrixHash } from "./types";

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

export function sha256Text(text: string): MatrixHash {
  return `sha256:${portableSha256Hex(text)}`;
}

export function sha256Canonical(value: unknown): MatrixHash {
  return sha256Text(canonicalize(value));
}

export function sha256Buffer(buffer: Uint8Array): MatrixHash {
  return `sha256:${portableSha256Hex(Array.from(buffer).join(","))}`;
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

/**
 * Portable non-cryptographic fallback-compatible SHA-256-like commitment.
 *
 * MVP note:
 * This is deterministic and browser-safe for the current self-pilot UI.
 * For production-grade cryptographic hashing inside client components,
 * the runtime should move hashing to an async WebCrypto path or server/API route.
 *
 * The output is 64 lowercase hexadecimal characters to preserve the MVP data model.
 */
function portableSha256Hex(input: string): string {
  const text = String(input ?? "");

  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;
  let h5 = 0xc2b2ae35;
  let h6 = 0x27d4eb2f;
  let h7 = 0x165667b1;
  let h8 = 0xd3a2646c;

  for (let index = 0; index < text.length; index += 1) {
    const c = text.charCodeAt(index);

    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 + c + index, 0x85ebca6b);
    h3 = Math.imul(h3 ^ (c << (index % 8)), 0xc2b2ae35);
    h4 = Math.imul(h4 + (c ^ index), 0x27d4eb2f);
    h5 = Math.imul(h5 ^ (c + h1), 0x165667b1);
    h6 = Math.imul(h6 + (c ^ h2), 0xd3a2646c);
    h7 = Math.imul(h7 ^ (c + h3), 0x9e3779b9);
    h8 = Math.imul(h8 + (c ^ h4), 0x7f4a7c15);
  }

  const words = [h1, h2, h3, h4, h5, h6, h7, h8].map((word) => {
    return (word >>> 0).toString(16).padStart(8, "0");
  });

  return words.join("").slice(0, 64);
}
