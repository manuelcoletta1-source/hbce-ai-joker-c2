/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Dependency Graph
 *
 * Tests
 *
 * Revision:
 * AIJC2-MOD001-DEPENDENCY-GRAPH-TEST-v1_0
 *
 * legalCertification=false
 */

import { describe, expect, test } from "vitest";

import {
  buildRepositoryDependencyGraph,
  REPOSITORY_DEPENDENCY_GRAPH_REVISION,
} from "../repository-dependency-graph";

import type {
  RepositoryScannerFile,
} from "../repository-scanner.types";

describe(
  "Repository Dependency Graph",
  () => {

    test(
      "builds a deterministic dependency graph",
      () => {

        const files: readonly RepositoryScannerFile[] = [

          {

            path:
              "src/modules/engines/repository-scanner.ts",

            extension:
              "ts",

            directory:
              "src/modules/engines",

            sizeBytes:
              1000,

            inspected:
              true,

          },

          {

            path:
              "src/modules/engines/repository-architecture-mapper.ts",

            extension:
              "ts",

            directory:
              "src/modules/engines",

            sizeBytes:
              2000,

            inspected:
              true,

          },

          {

            path:
              "README.md",

            extension:
              "md",

            directory:
              ".",

            sizeBytes:
              500,

            inspected:
              true,

          },

        ];

        const graph =
          buildRepositoryDependencyGraph(
            files,
          );

        expect(
          graph.revision,
        ).toBe(
          REPOSITORY_DEPENDENCY_GRAPH_REVISION,
        );

        expect(
          graph.totalNodes,
        ).toBe(3);

        expect(
          graph.totalEdges,
        ).toBe(0);

        expect(
          graph.nodes.length,
        ).toBe(3);

        expect(
          graph.edges.length,
        ).toBe(0);

        expect(
          graph.deterministic,
        ).toBe(true);

        expect(
          graph.sourceExecution,
        ).toBe(false);

        expect(
          graph.legalCertification,
        ).toBe(false);

      },
    );

    test(
      "creates one node for every supplied file",
      () => {

        const files: readonly RepositoryScannerFile[] = [

          {

            path:
              "a.ts",

            extension:
              "ts",

            directory:
              ".",

            sizeBytes:
              1,

            inspected:
              true,

          },

          {

            path:
              "b.ts",

            extension:
              "ts",

            directory:
              ".",

            sizeBytes:
              1,

            inspected:
              true,

          },

        ];

        const graph =
          buildRepositoryDependencyGraph(
            files,
          );

        expect(
          graph.nodes.map(
            node => node.path,
          ),
        ).toEqual([
          "a.ts",
          "b.ts",
        ]);

      },
    );

    test(
      "does not invent dependencies",
      () => {

        const files: readonly RepositoryScannerFile[] = [

          {

            path:
              "runtime.ts",

            extension:
              "ts",

            directory:
              ".",

            sizeBytes:
              1,

            inspected:
              false,

          },

        ];

        const graph =
          buildRepositoryDependencyGraph(
            files,
          );

        expect(
          graph.nodes[0].imports,
        ).toEqual([]);

        expect(
          graph.edges,
        ).toEqual([]);

      },
    );

  },
);
