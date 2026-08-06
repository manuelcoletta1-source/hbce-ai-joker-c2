/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 *
 * Repository Intelligence Runtime API
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_1
 *
 * legalCertification=false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  executeRepositoryIntelligenceService,
} from "../../../../runtime/services/repository-intelligence.service";

import {
  mapRuntimeScientificMethodResponse,
} from "../../../../runtime/orchestration/runtime-scientific-method.mapper";

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body: unknown =
      await request.json();

    const result =
      executeRepositoryIntelligenceService(
        body,
      );

    const mapped =
      mapRuntimeScientificMethodResponse(
        result,
      );

    return NextResponse.json(
      {
        ok: true,

        status:
          mapped.mapped
            ? "REPOSITORY_INTELLIGENCE_DASHBOARD_READY"
            : "REPOSITORY_INTELLIGENCE_DIAGNOSTIC_READY",

        revision:
          "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_1",

        repository:
          result,

        viewModel:
          mapped.mapped
            ? mapped.model
            : undefined,

        dashboardReady:
          mapped.mapped,

        mapper: {
          revision:
            mapped.revision,

          reason:
            mapped.reason,
        },

        governance: {
          readOnly:
            true,

          humanAuthorizationRequired:
            true,

          automaticPersistence:
            false,

          automaticRecall:
            false,

          automaticRepositoryMutation:
            false,

          legalCertification:
            false,
        },

        legalCertification:
          false,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,

        status:
          "REPOSITORY_INTELLIGENCE_RUNTIME_FAIL_CLOSED",

        error:
          error instanceof Error
            ? error.message
            : "Unknown runtime error.",

        legalCertification:
          false,
      },
      {
        status: 400,
      },
    );
  }
}
