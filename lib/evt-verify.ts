/**
 * AI JOKER-C2 EVT Verification
 *
 * Deterministic verification utilities for AI JOKER-C2 runtime events.
 *
 * This module verifies:
 * - EVT structure
 * - required fields
 * - project-domain binding
 * - HBCE module binding
 * - deterministic SHA-256 trace hash
 * - previous-event continuity
 * - public-safe verification results
 *
 * Verification supports auditability.
 * Verification does not create legal authorization, certification or compliance.
 */

import type {
  HbceModule,
  ProjectDomain,
  RuntimeEvent,
  VerificationResult,
  VerificationStatus
} from "./runtime-types";
import {
  buildEventChainReference,
  getRuntimeEventMissingFields,
  isRuntimeEventStructurallyValid,
  parseEventLine,
  rebuildRuntimeEventHash,
  verifyRuntimeEvent as verifyRuntimeEventRecord
} from "./evt";
import {
  EVT_CANONICALIZATION,
  EVT_HASH_ALGORITHM,
  isSha256Hash,
  normalizeHash
} from "./evt-hash";
import {
  getDomainTypeForProjectDomain,
  getHbceModuleType,
  isHbceModule,
  isProjectDomain
} from "./runtime-types";

export type RuntimeEventVerificationInput = {
  event: unknown;
  requireHash?: boolean;
  requirePreviousReference?: boolean;
  requireProjectBinding?: boolean;
  requireHbceModuleBinding?: boolean;
};

export type RuntimeEventProjectVerification = {
  valid: boolean;
  domain?: ProjectDomain;
  warnings: string[];
};

export type RuntimeEventHbceModuleVerification = {
  valid: boolean;
  module?: HbceModule;
  warnings: string[];
};

