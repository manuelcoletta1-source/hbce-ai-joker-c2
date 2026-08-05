/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Intelligence Orchestrator
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-ORCHESTRATOR-v1_0
 *
 * legalCertification=false
 */

import {
  scanRepository,
} from "./repository-scanner";

import {
  buildRepositoryIndex,
} from "./repository-index";

import {
  mapRepositoryArchitecture,
} from "./repository-architecture-mapper";

import {
  buildRepositoryDependencyGraph,
} from "./repository-dependency-graph";

import {
  analyzeRepositoryRisk,
} from "./repository-risk-analyzer";

import {
  buildRepositoryMutationPlan,
} from "./repository-mutation-planner";

import type {
  RepositoryScannerInput,
} from "./repository-scanner.types";

export const REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION =
  "AIJC2-MOD001-REPOSITORY-ORCHESTRATOR-v1_0" as const;

export interface RepositoryIntelligenceResult {

  revision: string;

  scan:
    ReturnType<typeof scanRepository>;

  index:
    ReturnType<typeof buildRepositoryIndex>;

  architecture:
    ReturnType<typeof mapRepositoryArchitecture>;

  dependencyGraph:
    ReturnType<typeof buildRepositoryDependencyGraph>;

  risks:
    ReturnType<typeof analyzeRepositoryRisk>;

  mutationPlan:
    ReturnType<typeof buildRepositoryMutationPlan>;

  deterministic: true;

  autonomousExecution: false;

  humanAuthorizationRequired: true;

  legalCertification: false;

}

export function executeRepositoryIntelligence(

  input:
    RepositoryScannerInput,

): RepositoryIntelligenceResult {

  const scan =
    scanRepository(
      input,
    );

  const index =
    buildRepositoryIndex(
      input.files,
    );

  const architecture =
    mapRepositoryArchitecture(
      scan,
      input.files,
    );

  const dependencyGraph =
    buildRepositoryDependencyGraph(
      input.files,
    );

  const risks =
    analyzeRepositoryRisk(
      index,
    );

  const mutationPlan =
    buildRepositoryMutationPlan(
      risks,
    );

  return Object.freeze({

    revision:
      REPOSITORY_INTELLIGENCE_ORCHESTRATOR_REVISION,

    scan,

    index,

    architecture,

    dependencyGraph,

    risks,

    mutationPlan,

    deterministic:
      true,

    autonomousExecution:
      false,

    humanAuthorizationRequired:
      true,

    legalCertification:
      false,

  });

}
