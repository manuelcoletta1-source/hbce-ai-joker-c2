/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 * Repository Risk Analyzer
 *
 * Revision:
 * AIJC2-MOD001-REPOSITORY-RISK-ANALYZER-v1_0
 *
 * legalCertification=false
 */

import type {
  RepositoryIndex,
} from "./repository-index";

export const REPOSITORY_RISK_ANALYZER_REVISION =
  "AIJC2-MOD001-REPOSITORY-RISK-ANALYZER-v1_0" as const;

export type RepositoryRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface RepositoryRisk {

  id: string;

  level: RepositoryRiskLevel;

  title: string;

  description: string;

  affectedPath: string;

}

export interface RepositoryRiskAnalysis {

  revision: string;

  generatedAt: string;

  totalRisks: number;

  risks: readonly RepositoryRisk[];

  deterministic: true;

  legalCertification: false;

}

export function analyzeRepositoryRisk(
  repository: RepositoryIndex,
): RepositoryRiskAnalysis {

  const risks: RepositoryRisk[] = [];

  repository.filesByPath.forEach(
    (file) => {

      if (
        file.sizeBytes > 50_000
      ) {

        risks.push({

          id:
            `RISK-${risks.length + 1}`,

          level:
            "MEDIUM",

          title:
            "Large file",

          description:
            "Large source files may become difficult to maintain.",

          affectedPath:
            file.path,

        });

      }

    },
  );

  return Object.freeze({

    revision:
      REPOSITORY_RISK_ANALYZER_REVISION,

    generatedAt:
      new Date().toISOString(),

    totalRisks:
      risks.length,

    risks:
      Object.freeze(risks),

    deterministic:
      true,

    legalCertification:
      false,

  });

}
