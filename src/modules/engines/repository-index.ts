/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Index
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-INDEX-v1_0
 *
 * legalCertification=false
 */

import type {
  RepositoryScannerFile,
} from "./repository-scanner.types";

export const REPOSITORY_INDEX_REVISION =
  "AIJC2-MOD001-REPOSITORY-INDEX-v1_0" as const;

export interface RepositoryIndex {

  revision: string;

  generatedAt: string;

  filesByPath: ReadonlyMap<
    string,
    RepositoryScannerFile
  >;

  filesByDirectory: ReadonlyMap<
    string,
    readonly RepositoryScannerFile[]
  >;

  totalFiles: number;

  totalDirectories: number;

  deterministic: true;

  legalCertification: false;

}

export function buildRepositoryIndex(
  files: readonly RepositoryScannerFile[],
): RepositoryIndex {

  const filesByPath =
    new Map<
      string,
      RepositoryScannerFile
    >();

  const filesByDirectory =
    new Map<
      string,
      RepositoryScannerFile[]
    >();

  for (const file of files) {

    filesByPath.set(
      file.path,
      file,
    );

    const current =
      filesByDirectory.get(
        file.directory,
      ) ?? [];

    current.push(
      file,
    );

    filesByDirectory.set(
      file.directory,
      current,
    );

  }

  return Object.freeze({

    revision:
      REPOSITORY_INDEX_REVISION,

    generatedAt:
      new Date().toISOString(),

    filesByPath,

    filesByDirectory,

    totalFiles:
      files.length,

    totalDirectories:
      filesByDirectory.size,

    deterministic:
      true,

    legalCertification:
      false,

  });

}