export type RuntimeEventVerificationReport = VerificationResult & {
  expectedHash?: string;
  actualHash?: string;
  chainReference?: string;
  hashAlgorithm: "sha256";
  canonicalization: "deterministic-json";
  structurallyValid: boolean;
  projectValid: boolean;
  hbceModuleValid: boolean;
  projectDomain?: ProjectDomain;
  hbceModule?: HbceModule;
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

const NON_CERTIFICATION_WARNING =
  "EVT verification is a technical traceability check and does not create legal authorization, certification or compliance by itself.";

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
      hbceModuleValid: false,
      missingFields: ["event"],
      warnings: [
        "Input is not an event object.",
        NON_CERTIFICATION_WARNING
      ]
    };
  }

  const event = input.event as Partial<RuntimeEvent>;
  const missingFields = getRuntimeEventMissingFields(event);
  const structurallyValid = missingFields.length === 0;
  const projectVerification = verifyRuntimeEventProjectBinding(event);
  const hbceModuleVerification = verifyRuntimeEventHbceModuleBinding(event);

  if (input.requirePreviousReference !== false && !event.prev) {
    warnings.push("Previous event reference is missing.");
  }

  if (input.requireProjectBinding !== false && !projectVerification.valid) {
    warnings.push(...projectVerification.warnings);
  }

  if (
    input.requireHbceModuleBinding !== false &&
    !hbceModuleVerification.valid
  ) {
    warnings.push(...hbceModuleVerification.warnings);
  }

  if (!structurallyValid) {
    return {
      status: "PARTIAL",
      evt: event.evt,
      chainReference: safeEventChainReference(event),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      projectValid: projectVerification.valid,
      hbceModuleValid: hbceModuleVerification.valid,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields,
      warnings: uniqueWarnings([
        ...warnings,
        "Event is missing required fields.",
        NON_CERTIFICATION_WARNING
      ])
    };
  }

  const runtimeEvent = event as RuntimeEvent;

  if (!isRuntimeEventStructurallyValid(runtimeEvent)) {
    return {
      status: "PARTIAL",
      evt: runtimeEvent.evt,
      chainReference: safeEventChainReference(runtimeEvent),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: false,
      projectValid: projectVerification.valid,
      hbceModuleValid: hbceModuleVerification.valid,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields,
      warnings: uniqueWarnings([
        ...warnings,
        "Event structure is incomplete or invalid.",
        NON_CERTIFICATION_WARNING
      ])
    };
  }

  if (input.requireProjectBinding !== false && !projectVerification.valid) {
    return {
      status: "PARTIAL",
      evt: runtimeEvent.evt,
      chainReference: buildEventChainReference(runtimeEvent),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      projectValid: false,
      hbceModuleValid: hbceModuleVerification.valid,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event project-domain binding is incomplete or invalid.",
        NON_CERTIFICATION_WARNING
      ])
    };
  }

  if (
    input.requireHbceModuleBinding !== false &&
    !hbceModuleVerification.valid
  ) {
    return {
      status: "PARTIAL",
      evt: runtimeEvent.evt,
      chainReference: buildEventChainReference(runtimeEvent),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      projectValid: projectVerification.valid,
      hbceModuleValid: false,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event HBCE module binding is incomplete or invalid.",
        NON_CERTIFICATION_WARNING
      ])
    };
  }

  const expectedHash = normalizeHash(rebuildRuntimeEventHash(runtimeEvent));
  const actualHash = normalizeHash(runtimeEvent.trace.hash);
  const hashMatches = expectedHash === actualHash;

  if (input.requireHash !== false && !isSha256Hash(actualHash)) {
    return {
      status: "INVALID",
      evt: runtimeEvent.evt,
      hashMatches: false,
      expectedHash,
      actualHash,
      chainReference: buildEventChainReference(runtimeEvent),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      projectValid: projectVerification.valid,
      hbceModuleValid: hbceModuleVerification.valid,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event trace hash is missing or not a valid SHA-256 hash.",
        NON_CERTIFICATION_WARNING
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
      chainReference: buildEventChainReference(runtimeEvent),
      hashAlgorithm: EVT_HASH_ALGORITHM,
      canonicalization: EVT_CANONICALIZATION,
      structurallyValid: true,
      projectValid: projectVerification.valid,
      hbceModuleValid: hbceModuleVerification.valid,
      projectDomain: projectVerification.domain,
      hbceModule: hbceModuleVerification.module,
      missingFields: [],
      warnings: uniqueWarnings([
        ...warnings,
        "Event hash verification failed.",
        "The event may have been modified after creation or rebuilt with different canonical payload fields.",
        NON_CERTIFICATION_WARNING
      ])
    };
  }

  const directVerification = verifyRuntimeEventRecord(runtimeEvent);

  return {
    status:
      directVerification.status === "VERIFIABLE"
        ? "VERIFIABLE"
        : directVerification.status,
    evt: runtimeEvent.evt,
    hashMatches: true,
    expectedHash,
    actualHash,
    chainReference: buildEventChainReference(runtimeEvent),
    hashAlgorithm: EVT_HASH_ALGORITHM,
    canonicalization: EVT_CANONICALIZATION,
    structurallyValid: true,
    projectValid: projectVerification.valid,
    hbceModuleValid: hbceModuleVerification.valid,
    projectDomain: projectVerification.domain,
    hbceModule: hbceModuleVerification.module,
    missingFields: [],
    warnings: uniqueWarnings([
      ...warnings,
      ...projectVerification.warnings,
      ...hbceModuleVerification.warnings,
      NON_CERTIFICATION_WARNING
    ])
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
      hbceModuleValid: false,
      missingFields: ["event"],
      warnings: [
        "Line could not be parsed as a valid RuntimeEvent.",
        NON_CERTIFICATION_WARNING
      ]
    };
  }

  return verifyRuntimeEvent({ event });
}

export function verifyRuntimeEventBatch(
  events: unknown[]
): RuntimeEventBatchVerificationReport {
  const results = events.map((event) => verifyRuntimeEvent({ event }));

  return buildBatchReport(results);
}

