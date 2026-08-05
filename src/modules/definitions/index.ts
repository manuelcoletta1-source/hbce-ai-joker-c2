/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2 Operational Module Library
 * Canonical Module Definitions
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-DEFINITIONS-v1_0
 *
 * Purpose:
 * - expose the canonical set of operational module definitions;
 * - validate every definition before runtime registration;
 * - provide one deterministic source for module bootstrap;
 * - prevent hidden or automatic module discovery.
 *
 * Explicit boundaries:
 * - no filesystem scanning;
 * - no dynamic imports;
 * - no database loading;
 * - no automatic prompt injection;
 * - no persistent memory;
 * - no automatic recall;
 * - legalCertification=false.
 */

import {
  assertOperationalModuleDefinition,
  type OperationalModuleDefinition,
} from "../types";

import {
  MOD_001_REPOSITORY_INTELLIGENCE_ID,
  repositoryIntelligenceModule,
} from "./mod-001-repository-intelligence";

export const OPERATIONAL_MODULE_DEFINITIONS_REVISION =
  "AIJC2-OPERATIONAL-MODULE-DEFINITIONS-v1_0" as const;

/**
 * Canonical deterministic module list.
 *
 * New modules must be added explicitly.
 * This avoids accidental registration through filesystem discovery,
 * build artefacts or uncontrolled dynamic imports.
 */
export const operationalModuleDefinitions:
  readonly OperationalModuleDefinition[] =
  Object.freeze([
    repositoryIntelligenceModule,
  ]);

/**
 * Validate all definitions at module initialization.
 *
 * Any invalid module fails closed during build or runtime import.
 */
for (
  const moduleDefinition
  of operationalModuleDefinitions
) {
  assertOperationalModuleDefinition(
    moduleDefinition,
  );
}

/**
 * Deterministic uniqueness validation.
 *
 * A repeated module ID would make module selection ambiguous and must
 * therefore fail closed before Registry initialization.
 */
const moduleIds =
  operationalModuleDefinitions.map(
    (moduleDefinition) =>
      moduleDefinition.identity.id,
  );

const uniqueModuleIds =
  new Set(moduleIds);

if (
  uniqueModuleIds.size !==
  moduleIds.length
) {
  throw new Error(
    "AIJC2_OPERATIONAL_MODULE_DUPLICATE_DEFINITION_ID",
  );
}

/**
 * Returns one canonical definition without touching the runtime Registry.
 */
export function getOperationalModuleDefinition(
  moduleId: string,
): OperationalModuleDefinition | null {
  const normalizedModuleId =
    moduleId.trim();

  if (
    normalizedModuleId.length === 0
  ) {
    return null;
  }

  return (
    operationalModuleDefinitions.find(
      (moduleDefinition) =>
        moduleDefinition.identity.id ===
        normalizedModuleId,
    ) ??
    null
  );
}

/**
 * Returns true when a module exists in the canonical definition set.
 *
 * This does not mean that the module has already been loaded into the
 * runtime Registry.
 */
export function hasOperationalModuleDefinition(
  moduleId: string,
): boolean {
  return (
    getOperationalModuleDefinition(
      moduleId,
    ) !== null
  );
}

/**
 * Safe summary for diagnostics and future dashboard integration.
 *
 * Full governed definitions remain available internally, while this
 * projection excludes document contents and private prompt material.
 */
export function getOperationalModuleDefinitionSummary():
  readonly {
    id: string;
    name: string;
    version: string;
    category: string;
    status: string;
    enabled: boolean;
    legalCertification: false;
  }[] {
  return Object.freeze(
    operationalModuleDefinitions.map(
      (moduleDefinition) =>
        Object.freeze({
          id:
            moduleDefinition
              .identity
              .id,

          name:
            moduleDefinition
              .identity
              .name,

          version:
            moduleDefinition
              .identity
              .version,

          category:
            moduleDefinition
              .identity
              .category,

          status:
            moduleDefinition
              .identity
              .status,

          enabled:
            moduleDefinition
              .capabilities
              .enabled,

          legalCertification:
            false,
        }),
    ),
  );
}

export {
  MOD_001_REPOSITORY_INTELLIGENCE_ID,
  repositoryIntelligenceModule,
};

export const OPERATIONAL_MODULE_DEFINITIONS_BOUNDARY =
  Object.freeze({
    canonicalDefinitions:
      true,

    explicitRegistrationOnly:
      true,

    deterministicOrdering:
      true,

    duplicateIdRejected:
      true,

    filesystemScanning:
      false,

    dynamicImports:
      false,

    databaseLoading:
      false,

    automaticModuleSelection:
      false,

    promptInjection:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    legalCertification:
      false,

    humanAuthorizationRequired:
      true,
  });
