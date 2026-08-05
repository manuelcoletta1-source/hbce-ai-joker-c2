/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2 Operational Module Library
 * MOD-002 - Repository Semantic Intelligence
 *
 * Revision:
 * AIJC2-MOD-002-REPOSITORY-SEMANTIC-INTELLIGENCE-v1_0
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

export const MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_REVISION =
  "AIJC2-MOD-002-REPOSITORY-SEMANTIC-INTELLIGENCE-v1_0" as const;

export const MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID =
  "MOD-002" as const;

export const repositorySemanticIntelligenceModule: OperationalModuleDefinition =
  Object.freeze({
    identity: Object.freeze({
      id: MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,

      name:
        "Repository Semantic Intelligence",

      version:
        "1.0.0",

      category:
        "CORE_ENGINEERING",

      status:
        "ACTIVE",

      description:
        "Analizza semanticamente repository software, classificando componenti, relazioni, capacità, finding e raccomandazioni deterministiche governate.",
    }),

    governance: Object.freeze({
      evtId:
        "EVT-AIJC2-MOD-002-REPOSITORY-SEMANTIC-INTELLIGENCE-v1_0",

      unebdoEventId:
        "UNEBDO-AIJC2-UPGRADE-MOD-002-v1_0",

      opcId:
        "OPC-AIJC2-MOD-002-v1_0",

      matrixEnabled:
        true,

      legalCertification:
        false,

      humanAuthorizationRequired:
        true,
    }),

    resources: Object.freeze({
      specificationPath:
        "docs/operational-modules/MOD-002-repository-semantic-intelligence.md",

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
      "semantic-analysis",
      "knowledge-graph",
      "capability-analysis",
      "finding-engine",
      "recommendation-engine",
      "fail-closed",
      "evidence-first",
    ]),
  });

assertOperationalModuleDefinition(
  repositorySemanticIntelligenceModule,
);

export const MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_BOUNDARY =
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
