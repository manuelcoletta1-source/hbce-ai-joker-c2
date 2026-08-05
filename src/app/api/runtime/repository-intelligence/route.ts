/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 *
 * Repository Intelligence Runtime API
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-INTELLIGENCE-API-v1_0
 *
 * legalCertification=false
 */

import { NextRequest, NextResponse } from "next/server";

import {
  executeRepositoryIntelligenceService,
} from "../../../../runtime/services/repository-intelligence.service";

export async function POST(
  request: NextRequest,
) {

  try {

    const body =
      await request.json();

    const result =
      executeRepositoryIntelligenceService(
        body,
      );

    return NextResponse.json(
      result,
      {
        status: 200,
      },
    );

  }

  catch (error) {

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
