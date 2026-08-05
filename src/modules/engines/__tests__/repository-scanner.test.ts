/**
 * HERMETICUM B.C.E.
 *
 * MOD-001 Repository Scanner
 *
 * Tests
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-SCANNER-TEST-v1_0
 *
 * legalCertification=false
 */

import { describe, expect, test } from "vitest";

import {
  scanRepository,
} from "../repository-scanner";

describe(
  "Repository Scanner",
  () => {

    test(
      "scans a repository deterministically",
      () => {

        const result =
          scanRepository({

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
                  "src/modules/a.ts",

                extension:
                  "ts",

                directory:
                  "src/modules",

                sizeBytes:
                  100,

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
                  200,

                inspected:
                  true,

              },

              {

                path:
                  "src/runtime/test.test.ts",

                extension:
                  "ts",

                directory:
                  "src/runtime",

                sizeBytes:
                  300,

                inspected:
                  true,

              },

            ],

          });

        expect(
          result.statistics.totalFiles,
        ).toBe(3);

        expect(
          result.statistics.sourceFiles,
        ).toBe(2);

        expect(
          result.statistics.documentationFiles,
        ).toBe(1);

        expect(
          result.statistics.testFiles,
        ).toBe(1);

        expect(
          result.statistics.runtimeFiles,
        ).toBe(1);

        expect(
          result.statistics.moduleFiles,
        ).toBe(1);

        expect(
          result.legalCertification,
        ).toBe(false);

      },
    );

    test(
      "rejects duplicated paths",
      () => {

        expect(() =>
          scanRepository({

            repositoryId:
              "HBCE",

            repositoryName:
              "repo",

            branch:
              "main",

            commitSha:
              "abc",

            files: [

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

            ],

          }),
        ).toThrow();

      },
    );

    test(
      "rejects invalid file size",
      () => {

        expect(() =>
          scanRepository({

            repositoryId:
              "HBCE",

            repositoryName:
              "repo",

            branch:
              "main",

            commitSha:
              "abc",

            files: [

              {

                path:
                  "a.ts",

                extension:
                  "ts",

                directory:
                  ".",

                sizeBytes:
                  -1,

                inspected:
                  true,

              },

            ],

          }),
        ).toThrow();

      },
    );

  },
);
