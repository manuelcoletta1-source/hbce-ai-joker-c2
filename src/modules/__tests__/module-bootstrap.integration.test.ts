/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * Operational Module Framework
 *
 * Module Bootstrap Integration Tests
 *
 * Revision:
 * AIJC2-OPERATIONAL-MODULE-BOOTSTRAP-INTEGRATION-TEST-v1_0
 *
 * Purpose:
 * - verify canonical module bootstrap;
 * - verify MOD-001 and MOD-002 registration;
 * - verify deterministic module ordering;
 * - verify duplicate registration handling;
 * - verify fail-closed validation of invalid definitions;
 * - preserve memory, recall and legal boundaries.
 *
 * legalCertification=false
 */

import {
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import {
  bootstrapOperationalModules,
} from "../bootstrap";

import {
  operationalModuleDefinitions,
  MOD_001_REPOSITORY_INTELLIGENCE_ID,
  MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,
} from "../definitions";

import {
  clearRegistry,
  getModule,
  getRegistrySnapshot,
  hasModule,
  listModules,
  registrySize,
} from "../module-registry";

import {
  registerBuiltinOperationalModules,
} from "../register-builtins";

import type {
  OperationalModuleDefinition,
} from "../types";

describe(
  "Operational Module Bootstrap Integration",
  () => {
    beforeEach(
      () => {
        clearRegistry();
      },
    );

    test(
      "bootstraps all canonical operational modules",
      () => {
        const result =
          bootstrapOperationalModules(
            operationalModuleDefinitions,
          );

        expect(
          result.initialized,
        ).toBe(true);

        expect(
          result.loadedModules,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          result.failedModules,
        ).toBe(0);

        expect(
          result.legalCertification,
        ).toBe(false);

        expect(
          registrySize(),
        ).toBe(
          operationalModuleDefinitions.length,
        );
      },
    );

    test(
      "registers MOD-001 and MOD-002",
      () => {
        bootstrapOperationalModules(
          operationalModuleDefinitions,
        );

        expect(
          hasModule(
            MOD_001_REPOSITORY_INTELLIGENCE_ID,
          ),
        ).toBe(true);

        expect(
          hasModule(
            MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,
          ),
        ).toBe(true);

        expect(
          getModule(
            MOD_001_REPOSITORY_INTELLIGENCE_ID,
          )?.identity.name,
        ).toBe(
          "Repository Intelligence",
        );

        expect(
          getModule(
            MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,
          )?.identity.name,
        ).toBe(
          "Repository Semantic Intelligence",
        );
      },
    );

    test(
      "preserves canonical deterministic module ordering",
      () => {
        bootstrapOperationalModules(
          operationalModuleDefinitions,
        );

        const snapshot =
          getRegistrySnapshot();

        expect(
          snapshot.map(
            (moduleDefinition) =>
              moduleDefinition.identity.id,
          ),
        ).toEqual(
          operationalModuleDefinitions.map(
            (moduleDefinition) =>
              moduleDefinition.identity.id,
          ),
        );

        expect(
          snapshot.map(
            (moduleDefinition) =>
              moduleDefinition.identity.id,
          ),
        ).toEqual([
          MOD_001_REPOSITORY_INTELLIGENCE_ID,
          MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,
        ]);
      },
    );

    test(
      "registers built-in modules idempotently",
      () => {
        const first =
          registerBuiltinOperationalModules();

        const second =
          registerBuiltinOperationalModules();

        expect(
          first.registered,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          first.skipped,
        ).toBe(0);

        expect(
          first.total,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          second.registered,
        ).toBe(0);

        expect(
          second.skipped,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          second.total,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          registrySize(),
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          first.legalCertification,
        ).toBe(false);

        expect(
          second.legalCertification,
        ).toBe(false);
      },
    );

    test(
      "reports duplicate module loading as failed without duplicating registry state",
      () => {
        const first =
          bootstrapOperationalModules(
            operationalModuleDefinitions,
          );

        const second =
          bootstrapOperationalModules(
            operationalModuleDefinitions,
          );

        expect(
          first.initialized,
        ).toBe(true);

        expect(
          first.failedModules,
        ).toBe(0);

        expect(
          second.initialized,
        ).toBe(false);

        expect(
          second.loadedModules,
        ).toBe(0);

        expect(
          second.failedModules,
        ).toBe(
          operationalModuleDefinitions.length,
        );

        expect(
          registrySize(),
        ).toBe(
          operationalModuleDefinitions.length,
        );
      },
    );

    test(
      "fails closed when an invalid module definition is supplied",
      () => {
        const invalidModule = {
          identity: {
            id:
              "",

            name:
              "Invalid Module",

            version:
              "1.0.0",

            category:
              "CORE_ENGINEERING",

            status:
              "ACTIVE",

            description:
              "Invalid module used to verify fail-closed validation.",
          },

          governance: {
            evtId:
              "EVT-INVALID",

            unebdoEventId:
              "UNEBDO-INVALID",

            opcId:
              "OPC-INVALID",

            matrixEnabled:
              true,

            legalCertification:
              false,

            humanAuthorizationRequired:
              true,
          },

          resources: {
            specificationPath:
              "docs/invalid.md",

            executionModelPath:
              "docs/operational-modules/MODULE_EXECUTION_MODEL.md",

            contractPath:
              "docs/operational-modules/MODULE_CONTRACT.md",

            lifecyclePath:
              "docs/operational-modules/MODULE_LIFECYCLE.md",

            identityPath:
              "docs/operational-modules/MODULE_IDENTITY_SPECIFICATION.md",
          },

          capabilities: {
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
          },

          contractVersion:
            "INVALID-CONTRACT",

          tags:
            [],
        } as unknown as OperationalModuleDefinition;

        expect(
          () =>
            bootstrapOperationalModules([
              invalidModule,
            ]),
        ).toThrow();

        expect(
          registrySize(),
        ).toBe(0);
      },
    );

    test(
      "returns public projections with legalCertification false",
      () => {
        bootstrapOperationalModules(
          operationalModuleDefinitions,
        );

        const modules =
          listModules({
            enabledOnly:
              true,
          });

        expect(
          modules,
        ).toHaveLength(
          operationalModuleDefinitions.length,
        );

        expect(
          modules.every(
            (moduleDefinition) =>
              moduleDefinition
                .legalCertification ===
              false,
          ),
        ).toBe(true);
      },
    );

    test(
      "preserves operational module governance boundaries",
      () => {
        bootstrapOperationalModules(
          operationalModuleDefinitions,
        );

        const snapshot =
          getRegistrySnapshot();

        expect(
          snapshot.every(
            (moduleDefinition) =>
              moduleDefinition
                .governance
                .humanAuthorizationRequired ===
              true,
          ),
        ).toBe(true);

        expect(
          snapshot.every(
            (moduleDefinition) =>
              moduleDefinition
                .governance
                .legalCertification ===
              false,
          ),
        ).toBe(true);

        expect(
          snapshot.every(
            (moduleDefinition) =>
              moduleDefinition
                .capabilities
                .persistentMemoryAvailable ===
              false,
          ),
        ).toBe(true);

        expect(
          snapshot.every(
            (moduleDefinition) =>
              moduleDefinition
                .capabilities
                .automaticRecallAvailable ===
              false,
          ),
        ).toBe(true);
      },
    );

    test(
      "clears registry state between controlled bootstrap executions",
      () => {
        bootstrapOperationalModules(
          operationalModuleDefinitions,
        );

        expect(
          registrySize(),
        ).toBe(
          operationalModuleDefinitions.length,
        );

        clearRegistry();

        expect(
          registrySize(),
        ).toBe(0);

        expect(
          hasModule(
            MOD_001_REPOSITORY_INTELLIGENCE_ID,
          ),
        ).toBe(false);

        expect(
          hasModule(
            MOD_002_REPOSITORY_SEMANTIC_INTELLIGENCE_ID,
          ),
        ).toBe(false);

        expect(
          getRegistrySnapshot(),
        ).toEqual([]);
      },
    );
  },
);
