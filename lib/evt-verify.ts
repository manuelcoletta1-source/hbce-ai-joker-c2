/**
 * AI JOKER-C2 EVT Verification
 *
 * Deterministic verification utilities for HBCE / MATRIX runtime events.
 *
 * This module verifies:
 * - EVT structure
 * - required fields
 * - deterministic SHA-256 trace hash
 * - public-safe verification results
 *
 * Verification supports auditability.
 * Verification does not create legal authorization, certification or compliance.
 */

import type {
  RuntimeEvent,
  VerificationResult,
  VerificationStatus
} from "./runtime-types";

import {
  getRuntimeEventMissingFields,
  isRuntimeEventStructurallyValid,
  parseEventLine,
  rebuildRuntimeEventHash
} from "./evt";

import {
  EVT_CANONICALIZATION,
  EVT_HASH_ALGORITHM,
  isSha256Hash,
  normalizeHash
} from "./evt-hash";

export type RuntimeEventVerificationInput = {
  event: unknown;
  requireHash?: boolean;
  requirePreviousReference?: boolean;
};

export type RuntimeEventVerificationReport = VerificationResult & {
  expectedHash?: string;
  actualHash?: string;
  hashAlgorithm: "sha256";
  canonicalization: "deterministic-json";
  structurallyValid: boolean;
};

export type RuntimeEventBatchVerificationReport = {
  status: VerificationStatus;
  total: number;
  verifiable: number;
  partial: number;
  invalid: number;
  unverified: number;
  results: RuntimeEventVerificationReport[];
  warnings: string[];
};

export function verifyRuntimeEvent(
  input: RuntimeEventVerificationInput
): RuntimeEventVerificationReport {
  const warnings: string[] = [];

  if (!input.event || typeof input.event !== "object") {
    return {
      status: "INVALID",
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      missingFields: ["event"],
      warnings: ["Input is not an event object."]
    };
  }

  const event = input.event as Partial<RuntimeEvent>;
  const missingFields = getRuntimeEventMissingFields(event);
  const structurallyValid = missingFields.length === 0;

  if (input.requirePreviousReference !== false && !event.prev) {
    warnings.push("Previous event reference is missing.");
  }

  if (!structurallyValid) {
    return {
      status: "PARTIAL",
      evt: event.evt,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      missingFields,
      warnings: uniqueWarnings([
        ...warnings,
        "Event is missing required fields."
      ])
    };
  }

  const runtimeEvent = event as RuntimeEvent;

  if (!isRuntimeEventStructurallyValid(runtimeEvent)) {
    return {
      status: "PARTIAL",
      evt: runtimeEvent.evt,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      missingFields,
      warnings: uniqueWarnings([
        ...warnings,
        "Event structure is incomplete or invalid."
      ])
    };
  }

  const actualHash = rebuildRuntimeEventHash(runtimeEvent);
  const expectedHash = normalizeHash(runtimeEvent.trace.hash);
  const hashMatches = normalizeHash(actualHash) === expectedHash;

  if (input.requireHash !== false && !isSha256Hash(expectedHash)) {
    return {
      status: "INVALID",
      evt: runtimeEvent.evt,
      hashMatches: false,
      expectedHash,
      actualHash,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event trace hash is missing or not a valid SHA-256 hash."
      ])
    };
  }

  if (!hashMatches) {
    return {
      status: "INVALID",
      evt: runtimeEvent.evt,
      hashMatches: false,
      expectedHash,
      actualHash,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event hash verification failed."
      ])
    };
  }

  return {
    status: "VERIFIABLE",
    evt: runtimeEvent.evt,
    hashMatches: true,
    expectedHash,
    actualHash,
    hashAlgorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    structurallyValid: true,
    missingFields: [],
    warnings: uniqueWarnings(warnings)
  };
}

export function verifyRuntimeEventObject(
  event: unknown
): RuntimeEventVerificationReport {
  return verifyRuntimeEvent({ event });
}

export function verifyRuntimeEventLine(
  line: string
): RuntimeEventVerificationReport {
  const event = parseEventLine(line);

  if (!event) {
    return {
      status: "INVALID",
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      missingFields: ["event"],
      warnings: ["Line could not be parsed as a valid RuntimeEvent."]
    };
  }

  return verifyRuntimeEvent({ event });
}

