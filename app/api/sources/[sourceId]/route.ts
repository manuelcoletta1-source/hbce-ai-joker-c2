import { NextRequest, NextResponse } from "next/server";

import {
  findCatalogEntryById,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ sourceId: string }> | { sourceId: string };
};

export async function GET(_request: NextRequest, context: Params): Promise<NextResponse> {
  const params = await context.params;
  const source = findCatalogEntryById(params.sourceId);

  if (!source) {
    return NextResponse.json(
      {
        status: "SOURCE_NOT_FOUND",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceId: params.sourceId,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "SOURCE_PROFILE_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    source,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}
