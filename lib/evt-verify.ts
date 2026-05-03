/**
 * AI JOKER-C2 EVT Verification
 *
 * Deterministic verification utilities for AI JOKER-C2 runtime events.
 *
 * This module verifies:
 * - EVT structure
 * - required fields
 * - project-domain binding
 * - deterministic SHA-256 trace hash
 * - previous-event continuity
 * - public-safe verification results
 *
 * Verification supports auditability.
 * Verification does not create legal authorization, certification or compliance.
 */

import type {
  ProjectDomain,
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
import {
  getDomainTypeForProjectDomain,
  isProjectDomain
} from "./runtime-types";

export type RuntimeEventVerificationInput = {
  event: unknown;
  requireHash?: boolean;
  requirePreviousReference?: boolean;
  requireProjectBinding?: boolean;
};

export type RuntimeEventProjectVerification = {
  valid: boolean;
  domain?: ProjectDomain;
  warnings: string[];
};

export type RuntimeEventVerificationReport = VerificationResult & {
  expectedHash?: string;
  actualHash?: string;
  hashAlgorithm: "sha256";
  canonicalization: "deterministic-json";
  structurallyValid: boolean;
  projectValid: boolean;
  projectDomain?: ProjectDomain;
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
      projectValid: false,
      missingFields: ["event"],
      warnings: ["Input is not an event object."]
    };
  }

  const event = input.event as Partial<RuntimeEvent>;
  const missingFields = getRuntimeEventMissingFields(event);
  const structurallyValid = missingFields.length === 0;
  const projectVerification = verifyRuntimeEventProjectBinding(event);

  if (input.requirePreviousReference !== false && !event.prev) {
    warnings.push("Previous event reference is missing.");
  }

  if (input.requireProjectBinding !== false && !projectVerification.valid) {
    warnings.push(...projectVerification.warnings);
  }

  if (!structurallyValid) {
    return {
      status: "PARTIAL",
      evt: event.evt,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      projectValid: projectVerification.valid,
      projectDomain: projectVerification.domain,
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
      projectValid: projectVerification.valid,
      projectDomain: projectVerification.domain,
      missingFields,
      warnings: uniqueWarnings([
        ...warnings,
        "Event structure is incomplete or invalid."
      ])
    };
  }

  if (input.requireProjectBinding !== false && !projectVerification.valid) {
    return {
      status: "PARTIAL",
      evt: runtimeEvent.evt,
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      projectValid: false,
      projectDomain: projectVerification.domain,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event project-domain binding is incomplete or invalid."
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
      projectValid: projectVerification.valid,
      projectDomain: projectVerification.domain,
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
      projectValid: projectVerification.valid,
      projectDomain: projectVerification.domain,
      missingFields: [],
      warnings: uniqueWarnings([...warnings, "Event hash verification failed."])
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
    projectValid: projectVerification.valid,
    projectDomain: projectVerification.domain,
    missingFields: [],
    warnings: uniqueWarnings([...warnings, ...projectVerification.warnings])
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
      projectValid: false,
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

  return {
    status: inferBatchStatus(results),
    total: results.length,
    verifiable,
    partial,
    invalid,
    unverified,
    results,
    warnings: uniqueWarnings(results.flatMap((result) => result.warnings))
  };
}

export function verifyRuntimeEventChain(
  events: RuntimeEvent[]
): RuntimeEventBatchVerificationReport {
  const reports = events.map((event, index) => {
    const report = verifyRuntimeEvent({ event });

    if (index === 0) {
      return report;
    }

    const previous = events[index - 1];

    if (!previous) {
      return {
        ...report,
        status: "PARTIAL" as VerificationStatus,
        warnings: uniqueWarnings([
          ...report.warnings,
          "Previous event is missing from the provided chain."
        ])
      };
    }

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

export function verifyRuntimeEventProjectBinding(
  event: Partial<RuntimeEvent>
): RuntimeEventProjectVerification {
  const warnings: string[] = [];

  if (!event.project) {
    return {
      valid: false,
      warnings: ["Event project binding is missing."]
    };
  }

  if (event.project.ecosystem !== "HERMETICUM B.C.E.") {
    warnings.push("Event project ecosystem must be HERMETICUM B.C.E.");
  }

  if (!event.project.domain || !isProjectDomain(event.project.domain)) {
    warnings.push("Event project domain is missing or invalid.");
  }

  const domain = event.project.domain;

  if (domain && isProjectDomain(domain)) {
    const expectedDomainType = getDomainTypeForProjectDomain(domain);

    if (event.project.domain_type !== expectedDomainType) {
      warnings.push(
        `Event project domain_type mismatch. Expected ${expectedDomainType}, received ${event.project.domain_type}.`
      );
    }

    if (domain === "MULTI_DOMAIN") {
      const activeDomains = event.project.active_domains ?? [];

      if (activeDomains.length < 2) {
        warnings.push(
          "MULTI_DOMAIN event should include at least two active domains."
        );
      }

      const invalidActiveDomains = activeDomains.filter(
        (item) => !isProjectDomain(item)
      );

      if (invalidActiveDomains.length > 0) {
        warnings.push(
          `MULTI_DOMAIN event includes invalid active domain values: ${invalidActiveDomains.join(
            ", "
          )}.`
        );
      }
    }

    if (domain === "CORPUS_ESOTEROLOGIA_ERMETICA") {
      const formula = event.project.canonical_formula;

      if (formula && formula !== "Decisione · Costo · Traccia · Tempo") {
        warnings.push(
          "CORPUS event canonical_formula is present but does not match the canonical DCTT formula."
        );
      }
    }
  }

  return {
    valid: warnings.length === 0,
    domain,
    warnings
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
    `Project valid: ${report.projectValid ? "yes" : "no"}`,
    `Project domain: ${report.projectDomain ?? "unknown"}`,
    `Hash matches: ${report.hashMatches === true ? "yes" : "no"}`,
    `Missing fields: ${
      report.missingFields.length > 0 ? report.missingFields.join(", ") : "none"
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
