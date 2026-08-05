/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2 Operational Module Library
 * MOD-001 - Repository Intelligence
 *
 * Revision:
 * AIJC2-MOD-001-REPOSITORY-INTELLIGENCE-v1_0
 *
 * State:
 * ACTIVE - SESSION_CONTEXT
 *
 * Explicit boundaries:
 * - no automatic prompt injection;
 * - no automatic module selection;
 * - no persistent training memory;
 * - no automatic recall;
 * - no autonomous repository modification;
 * - no commit, push, merge or deploy execution;
 * - legalCertification=false.
 */

import {
  OPERATIONAL_MODULE_CONTRACT_VERSION,
  assertOperationalModuleDefinition,
  type OperationalModuleDefinition,
} from "../types";

export const MOD_001_REPOSITORY_INTELLIGENCE_REVISION =
  "AIJC2-MOD-001-REPOSITORY-INTELLIGENCE-v1_0" as const;

export const MOD_001_REPOSITORY_INTELLIGENCE_ID =
  "MOD-001" as const;

export const repositoryIntelligenceModule:
  OperationalModuleDefinition = Object.freeze({
    identity: Object.freeze({
      id: MOD_001_REPOSITORY_INTELLIGENCE_ID,

      name:
        "Repository Intelligence",

      version:
        "1.0.0",

      category:
        "CORE_ENGINEERING",

      status:
        "ACTIVE",

      description:
        "Analizza, comprende ed evolve repository software attraverso evidenza, classificazione epistemica, controllo del rischio e mutazioni atomiche.",
    }),

    governance: Object.freeze({
      evtId:
        "EVT-AIJC2-MOD-001-REPOSITORY-INTELLIGENCE-v1_0",

      unebdoEventId:
        "UNEBDO-AIJC2-UPGRADE-MOD-001-v1_0",

      opcId:
        "OPC-AIJC2-MOD-001-v1_0",

      matrixEnabled:
        true,

      legalCertification:
        false,

      humanAuthorizationRequired:
        true,
    }),

    resources: Object.freeze({
      specificationPath:
        "docs/operational-modules/MOD-001-repository-intelligence.md",

      executionModelPath:
        "docs/operational-modules/MODULE_EXECUTION_MODEL.md",

      contractPath:
        "docs/operational-modules/MODULE_CONTRACT.md",

      lifecyclePath:
        "docs/operational-modules/MODULE_LIFECYCLE.md",

      identityPath:
        "docs/operational-modules/MODULE_IDENTITY_SPECIFICATION.md",
    }),

    capabilities: Object.freeze({
      enabled:
        true,

      sessionContextAvailable:
        true,

      persistentMemoryAvailable:
        false,

      automaticRecallAvailable:
        false,

      productionUiIntegrated:
        false,

      behavioralTestsExecuted:
        false,
    }),

    contractVersion:
      OPERATIONAL_MODULE_CONTRACT_VERSION,

    tags: Object.freeze([
      "repository",
      "software-architecture",
      "technical-audit",
      "code-review",
      "risk-analysis",
      "atomic-mutation",
      "fail-closed",
      "evidence-first",
    ]),
  });

/**
 * Import-time validation.
 *
 * This fails closed during build/runtime initialization if the module
 * no longer conforms to the shared operational module contract.
 */
assertOperationalModuleDefinition(
  repositoryIntelligenceModule,
);

export const MOD_001_REPOSITORY_INTELLIGENCE_BOUNDARY =
  Object.freeze({
    moduleRegisteredByDefinition:
      true,

    explicitSelectionOnly:
      true,

    sessionContextAvailable:
      true,

    automaticSelection:
      false,

    promptInjection:
      false,

    persistentMemory:
      false,

    automaticRecall:
      false,

    autonomousRepositoryModification:
      false,

    commitExecution:
      false,

    pushExecution:
      false,

    mergeExecution:
      false,

    deployExecution:
      false,

    behavioralTestsExecuted:
      false,

    productionUiIntegrated:
      false,

    legalCertification:
      false,

    humanAuthorizationRequired:
      true,
  });
