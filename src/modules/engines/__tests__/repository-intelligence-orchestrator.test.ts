/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Intelligence Orchestrator
 *
 * Tests
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-ORCHESTRATOR-TEST-v1_0
 *
 * legalCertification=false
 */

import { describe, expect, test } from "vitest";

import {
  executeRepositoryIntelligence,
  REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION,
} from "../repository-intelligence-orchestrator";

import type {
  RepositoryScannerInput,
} from "../repository-scanner.types";

describe(
  "Repository Intelligence Orchestrator",
  () => {

    test(
      "executes the complete deterministic pipeline",
      () => {

        const input: RepositoryScannerInput = {

          repositoryId:
            "HBCE",

          repositoryName:
            "hbce-ai-joker-c2",

          branch:
            "main",

          commitSha:
            "abc123",

          files: [

            {

              path:
                "app/api/v1/chat/route.ts",

              extension:
                "ts",

              directory:
                "app/api/v1/chat",

              sizeBytes:
                1000,

              inspected:
                true,

            },

            {

              path:
                "src/runtime/runtime.ts",

              extension:
                "ts",

              directory:
                "src/runtime",

              sizeBytes:
                1200,

              inspected:
                true,

            },

            {

              path:
                "src/modules/mod.ts",

              extension:
                "ts",

              directory:
                "src/modules",

              sizeBytes:
                800,

              inspected:
                true,

            },

          ],

        };

        const result =
          executeRepositoryIntelligence(
            input,
          );

        expect(
          result.revision,
        ).toBe(
          REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION,
        );

        expect(
          result.scan.statistics.totalFiles,
        ).toBe(3);

        expect(
          result.index.totalFiles,
        ).toBe(3);

        expect(
          result.architecture.summary.fileNodes,
        ).toBe(3);

        expect(
          result.dependencyGraph.totalNodes,
        ).toBe(3);

        expect(
          result.risks.totalRisks,
        ).toBeGreaterThanOrEqual(0);

        expect(
          result.mutationPlan.totalMutations,
        ).toBe(
          result.risks.totalRisks,
        );

        expect(
          result.deterministic,
        ).toBe(true);

        expect(
          result.autonomousExecution,
        ).toBe(false);

        expect(
          result.humanAuthorizationRequired,
        ).toBe(true);

        expect(
          result.legalCertification,
        ).toBe(false);

      },

    );

  },

);
