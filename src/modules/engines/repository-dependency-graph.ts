/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Dependency Graph
 *
 * Revision:
 * AIJC2-MOD001-DEPENDENCY-GRAPH-v1_0
 *
 * legalCertification=false
 */

import type {
  RepositoryScannerFile,
} from "./repository-scanner.types";

export const REPOSITORY_DEPENDENCY_GRAPH_REVISION =
  "AIJC2-MOD001-DEPENDENCY-GRAPH-v1_0" as const;

export interface DependencyNode {

  path: string;

  imports: readonly string[];

}

export interface DependencyEdge {

  source: string;

  target: string;

}

export interface RepositoryDependencyGraph {

  revision: string;

  nodes: readonly DependencyNode[];

  edges: readonly DependencyEdge[];

  totalNodes: number;

  totalEdges: number;

  deterministic: true;

  sourceExecution: false;

  legalCertification: false;

}

function extractImports(
  file: RepositoryScannerFile,
): readonly string[] {

  /*
   * Placeholder.
   *
   * MOD-001 v1.0 NON legge il contenuto dei file.
   *
   * Verrà implementato in v1.2 mediante parser deterministico.
   */

  return [];

}

export function buildRepositoryDependencyGraph(
  files: readonly RepositoryScannerFile[],
): RepositoryDependencyGraph {

  const nodes =
    files.map(
      (file) => ({

        path:
          file.path,

        imports:
          extractImports(file),

      }),
    );

  const edges: DependencyEdge[] = [];

  return Object.freeze({

    revision:
      REPOSITORY_DEPENDENCY_GRAPH_REVISION,

    nodes:
      Object.freeze(nodes),

    edges:
      Object.freeze(edges),

    totalNodes:
      nodes.length,

    totalEdges:
      edges.length,

    deterministic:
      true,

    sourceExecution:
      false,

    legalCertification:
      false,

  });

}
