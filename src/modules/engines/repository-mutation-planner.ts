/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Mutation Planner
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-MUTATION-PLANNER-v1_0
 *
 * legalCertification=false
 */

import type {
  RepositoryRiskAnalysis,
} from "./repository-risk-analyzer";

export const REPOSITORY_MUTATION_PLANNER_REVISION =
  "AIJC2-MOD001-REPOSITORY-MUTATION-PLANNER-v1_0" as const;

export interface RepositoryMutation {

  id: string;

  targetFile: string;

  reason: string;

  priority: number;

  estimatedRisk:
    "LOW"
    | "MEDIUM"
    | "HIGH";

}

export interface RepositoryMutationPlan {

  revision: string;

  generatedAt: string;

  totalMutations: number;

  mutations: readonly RepositoryMutation[];

  deterministic: true;

  autonomousExecution: false;

  humanAuthorizationRequired: true;

  legalCertification: false;

}

export function buildRepositoryMutationPlan(
  analysis: RepositoryRiskAnalysis,
): RepositoryMutationPlan {

  const mutations: RepositoryMutation[] = [];

  for (const risk of analysis.risks) {

    mutations.push({

      id:
        `MUT-${mutations.length + 1}`,

      targetFile:
        risk.affectedPath,

      reason:
        risk.title,

      priority:
        risk.level === "HIGH"
          ? 1
          : risk.level === "MEDIUM"
            ? 2
            : 3,

      estimatedRisk:
        risk.level,

    });

  }

  mutations.sort(
    (a, b) =>
      a.priority - b.priority,
  );

  return Object.freeze({

    revision:
      REPOSITORY_MUTATION_PLANNER_REVISION,

    generatedAt:
      new Date().toISOString(),

    totalMutations:
      mutations.length,

    mutations:
      Object.freeze(mutations),

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