export function verifyRuntimeEventChain(
  events: RuntimeEvent[]
): RuntimeEventBatchVerificationReport {
  const reports = events.map((event, index) => {
    const report = verifyRuntimeEvent({ event });

    if (index === 0) {
      if (!event.prev) {
        return {
          ...report,
          status: "PARTIAL" as VerificationStatus,
          warnings: uniqueWarnings([
            ...report.warnings,
            "First event has no previous reference."
          ])
        };
      }

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

  return buildBatchReport(reports);
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

    if (domain === "U.S.E.") {
      const democraticBoundary = event.project.democratic_boundary;

      if (
        democraticBoundary &&
        democraticBoundary !==
          "Identity verified first. Choice separated after. Vote anonymized. Process auditable."
      ) {
        warnings.push(
          "U.S.E. event democratic_boundary is present but does not match the canonical boundary formula."
        );
      }
    }

    if (domain === "HBCE_ECOSISTEMA_AI") {
      const formula = event.project.canonical_formula;

      if (
        formula &&
        formula !==
          "AI generates. HBCE governs. IPR identifies. EVT traces. OPC proves. MATRIX organizes. AI JOKER-C2 executes."
      ) {
        warnings.push(
          "HBCE_ECOSISTEMA_AI event canonical_formula is present but does not match the canonical AI governance formula."
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

export function verifyRuntimeEventHbceModuleBinding(
  event: Partial<RuntimeEvent>
): RuntimeEventHbceModuleVerification {
  const warnings: string[] = [];

  if (!event.hbce_module) {
    return {
      valid: false,
      warnings: ["Event HBCE module binding is missing."]
    };
  }

  if (event.hbce_module.ecosystem !== "HERMETICUM B.C.E.") {
    warnings.push("Event HBCE module ecosystem must be HERMETICUM B.C.E.");
  }

  if (!event.hbce_module.module || !isHbceModule(event.hbce_module.module)) {
    warnings.push("Event HBCE module is missing or invalid.");
  }

  const module = event.hbce_module.module;

  if (module && isHbceModule(module)) {
    const expectedModuleType = getHbceModuleType(module);

    if (event.hbce_module.module_type !== expectedModuleType) {
      warnings.push(
        `Event HBCE module_type mismatch. Expected ${expectedModuleType}, received ${event.hbce_module.module_type}.`
      );
    }

    const activeModules = event.hbce_module.active_modules ?? [];

    const invalidActiveModules = activeModules.filter(
      (item) => !isHbceModule(item)
    );

    if (invalidActiveModules.length > 0) {
      warnings.push(
        `Event HBCE module binding includes invalid active module values: ${invalidActiveModules.join(
          ", "
        )}.`
      );
    }
  }

  return {
    valid: warnings.length === 0,
    module,
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
    `Chain reference: ${report.chainReference ?? "unknown"}`,
    `Structure valid: ${report.structurallyValid ? "yes" : "no"}`,
    `Project valid: ${report.projectValid ? "yes" : "no"}`,
    `Project domain: ${report.projectDomain ?? "unknown"}`,
    `HBCE module valid: ${report.hbceModuleValid ? "yes" : "no"}`,
    `HBCE module: ${report.hbceModule ?? "unknown"}`,
    `Hash matches: ${report.hashMatches === true ? "yes" : "no"}`,
    `Expected hash: ${report.expectedHash ?? "unknown"}`,
    `Actual hash: ${report.actualHash ?? "unknown"}`,
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

function buildBatchReport(
  reports: RuntimeEventVerificationReport[]
): RuntimeEventBatchVerificationReport {
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

function safeEventChainReference(event: Partial<RuntimeEvent>): string {
  if (event.evt && event.trace?.hash) {
    return `${event.evt}:${event.trace.hash}`;
  }

  return event.evt || "UNKNOWN_EVT";
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}