export function verifyRuntimeEventBatch(
  events: unknown[]
): RuntimeEventBatchVerificationReport {
  const results = events.map((event) => verifyRuntimeEvent({ event }));

  const verifiable = results.filter(
    (result) => result.status === "VERIFIABLE"
  ).length;

  const partial = results.filter((result) => result.status === "PARTIAL").length;

  const invalid = results.filter((result) => result.status === "INVALID").length;

  const unverified = results.filter(
    (result) => result.status === "UNVERIFIED"
  ).length;

  const status = inferBatchStatus(results);

  return {
    status,
    total: results.length,
    verifiable,
    partial,
    invalid,
    unverified,
    results,
    warnings: uniqueWarnings(results.flatMap((result) => result.warnings))
  };
}

export function verifyRuntimeEventChain(events: RuntimeEvent[]): RuntimeEventBatchVerificationReport {
  const reports = events.map((event, index) => {
    const report = verifyRuntimeEvent({ event });

    if (index === 0) {
      return report;
    }

    const previous = events[index - 1];

    if (event.prev !== previous.evt) {
      return {
        ...report,
        status: "PARTIAL" as VerificationStatus,
        warnings: uniqueWarnings([
          ...report.warnings,
          `Previous event reference mismatch. Expected ${previous.evt}, received ${event.prev}.`
        ])
      };
    }

    return report;
  });

  const verifiable = reports.filter(
    (result) => result.status === "VERIFIABLE"
  ).length;

  const partial = reports.filter((result) => result.status === "PARTIAL").length;
  const invalid = reports.filter((result) => result.status === "INVALID").length;
  const unverified = reports.filter(
    (result) => result.status === "UNVERIFIED"
  ).length;

  return {
    status: inferBatchStatus(reports),
    total: reports.length,
    verifiable,
    partial,
    invalid,
    unverified,
    results: reports,
    warnings: uniqueWarnings(reports.flatMap((result) => result.warnings))
  };
}

export function isRuntimeEventVerifiable(event: unknown): boolean {
  const result = verifyRuntimeEvent({ event });

  return result.status === "VERIFIABLE" && result.hashMatches === true;
}

export function isRuntimeEventInvalid(event: unknown): boolean {
  return verifyRuntimeEvent({ event }).status === "INVALID";
}

export function getRuntimeEventVerificationStatus(
  event: unknown
): VerificationStatus {
  return verifyRuntimeEvent({ event }).status;
}

export function buildPublicVerificationResult(
  report: RuntimeEventVerificationReport
): VerificationResult {
  return {
    status: report.status,
    evt: report.evt,
    hashMatches: report.hashMatches,
    missingFields: report.missingFields,
    warnings: report.warnings
  };
}

export function buildVerificationSummary(
  report: RuntimeEventVerificationReport
): string {
  return [
    `Verification status: ${report.status}`,
    `EVT: ${report.evt ?? "unknown"}`,
    `Structure valid: ${report.structurallyValid ? "yes" : "no"}`,
    `Hash matches: ${report.hashMatches === true ? "yes" : "no"}`,
    `Missing fields: ${
      report.missingFields.length > 0
        ? report.missingFields.join(", ")
        : "none"
    }`,
    `Warnings: ${
      report.warnings.length > 0 ? report.warnings.join("; ") : "none"
    }`
  ].join("\n");
}

export function buildBatchVerificationSummary(
  report: RuntimeEventBatchVerificationReport
): string {
  return [
    `Batch verification status: ${report.status}`,
    `Total events: ${report.total}`,
    `Verifiable: ${report.verifiable}`,
    `Partial: ${report.partial}`,
    `Invalid: ${report.invalid}`,
    `Unverified: ${report.unverified}`,
    `Warnings: ${
      report.warnings.length > 0 ? report.warnings.join("; ") : "none"
    }`
  ].join("\n");
}

function inferBatchStatus(
  reports: RuntimeEventVerificationReport[]
): VerificationStatus {
  if (reports.length === 0) {
    return "UNVERIFIED";
  }

  if (reports.some((report) => report.status === "INVALID")) {
    return "INVALID";
  }

  if (reports.some((report) => report.status === "PARTIAL")) {
    return "PARTIAL";
  }

  if (reports.every((report) => report.status === "VERIFIABLE")) {
    return "VERIFIABLE";
  }

  return "UNVERIFIED";
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}
