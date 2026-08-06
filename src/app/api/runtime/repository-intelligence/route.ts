/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 *
 * Repository Intelligence Runtime API
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_2
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

type RepositoryIntelligenceServiceRequest =
  Parameters<
    typeof executeRepositoryIntelligenceService
  >[0];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateRequestBody(
  value: unknown,
): asserts value is RepositoryIntelligenceServiceRequest {
  if (!isRecord(value)) {
    throw new Error(
      "REPOSITORY_INTELLIGENCE_REQUEST_OBJECT_REQUIRED",
    );
  }

  if (
    value.humanAuthorization !== true
  ) {
    throw new Error(
      "REPOSITORY_INTELLIGENCE_HUMAN_AUTHORIZATION_REQUIRED",
    );
  }

  if (
    value.legalCertification !== false
  ) {
    throw new Error(
      "REPOSITORY_INTELLIGENCE_LEGAL_BOUNDARY_REQUIRED",
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body: unknown =
      await request.json();

    validateRequestBody(body);

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
          "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_2",

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
    const message =
      error instanceof Error
        ? error.message
        : "Unknown runtime error.";

    const authorizationError =
      message ===
      "REPOSITORY_INTELLIGENCE_HUMAN_AUTHORIZATION_REQUIRED";

    return NextResponse.json(
      {
        ok: false,

        status:
          authorizationError
            ? "HUMAN_AUTHORIZATION_REQUIRED"
            : "REPOSITORY_INTELLIGENCE_RUNTIME_FAIL_CLOSED",

        revision:
          "AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_2",

        error:
          message,

        legalCertification:
          false,
      },
      {
        status:
          authorizationError
            ? 403
            : 400,
      },
    );
  }
}
