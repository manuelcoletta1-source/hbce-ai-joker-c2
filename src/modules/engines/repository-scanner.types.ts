/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * MOD-001 Repository Scanner
 *
 * Contract Types
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-SCANNER-TYPES-v1_0
 *
 * legalCertification=false
 */

export const REPOSITORY_SCANNER_REVISION =
  "AIJC2-MOD001-REPOSITORY-SCANNER-TYPES-v1_0" as const;

export interface RepositoryScannerFile {

  path: string;

  extension: string;

  directory: string;

  sizeBytes: number;

  hash?: string;

  inspected: boolean;

}

export interface RepositoryScannerDirectory {

  path: string;

  fileCount: number;

}

export interface RepositoryScannerStatistics {

  totalFiles: number;

  sourceFiles: number;

  testFiles: number;

  documentationFiles: number;

  configurationFiles: number;

  apiFiles: number;

  runtimeFiles: number;

  moduleFiles: number;

  directories: number;

}

export interface RepositoryScannerInput {

  repositoryId: string;

  repositoryName: string;

  branch: string;

  commitSha: string;

  files: readonly RepositoryScannerFile[];

}

export interface RepositoryScannerOutput {

  repositoryId: string;

  repositoryName: string;

  branch: string;

  commitSha: string;

  statistics: RepositoryScannerStatistics;

  directories: readonly RepositoryScannerDirectory[];

  scannedAt: string;

  legalCertification: false;

}

export interface RepositoryScannerBoundary {

  filesystemAccess: false;

  githubAccess: false;

  automaticRepositoryDiscovery: false;

  persistentMemory: false;

  automaticRecall: false;

  legalCertification: false;

}

export const REPOSITORY_SCANNER_BOUNDARY: RepositoryScannerBoundary =
Object.freeze({

  filesystemAccess: false,

  githubAccess: false,

  automaticRepositoryDiscovery: false,

  persistentMemory: false,

  automaticRecall: false,

  legalCertification: false,

});
